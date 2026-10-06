import { describe, expect, it, vi } from "vitest";
import { runNextDrill } from "../../server/agent/run";
import type { AgentProvider } from "../../server/agent/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { ProviderError } from "../../server/providers/provider-error";

const request = {
  goal: "choose_next_drill",
  finalScore: 1,
  startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

function scripted(...outputs: unknown[]): { provider: AgentProvider; generate: ReturnType<typeof vi.fn> } {
  const generate = vi.fn(async () => {
    if (!outputs.length) throw new Error("Unexpected provider call");
    const next = outputs.shift();
    if (next instanceof Error) throw next;
    return { output: next };
  });
  return { provider: { name: "fake", model: "scripted", generate }, generate };
}

const call = (drillId: string, tool = "evaluate_drill") => ({ action: "call_tool", tool, args: { drillId } });
const final = (drillId: string, evidenceId = "ev-1") => ({ action: "final", drillId, evidenceId });

describe("bounded next drill agent", () => {
  it("uses two model decisions and one real tool result for normal success", async () => {
    const result = await runNextDrill(request, fakeAgentProvider);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recommendation.drillId).toBe("release_earlier");
    expect(result.recommendation.evidence.lateCount).toBe(2);
    expect(result.usage.stepCount).toBe(2);
    expect(result.usage.providerAttempts).toBe(2);
    expect(result.usage.toolCallCount).toBe(1);
    expect(result.usage.stopReason).toBe("goal_completed");
  });

  it("selects later-release drill when early drops dominate", async () => {
    const earlyRun = {
      goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
      drops: [
        { floor: 1, offsetPx: -10, direction: 1, timing: "early", widthBefore: 100, widthAfter: 90 },
        { floor: 2, offsetPx: -90, direction: 1, timing: "early", widthBefore: 90, widthAfter: 0 },
      ],
    };
    const result = await runNextDrill(earlyRun, fakeAgentProvider);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recommendation.drillId).toBe("release_later");
  });

  it("selects center alignment when early and late counts tie", async () => {
    const balancedRun = {
      goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
      drops: [
        { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
        { floor: 2, offsetPx: -90, direction: 1, timing: "early", widthBefore: 90, widthAfter: 0 },
      ],
    };
    const result = await runNextDrill(balancedRun, fakeAgentProvider);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recommendation.drillId).toBe("center_alignment");
  });

  it("rejects invalid initial input before any provider or tool call", async () => {
    const { provider, generate } = scripted(call("release_earlier"));
    const tool = vi.fn();
    const result = await runNextDrill({ ...request, finalScore: 9 }, provider, { tool });
    expect(result.ok).toBe(false);
    expect(result.usage.stopReason).toBe("invalid_input");
    expect(result.usage.providerAttempts).toBe(0);
    expect(result.usage.toolCallCount).toBe(0);
    expect(generate).not.toHaveBeenCalled();
    expect(tool).not.toHaveBeenCalled();
  });

  it("rejects an unknown tool with zero executions", async () => {
    const { provider } = scripted(call("release_earlier", "delete_database"));
    const tool = vi.fn();
    const result = await runNextDrill(request, provider, { tool });
    expect(result.usage.stopReason).toBe("unknown_tool");
    expect(result.usage.toolCallCount).toBe(0);
    expect(tool).not.toHaveBeenCalled();
  });

  it("rejects malformed arguments with zero executions", async () => {
    const { provider } = scripted({ action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier", extra: true } });
    const tool = vi.fn();
    const result = await runNextDrill(request, provider, { tool });
    expect(result.usage.stopReason).toBe("invalid_tool_args");
    expect(result.usage.toolCallCount).toBe(0);
    expect(tool).not.toHaveBeenCalled();
  });

  it("can revise one unsupported candidate and cite only supported evidence", async () => {
    const { provider } = scripted(call("release_later"), call("release_earlier"), final("release_earlier", "ev-2"));
    const result = await runNextDrill(request, provider);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usage.stepCount).toBe(3);
    expect(result.usage.toolCallCount).toBe(2);
    expect(result.recommendation.drillId).toBe("release_earlier");
  });

  it("rejects a repeated proposal without executing it twice", async () => {
    const { provider } = scripted(call("release_later"), call("release_later"));
    const tool = vi.fn((..._args: unknown[]) => ({
      evidenceId: "ev-1", drillId: "release_later", supported: false,
      earlyCount: 0, lateCount: 2, centeredCount: 0, totalDrops: 2, findingCode: "late_dominant",
    }));
    const result = await runNextDrill(request, provider, { tool });
    expect(result.usage.stopReason).toBe("repeated_call");
    expect(result.usage.toolCallCount).toBe(1);
    expect(tool).toHaveBeenCalledTimes(1);
  });

  it("does not accept an invalid or unsupported final citation", async () => {
    const { provider } = scripted(call("release_earlier"), final("release_later"));
    const result = await runNextDrill(request, provider);
    expect(result.ok).toBe(false);
    expect(result.usage.stopReason).toBe("invalid_final");
  });

  it("rejects malformed model output without retry or tool call", async () => {
    const { provider, generate } = scripted({ text: "maybe" });
    const result = await runNextDrill(request, provider);
    expect(result.usage.stopReason).toBe("invalid_model_output");
    expect(result.usage.toolCallCount).toBe(0);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("stops a third tool proposal at the step limit", async () => {
    const { provider } = scripted(call("release_later"), call("center_alignment"), call("release_earlier"));
    const result = await runNextDrill(request, provider);
    expect(result.usage.stopReason).toBe("max_steps");
    expect(result.usage.stepCount).toBe(3);
    expect(result.usage.toolCallCount).toBe(2);
  });

  it("retries a transient provider failure within the run budget", async () => {
    const { provider, generate } = scripted(new ProviderError("temporary", true), call("release_earlier"), final("release_earlier"));
    const result = await runNextDrill(request, provider, { retryDelayMs: 1 });
    expect(result.ok).toBe(true);
    expect(result.usage.providerAttempts).toBe(3);
    expect(result.usage.stepCount).toBe(2);
    expect(generate).toHaveBeenCalledTimes(3);
  });
});
