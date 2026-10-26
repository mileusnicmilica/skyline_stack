import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createCoachServer } from "../../server/index";
import type { AgentProvider } from "../../server/agent/types";
import { fakeAgentProvider } from "../../server/providers/fake-agent-provider";
import { fakeCoachProvider } from "../../server/providers/fake-provider";

const clientConstructedRun = {
  goal: "choose_next_drill", finalScore: 2, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 10, direction: 1, timing: "late", widthBefore: 90, widthAfter: 80 },
    { floor: 3, offsetPx: 80, direction: 1, timing: "late", widthBefore: 80, widthAfter: 0 },
  ],
};

async function withServer(provider: AgentProvider, run: (url: string) => Promise<void>) {
  const server = createCoachServer(fakeCoachProvider, {}, {}, provider);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
}

describe("W08 T15 browser-controlled game data", () => {
  it("allows only unverified advice from a consistent client-created run and denies a verification claim", async () => {
    const generate = vi.fn(fakeAgentProvider.generate);
    await withServer({ ...fakeAgentProvider, generate }, async (url) => {
      const post = (body: unknown) => fetch(`${url}/api/ai/next-drill`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const claimed = await post({ ...clientConstructedRun, verified: true });
      expect(claimed.status).toBe(400);
      expect(await claimed.json()).toMatchObject({ errorCode: "INVALID_REQUEST" });
      expect(generate).not.toHaveBeenCalled();

      const advice = await post(clientConstructedRun);
      expect(advice.status).toBe(200);
      const payload = await advice.json();
      expect(Object.keys(payload).sort()).toEqual(["recommendation", "success"]);
      expect(payload.recommendation.drillId).toBe("release_earlier");
      expect(payload.recommendation.evidence.lateCount).toBe(3);
      expect(payload.recommendation).not.toHaveProperty("verified");
      expect(payload.recommendation).not.toHaveProperty("rank");
      expect(payload.recommendation).not.toHaveProperty("finalScore");
      expect(generate).toHaveBeenCalledTimes(2);
    });
  });
});
