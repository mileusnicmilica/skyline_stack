# W08 split and integration handoff: Milica and Nemanja

**Decision recorded:** 2026-10-26. Milica asked for the implementation to be divided between her and Nemanja and explicitly authorized work on her half now. This records ownership and an implementation handoff, not a claim that Nemanja has reviewed, coded, tested or approved anything. Codex assistance is not a second human contribution.

## Milica's block: HTTP and browser boundary

| Responsibility | Owned files / proof | W08 scenarios |
|---|---|---|
| HTTP ingress, exact request/error policy, 64 KiB pre-parse cap and five-second body deadline | `server/index.ts`, focused `tests/server/w08-http.test.ts` and `tests/server/w08-client-integrity.test.ts` | T00-T03, HTTP part of T15 |
| Local admission: global five-per-60-second window, two active *underlying* jobs, forged-header resistance and recovery | `server/rate-limit.ts`, `server/main.ts`, `api/ai/next-drill.ts`, optional small admission module, `tests/server/w08-admission.test.ts` | T13, T17 and HTTP lifecycle part of T12 |
| Browser text sinks, normal text, same-origin behavior and production headers | `src/main.ts`, `src/agent/next-drill-client.ts` only if a measured gap requires change; `vite.config.ts`, `vercel.json`, browser test harness | T04, T05, T16, browser part of T15, origin probe |

Milica's protection contribution is the aggregate HTTP admission boundary and/or active CSP. Her negative test contribution is the direct HTTP admission/forged-header case and/or real-browser XSS/CSP case. Actual human review and test execution are recorded in evidence only after they happen. The implementation in this workspace is Codex-assisted work for Milica's block.

## Nemanja's block: agent, tool and provider boundary

| Responsibility | Owned files / proof | W08 scenarios |
|---|---|---|
| Model decision, tool argument, domain, same-run evidence and final validation | `server/agent/{types,validate-request,run,evaluate-drill,drills}.ts`, fake fixtures and agent/game-integrity tests | T06-T10, agent part of T15 |
| Model context and response bounds, provider transport and token limit, attempts/retries/deadline/cancellation | `server/providers/gemini-agent-provider.ts`, `tests/server/w08-reliability.test.ts` | T06, T11, T12 |
| Structured security events and secret sentinel proof | `server/agent/usage.ts`, `tests/server/w08-secrets-events.test.ts` | T10, T14 |

Nemanja should personally review this split, contribute at least one code protection and one negative test, then review Milica's diff. This table is an assignment, not evidence of his completed work. The W05 two-decision/one-tool positive flow is the shared regression gate.

### Task ownership by ID

| Lead | Task IDs or named subparts | Completion rule |
|---|---|---|
| Milica | T002-T004 baseline/data inventory; T008 HTTP T00-T03; T010 browser/client-score cases; HTTP part of T011; T015, T017, T019, T020, T023, T024, T026 | Her code and negative tests may be checked independently; shared tasks remain open if another subpart is pending. |
| Nemanja | T005-T006 fake fixture/event foundation; T009 agent T06-T10; agent/tool part of T010/T011; T012-T013; T016, T018, T021; agent/event part of T022; sentinel/agent part of T029 | His assigned tests and protections must be authored/reviewed by him and recorded factually. |
| Both / integration | T001 pair review, T007 expectation lock, T014 full regression, HTTP part of T022, T025 combined proof, T027-T032 final command/audit/evidence/review/demo; optional T033 only after mandatory completion | One integrator edits shared docs/scripts at a time. A whole task is checked only when every named subpart is observed. |

## Shared seam and no-conflict rule

Milica's admission lease must remain occupied until `runNextDrill` has returned **and every underlying provider/tool promise it started has settled**. The current runner uses `Promise.race`; its visible timeout alone does not prove that work ended. Milica can track promises through a wrapper around the injected `AgentProvider.generate` and injected tool at the HTTP boundary. Nemanja can later add a runner hook if integration tests demonstrate that the wrapper misses work. Any hook or type change in `server/agent/*` is Nemanja-owned; coordinate the shape before editing both sides. A cancelled request must not turn a late provider result into success.

Milica's HTTP handler now enforces the W08 4096 px width and ±4096 px offset envelope after the older shared shape/geometry parser. The direct `runNextDrill` input validator currently relies on the older parser without that W08 envelope. Nemanja must add the matching bound in `server/agent/validate-request.ts` and prove direct-run denials, then both sides should review whether the HTTP duplicate can be replaced with one shared validator without weakening the W04 Coach route.

The HTTP handler now emits generated-ID denial/admission/completion events through `server/http-security-events.ts`; local and production routes wire the sanitized logger. The independent agent usage record currently uses its own server-generated run ID. Nemanja should join the two layers with a server-generated trace link in his event integration, while keeping the incoming request unable to choose either ID. Until that integration, the HTTP response header and recommendation/run usage provide separate identifiers.

Milica's HTTP response contract follows `contracts/next-drill-security.md`: `INVALID_REQUEST` 400, `METHOD_NOT_ALLOWED` 405, `REQUEST_TOO_LARGE` 413, `REQUEST_TIMEOUT` 408, `RATE_LIMITED`/`CONCURRENCY_LIMIT` 429, `PROVIDER_RATE_LIMITED` 429, `AGENT_TIMEOUT` 504, and `AGENT_UNAVAILABLE` 503. Nemanja's runner still returns its typed stop reason; Milica maps it to the public code without exposing raw errors. The same client request shape, fixed tool name, 3 decisions/4 attempts/2 tool calls, 8-second attempt and 25-second run ceilings remain shared contracts.

The public Vercel route currently runs in an instance-local process. A local in-memory 5/60 limiter and two-slot cap cannot promise a global quota across separate serverless instances. Neither partner should claim public production cost control until a trustworthy deployment-wide admission mechanism is chosen and tested. The W08 local fake-provider exercise can state this as a residual risk.

`docs/EVIDENCE_W08.md`, `package.json`, shared Spec Kit artifacts, final audit and full verification are integration-owned. Each partner contributes observed results to a named section; only one person edits the final evidence at a time. Initial checkpoint, task expectations and prior baseline commands are documented before code claims. Do not mark Nemanja's work or the joint demo complete without his actual actions.

## Review and delivery gates

1. Milica's block: direct HTTP denial and positive boundary tests, T13/T17 counters, real-browser T04/T05/T16, typecheck/build and existing W04/W05 regressions.
2. Nemanja's block: fake agent/tool/provider tests T06-T12/T14, safe event proof, and independent review of Milica's boundary.
3. Together: reconcile T00-T17, three comparable before/after probes, data inventory, six risks, dependency audit, synthetic-secret scan, complete evidence, swap reviewer/driver, and rehearse one success plus two denial traces.
4. Commit and submission details must identify actual human contributions. Sending assignment email and deployment are separate actions; neither is implied by this handoff.

**Current state:** Milica's block is locally implemented and verified: `npm.cmd run test:security:w08:milica` passed 4 focused files / 18 tests plus build and Edge browser checks; complete fake `npm.cmd run verify` passed 29 files / 179 tests and the existing W04/W05 smoke; current lockfile `npm.cmd audit --json` reports 0 known advisories after targeted dev dependency updates. These commands were run through Codex assistance; Milica's own diff review remains to be recorded. Nemanja's implementation/review, pair role rotation, full W08 suite, final evidence, and joint demo are pending.
