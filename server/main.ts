import { createCoachServer, coachServerConfig } from "./index";
import { fakeCoachProvider } from "./providers/fake-provider";

const server = createCoachServer(fakeCoachProvider);
server.listen(coachServerConfig.port, coachServerConfig.host, () => {
  process.stdout.write(`Coach API listening on http://${coachServerConfig.host}:${coachServerConfig.port}\n`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
