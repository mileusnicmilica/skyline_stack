# W08 Reproduction Guide

## Baseline already observed (2026-10-26)

Checkout at planning start: `fe4029c67e1d3f1f1bd9046227e13983b8f9f32f` on `main`. Preserve the unrelated untracked file under `responses/`. Windows PowerShell, Node `v24.20.0`, installed dependencies already present. These rows describe the starting commit only; see `docs/EVIDENCE_W08.md` for Milica's measured work and open gates.

| Command | Actual baseline result |
|---|---|
| `npm.cmd run typecheck` | PASS |
| `npm.cmd test` | PASS, 25 files / 161 tests |
| `npm.cmd run build` | PASS, 17 modules transformed |
| `npm.cmd run evidence:w05` | Initial sandbox attempt failed before script start with `uv_os_get_passwd/ENOMEM`; rerun in normal local process PASS |

The W05 success fixture uses `goal=choose_next_drill`, score 1, starting width 100 and two late drops (one terminal miss). Observed fake result: 2 model steps, 2 provider attempts, 1 `evaluate_drill`, `release_earlier`, `goal_completed`; unknown-tool fixture executed 0 tools. These results do not establish W08 test coverage.

## Current integrated verification and pair follow-up

Run the fake-forced integrated command `npm.cmd run test:security:w08` for two TypeScript checks, 9 W08 server files, production build, Edge T04/T05/T15/T16, secret scan and a controlled built-artifact sentinel scan including source maps. Read current counts from `docs/EVIDENCE_W08.md` and the command output. `npm.cmd run test:security:w08:milica` remains available for her focused block. Edge/Chromium must be installed locally. Use the recorded baseline/current commands in `docs/EVIDENCE_W08.md` for the identical-fixture comparisons. No real API key is required.

1. Set fake mode explicitly before any full-stack check so a local `.env` cannot select the live provider:

   ```powershell
   $env:AI_COACH_PROVIDER = 'fake'
   npm.cmd run typecheck
   npm.cmd run test:security:w08
   npm.cmd run verify
   npm.cmd run check:secrets
   ```

   `test:security:w08` exists and forces fake mode. Actual exit codes and counts are in `docs/EVIDENCE_W08.md`.

2. Run direct HTTP tests against the local W05 handler. Use synthetic valid and invalid runs from the contract. Measure provider attempts, tool executions, active underlying work, response statuses and state before/after. Test valid boundary and rejected boundary separately.

3. Build, then serve the built frontend through the local preview path with actual security headers and the fake API. Inspect response headers. Run Edge/Chromium CDP checks with controlled W05 and W04 Coach responses for T04/T05. For T16, host a known reachable test script on another local origin, attempt to load it with CSP enforcement enabled, and record the browser's named CSP violation plus no execution. Run game controls and W05 display in the same browser session.

4. Load `W08_SERVER_SECRET_DO_NOT_EXPOSE` into a synthetic server-only fixture; assert the server actually read it. Search built client artifacts and maps if any, HTTP responses, model contexts and captured operational events for the **value**, not only the env-variable name. Include adapter-error and unexpected-tool-field cases. Never use a real key.

5. Run `npm.cmd audit --json` against the lockfile when network is available. Classify every relevant finding by package/version/advisory, runtime or development use, exposure conditions and decision; rerun regression checks if a dependency changes. If the audit cannot run, record the exact error and unresolved uncertainty.

6. Complete [the declared T00–T17 matrix](contracts/next-drill-security.md#predeclared-scenario-matrix). Record three genuine before/after comparisons using the same fixtures and expectations. Mark every unperformed row `NOT RUN`, not PASS. Document the one-process admission limit and any public multi-instance exposure.

7. Both pair members follow [the precise review/demo guide](demo-guide.md), record their actual changes, negative tests and explanations, exchange reviewer/driver roles and return the factual confirmation template. T001 records their document approvals and planned roles; keep T030/T032 open until the personal work and observed demo details are recorded. Submission mail is a separate user action.

## Completion gate

`docs/EVIDENCE_W08.md` must contain the initial and tested final-code checkpoint commits, a current architecture diagram, per-field data inventory, six assessed risks and three priorities, I1–I8 mapping, T00–T17 fixtures/expected/actual results and test locations, three observed pre/post probes, build/browser/audit/sentinel findings, a redacted security event, residual risk plus next test, and factual pair/AI contributions with verification of accepted AI suggestions. The later evidence commit ID belongs in the submission message, since a commit cannot contain its own hash. No claim of perfect or production-wide protection follows from local fake tests.
