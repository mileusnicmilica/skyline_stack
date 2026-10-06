import type { ProviderGeneration } from "../coach/types.js";

export type DrillId = "release_earlier" | "release_later" | "center_alignment";
export type FindingCode = "late_dominant" | "early_dominant" | "balanced";
export type TimingCounts = { earlyCount: number; lateCount: number; centeredCount: number };
export type ToolEvidence = TimingCounts & {
  evidenceId: string;
  drillId: DrillId;
  supported: boolean;
  totalDrops: number;
  findingCode: FindingCode;
};
export type AgentModelContext = TimingCounts & {
  goal: "choose_next_drill";
  finalScore: number;
  step: number;
  evidence: readonly ToolEvidence[];
};
export interface AgentProvider {
  readonly name: string;
  readonly model: string;
  generate(context: AgentModelContext, options: { signal: AbortSignal; attempt: number }): Promise<ProviderGeneration>;
}
export type AgentStopReason =
  | "goal_completed" | "invalid_input" | "unknown_tool" | "invalid_tool_args"
  | "repeated_call" | "tool_failure" | "invalid_tool_result" | "provider_failure"
  | "tool_timeout" | "provider_timeout" | "provider_rate_limit" | "provider_unavailable"
  | "provider_unauthorized" | "invalid_model_output" | "invalid_final" | "max_steps"
  | "deadline" | "cancelled" | "incomplete";
export type AgentStepUsage = {
  step: number;
  attempts: number;
  latencyMs: number;
  tool: "evaluate_drill" | null;
  status: string;
  tokenUsage?: ProviderGeneration["tokenUsage"];
};
export type AgentUsage = {
  runId: string;
  provider: string;
  model: string;
  startedAt: string;
  latencyMs: number;
  stepCount: number;
  providerAttempts: number;
  toolCallCount: number;
  stopReason: AgentStopReason;
  steps: AgentStepUsage[];
};
export type DrillRecommendation = {
  drillId: DrillId;
  title: string;
  instruction: string;
  evidence: TimingCounts & { finding: string };
  runId: string;
  stopReason: "goal_completed";
};
export type AgentRunResult =
  | { ok: true; recommendation: DrillRecommendation; usage: AgentUsage }
  | { ok: false; reason: AgentStopReason; usage: AgentUsage };
export type AgentExecutionOptions = {
  signal?: AbortSignal;
  totalDeadlineMs?: number;
  attemptTimeoutMs?: number;
  retryDelayMs?: number;
  tool?: (args: unknown, counts: TimingCounts, evidenceId: string, signal: AbortSignal) => unknown | Promise<unknown>;
  onUsage?: (usage: AgentUsage) => void;
};
