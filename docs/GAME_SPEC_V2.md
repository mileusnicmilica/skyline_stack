# Skyline Stack — Crane Tower Game Specification

**Version**: 2.0
**Status**: Implemented; specification reconstructed to close the V2 documentation gap
**Created**: 2026-09-21
**Feature**: [002-crane-tower-gameplay](../specs/002-crane-tower-gameplay/spec.md)

## Documentation Integrity Note

This file was created after the V2 implementation already existed. It records the implemented and verified V2 contract without pretending to have been a pre-implementation lock. It does not replace or retroactively modify `docs/GAME_SPEC.md`, `docs/BUILD_PROMPT_V1.md`, `docs/EVALS.md`, `docs/EVIDENCE_003.md`, or the Session 003 baseline.

## Inspiration and Identity Boundary

**City Bloxx is gameplay inspiration only.**

Skyline Stack may use the broad interaction vocabulary of a swaying crane load, one-action release, rising modular tower, city skyline, and timing-based placement. It MUST retain its own name and original procedural presentation. It MUST NOT copy City Bloxx/Tower Bloxx logos, characters, sprites, screenshots, music, sound effects, source code, exact UI panels, or other protected assets.

`Example.jpeg` is a local visual reference only. It is ignored by Git and is not loaded or distributed by the game.

## Game Description

Skyline Stack is a single-player browser game about constructing a city tower one suspended floor at a time. A decorated building floor hangs from a visible crane cable and sways horizontally. The player releases it with one input. The floor then falls vertically toward the top of the tower.

Only the supported horizontal overlap becomes part of the building. Any unsupported facade is cut away and converted into falling masonry. The accepted width becomes the width of the next suspended floor, making later placements progressively more demanding.

## Player Goal

Build as many supported floors as possible. Each accepted landing adds exactly one point. There is no finite win screen; the session score represents the achieved tower height.

## Controls

| Input | Accepted when | Effect |
| --- | --- | --- |
| Space | phase is `playing`, floor motion is `moving`, and no drop was accepted | releases the suspended floor once |
| Left click or tap on Canvas | same condition as Space | performs the same release |
| R | phase is `gameOver` | restores a fresh session |
| Restart button | phase is `gameOver` | restores a fresh session |

Repeated Space events, an additional pointer action during a fall, and all drop input after Game Over are ignored.

## Core Game Loop

1. Start with score 0, one centered base, and one decorated floor attached to the crane.
2. Advance a deterministic sinusoidal sway phase and move the attached floor and cable endpoint together.
3. Accept one Space, click, or tap and change the floor from attached/moving to falling.
4. Preserve the release `x` position and width while only `y` advances toward the support.
5. At contact height, calculate the horizontal intersection with the last placed floor.
6. If the overlap is at least `minOverlap`, place exactly that interval and increase score by one.
7. Convert every unsupported interval into deterministic masonry pieces with gravity and rotation.
8. Spawn one next attached floor whose width equals the accepted overlap.
9. Move the camera target upward as required to keep the crane connection, active floor, and immediate support visible.
10. If the overlap is smaller than `minOverlap`, convert the entire released floor into debris and enter Game Over without increasing score.
11. After Game Over, allow existing debris to finish visually but freeze score, tower geometry, swing, and placement input.
12. R or Restart creates a state deeply equal to a fresh session.

## Crane and Drop Rules

- Exactly one active floor exists.
- `motion: moving` means the floor is attached to the crane.
- Attached horizontal position is derived from a sine phase, not edge-reflecting linear movement.
- The cable endpoint follows the active floor center while attached.
- One accepted input changes motion to `falling` and sets `dropAccepted`.
- Falling is vertical-only: `x` and width remain unchanged until contact resolution.
- Large browser frame delays are bounded by the application before engine advancement.

## Landing and Cutting Rules

Horizontal overlap is:

```text
left  = max(activeLeft, supportLeft)
right = min(activeRight, supportRight)
width = max(0, right - left)
```

### Accepted landing

An overlap succeeds when:

```text
overlap.width >= minOverlap
```

The placed floor MUST have `x = overlap.left` and `width = overlap.width`. Score increases exactly once. The next active floor has exactly the accepted width.

For every imperfect successful landing:

```text
placed width + detached section widths = released width
```

The equality is evaluated within `0.001` numeric tolerance. A perfect full-width landing creates no detached section or debris.

### Failed landing

An overlap fails when:

```text
overlap.width < minOverlap
```

The full released floor becomes debris, no floor is appended, score remains unchanged, and the phase becomes `gameOver`.

## Lives Decision

V2 intentionally has **no lives counter and no multiple-miss allowance**. The first below-minimum landing ends the current run. This rule follows the later explicit scope decision and supersedes any earlier proposal to evaluate a three-miss system.

The V2 lives eval is therefore a negative contract check: it confirms that a full miss immediately enters Game Over and that neither `lives` nor `remainingLives` exists in session state.

## Masonry and Debris Rules

- A detached section is classified as `left`, `right`, or `full`.
- Every positive-width section is split deterministically into at least four pieces.
- Piece rectangles initially tile the detached section area without changing tower collision geometry.
- Left debris receives leftward velocity; right debris receives rightward velocity; a full miss spreads in both directions.
- Gravity advances vertical velocity and position; angular velocity advances rotation.
- Debris has a finite lifetime and is removed after expiry or after leaving the visible lower region.
- Debris is visual feedback only and can never support another floor or modify score.

## Camera Rules

- Blocks remain in stable world coordinates.
- Rendering uses `screenY = worldY + cameraOffset`.
- A successful placement sets a non-negative target offset for the next construction zone.
- Camera movement eases toward the target and does not modify collision coordinates.
- After at least eight accepted floors, the active floor and immediate support remain within the Canvas.

## Visual Contract

The Canvas scene MUST include original procedural versions of:

- a bright vertical sky gradient and sun glow;
- multiple cloud silhouettes;
- at least two city skyline layers with depth;
- a visible crane boom/pivot, cable, hook, and floor connector;
- building-floor facades with top/bottom bands, side shade, window grid, and deterministic light variation;
- subtle floor tilt and impact feedback;
- rotating facade-colored debris and brief dust;
- a readable Floors/Status HUD and restrained Game Over overlay.

The play surface remains portrait-oriented and usable at a 320 CSS-pixel page width. Motion is not the only state cue: attachment, status text, debris, HUD state, and overlay provide redundant feedback.

## Visible States

| State | Condition | Visible result |
| --- | --- | --- |
| Ready | phase is playing and score is 0 | active crane floor, score 0, Restart disabled |
| Playing | phase is playing and score is greater than 0 | active construction loop and current floor count |
| Game Over | below-minimum landing | tower remains visible, final floor count shown, Restart enabled |

## Structured GameConfig Contract

The public schema remains the same seven-field contract:

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

### V2 default

```ts
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 40,
  moveSpeed: 180,
  fallSpeed: 520,
  minOverlap: 8,
}
```

All fields must be own, finite, positive numeric values. `startingBlockWidth <= canvasWidth`, `blockHeight < canvasHeight`, and `minOverlap <= startingBlockWidth` remain mandatory. Any invalid candidate is rejected as a whole, a fresh safe default is selected, and one fixed warning is requested without exposing input values.

## Technical Boundary

- Framework-free TypeScript, HTML, CSS, browser APIs, and one Canvas.
- Vite is a development/build tool only.
- Vitest executes deterministic state and geometry tests.
- No runtime framework, backend, database, account, network gameplay, persistence, game engine, or physics library.
- No downloaded runtime art asset or reference-game asset.

## Out of Scope

- multiple named game modes;
- lives or a three-miss system;
- city maps, population simulation, building selection, or campaign progression;
- multiplayer, accounts, online leaderboard, backend, or database;
- power-ups, opponents, audio, deployment, or persistent score;
- copied game identity or externally hosted art.

## Verification Contract

The executable V2 evals are in `tests/v2-evals.test.ts`; their recorded results are in `docs/EVALS_V2.md`. Browser evidence is stored separately under `artifacts/crane-tower/`. Session 003 artifacts remain historical and unchanged.

## Definition of Done

- [x] One suspended floor sways deterministically with a visible cable.
- [x] Space, click, and tap share a one-shot release transition.
- [x] A released floor retains `x` and falls vertically.
- [x] Successful landing preserves only overlap and increments score once.
- [x] Detached width is conserved and becomes side-correct debris.
- [x] Perfect placement produces no debris.
- [x] A full miss produces complete-floor debris and Game Over without a score increase.
- [x] No lives field or multi-miss allowance exists.
- [x] Camera keeps an eight-floor construction zone visible.
- [x] Restart clears tower progress, crane phase, camera, debris, impact, and input state.
- [x] Original procedural city/crane/building presentation is visible in browser evidence.
- [x] Runtime configuration validation and safe fallback remain operational.
- [x] Typecheck, deterministic tests, production build, and browser smoke have recorded PASS evidence.
