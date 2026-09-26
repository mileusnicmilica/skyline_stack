# Feature Specification: AI Crane Coach

**Feature Branch**: `003-ai-crane-coach`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "After a Skyline Stack run ends, let the player request a short AI analysis of drop timing and width loss, with one useful tip for the next run."

## User Scenarios & Testing

### User Story 1 - Review a finished run (Priority: P1)

As a Skyline Stack player, after Game Over I can ask the AI Crane Coach to
review my completed run so I understand my timing pattern, the floor where I
lost the most width, and one action I can try in my next run.

**Why this priority**: This is the single user-visible AI flow required for W04
and uses information produced by the existing crane game.

**Independent Test**: Finish a deterministic sample run, request an analysis,
and verify that a short structured result appears and agrees with the recorded
run facts.

**Acceptance Scenarios**:

1. **Given** a completed run with a valid drop log, **When** the player selects
   "Analiziraj partiju", **Then** the player sees a concise headline, a timing
   summary, the floor with the largest width loss, and one
   actionable tip.
2. **Given** the analysis request is pending, **When** the player waits,
   **Then** a visible loading state is shown and a second request cannot be
   started for the same run.
3. **Given** the player restarts while an analysis is pending, **When** the
   response arrives, **Then** it is not shown as advice for the new run.
4. **Given** the AI service cannot provide a valid analysis, **When** the
   request finishes or times out, **Then** the player sees a safe unavailable
   message and can still restart and play.

### User Story 2 - Preserve play when analysis is unavailable (Priority: P2)

As a player, I can continue using the game when the analysis service or
provider is unavailable, times out, or returns an invalid result.

**Why this priority**: The AI feature must not make the existing W03 game
unusable when an external dependency fails.

**Independent Test**: Use a fake provider that fails, times out, and returns
malformed output; verify the safe message appears and Restart still starts a
fresh playable run.

**Acceptance Scenarios**:

1. **Given** the service returns an unavailable result, **When** it is shown
   to the player, **Then** no provider detail, secret, or stack trace is
   displayed.
2. **Given** analysis has failed, **When** the player chooses Restart,
   **Then** the next run begins normally.
3. **Given** the submitted run log is empty, inconsistent, or over the
   supported limit, **When** analysis is requested, **Then** the request is
   rejected before any provider call and the player receives the safe
   unavailable state.

## Clarifications

### Session 2026-09-26

- The feature proposal and W04 assignment were reviewed during `speckit-clarify`;
  no critical unresolved ambiguities were found. Thresholds and bounds below
  are explicit defaults for this version and can be changed only through
  reviewed spec updates.
- Before Milica's handoff, the pair chose a required numeric
  `biggestMistakeFloor`: every accepted completed run ends in a terminal miss
  with positive width loss, so a `null` floor cannot occur.

## Edge Cases

- A run may end on its first drop: final score is zero and the log contains
  one terminal miss.
- A request with no drops, inconsistent score, invalid numbers, impossible
  width transitions, a timing label inconsistent with offset and direction,
  or an oversized log is rejected before any provider request. The first
  record's `widthBefore` must equal `startingWidth`; each later record's
  `widthBefore` must equal the preceding successful record's `widthAfter`.
- A terminal miss records zero resulting width; it does not increase score.
- A response arriving after Restart must not be attached to the new run.
- Repeated activation while a request is pending must not make duplicate
  provider calls.
- A provider timeout, transient failure, rejection, malformed structure, or
  disagreement with server-calculated facts results in the safe unavailable
  state.
- If the user has no supported local run data or more than the supported log
  limit, analysis is unavailable and the game remains playable.

## Requirements

### Functional Requirements

- **FR-001**: The game MUST preserve its existing single-player crane loop,
  score, Game Over, and Restart behavior while adding one optional post-run
  analysis flow.
- **FR-002**: The player MUST be able to request analysis only after Game Over.
- **FR-003**: The analysis MUST be outside the real-time animation and drop
  resolution loop.
- **FR-004**: The game MUST record exactly one structured drop record for each
  resolved drop, including a terminal miss, and MUST clear the history on
  Restart.
- **FR-005**: The analysis request MUST contain only the final score, starting
  width, and bounded drop history needed to review the run; it MUST NOT send
  the complete game session.
- **FR-006**: Provider communication MUST pass through a project-controlled
  server boundary; the browser MUST NOT communicate directly with the provider.
- **FR-007**: The backend MUST reject invalid or oversized requests before any
  provider call and MUST validate that the score and drop history agree.
- **FR-008**: The backend MUST calculate run statistics from validated drop
  data, including the terminal miss when finding the greatest width loss, and
  send the provider only those statistics and the minimum instruction context
  needed to write advice.
- **FR-009**: The provider MUST return a structured advice result containing a
  headline of at most 80 characters, a timing bias (`early`, `late`, `mixed`,
  or `consistent`), a largest width-loss floor from 1 through
  `finalScore + 1`, and one actionable tip of at most 200 characters.
- **FR-010**: The backend MUST runtime-validate both the response shape and
  whether its timing bias and largest-loss floor agree with server-calculated
  facts before returning it to the browser.
- **FR-011**: The system MUST have a documented and tested request timeout and
  bounded retry policy for transient provider failures. It MUST NOT retry
  invalid local input or a deterministically malformed result.
- **FR-012**: On unavailable service, timeout, provider failure, or invalid
  provider output, the player MUST receive a stable safe message; the game
  MUST remain restartable and playable.
- **FR-013**: The provider secret MUST be stored in server-side environment
  configuration and MUST NOT be present in browser code, frontend bundles,
  responses, logs, documentation, fixtures, or evidence.
- **FR-014**: A local invalid request MUST be rejected without contacting the
  AI provider.
- **FR-015**: The chosen provider and exact model MUST be documented with a
  reason the least costly reliable option is sufficient for this scenario.
- **FR-016**: This feature MUST remain separate from historical W03/V2
  specifications and evidence.

### Key Entities

- **Drop Record**: One resolved attempt; includes floor number, release offset,
  release direction, timing classification, width before contact, and width
  after contact (zero for a miss).
- **Coach Request**: Final score (integer 0–500), positive starting width,
  and 1–501 ordered drop records for one completed run. Each record has a
  sequential floor number, finite signed offset, release direction (`-1` or
  `1`), timing (`early`, `late`, or `centered`), positive width before contact,
  and width after contact between zero and width before. Zero is allowed only
  for the terminal miss. The number of successful records must equal score.
- **Run Statistics**: Backend-derived timing distribution, average absolute
  offset, and floor with the largest width loss.
- **Coach Advice**: Validated headline (maximum 80 characters), timing bias,
  largest-loss floor (integer 1 through `finalScore + 1`), and
  actionable tip (maximum 200 characters) shown after Game Over.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can request an analysis after Game Over without changing
  any score, tower, or restart behavior in the existing game.
- **SC-002**: For a valid supported run, the player sees either validated
  advice or the safe unavailable message within 12 seconds of requesting it.
- **SC-003**: Every invalid local request is rejected with zero provider calls
  in deterministic tests.
- **SC-004**: No malformed or semantically inconsistent provider result is
  displayed as successful advice in deterministic tests.
- **SC-005**: The complete W03 game remains playable after backend/provider
  failure and after Restart.
- **SC-006**: The provider credential is absent from frontend bundles,
  committed files, logs, responses, test fixtures, and submitted evidence.
- **SC-007**: Before the live provider demonstration, the exact provider and
  model identifier and the reason for choosing it are recorded in the feature
  documentation.
- **SC-008**: Historical W03/V2 specifications and evidence remain unchanged.

## Assumptions

- The player explicitly requests analysis after Game Over; the model is never
  called automatically during play.
- Gemini is the intended provider. The exact supported model identifier and
  structured-output capability will be verified during planning and recorded
  in the provider contract before implementation.
- For the first version, a request contains the complete run log up to 500
  successful drops and one terminal miss (501 records maximum). Longer runs
  receive the safe unavailable state instead of sending a partial log that
  cannot prove the final score.
- A centered release uses an offset tolerance of at most one game-world pixel;
  this default can be revised during clarification if the pair identifies a
  better measurable threshold.
- A timing bias is `consistent` when at least 70% of drops are centered;
  otherwise it is `early` or `late` when that timing is at least 60% of
  non-centered drops, and `mixed` in other cases.
- Analysis data is transient and is not persisted or associated with an
  account.
- A browser-supplied run log can be checked for internal consistency but is
  not cryptographically authenticated as an untampered game history.
- Serbian Latin is the user-facing language for the new button, advice, and
  safe failure message.

## Out of Scope

- AI calls during the animation loop or at every drop.
- Accounts, user authentication, persistent game history, leaderboard,
  multiplayer, database, or deployment.
- An autonomous agent, agent loop, RAG, vector database, or write-capable AI
  tools.
- Multiple providers/models, fallback provider, usage dashboard, or a full
  observability platform.
- Changing the established crane gameplay, GameConfig contract, or W03/V2
  historical evidence.

## Security Boundary

- The browser communicates with the project's TypeScript backend and never
  directly with Gemini or another AI provider.
- The provider key exists only in server-side environment configuration and
  is never included in client-accessible configuration.
- The backend validates the request before provider use, constructs the
  provider prompt from server-calculated statistics, validates the provider
  output, and returns only the small public advice contract or a stable safe
  error.
- Provider errors, stack traces, secrets, and unnecessary request/session
  data are not returned to the browser or included in logs/evidence.
