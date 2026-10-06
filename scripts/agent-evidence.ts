import { runNextDrill } from "../server/agent/run.js";
import { evaluateDrill } from "../server/agent/evaluate-drill.js";
import type { AgentProvider, AgentRunResult, ToolEvidence } from "../server/agent/types.js";
import { fakeAgentProvider } from "../server/providers/fake-agent-provider.js";
import { ProviderError } from "../server/providers/provider-error.js";

const request = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

const forbiddenProvider: AgentProvider = {
  name: "fake", model: "forbidden-tool-fixture",
  async generate() {
    return { output: { action: "call_tool", tool: "delete_database", args: {} } };
  },
};

const unavailableProvider: AgentProvider = {
  name: "fake", model: "unavailable-fixture",
  async generate() {
    throw new ProviderError("fixture-unavailable", false, "unavailable");
  },
};

function trace(scenario: string, result: AgentRunResult, toolResults: readonly ToolEvidence[] = []) {
  const { usage } = result;
  return {
    scenario,
    runId: usage.runId,
    provider: usage.provider,
    model: usage.model,
    modelSteps: usage.stepCount,
    providerAttempts: usage.providerAttempts,
    toolCalls: usage.toolCallCount,
    stopReason: usage.stopReason,
    steps: usage.steps.map(({ step, attempts, tool, status }) => ({ step, attempts, tool, status })),
    toolResults,
    ...(result.ok ? { drillId: result.recommendation.drillId, supportedEvidence: true } : {}),
  };
}

const observedToolResults: ToolEvidence[] = [];
const success = await runNextDrill(request, fakeAgentProvider, {
  tool: (args, counts, evidenceId) => {
    const result = evaluateDrill(args, counts, evidenceId);
    observedToolResults.push(result);
    return result;
  },
});
let rejectedToolExecutions = 0;
const rejected = await runNextDrill(request, forbiddenProvider, {
  tool: () => { rejectedToolExecutions += 1; throw new Error("forbidden-tool-was-executed"); },
});
const failure = await runNextDrill(request, unavailableProvider);
const runs = [
  trace("success", success, observedToolResults),
  { ...trace("rejected_unknown_tool", rejected), observedToolExecutions: rejectedToolExecutions },
  trace("provider_unavailable", failure),
];
process.stdout.write(`${JSON.stringify(runs, null, 2)}\n`);
