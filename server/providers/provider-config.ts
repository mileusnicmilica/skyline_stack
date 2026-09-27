import type { CoachProvider } from "../coach/types";
import { fakeCoachProvider } from "./fake-provider";
import { GeminiCoachProvider } from "./gemini-provider";

type ProviderEnvironment = Partial<Record<"AI_COACH_PROVIDER" | "GEMINI_API_KEY", string | undefined>>;

export function createCoachProvider(environment: ProviderEnvironment = process.env): CoachProvider {
  const mode = environment.AI_COACH_PROVIDER?.trim().toLowerCase() || "fake";
  if (mode === "fake") return fakeCoachProvider;
  if (mode !== "gemini") throw new Error("AI_COACH_PROVIDER must be either fake or gemini.");

  const apiKey = environment.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is required when AI_COACH_PROVIDER=gemini.");
  return new GeminiCoachProvider(apiKey);
}
