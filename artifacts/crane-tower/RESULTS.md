# Crane Tower V2 Validation Results

**Date**: 2026-09-20

## Automated checks

- `npm.cmd run typecheck`: PASS
- `npm.cmd test`: PASS — 8 files, 49 tests
- `npm.cmd run build`: PASS — 14 modules transformed
- `npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png`: PASS

## Browser smoke

- Browser: local Microsoft Edge
- Initial state: Ready, score 0, Restart disabled
- Successful crane placement: Playing, score 1
- Deliberately timed full miss: Game Over, score remains 1, Restart enabled
- Keyboard restart: Ready, score 0, Restart disabled
- Runtime exceptions: none
- Browser log errors: none
- Screenshot: [smoke.png](./smoke.png)

## Baseline protection

`artifacts/session-003/baseline.zip` remains read-only at 158,941 bytes with SHA-256 `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`.

## Documentation closure verification

**Date**: 2026-09-21

The original browser run above is preserved as measured on 2026-09-20. After
adding the explicit V2 documentation/eval layer, the non-browser checks were
rerun with these results:

- `npm.cmd test -- tests/v2-evals.test.ts`: PASS — 1 file, 5 tests
- `npm.cmd test`: PASS — 9 files, 54 tests
- `npm.cmd run typecheck`: PASS
- `npm.cmd run build`: PASS

No new browser screenshot was claimed for this documentation-only follow-up.

## Crane horizontal-bound correction

**Date**: 2026-09-21

The original sine amplitude allowed a 200-unit active floor to reach `x = -100`
and a right edge of `580` on a 480-unit Canvas. The corrected crane range keeps
the floor's center within `width / 2 .. canvasWidth - width / 2`.

- `npm.cmd test -- tests/crane.test.ts tests/v2-evals.test.ts`: PASS — 2 files, 8 tests
- `npm.cmd run typecheck`: PASS
- `npm.cmd test`: PASS — 9 files, 55 tests
- `npm.cmd run build`: PASS — 14 modules transformed
- `npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png`: PASS

Local Microsoft Edge completed `Ready 0 → Playing 1 → Playing 2 → Game Over 2
→ Ready 0`. The smoke's right-edge partial landing and left-edge full miss both
occur with the active floor fully inside the Canvas; browser/runtime log error
arrays were empty.
