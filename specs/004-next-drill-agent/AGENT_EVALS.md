# Predeclared W05 Agent Evals

Run these with the injected fake decision provider before any live run. Record actual outcomes in `docs/EVIDENCE_W05.md`; these are expectations, not observed W05 results.

| ID | Scenario | Required observation |
|---|---|---|
| E01 | Late-dominant normal run | At least 2 model steps, 1 tool call, `release_earlier`, supported same-run evidence, `goal_completed` |
| E02 | Early-dominant run | `release_later` with correct counts and one supported tool result |
| E03 | Balanced run, including score zero | `center_alignment`; terminal miss counted |
| E04 | Invalid initial request | 0 provider attempts, 0 tool calls, safe `invalid_input` |
| E05 | Unknown tool | `toolCallCount === 0`, stop `unknown_tool`, no tool implementation reached |
| E06 | Invalid or extra tool arguments | `toolCallCount === 0`, stop `invalid_tool_args` |
| E07 | Unsupported first candidate, different second | 2 tool calls at most, final references only supported evidence |
| E08 | Repeated identical call | Second proposal rejected, no second tool execution, stop `repeated_call` |
| E09 | Tool throws, times out, or returns malformed/oversized result | No success; distinguish `tool_failure`, `tool_timeout`, and `invalid_tool_result` |
| E10 | Provider transient failure, rate limit, unavailability, or timeout | Bounded retry, at most 2 attempts/step and 4/run; specific safe stop reason when exhausted |
| E11 | Malformed model output | No tool execution for malformed first decision; safe stop without retry |
| E12 | Third step proposes another tool or deadline expires | `max_steps` or `deadline`; no success |
| E13 | Final cites absent, unsupported, or other-drill evidence | `invalid_final`; no recommendation displayed |
| E14 | Restart while pending | Old result ignored; new run playable, W04 Coach unaffected |
| E15 | W04 regression and secret boundary | Existing verify passes in explicit fake mode; no provider key in bundle/logs/evidence |

Test evidence should report run ID, step count, provider attempt count, tool execution count, and stop reason without raw prompts or drop logs. Do not count provider retries as agent steps.
