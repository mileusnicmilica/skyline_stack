import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import type { AgentProvider } from "../../server/agent/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import { recordHttpSecurityEvent, type HttpSecurityEvent } from "../../server/http-security-events";

const validRun = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

async function withServer(
  run: (url: string) => Promise<void>,
  events: HttpSecurityEvent[],
  provider: AgentProvider = fakeAgentProvider,
): Promise<void> {
  const server = createCoachServer(fakeCoachProvider, {}, {
    onAgentSecurityEvent: (event) => { events.push(event); },
  }, provider);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
}

function send(url: string, input: unknown, headers: Record<string, string> = {}) {
  return fetch(`${url}/api/ai/next-drill`, {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(input),
  });
}

function expectSafeShape(event: HttpSecurityEvent): void {
  expect(Object.keys(event).sort()).toEqual([
    "correlationId", "event", "outcome", "providerAttempts", "reason", "timestamp", "toolCalls",
  ]);
  expect(event.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
}

describe("W08 HTTP security events", () => {
  it("emits bounded admission and completion events for a grounded normal run", async () => {
    const events: HttpSecurityEvent[] = [];
    await withServer(async (url) => {
      const response = await send(url, validRun);
      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
      expect(response.headers.get("x-correlation-id")).toBe(events[0]?.correlationId);
    }, events);
    expect(events).toHaveLength(2);
    for (const event of events) expectSafeShape(event);
    expect(events[0]).toMatchObject({ event: "admission", outcome: "admitted", reason: "ACCEPTED", providerAttempts: 0, toolCalls: 0 });
    expect(events[1]).toMatchObject({ event: "completion", outcome: "success", reason: "GOAL_COMPLETED", providerAttempts: 2, toolCalls: 1 });
    expect(events[1]?.correlationId).toBe(events[0]?.correlationId);
  });

  it("rejects newline log injection before work and never copies input into an event", async () => {
    const events: HttpSecurityEvent[] = [];
    const marker = "INJECTED_EVENT_SENTINEL";
    const suppliedId = "00000000-0000-4000-8000-000000000000";
    await withServer(async (url) => {
      const response = await send(url, { ...validRun, ownerId: `other\n[w08-security] ${marker}` }, {
        "x-correlation-id": suppliedId,
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      expect(response.headers.get("x-correlation-id")).toBe(events[0]?.correlationId);
      expect(response.headers.get("x-correlation-id")).not.toBe(suppliedId);
    }, events);
    expect(events).toHaveLength(1);
    expectSafeShape(events[0]!);
    expect(events[0]).toMatchObject({ event: "denial", outcome: "denied", reason: "INVALID_REQUEST", providerAttempts: 0, toolCalls: 0 });
    expect(JSON.stringify(events)).not.toContain(marker);
    expect(JSON.stringify(events)).not.toContain("ownerId");
  });

  it("logs the global window denial with zero work despite forged forwarding headers", async () => {
    const events: HttpSecurityEvent[] = [];
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      for (let index = 0; index < 5; index += 1) {
        const response = await send(url, { ...validRun, ownerId: index }, {
          "x-forwarded-for": `203.0.113.${index + 1}`,
        });
        expect(response.status).toBe(400);
      }
      const response = await send(url, validRun, { "x-forwarded-for": "198.51.100.90" });
      expect(response.status).toBe(429);
      expect(await response.json()).toMatchObject({ errorCode: "RATE_LIMITED" });
    }, events, { ...fakeAgentProvider, generate });
    expect(generate).not.toHaveBeenCalled();
    expect(events).toHaveLength(6);
    expect(events[5]).toMatchObject({
      event: "denial", outcome: "denied", reason: "RATE_LIMITED", providerAttempts: 0, toolCalls: 0,
    });
  });

  it("maps a provider exception to safe 503 and bounded completion counters", async () => {
    const events: HttpSecurityEvent[] = [];
    const marker = "PROVIDER_PRIVATE_SENTINEL";
    await withServer(async (url) => {
      const response = await send(url, validRun);
      expect(response.status).toBe(503);
      const body = await response.text();
      expect(JSON.parse(body)).toMatchObject({ success: false, errorCode: "AGENT_UNAVAILABLE" });
      expect(body).not.toContain(marker);
    }, events, {
      name: "fake", model: "error-case",
      async generate() { throw new Error(`private detail: ${marker}`); },
    });
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      event: "completion", outcome: "failure", reason: "AGENT_UNAVAILABLE", providerAttempts: 1, toolCalls: 0,
    });
    expect(JSON.stringify(events)).not.toContain(marker);
  });

  it("sanitizes runtime event values before writing one structured log line", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const forged = {
        correlationId: "client\nforged-id", timestamp: "not-time\nforged", event: "completion",
        outcome: "failure", reason: "INVALID_REQUEST\nFORGED_LINE", providerAttempts: 999,
        toolCalls: -10, rawBody: "PRIVATE_EXTRA_FIELD",
      } as unknown as HttpSecurityEvent;
      recordHttpSecurityEvent(forged);
      expect(write).toHaveBeenCalledTimes(1);
      const line = String(write.mock.calls[0]?.[0]);
      expect(line).toMatch(/^\[w08-security\] \{[^\n]*\}\n$/);
      expect(line).not.toContain("FORGED_LINE");
      expect(line).not.toContain("PRIVATE_EXTRA_FIELD");
      expect(JSON.parse(line.slice("[w08-security] ".length))).toMatchObject({
        event: "completion", outcome: "failure", reason: "AGENT_UNAVAILABLE", providerAttempts: 4, toolCalls: 0,
      });
    } finally { write.mockRestore(); }
  });
});
