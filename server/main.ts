import { createCoachServer, coachServerConfig } from "./index";
import { recordProviderUsage } from "./provider-usage";
import { createCoachProvider } from "./providers/provider-config";

try {
  process.loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

const provider = createCoachProvider();
const server = createCoachServer(provider, { onUsage: recordProviderUsage });
server.listen(coachServerConfig.port, coachServerConfig.host, () => {
  process.stdout.write(
    `Coach API listening on http://${coachServerConfig.host}:${coachServerConfig.port} (${provider.name}/${provider.model})\n`,
  );
});

function shutdown(): void {
  server.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
