import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createProductionCoachHandler } from "../../api/ai/coach.js";
import { fakeCoachProvider } from "../../server/providers/fake-provider.js";

const validBody = JSON.stringify({
  finalScore: 1,
  startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
});

class CapturedResponse {
  statusCode = 0;
  headersSent = false;
  writableEnded = false;
  body = "";
  headers: Record<string, string | number> = {};

  writeHead(status: number, headers: Record<string, string | number>) {
    this.statusCode = status;
    this.headers = { ...this.headers, ...headers };
    this.headersSent = true;
    return this;
  }

  setHeader(name: string, value: string | number) {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  end(body?: string) {
    this.body = body ?? "";
    this.writableEnded = true;
    return this;
  }
}

function productionRequest(): IncomingMessage {
  const request = Readable.from([validBody]) as unknown as IncomingMessage;
  Object.assign(request, {
    method: "POST",
    url: "/api/ai/coach",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.40",
    },
    socket: { remoteAddress: "127.0.0.1" },
  });
  return request;
}

describe("production /api/ai/coach rate limit", () => {
  it("allows five requests and returns 429 on the sixth before calling the provider", async () => {
    const generate = vi.fn(fakeCoachProvider.generate);
    const handler = createProductionCoachHandler({ ...fakeCoachProvider, generate });
    const responses: CapturedResponse[] = [];

    for (let index = 0; index < 6; index += 1) {
      const response = new CapturedResponse();
      responses.push(response);
      await handler(productionRequest(), response as unknown as ServerResponse);
    }

    expect(responses.slice(0, 5).map((response) => response.statusCode)).toEqual([200, 200, 200, 200, 200]);
    expect(responses[5]?.statusCode).toBe(429);
    expect(responses[5]?.headers["retry-after"]).toBe("600");
    expect(responses[5]?.body).toBe(JSON.stringify({ success: false, message: "AI analiza trenutno nije dostupna." }));
    expect(generate).toHaveBeenCalledTimes(5);
  });
});
