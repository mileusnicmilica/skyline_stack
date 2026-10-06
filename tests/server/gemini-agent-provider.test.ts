import { describe, expect, it, vi } from "vitest";
import { GeminiAgentProvider } from "../../server/providers/gemini-agent-provider";
import { createAgentProvider } from "../../server/providers/agent-provider-config";
import type { AgentModelContext } from "../../server/agent/types";
import { ProviderError } from "../../server/providers/provider-error";

const context: AgentModelContext = {
  goal: "choose_next_drill", finalScore: 1, earlyCount: 0, lateCount: 2, centeredCount: 0,
  step: 1, evidence: [],
};

describe("Gemini agent decision adapter", () => {
  it("keeps the key in the server header and returns structured JSON", async () => {
    const output = { action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier" } };
    const fetchImplementation = vi.fn(async (_url: string, options: RequestInit) => {
      expect((options.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
      expect(JSON.stringify(options.body)).not.toContain("test-key");
      expect(JSON.stringify(options.body)).not.toContain("widthBefore");
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }], usageMetadata: { promptTokenCount: 12 } });
    });
    const provider = new GeminiAgentProvider("test-key", fetchImplementation as typeof fetch);
    const result = await provider.generate(context, { signal: new AbortController().signal, attempt: 1 });
    expect(result.output).toEqual(output);
    expect(result.tokenUsage?.inputTokens).toBe(12);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("classifies transient HTTP failure and rejects missing credentials", async () => {
    const provider = new GeminiAgentProvider("test-key", vi.fn(async () => new Response("", { status: 429 })) as typeof fetch);
    await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 })).rejects.toMatchObject({ retryable: true });
    expect(() => createAgentProvider({ AI_COACH_PROVIDER: "gemini" })).toThrow();
    expect(createAgentProvider({ AI_COACH_PROVIDER: "fake" }).name).toBe("fake");
    expect(ProviderError.name).toBe("ProviderError");
  });

  it("classifies rate limit, service outage, and credential rejection", async () => {
    for (const [status, kind, retryable] of [
      [429, "rate_limit", true], [503, "unavailable", true], [403, "unauthorized", false],
    ] as const) {
      const provider = new GeminiAgentProvider("test-key", vi.fn(async () => new Response("", { status })) as typeof fetch);
      await expect(provider.generate(context, { signal: new AbortController().signal, attempt: 1 }))
        .rejects.toMatchObject({ kind, retryable });
    }
  });
});
