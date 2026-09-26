import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { coachRun } from "./coach/analysis";
import type { CoachProvider } from "./coach/types";

const HOST = "127.0.0.1";
const PORT = Number(process.env.API_PORT ?? 3001);
const PATH = "/api/ai/coach";
const HEALTH_PATH = "/api/health";
const MAX_BODY_BYTES = 64 * 1024;
const SAFE_MESSAGE = "AI analiza trenutno nije dostupna.";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_BODY_BYTES) throw new RangeError("body-too-large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createCoachServer(provider: CoachProvider) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${HOST}`);
      if (url.pathname === HEALTH_PATH && request.method === "GET") {
        sendJson(response, 200, { status: "ok" });
        return;
      }
      if (url.pathname !== PATH) {
        sendJson(response, 404, { success: false, message: SAFE_MESSAGE });
        return;
      }
      if (request.method !== "POST") {
        response.setHeader("allow", "POST");
        sendJson(response, 405, { success: false, message: SAFE_MESSAGE });
        return;
      }
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] ?? "")) {
        sendJson(response, 400, { success: false, message: SAFE_MESSAGE });
        return;
      }

      let input: unknown;
      try {
        input = await readJson(request);
      } catch (error) {
        sendJson(response, error instanceof RangeError ? 413 : 400, {
          success: false,
          message: SAFE_MESSAGE,
        });
        return;
      }

      const result = await coachRun(input, provider);
      if (!result.ok) {
        sendJson(response, result.kind === "invalid-request" ? 400 : 503, {
          success: false,
          message: SAFE_MESSAGE,
        });
        return;
      }
      sendJson(response, 200, { success: true, advice: result.advice });
    } catch {
      if (!response.writableEnded && !response.headersSent) {
        sendJson(response, 503, { success: false, message: SAFE_MESSAGE });
      } else if (!response.writableEnded) {
        response.end();
      }
    }
  });
}

export const coachServerConfig = { host: HOST, port: PORT };
