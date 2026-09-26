import type { DropRecord } from "../../src/game/model";

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

export interface CoachProvider {
  generate(statistics: RunStatistics): Promise<unknown>;
}

export type CoachRunResult =
  | { ok: true; advice: CoachAdvice; statistics: RunStatistics }
  | { ok: false; kind: "invalid-request" | "invalid-advice" | "provider-failure" };
