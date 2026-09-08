#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const INSTALLER = join(REPO, "scripts", "install-local.mjs");
const SOURCE_COMMANDS = join(REPO, ".opencode", "commands");

function install(target, ...args) {
  const result = spawnSync(process.execPath, [INSTALLER, target, ...args], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

async function skillNames() {
  const entries = await readdir(join(REPO, "skills"), { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

const scratch = await mkdtemp(join(tmpdir(), "kahanas-installer-"));

try {
  const names = await skillNames();
  const commandFiles = (await readdir(SOURCE_COMMANDS)).sort();
  assert.deepEqual(commandFiles, names.map((name) => `${name}.md`));

  for (const name of names) {
    const command = await readFile(join(SOURCE_COMMANDS, `${name}.md`), "utf8");
    assert.match(command, /^---\ndescription: .+\n---\n/);
    assert.ok(command.includes(`load \`${name}\``));
    assert.match(command, /\$ARGUMENTS\s*$/);
  }

  const project = join(scratch, "all");
  await mkdir(project);
  install(project, "-a", "opencode");

  assert.deepEqual((await readdir(join(project, ".agents", "skills"))).sort(), names);
  assert.deepEqual((await readdir(join(project, ".opencode", "commands"))).sort(), commandFiles);
  assert.equal(
    await readFile(join(project, ".agents", "skills", "dev-scope", "templates", "human-decisions.md"), "utf8"),
    await readFile(join(REPO, "skills", "dev-scope", "templates", "human-decisions.md"), "utf8")
  );

  const subset = join(scratch, "subset");
  await mkdir(subset);
  install(subset, "-a", "opencode", "--only", "dev-develop");
  assert.deepEqual(await readdir(join(subset, ".agents", "skills")), ["dev-develop"]);
  assert.deepEqual(await readdir(join(subset, ".opencode", "commands")), ["dev-develop.md"]);

  const wrapper = join(subset, ".opencode", "commands", "dev-develop.md");
  await writeFile(wrapper, `${await readFile(wrapper, "utf8")}\n<!-- local edit -->\n`);
  install(subset, "-a", "opencode", "--only", "dev-develop", "--remove");
  assert.match(await readFile(wrapper, "utf8"), /local edit/);

  install(project, "-a", "opencode", "--remove");
  assert.deepEqual(await readdir(join(project, ".agents", "skills")), []);
  assert.deepEqual(await readdir(join(project, ".opencode", "commands")), []);

  const generic = join(scratch, "generic");
  await mkdir(generic);
  install(generic, "-a", "agents", "--only", "dev-develop");
  await assert.rejects(readdir(join(generic, ".opencode", "commands")));

  console.log(`installer: ${names.length} OpenCode command wrappers passed`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
