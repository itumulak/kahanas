#!/usr/bin/env node
// Consistency checks across the /dev-harness files.
//
// The harness ships no executable, so there is no behavior to unit test. What it
// does have is a roster template, four procedure files, four modes, and three
// briefs that all describe one machine, and every defect two external reviews
// found in it was one of those files disagreeing with another edited later.
// These assertions are for exactly that class.

import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const H = join(REPO, "skills", "dev-harness");

const read = (p) => readFile(join(H, p), "utf8");
const failures = [];
const ok = [];

function check(name, condition, detail) {
  if (condition) ok.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

const template = await read("templates/harness.md");
const dispatch = await read("internal/dispatch.md");
const quota = await read("internal/quota-resume.md");
const escalation = await read("internal/escalation.md");
const config = await read("modes/config.md");
const skill = await read("SKILL.md");
const briefs = Object.fromEntries(
  await Promise.all(
    ["coordinator", "developer", "reviewer"].map(async (r) => [r, await read(`prompts/${r}.md`)]),
  ),
);

// Every Session field another file tells the harness to read must exist in the template.
for (const field of [
  "Base branch",
  "Working branch",
  "Push on hand back",
  "Remote",
  "Watch timeout seconds",
  "Created by config",
  "Relay",
]) {
  check(`template records "${field}"`, template.includes(`- ${field}:`));
}

// The roster header and every row must have the same number of columns.
const rosterRows = template
  .split("\n")
  .filter((l) => l.startsWith("| ") && l.endsWith(" |"))
  .filter((l) => !/^\|\s*-+/.test(l));
// A cell may contain an escaped pipe, which is not a separator.
const cells = (row) => row.split(/(?<!\\)\|/);
const header = rosterRows.find((l) => l.includes("| Role |"));
check("roster has a header row", Boolean(header));
if (header) {
  const width = cells(header).length;
  const roles = rosterRows.filter((l) => /^\| (coordinator|developer|reviewer) \|/.test(l));
  check("roster has all three default roles", roles.length === 3, `found ${roles.length}`);
  for (const row of roles) {
    const role = cells(row)[1].trim();
    check(`roster row ${role} matches the header width`, cells(row).length === width,
      `header ${width}, row ${cells(row).length}`);
  }
}

// Escalation cannot be enforced without live state on the row.
check("roster carries Current model", template.includes("Current model"));
check("roster carries Escalations used", template.includes("Escalations used"));
check("escalation.md writes both", escalation.includes("Current model") && escalation.includes("Escalations used"));

// Push is a recorded choice, so nothing may hardcode a remote or push unconditionally.
for (const [name, text] of [["dispatch.md", dispatch], ...Object.entries(briefs).map(([r, t]) => [`prompts/${r}.md`, t])]) {
  check(`${name} does not hardcode a push to origin`, !/git push[^\n]*\borigin\b/.test(text),
    (text.match(/git push[^\n]*origin[^\n]*/) || [])[0]);
}
for (const role of ["developer", "reviewer", "coordinator"]) {
  check(`${role} brief gates pushing on the recorded setting`, briefs[role].includes("Push on hand back"));
}

// The watch timeout default has to agree across the files that state it.
const templateTimeout = template.match(/- Watch timeout seconds: <(\d+)/);
const configTimeout = config.match(/Default (\d+), five minutes/);
check("template states a timeout default", Boolean(templateTimeout));
check("config states a timeout default", Boolean(configTimeout));
if (templateTimeout && configTimeout) {
  check("timeout defaults agree", templateTimeout[1] === configTimeout[1],
    `template ${templateTimeout[1]}, config ${configTimeout[1]}`);
}
check("dispatch.md names the seconds to milliseconds conversion", /times 1000|milliseconds/.test(dispatch));

// A phase boundary route must name the skill that owns loop state.
check("developer brief resumes a phase boundary with /dev-loop",
  /phase of `build-plan.md`[\s\S]{0,400}?\/dev-loop/.test(briefs.developer));

// Quota resume must not loop inside one shell call.
check("quota-resume warns against spinning on a settled worker",
  quota.includes("returns immediately") || quota.includes("spin"));

// Prompt transport must not interpolate.
check("dispatch.md builds the prompt with a quoted heredoc", dispatch.includes("<<'HARNESS_PROMPT"));
for (const role of ["developer", "reviewer"]) {
  check(`${role} brief sends its report without shell expansion`, briefs[role].includes("<<'HANDBACK"));
}

// The dispatch log is a Markdown table, so its cells must be constrained.
check("template constrains dispatch log cells to one line", template.includes("Every cell is one line"));

// Telegram was removed; no file may still describe it.
const allFiles = [];
for (const dir of ["", "internal", "modes", "prompts", "templates", "agents"]) {
  const entries = await readdir(join(H, dir), { withFileTypes: true });
  for (const e of entries) if (e.isFile()) allFiles.push(join(dir, e.name));
}
for (const f of allFiles) {
  const text = await read(f);
  check(`${f} has no Telegram reference`, !/telegram/i.test(text));
}

// Every reference file SKILL.md names must exist.
for (const m of skill.matchAll(/`((?:internal|modes|prompts|templates)\/[a-z-]+\.md)`/g)) {
  check(`SKILL.md reference ${m[1]} exists`, allFiles.includes(m[1]));
}

// Config steps must read in order.
const steps = [...config.matchAll(/^### Step (\d+)([a-z]?):/gm)].map((m) => m[1] + m[2]);
const rank = (s) => parseInt(s, 10) * 10 + (s.match(/[a-z]$/) ? s.charCodeAt(s.length - 1) - 96 : 0);
check("config steps are in ascending order",
  steps.every((s, i) => i === 0 || rank(steps[i - 1]) < rank(s)), steps.join(" "));

// Unattended must be settled before agents start, since the flag cannot be added later.
// `herdr agent start --help` is a lookup, not a launch, so match the real command.
const launch = config.search(/herdr agent start <?name/);
check("config finds the launch command", launch > -1);
check("config asks about unattended before it starts agents",
  config.indexOf("run unattended") < launch);
check("config confirms roles are live after creating them",
  launch < config.indexOf("Confirm each role really came up"));

for (const line of ok) process.stdout.write(`  ok   ${line}\n`);
for (const line of failures) process.stdout.write(`  FAIL ${line}\n`);
process.stdout.write(`\nharness docs: ${ok.length} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
