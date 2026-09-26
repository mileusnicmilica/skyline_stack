# Skyline Stack

Skyline Stack is a framework-free TypeScript and Canvas crane-building game.
Time one-button drops from a swaying construction cable and raise a detailed
city tower. Only supported overlap becomes the next floor; unsupported facade
breaks into falling masonry.

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
npm.cmd run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite. Press `Space` or click/tap the canvas to
release the suspended floor. After Game Over, press `R` or use Restart.

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

This command runs typecheck, tests, and a production build; starts Vite preview
at `http://127.0.0.1:4173/`; waits for it to become ready; runs the browser
smoke; and shuts the preview server down. No server setup is required. The
smoke screenshot is written to `artifacts/crane-tower/smoke.png`.

### Smoke against the dev server

To exercise Vite's development server, start it in one terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Then run the smoke in another terminal:

```powershell
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png
```

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

The smoke flow checks Ready, a successful crane placement, a deliberately
timed full miss, Game Over, restart, and browser exceptions, then writes a
screenshot. It does not download a browser. The locked Session 003 baseline
under `artifacts/session-003/` is not modified by this V2 flow.

The Chromium user profile used by the smoke is created in the operating
system's temporary directory and removed after the run. It must not be moved
under `artifacts/`: on Windows, Vite's dev watcher can otherwise encounter an
`EBUSY` error while Chromium has its `Cookies` file locked. Screenshots are
safe to keep under `artifacts/crane-tower/`.

The latest verified local result, dated 2026-09-26, is: typecheck PASS,
9 test files/55 tests PASS, production build PASS, and both dev-server and
production-preview Edge smoke PASS. The active crane floor remains fully
within the Canvas at both sway extremes.

## Documentation

- [Game specification V2](docs/GAME_SPEC_V2.md) — current gameplay and visual contract
- [Build prompt V2](docs/BUILD_PROMPT_V2.md) — current implementation and maintenance instructions
- [V2 evals](docs/EVALS_V2.md) — required checks and measured results
- [Feature 002 Spec Kit package](specs/002-crane-tower-gameplay/spec.md) — specification, plan, contracts, quickstart, and tasks
- [Current context manifest](docs/CONTEXT_MANIFEST.md) — authoritative project map and lifecycle status
- [Crane Tower validation results](artifacts/crane-tower/RESULTS.md) — automated and browser evidence

`docs/GAME_SPEC.md`, `docs/BUILD_PROMPT_V1.md`, `docs/EVALS.md`,
`docs/EVIDENCE_003.md`, and `specs/001-skyline-stack-core/` are historical
Session 003 records. They are retained for traceability and are not the current
V2 gameplay authority.

City Bloxx is gameplay inspiration only. Skyline Stack uses its own name,
rules, code, procedural visuals, and assets.
