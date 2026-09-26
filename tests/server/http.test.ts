import { once } from "node:events";
import { describe, expect, it } from "vitest";

import { createCoachServer } from "../../server/index";
import { fakeCoachProvider } from "../../server/providers/fake-provider";
import type { CoachProvider } from "../../server/coach/types";

async function withServer(
  run: (url: string) => Promise<void>,
  provider: CoachProvider = fakeCoachProvider,
): Promise<void> {
  const server = createCoachServer(provider);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP address");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

describe("coach HTTP contract", () => {
  it("answers the local health route without a provider call", async () => {
    let providerCalls = 0;
    const provider: CoachProvider = {
      async generate() {
        providerCalls += 1;
        throw new Error("Health checks must not reach the provider");
      },
    };
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/health`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: "ok" });
    }, provider);
    expect(providerCalls).toBe(0);
  });

  it("rejects wrong methods and routes with safe responses", async () => {
    await withServer(async (url) => {
      const method = await fetch(`${url}/api/ai/coach`);
      expect(method.status).toBe(405);
      expect(method.headers.get("allow")).toBe("POST");
      expect(await method.json()).toEqual({ success: false, message: "AI analiza trenutno nije dostupna." });

      const route = await fetch(`${url}/not-the-coach`);
      expect(route.status).toBe(404);
      expect(await route.json()).toEqual({ success: false, message: "AI analiza trenutno nije dostupna." });
    });
  });

  it("rejects wrong content type and malformed JSON without exposing parse errors", async () => {
    await withServer(async (url) => {
      const contentType = await fetch(`${url}/api/ai/coach`, { method: "POST", body: "{}" });
      expect(contentType.status).toBe(400);
      expect(await contentType.json()).toEqual({ success: false, message: "AI analiza trenutno nije dostupna." });

      const malformed = await fetch(`${url}/api/ai/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{private parse detail",
      });
      expect(malformed.status).toBe(400);
      expect(await malformed.json()).toEqual({ success: false, message: "AI analiza trenutno nije dostupna." });
    });
  });

  it("bounds request bytes before parsing and returns a stable 413", async () => {
    await withServer(async (url) => {
      const oversized = await fetch(`${url}/api/ai/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: `{"padding":"${"x".repeat(70_000)}"}`,
      });
      expect(oversized.status).toBe(413);
      expect(await oversized.json()).toEqual({ success: false, message: "AI analiza trenutno nije dostupna." });
    });
  });

  it("returns only validated fake-provider advice for a valid run", async () => {
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/ai/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          finalScore: 1,
          startingWidth: 100,
          drops: [
            { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
            { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
          ],
        }),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        advice: {
          headline: "Pusti malo ranije",
          timingBias: "late",
          biggestMistakeFloor: 2,
          tip: "Na spratu 2 fokusiraj se na centar tornja pre puštanja.",
        },
      });
    });
  });

  it("does not expose provider exceptions", async () => {
    const privateProvider: CoachProvider = {
      async generate() { throw new Error("private key and provider payload"); },
    };
    await withServer(async (url) => {
      const response = await fetch(`${url}/api/ai/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          finalScore: 1,
          startingWidth: 100,
          drops: [
            { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
            { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
          ],
        }),
      });
      const body = await response.text();
      expect(response.status).toBe(503);
      expect(body).toBe(JSON.stringify({ success: false, message: "AI analiza trenutno nije dostupna." }));
      expect(body).not.toContain("private key");
    }, privateProvider);
  });
});
