import { describe, expect, it, vi } from "vitest";
import { requestNextDrill, SAFE_DRILL_MESSAGE } from "../src/agent/next-drill-client";

const request = {
  goal: "choose_next_drill" as const,
  finalScore: 0, startingWidth: 100,
  drops: [{ floor: 1, offsetPx: 100, direction: 1 as const, timing: "late" as const, widthBefore: 100, widthAfter: 0 }],
};
const recommendation = {
  drillId: "release_earlier", title: "Vežbaj ranije puštanje", instruction: "Pusti blok ranije.",
  evidence: { earlyCount: 0, lateCount: 1, centeredCount: 0, finding: "Kasna puštanja su češća od ranih." },
  runId: "run-1", stopReason: "goal_completed",
};

describe("next drill browser client", () => {
  it("accepts a bounded supported recommendation", async () => {
    const fetchImplementation = vi.fn(async () => Response.json({ success: true, recommendation }));
    const result = await requestNextDrill(request, { fetchImplementation: fetchImplementation as typeof fetch });
    expect(result).toEqual({ ok: true, recommendation });
    expect(fetchImplementation).toHaveBeenCalledWith("/api/ai/next-drill", expect.objectContaining({ method: "POST" }));
  });

  it("rejects unsupported server results and malformed bodies", async () => {
    const fetchImplementation = vi.fn(async () => Response.json({ success: true, recommendation: { ...recommendation, drillId: "release_later" } }));
    expect(await requestNextDrill(request, { fetchImplementation: fetchImplementation as typeof fetch })).toEqual({ ok: false, message: SAFE_DRILL_MESSAGE });
  });

  it("returns the safe state after cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImplementation = vi.fn(async () => { throw new Error("aborted"); });
    expect(await requestNextDrill(request, { signal: controller.signal, fetchImplementation: fetchImplementation as typeof fetch })).toEqual({ ok: false, message: SAFE_DRILL_MESSAGE });
  });
});
