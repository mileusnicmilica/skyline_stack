# Milica second-block handoff

**Date:** 2026-09-26  
**Review owner:** Nemanja  
**Status:** T016–T019 and T023–T025 implemented and fake-verified. One bounded
real Gemini demonstration passed; Nemanja's review and the joint demo remain.

## Diff map

- `server/providers/`: stable `gemini-3.1-flash-lite` REST adapter, server-only
  provider selection, typed transient/non-transient errors.
- `server/coach/analysis.ts`: 10 s total deadline, 4.5 s attempt deadline,
  one retry with 250 ms backoff, abort, safe result, and sanitized usage hook.
- `server/provider-usage.ts`: provider/model/timestamp/latency/outcome/attempts
  plus optional token counts; no payload or secret.
- `src/coach/` and `src/main.ts`: bounded client contract, duplicate gate,
  stale-response invalidation, pending/advice/unavailable state.
- `index.html` and `src/style.css`: Game Over-only analysis control and
  accessible live region next to Restart.
- `tests/`: Gemini/config/retry/timeout/malformed/duplicate/stale tests plus
  browser fake success/failure/restart smoke.
- `scripts/check-secret-boundary.mjs`: tracked files, history and bundle scan;
  integrated into `npm run verify`.
- `docs/`: exact prompt, provider contract, eval matrix, separate provider
  usage log and redacted W04 evidence.

## Observed verification

```text
npm.cmd run verify
PASS — 16 test files / 117 tests (including the five-floor camera threshold)
PASS — browser + server typecheck
PASS — production build
PASS — provider secret boundary
PASS — fake API through production preview proxy
PASS — Edge fake success, safe failure and restart; 0 browser errors
```

Two fake provider calls were recorded by the final verify, both successful in
one attempt. One live call also succeeded in one attempt: 1.459 s, 156 input
and 74 output tokens (230 total), USD 0.000150 list-price equivalent.

## Nemanja review checklist

- [ ] Re-run `npm.cmd run verify`.
- [ ] Inspect `server/providers/gemini-provider.ts`: key only in header;
  structured schema requires numeric `biggestMistakeFloor`.
- [ ] Inspect `server/coach/analysis.ts`: maximum two attempts and no retry for
  invalid request or deterministic invalid output.
- [ ] Inspect `src/main.ts` and `src/coach/request-gate.ts`: pending duplicate
  block, abort and stale response rejection after Restart.
- [ ] Re-run `npm.cmd run check:secrets` and inspect staged diff before commit.
- [x] With Milica's local ignored `.env`, perform at most one intentional live
  call and record only the observed redacted result.
- [ ] Confirm actual reviewer/driver role swap and joint six-minute demo in
  `docs/EVIDENCE_W04.md`; do not mark them complete before they occur.
