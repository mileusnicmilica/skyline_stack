import { deriveStatistics, parseRequest } from "../coach/analysis.js";
import type { RunStatistics } from "../coach/types.js";

export function parseNextDrillRequest(value: unknown): RunStatistics | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 4 || !["goal", "finalScore", "startingWidth", "drops"].every((key) => keys.includes(key)) ||
      record.goal !== "choose_next_drill") return null;
  const request = parseRequest({
    finalScore: record.finalScore,
    startingWidth: record.startingWidth,
    drops: record.drops,
  });
  return request ? deriveStatistics(request) : null;
}
