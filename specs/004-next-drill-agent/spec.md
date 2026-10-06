# Feature Specification: Next Drill Agent

**Feature Branch**: `main` (directory independent of branch)  
**Created**: 2026-10-05  
**Status**: Implemented and fake-verified; one bounded live attempt failed safely; joint demo pending  
**Input**: W05 *Bounded Agentic Feature* assignment, continuing Skyline Stack's W04 AI Crane Coach.

## User Scenarios & Testing

### User Story 1 - Choose the next practice drill (Priority: P1)

After Game Over, the player asks which single drop-timing drill to practice next. The agent proposes a drill, the application's read-only evaluator checks it against the completed run, and the agent uses that evidence to return one supported recommendation. This offers a concrete next action beyond W04's one-shot analysis.

**Independent Test**: Complete a known run, request a drill, and verify that the recommendation cites evidence from an actual tool execution between two model decisions.

**Acceptance Scenarios**:

1. **Given** late releases dominate, **when** the player requests a drill, **then** a checked recommendation says to release earlier and shows the run-derived reason.
2. **Given** early releases dominate, **when** the player requests a drill, **then** a checked recommendation says to release later.
3. **Given** early and late counts tie, **when** the player requests a drill, **then** a checked recommendation focuses on center alignment.
4. **Given** an unsupported first candidate, **when** the agent continues, **then** it may check one different candidate and finish only if a supported tool result exists.

### User Story 2 - Keep the agent bounded and the game usable (Priority: P2)

The player sees a safe unavailable state if input, a proposal, tool output, provider, or final answer cannot be trusted. W04 Coach and Restart remain usable.

**Independent Test**: Use fake responses for forbidden tools, invalid arguments, repeated calls, failures, and invalid final output. Verify that no unsafe result appears and Restart works.

**Acceptance Scenarios**:

1. **Given** invalid or oversized run data, **when** a drill is requested, **then** provider and tool call counts are zero.
2. **Given** an unknown tool or invalid arguments, **when** the model proposes it, **then** tool execution count is zero and the run stops safely.
3. **Given** a repeated proposal, exhausted budget, or elapsed deadline, **when** the run continues, **then** the application stops it safely.
4. **Given** a pending request, **when** the player restarts, **then** its eventual result never appears in the new run.

### Edge Cases

- A score-zero run has one terminal miss and still has timing evidence.
- A tie between early and late counts maps to center alignment; the terminal miss counts.
- A final answer may cite only evidence created by this run for a supported drill.
- Retry is another attempt at the same model step, not a new step.
- An unsupported first candidate permits one different tool candidate; an unsupported second ends incomplete.
- The endpoint never changes the tower, score, controls, game rules, or stored state.

## Requirements

### Functional Requirements

- **FR-001**: A player MUST be able to request one next-drill recommendation after Game Over alongside W04 analysis.
- **FR-002**: The request MUST contain only the fixed goal `choose_next_drill`, final score, starting width, and bounded completed-run drop log; it MUST pass W04's run-consistency rules before any model or tool call.
- **FR-003**: Success MUST use at least two model decisions and one actual tool execution between the first decision and the final answer.
- **FR-004**: The sole Core tool MUST be `evaluate_drill`, a read-only deterministic check of a proposed drill against validated run facts. Its input and normalized output MUST be strictly validated.
- **FR-005**: An explicit allowlist MUST reject unknown tool names, extra fields, invalid arguments, and repeated identical proposals before execution.
- **FR-006**: A run MUST have at most three model steps, two tool executions, four provider attempts total, two attempts per step, an eight-second per-attempt timeout, a 25-second total deadline, and no provider fallback. Injected test settings MAY lower time limits but MUST NOT raise these upper bounds. The local endpoint MUST enforce a separate five-request/ten-minute client quota before model or tool work.
- **FR-007**: A successful model final MUST name one of `release_earlier`, `release_later`, or `center_alignment` and cite this run's supported evidence ID. Runtime validation MUST check exact shape, size, and drill/evidence consistency. The application MUST compose short player-facing text only from the validated result and fixed drill descriptions, without unsupported numeric claims.
- **FR-008**: The application MUST stop on invalid input, unknown/invalid/repeated tool proposal, tool failure, tool timeout or invalid output, budget exhaustion, provider failure or rate limit, cancellation, invalid final answer, or deadline. Partial output MUST NOT appear as success.
- **FR-009**: The backend MUST own the model loop, tool registry, limits, and validation. The browser MUST only start/cancel the fixed goal and show pending, success, or safe unavailable state.
- **FR-010**: The agent MUST NOT access arbitrary files, shell, URLs, game-state or score mutation, provider selection, credentials, or a general execution tool. Core has no write action and no human approval point.
- **FR-011**: A run MUST have a unique ID and record only step number, provider/model, attempts, latency, tool/status, validated optional token counts, and stop reason. Every completed step MUST have a terminal status and measured latency; retained in-memory run history MUST be bounded. Raw prompts, drop logs, credentials, and private reasoning MUST NOT be logged.
- **FR-012**: Fake tests MUST cover normal success; invalid input; unknown tool and invalid arguments with zero executions; tool failure/invalid result; provider timeout/failure; malformed model output; repeated call; max steps/deadline; invalid final; and cancellation.
- **FR-013**: W04 Coach and historical W03/V2 artifacts MUST remain intact. A limited live demo follows passing fake tests and pair review; evidence and pair contributions MUST be observed, never invented.

### Key Entities

- **Drill Request**: Fixed goal and one W04-valid completed run.
- **Agent Run**: One player action with run ID, deadline, counters, evidence, and stop reason.
- **Drill Candidate**: One of three fixed practice actions proposed by the model.
- **Tool Evidence**: Server-created ID, drill, support flag, and bounded run-derived facts.
- **Drill Recommendation**: Validated drill, evidence ID, short title and instruction, and server-derived evidence shown to the player.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every deterministic success test shows at least two model decisions and one validated tool execution.
- **SC-002**: No forbidden or malformed proposal is executed; a forbidden or malformed *first* proposal yields zero tool executions, and invalid initial input makes zero provider and tool calls.
- **SC-003**: Every success cites same-run evidence for a supported drill; unsupported candidates and invalid finals never appear as success.
- **SC-004**: Every run obeys the documented budgets and returns a safe result within 27 seconds of the player's action.
- **SC-005**: W04 verification and W03 gameplay still pass; Restart discards stale W05 output.
- **SC-006**: Nemanja and Milica can each explain the tool boundary, budgets, stop conditions, and a rejected-tool trace in the joint demo.

## Assumptions

- The current browser session supplies one finished run; no history database or account is added.
- Early/late dominance comes from the completed drop log. A tie selects center alignment.
- Three practice drills are fixed product choices. The evaluator independently checks the model's choice and supplies verifiable evidence.
- Phase A approval was reported in chat before implementation. The pair's actual work split, contributions, and joint demo remain pending in the evidence record.

## Out of Scope

Stored run history, training mode that changes gameplay, write actions, web browsing, arbitrary tools, deployment, provider fallback, and additional model providers.
