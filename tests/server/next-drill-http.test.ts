import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import type { AgentProvider } from "../../server/agent/types";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { createRequestRateLimiter, type RequestRateLimiter } from "../../server/rate-limit";
import { ProviderError } from "../../server/providers/provider-error";

const body = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

async function withServer(
  run: (url: string) => Promise<void>,
  agentProvider: AgentProvider = fakeAgentProvider,
  limits: { rateLimiter?: RequestRateLimiter; agentRateLimiter?: RequestRateLimiter } = {},
) {
  const server = createCoachServer(fakeCoachProvider, {}, limits, agentProvider);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TCP address expected");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.close(); await once(server, "close"); }
}

describe("next drill HTTP contract", () => {
  it("returns one grounded recommendation while preserving coach route", async () => {
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.recommendation.drillId).toBe("release_earlier");
      expect(result.recommendation.evidence.lateCount).toBe(2);
      expect(result.recommendation.stopReason).toBe("goal_completed");
      const health = await fetch(`${url}/api/health`);
      expect(health.status).toBe(200);
    });
  });

  it("rejects invalid initial input without any agent call", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, finalScore: 9 }),
      });
      expect(response.status).toBe(400);
      expect((await response.json()).message).toBe("Sledeća vežba trenutno nije dostupna.");
    }, { ...fakeAgentProvider, generate });
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns safe method/content-type errors", async () => {
    await withServer(async (url) => {
      const method = await fetch(`${url}/api/ai/next-drill`);
      expect(method.status).toBe(405);
      expect(method.headers.get("allow")).toBe("POST");
      const type = await fetch(`${url}/api/ai/next-drill`, { method: "POST", body: "{}" });
      expect(type.status).toBe(400);
    });
  });

  it("rate-limits W05 before another provider call without consuming W04's quota", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const limits = {
      rateLimiter: createRequestRateLimiter({ limit: 1, windowMs: 60_000 }),
      agentRateLimiter: createRequestRateLimiter({ limit: 1, windowMs: 60_000 }),
    };
    await withServer(async (url) => {
      const sendAgent = (forwardedFor: string) => fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": forwardedFor }, body: JSON.stringify(body),
      });
      expect((await sendAgent("203.0.113.1")).status).toBe(200);
      const limited = await sendAgent("203.0.113.2");
      expect(limited.status).toBe(429);
      expect(limited.headers.get("retry-after")).toBe("60");
      expect(await limited.json()).toEqual({ success: false, message: "Sledeća vežba trenutno nije dostupna." });
      expect(generate).toHaveBeenCalledTimes(2);

      const { goal: _goal, ...coachBody } = body;
      const coach = await fetch(`${url}/api/ai/coach`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(coachBody),
      });
      expect(coach.status).toBe(200);
    }, { ...fakeAgentProvider, generate }, limits);
  });

  it("returns a safe 429 for an upstream provider rate limit", async () => {
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      expect(response.status).toBe(429);
      expect(await response.json()).toMatchObject({
        success: false, message: "Sledeća vežba trenutno nije dostupna.", stopReason: "provider_rate_limit",
      });
    }, {
      name: "fake", model: "rate-limit-fixture",
      async generate() { throw new ProviderError("upstream secret detail", false, "rate_limit"); },
    });
  });
});
