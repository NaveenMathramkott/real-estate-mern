/**
 * Proves that revisiting a page re-reads the server.
 *
 * Loads the search results, publishes a new listing straight through the API,
 * then navigates away and back. The new listing has to appear — previously the
 * second visit was served from the cache and looked frozen.
 *
 * Usage: node scripts/check-freshness.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:5175";
const API = process.env.SMOKE_API ?? "http://localhost:4000/api/v1";
const PORT = 9700 + (process.pid % 150);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "fresh-"));
const TITLE = `Freshness probe ${Date.now()}`;

/**
 * Publishing needs an agent token. The e2e script keeps a reusable pair of
 * accounts on disk; this falls back to registering a throwaway one.
 */
async function agentToken() {
  const file = new URL("./.e2e-accounts.json", import.meta.url).pathname;
  const accounts = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : null;
  const candidates = accounts
    ? [accounts.AGENT, accounts.RENTER]
    : [
        {
          email: `freshness.${Date.now()}@example.com`,
          password: "Passw0rd!",
          role: "agent",
        },
      ];

  for (const account of candidates) {
    let data = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: account.email,
        password: account.password ?? "Passw0rd!",
      }),
    }).then((r) => r.json());
    if (!data.accessToken) {
      data = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password ?? "Passw0rd!",
          role: account.role ?? "agent",
          name: "Freshness",
          currency: "INR",
        }),
      }).then((r) => r.json());
    }
    if (data.accessToken) return data.accessToken;
  }
  throw new Error("could not obtain an agent token");
}

const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-web-security",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);

let wsUrl;
for (let i = 0; i < 60; i += 1) {
  try {
    const list = await (
      await fetch(`http://127.0.0.1:${PORT}/json/list`)
    ).json();
    const page = list.find((t) => t.type === "page");
    if (page) {
      wsUrl = page.webSocketDebuggerUrl;
      break;
    }
  } catch {
    /* not up yet */
  }
  await sleep(200);
}

const socket = new WebSocket(wsUrl);
await new Promise((r) => socket.addEventListener("open", r));
let id = 0;
const pending = new Map();
let requestCount = 0;
socket.addEventListener("message", (event) => {
  const m = JSON.parse(event.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
  if (m.method === "Network.requestWillBeSent") {
    if (m.params.request.url.includes("/api/v1/")) requestCount += 1;
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    socket.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (x) =>
  (
    await send("Runtime.evaluate", {
      expression: x,
      awaitPromise: true,
      returnByValue: true,
    })
  )?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(
    `${ok ? " ok " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`,
  );
  if (!ok) failures.push(label);
};

const goto = async (path) => {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await sleep(2500);
};

const body = () => evaluate(`(document.body.innerText || "")`);

/**
 * Navigates the way a visitor does — a client-side transition with no document
 * reload. This is the case that used to serve stale data: the query store
 * survives the navigation and holds a `success` record for the key.
 */
const clickNav = async (label, tries = 20) => {
  for (let i = 0; i < tries; i += 1) {
    const clicked = await evaluate(`(() => {
      const link = [...document.querySelectorAll("a")]
        .find((a) => a.textContent.trim() === ${JSON.stringify(label)});
      if (!link) return false;
      link.click();
      return true;
    })()`);
    if (clicked) {
      await sleep(2000);
      return true;
    }
    await sleep(300);
  }
  return false;
};
const waitFor = async (needle, tries = 30) => {
  for (let i = 0; i < tries; i += 1) {
    if ((await body()).includes(needle)) return true;
    await sleep(300);
  }
  return false;
};

/* ------------------------------------------------- first visit: cold load */

await goto("/search?purpose=rent");
check("search results render", await waitFor("homes for rent"));
const before = await body();
check("the probe listing is not there yet", !before.includes(TITLE));

/* ------------------------------------- something changes while we are away */

const token = await agentToken();
const created = await fetch(`${API}/properties`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: TITLE,
    type: "apartment",
    purpose: "rent",
    price: 41000,
    beds: 2,
    baths: 2,
    size: 1000,
    address: "Connaught Place, New Delhi",
    location: { type: "Point", coordinates: [77.209, 28.6139] },
  }),
}).then((r) => r.json());
check(
  "a listing was published behind the scenes",
  Boolean(created.property?._id),
);

/* --------------------------- second visit: must revalidate, not serve cache */

// Hop away and back using the header links, which are React Router
// transitions — no page reload, so nothing is reset for us.
requestCount = 0;
check("navigated away to Neighbourhoods", await clickNav("Neighbourhoods"));
check("navigated back to Properties", await clickNav("Properties"));
check("returning to search shows the new listing", await waitFor(TITLE));
check(
  "the client-side revisit hit the network",
  requestCount > 0,
  `${requestCount} api call(s)`,
);

/* ------------------------------ and a full reload is fresh, not session-cached */

requestCount = 0;
// A hard reload of the same URL. The cache used to be mirrored into
// sessionStorage, which survives a reload and froze the page.
await send("Page.reload");
await sleep(2500);
check("a hard reload still shows the new listing", await waitFor(TITLE));
check(
  "a reload hit the network",
  requestCount > 0,
  `${requestCount} api call(s)`,
);

// And once more through the router, to be sure the first hop was not a fluke.
requestCount = 0;
await clickNav("Neighbourhoods");
await clickNav("Properties");
check("a second round trip is still fresh", await waitFor(TITLE));
check(
  "the second round trip hit the network",
  requestCount > 0,
  `${requestCount} api call(s)`,
);

// Leave the database as we found it.
if (created.property?._id) {
  await fetch(`${API}/properties/${created.property._id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

console.log(
  `\n${failures.length === 0 ? "data refreshes on navigation" : `${failures.length} check(s) failed`}`,
);
socket.close();
try {
  process.kill(-chrome.pid, "SIGKILL");
} catch {
  /* ignore */
}
process.exit(failures.length === 0 ? 0 : 1);
