import type { DropRecord } from "../../src/game/model.js";

export type CoachRequest = {
  finalScore: number;
  startingWidth: number;
  drops: DropRecord[];
};

export type TimingBias = "early" | "late" | "mixed" | "consistent";

export type RunStatistics = {
  finalScore: number;
  startingWidth: number;
  earlyCount: number;
  lateCount: number;
  centeredCount: number;
  earlyPercent: number;
  latePercent: number;
  centeredPercent: number;
  averageAbsoluteOffsetPx: number;
  timingBias: TimingBias;
  biggestMistakeFloor: number;
  maxWidthLossPx: number;
};

export type CoachAdvice = {
  headline: string;
  timingBias: TimingBias;
  biggestMistakeFloor: number;
  tip: string;
};

export type ProviderTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type ProviderGeneration = {
  output: unknown;
  tokenUsage?: ProviderTokenUsage;
};

export type ProviderAttemptContext = {
  signal: AbortSignal;
  attempt: number;
};

export interface CoachProvider {
  readonly name: string;
  readonly model: string;
  generate(statistics: RunStatistics, context: ProviderAttemptContext): Promise<ProviderGeneration>;
}

export type ProviderUsageRecord = {
  provider: string;
  model: string;
  timestamp: string;
  latencyMs: number;
  outcome: "success" | "invalid-output" | "provider-failure" | "timeout";
  attempts: number;
  tokenUsage?: ProviderTokenUsage;
};

export type CoachExecutionOptions = {
  totalTimeoutMs?: number;
  attemptTimeoutMs?: number;
  retryDelayMs?: number;
  onUsage?: (record: ProviderUsageRecord) => void;
};

export type CoachRunResult =
  | { ok: true; advice: CoachAdvice; statistics: RunStatistics }
  | { ok: false; kind: "invalid-request" | "invalid-advice" | "provider-failure" };
