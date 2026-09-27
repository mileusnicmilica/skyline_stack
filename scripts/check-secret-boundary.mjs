import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function git(...args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const tracked = git("ls-files", "-z").split("\0").filter(Boolean);
const trackedEnvironmentFiles = tracked.filter((path) => /^\.env(?:\.|$)/.test(path) && path !== ".env.example");
const failures = [];
if (trackedEnvironmentFiles.length > 0) failures.push("A real environment file is tracked by Git.");

const trackedText = tracked.map((path) => readText(join(projectRoot, path))).join("\n");
const bundleText = listFiles(join(projectRoot, "dist")).map(readText).join("\n");
const historyText = git("log", "-p", "--all", "--format=");
const searchable = `${trackedText}\n${bundleText}\n${historyText}`;

if (/AIza[0-9A-Za-z_-]{35}/.test(searchable)) {
  failures.push("A value matching a Google API key was found in tracked files, history, or dist.");
}
if (/GEMINI_API_KEY[ \t]*=[ \t]*["']?[^\s#"'`]+/.test(searchable)) {
  failures.push("A non-empty GEMINI_API_KEY assignment was found in tracked files, history, or dist.");
}
if (/VITE_[A-Z0-9_]*(?:KEY|SECRET|TOKEN)[ \t]*=/.test(searchable)) {
  failures.push("A VITE_-prefixed secret assignment was found.");
}

const localEnvPath = join(projectRoot, ".env");
if (existsSync(localEnvPath)) {
  const match = readText(localEnvPath).match(/^GEMINI_API_KEY[ \t]*=[ \t]*["']?([^\s#"']+)/m);
  const localKey = match?.[1];
  if (localKey && searchable.includes(localKey)) {
    failures.push("The local Gemini key value appears in tracked files, history, or dist.");
  }
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`[secret-boundary] FAIL: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("[secret-boundary] PASS: no provider secret found in tracked files, Git history, or dist.\n");
}
