import { describe, expect, it } from "vitest";

import { AnalysisRequestGate } from "../src/coach/request-gate";

describe("analysis request gate", () => {
  it("prevents a duplicate request while one is pending", () => {
    const gate = new AnalysisRequestGate();
    const first = gate.begin();

    expect(first).not.toBeNull();
    expect(gate.begin()).toBeNull();
    expect(gate.finish(first!)).toBe(true);
    expect(gate.begin()).not.toBeNull();
  });

  it("rejects a stale result after restart invalidation", () => {
    const gate = new AnalysisRequestGate();
    const requestId = gate.begin()!;
    gate.invalidate();

    expect(gate.isCurrent(requestId)).toBe(false);
    expect(gate.finish(requestId)).toBe(false);
  });
});
