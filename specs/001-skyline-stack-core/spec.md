# Feature Specification: Skyline Stack Core

**Feature Branch**: `N/A — Git extension is not enabled`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Create the bounded Core of Skyline Stack, a
retro-inspired single-player stacking game, and prepare it for a documented
baseline/eval/controlled-change evidence cycle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build a narrowing tower (Priority: P1)

As a player, I can time a drop while one active block moves horizontally, so
the overlapping portion joins the tower and my score increases.

**Why this priority**: This is the complete primary interaction and the minimum
playable value of Skyline Stack.

**Independent Test**: Start a new session, observe movement, drop with clear
overlap, and confirm that only the overlap remains, the score changes from 0 to
1, and one new active block appears.

**Acceptance Scenarios**:

1. **Given** a new session with one moving active block, **When** the player
   presses Space once while the block clearly overlaps the support block,
   **Then** the overlapping portion is placed, the score increases by exactly
   one, and exactly one next active block appears with the placed width.
2. **Given** a moving active block, **When** the player clicks or taps the play
   area, **Then** that input starts the same single vertical drop as Space.
3. **Given** a block whose overlap equals the minimum accepted overlap,
   **When** it reaches the support block, **Then** placement succeeds, the
   placed width equals that minimum, and the session continues.

---

### User Story 2 - Lose clearly and restart fully (Priority: P2)

As a player, I receive a clear game-over state after a miss and can restart
from the exact initial state without stale score, blocks, or input.

**Why this priority**: A recoverable lose loop turns the primary mechanic into
a repeatable game.

**Independent Test**: Miss the supporting block, attempt additional drop input,
then restart and compare the resulting session with a fresh launch.

**Acceptance Scenarios**:

1. **Given** a falling block with less than the minimum overlap, **When** it
   reaches the support height, **Then** the session enters Game Over, gameplay
   stops, and the final score remains visible.
2. **Given** a Game Over session, **When** the player supplies additional drop
   input, **Then** the score and placed tower do not change.
3. **Given** a Game Over session, **When** the player presses R or activates
   Restart, **Then** score, blocks, pending input, active block, and session
   state match a fresh session.

---

### User Story 3 - Start safely with invalid settings (Priority: P3)

As a player, I can still use the game when supplied settings are invalid,
because known safe settings are substituted and a concise warning is shown.

**Why this priority**: Safe startup protects the playable loop and supplies a
verifiable structured-input contract without exposing private data.

**Independent Test**: Launch once with a valid complete settings object and
once with a missing or invalid required value; compare the selected settings,
warning count, and whether play remains available.

**Acceptance Scenarios**:

1. **Given** complete valid settings, **When** a session starts, **Then** those
   settings are used and no validation warning is shown.
2. **Given** settings with a missing required value, a non-number, a non-finite
   number, a non-positive dimension or speed, or an invalid size relationship,
   **When** a session starts, **Then** none of the invalid values are used, one
   safe warning is shown, known defaults are used, and the game remains
   playable.

### Edge Cases

- A held Space key or repeated event for the same press results in at most one
  accepted drop for the current block.
- Drop input while a block is already falling is ignored.
- Drop input after Game Over does not change score or tower state.
- Horizontal movement reaches either play-area edge without crossing it and
  reverses direction.
- A block that overlaps by exactly the configured minimum succeeds; one that
  overlaps by any smaller amount fails.
- Full overlap preserves the entire active width; partial overlap removes only
  the non-overlapping portion.
- As tower height grows, the active block and its immediate support remain
  visible so the core loop can continue.
- Restart clears any key-held or pending-input state so the first new block
  cannot drop automatically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST present a clear play area, tower base, score,
  status, concise controls, one active block, and a Restart control.
- **FR-002**: A new session MUST begin with score 0, one base block, and exactly
  one active block moving horizontally above it.
- **FR-003**: The visible status MUST be Ready before the first successful
  placement, Playing afterward while the session is active, and Game Over
  after a failed placement.
- **FR-004**: A moving active block MUST remain inside the horizontal bounds
  and reverse direction when it reaches either edge.
- **FR-005**: Space, left click, and tap MUST request a drop only while the
  session is active and the current block is moving.
- **FR-006**: One physical press, click, or tap MUST cause at most one accepted
  drop for the current block; repeated key events from holding Space MUST NOT
  cause additional drops.
- **FR-007**: After a drop is accepted, the active block MUST move only
  vertically until contact is resolved.
- **FR-008**: Contact resolution MUST use the horizontal intersection of the
  active block and the last placed block as the overlap.
- **FR-009**: When overlap is at least the configured minimum, only the
  overlapping portion MUST be placed.
- **FR-010**: A successful placement MUST increase score by exactly one and
  create exactly one next active block whose width equals the placed overlap.
- **FR-011**: When overlap is less than the configured minimum, the session
  MUST enter Game Over without increasing score.
- **FR-012**: Game Over MUST stop active gameplay, preserve the visible result,
  and ignore further drop input.
- **FR-013**: R and the Restart control MUST create a fresh initial session
  after Game Over, resetting score, blocks, input state, and session state.
- **FR-014**: The game MUST have no finite win screen; progress is represented
  by the highest score reached within the current session.
- **FR-015**: The active block and its immediate supporting block MUST remain
  visible as the tower grows.
- **FR-016**: Required settings MUST cover play-area width and height, starting
  block width, block height, horizontal speed, fall speed, and minimum overlap.
- **FR-017**: Settings validation MUST reject missing fields, non-number values,
  non-finite values, non-positive dimensions or speeds, a starting width wider
  than the play area, a block height not smaller than the play-area height, a
  non-positive minimum overlap, and a minimum overlap wider than the starting
  block.
- **FR-018**: If any supplied setting is invalid, the game MUST reject the
  supplied settings as a whole, use one known default set, show exactly one
  safe warning, and remain operational.
- **FR-019**: The visual identity MUST use original simple geometric forms and
  a readable retro-inspired palette without copied names, logos, characters,
  music, or assets from another game.
- **FR-020**: The Core MUST NOT include multiplayer, accounts, leaderboards,
  networking, persistent scores, levels, opponents, power-ups, audio, hints,
  tool calling, or deployment behavior.

### Key Entities

- **Game Session**: Current score, Ready/Playing/Game Over status, placed
  tower, the single active block, and transient input state.
- **Block**: Horizontal position, vertical position, width, height, and role as
  base, placed support, moving active block, or falling active block.
- **Game Configuration**: Seven required numeric settings, their validity as a
  complete set, the selected valid/default set, and whether one safe warning is
  required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In each successful-placement check, score changes from 0 to 1,
  exactly one placed overlap remains, and exactly one new active block appears.
- **SC-002**: The exact-minimum-overlap boundary succeeds in 100% of repeated
  deterministic checks, while every below-minimum check reaches Game Over
  without a score increase.
- **SC-003**: Holding Space during one block produces no more than one accepted
  drop in 100% of deterministic input checks.
- **SC-004**: Restart after Game Over restores every observable initial value
  tested: score, status, base, active-block count, active-block dimensions, and
  pending input.
- **SC-005**: Every invalid-settings category listed in FR-017 results in the
  same known defaults, one warning, no crash, and an available playable session.
- **SC-006**: A first-time player can identify the score, current status,
  controls, active block, and Restart control within 10 seconds of opening the
  game.
- **SC-007**: The complete Core can be exercised without an account, network
  connection, external asset, or server.

## Assumptions

- The game begins immediately; Ready is the visible status while the first
  block is moving, and the underlying session already accepts a first drop.
- R and Restart are intentionally accepted only after Game Over, matching the
  supplied control contract.
- Keeping the active block and immediate support visible may use a simple
  viewport shift; complex camera animation is not required.
- The project starts without a supplied starter, established commands, source,
  tests, technical documentation, baseline, or remote repository.
- Pair-member names and completed human review actions remain unknown and will
  be recorded as TBD until provided; they are not feature behavior.

