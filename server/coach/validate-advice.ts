import type { CoachAdvice, RunStatistics, TimingBias } from "./types";

const BIASES = new Set<TimingBias>(["early", "late", "mixed", "consistent"]);
const ADVICE_KEYS = new Set(["headline", "timingBias", "biggestMistakeFloor", "tip"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateAdvice(
  value: unknown,
  statistics: RunStatistics,
): { ok: true; advice: CoachAdvice } | { ok: false } {
  if (!isRecord(value) || Object.keys(value).length !== ADVICE_KEYS.size ||
      !Object.keys(value).every((key) => ADVICE_KEYS.has(key))) return { ok: false };
  const { headline, timingBias, biggestMistakeFloor, tip } = value;
  if (typeof headline !== "string" || headline.trim() !== headline ||
      headline.length < 1 || headline.length > 80) {
    return { ok: false };
  }
  if (typeof tip !== "string" || tip.trim() !== tip ||
      tip.length < 1 || tip.length > 200) {
    return { ok: false };
  }
  if (typeof timingBias !== "string" || !BIASES.has(timingBias as TimingBias)) {
    return { ok: false };
  }
  if (typeof biggestMistakeFloor !== "number" ||
      !Number.isInteger(biggestMistakeFloor) ||
      biggestMistakeFloor < 1 ||
      biggestMistakeFloor > statistics.finalScore + 1) {
    return { ok: false };
  }
  if (timingBias !== statistics.timingBias ||
      biggestMistakeFloor !== statistics.biggestMistakeFloor) {
    return { ok: false };
  }

  return {
    ok: true,
    advice: { headline, timingBias: timingBias as TimingBias, biggestMistakeFloor, tip },
  };
}
