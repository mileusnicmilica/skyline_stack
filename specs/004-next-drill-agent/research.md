# Research Decisions: Next Drill Agent

## Existing project boundary

**Decision**: Reuse W04's completed-run validation, drop data, server process, provider configuration mode, rate limiting, and browser request-gate pattern.  
**Rationale**: W04 already validates score, width continuity, timing labels, and terminal miss. Rebuilding those rules for W05 would risk divergence.  
**Alternative**: Send a new raw game-state format; rejected because it enlarges the model context and validation surface.

The local API gives W04 and W05 separate five-request/ten-minute quotas. It keys local clients by the socket address so caller-supplied forwarding headers cannot evade the quota. A denied W05 request stops before the model or tool runs.

## Drill evaluator

**Decision**: One deterministic read-only tool evaluates a model-selected candidate. Late count greater than early supports `release_earlier`; early greater than late supports `release_later`; a tie supports `center_alignment`. Terminal miss counts.  
**Rationale**: The check can reject a model's unsupported choice, produces explicit evidence, and requires no simulation or game-state mutation.  
**Alternative**: A tool that merely returns the score; rejected because it adds no useful evidence.

## Provider and loop

**Decision**: Use the selected W04 fake/Gemini mode through a W05 decision interface, with the same server-only key and model configuration. Keep decision parsing and budgets in the orchestrator, not in a provider adapter.  
**Rationale**: Provider transport differs; allowed actions, counting, and stopping must be controlled by application code.  
**Alternative**: Provider-native automatic tool execution; rejected because it weakens the local allowlist boundary.

## Final answer

**Decision**: Model returns drill and evidence identifiers; application composes visible text from validated evidence.  
**Rationale**: Every displayed factual statement is checkable. A freeform model explanation could assert unsupported gameplay facts even with a valid evidence reference.  
**Alternative**: Validate only length of freeform advice; rejected as insufficient evidence validation.

## Development mode

**Decision**: Force `AI_COACH_PROVIDER=fake` for routine verification and require an intentional, limited live demonstration after fake tests.  
**Rationale**: Local ignored `.env` currently selects Gemini; an unqualified baseline `verify` attempted live calls and returned HTTP 503. Explicit fake mode passed all existing checks on 2026-10-05.  
**Alternative**: Use the current environment implicitly; rejected because test runs could consume live calls or fail unpredictably.
