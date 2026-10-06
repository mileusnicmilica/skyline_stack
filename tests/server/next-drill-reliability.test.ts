import { describe, expect, it, vi } from "vitest";
import { runNextDrill } from "../../server/agent/run";
import type { AgentProvider, AgentModelContext } from "../../server/agent/types";
import type { ProviderGeneration } from "../../server/coach/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { ProviderError } from "../../server/providers/provider-error";
import { evaluateDrill } from "../../server/agent/evaluate-drill";

const input = {
  goal: "choose_next_drill", finalScore: 0, startingWidth: 100,
  drops: [{ floor: 1, offsetPx: 100, direction: 1, timing: "late", widthBefore: 100, widthAfter: 0 }],
};
const proposal = { action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier" } };
const provider = (generate: AgentProvider["generate"]): AgentProvider => ({ name: "fake", model: "scripted", generate });

describe("next drill limits and failure policy", () => {
  it("stops on malformed tool result", async () => {
    const result = await runNextDrill(input, provider(async () => ({ output: proposal })), {
      tool: () => ({ evidenceId: "ev-1", secret: "not allowed" }),
    });
    expect(result.ok).toBe(false);
    expect(result.usage.stopReason).toBe("invalid_tool_result");
    expect(result.usage.toolCallCount).toBe(1);
  });

  it("reports tool timeout without another model step", async () => {
    const generate = vi.fn(async () => ({ output: proposal }));
    const result = await runNextDrill(input, provider(generate), {
      tool: async () => await new Promise(() => undefined),
    });
    expect(result.usage.stopReason).toBe("tool_timeout");
    expect(result.usage.steps[0]?.status).toBe("tool_timeout");
    expect(result.usage.steps[0]?.latencyMs).toBeGreaterThan(0);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("rejects a slow synchronous tool even when its timer cannot run", async () => {
    vi.useFakeTimers();
    try {
      const result = await runNextDrill(input, provider(async () => ({ output: proposal })), {
        tool: (args, counts, evidenceId) => {
          vi.setSystemTime(Date.now() + 60);
          return evaluateDrill(args, counts, evidenceId);
        },
      });
      expect(result.usage.stopReason).toBe("tool_timeout");
      expect(result.usage.toolCallCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("caps transient provider retries at two per step", async () => {
    const generate = vi.fn(async () => { throw new ProviderError("temporary", true); });
    const result = await runNextDrill(input, provider(generate), { retryDelayMs: 1 });
    expect(result.ok).toBe(false);
    expect(result.usage.providerAttempts).toBe(2);
    expect(result.usage.stopReason).toBe("provider_failure");
  });

  it("applies the per-attempt timeout and reports bounded timeout retries", async () => {
    const generate = vi.fn(async (_context: AgentModelContext, { signal }: { signal: AbortSignal; attempt: number }): Promise<ProviderGeneration> => await new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));
    const result = await runNextDrill(input, provider(generate), {
      totalDeadlineMs: 500, attemptTimeoutMs: 15, retryDelayMs: 1,
    });
    expect(result.usage.stopReason).toBe("provider_timeout");
    expect(result.usage.providerAttempts).toBe(2);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("enforces total deadline even when provider never answers", async () => {
    const result = await runNextDrill(input, provider(async (_context, { signal }) => await new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    })), { totalDeadlineMs: 20, attemptTimeoutMs: 100, retryDelayMs: 1 });
    expect(result.usage.stopReason).toBe("deadline");
    expect(result.usage.steps[0]?.status).toBe("deadline");
    expect(result.usage.providerAttempts).toBeLessThanOrEqual(2);
  });

  it("treats configured timeouts as hard upper bounds", async () => {
    vi.useFakeTimers();
    try {
      const generate = vi.fn(async (_context: AgentModelContext, { signal }: { signal: AbortSignal; attempt: number }): Promise<ProviderGeneration> => await new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }));
      const run = runNextDrill(input, provider(generate), {
        totalDeadlineMs: 60_000, attemptTimeoutMs: 60_000, retryDelayMs: 1,
      });
      await vi.advanceTimersByTimeAsync(17_000);
      const result = await run;
      expect(result.usage.stopReason).toBe("provider_timeout");
      expect(result.usage.providerAttempts).toBe(2);
      expect(result.usage.latencyMs).toBeLessThan(17_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("caps an oversized retry delay at the total run deadline", async () => {
    vi.useFakeTimers();
    try {
      const generate = vi.fn(async () => { throw new ProviderError("temporary", true, "unavailable"); });
      const run = runNextDrill(input, provider(generate), { totalDeadlineMs: 60_000, retryDelayMs: 60_000 });
      await vi.advanceTimersByTimeAsync(25_001);
      const result = await run;
      expect(result.usage.stopReason).toBe("deadline");
      expect(result.usage.steps[0]?.status).toBe("deadline");
      expect(generate).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("distinguishes provider rate limit, unavailability, and unauthorized failures", async () => {
    for (const [kind, stopReason] of [
      ["rate_limit", "provider_rate_limit"],
      ["unavailable", "provider_unavailable"],
      ["unauthorized", "provider_unauthorized"],
    ] as const) {
      const result = await runNextDrill(input, provider(async () => { throw new ProviderError("safe", false, kind); }));
      expect(result.usage.stopReason).toBe(stopReason);
      expect(result.usage.steps[0]?.status).toBe(stopReason);
    }
  });

  it("cancels a pending tool without accepting a later result", async () => {
    const controller = new AbortController();
    let toolStarted!: () => void;
    const started = new Promise<void>((resolve) => { toolStarted = resolve; });
    const run = runNextDrill(input, provider(async () => ({ output: proposal })), {
      signal: controller.signal,
      tool: async () => { toolStarted(); return await new Promise(() => undefined); },
    });
    await started;
    controller.abort();
    const result = await run;
    expect(result.usage.stopReason).toBe("cancelled");
    expect(result.usage.steps[0]?.status).toBe("cancelled");
  });

  it("logs only validated numeric token counts from provider output", async () => {
    let observed: unknown;
    const result = await runNextDrill(input, provider(async (context) => ({
      output: context.step === 1 ? proposal : { action: "final", drillId: "release_earlier", evidenceId: "ev-1" },
      tokenUsage: { inputTokens: 4, outputTokens: -1, secret: "must-not-log" },
    } as unknown as ProviderGeneration)), { onUsage: (usage) => { observed = usage; } });
    expect(result.ok).toBe(true);
    expect(result.usage.steps[0]?.tokenUsage).toEqual({ inputTokens: 4 });
    expect(JSON.stringify(observed)).not.toContain("must-not-log");
  });

  it("cancels before a provider or tool call", async () => {
    const controller = new AbortController();
    controller.abort();
    const generate = vi.fn(fakeAgentProvider.generate);
    const result = await runNextDrill(input, provider(generate), { signal: controller.signal });
    expect(result.usage.stopReason).toBe("cancelled");
    expect(result.usage.providerAttempts).toBe(0);
    expect(result.usage.toolCallCount).toBe(0);
    expect(generate).not.toHaveBeenCalled();
  });
});
