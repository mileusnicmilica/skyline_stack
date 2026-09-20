# Eval Set — Skyline Stack Session 003

**Locked expectation candidate**: 2026-09-20  
**Execution status**: NOT RUN  
**Rule**: E1–E3 expectations must not change after baseline execution begins.
E4 remains TBD until the first real repeatable baseline problem is observed.

| ID | Ulaz ili scenario | Očekivanje | Baseline | Posle izmene | Status | Dokaz |
| -- | ----------------- | ---------- | -------- | ------------ | ------ | ----- |
| E1 | Validan default GameConfig; advance moving state; drop with a clear deterministic overlap larger than minOverlap | Game starts without runtime error; active block moves; only overlap is placed; score changes 0→1; exactly one new moving active block exists with the placed width | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E2 | Deterministic contact where `overlap === minOverlap` | Placement is accepted; placed width equals `minOverlap`; score increases by exactly 1; phase remains playing and does not become gameOver | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E3 | Unknown configuration missing `fallSpeed`; additional validator matrix covers minOverlap 0/negative/NaN/too wide, non-number and Infinity | Invalid candidate is not used; a fresh complete known default is selected; exactly one fixed safe warning is requested/displayed; warning contains no raw values; application does not throw and remains playable | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| E4 | TBD — biće definisan na osnovu prvog stvarnog i ponovljivog baseline problema. | TBD — zapisati pre ciljane izmene, nakon stvarnog opažanja i pre popravke | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

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

## Identical Before/After Protocol

The same E1–E4 identifiers, inputs, setup, and expectations must run:

- once on the saved baseline;
- once on the working copy after exactly one targeted change.

Only the Baseline, Posle izmene, Status, and Dokaz cells may receive actual
results. E1–E3 scenario/expectation text is locked after Phase A approval. E4
scenario/expectation becomes locked immediately after its real baseline
definition and before the change.

