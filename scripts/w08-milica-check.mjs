import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = (path) => resolve(root, path);
const environment = { ...process.env, AI_COACH_PROVIDER: "fake" };
const steps = [
  ["client typecheck", local("node_modules/typescript/bin/tsc"), ["--noEmit"]],
  ["server typecheck", local("node_modules/typescript/bin/tsc"), ["--noEmit", "-p", "tsconfig.server.json"]],
  ["Milica HTTP security tests", local("node_modules/vitest/vitest.mjs"), [
    "run", "tests/server/w08-http.test.ts", "tests/server/w08-admission.test.ts",
    "tests/server/w08-client-integrity.test.ts", "tests/server/w08-http-events.test.ts",
  ]],
  ["production build", local("node_modules/vite/bin/vite.js"), ["build"]],
  ["Milica browser security tests", local("tests/w08-browser.mjs"), []],
];

for (const [label, script, args] of steps) {
  process.stdout.write(`\n[w08-milica] ${label}\n`);
  const child = spawn(process.execPath, [script, ...args], { cwd: root, env: environment, stdio: "inherit" });
  const [exitCode, signal] = await once(child, "exit");
  if (exitCode !== 0) throw new Error(`${label} failed: ${signal ?? `exit ${exitCode}`}`);
}
process.stdout.write("\n[w08-milica] All assigned checks passed.\n");
