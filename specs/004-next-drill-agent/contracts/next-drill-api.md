# API and Model Contract: Next Drill Agent

## Browser request

`POST /api/ai/next-drill` with `Content-Type: application/json`. Exact JSON: `{ "goal":"choose_next_drill", "finalScore":number, "startingWidth":number, "drops":DropRecord[] }`. Request body limit: existing server limit of 64 KiB. The completed-run fields use W04's strict shape and consistency checks (score 0–500, 1–501 ordered drops, width continuity, terminal miss, timing/direction consistency). Wrong method returns 405; wrong type, malformed JSON, or invalid run returns 400; oversized body returns 413. The local API limits each AI endpoint independently to five requests per ten minutes from the connecting client; a rejected request returns 429 before any provider or tool work. Untrusted forwarding headers do not change the local client's quota. Every failure body uses the safe public message.

## Model decisions

Step 1 must be `{ "action":"call_tool", "tool":"evaluate_drill", "args":{"drillId":DrillId} }`. After a valid tool result, step 2 may return a final decision or another **different** candidate if the first was unsupported. Step 3 must be final. The final model shape is `{ "action":"final", "drillId":DrillId, "evidenceId":"ev-1" | "ev-2" }` with no extra keys. Both decisions are parsed as untrusted data regardless of provider JSON schema. A final decision is accepted only when its evidence ID identifies a supported result for the same drill in this run.

The provider interface receives fixed goal, score, timing counts, allowed tool schema, and this run's normalized evidence; it receives neither full drop log nor key. Fake mode and Gemini mode implement the same interface. The backend selects mode from existing server configuration; the model cannot select one. Transient timeout/unavailable/rate-limit failures may retry once per step within the total call budget; malformed output does not retry.

## Public response

Success (200): `{ "success":true, "recommendation":{ "drillId":DrillId, "title":string, "instruction":string, "evidence":{ "earlyCount":number, "lateCount":number, "centeredCount":number, "finding":string }, "runId":string, "stopReason":"goal_completed" } }`. Text is selected server-side from validated evidence. No raw model text is rendered.

Failure (400/413/429/503): `{ "success":false, "message":"Sledeća vežba trenutno nije dostupna.", "runId"?:string, "stopReason"?:string }`. Public `stopReason` is from a fixed safe enum: `invalid_input`, `unknown_tool`, `invalid_tool_args`, `repeated_call`, `tool_failure`, `tool_timeout`, `invalid_tool_result`, `provider_failure`, `provider_timeout`, `provider_rate_limit`, `provider_unavailable`, `provider_unauthorized`, `invalid_model_output`, `invalid_final`, `max_steps`, `deadline`, `cancelled`, or `incomplete`. An upstream provider rate limit returns 429; other provider failures return 503. No stack traces, raw arguments, model output, prompts, or secrets are returned.

The browser validates the public response shape, blocks duplicate requests, uses a 27-second client timeout, and discards stale results after Restart. The existing `/api/ai/coach` endpoint and browser flow remain unchanged.
