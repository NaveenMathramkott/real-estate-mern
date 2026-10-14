/**
 * Minimal CDP smoke test.
 *
 * Chrome is launched headless with a remote debugging port; this script signs
 * in by writing the access token into localStorage, then visits each route and
 * reports whether the page rendered or hit the error boundary.
 *
 * Usage: node scripts/smoke.mjs [baseUrl] [email] [password]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:5175";
const API = process.env.SMOKE_API ?? "http://localhost:4000/api/v1";
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];
const PORT = Number(process.env.SMOKE_PORT ?? 0) ||
  9300 + (process.pid % 400);

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const profile = mkdtempSync(join(tmpdir(), "smoke-"));
const chrome = spawn(
  CHROME,
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error("Chrome never exposed a debugging target");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      } else if (message.method) {
        this.events.push(message);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return result?.result?.value;
  }
}

const ROUTES = [
  "/",
  "/search",
  "/areas",
  "/buildings",
  "/agencies",
  "/login",
  "/register",
  "/dashboard",
  "/saved",
  "/saved-searches",
  "/messages",
  "/notifications",
  "/reviews",
  "/profile",
  "/listings",
  "/listings/new",
  "/inquiries",
  "/nonexistent",
];

async function main() {
  const ws = await targetWs();
  const socket = new WebSocket(ws);
  await new Promise((resolve) => socket.addEventListener("open", resolve));
  const cdp = new Cdp(socket);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  if (EMAIL && PASSWORD) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const data = await res.json();
    if (!data.accessToken) throw new Error(`login failed: ${JSON.stringify(data)}`);
    console.log(`signed in as ${data.user.email} (${data.user.role})\n`);

    await cdp.send("Page.navigate", { url: `${BASE}/` });
    await sleep(1500);
    await cdp.evaluate(
      `localStorage.setItem("web:accessToken", ${JSON.stringify(data.accessToken)}); true`,
    );
  }

  let failures = 0;
  for (const route of ROUTES) {
    cdp.events.length = 0;
    await cdp.send("Page.navigate", { url: `${BASE}${route}` });
    await sleep(2200);

    const report = await cdp.evaluate(`(() => {
      const root = document.getElementById("root");
      const text = (document.body.innerText || "").trim();
      const heading = document.querySelector("h1,h2,h3")?.innerText?.trim() ?? "";
      return JSON.stringify({
        nodes: root ? root.querySelectorAll("*").length : 0,
        crashed: text.includes("The site failed to start"),
        len: text.length,
        heading: heading.slice(0, 70),
        login: text.includes("Welcome back") && text.includes("Sign in"),
      });
    })()`);

    const info = JSON.parse(report);
    const blank = info.nodes === 0 || info.len < 40;
    const bad = info.crashed || blank;
    if (bad) failures += 1;
    console.log(
      `${bad ? "FAIL" : " ok "}  ${route.padEnd(24)} nodes=${String(info.nodes).padEnd(5)} ${info.heading}`,
    );

    const errors = cdp.events
      .filter(
        (e) =>
          e.method === "Runtime.consoleAPICalled" &&
          e.params.type === "error",
      )
      .map((e) =>
        e.params.args
          .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
          .join(" "),
      );
    for (const message of errors.slice(0, 2)) {
      console.log(`        console.error → ${message.replace(/\s+/g, " ").slice(0, 200)}`);
    }
  }

  console.log(`\n${failures === 0 ? "all routes rendered" : `${failures} route(s) failed`}`);
  socket.close();
  try {
    process.kill(-chrome.pid, "SIGKILL");
  } catch {
    chrome.kill();
  }
  try {
    process.kill(-chrome.pid, "SIGKILL");
  } catch {
    chrome.kill();
  }
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    /* Chrome may still be releasing the profile */
  }
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  try {
    process.kill(-chrome.pid, "SIGKILL");
  } catch {
    chrome.kill();
  }
  rmSync(profile, { recursive: true, force: true });
  process.exit(1);
});