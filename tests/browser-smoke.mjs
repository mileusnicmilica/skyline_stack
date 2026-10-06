import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const targetUrl = process.argv[2] ?? "http://127.0.0.1:5173/";
const screenshotPath = resolve(
  process.argv[3] ?? "artifacts/crane-tower/smoke.png",
);

const chromeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
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
      analyzeHidden: document.querySelector('#analyze-button')?.hidden,
      analyzeDisabled: document.querySelector('#analyze-button')?.disabled,
      nextDrillHidden: document.querySelector('#next-drill-button')?.hidden,
      nextDrillDisabled: document.querySelector('#next-drill-button')?.disabled,
      nextDrillPanelHidden: document.querySelector('#next-drill-panel')?.hidden,
      nextDrillMessageHidden: document.querySelector('#next-drill-message')?.hidden,
      nextDrillResultHidden: document.querySelector('#next-drill-result')?.hidden,
      nextDrillMessage: document.querySelector('#next-drill-message')?.textContent,
      nextDrillTitle: document.querySelector('#next-drill-title')?.textContent,
      nextDrillFinding: document.querySelector('#next-drill-finding')?.textContent,
      coachPanelHidden: document.querySelector('#coach-panel')?.hidden,
      coachMessage: document.querySelector('#coach-message')?.textContent,
      coachHeadline: document.querySelector('#coach-headline')?.textContent,
      coachTip: document.querySelector('#coach-tip')?.textContent,
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

async function clickElement(send, selector) {
  const point = await evaluate(send, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  if (!point) throw new Error(`Cannot click missing element ${selector}.`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
}

async function wait(milliseconds) {
  await new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

const chrome = await findChrome();
const port = await reservePort();
const profileRoot = resolve(tmpdir());
const profilePrefix = join(profileRoot, "skyline-stack-smoke-");
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
    "--no-sandbox",
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

  // The bounded crane floor reaches the right edge while staying entirely
  // inside the Canvas. This creates one partial landing, narrowing the next
  // floor enough that the following left-edge release is a genuine full miss.
  await wait(875);
  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  const afterPartial = await pollUi(
    cdp.send,
    (ui) => ui.status === "Playing" && ui.score === "2",
    "Bounded right-edge partial placement",
  );

  await wait(2_625);
  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  const gameOver = await pollUi(
    cdp.send,
    (ui) => ui.status === "Game Over" && ui.score === "2" && !ui.restartDisabled &&
      !ui.analyzeHidden && !ui.analyzeDisabled && !ui.nextDrillHidden && !ui.nextDrillDisabled,
    "Game Over state",
  );

  await clickElement(cdp.send, "#analyze-button");
  const coachSuccess = await pollUi(
    cdp.send,
    (ui) => !ui.coachPanelHidden && Boolean(ui.coachHeadline) && Boolean(ui.coachTip) &&
      !ui.restartDisabled && !ui.analyzeDisabled,
    "Fake coach success state",
  );

  await clickElement(cdp.send, "#next-drill-button");
  const nextDrillSuccess = await pollUi(
    cdp.send,
    (ui) => !ui.nextDrillPanelHidden && ui.nextDrillMessageHidden && !ui.nextDrillResultHidden &&
      Boolean(ui.nextDrillTitle) && Boolean(ui.nextDrillFinding) &&
      !ui.nextDrillDisabled && !ui.restartDisabled,
    "Fake next-drill success state",
  );

  await pressKey(cdp.send, { key: "r", code: "KeyR", keyCode: 82 });
  const afterRestart = await pollUi(
    cdp.send,
    (ui) => ui.status === "Ready" && ui.score === "0" && ui.restartDisabled &&
      ui.analyzeHidden && ui.coachPanelHidden && ui.nextDrillHidden && ui.nextDrillPanelHidden,
    "Restarted Ready state",
  );

  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  await pollUi(cdp.send, (ui) => ui.status === "Playing" && ui.score === "1", "Second run first placement");
  await wait(875);
  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  await pollUi(cdp.send, (ui) => ui.status === "Playing" && ui.score === "2", "Second run partial placement");
  await wait(2_625);
  await pressKey(cdp.send, { key: " ", code: "Space", keyCode: 32 });
  await pollUi(cdp.send, (ui) => ui.status === "Game Over" && !ui.analyzeHidden, "Second Game Over state");

  await cdp.send("Network.enable");
  await cdp.send("Network.setBlockedURLs", { urls: ["*/api/ai/coach"] });
  await clickElement(cdp.send, "#analyze-button");
  const coachUnavailable = await pollUi(
    cdp.send,
    (ui) => ui.coachMessage === "AI analiza trenutno nije dostupna." &&
      !ui.restartDisabled && !ui.analyzeDisabled,
    "Fake coach failure state",
  );
  await cdp.send("Network.setBlockedURLs", { urls: [] });

  await cdp.send("Network.setBlockedURLs", { urls: ["*/api/ai/next-drill"] });
  await clickElement(cdp.send, "#next-drill-button");
  const nextDrillUnavailable = await pollUi(
    cdp.send,
    (ui) => ui.nextDrillMessage === "Sledeća vežba trenutno nije dostupna." &&
      !ui.restartDisabled && !ui.nextDrillDisabled,
    "Fake next-drill failure state",
  );
  await cdp.send("Network.setBlockedURLs", { urls: [] });

  await evaluate(cdp.send, `(() => {
    window.__originalFetch = window.fetch;
    window.__nextDrillResolve = null;
    window.fetch = (input, options) => String(input).includes('/api/ai/next-drill')
      ? new Promise((resolve) => { window.__nextDrillResolve = resolve; })
      : window.__originalFetch(input, options);
    return true;
  })()`);
  await clickElement(cdp.send, "#next-drill-button");
  const nextDrillPending = await pollUi(
    cdp.send,
    (ui) => ui.nextDrillDisabled && ui.nextDrillMessage === "Tražim sledeću vežbu…",
    "Pending next-drill state",
  );

  await pressKey(cdp.send, { key: "r", code: "KeyR", keyCode: 82 });
  const afterPendingRestart = await pollUi(
    cdp.send,
    (ui) => ui.status === "Ready" && ui.score === "0" && ui.restartDisabled &&
      ui.analyzeHidden && ui.coachPanelHidden && ui.nextDrillHidden && ui.nextDrillPanelHidden,
    "Restart while next-drill request is pending",
  );
  await evaluate(cdp.send, `(() => {
    window.__nextDrillResolve(new Response(JSON.stringify({ success: true, recommendation: {
      drillId: 'release_earlier', title: 'Vežbaj ranije puštanje',
      instruction: 'Pusti blok malo pre sredine tornja.',
      evidence: { earlyCount: 0, lateCount: 2, centeredCount: 0, finding: 'Kasna puštanja su češća od ranih.' },
      runId: 'stale-smoke', stopReason: 'goal_completed'
    }}), { status: 200, headers: { 'content-type': 'application/json' } }));
    window.fetch = window.__originalFetch;
    return true;
  })()`);
  await wait(150);
  const afterStaleResponse = await readUi(cdp.send);
  if (!afterStaleResponse.nextDrillPanelHidden || afterStaleResponse.nextDrillTitle !== "") {
    throw new Error(`Stale next-drill response appeared after Restart: ${JSON.stringify(afterStaleResponse)}`);
  }

  const result = {
    browser: chrome,
    url: targetUrl,
    screenshot: screenshotPath,
    initial,
    afterSuccess,
    afterPartial,
    gameOver,
    coachSuccess,
    nextDrillSuccess,
    afterRestart,
    coachUnavailable,
    nextDrillUnavailable,
    nextDrillPending,
    afterPendingRestart,
    afterStaleResponse,
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

  const resolvedProfileRoot = resolve(profileRoot);
  const resolvedProfile = resolve(profile);
  if (
    dirname(resolvedProfile) === resolvedProfileRoot &&
    basename(resolvedProfile).startsWith("skyline-stack-smoke-")
  ) {
    await rm(resolvedProfile, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}
