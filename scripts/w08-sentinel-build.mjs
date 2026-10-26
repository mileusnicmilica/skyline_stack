import assert from "node:assert/strict";
import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const sentinel = "W08_SERVER_SECRET_DO_NOT_EXPOSE";

// Check the actual build process environment, before Vite reads configuration.
assert.equal(process.env.W08_SECRET_BOUNDARY_PROOF, "1", "Controlled proof mode is required.");
assert.equal(process.env.AI_COACH_PROVIDER, "fake", "The build must use the fake provider.");
assert.ok(process.env["GEMINI_API_KEY"] === sentinel, "The build must receive only the synthetic server credential.");
process.stdout.write("[w08-secret-proof] Controlled synthetic server credential loaded; fake provider selected.\n");
await build({ root, build: { outDir: dist, sourcemap: true } });

async function scan(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await scan(path));
    else {
      const contents = await readFile(path);
      assert.ok(!contents.includes(sentinel), `Synthetic server credential found in artifact: ${relative(dist, path)}`);
      files.push(path);
    }
  }
  return files;
}

// A positive control proves that the same scanner rejects a credential in a
// source map. Remove the controlled artifact even if detection fails.
const probe = resolve(dist, ".w08-synthetic-secret-probe.js.map");
await writeFile(probe, JSON.stringify({ sourcesContent: [sentinel] }), { flag: "wx" });
try {
  await assert.rejects(scan(dist), /Synthetic server credential found in artifact: \.w08-synthetic-secret-probe\.js\.map/);
} finally {
  await unlink(probe);
}

const files = await scan(dist);
const sourceMaps = files.filter((path) => path.endsWith(".map"));
assert.ok(files.includes(resolve(dist, "index.html")), "The production entry artifact must be scanned.");
assert.ok(sourceMaps.length > 0, "The proof must include generated source maps.");
process.stdout.write(`[w08-secret-proof] PASS: positive control detected; scanned ${files.length} production artifacts including ${sourceMaps.length} source map(s), with no synthetic credential.\n`);
