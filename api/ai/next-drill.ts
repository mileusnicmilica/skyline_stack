import { recordAgentUsage } from "../../server/agent/usage.js";
import type { AgentProvider } from "../../server/agent/types.js";
import { createCoachRequestHandler } from "../../server/index.js";
import { createAgentProvider } from "../../server/providers/agent-provider-config.js";
import { fakeCoachProvider } from "../../server/providers/fake-provider.js";
import { createRequestRateLimiter } from "../../server/rate-limit.js";

const agentProvider = createAgentProvider();

export function createProductionNextDrillHandler(selectedProvider: AgentProvider = agentProvider) {
  const agentRateLimiter = createRequestRateLimiter({
    limit: 5,
    windowMs: 10 * 60 * 1_000,
    trustProxyHeaders: true,
  });

  return createCoachRequestHandler(
    fakeCoachProvider,
    {},
    { agentRateLimiter },
    selectedProvider,
    { onUsage: recordAgentUsage },
  );
}

export default createProductionNextDrillHandler();
