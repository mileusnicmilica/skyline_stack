import { describe, expect, it, vi } from "vitest";
import { getAgentUsageRecords, recordAgentUsage } from "../../server/agent/usage";

describe("agent usage retention", () => {
  it("retains a bounded recent history while preserving the latest run", () => {
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      for (let index = 0; index < 105; index += 1) {
        recordAgentUsage({
          runId: `run-${index}`, provider: "fake", model: "test", startedAt: "2026-10-05T00:00:00.000Z",
          latencyMs: 0, stepCount: 0, providerAttempts: 0, toolCallCount: 0,
          stopReason: "invalid_input", steps: [],
        });
      }
      const records = getAgentUsageRecords();
      expect(records).toHaveLength(100);
      expect(records[0]?.runId).toBe("run-5");
      expect(records.at(-1)?.runId).toBe("run-104");
    } finally {
      output.mockRestore();
    }
  });
});
