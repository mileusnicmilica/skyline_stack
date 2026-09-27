import type {
  CoachProvider,
  ProviderGeneration,
  ProviderTokenUsage,
  RunStatistics,
} from "../coach/types.js";
import { ProviderError } from "./provider-error.js";

export const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "timingBias", "biggestMistakeFloor", "tip"],
  properties: {
    headline: { type: "string", description: "Kratak naslov na srpskom, najviše 80 znakova." },
    timingBias: { type: "string", enum: ["early", "late", "mixed", "consistent"] },
    biggestMistakeFloor: { type: "integer", minimum: 1 },
    tip: { type: "string", description: "Jedan konkretan savet na srpskom, najviše 200 znakova." },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalToken(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function readTokenUsage(value: unknown): ProviderTokenUsage | undefined {
  if (!isRecord(value)) return undefined;
  const inputTokens = optionalToken(value.promptTokenCount);
  const outputTokens = optionalToken(value.candidatesTokenCount);
  const totalTokens = optionalToken(value.totalTokenCount);
  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined) return undefined;
  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}

function readCandidateText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return null;
  const candidate = value.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return null;
  const part = candidate.content.parts.find((entry) => isRecord(entry) && typeof entry.text === "string");
  return isRecord(part) && typeof part.text === "string" ? part.text : null;
}

function buildPrompt(statistics: RunStatistics): string {
  return [
    "Napiši kratak savet na srpskom latinicom za igrača Skyline Stack igre.",
    "Ne menjaj izračunate činjenice. Vrati samo traženi JSON objekat.",
    `Konačan rezultat: ${statistics.finalScore}.`,
    `Rani potezi: ${statistics.earlyCount}; kasni: ${statistics.lateCount}; centrirani: ${statistics.centeredCount}.`,
    `Prosečno apsolutno odstupanje: ${statistics.averageAbsoluteOffsetPx.toFixed(2)} px.`,
    `Obavezni timingBias: ${statistics.timingBias}.`,
    `Obavezni biggestMistakeFloor: ${statistics.biggestMistakeFloor}.`,
    `Najveći gubitak širine: ${statistics.maxWidthLossPx.toFixed(2)} px.`,
    "headline neka sažme obrazac, a tip neka bude jedna konkretna radnja za sledeću partiju.",
  ].join("\n");
}

export class GeminiCoachProvider implements CoachProvider {
  readonly name = "gemini";
  readonly model = GEMINI_MODEL;
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;

  constructor(apiKey: string, fetchImplementation: typeof fetch = fetch) {
    if (apiKey.trim().length === 0) throw new Error("GEMINI_API_KEY is required for Gemini mode.");
    this.#apiKey = apiKey;
    this.#fetch = fetchImplementation;
  }

  async generate(
    statistics: RunStatistics,
    { signal }: { signal: AbortSignal; attempt: number },
  ): Promise<ProviderGeneration> {
    let response: Response;
    try {
      response = await this.#fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.#apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(statistics) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        }),
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ProviderError("Gemini network request failed.", true);
    }

    if (!response.ok) {
      throw new ProviderError(
        `Gemini request failed with HTTP ${response.status}.`,
        response.status === 429 || response.status >= 500,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ProviderError("Gemini returned an invalid response envelope.", false);
    }

    const text = readCandidateText(body);
    if (text === null) throw new ProviderError("Gemini returned no structured candidate.", false);

    let output: unknown;
    try {
      output = JSON.parse(text);
    } catch {
      throw new ProviderError("Gemini returned malformed structured JSON.", false);
    }

    const tokenUsage = isRecord(body) ? readTokenUsage(body.usageMetadata) : undefined;
    return { output, ...(tokenUsage === undefined ? {} : { tokenUsage }) };
  }
}
