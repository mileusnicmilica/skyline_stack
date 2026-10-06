import { randomUUID } from "node:crypto";
import type { ProviderTokenUsage } from "../coach/types.js";
import { ProviderError } from "../providers/provider-error.js";
import { composeRecommendation } from "./drills.js";
import { evaluateDrill, parseDrillArgs, validateToolEvidence } from "./evaluate-drill.js";
import { parseNextDrillRequest } from "./validate-request.js";
import type {
  AgentExecutionOptions, AgentProvider, AgentRunResult, AgentStepUsage,
  AgentStopReason, AgentUsage, DrillRecommendation, TimingCounts, ToolEvidence,
} from "./types.js";

const MAX_STEPS = 3;
const MAX_TOOLS = 2;
const MAX_PROVIDER_ATTEMPTS = 4;
const MAX_ATTEMPTS_PER_STEP = 2;
const DEFAULT_DEADLINE_MS = 25_000;
const DEFAULT_ATTEMPT_MS = 8_000;
const DEFAULT_RETRY_DELAY_MS = 250;
const TOOL_TIMEOUT_MS = 50;

class ToolTimeoutError extends Error {}

function duration(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function safeTokenUsage(value: unknown): ProviderTokenUsage | undefined {
  if (!isRecord(value)) return undefined;
  const count = (field: string) => {
    const item = value[field];
    return typeof item === "number" && Number.isSafeInteger(item) && item >= 0 ? item : undefined;
  };
  const inputTokens = count("inputTokens");
  const outputTokens = count("outputTokens");
  const totalTokens = count("totalTokens");
  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined) return undefined;
  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}

function providerStopReason(error: unknown): AgentStopReason {
  if (!(error instanceof ProviderError)) return "provider_failure";
  if (error.kind === "timeout") return "provider_timeout";
  if (error.kind === "rate_limit") return "provider_rate_limit";
  if (error.kind === "unavailable") return "provider_unavailable";
  if (error.kind === "unauthorized") return "provider_unauthorized";
  return "provider_failure";
}

async function waitForRetry(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (milliseconds <= 0 || signal?.aborted) return;
  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, milliseconds);
    signal?.addEventListener("abort", done, { once: true });
  });
}

type ParsedDecision =
  | { kind: "tool"; args: { drillId: ToolEvidence["drillId"] } }
  | { kind: "final"; drillId: ToolEvidence["drillId"]; evidenceId: string }
  | { kind: "unknown_tool" }
  | { kind: "invalid_tool_args" }
  | { kind: "invalid_model_output" };

function parseDecision(value: unknown): ParsedDecision {
  if (!isRecord(value) || typeof value.action !== "string") return { kind: "invalid_model_output" };
  if (value.action === "call_tool") {
    if (!exactKeys(value, ["action", "tool", "args"])) return { kind: "invalid_model_output" };
    if (value.tool !== "evaluate_drill") return { kind: "unknown_tool" };
    const args = parseDrillArgs(value.args);
    return args ? { kind: "tool", args } : { kind: "invalid_tool_args" };
  }
  if (value.action === "final") {
    if (!exactKeys(value, ["action", "drillId", "evidenceId"])) return { kind: "invalid_model_output" };
    const args = parseDrillArgs({ drillId: value.drillId });
    return args && typeof value.evidenceId === "string" && /^ev-[12]$/.test(value.evidenceId)
      ? { kind: "final", drillId: args.drillId, evidenceId: value.evidenceId }
      : { kind: "invalid_model_output" };
  }
  return { kind: "invalid_model_output" };
}

async function generateAttempt(
  provider: AgentProvider,
  context: Parameters<AgentProvider["generate"]>[0],
  attempt: number,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Awaited<ReturnType<AgentProvider["generate"]>>> {
  const started = Date.now();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const timed = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ProviderError("Agent provider attempt timed out.", true, "timeout");
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  const cancelled = new Promise<never>((_resolve, reject) => {
    onAbort = () => {
      controller.abort(signal?.reason);
      reject(new Error("agent-cancelled"));
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
  try {
    const result = await Promise.race([provider.generate(context, { signal: controller.signal, attempt }), timed, cancelled]);
    if (Date.now() - started >= timeoutMs) {
      const error = new ProviderError("Agent provider attempt timed out.", true, "timeout");
      controller.abort(error);
      throw error;
    }
    return result;
  } finally {
    if (timer) clearTimeout(timer);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
  }
}

async function runTool(
  implementation: NonNullable<AgentExecutionOptions["tool"]>,
  args: { drillId: ToolEvidence["drillId"] },
  counts: TimingCounts,
  evidenceId: string,
  timeoutMs: number,
  onStart: () => void,
  signal?: AbortSignal,
): Promise<unknown> {
  const started = Date.now();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new Error("agent-cancelled");
        onStart();
        return implementation(args, counts, evidenceId, controller.signal);
      }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          const error = new ToolTimeoutError("tool-timeout");
          controller.abort(error);
          reject(error);
        }, timeoutMs);
      }),
      new Promise<never>((_resolve, reject) => {
        onAbort = () => {
          controller.abort(signal?.reason);
          reject(new Error("agent-cancelled"));
        };
        if (signal?.aborted) onAbort();
        else signal?.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
    if (Date.now() - started >= timeoutMs) {
      const error = new ToolTimeoutError("tool-timeout");
      controller.abort(error);
      throw error;
    }
    return result;
  } finally {
    if (timer) clearTimeout(timer);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
  }
}

export async function runNextDrill(
  input: unknown,
  provider: AgentProvider,
  options: AgentExecutionOptions = {},
): Promise<AgentRunResult> {
  const started = Date.now();
  const deadline = started + Math.min(duration(options.totalDeadlineMs, DEFAULT_DEADLINE_MS), DEFAULT_DEADLINE_MS);
  const usage: AgentUsage = {
    runId: randomUUID(), provider: provider.name, model: provider.model,
    startedAt: new Date(started).toISOString(), latencyMs: 0,
    stepCount: 0, providerAttempts: 0, toolCallCount: 0,
    stopReason: "incomplete", steps: [],
  };
  let activeStepStartedAt: number | null = null;
  let activeStepUsage: AgentStepUsage | null = null;
  const finish = (reason: AgentStopReason, recommendation?: DrillRecommendation): AgentRunResult => {
    if (activeStepUsage && activeStepStartedAt !== null) {
      if (activeStepUsage.status === "pending") activeStepUsage.status = reason;
      activeStepUsage.latencyMs = Math.max(0, Date.now() - activeStepStartedAt);
    }
    usage.stopReason = reason;
    usage.latencyMs = Math.max(0, Date.now() - started);
    try { options.onUsage?.(structuredClone(usage)); } catch { /* Log failure cannot alter result. */ }
    return recommendation
      ? { ok: true, recommendation, usage }
      : { ok: false, reason, usage };
  };

  const statistics = parseNextDrillRequest(input);
  if (!statistics) return finish("invalid_input");
  const counts: TimingCounts = {
    earlyCount: statistics.earlyCount,
    lateCount: statistics.lateCount,
    centeredCount: statistics.centeredCount,
  };
  const evidence: ToolEvidence[] = [];
  const seen = new Set<string>();
  const tool = options.tool ?? evaluateDrill;

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    if (options.signal?.aborted) return finish("cancelled");
    if (Date.now() >= deadline) return finish("deadline");
    if (usage.providerAttempts >= MAX_PROVIDER_ATTEMPTS) return finish("provider_failure");
    usage.stepCount = step;
    const stepStarted = Date.now();
    const stepUsage: AgentStepUsage = { step, attempts: 0, latencyMs: 0, tool: null, status: "pending" };
    usage.steps.push(stepUsage);
    activeStepStartedAt = stepStarted;
    activeStepUsage = stepUsage;
    let output: unknown;
    let generated = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_STEP && usage.providerAttempts < MAX_PROVIDER_ATTEMPTS; attempt += 1) {
      if (options.signal?.aborted) return finish("cancelled");
      const remaining = deadline - Date.now();
      if (remaining <= 0) return finish("deadline");
      usage.providerAttempts += 1;
      stepUsage.attempts += 1;
      try {
        const response = await generateAttempt(provider, {
          goal: "choose_next_drill", finalScore: statistics.finalScore, ...counts,
          step, evidence: evidence.map((item) => ({ ...item })),
        }, attempt, Math.min(duration(options.attemptTimeoutMs, DEFAULT_ATTEMPT_MS), DEFAULT_ATTEMPT_MS, remaining), options.signal);
        if (options.signal?.aborted) return finish("cancelled");
        if (Date.now() >= deadline) return finish("deadline");
        output = response.output;
        const tokens = safeTokenUsage(response.tokenUsage);
        if (tokens) stepUsage.tokenUsage = tokens;
        generated = true;
        break;
      } catch (error) {
        if (options.signal?.aborted) return finish("cancelled");
        if (Date.now() >= deadline) return finish("deadline");
        const providerError = error instanceof ProviderError ? error : null;
        const reason = providerStopReason(error);
        const canRetry = providerError?.retryable === true && attempt < MAX_ATTEMPTS_PER_STEP &&
          usage.providerAttempts < MAX_PROVIDER_ATTEMPTS;
        if (!canRetry) { stepUsage.status = reason; return finish(reason); }
        const delay = Math.min(duration(options.retryDelayMs, DEFAULT_RETRY_DELAY_MS), Math.max(0, deadline - Date.now()));
        await waitForRetry(delay, options.signal);
      }
    }
    if (!generated) { stepUsage.status = "provider_failure"; return finish("provider_failure"); }

    const decision = parseDecision(output);
    if (decision.kind === "unknown_tool" || decision.kind === "invalid_tool_args" || decision.kind === "invalid_model_output") {
      stepUsage.status = decision.kind;
      return finish(decision.kind);
    }
    if (decision.kind === "final") {
      const cited = evidence.find((item) => item.evidenceId === decision.evidenceId &&
        item.drillId === decision.drillId && item.supported);
      if (!cited) { stepUsage.status = "invalid_final"; return finish("invalid_final"); }
      stepUsage.status = "final";
      return finish("goal_completed", composeRecommendation(cited, usage.runId));
    }

    if (step === MAX_STEPS) { stepUsage.status = "max_steps"; return finish("max_steps"); }
    if (evidence.some((item) => item.supported)) { stepUsage.status = "invalid_model_output"; return finish("invalid_model_output"); }
    const key = JSON.stringify(decision.args);
    if (seen.has(key)) { stepUsage.status = "repeated_call"; return finish("repeated_call"); }
    if (usage.toolCallCount >= MAX_TOOLS) { stepUsage.status = "incomplete"; return finish("incomplete"); }
    if (options.signal?.aborted) return finish("cancelled");
    const remaining = deadline - Date.now();
    if (remaining <= 0) return finish("deadline");
    seen.add(key);
    const evidenceId = `ev-${usage.toolCallCount + 1}`;
    let raw: unknown;
    try {
      raw = await runTool(tool, decision.args, counts, evidenceId, Math.min(TOOL_TIMEOUT_MS, remaining), () => {
        usage.toolCallCount += 1;
        stepUsage.tool = "evaluate_drill";
      }, options.signal);
    } catch (error) {
      const reason = options.signal?.aborted ? "cancelled" : Date.now() >= deadline ? "deadline"
        : error instanceof ToolTimeoutError ? "tool_timeout" : "tool_failure";
      stepUsage.status = reason;
      return finish(reason);
    }
    if (options.signal?.aborted) return finish("cancelled");
    if (Date.now() >= deadline) return finish("deadline");
    const normalized = validateToolEvidence(raw, counts, evidenceId);
    if (!normalized) { stepUsage.status = "invalid_tool_result"; return finish("invalid_tool_result"); }
    evidence.push(normalized);
    stepUsage.status = normalized.supported ? "tool_supported" : "tool_unsupported";
    stepUsage.latencyMs = Math.max(0, Date.now() - stepStarted);
    activeStepStartedAt = null;
    activeStepUsage = null;
  }
  return finish("max_steps");
}
