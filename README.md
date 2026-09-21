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

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

With the dev server running and local Chrome or Edge installed, the repeatable
browser smoke flow is:

```powershell
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png
```

The smoke flow checks Ready, a successful crane placement, a deliberately
timed full miss, Game Over, restart, and browser exceptions, then writes a
screenshot. It does not download a browser. The locked Session 003 baseline
under `artifacts/session-003/` is not modified by this V2 flow.

The latest verified local result, dated 2026-09-21, is: typecheck PASS,
9 test files/55 tests PASS, production build PASS, and local Edge smoke PASS.
The active crane floor remains fully within the Canvas at both sway extremes.

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
