import { describe, expect, it } from "vitest";

import type { RunStatistics } from "../../server/coach/types";
import { validateAdvice } from "../../server/coach/validate-advice";

const facts: RunStatistics = {
  finalScore: 2,
  startingWidth: 100,
  earlyCount: 0,
  lateCount: 3,
  centeredCount: 0,
  earlyPercent: 0,
  latePercent: 100,
  centeredPercent: 0,
  averageAbsoluteOffsetPx: 12,
  timingBias: "late",
  biggestMistakeFloor: 2,
  maxWidthLossPx: 20,
};

const validAdvice = {
  headline: "Malo kasniš sa puštanjem",
  timingBias: "late",
  biggestMistakeFloor: 2,
  tip: "Pusti blok pre nego što prođe centar tornja.",
};

describe("validateAdvice", () => {
  it("accepts a bounded response matching server-derived facts", () => {
    expect(validateAdvice(validAdvice, facts)).toEqual({ ok: true, advice: validAdvice });
  });

  it.each([
    ["long headline", { ...validAdvice, headline: "x".repeat(81) }],
    ["long tip", { ...validAdvice, tip: "x".repeat(201) }],
    ["wrong timing", { ...validAdvice, timingBias: "early" }],
    ["wrong floor", { ...validAdvice, biggestMistakeFloor: 1 }],
    ["null floor", { ...validAdvice, biggestMistakeFloor: null }],
    ["floor beyond the run", { ...validAdvice, biggestMistakeFloor: 4 }],
    ["invalid enum", { ...validAdvice, timingBias: "perfect" }],
    ["missing headline", { timingBias: "late", biggestMistakeFloor: 2, tip: "tip" }],
    ["blank headline", { ...validAdvice, headline: "   " }],
    ["untrimmed tip", { ...validAdvice, tip: " savet " }],
    ["extra provider field", { ...validAdvice, secretDetail: "never return this" }],
  ])("rejects %s", (_label, output) => {
    expect(validateAdvice(output, facts).ok).toBe(false);
  });

});
