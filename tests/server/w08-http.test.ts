import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import { evaluateDrill } from "../../server/agent/evaluate-drill";
import type { AgentExecutionOptions, AgentProvider, AgentUsage } from "../../server/agent/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import type { RequestRateLimiter } from "../../server/rate-limit";

const validRun = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};
const noLimit: RequestRateLimiter = { allow: () => ({ allowed: true }) };

async function withServer(
  run: (url: string) => Promise<void>,
  agentProvider: AgentProvider = fakeAgentProvider,
  agentRateLimiter?: RequestRateLimiter,
  agentOptions: AgentExecutionOptions = {},
): Promise<void> {
  const server = createCoachServer(fakeCoachProvider, {}, agentRateLimiter ? { agentRateLimiter } : {}, agentProvider, agentOptions);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
}

function send(url: string, body: string, headers: Record<string, string> = {}) {
  return fetch(`${url}/api/ai/next-drill`, {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body,
  });
}

describe("W08 HTTP ingress", () => {
  it("T00 accepts a normal run and preserves two decisions with one useful tool", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const tool = vi.fn(evaluateDrill);
    let observedUsage: AgentUsage | undefined;
    const initialRun = JSON.stringify(validRun);
    await withServer(async (url) => {
      const response = await send(url, JSON.stringify(validRun));
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.recommendation.drillId).toBe("release_earlier");
      expect(payload.recommendation.evidence.lateCount).toBe(2);
      expect(payload.recommendation.stopReason).toBe("goal_completed");
    }, { ...fakeAgentProvider, generate }, undefined, {
      tool, onUsage: (usage) => { observedUsage = usage; },
    });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(tool).toHaveBeenCalledTimes(1);
    expect(observedUsage?.stepCount).toBe(2);
    expect(observedUsage?.toolCallCount).toBe(1);
    expect(JSON.stringify(validRun)).toBe(initialRun);
  });

  it("T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const invalid = [
      "{", JSON.stringify({ ...validRun, goal: null }),
      JSON.stringify({ ...validRun, goal: "admin" }),
      JSON.stringify({ ...validRun, finalScore: "1" }),
      JSON.stringify({ ...validRun, finalScore: 2 }),
      JSON.stringify({ ...validRun, finalScore: -1 }),
      JSON.stringify({ ...validRun, finalScore: 501 }),
      JSON.stringify(validRun).replace('"finalScore":1', '"finalScore":1e309'),
      JSON.stringify({ ...validRun, role: "admin" }),
      JSON.stringify({ ...validRun, model: "unsafe" }),
      JSON.stringify({ ...validRun, provider: "unsafe" }),
      JSON.stringify({ ...validRun, ownerId: "other" }),
      JSON.stringify({ ...validRun, resourceId: "another-run" }),
      JSON.stringify({ ...validRun, maxSteps: 99 }),
      JSON.stringify({ ...validRun, drops: null }),
      JSON.stringify({ ...validRun, drops: [{ ...validRun.drops[0], extra: true }, validRun.drops[1]] }),
    ];
    await withServer(async (url) => {
      for (const body of invalid) {
        const response = await send(url, body);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ success: false, errorCode: "INVALID_REQUEST" });
      }
      const missing = { ...validRun } as Record<string, unknown>;
      delete missing.drops;
      const response = await send(url, JSON.stringify(missing));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ success: false, errorCode: "INVALID_REQUEST" });
    }, { ...fakeAgentProvider, generate }, noLimit);
    expect(generate).not.toHaveBeenCalled();
  });

  it("T01 accepts the 4096 px AI boundary and rejects larger width or offset", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const boundary = {
      goal: "choose_next_drill", finalScore: 0, startingWidth: 4_096,
      drops: [{ floor: 1, offsetPx: 4_096, direction: 1, timing: "late", widthBefore: 4_096, widthAfter: 0 }],
    };
    await withServer(async (url) => {
      const accepted = await send(url, JSON.stringify(boundary));
      expect(accepted.status).toBe(200);
      const tooWide = await send(url, JSON.stringify({
        ...boundary, startingWidth: 4_097,
        drops: [{ ...boundary.drops[0], offsetPx: 4_097, widthBefore: 4_097 }],
      }));
      expect(tooWide.status).toBe(400);
      expect(await tooWide.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      const tooFar = await send(url, JSON.stringify({
        ...boundary, drops: [{ ...boundary.drops[0], offsetPx: 4_097 }],
      }));
      expect(tooFar.status).toBe(400);
      expect(await tooFar.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
    }, { ...fakeAgentProvider, generate });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("T01 returns stable method and content-type errors with no provider effect", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      const wrongMethod = await fetch(`${url}/api/ai/next-drill`);
      expect(wrongMethod.status).toBe(405);
      expect(wrongMethod.headers.get("allow")).toBe("POST");
      expect(await wrongMethod.json()).toMatchObject({ errorCode: "METHOD_NOT_ALLOWED" });
      const wrongType = await send(url, JSON.stringify(validRun), { "content-type": "text/plain" });
      expect(wrongType.status).toBe(400);
      expect(await wrongType.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      const malformedType = await send(url, JSON.stringify(validRun), { "content-type": "application/json; bogus=1" });
      expect(malformedType.status).toBe(400);
      expect(await malformedType.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
    }, { ...fakeAgentProvider, generate });
    expect(generate).not.toHaveBeenCalled();
  });

  it("T01 enforces 64 KiB UTF-8 bytes before JSON parsing, including the exact boundary", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    const serialized = JSON.stringify(validRun);
    const boundary = serialized + " ".repeat(65_536 - Buffer.byteLength(serialized));
    expect(Buffer.byteLength(boundary)).toBe(65_536);
    await withServer(async (url) => {
      const accepted = await send(url, boundary);
      expect(accepted.status).toBe(200);
      const denied = await send(url, `${boundary} `);
      expect(denied.status).toBe(413);
      expect(await denied.json()).toMatchObject({ success: false, errorCode: "REQUEST_TOO_LARGE" });
    }, { ...fakeAgentProvider, generate });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("T01 stops a stalled body at five seconds with zero provider calls", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const request = httpRequest(`${url}/api/ai/next-drill`, {
          method: "POST", headers: { "content-type": "application/json" },
        }, async (incoming) => {
          let body = "";
          for await (const chunk of incoming) body += chunk.toString();
          resolve({ status: incoming.statusCode ?? 0, body });
          request.destroy();
        });
        request.on("error", reject);
        request.write("{");
      });
      expect(response.status).toBe(408);
      expect(JSON.parse(response.body)).toMatchObject({ errorCode: "REQUEST_TIMEOUT" });
    }, { ...fakeAgentProvider, generate });
    expect(generate).not.toHaveBeenCalled();
  }, 8_000);

  it("Origin applicability: a second origin is denied while same-origin JSON succeeds", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      const preflight = await fetch(`${url}/api/ai/next-drill`, {
        method: "OPTIONS", headers: { origin: "http://127.0.0.1:8181", "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
      });
      expect(preflight.status).toBe(405);
      expect(preflight.headers.get("access-control-allow-origin")).toBeNull();
      const simple = await fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { origin: "http://127.0.0.1:8181", "content-type": "text/plain" },
        body: JSON.stringify(validRun),
      });
      expect(simple.status).toBe(400);
      expect(await simple.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      const directJson = await send(url, JSON.stringify(validRun), { origin: "http://127.0.0.1:8181" });
      expect(directJson.status).toBe(400);
      expect(await directJson.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      const sameOrigin = await send(url, JSON.stringify(validRun), { origin: url });
      expect(sameOrigin.status).toBe(200);
    }, { ...fakeAgentProvider, generate });
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
