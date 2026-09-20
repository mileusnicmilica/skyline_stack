# Quickstart Validation Guide: Skyline Stack Core

This guide describes the commands and checks planned for Phase B. None of these
project commands exists or has been run during Phase A; their current status is
`NOT RUN`.

## Prerequisites

- Node.js 24.20 is available in the current environment.
- npm is invoked as `npm.cmd` because the current PowerShell execution policy
  blocks the `npm.ps1` shim.
- Phase A documentation has passed human review.

## Planned setup and verification

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

Expected roles:

- `install`: restore versions recorded in the project lockfile.
- `typecheck`: run TypeScript static checking without emitting files.
- `test`: run deterministic configuration and game-rule tests once.
- `build`: create a production bundle and fail on bundling errors.
- `dev`: start the local browser application for runtime and visual checks.

Actual command text, exit codes, relevant output, selected package versions, and
the local URL will be copied to `docs/EVIDENCE_003.md` only after execution.

## Locked eval expectations before execution

| ID | Scenario | Expected outcome |
| --- | --- | --- |
| E1 | Valid config, movement, clear successful overlap | no runtime error; score 0 to 1; trimmed placement; one new active block |
| E2 | `overlap === minOverlap` | success; placed width equals minimum; score +1; not Game Over |
| E3 | Missing/invalid configuration field | whole candidate rejected; defaults; one safe warning; no crash |
| E4 | First real repeatable baseline problem | TBD until observed; remains NOT RUN in Phase A |

## Browser smoke

After the dev server reports its actual local URL:

1. Open the page in an available real browser.
2. Confirm canvas, base, one moving block, score 0, Ready, controls, and Restart.
3. Perform a successful Space drop and confirm score 1 and Playing.
4. Cause a miss and confirm Game Over plus frozen score.
5. Restart and compare all observable initial values.
6. Save the screenshot or equivalent visual proof at the evidence location
   selected in Phase B; do not claim it before the file exists.

## Baseline preservation before any targeted fix

Create a complete ZIP snapshot excluding dependency/build caches, store it under
`artifacts/session-003/`, mark it read-only, and record its SHA-256 in evidence.
Extract it to a separate temporary directory to reproduce E1–E4. The exact
archive command and output will be recorded only when actually executed.

## Controlled change

Only after the archive, hash, browser evidence, test status, and baseline eval
table exist:

1. Select one repeatable baseline failure.
2. Record claim, signal, hypothesis, planned smallest diff, and limitation.
3. Show the planned diff.
4. Apply exactly one targeted change.
5. Show the actual diff.
6. Run the identical E1–E4 set and record actual results.

