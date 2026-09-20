# Feature Specification: Crane Tower Gameplay

**Feature Branch**: `phase-b/skyline-stack-core`

**Created**: 2026-09-20

**Status**: Approved for implementation

**Input**: User description: "Make Skyline Stack feel like the classic mobile crane-and-tower game shown in Example.jpeg, while retaining the overlap-cut mechanic so unsupported floor sections break into masonry and fall. Keep one main game loop and do not add separate modes or a multi-miss lives system."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Time a crane drop (Priority: P1)

As a player, I see a building floor suspended from a crane and swaying above the tower, then use one press or tap to release it straight down and try to align it with the top floor.

**Why this priority**: The suspended, swaying floor and one-action drop are the defining feel of the requested game.

**Independent Test**: Start a session, observe the cable and floor moving together, release the floor with Space or pointer input, and confirm that the cable no longer follows it while it falls onto the tower.

**Acceptance Scenarios**:

1. **Given** a new session, **When** no input is supplied, **Then** exactly one building floor remains attached to the crane and repeatedly sways across the play area.
2. **Given** a swaying floor, **When** the player presses Space or taps the play area, **Then** the floor detaches once and falls vertically from its release position.
3. **Given** a falling floor with sufficient horizontal overlap, **When** it contacts the top support, **Then** the placement succeeds, the score increases by one, and a new floor appears on the crane.

---

### User Story 2 - See unsupported masonry break away (Priority: P2)

As a player, I see the unsupported portion of an imperfectly placed floor get cut away and break into falling masonry, while only the supported overlap becomes part of the tower.

**Why this priority**: The cut-and-crumble consequence is the requested distinguishing mechanic and gives every placement immediate physical feedback.

**Independent Test**: Release a floor with a known partial overlap, then verify that the placed width equals the overlap, the detached width plus placed width equals the original width, and visible debris falls from the unsupported side.

**Acceptance Scenarios**:

1. **Given** a floor that overlaps only part of the support, **When** contact resolves, **Then** only the overlap remains in the tower and the unsupported section breaks into multiple falling pieces from the correct side.
2. **Given** a perfectly aligned floor, **When** contact resolves, **Then** the full width remains and no cut-off debris is created.
3. **Given** a floor whose overlap is below the accepted minimum, **When** contact resolves, **Then** the entire floor breaks into falling pieces, the score does not increase, and Game Over is shown.

---

### User Story 3 - Read and continue the rising city tower (Priority: P3)

As a player, I can always see the crane, the active floor, and the top of my rising building against a bright city-sky presentation, then restart cleanly after Game Over.

**Why this priority**: Continuous visibility and a recognisable construction-site presentation make the core loop readable and replayable.

**Independent Test**: Build enough floors to move the tower top upward, confirm the view follows the active construction area, then cause a miss and restart to a fresh score-zero scene.

**Acceptance Scenarios**:

1. **Given** a tower approaching the upper play area, **When** another floor is placed, **Then** the view shifts smoothly enough to keep the crane, active floor, and immediate support visible.
2. **Given** any active session, **When** the scene is rendered, **Then** the player can distinguish sky, clouds, distant city, crane cable, floor windows, tower, score, and status without external branded assets.
3. **Given** Game Over, **When** the player presses R or activates Restart, **Then** score, tower, debris, camera, active floor, and input state match a fresh session.

### Edge Cases

- A repeated Space event or additional tap while the floor is falling is ignored.
- A partial overlap on either the left or right creates debris only for the unsupported side.
- An overlap exactly equal to the configured minimum succeeds; any smaller overlap fails.
- A perfect placement creates no zero-width debris and preserves the current floor width.
- Very narrow successful floors remain playable while their width is at least the configured minimum.
- Falling debris may continue animating after Game Over, but it cannot alter score, tower geometry, or input state.
- Large frame delays are bounded so the active floor cannot skip contact resolution.
- Restart removes every debris piece and resets the camera before accepting a new drop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A session MUST present one main game loop with one active building floor, one tower, one score, one status, and one Restart control.
- **FR-002**: A new active floor MUST appear suspended from a visible crane cable above the current tower support.
- **FR-003**: While attached, the active floor MUST sway horizontally in a continuous repeating motion and remain visually connected to the cable.
- **FR-004**: Space, left click, and tap MUST release an attached floor at most once per active floor.
- **FR-005**: After release, the floor MUST retain its release position horizontally and fall vertically until contact is resolved.
- **FR-006**: Contact resolution MUST calculate the horizontal overlap with the current top support.
- **FR-007**: An overlap equal to or greater than the configured minimum MUST produce exactly one placed floor whose position and width equal that overlap.
- **FR-008**: A successful placement MUST increase score by exactly one and produce exactly one next suspended floor whose width equals the placed overlap.
- **FR-009**: Every unsupported portion of a successful placement MUST be removed from tower geometry and represented as multiple visible falling masonry pieces.
- **FR-010**: The placed width plus all detached section widths MUST equal the released floor width within normal numeric tolerance.
- **FR-011**: A perfect full-width placement MUST create no detached masonry.
- **FR-012**: An overlap below the configured minimum MUST break the full released floor into visible falling masonry, preserve the score, and enter Game Over.
- **FR-013**: Game Over MUST freeze placement state and ignore new drop input while allowing existing debris to finish its visual fall.
- **FR-014**: R and Restart MUST restore a fresh session after Game Over, including score, tower, crane phase, active floor, camera, debris, and input state.
- **FR-015**: The view MUST keep the crane connection, active floor, and immediate support visible as the tower grows.
- **FR-016**: The scene MUST use an original bright construction-city presentation with sky depth, clouds, distant buildings, crane elements, masonry floors, windows, and readable impact feedback.
- **FR-017**: The implementation MUST NOT copy another game's name, logo, characters, music, code, or image assets.
- **FR-018**: The existing validated game configuration and its all-or-nothing safe fallback behavior MUST remain operational.
- **FR-019**: The game MUST remain a local single-player browser experience with no account, network gameplay, persistent leaderboard, external asset dependency, game engine, or physics library.
- **FR-020**: Deterministic automated checks MUST cover crane motion, one-shot release, overlap preservation, debris conservation and side, full miss, camera following, Game Over gating, and full restart.

### Key Entities

- **Game Session**: Current phase, score, tower floors, one active floor, crane motion phase, camera position, debris collection, and accepted-input state.
- **Building Floor**: Position, dimensions, role, motion state, and small visual tilt used to communicate a constructed tower.
- **Crane**: Screen-visible pivot, cable endpoint, and repeating horizontal phase that determines the attached floor's release position.
- **Detached Section**: The unsupported left, right, or full floor interval produced by contact resolution before it becomes debris.
- **Masonry Piece**: A transient fragment with position, dimensions, velocity, rotation, lifetime, and source side.
- **Game Configuration**: The existing seven validated numeric values and whether safe defaults were selected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of deterministic checks, an unreleased floor changes horizontal position over time while retaining its hanging height, and a released floor changes vertical position without changing horizontal position.
- **SC-002**: For every tested successful imperfect landing, the placed width plus detached width equals the released width within 0.001 units, and debris originates only from the unsupported side.
- **SC-003**: Perfect placement produces zero debris in 100% of deterministic checks; a full miss produces at least four visible fragments and no score increase.
- **SC-004**: Repeated input during a fall produces no additional release or score transition in 100% of automated input checks.
- **SC-005**: After at least eight successful placements, the crane, active floor, and top support all remain inside the visible play area.
- **SC-006**: Restart after Game Over restores every tested initial value, including an empty debris collection and reset camera/crane state.
- **SC-007**: A first-time player can identify the suspended floor, its support, score, and drop control within 10 seconds of opening the game.
- **SC-008**: The complete interaction remains usable with keyboard, mouse, and touch input and requires no network request after the local page loads.

## Assumptions

- The user request explicitly approves this V2 feature after completion of the locked Session 003 baseline; existing baseline evidence remains unchanged.
- Skyline Stack keeps its own name and original procedural artwork while adopting the requested crane-drop feel.
- There is one continuous score-based game loop; separate named modes, city maps, population systems, and a multi-miss lives system are outside this feature.
- A below-minimum overlap ends the run immediately, matching the existing Core rule.
- The floor drops vertically after release so timing is predictable and the overlap rule remains the sole placement calculation.
- Debris is visual feedback and never becomes a new support or changes collision geometry.
- Existing configuration fields and safe-fallback behavior remain unchanged; crane and debris tuning values are internal gameplay constants.
