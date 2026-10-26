import { vi } from "vitest";
import type { AgentProvider } from "../../server/agent/types";

export const w08Run = {
  goal: "choose_next_drill",
  finalScore: 1,
  startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
} as const;

export const toolCall = (drillId = "release_earlier", tool = "evaluate_drill") =>
  ({ action: "call_tool", tool, args: { drillId } });
export const finalCall = (drillId = "release_earlier", evidenceId = "ev-1") =>
  ({ action: "final", drillId, evidenceId });

export function scriptedAgent(...outputs: unknown[]): {
  provider: AgentProvider;
  generate: ReturnType<typeof vi.fn>;
} {
  const queue = [...outputs];
  const generate = vi.fn(async () => {
    if (queue.length === 0) throw new Error("Unexpected fake provider call");
    const output = queue.shift();
    if (output instanceof Error) throw output;
    return { output };
  });
  return { provider: { name: "fake", model: "w08-scripted", generate }, generate };
}
