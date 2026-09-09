#!/usr/bin/env node
// Consistency checks across the /dev-context role files.
//
// These files are read by a fresh agent on a model that has never seen this
// project, which is the case they exist for, so a role that names a skill it may
// not run, or a table whose columns disagree with the skill that owns them, is a
// defect nobody catches at the time. It is caught here instead.

import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = join(REPO, "skills", "dev-context");

const read = (p) => readFile(join(C, p), "utf8");
const failures = [];
const ok = [];

function check(name, condition, detail) {
  if (condition) ok.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

const skill = await read("SKILL.md");
const roleFiles = (await readdir(join(C, "roles"))).filter((f) => f.endsWith(".md")).sort();
const DEFAULTS = ["coordinator", "designer", "developer", "planner", "reviewer"];
const roles = Object.fromEntries(
  await Promise.all(DEFAULTS.map(async (r) => [r, await read(`roles/${r}.md`)])),
);
const authoring = await read("roles/writing-a-role.md");

// The roles the skill advertises must be the roles it ships, and the argument
// table is the one place a reader learns a role exists at all.
check("roles/ holds every default plus the authoring guide",
  roleFiles.length === DEFAULTS.length + 1, roleFiles.join(" "));
const argumentTable = skill.slice(skill.indexOf("| Role | Runs |"), skill.indexOf("## Read the role context"));
for (const r of DEFAULTS) {
  check(`the argument table lists ${r}`, new RegExp(`^\\| \`${r}\` \\|`, "m").test(argumentTable));
}
check("the argument table lists no role that does not ship",
  [...argumentTable.matchAll(/^\| `([a-z]+)` \|/gm)].every((m) => DEFAULTS.includes(m[1])),
  [...argumentTable.matchAll(/^\| `([a-z]+)` \|/gm)].map((m) => m[1]).join(" "));

// A count of the roles written into an instruction is wrong the first time
// somebody adds one, and this set has shipped that bug before.
for (const [name, text] of [["SKILL.md", skill], ["writing-a-role.md", authoring]]) {
  check(`${name} states no role count`,
    !/(one of the|name the) (two|three|four|five|six) /i.test(text));
}
for (const r of DEFAULTS) {
  check(`SKILL.md advertises the ${r} role`, new RegExp(`\`${r}\``).test(skill));
  check(`roles/${r}.md exists`, roleFiles.includes(`${r}.md`));
}

// Resolution order is the whole reason a project can add a role, so both files
// that state it must state the same order.
for (const [name, text] of [["SKILL.md", skill], ["writing-a-role.md", authoring]]) {
  const project = text.indexOf(".konteksto/roles/<role>.md");
  const shipped = text.indexOf("`roles/<role>.md`");
  check(`${name} names the project file first`, project > -1 && shipped > -1 && project < shipped,
    `project ${project}, shipped ${shipped}`);
}

// The skill writes nothing, and a role file is no exception.
check("SKILL.md still refuses to write a missing role file",
  /read only, so it never writes that file/.test(skill));

// Every role file carries the four sections a role has to answer, in one shape,
// because a brief that arrives differently every time is one nobody skims right.
for (const r of DEFAULTS) {
  for (const heading of [
    "## What this role is for",
    "## The skills you run",
    "## What you may never do",
    "## Where you stop",
  ]) {
    check(`roles/${r}.md has "${heading}"`, roles[r].includes(heading));
  }
  check(`roles/${r}.md says what it writes`,
    /## What you write/.test(roles[r]));
  check(`roles/${r}.md says it states the trigger and points`,
    /where that rule is defined|where the rule lives|is where the rule lives/.test(roles[r]));
}

// A role may only name skills that exist.
const installed = new Set(
  (await readdir(join(REPO, "skills"), { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name),
);
for (const [r, text] of Object.entries({ ...roles, "writing-a-role": authoring })) {
  for (const m of text.matchAll(/`\/(dev-[a-z]+)/g)) {
    check(`roles/${r}.md names a real skill: /${m[1]}`, installed.has(m[1]));
  }
}

// The one invariant behind the whole set has to survive into the briefs a cold
// model actually reads. Each role must refuse the intent above it by name.
check("planner refuses to design a screen", /Never decide what a screen looks like/.test(roles.planner));
check("planner refuses to answer its own panel", /Never answer your own options panel/.test(roles.planner));
check("planner refuses to write build state", /Never write build state/.test(roles.planner));
check("planner refuses to rename a glossary term", /Never rename a term in the glossary/.test(roles.planner));
check("developer refuses to design", /Never invent a design/.test(roles.developer));
check("developer refuses to approve", /never write `APPROVED`/i.test(roles.developer));
check("developer refuses to answer a person's panel",
  /Never answer an options panel yourself/.test(roles.developer));
check("designer refuses to originate an approval",
  /Never originate an approval/.test(roles.designer));
check("designer refuses product and technical intent",
  /Never add product intent/.test(roles.designer) && /Never add technical intent/.test(roles.designer));
check("coordinator refuses to compute a route", /Never compute a route/.test(roles.coordinator));
check("coordinator refuses a verdict it did not observe",
  /Never claim a verdict you did not observe/.test(roles.coordinator));
check("reviewer refuses to fix what it reviews", /Never fix what you are reviewing/.test(roles.reviewer));
check("reviewer refuses to arbitrate", /Never arbitrate/.test(roles.reviewer));
// A harness dispatches a command to whatever window has a terminal, so the two
// roles it borrows a window from must both say the window is not the role.
check("developer treats a dispatched upstream command as a role change",
  /role change, not an exception/.test(roles.developer) && /dev-context planner/.test(roles.developer));
check("designer says the window's name is not the role",
  /The window's name is not the role/.test(roles.designer));
check("SKILL.md states that the role is the skill in your hand",
  /A role is the skill in your hand, not the window you are sitting in/.test(skill));
check("the authoring guide carries the invariant",
  /No downstream role may create upstream intent/.test(authoring));

// A role file that copies a rule instead of pointing at it is the drift this
// split exists to prevent, so the two longest definitions may appear nowhere here.
for (const [r, text] of Object.entries(roles)) {
  check(`roles/${r}.md does not restate the stamp format`,
    !/<br>/.test(text), "the stamp format belongs to progress-tracker.md");
}

for (const line of ok) process.stdout.write(`  ok   ${line}\n`);
for (const line of failures) process.stdout.write(`  FAIL ${line}\n`);
process.stdout.write(`\nrole context docs: ${ok.length} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
