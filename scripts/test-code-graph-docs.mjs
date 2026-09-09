#!/usr/bin/env node
// Consistency checks across the code graph files.
//
// The rule lives in one place, the Code Graph section of the tooling template,
// and six other files carry only a trigger, an action, and a pointer at it. That
// shape is exactly the one that rots: a consumer names a command row the template
// no longer has, or a second file quietly restates the rule in its own words and
// then disagrees with the first. These assertions are for that class.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFile(join(REPO, ...p), "utf8");
const failures = [];
const ok = [];

function check(name, condition, detail) {
  if (condition) ok.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

const tooling = await read("skills", "dev-architect", "templates", "tooling.md");
const procedure = await read("skills", "dev-architect", "internal", "code-graph.md");
const architect = await read("skills", "dev-architect", "SKILL.md");
const discovery = await read("skills", "dev-architect", "internal", "tool-discovery.md");
const overview = await read("CLAUDE.md");

// The consumers, each keyed by the file that carries its own trigger and action.
const consumers = {
  "dev-context/SKILL.md": await read("skills", "dev-context", "SKILL.md"),
  "dev-develop/flow/build.md": await read("skills", "dev-develop", "flow", "build.md"),
  "dev-debug/SKILL.md": await read("skills", "dev-debug", "SKILL.md"),
  "dev-check/modes/review.md": await read("skills", "dev-check", "modes", "review.md"),
  "dev-sync/SKILL.md": await read("skills", "dev-sync", "SKILL.md"),
};

// The canonical section must exist, and must be the thing that answers "is there one".
const section = tooling.slice(tooling.indexOf("## Code Graph"), tooling.indexOf("## Local Data Lifecycle"));
check("tooling template has a Code Graph section", section.startsWith("## Code Graph"));
check("the section carries a Status with all three answers",
  /\*\*Status:\*\*/.test(section) && ["WIRED", "DECLINED", "DEFERRED"].every((v) => section.includes(v)));

// Every command row a consumer names has to be a row in the template's table.
const rows = new Set(
  [...section.matchAll(/^\| ([A-Z][^|]*?) \| /gm)].map((m) => m[1].trim()),
);
const named = {
  "dev-context/SKILL.md": ["Repo orientation", "Locate"],
  "dev-develop/flow/build.md": ["Locate", "Surface of a file", "References to a symbol"],
  "dev-debug/SKILL.md": ["References to a symbol"],
  "dev-check/modes/review.md": ["Reach of a diff"],
  "dev-sync/SKILL.md": ["Locate", "References to a symbol"],
};
for (const [file, wanted] of Object.entries(named)) {
  for (const row of wanted) {
    check(`${file} names the row ${row}, and the template has it`,
      consumers[file].includes(row) && rows.has(row),
      rows.has(row) ? "the consumer stopped naming it" : "the template has no such row");
  }
}
check("the procedure and the section agree on the enrichment row",
  rows.has("Enrichment") && /Enrichment/.test(procedure));
check("the section names a freshness check the procedure can record",
  rows.has("Freshness check") && rows.has("Build"));

// Every consumer points at the definition and gates on the same Status value.
for (const [file, text] of Object.entries(consumers)) {
  check(`${file} points at the Code Graph section rather than restating it`,
    /Code Graph section of `tooling.md`/.test(text));
  check(`${file} gates on Status WIRED`, /WIRED/.test(text));
  check(`${file} says what it does when there is no graph`,
    /Any other Status|no graph|falls back|`none`/.test(text));
}

// An absent section is its own state: every consumer routes, and none of them guesses.
check("the section defines the absent case as a fourth state",
  /No section at all is a fourth state/.test(section) &&
  /predates the question/.test(section));
for (const [file, text] of Object.entries(consumers)) {
  check(`${file} routes an unrecorded graph to /dev-architect`,
    /No Code Graph section at all\?/.test(text) && /`\/dev-architect`/.test(text));
  check(`${file} refuses to query a graph no document records`,
    /Do not query a graph no document records/.test(text));
}

// No skill file may hardcode a tool's commands. They live in the tooling rows,
// because the project picks the tool and a command written twice goes stale once.
const COMMANDS = /\bgraft\s+(build|ask|callers|map|blast|check|skeleton|grep|init|viz|uninstall)\b/;
for (const [file, text] of Object.entries({ ...consumers, "dev-architect/internal/code-graph.md": procedure, "dev-architect/SKILL.md": architect, "dev-architect/templates/tooling.md": tooling })) {
  check(`${file} hardcodes no graph tool command`, !COMMANDS.test(text),
    "the commands belong in the tooling rows, not in a skill file");
}

// Only the architect installs, wires, builds, or enriches.
check("the section says a person installs and wires it",
  /A person installs it and a person wires it/.test(section));
check("the section forbids any other skill installing or building it",
  /Nothing else may install, wire, build, or enrich it/.test(section));
for (const [file, text] of Object.entries(consumers)) {
  check(`${file} claims no install, build, or enrichment`,
    !/\b(install|enrich)(ing|es)? the (code )?graph\b/i.test(text));
}

// The consent gate is shared text, so the two files that carry it must be identical.
const gate = (text) => {
  const start = text.indexOf("<!-- TOOL-CONSENT:START -->");
  const end = text.indexOf("<!-- TOOL-CONSENT:END -->");
  return start > -1 && end > start ? text.slice(start, end) : null;
};
check("the procedure carries the shared consent gate, unchanged",
  gate(procedure) !== null && gate(procedure) === gate(discovery));
check("the procedure asks before it runs anything",
  procedure.indexOf("Step 1: Ask first") < procedure.indexOf("Step 3: Install, wire, and build"));
check("the procedure records a decline as well as a yes",
  /DECLINED/.test(procedure) && /DEFERRED/.test(procedure) && /human-decisions\.md/.test(procedure));
check("the procedure skips itself once the question is answered",
  /already has a Code Graph section with a Status/.test(procedure));

// The architect has to reach the procedure, and say when.
check("the architect runs the procedure at a named step",
  /### Step 6b: The code graph/.test(architect) && /`internal\/code-graph\.md`/.test(architect));
check("the architect lists the procedure in its reference files",
  architect.lastIndexOf("`internal/code-graph.md`") > architect.indexOf("## Reference files"));

// The overview orients without carrying the rule's detail.
check("the overview names the rule and where it is defined",
  /A code graph is a shortcut to evidence/.test(overview) &&
  /\| What a code graph answer is worth \| `tooling\.md` \|/.test(overview));
check("the overview carries no command rows of its own", !/Reach of a diff/.test(overview));

for (const line of ok) process.stdout.write(`  ok   ${line}\n`);
for (const line of failures) process.stdout.write(`  FAIL ${line}\n`);
process.stdout.write(`\ncode graph docs: ${ok.length} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
