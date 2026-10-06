# Tasks: Next Drill Agent

**Input**: [spec](spec.md), [plan](plan.md), [contracts](contracts/), [evals](AGENT_EVALS.md)  
**Status**: Phase A approval observed; fake implementation and convergence tasks verified. T001's role-recording portion and T030 joint demo remain open pending actual pair input.

## Phase 1: Setup

**Goal**: Establish the W04 baseline and safe implementation boundary.

- [ ] T001 Confirm pair review/approval of `specs/004-next-drill-agent/spec.md`, `plan.md`, and `tasks.md`; record agreed roles in `docs/EVIDENCE_W05.md` before code changes (approval observed in chat; role agreement was not recorded before implementation and cannot be retroactively claimed)
- [x] T002 Re-run `npm.cmd run verify` with `AI_COACH_PROVIDER=fake` and record observed W04 baseline in `docs/EVIDENCE_W05.md`

## Phase 2: Foundation

**Goal**: Share validated run facts and define the W05 decision contract.

- [x] T003 Extract or export W04 completed-run parsing/statistics from `server/coach/analysis.ts` for W05 reuse, preserving W04 behavior and the pre-existing working-tree change
- [x] T004 [P] Define exact W05 request, decision, evidence, result, stop-reason, and budget types in `server/agent/types.ts`
- [x] T005 [P] Add shared 3-drill labels/instructions and safe result text in `server/agent/drills.ts`
- [x] T006 Write failing fixed-goal request validation and zero-provider-call tests in `tests/server/next-drill-agent.test.ts`
- [x] T007 Implement fixed-goal request validation in `server/agent/validate-request.ts` using W04's completed-run rules

## Phase 3: User Story 1 - Choose the next drill (P1) MVP

**Goal**: A finished run produces one tool-supported practice recommendation.
**Independent Test**: E01–E03 and E07 with fake model decisions; response cites a supported tool result between model steps.

### Tests

- [x] T008 [P] [US1] Write failing candidate/evidence/tool-output contract tests in `tests/server/evaluate-drill.test.ts`
- [x] T009 [P] [US1] Write failing two-step success, unsupported-first recovery, and final-evidence tests in `tests/server/next-drill-agent.test.ts`
- [x] T010 [P] [US1] Write failing success HTTP contract test for `POST /api/ai/next-drill` in `tests/server/next-drill-http.test.ts`
- [x] T011 [P] [US1] Write failing client response-validation test in `tests/next-drill-client.test.ts`

### Implementation

- [x] T012 [US1] Implement exact-argument allowlist and deterministic read-only evaluator in `server/agent/evaluate-drill.ts`; validate the normalized result before model reuse
- [x] T013 [US1] Add injectable decision-provider interface and deterministic two-step fake provider in `server/agent/types.ts` and `server/providers/fake-agent-provider.ts`
- [x] T014 [US1] Implement bounded decision loop, same-run evidence matching, and fixed-text final composition in `server/agent/run.ts`
- [x] T015 [US1] Add separate W05 route, JSON/method/body checks, and safe responses in `server/index.ts` without altering the W04 route
- [x] T016 [US1] Configure fake W05 provider in `server/main.ts` using the existing server provider mode
- [x] T017 [US1] Add post-Game-Over client request/response validation in `src/agent/next-drill-client.ts`
- [x] T018 [US1] Add **Predloži vežbu** control, result panel, and pending/success/unavailable UI in `index.html`, `src/main.ts`, and `src/style.css`

## Phase 4: User Story 2 - Stay bounded and keep the game usable (P2)

**Goal**: Reject unsafe proposals, stop on every limit/failure, and leave W04/gameplay working.
**Independent Test**: E04–E06 and E08–E15 with a scripted fake provider; rejected first proposal executes zero tools.

### Tests

- [x] T019 [P] [US2] Add failing unknown-tool, invalid-argument, malformed-output, repeated-call, and invalid-final tests with `toolCallCount === 0` assertions where applicable in `tests/server/next-drill-agent.test.ts`
- [x] T020 [P] [US2] Add failing provider retry/timeout/deadline/max-step/call-budget and tool-failure tests in `tests/server/next-drill-reliability.test.ts`
- [x] T021 [P] [US2] Add failing invalid request, wrong method, and wrong content-type HTTP tests in `tests/server/next-drill-http.test.ts`
- [x] T022 [P] [US2] Add failing duplicate-request and stale-after-Restart tests in `tests/next-drill-client.test.ts` and `tests/browser-smoke.mjs`

### Implementation

- [x] T023 [US2] Enforce strict decision parsing, proposal repetition detection, two tool calls, three model steps, four provider attempts, per-attempt timeout, total deadline, and safe stop reasons in `server/agent/run.ts`
- [x] T024 [US2] Add abort-aware Gemini decision adapter, server-only credential handling, and bounded structured output in `server/providers/gemini-agent-provider.ts`; select it in `server/main.ts` only for configured live mode
- [x] T025 [US2] Add sanitized run/step usage records without prompts, drops, or secrets in `server/agent/usage.ts`; wire the hook from `server/main.ts`
- [x] T026 [US2] Block duplicate UI requests, cancel pending requests on Restart, discard stale results, and preserve W04 state in `src/main.ts` and `src/agent/next-drill-client.ts`
- [x] T027 [US2] Extend `tests/verify.mjs` and `tests/browser-smoke.mjs` to exercise fake W05 success/failure through the preview proxy while retaining W04 checks

## Phase 5: Verification and evidence

- [x] T028 Run the W05 fake eval matrix in `specs/004-next-drill-agent/AGENT_EVALS.md`, full `AI_COACH_PROVIDER=fake` verification, secret scan, and diff review; record actual counts/stop reasons in `docs/EVIDENCE_W05.md`
- [x] T029 Perform at most one intentional live W05 agent run after fake tests and pair review; record actual provider/model, steps, attempts, tool calls, latency, outcome, and limitation in `docs/EVIDENCE_W05.md` and `docs/AI_USAGE_LOG.md`
- [ ] T030 Have Nemanja and Milica each explain a successful and rejected-tool trace and conduct the joint demo; record actual contributions and completion in `docs/EVIDENCE_W05.md`
- [x] T031 Reconcile `specs/004-next-drill-agent/spec.md`, `plan.md`, `tasks.md`, contracts, tests, and observed evidence; leave any unperformed task unchecked

## Dependencies and execution order

T001 is the constitution gate. T002–T007 establish shared facts and contracts. US1 tasks T008–T018 then produce the independently testable MVP. US2 tasks T019–T027 harden the same flow and may add tests in parallel on separate files. T028 precedes T029; T029 precedes final evidence and demo. Every test task is written before the implementation it covers and should be observed failing for the intended missing behavior.

## Parallel opportunities and pair handoff

T004/T005 and T008–T011 touch separate files. After a working fake MVP, UI/client work and Gemini adapter work can proceed on separate files, while the other person reviews tool validation and budgets. Proposed first driver: Nemanja; proposed first reviewer: Milica. Swap driver/reviewer before the UI/provider block. These are plans, not claims of completed contributions.

## Implementation strategy

First complete the fake success flow (US1), then every negative case (US2), then one bounded live run and evidence. The W04 one-shot Coach and W03 gameplay are regression gates throughout. No deployment is in scope.

## Phase 6: Convergence

- [x] T032 Wire bounded, independently counted W04 and W05 rate limits into the local API and verify W05 returns 429 before provider/tool work per research: rate limiting and contracts/next-drill-api.md (partial)
- [x] T033 Enforce the documented 25-second run and eight-second provider attempt as hard upper bounds even when execution options are injected; test oversized overrides per FR-006/SC-004 (partial)
- [x] T034 Distinguish tool timeout, provider unavailability, provider rate limit, and cancellation/deadline in safe stop reasons, HTTP responses, and step records per assignment §28 and FR-008/FR-011 (partial)
- [x] T035 Normalize provider token usage before logging, complete terminal step records, and bound retained W05 usage history per FR-011 and Constitution III (partial)
- [x] T036 Record reproducible, observed success/rejection/failure step traces and correct the T001 role-recording claim without inventing pair participation per assignment §39, FR-013, and Constitution III (partial)
