import type { DropRecord } from "../game/model";

export type NextDrillRequest = {
  goal: "choose_next_drill";
  finalScore: number;
  startingWidth: number;
  drops: DropRecord[];
};
type DrillId = "release_earlier" | "release_later" | "center_alignment";
export type NextDrillRecommendation = {
  drillId: DrillId;
  title: string;
  instruction: string;
  evidence: { earlyCount: number; lateCount: number; centeredCount: number; finding: string };
  runId: string;
  stopReason: "goal_completed";
};
export type NextDrillClientResult =
  | { ok: true; recommendation: NextDrillRecommendation }
  | { ok: false; message: typeof SAFE_DRILL_MESSAGE };

type Options = { fetchImplementation?: typeof fetch; signal?: AbortSignal; timeoutMs?: number };
export const SAFE_DRILL_MESSAGE = "Sledeća vežba trenutno nije dostupna.";
const DRILLS = new Set(["release_earlier", "release_later", "center_alignment"]);
const KEYS = new Set(["drillId", "title", "instruction", "evidence", "runId", "stopReason"]);
const EVIDENCE_KEYS = new Set(["earlyCount", "lateCount", "centeredCount", "finding"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, keys: Set<string>): boolean {
  return Object.keys(value).length === keys.size && Object.keys(value).every((key) => keys.has(key));
}
function count(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 501;
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value &&
    !/[\x00-\x1f\x7f]/.test(value);
}

function readRecommendation(value: unknown): NextDrillRecommendation | null {
  if (!isRecord(value) || !exactKeys(value, KEYS) || typeof value.drillId !== "string" || !DRILLS.has(value.drillId) ||
      !text(value.title, 80) || !text(value.instruction, 200) || !text(value.runId, 80) ||
      value.stopReason !== "goal_completed" || !isRecord(value.evidence) || !exactKeys(value.evidence, EVIDENCE_KEYS)) return null;
  const evidence = value.evidence;
  if (!count(evidence.earlyCount) || !count(evidence.lateCount) || !count(evidence.centeredCount) ||
      !text(evidence.finding, 160)) return null;
  const total = evidence.earlyCount + evidence.lateCount + evidence.centeredCount;
  if (total < 1 || total > 501) return null;
  const expected = evidence.lateCount > evidence.earlyCount ? "release_earlier"
    : evidence.earlyCount > evidence.lateCount ? "release_later" : "center_alignment";
  const finding = evidence.lateCount > evidence.earlyCount ? "Kasna puštanja su češća od ranih."
    : evidence.earlyCount > evidence.lateCount ? "Rana puštanja su češća od kasnih."
      : "Rana i kasna puštanja su podjednako česta.";
  return value.drillId === expected && evidence.finding === finding ? value as NextDrillRecommendation : null;
}

export async function requestNextDrill(request: NextDrillRequest, options: Options = {}): Promise<NextDrillClientResult> {
  const controller = new AbortController();
  const timeoutMs = typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? options.timeoutMs : 27_000;
  const timer = setTimeout(() => controller.abort(new Error("next-drill-client-timeout")), timeoutMs);
  const onAbort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) onAbort();
  else options.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const response = await (options.fetchImplementation ?? fetch)("/api/ai/next-drill", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(request), signal: controller.signal,
    });
    if (!response.ok) return { ok: false, message: SAFE_DRILL_MESSAGE };
    let body: unknown;
    try { body = await response.json(); }
    catch { return { ok: false, message: SAFE_DRILL_MESSAGE }; }
    if (!isRecord(body) || body.success !== true) return { ok: false, message: SAFE_DRILL_MESSAGE };
    const recommendation = readRecommendation(body.recommendation);
    return recommendation ? { ok: true, recommendation } : { ok: false, message: SAFE_DRILL_MESSAGE };
  } catch {
    return { ok: false, message: SAFE_DRILL_MESSAGE };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
