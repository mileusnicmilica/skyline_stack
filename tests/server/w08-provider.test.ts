import { describe, expect, it, vi } from "vitest";
import { GeminiAgentProvider } from "../../server/providers/gemini-agent-provider";
import type { AgentModelContext } from "../../server/agent/types";

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
});
