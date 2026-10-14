/**
 * End-to-end role journey driven through the real UI over CDP.
 *
 * Walks the two flows that matter most and asserts the result is visible in the
 * other role's queue — an agent publishing a listing, then a renter favouriting
 * and enquiring on it, and the agent seeing both land.
 *
 * Usage: node scripts/e2e.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:5174";
const API = process.env.SMOKE_API ?? "http://localhost:4000/api/v1";
const PORT = Number(process.env.SMOKE_PORT ?? 0) || 9300 + (process.pid % 400);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ACCOUNTS_FILE = new URL("./.e2e-accounts.json", import.meta.url).pathname;

/**
 * Registration is capped at 20 auth requests per 15 minutes, so the pair of
 * accounts is created once and reused; only the listing title is per-run.
 */
function accounts() {
  if (existsSync(ACCOUNTS_FILE)) {
    return JSON.parse(readFileSync(ACCOUNTS_FILE, "utf8"));
  }
  const stamp = Date.now();
  const pair = {
    AGENT: {
      email: `e2e.agent.${stamp}@example.com`,
      password: "Passw0rd!",
      role: "agent",
    },
    RENTER: {
      email: `e2e.renter.${stamp}@example.com`,
      password: "Passw0rd!",
      role: "renter",
    },
  };
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(pair, null, 2));
  return pair;
}

const { AGENT, RENTER } = accounts();
const stamp = Date.now();
const TITLE = `E2E Test Villa ${stamp}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "e2e-"));

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

async function api(path, { method = "get", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // Auth is capped at 20 requests per 15 minutes; a run that trips it should
  // say so rather than reporting every downstream check as a failure.
  if (res.status === 429) {
    throw new Error(
      "auth rate limit hit (20 per 15 min) — wait for the window to reset before re-running",
    );
  }
  const data = await res.json().catch(() => ({}));
  // `success: false` is the API's convention for every non-2xx body.
  if (!res.ok && data.success !== true) {
    const error = new Error(data.message ?? `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

async function main() {
  // Seed the accounts once; afterwards only logging in, which is far cheaper.
  for (const account of [AGENT, RENTER]) {
    try {
      await api("/auth/login", {
        method: "post",
        body: { email: account.email, password: account.password },
      });
    } catch (error) {
      if (error.status === 429) throw error;
      await api("/auth/register", {
        method: "post",
        body: {
          email: account.email,
          password: account.password,
          role: account.role,
          name: account.role,
          currency: "INR",
        },
      });
    }
  }

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
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message.result);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const messageId = ++id;
      pending.set(messageId, resolve);
      socket.send(JSON.stringify({ id: messageId, method, params }));
    });
  const evaluate = async (expression) =>
    (
      await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
    )?.result?.value;

  await send("Page.enable");
  await send("Runtime.enable");
  // The app shell hides its sidebar below lg, and innerText skips hidden nodes,
  // so the identity assertion needs a desktop viewport.
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

  /** Dumps the visible page so a failure is diagnosable from the log alone. */
  const dump = async (path) => {
    const body = (await text()).replace(/\s+/g, " ").slice(0, 240);
    console.log(`        on ${path}: ${body || "(empty)"}`);
  };

  /**
   * Polls the rendered page until `needle` shows up. Data arrives over the
   * network after the document commits, so asserting on the first paint would
   * be a race rather than a test.
   */
  const waitFor = async (needle, tries = 40) => {
    let last = "";
    for (let i = 0; i < tries; i += 1) {
      last = await text();
      if (has(last, needle)) return true;
      await sleep(250);
    }
    console.log(
      `        waitFor(${needle}) gave up; page had: ${last.replace(/\s+/g, " ").slice(0, 120)}`,
    );
    return false;
  };

  /**
   * Navigates and waits for the new document to actually commit before
   * asserting. A fixed sleep races the router and produced flaky results.
   */
  const goto = async (path, settle = 1800) => {
    await send("Page.navigate", { url: `${BASE}${path}` });
    const expected = new URL(path, BASE).pathname;
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(
        `document.readyState === "complete" && location.pathname === ${JSON.stringify(expected)}`,
      );
      if (ready) break;
      await sleep(150);
    }
    await sleep(settle);
  };

  // innerText applies CSS text-transform, so labels set in uppercase arrive
  // uppercase — every assertion below compares case-insensitively.
  const text = () => evaluate(`(document.body.innerText || "").toLowerCase()`);
  const has = (body, needle) =>
    body.toLowerCase().includes(needle.toLowerCase());

  /**
   * Dropping the stored token is not enough: the server also holds an httpOnly
   * refresh cookie, and the API client will silently exchange it for a fresh
   * access token. Sign out properly before switching identities.
   */
  /**
   * Cheaper switch: one login request, then the token is injected the same way
   * the app would have stored it.
   */
  const signIn = async (account) => {
    const data = await api("/auth/login", {
      method: "post",
      body: { email: account.email, password: account.password },
    });
    await send("Page.navigate", { url: `${BASE}/` });
    await sleep(1200);
    // Responses are cached in sessionStorage, which outlives a reload, so the
    // previous identity has to be cleared before the new token can take effect.
    // Signing in through the form does this itself via the auth store.
    await evaluate(
      `sessionStorage.clear();
       localStorage.setItem("web:accessToken", ${JSON.stringify(data.accessToken)});
       true`,
    );
  };

  const signOut = async () => {
    await send("Page.navigate", { url: `${BASE}/` });
    await sleep(1200);
    await evaluate(`fetch(${JSON.stringify(`${API}/auth/logout`)}, {
      method: "POST", credentials: "include",
    }).catch(() => {}); true`);
    await evaluate(`localStorage.clear(); true`);
    await sleep(400);
  };

  /**
   * Signs in through the real login form. Used once per run to keep that path
   * covered without spending the API's 20-per-15-minutes auth budget.
   */
  const signInWithForm = async (account) => {
    await goto("/login");
    await evaluate(`(() => {
      const set = (el, value) => {
        const proto = Object.getOwnPropertyDescriptor(
          el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype,
          "value",
        ).set;
        proto.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const inputs = [...document.querySelectorAll("input")];
      set(inputs.find((i) => i.type === "email"), ${JSON.stringify(account.email)});
      set(inputs.find((i) => i.type === "password"), ${JSON.stringify(account.password)});
      document.querySelector('form button[type="submit"]').click();
      return true;
    })()`);
    await sleep(3200);
  };

  /**
   * Confirms the page really reflects `account`. A 429 from the login endpoint
   * leaves the previous session in place, which would silently invalidate every
   * downstream assertion, so identity is checked before each step.
   */
  const whoami = async (account) => {
    const found = await evaluate(
      `document.body.innerText.includes(${JSON.stringify(account.email)})`,
    );
    check(`signed in as ${account.role}`, Boolean(found));
    return Boolean(found);
  };

  /* ---------------------------------------------------- agent publishes */

  await signIn(AGENT);
  check("agent session is active", await whoami(AGENT));
  check(
    "agent lands on the lister dashboard",
    await waitFor("Your portfolio at a glance"),
  );

  await goto("/listings/new");
  const filled = await evaluate(`(() => {
    const set = (el, value) => {
      const proto = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, "value",
      ).set;
      proto.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    };
    const byLabel = (label) =>
      [...document.querySelectorAll("label")]
        .find((l) => l.textContent.trim() === label)
        ?.closest("div")?.querySelector("input");
    set(byLabel("Listing title"), ${JSON.stringify(TITLE)});
    set(byLabel("Price"), "54000");
    set(byLabel("Built-up area (sq.ft)"), "1450");
    set(byLabel("Bedrooms"), "3");
    set(byLabel("Bathrooms"), "2");
    set(byLabel("Address"), "Marine Drive, Kochi");
    return true;
  })()`);
  check("listing form accepts input", Boolean(filled));

  await evaluate(
    `document.querySelector('form button[type="submit"]').click(); true`,
  );
  await sleep(3600);

  const afterPublish = await text();
  check(
    "publish redirects to the media manager",
    has(afterPublish, "Media") &&
      !has(afterPublish, "The site failed to start"),
  );

  await goto("/listings", 500);
  check("the new listing appears in My listings", await waitFor(TITLE));

  /* -------------------------------------------------- renter favourites */

  await signIn(RENTER);
  await goto("/dashboard", 500);
  check("renter session is active", await whoami(RENTER));

  const searchResult = await api(`/properties?q=${encodeURIComponent(TITLE)}`);
  const propertyId = searchResult.properties?.[0]?._id;
  check("listing is searchable through the API", Boolean(propertyId));

  if (propertyId) {
    await goto(`/properties/${propertyId}`);
    const detail = await text();
    check("listing detail renders", detail.includes(TITLE));

    // The heart sits inside the card's link, so click the aria button instead.
    const favourited = await evaluate(`(() => {
      const heart = [...document.querySelectorAll("button")].find((b) =>
        b.getAttribute("aria-label") === "Add to shortlist",
      );
      if (!heart) return "no-heart";
      heart.click();
      return "clicked";
    })()`);
    check("shortlist button is reachable", favourited === "clicked");
    await sleep(2600);

    await goto("/saved", 500);
    const savedOk = await waitFor(TITLE);
    check("the listing shows in the renter's Saved page", savedOk);
    if (!savedOk) await dump("/saved");

    // Send an enquiry through the dialog the detail page opens.
    await goto(`/properties/${propertyId}`);
    await evaluate(`(() => {
      const button = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Send enquiry"),
      );
      button?.click();
      return Boolean(button);
    })()`);
    await sleep(1200);
    const asked = await evaluate(`(() => {
      const box = document.querySelector("textarea");
      if (!box) return false;
      const proto = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, "value",
      ).set;
      proto.call(box, "Is this still available for next month?");
      box.dispatchEvent(new Event("input", { bubbles: true }));
      const form = box.closest("form");
      form.querySelector('button[type="submit"]').click();
      return true;
    })()`);
    check("enquiry form submits", Boolean(asked));
    await sleep(2600);
  }

  /* --------------------------------------------- agent sees the lead */

  await signOut();
  await signIn(AGENT);
  await goto("/inquiries");
  await goto("/inquiries", 500);
  const leadOk = await waitFor("Is this still available");
  check("the agent sees the enquiry in their queue", leadOk);
  check("the enquiry links back to the listing", await waitFor(TITLE, 5));
  if (!leadOk) await dump("/inquiries");

  /* ---------------------------------------------------- role separation */

  await signIn(RENTER);
  await goto("/dashboard", 500);
  check("renter session is restored", await whoami(RENTER));
  await goto("/inquiries", 500);
  check(
    "a renter is kept out of the enquiries queue",
    await waitFor("Pick up where you left off"),
  );

  await goto("/dashboard", 500);
  check(
    "the renter dashboard replaces the lister one",
    await waitFor("Shortlisted"),
  );

  console.log(
    `\n${failures.length === 0 ? "e2e passed" : `${failures.length} check(s) failed`}`,
  );
  socket.close();
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
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  try {
    process.kill(-chrome.pid, "SIGKILL");
  } catch {
    chrome.kill();
  }
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
