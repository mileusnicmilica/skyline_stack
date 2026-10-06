import type { DrillId, FindingCode, TimingCounts, ToolEvidence } from "./types.js";

const DRILLS = new Set<DrillId>(["release_earlier", "release_later", "center_alignment"]);
const KEYS = new Set(["evidenceId", "drillId", "supported", "earlyCount", "lateCount", "centeredCount", "totalDrops", "findingCode"]);

export function parseDrillArgs(value: unknown): { drillId: DrillId } | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && typeof record.drillId === "string" && DRILLS.has(record.drillId as DrillId)
    ? { drillId: record.drillId as DrillId }
    : null;
}

export function expectedDrill(counts: TimingCounts): { drillId: DrillId; findingCode: FindingCode } {
  if (counts.lateCount > counts.earlyCount) return { drillId: "release_earlier", findingCode: "late_dominant" };
  if (counts.earlyCount > counts.lateCount) return { drillId: "release_later", findingCode: "early_dominant" };
  return { drillId: "center_alignment", findingCode: "balanced" };
}

export function evaluateDrill(args: unknown, counts: TimingCounts, evidenceId: string): ToolEvidence {
  const parsed = parseDrillArgs(args);
  if (!parsed) throw new TypeError("invalid-tool-args");
  const expected = expectedDrill(counts);
  return {
    evidenceId,
    drillId: parsed.drillId,
    supported: parsed.drillId === expected.drillId,
    earlyCount: counts.earlyCount,
    lateCount: counts.lateCount,
    centeredCount: counts.centeredCount,
    totalDrops: counts.earlyCount + counts.lateCount + counts.centeredCount,
    findingCode: expected.findingCode,
  };
}

export function validateToolEvidence(value: unknown, counts: TimingCounts, evidenceId: string): ToolEvidence | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).length !== KEYS.size || !Object.keys(candidate).every((key) => KEYS.has(key))) return null;
  const args = parseDrillArgs({ drillId: candidate.drillId });
  const expected = expectedDrill(counts);
  if (!args || candidate.evidenceId !== evidenceId || typeof candidate.supported !== "boolean" ||
      candidate.earlyCount !== counts.earlyCount || candidate.lateCount !== counts.lateCount ||
      candidate.centeredCount !== counts.centeredCount ||
      candidate.totalDrops !== counts.earlyCount + counts.lateCount + counts.centeredCount ||
      candidate.findingCode !== expected.findingCode || candidate.supported !== (args.drillId === expected.drillId) ||
      Buffer.byteLength(JSON.stringify(candidate), "utf8") > 256) return null;
  return candidate as ToolEvidence;
}
