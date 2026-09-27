import { describe, expect, it } from "vitest";

import { GeminiCoachProvider, GEMINI_MODEL } from "../../server/providers/gemini-provider";
import { createCoachProvider } from "../../server/providers/provider-config";
import { ProviderError } from "../../server/providers/provider-error";
import type { RunStatistics } from "../../server/coach/types";

const statistics: RunStatistics = {
  finalScore: 1,
  startingWidth: 100,
  earlyCount: 0,
  lateCount: 2,
  centeredCount: 0,
  earlyPercent: 0,
  latePercent: 100,
  centeredPercent: 0,
  averageAbsoluteOffsetPx: 50,
  timingBias: "late",
  biggestMistakeFloor: 2,
  maxWidthLossPx: 90,
};

const advice = {
  headline: "Pusti malo ranije",
  timingBias: "late",
  biggestMistakeFloor: 2,
  tip: "Pusti blok pre nego sto predje centar tornja.",
};

describe("Gemini coach provider", () => {
  it("uses the reviewed stable model and structured JSON output", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const fetchMock: typeof fetch = async (input, init) => {
      calls.push([input, init]);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(advice) }] } }],
        usageMetadata: { promptTokenCount: 21, candidatesTokenCount: 14, totalTokenCount: 35 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const provider = new GeminiCoachProvider("server-only-test-key", fetchMock);

    const result = await provider.generate(statistics, {
      signal: new AbortController().signal,
      attempt: 1,
    });

    expect(result).toEqual({
      output: advice,
      tokenUsage: { inputTokens: 21, outputTokens: 14, totalTokens: 35 },
    });
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0]!;
    expect(String(url)).toContain(`/models/${GEMINI_MODEL}:generateContent`);
    expect(String(url)).not.toContain("server-only-test-key");
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("server-only-test-key");
    const body = JSON.parse(String(init?.body));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema.required).toContain("biggestMistakeFloor");
    expect(body.generationConfig.responseJsonSchema.properties.biggestMistakeFloor.type).toBe("integer");
  });

  it.each([
    [429, true],
    [500, true],
    [400, false],
    [403, false],
  ])("classifies HTTP %i retryability", async (status, retryable) => {
    const provider = new GeminiCoachProvider("server-only-test-key", async () => (
      new Response("private provider detail", { status })
    ));

    try {
      await provider.generate(statistics, { signal: new AbortController().signal, attempt: 1 });
      throw new Error("Expected provider failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError);
      expect((error as ProviderError).retryable).toBe(retryable);
      expect((error as Error).message).not.toContain("private provider detail");
    }
  });

  it("treats malformed provider JSON as deterministic", async () => {
    const provider = new GeminiCoachProvider("server-only-test-key", async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "not-json" }] } }],
    }), { status: 200 }));

    await expect(provider.generate(statistics, {
      signal: new AbortController().signal,
      attempt: 1,
    })).rejects.toMatchObject({ retryable: false });
  });
});

describe("server-only provider configuration", () => {
  it("uses fake mode by default without a key", () => {
    const provider = createCoachProvider({});
    expect(provider.name).toBe("fake");
  });

  it("requires the Gemini key only in live mode", () => {
    expect(() => createCoachProvider({ AI_COACH_PROVIDER: "gemini" })).toThrow(
      "GEMINI_API_KEY is required",
    );
  });

  it("constructs Gemini only from server environment values", () => {
    const provider = createCoachProvider({
      AI_COACH_PROVIDER: "gemini",
      GEMINI_API_KEY: "server-only-test-key",
    });
    expect(provider.name).toBe("gemini");
    expect(provider.model).toBe(GEMINI_MODEL);
    expect(JSON.stringify(provider)).not.toContain("server-only-test-key");
  });
});
