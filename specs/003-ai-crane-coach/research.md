# Research: AI Crane Coach

**Date**: 2026-09-26

## Backend shape and TypeScript execution

**Decision**: Use a separate `server/` TypeScript process on loopback, built on
Node's `node:http`, with `tsx` as the TypeScript runner and `@types/node` for
server typechecking. Start it alongside Vite through a small Node child-process
coordinator. Keep validation/statistics/provider orchestration as pure modules
so Vitest can test them without opening a port.

**Rationale**: This is one bounded endpoint and does not need a web framework.
It meets the explicit frontend/backend separation while keeping the runtime
dependency footprint small. Node 24 can strip erasable TypeScript, but its
native type stripping ignores `tsconfig`, has syntax/import constraints, and
does not automatically fit the repo's browser-oriented TypeScript settings.
Using a dedicated runner and server tsconfig is clearer for this project.

**Alternatives considered**: Hono plus `@hono/node-server` offers convenient
routing/middleware but adds a runtime framework/adapter for one endpoint.
Node's native type stripping avoids a runner dependency but makes the current
TypeScript setup and imports more constrained. Browser-side provider requests
are rejected because they expose credentials and violate the security
boundary.

**Local routing**: Vite `server.proxy` and `preview.proxy` route same-origin
`/api` requests to a loopback backend. `vite preview` does not start the API,
so the verification runner must start and clean up both processes.

Sources (official):
- [Node.js TypeScript support](https://nodejs.org/download/release/v24.20.0/docs/api/typescript.html)
- [Node.js HTTP](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html)
- [Vite 8 server proxy](https://v8.vite.dev/config/server-options)
- [Vite 8 preview proxy](https://v8.vite.dev/config/preview-options)
- [Hono Node.js adapter](https://hono.dev/docs/getting-started/nodejs)

## Provider/model (Milica's later block)

**Decision**: Plan against Google Gemini API model ID `gemini-3.1-flash-lite`.
Use Gemini structured JSON output when implementing the live adapter, while
retaining independent runtime schema and semantic validation.

**Rationale**: Google's official model and pricing pages identify it as a
stable Flash-Lite model and price it below Gemini 3.5 Flash-Lite. Its ability
to produce a short explanation from already calculated facts is sufficient;
the more expensive model is not justified for this task. Gemini 2.5 Flash-Lite
is cheaper on the pricing page but Google documents access restrictions for
users who have not already used it and recommends newer models for new
projects, so it is not a reliable new-project choice.

At the 2026-09-26 check, the standard paid tier listed text pricing of
$0.25/1M input tokens and $1.50/1M output tokens for Gemini 3.1 Flash-Lite,
versus $0.30/1M input and $2.50/1M output for Gemini 3.5 Flash-Lite. Pricing
and model availability can change; Milica should recheck them before wiring the
live provider. Google's pricing page also distinguishes free-tier data use
(content may be used to improve products) from paid-tier use (not used for
that purpose), so the integration should send no personal data and use the
appropriate account/data controls for a live demonstration.

**Alternatives considered**: `gemini-3.5-flash-lite` is a supported structured
output alternative but costs more. `gemini-2.5-flash-lite` is lower-cost but
has access caveats. No model should be trusted to calculate game statistics;
the backend calculates facts deterministically.

Sources (official Google documentation, checked 2026-09-26):
- [Gemini 3.1 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Structured outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)

## Security and reliability choices

- Provider key is read only by the server; `.env.example` may name the
  variable but must contain no value. Never use a `VITE_`-prefixed secret.
- Do not log prompts, keys, provider bodies, or submitted session data.
- Limit request body bytes before parsing; bind server to `127.0.0.1`; accept
  only `POST` JSON at the defined path.
- Invalid input and deterministic malformed model output are never retried.
- The entire external call path is bounded to approximately 10 seconds with
  at most one transient retry and short backoff, leaving margin for the
  12-second user-visible requirement.
- Nemanja's block uses an injected fake provider only; live provider wiring,
  UI, and real credential use are reserved for Milica.
