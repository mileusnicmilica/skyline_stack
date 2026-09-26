import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const previewUrl = "http://127.0.0.1:4173/";
const apiUrl = "http://127.0.0.1:3001/api/health";

const tools = {
  tsc: resolve(projectRoot, "node_modules/typescript/bin/tsc"),
  vitest: resolve(projectRoot, "node_modules/vitest/vitest.mjs"),
  vite: resolve(projectRoot, "node_modules/vite/bin/vite.js"),
  tsx: resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"),
  smoke: resolve(projectRoot, "tests/browser-smoke.mjs"),
};

function spawnNode(script, args, options = {}) {
  return spawn(process.execPath, [script, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}

async function runStep(label, script, args = []) {
  process.stdout.write(`\n[verify] ${label}\n`);
  const child = spawnNode(script, args);
  const [exitCode, signal] = await once(child, "exit");
  if (exitCode !== 0) {
    const outcome = signal ? `signal ${signal}` : `exit code ${exitCode}`;
    throw new Error(`${label} failed with ${outcome}.`);
  }
}

async function waitForPreview(child) {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Vite preview exited early with code ${child.exitCode}.`);
    }

    try {
      const response = await fetch(previewUrl, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
      lastError = new Error(`Vite preview returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  throw lastError ?? new Error("Vite preview did not become ready.");
}

async function waitForApi(child) {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Coach API exited early with code ${child.exitCode}.`);
    }
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        signal: AbortSignal.timeout(500),
      });
      if (response.status === 200) return;
      lastError = new Error(`Coach API returned unexpected HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw lastError ?? new Error("Coach API did not become ready.");
}

async function verifyCoachProxy() {
  const healthResponse = await fetch(`${previewUrl}api/health`, {
    signal: AbortSignal.timeout(2_500),
  });
  const health = await healthResponse.json();
  if (healthResponse.status !== 200 || health.status !== "ok") {
    throw new Error(`Coach API health proxy check failed with HTTP ${healthResponse.status}.`);
  }

  const response = await fetch(`${previewUrl}api/ai/coach`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      finalScore: 1,
      startingWidth: 100,
      drops: [
        { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
        { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
      ],
    }),
    signal: AbortSignal.timeout(2_500),
  });
  const result = await response.json();
  if (response.status !== 200 || result.success !== true ||
      result.advice?.timingBias !== "late" ||
      result.advice?.biggestMistakeFloor !== 2) {
    throw new Error(`Coach API preview proxy check failed with HTTP ${response.status}.`);
  }
}

let preview;
let api;
let stoppingPreview;
let screenshotDir;

async function stopPreview() {
  if (stoppingPreview) return await stoppingPreview;
  if (!preview || preview.exitCode !== null) return;

  stoppingPreview = (async () => {
    preview.kill();
    await Promise.race([
      once(preview, "exit"),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000)),
    ]);

    if (preview.exitCode === null) {
      preview.kill("SIGKILL");
      await Promise.race([
        once(preview, "exit"),
        new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
      ]);
    }
  })();

  return await stoppingPreview;
}

async function stopApi() {
  if (!api || api.exitCode !== null) return;
  api.kill();
  await Promise.race([
    once(api, "exit"),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000)),
  ]);
  if (api.exitCode === null) {
    api.kill("SIGKILL");
    await Promise.race([
      once(api, "exit"),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
    ]);
  }
}

let handlingSignal = false;
function handleSignal(signal) {
  if (handlingSignal) return;
  handlingSignal = true;
  void Promise.all([stopPreview(), stopApi()]).finally(() => {
    process.exit(signal === "SIGINT" ? 130 : 143);
  });
}

const handleSigint = () => handleSignal("SIGINT");
const handleSigterm = () => handleSignal("SIGTERM");
process.once("SIGINT", handleSigint);
process.once("SIGTERM", handleSigterm);

try {
  await runStep("TypeScript typecheck", tools.tsc, ["--noEmit"]);
  await runStep("Server TypeScript typecheck", tools.tsc, ["--noEmit", "-p", "tsconfig.server.json"]);
  await runStep("Vitest suite", tools.vitest, ["run"]);
  await runStep("Production build", tools.vite, ["build"]);

  process.stdout.write("\n[verify] Starting local fake-provider API\n");
  api = spawnNode(tools.tsx, [resolve(projectRoot, "server/main.ts")]);
  await waitForApi(api);

  process.stdout.write(`\n[verify] Starting Vite preview at ${previewUrl}\n`);
  preview = spawnNode(tools.vite, [
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort",
  ]);
  await waitForPreview(preview);
  process.stdout.write("\n[verify] Checking preview /api proxy and fake coach response\n");
  await verifyCoachProxy();
  screenshotDir = await mkdtemp(join(tmpdir(), "skyline-stack-w04-verify-"));
  await runStep("Production preview browser smoke", tools.smoke, [
    previewUrl,
    join(screenshotDir, "smoke.png"),
  ]);
  process.stdout.write("\n[verify] All checks passed.\n");
} finally {
  process.off("SIGINT", handleSigint);
  process.off("SIGTERM", handleSigterm);
  await Promise.all([stopPreview(), stopApi()]);
  if (screenshotDir) await rm(screenshotDir, { recursive: true, force: true });
}
