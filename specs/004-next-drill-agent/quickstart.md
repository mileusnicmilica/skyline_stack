# Quickstart Validation: Next Drill Agent

## Current Phase A baseline

From repository root in PowerShell, force fake mode because the ignored local `.env` may select Gemini:

```powershell
$env:AI_COACH_PROVIDER='fake'
npm.cmd run verify
```

Observed on 2026-10-05 in normal local process context: 17/17 test files and 121/121 tests passed, browser/server typechecks, build, secret boundary, preview `/api` proxy, and Edge browser smoke passed. A restricted sandbox may fail when `tsx` asks Windows for OS user information; this is an environment failure, not a product assertion.

## After W05 implementation

1. Run the new fake agent tests covering [AGENT_EVALS.md](AGENT_EVALS.md).
2. Run the full `verify` command above with explicit fake mode; it must include the W05 HTTP and browser paths.
3. Start the full local app in fake mode: `$env:AI_COACH_PROVIDER='fake'; npm.cmd run dev:full`.
4. Complete a game, select **Predloži vežbu**, inspect the supported drill and evidence, then Restart and check the state clears.
5. Exercise the unknown-tool fake case and confirm `toolCallCount === 0` from the test assertion and sanitized run trace.
6. Run `npm.cmd run evidence:w05` to reproduce the fake success, rejected-tool, and provider-failure step/tool traces without a Gemini call.
7. Review secret scan and staged diff. The one intentional live run for this cycle has already been attempted and recorded; a future live retry requires a separately agreed review cycle.

Observed status on 2026-10-05 after convergence: full verify passed with 24 files / 158 tests, preview proxy, and Edge smoke; a subsequently added HTTP regression test brought the latest passing suite to 24 files / 159 tests. One earlier bounded live attempt returned safe HTTP 503 before a tool call; the joint demo and both members' actual roles remain unverified. See [W05 evidence](../../docs/EVIDENCE_W05.md).
