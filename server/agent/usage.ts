import type { AgentUsage } from "./types.js";

const records: AgentUsage[] = [];
const MAX_RETAINED_RECORDS = 100;

export function recordAgentUsage(usage: AgentUsage): void {
  const safe = structuredClone(usage);
  records.push(safe);
  if (records.length > MAX_RETAINED_RECORDS) records.shift();
  process.stdout.write(`[agent-run-usage] ${JSON.stringify(safe)}\n`);
}

export function getAgentUsageRecords(): readonly AgentUsage[] {
  return records.map((record) => structuredClone(record));
}
