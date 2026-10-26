// Synthetic, fake-provider comparison against the recorded W08 starting commit.
// Run with: node --import tsx scripts/w08-prepost-probes.mjs baseline|current
import { createServer, request as httpRequest } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

process.env.AI_COACH_PROVIDER = "fake";
const target = process.argv[2];
if (target !== "baseline" && target !== "current") {
  throw new Error("Choose baseline or current");
}
const root = resolve(target === "baseline" ? ".w08-baseline" : ".");
const load = (relative) => import(pathToFileURL(resolve(root, relative)).href);
const { createCoachServer } = await load("server/index.ts");
const { createProductionNextDrillHandler } = await load("api/ai/next-drill.ts");
const { fakeCoachProvider } = await load("server/providers/fake-provider.ts");
const { fakeAgentProvider } = await load("server/providers/fake-agent-provider.ts");

const input = {
  goal: "choose_next_drill", finalScore: 1, startingWidth: 100,
  drops: [
    { floor: 1, offsetPx: 10, direction: 1, timing: "late", widthBefore: 100, widthAfter: 90 },
    { floor: 2, offsetPx: 90, direction: 1, timing: "late", widthBefore: 90, widthAfter: 0 },
  ],
};
const body = JSON.stringify(input);
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function withServer(server, run) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  try { return await run(address.port); }
  finally { await new Promise((done) => server.close(done)); }
}

function post(port, headers = {}) {
  return fetch(`http://127.0.0.1:${port}/api/ai/next-drill`, {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body,
  });
}

// T02: all bytes are valid but the client waits beyond the declared receive deadline.
const t02 = await withServer(createCoachServer(fakeCoachProvider, {}, {}, fakeAgentProvider), async (port) => {
  let responseObservedBeforeFinish = false;
  let status = null;
  let requestError = null;
  const first = body.slice(0, Math.floor(body.length / 2));
  const rest = body.slice(first.length);
  const client = httpRequest({ host: "127.0.0.1", port, method: "POST", path: "/api/ai/next-drill",
    headers: { "content-type": "application/json", "transfer-encoding": "chunked" } });
  const result = new Promise((done) => {
    client.on("response", (response) => {
      status = response.statusCode ?? null;
      response.resume();
      response.on("end", done);
      response.on("close", done);
    });
    client.on("error", (error) => { requestError = error.code ?? error.name; done(); });
  });
  client.write(first);
  await wait(5_300);
  responseObservedBeforeFinish = status !== null;
  if (status === null && !client.destroyed) client.end(rest);
  else client.destroy();
  await Promise.race([result, wait(1_500)]);
  return { responseObservedBeforeFinish, status, requestError };
});

// T13: three valid concurrent requests hold their first underlying provider call.
let active = 0;
let maxActive = 0;
let release;
const gate = new Promise((done) => { release = done; });
const delayedProvider = {
  ...fakeAgentProvider,
  async generate(context, options) {
    active += 1;
    maxActive = Math.max(maxActive, active);
    try {
      if (context.step === 1) await gate;
      return await fakeAgentProvider.generate(context, options);
    } finally { active -= 1; }
  },
};
const t13 = await withServer(createCoachServer(fakeCoachProvider, {}, {}, delayedProvider), async (port) => {
  const pending = [post(port), post(port), post(port)];
  await wait(300);
  const maxWhileHeld = maxActive;
  release();
  const statuses = await Promise.all(pending.map(async (promise) => (await promise).status));
  return { maxWhileHeld, maxActive, statuses };
});

// T17: the same local caller supplies six different X-Forwarded-For values.
const t17 = await withServer(createServer(createProductionNextDrillHandler(fakeAgentProvider)), async (port) => {
  const statuses = [];
  for (let i = 1; i <= 6; i += 1) {
    statuses.push((await post(port, { "x-forwarded-for": `198.51.100.${i}` })).status);
  }
  return { statuses };
});

console.log(JSON.stringify({ target, t02, t13, t17 }));
