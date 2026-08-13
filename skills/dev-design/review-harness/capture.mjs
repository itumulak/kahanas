#!/usr/bin/env node
// Kahanas design review capture pass.
//
// Renders one prototype at every breakpoint and every declared state, screenshots
// each combination, and records every console message, uncaught page error, and
// failed request it produced.
//
// Usage:
//   node capture.mjs \
//     --url http://127.0.0.1:1234/proposal.html \
//     --out <session directory> \
//     --states default,submitting,invalid-code \
//     --breakpoints desktop:1440x900,tablet:834x1112,phone:390x844
//
// Writes <out>/screenshots/<state>__<breakpoint>.png and <out>/errors.json.
//
// Exit codes:
//   0  the pass ran, read errors.json for what it found
//   2  a declared state did not activate, which is a defect in the prototype
//   64 bad arguments
//   69 Playwright is not installed
//
// Two rules from internal/design-review.md are enforced here rather than trusted:
//
//   1. This drives the prototype and never the review page. A URL pointing at the
//      review page or the decision endpoint is refused.
//   2. This ignores the project's own Playwright configuration. It drives the
//      browser through the library API, so playwright.config.ts is never loaded,
//      and the end to end suite's base URL, projects, and global setup cannot
//      reach this pass.

import { mkdir, writeFile, rm, rename } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (key) out[key] = argv[i + 1];
  }
  return out;
}

const opts = args(process.argv);
for (const required of ["url", "out"]) {
  if (!opts[required]) {
    console.error(`capture.mjs: --${required} is required`);
    process.exit(64);
  }
}

const URL_UNDER_CAPTURE = opts.url;
const OUT = opts.out;
const STATES = (opts.states ?? "default")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// Parsed strictly, never filtered. Dropping a malformed entry is the worst
// possible response: a typo like tablet:bad would silently produce a review with
// no tablet coverage that reports itself complete, and nobody would look for the
// breakpoint that was never there.
const BREAKPOINTS = (opts.breakpoints ?? "desktop:1440x900,tablet:834x1112,phone:390x844")
  .split(",")
  .map((entry) => {
    const [name, size] = entry.split(":");
    const [width, height] = (size ?? "").split("x").map(Number);
    if (!name?.trim() || !(width > 0) || !(height > 0)) {
      console.error(
        `capture.mjs: breakpoint ${JSON.stringify(entry)} is malformed, expected name:WIDTHxHEIGHT`
      );
      process.exit(64);
    }
    return { name: name.trim(), width, height };
  });

if (BREAKPOINTS.length === 0) {
  console.error("capture.mjs: --breakpoints is empty, expected name:WIDTHxHEIGHT pairs");
  process.exit(64);
}

function requireNoDuplicates(kind, names) {
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) {
      console.error(`capture.mjs: ${kind} ${JSON.stringify(name)} is listed twice`);
      process.exit(64);
    }
    seen.add(name);
  }
}
requireNoDuplicates("state", STATES);
requireNoDuplicates("breakpoint", BREAKPOINTS.map((b) => b.name));

// Rule 1, enforced rather than trusted.
if (/review\.html|\/api\//.test(URL_UNDER_CAPTURE)) {
  console.error(
    "capture.mjs: refusing to open the review page or the decision endpoint.\n" +
      "The capture pass drives the prototype. The person decides in their own browser."
  );
  process.exit(64);
}

// This URL decides which origin the pass will allow, so a wrong one does not
// merely point somewhere else, it makes that somewhere else the trusted origin
// and lets the prototype talk to it freely. A session is always on loopback.
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"]);
{
  let parsed;
  try {
    parsed = new URL(URL_UNDER_CAPTURE);
  } catch {
    console.error(`capture.mjs: --url ${JSON.stringify(URL_UNDER_CAPTURE)} is not a URL`);
    process.exit(64);
  }
  if (parsed.protocol !== "http:" || !LOOPBACK.has(parsed.hostname)) {
    console.error(
      `capture.mjs: --url must be an http address on loopback, got ${parsed.protocol}//${parsed.hostname}.\n` +
        "A review session serves the prototype on 127.0.0.1."
    );
    process.exit(64);
  }
}

const ORIGIN = new URL(URL_UNDER_CAPTURE).origin;
const slug = (value) => value.toLowerCase().trim().replace(/\s+/g, "-");

// State names come from a registry cell and breakpoint names from design.md,
// both of which are documents a person edits, and both end up in a file path
// here. A cell holding ../../something would write outside the screenshots
// folder, so the names are checked rather than trusted.
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/;
function requireSafeName(kind, original, name) {
  if (!SAFE_NAME.test(name) || name.includes("..")) {
    console.error(
      `capture.mjs: ${kind} name ${JSON.stringify(original)} is not usable in a file name.\n` +
        "Use letters, digits, hyphens, dots, and underscores."
    );
    process.exit(64);
  }
  return name;
}

for (const state of STATES) requireSafeName("state", state, slug(state));
for (const breakpoint of BREAKPOINTS) requireSafeName("breakpoint", breakpoint.name, breakpoint.name);

// Rule 2: importing the library directly is what keeps playwright.config.ts out
// of this. Never run this file through the Playwright test runner.
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch {
    console.error(
      "capture.mjs: Playwright is not installed.\n" +
        "  npm install --save-dev @playwright/test && npx playwright install chromium"
    );
    process.exit(69);
  }
}

// Parse before comparing. A string prefix test passes for
// http://127.0.0.1:1234@evil.example/, where everything before the at sign is
// user information and the real host is evil.example, so a prototype could reach
// the network through a URL that looks local.
function isSessionUrl(value) {
  if (/^(data:|blob:|about:)/.test(value)) return true;
  try {
    return new URL(value).origin === ORIGIN;
  } catch {
    return false;
  }
}
const stateUrl = (state, cacheBust) =>
  `${URL_UNDER_CAPTURE}${URL_UNDER_CAPTURE.includes("?") ? "&" : "?"}_k=${cacheBust}#state=${slug(state)}`;

// Clear everything a previous pass left, findings included. A state renamed or
// dropped between passes would otherwise leave its screenshot behind, and a
// crash partway through this pass would leave new screenshots paired with the
// last pass's clean findings, which reads as a proposal that improved.
await rm(join(OUT, "screenshots"), { recursive: true, force: true });
await rm(join(OUT, "errors.json"), { force: true });
await mkdir(join(OUT, "screenshots"), { recursive: true });

const SHOTS = resolve(join(OUT, "screenshots"));
function shotPath(state, breakpointName) {
  const target = resolve(join(SHOTS, `${slug(state)}__${breakpointName}.png`));
  if (target !== SHOTS && !target.startsWith(SHOTS + sep)) {
    console.error(`capture.mjs: refusing to write outside the screenshots folder: ${target}`);
    process.exit(64);
  }
  return target;
}

const findings = [];
const stateReports = [];
let current = { state: null, breakpoint: null };

function record(kind, message, detail = null) {
  findings.push({
    kind,
    state: current.state,
    breakpoint: current.breakpoint,
    message,
    detail,
    at: new Date().toISOString(),
  });
}

// A fresh context every run. Never an existing profile, never a signed in one:
// a prototype runs on fixture data and needs no identity, and carrying a real
// session into an automated context is how a stray fetch reaches something real.
const browser = await chromium.launch();
const context = await browser.newContext({ ignoreHTTPSErrors: false });
const page = await context.newPage();

// Requests this pass aborted, and the local files it actually loaded.
const blocked = new Set();
const dependencies = new Set();

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    record(`console-${msg.type()}`, msg.text());
  }
});
page.on("pageerror", (err) => record("page-error", err.message, err.stack ?? null));
page.on("requestfailed", (req) => {
  // Anything this pass aborted deliberately is already recorded as an external
  // request, so recording it twice would only pad the findings.
  if (blocked.has(req.url())) return;
  record("request-failed", req.url(), req.failure()?.errorText ?? null);
});

// A request that arrived and answered with an error is a failure too, and it
// never reaches requestfailed. A prototype loading a stylesheet that 404s looks
// fine in the markup and wrong on the screen.
page.on("response", (res) => {
  if (res.status() >= 400) record("response-error", `${res.status()} ${res.url()}`);
});

// Every local file the prototype actually loaded. /dev-design hashes these
// along with the working copy, so a shared token file or an asset changing
// during a review invalidates the approval the same way editing the prototype
// would.
page.on("response", (res) => {
  if (res.status() < 400 && isSessionUrl(res.url())) {
    dependencies.add(new URL(res.url()).pathname.split("?")[0]);
  }
});

// A prototype has no backend by construction and must render with no network, so
// anything it reaches for beyond this session is aborted rather than merely
// noted. Letting it through would mean the design was reviewed against
// something that will not be there later, and would let an untrusted prototype
// talk to whatever it liked while nobody was watching.
await page.route("**/*", (route) => {
  const url = route.request().url();
  if (isSessionUrl(url)) return route.continue();
  blocked.add(url);
  record("external-request", url, "blocked, a prototype must render with no network");
  return route.abort();
});

let bust = 0;
const domHashes = new Map();
const shotHashes = new Map();

for (const breakpoint of BREAKPOINTS) {
  await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });

  for (const state of STATES) {
    current = { state, breakpoint: breakpoint.name };
    bust += 1;

    try {
      await page.goto(stateUrl(state, bust), { waitUntil: "load", timeout: 15000 });
    } catch (err) {
      record("navigation-failed", err.message);
      continue;
    }

    // Let a fragment driven transition and any entry animation settle.
    await page.waitForTimeout(250);

    // The whole document rather than the body's markup. A prototype that
    // switches state by setting an attribute on the html or body element and
    // letting CSS do the showing and hiding is a normal way to build one, and
    // its body innerHTML is identical in every state. Reading only that reports
    // a correct prototype as unimplemented, which blocks approval outright.
    const html = await page.evaluate(() => document.documentElement?.outerHTML ?? "");
    domHashes.set(`${breakpoint.name}:${state}`, createHash("sha256").update(html).digest("hex"));

    // What the person will actually look at, which is the second and broader
    // signal: two states that render the same pixels are the same state to a
    // reviewer whatever the markup says.
    const image = await page.screenshot({ path: shotPath(state, breakpoint.name), fullPage: true });
    shotHashes.set(`${breakpoint.name}:${state}`, createHash("sha256").update(image).digest("hex"));
  }
}

// Two ways a state fails to be reviewable, and both have to be caught.
//
// It never rendered, so there is nothing to look at. The first declared state is
// not exempt from this: a proposal whose only state failed to navigate would
// otherwise report itself reachable and be approvable by acknowledging the
// navigation failure.
//
// Or it rendered exactly what another declared state rendered, meaning the
// fragment did nothing and the prototype does not implement it. Asking somebody
// to approve a surface whose error state nobody has ever seen is asking them to
// approve a claim.
//
// Every state is compared against every state declared before it, not against
// the first one. A prototype can cover several surfaces, so the first state is
// some other surface's, and comparing payment-error against cart-default finds
// them different and calls it implemented while it is in fact rendering
// payment-default. Comparing pairwise needs no surface metadata and catches it.
//
// Within a colliding pair the later declaration is the one flagged, since the
// earlier one is the composition that exists and the later is the one that
// failed to arrive. That is also why states are declared grouped by surface,
// each surface's base state first.
const signature = (breakpoint, state) =>
  `${domHashes.get(`${breakpoint}:${state}`)}|${shotHashes.get(`${breakpoint}:${state}`)}`;

for (const [index, state] of STATES.entries()) {
  const missing = BREAKPOINTS.filter((b) => !domHashes.has(`${b.name}:${state}`)).map((b) => b.name);

  if (missing.length > 0) {
    stateReports.push({
      state,
      activated: false,
      note: `did not render at ${missing.join(", ")}`,
    });
    continue;
  }

  // Either signal is enough on its own. The markup catches a state whose
  // difference is off screen, and the pixels catch one expressed purely in
  // styling, so a state has to match on both at every breakpoint before it is
  // called unimplemented.
  const collidesWith = STATES.slice(0, index).find((earlier) =>
    BREAKPOINTS.every((b) => signature(b.name, state) === signature(b.name, earlier))
  );

  stateReports.push({
    state,
    activated: !collidesWith,
    note: collidesWith
      ? `#state=${slug(state)} rendered the same document and the same pixels as ${collidesWith} at every breakpoint, so the prototype does not implement it`
      : null,
  });
}

await context.close();
await browser.close();

const failedStates = stateReports.filter((s) => !s.activated);

// Written whole and then renamed, so a crash never leaves a partial record that
// the approval gate would have to interpret.
const report = JSON.stringify(
  {
    capturedAt: new Date().toISOString(),
      url: URL_UNDER_CAPTURE,
      breakpoints: BREAKPOINTS,
      states: stateReports,
      dependencies: [...dependencies].sort(),
      findings,
  },
  null,
  2
);
const staged = join(OUT, `errors.json.${process.pid}.part`);
await writeFile(staged, report);
await rename(staged, join(OUT, "errors.json"));

console.log(
  `captured ${STATES.length} states across ${BREAKPOINTS.length} breakpoints, ` +
    `${findings.length} findings, ${failedStates.length} states did not activate`
);

if (failedStates.length > 0) {
  for (const s of failedStates) console.error(`state did not activate: ${s.state}, ${s.note}`);
  process.exit(2);
}
