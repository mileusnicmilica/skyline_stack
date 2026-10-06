import type { AgentProvider } from "../agent/types.js";
import { fakeAgentProvider } from "./fake-agent-provider.js";
import { GeminiAgentProvider } from "./gemini-agent-provider.js";

type ProviderEnvironment = Partial<Record<"AI_COACH_PROVIDER" | "GEMINI_API_KEY", string | undefined>>;

export function createAgentProvider(environment: ProviderEnvironment = process.env): AgentProvider {
  const mode = environment.AI_COACH_PROVIDER?.trim().toLowerCase() || "fake";
  if (mode === "fake") return fakeAgentProvider;
  if (mode !== "gemini") throw new Error("AI_COACH_PROVIDER must be either fake or gemini.");
  const apiKey = environment.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is required when AI_COACH_PROVIDER=gemini.");
  return new GeminiAgentProvider(apiKey);
}
