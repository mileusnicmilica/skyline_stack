import { deriveStatistics, parseRequest } from "../coach/analysis.js";
import type { RunStatistics } from "../coach/types.js";

const MAX_GEOMETRY_PX = 4_096;

/** Shared W08 envelope for both direct agent entry and the HTTP route. */
export function withinNextDrillEnvelope(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.startingWidth !== "number" || !Number.isFinite(record.startingWidth) ||
      record.startingWidth <= 0 || record.startingWidth > MAX_GEOMETRY_PX || !Array.isArray(record.drops)) return false;
  return record.drops.every((item: unknown) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
    const drop = item as Record<string, unknown>;
    return typeof drop.offsetPx === "number" && Number.isFinite(drop.offsetPx) &&
      Math.abs(drop.offsetPx) <= MAX_GEOMETRY_PX &&
      typeof drop.widthBefore === "number" && Number.isFinite(drop.widthBefore) &&
      drop.widthBefore > 0 && drop.widthBefore <= MAX_GEOMETRY_PX &&
      typeof drop.widthAfter === "number" && Number.isFinite(drop.widthAfter) &&
      drop.widthAfter >= 0 && drop.widthAfter <= MAX_GEOMETRY_PX;
  });
}

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
  return request && withinNextDrillEnvelope(value) ? deriveStatistics(request) : null;
}
