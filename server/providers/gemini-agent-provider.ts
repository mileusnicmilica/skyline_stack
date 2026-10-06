import type { ProviderGeneration, ProviderTokenUsage } from "../coach/types.js";
import type { AgentModelContext, AgentProvider } from "../agent/types.js";
import { GEMINI_MODEL } from "./gemini-provider.js";
import { ProviderError } from "./provider-error.js";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["action"],
  properties: {
    action: { type: "string", enum: ["call_tool", "final"] },
    tool: { type: "string", enum: ["evaluate_drill"] },
    args: { type: "object", additionalProperties: false, properties: {
      drillId: { type: "string", enum: ["release_earlier", "release_later", "center_alignment"] },
    } },
    drillId: { type: "string", enum: ["release_earlier", "release_later", "center_alignment"] },
    evidenceId: { type: "string" },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function token(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function tokenUsage(value: unknown): ProviderTokenUsage | undefined {
  if (!isRecord(value)) return undefined;
  const inputTokens = token(value.promptTokenCount);
  const outputTokens = token(value.candidatesTokenCount);
  const totalTokens = token(value.totalTokenCount);
  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined) return undefined;
  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}

function candidateText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return null;
  const candidate = value.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return null;
  const part = candidate.content.parts.find((entry) => isRecord(entry) && typeof entry.text === "string");
  return isRecord(part) && typeof part.text === "string" ? part.text : null;
}

function prompt(context: AgentModelContext): string {
  return [
    "Ti biraš jednu vežbu za sledeću partiju Skyline Stack igre.",
    "Vrati samo jedan JSON objekat. Dozvoljene su samo akcije call_tool i final.",
    "Za call_tool koristi samo evaluate_drill sa args.drillId: release_earlier, release_later ili center_alignment.",
    "Prva odluka mora biti call_tool. Ako alat kaže supported:false, možeš predložiti jednu DRUGU vežbu.",
    "Posle supported:true vrati final sa istim drillId i evidenceId iz rezultata alata.",
    "Ne izmišljaj dokaze; nemoj ponavljati isti alat i argumente.",
    `Korak: ${context.step}. Cilj: ${context.goal}. Rezultat: ${context.finalScore}.`,
    `Rana puštanja: ${context.earlyCount}; kasna: ${context.lateCount}; centrirana: ${context.centeredCount}.`,
    `Provereni rezultati alata: ${JSON.stringify(context.evidence)}.`,
  ].join("\n");
}

export class GeminiAgentProvider implements AgentProvider {
  readonly name = "gemini";
  readonly model = GEMINI_MODEL;
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;

  constructor(apiKey: string, fetchImplementation: typeof fetch = fetch) {
    if (!apiKey.trim()) throw new Error("GEMINI_API_KEY is required for Gemini mode.");
    this.#apiKey = apiKey;
    this.#fetch = fetchImplementation;
  }

  async generate(context: AgentModelContext, { signal }: { signal: AbortSignal; attempt: number }): Promise<ProviderGeneration> {
    let response: Response;
    try {
      response = await this.#fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.#apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt(context) }] }],
          generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCHEMA, temperature: 0.1 },
        }),
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ProviderError("Gemini agent network request failed.", true, "unavailable");
    }
    if (!response.ok) {
      const kind = response.status === 429 ? "rate_limit"
        : response.status >= 500 ? "unavailable"
          : response.status === 401 || response.status === 403 ? "unauthorized" : "provider";
      throw new ProviderError(`Gemini agent request failed with HTTP ${response.status}.`, response.status === 429 || response.status >= 500, kind);
    }
    let body: unknown;
    try { body = await response.json(); }
    catch { throw new ProviderError("Gemini agent response envelope was invalid.", false); }
    const text = candidateText(body);
    if (text === null) throw new ProviderError("Gemini agent returned no decision.", false);
    let output: unknown;
    try { output = JSON.parse(text); }
    catch { throw new ProviderError("Gemini agent returned malformed JSON.", false); }
    const usage = isRecord(body) ? tokenUsage(body.usageMetadata) : undefined;
    return { output, ...(usage ? { tokenUsage: usage } : {}) };
  }
}
