import type { DropRecord } from "../game/model";

export type CoachRequest = {
  finalScore: number;
  startingWidth: number;
  drops: DropRecord[];
};

export type CoachAdvice = {
  headline: string;
  timingBias: "early" | "late" | "mixed" | "consistent";
  biggestMistakeFloor: number;
  tip: string;
};

export type CoachClientResult =
  | { ok: true; advice: CoachAdvice }
  | { ok: false; message: typeof SAFE_ANALYSIS_MESSAGE };

type CoachClientOptions = {
  fetchImplementation?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export const SAFE_ANALYSIS_MESSAGE = "AI analiza trenutno nije dostupna.";
const CLIENT_TIMEOUT_MS = 12_000;
const BIASES = new Set(["early", "late", "mixed", "consistent"]);
const ADVICE_KEYS = new Set(["headline", "timingBias", "biggestMistakeFloor", "tip"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAdvice(value: unknown, finalScore: number): CoachAdvice | null {
  if (!isRecord(value) || Object.keys(value).length !== ADVICE_KEYS.size ||
      !Object.keys(value).every((key) => ADVICE_KEYS.has(key))) return null;
  const { headline, timingBias, biggestMistakeFloor, tip } = value;
  if (typeof headline !== "string" || headline.trim() !== headline ||
      headline.length < 1 || headline.length > 80 ||
      typeof tip !== "string" || tip.trim() !== tip || tip.length < 1 || tip.length > 200 ||
      typeof timingBias !== "string" || !BIASES.has(timingBias) ||
      typeof biggestMistakeFloor !== "number" || !Number.isInteger(biggestMistakeFloor) ||
      biggestMistakeFloor < 1 || biggestMistakeFloor > finalScore + 1) {
    return null;
  }
  return {
    headline,
    timingBias: timingBias as CoachAdvice["timingBias"],
    biggestMistakeFloor,
    tip,
  };
}

export async function requestCoachAnalysis(
  request: CoachRequest,
  options: CoachClientOptions = {},
): Promise<CoachClientResult> {
  const controller = new AbortController();
  const timeoutMs = typeof options.timeoutMs === "number" && options.timeoutMs > 0
    ? options.timeoutMs
    : CLIENT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(new Error("coach-client-timeout")), timeoutMs);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await (options.fetchImplementation ?? fetch)("/api/ai/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, message: SAFE_ANALYSIS_MESSAGE };

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, message: SAFE_ANALYSIS_MESSAGE };
    }
    if (!isRecord(body) || body.success !== true) {
      return { ok: false, message: SAFE_ANALYSIS_MESSAGE };
    }
    const advice = readAdvice(body.advice, request.finalScore);
    return advice === null
      ? { ok: false, message: SAFE_ANALYSIS_MESSAGE }
      : { ok: true, advice };
  } catch {
    return { ok: false, message: SAFE_ANALYSIS_MESSAGE };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
