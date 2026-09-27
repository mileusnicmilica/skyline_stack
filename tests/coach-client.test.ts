import { describe, expect, it, vi } from "vitest";

import { requestCoachAnalysis } from "../src/coach/coach-client";
import type { CoachRequest } from "../src/coach/coach-client";

const request: CoachRequest = {
  finalScore: 1,
  startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

describe("coach client", () => {
  it("returns bounded validated advice", async () => {
    const advice = {
      headline: "Pusti malo ranije",
      timingBias: "late",
      biggestMistakeFloor: 2,
      tip: "Fokusiraj centar tornja.",
    };
    const result = await requestCoachAnalysis(request, {
      fetchImplementation: async () => new Response(JSON.stringify({ success: true, advice }), { status: 200 }),
    });
    expect(result).toEqual({ ok: true, advice });
  });

  it.each([
    ["safe HTTP failure", new Response(JSON.stringify({ success: false, message: "private" }), { status: 503 })],
    ["malformed success", new Response(JSON.stringify({ success: true, advice: { biggestMistakeFloor: null } }), { status: 200 })],
    ["invalid JSON", new Response("not-json", { status: 200 })],
  ])("maps %s to the stable unavailable state", async (_label, response) => {
    const result = await requestCoachAnalysis(request, { fetchImplementation: async () => response });
    expect(result).toEqual({ ok: false, message: "AI analiza trenutno nije dostupna." });
  });

  it("aborts the client request at the visible timeout", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async (_input, init) => await new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    }));
    const result = await requestCoachAnalysis(request, { fetchImplementation, timeoutMs: 10 });

    expect(result).toEqual({ ok: false, message: "AI analiza trenutno nije dostupna." });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});
