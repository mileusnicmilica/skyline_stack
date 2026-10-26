import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = (path) => resolve(root, path);
// Overwrite any local credential before either tests or the production build
// starts. The adapter test still uses a stubbed transport in Gemini mode.
const environment = {
  ...process.env,
  AI_COACH_PROVIDER: "fake",
  GEMINI_API_KEY: "W08_SERVER_SECRET_DO_NOT_EXPOSE",
  W08_SECRET_BOUNDARY_PROOF: "1",
};
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
  ["production build with controlled server credential and artifact scan", local("scripts/w08-sentinel-build.mjs"), []],
  ["W08 built-browser tests", local("tests/w08-browser.mjs"), []],
  ["existing secret boundary scan", local("scripts/check-secret-boundary.mjs"), []],
];

for (const [label, script, args] of steps) {
  process.stdout.write(`\n[w08-security] ${label}\n`);
  const child = spawn(process.execPath, [script, ...args], { cwd: root, env: environment, stdio: "inherit" });
  const [exitCode, signal] = await once(child, "exit");
  if (exitCode !== 0) throw new Error(`${label} failed: ${signal ?? `exit ${exitCode}`}`);
}

process.stdout.write("\n[w08-security] PASS: controlled server credential absent from built client artifacts and all W08 checks passed.\n");
