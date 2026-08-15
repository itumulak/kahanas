#!/usr/bin/env node
// Kahanas design review preflight.
//
// Answers one question, before a session is built and before anybody is told a
// review is about to happen: can this machine actually run a review here.
//
// Usage:
//   node preflight.mjs [--project <package root, default cwd>]
//
// Exit codes:
//   0  everything a session needs is here
//   64 bad arguments
//   69 Playwright is not reachable from this project
//   70 Playwright is here and the browser it needs is not
//
// WHY A PROBE EXISTS AT ALL
//
// "Playwright is installed" is three separate facts, and a project can hold any
// two of them without the third:
//
//   1. The Node package resolves from this project. A project on Playwright's
//      Python binding has a working end to end suite and nothing this harness
//      can import, and so does a workspace whose npm package sits one level
//      below the root this was pointed at.
//   2. Chromium is actually downloaded. `npm install` gets the package and not
//      the browser, and a CI image often has the reverse.
//   3. tooling.md records it as this project's visual verification tool. That
//      one is not checkable from here and is checked by /dev-design, because a
//      browser that happens to be in node_modules is not a decision anybody
//      made about how designs get reviewed.
//
// So finding Playwright in a project proves nothing on its own. This file
// settles 1 and 2 by doing them, and /dev-design settles 3 by reading the
// document that owns the answer.
//
// It launches a browser and closes it. Reading a version string would report a
// working setup on a machine whose browser binary was never downloaded, which
// is the exact failure this exists to catch.

import { loadChromium, missingPlaywrightMessage } from "./resolve-playwright.mjs";
import { parseArgsOrExit } from "./args.mjs";
import { resolve } from "node:path";

const opts = parseArgsOrExit(process.argv, "preflight.mjs");
const PROJECT_ROOT = resolve(opts.project ?? process.cwd());

const major = Number(process.versions.node.split(".")[0]);
console.log(`KAHANAS_NODE=${process.versions.node}`);
if (!Number.isFinite(major) || major < 18) {
  console.error(
    `preflight.mjs: the review harness needs Node 18 or newer, and this is ${process.versions.node}.`
  );
  process.exit(70);
}

let chromium;
let from;
let name;
try {
  ({ chromium, from, package: name } = await loadChromium(PROJECT_ROOT));
} catch (err) {
  console.error(`preflight.mjs: ${missingPlaywrightMessage(err, PROJECT_ROOT)}`);
  process.exit(69);
}
console.log(`KAHANAS_PLAYWRIGHT=${name}`);
console.log(`KAHANAS_PLAYWRIGHT_FROM=${from}`);

// The one honest check. A version string proves a package was unpacked; only a
// launch proves a review can be captured.
let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  console.error(
    [
      "preflight.mjs: Playwright is installed and its browser will not launch.",
      `  ${err.message.split("\n")[0]}`,
      "",
      "  This is the usual shape of it: the package was installed and the browser",
      "  binary never was. /dev-architect owns every install in this workflow, so",
      "  route it there rather than installing from a design session. The command",
      "  it records is usually:",
      "    npx playwright install chromium",
    ].join("\n")
  );
  process.exit(70);
}

const version = browser.version();
await browser.close();

console.log(`KAHANAS_BROWSER=chromium ${version}`);
console.log("KAHANAS_PREFLIGHT=ok");
console.log(
  "Playwright resolves from this project and its browser launches. " +
    "tooling.md still has to name it as this project's visual verification tool."
);
