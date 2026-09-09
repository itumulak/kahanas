# Upgrading

How to move a project already using these skills onto a newer version.

**Two things are involved, and only one of them is disposable.**

| | Where it lives | On upgrade |
| --- | --- | --- |
| The skills | `.claude/skills/dev-*` or `.agents/skills/dev-*` | **delete and reinstall** |
| OpenCode command wrappers | `.opencode/commands/dev-*.md` | **delete and reinstall with the OpenCode installer** |
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

For OpenCode, replace both the skills and their slash command wrappers in one pass:

```bash
rm -rf .agents/skills/dev-* .opencode/commands/dev-*.md
npx --yes github:itumulak/kahanas -a opencode
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
dev-design/templates/, dev-scope/templates/, dev-audit/templates/, and
dev-loop/templates/, wherever the skills were
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
- If note-registry.md exists, migrate every row into decision-log.md as an
  Evidence row. Preserve the original Timestamp, Author, Skill, Task, Actor
  where present, and evidence text. Do not change an existing decision-log
  row. Check that every source row has one destination row before removing
  note-registry.md. Report the row counts before and after.
- If audit-register.md is new, copy dev-audit/templates/audit-register.md and
  leave both tables empty. Do not invent findings, statuses, routes, or QA
  runs. Do not create loop-state.md: /dev-loop creates it only when a run
  begins.
- Add any section the new templates have that my existing documents lack.
  Where a section needs a real value you cannot derive, leave the placeholder
  and list it for me rather than guessing.
- Convert every build-plan.md task to the current Goal and subtask goal shape.
  Use its existing one line outcome as Goal and retain its UI and Logic items
  as subtask goals. Then cross check the Stack table, System Boundaries, data
  flow, Invariants, Security model, Value Sourcing table, and operator duties
  in architecture.md. Add a settled build affecting commitment to each task
  that establishes or relies on it, using its exact approved name rather than
  a generic category. This is not a new decision. If the correct task is
  ambiguous, report the gap instead of choosing one.
- Convert progress-tracker.md to one aggregate row per build-plan.md task and
  one child row per numbered UI and Logic subtask. The aggregate row includes
  the task Goal. Every child row copies its label and goal from build-plan.md
  word for word and stays in plan order. Preserve each old task row as the
  aggregate row. If it was DONE, give its children unstamped DONE values. If
  it was BASELINE, give every child BASELINE with the migration model and
  minute, since that stamp records this inventory. Otherwise start children
  at PENDING unless existing records prove a more specific state. Child Verify
  Check cells start at an em dash. Preserve any old aggregate Verify Check as
  legacy task level history, but add a line below the table stating it does not
  imply child verification. Run /dev-check verify to stamp every child after
  its conditions are actually checked. Never invent a child stamp.
- Reformat every existing tracker and design registry stamp so the value,
  author, and timestamp render on separate lines with literal `<br>` tags.
  Keep the same fields and strike through history. This is formatting only.
  New stamps never join their fields with commas, and superseded stamps have
  `<br><br>` between the struck old stamp and the current stamp.
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

**Let sections arrive lazily.** Most additions are a new section in a document `/dev-architect` or `/dev-design` already owns, and it writes them next time it runs. Nothing breaks in the meantime: a skill that looks for a missing section reports it rather than failing. Only add one by hand when you want its benefit before the next pass by the skill that owns it, which for a design section is `/dev-design` and may be a while.

---

## What each version needs

Templates live in `skills/dev-architect/templates/`, except `design.md` and `design-registry.md`, which are in `skills/dev-design/templates/`, `project-overview.md`, `glossary.md`, and `human-decisions.md`, which are in `skills/dev-scope/templates/`, `audit-register.md`, which is in `skills/dev-audit/templates/`, and `loop-state.md`, which is in `skills/dev-loop/templates/`. The `harness.md` template lives in `skills/dev-harness/templates/`, but `/dev-harness config` owns creating it; do not copy it into a project by hand.

### Coming from 0.9.0: role contexts, shorter records, and archived log rows

**Role contexts need nothing added to your project.** `/dev-context planner`, `developer`, `designer`, `coordinator`, or `reviewer` reads a file the skill ships and briefs the session as that role. The plain `/dev-context` behaves exactly as before. Use the role form when a session is picking up somebody else's unfinished work, or when it is running on a model or a tool that has never seen this project.

Want a role of your own, or a sharper version of a shipped one? Write `.konteksto/roles/<name>.md` and commit it. A project file of the same name wins over the shipped one, so reinstalling the skills never loses it. `skills/dev-context/roles/writing-a-role.md` holds the shape, and `/dev-context` never writes one for you: it is read only, and a role a model invents each session is not a role.

**If you run the harness**, its three briefs now open by sending the worker to `/dev-context <role>`, and the rules that were never about the harness moved into the role file. Nothing in `.konteksto/harness.md` changes. A role your project invented needs `.konteksto/roles/<name>.md` as well as its `.konteksto/harness-prompts/<name>.md`, because the brief now sends it somewhere to read.

Nothing to migrate. An existing `.konteksto/tooling.md` has no Record detail section, and a missing section means `BRIEF`, so your records get shorter the next time a skill appends to one. Nothing already written changes.

Want the long form back? Add the section from `skills/dev-architect/templates/tooling.md` and set it, or run `/dev-architect` and let it ask:

```text
**Detail:** FULL
```

**Brief never drops a finding, a failure, a decision, an assumption, a root cause, a stamp, an approval, or the location of the evidence behind a pass.** It drops routine confirmations, narration, and the reasoning behind a decision already recorded. If you find something missing from a record that belongs on that list, that is a defect rather than the setting working, and it is worth reporting.

**An already huge `decision-log.md` shrinks on the next `/dev-sync`**, which offers to move a closed phase's rows into `.konteksto/logs/` and asks before doing it. Say no and it leaves the file alone. Nothing is summarised or deleted either way, and the archive keeps the log's own columns, so an old row reads exactly as it did.

### Coming from 0.8.1: the optional code graph

Nothing to migrate, and nothing to add by hand. An existing `.konteksto/tooling.md` has no Code Graph section, and a missing section reads as a question nobody has been asked yet, so the next `/dev-architect` run offers one and records whatever you answer.

Say no and it writes `Status: DECLINED` with your reason, which stops it being raised again. Every skill that can use a graph checks that Status first and falls back to searching and reading, which is what all of them did before, so a project that never wires one behaves exactly as it does today.

To turn it on without running the whole skill, run `/dev-architect` and let it reach step 6b. It picks a tool, checks it against the languages in your Stack table, hands you the install and wiring commands to run yourself, then builds the graph and proves it answers before recording it.

**Already installed one yourself?** The skills still will not use it until that section exists, because the section is what holds the commands they call. Until then each one says so once and points at `/dev-architect`, rather than going quiet on you. That run confirms what is already installed instead of setting it up again, so the whole migration is the record.

### Coming from 0.8.0: reviewing a design from another machine

Nothing to migrate. An existing `.konteksto/tooling.md` has no Remote access row, and a missing row reads as though the person approving is at the machine running the review, which is the ordinary case.

Add the row only where that is untrue, meaning the skills run on a VPS, a container, or a remote development box while the person approving is elsewhere. Put it in the Visual verification table, with the command that forwards both of the session's origins to the person's own machine:

```text
| Remote access | ssh -L <review port>:127.0.0.1:<review port> -L <asset port>:127.0.0.1:<asset port> <host> |
```

The ports are chosen per session, so the row holds the shape and `/dev-design` substitutes the real ones from what the server printed. Keep each port number the same on both sides: the harness compares parsed origins, so a port remapped in transit is a different origin and the review page can no longer load the prototype it is reviewing.

Or run `/dev-architect` and let it ask. On a machine with no display it recommends forwarding; anywhere else it recommends `NONE`.

### Coming from 0.7.x: the optional harness

Version 0.8.0 adds `/dev-harness`, an opt-in runner that spreads `/dev-loop` across separate [Herdr](https://herdr.dev) panes. Existing projects need no harness document migration. If Herdr is missing, `/dev-harness config` offers its official stable installer and verifies the binary; then launch Herdr, enter the project there, and run `config` again to finish pane setup:

```text
/dev-harness config
```

That command creates `.konteksto/harness.md`, records the pane roster and operational choices, and preserves any active `.konteksto/loop-state.md` for a bare `/dev-harness start` to resume. If you do not use the harness, do nothing; Herdr is not required for the rest of Kahanas.

A Claude coordinator may use Claude Remote Control after configuration verifies it; every other coordinator communicates through its pane and cannot reach a person who is away from the session.

Pushing is an explicit configuration choice. With `Push on hand back: off`, the harness keeps commits and branches local and refuses pull request creation. With it on, workers use only the configured remote and working branch, and the coordinator may open or update a pull request at completion. Outside the harness, `/dev-document pr` now opens or updates the pull request directly when a usable remote and authenticated `gh` are available; otherwise it prints the draft and the reason it could not publish it.

`audit-register.md` also accepts `resolved` for a reviewed static finding that has no runtime case for `/dev-qa`. Let `/dev-audit` make that transition from fresh review evidence rather than rewriting existing issue statuses during migration.

### Coming from 0.7.x or earlier

Create `.konteksto/human-decisions.md` from `skills/dev-scope/templates/human-decisions.md`. Leave its Decisions section empty. Do not reconstruct old questions, options, selected answers, or recommendation markers from `project-overview.md`, `architecture.md`, or chat history. Those documents prove only the outcome, not exactly what the person was shown. `/dev-scope`, `/dev-architect`, and `/dev-design` append new human choices from this point forward.

### Coming from 0.6.x or earlier

**Merge `note-registry.md` into `decision-log.md` before removing it.** Every
note row becomes one new Evidence row. Preserve its timestamp, author, skill,
task, actor when present, and the evidence it recorded. Do not stamp or
rewrite historic evidence, and do not alter existing decision-log rows.
Compare the row counts and report any source row that cannot be mapped before
removing the old file.

**New file: `audit-register.md`.** Copy
`skills/dev-audit/templates/audit-register.md` and leave its Issues and QA
Runs tables empty. It starts tracking future review findings and regression
observations; it must not reconstruct old ones.

**Do not create `loop-state.md`.** `/dev-loop` creates it from its template
only when a delivery run begins. `/dev-context` is read only, and the other
new skills need no migration record.

After reinstalling, use `/dev-context` for a handoff, `/dev-loop` for a task
sequence, `/dev-audit` after review, and `/dev-qa` to rerun eligible runtime
findings.

### Retired phase checkpoints

Phase checkpoints are no longer part of this workflow. Do not create or update
Checkpoint blocks or Checkpoints tables. Keep any existing checkpoint records
as historical project data, but do not treat them as a gate, an approval, or
active work for any skill.

`role.local.json` is retired with checkpoints. It is no longer read or
created, so it may be removed from `.konteksto/` and `.gitignore`.

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

### Coming from 0.6.0, on a project with an `app/`

**Two rows to add to the Visual verification section of `tooling.md`, and one workaround to delete.**

**Check**, the command that proves the tool and its browser both work, which is not the install command. On the default answer it is the probe that ships with `/dev-design`:

```bash
node <skill folder>/dev-design/review-harness/preflight.mjs --project <package root>
```

**Run it once now.** It exits 0 when the package resolves and the browser launches, 69 when no Playwright is reachable, and 70 when the browser was never downloaded. A project whose end to end suite works can still fail it, which is the point: an install for a test runner is not a design review setup.

**Package root**, the directory whose `package.json` has Playwright. Write the project root where they are the same, which is the usual case. **Write the real one where a workspace holds `.konteksto/` at the top and the npm package one level down**, because Playwright is then below the project root and nothing above it will ever find it.

**Then delete the workaround, if you built one.** A `package.json` at the project root that exists only to put `node_modules` on the harness's search path, with its own copy of Playwright, was the way through this under 0.6.0. It is no longer needed, and it costs something to keep: two installs to hold at the same version, and a review running against a browser the product never uses if they drift. Point `--project` at the package that was always the real one, confirm the probe exits 0, then remove the extra `package.json` and its `node_modules`.

**Nothing else needs doing.** Sessions now stop themselves and are stopped with a file rather than a signal, and that is entirely inside the harness you reinstalled.

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

## Updating `progress-tracker.md`

Every tracker uses one table per phase. Each build plan task becomes an aggregate row, followed immediately by one child row for every numbered UI and Logic subtask. The table columns are `Task or subtask`, optional `Assigned`, `Status`, `Verify Check`, and `Note`. There is no separate Goals column because the goal belongs in the row whose state it defines.

For each task:

- **Aggregate row**, copy the task number, title, and Goal from `build-plan.md` word for word. Preserve the old task row's Assigned, Status, Verify Check, and Note cells.
- **Child rows**, copy every numbered UI and Logic label and goal word for word, in plan order. Never combine two bullets in one row or shorten one to a category name.
- **Assigned**, on a team project only. Preserve the aggregate value. Every child reads `inherits task`.
- **Child Status**, use unstamped `DONE` when the preserved aggregate Status is `DONE`, since the earlier aggregate claim covered the whole task but did not record child provenance. Use `BASELINE` on every child of a baseline task and stamp the migration model and minute, because that stamp records the inventory rather than the old build. Otherwise use `PENDING` unless an existing record proves a more specific child state. Never invent a child model or time.
- **Child Verify Check**, use `—`. An old aggregate pass is task level history, not proof that each new child was checked separately. Preserve that aggregate cell, then add a line under the table saying aggregate Verify Check values predate child verification and do not imply child passes. `/dev-check verify` fills the children only after checking every condition and then supersedes the aggregate verdict with the new rollup.
- **Note**, preserve the aggregate cell. Child Notes start at `—` unless an existing record identifies the exact child that is blocked or failed right now.

When converting checkboxes, a ticked task becomes an unstamped aggregate `DONE` and gives each child an unstamped `DONE`. An unticked task and its children become `PENDING`. Every Verify Check is `—`. Add a line below the table saying those rows predate stamping.

Reformat existing stamps without changing their value, author, timestamp, or order. Each stamp uses three rendered lines inside one Markdown table cell:

```
DONE<br>claude-opus-5<br>2026-08-09 14:32
```

Never join the three fields with commas. Keep strike through around the whole old stamp, and put `<br><br>` between a struck old stamp and its replacement. This is a presentation migration, not a new claim, so it does not violate the rule against stamping old work.

**`—` on every new child Verify Check is the correct outcome, not a gap to fill.** It says truthfully that nobody checked that subtask under the older tracker shape. Run `/dev-check verify` to judge each child surgically and stamp it after the check.

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
