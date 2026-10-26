# Tasks: W08 Secure the Arcade

**Input**: [spec](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [security contract](contracts/next-drill-security.md), [quickstart](quickstart.md)  
**Status**: Both technical blocks and the fake-only W08 suite are locally implemented and verified at code checkpoint `0b880f9` on 2026-10-26. Explicit full pair approval, personally attributable protection/test activity, role rotation and demo remain open; see [pair handoff](handoff-milica-nemanja.md).

## Phase 1 — Approval and checkpoint

**Gate**: Milica authorized her block, and Nemanja explicitly authorized completion of his block on 2026-10-26. Nemanja reports that both members reviewed the W08 documents and code. T001 remains open because a distinct, explicit full-pair approval and planned role rotation have not been recorded.

- [ ] **T001** Record explicit pair review/approval of `specs/005-secure-the-arcade/spec.md`, `plan.md`, and `tasks.md`; record actual participant names and proposed role rotation in `docs/EVIDENCE_W08.md`. Do not infer approval from this draft.
- [x] **T002** Copy the observed initial commit and baseline command results from `plan.md`/`quickstart.md` into `docs/EVIDENCE_W08.md`; preserve the unrelated untracked report and capture a new `git status` before code edits.
- [x] **T003** Recheck `src/`, `server/`, `api/` and Vercel configuration for actual data sources, cookies, private resources, origin behavior and all browser sinks, including W04 Coach; finalize six risk scenarios, three priorities, an architecture diagram and a per-field inventory (controller, check, use, model exposure, storage) in `docs/EVIDENCE_W08.md` without claiming unrun outcomes.
- [x] **T004** Select and run three baseline probes using identical future fixtures and predeclared expectations, starting with T13, T16 and T06/T12 candidates; lock their input/output in `docs/EVIDENCE_W08.md`. If already safe, retain a regression case and choose another measured gap.

## Phase 2 — Shared test and policy foundation

- [x] **T005 [P]** Add reusable synthetic W05 run, fake provider, counter and delayed-provider fixtures under `tests/server/w08-fixtures.ts`; ensure they never select live mode and expose underlying active-work counts.
- [x] **T006 [P]** Add W08 security event and admission contracts to `server/agent/types.ts` or a narrowly scoped new server module; enumerate reason codes and safe fields before implementation.
- [x] **T007** Lock the expected T00–T17 outcomes from `contracts/next-drill-security.md` in test descriptions before fixes; map each test to I1–I8 in `docs/EVIDENCE_W08.md`. Do not assert a result that has not been observed.

## Phase 3 — User Story 1: valid agent path with strict boundaries (P1)

**Independent check**: T00–T03 and T06–T10 show a successful two-decision/one-tool path and denials with measured effects.

### Tests first

- [x] **T008 [US1]** Add direct HTTP T00–T03 cases in `tests/server/w08-http.test.ts`: malformed JSON, missing/null/type/domain errors, numeric range edges, 64 KiB boundary and +1 byte, five-second stalled-body deadline, policy fields and resource/owner ID extras separately, valid boundary, provider/tool counters and public status/code mapping.
- [x] **T009 [US1]** Add T06–T10 fake-agent cases in `tests/server/w08-agent.test.ts`: oversized/extra/malformed decisions and finals, `constructor`/`toString`/unknown tools, bad tool args, a valid-args result with another run's counts, malicious model proposal, bad/extra/oversized tool evidence, same-run final and positive allowed tool.
- [x] **T010 [US1]** Add T15 game-integrity cases in `tests/server/w08-game-integrity.test.ts` and the browser harness: client score/drop changes never grant provider selection, more budget or verified status; read-only tool preserves canonical state before/after.

### Targeted implementation and proof

- [x] **T011 [US1]** Tighten only measured request/parser gaps in `server/index.ts`, `server/agent/validate-request.ts` and shared run validation; keep the body cap before JSON parsing and exact W05 request contract.
- [x] **T012 [US1]** Tighten model decision, tool dispatch, domain/scope, tool evidence and final checks in `server/agent/run.ts` and `server/agent/evaluate-drill.ts`; preserve fixed `evaluate_drill` and two-step normal success.
- [x] **T013 [US1]** Bound the model context to 2 KiB, serialized decision to 4 KiB and upstream provider envelope to 32 KiB; set a 512-token server-side generation output budget and explicit retry behavior in `server/agent/run.ts` and `server/providers/gemini-agent-provider.ts`. Prove a synthetic oversized response is stopped before full JSON parse where transport permits; document remaining remote-work limits.
- [x] **T014 [US1]** Re-run T00–T03/T06–T10/T15 plus existing W04/W05 regression tests; record actual provider/tool/state counts and update exact contract only if the observed design requires an approved correction.

## Phase 4 — User Story 2: safe browser and bounded service (P2)

**Independent check**: T04/T05 real browser, T11–T14 HTTP/time probes and T16 built-page checks pass; after denials a normal request still succeeds.

### Tests first

- [x] **T015 [US2]** Extend `tests/browser-smoke.mjs` or a dedicated `tests/w08-browser.mjs` with controlled W05 and W04 Coach response delivery for T04/T05: harmless XSS marker, raw HTML/link scheme, DOM inspection, execution marker and normal Serbian/apostrophe/`a < b` text.
- [x] **T016 [US2]** Add T11/T12 delayed fake-clock/provider tests in `tests/server/w08-reliability.test.ts`: repeated call, separate step/attempt budget, per-call timeout, a cumulative-deadline case where each call stays under its own timeout but their sum crosses 25 s, abort-ignoring late return, no late success and capacity lifecycle.
- [x] **T017 [US2]** Add live local HTTP T13/T17 tests in `tests/server/w08-admission.test.ts`: at most two active underlying jobs, excess 429 before provider, recovery, five-in-60-second global pre-body window and forged forwarded-header attempts. Explain why T13's separate probes do not prove the combined T17 chain.
- [x] **T018 [US2]** Add T14 tests in `tests/server/w08-secrets-events.test.ts`: actually loaded synthetic sentinel, adapter error and extra tool field, no raw content in response/model/event, newline log-injection input, positive bounded event fields.
- [x] **T019 [US2]** Add T16 built-site browser/header test in `tests/w08-browser.mjs` or a focused script: inspect active headers, use a known reachable forbidden script, observe the CSP directive's block without test-runner CSP bypass, then verify gameplay and W05 fake display.

### Targeted implementation and proof

- [x] **T020 [US2]** Add two-slot active-work admission after validation and a global five-per-60-second local W05 window before full body parsing in `server/index.ts` and `server/rate-limit.ts` or a small dedicated module. Malformed attempts consume the protective window; do not trust caller-supplied forwarding headers for the local quota.
- [x] **T021 [US2]** Rework deadline/cancellation bookkeeping in `server/agent/run.ts` and provider adapter so late results cannot succeed and an abort-ignoring underlying promise does not release admission capacity early. Bound deterministic evaluator work explicitly.
- [x] **T022 [US2]** Define small enumerated security events in `server/agent/usage.ts` and wire admission/denial/completion events from the HTTP and agent path; sanitize responses in `server/index.ts` without copying raw text or secrets.
- [x] **T023 [US2]** Keep `src/main.ts` text-only and `src/agent/next-drill-client.ts` runtime response validation; fix only real T04/T05 failures. Record the URL/HTML policy rather than introducing Markdown or sanitizer dependencies.
- [x] **T024 [US2]** Add matching built-site `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` response headers to `vite.config.ts` preview and `vercel.json`; verify that existing assets and API connection obey the chosen policy.
- [x] **T025 [US2]** Re-run T04/T05/T11–T14/T16/T17 and a positive game/agent browser smoke. Capture actual active-job maxima, late-result behavior, DOM state, header values, CSP violation and safe next request in `docs/EVIDENCE_W08.md`.

## Phase 5 — User Story 3: reproducible evidence and submission readiness (P3)

**Independent check**: A reviewer can run the documented fake suite and understand exactly what passed, failed or remains local-only.

- [x] **T026 [US3]** Audit actual same-origin, credential and access behavior in `server/index.ts`, `api/ai/next-drill.ts` and browser requests. Test a second local origin's JSON preflight and simple POST for actual server/provider effects regardless of credentials; document public-endpoint cost admission. If ambient credentials exist, add a dedicated CSRF test and fitting protection; otherwise explain CSRF non-applicability. Document public/demo scope and unverified scores.
- [x] **T027 [US3]** Add `test:security:w08` to `package.json` as one fake-only command or a documented small command set; include T00–T15/T17 and preserve existing test commands. Ensure a local `.env` cannot silently select a live provider in adversarial tests.
- [x] **T028 [US3]** Run `npm.cmd audit --json` on `package-lock.json`; record package/version/advisory, runtime-versus-development use, exposure conditions and decision in `docs/EVIDENCE_W08.md`. Apply only justified dependency fixes, then rerun relevant regressions. Record a failed audit as uncertainty, not PASS.
- [x] **T029 [US3]** Run synthetic sentinel checks against server load, `dist/` and source maps, HTTP responses, model contexts and operational events; record the actual searched value and sanitized evidence. After all code/test gates pass, record a tested final-code checkpoint commit for `docs/EVIDENCE_W08.md`; the later evidence commit can be identified in the submission message.
- [ ] **T030 [US3]** Complete `docs/EVIDENCE_W08.md`: initial and tested final-code checkpoint commits, environment/commands, diagram and per-field inventory, six risks/three priorities, I1–I8 rule/control/test map, policy values, T00–T17 applicability/fixture/expected/observed/test location and effect counters, three same-fixture pre/post comparisons, a redacted security event, residual risk with next concrete test, and actual pair/AI contributions including what AI suggested and how accepted changes were checked.
- [x] **T031 [US3]** Execute the final fake-only typecheck, W08 security suite, full tests, build, local production browser smoke, existing secret scan and audit decision checks. Record commands, exit codes and counts; review the final diff for raw secrets/private data and untracked-file preservation.
- [ ] **T032 [US3]** Have both members each contribute at least one protection and one negative test, review one successful and two different denied traces, swap driver/reviewer roles, and rehearse the eight-minute demo. Record only actual actions and explanations. Prepare the evidence commit and submission summary; do not send mail or deploy without separate user action.

## Phase 6 — One optional extension after mandatory completion

- [ ] **T033** If T001–T032 are complete, add one seeded, bounded property-based request-validation test (T01/T02 invariant) in `tests/server/w08-property.test.ts`; pin seed/trial count and record the observed result. Do not add a second optional challenge.

## Dependencies and execution order

T001 remains the explicit pair approval record; each technical block was separately authorized by its owner on 2026-10-26. T002–T031 technical implementation, test and reproducibility work is recorded in `docs/EVIDENCE_W08.md`. T030 remains open for factual personally attributable pair activity; T032 requires both members' role rotation and demo. T033 is optional and cannot compensate for a mandatory gap.

## Requirement coverage

| Requirement | Tasks |
|---|---|
| FR-001–FR-004 | T005, T008–T014, T031 |
| FR-005–FR-007 | T009–T012, T014, T026 |
| FR-008–FR-009 | T015, T019, T023–T025 |
| FR-010–FR-011 | T013, T016–T017, T020–T021, T025 |
| FR-012–FR-014 | T018, T022, T029, T031 |
| FR-015–FR-016 | T003, T017, T026, T028 |
| FR-017–FR-019 | T001–T004, T007, T025, T027, T030–T032 |

Independent work can be split by file: one partner writes server fake/HTTP tests while the other prepares browser/header tests; swap roles for implementation review. The tasks are a plan, not a claim that either member has done work. All final evidence must come from actual runs.
