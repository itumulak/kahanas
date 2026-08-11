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

Every skill answers to `/dev-scope`, `/dev-architect`, and so on.

**Why the prefix.** The names these skills want, `scope`, `check`, `test`, are ordinary words. Installed bare, any personal skill of the same name in `~/.claude/skills` shadows them, and the wrong one runs with no error to say which. `dev-scope` collides with nothing.

## The skills

| Skill | What it does |
|---|---|
| `/dev-scope` | Turns an idea into what the product is: pages, flows, and what is deliberately out of scope. Stays tool agnostic. |
| `/dev-architect` | Settles the stack, the design direction, the local containers, and the build plan. Makes every tool call there is. |
| `/dev-develop` | Builds one task from the plan, then stops. Refuses to invent a decision the documents do not record. |
| `/dev-check` | Two modes. `verify` runs the real app and proves the task works. `review` reads the diff on a different model than wrote it. |
| `/dev-debug` | Finds the root cause of a bug by evidence, one hypothesis at a time, then makes the smallest fix. |
| `/dev-test` | Writes the suite, grounded in the recorded invariants and value sources rather than in a coverage number. |
| `/dev-document` | Writes the prose about a change: a pull request, a changelog, a release note, or a postmortem. |
| `/dev-sync` | Makes the documents true again after a change, from repo evidence, and flags what needs a person. |

## The usual loop

Once per project:

```
/dev-scope      what the product is
/dev-architect    how it gets built
```

Then per task:

```
/dev-develop         build it
/dev-check verify    prove it works
/dev-test            keep it working
```

A verify failure goes to `/dev-debug`. Before a merge: `/dev-check review`, then `/dev-document pr`, then `/dev-sync`.

## What it produces

Eleven documents in `.konteksto/`:

```
.konteksto/
├── project-overview.md    what the product is          (/dev-scope)
├── architecture.md        stack, boundaries, invariants (/dev-architect)
├── tooling.md             containers, agent tooling
├── design.md              art direction (frontend only)
├── code-standards.md      the conventions every session follows
├── library-docs.md        version specific notes
├── build-plan.md          the ordered task list
├── progress-tracker.md    live state       (/dev-develop, plus the Verify
│                                            Check column from /dev-check)
├── decision-log.md        what was decided, and why
│                                    (/dev-develop, /dev-debug append)
├── note-registry.md       what was run, and what it proved
│                                    (/dev-develop, /dev-check, /dev-debug append)
└── ui-registry.md         reusable components           (/dev-develop updates)
```

Three of them describe the same task from three angles, and they stay separate on purpose. The tracker says **where it stands**, one word per cell, scannable a phase at a time. `note-registry.md` says **what was run** and what it showed. `decision-log.md` says **why**, which no command produces and git does not preserve. Watched it happen goes to the registry, concluded it goes to the log.

All but three have exactly one writer. `progress-tracker.md` splits by column: `/dev-develop` owns the Status of every task, and `/dev-check verify` owns the Verify Check beside it, because "the build is clean" and "somebody watched it work" are different claims and neither skill may make the other's. Both cells carry the model that stamped them and when, and a value that changes is struck through with the new one appended after it, so the whole history stays readable.

`decision-log.md` takes appends from `/dev-develop` and `/dev-debug`, and only when there was something to decide. Most tasks add nothing.

Both append only files are tables carrying a Timestamp and an **Author**, the exact model identifier that wrote the row. The Actor column beside it, the person, is team only. Author is not: the model changes between sessions when the person does not, and it is what tells a reader how much to trust a six week old row.

`note-registry.md` is the third: three skills append to it, each a different claim. `/dev-develop` says the build is clean, `/dev-check verify` says the behavior was exercised, `/dev-debug` says a bug was proven gone. Every row carries its timestamp and the skill that wrote it, nobody edits anybody else's row, and `/dev-sync` writes none, having run nothing itself.

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

**Nothing claims a guarantee it cannot keep.** On a team project every task carries an assignee and every note row carries the git user who ran it, and `/dev-develop` stops when a task belongs to somebody else. That is a convention, not a lock, and the documents say as much where they describe it. Two people on two machines both pass the check. Real enforcement is branch protection or an issue tracker, and pretending otherwise would be worse than offering nothing.

**A skill never signs off on itself.** Phase checkpoints are approved by a person, by hand. A skill may mark one due, because the repository proves the phase is finished, but an approval asserts that a human reviewed the work, and a tool writing its own would empty the word. Checkpoints are non blocking: the next phase starts regardless, and an unapproved one stays visible rather than stopping the line.

**A decision is never invented mid build.** `/dev-develop` runs a mechanical test before writing code: every value it must produce needs a named source. Anything unnamed stops the build and routes to `/dev-architect`, because a build in progress will rationalize a real decision as ordinary wiring.

**Proof beats assertion.** `/dev-check verify` may not report a pass it did not observe. No evidence, no pass. Never started, never pass. A tool it could not use is a block, not a pass.

**A reviewer is never the model that wrote the code.** A model reading its own output shares its own blind spots.

**Generated is not applied.** A migration that exists is not a migration that ran, and no type check will tell you the difference.

**The bar for done is set once, not per task.** `code-standards.md` carries a Definition of Done: a short table of checks with the exact command for each, written at design time and read by every skill that stamps a task. It is deliberately separate from the acceptance criteria, which change with every task, because a bar renegotiated for the task in front of you always moves in the same direction.

**A decision that is expensive to undo gets doubted before it stands.** `/dev-architect` sends the few load bearing ones to a fresh reviewer on another model, with an adversarial brief and without its own reasoning attached, since a reviewer handed your argument reviews the argument and finds it coherent. Three rounds at most, then it goes to the person.

**A note without a source is a guess in a trusted place.** Every section of `library-docs.md` says where it came from: a documentation URL and the date it was read, or a plain admission that nobody checked. Both are useful. What is not useful is a note that could be either.

Four of these were sharpened by reading [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), MIT licensed, which is worth a look on its own: the interviewing technique in `/dev-scope`, the sourcing rule, the definition of done, and the doubt pass.

## Requirements

Docker for the local stack. Git. Node 18 or later for the installer.

## License

MIT
