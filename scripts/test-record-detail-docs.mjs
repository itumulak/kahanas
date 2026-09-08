#!/usr/bin/env node
// Consistency checks across the record detail files.
//
// One setting governs how much six skills write, and its floor is the only thing
// stopping "brief" from quietly meaning "lost the finding you needed". That floor
// is stated once and consumed in six places, which is the shape that rots: a
// consumer restates the floor slightly differently, or an owner starts trimming
// something the floor protects. These assertions are for that class.

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
const architect = await read("skills", "dev-architect", "SKILL.md");
const log = await read("skills", "dev-architect", "templates", "decision-log.md");
const sync = await read("skills", "dev-sync", "SKILL.md");
const reviewPrompt = await read("skills", "dev-check", "review-agent-prompt.md");
const overview = await read("CLAUDE.md");

const consumers = {
  "dev-architect/templates/decision-log.md": log,
  "dev-develop/SKILL.md": await read("skills", "dev-develop", "SKILL.md"),
  "dev-check/modes/verify.md": await read("skills", "dev-check", "modes", "verify.md"),
  "dev-check/modes/review.md": await read("skills", "dev-check", "modes", "review.md"),
  "dev-debug/SKILL.md": await read("skills", "dev-debug", "SKILL.md"),
  "dev-audit/SKILL.md": await read("skills", "dev-audit", "SKILL.md"),
  "dev-qa/SKILL.md": await read("skills", "dev-qa", "SKILL.md"),
};

// The canonical section, and the default that makes an unasked project safe.
const section = tooling.slice(tooling.indexOf("## Record detail"), tooling.indexOf("## Doubt pass rounds"));
check("tooling template has a Record detail section", section.startsWith("## Record detail"));
check("the section offers exactly two values",
  /\*\*Detail:\*\* <BRIEF \| FULL>/.test(section));
check("an unanswered project defaults to BRIEF",
  /no section at all, means `BRIEF`/.test(section));

// The floor is the whole safety of this feature, so it is stated and it is absolute.
const floor = section.slice(section.indexOf("### The floor"), section.indexOf("### What BRIEF drops"));
for (const protectedThing of ["finding", "failure", "blocker", "decision", "assumption", "root cause", "approval", "evidence"]) {
  check(`the floor protects a ${protectedThing}`, new RegExp(protectedThing, "i").test(floor));
}
check("the floor outranks brevity where they conflict",
  /the floor wins/.test(floor));
check("the section says what brief drops, separately from the floor",
  /### What BRIEF drops/.test(section) && /routine confirmation/.test(section));

// Intent documents and reader facing prose are out of scope, and named.
const exempt = section.slice(section.indexOf("### What this setting does not govern"));
for (const doc of ["/dev-document", "project-overview.md", "architecture.md", "build-plan.md", "human-decisions.md"]) {
  check(`the section exempts ${doc}`, exempt.includes(doc));
}
check("the section says why a spec is exempt",
  /short specification is not a concise one/.test(exempt));

// Every consumer states its own consequence and points at the definition.
for (const [file, text] of Object.entries(consumers)) {
  check(`${file} points at the Record detail section rather than restating it`,
    /Record detail section of `tooling\.md`/.test(text));
  check(`${file} names the BRIEF default`, /no section at all, means `BRIEF`/.test(text));
  check(`${file} says what BRIEF changes for it`, /Under `BRIEF`/.test(text));
}

// The two records that must never shrink say so in their own words.
check("a review keeps every finding at full length",
  /keeps every finding at full length/.test(consumers["dev-check/modes/review.md"]));
check("the reviewer's own prompt carries the same rule",
  /RECORD_DETAIL/.test(reviewPrompt) && /never a finding/.test(reviewPrompt));
check("review mode supplies RECORD_DETAIL to the prompt",
  /\| `RECORD_DETAIL` \|/.test(consumers["dev-check/modes/review.md"]));
check("the audit register keeps every issue",
  /no issue is ever left out/.test(consumers["dev-audit/SKILL.md"]));
check("debug's rows survive brief, since a root cause is on the floor",
  /both are still written/.test(consumers["dev-debug/SKILL.md"]));

// The architect asks once and never again.
check("the architect asks for the setting and records it",
  /Record detail section/.test(architect) && /Never ask a second time/.test(architect));
check("the architect appends the panel to human decisions",
  /Append the panel to `human-decisions\.md`/.test(architect));

// Archival moves rows and rewrites none, which is what keeps append only true.
check("sync archives a closed phase behind an ask",
  /### Step 4a: Archive a closed phase's log rows/.test(sync) && /Ask first, with the number/.test(sync));
check("sync moves rows byte for byte and summarises none",
  /byte for byte/.test(sync) && /Never summarise a row/.test(sync));
check("sync refuses to move a row whose task is not proved",
  /never move a row belonging to an open task/.test(sync));
check("sync leaves a pointer row behind",
  /Append one pointer row/.test(sync));
check("sync's boundary table grants the move and still forbids the rewrite",
  /Move a closed phase's `decision-log\.md` rows/.test(sync) &&
  /\| Add or rewrite any row in `decision-log\.md` \| ❌ leaves alone/.test(sync));
check("sync says the ask is its one pause beyond having nothing to do",
  /asks first because moving somebody's history is not a correction the repo proves/.test(sync));
check("the log template names the archive and its owner",
  /decision-log-phase-<NUMBER>\.md/.test(log) && /continued backwards/.test(log));
check("an archive is read only when history that far back is needed",
  /only when you need history that far back/.test(log));

// The overview orients without carrying the detail.
check("the overview names the rule and where it is defined",
  /A record is written to be acted on later/.test(overview) &&
  /\| How much a record says, and the floor it may never drop \| `tooling\.md` \|/.test(overview));
check("the overview records the archive under its owner",
  /`\.konteksto\/logs\/`/.test(overview));
check("the overview justifies the archive against the new artifact test",
  /same owner, lifecycle, and truth source/.test(overview));

for (const line of ok) process.stdout.write(`  ok   ${line}\n`);
for (const line of failures) process.stdout.write(`  FAIL ${line}\n`);
process.stdout.write(`\nrecord detail docs: ${ok.length} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
