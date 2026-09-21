# Eval Set — Skyline Stack Session 003

**Locked expectation candidate**: 2026-09-20  
**Execution status**: NOT RUN  
**Rule**: E1–E3 expectations must not change after baseline execution begins.
E4 remains TBD until the first real repeatable baseline problem is observed.

| ID | Ulaz ili scenario | Očekivanje | Baseline | Posle izmene | Status | Dokaz |
| -- | ----------------- | ---------- | -------- | ------------ | ------ | ----- |
| E1 | Validan default GameConfig; advance moving state; drop with a clear deterministic overlap larger than minOverlap | Game starts without runtime error; active block moves; only overlap is placed; score changes 0→1; exactly one new moving active block exists with the placed width | PASS — extracted archive reproduced movement, trim, score 0→1, and one matching moving block | PASS — identical deterministic test and browser score transition reproduced | PASS | Baseline and post-change `npm.cmd test -- tests/evals.test.ts`: 3/3 passed; post screenshot shows score 1 |
| E2 | Deterministic contact where `overlap === minOverlap` | Placement is accepted; placed width equals `minOverlap`; score increases by exactly 1; phase remains playing and does not become gameOver | PASS — extracted archive accepted exact 8-unit overlap and continued playing | PASS — exact 8-unit boundary remained accepted | PASS | Same baseline and post-change eval command |
| E3 | Unknown configuration missing `fallSpeed`; additional validator matrix covers minOverlap 0/negative/NaN/too wide, non-number and Infinity | Invalid candidate is not used; a fresh complete known default is selected; exactly one fixed safe warning is requested/displayed; warning contains no raw values; application does not throw and remains playable | PASS — extracted archive selected fresh defaults, one fixed warning request, and a playable session | PASS — identical fallback test remained green | PASS | Same eval command; complete post-change suite 37/37 passed |
| E4 | In a 1280×1002 Chromium viewport with default config, load the game and complete one successful drop; compare the rendered canvas rectangle with the viewport and inspect the initial screenshot | The complete canvas, base/active tower view, and footer controls fit in the initial viewport without vertical scrolling (`canvas.bottom <= viewportHeight`) | FAIL — canvas 826×1101.328 at top 130.266 ends at 1231.594, beyond viewport height 1002 | PASS — canvas 474×632 at top 130.266 ends at 762.266, within viewport height 1002 | PASS | Baseline: `baseline-extracted.png`; post-change: `post-change.png`; identical Chromium smoke flow |

## Deterministic Setup

- Default candidate: 480×640 canvas, start width 200, block height 28,
  move speed 180, fall speed 520, minimum overlap 8.
- Geometry scenarios must set explicit active/support intervals rather than rely
  on human timing.
- E1 and E2 verify score, placed geometry, active-block count, next width, phase,
  and motion.
- E3 verifies returned selection and the one-warning browser integration.
- Before real execution, all cells remain `NOT RUN`.

## E4 Definition Protocol

After a baseline candidate exists and E1–E3 plus browser exploration actually
run:

1. select the first visible or test-detected repeatable problem;
2. write one exact reproduction scenario here;
3. write the expected behavior before changing code;
4. save the baseline archive and hash before any fix;
5. reproduce the same scenario on an extracted baseline copy;
6. record the actual result and mark baseline `FAIL`;
7. do not change the scenario or expectation during the fix.

If no real repeatable problem is found, E4 stays TBD, no controlled change is
allowed, and Session 003 reports that evidence blocker instead of inventing a
failure.

### Locked E4 definition — 2026-09-20

The real baseline screenshot showed only the upper canvas and a thin part of
the active block at the bottom edge; the support/base and footer were below the
initial viewport. The browser reported a logical 480×640 canvas styled to
826×1101.328 CSS pixels, from `top=130.266` to `bottom=1231.594`, in a
1002-pixel-high viewport. This definition is now locked before the targeted
change. The extracted archive rerun will supply the authoritative baseline
PASS/FAIL cell.

## Identical Before/After Protocol

The same E1–E4 identifiers, inputs, setup, and expectations must run:

- once on the saved baseline;
- once on the working copy after exactly one targeted change.

Only the Baseline, Posle izmene, Status, and Dokaz cells may receive actual
results. E1–E3 scenario/expectation text is locked after Phase A approval. E4
scenario/expectation becomes locked immediately after its real baseline
definition and before the change.

