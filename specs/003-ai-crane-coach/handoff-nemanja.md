# Nemanja first-block handoff

**Date**: 2026-09-26  
**Status**: Nemanja's API/fake-provider block is implemented and verified;
Milica's live-provider and UI block remains open.

## Delivered boundary

- The browser app remains the Vite frontend. The TypeScript API is a separate
  Node process under `server/`, bound to `127.0.0.1:3001`.
- Vite proxies `/api` in both dev and preview. `npm run dev:full` coordinates
  both local processes; `npm run dev:web` and `npm run dev:api` can be used
  independently.
- `GET /api/health` proves the frontend-to-backend route without invoking a
  provider. `POST /api/ai/coach` accepts only the documented minimal run data.
- The API rejects inconsistent or oversized data before provider invocation,
  derives timing and width-loss facts on the server, and runtime-validates the
  fake provider's shape and semantic claims. The only wired provider is the
  deterministic fake; no Gemini key or live provider request was used.
- `biggestMistakeFloor` is now required to be an integer from 1 through
  `finalScore + 1`; `null` is rejected. Every accepted Game Over log includes
  a terminal miss with positive width loss.
- Drop history records every successful landing and the terminal miss; Restart
  clears the history. The checked-in W03 smoke screenshot was restored and
  remains unchanged. Automated verification now writes its temporary browser
  screenshot outside the repository and removes it afterward.

## Verification evidence

All results below were observed on 2026-09-26:

| Command/check | Result |
|---|---|
| `npm.cmd test -- --reporter=dot tests/engine.test.ts tests/server` | PASS: 4 files, 48 tests |
| `npm.cmd run verify` | PASS: browser + server typecheck, 12 test files / 95 tests, production build, API health and coach through production preview proxy, Edge smoke, cleanup |
| `npm.cmd run dev:full` | PASS: frontend on `127.0.0.1:5173`, API on `127.0.0.1:3001`; Ctrl+C stopped both |
| `Invoke-RestMethod http://127.0.0.1:5173/api/health` | PASS: `{ "status": "ok" }` |
| `POST http://127.0.0.1:5173/api/ai/coach` with a deterministic fixture | PASS: `success=true`, bias `late`, greatest-loss floor `2` |
| `npm.cmd run smoke -- http://127.0.0.1:5173/ <temporary screenshot path>` | PASS: Ready → placements → Game Over → Restart; zero browser/console errors; temporary profile and screenshot stayed outside the Vite-watched workspace |
| Listener check after shutdown | PASS: no process listening on ports 3001, 4173, or 5173 |

The restricted command sandbox once failed while `tsx` queried OS user
information (`uv_os_get_passwd` / `ENOMEM`) during API startup. The same full
`npm.cmd run verify` then passed in the normal local process context; this was
an execution-environment limitation, not an API test failure.

## Milica's remaining block

Do not treat the W04 feature as end-to-end complete yet. Milica should review
the request/response contract and fake-provider tests, then complete only the
deferred tasks in `tasks.md`: T016-T019 and T023-T025 (Gemini adapter and
server-only configuration, bounded timeout/retry, Game Over UI and request
state handling, plus secret-boundary and redacted evidence checks). Recheck
model availability, pricing, and account data controls immediately before any
live-provider demonstration; see `research.md`.
