import { recordAgentUsage } from "../../server/agent/usage.js";
import type { AgentProvider } from "../../server/agent/types.js";
import { createCoachRequestHandler } from "../../server/index.js";
import { createAgentProvider } from "../../server/providers/agent-provider-config.js";
import { fakeCoachProvider } from "../../server/providers/fake-provider.js";
import { createRequestRateLimiter } from "../../server/rate-limit.js";
import { recordHttpSecurityEvent } from "../../server/http-security-events.js";

const agentProvider = createAgentProvider();

export function createProductionNextDrillHandler(selectedProvider: AgentProvider = agentProvider) {
  const agentRateLimiter = createRequestRateLimiter({
    limit: 5,
    windowMs: 60_000,
    scope: "global",
  });

  return createCoachRequestHandler(
    fakeCoachProvider,
    {},
    { agentRateLimiter, onAgentSecurityEvent: recordHttpSecurityEvent },
    selectedProvider,
    { onUsage: recordAgentUsage },
  );
}

export default createProductionNextDrillHandler();
