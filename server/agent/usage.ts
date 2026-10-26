import type { AgentStopReason, AgentUsage } from "./types.js";

const records: AgentUsage[] = [];
const MAX_RETAINED_RECORDS = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STOP_REASONS = new Set<AgentStopReason>([
  "goal_completed", "invalid_input", "unknown_tool", "invalid_tool_args", "repeated_call",
  "tool_failure", "invalid_tool_result", "provider_failure", "tool_timeout",
  "provider_timeout", "provider_rate_limit", "provider_unavailable", "provider_unauthorized",
  "invalid_model_output", "invalid_final", "max_steps", "deadline", "cancelled", "incomplete",
]);

export type AgentSecurityEvent = Readonly<{
  correlationId: string | null;
  runId: string;
  timestamp: string;
  event: "agent_completion";
  outcome: "success" | "denied" | "failure" | "cancelled";
  reason: AgentStopReason;
  providerAttempts: number;
  toolCalls: number;
}>;

function boundedCount(value: unknown, maximum: number): number {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? Math.max(0, Math.min(maximum, value)) : 0;
}

/** Rebuild the event from fixed fields; never log provider output or error text. */
export function createAgentSecurityEvent(usage: AgentUsage): AgentSecurityEvent {
  const reason = STOP_REASONS.has(usage.stopReason) ? usage.stopReason : "provider_failure";
  return Object.freeze({
    correlationId: typeof usage.correlationId === "string" && UUID.test(usage.correlationId)
      ? usage.correlationId : null,
    runId: UUID.test(usage.runId) ? usage.runId : "invalid-run-id",
    timestamp: new Date().toISOString(),
    event: "agent_completion",
    outcome: reason === "goal_completed" ? "success" : reason === "cancelled" ? "cancelled"
      : reason === "invalid_input" || reason === "unknown_tool" || reason === "invalid_tool_args" ||
        reason === "repeated_call" || reason === "invalid_model_output" || reason === "invalid_final" ||
        reason === "invalid_tool_result" ? "denied" : "failure",
    reason,
    providerAttempts: boundedCount(usage.providerAttempts, 4),
    toolCalls: boundedCount(usage.toolCallCount, 2),
  });
}

export function recordAgentSecurityEvent(event: AgentSecurityEvent): void {
  const reason = STOP_REASONS.has(event.reason) ? event.reason : "provider_failure";
  const safe = {
    correlationId: typeof event.correlationId === "string" && UUID.test(event.correlationId)
      ? event.correlationId : null,
    runId: UUID.test(event.runId) ? event.runId : "invalid-run-id",
    timestamp: new Date().toISOString(),
    event: "agent_completion",
    outcome: reason === "goal_completed" ? "success" : reason === "cancelled" ? "cancelled"
      : event.outcome === "denied" ? "denied" : "failure",
    reason,
    providerAttempts: boundedCount(event.providerAttempts, 4),
    toolCalls: boundedCount(event.toolCalls, 2),
  };
  process.stdout.write(`[w08-agent-security] ${JSON.stringify(safe)}\n`);
}

export function recordAgentUsage(usage: AgentUsage): void {
  const safe = structuredClone(usage);
  records.push(safe);
  if (records.length > MAX_RETAINED_RECORDS) records.shift();
  process.stdout.write(`[agent-run-usage] ${JSON.stringify(safe)}\n`);
}

export function getAgentUsageRecords(): readonly AgentUsage[] {
  return records.map((record) => structuredClone(record));
}
