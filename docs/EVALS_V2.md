# Eval Set — Skyline Stack Crane Tower V2

**Created**: 2026-09-21
**Scope**: Feature `002-crane-tower-gameplay`
**Executable suite**: `tests/v2-evals.test.ts`
**Historical isolation**: This file is separate from `docs/EVALS.md` and does not alter Session 003 expectations or results.

## Inspiration and lives decisions

**City Bloxx is gameplay inspiration only.** V2 evaluates the original Skyline Stack implementation, assets, and interface.

V2 has no lives counter. V2-E4 evaluates the explicit absence of lives and confirms that one below-minimum landing ends the run. It does not claim that a three-miss system was implemented.

## Locked V2 eval matrix

| ID | Scenario | Expected result | Actual result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| V2-E1 | Create a default session and advance an attached floor by 0.25 seconds; evaluate both sine extrema | Swing phase and horizontal position advance; hanging height remains fixed; floor remains attached; full floor stays within `0..canvasWidth` at both extrema | Focused suite reproduced all expected state changes and both horizontal bounds | PASS | `tests/v2-evals.test.ts` V2-E1; `tests/crane.test.ts` extrema assertions |
| V2-E2 | Release with Space, repeat with pointer, then advance 0.1 seconds | First input enters falling; repeat input returns unchanged state; `x` remains fixed and `y` increases | Focused suite reproduced the one-shot vertical drop | PASS | `tests/v2-evals.test.ts` V2-E2 |
| V2-E3 | Land a default-width floor 30 units to the right of its support | Placed plus detached widths equal released width; placed width is reduced by 30; at least four pieces originate on the right | Conservation, placed width, count, and side assertions passed | PASS | `tests/v2-evals.test.ts` V2-E3 |
| V2-E4 | Place the released floor completely beyond the support | Score remains unchanged; full floor becomes at least four debris pieces; phase becomes Game Over; no `lives` or `remainingLives` field exists; later drop is ignored | All loss/no-lives assertions passed | PASS | `tests/v2-evals.test.ts` V2-E4 |
| V2-E5 | Resolve eight perfect floors, advance camera after each, then restart a state containing V2 debris | Active floor and immediate support remain visible; restart is deeply equal to a fresh session and clears V2 state | Tall-tower visibility and full restart assertions passed | PASS | `tests/v2-evals.test.ts` V2-E5 |
| V2-E6 | Run the local Edge browser smoke through Ready, one success, a bounded right-edge partial landing, deliberate left-edge miss, Game Over, and R restart; capture the Playing screenshot | All DOM states match, screenshot is written, and browser runtime/log error arrays are empty | Ready 0 → Playing 1 → Playing 2 → Game Over 2 → Ready 0; zero browser/runtime log errors | PASS | `artifacts/crane-tower/RESULTS.md`; `artifacts/crane-tower/smoke.png` |

## Actual focused execution

Command executed on 2026-09-21:

```powershell
npm.cmd test -- tests/v2-evals.test.ts
```

Observed result:

```text
Test Files  1 passed (1)
Tests       5 passed (5)
Duration    360ms
```

## Browser evidence

The original V2 browser smoke and screenshot were produced on 2026-09-20. After the crane-bound correction, the local Microsoft Edge smoke was rerun on 2026-09-21 with the bounded partial-placement flow recorded in V2-E6. Both captured browser error arrays were empty; the newest screenshot is `artifacts/crane-tower/smoke.png`.

## Full regression verification

Commands executed on 2026-09-21 after adding the V2 artifacts and executable evals:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Observed results:

```text
typecheck: PASS
Test Files: 9 passed (9)
Tests: 55 passed (55)
build: PASS — 14 modules transformed
```

## Result

V2-E1 through V2-E6 are PASS. The focused executable suite covers crane, sway, drop, cut/crumble, the explicit no-lives rule, camera, and restart. Browser evidence covers the integrated HUD/Canvas flow and visual presentation.
