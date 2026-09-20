# Evidence 003 — Skyline Stack

**Status**: Phase B technical work complete; pair handoff data incomplete
**Date opened**: 2026-09-20  
**Evidence rule**: A command, output, screenshot, PASS/FAIL, diff, problem, or
human contribution appears as actual only after it exists and is verified.

## Initial Intent and Claim

Intent: produce a small original TypeScript/Canvas stacking game through the
specified Spec-Driven flow and leave reproducible evidence for one baseline
failure, one hypothesis, one controlled change, and the same evals afterward.

Current claim: the Core baseline candidate exists, deterministic tests,
typecheck, build, dev server, and a real Chromium interaction flow have run.
The immutable baseline archive, extracted-baseline rerun, and controlled change
are not yet claimed.

## Scope

In scope: single-player Core loop, Canvas/HUD, score/status, restart, exact
overlap boundary, one structured GameConfig with runtime validation, E1–E4,
baseline preservation, one hypothesis, one change, repeated evals, and pair
handoff.

Out of scope: all items listed in `docs/GAME_SPEC.md#out-of-scope`, including
backend, database, networking, deployment, multiplayer, persistence, extra game
modes, copied assets, and Session 004 features.

## Phase A Setup Evidence

| Command/check | Actual result |
| --- | --- |
| SHA-256 compare: attachment vs `prompts/prompt_v00.md` | Both 23,681 bytes; both `160D43B5BF6B7C17F4612F8A310EDEA0587A4750682F1ABC86A529513D626E3C` |
| `python -m pip install --user specify-cli==1.0.8` | Exit 0; `specify-cli-1.0.8` and dependencies installed; user Scripts path warning reported |
| Explicit `specify.exe version` | Exit 0; CLI 1.0.8, Python 3.11.7, Windows AMD64 |
| `specify init --here --force --non-interactive --integration codex --integration-options="--skills" --script ps --ignore-agent-tools` | Exit 0; project ready; Codex skills and PowerShell infrastructure created |
| Check for `.git` after initialization | `.git ABSENT` |
| Spec Kit sequence | constitution, specify, clarify, plan, tasks completed; implement NOT RUN |

The full pip output is available in the AI session transcript; it contained no
project secret. After Phase A, the human pair created and pushed
`phase-b/skyline-stack-core` to `origin`; the agent did not create or modify the
remote. The ZIP evidence method remains in force because it is the locked
baseline method.

## Baseline Identity

- Location: `artifacts/session-003/baseline.zip`
- Visual evidence: `artifacts/session-003/baseline.png`
- Archive status: CREATED; 158,941 bytes and 67 file entries
- Read-only status: VERIFIED (`IsReadOnly=True`)
- SHA-256: `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`
- Exclusions: `.git/`, `node_modules/`, `dist/`,
  `artifacts/session-003/`, and machine-local `.specify/feature.json`
- Re-extraction verification: PASS; 67 files extracted to a separate temporary
  directory, fresh install added 39 packages with 0 vulnerabilities, E1–E3
  passed 3/3, and E4 reproduced with an independent screenshot

The first archive command produced an invalid 22-byte empty ZIP because Windows
PowerShell 5.1 lacks `Path.GetRelativePath`; that generated file was verified by
exact path and size, removed, and never treated as evidence. The compatible
fail-fast rerun produced the identity above. The current Git remote is not used
as the baseline identity.

## Locked Build Prompt and Context

- Build prompt: `docs/BUILD_PROMPT_V1.md` v1.0 lock candidate
- Gameplay/scope: `docs/GAME_SPEC.md` v1.0 lock candidate
- Context manifest: `docs/CONTEXT_MANIFEST.md`
- Spec Kit feature directory: `specs/001-skyline-stack-core/`
- Eval expectations: `docs/EVALS.md`
- Human approval to lock/start Phase B: supplied in the 2026-09-20 handoff
- Prompt SHA-256: `160D43B5BF6B7C17F4612F8A310EDEA0587A4750682F1ABC86A529513D626E3C`
- Build prompt SHA-256: current CRLF working-tree bytes are
  `CF2D72431A69E4BFC14278C9CAF8534A578A989E1D3107A98603C96563BE3699`;
  LF-normalized content is the handed-off
  `9D306ED3059C8C35D4071323F6633C89DA7505C7EEDE0BD7215DDDCD7AD88066`

## Application Commands and Actual Outputs

| Purpose | Command | Baseline result | Post-change result |
| --- | --- | --- | --- |
| Install | `$env:NODE_OPTIONS='--use-system-ca'; npm.cmd install --save-dev --save-exact vite typescript vitest` | Exit 0; added 39 packages; audited 40; 0 vulnerabilities; pinned TypeScript 7.0.2, Vite 8.3.0, Vitest 5.0.1 | NOT REPEATED; manifest and lockfile unchanged by the targeted CSS change |
| Typecheck | `npm.cmd run typecheck` | Exit 0; `tsc --noEmit` produced no errors | Exit 0; no TypeScript errors |
| Test | `npm.cmd test` | Exit 0; 5 files and 37 tests passed | Exit 0; 5 files and 37 tests passed in 986 ms |
| Build | `npm.cmd run build` | Exit 0; Vite 8.3.0 transformed 11 modules and produced `dist/` in 251 ms | Exit 0; 11 modules transformed; build completed in 536 ms |
| Run | `npm.cmd run dev -- --host 127.0.0.1` | Server remained running; Vite ready in 311 ms at `http://127.0.0.1:5173/` | Same server remained active and served the hot-reloaded CSS for verification |
| Browser smoke | `npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/session-003/baseline.png` / `... post-change.png` | Exit 0 after harness cleanup stabilization; Ready 0 → Playing 1 → Game Over 1 → Ready 0; no JS exceptions; one 404 browser log entry | Exit 0; identical state flow; no JS exceptions; canvas bottom 762.266 <= viewport 1002; same 404 log entry |

The first smoke invocation completed the interaction flow and screenshot but
exited 1 because the evidence helper deleted its temporary Chromium profile
before Chrome released a lock; the same run also reported the 404 log entry.
Only the helper cleanup was stabilized before the recorded rerun. No gameplay
or layout code was changed.

## Screenshot or Equivalent Visual Proof

- Baseline proof: `artifacts/session-003/baseline.png` exists; captured after a
  successful placement with score 1 and Playing status
- Post-change proof: `artifacts/session-003/post-change.png`; score 1, Playing,
  active block, placed overlap, base, controls, and Restart are all visible
- Sensitive-data review: both screenshots inspected; no secret, token, private
  URL, environment value, or private payload is visible
- Baseline visual observation: at the 1280×1002 browser viewport the 480×640
  canvas is styled to 826×1101.328 px (`top=130.266`, `bottom=1231.594`), so
  the lower play area and footer controls are below the initial viewport

## Initial Test Status

The first US1 test run exited 1 with four missing-module suites, as expected
before implementation. The US2 pre-implementation run had 14 passes and two
missing restart-function failures. The US3 pre-implementation run had 16
passes and 21 missing-validator failures. The complete baseline candidate now
passes 37/37 tests in five files.

## Baseline Eval Table

| ID | Locked expectation source | Actual baseline result | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | `docs/EVALS.md` | Extracted archive reproduced movement, overlap trim, score 0→1, and one next moving block | PASS | `npm.cmd test -- tests/evals.test.ts`: 3/3 passed |
| E2 | `docs/EVALS.md` | Exact 8-unit overlap placed at width 8; score +1; remained playing | PASS | Same extracted eval run |
| E3 | `docs/EVALS.md` | Invalid candidate rejected as a whole; fresh defaults, one fixed warning request, playable session | PASS | Same extracted eval run; full suite 37/37 passed |
| E4 | Locked 1280×1002 viewport scenario in `docs/EVALS.md` | Canvas ended at 1231.594 px in a 1002 px viewport; lower game and footer required vertical scrolling | FAIL | `artifacts/session-003/baseline-extracted.png`; extracted browser smoke exit 0 |

## Selected Problem and Controlled Change

```text
Tvrdnja: Na zaključanom desktop viewport-u baseline uvećava canvas iznad visine viewport-a, pa kompletan toranj i footer kontrole nisu zajedno vidljivi bez skrolovanja.
Signal: Dva Chromium smoke prolaza izmerila su canvas 826×1101.328 px, top 130.266, bottom 1231.594, viewportHeight 1002; oba screenshot-a pokazuju odsečen donji deo.
Hipoteza: `.play-area` koristi punu širinu kontejnera, a `canvas { width: 100% }` zato uvećava logičkih 480×640 na 826×1101.328 CSS piksela.
Najmanja promena: U `src/style.css`, u postojeći `.play-area` blok dodati samo `width: min(100%, 30rem);` da širina ne pređe logičkih 480 px.
Provera: Ponoviti identične E1–E4, isti 1280×1002 smoke i proveriti `canvas.bottom <= viewportHeight`.
Rezultat: PASS — identični post-change smoke izmerio je canvas 474×632 px, top 130.266, bottom 762.266, viewportHeight 1002; screenshot prikazuje kompletan play area i footer.
Ograničenje: Plan dokazuje samo default konfiguraciju i zaključani viewport; zaseban 404 browser-log zapis nije cilj ove izmene.
```

Planned diff: one added CSS declaration, `width: min(100%, 30rem);`, inside
the existing `.play-area` rule in `src/style.css`; no other file or concern.
Actual diff: compared directly with the extracted baseline, `src/style.css`
contains the one planned declaration in `.play-area`:

```diff
 .play-area {
+  width: min(100%, 30rem);
   margin: 1.5rem auto;
 }
```

The patch tool also normalized the trailing blank line at EOF; no second code
path or behavior changed. Baseline ZIP remained read-only with unchanged
SHA-256 `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`.

## Same Eval Set After Change

| ID | Identical scenario confirmed? | Actual post-change result | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | YES | Movement, trim, score 0→1, and one matching next block unchanged | PASS | Post-change eval command: 3/3 passed; browser score 1/Playing |
| E2 | YES | Exact 8-unit overlap still succeeds | PASS | Same post-change eval run |
| E3 | YES | Whole-object fallback, fresh defaults, and one fixed warning request unchanged | PASS | Same post-change eval run; full suite 37/37 passed |
| E4 | YES | Canvas bottom changed from 1231.594/1002 to 762.266/1002; complete game and footer visible | PASS | `artifacts/session-003/post-change.png`; identical smoke exit 0 |

## Final Result and Known Limitation

- Final result: Core implementation and the single controlled change pass the
  locked eval set, typecheck, 37-test suite, production build, and Chromium
  smoke flow.
- Known limitation supported by evidence: both baseline and post-change dev
  smoke runs contain one non-fatal 404 resource log entry; there are no
  JavaScript exceptions. The responsive proof covers the locked 1280×1002
  Chrome viewport, not a broad real-device/browser matrix.
- Session 003 completion claim: NOT MADE because names, actual contributions,
  and role-swap records for both human pair members were not supplied.

## Pair Work and Role Swaps

Human names and actual contributions were not supplied. The following are
planned checkpoints, not completed contributions:

| Block / swap point | Driver | Observer | Driver action | Observer check | Actual result |
| --- | --- | --- | --- | --- | --- |
| First specification draft → before corrections | TBD | TBD | TBD | Review scope and acceptance expectations | TBD |
| First technical plan → before task list | TBD | TBD | TBD | Review tool necessity and structure | TBD |
| First baseline run or precise blocker | TBD | TBD | TBD | Review command output and visible state | NOT RUN |
| Eval expectations recorded → before actual results | TBD | TBD | TBD | Confirm expectations precede execution | NOT RUN |
| Targeted change → before repeated eval | TBD | TBD | TBD | Review planned/actual diff and unchanged evals | NOT RUN |

One human action is known from the handoff: the requester created and pushed
the `phase-b/skyline-stack-core` branch. That does not identify both pair
members, establish driver/observer roles, or prove any role swap, so the table
remains `TBD` rather than inferring contributions.

Do not replace any TBD with an inferred name or action. During Phase B record
who actually drove, who observed, what each did, when roles swapped, and the
verified result.

## Reproduction Instructions

1. Verify `artifacts/session-003/baseline.zip` is read-only and has SHA-256
   `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`.
2. Extract it to a new directory; run
   `$env:NODE_OPTIONS='--use-system-ca'; npm.cmd install` if the local Node
   trust setup requires the Windows system CA.
3. Run `npm.cmd test -- tests/evals.test.ts`, `npm.cmd run typecheck`,
   `npm.cmd test`, and `npm.cmd run build`.
4. Start `npm.cmd run dev -- --host 127.0.0.1 --port 5174`, then run
   `npm.cmd run smoke -- http://127.0.0.1:5174/ <screenshot-path>`.
5. Confirm the extracted E1–E3 run is 3/3 PASS and E4 reproduces
   `canvas.bottom=1231.594 > viewportHeight=1002`.
6. In the working copy, repeat the same eval and smoke commands and confirm E4
   reports `canvas.bottom=762.266 <= viewportHeight=1002`.

## Session 003 Definition of Done Audit

| Requirement | Final status | Evidence / blocker |
| --- | --- | --- |
| Original prompt preserved | VERIFIED | matching byte count and SHA-256 above |
| Spec Kit initialized or blocker documented | VERIFIED | Phase A CLI/init evidence; Git was added later by the human pair |
| GAME_SPEC has small scope and verifiable DoD | VERIFIED | `docs/GAME_SPEC.md`; Core audit below |
| BUILD_PROMPT exists before implementation | VERIFIED | current/normalized hashes above; Git history predates app files |
| CONTEXT_MANIFEST lists included/excluded sources | VERIFIED | retained as the locked Phase A snapshot |
| Baseline preserved and not overwritten | VERIFIED | read-only ZIP, stable hash, independent extraction |
| Real run command and output | VERIFIED | Vite ready at the recorded URL; browser state flow completed |
| Initial test status | VERIFIED | three real red-before-green TDD signals and final 37/37 baseline status |
| GameConfig type, valid and invalid examples | VERIFIED | contract docs, `src/game/config.ts`, and validator matrix |
| Actual runtime validation and fallback | VERIFIED | 20 config tests plus E3 |
| At least four eval cases | VERIFIED | E1–E4 in `docs/EVALS.md` |
| Expectations recorded before execution | VERIFIED | E1–E3 locked in Phase A; E4 locked before the CSS edit |
| At least one real baseline failure | VERIFIED | extracted E4 FAIL with metrics and screenshot |
| Same eval set before and after | VERIFIED | identical E1–E4 inputs and expectations recorded above |
| Exactly one hypothesis | VERIFIED | one CSS-width hypothesis in Selected Problem |
| Exactly one controlled change | VERIFIED | baseline-to-working `src/` comparison shows one CSS declaration |
| Change claim, signal, verification, result, limitation | VERIFIED | Selected Problem and Final Result sections |
| Actual evidence and reproducible verification | VERIFIED | commands, outputs, screenshots, ZIP identity, and six reproduction steps |
| Both pair contributions documented | INCOMPLETE | names and actual activities were not supplied |
| Role swaps documented | INCOMPLETE | actual swap points were not supplied |
| AI usage log | VERIFIED | baseline, targeted change, and diff audit recorded |
| No secrets in code/docs | VERIFIED | Phase B private-key/API-key/secret/token assignment scan and `.env*` scan returned no matches |
| No multiplayer/backend/database/deployment | VERIFIED | source/tree and diff audit show only bounded static Core |
| No Session 004 features | VERIFIED | no hint/tool-calling or adjacent features added |

## Core Definition of Done Audit

| GAME_SPEC requirement | Status | Evidence |
| --- | --- | --- |
| Browser application starts | PASS | recorded Vite command and real Chromium load |
| Canvas, base, active block, score, status, controls, Restart render | PASS | `post-change.png` |
| Horizontal bounded movement | PASS | engine tests and E1 |
| Space, click, tap accept at most one drop | PASS | input tests; browser Space flow |
| Falling is vertical only | PASS | `advanceSession` changes only `y` in falling branch; falling input test |
| Partial overlap trims excess | PASS | engine placement test and E1 |
| Success increments score exactly once | PASS | engine placement test, E1, browser score 0→1 |
| Exact `minOverlap` succeeds | PASS | geometry/engine E2 |
| Below-minimum overlap reaches Game Over without score increment | PASS | engine miss test and browser Game Over flow |
| Post-game drop cannot change score/tower | PASS | input and frozen-state tests |
| R and Restart restore initial state | PASS | engine/input tests; browser R flow |
| Exact GameConfig shape and examples exist | PASS | config source and contract docs |
| Runtime validation covers all required rules | PASS | 20-test validator matrix |
| Invalid input uses complete defaults and one safe warning | PASS | config tests and E3 |
| Four eval expectations locked before their changes | PASS | `docs/EVALS.md` chronology |
| Complete baseline preserved | PASS | read-only ZIP and SHA-256 |
| Real repeatable baseline failure | PASS | extracted E4 FAIL |
| Exactly one hypothesis and controlled change | PASS | one recorded hypothesis; one CSS declaration |
| Identical eval set before/after | PASS | E1–E4 tables |
| Evidence contains only actual results | PASS | NOT RUN/TBD retained for missing human data |
