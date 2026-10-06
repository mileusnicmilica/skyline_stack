# Data Model: Next Drill Agent

## DrillRequest

Exact keys: `goal: "choose_next_drill"`, `finalScore`, `startingWidth`, `drops`. The latter three follow the existing W04 completed-run contract; no extra game state. Invalid requests end before model and tool execution.

## AgentRun

Ephemeral: unique `runId`, started time, total deadline, `stepCount` (0–3), `providerAttemptCount` (0–4), `toolCallCount` (0–2), `seenProposals`, `evidence[]`, and terminal `stopReason`. Each provider attempt belongs to one step. No persistence or raw request logging.

State transitions: `received → validated → model_decision → proposal_validated → tool_executed → result_validated → model_decision → final_validated → completed`. Any invalid action, failure, cancellation, or limit transitions to `stopped`, never back to `completed`.

## AgentDecision

Exact disjoint shapes: `{action:"call_tool", tool:"evaluate_drill", args:{drillId:DrillId}}` or `{action:"final", drillId:DrillId, evidenceId:string}`. `DrillId` is `release_earlier | release_later | center_alignment`. Final is illegal before supported evidence.

## ToolEvidence

Exact output: `evidenceId` (server-scoped `ev-1` or `ev-2`), `drillId`, `supported` boolean, `earlyCount`, `lateCount`, `centeredCount`, `totalDrops`, and `findingCode` (`late_dominant | early_dominant | balanced`). Counts are nonnegative integers, sum to total drops, and match validated run facts. Evidence is capped at 256 serialized bytes; oversized/malformed results stop the run.

## DrillRecommendation

Exact public success shape: `drillId`, `title`, `instruction`, `evidence` (the bounded counts and human-readable finding), `runId`, and `stopReason:"goal_completed"`. Title, instruction, and finding are fixed server-side text selected by `drillId`/`findingCode`. A failed run returns only `success:false`, a stable safe message, `runId` when available, and an allowlisted stop reason; no raw provider/tool details.
