import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import { runNextDrill } from "../../server/agent/run";
import { recordAgentSecurityEvent, recordAgentUsage, type AgentSecurityEvent } from "../../server/agent/usage";
import { createAgentProvider } from "../../server/providers/agent-provider-config";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import { ProviderError } from "../../server/providers/provider-error";
import { recordHttpSecurityEvent, type HttpSecurityEvent } from "../../server/http-security-events";
import type { AgentModelContext } from "../../server/agent/types";
import { w08Run } from "./w08-fixtures";

const SENTINEL = "W08_SERVER_SECRET_DO_NOT_EXPOSE";

describe("W08 secret and event boundary", () => {
  it("T14 loads a synthetic server credential without placing its value in model context", async () => {
    let sentBody = "";
    let loadedHeader = "";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      sentBody = String(options.body);
      loadedHeader = (options.headers as Record<string, string>)["x-goog-api-key"] ?? "";
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        action: "call_tool", tool: "evaluate_drill", args: { drillId: "release_earlier" },
      }) }] } }] });
    }));
    try {
      const provider = createAgentProvider({ AI_COACH_PROVIDER: "gemini", GEMINI_API_KEY: SENTINEL });
      const context: AgentModelContext = {
        goal: "choose_next_drill", finalScore: 1, earlyCount: 0, lateCount: 2,
        centeredCount: 0, step: 1, evidence: [],
      };
      const result = await provider.generate(context, { signal: new AbortController().signal, attempt: 1 });
      expect(result.output).toMatchObject({ action: "call_tool" });
      expect(loadedHeader).toBe(SENTINEL);
      expect(sentBody).not.toContain(SENTINEL);
      expect(JSON.stringify(context)).not.toContain(SENTINEL);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("T14 adapter errors and forged event fields do not leak or create a second log line", async () => {
    const output: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    try {
      const events: AgentSecurityEvent[] = [];
      const result = await runNextDrill(w08Run, {
        name: "fake", model: "synthetic", generate: async () => {
          throw new ProviderError(`upstream ${SENTINEL}\nFORGED_EVENT`, false);
        },
      }, { onSecurityEvent: (event) => {
        events.push(event);
        recordAgentSecurityEvent({ ...event, rawPrompt: `\nFORGED_EVENT ${SENTINEL}` } as AgentSecurityEvent);
      } });
      expect(result.ok).toBe(false);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ event: "agent_completion", providerAttempts: 1, toolCalls: 0 });
      expect(output).toHaveLength(1);
      expect(output[0]?.split("\n")).toHaveLength(2);
      expect(output[0]).not.toContain(SENTINEL);
      expect(output[0]).not.toContain("FORGED_EVENT");
      expect(JSON.stringify(result)).not.toContain(SENTINEL);
    } finally {
      write.mockRestore();
    }
  });

  it("T14 joins server-generated HTTP and agent trace IDs on a normal request", async () => {
    const httpEvents: HttpSecurityEvent[] = [];
    const agentEvents: AgentSecurityEvent[] = [];
    const server = createCoachServer(fakeCoachProvider, {}, {
      agentRateLimiter: { allow: () => ({ allowed: true }) },
      onAgentSecurityEvent: (event) => httpEvents.push(event),
    }, fakeAgentProvider, { onSecurityEvent: (event) => agentEvents.push(event) });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address");
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(w08Run),
      });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(agentEvents).toHaveLength(1);
      expect(agentEvents[0]?.correlationId).toBe(response.headers.get("x-correlation-id"));
      expect(agentEvents[0]?.runId).toBe(body.recommendation.runId);
      expect(httpEvents.some((event) => event.event === "completion" && event.outcome === "success")).toBe(true);
    } finally {
      server.closeAllConnections();
      server.close();
      await once(server, "close");
    }
  });

  it("T14 keeps a synthetic adapter error out of the public response and operational logs", async () => {
    const logged: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      logged.push(String(chunk));
      return true;
    });
    const generate = vi.fn(async () => { throw new ProviderError(`adapter ${SENTINEL}`, false); });
    const server = createCoachServer(fakeCoachProvider, {}, {
      agentRateLimiter: { allow: () => ({ allowed: true }) },
      onAgentSecurityEvent: recordHttpSecurityEvent,
    }, { name: "fake", model: "synthetic", generate }, {
      onUsage: recordAgentUsage, onSecurityEvent: recordAgentSecurityEvent,
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address");
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(w08Run),
      });
      const body = await response.text();
      expect(response.status).toBe(503);
      expect(body).not.toContain(SENTINEL);
      expect(body).toContain("AGENT_UNAVAILABLE");
      expect(generate).toHaveBeenCalledTimes(1);
      expect(logged.join("")).not.toContain(SENTINEL);
      expect(logged.some((line) => line.startsWith("[w08-agent-security]"))).toBe(true);
    } finally {
      server.closeAllConnections();
      server.close();
      await once(server, "close");
      write.mockRestore();
    }
  });
});
