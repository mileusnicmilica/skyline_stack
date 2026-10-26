import { randomUUID } from "node:crypto";

export type HttpSecurityReason =
  | "ACCEPTED" | "GOAL_COMPLETED" | "CLIENT_DISCONNECTED"
  | "INVALID_REQUEST" | "METHOD_NOT_ALLOWED" | "REQUEST_TOO_LARGE" | "REQUEST_TIMEOUT"
  | "RATE_LIMITED" | "CONCURRENCY_LIMIT" | "PROVIDER_RATE_LIMITED" | "AGENT_TIMEOUT" | "AGENT_UNAVAILABLE";

export type HttpSecurityEvent = Readonly<{
  correlationId: string;
  timestamp: string;
  event: "denial" | "admission" | "completion";
  outcome: "denied" | "admitted" | "success" | "failure" | "cancelled";
  reason: HttpSecurityReason;
  providerAttempts: number | null;
  toolCalls: number | null;
}>;

export type HttpSecurityEventInput = Omit<HttpSecurityEvent, "timestamp">;
const EVENTS = new Set<HttpSecurityEvent["event"]>(["denial", "admission", "completion"]);
const OUTCOMES = new Set<HttpSecurityEvent["outcome"]>(["denied", "admitted", "success", "failure", "cancelled"]);
const REASONS = new Set<HttpSecurityReason>([
  "ACCEPTED", "GOAL_COMPLETED", "CLIENT_DISCONNECTED", "INVALID_REQUEST", "METHOD_NOT_ALLOWED",
  "REQUEST_TOO_LARGE", "REQUEST_TIMEOUT", "RATE_LIMITED", "CONCURRENCY_LIMIT",
  "PROVIDER_RATE_LIMITED", "AGENT_TIMEOUT", "AGENT_UNAVAILABLE",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function count(value: unknown, maximum: number): number | null {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(maximum, Math.trunc(value)));
}

export function newHttpCorrelationId(): string { return randomUUID(); }

/** Rebuild a fixed seven-field record; never serialize caller-provided objects verbatim. */
export function createHttpSecurityEvent(input: HttpSecurityEventInput | HttpSecurityEvent): HttpSecurityEvent {
  const event = EVENTS.has(input.event) ? input.event : "completion";
  const requestedOutcome = OUTCOMES.has(input.outcome) ? input.outcome : "failure";
  const outcome = event === "denial" ? "denied" : event === "admission" ? "admitted"
    : requestedOutcome === "success" || requestedOutcome === "cancelled" ? requestedOutcome : "failure";
  const requestedReason = REASONS.has(input.reason) ? input.reason : "AGENT_UNAVAILABLE";
  const reason = event === "admission" ? "ACCEPTED"
    : event === "completion" && outcome === "success" ? "GOAL_COMPLETED"
      : event === "completion" && outcome === "cancelled" ? "CLIENT_DISCONNECTED"
        : requestedReason === "ACCEPTED" || requestedReason === "GOAL_COMPLETED" || requestedReason === "CLIENT_DISCONNECTED"
          ? "AGENT_UNAVAILABLE" : requestedReason;
  return Object.freeze({
    correlationId: typeof input.correlationId === "string" && UUID.test(input.correlationId)
      ? input.correlationId : newHttpCorrelationId(),
    timestamp: new Date().toISOString(),
    event, outcome, reason,
    providerAttempts: event === "completion" ? count(input.providerAttempts, 4) : 0,
    toolCalls: event === "completion" ? count(input.toolCalls, 2) : 0,
  });
}

export function recordHttpSecurityEvent(event: HttpSecurityEvent): void {
  const safe = createHttpSecurityEvent(event);
  process.stdout.write(`[w08-security] ${JSON.stringify(safe)}\n`);
}
