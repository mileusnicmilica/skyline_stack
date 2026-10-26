export const MAX_MODEL_CONTEXT_BYTES = 2 * 1024;
export const MAX_MODEL_DECISION_BYTES = 4 * 1024;
export const MAX_PROVIDER_ENVELOPE_BYTES = 32 * 1024;
export const MAX_GENERATED_TOKENS = 512;

export function jsonWithinBytes(value: unknown, limit: number): boolean {
  try {
    const json = JSON.stringify(value);
    return typeof json === "string" && Buffer.byteLength(json, "utf8") <= limit;
  } catch {
    return false;
  }
}
