import { describe, expect, it } from "vitest";
import { evaluateDrill, validateToolEvidence } from "../../server/agent/evaluate-drill";

const counts = { earlyCount: 0, lateCount: 2, centeredCount: 0 };

describe("evaluate_drill contract", () => {
  it("returns bounded evidence for a supported candidate", () => {
    const evidence = evaluateDrill({ drillId: "release_earlier" }, counts, "ev-1");
    expect(evidence).toEqual({ evidenceId: "ev-1", drillId: "release_earlier", supported: true, ...counts, totalDrops: 2, findingCode: "late_dominant" });
    expect(validateToolEvidence(evidence, counts, "ev-1")).toEqual(evidence);
  });

  it("marks another allowed candidate unsupported", () => {
    expect(evaluateDrill({ drillId: "center_alignment" }, counts, "ev-1").supported).toBe(false);
  });

  it("rejects unknown args and forged tool results", () => {
    expect(() => evaluateDrill({ drillId: "release_earlier", extra: true }, counts, "ev-1")).toThrow();
    expect(validateToolEvidence({ ...evaluateDrill({ drillId: "release_earlier" }, counts, "ev-1"), lateCount: 99 }, counts, "ev-1")).toBeNull();
  });
});
