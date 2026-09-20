# Skyline Stack

Skyline Stack is a small framework-free TypeScript and Canvas game. Time each
drop so the moving block overlaps the tower; only the overlap survives.

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
drop. After Game Over, press `R` or use Restart.

## Verify

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

With the dev server running and local Chrome or Edge installed, the repeatable
browser smoke flow is:

```powershell
npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/session-003/smoke.png
```

The smoke flow checks Ready, a successful placement, Game Over, restart, and
browser exceptions, then writes a screenshot. It does not download a browser.

