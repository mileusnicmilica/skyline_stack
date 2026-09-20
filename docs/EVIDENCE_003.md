# Evidence 003 — Skyline Stack

**Status**: Phase A template; Phase B application checks are NOT RUN  
**Date opened**: 2026-09-20  
**Evidence rule**: A command, output, screenshot, PASS/FAIL, diff, problem, or
human contribution appears as actual only after it exists and is verified.

## Initial Intent and Claim

Intent: produce a small original TypeScript/Canvas stacking game through the
specified Spec-Driven flow and leave reproducible evidence for one baseline
failure, one hypothesis, one controlled change, and the same evals afterward.

Current claim: Phase A planning artefacts exist and have been structurally
checked. No claim is made that the application, baseline, runtime, tests, or
visual output exists.

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
project secret. No application dependency install has occurred.

## Baseline Identity

- Planned location: `artifacts/session-003/baseline.zip`
- Planned visual evidence: `artifacts/session-003/baseline.png`
- Archive status: NOT RUN
- Read-only status: NOT RUN
- SHA-256: TBD
- Exclusions: TBD; intended to exclude dependency/build caches and the archive
  destination itself
- Re-extraction verification: NOT RUN

This is a proposed verifiable snapshot method because no local Git repository
was approved or initialized. The location is not evidence that the files exist.

## Locked Build Prompt and Context

- Build prompt: `docs/BUILD_PROMPT_V1.md` v1.0 lock candidate
- Gameplay/scope: `docs/GAME_SPEC.md` v1.0 lock candidate
- Context manifest: `docs/CONTEXT_MANIFEST.md`
- Spec Kit feature directory: `specs/001-skyline-stack-core/`
- Eval expectations: `docs/EVALS.md`
- Human approval to lock/start Phase B: TBD

## Application Commands and Actual Outputs

| Purpose | Command | Baseline result | Post-change result |
| --- | --- | --- | --- |
| Install | TBD from actual package setup; planned `npm.cmd install` | NOT RUN | NOT RUN |
| Typecheck | TBD from actual package.json; planned `npm.cmd run typecheck` | NOT RUN | NOT RUN |
| Test | TBD from actual package.json; planned `npm.cmd test` | NOT RUN | NOT RUN |
| Build | TBD from actual package.json; planned `npm.cmd run build` | NOT RUN | NOT RUN |
| Run | TBD from actual package.json; planned `npm.cmd run dev -- --host 127.0.0.1` | NOT RUN | NOT RUN |

No local URL, package version, exit code, or application output is yet claimed.

## Screenshot or Equivalent Visual Proof

- Baseline proof: NOT RUN
- Post-change proof, if relevant to E4: NOT RUN
- Sensitive-data review: NOT RUN

## Initial Test Status

No project tests exist in Phase A. Initial test status: `NOT RUN`.

## Baseline Eval Table

| ID | Locked expectation source | Actual baseline result | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | `docs/EVALS.md` | NOT RUN | NOT RUN | NOT RUN |
| E2 | `docs/EVALS.md` | NOT RUN | NOT RUN | NOT RUN |
| E3 | `docs/EVALS.md` | NOT RUN | NOT RUN | NOT RUN |
| E4 | Scenario TBD until real repeatable baseline problem | NOT RUN | NOT RUN | NOT RUN |

## Selected Problem and Controlled Change

```text
Tvrdnja: TBD
Signal: NOT RUN
Hipoteza: TBD
Najmanja promena: TBD
Provera: NOT RUN
Rezultat: NOT RUN
Ograničenje: TBD
```

Planned diff: TBD; must be shown before the edit.  
Actual diff: NOT RUN; must be shown after exactly one targeted edit.

## Same Eval Set After Change

| ID | Identical scenario confirmed? | Actual post-change result | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E2 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E3 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E4 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

## Final Result and Known Limitation

- Final result: NOT RUN
- Known limitation supported by evidence: TBD
- Session 003 completion claim: NOT MADE

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

Do not replace any TBD with an inferred name or action. During Phase B record
who actually drove, who observed, what each did, when roles swapped, and the
verified result.

## Reproduction Instructions

Phase A review:

1. Verify `prompts/prompt_v00.md` hash against the value above.
2. Review constitution, spec, plan, tasks, GAME_SPEC, BUILD_PROMPT, manifest,
   EVALS, this template, and AI log.
3. Confirm that `README.md`, `package.json`, `src/`, and `tests/` are absent.
4. Approve or request changes; do not run implementation from this template.

Phase B reproduction: TBD until actual commands, archive hash, extracted path,
browser URL, test output, and E4 steps exist.

## Session 003 Definition of Done Audit

| Requirement | Phase A status | Evidence / blocker |
| --- | --- | --- |
| Original prompt preserved | VERIFIED | matching byte count and SHA-256 above |
| Spec Kit initialized or blocker documented | VERIFIED | CLI/init exit 0; `.git` absent |
| GAME_SPEC has small scope and verifiable DoD | VERIFIED FOR REVIEW | `docs/GAME_SPEC.md` |
| BUILD_PROMPT exists before implementation | VERIFIED FOR REVIEW | `docs/BUILD_PROMPT_V1.md`; implementation NOT RUN |
| CONTEXT_MANIFEST lists included/excluded sources | VERIFIED FOR REVIEW | `docs/CONTEXT_MANIFEST.md` |
| Baseline preserved and not overwritten | NOT RUN | Phase B |
| Real run command and output | NOT RUN | Phase B |
| Initial test status | VERIFIED AS NOT RUN | no project tests exist in Phase A |
| GameConfig type, valid and invalid examples | DOCUMENTED ONLY | implementation NOT RUN |
| Actual runtime validation and fallback | NOT RUN | Phase B |
| At least four eval cases | DOCUMENTED ONLY | E1–E3 locked; E4 scenario TBD |
| Expectations recorded before execution | VERIFIED FOR REVIEW | all results NOT RUN |
| At least one real baseline failure | NOT RUN | E4 TBD |
| Same eval set before and after | NOT RUN | Phase B |
| Exactly one hypothesis | NOT RUN | TBD |
| Exactly one controlled change | NOT RUN | Phase B |
| Actual evidence and reproducible verification | NOT RUN | Phase B |
| Both pair contributions and role swaps | TBD | human data not supplied |
| AI usage log | VERIFIED FOR REVIEW | `docs/AI_USAGE_LOG.md` |
| No secrets in code/docs | VERIFIED FOR PHASE A | obvious private-key/API-token pattern scan returned NONE; repeat in Phase B |
| No multiplayer/backend/database/deployment | VERIFIED FOR PHASE A | no application files exist |
| No Session 004 features | VERIFIED FOR PHASE A | no application files exist |
