import { describe, expect, it, vi } from "vitest";

import { coachRun } from "../../server/coach/analysis";
import type {
  CoachAdvice,
  CoachProvider,
  CoachRequest,
  ProviderUsageRecord,
} from "../../server/coach/types";
import { ProviderError } from "../../server/providers/provider-error";

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
  tip: "Pusti blok pre nego sto predje centar tornja.",
};

function provider(generate: CoachProvider["generate"]): CoachProvider {
  return { name: "fake", model: "test-scenario", generate };
}

describe("coach provider reliability", () => {
  it("retries one transient failure and then returns validated advice", async () => {
    let calls = 0;
    const usage: ProviderUsageRecord[] = [];
    const result = await coachRun(validRequest, provider(async () => {
      calls += 1;
      if (calls === 1) throw new ProviderError("temporary", true);
      return { output: advice, tokenUsage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 } };
    }), {
      totalTimeoutMs: 100,
      attemptTimeoutMs: 40,
      retryDelayMs: 1,
      onUsage: (record) => usage.push(record),
    });

    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
    expect(usage).toEqual([
      expect.objectContaining({
        provider: "fake",
        model: "test-scenario",
        outcome: "success",
        attempts: 2,
        tokenUsage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },
      }),
    ]);
  });

  it("stops after two transient attempts", async () => {
    let calls = 0;
    const result = await coachRun(validRequest, provider(async () => {
      calls += 1;
      throw new ProviderError("still temporary", true);
    }), { totalTimeoutMs: 100, attemptTimeoutMs: 40, retryDelayMs: 1 });

    expect(result).toEqual({ ok: false, kind: "provider-failure" });
    expect(calls).toBe(2);
  });

  it("aborts timed-out attempts within the total deadline", async () => {
    let calls = 0;
    let aborts = 0;
    const result = await coachRun(validRequest, provider(async (_statistics, context) => {
      calls += 1;
      return await new Promise((_resolve, reject) => {
        context.signal.addEventListener("abort", () => {
          aborts += 1;
          reject(context.signal.reason);
        }, { once: true });
      });
    }), { totalTimeoutMs: 100, attemptTimeoutMs: 15, retryDelayMs: 1 });

    expect(result).toEqual({ ok: false, kind: "provider-failure" });
    expect(calls).toBe(2);
    expect(aborts).toBe(2);
  });

  it("does not retry deterministic malformed output", async () => {
    const generate = vi.fn(async () => ({ output: { ...advice, biggestMistakeFloor: null } }));
    const result = await coachRun(validRequest, provider(generate), {
      totalTimeoutMs: 100,
      attemptTimeoutMs: 40,
      retryDelayMs: 1,
    });

    expect(result).toEqual({ ok: false, kind: "invalid-advice" });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-transient provider failures", async () => {
    const generate = vi.fn(async () => {
      throw new ProviderError("request rejected", false);
    });
    const result = await coachRun(validRequest, provider(generate), {
      totalTimeoutMs: 100,
      attemptTimeoutMs: 40,
      retryDelayMs: 1,
    });

    expect(result).toEqual({ ok: false, kind: "provider-failure" });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
