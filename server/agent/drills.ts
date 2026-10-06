import type { DrillId, DrillRecommendation, ToolEvidence } from "./types.js";

const LABELS: Record<DrillId, { title: string; instruction: string }> = {
  release_earlier: {
    title: "Vežbaj ranije puštanje",
    instruction: "Pusti blok malo pre nego što pređe sredinu tornja.",
  },
  release_later: {
    title: "Vežbaj kasnije puštanje",
    instruction: "Sačekaj da se blok približi sredini tornja pre puštanja.",
  },
  center_alignment: {
    title: "Vežbaj poravnanje sa centrom",
    instruction: "Prati sredinu tornja i pusti blok kada je iznad nje.",
  },
};

const FINDINGS: Record<ToolEvidence["findingCode"], string> = {
  late_dominant: "Kasna puštanja su češća od ranih.",
  early_dominant: "Rana puštanja su češća od kasnih.",
  balanced: "Rana i kasna puštanja su podjednako česta.",
};

export function composeRecommendation(evidence: ToolEvidence, runId: string): DrillRecommendation {
  const label = LABELS[evidence.drillId];
  return {
    drillId: evidence.drillId,
    title: label.title,
    instruction: label.instruction,
    evidence: {
      earlyCount: evidence.earlyCount,
      lateCount: evidence.lateCount,
      centeredCount: evidence.centeredCount,
      finding: FINDINGS[evidence.findingCode],
    },
    runId,
    stopReason: "goal_completed",
  };
}
