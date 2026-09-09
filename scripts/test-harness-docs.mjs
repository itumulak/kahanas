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
const documentSkill = await readFile(join(REPO, "skills", "dev-document", "SKILL.md"), "utf8");
const briefs = Object.fromEntries(
  await Promise.all(
    ["coordinator", "developer", "reviewer"].map(async (r) => [r, await read(`prompts/${r}.md`)]),
  ),
);

// Config must bootstrap the runtime before it asks that runtime for panes.
const installCheck = config.indexOf("command -v herdr");
const sessionCheck = config.indexOf('test "${HERDR_ENV:-}" = 1');
check("config checks whether Herdr is installed", installCheck >= 0);
check("config checks installation before the live session", installCheck >= 0 && sessionCheck > installCheck);
check("config names the official stable installer", config.includes("https://herdr.dev/install.sh"));
check("config verifies the installed binary", config.includes("herdr --version"));

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
check("dev-document checks a local-only harness before any push instruction",
  documentSkill.indexOf("Push on hand back: off") < documentSkill.indexOf("git push --set-upstream"));

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

// A retired transport must not return to the shipped harness documents.
const retiredTransport = ["tele", "gram"].join("");
const allFiles = [];
for (const dir of ["", "internal", "modes", "prompts", "templates", "agents"]) {
  const entries = await readdir(join(H, dir), { withFileTypes: true });
  for (const e of entries) if (e.isFile()) allFiles.push(join(dir, e.name));
}
for (const f of allFiles) {
  const text = await read(f);
  check(`${f} has no retired transport reference`, !new RegExp(retiredTransport, "i").test(text));
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

// config is the setup step, so it must not require a live session the way start does.
check("config runs outside a Herdr pane",
  /`config` is the setup step, so it runs from outside Herdr|Outside one, which is the ordinary case/.test(config));
check("config counts existing panes before splitting",
  config.includes("Count the panes you already have"));
check("start still requires a live session",
  (await read("modes/start.md")).includes('test "${HERDR_ENV:-}" = 1'));

// A pane's session id is what makes its own conversation recoverable.
check("config installs the session identity hook", /herdr integration install/.test(config));
check("config records the session id from the start response", /agent_session\.value|agent_session/.test(config));
check("config clears CLAUDE_CODE_CHILD_SESSION before starting a claude agent",
  /unset CLAUDE_CODE_CHILD_SESSION/.test(config));
check("roster carries a Session ID column", /\| Session ID \|/.test(template));
check("start reads Session ID before offering to rebuild a role",
  /read that row's Session ID/.test(await read("modes/start.md")));
check("start refuses to attach or resume a session itself",
  /never attach or resume a session yourself/.test(await read("modes/start.md")));

// /dev-architect and /dev-sync are routed, and each carries a condition that is the point of routing it.
const dispatchTable = dispatch.slice(dispatch.indexOf("| Recorded action |"), dispatch.indexOf("If the recorded action names"));
check("dispatch routes /dev-architect to the developer", /\| `\/dev-architect`[^|]*\| developer \|/.test(dispatchTable));
check("dispatch routes /dev-sync to the reviewer", /\| `\/dev-sync`[^|]*\| reviewer \|/.test(dispatchTable));
check("roster gives the developer /dev-architect", /\/dev-architect/.test(template));
check("roster gives the reviewer /dev-sync", /\/dev-check review[^|]*\/dev-sync/.test(template));
check("dispatch forbids a worker answering its own architect panel",
  /never answer its own panel|may never answer its own panel/.test(dispatch));
check("developer brief relays architect panels", /never answer an options panel yourself/.test(briefs.developer));
check("dispatch guards /dev-sync against a running build",
  /Never dispatch it while any worker is `working`/.test(dispatch));
check("reviewer brief reports what /dev-sync escalates", /escalates and never arbitrates/.test(briefs.reviewer));
check("/dev-scope is still an ownership gap", /`\/dev-scope` is the usual case/.test(dispatch));

// A rule stated twice in one brief is an edit that landed twice.
for (const [role, text] of Object.entries(briefs)) {
  check(`${role} brief states the /dev-harness refusal once`,
    (text.match(/Never run `\/dev-harness` in any mode/g) || []).length <= 1);
}

// start and stop belong to the coordinator, and must say so from both ends.
const start = await read("modes/start.md");
const stop = await read("modes/stop.md");
check("start refuses a worker pane and passes the command on",
  /worker's row/.test(start) && /agent prompt <coordinator agent name>/.test(start));
check("start handles being run outside a Herdr pane without failing",
  /ordinary way somebody types|hand the command to the coordinator/.test(start));
check("start runs config when the harness is not configured yet",
  /run the `config` mode instead/.test(start));
check("stop points at start's window check rather than restating it",
  /window check in `start.md`/.test(stop));
for (const role of ["developer", "reviewer"]) {
  check(`${role} brief refuses to run /dev-harness`, /Never run `\/dev-harness`/.test(briefs[role]));
}

// Unattended must be settled before agents start, since the flag cannot be added later.
// `herdr agent start --help` is a lookup, not a launch, so match the real command.
const launch = config.search(/herdr agent start <?name/);
check("config finds the launch command", launch > -1);
check("config asks about unattended before it starts agents",
  config.indexOf("run unattended") < launch);
check("config confirms roles are live after creating them",
  launch < config.indexOf("Confirm each role really came up"));


// A design handoff leaves the harness entirely: the review is a browser session a
// person drives, often in a fresh terminal that knows nothing about the run. Four
// files have to agree on that, and the surface name is the one payload that makes
// the cold session actionable.
const relay = await read("internal/relay.md");
const loop = await readFile(join(REPO, "skills", "dev-loop", "SKILL.md"), "utf8");

check("relay reaches the person when a design is waiting",
  /A design is waiting on a person/.test(relay));
check("relay names the surface as the payload that makes it actionable",
  /cannot be acted on/.test(relay) && /`\/dev-design <surface>`/.test(relay));
check("relay says the approval happens in a session, not over the wire",
  /Design approval never happens over a relay/.test(relay) &&
  /fresh session in another terminal/.test(relay));
check("relay trusts the registry row over the person's word",
  /the row is what decides/i.test(relay));

check("dispatch counts the conditional skills it actually carries",
  /## Three skills carry a condition/.test(dispatch) &&
  ["`/dev-architect` goes to the developer", "`/dev-design` goes to the developer", "`/dev-sync` goes to the reviewer"]
    .every((s) => dispatch.includes(s)));
check("dispatch still routes a design to the developer window",
  /\| `\/dev-design <surface>` \| developer \|/.test(dispatch));
check("dispatch refuses to resume before the row reads APPROVED",
  /Dispatch nothing to the developer until the row reads `APPROVED`/.test(dispatch));
check("dispatch resumes a design handoff with a bare loop",
  /Resume with a bare `\/dev-loop` to the developer once the row reads `APPROVED`/.test(dispatch));
check("dispatch warns that the design session shares the working tree",
  /share one working tree/.test(dispatch));

check("the loop records a design stop instead of leaving it unwritten",
  /`\/dev-design <surface>`/.test(loop) && /This is a handoff, not a block/.test(loop));
check("the loop resumes an owner handoff with a bare loop, never a subskill",
  /Resume with a bare `\/dev-loop`, never with `\/dev-develop <task>`/.test(loop));

check("the developer brief tells a cold model what to do with a design stop",
  /A design is never yours to invent or to approve/.test(briefs.developer) &&
  /`READY FOR REVIEW`/.test(briefs.developer) &&
  /never write `APPROVED`/.test(briefs.developer));
check("the developer brief's rule count matches its rules",
  (() => {
    const words = { Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10 };
    const claimed = briefs.developer.match(/([A-Z][a-z]+) rules for this run/);
    const actual = (briefs.developer.match(/^\d+\. /gm) || []).length;
    return claimed && words[claimed[1]] === actual;
  })(),
  "the brief says one number of rules and carries another");

for (const line of ok) process.stdout.write(`  ok   ${line}\n`);
for (const line of failures) process.stdout.write(`  FAIL ${line}\n`);
process.stdout.write(`\nharness docs: ${ok.length} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
