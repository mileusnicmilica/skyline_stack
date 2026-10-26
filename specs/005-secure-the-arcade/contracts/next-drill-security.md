# W08 Next Drill Security Contract

## HTTP and trust policy

`POST /api/ai/next-drill` accepts JSON with exactly `goal`, `finalScore`, `startingWidth`, `drops`. All fields are required. Missing, `null`, unknown, non-finite and wrong-type values are rejected. The 64 KiB limit counts UTF-8 request bytes before full JSON parsing; >64 KiB returns 413. A silent or stalled body is stopped 5 s after the server starts reading it. The handler never takes `role`, `ownerId`, provider, model or limits from this object.

| Field | Required value and range |
|---|---|
| `goal` | Literal `choose_next_drill` (17 ASCII characters); no free-form text |
| `finalScore` | Integer 0–500 |
| `startingWidth` | Finite number >0 and ≤4096 px in the W08 AI demo profile |
| `drops` | Array of 1–501 exact-field records, with a terminal miss; successful drop count equals `finalScore` |
| Each drop | Exactly `floor`, `offsetPx`, `direction`, `timing`, `widthBefore`, `widthAfter`; no extra fields |
| `floor` | Sequential integer 1–501 |
| `offsetPx` | Finite number from -4096 to 4096 px; geometry rules determine the width loss |
| `direction` / `timing` | `-1` or `1` / `early`, `late`, `centered`, consistent with offset and direction |
| `widthBefore` / `widthAfter` | Finite width >0 and ≤4096 / finite width ≥0 and ≤prior width, with geometric consistency and zero only for the terminal miss |

Exact unknown-field rejection applies to HTTP input, model decision, tool arguments, evidence and final action. A custom browser game configuration beyond the 4096 px AI envelope remains playable but cannot increase AI authority; the UI shows its safe unavailable state.

The local demo checks a global five-request/60-second window before reading full bodies; invalid attempts also consume this protective window. After domain validation, at most two underlying W05 runs may be active. Excess returns 429 and no provider/tool work. A successful response contains only `success: true` and a validated recommendation. Failures contain no prompt, drop log, key or internal stack.

| Outcome | HTTP status | Stable public code |
|---|---:|---|
| Invalid JSON, content type, shape or game domain | 400 | `INVALID_REQUEST` |
| Method other than POST | 405, `Allow: POST` | `METHOD_NOT_ALLOWED` |
| Body over 64 KiB | 413 | `REQUEST_TOO_LARGE` |
| Body receive deadline | 408 | `REQUEST_TIMEOUT` |
| Local admission window or active-work cap | 429 | `RATE_LIMITED` or `CONCURRENCY_LIMIT` |
| Upstream provider rate limit | 429 | `PROVIDER_RATE_LIMITED` |
| Provider attempt or total agent deadline | 504 | `AGENT_TIMEOUT` |
| Invalid model/tool/final or other unavailable provider | 503 | `AGENT_UNAVAILABLE` |
| Browser disconnect/cancel after response closes | No new HTTP body | No public code |

The code is an enumerated identifier, not a raw provider message. A post-admission error may include a generated run/correlation ID. Denial tests assert actual provider/tool/state effects in addition to the status.

## Model/tool/final policy

Decision variants are exactly `{action:"call_tool",tool:"evaluate_drill",args:{drillId}}` and `{action:"final",drillId,evidenceId}`. `drillId` is one of `release_earlier`, `release_later`, `center_alignment`. Unknown fields and other actions fail. `constructor`, `toString`, unknown tool names, valid names with invalid args, and repeated same proposals never dispatch. The sole tool runs on current validated counts; it has no write or arbitrary resource interface. Evidence has exact fields and a 256-byte serialized bound before model reuse. A final cites only supported evidence from the same run; server-composed display text is drawn from fixed descriptions and validated numbers. The browser treats response fields as untrusted text.

| Field group | Exact validation |
|---|---|
| Tool args | Exactly one `drillId` enum field, no `null` or extra scope/owner fields |
| Model final | Exactly `action`, `drillId`, `evidenceId`; `evidenceId` is `ev-1` or `ev-2` from the current run |
| Tool evidence | Exactly `evidenceId`, `drillId`, `supported`, `earlyCount`, `lateCount`, `centeredCount`, `totalDrops`, `findingCode`; counts are integers 0–501, total equals the current validated run's drop count and 256-byte UTF-8 bound applies |
| Browser recommendation | Exact existing fields; server-generated run ID, title ≤80 characters, instruction ≤200, finding ≤160, counts 0–501, all rendered as text |

The request has no arbitrary text field; the generated labels have fixed text and size. The model context contains at most two evidence items, and the final recommendation cannot cite an evidence ID from another run.

The server-owned budgets are in [spec.md](../spec.md#local-security-profile-server-owned-targets). Serialize and check the at-most-2 KiB model context before send; include at most two validated evidence items. The Gemini adapter sets a 512-token output cap where supported, bounds the transport envelope to 32 KiB before full JSON parsing, then enforces the 4 KiB decision bound. Every explicit or adapter retry consumes a provider attempt; the raw fetch adapter must not add hidden SDK retries. Settled transient failures may retry, but a provider timeout is terminal: no retry may overlap its unfinished operation. After deadline/cancel, no new step begins and no late output is accepted as success. Active-work accounting follows underlying work, not only the timeout race.

The Origin gate compares protocol, host and port. The local HTTP listener uses `http:`; the Vercel entrypoint explicitly uses its HTTPS ingress policy. A caller's `X-Forwarded-Proto` cannot choose the trusted protocol. This is a browser-origin admission check, not authentication; a direct non-browser caller can omit Origin but still faces validation, quotas and capacity limits.

## Conditional boundaries

Current code has no account, private resource, session cookie, imported replay, Markdown or free-form untrusted text in W05 model context. T03 checks the fixed drill/demo scope rather than inventing A/B private users. T05 checks text-only treatment and forbidden URL text rather than adding Markdown. T09 uses a malicious fake provider output because there is no genuine injection text channel. T15 demonstrates the unverified browser score without inventing a leaderboard. Reassess these facts if the code changes.

## Predeclared scenario matrix

All tests use synthetic input and fake or stubbed provider transport. This table records predeclared expectations; current observed results are maintained in `docs/EVIDENCE_W08.md`.

| ID | Probe and required observation |
|---|---|
| T00 | Real game smoke and valid W05 HTTP/agent flow: ≥2 model decisions, ≥1 allowed actual tool, supported final, no canonical state change. |
| T01 | Direct malformed JSON, type/domain failures: controlled 400; provider/tool 0. Exact valid boundary passes. |
| T02 | 64 KiB/64 KiB+1 body, a stalled-body deadline, and separate `maxSteps`/`ownerId`/`role`/provider extras: 413 for size, 408 for stalled receive; extras cannot change policy; zero provider/tool on rejection. |
| T03 | An added resource/owner ID in the API request is rejected before provider work; a model-proposed drill remains within the three fixed demo choices and current run. If private resources appear, replace this with A/B ownership checks at API and tool. |
| T04 | Real browser renders a harmless XSS marker through actual recommendation path: marker not executed and DOM has no active element/attribute; normal Serbian text, apostrophe and `a < b` render correctly where allowed. |
| T05 | Real browser treats raw HTML and `javascript:` link text as text or rejects it; no dangerous navigation/active DOM. |
| T06 | Malformed/extra/oversized model decision or final and oversized provider envelope: controlled failure, no false success, no next step after invalid output. |
| T07 | Fake proposal of unknown tool, `constructor`, `toString`: zero forbidden executions. |
| T08 | `evaluate_drill` with invalid args is denied before execution. A separate valid-argument call must receive server-derived current-run counts (verified with a tool spy); a synthetic result containing another run's otherwise valid counts is rejected before model reuse. Positive allowed call succeeds. There is no independent private resource identifier to authorize in this tool. |
| T09 | Malicious fake provider deliberately proposes `set_score` or out-of-scope operation despite prompt rules: code denies, zero forbidden work and unchanged state. State that this is execution-policy evidence, not general model immunity. |
| T10 | Oversized, malformed or extra-field tool result with synthetic sentinel: rejected/normalized before reuse; model context omits raw field. |
| T11 | Repeated same proposal and separately max-step/attempt exhaustion: no extra call; retries share run budget. |
| T12 | Per-attempt timeout and separate cumulative deadline with delayed results; in the cumulative test each individual call stays below its own timeout while their sum crosses 25 s. No new step or late success; underlying-work lease releases only after safe settlement. |
| T13 | Several actual parallel local HTTP calls and separate window-limit probe: active underlying jobs ≤2, excess 429 before provider, slot/window recovery permits later valid call. |
| T14 | Loaded synthetic server sentinel in adapter error or tool extra field; no sentinel in response/model/log/client artifacts; newline log-injection input creates no forged event. |
| T15 | Browser state/score manipulation cannot raise authority or server limits or create a verified score; read-only tool leaves game state unchanged. |
| T16 | Local served production bundle has active CSP, `nosniff`, `Referrer-Policy`; a known reachable forbidden script is blocked by a named CSP directive while gameplay and W05 display work; sentinel absent from bundle/maps. |
| T17 | Forged `x-forwarded-for` plus parallel requests does not evade the local global window or active-work cap. This combines header-controlled identity and concurrency in one chain, which T13's separate capacity/window probes do not prove. Explain the multi-instance limitation separately. |

Automate T00–T15 and T17; T04/T05 must exercise a real browser. T16 may combine automated and recorded manual checks. Add a CSRF test only if ambient credentials or protected cookie operations are actually found. For initial HTTP denials, assert zero provider *and* tool calls; for a denied model proposal, a provider attempt is expected but forbidden tool executions remain zero. Each main control needs a positive case.
