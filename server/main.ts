import { createCoachServer, coachServerConfig } from "./index.js";
import { recordProviderUsage } from "./provider-usage.js";
import { createCoachProvider } from "./providers/provider-config.js";
import { createAgentProvider } from "./providers/agent-provider-config.js";
import { recordAgentSecurityEvent, recordAgentUsage } from "./agent/usage.js";
import { createRequestRateLimiter } from "./rate-limit.js";
import { recordHttpSecurityEvent } from "./http-security-events.js";

try {
  process.loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

const provider = createCoachProvider();
const agentProvider = createAgentProvider();
const server = createCoachServer(
  provider,
  { onUsage: recordProviderUsage },
  {
    rateLimiter: createRequestRateLimiter({ limit: 5, windowMs: 10 * 60 * 1_000 }),
    agentRateLimiter: createRequestRateLimiter({ limit: 5, windowMs: 60_000, scope: "global" }),
    onAgentSecurityEvent: recordHttpSecurityEvent,
  },
  agentProvider,
  { onUsage: recordAgentUsage, onSecurityEvent: recordAgentSecurityEvent },
);
server.listen(coachServerConfig.port, coachServerConfig.host, () => {
  process.stdout.write(
    `Coach API listening on http://${coachServerConfig.host}:${coachServerConfig.port} (${provider.name}/${provider.model}; agent ${agentProvider.name}/${agentProvider.model})\n`,
  );
});

function shutdown(): void {
  server.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
