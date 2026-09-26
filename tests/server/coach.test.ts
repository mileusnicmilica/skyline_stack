import { describe, expect, it } from "vitest";

import type { CoachAdvice, CoachProvider, CoachRequest } from "../../server/coach/types";
import { coachRun } from "../../server/coach/analysis";

const validRequest: CoachRequest = {
  finalScore: 1,
  startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

const advice: CoachAdvice = {
  headline: "Pusti malo ranije",
  timingBias: "late",
  biggestMistakeFloor: 2,
  tip: "Pusti blok pre nego što pređe centar tornja.",
};

function providerReturning(output: unknown, onCall = () => {}): CoachProvider {
  return {
    async generate(statistics) {
      onCall();
      expect(statistics.finalScore).toBe(1);
      expect(statistics.timingBias).toBe("late");
      expect("drops" in statistics).toBe(false);
      return output;
    },
  };
}

describe("coach analysis", () => {
  it("derives statistics and accepts advice matching those facts", async () => {
    const result = await coachRun(validRequest, providerReturning(advice));

    expect(result).toEqual({
      ok: true,
      advice,
      statistics: expect.objectContaining({
        earlyCount: 0,
        lateCount: 2,
        latePercent: 100,
        earlyPercent: 0,
        averageAbsoluteOffsetPx: 50,
        biggestMistakeFloor: 2,
        timingBias: "late",
      }),
    });
  });

  it.each([
    ["empty log", { ...validRequest, drops: [] }],
    ["score mismatch", { ...validRequest, finalScore: 2 }],
    ["score outside the supported range", { ...validRequest, finalScore: 501 }],
    ["fractional score", { ...validRequest, finalScore: 1.5 }],
    ["negative starting width", { ...validRequest, startingWidth: -100 }],
    ["non-finite offset", { ...validRequest, drops: [{ ...validRequest.drops[0]!, offsetPx: Number.NaN }, validRequest.drops[1]!] }],
    ["infinite offset", { ...validRequest, drops: [{ ...validRequest.drops[0]!, offsetPx: Number.POSITIVE_INFINITY }, validRequest.drops[1]!] }],
    ["negative width", { ...validRequest, drops: [{ ...validRequest.drops[0]!, widthAfter: -1 }, validRequest.drops[1]!] }],
    ["wrong starting width", { ...validRequest, startingWidth: 110 }],
    ["extra private request field", { ...validRequest, playerName: "private" }],
    ["extra private drop field", { ...validRequest, drops: [{ ...validRequest.drops[0]!, note: "private" }, validRequest.drops[1]!] }],
    ["impossible geometric width", { ...validRequest, drops: [{ ...validRequest.drops[0]!, widthAfter: 95 }, { ...validRequest.drops[1]!, widthBefore: 95 }] }],
    ["wrong floor order", { ...validRequest, drops: [{ ...validRequest.drops[0]!, floor: 2 }, validRequest.drops[1]!] }],
    ["invalid direction", { ...validRequest, drops: [{ ...validRequest.drops[0]!, direction: 0 }, validRequest.drops[1]!] }],
    ["bad timing", { ...validRequest, drops: [{ ...validRequest.drops[0]!, timing: "early" as const }, validRequest.drops[1]!] }],
    ["broken width chain", { ...validRequest, drops: [validRequest.drops[0]!, { ...validRequest.drops[1]!, widthBefore: 88 }] }],
    ["miss is not terminal", { ...validRequest, drops: [{ ...validRequest.drops[0]!, widthAfter: 0 }, validRequest.drops[1]!] }],
    ["impossible centered miss", { ...validRequest, drops: [validRequest.drops[0]!, { ...validRequest.drops[1]!, offsetPx: 0, timing: "centered" as const }] }],
  ])("rejects %s before calling the provider", async (_label, request) => {
    let calls = 0;
    const result = await coachRun(request, providerReturning(advice, () => calls++));

    expect(result.ok).toBe(false);
    expect(calls).toBe(0);
  });

  it("rejects oversized logs before calling the provider", async () => {
    let calls = 0;
    const drops = Array.from({ length: 502 }, (_, index) => ({
      ...validRequest.drops[0]!,
      floor: index + 1,
    }));
    const result = await coachRun({ ...validRequest, drops }, providerReturning(advice, () => calls++));

    expect(result.ok).toBe(false);
    expect(calls).toBe(0);
  });

  it("classifies centered releases within one game-world pixel", async () => {
    const centeredRequest: CoachRequest = {
      finalScore: 2,
      startingWidth: 100,
      drops: [
        { floor: 1, offsetPx: 0.5, direction: -1, timing: "centered", widthBefore: 100, widthAfter: 99.5 },
        { floor: 2, offsetPx: 10, direction: 1, timing: "late", widthBefore: 99.5, widthAfter: 89.5 },
        { floor: 3, offsetPx: -89.5, direction: 1, timing: "early", widthBefore: 89.5, widthAfter: 0 },
      ],
    };
    const provider: CoachProvider = {
      async generate(statistics) {
        expect(statistics.timingBias).toBe("mixed");
        expect(statistics.centeredPercent).toBeCloseTo(33.333, 2);
        return { ...advice, timingBias: "mixed", biggestMistakeFloor: 3 };
      },
    };

    expect((await coachRun(centeredRequest, provider)).ok).toBe(true);
  });

  it("counts a first-drop miss as the largest width loss", async () => {
    const result = await coachRun({
      finalScore: 0,
      startingWidth: 100,
      drops: [{ floor: 1, offsetPx: 100, direction: 1, timing: "late", widthBefore: 100, widthAfter: 0 }],
    }, {
      async generate(statistics) {
        expect(statistics.biggestMistakeFloor).toBe(1);
        expect(statistics.maxWidthLossPx).toBe(100);
        return { ...advice, biggestMistakeFloor: 1 };
      },
    });
    expect(result.ok).toBe(true);
  });
});
