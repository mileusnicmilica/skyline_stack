import { describe, expect, it, vi } from "vitest";
import { runNextDrill } from "../../server/agent/run";
import { evaluateDrill } from "../../server/agent/evaluate-drill";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { finalCall, scriptedAgent, toolCall, w08Run } from "./w08-fixtures";

describe("W08 agent and tool boundary", () => {
  it("T00 preserves two decisions and one real read-only evaluator", async () => {
    const original = JSON.stringify(w08Run);
    const tool = vi.fn(evaluateDrill);
    const result = await runNextDrill(w08Run, fakeAgentProvider, { tool });
    expect(result.ok).toBe(true);
    expect(result.usage.providerAttempts).toBe(2);
    expect(result.usage.toolCallCount).toBe(1);
    expect(tool).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(w08Run)).toBe(original);
  });

  it.each(["constructor", "toString", "set_score", "read_file"])(
    "T07/T09 rejects forbidden tool %s after one provider decision", async (name) => {
      const { provider, generate } = scriptedAgent(toolCall("release_earlier", name));
      const tool = vi.fn(evaluateDrill);
      const result = await runNextDrill(w08Run, provider, { tool });
      expect(result.ok).toBe(false);
      expect(result.usage.stopReason).toBe("unknown_tool");
      expect(result.usage.providerAttempts).toBe(1);
      expect(result.usage.toolCallCount).toBe(0);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(tool).not.toHaveBeenCalled();
    },
  );

  it("T08 rejects malformed arguments, then permits a separate current-run call", async () => {
    const denied = scriptedAgent({ ...toolCall(), args: { drillId: "release_earlier", ownerId: "other" } });
    const tool = vi.fn(evaluateDrill);
    const rejected = await runNextDrill(w08Run, denied.provider, { tool });
    expect(rejected.usage.stopReason).toBe("invalid_tool_args");
    expect(tool).not.toHaveBeenCalled();

    const allowed = scriptedAgent(toolCall(), finalCall());
    const accepted = await runNextDrill(w08Run, allowed.provider, { tool });
    expect(accepted.ok).toBe(true);
    expect(tool).toHaveBeenCalledTimes(1);
    expect(tool.mock.calls[0]?.[1]).toEqual({ earlyCount: 0, lateCount: 2, centeredCount: 0 });
  });

  it("T08 rejects otherwise valid evidence with another run's counts before model reuse", async () => {
    const { provider, generate } = scriptedAgent(toolCall(), finalCall());
    const result = await runNextDrill(w08Run, provider, {
      tool: (args, _counts, evidenceId) => evaluateDrill(args, { earlyCount: 2, lateCount: 0, centeredCount: 0 }, evidenceId),
    });
    expect(result.usage.stopReason).toBe("invalid_tool_result");
    expect(result.usage.toolCallCount).toBe(1);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("T06 rejects oversized decision and extra final fields without continuing", async () => {
    const oversized = scriptedAgent({ ...toolCall(), padding: "x".repeat(5_000) });
    const tool = vi.fn(evaluateDrill);
    const first = await runNextDrill(w08Run, oversized.provider, { tool });
    expect(first.usage.stopReason).toBe("invalid_model_output");
    expect(oversized.generate).toHaveBeenCalledTimes(1);
    expect(tool).not.toHaveBeenCalled();

    const extraFinal = scriptedAgent(toolCall(), { ...finalCall(), ownerId: "another-run" });
    const second = await runNextDrill(w08Run, extraFinal.provider, { tool });
    expect(second.usage.stopReason).toBe("invalid_model_output");
    expect(extraFinal.generate).toHaveBeenCalledTimes(2);
    expect(tool).toHaveBeenCalledTimes(1);
  });

  it("T10 drops an extra secret field and never sends it to the next model step", async () => {
    const sentinel = "W08_SERVER_SECRET_DO_NOT_EXPOSE";
    const { provider, generate } = scriptedAgent(toolCall(), finalCall());
    const result = await runNextDrill(w08Run, provider, {
      tool: (args, counts, evidenceId) => ({ ...evaluateDrill(args, counts, evidenceId), privateKey: sentinel }),
    });
    expect(result.usage.stopReason).toBe("invalid_tool_result");
    expect(generate).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(generate.mock.calls)).not.toContain(sentinel);
  });

  it("T10 rejects oversized tool evidence even with valid named fields", async () => {
    const { provider, generate } = scriptedAgent(toolCall(), finalCall());
    const result = await runNextDrill(w08Run, provider, {
      tool: (args, counts, evidenceId) => ({
        ...evaluateDrill(args, counts, evidenceId), evidenceId: `${evidenceId}${"x".repeat(300)}`,
      }),
    });
    expect(result.usage.stopReason).toBe("invalid_tool_result");
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
