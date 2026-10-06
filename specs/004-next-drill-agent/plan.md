# Implementation Plan: Next Drill Agent

**Branch**: `main` (current working branch) | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)  
**Status**: Phase A approved in chat; implementation and fake verification complete; live attempt failed safely; pair role record and joint demo pending

## Summary

Add a second, optional Game Over action to the existing W04 game. A server-owned agent chooses a next practice drill through two or three model decisions and a read-only deterministic `evaluate_drill` tool. The application validates every proposal, tool result, and final result, then displays server-derived evidence. W04 Coach continues through its existing endpoint and provider mode. The W05 endpoint is separate.

## Technical Context

**Language/Version**: Existing TypeScript 7.0.2 and Node 24  
**Primary Dependencies**: Existing Vite 8.3.0, Vitest 5.0.1, `tsx`; no new package  
**Storage**: None; completed run and agent trace stay transient, sanitized summary only in server logs  
**Testing**: Vitest fake-provider/tool/HTTP tests, browser smoke, typechecks, build, secret scan  
**Target Platform**: Existing browser game and loopback Node API  
**Project Type**: Existing frontend plus small TypeScript backend  
**Performance Goals**: 25 s total server deadline; browser safe result within 27 s  
**Constraints**: Preserve W03/W04 flows; no live provider during routine tests; server-only credentials; at most 3 model steps, 4 provider attempts, 2 tool calls  
**Scale/Scope**: One completed run, one endpoint, one tool, three fixed drills, one provider selected by server configuration

## Constitution Check

**Before research**: Phase A only. The W05 PDF explicitly authorizes a separate feature over the W04 backend, fitting Principle II's later-week exception. Principle I required pair review and approval of this spec, plan, and tasks; the user reported approval before implementation. No historical W03/V2 artifact is changed. No new dependency or game rule is proposed.

**After design**: PASS. Pair approval was reported before implementation. The agent cannot write game state or access arbitrary resources. Runtime validation, bounded calls, fake tests, and honest evidence satisfy Principles III–IV. The live attempt failed safely; the joint demo remains open.

## Phase 0: Research Decisions

See [research.md](research.md). Existing W04 validation, provider configuration, and API process are reused. The W04 baseline was observed on 2026-10-05 with `AI_COACH_PROVIDER=fake`: 17 test files / 121 tests, typechecks, build, secret boundary, proxy, and browser smoke passed. A prior run without the fake override used local Gemini mode and ended at HTTP 503; no successful live W05 run is claimed.

## Phase 1: Design

- [Data model](data-model.md) specifies run, decision, evidence, and final-result states.
- [Agent flow](AGENT_FLOW.md) shows model/tool sequence and stop paths.
- [Tool contract](contracts/evaluate-drill.md) defines exact input/output, scope, timeout, and forbidden behavior.
- [API and model contract](contracts/next-drill-api.md) defines request, decisions, final, errors, and status.
- [Eval matrix](AGENT_EVALS.md) records predeclared positive and negative tests.
- [Quickstart](quickstart.md) is the reproducible validation guide.

The model receives only the fixed goal, bounded derived timing counts and score, allowed tool contract, and this run's normalized tool results. It receives no full repository, history, key, raw prompt log, arbitrary URL, or tool implementation. The server validates the completed drop log with W04's existing rules before deriving this context.

### Limits and policy

| Limit | Value |
|---|---:|
| Model steps | 3 |
| Tool executions | 2 |
| Provider attempts per step | 2 |
| Provider attempts per run | 4 |
| Per-attempt timeout | 8 s |
| Total deadline | 25 s |
| Provider fallback | 0 |

Only transient provider failures, rate limits, or timeouts can be retried, if both the remaining run deadline and provider budget permit. Invalid model output, invalid tool proposal/result, and invalid final are terminal. The first decision must propose `evaluate_drill`. An unsupported evaluation may prompt one distinct second proposal. After supported evidence, the model must return a final structured choice. A repeated identical proposal is rejected. At the third model step, any further tool proposal stops with `max_steps`. Every run ends with an explicit stop reason.

The timeout values above are hard upper bounds even when lower test-specific values are injected. Local W04 and W05 routes each have a separate five-request/ten-minute quota. Provider rate limit, unavailability, credential rejection, and tool timeout produce distinct sanitized stop reasons; completed step records do not remain `pending`.

The model's final is only `{action:"final", drillId, evidenceId}`. The server checks that the evidence ID belongs to the same run, names that drill, and is supported; it creates the visible title, instruction, and numeric evidence from fixed text plus validated tool facts. This avoids displaying uncheckable model claims. No human approval is needed because the tool and result are read-only.

## Project Structure

```text
specs/004-next-drill-agent/       spec, plan, tasks, research, contracts, evals, flow
server/agent/                    orchestrator, validation, deterministic tool, provider interface
server/providers/                fake and Gemini agent-decision adapters
server/index.ts                  new /api/ai/next-drill route
server/main.ts                   configured agent provider and sanitized usage hook
src/agent/                      browser client, response validation, request gate
src/main.ts, index.html, src/style.css  post-run control and status
tests/server/, tests/           fake tool/loop/HTTP/UI cases
docs/EVIDENCE_W05.md            observed evidence only
```

**Structure Decision**: Reuse the existing server/browser split and W04 drop-log validation. Keep W05 logic isolated so W04's one-shot Coach contract does not change.

## Proposed Pair Workflow

1. Nemanja drives review of spec, architecture, and orchestrator tasks; Milica reviews the tool contract, limits, and negative cases.
2. After the first working fake path, swap roles: Milica drives UI/provider integration and Nemanja reviews contracts, safety, and evidence.
3. Both run through a success and rejected-tool trace and jointly present the demo. These are proposed roles; record actual activity only after it occurs.

## Complexity Tracking

No new dependency or constitution exception is needed beyond the W05 assignment's separate feature. Phase A approval was reported before implementation. The pair's actual role split and joint demo remain unverified and must be recorded by Nemanja and Milica.
