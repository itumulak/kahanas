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

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
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
const BREAKPOINTS = (opts.breakpoints ?? "desktop:1440x900,tablet:834x1112,phone:390x844")
  .split(",")
  .map((entry) => {
    const [name, size] = entry.split(":");
    const [width, height] = (size ?? "").split("x").map(Number);
    return { name: name?.trim(), width, height };
  })
  .filter((b) => b.name && b.width > 0 && b.height > 0);

if (BREAKPOINTS.length === 0) {
  console.error("capture.mjs: --breakpoints parsed to nothing, expected name:WIDTHxHEIGHT pairs");
  process.exit(64);
}

// Rule 1, enforced rather than trusted.
if (/review\.html|\/api\//.test(URL_UNDER_CAPTURE)) {
  console.error(
    "capture.mjs: refusing to open the review page or the decision endpoint.\n" +
      "The capture pass drives the prototype. The person decides in their own browser."
  );
  process.exit(64);
}

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

const ORIGIN = new URL(URL_UNDER_CAPTURE).origin;
const slug = (value) => value.toLowerCase().trim().replace(/\s+/g, "-");

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

// Clear anything a previous pass left. A state renamed or dropped between passes
// would otherwise leave its screenshot behind, and the review page would show a
// person an image of something the proposal no longer does.
await rm(join(OUT, "screenshots"), { recursive: true, force: true });
await mkdir(join(OUT, "screenshots"), { recursive: true });

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

// Every local file the prototype actually loaded. /dev-architect hashes these
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

    const html = await page.evaluate(() => document.body?.innerHTML ?? "");
    const domHash = createHash("sha256").update(html).digest("hex").slice(0, 16);
    domHashes.set(`${breakpoint.name}:${state}`, domHash);

    await page.screenshot({
      path: join(OUT, "screenshots", `${slug(state)}__${breakpoint.name}.png`),
      fullPage: true,
    });
  }
}

// Two ways a state fails to be reviewable, and both have to be caught.
//
// It never rendered, so there is nothing to look at. The default state is not
// exempt from this: a proposal whose only state failed to navigate would
// otherwise report itself reachable and be approvable by acknowledging the
// navigation failure.
//
// Or it rendered exactly what the default renders, meaning the fragment did
// nothing and the prototype does not implement it. Asking somebody to approve a
// surface whose error state nobody has ever seen is asking them to approve a
// claim.
const defaultState = STATES[0];
for (const state of STATES) {
  const missing = BREAKPOINTS.filter((b) => !domHashes.has(`${b.name}:${state}`)).map((b) => b.name);

  if (missing.length > 0) {
    stateReports.push({
      state,
      activated: false,
      note: `did not render at ${missing.join(", ")}`,
    });
    continue;
  }

  if (state === defaultState) {
    stateReports.push({ state, activated: true, note: "the default state" });
    continue;
  }

  const differsSomewhere = BREAKPOINTS.some(
    (b) => domHashes.get(`${b.name}:${state}`) !== domHashes.get(`${b.name}:${defaultState}`)
  );
  stateReports.push({
    state,
    activated: differsSomewhere,
    note: differsSomewhere
      ? null
      : `#state=${slug(state)} rendered the same DOM as ${defaultState} at every breakpoint, so the prototype does not implement it`,
  });
}

await context.close();
await browser.close();

const failedStates = stateReports.filter((s) => !s.activated);

await writeFile(
  join(OUT, "errors.json"),
  JSON.stringify(
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
  )
);

console.log(
  `captured ${STATES.length} states across ${BREAKPOINTS.length} breakpoints, ` +
    `${findings.length} findings, ${failedStates.length} states did not activate`
);

if (failedStates.length > 0) {
  for (const s of failedStates) console.error(`state did not activate: ${s.state}, ${s.note}`);
  process.exit(2);
}
