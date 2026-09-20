import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const targetUrl = process.argv[2] ?? "http://127.0.0.1:5173/";
const screenshotPath = resolve(
  process.argv[3] ?? "artifacts/session-003/baseline.png",
);

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known installation path.
    }
  }
  throw new Error("No supported local Chromium browser was found.");
}

async function reservePort() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "string" || address === null) {
        server.close();
        reject(new Error("Could not reserve a local debugging port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

async function waitForPage(port) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw lastError ?? new Error("Chromium debugging endpoint did not become ready.");
}

function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const browserErrors = [];
  const browserLogErrors = [];
  let nextId = 1;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }

    if (message.method === "Runtime.exceptionThrown") {
      browserErrors.push(message.params.exceptionDetails.text);
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      browserErrors.push("console.error");
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      browserLogErrors.push(message.params.entry.text);
    }
  });

  const opened = new Promise((resolveOpen, reject) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  async function send(method, params = {}) {
    await opened;
    const id = nextId;
    nextId += 1;
    const response = new Promise((resolveResponse, reject) => {
      pending.set(id, { resolve: resolveResponse, reject });
    });
    socket.send(JSON.stringify({ id, method, params }));
    return await response;
  }

  return { socket, send, browserErrors, browserLogErrors };
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }
  return response.result.value;
}

async function readUi(send) {
  return await evaluate(
    send,
    `(() => ({
      readyState: document.readyState,
      score: document.querySelector('#score')?.textContent,
      status: document.querySelector('#status')?.textContent,
      restartDisabled: document.querySelector('#restart-button')?.disabled,
      warningHidden: document.querySelector('#config-warning')?.hidden,
      canvas: (() => {
        const canvas = document.querySelector('#game-canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: rect.width,
          clientHeight: rect.height,
          top: rect.top,
          bottom: rect.bottom
        };
      })(),
      viewportHeight: window.innerHeight
    }))()`,
  );
}

async function pollUi(send, predicate, label) {
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await readUi(send);
    if (predicate(latest)) return latest;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
  }
  throw new Error(`${label} was not observed. Last UI state: ${JSON.stringify(latest)}`);
}

async function pressKey(send, { key, code, keyCode }) {
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
}

const chrome = await findChrome();
const port = await reservePort();
const profilePrefix = join(tmpdir(), "skyline-stack-smoke-");
const profile = await mkdtemp(profilePrefix);
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-gpu",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1280,1100",
    targetUrl,
  ],
  { stdio: "ignore" },
);

let cdp;
try {
  const page = await waitForPage(port);
  cdp = connectCdp(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Log.enable");

  const initial = await pollUi(
    cdp.send,
    (ui) => ui.readyState === "complete" && ui.status === "Ready" && ui.score === "0",
    "Initial Ready state",
  );

  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  const afterSuccess = await pollUi(
    cdp.send,
    (ui) => ui.status === "Playing" && ui.score === "1",
    "Successful first placement",
  );

  await mkdir(dirname(screenshotPath), { recursive: true });
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  const gameOver = await pollUi(
    cdp.send,
    (ui) => ui.status === "Game Over" && ui.score === "1" && !ui.restartDisabled,
    "Game Over state",
  );

  await pressKey(cdp.send, { key: "r", code: "KeyR", keyCode: 82 });
  const afterRestart = await pollUi(
    cdp.send,
    (ui) => ui.status === "Ready" && ui.score === "0" && ui.restartDisabled,
    "Restarted Ready state",
  );

  const result = {
    browser: chrome,
    url: targetUrl,
    screenshot: screenshotPath,
    initial,
    afterSuccess,
    gameOver,
    afterRestart,
    browserErrors: cdp.browserErrors,
    browserLogErrors: cdp.browserLogErrors,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (cdp.browserErrors.length > 0) process.exitCode = 1;
} finally {
  if (cdp?.socket.readyState === WebSocket.OPEN) cdp.socket.close();
  browser.kill();
  if (browser.exitCode === null) {
    await Promise.race([
      once(browser, "exit"),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
    ]);
  }

  const resolvedTemp = resolve(tmpdir());
  const resolvedProfile = resolve(profile);
  if (
    dirname(resolvedProfile) === resolvedTemp &&
    resolvedProfile.startsWith(resolve(profilePrefix))
  ) {
    await rm(resolvedProfile, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}
