# W08 Research and Threat Decisions

**State**: Planning review on 2026-10-26. Findings below come from inspected source; exploitability and test outcomes remain to be measured.

## Architecture and data inventory

The player controls an in-memory Canvas game in `src/main.ts`. At Game Over the browser sends a fixed goal, score, starting width and drop records to `/api/ai/next-drill`. `server/index.ts` caps raw HTTP body bytes and parses JSON; `server/agent/validate-request.ts` and shared `server/coach/analysis.ts` check exact fields and run consistency. `server/agent/run.ts` owns the loop, fixed tool and budgets. The provider receives goal, score, three timing counts, step number and validated evidence. `src/agent/next-drill-client.ts` validates the response and `src/main.ts` displays it with `textContent`.

| Data | Controller / trust | Validation and use | Sent to model? | Stored? |
|---|---|---|---|---|
| Goal | Browser request; fixed contract | Exact `choose_next_drill`; agent context | Yes, fixed value | No |
| Score, width, drop log | Browser; unverified play data | HTTP schema, run geometry; timing counts | Score and counts only | Browser memory during run; no server game store |
| Tool arguments | Provider decision; untrusted | Exact drill ID, then current-run facts are supplied by server | Validated evidence follows, raw arguments do not | One step only |
| `SKYLINE_STACK_CONFIG` | Browser global if present | `selectGameConfig` fallback | Derived run facts only | Browser memory |
| Model decision | Provider; untrusted | Exact action/name/argument/final parsing | Its own next-step context only as validated evidence | Bounded usage metadata, not raw decision |
| Tool result | Server tool or injected fake; validate anyway | Exact derived counts/evidence and 256-byte bound | Validated evidence only | Per run, then discarded |
| Provider credential | Server environment | Provider configuration | No | Server process only |
| Recommendation | Server-validated then browser-untrusted | Client contract, then `textContent` | No | Visible until Restart; no persistent history |
| Error/usage metadata | Server | Safe messages, bounded usage fields | No | Recent 100 usage records and stdout |

Source inspection found no `localStorage`, `sessionStorage`, URL-derived game parameters, account/session cookie, private resource ID, uploaded replay, Markdown renderer, SQL or browser fetch to arbitrary URL on the W05 path. This is an applicability finding to reconfirm during implementation, not a blanket claim for future code. `runId` is a correlation/evidence identifier, not an access token. The current game score is not server-confirmed.

## Concrete risks and priorities

Likelihood/impact refer to this repo's current local/demo architecture, not a general internet score. Evidence rows will be finalized only after tests.

| Priority | Scenario, precondition and affected resource | Likelihood / impact | Existing control | Planned proof |
|---|---|---|---|---|
| **P1** | Several direct HTTP requests pass the per-client window concurrently and each starts an AI run; the current W05 route has no active-run semaphore. Provider cost/CPU is affected. | Medium / high: easy parallel local calls, bounded within each run but aggregate unbounded until window. | Five-request window, per-run step/attempt/deadline caps. | T13 live local HTTP active counter, excess rejection before provider, cleanup and next success. |
| **P2** | A successful upstream response is fully parsed with `response.json()` in `gemini-agent-provider.ts` before an envelope byte cap; a large response consumes memory. | Low–medium / medium: provider or adapter fault needed, impact on API process. | Decision shape validation after parse; per-attempt deadline. | T06/T10 synthetic oversized stream/envelope, measured pre-parse rejection, safe result. |
| **P3** | Built frontend lacks a configured active CSP header in `vite.config.ts`/`vercel.json`; a future unsafe DOM insertion would have no CSP backstop. Browser execution is affected. | Medium / high: requires a rendering bug, but deployment header currently absent in repo configuration. | Current UI uses `textContent`; no raw HTML renderer seen. | T04/T05 real DOM test and T16 reachable blocked script plus normal browser smoke. |
| — | A forged browser run is internally consistent and gains a practice suggestion; if treated as verified score later, game integrity would be misstated. | High / low now: client can construct a run, but there is no verified leaderboard or privilege. | Geometry checks; no server score store. | T15 tampered state has no authority, document unverified label. |
| — | Model returns `constructor`, `toString`, `set_score` or invalid `evaluate_drill` args; accidental dynamic dispatch could execute unexpected behavior. | Medium / high if registry were open; current exact comparison lowers present likelihood. | Exact `evaluate_drill` comparison and argument parser. | T07/T08/T09 fake provider, zero forbidden tool executions and unchanged game state. |
| — | An extra tool-result field containing a synthetic secret or an adapter error is copied to model/response/log. | Medium / high: injected tool/adapter error path exists in tests; current exact tool validator and safe HTTP error lower risk. | `validateToolEvidence`, safe error response, structured usage. | T10/T14 sentinel across model context, response, logs and artifacts. |
| — | A timeout returns through `Promise.race` while an abort-ignoring provider continues; a newly freed slot could allow more underlying work. | Medium / high if third-party operation ignores abort; no cross-request slot exists yet. | AbortSignal passed to adapter, deadline checks reject late success. | T12/T13 delayed fake that ignores abort, count underlying active work until settlement. |
| — | A caller changes forwarded IP headers to evade a proxy-trusting in-memory limiter in `api/ai/next-drill.ts`, or uses fresh serverless instances. AI cost is affected. | Medium / medium in public live mode; actual ingress behavior needs validation. | Local `server/main.ts` ignores proxy headers; Vercel route currently trusts them. | T17 forged-header + concurrent HTTP case; document multi-instance limitation and require deployment-specific control for public live mode. |

## Decisions and alternatives

1. **Reuse strict handwritten contracts.** The existing parser checks exact keys and run geometry, and tool evidence is deterministic. Adding a schema package would add dependency risk without clear benefit for this narrow contract. Test missing/null/extra/boundary variants and factor only where duplication causes a real bug.
2. **Keep demo scope public and unverified.** There are no private resources or ambient authentication credentials to authorize. A fabricated but consistent drop log can receive advice, never a verified score. Adding login or anti-cheat is outside W08.
3. **Enforce a global local admission window.** Without trustworthy identity, a global five-per-minute process window is less misleading than a client-header key. It can inconvenience multiple local players; this is documented. A distributed store is required for a public multi-instance quota and is not silently assumed.
4. **Track underlying work for concurrency.** Timeout rejects the visible run, but capacity accounting must remain tied to actual provider/tool completion when abort is ignored. An eager slot release after `Promise.race` would falsify T13.
5. **Use built-site headers plus text rendering.** Vite's `preview.headers` and Vercel's `headers` configuration can set actual response headers. The existing UI has no rich text requirement. A strict same-origin script policy is feasible because the built HTML uses an external module asset and CSS file.
6. **Treat prompt injection as execution-policy proof.** The W05 model context has no free-form untrusted text, so an indirect text-channel injection would be fabricated. The required fake provider will deliberately propose a forbidden operation; T09 proves code-side denial, not that a real model resists all prompt injection.
7. **Choose one optional extension.** A seeded property-based test of the W05 request boundary is useful after required coverage. Write approval and replay import do not exist and would broaden scope.

## Primary references checked

- W08 assignment supplied by the user: `weekly-assignment (2).md`, sections 1–11. It is not copied into the repository; use the attached file when reviewing requirements.

| Planned boundary | Source from assignment chapter 11 |
|---|---|
| Runtime types and input/domain validation | [TypeScript erased types](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types), [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) |
| Resource scope and unverified score | [OWASP API1 object authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/), [OWASP Business Logic Security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html) |
| Safe text DOM and browser policy | [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [OWASP CSP](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), [MDN nosniff](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options), [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy) |
| Agent execution and aggregate budget | [OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), [OWASP API4 resource consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/), [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) |
| Secrets, events and dependencies | [Vite environment variables](https://vite.dev/guide/env-and-mode), [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [OWASP Vulnerable Dependency Management](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html) |
| Origin/credential applicability | [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) |

The assignment's React-specific HTML sink reference is inapplicable because this app is plain TypeScript/DOM, not React. For implementation details beyond its chapter 11, [Vite preview options](https://vite.dev/config/preview-options) and [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json) describe the two planned header delivery paths.

## Open verification questions for implementation

- Can the current Vite/Edge harness observe CSP `Security.cspViolationReported` or console diagnostics and intercept a controlled W05 response? Confirm before changing browser tests.
- Does the deployed Vercel ingress remove caller-supplied forwarding headers? Do not assume it. The local security claim will use a global process scope.
- Does the provider adapter's fetch response body support bounded streaming in the runtime used by the project? Measure with a synthetic stream; document any upstream billing limit.
- Which three baseline scenarios show an observable before/after delta? Measure first, then lock them without changing expected outcomes.
