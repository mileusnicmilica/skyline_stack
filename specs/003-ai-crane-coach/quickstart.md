# Quickstart: AI Crane Coach

## Prerequisites

- Node.js 24.x and npm
- Install the locked dependencies with `npm ci` (use `npm.cmd` in PowerShell).
- No Gemini key is needed for the fake-provider phase.

## Local development

1. Run `npm run dev:full`. This starts the Vite frontend on
   `http://127.0.0.1:5173/` and the TypeScript API on `127.0.0.1:3001`.
2. Check the process boundary through Vite with
   `Invoke-RestMethod http://127.0.0.1:5173/api/health` in PowerShell. It
   returns `{ "status": "ok" }` without a provider call.
3. Stop `dev:full` with Ctrl+C; the coordinator stops both processes.

`npm run dev:web` starts only the browser frontend, and `npm run dev:api`
starts only the fake-provider API. `npm run dev` remains the frontend-only Vite
command used by the existing game smoke. Backend code changes require
restarting `dev:full` or `dev:api`.

## Checks

- `npm test` runs the game and API contract/unit suites.
- `npm run typecheck` checks browser and server TypeScript separately.
- `npm run build` builds the frontend.
- `npm run verify` runs both typechecks, tests, build, starts API and production
  preview, checks the same-origin `/api` proxy and fake response, runs browser
  smoke, then stops both processes.

Manual `npm run preview` starts only the frontend. Start `npm run dev:api`
separately when testing `/api` during a manual preview. The generated browser
smoke screenshot is `artifacts/crane-tower/smoke.png`; Chromium's temporary
profile stays outside `artifacts/` to avoid the Vite watcher `EBUSY` issue.

## Handoff to Milica

The currently runnable API uses a deterministic fake provider. Milica's
remaining tasks are T016-T019 and T023-T025 in [tasks.md](tasks.md): live
Gemini adapter, bounded timeout/retry, Game Over analysis UI and safe failure
states, plus redacted live/evidence checks. A real `.env` is ignored; the
versioned `.env.example` has an empty `GEMINI_API_KEY` placeholder. Never use a
`VITE_`-prefixed secret.
