import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { coachRun } from "./coach/analysis.js";
import type { CoachExecutionOptions, CoachProvider } from "./coach/types.js";
import { runNextDrill } from "./agent/run.js";
import { evaluateDrill } from "./agent/evaluate-drill.js";
import { parseNextDrillRequest } from "./agent/validate-request.js";
import type { AgentExecutionOptions, AgentProvider, AgentStopReason } from "./agent/types.js";
import { fakeAgentProvider } from "./providers/fake-agent-provider.js";
import { createAgentAdmission, type AgentAdmission } from "./admission.js";
import { createRequestRateLimiter } from "./rate-limit.js";
import type { RequestRateLimiter } from "./rate-limit.js";
import { createHttpSecurityEvent, newHttpCorrelationId, type HttpSecurityEvent, type HttpSecurityReason } from "./http-security-events.js";

const HOST = "127.0.0.1";
const PORT = Number(process.env.API_PORT ?? 3001);
const PATH = "/api/ai/coach";
const AGENT_PATH = "/api/ai/next-drill";
const HEALTH_PATH = "/api/health";
const MAX_BODY_BYTES = 64 * 1024;
const AGENT_BODY_TIMEOUT_MS = 5_000;
const SAFE_MESSAGE = "AI analiza trenutno nije dostupna.";
const SAFE_AGENT_MESSAGE = "Sledeća vežba trenutno nije dostupna.";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

class BodyReadTimeoutError extends Error {}

async function readJson(request: IncomingMessage, deadlineMs?: number): Promise<unknown> {
  const declared = request.headers["content-length"];
  return await new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    // Drain excess bytes without retaining or parsing them, so a client uploading the
    // last chunk can reliably receive 413 rather than an early socket reset.
    let overLimit = typeof declared === "string" && Number(declared) > MAX_BODY_BYTES;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onError);
      request.off("aborted", onAborted);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      request.pause();
      reject(error);
    };
    const onData = (chunk: Buffer | string) => {
      if (overLimit) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        overLimit = true;
        chunks.length = 0;
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (overLimit) { reject(new RangeError("body-too-large")); return; }
      try { resolve(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch (error) { reject(error); }
    };
    const onError = (error: Error) => fail(error);
    const onAborted = () => fail(new Error("body-aborted"));
    request.on("data", onData);
    request.once("end", onEnd);
    request.once("error", onError);
    request.once("aborted", onAborted);
    if (deadlineMs !== undefined) timer = setTimeout(() => fail(overLimit
      ? new RangeError("body-too-large") : new BodyReadTimeoutError("body-timeout")), deadlineMs);
    request.resume();
  });
}

type AgentErrorCode = "INVALID_REQUEST" | "METHOD_NOT_ALLOWED" | "REQUEST_TOO_LARGE" | "REQUEST_TIMEOUT"
  | "RATE_LIMITED" | "CONCURRENCY_LIMIT" | "PROVIDER_RATE_LIMITED" | "AGENT_TIMEOUT" | "AGENT_UNAVAILABLE";

function sendAgentError(response: ServerResponse, status: number, errorCode: AgentErrorCode, runId?: string): void {
  sendJson(response, status, {
    success: false, message: SAFE_AGENT_MESSAGE, errorCode,
    ...(runId === undefined ? {} : { runId }),
  });
}

function agentFailure(reason: AgentStopReason): { status: number; code: AgentErrorCode } {
  if (reason === "invalid_input") return { status: 400, code: "INVALID_REQUEST" };
  if (reason === "provider_rate_limit") return { status: 429, code: "PROVIDER_RATE_LIMITED" };
  if (reason === "deadline" || reason === "provider_timeout" || reason === "tool_timeout") {
    return { status: 504, code: "AGENT_TIMEOUT" };
  }
  return { status: 503, code: "AGENT_UNAVAILABLE" };
}

function isSameBrowserOrigin(request: IncomingMessage): boolean {
  const value = request.headers.origin;
  if (value === undefined) return true;
  if (typeof value !== "string" || typeof request.headers.host !== "string") return false;
  try {
    const origin = new URL(value);
    return (origin.protocol === "http:" || origin.protocol === "https:") &&
      origin.host.toLowerCase() === request.headers.host.toLowerCase() &&
      origin.pathname === "/" && origin.search === "" && origin.hash === "";
  } catch { return false; }
}

type CoachRequestHandlerOptions = {
  rateLimiter?: RequestRateLimiter;
  agentRateLimiter?: RequestRateLimiter;
  agentAdmission?: AgentAdmission;
  onAgentSecurityEvent?: (event: HttpSecurityEvent) => void;
};

export function createCoachServer(
  provider: CoachProvider,
  executionOptions: CoachExecutionOptions = {},
  handlerOptions: CoachRequestHandlerOptions = {},
  agentProvider: AgentProvider = fakeAgentProvider,
  agentOptions: AgentExecutionOptions = {},
) {
  return createServer(createCoachRequestHandler(provider, executionOptions, handlerOptions, agentProvider, agentOptions));
}

export function createCoachRequestHandler(
  provider: CoachProvider,
  executionOptions: CoachExecutionOptions = {},
  handlerOptions: CoachRequestHandlerOptions = {},
  agentProvider: AgentProvider = fakeAgentProvider,
  agentOptions: AgentExecutionOptions = {},
) {
  const agentRateLimiter = handlerOptions.agentRateLimiter ?? createRequestRateLimiter({
    limit: 5, windowMs: 60_000, scope: "global",
  });
  const agentAdmission = handlerOptions.agentAdmission ?? createAgentAdmission(2);
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    let safeErrorMessage = SAFE_MESSAGE;
    let isAgentRequest = false;
    let correlationId: string | undefined;
    let admitted = false;
    let eventFinished = false;
    const emit = (
      event: HttpSecurityEvent["event"], outcome: HttpSecurityEvent["outcome"], reason: HttpSecurityReason,
      providerAttempts: number | null, toolCalls: number | null,
    ) => {
      if (!correlationId) return;
      try {
        handlerOptions.onAgentSecurityEvent?.(createHttpSecurityEvent({
          correlationId, event, outcome, reason, providerAttempts, toolCalls,
        }));
      } catch { /* Logging cannot alter admission or the public response. */ }
    };
    const deny = (status: number, code: AgentErrorCode) => {
      emit("denial", "denied", code, 0, 0);
      eventFinished = true;
      sendAgentError(response, status, code);
    };
    try {
      const url = new URL(request.url ?? "/", `http://${HOST}`);
      if (url.pathname === HEALTH_PATH && request.method === "GET") {
        sendJson(response, 200, { status: "ok" });
        return;
      }
      const isAgent = url.pathname === AGENT_PATH;
      isAgentRequest = isAgent;
      if (isAgent) {
        correlationId = newHttpCorrelationId();
        response.setHeader("x-correlation-id", correlationId);
      }
      const safeMessage = isAgent ? SAFE_AGENT_MESSAGE : SAFE_MESSAGE;
      safeErrorMessage = safeMessage;
      if (url.pathname !== PATH && !isAgent) {
        sendJson(response, 404, { success: false, message: SAFE_MESSAGE });
        return;
      }
      if (request.method !== "POST") {
        response.setHeader("allow", "POST");
        if (isAgent) deny(405, "METHOD_NOT_ALLOWED");
        else sendJson(response, 405, { success: false, message: safeMessage });
        return;
      }
      if (isAgent) {
        const rateLimit = agentRateLimiter.allow(request);
        if (!rateLimit.allowed) {
          response.setHeader("retry-after", String(rateLimit.retryAfterSeconds));
          deny(429, "RATE_LIMITED");
          return;
        }
      }
      if (!/^application\/json(?:\s*;\s*charset=utf-8\s*)?$/i.test(request.headers["content-type"] ?? "")) {
        if (isAgent) deny(400, "INVALID_REQUEST");
        else sendJson(response, 400, { success: false, message: safeMessage });
        return;
      }
      if (isAgent && !isSameBrowserOrigin(request)) {
        deny(400, "INVALID_REQUEST");
        return;
      }

      const rateLimit = !isAgent ? handlerOptions.rateLimiter?.allow(request) : undefined;
      if (rateLimit && !rateLimit.allowed) {
        response.setHeader("retry-after", String(rateLimit.retryAfterSeconds));
        sendJson(response, 429, { success: false, message: safeMessage });
        return;
      }

      let input: unknown;
      try {
        input = await readJson(request, isAgent ? AGENT_BODY_TIMEOUT_MS : undefined);
      } catch (error) {
        if (response.destroyed || response.writableEnded) {
          if (isAgent) {
            emit("completion", "cancelled", "CLIENT_DISCONNECTED", 0, 0);
            eventFinished = true;
          }
          return;
        }
        if (isAgent) {
          if (error instanceof RangeError || error instanceof BodyReadTimeoutError) response.setHeader("connection", "close");
          const code = error instanceof RangeError ? "REQUEST_TOO_LARGE"
            : error instanceof BodyReadTimeoutError ? "REQUEST_TIMEOUT" : "INVALID_REQUEST";
          deny(code === "REQUEST_TOO_LARGE" ? 413 : code === "REQUEST_TIMEOUT" ? 408 : 400, code);
        } else sendJson(response, error instanceof RangeError ? 413 : 400, {
          success: false, message: safeMessage,
        });
        return;
      }

      if (isAgent) {
        if (!parseNextDrillRequest(input)) {
          deny(400, "INVALID_REQUEST");
          return;
        }
        const lease = agentAdmission.tryAcquire();
        if (!lease) {
          deny(429, "CONCURRENCY_LIMIT");
          return;
        }
        admitted = true;
        emit("admission", "admitted", "ACCEPTED", 0, 0);
        const controller = new AbortController();
        const onClose = () => controller.abort();
        response.once("close", onClose);
        try {
          const tool: NonNullable<AgentExecutionOptions["tool"]> = agentOptions.tool ?? evaluateDrill;
          const trackedProvider: AgentProvider = {
            name: agentProvider.name, model: agentProvider.model,
            generate: (context, options) => lease.track(() => agentProvider.generate(context, options)),
          };
          const result = await runNextDrill(input, trackedProvider, {
            ...agentOptions,
            ...(correlationId ? { correlationId } : {}),
            tool: (args, counts, evidenceId, signal) =>
              lease.track(() => tool(args, counts, evidenceId, signal)),
            signal: controller.signal,
          });
          const attempts = result.usage.providerAttempts;
          const calls = result.usage.toolCallCount;
          if (response.destroyed || response.writableEnded) {
            emit("completion", "cancelled", "CLIENT_DISCONNECTED", attempts, calls);
            eventFinished = true;
            return;
          }
          if (!result.ok) {
            const failure = agentFailure(result.reason);
            emit("completion", result.reason === "cancelled" ? "cancelled" : "failure",
              result.reason === "cancelled" ? "CLIENT_DISCONNECTED" : failure.code, attempts, calls);
            eventFinished = true;
            sendAgentError(response, failure.status, failure.code, result.usage.runId);
            return;
          }
          emit("completion", "success", "GOAL_COMPLETED", attempts, calls);
          eventFinished = true;
          sendJson(response, 200, { success: true, recommendation: result.recommendation });
        } catch (error) {
          if (!eventFinished) {
            emit("completion", "failure", "AGENT_UNAVAILABLE", null, null);
            eventFinished = true;
          }
          throw error;
        } finally {
          lease.runnerFinished();
          response.off("close", onClose);
        }
        return;
      }

      const result = await coachRun(input, provider, executionOptions);
      if (!result.ok) {
        sendJson(response, result.kind === "invalid-request" ? 400 : 503, {
          success: false,
          message: SAFE_MESSAGE,
        });
        return;
      }
      sendJson(response, 200, { success: true, advice: result.advice });
    } catch {
      if (isAgentRequest && !eventFinished) {
        emit(admitted ? "completion" : "denial", admitted ? "failure" : "denied", "AGENT_UNAVAILABLE",
          admitted ? null : 0, admitted ? null : 0);
        eventFinished = true;
      }
      if (response.destroyed || response.writableEnded) return;
      if (!response.headersSent) {
        if (isAgentRequest) sendAgentError(response, 503, "AGENT_UNAVAILABLE");
        else sendJson(response, 503, { success: false, message: safeErrorMessage });
      } else if (!response.writableEnded) {
        response.end();
      }
    }
  };
}

export const coachServerConfig = { host: HOST, port: PORT };
