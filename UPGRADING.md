# Upgrading

How to move a project already using these skills onto a newer version.

**Two things are involved, and only one of them is disposable.**

| | Where it lives | On upgrade |
| --- | --- | --- |
| The skills | `.claude/skills/dev-*` or `.agents/skills/dev-*` | **delete and reinstall** |
| Your documents | `.konteksto/` | **never delete**, migrate in place |

Nothing in the skills folder is yours, so replacing it wholesale is the clean path. `.konteksto/` is the entire point of the workflow: decisions, notes, and verdicts that no command produces and the repository does not preserve. A fresh `/dev-scope` cannot regenerate any of it.

---

## Replace the skills

```bash
rm -rf .claude/skills/dev-*
npx skills@latest add itumulak/kahanas -a claude-code
```

Or for the generic folder that Codex and others read:

```bash
rm -rf .agents/skills/dev-*
npx skills@latest add itumulak/kahanas
```

**Delete rather than installing over the top.** A version that removes a file leaves it behind otherwise, and a stale bundled file is worse than a missing one, because the skill that no longer reads it still looks like it might.

---

## Three rules for the documents

**Never backfill.** A new file starts empty rather than reconstructed. Writing decisions nobody made, notes for commands nobody ran, or approvals nobody gave produces a document that reads exactly like a true one, and a later session cannot tell the difference. Empty is honest and costs nothing.

**Never stamp old work.** Stamps name a model and a minute. You do not know which model built a task under an older version, and inventing one defeats the reason the column exists. Set the value, leave the stamp off, and say in the file that it predates stamping.

**Let sections arrive lazily.** Most additions are a new section in a document `/dev-architect` already owns, and it writes them next time it runs. Nothing breaks in the meantime: a skill that looks for a missing section reports it rather than failing. Only add one by hand when you want its benefit before the next architect pass.

---

## What each version needs

Templates live in `skills/dev-architect/templates/`, except `project-overview.md` and `glossary.md`, which are in `skills/dev-scope/templates/`.

### Coming from 0.1.0

**New file: `decision-log.md`.** Copy the template and start it empty, or move the old Decisions Made During Build section out of `progress-tracker.md` into it. Both are fine. That section no longer exists in the tracker template.

**`progress-tracker.md` becomes a table per phase.** This is the only genuine work in the whole upgrade, and it is covered in its own section below.

### Coming from 0.2.0 or earlier

**New file: `glossary.md`.** Start it with the terms your product already uses, taken from `project-overview.md`. This is the one file worth ten minutes of backfilling, because the terms are already settled and written down; you are recording them, not inventing them.

**New file: `design-registry.md`, plus `.konteksto/designs/`.** Frontend only, skipped entirely for a backend with no `app/`. See the section below, because an existing frontend needs care here.

**New section in `code-standards.md`: Definition of Done.** A short table of checks with the exact command for each. Worth adding by hand, since `/dev-develop` reads it before stamping anything `DONE`.

**New sections in `tooling.md`: Visual verification and Doubt pass rounds.** Visual verification names the browser tool and screenshot command, and without it `/dev-check verify` reports every UI conformance item as blocked. Doubt pass rounds holds one number, and `/dev-architect` asks for it the first time it needs one.

**New lines in `library-docs.md`: a Source per section.** Every existing section is unverified until somebody checks it, so mark them honestly rather than guessing:

```
**Source**: none, written from model knowledge and not checked against the official docs
```

That is not busywork. A remembered gotcha and a verified one look identical on the page, and the whole point of the line is telling them apart.

### Coming from 0.3.0

Nothing. 0.4.0 changed how the instructions are written and not what they produce.

---

## Converting `progress-tracker.md`

The Progress section was a checkbox list and is now one table per phase. Copy the shape from `templates/progress-tracker.md`, then per task:

- **Task**, the name from `build-plan.md`, unchanged.
- **Assigned**, on a team project only. Leave it `unassigned` unless you actually know.
- **Status**, `DONE` for a ticked task, `PENDING` for an unticked one. **No stamp**, because you do not know which model did it or when.
- **Verify Check**, `—` on every row. Nothing was verified under the old version, since the column did not exist, and writing `PASSED` would claim somebody watched it work.
- **Note**, `—` unless the task is genuinely blocked right now.

Then add a line under the table saying these rows predate stamping. Everything from here on gets stamped normally.

**`—` on every Verify Check is the correct outcome, not a gap to fill.** It says truthfully that nobody has checked yet, and `/dev-check verify` fills it in as you go.

---

## `design-registry.md` on a frontend that already exists

The awkward case, because `/dev-develop` refuses to build a surface with no approved design, and a project built under an older version has no prototypes at all. Left alone, every UI task blocks.

Two workable approaches.

**Record what exists, then move forward.** Add a row per surface already built, with its file left as `—` and a Note saying it predates the registry. Add real rows with prototypes only for surfaces you have not built yet. Simple, honest, and the existing pages stay buildable.

**Or adopt gradually.** Add rows only for new work. Everything already shipped stays outside the registry until you touch it, and the first time you rework a surface it gets a prototype like any new one.

**Do not mark a row `APPROVED` to unblock yourself.** Nobody approved a design that does not exist, and that word is what every rule downstream depends on. A Note saying the surface predates the registry is true and does the same job.

---

## After the upgrade

Run `/dev-sync` once. It reconciles the tracker against the repository, flags documents the change made stale, and reports what needs a person. It writes nothing it cannot prove, so it will not paper over a gap left by the migration.

Then read what it reports rather than skimming it. A migration is exactly the situation its escalation list exists for.
