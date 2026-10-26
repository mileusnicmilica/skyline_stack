# W08 Security Data Model

This feature adds no persistent player data. These are trust and lifecycle contracts for the existing run.

| Entity | Fields and source | Validation / authority | Lifetime |
|---|---|---|---|
| CompletedRunInput | `goal`, `finalScore`, `startingWidth`, `drops[]` from browser | Exact request contract and numeric ranges in `spec.md`, max 501 drops, geometric consistency; internally valid does not mean authentic gameplay | One HTTP request |
| RunFacts | Score, early/late/centered counts derived on server | Derived only from validated input; safe numeric bounds | One agent run |
| AgentRun | Server-generated run/correlation ID, start/deadline, step count, provider attempts, tool count, stop reason | Server-owned; client fields cannot override | Until terminal result; bounded usage summary may remain |
| AdmissionLease | One of two in-process active-work slots; lifecycle `available → reserved → draining → released` | Acquired after validation and before provider; released only when underlying work settles | Active/settling work |
| ToolProposal | Action, literal `evaluate_drill`, one of three drill IDs | Exact allowlist, no inherited-property lookup, scope/domain check | One model step |
| ToolEvidence | Evidence ID, drill ID, supported flag, three counts, total and finding code | Exact 256-byte normalized result, same-run ID and count consistency | One agent run; only validated copy goes to model |
| Recommendation | Validated final drill and evidence ID, server-composed title/instruction/finding | Supported same-run evidence; browser client revalidates shape and renders as text | Until Restart |
| SecurityEvent | Controlled event/reason code, timestamp, generated correlation ID, outcome and bounded counters | Enumerated fields; no raw request, prompt, result, cookie, key or stack | Bounded recent history / operational log |

## Run state transitions

```text
received → body_validated → domain_validated → admitted → model_step
model_step → tool_checked → tool_completed → model_step → final_validated → completed
any active state → denied | timed_out | cancelled | failed → draining → released
```

An initial denial does not enter `admitted` and has zero provider/tool calls. A model-originated denial may follow a provider attempt but cannot execute the denied tool. The HTTP response may finish before an abort-ignoring operation settles; its admission lease stays in `draining` until settlement. The deadline prevents late success.

## Data scope

The sole tool evaluates one of three fixed drills against this run's derived counts. It cannot select a user, file, URL, database row or another game's state. There is no server-owned verified score. The client-supplied run remains an unverified input even after format and geometry checks.
