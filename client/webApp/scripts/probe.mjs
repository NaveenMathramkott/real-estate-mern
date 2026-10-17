import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2];
const API = process.env.SMOKE_API ?? "http://localhost:4000/api/v1";
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];
const PATHS = process.argv.slice(5);
const PORT = 9600 + (process.pid % 300);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "probe-"));

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
  } catch {}
  await sleep(200);
}
const sock = new WebSocket(wsUrl);
await new Promise((r) => sock.addEventListener("open", r));
let id = 0;
const pending = new Map();
const events = [];
sock.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  } else if (m.method) events.push(m);
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    sock.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (x) =>
  (
    await send("Runtime.evaluate", {
      expression: x,
      awaitPromise: true,
      returnByValue: true,
    })
  )?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
  window.__log=[];
  for (const m of ["error","warn"]) {
    const orig = console[m];
    console[m] = function(...a){ window.__log.push(m+": "+a.map(x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch{return String(x)}}).join(" ")); orig.apply(console,a); };
  }
`,
});

const res = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const data = await res.json();
console.log("login:", res.status, data.user?.email, data.user?.role);
await send("Page.navigate", { url: `${BASE}/` });
await sleep(2000);
await ev(
  `localStorage.setItem("web:accessToken", ${JSON.stringify(data.accessToken)}); true`,
);

for (const path of PATHS) {
  events.length = 0;
  await send("Page.navigate", { url: `${BASE}${path}` });
  await sleep(2500);
  const out = await ev(`JSON.stringify({
    text: (document.body.innerText||"").slice(0,900),
    log: window.__log||[]
  })`);
  const parsed = JSON.parse(out);
  console.log(`\n===== ${path}\n${parsed.text}`);
  for (const l of parsed.log.slice(0, 5)) console.log("  !", l.slice(0, 200));
}
try {
  process.kill(-chrome.pid, "SIGKILL");
} catch {}
process.exit(0);
