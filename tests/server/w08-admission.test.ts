import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import { createAgentAdmission } from "../../server/admission";
import type { AgentProvider } from "../../server/agent/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { GeminiAgentProvider } from "../../server/providers/gemini-agent-provider";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import { createRequestRateLimiter } from "../../server/rate-limit";
import { finalCall, toolCall } from "./w08-fixtures";

const validRun = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

async function withServer(
  run: (url: string) => Promise<void>,
  provider: AgentProvider,
  options: Parameters<typeof createCoachServer>[2] = {},
  executionOptions: Parameters<typeof createCoachServer>[4] = {},
): Promise<void> {
  const server = createCoachServer(fakeCoachProvider, {}, options, provider, executionOptions);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
}

function send(url: string, value: unknown, forwardedFor?: string) {
  return fetch(`${url}/api/ai/next-drill`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
    },
    body: JSON.stringify(value),
  });
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const until = Date.now() + 2_000;
  while (!predicate()) {
    if (Date.now() >= until) throw new Error("Timed out waiting for provider state");
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}

describe("W08 local HTTP admission", () => {
  it("T13 limits actual parallel work to two, rejects valid excess work, and recovers", async () => {
    const gates: Array<() => void> = [];
    let active = 0;
    let maximum = 0;
    const generate = vi.fn<AgentProvider["generate"]>(async (context, options) => {
      if (context.step === 1 && gates.length < 2) {
        active += 1;
        maximum = Math.max(maximum, active);
        await new Promise<void>((resolve) => { gates.push(resolve); });
        active -= 1;
      }
      return fakeAgentProvider.generate(context, options);
    });
    await withServer(async (url) => {
      const first = send(url, validRun);
      const second = send(url, validRun);
      await waitFor(() => gates.length === 2);

      const invalid = await send(url, { ...validRun, role: "admin" });
      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });

      const excess = await send(url, validRun);
      expect(excess.status).toBe(429);
      expect(await excess.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });
      expect(generate).toHaveBeenCalledTimes(2);

      gates[0]?.();
      expect((await first).status).toBe(200);
      const recovered = await send(url, validRun);
      expect(recovered.status).toBe(200);
      gates[1]?.();
      expect((await second).status).toBe(200);
    }, { ...fakeAgentProvider, generate });
    expect(maximum).toBe(2);
  });

  it("T12 retains capacity after a timeout until abort-ignoring provider work settles", async () => {
    const pending: Array<() => void> = [];
    let calls = 0;
    const generate = vi.fn<AgentProvider["generate"]>(async (context, options) => {
      calls += 1;
      if (calls === 1) await new Promise<void>((resolve) => { pending.push(resolve); });
      return fakeAgentProvider.generate(context, options);
    });
    const admission = createAgentAdmission(1);
    await withServer(async (url) => {
      const timedOut = await send(url, validRun);
      expect(timedOut.status).toBe(504);
      expect(await timedOut.json()).toMatchObject({ errorCode: "AGENT_TIMEOUT" });
      expect(pending).toHaveLength(1);
      expect(admission.active()).toBe(1);

      const blocked = await send(url, validRun);
      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });
      expect(generate).toHaveBeenCalledTimes(1);

      pending.forEach((resolve) => resolve());
      await waitFor(() => admission.active() === 0);
      const recovered = await send(url, validRun);
      expect(recovered.status).toBe(200);
      expect((await recovered.json()).recommendation.drillId).toBe("release_earlier");
    }, { ...fakeAgentProvider, generate }, { agentAdmission: admission }, {
      attemptTimeoutMs: 15, retryDelayMs: 1, totalDeadlineMs: 100,
    });
  });

  it("T12/T13 never overlaps timeout retries across two abort-ignoring admitted runs", async () => {
    const pending: Array<() => void> = [];
    let hold = true;
    let active = 0;
    let peak = 0;
    const generate = vi.fn<AgentProvider["generate"]>(async (context, options) => {
      active += 1;
      peak = Math.max(peak, active);
      try {
        if (hold) await new Promise<void>((resolve) => { pending.push(resolve); });
        return await fakeAgentProvider.generate(context, options);
      } finally {
        active -= 1;
      }
    });
    const admission = createAgentAdmission(2);
    await withServer(async (url) => {
      try {
        const responses = await Promise.all([send(url, validRun), send(url, validRun)]);
        for (const response of responses) {
          expect(response.status).toBe(504);
          expect(await response.json()).toMatchObject({ errorCode: "AGENT_TIMEOUT" });
        }
        expect(generate).toHaveBeenCalledTimes(2);
        expect(pending).toHaveLength(2);
        expect(peak).toBe(2);
        expect(active).toBe(2);
        expect(admission.active()).toBe(2);

        const blocked = await send(url, validRun);
        expect(blocked.status).toBe(429);
        expect(await blocked.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });
        expect(generate).toHaveBeenCalledTimes(2);

        hold = false;
        pending.forEach((resolve) => resolve());
        await waitFor(() => admission.active() === 0 && active === 0);
        const recovered = await send(url, validRun);
        expect(recovered.status).toBe(200);
        expect((await recovered.json()).recommendation.drillId).toBe("release_earlier");
        expect(peak).toBe(2);
      } finally {
        hold = false;
        pending.forEach((resolve) => resolve());
      }
    }, { ...fakeAgentProvider, generate }, { agentAdmission: admission }, {
      attemptTimeoutMs: 15, retryDelayMs: 1, totalDeadlineMs: 100,
    });
  });

  it("T12 retains capacity when the browser disconnects from abort-ignoring work", async () => {
    let started!: () => void;
    let release!: () => void;
    const whenStarted = new Promise<void>((resolve) => { started = resolve; });
    const pending = new Promise<void>((resolve) => { release = resolve; });
    let calls = 0;
    const generate = vi.fn<AgentProvider["generate"]>(async (context, options) => {
      calls += 1;
      if (calls === 1) { started(); await pending; }
      return fakeAgentProvider.generate(context, options);
    });
    const admission = createAgentAdmission(1);
    const stopReasons: string[] = [];
    await withServer(async (url) => {
      const request = httpRequest(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" },
      });
      request.on("error", () => undefined);
      request.end(JSON.stringify(validRun));
      await whenStarted;
      request.destroy();
      await waitFor(() => stopReasons.includes("cancelled"));
      expect(admission.active()).toBe(1);

      const blocked = await send(url, validRun);
      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });
      expect(generate).toHaveBeenCalledTimes(1);

      release();
      await waitFor(() => admission.active() === 0);
      const recovered = await send(url, validRun);
      expect(recovered.status).toBe(200);
    }, { ...fakeAgentProvider, generate }, { agentAdmission: admission }, {
      onUsage: (usage) => { stopReasons.push(usage.stopReason); },
    });
  });

  it("T12/T13 retains capacity while an HTTP error body ignores cancellation", async () => {
    let releaseCancel: (() => void) | undefined;
    let cancelCount = 0;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelCount += 1;
        return new Promise<void>((resolve) => { releaseCancel = resolve; });
      },
    });
    let calls = 0;
    const fetchImplementation = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response(body, { status: 503 });
      const output = calls === 2 ? toolCall() : finalCall();
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
    });
    const provider = new GeminiAgentProvider("synthetic-key", fetchImplementation as typeof fetch);
    const admission = createAgentAdmission(1);

    await withServer(async (url) => {
      try {
        const timedOut = send(url, validRun);
        await waitFor(() => cancelCount === 1);
        expect((await timedOut).status).toBe(504);
        expect(admission.active()).toBe(1);

        const blocked = await send(url, validRun);
        expect(blocked.status).toBe(429);
        expect(await blocked.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });
        expect(fetchImplementation).toHaveBeenCalledTimes(1);

        releaseCancel?.();
        await waitFor(() => admission.active() === 0);
        const recovered = await send(url, validRun);
        expect(recovered.status).toBe(200);
        expect((await recovered.json()).recommendation.drillId).toBe("release_earlier");
        expect(fetchImplementation).toHaveBeenCalledTimes(3);
      } finally {
        releaseCancel?.();
      }
    }, provider, { agentAdmission: admission }, {
      attemptTimeoutMs: 15, retryDelayMs: 1, totalDeadlineMs: 100,
    });
  });

  it("T13 consumes a global five-per-minute window before body parsing, including bad JSON", async () => {
    let now = 1_000;
    const limit = createRequestRateLimiter({ limit: 5, windowMs: 60_000, scope: "global", now: () => now });
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer(async (url) => {
      for (let index = 0; index < 5; index += 1) {
        const response = await send(url, { invalid: index }, `203.0.113.${index + 1}`);
        expect(response.status).toBe(400);
      }
      const denied = await send(url, validRun, "198.51.100.90");
      expect(denied.status).toBe(429);
      expect(denied.headers.get("retry-after")).toBe("60");
      expect(await denied.json()).toMatchObject({ errorCode: "RATE_LIMITED" });
      expect(generate).not.toHaveBeenCalled();

      now += 60_000;
      const recovered = await send(url, validRun, "192.0.2.250");
      expect(recovered.status).toBe(200);
    }, { ...fakeAgentProvider, generate }, { agentRateLimiter: limit });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("T17 forged forwarding and parallel requests cannot evade either global window or active-work cap", async () => {
    const gates: Array<() => void> = [];
    const generate = vi.fn<AgentProvider["generate"]>(async (context, options) => {
      if (context.step === 1 && gates.length < 2) await new Promise<void>((resolve) => { gates.push(resolve); });
      return fakeAgentProvider.generate(context, options);
    });
    await withServer(async (url) => {
      const first = send(url, validRun, "203.0.113.1");
      const second = send(url, validRun, "203.0.113.2");
      await waitFor(() => gates.length === 2);
      const capacity = await send(url, validRun, "203.0.113.3");
      expect(capacity.status).toBe(429);
      expect(await capacity.json()).toMatchObject({ errorCode: "CONCURRENCY_LIMIT" });

      expect((await send(url, { invalid: true }, "203.0.113.4")).status).toBe(400);
      expect((await send(url, { invalid: true }, "203.0.113.5")).status).toBe(400);
      const window = await send(url, validRun, "203.0.113.6");
      expect(window.status).toBe(429);
      expect(await window.json()).toMatchObject({ errorCode: "RATE_LIMITED" });
      expect(generate).toHaveBeenCalledTimes(2);

      gates.forEach((resolve) => resolve());
      expect((await first).status).toBe(200);
      expect((await second).status).toBe(200);
    }, { ...fakeAgentProvider, generate });
  });
});
