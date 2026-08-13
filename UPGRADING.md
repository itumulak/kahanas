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

## Let an agent do the documents

Reinstalling the skills is the shell command above and takes a second. Migrating the documents is the part worth handing over.

**Replace `<OLD VERSION>` with the version you are coming from, then paste this into a session in your own project.** Everything below it in this file is what the prompt encodes, so read on if you would rather do it yourself or want to check the result.

```text
I have just upgraded the Kahanas dev skills from <OLD VERSION> to the version
now installed. Migrate my .konteksto/ documents to match the new templates.

Read the templates that shipped with the upgrade before changing anything.
They are in the installed skills folder, under dev-architect/templates/,
dev-design/templates/, and dev-scope/templates/, wherever the skills were
installed (.claude/skills or .agents/skills). Compare each one against my
existing document.

Three rules matter more than completeness, and I would rather the migration
be honest than tidy.

1. Never backfill. A new file starts empty unless the content already exists
   somewhere in my documents and you are moving it. Do not invent decisions,
   notes, or approvals. An invented row reads exactly like a real one and I
   will not be able to tell them apart later.
2. Never stamp old work. Stamps name a model and a minute, and neither of us
   knows which model built anything under the old version. Set values, leave
   stamps off, and add a line under the table saying those rows predate
   stamping. One exception, and only one: a BASELINE row you write during
   this migration carries your own model and the minute you write it, because
   that stamp records the recording rather than the building, which is what
   the templates say it means. Everything else you convert stays unstamped.
3. Do not create a document my project has no use for. The design ones are
   frontend only and are skipped entirely for a backend with no app/ folder.

Then do this:

- Add any document the new templates have that I do not. Start it empty,
  except glossary.md, where you should record the terms already used in
  project-overview.md. You are recording settled terms, not inventing them,
  so tell me which ones you took and which you were unsure about.
- Add any section the new templates have that my existing documents lack.
  Where a section needs a real value you cannot derive, leave the placeholder
  and list it for me rather than guessing.
- Convert progress-tracker.md if its Progress section is still a checkbox
  list. One table per phase. A ticked task becomes DONE, an unticked one
  PENDING, every Verify Check cell is an em dash, and Note is an em dash
  unless the task is genuinely blocked right now. An em dash in every Verify
  Check is the correct result: nothing was verified under a version that had
  no such column.
- If my project has an app/ folder and design-registry.md is new, add a row
  per surface already finished, with its status BASELINE stamped per rule 2
  above, its file left as an em dash, and its Note an em dash. BASELINE says
  the surface was finished before the registry existed, so it owes no
  prototype and blocks nothing. A half built surface is not one: give it
  MISSING, because the row saying a thing is unfinished is the only thing
  that will get it finished. Never write APPROVED for a design that does not
  exist. That word is what every downstream rule depends on, and I would
  rather a UI task block than have it mean nothing.
- Mark every existing library-docs.md section unsourced, since nobody
  verified them.
- Never edit anything in .konteksto/designs/. Not a prototype, not a file
  in sources/, not to add a newer convention a template mentions. Those
  belong to the dev-design skill, and an approved prototype changed by
  a migration is a design nobody approved. Tell me what you would have
  changed instead.

Never delete or overwrite anything in .konteksto/ that holds real content.
Moving a section between documents is fine. Discarding one is not.

When you are done, report: the files you created, the sections you added,
anything you left as a placeholder, and anything you were not confident
about. Do not smooth over a gap. I want the list.
```

**Check the diff before committing it.** The prompt is written to make an agent stop and ask rather than guess, but the failure worth watching for is the opposite of a broken migration: a plausible one, with stamps and decisions that look real and are not.

---

## Three rules for the documents

**Never backfill.** A new file starts empty rather than reconstructed. Writing decisions nobody made, notes for commands nobody ran, or approvals nobody gave produces a document that reads exactly like a true one, and a later session cannot tell the difference. Empty is honest and costs nothing.

**Never stamp old work.** Stamps name a model and a minute. You do not know which model built a task under an older version, and inventing one defeats the reason the column exists. Set the value, leave the stamp off, and say in the file that it predates stamping.

**Let sections arrive lazily.** Most additions are a new section in a document `/dev-architect` or `/dev-design` already owns, and it writes them next time it runs. Nothing breaks in the meantime: a skill that looks for a missing section reports it rather than failing. Only add one by hand when you want its benefit before the next architect pass.

---

## What each version needs

Templates live in `skills/dev-architect/templates/`, except `design.md` and `design-registry.md`, which are in `skills/dev-design/templates/`, and `project-overview.md` and `glossary.md`, which are in `skills/dev-scope/templates/`.

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

### Coming from 0.5.0 or earlier: design is now `/dev-design`

**No document changes, and that is the whole migration.** `design.md`, `design-registry.md`, and everything in `designs/` keep their paths, their shapes, and their contents. What changed is which skill writes them.

Reinstalling the skills, which you have already done above, is all that is required. Two things worth knowing afterwards:

**Run `/dev-design` rather than `/dev-architect` for anything visual.** A new surface, a revision, a design a build made stale, or a visual gap `/dev-develop` reported. `/dev-architect` no longer writes any of the three design artifacts and will tell you so.

**On an existing codebase, the adoption baseline is now two questions with two owners.** `/dev-architect` asks whether features already built appear in the plan, and `/dev-design` asks whether surfaces that already exist owe prototypes. If you already answered both under an older version, your documents already record the answers and nothing re asks them.

### Coming from 0.5.0 or earlier, on a project with an `app/`

Nothing here is a document migration, and all of it is frontend only. A backend with no `app/` skips this section entirely.

**Install a browser, because design approval now needs one.** `/dev-design` renders every proposal before asking anybody to approve it, so a project with no browser can no longer approve a design through the skill. Playwright with Chromium is the default:

```bash
npm install --save-dev @playwright/test && npx playwright install chromium
```

**Fill in the Visual verification section of `tooling.md`.** It is no longer optional on a frontend project, and it gained an install command and a review command beside the capture one. `/dev-architect` owns that file and writes it next time it runs, and doing it by hand now is worth it, since `/dev-design` and `/dev-check verify` both read it.

**Your existing prototypes have no state contract, and they will not be reviewable until they do.** Each one now reaches every state in its Required states cell from the page address, as `<file>.html#state=<name>`, with the registry's spelling lowercased and spaces written as hyphens. **Do not hand edit them and do not ask an agent to bulk edit them.** Everything in `.konteksto/designs/` belongs to `/dev-design`, and an approved prototype edited in place is a design nobody approved. Add the fragment when a surface next comes back through the lifecycle for a reason of its own.

**Nothing already approved is invalidated.** An `APPROVED` row stays approved and `/dev-develop` keeps building against it. The one thing you lose in the meantime is that `/dev-check verify` reaching a state by click path is less certain than reaching it by address, and it reports what it did either way.

**Do not re review your approved designs to get them through the new session.** The point of the session is that nobody approves a surface without seeing it run, and a person already did see these, whatever the mechanism was. Re running them adds ceremony and no evidence.

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

**This is the adoption baseline, and the registry now has a value for it.** Add a row per surface already finished at `BASELINE`, with its file left as `—`. That value means the surface was finished before the registry existed, so it owes no prototype, blocks nothing, and needs no Note to explain itself. A surface that was half built gets `MISSING` like any other unfinished one. Add real rows with prototypes for those and for surfaces you have not started.

**Stamp the `BASELINE` rows you write**, with your own model and the minute you write them. That is the one place this migration stamps anything, and it is not an exception to the never stamp old work rule: the stamp records that you wrote the row down, not that anybody built the surface then. `design-registry.md`'s Stamping section is where that holds.

**A baseline surface re enters the lifecycle when you recompose it**, meaning its layout, hierarchy, or interactions change. A copy or content change leaves it where it is. `design-registry.md`'s Status values section is where that rule lives.

**Do not mark a row `APPROVED` to unblock yourself.** Nobody approved a design that does not exist, and that word is what every rule downstream depends on. `BASELINE` is true and does the job that Note used to do.

**If your progress tracker is being backfilled with features that were already finished**, use `BASELINE` there too, never `DONE`. `DONE` claims a build somebody ran and watched come back clean, and a stamp naming a model and a minute nobody knows is exactly the fabrication these rules exist to prevent.

---

## After the upgrade

Run `/dev-sync` once. It reconciles the tracker against the repository, flags documents the change made stale, and reports what needs a person. It writes nothing it cannot prove, so it will not paper over a gap left by the migration.

Then read what it reports rather than skimming it. A migration is exactly the situation its escalation list exists for.
