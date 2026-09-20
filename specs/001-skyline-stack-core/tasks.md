---

description: "Dependency-ordered implementation and evidence tasks for Skyline Stack Core"
---

# Tasks: Skyline Stack Core

**Input**: Design documents from `/specs/001-skyline-stack-core/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, approved Phase A docs, and explicit human approval to start Phase B

**Tests**: Tests are required by the project task. Test tasks precede their
corresponding implementation tasks and remain `NOT RUN` until actually executed.

**Organization**: Setup and shared foundations come first, followed by one phase
per user story, then baseline/evidence and the single controlled-change cycle.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files with no dependency on unfinished tasks; this marks a
  possible work split, not permission to run parallel Core agents.
- **[Story]**: User-story traceability label.
- Every task names the file or files it changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create only the minimal approved TypeScript browser project after
the Phase A checkpoint.

- [ ] T001 Create pinned Vite, TypeScript, and Vitest dev dependencies plus dev, build, typecheck, and single-run test scripts in package.json and package-lock.json
- [ ] T002 Configure strict browser TypeScript checking with isolated module compatibility in tsconfig.json
- [ ] T003 Create the one-page semantic shell with canvas, score, status, controls, warning region, and Restart control in index.html

**Checkpoint**: Installation and project files exist, but no gameplay behavior
is claimed until tests and story work are complete.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared domain vocabulary and known default settings used
by every user story.

- [ ] T004 Define GameSession, Block, phase, motion, direction, and derived-status types and invariants in src/game/model.ts
- [ ] T005 Define the exact seven-field GameConfig type and the documented 480×640, 200, 28, 180, 520, 8 default values in src/game/config.ts

**Checkpoint**: Shared types are ready; no story is complete.

---

## Phase 3: User Story 1 — Build a narrowing tower (Priority: P1) MVP

**Goal**: Move one block, accept one drop, trim to overlap, increase score by
exactly one, keep play visible, and spawn exactly one next block.

**Independent Test**: Start from a deterministic session, advance horizontal
movement, drop with clear overlap and at exact minimum overlap, then verify the
placed geometry, 0→1 score, and one new active block.

### Tests for User Story 1

- [ ] T006 [P] [US1] Write failing interval-intersection and exact-minimum-boundary tests in tests/geometry.test.ts
- [ ] T007 [P] [US1] Write failing movement, successful placement, score increment, next-block width, and viewport-rebase tests in tests/engine.test.ts
- [ ] T008 [P] [US1] Write failing Space-repeat, click/tap equivalence, and falling-state input-gate tests in tests/input.test.ts
- [ ] T009 [US1] Record E1 and E2 as executable deterministic tests without changing their locked expectations in tests/evals.test.ts

### Implementation for User Story 1

- [ ] T010 [US1] Implement horizontal interval intersection exactly as max(0, min(right edges) - max(left edges)) in src/game/geometry.ts
- [ ] T011 [US1] Implement fresh session, bounded horizontal motion, vertical fall, overlap trim, exact >= minOverlap success, score +1, next-block spawn, and one-height viewport rebase in src/game/engine.ts
- [ ] T012 [US1] Implement drop-request gating and repeated-key rejection in src/game/input.ts
- [ ] T013 [P] [US1] Render background, base, placed blocks, one active block, and retro geometric palette in src/game/render.ts
- [ ] T014 [US1] Wire animation, Space/click/tap input, Ready/Playing HUD, and canvas scaling in src/main.ts and src/style.css

**Checkpoint**: E1 and E2 can be run independently; no lose/restart or fallback
claim is made yet.

---

## Phase 4: User Story 2 — Lose clearly and restart fully (Priority: P2)

**Goal**: Freeze gameplay on a miss, preserve the result, ignore drop input, and
restore a fully fresh session through R or Restart.

**Independent Test**: Resolve a below-minimum miss, try further input, restart,
and compare every observable initial field with a fresh session.

### Tests for User Story 2

- [ ] T015 [P] [US2] Write failing miss, frozen-score, and full-state-restart tests in tests/engine.test.ts
- [ ] T016 [P] [US2] Write failing post-game drop-ignore and R/Restart gameOver-only acceptance tests in tests/input.test.ts

### Implementation for User Story 2

- [ ] T017 [US2] Implement below-minimum gameOver transition, frozen missed block, and complete restart transition in src/game/engine.ts
- [ ] T018 [US2] Implement R and Restart control routing plus stale held-key clearing in src/game/input.ts
- [ ] T019 [US2] Wire Game Over status, preserved final score, and enabled restart behavior in src/main.ts and src/game/render.ts

**Checkpoint**: User Stories 1 and 2 form a repeatable playable loop.

---

## Phase 5: User Story 3 — Start safely with invalid settings (Priority: P3)

**Goal**: Runtime-validate unknown settings, reject the whole invalid candidate,
use a fresh known default, display one generic warning, and keep the game usable.

**Independent Test**: Exercise valid input and every invalid category from the
GameConfig contract, including missing fields, wrong types, NaN, infinities,
non-positive values, and invalid size relationships.

### Tests for User Story 3

- [ ] T020 [P] [US3] Write failing complete-validator matrix and fresh-default-copy tests in tests/config.test.ts
- [ ] T021 [US3] Record E3 as an executable fallback-and-one-warning test without changing its locked expectation in tests/evals.test.ts

### Implementation for User Story 3

- [ ] T022 [US3] Implement own-field, number, finite, positive, canvas-width, block-height, and min-overlap validation with whole-object fallback in src/game/config.ts
- [ ] T023 [US3] Select configuration before session creation and show exactly one fixed warning without raw input in src/main.ts and src/style.css

**Checkpoint**: All three stories are independently testable and the complete
Core baseline candidate exists.

---

## Phase 6: Baseline Preservation and Actual Eval Evidence

**Purpose**: Verify, capture, and preserve the unmodified baseline before any
targeted correction. No result may be filled from expectation alone.

- [ ] T024 Run npm.cmd install, typecheck, test, build, and dev checks and record exact commands, exit codes, relevant output, and NOT RUN items in docs/EVIDENCE_003.md
- [ ] T025 Perform the real-browser smoke flow and save the actual baseline visual proof under artifacts/session-003/baseline.png, then record its path in docs/EVIDENCE_003.md
- [ ] T026 Document only commands confirmed by T024 as working setup, test, build, and run instructions in README.md
- [ ] T027 Create the complete pre-fix baseline archive at artifacts/session-003/baseline.zip, mark it read-only, and record its SHA-256 and exclusions in docs/EVIDENCE_003.md
- [ ] T028 Execute locked E1–E3 and exploratory runtime checks on the baseline, then define E4 from the first real repeatable defect in docs/EVALS.md
- [ ] T029 Extract and rerun E1–E4 against artifacts/session-003/baseline.zip and record actual baseline PASS/FAIL results and reproduction evidence in docs/EVALS.md and docs/EVIDENCE_003.md

**Checkpoint**: The archive and hash exist; E4 is concrete and fails on the
saved baseline; no targeted code change has begun.

---

## Phase 7: One Hypothesis and One Controlled Change

**Purpose**: Correct only E4 without moving any locked requirement or context.

- [ ] T030 Record claim, signal, one hypothesis, limitation, and the planned smallest one-file diff including its exact future code path in docs/EVIDENCE_003.md
- [ ] T031 Apply exactly one targeted code change to the single path locked by T030 and record the actual diff without modifying prompts, specs, config schema, gameplay rules, or eval expectations in docs/EVIDENCE_003.md
- [ ] T032 Rerun the identical E1–E4 set after T031 and record actual results and evidence in docs/EVALS.md and docs/EVIDENCE_003.md
- [ ] T033 Rerun typecheck, test, build, and browser smoke after T031 and record exact commands, outputs, and the final known limitation in docs/EVIDENCE_003.md

**Checkpoint**: Exactly one hypothesis and one targeted implementation diff are
documented; the saved baseline remains unchanged.

---

## Phase 8: Session 003 Audit and Pair Handoff

**Purpose**: Finish documentation without inventing human work.

- [ ] T034 Record actual driver, observer, commands/review actions, role swaps, and results for both pair members in docs/EVIDENCE_003.md
- [ ] T035 Update actual baseline, targeted-change, and optional diff-review calls plus unavailable usage data in docs/AI_USAGE_LOG.md
- [ ] T036 Audit every Session 003 Definition of Done item against a concrete path or command result and leave every unsupported item incomplete in docs/EVIDENCE_003.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 starts only after explicit Phase A approval.
- Phase 2 depends on Phase 1.
- US1 depends on Phase 2 and is the MVP.
- US2 depends on the shared session and input boundaries introduced by US1.
- US3 depends on setup and config shape but is independently testable.
- Phase 6 depends on all Core stories and occurs before any targeted fix.
- Phase 7 is blocked until the read-only baseline, hash, E4 reproduction, and
  complete baseline eval table exist.
- Phase 8 depends on actual human contribution data and all available evidence.

### User Story Dependencies

- **US1 (P1)**: starts after Foundation; delivers the primary game loop.
- **US2 (P2)**: reuses US1 state/input boundaries but has independent miss and
  restart acceptance tests.
- **US3 (P3)**: reuses only the shared GameConfig shape and can be verified with
  isolated validator tests.

### Within Each User Story

- Write the listed tests first and verify that they fail for the missing behavior.
- Implement pure model/rule changes before browser wiring.
- Run the story's independent tests before moving to the next story.
- Do not fill PASS until the command has actually executed.

## Parallel Opportunities

No parallel Core agents will be used. If the human pair chooses a manual work
split, tasks T006–T008 touch separate test files, and T013 can be reviewed while
pure-rule work is being inspected; merge order must still preserve the phase
gates and one shared baseline.

## Parallel Example: User Story 1

```text
Possible human-only split after Phase 2:
- T006 in tests/geometry.test.ts
- T007 in tests/engine.test.ts
- T008 in tests/input.test.ts

Integrate sequentially before T009–T014 and record the actual driver/observer.
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 tests and implementation.
3. Stop and independently verify E1 and E2 behavior.
4. Continue with US2 and US3 only within the approved Core scope.

### Baseline Before Fix

1. Finish all three stories as the first-pass baseline candidate.
2. Run and record real commands and browser smoke.
3. Archive and hash the candidate.
4. Run locked evals and derive E4 only from an observed repeatable problem.
5. Make one hypothesis and one targeted correction.
6. Repeat the identical eval set.

## Notes

- `[P]` marks file independence, not authorization for parallel agents.
- Phase B must use the locked `docs/BUILD_PROMPT_V1.md`.
- T031's code path is intentionally selected only after E4 exists; T030 must
  replace that uncertainty with one exact path before any code edit.
- Do not create a Git remote, publish, deploy, or add Session 004 features.
- Stop at any gate whose required evidence is missing.

