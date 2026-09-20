Pre implementacije:
1. Sažmi razumevanje zadatka.
2. Navedi plan u nekoliko koraka.
3. Navedi nejasnoće ili pretpostavke.
4. Ne proširuj scope bez eksplicitnog razloga i odobrenja.

# BUILD PROMPT V1 — Skyline Stack Baseline

**Version**: 1.0 — Phase A lock candidate  
**Status**: Ready for human review; do not execute until explicitly approved  
**Created**: 2026-09-20

## Role

You are the coding agent responsible for producing the smallest verifiable
Skyline Stack Core baseline. Follow the locked specification and plan; do not
redesign the feature, change eval expectations, or add adjacent features.

Before every major step, state:

1. what files or state you expect to change;
2. the exact signal that will verify success;
3. whether the step changes application code, evidence only, or neither.

Do not use parallel agents for Core work.

## Goal and Expected Result

Create a framework-free TypeScript browser game with one Canvas, the specified
stack/drop loop, complete restart, runtime GameConfig validation, deterministic
tests, and a real first-pass baseline. Then preserve that baseline, run the
locked eval set, derive E4 from the first real repeatable baseline problem, and
stop before any fix until the claim, signal, one hypothesis, and planned
smallest diff are written.

The expected baseline result is a runnable and testable first implementation,
not a claim of perfection. Never introduce or report a defect that was not
actually reproduced.

## Authoritative Context

Read these files before changing anything:

1. `prompts/prompt_v00.md` — immutable original project task;
2. `docs/GAME_SPEC.md` — authority for gameplay, UX, scope, and Definition of Done;
3. `docs/BUILD_PROMPT_V1.md` — authority for allowed implementation work;
4. `.specify/memory/constitution.md` — governance and evidence rules;
5. `specs/001-skyline-stack-core/spec.md` — Spec Kit feature behavior;
6. `specs/001-skyline-stack-core/plan.md` — approved technical structure;
7. `specs/001-skyline-stack-core/research.md`;
8. `specs/001-skyline-stack-core/data-model.md`;
9. `specs/001-skyline-stack-core/contracts/game-config.md`;
10. `specs/001-skyline-stack-core/contracts/gameplay.md`;
11. `specs/001-skyline-stack-core/quickstart.md`;
12. `specs/001-skyline-stack-core/tasks.md`;
13. `docs/CONTEXT_MANIFEST.md`;
14. `docs/EVALS.md`;
15. `docs/EVIDENCE_003.md`;
16. `docs/AI_USAGE_LOG.md`.

When these differ, apply the priority rules in CONTEXT_MANIFEST. Stop for a
human decision if a conflict would change scope.

## Technical Context

- No starter, package manifest, source, tests, commands, or baseline existed at
  project intake.
- Use plain TypeScript, HTML, CSS, and Canvas API.
- Use Vite only for the local dev/build pipeline.
- Use Vitest for deterministic pure-rule and eval tests.
- Use `tsc --noEmit` as a separate typecheck because Vite transpilation is not
  a typecheck.
- Use `npm.cmd` in this Windows PowerShell environment; do not change execution
  policy merely to run `npm.ps1`.
- No runtime framework, backend, database, network request, external asset,
  deployment setup, game engine, or physics library.
- Keep configuration, geometry, state transitions, input gating, rendering, and
  browser wiring in the paths approved by `plan.md`.

Every new tool must have an immediate documented need. Package versions and the
lockfile must reflect the actual Phase B install; do not invent versions.

## Gameplay Rules

1. Exactly one active block object exists.
2. A moving block changes only horizontal position, stays in bounds, and bounces.
3. Drop is accepted only for playing + moving.
4. Held-Space repeat and any second request for the same block are ignored.
5. A falling block changes only vertical position.
6. Overlap is the intersection of active and supporting horizontal intervals.
7. `overlap >= minOverlap` succeeds and places only the intersection.
8. Success increments score by exactly one and spawns one block with that width.
9. `overlap < minOverlap` enters gameOver without increasing score.
10. Game Over freezes gameplay and preserves the result.
11. R or Restart after Game Over restores every initial state and input value.
12. A simple one-height viewport rebase keeps the active block and support visible.

## Structured Contract and Runtime Validation

```ts
type GameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  startingBlockWidth: number;
  blockHeight: number;
  moveSpeed: number;
  fallSpeed: number;
  minOverlap: number;
};
```

The validator must accept `unknown` and check:

- all seven own fields are present;
- every value is a number and `Number.isFinite` is true;
- dimensions and speeds are positive;
- `startingBlockWidth <= canvasWidth`;
- `blockHeight < canvasHeight`;
- `minOverlap > 0`;
- `minOverlap <= startingBlockWidth`.

Any invalid condition must discard the whole candidate, return a fresh known
default, request exactly one visible fixed warning, and not throw. The warning
must not include raw input, secrets, private values, or stack traces.

Use the valid, invalid, default, and callable examples in
`specs/001-skyline-stack-core/contracts/game-config.md`.

## Allowed Change Areas for the Baseline

- `src/`;
- `tests/`;
- `index.html` and minimal CSS entry files;
- `package.json`, generated lockfile, `tsconfig.json`, and a minimal technical
  config only when required by the approved setup;
- `README.md`, but only with commands that were actually confirmed;
- `docs/EVIDENCE_003.md`, `docs/EVALS.md`, and `docs/AI_USAGE_LOG.md`, but
  only with actual commands, outputs, results, decisions, and human data;
- `artifacts/session-003/` for actual screenshots, baseline ZIP, hash, and
  tightly scoped evidence files.

## Forbidden Change Areas and Actions

Do not modify:

- `prompts/prompt_v00.md`;
- `docs/GAME_SPEC.md`;
- `docs/BUILD_PROMPT_V1.md`;
- `docs/CONTEXT_MANIFEST.md` during the controlled change;
- Spec Kit specification, plan, tasks, contracts, or constitution during the
  baseline/fix cycle;
- E1–E3 expectations after seeing results;
- E4 scenario after it has been defined from a real baseline defect;
- GameConfig schema or gameplay rules during the controlled change.

Do not:

- create a Git remote or silently initialize Git;
- publish, deploy, or add hosting;
- add multiplayer, backend, database, accounts, leaderboard, networking,
  persistence, levels, enemies, lives, power-ups, audio, hints, tool calling,
  Session 004 features, copied identity, or downloaded assets;
- change more than one implementation concern during the controlled fix;
- record PASS, output, screenshot, diff, contribution, or baseline problem that
  was not actually observed.

## Required Work Order

1. Re-check that Phase A was explicitly approved.
2. Re-read the authoritative context and report any conflict.
3. Implement `tasks.md` Phase 1–5 sequentially, with tests before their code.
4. Run actual install, typecheck, test, build, dev, and browser checks.
5. Record real output and failures without correcting them first.
6. Save `artifacts/session-003/baseline.zip`, exclude caches/build output, set
   it read-only, compute SHA-256, and record it.
7. Run locked E1–E3, inspect for the first real repeatable problem, define E4,
   then reproduce E1–E4 on an extracted baseline copy.
8. Show baseline results and stop if E4 does not genuinely fail.
9. Write claim, signal, exactly one hypothesis, limitation, exact one-file
   target, and planned small diff in evidence.
10. Show the planned diff before editing.
11. Make exactly one targeted implementation change.
12. Show the actual diff.
13. Run the identical E1–E4 set plus typecheck, tests, build, and browser smoke.
14. Record only actual results, known limitation, pair contributions, and role swaps.

## Required Checks

Execute only commands that exist in the actual generated `package.json`.
Expected command roles are:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

These are planned commands, not successful results. For every execution, record
the exact command, exit code, relevant non-sensitive output, date, and whether
it was run on baseline or post-change code.

Also verify:

- prompt source and archived copy still have matching SHA-256;
- no Git remote exists;
- baseline archive hash remains unchanged after the fix;
- no secret-like file or value was added;
- the same eval IDs and expectations appear before and after the change.

## Baseline Problem Requirement

Report the first visible or test-detected repeatable baseline problem with:

```text
Tvrdnja:
Signal:
Hipoteza:
Najmanja promena:
Provera:
Rezultat:
Ograničenje:
```

E4 must begin as TBD and may be defined only after a real observation. If no
repeatable baseline problem is found, do not invent one and do not make a
controlled change; report a precise blocker and the checks already performed.

## Definition of Done

Use the complete checklist in `docs/GAME_SPEC.md` plus these evidence gates:

- baseline archive exists, is read-only, has a recorded hash, and can reproduce
  the recorded baseline results;
- E1–E4 have actual baseline results and at least one genuine baseline FAIL;
- exactly one hypothesis and one implementation change exist;
- planned and actual diffs are recorded;
- identical E1–E4 have actual post-change results;
- actual commands, outputs, visual proof, limitation, and reproduction steps
  are present;
- actual contributions of both pair members and role-swap points are present;
- no unsupported Definition of Done item is marked complete.

## Required Final Response from the Coding Agent

Return:

1. concise summary of what changed;
2. full list of changed files;
3. exact commands executed with exit codes and relevant results;
4. baseline archive location and SHA-256;
5. baseline E1–E4 results and the real failing eval;
6. claim, signal, one hypothesis, and planned smallest diff;
7. actual one-change diff summary;
8. post-change E1–E4 results;
9. known limitation;
10. actual pair contribution and role-swap record;
11. status of every Definition of Done item.

Never call Session 003 complete while any mandatory item lacks evidence.

