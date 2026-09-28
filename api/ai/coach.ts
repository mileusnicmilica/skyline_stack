import { createCoachRequestHandler } from "../../server/index.js";
import { recordProviderUsage } from "../../server/provider-usage.js";
import { createCoachProvider } from "../../server/providers/provider-config.js";
import { createRequestRateLimiter } from "../../server/rate-limit.js";

const provider = createCoachProvider();
const rateLimiter = createRequestRateLimiter({ limit: 5, windowMs: 10 * 60 * 1_000 });

export default createCoachRequestHandler(
  provider,
  { onUsage: recordProviderUsage },
  { rateLimiter },
);
