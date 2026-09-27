import type { ProviderUsageRecord } from "./coach/types.js";

const records: ProviderUsageRecord[] = [];

export function recordProviderUsage(record: ProviderUsageRecord): void {
  records.push(structuredClone(record));
  process.stdout.write(`[coach-provider-usage] ${JSON.stringify(record)}\n`);
}

export function getProviderUsageRecords(): readonly ProviderUsageRecord[] {
  return records.map((record) => structuredClone(record));
}
