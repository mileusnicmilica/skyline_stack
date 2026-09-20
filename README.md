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
