# Skyline Stack

Skyline Stack is a framework-free TypeScript and Canvas crane-building game.
Time one-button drops from a swaying construction cable and raise a detailed
city tower. Only supported overlap becomes the next floor; unsupported facade
breaks into falling masonry.

Live demo: https://skyline-stack.vercel.app

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- a modern Chromium, Firefox, or Safari browser

## Install

```powershell
npm.cmd install
```

In a Windows environment whose trusted root certificate is available only
through the system store, keep TLS verification enabled and run:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm.cmd install
```

## Run locally

```powershell
npm.cmd run dev
```

This starts both Vite and the local API used by the AI buttons. Open the local
URL printed by Vite. Press `Space` or click/tap the canvas to release the
suspended floor. After Game Over, press `R` or use Restart.

The entire city scene is drawn procedurally: sky, clouds, distant buildings,
crane, facade bands, windows, rubble, dust, and the rising camera use no
external image assets.

## Verify

For deterministic checks and a production build:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

### Automated production verification

With local Chrome or Edge installed, the recommended full verification is:

```powershell
npm.cmd run verify
```

This command runs browser and server typechecks, tests, and a production build;
starts the fake-provider API and Vite preview at `http://127.0.0.1:4173/`;
checks the `/api` proxy; runs browser smoke; and shuts down both processes.
No manual server setup is required. Its temporary smoke screenshot is kept
outside the repository and removed afterward, so verification does not replace
the checked-in W03 screenshot.

### Smoke against the dev server

To exercise Vite's development server, start it in one terminal:

```powershell
npm.cmd run dev
```

Then run the smoke in another terminal:

```powershell
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png
```

This checks the existing game UI. The default `npm.cmd run dev` starts both
the frontend and API. Use `npm.cmd run dev:web` only when you need the
frontend by itself; AI requests require the API process too. `npm.cmd run
dev:full` remains an explicit alias for the full-stack command.

### Smoke against production preview

For a manual production-preview flow, build and start the preview in one
terminal:

```powershell
npm.cmd run build
npm.cmd run preview
```

Then run the smoke in another terminal:

```powershell
npm.cmd run smoke -- http://127.0.0.1:4173/ artifacts/crane-tower/smoke.png
```

Manual preview alone starts only the frontend. To call `/api` in that manual
flow, also start `npm.cmd run dev:api` in another terminal. The automated
`verify` command starts both processes for you.

The smoke flow checks Ready, a successful crane placement, a deliberately
timed full miss, Game Over, restart, and browser exceptions, then writes a
screenshot. It does not download a browser. The locked Session 003 baseline
under `artifacts/session-003/` is not modified by this V2 flow.

The Chromium user profile used by the smoke is created in the operating
system's temporary directory and removed after the run. It must not be moved
under `artifacts/`: on Windows, Vite's dev watcher can otherwise encounter an
`EBUSY` error while Chromium has its `Cookies` file locked. Screenshots are
safe to keep under `artifacts/crane-tower/`.

The camera begins following before the hanging floor reaches the crane boom.
It preserves the original drop distance and keeps roughly the top three placed
floors visible as the tower grows. A minimum camera clearance keeps a newly
spawned floor below the boom even while the camera is easing. The current
repository verification on 2026-10-06 passed: 25 test files/161 tests,
browser/server typechecks, production build, secret boundary, API proxies,
production-entrypoint rate-limit check, and production-preview Edge smoke. The
automated render regression covers newly spawned floors one through eight.

### W04 AI Crane Coach development boundary

The W04 feature is tracked separately in
[`specs/003-ai-crane-coach/`](specs/003-ai-crane-coach/spec.md). The browser
and TypeScript API run as separate local processes. `npm.cmd run dev` starts
both; Vite proxies `/api` to the loopback API. Check the
split with `Invoke-RestMethod http://127.0.0.1:5173/api/health`. Fake mode is
the default and needs no Gemini key. After Game Over, "Analiziraj partiju"
shows pending, validated advice, or one safe unavailable state; duplicate
requests and stale responses after Restart are blocked.

For one bounded live check, copy `.env.example` to ignored `.env`, set
`AI_COACH_PROVIDER=gemini`, and add `GEMINI_API_KEY` only there. The server
uses the reviewed stable `gemini-3.1-flash-lite` model. Never use a `VITE_`
prefix or place the value in source, docs, screenshots, fixtures, or output.

`npm.cmd run verify` checks browser and server types, game/API contract tests,
the preview `/api` proxy, production build, provider secret boundary, and
browser smoke for fake success/failure plus Restart. A real `.env` remains
ignored; `.env.example` contains an empty server-only key placeholder.

W04 prompt, provider contract, evals, provider usage, and redacted evidence
are in `docs/AI_FEATURE_PROMPT.md`, `docs/AI_PROVIDER_CONTRACT.md`,
`docs/AI_EVALS.md`, `docs/AI_PROVIDER_USAGE_LOG.md`, and
`docs/EVIDENCE_W04.md`.

### W05 bounded next-drill agent

The W05 feature is tracked in [`specs/004-next-drill-agent/`](specs/004-next-drill-agent/spec.md).
After Game Over, **Predloži vežbu** runs a server-side, bounded agent: it proposes
one of three timing drills, the application checks it with the deterministic
read-only `evaluate_drill` tool, then validates the final evidence before showing
the result. Routine verification forces the fake provider even when ignored
`.env` selects Gemini:

```powershell
npm.cmd run verify
```

For an intentional local live run, set `AI_COACH_PROVIDER=gemini` and
`GEMINI_API_KEY` only in ignored `.env`; never use a `VITE_` variable. W05 limits
each run to three model steps, two tool calls, four provider attempts, and a
25-second server deadline. Current fake verification and remaining evidence are
recorded in `docs/EVIDENCE_W05.md`.

Run `npm.cmd run evidence:w05` for reproducible fake success, rejected-tool,
and provider-failure traces without a Gemini request. The local API applies
separate W04 and W05 quotas of five requests per ten minutes.

## Documentation

- [Game specification V2](docs/GAME_SPEC_V2.md) — current gameplay and visual contract
- [Build prompt V2](docs/BUILD_PROMPT_V2.md) — current implementation and maintenance instructions
- [V2 evals](docs/EVALS_V2.md) — required checks and measured results
- [Feature 002 Spec Kit package](specs/002-crane-tower-gameplay/spec.md) — specification, plan, contracts, quickstart, and tasks
- [Feature 004 W05 agent package](specs/004-next-drill-agent/spec.md) — bounded agent spec, plan, flow, tool contract, evals, and tasks
- [Current context manifest](docs/CONTEXT_MANIFEST.md) — authoritative project map and lifecycle status
- [Current state summary 2026-10-06](docs/CURRENT_STATE_2026-10-06.md) — HEAD commit, verification, and production-entrypoint rate-limit evidence
- [Crane Tower validation results](artifacts/crane-tower/RESULTS.md) — automated and browser evidence

`docs/GAME_SPEC.md`, `docs/BUILD_PROMPT_V1.md`, `docs/EVALS.md`,
`docs/EVIDENCE_003.md`, and `specs/001-skyline-stack-core/` are historical
Session 003 records. They are retained for traceability and are not the current
V2 gameplay authority.

City Bloxx is gameplay inspiration only. Skyline Stack uses its own name,
rules, code, procedural visuals, and assets.
