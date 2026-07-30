---
name: dev-develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-develop to build the next task from .konteksto/build-plan.md, or a named one. Reads the architecture and code standards, builds, then ticks the progress tracker. If a load bearing decision is owed and no document records it, it stops and routes you to /dev-architect instead of inventing one."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The builder. Turns one task from `build-plan.md` into working code that follows `code-standards.md` and fits `architecture.md`.

Builds **one task at a time**, in the order the plan sets, and ticks it off before starting the next. A task with **UI** bullets builds components and pages. A task with **Logic** bullets builds APIs, services, and data layers. A task with both builds both.

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
- `.konteksto/progress-tracker.md`, on every task. This is what tells the next session where things stand, so it is updated as part of finishing a task, never batched up for later.

  **One line in it is not yours.** `/dev-check verify` writes a Notes line when it proves a task works. Leave that line alone, and never write it yourself, because it is the record that something was actually exercised rather than merely built.
- `.konteksto/ui-registry.md`, one section per reusable component, at the moment the component is built. `/dev-architect` creates the file empty, and every entry in it comes from here.

**Never writes:**

- `project-overview.md`, `architecture.md`, `code-standards.md`, `library-docs.md`, `tooling.md`, `design.md`, `build-plan.md`. If the build proves one of them wrong, stop and say so. Changing the design mid build is `/dev-architect`'s call, not something to fix quietly in passing.
- `docker-compose.yml`. `/dev-architect` owns it. A missing service is a reason to stop and report, not to add one.

## Guardrails

**Never invent a decision.** Step 1 is a hard gate, not a formality.

**Never build ahead.** One task, then the tracker, then stop.

**Never mark a task done that you did not see work.** Ticking a box is a claim. Back it with a command you ran and its output.

**Never install a package the design did not name.** A dependency absent from `code-standards.md`'s approved list is a change to the design. Stop and ask.

**Never reset the local database on your own initiative.** `tooling.md`'s Local Data Lifecycle section decides that, and someone else's work in progress may be sitting in it.

**Never verify your own work.** Running the app and confirming it matches the flow belongs to `/dev-check verify`, deliberately, because the thing that wrote the code is the worst judge of whether it does what the product needed.

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
- **The task is already ticked in `progress-tracker.md`.** Stop and ask before rebuilding.

Warnings, not blocks, but say them out loud.

### Step 1: The decision gate

**Do not judge this by feel.** Asking yourself "am I inventing something?" fails, because a build in progress rationalizes a real decision as ordinary wiring and waves it through. Use a mechanical test instead:

> **List every value this task must produce, store, or display. For each one, check the Value Sourcing table in `architecture.md` first, then the rest of the documents. Does anything name where it comes from? An input, a database column, a derivation from a named value, or a decision already recorded? Any required value with no named source is an owed decision.**

The Value Sourcing table exists for exactly this test. `/dev-architect` filled it by tracing every value the flows need, so a row missing there is the gap this test is meant to catch.

A decision is also owed when you would otherwise invent:

- A library, provider, or integration `code-standards.md` does not list.
- A data model or a column `architecture.md`'s schema does not have.
- A whole page's composition, when `project-overview.md` gives the flow and `design.md` does not settle the pattern.
- A behavior a flow step constrains but no document defines.

**What counts as a local detail instead.** Only a choice among options the documents already permit: a variable name, a loop shape, which existing helper to call. **The moment a choice fixes where a value comes from, or changes a behavior the flows constrain, it is load bearing however small it looks.**

When unsure, treat it as owed. Building an unnoticed decision is the expensive failure. One extra question is not.

**Where to look, in this order.** Read narrowly.

1. This task's entry in `build-plan.md`.
2. `architecture.md`, for the stack, boundaries, schema, invariants, and the Value Sourcing table.
3. `code-standards.md`.
4. `library-docs.md`, only for a library this task uses.
5. `tooling.md`, the Local Data Lifecycle section, when the task touches the database.
6. `design.md` and `ui-registry.md`, only when the task has UI bullets.
7. `progress-tracker.md`'s Decisions Made During Build, for anything an earlier task already settled.

**Nothing owed.** Read `flow/build.md` and follow it.

**Something owed.** Do not guess and do not silently stop. Ask, naming the specific choice:

1. **Design it first** (recommended): stop here and run `/dev-architect`. Nothing is built.
2. **No decision needed**: the user judges it genuine wiring. Proceed to `flow/build.md`.
3. **Build on a stated assumption**: proceed, but first write the assumption into `progress-tracker.md` under Decisions Made During Build, as `assumed, not yet ratified`. The task gets built but **cannot be ticked** until `/dev-architect` confirms it. Say this plainly in your report.

On **Design it first**, end with:

> Run this next, then come back:
> ```
> /dev-architect
> ```
> Settle this first: <the specific choice>. Then run `/dev-develop` again and I will build to it.

The third option exists so an assumption becomes durable. Written in the tracker it survives a cleared session, a teammate reads it, and the next task builds against it rather than inventing a second, different assumption.

### Step 2: Build

Read `flow/build.md` and follow it. Do not read it when the gate ends the run.

### Step 3: Update the tracker

Only after something is verified working. Edit `progress-tracker.md` surgically. Read it again immediately before writing, in case a teammate moved it, and change only these lines:

- Tick this task's checkbox under its phase.
- Set **Last completed** to this task, and **Next** to the following one in `build-plan.md`.
- Set **Phase** when this task closed out a phase.
- Add a line under **Decisions Made During Build** for anything real: a bug found, a fix made, a local choice a later session would otherwise wonder about. Not a diary of every edit.
- Add the command you used to confirm the build is clean under **Notes**, with its result.

Never rewrite the file, and never tick a box for a task you did not build.

### Step 4: Report

Say six things:

- The task built, by number and name.
- The files written, grouped by folder.
- Anything installed, and why the design called for it.
- The command you ran to confirm it works, and its result. Quote the failing line if something failed, rather than describing it.
- Anything you noticed that belongs to another skill: a design document the build proved wrong, a missing compose service, a component worth extracting later.
- The next step: `/dev-check verify` to prove this task works against its flow, then `/dev-test` to lock the behavior in, then the next task from `build-plan.md`. A failure at verify goes to `/dev-debug`, not back here.

Then stop. Do not start the next task.

---

## Reference files

All live in this skill's folder. Read each only when you reach it, so none of them sits in context through the whole run.

- `flow/build.md`: the build flow after the gate. Track classification, what to load, the exploration subagent, resuming, rollout sequencing, and the tracker update.
- `ui-guide.md`: the UI track. The quality bar and its disqualifiers, the phases, and registering what you built.
- `logical-guide.md`: the logical track. Data layer, services, interface, integration, removing superseded code, and the safety pass.
- `checklist.md`: the accessibility and token checklist, read during the UI track's accessibility phase.
