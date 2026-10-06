# Tool Contract: `evaluate_drill`

| Field | Contract |
|---|---|
| Purpose | Check whether one model-selected practice drill matches a validated completed run |
| Mode | Read-only deterministic local operation |
| Allowed caller | Server agent orchestrator during one `choose_next_drill` run only |
| Authorization/scope | Uses only the run validated from this request; no user IDs or external resources |
| Input | Exact object `{ "drillId": "release_earlier" | "release_later" | "center_alignment" }` |
| Output | Exact ToolEvidence shape in [data-model.md](../data-model.md) |
| Timeout | 50 ms local operation deadline, further capped by the remaining run deadline; timeout stops run as `tool_timeout` (or `deadline` if the run deadline has elapsed) |
| Maximum result size | 256 serialized UTF-8 bytes |
| Forbidden behavior | Game-state mutation, file/network/shell access, secret access, arbitrary function dispatch, logging raw drops |
| Failure behavior | Catch failure, record safe stop reason, return no recommendation; never ask model to repair malformed tool output |

## Deterministic evaluation

From the validated drop log, count `early`, `late`, and `centered` including terminal miss. If `lateCount > earlyCount`, the supported drill is `release_earlier` and finding is `late_dominant`. If `earlyCount > lateCount`, it is `release_later` and `early_dominant`. Otherwise it is `center_alignment` and `balanced`. The tool returns `supported:true` only when proposed `drillId` equals that result; it returns a normalized result with `supported:false` for another valid drill.

The orchestrator checks allowlist membership, exact input keys, enum value, remaining budget, and repeated-call key **before** executing. A rejected proposal has `toolCallCount === 0` if it is the first proposal. The tool result is validated for exact fields, finite bounded counts, count sum, finding code, support consistency, same-run evidence ID, and serialized size before the model receives it. Only normalized output is sent to the model.
