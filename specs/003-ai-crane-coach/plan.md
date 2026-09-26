# Implementation Plan: AI Crane Coach

**Branch**: `003-ai-crane-coach` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-ai-crane-coach/spec.md`

## Summary

Add an optional, post-Game-Over coach flow without changing the existing W03
game loop. The work is deliberately split at a working local API boundary.
Nemanja's first handoff delivers the frontend/backend process split, validated
drop history, a deterministic statistics/validation core, and an injectable
fake provider. Milica's follow-up connects the selected live Gemini provider,
completes transient-failure handling, adds the player-facing UI, and records
the end-to-end evidence. The browser calls only the local `/api/ai/coach`
endpoint; provider credentials remain server-only.

## Technical Context

**Language/Version**: TypeScript 7.0.2; Node.js 24.x; existing browser targets
**Primary Dependencies**: Existing Vite 8.3.0 and Vitest 5.0.1; add `tsx`
and `@types/node` only to run/typecheck the isolated server. A small Node
child-process script coordinates local startup. No extra process-manager
package, HTTP framework, or provider SDK is needed in Nemanja's phase.
Milica's provider SDK choice remains a later reviewed task.
**Storage**: None; run logs are transient and are not persisted.
**Testing**: Existing Vitest suite plus API contract/unit tests; TypeScript
typecheck, production build, and browser smoke through the verification runner.
**Target Platform**: Local browser frontend plus a loopback-only Node API.
**Project Type**: Existing Vite browser game with a separate TypeScript API
process in `server/`.
**Performance Goals**: Valid local/fake-provider responses are immediate;
production-provider requests have a 10-second total deadline and return a safe
result within the 12-second user-facing bound.
**Constraints**: No provider call during gameplay; no secrets in frontend;
validate bounded request before provider invocation; preserve game controls,
score, restart, and historical W03/V2 artifacts. Do not truncate a run log.
**Scale/Scope**: One local endpoint, one provider, at most 501 drop records per
request, no accounts or persistence.

## Constitution Check

**Before Phase 0**: PASS. Constitution v1.1.0 explicitly permits this
assignment-authorized W04 backend only as a separate Spec Kit feature. This
feature has its own spec, bounded server boundary, and no changes to historical
W03/V2 specifications or evidence. The TypeScript runner dependencies are
limited to server execution/typechecking and coordinated local startup; no
runtime web framework is needed for one endpoint.

**After Phase 1**: PASS. The proposed server binds to `127.0.0.1`, validates
input before provider injection, uses a fake provider for Nemanja's deliverable,
and exposes only a small public response contract. UI/Gemini integration remains
outside the first handoff. All behavior remains outside the animation/drop
resolution loop except recording the deterministic drop facts.

## Phase 0: Research Decisions

See [research.md](research.md). Selected architecture is built-in Node HTTP
with isolated `server/` TypeScript, `tsx` for execution, a Vite `/api` proxy,
and a fake provider as the first integration seam. Provider research selects
`gemini-3.1-flash-lite` for Milica's later live integration: among current
generally available stable Flash-Lite models it is cheaper than 3.5 while
supporting structured output. 2.5 Flash-Lite is not selected because Google
limits access for new users/projects.

## Phase 1: Design

- [Data model](data-model.md) defines per-drop records and the transient API
  request/response and derived-statistics boundary.
- [Coach endpoint contract](contracts/coach-api.md) defines request validation,
  public errors, fake/live provider seam, and server-side response checks.
- [Quickstart](quickstart.md) records repeatable local setup and verification.
- `vite.config.ts` proxies `/api` in dev and preview to the loopback API.
- The API server is independently runnable and testable; a coordinator script
  starts/stops frontend and backend without leaving child processes behind.

## Project Structure

```text
src/
  game/model.ts                 # DropRecord and GameSession history
  game/engine.ts                # append one record per resolved attempt
server/
  index.ts                      # Node HTTP routes and safe responses
  main.ts                       # loopback-only process entry
  coach/                        # request validation, statistics, advice validation
  providers/fake-provider.ts    # deterministic test/development provider
scripts/dev-full.mjs            # start/stop API and Vite together
tests/
  game/                         # drop history tests
  server/                       # API contract and provider-call boundary tests
  verify.mjs                    # typecheck, tests, build, start API + preview smoke
vite.config.ts                  # dev + preview /api proxy
tsconfig.server.json            # Node/server typecheck, separate from browser TS config
```

**Structure Decision**: Keep the current browser game under `src/`; create a
small, separately started `server/` process rather than moving the existing
frontend or introducing a framework. Preserve the current Vite/Vitest scripts
and extend the existing verification workflow to include both processes.

## Delivery Split and Handoff

### Nemanja — first implementation block

1. Establish the frontend/backend process boundary and one-command local
   startup/proxy path.
2. Add `DropRecord[]` to game state and record success/miss details in the
   deterministic landing resolver; restart clears history.
3. Implement bounded request validation, backend-derived deterministic stats,
   response shape/semantic validation, and the `/api/ai/coach` route.
4. Inject a fake provider and prove invalid input yields zero provider calls;
   keep the live-provider adapter disabled/unimplemented.
5. Validate with focused tests, whole-project typecheck/build, and available
   smoke tests, then hand off the contract and exact unfinished tasks.

### Milica — later implementation block

1. Review Nemanja's API contract and fake-provider tests before changing it.
2. Add the live `gemini-3.1-flash-lite` provider using server-only credentials
   and structured JSON output, then complete bounded timeout/retry behavior.
3. Add the Game Over analysis button, pending/unavailable/advice UI, duplicate
   request guard, and stale-response protection on restart.
4. Run fake and live-path validation as appropriate; capture reproducible,
   redacted evidence and document actual model/configuration and limitations.

## Complexity Tracking

No constitution violations. Added development tools are justified only to run
and typecheck a distinct TypeScript server process and coordinate local dev;
no additional HTTP framework, database, or deployment service is introduced.
