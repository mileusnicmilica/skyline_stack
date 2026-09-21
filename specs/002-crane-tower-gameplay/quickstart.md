# Quickstart: Validate Crane Tower Gameplay

**Verified**: 2026-09-21 — typecheck PASS, 9 test files/55 tests PASS, production build PASS, and local Edge smoke PASS. Browser smoke evidence is recorded under `artifacts/crane-tower/`.

## Prerequisites

- Node.js 24+
- npm 11+
- A modern browser; Chrome or Edge is required only for the automated local smoke screenshot

## Install and static verification

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Expected: type checking succeeds, every deterministic test passes, and Vite produces `dist/` without runtime dependencies.

## Manual run

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Open the printed local URL and verify:

1. The initial view is a portrait city scene with a detailed building base, skyline, sky/cloud depth, crane cable, and one suspended detailed floor.
2. Without input, the suspended floor sways left and right while the cable follows it; at both extremes, the entire floor remains inside the Canvas.
3. Press Space near alignment. The cable detaches, the floor falls vertically, score becomes 1, and the next floor appears.
4. Make a partial placement. Only the supported overlap remains; the outside section visibly breaks into rotating masonry and dust on the correct side.
5. Make a full miss. The entire floor crumbles, score stays unchanged, and Game Over appears.
6. Press R or Restart. The score, tower, debris, camera, and crane return to the initial scene.
7. Build eight or more floors and confirm the camera keeps the active floor and top support visible.

## Automated browser smoke and screenshot

Keep the dev server running, then in another terminal run:

```powershell
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/crane-tower/smoke.png
```

Expected: the script verifies Ready, one successful placement, deliberate Game Over, restart, no browser exception, and writes the screenshot without downloading a browser.

## Contract references

- Current product contract: [GAME_SPEC_V2.md](../../docs/GAME_SPEC_V2.md)
- Reproducible build/maintenance prompt: [BUILD_PROMPT_V2.md](../../docs/BUILD_PROMPT_V2.md)
- Executable V2 acceptance evidence: [EVALS_V2.md](../../docs/EVALS_V2.md)
- State and transition expectations: [contracts/gameplay.md](./contracts/gameplay.md)
- Required city/building presentation: [contracts/visual-presentation.md](./contracts/visual-presentation.md)
- Entity constraints and invariants: [data-model.md](./data-model.md)
