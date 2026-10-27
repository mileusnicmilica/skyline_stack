# W08 split and integration handoff: Milica and Nemanja

**Decision recorded:** 2026-10-26. Milica and Nemanja separately authorized their technical blocks. Nemanja reports that both reviewed the documents and code. On 2026-10-27 Milica Mileusnić explicitly approved the three W08 documents, and Nemanja Manić's earlier explicit approval was recorded; Milica reports his authorization for her to confirm his draft. The split and approvals do not prove personal code authorship, test execution or exact demo observations. Codex assistance is not a second human contribution.

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

Nemanja's assigned code and negative tests are implemented with Codex assistance. He and Milica still need to demonstrate each person's own protection and negative test, and record the role rotation. The W05 two-decision/one-tool positive flow passed the shared regression gate.

### Task ownership by ID

| Lead | Task IDs or named subparts | Completion rule |
|---|---|---|
| Milica | T002-T004 baseline/data inventory; T008 HTTP T00-T03; T010 browser/client-score cases; HTTP part of T011; T015, T017, T019, T020, T023, T024, T026 | Her code and negative tests may be checked independently; shared tasks remain open if another subpart is pending. |
| Nemanja | T005-T006 fake fixture/event foundation; T009 agent T06-T10; agent/tool part of T010/T011; T012-T013; T016, T018, T021; agent/event part of T022; sentinel/agent part of T029 | His assigned tests and protections must be authored/reviewed by him and recorded factually. |
| Both / integration | T001 pair review, T007 expectation lock, T014 full regression, HTTP part of T022, T025 combined proof, T027-T032 final command/audit/evidence/review/demo; optional T033 only after mandatory completion | One integrator edits shared docs/scripts at a time. A whole task is checked only when every named subpart is observed. |

## Shared seam and no-conflict rule

The admission lease remains occupied until `runNextDrill` has returned **and every underlying provider/tool promise it started has settled**. The HTTP wrapper tracks both kinds of promise. Follow-up audit reproduced two runs with four unfinished provider calls because timeout retries overlapped abort-ignoring calls. Timeout is now terminal, while settled transient failures can still retry within the total budget. The combined regression proves two unfinished provider calls maximum, blocked excess work, no late continuation and recovery. The user authorized these integration corrections across both blocks; this is Codex-assisted work, not additional personally authored work by either member.

The W08 4096 px width and +/-4096 px offset envelope is now enforced by the shared validator in `server/agent/validate-request.ts` for HTTP and direct agent calls. Direct-run negative tests and the existing W04 regression passed.

The HTTP handler emits generated-ID denial/admission/completion events through `server/http-security-events.ts`; local and production routes wire the sanitized logger. Agent events and usage now carry a server-generated trace link. The request cannot choose either ID, and the linked event test excludes raw content and the synthetic secret.

Milica's HTTP response contract follows `contracts/next-drill-security.md`: `INVALID_REQUEST` 400, `METHOD_NOT_ALLOWED` 405, `REQUEST_TOO_LARGE` 413, `REQUEST_TIMEOUT` 408, `RATE_LIMITED`/`CONCURRENCY_LIMIT` 429, `PROVIDER_RATE_LIMITED` 429, `AGENT_TIMEOUT` 504, and `AGENT_UNAVAILABLE` 503. Nemanja's runner still returns its typed stop reason; Milica maps it to the public code without exposing raw errors. The same client request shape, fixed tool name, 3 decisions/4 attempts/2 tool calls, 8-second attempt and 25-second run ceilings remain shared contracts.

The public Vercel route currently runs in an instance-local process. A local in-memory 5/60 limiter and two-slot cap cannot promise a global quota across separate serverless instances. Neither partner should claim public production cost control until a trustworthy deployment-wide admission mechanism is chosen and tested. The W08 local fake-provider exercise can state this as a residual risk.

`docs/EVIDENCE_W08.md`, `package.json`, shared Spec Kit artifacts, final audit and full verification are integration-owned. The technical evidence is recorded; personally attributable pair work and the demo stay open until the people perform and describe them. Do not infer human authorship from Codex-assisted commits.

## Review and delivery gates

1. Milica's block: direct HTTP denial and positive boundary tests, T13/T17 counters, real-browser T04/T05/T16, typecheck/build and existing W04/W05 regressions.
2. Nemanja's block: fake agent/tool/provider tests T06-T12/T14, safe event proof, and independent review of Milica's boundary.
3. Together: reconcile T00-T17, three comparable before/after probes, data inventory, six risks, dependency audit, synthetic-secret scan, complete evidence, swap reviewer/driver, and rehearse one success plus two denial traces.
4. Commit and submission details must identify actual human contributions. Sending assignment email and deployment are separate actions; neither is implied by this handoff.

**Current state:** Both technical blocks and follow-up timeout/build-secret/Origin corrections are implemented. Current counts, tested checkpoint and command results are maintained in `docs/EVIDENCE_W08.md`. Codex ran the recorded checks; both document approvals and proposed role rotation are recorded. Each person's exact protection/test actions and observed role rotation/demo traces remain open. Follow [demo-guide.md](demo-guide.md) and return its factual confirmation template; running a guide is not automatically evidence of code authorship.
