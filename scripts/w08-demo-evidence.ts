import assert from "node:assert/strict";
import { once } from "node:events";
import { createCoachServer } from "../server/index.js";
import { evaluateDrill } from "../server/agent/evaluate-drill.js";
import type { AgentProvider, AgentStopReason, AgentUsage } from "../server/agent/types.js";
import { fakeAgentProvider } from "../server/providers/fake-agent-provider.js";
import { fakeCoachProvider } from "../server/providers/fake-provider.js";

// Every provider is injected below; no environment-selected adapter is loaded.
// HTTP requests only reach the temporary loopback listeners created here.
process.env.AI_COACH_PROVIDER = "fake";
process.env.GEMINI_API_KEY = "";

const run = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};

const forbiddenProvider: AgentProvider = {
  name: "fake", model: "w08-constructor-fixture",
  async generate() {
    return { output: { action: "call_tool", tool: "constructor", args: { drillId: "release_earlier" } } };
  },
};

type Scenario = {
  id: string;
  input: unknown;
  provider: AgentProvider;
  expected: {
    httpStatus: number;
    providerAttempts: number;
    toolExecutions: number;
    modelSteps: number;
    stopReason: AgentStopReason | null;
    errorCode: string | null;
  };
};

function record(value: unknown): Record<string, unknown> {
  assert.ok(typeof value === "object" && value !== null && !Array.isArray(value));
  return value as Record<string, unknown>;
}

async function observe(scenario: Scenario) {
  let providerAttempts = 0;
  let toolExecutions = 0;
  let toolInputsUnchanged = true;
  const usageRecords: AgentUsage[] = [];
  const inputBefore = JSON.stringify(scenario.input);
  const runBefore = JSON.stringify(run);
  const server = createCoachServer(fakeCoachProvider, {}, {}, {
    name: scenario.provider.name,
    model: scenario.provider.model,
    generate: async (context, options) => {
      providerAttempts += 1;
      return await scenario.provider.generate(context, options);
    },
  }, {
    tool: (args, counts, evidenceId) => {
      toolExecutions += 1;
      const before = JSON.stringify({ args, counts });
      const result = evaluateDrill(args, counts, evidenceId);
      toolInputsUnchanged = toolInputsUnchanged && JSON.stringify({ args, counts }) === before;
      return result;
    },
    onUsage: (usage) => usageRecords.push(usage),
  });

  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/ai/next-drill`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: inputBefore,
      signal: AbortSignal.timeout(5_000),
    });
    const payload = record(await response.json());
    const usage = usageRecords[0];
    const observed = {
      httpStatus: response.status,
      providerAttempts,
      toolExecutions,
      modelSteps: usage?.stepCount ?? 0,
      stopReason: usage?.stopReason ?? null,
      errorCode: payload.errorCode ?? null,
    };

    assert.deepEqual(observed, scenario.expected, scenario.id);
    assert.equal(usageRecords.length, scenario.expected.stopReason === null ? 0 : 1);
    if (usage) {
      assert.equal(usage.providerAttempts, providerAttempts);
      assert.equal(usage.toolCallCount, toolExecutions);
    }
    if (response.status === 200) {
      assert.equal(payload.success, true);
      const recommendation = record(payload.recommendation);
      assert.equal(recommendation.drillId, "release_earlier");
      assert.equal(recommendation.stopReason, "goal_completed");
      assert.equal(record(recommendation.evidence).lateCount, 2);
    } else {
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Sledeća vežba trenutno nije dostupna.");
      assert.equal(Object.hasOwn(payload, "recommendation"), false);
      assert.equal(Object.hasOwn(payload, "stopReason"), false);
    }
    assert.equal(JSON.stringify(scenario.input), inputBefore, "Submitted fixture must remain unchanged.");
    assert.equal(JSON.stringify(run), runBefore, "Synthetic game state must remain unchanged.");
    assert.equal(toolInputsUnchanged, true, "The actual evaluator must not mutate its inputs.");

    return {
      scenario: scenario.id,
      ...observed,
      inputUnchanged: true,
      toolInputsUnchanged: toolExecutions > 0 ? toolInputsUnchanged : null,
    };
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    }
  }
}

const scenarios: Scenario[] = [
  {
    id: "T00 normal two-decision, one-tool flow",
    input: run, provider: fakeAgentProvider,
    expected: {
      httpStatus: 200, providerAttempts: 2, toolExecutions: 1, modelSteps: 2,
      stopReason: "goal_completed", errorCode: null,
    },
  },
  {
    id: "T01/T02 maxSteps:99 rejected before agent work",
    input: { ...run, maxSteps: 99 }, provider: fakeAgentProvider,
    expected: {
      httpStatus: 400, providerAttempts: 0, toolExecutions: 0, modelSteps: 0,
      stopReason: null, errorCode: "INVALID_REQUEST",
    },
  },
  {
    id: "T07/T09 constructor proposal rejected before tool execution",
    input: run, provider: forbiddenProvider,
    expected: {
      httpStatus: 503, providerAttempts: 1, toolExecutions: 0, modelSteps: 1,
      stopReason: "unknown_tool", errorCode: "AGENT_UNAVAILABLE",
    },
  },
];

const results = [];
for (const scenario of scenarios) results.push(await observe(scenario));
process.stdout.write(`${JSON.stringify({
  scope: "Synthetic local HTTP checks with fake providers; not a record of a human demo.",
  results,
}, null, 2)}\n`);
