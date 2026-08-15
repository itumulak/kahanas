// Finding the Playwright the project installed, from wherever this harness runs.
//
// WHY THIS IS NOT JUST `import("playwright")`
//
// Node resolves a bare import by looking beside the importing file and then
// upwards. That works when the skill is installed inside the project, at
// <project>/.claude/skills/dev-design/, because the search reaches
// <project>/node_modules. It does not work when the skill is installed for the
// person rather than the project, at ~/.claude/skills/dev-design/, because the
// search then walks ~/.claude, ~, and / and never enters the project at all.
//
// That failure is the worst kind: it reports Playwright as missing on a project
// that has it installed and working, so the install command in the error
// message is one the person has already run. So the project root is asked
// first, explicitly, and the ambient search is only the fallback.

import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PACKAGES = ["playwright", "@playwright/test"];

// Resolve as if by a file sitting at <projectRoot>/package.json, which is what
// the project's own code would resolve as, whether or not that file exists.
function fromProject(projectRoot, name) {
  try {
    return createRequire(join(projectRoot, "package.json")).resolve(name);
  } catch {
    return null;
  }
}

// Returns { chromium, from, package } or throws an Error carrying `searched`,
// so a caller can say exactly where it looked rather than only that it failed.
export async function loadChromium(projectRoot = process.cwd()) {
  const searched = [];

  for (const name of PACKAGES) {
    const resolved = fromProject(projectRoot, name);
    searched.push(`${name} from ${projectRoot}${resolved ? ` (found at ${resolved})` : ""}`);
    if (!resolved) continue;
    const mod = await import(pathToFileURL(resolved).href);
    const chromium = mod.chromium ?? mod.default?.chromium;
    if (chromium) return { chromium, from: resolved, package: name };
  }

  // The ambient search, which covers a harness that does sit inside the project
  // and a Playwright installed globally.
  for (const name of PACKAGES) {
    searched.push(`${name} from ${import.meta.url}`);
    try {
      const mod = await import(name);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return { chromium, from: name, package: name };
    } catch {
      // Nothing to say here that the searched list does not already say.
    }
  }

  const err = new Error("Playwright is not installed where this harness can reach it");
  err.searched = searched;
  throw err;
}

// One message, so capture.mjs and preflight.mjs cannot describe the same
// failure two different ways.
export function missingPlaywrightMessage(err, projectRoot) {
  return [
    "Playwright is not installed where the review harness can reach it.",
    `  Project root searched: ${projectRoot}`,
    ...(err.searched ?? []).map((line) => `  tried ${line}`),
    "",
    "  /dev-architect owns every install in this workflow. Route it there rather",
    "  than installing from a design session. The command it records is usually:",
    "    npm install --save-dev playwright && npx playwright install chromium",
  ].join("\n");
}
