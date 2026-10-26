import { describe, expect, it, vi } from "vitest";
import { runNextDrill } from "../../server/agent/run";
import { evaluateDrill } from "../../server/agent/evaluate-drill";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { w08Run } from "./w08-fixtures";

describe("W08 direct agent and game integrity", () => {
  it("T01/T15 denies 4097 px direct input before provider or tool work", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const tool = vi.fn(evaluateDrill);
    for (const invalid of [
      { ...w08Run, startingWidth: 4_097 },
      { ...w08Run, drops: [{ ...w08Run.drops[0], offsetPx: 4_097 }, w08Run.drops[1]] },
    ]) {
      const result = await runNextDrill(invalid, { ...fakeAgentProvider, generate }, { tool });
      expect(result.usage.stopReason).toBe("invalid_input");
      expect(result.usage.providerAttempts).toBe(0);
      expect(result.usage.toolCallCount).toBe(0);
    }
    expect(generate).not.toHaveBeenCalled();
    expect(tool).not.toHaveBeenCalled();
  });

  it("T15 a client-supplied run remains advice-only and read-only", async () => {
    const forgedButConsistent = {
      ...w08Run, finalScore: 2,
      drops: [
        { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
        { floor: 2, offsetPx: 10, direction: 1, timing: "late", widthBefore: 90, widthAfter: 80 },
        { floor: 3, offsetPx: 80, direction: 1, timing: "late", widthBefore: 80, widthAfter: 0 },
      ],
    };
    const before = structuredClone(forgedButConsistent);
    const tool = vi.fn(evaluateDrill);
    const result = await runNextDrill(forgedButConsistent, fakeAgentProvider, { tool });
    expect(result.ok).toBe(true);
    expect(result.usage.toolCallCount).toBe(1);
    expect(tool).toHaveBeenCalledTimes(1);
    expect(forgedButConsistent).toEqual(before);
    if (result.ok) {
      expect(JSON.stringify(result.recommendation)).not.toMatch(/verified|rank|privilege/i);
    }
  });
});
