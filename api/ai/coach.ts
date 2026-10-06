import { createCoachRequestHandler } from "../../server/index.js";
import type { CoachProvider } from "../../server/coach/types.js";
import { recordProviderUsage } from "../../server/provider-usage.js";
import { createCoachProvider } from "../../server/providers/provider-config.js";
import { createRequestRateLimiter } from "../../server/rate-limit.js";

const provider = createCoachProvider();

export function createProductionCoachHandler(selectedProvider: CoachProvider = provider) {
  const rateLimiter = createRequestRateLimiter({ limit: 5, windowMs: 10 * 60 * 1_000, trustProxyHeaders: true });
  return createCoachRequestHandler(
    selectedProvider,
    { onUsage: recordProviderUsage },
    { rateLimiter },
  );
}

export default createProductionCoachHandler();
