# Skyline Stack — Core Game Specification

**Version**: 1.0 — Phase A lock candidate  
**Status**: Ready for human review; not yet approved for implementation  
**Date**: 2026-09-20

## Game Description

Skyline Stack is a small single-player retro-inspired browser game about
building a tower through precisely timed block drops. One active block moves
horizontally above the current tower, and the player chooses when it begins a
vertical fall. Only the portion that overlaps the previous block survives, so
the tower becomes progressively harder to extend. The game has no final win
screen; success is the highest score reached before a miss.

## Player Goal

Place as many blocks as possible. Each successful placement is worth exactly
one point and determines the width available to the next block.

## Controls

| Input | Accepted when | Effect |
| --- | --- | --- |
| Space | game phase is playing and block motion is moving | starts one drop |
| Left click or tap on the play area | game phase is playing and block motion is moving | starts the same one drop |
| R | game phase is gameOver | starts a fresh session |
| Restart button | game phase is gameOver | starts a fresh session |

Holding Space must not produce multiple accepted actions for the same block.
One physical press, click, or tap causes at most one accepted drop.

## Core Game Loop

1. Show a tower base, score 0, Ready status, and exactly one moving active block.
2. Move the active block horizontally and reverse it at the canvas edges.
3. Accept Space, click, or tap and switch that block to a vertical-only fall.
4. On contact height, calculate horizontal overlap with the last placed block.
5. If overlap is accepted, place only that interval and increment score by one.
6. Keep the new support visible if the tower reaches the top margin.
7. Spawn exactly one moving block whose width equals the accepted overlap.
8. If overlap is too small, freeze gameplay in Game Over.
9. Accept R or Restart after Game Over and restore the complete initial state.

Ready is the visible status while score is 0 and the session accepts the first
drop. Playing is visible after the first success. Game Over is visible after a
failed placement.

## Win and Lose Conditions

There is no finite win condition or win screen. The current session score is
the number of successful placements after the base.

The player loses when:

```text
overlap < minOverlap
```

After Game Over, movement and placement stop, drop input does not alter state,
the result remains visible, and restart is available.

## Eight Non-Negotiable Gameplay Rules

1. **Single active block**: exactly one active block object exists; it is moving
   or falling during play and is frozen as missed after failure.
2. **Bounded horizontal movement**: while moving, only `x` changes; the block
   stays inside `0..canvasWidth` and reverses at either edge.
3. **One eligible input**: a drop is accepted only in playing + moving; repeated
   keydown, falling-state input, and post-game input are ignored.
4. **Vertical-only fall**: after acceptance, `x` and width remain unchanged
   until contact resolution; only `y` changes.
5. **Interval intersection**: overlap is
   `max(0, min(activeRight, supportRight) - max(activeLeft, supportLeft))`.
6. **Successful resolution**: `overlap >= minOverlap` places only the
   intersection, raises score by exactly one, and spawns one next block with
   that width.
7. **Failed resolution**: `overlap < minOverlap` leaves score unchanged and
   enters gameOver with active gameplay stopped.
8. **Complete restart**: score, placed blocks, active block, direction, held or
   pending input, and game phase match a fresh session.

## Structured GameConfig Contract

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

### Known Default and Valid Example

```ts
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 28,
  moveSpeed: 180,
  fallSpeed: 520,
  minOverlap: 8,
}
```

Expected behavior: use all supplied values and show no validation warning.

### Invalid Example

```ts
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 28,
  moveSpeed: 180,
  // fallSpeed is missing
  minOverlap: 0,
}
```

Expected behavior: do not use any value from the invalid candidate; use a fresh
copy of the complete known default; show exactly one fixed safe warning; do not
throw or expose raw input.

### Runtime Validation Rules

The validator receives `unknown` and must verify:

- the input is an object and all seven required own fields are present;
- every value has type `number`;
- every value is finite, rejecting `NaN`, `Infinity`, and `-Infinity`;
- canvas dimensions, block dimensions, and both speeds are positive;
- `startingBlockWidth <= canvasWidth`;
- `blockHeight < canvasHeight`;
- `minOverlap > 0`;
- `minOverlap <= startingBlockWidth`.

A TypeScript type assertion is not runtime validation. Any failed rule selects
the whole known default and the fixed warning:
`Invalid game configuration. Safe defaults are in use.`

## Minimal Visual Requirement

- one HTML Canvas with a clear background;
- visible tower base, placed blocks, and one active block;
- readable score and Ready, Playing, or Game Over status;
- concise Space/click/tap and restart instructions;
- a Restart button;
- one safe configuration warning region;
- a simple original retro palette and geometric forms only;
- a simple one-block-height viewport rebase when needed, without complex camera
  animation.

## Technical Boundary

No starter was supplied. The smallest planned setup is TypeScript, browser
HTML/CSS/Canvas, Vite for serving/building TypeScript, and Vitest for
deterministic tests. Vite and Vitest are development tools only; the game has
no runtime framework, backend, database, network call, or external asset.

If a mandatory starter is later discovered, implementation stops and the
missing starter is reported as a blocker rather than reconstructed by guess.

## OUT OF SCOPE

- local or online multiplayer, matchmaking, or WebSocket;
- login, accounts, online leaderboard, backend, or database;
- deployment, publication, hosting configuration, or Git remote;
- procedural generation, levels, city map, building selection, or extra modes;
- opponents, AI-controlled enemies, lives, or power-ups;
- custom music, audio, downloaded assets, or copied game identity;
- complex physics library, game engine, or decorative complex animation;
- persistent score storage;
- AI Hint, tool calling, or any Session 004 feature;
- infrastructure not required by the Core.

## Definition of Done

The unchecked items are not claims; they remain `NOT RUN` in Phase A.

- [ ] The browser application starts with a recorded real command and output.
- [ ] Canvas, base, one active block, score, status, controls, and Restart render.
- [ ] The active block moves horizontally and remains within both edges.
- [ ] Space, click, and tap each produce at most one accepted drop.
- [ ] Falling motion is vertical only.
- [ ] Partial overlap trims the non-overlapping portion.
- [ ] A successful placement increments score by exactly one.
- [ ] `overlap === minOverlap` succeeds with exactly that placed width.
- [ ] `overlap < minOverlap` enters Game Over without a score increment.
- [ ] Post-game drop input cannot change score or tower.
- [ ] R and Restart completely restore the initial state.
- [ ] The exact GameConfig shape, valid example, and invalid example are present.
- [ ] Runtime validation covers presence, type, finiteness, positivity, and all
  required cross-field rules.
- [ ] Invalid configuration selects complete defaults, shows one safe warning,
  does not crash, and exposes no input values.
- [ ] At least four eval cases have expectations locked before execution.
- [ ] A complete baseline is preserved and identified without being overwritten.
- [ ] At least one eval shows a real repeatable baseline failure.
- [ ] Exactly one hypothesis and one controlled change are documented.
- [ ] The identical eval set runs before and after that change.
- [ ] Evidence contains only real commands, outputs, screenshots, results, and
  human contributions; unavailable information is NOT RUN or TBD.

