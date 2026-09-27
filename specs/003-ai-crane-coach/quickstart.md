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
3. Finish a run and use "Analiziraj partiju". Fake mode returns deterministic
   validated advice without a provider key.
4. Stop `dev:full` with Ctrl+C; the coordinator stops both processes.

`npm run dev:web` starts only the browser frontend, and `npm run dev:api`
starts only the fake-provider API. `npm run dev` remains the frontend-only Vite
command used by the existing game smoke. Backend code changes require
restarting `dev:full` or `dev:api`.

## Checks

- `npm test` runs the game and API contract/unit suites.
- `npm run typecheck` checks browser and server TypeScript separately.
- `npm run build` builds the frontend.
- `npm run verify` runs both typechecks, tests, build, starts API and production
  preview, checks the same-origin `/api` proxy and fake response, runs the
  secret-boundary check and browser success/failure smoke, then stops both
  processes.
- `npm run check:secrets` checks tracked files, Git history, and the production
  bundle for a provider secret or forbidden `VITE_` secret assignment.

Manual `npm run preview` starts only the frontend. Start `npm run dev:api`
separately when testing `/api` during a manual preview. The generated browser
smoke screenshot is `artifacts/crane-tower/smoke.png`; Chromium's temporary
profile stays outside `artifacts/` to avoid the Vite watcher `EBUSY` issue.

## Optional bounded live check

Copy `.env.example` to ignored `.env`, set `AI_COACH_PROVIDER=gemini`, and add
the real `GEMINI_API_KEY` only in that local file. Restart the API and make one
intentional Game Over analysis request. Record the actual call/token result in
`docs/AI_PROVIDER_USAGE_LOG.md`; if it is not run, keep `NOT RUN`. Never use a
`VITE_`-prefixed secret. Fake mode remains the default for tests and verify.
