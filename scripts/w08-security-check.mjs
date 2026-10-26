import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = (path) => resolve(root, path);
const environment = { ...process.env, AI_COACH_PROVIDER: "fake" };
const steps = [
  ["client typecheck", local("node_modules/typescript/bin/tsc"), ["--noEmit"]],
  ["server typecheck", local("node_modules/typescript/bin/tsc"), ["--noEmit", "-p", "tsconfig.server.json"]],
  ["W08 HTTP, agent, provider, reliability and event tests", local("node_modules/vitest/vitest.mjs"), [
    "run", "tests/server/w08-http.test.ts", "tests/server/w08-admission.test.ts",
    "tests/server/w08-client-integrity.test.ts", "tests/server/w08-http-events.test.ts",
    "tests/server/w08-agent.test.ts", "tests/server/w08-provider.test.ts",
    "tests/server/w08-reliability.test.ts", "tests/server/w08-secrets-events.test.ts",
    "tests/server/w08-game-integrity.test.ts",
  ]],
  ["production build", local("node_modules/vite/bin/vite.js"), ["build"]],
  ["W08 built-browser tests", local("tests/w08-browser.mjs"), []],
  ["existing secret boundary scan", local("scripts/check-secret-boundary.mjs"), []],
];

for (const [label, script, args] of steps) {
  process.stdout.write(`\n[w08-security] ${label}\n`);
  const child = spawn(process.execPath, [script, ...args], { cwd: root, env: environment, stdio: "inherit" });
  const [exitCode, signal] = await once(child, "exit");
  if (exitCode !== 0) throw new Error(`${label} failed: ${signal ?? `exit ${exitCode}`}`);
}

const sentinel = "W08_SERVER_SECRET_DO_NOT_EXPOSE";
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if ((await readFile(path)).includes(sentinel)) throw new Error(`Synthetic secret found in built client artifact: ${entry.name}`);
  }
}
await scan(local("dist"));
process.stdout.write("\n[w08-security] PASS: synthetic credential absent from dist and all W08 checks passed.\n");
