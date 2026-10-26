import { describe, expect, it, vi } from "vitest";
import { runNextDrill } from "../../server/agent/run";
import type { AgentProvider } from "../../server/agent/types";
import { ProviderError } from "../../server/providers/provider-error";
import { evaluateDrill } from "../../server/agent/evaluate-drill";
import { finalCall, scriptedAgent, toolCall, trackedDelayedAgent, w08Run } from "./w08-fixtures";

const delayed = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

describe("W08 agent work budgets", () => {
  it("T11 retries a settled unavailable provider and completes within the attempt budget", async () => {
    const { provider, generate } = scriptedAgent(
      new ProviderError("synthetic unavailable", true, "unavailable"), toolCall(), finalCall(),
    );
    const tool = vi.fn(evaluateDrill);
    const result = await runNextDrill(w08Run, provider, { tool, retryDelayMs: 1 });
    expect(result.ok).toBe(true);
    expect(result.usage.stopReason).toBe("goal_completed");
    expect(result.usage.providerAttempts).toBe(3);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(tool).toHaveBeenCalledTimes(1);
  });

  it("T11 counts retries across decisions without a fifth provider call", async () => {
    const { provider, generate } = scriptedAgent(
      new ProviderError("synthetic retry", true, "unavailable"), toolCall("release_later"),
      new ProviderError("synthetic retry", true, "unavailable"), toolCall(), finalCall(),
    );
    const tool = vi.fn(evaluateDrill);
    const result = await runNextDrill(w08Run, provider, { tool, retryDelayMs: 1 });
    expect(result.usage.stopReason).toBe("provider_failure");
    expect(result.usage.providerAttempts).toBe(4);
    expect(generate).toHaveBeenCalledTimes(4);
    expect(tool).toHaveBeenCalledTimes(2);
  });

  it("T11 rejects a repeated proposal before a second tool execution", async () => {
    const { provider, generate } = scriptedAgent(toolCall("release_later"), toolCall("release_later"));
    const tool = vi.fn(evaluateDrill);
    const result = await runNextDrill(w08Run, provider, { tool });
    expect(result.usage.stopReason).toBe("repeated_call");
    expect(result.usage.providerAttempts).toBe(2);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(tool).toHaveBeenCalledTimes(1);
  });

  it("T12 cumulative deadline fires although each individual operation is within its cap", async () => {
    vi.useFakeTimers();
    try {
      const generate = vi.fn(async (context: { step: number }) => {
        await delayed(12);
        return { output: context.step === 1 ? toolCall() : finalCall() };
      });
      const provider: AgentProvider = { name: "fake", model: "delayed", generate };
      const tool = vi.fn(async (args: unknown, counts: Parameters<typeof evaluateDrill>[1], evidenceId: string) => {
        await delayed(12);
        return evaluateDrill(args, counts, evidenceId);
      });
      const run = runNextDrill(w08Run, provider, {
        tool, totalDeadlineMs: 30, attemptTimeoutMs: 20,
      });
      await vi.advanceTimersByTimeAsync(40);
      const result = await run;
      expect(result.usage.stopReason).toBe("deadline");
      expect(result.usage.providerAttempts).toBe(2);
      expect(tool).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledTimes(2);
      expect(result.usage.latencyMs).toBeLessThanOrEqual(40);
    } finally {
      vi.useRealTimers();
    }
  });

  it("T12 does not turn an abort-ignoring late model response into success", async () => {
    vi.useFakeTimers();
    try {
      const delayedProvider = trackedDelayedAgent(40, toolCall());
      const tool = vi.fn(evaluateDrill);
      const run = runNextDrill(w08Run, delayedProvider.provider, {
        tool, totalDeadlineMs: 20, attemptTimeoutMs: 20,
      });
      await vi.advanceTimersByTimeAsync(21);
      const result = await run;
      expect(result.ok).toBe(false);
      expect(result.usage.stopReason).toBe("deadline");
      expect(delayedProvider.generate).toHaveBeenCalledTimes(1);
      expect(delayedProvider.active()).toBe(1);
      expect(tool).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(30);
      expect(delayedProvider.active()).toBe(0);
      expect(delayedProvider.peak()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("T12 enforces an individual attempt limit with no late tool execution", async () => {
    vi.useFakeTimers();
    try {
      const delayedProvider = trackedDelayedAgent(40, toolCall());
      const tool = vi.fn(evaluateDrill);
      const run = runNextDrill(w08Run, delayedProvider.provider, {
        tool, totalDeadlineMs: 100, attemptTimeoutMs: 10, retryDelayMs: 1,
      });
      await vi.advanceTimersByTimeAsync(25);
      const result = await run;
      expect(result.usage.stopReason).toBe("provider_timeout");
      expect(result.usage.providerAttempts).toBe(1);
      expect(delayedProvider.generate).toHaveBeenCalledTimes(1);
      expect(delayedProvider.active()).toBe(1);
      expect(delayedProvider.peak()).toBe(1);
      expect(tool).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(40);
      expect(delayedProvider.active()).toBe(0);
      expect(tool).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
