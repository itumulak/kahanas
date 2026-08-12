---
name: dev-develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-develop to build the next task from .konteksto/build-plan.md, or a named one. Reads the architecture and code standards, implements UI from the approved design prototype rather than composing one, builds, then stamps the task DONE in the progress tracker. If a load bearing decision is owed and no document records it, or a surface has no approved design, it stops and routes you to /dev-architect instead of inventing one."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The builder. Turns one task from `build-plan.md` into working code that follows `code-standards.md` and fits `architecture.md`.

Builds **one task at a time**, in the order the plan sets, and stamps its Status `DONE` before starting the next. A task with **UI** bullets builds components and pages. A task with **Logic** bullets builds APIs, services, and data layers. A task with both builds both.

It decides nothing load bearing. That is what the gate in step 1 is for.

## Where this sits

**Before this:** `/dev-architect`, which settled the design and wrote the plan.

**After this:** `/dev-check verify`, which proves the task actually works. A failure there goes to `/dev-debug`.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.


## Artifact ownership

**Writes:**

- Application code, in the folders `project-overview.md`'s Project Shape section fixed. Server code in `backend/`, client code in `app/`, unless that section records a custom layout, in which case follow the real one.
- `Dockerfile.dev` per half, when the compose file refers to one that does not exist yet.
- `.konteksto/progress-tracker.md`, on every task. This is what tells the next session where things stand, so it is updated as part of finishing a task, never batched up for later. You own every column of its Progress tables **except Verify Check**, which is `/dev-check verify`'s and yours to read only. `/dev-sync` may correct your columns afterward from repo evidence, never while you are working.

  **Two things in it a person owns.** A task's assignee may be reassigned by hand, and a checkpoint approval is only ever written by hand. You may claim an unassigned task and you may mark a checkpoint due, and that is the whole of it. Do not reassign, and never approve.
- `.konteksto/decision-log.md`, an appended row whenever the build produced a real decision, a bug with a cause worth knowing, or an assumption you had to state. **Only then.** Most tasks that go to plan write nothing here, and a log padded with narration is one `/dev-document` can no longer mine. `/dev-debug` appends here too, so append your own row and leave its alone.
- `.konteksto/note-registry.md`, one appended row per task, recording the command that confirmed the build is clean and its result.

  **You are one of three writers here.** `/dev-check` appends a row on a verify pass, and `/dev-debug` appends one when it confirms a fix. Append your own row and leave theirs alone, because those rows claim something yours does not: that the behavior was exercised, or that a bug was proven gone. A clean build is neither.
- `.konteksto/ui-registry.md`, one section per reusable component, at the moment the component is built. `/dev-architect` creates the file empty, and every entry in it comes from here.

**Never writes:**

- `project-overview.md`, `architecture.md`, `code-standards.md`, `glossary.md`, `library-docs.md`, `tooling.md`, `design.md`, `build-plan.md`. If the build proves one of them wrong, stop and say so. Changing the design mid build is `/dev-architect`'s call, not something to fix quietly in passing.
- **`glossary.md` in particular is read every task and written never.** It has two writers, `/dev-scope` and `/dev-architect`, and adding a term here would make a third. Name what you build from it, and report a term it is missing rather than coining one in code, because a word that reaches the codebase first becomes the real name whatever the document says.
- `docker-compose.yml`. `/dev-architect` owns it. A missing service is a reason to stop and report, not to add one.

## Guardrails

**Never invent a decision.** Step 1 is a hard gate, not a formality.

**Never build ahead.** One task, then the tracker, then stop.

**Never mark a task done that you did not see work.** A `DONE` stamp is a claim, and it carries your model name. Back it with a command you ran and its output.

**Never install a package the design did not name.** A dependency absent from `code-standards.md`'s approved list is a change to the design. Stop and ask.

**Never reset the local database on your own initiative.** `tooling.md`'s Local Data Lifecycle section decides that, and someone else's work in progress may be sitting in it.

**Never perform acceptance verification on your own work, and always run your implementation checks.** These are two different jobs and the words matter, because told loosely the first rule reads as permission to skip the second.

| | Yours | `/dev-check verify`'s |
| --- | --- | --- |
| **Implementation checks** | build, type check, lint, the Definition of Done, rendering a page and looking at it | no |
| **Acceptance verification** | no | running the app and judging it against the flow and the approved design |

You confirm **what you built is sound**. It confirms **what was built is what the product needed**, and that claim belongs elsewhere because the thing that wrote the code is the worst judge of it.

**Skipping your own checks is not deference, it is an unverified build.** A `DONE` stamp on something you never ran is exactly what the Definition of Done exists to prevent.

## Asks vs acts

Gates first, then acts. No opening round of questions, unlike `/dev-scope` and `/dev-architect`. The design work is already done, and its answers are in `.konteksto/`.

- **INFER** from `build-plan.md`, the design documents, and the existing code. This covers nearly everything.
- **ASK** only what the design genuinely left open, and only when it blocks you.
- **RECOMMEND** on a local implementation choice, then proceed without waiting.

---

## Execution

### Before you build: the project must exist

Check for a source tree and a package manifest in the folders Project Shape names.

**Nothing there, and this is the first task in the plan.** Then creating the project is the job. Run the framework's own initializer for the stack `architecture.md` names, into the right folder. Install the framework and the runtime, plus only what this first task needs. **Do not install every library the design mentions**, since each later task installs its own. Confirm a dev server or a build actually runs before calling it done.

Write any `Dockerfile.dev` the compose file expects, then bring the stack up with `docker compose up -d` and confirm the services report healthy. A compose file that has never been run is a guess.

**Nothing there, and this is not the first task.** Stop:

> No project found to build into. Run `/dev-develop` on the first task in `build-plan.md` to scaffold it, then come back to this one.

**Something there.** Proceed.

### Before you build: check you are not building over someone

Skip silently when this is not a git repository, or there is no remote.

Run `git fetch` quietly, pick the base branch (`main` if it exists, else `master`), and count how far behind you are with `git rev-list --count HEAD..origin/<base>`.

- **Behind by any commits.** Warn that a teammate may have already built this, and recommend pulling first.
- **Uncommitted changes in the folders this task touches.** Warn that the build will tangle with them. Let the user proceed if they say so.
- **The task's Status already reads `DONE` in `progress-tracker.md`.** Stop and ask before rebuilding.
- **The task is assigned to someone else.** Only on a team project, meaning the Progress tables in `progress-tracker.md` carry an Assigned column. Read `git config user.name`, and when the assignee is a different name, stop and ask whether to build it anyway.

Warnings, not blocks, but say them out loud.

**The assignee check cannot reserve anything, and must not be described as though it can.** Two people on two machines both read the same file, both see `unassigned`, and both proceed. This catches the common case, one person noticing a task already has an owner, and nothing more. If the user needs a real guarantee, say so plainly and point at branch protection or an issue tracker rather than implying this check is one.

**Picking a task up.** When the task's Assigned cell reads `unassigned` and you are going to build it, replace it with `git config user.name` as part of the tracker update in step 3. That is the only assignee change any skill makes. **Never reassign a task away from someone else**, not even when they appear to have stopped: a person decides that, by editing the cell themselves, because the reason a task should move is never in the repository.

**The role file**, on a team project only. Read `.konteksto/role.local.json`. Missing means asking once, developer or project manager, and saving the answer as `{"role": "developer"}` or `{"role": "project-manager"}`. It is gitignored and holds this machine's answer only, so ask on each machine and never copy one person's answer to another.

Use it for one thing: knowing what to offer. A project manager gets told they may reassign a task or record a checkpoint approval by hand; a developer does not, since offering everybody every action is how the wrong person takes one. **It grants nothing.** You still never reassign and never approve, whatever it says, and it cannot tell you who the project manager on this project is, only what the person in front of you answered.

### Step 1: The decision gate

**Do not judge this by feel.** Asking yourself "am I inventing something?" fails, because a build in progress rationalizes a real decision as ordinary wiring and waves it through. Use a mechanical test instead:

> **List every value this task must produce, store, or display. For each one, check the Value Sourcing table in `architecture.md` first, then the rest of the documents. Does anything name where it comes from? An input, a database column, a derivation from a named value, or a decision already recorded? Any required value with no named source is an owed decision.**

The Value Sourcing table exists for exactly this test. `/dev-architect` filled it by tracing every value the flows need, so a row missing there is the gap this test is meant to catch.

A decision is also owed when you would otherwise invent:

- A library, provider, or integration `code-standards.md` does not list.
- A data model or a column `architecture.md`'s schema does not have.
- A whole page's composition, or any part of one, that no approved prototype settles. On a project with an `app/`, composition is `/dev-architect`'s decision and arrives as an approved file in `.konteksto/designs/`.
- A behavior a flow step constrains but no document defines.

**What counts as a local detail instead.** Only a choice among options the documents already permit: a variable name, a loop shape, which existing helper to call. **The moment a choice fixes where a value comes from, or changes a behavior the flows constrain, it is load bearing however small it looks.**

When unsure, treat it as owed. Building an unnoticed decision is the expensive failure. One extra question is not.

**Where to look, in this order.** Read narrowly.

1. This task's entry in `build-plan.md`.
2. `architecture.md`, for the stack, boundaries, schema, invariants, and the Value Sourcing table.
3. `code-standards.md`.
4. `glossary.md`, for the name of anything this task creates.
5. `library-docs.md`, only for a library this task uses.
6. `tooling.md`, the Local Data Lifecycle section, when the task touches the database.
7. `design-registry.md`, `design.md`, the approved prototype, and `ui-registry.md`, only when the task has UI bullets. Check the registry row first: a surface that is not `APPROVED` is a visual gap, and the gate below handles it. `BASELINE` is the one exception, meaning a surface that shipped before this workflow, and `ui-guide.md` states what it exempts and what ends the exemption.
8. `decision-log.md`, for anything an earlier task already settled.

**Nothing owed.** Read `flow/build.md` and follow it.

**Something owed.** Do not guess and do not silently stop. Ask, naming the specific choice:

1. **Design it first** (recommended): stop here and run `/dev-architect`. Nothing is built.
2. **No decision needed**: the user judges it genuine wiring. Proceed to `flow/build.md`.
3. **Build on a stated assumption**: proceed, but first append the assumption to `decision-log.md`, marked `assumed, not yet ratified`. The task gets built but **its Status cannot go to `DONE`** until `/dev-architect` confirms it. Say this plainly in your report.

On **Design it first**, end with:

> Run this next, then come back:
> ```
> /dev-architect
> ```
> Settle this first: <the specific choice>. Then run `/dev-develop` again and I will build to it.

**Option 3 is not available for a visual gap**, meaning something owed about how a surface looks or behaves. Only 1 and 2 exist, and the task goes `BLOCKED` with the surface named in its Note. **`ui-guide.md` defines what counts as one, what it stops, and why**, including the case where a task is half logic. Read it before applying this on a UI task.

The third option exists so an assumption becomes durable. Written in the tracker it survives a cleared session, a teammate reads it, and the next task builds against it rather than inventing a second, different assumption.

### Step 2: Build

Read `flow/build.md` and follow it. Do not read it when the gate ends the run.

### Step 3: Update the tracker, the decision log, and the note registry

Only after something is verified working. Three files, all edited surgically. Read each again immediately before writing, in case a teammate moved it.

In `progress-tracker.md`, change only these:

- Set this task's **Status** cell in its phase table to `DONE`, stamped as the table's own rules describe: `DONE, <your exact model identifier>, <YYYY-MM-DD HH:MM from the system clock>`. A cell that already holds a value is **superseded, never overwritten**: strike the old value through with `~~` and append the new one after it, leaving exactly one unstruck value at the end. Read the template's Superseding a value section if you have not.
- **Never touch the Verify Check column.** It belongs to `/dev-check verify`, and a build proves nothing about observed behavior.
- **Note** is for two rows only. Write one line when you leave this task `BLOCKED`, saying what is blocking it, since a `BLOCKED` row without a reason is incomplete. Clear a Note back to `—` when you supersede the `BLOCKED` it explained. Never write one on a `DONE` or `PENDING` row: that column means something is wrong right now, and filling it with remarks destroys the signal.
- Set **Last completed** to this task, and **Next** to the following one in `build-plan.md`.
- Set **Phase** when this task closed out a phase.
- **Team projects:** set this task's **Assigned** cell to `git config user.name` if it still reads `unassigned`. Leave every other task's assignee alone.
- **Checkpoints on:** when this task was the last one in its phase still short of `DONE`, move that phase's row in the Checkpoints table from `not due` to `due`. That is the only checkpoint change you make. **Never write an approval**, however obviously sound the phase looks, because an approval claims a person reviewed it and you are not one.

In `decision-log.md`, append one row to the bottom of the Entries table for anything real: a bug found and why it happened, a local choice a later session would otherwise wonder about, an assumption you built on. **Not a diary of every edit.** Read the file's What belongs here section before your first append. Nothing worth recording means nothing gets written, which is the normal case for a task that went to plan.

In `note-registry.md`, append one row to the bottom of the Entries table: the command you ran to confirm the build is clean, with its result.

**Both rows carry the same four stamp fields**, filled the same way:

- **Timestamp**, `YYYY-MM-DD HH:MM`, read from the system clock at the moment you write it. Never from memory.
- **Author**, your exact model identifier, for example `claude-opus-5`. This column is on both files whether the project is team or personal. Write `unknown-model` and say so in your report rather than guessing one.
- **Skill**, `/dev-develop`.
- **Actor**, `git config user.name`, on a team project only.

Read each file's own section on its columns before your first append, then append and touch nothing else.

Never rewrite any of the three, never stamp a task you did not build, and never edit a note row or a decision row you did not write.

### Step 4: Report

Say six things:

- The task built, by number and name.
- The files written, grouped by folder.
- Anything installed, and why the design called for it.
- The command you ran to confirm it works, and its result. Quote the failing line if something failed, rather than describing it.
- Anything you noticed that belongs to another skill: a design document the build proved wrong, a missing compose service, a component worth extracting later.
- **When this task closed a phase and checkpoints are on**: that the phase's checkpoint is now due, what `build-plan.md` says a reviewer must confirm, and that it needs a person other than whoever built the phase. Say that the next phase may start regardless, since checkpoints are non blocking, and that an unapproved one stays visible in the Checkpoints table until somebody deals with it.
- The next step: `/dev-check verify` to prove this task works against its flow, then `/dev-test` to lock the behavior in, then the next task from `build-plan.md`. A failure at verify goes to `/dev-debug`, not back here.

Then stop. Do not start the next task.

---

## Reference files

All live in this skill's folder. Read each only when you reach it, so none of them sits in context through the whole run.

- `flow/build.md`: the build flow after the gate. Track classification, what to load, the exploration subagent, resuming, rollout sequencing, and the tracker update.
- `ui-guide.md`: the UI track. The quality bar and its disqualifiers, the phases, and registering what you built.
- `logical-guide.md`: the logical track. Data layer, services, interface, integration, removing superseded code, and the safety pass.
- `checklist.md`: the accessibility and token checklist, read during the UI track's accessibility phase.
