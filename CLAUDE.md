# Kahanas

A skill set that carries a project from an idea to shipped code, keeping the reasoning in version controlled documents rather than in a chat log.

## The workflow

| Skill | Owns | Answers |
| --- | --- | --- |
| `/dev-scope` | `project-overview.md` | What the product is |
| `/dev-architect` | `architecture.md`, `tooling.md`, `design.md`, `code-standards.md`, `library-docs.md`, `build-plan.md`, plus the starting state of `progress-tracker.md`, `note-registry.md`, and `ui-registry.md` | How it gets built |
| `/dev-develop` | the code, every update to `progress-tracker.md` and `ui-registry.md`, and a clean build row in `note-registry.md` | Builds it |
| `/dev-check` | `.konteksto/reviews/`, plus one `note-registry.md` row on a verify pass | Confirms it actually works |
| `/dev-debug` | the minimal fix, a line in the decision log, and a fix confirmed row in `note-registry.md` | Finds out why it does not |
| `/dev-test` | the test files, and `test-preferences.json` | Stops it breaking again |
| `/dev-document` | `CHANGELOG.md`, `.konteksto/releases/`, `.konteksto/postmortems/` | Explains it to people |
| `/dev-sync` | corrections to `progress-tracker.md` and `ui-registry.md` from repo evidence | Makes the documents true again |

Ten documents in all, and `design.md` is the only optional one: it is skipped entirely for a backend with no `app/`.

**The usual loop:** `/dev-scope` once, `/dev-architect` once, then per task `/dev-develop`, `/dev-check verify`, `/dev-test`. A verify failure goes to `/dev-debug`. Before a merge, `/dev-check review`, then `/dev-document pr`, then `/dev-sync`.

**`test-preferences.json` is a cross skill contract.** `/dev-test` owns it, and `/dev-check review` reads it to decide whether missing coverage is a finding at all. A project that deliberately has no test runner records that there, and the review then stops asking for one.

**Where a document has more than one writer, every side says so.** `note-registry.md` is created empty by `/dev-architect` and appended to by three skills: `/dev-develop` records the command that proved the build clean, `/dev-check verify` records what it exercised on a pass, and `/dev-debug` records the check that proved a fix. All four files state the rule from their own side, and so does the registry itself, in its Who writes what section. An unstated extra writer is how this system rots.

**Those three rows are three different claims, which is why they are not one row.** A clean build is not a working feature, and a passing verify is not a fixed bug. Collapsing them loses exactly the distinction a later session needs.

**Append only, and never across writers.** A row is a claim about a moment that has already passed. A skill appends its own row and edits nobody's, and `/dev-sync` writes none at all, because it has run nothing and a fabricated observation reads exactly like a real one.

`progress-tracker.md` sits on the other side of that split: `/dev-architect` creates it, `/dev-develop` is its only updater. Keeping it single writer is why the note rows moved out of it.

**Every generated document is stamped.** A document written by a skill ends with a drafted by line, so a later maintenance pass can tell what a tool wrote from what a person wrote **instead of guessing**. `/dev-sync` reads it: stamp present means a wrong fact may be corrected surgically; stamp gone means a person owns the file, so add a missing fact but never rewrite an existing line.

The stamp records provenance, not permission. It never licenses overwriting something someone edited.

**A gap and a contradiction are different problems.** A gap is a fact missing that the repo can prove, and it gets filled. A contradiction is a document disagreeing with the code, and it never gets resolved automatically, because from the outside you cannot tell whether the code drifted or the document was deliberate and the code broke it.

One rule holds the split together: **`/dev-scope` owns the what and never names a tool. `/dev-architect` owns the how and makes every tool call.**

Projects consume this through `.konteksto/`, filled from `templates/`. A template is read, never edited in place.

## Writing a new skill

Every skill in `skills/` follows this shape. A new one is not finished until it has all of it.

```
skills/dev-<name>/
├── SKILL.md              required, the instructions every client reads
├── agents/
│   └── openai.yaml       required, interface metadata for Codex
├── modes/                optional, one file per mode when the skill routes
└── *.md                  optional, bundled files read on demand
```

**Every skill carries the `dev-` prefix in three places**, and they must agree: the folder name, the `name:` frontmatter inside `SKILL.md`, and every reference to it in any document. The registry keys on the frontmatter name, so a folder and a name that disagree install something the agent then cannot find. The local installer refuses that case, which is the check that catches it.

The prefix is not cosmetic. The names these skills want, `scope`, `check`, `test`, are ordinary words, and a personal skill of the same name in `~/.claude/skills` shadows a bare project skill with no error to say which one ran. That is a real failure this project already hit. `dev-scope` collides with nothing.

**Never name a file after its own folder.** `skills/dev-check/SKILL.md`, never `skills/dev-check/dev-check.md`.

**`SKILL.md`, exactly that name, in that case.** Linux is case sensitive, so `SKILL.MD` will not load.

**Every `SKILL.md` opens with the frontmatter and the output style block**, copied verbatim from an existing skill. The block is delimited by `OUTPUT-STYLE:START` and `OUTPUT-STYLE:END` so it can be updated across every skill at once.

**Every skill gets `agents/openai.yaml`.** These are distributed to Codex as well as Claude Code, and the file supplies the name, blurb, and opening prompt its agent picker shows. It is interface metadata only and carries no logic, since the instructions live in `SKILL.md`. Copy the shape from any existing skill and change the three values.

**State artifact ownership explicitly**, both what the skill writes and what it must never touch. Two skills writing the same file is how this whole system rots.

**Put detail a skill only sometimes needs in a bundled file**, and say in `SKILL.md` when to read it. A rubric that only a subagent needs is passed to it as a path, and never read into the main context.

## Conventions inside a skill

**Plain words, no dashes, no hyphens.** The output style block is the full rule, and it applies to the skill file itself, not only to what the skill produces.

**Ask with a recommendation, never a neutral menu.** 2 to 4 real options, exactly one marked as recommended with a one line why. `AskUserQuestion` where available, the same options as plain text otherwise.

**Say why a rule exists** when the reason is not obvious. A rule with its reasoning survives editing; a bare rule gets optimized away by the next person who reads it.
