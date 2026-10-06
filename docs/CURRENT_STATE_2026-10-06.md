# Current State Summary — 2026-10-06

## Revision

- Branch: `main`
- HEAD commit: `65d76cf2a4d78d8f185394dfdc6c11c1b46c1221`
- Working tree: dirty; this verification includes uncommitted W05 and W04 documentation/test changes. No commit was created for this run.
- Verification mode: `AI_COACH_PROVIDER=fake`; no Gemini request was made.

## Full verification

Command, run after updating the evidence documents:

```powershell
$env:AI_COACH_PROVIDER='fake'
npm.cmd run verify
```

Result: **PASS** on 2026-10-06.

- Vitest: **25 test files / 161 tests passed**
- Browser and server TypeScript typechecks: PASS
- Production build: PASS
- Provider secret boundary (tracked files, Git history, and `dist`): PASS
- Preview proxy: W04 coach and W05 next-drill checks PASS
- Edge production-preview smoke: PASS, zero browser errors and zero browser-log errors

## Production entrypoint rate-limit check

`tests/server/production-rate-limit.test.ts` calls the factory used by the
production serverless route `api/ai/coach.ts`, with an injected fake provider.
The first five requests from one forwarded client address return 200; request
six returns 429 with `Retry-After: 600`; the provider runs exactly five times.
The test is included in the 25-file/161-test result above.

This verifies the production handler configuration within one running
instance. The limiter stores state in process memory, so this test does not
claim a shared quota across separate Vercel serverless instances or verify a
deployed Vercel URL. The production endpoint was not called during this check.

## Documentation updated

- `README.md`
- `docs/EVIDENCE_W04.md`
- `docs/AI_EVALS.md`
- `docs/AI_PROVIDER_USAGE_LOG.md`
- `docs/AI_USAGE_LOG.md`

These current-state results correspond to this working tree on the listed HEAD
commit; they are not evidence that the uncommitted changes are part of that
commit.
