# Tasks: AI Crane Coach

**Input**: Design documents from `/specs/003-ai-crane-coach/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/coach-api.md

**Organization**: Tasks map to specification user stories. Each task is assigned
to Nemanja (first block) or Milica (later block). Do not start Milica's tasks
until Nemanja's API contract/fake-provider handoff is reviewed.

## Phase 1: Setup — Nemanja

**Purpose**: Establish a separate TypeScript server runtime without replacing
the current Vite/Vitest setup.

- [x] T001 [NEMANJA] Add only required server tooling (`tsx`, `@types/node`, and a process coordinator if needed) and update `package.json` plus `package-lock.json`.
- [x] T002 [P] [NEMANJA] Add an isolated `tsconfig.server.json` and adjust `npm run typecheck` to check browser and server code without weakening existing strict options.
- [x] T003 [NEMANJA] Add `vite.config.ts` with `/api` proxying in dev and preview to `127.0.0.1:3001`.
- [x] T004 [NEMANJA] Add `dev:api`, `dev:web`, and coordinated `dev:full` scripts that stop both processes on exit.

## Phase 2: Foundational API boundary — Nemanja

**Purpose**: Create a loopback-only backend process and its testable provider seam.

- [x] T005 [P] [NEMANJA] Add `tests/server/http.test.ts` for `/api/ai/coach` method/path/content-type/body-size handling and safe status/error contract; confirm tests fail first.
- [x] T006 [P] [NEMANJA] Add pure API types and provider interface in `server/coach/types.ts`.
- [x] T007 [NEMANJA] Implement the bounded JSON HTTP handler in `server/index.ts` and loopback-only process entry in `server/main.ts`, returning stable public errors and avoiding sensitive logging.
- [x] T008 [NEMANJA] Add `server/providers/fake-provider.ts` with deterministic advice from calculated statistics; make fake-provider mode the only available provider in this block.

## Phase 3: User Story 1 — Review a finished run (Priority: P1)

**Goal**: Produce deterministic run history, derive reliable facts on the
server, and expose validated advice through the local API seam.

**Independent Test**: Unit/contract tests construct a run fixture without
playing; a fake provider returns valid advice and only server-derived facts;
malformed or inconsistent output is rejected.

### Nemanja — first implementation block

- [x] T009 [P] [US1] [NEMANJA] Add `DropRecord` and `drops` to `src/game/model.ts`; update `tests/engine.test.ts` to assert one record per successful/missed landing and empty history on restart (test first).
- [x] T010 [US1] [NEMANJA] Record floor, signed center offset, direction, timing, and before/after width in `src/game/engine.ts` without changing score, overlap, or animation behavior.
- [x] T011 [P] [US1] [NEMANJA] Add request-validation and deterministic statistics tests in `tests/server/coach.test.ts`, including invalid score/log, NaN/infinite/negative values, impossible width changes, bad timing, terminal miss position, max count, and providerCallCount remaining zero (test first).
- [x] T012 [US1] [NEMANJA] Implement bounded `CoachRequest` validation and server-derived timing/offset/largest-loss statistics in `server/coach/analysis.ts`.
- [x] T013 [P] [US1] [NEMANJA] Add response shape and semantic validation tests in `tests/server/coach-response.test.ts`, including strings over limits, invalid enums, incorrect bias/floor, and rejection of null floor (test first).
- [x] T014 [US1] [NEMANJA] Implement response shape/semantic validation in `server/coach/validate-advice.ts` and compose validation + statistics + fake provider for `POST /api/ai/coach`.
- [x] T015 [US1] [NEMANJA] Document API request/error behavior, fake-provider limitations, and local commands in `README.md`; keep real `.env` ignored and commit only empty-value `.env.example`; preserve existing W03/V2 documentation and evidence.

### Milica — later implementation block (deferred)

- [ ] T016 [P] [US1] [MILICA — DEFERRED] Add live Gemini adapter for `gemini-3.1-flash-lite`, structured JSON output, server-only credential loading, and provider configuration tests in `server/providers/gemini-provider.ts`.
- [ ] T017 [US1] [MILICA — DEFERRED] Add a 10-second total provider deadline and at most one transient retry with bounded backoff; verify no retries for invalid input or deterministic malformed output.
- [ ] T018 [P] [US1] [MILICA — DEFERRED] Add Game Over-only “Analiziraj partiju” button, a client that sends only `{ finalScore, startingWidth, drops }`, and localized pending/advice states in `index.html`, `src/main.ts`, `src/style.css`, and `src/coach/coach-client.ts`.
- [ ] T019 [US1] [MILICA — DEFERRED] Prevent duplicate analysis requests and ignore stale results after restart in `src/main.ts`; keep Restart available after all outcomes.

## Phase 4: User Story 2 — Preserve play when analysis is unavailable (Priority: P2)

**Goal**: Invalid input, backend/provider failure, or malformed advice never
breaks the base game or exposes internal details.

**Independent Test**: Fake provider tests exercise failure, timeout, and
malformed-result behavior and prove the game is still restartable.

### Nemanja — first implementation block

- [x] T020 [P] [US2] [NEMANJA] Add tests proving unknown errors, oversized bodies, and fake-provider failure produce only the stable public message and never serialize exception details.
- [x] T021 [US2] [NEMANJA] Implement stable public error mapping in `server/index.ts`; keep diagnostics, prompts, requests, and provider content out of logs/responses.
- [x] T022 [US2] [NEMANJA] Add backend/API tests to the existing `npm test` and `npm run verify` path in `tests/verify.mjs`, starting and cleaning up backend plus preview processes.

### Milica — later implementation block (deferred)

- [ ] T023 [US2] [MILICA — DEFERRED] Add UI unavailable state and verify Restart starts a new playable run after unavailable, timeout, or malformed output.
- [ ] T024 [US2] [MILICA — DEFERRED] Confirm provider key never appears in client bundle, response, logs, docs, fixtures, or evidence; add a reproducible secret-boundary check.
- [ ] T025 [US2] [MILICA — DEFERRED] Capture and document redacted fake/live-path evidence and actual model/configuration limitations in the feature evidence.

## Phase 5: First-block verification and handoff — Nemanja

- [x] T026 [P] [NEMANJA] Run the focused game/API suites, strict browser+server typecheck, and production build; record actual commands/results in the handoff notes.
- [x] T027 [NEMANJA] Run the available `npm run verify` flow with the API and production preview and resolve regressions attributable to this feature.
- [x] T028 [NEMANJA] Update `specs/003-ai-crane-coach/quickstart.md` with the implemented commands and explicitly state which UI/live-provider tasks remain for Milica.

## Dependencies and handoff order

- T001-T004 establish tools, typechecking, proxying, and coordinated startup.
- T005-T008 establish the API process and injectable fake provider.
- T009-T010 provide deterministic game history; T011-T015 implement/test the fake-backed coach contract.
- T020-T022 harden safe failures and integrate verification.
- T026-T028 are the first-block verification/handoff gate.
- Milica's T016-T019 and T023-T025 must wait until T026-T028 pass and the API contract is reviewed.
- Required test-first tasks precede their implementation tasks; tasks marked `[P]` touch separate files and can be done independently.

## Definition of done for Nemanja's block

The frontend and backend are separate runnable processes; run history captures
each outcome; the backend rejects invalid input before fake-provider calls,
derives facts itself, validates fake advice, returns only safe contracts, and
the tests/build/verification path pass. No live provider key, Gemini request,
Game Over UI, or claims of end-to-end AI delivery are part of this handoff.
