# Kahanas

A document driven engineering workflow, as Agent Skills.

It takes a project from an idea to shipped, verified code, and keeps every decision in version controlled documents rather than in a chat log. A new session reads the documents and knows where things stand, so nothing depends on remembering a conversation that has since been cleared.

Works with any Agent Skills client: Claude Code, Codex, Cursor, and others.

## Install

```bash
# Claude Code (installs into .claude/skills, then restart Claude Code)
npx skills@latest add itumulak/kahanas -a claude-code

# Generic .agents/skills, read by Codex and other agents
npx skills@latest add itumulak/kahanas
```

Commit the installed folder to share the workflow with your team.

## The skills

| Skill | What it does |
|---|---|
| `/scope` | Turns an idea into what the product is: pages, flows, and what is deliberately out of scope. Stays tool agnostic. |
| `/architect` | Settles the stack, the design direction, the local containers, and the build plan. Makes every tool call there is. |
| `/develop` | Builds one task from the plan, then stops. Refuses to invent a decision the documents do not record. |
| `/check` | Two modes. `verify` runs the real app and proves the task works. `review` reads the diff on a different model than wrote it. |
| `/debug` | Finds the root cause of a bug by evidence, one hypothesis at a time, then makes the smallest fix. |
| `/test` | Writes the suite, grounded in the recorded invariants and value sources rather than in a coverage number. |
| `/document` | Writes the prose about a change: a pull request, a changelog, a release note, or a postmortem. |
| `/sync` | Makes the documents true again after a change, from repo evidence, and flags what needs a person. |

## The usual loop

Once per project:

```
/scope        what the product is
/architect    how it gets built
```

Then per task:

```
/develop         build it
/check verify    prove it works
/test            keep it working
```

A verify failure goes to `/debug`. Before a merge: `/check review`, then `/document pr`, then `/sync`.

## What it produces

Nine documents in `.konteksto/`, each owned by exactly one skill:

```
.konteksto/
├── project-overview.md    what the product is          (/scope)
├── architecture.md        stack, boundaries, invariants (/architect)
├── tooling.md             containers, agent tooling
├── design.md              art direction (frontend only)
├── code-standards.md      the conventions every session follows
├── library-docs.md        version specific notes
├── build-plan.md          the ordered task list
├── progress-tracker.md    live state                    (/develop updates)
└── ui-registry.md         reusable components           (/develop updates)
```

Plus `docker-compose.yml` and `.env.example` at the root, and a project laid out as:

```
.
└── /
    ├── backend/
    ├── app/
    ├── other-folders/
    └── docker-compose.yml
```

## Ideas it is built on

**One owner per document.** Two skills writing one file is how a system like this rots. Where a file genuinely has two writers, every side says so.

**A decision is never invented mid build.** `/develop` runs a mechanical test before writing code: every value it must produce needs a named source. Anything unnamed stops the build and routes to `/architect`, because a build in progress will rationalize a real decision as ordinary wiring.

**Proof beats assertion.** `/check verify` may not report a pass it did not observe. No evidence, no pass. Never started, never pass. A tool it could not use is a block, not a pass.

**A reviewer is never the model that wrote the code.** A model reading its own output shares its own blind spots.

**Generated is not applied.** A migration that exists is not a migration that ran, and no type check will tell you the difference.

## Requirements

Docker for the local stack. Git. Node 18 or later for the installer.

## License

MIT
