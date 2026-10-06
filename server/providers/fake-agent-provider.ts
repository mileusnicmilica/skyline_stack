import { expectedDrill } from "../agent/evaluate-drill.js";
import type { AgentProvider } from "../agent/types.js";

export const fakeAgentProvider: AgentProvider = {
  name: "fake",
  model: "deterministic-agent-v1",
  async generate(context) {
    const expected = expectedDrill(context);
    const supported = context.evidence.find((item) => item.supported && item.drillId === expected.drillId);
    if (supported) {
      return { output: { action: "final", drillId: expected.drillId, evidenceId: supported.evidenceId } };
    }
    return { output: { action: "call_tool", tool: "evaluate_drill", args: { drillId: expected.drillId } } };
  },
};
