# Feature Specification: W08 Secure the Arcade

**Feature branch**: `main` (Milica's block in progress; no branch switch)  
**Created**: 2026-10-26  
**Status**: Milica's HTTP/browser half implemented and locally verified on 2026-10-26; Nemanja's half and full pair review remain pending  
**Input**: W08 assignment `weekly-assignment (2).md`; existing Skyline Stack W03–W05 game, Coach and Next Drill Agent.

## User Scenarios & Testing

### User Story 1 — Safe next-drill recommendation (P1)

After Game Over, a player receives a useful next-drill recommendation from the existing agent. A hostile browser request or model proposal cannot expand the agent's authority or change the game's state.

**Independent test**: A synthetic completed run produces at least two model decisions with a real, validated `evaluate_drill` execution between them. Direct malformed requests and forbidden tool proposals fail with measured zero forbidden effects.

**Acceptance scenarios**:

1. Given a valid completed run, when the player requests a drill, then the agent executes `evaluate_drill` and displays a recommendation supported by same-run evidence.
2. Given invalid JSON, an invalid run, or extra policy fields, when the API receives the request, then it rejects before provider or tool work.
3. Given a forbidden or malformed model proposal, when the agent evaluates it, then it executes no forbidden tool and exposes no partial recommendation.

### User Story 2 — Safe browser and bounded service (P2)

The player can keep playing and see a safe result when untrusted text, malformed provider output, simultaneous requests or delayed work occur.

**Independent test**: Real-browser tests inspect the DOM and script marker. Local HTTP tests measure active work, rate limits, timeouts and late completions. A later valid request succeeds.

**Acceptance scenarios**:

1. Given a harmless XSS marker in a response field, when the browser renders it, then no script runs and the DOM contains only safe text or an intentionally rejected result.
2. Given more simultaneous requests than the published local limit, when they reach the API, then excess work is rejected before provider execution and capacity is released correctly.
3. Given an expired deadline, when a delayed provider or tool returns, then no late success is accepted and no new step begins.

### User Story 3 — Reproducible security evidence (P3)

The pair can explain and reproduce each important claim from a documented checkpoint using fake providers and synthetic data.

**Independent test**: A reviewer runs the documented security commands and locates actual results for T00–T17, three comparable before/after scenarios, dependency findings and remaining limits.

**Acceptance scenarios**:

1. Given the initial and final commits, when a reviewer follows `quickstart.md`, then the stated checks are reproducible without a real provider key.
2. Given a denied action, when the reviewer inspects evidence, then threat, rule, control, test, counters and observed effect are linked.
3. Given a production build, when it is served locally, then active security headers are observable and a reachable forbidden script is blocked by CSP while gameplay and the AI flow still work.

### Edge Cases

- The request body reaches its byte limit exactly; a one-byte-larger body is rejected before parsing.
- A syntactically valid run is still client supplied and cannot become proof of an authentic score.
- `constructor` and `toString` are treated as forbidden tool names.
- Valid tool arguments with an unavailable resource or domain value are checked separately from malformed arguments.
- Repeated calls, provider retries, late responses and cancellation share the same run budget and cleanup policy.
- A fake provider may return malformed, oversized or extra-field objects; none are trusted merely because TypeScript types describe them.
- The existing app has no account, private stored game, imported replay or user text in the W05 model context; applicability is rechecked against code before implementation.

## Requirements

### Security invariants

| ID | Invariant |
|---|---|
| I1 | An initial HTTP request failing input or access checks makes zero provider and business-tool calls. |
| I2 | Browser and model never choose identity, authority, provider configuration or security limits. |
| I3 | Only an allowed tool with valid arguments and permitted data scope executes. |
| I4 | The read-only agent does not change canonical game state. |
| I5 | Untrusted content never becomes executable browser content. |
| I6 | Calls, elapsed time, data sizes and simultaneous executions have server-owned bounds. |
| I7 | Server secrets remain server-side; browser, model and operational logs receive only necessary data. |
| I8 | Normal W05 gameplay and the two-decision/one-tool agent flow continue to succeed. |

### Functional requirements

- **FR-001**: Preserve normal Skyline Stack gameplay, W04 Coach and the W05 Next Drill flow, including at least two model decisions and one actual useful read-only tool execution on success.
- **FR-002**: Enforce a byte limit before full HTTP body parsing; reject malformed JSON, wrong types, missing, `null`, extra and domain-invalid fields under an explicit request contract. A valid boundary case must pass.
- **FR-003**: Reject browser attempts to set provider/model, `maxSteps`, `ownerId`, `role` or other server-owned settings; no untrusted object may be merged into server policy.
- **FR-004**: Validate model decisions, tool name and arguments, tool result and final response at runtime. Reject unknown fields, unsupported variants, non-finite numbers and excessive sizes according to the contracts.
- **FR-005**: Keep the tool registry closed to `evaluate_drill`; deny unknown and inherited-property names, arbitrary fetch, shell, file read and state write.
- **FR-006**: Verify permitted tool scope and same-run evidence independently of shape validation. A read-only execution must leave game state unchanged.
- **FR-007**: Treat the current browser-only score and drop log as unverified game data. They may inform a practice suggestion but must grant no privilege or verified rank.
- **FR-008**: Render all actual untrusted text paths safely, including W05 recommendation and W04 Coach output. Test both a harmless XSS marker and normal Serbian text, apostrophe and `a < b` in a real browser. No rich-text renderer is added solely for this task.
- **FR-009**: Serve the local production build with an active CSP HTTP header, `X-Content-Type-Options: nosniff` and explicit `Referrer-Policy`; prove a reachable script is blocked by CSP and normal game/AI behavior survives.
- **FR-010**: Apply server-owned limits to each agent run and across HTTP requests, including attempts, steps, tools, deadlines, request/response sizes, concurrency and request admission. Retry and fallback must not reset budgets.
- **FR-011**: Propagate cancellation to supported operations; reject late results, avoid starting work after deadline and retain capacity until uncancellable work has really ended or is otherwise bounded.
- **FR-012**: Keep provider credentials out of browser artifacts, HTTP responses, model context and operational logs. Validate the boundary with an actually loaded synthetic sentinel and both adapter-error and unexpected-tool-field cases.
- **FR-013**: Emit small structured security events with application-generated correlation IDs, stable reason codes and counts; omit raw prompts, full drop logs, raw provider responses, tokens, secrets, stack traces and uncontrolled text.
- **FR-014**: Return stable, safe error responses and defined HTTP statuses; denial evidence must include zero or bounded effect counters rather than status alone.
- **FR-015**: Document the actual public/demo data scope, same-origin/CORS and credential/CSRF model. If existing private resources or ambient credentials are found, enforce and test the corresponding access or CSRF rule before completion.
- **FR-016**: Review the lockfile with a dependency audit; classify relevant findings by exact version, advisory, runtime/development use, exposure and decision, then rerun regression checks for changes.
- **FR-017**: Automate T00–T15 and T17 with production-path controls and fake providers. T04/T05 use a real browser. T16 combines artifact, HTTP-header and browser evidence. Capture at least three comparable before/after scenarios without inserting a vulnerability.
- **FR-018**: Produce `docs/EVIDENCE_W08.md` with checkpoint, architecture, per-field data inventory, at least six concrete risks and three priorities, I1–I8 traceability, T00–T17 fixture/expected/observed/test location, three before/after comparisons, command output, a redacted security event, residual risk with next concrete test, and actual pair/AI contributions including how accepted AI changes were verified.
- **FR-019**: Use only synthetic fixtures and a fake provider for adversarial tests. No real credential, private data, live provider call, external target or claim of unobserved success is permitted in evidence.

### Local security profile (server-owned targets)

| Boundary | Target |
|---|---|
| W05 HTTP request body | 64 KiB UTF-8 bytes before JSON parsing; existing 501-drop maximum needs this envelope |
| W05 HTTP body receive time | 5 s from the start of server body reading to completed body; silent or slow bodies stop before provider work |
| W05 client goal | Fixed `choose_next_drill`; no free-form user text |
| W05 run numbers | Score 0–500; drops 1–501; starting width and drop widths finite and within (0, 4096] px, except terminal `widthAfter = 0`; offset finite and within [-4096, 4096] px; floor 1–501 and sequential |
| Tool result | 256 UTF-8 bytes, exact fields and server-derived counts |
| Model decision | 4 KiB serialized decision; provider envelope up to 32 KiB before JSON parsing where transport permits |
| Model context / generated output | At most 2 KiB serialized context with at most 2 validated evidence items; provider output cap 512 tokens where supported |
| Model decisions / provider attempts | 3 decisions / 4 total attempts, at most 2 attempts per decision |
| Tool executions | 2 per run; deterministic bounded evaluator |
| Provider attempt / total run | 8 s / 25 s, including retry and tool work |
| Simultaneous W05 runs | 2 active in one local server process, including unfinished underlying work |
| Admission | At most 5 W05 runs per 60 seconds globally in unauthenticated local demo mode; no client-supplied IP trust |

These are project targets, not universal security constants. An in-memory process limit is not a distributed production quota.

The 4096 px AI-analysis envelope is a server-owned demo policy. Custom browser game configurations outside it may still run the game, but their AI request receives a safe unavailable result; browser configuration cannot raise this limit.

### Key entities

- **Completed run input**: Client-supplied score, width and bounded drop records; internally consistent but unverified as authentic play.
- **Agent run**: Server-owned identity, deadlines, step/attempt/tool counters, state and terminal reason.
- **Tool proposal and evidence**: A fixed drill candidate and validated read-only result bound to one run.
- **Security event**: Bounded metadata about admission, denial, tool decision or completion; no raw content.
- **Evidence record**: Observed test output, checkpoint and traceability for review.

## Success Criteria

### Measurable outcomes

- **SC-001**: Every automated normal-flow test records at least two model decisions, one real allowed tool call and unchanged canonical game state.
- **SC-002**: Every invalid initial request in the W08 matrix records zero provider and tool calls; every forbidden tool proposal records zero forbidden executions.
- **SC-003**: T00–T15 and T17 are automated and pass; T16 has actual build, header, browser and blocked-resource evidence.
- **SC-004**: Measured active W05 jobs never exceed two in one local process; after rejection and cleanup, a legitimate request succeeds.
- **SC-005**: The synthetic server sentinel is absent from tested client artifacts, model context, responses and operational events.
- **SC-006**: The final evidence contains at least six assessed risks, three priorities and three observed before/after comparisons, with no unrun check marked PASS.
- **SC-007**: Both pair members can explain one normal and two denied traces during the eight-minute demo; actual contributions are recorded by the members.

## Assumptions and scope

- Current W05 has no authentication, private resource IDs, database, leaderboard, imported replay or free-form text sent to the agent; review must confirm this before assigning conditional tests.
- The local browser and API communicate through the existing same-origin proxy. If production architecture differs, its origin and credential handling receive a separate applicability check.
- W05's single deterministic tool remains read-only. No new login, write tool, leaderboard or general agent is introduced.
- The existing production deployment is not changed or published in the planning phase. Public multi-instance abuse controls require a separate deployment decision and evidence.
- The optional W08 extension, if time remains after the mandatory matrix, is one seeded property-based validation test. No second extension is planned.
