import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const services = [
  {
    name: "Coach API",
    script: resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"),
    args: [resolve(projectRoot, "server/main.ts")],
  },
  {
    name: "Vite",
    script: resolve(projectRoot, "node_modules/vite/bin/vite.js"),
    args: ["--host", "127.0.0.1"],
  },
];

const children = services.map(({ name, script, args }) => {
  process.stdout.write(`[dev:full] Starting ${name}\n`);
  return spawn(process.execPath, [script, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true,
  });
});

let stopping = false;
async function stopAll(exitCode) {
  if (stopping) return;
  stopping = true;

  const waits = children.map(async (child) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    child.kill();
    await Promise.race([
      exited,
      new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000)),
    ]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await Promise.race([
        once(child, "exit"),
        new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
      ]);
    }
  });

  await Promise.all(waits);
  process.exit(exitCode);
}

children.forEach((child, index) => {
  child.once("error", () => {
    process.stderr.write(`[dev:full] Could not start ${services[index].name}.\n`);
    void stopAll(1);
  });
  child.once("exit", (code) => {
    if (!stopping) {
      process.stderr.write(`[dev:full] ${services[index].name} stopped.\n`);
      void stopAll(code ?? 1);
    }
  });
});

process.once("SIGINT", () => void stopAll(130));
process.once("SIGTERM", () => void stopAll(143));
