Pre implementacije ili održavanja:
1. Sažmi razumevanje V2 zadatka.
2. Navedi plan i datoteke koje će se menjati.
3. Navedi pretpostavke ili konflikt sa zaključanim Session 003 dokazima.
4. Ne menjaj scope, gameplay pravila ili eval očekivanja bez eksplicitnog odobrenja.

# BUILD PROMPT V2 — Skyline Stack Crane Tower

**Version**: 2.0
**Status**: Reproducible build/maintenance prompt; created after implementation to close the V2 documentation gap
**Created**: 2026-09-21

## Integrity Notice

This prompt documents the approved V2 result and how to reproduce or maintain it. It was not present before the initial V2 implementation and MUST NOT be described as a pre-implementation lock. It does not authorize retroactive edits to Session 003 evidence.

## Role

You are the coding agent responsible for building or maintaining Skyline Stack V2 as a small, deterministic, framework-free crane-and-tower browser game. Follow the V2 game specification and Spec Kit package. Preserve the original Skyline Stack identity and the existing seven-field configuration fallback.

**City Bloxx is gameplay inspiration only.** Do not copy its name, branding, assets, characters, audio, source code, screenshots, or exact interface.

## Authoritative Context

Read these files before changing V2 behavior:

1. `docs/GAME_SPEC_V2.md` — authoritative V2 gameplay, visual, lives, and scope contract;
2. `docs/BUILD_PROMPT_V2.md` — implementation and verification constraints;
3. `specs/002-crane-tower-gameplay/spec.md` — approved user stories and requirements;
4. `specs/002-crane-tower-gameplay/plan.md` — technical structure;
5. `specs/002-crane-tower-gameplay/research.md` — recorded decisions and alternatives;
6. `specs/002-crane-tower-gameplay/data-model.md` — state fields and invariants;
7. `specs/002-crane-tower-gameplay/contracts/gameplay.md`;
8. `specs/002-crane-tower-gameplay/contracts/visual-presentation.md`;
9. `specs/002-crane-tower-gameplay/quickstart.md`;
10. `specs/002-crane-tower-gameplay/tasks.md`;
11. `docs/EVALS_V2.md` — V2 eval expectations and actual evidence;
12. `docs/CONTEXT_MANIFEST.md` — current project map and document lifecycle;
13. `.specify/memory/constitution.md` — project governance.

The following are historical Session 003 authorities and MUST remain unchanged while implementing V2:

- `docs/GAME_SPEC.md`;
- `docs/BUILD_PROMPT_V1.md`;
- `docs/EVALS.md`;
- `docs/EVIDENCE_003.md`;
- `artifacts/session-003/`.

When a V2 document conflicts with Session 003 gameplay, apply the V2 rule only to V2 application behavior and preserve the historical document/evidence unchanged. Stop for a human decision if a conflict would require rewriting historical evidence.

## Goal

Deliver one focused browser game in which:

- a detailed building floor hangs from a visible crane cable and sways;
- Space, click, or tap releases it once;
- the released floor falls vertically without horizontal drift;
- only accepted horizontal overlap joins the tower;
- unsupported facade breaks into deterministic falling masonry;
- the first below-minimum landing enters Game Over;
- a camera offset keeps the active construction zone visible;
- restart restores every V2 state field;
- the scene resembles a lively crane-built city through original procedural art.

Do not add named modes, lives, or a multiple-miss allowance.

## Technical Context

- TypeScript 7.0.2.
- Vite 8.3.0 for local dev server and production build.
- Vitest 5.0.1 for deterministic tests.
- HTML, CSS, browser APIs, and one Canvas for runtime.
- No runtime dependency, UI framework, backend, database, external asset, game engine, or physics library.
- Run `tsc --noEmit` separately because the build transform is not the typecheck gate.
- Use `npm.cmd` in PowerShell.

## Required Architecture

Keep responsibilities separated:

- `src/game/config.ts` — seven-field contract, validation, defaults, and warning;
- `src/game/model.ts` — blocks, session, detached sections, and masonry types;
- `src/game/geometry.ts` — interval overlap and detached sections;
- `src/game/crane.ts` — sine phase, hanging position, direction, and cable endpoints;
- `src/game/debris.ts` — deterministic piece generation and advancement;
- `src/game/camera.ts` — non-negative follow target, easing, and world-to-screen conversion;
- `src/game/engine.ts` — fresh session, animation, landing, Game Over, and restart;
- `src/game/input.ts` — one-shot release and restart gates;
- `src/game/render.ts` — procedural city, crane, building, debris, and overlay drawing;
- `src/main.ts` — DOM lookup, validated configuration selection, input wiring, frame loop, and HUD;
- `tests/` — deterministic unit, regression, eval, and browser smoke checks.

Pure game rules MUST NOT depend on DOM state, wall-clock reads, network access, or unseeded randomness.

## Gameplay Invariants

1. Exactly one active floor exists.
2. `moving` means attached to the crane and driven by deterministic sine phase.
3. One eligible input changes the floor to `falling`; repeated or ineligible input is ignored.
4. Falling changes only vertical position.
5. Landing uses horizontal interval intersection with the latest support.
6. `overlap >= minOverlap` places only the overlap, increments score once, and spawns one equal-width floor.
7. Perfect overlap creates no debris.
8. For an imperfect success, placed width plus detached widths equals released width within `0.001`.
9. Detached sections become deterministic pieces biased toward their source side.
10. `overlap < minOverlap` converts the complete floor to debris and enters Game Over without changing score.
11. No `lives`, `remainingLives`, or equivalent multiple-miss state may be introduced.
12. Game Over ignores new drop input while existing debris may continue visual motion.
13. Restart returns a session deeply equal to `createGameSession(config)`.
14. Camera translation changes rendering only, never collision coordinates.

## Visual Requirements

Render every required element procedurally:

- bright sky gradient, sun glow, and clouds;
- two or more skyline layers;
- crane boom/pivot, cable, hook, and connector;
- modular floors with facade color, light/shade, top/bottom bands, and window grids;
- deterministic window-light variation and subtle floor tilt;
- facade-colored rotating masonry, darker broken edges, and dust feedback;
- readable Floors/Status HUD and Game Over overlay;
- responsive portrait presentation at 320 CSS pixels and above.

Do not use `Example.jpeg` at runtime. It is local reference material only.

## Configuration Contract

Do not add or remove public fields:

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

The V2 default is `480 × 640`, starting width `200`, block height `40`, movement speed `180`, fall speed `520`, and minimum overlap `8`.

Runtime validation must reject the entire candidate for a missing/inherited field, wrong type, non-finite value, non-positive value, or invalid dimension relationship. Invalid input selects a fresh default copy and exactly one fixed safe warning.

## V2 Eval Contract

Implement and preserve `tests/v2-evals.test.ts` with these locked meanings:

- **V2-E1 — Crane sway**: attached `x` and phase advance; hanging `y` does not.
- **V2-E2 — Drop**: one release enters falling; repeat input is ignored; `x` is fixed while `y` advances.
- **V2-E3 — Cut/crumble**: width is conserved and debris appears only on the unsupported side.
- **V2-E4 — No-lives loss rule**: one full miss enters Game Over, creates full-floor debris, preserves score, and exposes no lives state.
- **V2-E5 — Camera/restart**: eight floors remain playable and restart clears all V2 state.
- **V2-E6 — Browser presentation**: actual browser flow verifies Ready, success, a bounded edge partial landing, a later full miss, Game Over, restart, zero runtime/log errors, and a visual screenshot.

Do not weaken these expectations after observing a failure. Fix implementation instead, unless a human explicitly approves a requirements change.

## Required Work Order

1. Verify the active branch and dirty worktree; preserve unrelated user changes.
2. Read all authoritative V2 files and the constitution.
3. Confirm Session 003 artifacts still exist and are not targeted.
4. Write or update deterministic tests before corresponding rule changes.
5. Implement pure geometry/motion modules before engine integration.
6. Integrate engine transitions before renderer changes.
7. Implement visual changes only through original Canvas drawing and local CSS.
8. Run focused tests, then full typecheck, test suite, and build.
9. Run the local browser smoke and inspect its screenshot when a browser mechanism is available.
10. Record actual results in `docs/EVALS_V2.md` or a new V2 evidence file; never rewrite Session 003 results.

## Required Commands

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd test -- tests/v2-evals.test.ts
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png
```

Record a command as PASS only when its actual process succeeds. A browser screenshot alone is not proof of deterministic rules, and unit tests alone are not proof of the visual presentation.

## Allowed Change Areas

- `src/`, `tests/`, `index.html`, and `README.md`;
- `package.json`, lockfile, and TypeScript/build configuration only when immediately required;
- `docs/GAME_SPEC_V2.md`, `docs/BUILD_PROMPT_V2.md`, `docs/EVALS_V2.md`, and `docs/CONTEXT_MANIFEST.md`;
- `docs/AI_USAGE_LOG.md` for append-only records of actual work;
- `specs/002-crane-tower-gameplay/` through an explicit V2 requirements/design update;
- `artifacts/crane-tower/` for actual V2 browser evidence.

## Forbidden Actions

- Do not modify Session 003 documents or artifacts to make V2 appear pre-planned.
- Do not copy third-party branding or reference-game assets.
- Do not load `Example.jpeg` in the application.
- Do not add lives, named modes, multiplayer, backend, database, persistence, deployment, game engine, or physics library without new human approval.
- Do not fabricate test output, browser output, screenshots, hashes, dates, contribution records, or PASS results.
- Do not change the seven-field configuration schema as part of a visual or gameplay tune.

## Definition of Done

- `docs/GAME_SPEC_V2.md`, `docs/BUILD_PROMPT_V2.md`, and `docs/EVALS_V2.md` exist and agree with feature 002.
- The exact City Bloxx gameplay-inspiration-only boundary is present.
- The no-lives rule is explicit in specification, implementation state, and V2-E4.
- V2-E1 through V2-E5 pass as executable deterministic tests.
- Crane extrema keep the complete active floor inside the Canvas; left and right bound assertions pass.
- Typecheck, full tests, and production build pass.
- V2-E6 has actual browser evidence or is honestly marked NOT RUN with a reason.
- Session 003 evidence is unchanged.
- Final response lists changed files, actual commands/results, remaining limitations, and Git status.
