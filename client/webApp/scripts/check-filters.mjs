import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Checks the active-filter chips: adding filters must produce one removable
 * chip per facet, and "Clear all" must empty the whole set.
 *
 * Usage: node scripts/check-filters.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:5175";
const PORT = 9800 + (process.pid % 150);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "chips-"));

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
socket.addEventListener("message", (event) => {
  const m = JSON.parse(event.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const waitFor = async (needle, tries = 40) => {
  for (let i = 0; i < tries; i += 1) {
    const body = await evaluate(
      `(document.body.innerText || "").toLowerCase()`,
    );
    if (body.toLowerCase().includes(needle.toLowerCase())) return true;
    await sleep(250);
  }
  return false;
};

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(
    `${ok ? " ok " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`,
  );
  if (!ok) failures.push(label);
};

// Chips live in the row above the results, each a button whose label is its
// own text and whose trailing cross clears that one facet.
const chipLabels = () =>
  evaluate(`JSON.stringify(
    [...document.querySelectorAll("button")]
      .filter((b) => b.querySelector("svg.lucide-x"))
      .map((b) => b.textContent.trim())
  )`);

const clickChipContaining = (needle) =>
  evaluate(`(() => {
    const button = [...document.querySelectorAll("button")]
      .find((b) => b.querySelector("svg.lucide-x") &&
                   b.textContent.toLowerCase().includes(${JSON.stringify(needle)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);

await send("Page.navigate", {
  url: `${BASE}/search?purpose=rent&beds=2&type=apartment`,
});
await sleep(3000);
await waitFor("filters");

let chips = JSON.parse(await chipLabels());
console.log("chips from the url:", chips);
check("url filters become chips", chips.length >= 2, chips.join(" | "));
check(
  "a 'Clear all' control appears once several filters are set",
  await evaluate(
    `[...document.querySelectorAll("button")]
       .some((b) => b.textContent.trim().toLowerCase() === "clear all")`,
  ),
);

// Add one more facet through the panel, then clear everything.
await evaluate(`(() => {
  const button = [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim() === "Commercial");
  button?.click();
  return Boolean(button);
})()`);
await sleep(1500);
chips = JSON.parse(await chipLabels());
check("a new filter adds another chip", chips.length >= 3, chips.join(" | "));

const cleared = await evaluate(`(() => {
  const button = [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim().toLowerCase() === "clear all");
  if (!button) return "missing";
  button.click();
  return "clicked";
})()`);
await sleep(1800);
chips = JSON.parse(await chipLabels());
check(
  "Clear all empties the chip row",
  cleared === "clicked" && chips.length === 0,
  chips.join(" | "),
);

// And the search itself must have gone back to the unfiltered result set.
const purposeStillSet = await evaluate(
  `document.body.innerText.includes("homes for sale")`,
);
check("purpose reset with the rest", !purposeStillSet);

// Single chip removal.
await send("Page.navigate", { url: `${BASE}/search?purpose=rent&beds=3` });
await sleep(3000);
await waitFor("filters");
const removedOne = await clickChipContaining("3+ beds");
await sleep(1500);
chips = JSON.parse(await chipLabels());
check(
  "removing one chip leaves the others",
  removedOne && chips.length === 1,
  chips.join(" | "),
);

console.log(
  `\n${failures.length === 0 ? "filter chips behave" : `${failures.length} check(s) failed`}`,
);
socket.close();
try {
  process.kill(-chrome.pid, "SIGKILL");
} catch {
  /* ignore */
}
process.exit(failures.length === 0 ? 0 : 1);
