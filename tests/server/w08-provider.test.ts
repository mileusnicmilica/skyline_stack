import { describe, expect, it, vi } from "vitest";
import { GeminiAgentProvider } from "../../server/providers/gemini-agent-provider";
import { runNextDrill } from "../../server/agent/run";
import type { AgentModelContext } from "../../server/agent/types";
import { finalCall, toolCall, w08Run } from "./w08-fixtures";

const context: AgentModelContext = {
  goal: "choose_next_drill", finalScore: 1, earlyCount: 0, lateCount: 2, centeredCount: 0,
  step: 1, evidence: [],
};

describe("W08 provider transport boundary", () => {
  it("T06 limits an upstream envelope before reading and parsing its full body", async () => {
    const body = JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier" } }) }] } }],
      padding: "x".repeat(100_000),
    });
    const encoded = new TextEncoder().encode(body);
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        const start = pulled * 4_096;
        if (start >= encoded.byteLength) { controller.close(); return; }
        controller.enqueue(encoded.slice(start, start + 4_096));
        pulled += 1;
      },
    });
    const fetchImplementation = vi.fn(async () => new Response(stream, { status: 200 }));
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);
    await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 }))
      .rejects.toThrow();
    expect(pulled).toBeLessThan(15);
  });

  it("T06 sends a server-owned 512-token cap and accepts a small valid envelope", async () => {
    const output = { action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier" } };
    const fetchImplementation = vi.fn(async (_url: string, options: RequestInit) => {
      const request = JSON.parse(String(options.body));
      expect(request.generationConfig.maxOutputTokens).toBe(512);
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
    });
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);
    await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 }))
      .resolves.toMatchObject({ output });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("T06 rejects oversized model context before transport", async () => {
    const fetchImplementation = vi.fn(async () => Response.json({}));
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);
    const oversized = { ...context, evidence: [{ privateText: "x".repeat(3_000) }] } as unknown as AgentModelContext;
    await expect(provider.generate(oversized, { signal: new AbortController().signal, attempt: 1 }))
      .rejects.toThrow();
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it.each([
    [429, "rate_limit"], [503, "unavailable"],
  ] as const)("T11 cancels an HTTP %i error body before a retryable failure", async (status, kind) => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const fetchImplementation = vi.fn(async () => new Response(body, { status }));
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);

    await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 }))
      .rejects.toMatchObject({ kind, retryable: true });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("T11 preserves the HTTP failure classification without retrying when body cancellation rejects", async () => {
    const cancel = vi.fn(() => { throw new Error("synthetic cancellation failure"); });
    const body = new ReadableStream<Uint8Array>({ cancel });
    const fetchImplementation = vi.fn(async () => new Response(body, { status: 503 }));
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);

    await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 }))
      .rejects.toMatchObject({ kind: "unavailable", retryable: false });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("T11 stops after one provider attempt when an HTTP error body cannot be closed", async () => {
    const cancel = vi.fn(() => { throw new Error("synthetic cancellation failure"); });
    const fetchImplementation = vi.fn(async () => new Response(
      new ReadableStream<Uint8Array>({ cancel }), { status: 503 }));
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);

    const result = await runNextDrill(w08Run, provider, { retryDelayMs: 1 });
    expect(result.ok).toBe(false);
    expect(result.usage.stopReason).toBe("provider_unavailable");
    expect(result.usage.providerAttempts).toBe(1);
    expect(result.usage.toolCallCount).toBe(0);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([429, 503])("T11 waits for HTTP %i body cancellation before retrying", async (status) => {
    let releaseCancel!: () => void;
    let cancelStarted!: () => void;
    const whenCancelStarted = new Promise<void>((resolve) => { cancelStarted = resolve; });
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelStarted();
        return new Promise<void>((resolve) => { releaseCancel = resolve; });
      },
    });
    let calls = 0;
    const fetchImplementation = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response(body, { status });
      const output = calls === 2 ? toolCall() : finalCall();
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
    });
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);
    const run = runNextDrill(w08Run, provider, { retryDelayMs: 1, attemptTimeoutMs: 500, totalDeadlineMs: 1_000 });
    try {
      await whenCancelStarted;
      await new Promise((resolve) => setTimeout(resolve, 15));
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
    } finally {
      releaseCancel?.();
    }
    const result = await run;
    expect(result.ok).toBe(true);
    expect(result.usage.providerAttempts).toBe(3);
    expect(result.usage.toolCallCount).toBe(1);
    expect(fetchImplementation).toHaveBeenCalledTimes(3);
  });
});
