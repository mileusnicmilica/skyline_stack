import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const previewUrl = "http://127.0.0.1:4173/";
const screenshotPath = resolve(
  projectRoot,
  "artifacts/crane-tower/smoke.png",
);

const tools = {
  tsc: resolve(projectRoot, "node_modules/typescript/bin/tsc"),
  vitest: resolve(projectRoot, "node_modules/vitest/vitest.mjs"),
  vite: resolve(projectRoot, "node_modules/vite/bin/vite.js"),
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

let preview;
let stoppingPreview;

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

let handlingSignal = false;
function handleSignal(signal) {
  if (handlingSignal) return;
  handlingSignal = true;
  void stopPreview().finally(() => {
    process.exit(signal === "SIGINT" ? 130 : 143);
  });
}

const handleSigint = () => handleSignal("SIGINT");
const handleSigterm = () => handleSignal("SIGTERM");
process.once("SIGINT", handleSigint);
process.once("SIGTERM", handleSigterm);

try {
  await runStep("TypeScript typecheck", tools.tsc, ["--noEmit"]);
  await runStep("Vitest suite", tools.vitest, ["run"]);
  await runStep("Production build", tools.vite, ["build"]);

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
  await runStep("Production preview browser smoke", tools.smoke, [
    previewUrl,
    screenshotPath,
  ]);
  process.stdout.write("\n[verify] All checks passed.\n");
} finally {
  process.off("SIGINT", handleSigint);
  process.off("SIGTERM", handleSigterm);
  await stopPreview();
}
