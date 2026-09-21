---

description: "Implementation tasks for crane tower gameplay"
---

# Tasks: Crane Tower Gameplay

**Current status**: 30/30 implementation tasks complete. V2 specification, build prompt, and eval documentation are maintained in `docs/GAME_SPEC_V2.md`, `docs/BUILD_PROMPT_V2.md`, and `docs/EVALS_V2.md`.

**Input**: Design documents from `/specs/002-crane-tower-gameplay/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Deterministic tests are required by FR-020 and are written before their corresponding implementation.

**Organization**: Tasks are grouped by user story so crane play, cut/crumble feedback, and city presentation remain independently verifiable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Protect the completed baseline and prepare the V2 verification surface.

- [x] T001 Verify Session 003 baseline artifacts remain present and untouched under artifacts/session-003/
- [x] T002 Verify TypeScript/Vite/Vitest scripts and ignore patterns remain valid in package.json and .gitignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared state and pure geometry needed by every story.

- [x] T003 Extend Block, MasonryPiece, DetachedSection, and GameSession fields with the exact constraints from data-model.md in src/game/model.ts
- [x] T004 [P] Add detached-section conservation and side tests in tests/geometry.test.ts
- [x] T005 Implement zero/left/right/full detached-section calculation in src/game/geometry.ts
- [x] T006 Confirm existing seven-field validation and all-or-nothing fallback tests remain unchanged and passing in tests/config.test.ts

**Checkpoint**: Shared state and landing geometry are deterministic before gameplay changes.

---

## Phase 3: User Story 1 - Time a Crane Drop (Priority: P1) 🎯 MVP

**Goal**: Replace edge-reflecting block motion with one suspended, swaying building floor that releases once and falls vertically.

**Independent Test**: An attached floor changes horizontal position but not height; after Space or pointer release it keeps that x-coordinate, falls, lands, scores once, and spawns one next attached floor.

### Tests for User Story 1

- [x] T007 [P] [US1] Add deterministic sine-sway, direction, and cable-geometry tests in tests/crane.test.ts
- [x] T008 [US1] Replace linear-motion engine expectations with attached-sway, vertical-fall, landing, and restart expectations in tests/engine.test.ts
- [x] T009 [US1] Preserve one-shot keyboard/pointer release and Game Over input-gating expectations in tests/input.test.ts

### Implementation for User Story 1

- [x] T010 [US1] Implement deterministic sway phase, hanging position, direction, and crane endpoints in src/game/crane.ts
- [x] T011 [US1] Rework session creation, animation, release-compatible fall, successful landing, and restart in src/game/engine.ts
- [x] T012 [US1] Keep Space/click/tap as a single attached-to-falling transition in src/game/input.ts
- [x] T013 [US1] Update locked regression fixtures only for additive V2 state while preserving E1-E3 assertions in tests/evals.test.ts

**Checkpoint**: The one-action crane drop loop is playable and deterministic.

---

## Phase 4: User Story 2 - Cut and Crumble Unsupported Masonry (Priority: P2)

**Goal**: Preserve only supported overlap and turn each unsupported section, or the full missed floor, into falling stone-like debris.

**Independent Test**: Partial landing conserves width and creates debris on only the unsupported side; perfect landing creates none; full miss creates at least four pieces, preserves score, and enters Game Over.

### Tests for User Story 2

- [x] T014 [P] [US2] Add deterministic fragment tiling, side bias, gravity, rotation, expiry, and minimum-count tests in tests/debris.test.ts
- [x] T015 [US2] Add partial-left, partial-right, perfect, and full-miss debris transitions in tests/engine.test.ts

### Implementation for User Story 2

- [x] T016 [US2] Implement deterministic section-to-masonry splitting and fragment advancement in src/game/debris.ts
- [x] T017 [US2] Integrate detached-section conservation, success debris, full-miss debris, Game Over freeze, and debris-only post-loss animation in src/game/engine.ts

**Checkpoint**: Every imperfect placement has the requested cut-and-stone-fall consequence.

---

## Phase 5: User Story 3 - Read and Continue the Rising City Tower (Priority: P3)

**Goal**: Deliver the requested detailed city-building presentation and keep the active construction zone visible as the tower rises.

**Independent Test**: The initial Canvas visibly contains sky/cloud/city/crane/building layers; after eight landings the active floor and support remain in view; Game Over and restart remain readable and complete.

### Tests for User Story 3

- [x] T018 [P] [US3] Add camera target, easing, non-negative offset, and tall-tower visibility tests in tests/camera.test.ts
- [x] T019 [US3] Add camera/impact/debris reset and eight-floor progression expectations in tests/engine.test.ts

### Implementation for User Story 3

- [x] T020 [US3] Implement world-to-screen follow target and bounded easing in src/game/camera.ts
- [x] T021 [US3] Integrate camera target updates and impact pulse decay in src/game/engine.ts
- [x] T022 [US3] Replace the geometric neon renderer with procedural sky, clouds, parallax skyline, crane, detailed facade floors/windows, tilt, masonry, dust, and restrained overlay in src/game/render.ts
- [x] T023 [US3] Restyle the responsive portrait shell and construction-site HUD in src/style.css and index.html

**Checkpoint**: Skyline Stack reads as a detailed crane-built city tower game while retaining its own identity.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Prove the complete loop and leave reproducible handoff instructions.

- [x] T024 Update the timed success/miss/restart browser flow and V2 screenshot destination in tests/browser-smoke.mjs
- [x] T025 Update gameplay description and validation instructions in README.md
- [x] T026 Run typecheck, deterministic tests, and production build from specs/002-crane-tower-gameplay/quickstart.md
- [x] T027 Run the local Chromium smoke, inspect artifacts/crane-tower/smoke.png, and record the actual result without altering artifacts/session-003/
- [x] T028 Verify every requirement in specs/002-crane-tower-gameplay/spec.md against implementation and mark all completed tasks in specs/002-crane-tower-gameplay/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately and protects prior evidence.
- **Foundational (Phase 2)**: Depends on Setup and blocks all story work.
- **User Story 1 (Phase 3)**: Depends on Foundational; establishes the playable crane loop.
- **User Story 2 (Phase 4)**: Uses US1 landing transitions and detached geometry.
- **User Story 3 (Phase 5)**: Uses complete US1/US2 state for camera and rendering.
- **Polish (Phase 6)**: Depends on all three stories.

### User Story Dependencies

- **US1**: Independently demonstrates the requested suspended one-action drop.
- **US2**: Extends US1 landing outcomes but is independently testable with constructed sessions.
- **US3**: Renders US1/US2 state and independently proves visibility/city presentation.

### Within Each User Story

- Write the named tests first and observe the expected failure.
- Implement pure modules before engine integration.
- Run focused tests at each checkpoint, then the full suite.

### Parallel Opportunities

- T004 can be prepared independently from T003 because it targets a separate test file.
- T007 and the initial T008 fixture rewrite target separate files.
- T014 and T018 target independent modules and test files after the shared model is stable.

---

## Implementation Strategy

### MVP First

1. Protect the baseline and define V2 state/geometry.
2. Complete US1 and verify the suspended sway/release/landing loop.
3. Add US2 rubble only after overlap conservation is proven.
4. Add US3 presentation only after gameplay state is stable.
5. Validate in a real browser and inspect the screenshot.

### Incremental Delivery

1. Foundation → testable state and cut geometry.
2. US1 → playable crane timing loop.
3. US2 → requested overlap cut and masonry consequence.
4. US3 → detailed buildings, city atmosphere, and vertical camera.
5. Polish → reproducible checks and handoff.

## Notes

- `[P]` identifies file-isolated work only; execution remains dependency ordered.
- Existing `GameConfig` schema and Session 003 evidence are not rewritten.
- Building detail is procedural Canvas art; `Example.jpeg` is reference-only and is not shipped as a game asset.

---

## Phase 7: Convergence

**Purpose**: Close the discovered crane-sway boundary and regression-coverage gap without changing the public `GameConfig` schema or Session 003 evidence.

- [X] T029 [US1] Add failing deterministic left/right sine-extrema and full-interval boundary assertions in `tests/crane.test.ts` and the V2 acceptance suite per FR-020 (partial)
- [X] T030 [US1] Bound the attached-floor sine center and update V2 contracts, eval evidence, quickstart, and browser smoke coverage per the retained Core horizontal-movement rule and FR-003 (contradicts)
