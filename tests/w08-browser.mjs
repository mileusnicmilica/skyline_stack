import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, access, mkdtemp, rm } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// T04/T05/T16: run against the built page, with actual Chromium rendering.
// The HTTP responses are synthetic and intercepted at the network boundary;
// the application code and its CSP run unchanged.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vite = resolve(root, "node_modules/vite/bin/vite.js");
const chromeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

async function findChrome() {
  for (const path of chromeCandidates) {
    try { await access(path); return path; } catch { /* Check the next installation. */ }
  }
  throw new Error("No local Chromium or Edge browser was found.");
}

async function reservePort() {
  const server = createNetServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No TCP port was reserved.");
  await new Promise((done) => server.close(done));
  return address.port;
}

async function poll(action, label, maxAttempts = 100) {
  let lastError;
  for (let index = 0; index < maxAttempts; index += 1) {
    try {
      const value = await action();
      if (value !== null && value !== undefined && value !== false) return value;
    } catch (error) { lastError = error; }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`${label} was not observed${lastError ? `: ${lastError.message}` : ""}.`);
}

function connectCdp(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  const events = [];
  let nextId = 1;
  const open = new Promise((done, fail) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.fail(new Error(message.error.message));
      else request.done(message.result);
      return;
    }
    events.push(message);
    if (message.method === "Fetch.requestPaused" && onRequest) {
      void onRequest(message.params).catch((error) => interceptionErrors.push(error));
    }
  });
  let onRequest = null;
  const interceptionErrors = [];
  async function send(method, params = {}) {
    await open;
    const id = nextId++;
    const response = new Promise((done, fail) => pending.set(id, { done, fail }));
    socket.send(JSON.stringify({ id, method, params }));
    return await response;
  }
  return { socket, send, events, interceptionErrors, setRequestHandler: (handler) => { onRequest = handler; } };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function pressSpace(cdp) {
  const key = { key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 };
  await cdp.send("Input.dispatchKeyEvent", { ...key, type: "keyDown" });
  await cdp.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
}

async function click(cdp, selector) {
  const point = await evaluate(cdp, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({ block: "center" });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  assert.ok(point, `Missing ${selector}`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}

async function ui(cdp) {
  return await evaluate(cdp, `(() => ({
    url: location.href,
    readyState: document.readyState,
    canvasWidth: document.querySelector("#game-canvas")?.width,
    status: document.querySelector("#status")?.textContent,
    score: document.querySelector("#score")?.textContent,
    drillTitle: document.querySelector("#next-drill-title")?.textContent,
    drillInstruction: document.querySelector("#next-drill-instruction")?.textContent,
    drillResultHidden: document.querySelector("#next-drill-result")?.hidden,
    coachHeadline: document.querySelector("#coach-headline")?.textContent,
    coachTip: document.querySelector("#coach-tip")?.textContent,
    coachAdviceHidden: document.querySelector("#coach-advice")?.hidden,
    dangerousNodeCount: document.querySelectorAll("#coach-panel script, #coach-panel img, #coach-panel svg, #coach-panel iframe, #coach-panel a, #coach-panel [onerror], #coach-panel [onload], #next-drill-panel script, #next-drill-panel img, #next-drill-panel svg, #next-drill-panel iframe, #next-drill-panel a, #next-drill-panel [onerror], #next-drill-panel [onload]").length,
    xssExecuted: window.__w08XssExecuted === true,
    cspExecuted: window.__w08CspExecuted === true
  }))()`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2000))]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

const xss = '<img src="x" onerror="window.__w08XssExecuted=true">';
const rawHtml = '<svg onload="window.__w08XssExecuted=true"></svg> javascript:alert(1)';
const finding = "Kasna pu\u0161tanja su \u010de\u0161\u0107a od ranih.";
const drill = (title, instruction) => ({
  success: true,
  recommendation: {
    drillId: "release_earlier", title, instruction,
    evidence: { earlyCount: 0, lateCount: 2, centeredCount: 0, finding },
    runId: "synthetic-browser-test", stopReason: "goal_completed",
  },
});
const coach = (headline, tip) => ({
  success: true,
  advice: { headline, timingBias: "late", biggestMistakeFloor: 2, tip },
});
const replies = {
  "/api/ai/coach": [
    coach(xss, rawHtml),
    coach("Ve\u017eba za ritam", "Sa\u010dekaj, pa pusti: a < b, Marko's potez."),
  ],
  "/api/ai/next-drill": [
    drill(xss, rawHtml),
    drill("Ve\u017eba za ritam", "Sa\u010dekaj, pa pusti: a < b, Marko's potez."),
  ],
};

let preview;
let browser;
let cdp;
let profile;
let probeServer;
try {
  await access(resolve(root, "dist/index.html"));
  const chrome = await findChrome();
  const previewPort = await reservePort();
  const debuggingPort = await reservePort();
  const previewUrl = `http://127.0.0.1:${previewPort}/`;
  const probePort = await reservePort();
  const probeUrl = `http://127.0.0.1:${probePort}/reachable-probe.js`;
  let probeRequests = 0;
  probeServer = createHttpServer((request, response) => {
    if (request.url !== "/reachable-probe.js") { response.writeHead(404).end(); return; }
    probeRequests += 1;
    response.writeHead(200, {
      "content-type": "application/javascript",
      "access-control-allow-origin": "*",
    });
    response.end("window.__w08CspExecuted = true;");
  });
  probeServer.listen(probePort, "127.0.0.1");
  await once(probeServer, "listening");
  assert.equal((await fetch(probeUrl)).status, 200, "CSP probe must be a reachable script");
  const baselineProbeRequests = probeRequests;

  preview = spawn(process.execPath, [vite, "preview", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort"], {
    cwd: root, stdio: "ignore",
  });
  const pageResponse = await poll(async () => {
    if (preview.exitCode !== null) throw new Error(`Vite preview exited ${preview.exitCode}`);
    const response = await fetch(previewUrl);
    return response.ok ? response : null;
  }, "Vite production preview");
  const csp = pageResponse.headers.get("content-security-policy");
  const nosniff = pageResponse.headers.get("x-content-type-options");
  const referrer = pageResponse.headers.get("referrer-policy");
  assert.ok(csp?.includes("script-src 'self'"), "Active script-src 'self' CSP header is required");
  assert.equal(pageResponse.headers.get("content-security-policy-report-only"), null);
  assert.equal(nosniff, "nosniff");
  assert.equal(referrer, "no-referrer");
  const html = await pageResponse.text();
  const assetPath = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  assert.ok(assetPath, "Built HTML must reference a script asset");
  const assetResponse = await fetch(new URL(assetPath, previewUrl));
  assert.equal(assetResponse.status, 200);
  assert.equal(assetResponse.headers.get("content-security-policy"), csp);
  assert.equal(assetResponse.headers.get("x-content-type-options"), nosniff);
  assert.equal(assetResponse.headers.get("referrer-policy"), referrer);

  const vercel = JSON.parse(await readFile(resolve(root, "vercel.json"), "utf8"));
  const vercelHeaders = Object.fromEntries(vercel.headers?.find((rule) => rule.source === "/(.*)")?.headers?.map(({ key, value }) => [key.toLowerCase(), value]) ?? []);
  assert.equal(vercelHeaders["content-security-policy"], csp, "Vercel and preview CSP must match");
  assert.equal(vercelHeaders["x-content-type-options"], nosniff);
  assert.equal(vercelHeaders["referrer-policy"], referrer);

  profile = await mkdtemp(join(tmpdir(), "skyline-w08-browser-"));
  browser = spawn(chrome, [
    "--headless=new", "--disable-background-networking", "--disable-component-update",
    "--disable-default-apps", "--disable-gpu", "--disable-sync", "--no-first-run",
    "--no-sandbox", `--remote-debugging-port=${debuggingPort}`, `--user-data-dir=${profile}`,
    "--window-size=1280,1100", "about:blank",
  ], { stdio: "ignore" });
  const page = await poll(async () => {
    const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
    const pages = await response.json();
    return pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl) ?? null;
  }, "Chromium debugging page");
  cdp = connectCdp(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
  cdp.setRequestHandler(async ({ requestId, request }) => {
    const path = new URL(request.url).pathname;
    const response = replies[path]?.shift();
    if (!response) throw new Error(`Unexpected intercepted request: ${path}`);
    await cdp.send("Fetch.fulfillRequest", {
      requestId, responseCode: 200,
      responseHeaders: [{ name: "content-type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(response), "utf8").toString("base64"),
    });
  });
  await cdp.send("Fetch.enable", { patterns: [
    { urlPattern: "*://*/api/ai/coach", requestStage: "Request" },
    { urlPattern: "*://*/api/ai/next-drill", requestStage: "Request" },
  ] });
  await cdp.send("Page.navigate", { url: previewUrl });
  await poll(async () => {
    const state = await ui(cdp);
    return state.readyState === "complete" && state.canvasWidth > 300 && state.status === "Ready";
  }, "Ready game state");
  await evaluate(cdp, "window.__w08XssExecuted = false; window.__w08CspExecuted = false; true");

  // A reachable cross-origin classic script would execute without script-src 'self'.
  // Runtime.evaluate only appends the element. It does not bypass page CSP.
  await evaluate(cdp, `(() => {
    const script = document.createElement("script");
    script.src = ${JSON.stringify(probeUrl)};
    document.body.append(script);
    return true;
  })()`);
  const violation = await poll(() => cdp.events.find((event) =>
    event.method === "Log.entryAdded" &&
    event.params.entry.text.includes(probeUrl) &&
    event.params.entry.text.includes("script-src 'self'")), "script-src CSP violation");
  assert.equal((await ui(cdp)).cspExecuted, false);
  assert.equal(probeRequests, baselineProbeRequests, "CSP must block the network request");

  // Follow the same timed gameplay sequence as the established production smoke.
  await pressSpace(cdp);
  await poll(async () => (await ui(cdp)).score === "1", "first successful placement");
  await new Promise((done) => setTimeout(done, 875));
  await pressSpace(cdp);
  await poll(async () => (await ui(cdp)).score === "2", "second placement");
  await new Promise((done) => setTimeout(done, 2625));
  await pressSpace(cdp);
  await poll(async () => (await ui(cdp)).status === "Game Over", "Game Over controls");

  await click(cdp, "#analyze-button");
  const hostileCoach = await poll(async () => {
    const state = await ui(cdp);
    return !state.coachAdviceHidden && state.coachHeadline === xss ? state : null;
  }, "W04 hostile text render");
  assert.equal(hostileCoach.coachTip, rawHtml);
  assert.equal(hostileCoach.dangerousNodeCount, 0);
  assert.equal(hostileCoach.xssExecuted, false);
  assert.equal(hostileCoach.url, previewUrl, "W04 URL text must not navigate");

  await click(cdp, "#next-drill-button");
  const hostileDrill = await poll(async () => {
    const state = await ui(cdp);
    return !state.drillResultHidden && state.drillTitle === xss ? state : null;
  }, "W05 hostile text render");
  assert.equal(hostileDrill.drillInstruction, rawHtml);
  assert.equal(hostileDrill.dangerousNodeCount, 0);
  assert.equal(hostileDrill.xssExecuted, false);
  assert.equal(hostileDrill.url, previewUrl, "W05 URL text must not navigate");

  await click(cdp, "#analyze-button");
  const normalCoach = await poll(async () => {
    const state = await ui(cdp);
    return state.coachHeadline === "Ve\u017eba za ritam" ? state : null;
  }, "W04 normal Serbian text");
  assert.equal(normalCoach.coachTip, "Sa\u010dekaj, pa pusti: a < b, Marko's potez.");
  await click(cdp, "#next-drill-button");
  const normalDrill = await poll(async () => {
    const state = await ui(cdp);
    return state.drillTitle === "Ve\u017eba za ritam" ? state : null;
  }, "W05 normal Serbian text");
  assert.equal(normalDrill.drillInstruction, "Sa\u010dekaj, pa pusti: a < b, Marko's potez.");
  assert.equal(normalDrill.dangerousNodeCount, 0);
  assert.equal(normalDrill.xssExecuted, false);
  assert.equal(normalDrill.cspExecuted, false);
  assert.deepEqual(replies, { "/api/ai/coach": [], "/api/ai/next-drill": [] });
  assert.deepEqual(cdp.interceptionErrors, []);
  assert.equal(cdp.events.filter((event) => event.method === "Runtime.exceptionThrown").length, 0);

  process.stdout.write(`${JSON.stringify({
    tests: ["T04", "T05", "T16"],
    browser: chrome,
    previewUrl,
    headers: { csp, nosniff, referrer },
    blockedResource: probeUrl,
    blockedDirective: "script-src 'self'",
    cspViolation: violation.params.entry.text,
    dangerousNodeCount: normalDrill.dangerousNodeCount,
    xssExecuted: normalDrill.xssExecuted,
    normalCoach: { headline: normalCoach.coachHeadline, tip: normalCoach.coachTip },
    normalDrill: { title: normalDrill.drillTitle, instruction: normalDrill.drillInstruction },
    gameplayStatus: normalDrill.status,
  }, null, 2)}\n`);
} finally {
  if (cdp?.socket.readyState === WebSocket.OPEN) cdp.socket.close();
  await Promise.all([stopProcess(browser), stopProcess(preview)]);
  if (probeServer?.listening) await new Promise((done) => probeServer.close(done));
  if (profile && dirname(resolve(profile)) === resolve(tmpdir())) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
