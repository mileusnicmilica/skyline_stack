import type { DropRecord, DropTiming } from "../../src/game/model";
import type {
  CoachExecutionOptions,
  CoachProvider,
  CoachRequest,
  CoachRunResult,
  ProviderGeneration,
  ProviderUsageRecord,
  RunStatistics,
  TimingBias,
} from "./types";
import { ProviderError } from "../providers/provider-error";
import { validateAdvice } from "./validate-advice";

const MAX_DROPS = 501;
const MAX_SCORE = 500;
const CENTERED_TOLERANCE_PX = 1;
const WIDTH_EPSILON = 1e-6;
const REQUEST_KEYS = new Set(["finalScore", "startingWidth", "drops"]);
const DROP_KEYS = new Set(["floor", "offsetPx", "direction", "timing", "widthBefore", "widthAfter"]);
const DEFAULT_TOTAL_TIMEOUT_MS = 10_000;
const DEFAULT_ATTEMPT_TIMEOUT_MS = 4_500;
const DEFAULT_RETRY_DELAY_MS = 250;
const MAX_ATTEMPTS = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key));
}

function expectedTiming(offsetPx: number, direction: -1 | 1): DropTiming {
  if (Math.abs(offsetPx) <= CENTERED_TOLERANCE_PX) return "centered";
  return offsetPx * direction > 0 ? "late" : "early";
}

function parseRequest(value: unknown): CoachRequest | null {
  if (!isRecord(value) || !hasExactKeys(value, REQUEST_KEYS) ||
      !Number.isInteger(value.finalScore) ||
      (value.finalScore as number) < 0 || (value.finalScore as number) > MAX_SCORE ||
      typeof value.startingWidth !== "number" || !Number.isFinite(value.startingWidth) ||
      value.startingWidth <= 0 || !Array.isArray(value.drops) ||
      value.drops.length < 1 || value.drops.length > MAX_DROPS) {
    return null;
  }

  const drops: DropRecord[] = [];
  let expectedWidth = value.startingWidth;
  let successfulDrops = 0;
  let missSeen = false;

  for (let index = 0; index < value.drops.length; index += 1) {
    const candidate = value.drops[index];
    if (!isRecord(candidate) || !hasExactKeys(candidate, DROP_KEYS)) return null;
    const { floor, offsetPx, direction, timing, widthBefore, widthAfter } = candidate;
    if (!Number.isInteger(floor) || floor !== index + 1 ||
        typeof offsetPx !== "number" || !Number.isFinite(offsetPx) ||
        (direction !== -1 && direction !== 1) ||
        (timing !== "early" && timing !== "late" && timing !== "centered") ||
        typeof widthBefore !== "number" || !Number.isFinite(widthBefore) || widthBefore <= 0 ||
        typeof widthAfter !== "number" || !Number.isFinite(widthAfter) ||
        widthAfter < 0 || widthAfter > widthBefore ||
        Math.abs(widthBefore - expectedWidth) > WIDTH_EPSILON ||
        timing !== expectedTiming(offsetPx, direction)) {
      return null;
    }

    const isMiss = widthAfter === 0;
    if (missSeen || (isMiss && index !== value.drops.length - 1)) return null;
    if (isMiss) {
      if (Math.abs(offsetPx) <= WIDTH_EPSILON) return null;
      missSeen = true;
    } else {
      const geometricWidth = widthBefore - Math.abs(offsetPx);
      if (geometricWidth <= 0 || Math.abs(widthAfter - geometricWidth) > WIDTH_EPSILON) return null;
      successfulDrops += 1;
      expectedWidth = widthAfter;
    }

    drops.push({
      floor: floor as number,
      offsetPx,
      direction,
      timing,
      widthBefore,
      widthAfter,
    });
  }

  if (!missSeen || successfulDrops !== value.finalScore) return null;
  return { finalScore: value.finalScore as number, startingWidth: value.startingWidth, drops };
}

function getTimingBias(earlyCount: number, lateCount: number, centeredCount: number, total: number): TimingBias {
  if (centeredCount / total >= 0.7) return "consistent";
  const nonCentered = earlyCount + lateCount;
  if (nonCentered === 0) return "consistent";
  if (earlyCount / nonCentered >= 0.6) return "early";
  if (lateCount / nonCentered >= 0.6) return "late";
  return "mixed";
}

function deriveStatistics(request: CoachRequest): RunStatistics {
  let earlyCount = 0;
  let lateCount = 0;
  let centeredCount = 0;
  let absoluteOffsetTotal = 0;
  // A validated completed run always has at least one drop and a terminal miss.
  let biggestMistakeFloor = 1;
  let maxWidthLossPx = 0;

  for (const drop of request.drops) {
    if (drop.timing === "early") earlyCount += 1;
    if (drop.timing === "late") lateCount += 1;
    if (drop.timing === "centered") centeredCount += 1;
    absoluteOffsetTotal += Math.abs(drop.offsetPx);
    const loss = drop.widthBefore - drop.widthAfter;
    if (loss > maxWidthLossPx) {
      maxWidthLossPx = loss;
      biggestMistakeFloor = drop.floor;
    }
  }

  return {
    finalScore: request.finalScore,
    startingWidth: request.startingWidth,
    earlyCount,
    lateCount,
    centeredCount,
    earlyPercent: (earlyCount / request.drops.length) * 100,
    latePercent: (lateCount / request.drops.length) * 100,
    centeredPercent: (centeredCount / request.drops.length) * 100,
    averageAbsoluteOffsetPx: absoluteOffsetTotal / request.drops.length,
    timingBias: getTimingBias(earlyCount, lateCount, centeredCount, request.drops.length),
    biggestMistakeFloor,
    maxWidthLossPx,
  };
}

function positiveDuration(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateWithTimeout(
  provider: CoachProvider,
  statistics: RunStatistics,
  attempt: number,
  timeoutMs: number,
): Promise<ProviderGeneration> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ProviderError("Provider attempt timed out.", true, "timeout");
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      provider.generate(statistics, { signal: controller.signal, attempt }),
      timeout,
    ]);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ProviderError("Provider attempt timed out.", true, "timeout");
    }
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function emitUsage(
  provider: CoachProvider,
  startedAt: number,
  startedTimestamp: string,
  attempts: number,
  outcome: ProviderUsageRecord["outcome"],
  options: CoachExecutionOptions,
  tokenUsage?: ProviderGeneration["tokenUsage"],
): void {
  if (!options.onUsage) return;
  try {
    options.onUsage({
      provider: provider.name,
      model: provider.model,
      timestamp: startedTimestamp,
      latencyMs: Math.max(0, Date.now() - startedAt),
      outcome,
      attempts,
      ...(tokenUsage === undefined ? {} : { tokenUsage }),
    });
  } catch {
    // Observability must never change the public result.
  }
}

export async function coachRun(
  value: unknown,
  provider: CoachProvider,
  options: CoachExecutionOptions = {},
): Promise<CoachRunResult> {
  const request = parseRequest(value);
  if (!request) return { ok: false, kind: "invalid-request" };

  const statistics = deriveStatistics(request);
  const totalTimeoutMs = positiveDuration(options.totalTimeoutMs, DEFAULT_TOTAL_TIMEOUT_MS);
  const attemptTimeoutMs = positiveDuration(options.attemptTimeoutMs, DEFAULT_ATTEMPT_TIMEOUT_MS);
  const retryDelayMs = positiveDuration(options.retryDelayMs, DEFAULT_RETRY_DELAY_MS);
  const startedAt = Date.now();
  const startedTimestamp = new Date(startedAt).toISOString();
  let attempts = 0;
  let lastWasTimeout = false;

  while (attempts < MAX_ATTEMPTS) {
    const elapsed = Date.now() - startedAt;
    const remaining = totalTimeoutMs - elapsed;
    if (remaining <= 0) break;
    attempts += 1;

    try {
      const generation = await generateWithTimeout(
        provider,
        statistics,
        attempts,
        Math.min(attemptTimeoutMs, remaining),
      );
      const validated = validateAdvice(generation.output, statistics);
      if (!validated.ok) {
        emitUsage(provider, startedAt, startedTimestamp, attempts, "invalid-output", options, generation.tokenUsage);
        return { ok: false, kind: "invalid-advice" };
      }
      emitUsage(provider, startedAt, startedTimestamp, attempts, "success", options, generation.tokenUsage);
      return { ok: true, advice: validated.advice, statistics };
    } catch (error) {
      const providerError = error instanceof ProviderError ? error : null;
      lastWasTimeout = providerError?.kind === "timeout";
      if (!providerError?.retryable || attempts >= MAX_ATTEMPTS) break;
      const afterAttemptRemaining = totalTimeoutMs - (Date.now() - startedAt);
      if (afterAttemptRemaining <= retryDelayMs) break;
      await wait(retryDelayMs);
    }
  }

  emitUsage(
    provider,
    startedAt,
    startedTimestamp,
    attempts,
    lastWasTimeout ? "timeout" : "provider-failure",
    options,
  );
  return { ok: false, kind: "provider-failure" };
}
