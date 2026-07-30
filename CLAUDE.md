# Kahanas

A skill set that carries a project from an idea to shipped code, keeping the reasoning in version controlled documents rather than in a chat log.

## The workflow

| Skill | Owns | Answers |
| --- | --- | --- |
| `/scope` | `project-overview.md` | What the product is |
| `/architect` | `architecture.md`, `tooling.md`, `design.md`, `code-standards.md`, `library-docs.md`, `build-plan.md`, plus the starting state of `progress-tracker.md` and `ui-registry.md` | How it gets built |
| `/develop` | the code, and every update to `progress-tracker.md` and `ui-registry.md` | Builds it |
| `/check` | `.konteksto/reviews/`, plus one Notes line in `progress-tracker.md` on a verify pass | Confirms it actually works |

Nine documents in all, and `design.md` is the only optional one: it is skipped entirely for a backend with no `app/`.

**Where a document has two writers, both say so.** `progress-tracker.md` is created by `/architect`, updated by `/develop` on every task, and carries one Notes line written only by `/check verify`. Each of those three files states the rule from its own side. An unstated second writer is how this system rots.

One rule holds the split together: **`/scope` owns the what and never names a tool. `/architect` owns the how and makes every tool call.**

Projects consume this through `.konteksto/`, filled from `templates/`. A template is read, never edited in place.

## Writing a new skill

Every skill in `skills/` follows this shape. A new one is not finished until it has all of it.

```
skills/<name>/
├── SKILL.md              required, the instructions every client reads
├── agents/
│   └── openai.yaml       required, interface metadata for Codex
├── modes/                optional, one file per mode when the skill routes
└── *.md                  optional, bundled files read on demand
```

**Never name a file after its own folder.** `skills/check/SKILL.md`, never `skills/check/check.md`.

**`SKILL.md`, exactly that name, in that case.** Linux is case sensitive, so `SKILL.MD` will not load.

**Every `SKILL.md` opens with the frontmatter and the output style block**, copied verbatim from an existing skill. The block is delimited by `OUTPUT-STYLE:START` and `OUTPUT-STYLE:END` so it can be updated across every skill at once.

**Every skill gets `agents/openai.yaml`.** These are distributed to Codex as well as Claude Code, and the file supplies the name, blurb, and opening prompt its agent picker shows. It is interface metadata only and carries no logic, since the instructions live in `SKILL.md`. Copy the shape from any existing skill and change the three values.

**State artifact ownership explicitly**, both what the skill writes and what it must never touch. Two skills writing the same file is how this whole system rots.

**Put detail a skill only sometimes needs in a bundled file**, and say in `SKILL.md` when to read it. A rubric that only a subagent needs is passed to it as a path, and never read into the main context.

## Conventions inside a skill

**Plain words, no dashes, no hyphens.** The output style block is the full rule, and it applies to the skill file itself, not only to what the skill produces.

**Ask with a recommendation, never a neutral menu.** 2 to 4 real options, exactly one marked as recommended with a one line why. `AskUserQuestion` where available, the same options as plain text otherwise.

**Say why a rule exists** when the reason is not obvious. A rule with its reasoning survives editing; a bare rule gets optimized away by the next person who reads it.
