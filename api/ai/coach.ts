import { createCoachRequestHandler } from "../../server/index.js";
import { recordProviderUsage } from "../../server/provider-usage.js";
import { createCoachProvider } from "../../server/providers/provider-config.js";

const provider = createCoachProvider();

export default createCoachRequestHandler(provider, { onUsage: recordProviderUsage });
