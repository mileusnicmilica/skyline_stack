# Implementation Plan: W08 Secure the Arcade

**Branch**: `main` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)  
**Status**: Technical blocks implemented with follow-up audit corrections; current tested checkpoint is recorded in `docs/EVIDENCE_W08.md`. Both document approvals, attributed personal contributions and the pair-confirmed demo outcomes/role swap are recorded there.

## Summary

Harden the existing Game Over → `POST /api/ai/next-drill` → server agent → fake/Gemini adapter → `evaluate_drill` → browser recommendation path. Reuse its exact contracts and deterministic tool. Add the missing cross-request budget, bound provider transport and output, make cancellation capacity-safe, serve the production bundle with effective security headers, and prove every boundary through T00–T17. Keep W04 Coach and normal gameplay as regression gates.

## Technical Context

**Language/Version**: Existing TypeScript 7.0.2; Node observed `v24.20.0` on 2026-10-26.  
**Dependencies**: Locked Vite 8.3.5, Vitest 5.0.5, `tsx` 4.23.13; no runtime package added.
**Storage**: Browser session in memory; bounded in-process usage records; no database, user accounts or verified leaderboard.  
**Testing**: Vitest unit and live local HTTP integration tests, existing Edge/Chromium CDP smoke harness, typecheck, build, secret scan, dependency audit.  
**Platform**: Existing local Node API and Vite production preview; Vercel route/config reviewed separately for equivalent headers and known multi-instance limits.  
**Scope**: One existing W05 agent path, its supporting browser/API boundaries and relevant deployment configuration. No new agent capability.

## Checkpoint and known baseline

At planning start: `main` commit `fe4029c67e1d3f1f1bd9046227e13983b8f9f32f`. The pre-existing untracked `responses/nedeljni_izvestaj_w04_milica_mileusnic.md` is unrelated and must be preserved. No W08 source files had been changed.

Observed 2026-10-26: `npm.cmd run typecheck` passed; `npm.cmd test` passed 25 files / 161 tests; `npm.cmd run build` passed with 17 transformed modules. `npm.cmd run evidence:w05` first failed before the script started due to sandbox `uv_os_get_passwd/ENOMEM`; rerun outside that sandbox passed. Its synthetic request is score 1, width 100, two late drops with a terminal miss. The fake success had 2 model steps, 2 provider attempts, 1 `evaluate_drill` call, result `release_earlier`, and `goal_completed`. The forbidden-tool fixture executed zero tools. These are baseline observations, not W08 security-suite results.

## Constitution Check

- **I, specification before implementation**: This separate W08 package follows specify → plan → tasks. Both technical blocks were separately authorized and implemented; both members' approvals of the three documents are recorded on 2026-10-27.
- **II, bounded later-week feature**: W08 expressly extends W05. It does not rewrite W03/V2 artifacts, add a login, database, write tool or game rule. Any new dependency needs its own justification.
- **III, honest evidence**: Baseline commands above were run. W08 outcomes are recorded only as they are measured in `docs/EVIDENCE_W08.md`; unrun rows remain `NOT RUN`. Pair-confirmed demo actions are labelled as learner reports and kept separate from Codex-operated checks. Real baseline gaps were measured before the corresponding Milica-block fixes.
- **IV, runtime contracts**: Existing `GameConfig` rule stays intact; W08 adds explicit runtime boundaries for agent input/output.
- **V, historical Session 003 experiment**: This rule applies to the old locked experiment; W08 uses its own approved spec, plan, tasks and evaluation set.

**Current gate**: Both technical blocks were tested locally and in GitHub Actions. Milica and Nemanja approved the three W08 documents; the pair-confirmed role rotation, three demo outcomes and each member's explanation of the other's control are recorded in `docs/EVIDENCE_W08.md`.

## Architecture and risk decisions

See [research.md](research.md) for the source-to-control inventory, six initial risks, threat priorities and alternatives. The core trust path is browser-controlled completed-run JSON → `server/index.ts` HTTP parser/admission → `server/agent/validate-request.ts` → `server/agent/run.ts` → provider adapter → `server/agent/evaluate-drill.ts` → exact final contract → `src/agent/next-drill-client.ts` → `src/main.ts` text rendering.

The present code already rejects extra W05 request fields, checks run geometry, checks exact model/tool/final shapes, validates tool evidence and uses `textContent`. This will be proved by regression tests instead of rewritten. W05 currently has a 64 KiB HTTP body cap, 3 decision/4 provider-attempt/2 tool-call limits and 8 s/25 s time bounds. The new work is targeted at gaps the current tests do not fully prove: concurrent admission, end-to-end transport size, cancellation of underlying work, production headers, secret/log boundary and direct adversarial browser/HTTP evidence.

### Local policy and enforcement order

The numeric limits are specified once in [spec.md](spec.md#local-security-profile-server-owned-targets). Keep valid 501-drop requests within the existing 64 KiB envelope. Enforce bytes before JSON parsing; schema and domain checks before agent admission; closed tool and result contracts before execution or model reuse; final validation before response; safe browser text on display. For unknown fields, `null`, missing values and wrong types, reject the entire W05 request or model/tool object. The server sets all budgets and provider choice. Treat incoming game data as unverified practice data.

Apply a global in-memory local W05 request window before full body reading; malformed attempts also consume it, protecting the parser. Add a five-second body-receive deadline. Count the two active-work slots only after input validation, before provider work. A denial returns 429 with zero provider/tool calls. The slot remains occupied until the underlying provider/tool work has settled or a genuinely bounded execution mechanism confirms it ended; a `Promise.race` timeout alone is not release evidence. Delay/retry/late-result tests will assert this lifecycle. Existing deterministic evaluator must have explicit maximum work, separate from async timeout.

For the Gemini adapter, set a server-owned 512-token output cap, count every explicit attempt, stream or otherwise bound the response envelope to 32 KiB before JSON parsing where the transport permits, then check the parsed decision size at 4 KiB. Serialize and bound model context at 2 KiB before send. Where the upstream transport cannot stop already billed work, evidence will state that limit. The fake provider path and tests never call the live endpoint.

### Browser and deployment profile

Use the existing text-only UI; inspect both W05 recommendation and W04 Coach sinks, then test controlled malicious responses through their actual browser render paths. Add one shared CSP policy for the built page and its local preview serving path (`vite.config.ts` preview headers) and Vercel config (`vercel.json`), plus `nosniff` and `no-referrer`. Candidate policy: `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`. Confirm every directive against the built page and revise only when a real asset requires it. Do not use `unsafe-inline` or `unsafe-eval` for scripts. Add a reachable local test resource, attempt to load it from a disallowed origin through browser automation without bypassing CSP, and capture the named CSP violation; a 404 is not a pass. Verify normal controls and AI display in the same run.

The current project has no session cookie, login or private server-side game record. Document same-origin and CSRF non-applicability after confirming runtime behavior. A cross-origin POST may still create AI cost, so test an untrusted origin's request outcome and do not treat CORS as admission control. Do not claim an in-memory limiter is a public multi-instance quota. If public live-provider mode remains reachable on Vercel, document and resolve its distributed abuse-control decision before claiming production-grade cost protection; this local assignment can be completed with fake mode and explicit deployment limitations.

## Phase 0: Research

[research.md](research.md) records actual existing boundaries, decisions, unresolved exposure checks and primary references from the assignment. Research is complete enough for a planning design; implementation must verify the conditional facts and baseline gaps before changing code.

## Phase 1: Design and contracts

- [Data model](data-model.md): trust labels, run lifecycle, admission lease and event shape.
- [Next Drill security contract](contracts/next-drill-security.md): exact request/decision/tool/final/error behavior and T00–T17 applicability.
- [Quickstart](quickstart.md): reproducible checkpoint and planned security verification, with `NOT RUN` clearly separated from observed baseline.
- [Tasks](tasks.md): dependency-ordered, test-first work and evidence gates.

### Traceability strategy

In `docs/EVIDENCE_W08.md`, each important row will link **risk → I/FR rule → enforcement file → test ID → observed counters/result**. The T00–T17 expected behaviors are declared in the contract before implementation. Select three comparable pre/post probes after measuring the baseline: likely concurrent admission (T13), production CSP (T16) and provider-size/deadline handling (T06/T12). If a candidate is already safe, retain a regression proof and select another observed gap. Never insert a flaw solely to show improvement.

## Project structure

```text
specs/005-secure-the-arcade/  spec, plan, research, data-model, contracts, quickstart, tasks, checklist
server/index.ts               body gate, statuses and cross-request admission
server/agent/                run budgets, tool/result validation, structured events
server/providers/            bounded provider transport and fixed configuration
server/rate-limit.ts          local trustworthy admission scope
src/agent/, src/main.ts       response contract and safe browser rendering
vite.config.ts, vercel.json   production-serving security headers
tests/server/, tests/         fake HTTP/agent, boundary and browser scenarios
docs/EVIDENCE_W08.md         observed final evidence after implementation
```

## Pair workflow and gates

The concrete Milica/Nemanja file split and authorization history are in [handoff-milica-nemanja.md](handoff-milica-nemanja.md). Both technical blocks were separately authorized and implemented with Codex assistance; joint document/code review is user-reported. The user subsequently authorized correction of all independently actionable audit findings. Both W08 document approvals were recorded on 2026-10-27. The pair-confirmed protection/test directions, role swap, three outcomes and cross-explanations are recorded in `docs/EVIDENCE_W08.md`, with Codex-operated traces labelled separately. [The demo guide](demo-guide.md) remains a repeatable presentation aid.

1. The planned sequence is specification, plan, tasks, tests, implementation and evidence. Technical blocks were separately approved before their implementation; the full document approval record was completed on 2026-10-27. Record actual names/roles only when confirmed. Suggested rotation: one person drives API/agent controls while the other challenges with negative tests; swap for browser/headers/evidence. Each contributes a protection and a negative test.
2. Confirm baseline and lock expected outcomes for T00–T17. Add tests that fail for observed missing controls, then implement the smallest appropriate fix. Preserve positive tests for every main boundary.
3. Run the full fake suite, local production browser checks, audit and secret-sentinel check. Reconcile docs against actual output and open risks. Prepare the eight-minute demo and individual explanations.
4. Commit only after code, tests and evidence are accurate. The assignment's submission mail is a separate user action; this plan authorizes no mail or deployment.

### Follow-up audit corrections

- Make provider timeout terminal, so a retry cannot overlap an abort-ignoring operation inside one lease. Retry settled transient failures within the unchanged total attempt budget. Combine two HTTP runs, timeouts, active-provider counts, denial and recovery in one regression.
- Supply the same synthetic server credential to the environment-backed adapter test and production build. Stub transport, force fake mode, generate source maps, positively check the scanner, then scan every client artifact.
- Check Origin scheme as well as host/port through trusted listener/ingress configuration; do not trust forwarded protocol headers. Local HTTP and simulated HTTPS ingress each need accepted and denied cases.
- Replace mismatched event examples with a genuinely linked request trace, reconcile historical/current results and prepare personal review/demo steps. Do not close human gates using AI-generated assertions.
- GitHub Actions runs on push, pull request and manual dispatch with Node 24, a locked dependency installation, read-only repository permissions and bounded job timeouts. The first job now runs full fake `verify`, including the actual API/proxy/browser integration; the second runs the W08 suite, browser CSP/XSS checks and controlled build-secret proof.
- The 2026-10-28 follow-up closes HTTP error response bodies before retry. A stalled cancellation stays inside the provider attempt and admission lease; a failed cancellation preserves the safe HTTP error classification and disables retry. Regression tests cover 429/503, retry ordering, cancellation failure, retained capacity and later recovery.
- `npm run evidence:w08` produces three measured synthetic HTTP traces for demo preparation. The evidence distinguishes machine output from the pair's own explanation and role rotation.

## Complexity and limits

No new production dependency or architecture service is currently justified. The optional extension is one seeded property-based input-validation test after mandatory coverage. The local one-process quota, browser-controlled score authenticity and any public Vercel multi-instance deployment exposure must be stated precisely in final evidence; none is covered by a claim of perfect security.
