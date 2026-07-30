#!/usr/bin/env node
// Installs the skills in this repo into a project, the way
// `npx skills add <owner>/<repo>` would, but from this working copy.
//
//   node scripts/install-local.mjs ~/Projects/scratch/app -a claude-code --link
//
// --link is the one thing the real installer does not do: it symlinks instead
// of copying, so edits here are live in the target and you can fix and re-run
// without reinstalling. Use it for testing, never for a real install.

import { readdir, readFile, mkdir, rm, cp, symlink, lstat, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = join(REPO, "skills");

const AGENTS = {
  "claude-code": ".claude/skills",
  agents: ".agents/skills",
};

function parseArgs(argv) {
  const opts = { agent: "agents", link: false, force: false, dryRun: false, remove: false, only: null, target: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-a" || a === "--agent") opts.agent = argv[++i];
    else if (a === "--only") opts.only = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--link") opts.link = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--remove" || a === "--uninstall") opts.remove = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a.startsWith("-")) fail(`Unknown option: ${a}`);
    else rest.push(a);
  }
  opts.target = rest[0] ?? process.cwd();
  return opts;
}

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

const HELP = `
  install-local  install this repo's skills into a project

  Usage
    node scripts/install-local.mjs [target] [options]

  Options
    -a, --agent <name>   claude-code (.claude/skills) or agents (.agents/skills). Default: agents
    --only <a,b,c>       install a subset by name
    --link               symlink instead of copy, so edits here are live in the target
    --force              replace a skill that is already there
    --remove             uninstall the skills this repo provides
    --dry-run            print what would happen, change nothing
    -h, --help

  Examples
    node scripts/install-local.mjs ~/Projects/scratch/app -a claude-code --link
    node scripts/install-local.mjs ~/Projects/scratch/app -a claude-code --remove
`;

// A skill folder is valid when it holds a SKILL.md whose frontmatter name
// matches the folder. The registry keys on that name, so a mismatch installs
// something the agent then cannot find.
async function readSkills() {
  if (!existsSync(SRC)) fail(`No skills directory at ${SRC}`);
  const found = [];
  for (const entry of await readdir(SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(SRC, entry.name, "SKILL.md");
    if (!existsSync(manifest)) {
      console.warn(`  skipped ${entry.name}: no SKILL.md`);
      continue;
    }
    const text = await readFile(manifest, "utf8");
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const name = fm?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
    if (!name) {
      console.warn(`  skipped ${entry.name}: SKILL.md has no name in its frontmatter`);
      continue;
    }
    if (name !== entry.name) {
      console.warn(`  skipped ${entry.name}: frontmatter name is "${name}", which does not match the folder`);
      continue;
    }
    found.push({ name, dir: join(SRC, entry.name) });
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

// The personal skills directory is read for every project, so a skill of the
// same name there is the one thing most likely to make a test ambiguous.
async function warnOnCollisions(names, agent) {
  if (agent !== "claude-code") return;
  const personal = join(homedir(), ".claude", "skills");
  if (!existsSync(personal)) return;
  const installed = new Set(await readdir(personal));
  const clashes = names.filter((n) => installed.has(n));
  if (!clashes.length) return;
  console.warn(`\n  Note: these names also exist in ${personal}`);
  console.warn(`  ${clashes.join(", ")}`);
  console.warn(`  A project level skill should win, but during a test you do not want to be`);
  console.warn(`  guessing which one ran. Move the personal copies aside first if it matters.`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return console.log(HELP);

  const subdir = AGENTS[opts.agent];
  if (!subdir) fail(`Unknown agent "${opts.agent}". Use one of: ${Object.keys(AGENTS).join(", ")}`);

  const target = resolve(opts.target);
  if (!existsSync(target)) fail(`Target does not exist: ${target}`);
  if (resolve(target) === REPO) fail(`Target is this repo. Pick the project you want to install into.`);

  let skills = await readSkills();
  if (opts.only) {
    const known = new Set(skills.map((s) => s.name));
    const missing = opts.only.filter((n) => !known.has(n));
    if (missing.length) fail(`Not in this repo: ${missing.join(", ")}`);
    skills = skills.filter((s) => opts.only.includes(s.name));
  }
  if (!skills.length) fail("No valid skills found.");

  const dest = join(target, subdir);
  const label = opts.dryRun ? "would " : "";
  console.log(`\n  ${opts.remove ? "Removing from" : "Installing into"} ${dest}`);

  let changed = 0;
  for (const skill of skills) {
    const out = join(dest, skill.name);
    const present = existsSync(out);

    if (opts.remove) {
      if (!present) continue;
      // Only remove what this repo put there, so an unrelated skill of the
      // same name is never deleted by a cleanup run.
      const stat = await lstat(out);
      const ours = stat.isSymbolicLink()
        ? (await realpath(out)) === skill.dir
        : existsSync(join(out, "SKILL.md"));
      if (!ours) {
        console.log(`  kept     ${skill.name}  (not installed from here)`);
        continue;
      }
      console.log(`  ${label}remove  ${skill.name}`);
      if (!opts.dryRun) await rm(out, { recursive: true, force: true });
      changed++;
      continue;
    }

    if (present && !opts.force) {
      console.log(`  exists   ${skill.name}  (use --force to replace)`);
      continue;
    }

    console.log(`  ${label}${opts.link ? "link" : "copy"}    ${skill.name}`);
    if (opts.dryRun) { changed++; continue; }

    await mkdir(dest, { recursive: true });
    if (present) await rm(out, { recursive: true, force: true });
    if (opts.link) await symlink(skill.dir, out, "dir");
    else await cp(skill.dir, out, { recursive: true });
    changed++;
  }

  if (!opts.remove) await warnOnCollisions(skills.map((s) => s.name), opts.agent);

  console.log(`\n  ${changed} skill${changed === 1 ? "" : "s"} ${opts.dryRun ? "would change" : "changed"}.`);
  if (changed && !opts.dryRun && !opts.remove) {
    console.log(`  Restart your agent to pick them up.`);
    if (opts.link) console.log(`  Linked, so edits in ${basename(REPO)} are live in the target.`);
  }
  console.log();
}

main().catch((err) => fail(err.stack ?? String(err)));
