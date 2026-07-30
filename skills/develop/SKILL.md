---
name: develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /develop to build the next task from .konteksto/build-plan.md, or a named one. Reads the architecture and code standards, builds, then ticks the progress tracker. If a load bearing decision is owed and no document records it, it stops and routes you to /architect instead of inventing one."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The builder. Turns one task from `build-plan.md` into working code that follows `code-standards.md` and fits `architecture.md`.

Builds **one task at a time**, in the order the plan sets, and ticks it off before starting the next. A task with **UI** bullets builds components and pages. A task with **Logic** bullets builds APIs, services, and data layers. A task with both builds both, UI last, so it wires to something real.

It decides nothing load bearing. That is the whole point of the gate in step 1.

## Where this sits

| Skill | Owns | Answers |
| --- | --- | --- |
| `/scope` | `project-overview.md` | What the product is |
| `/architect` | the five design documents, plus the starting state of `progress-tracker.md` and `ui-registry.md` | How it gets built |
| `/develop` | the code, and every update to `progress-tracker.md` and `ui-registry.md` | Builds it |

## Artifact ownership

**Writes:**

- Application code, in the folders `project-overview.md`'s Project Shape section fixed. Server code in `backend/`, client code in `app/`, unless that section records a custom layout, in which case follow the real one.
- `Dockerfile.dev` per half, when the compose file `/architect` wrote refers to one that does not exist yet.
- `.konteksto/progress-tracker.md`, on every task. This is the file that tells the next session where things stand, so it is updated as part of finishing a task, never in a batch later.
- `.konteksto/ui-registry.md`, one section per reusable component, at the moment the component is built. `/architect` creates this file empty; every entry in it comes from here.

**Never writes:**

- `project-overview.md`, `architecture.md`, `code-standards.md`, `library-docs.md`, `tooling.md`, `build-plan.md`. If the build proves one of them wrong, stop and say so. Changing the design mid build is `/architect`'s call, not a thing to fix quietly in passing.
- `docker-compose.yml`. `/architect` owns it. A missing service is a reason to stop and report, not to add one.

## Guardrails

**Never invent a decision.** Step 1 is a hard gate, not a formality.

**Never build ahead.** One task, then the tracker, then stop. A plan that says a task is visible and testable before the next starts means exactly that.

**Never mark a task done that you did not see work.** Ticking a box is a claim. Back it with a command you ran and its output.

**Never install a package the design did not name.** A dependency that is not in `code-standards.md`'s approved list is a change to the design. Stop and ask.

## Asks vs acts

Gates first, then acts. No opening round of questions, unlike `/scope` and `/architect`. The design work is already done, and its answers are in `.konteksto/`.

- **INFER** from `build-plan.md`, the six design documents, and the existing code. This covers nearly everything.
- **ASK** only what the design genuinely left open, and only when it blocks you.
- **RECOMMEND** on a local implementation choice, then proceed without waiting. A helper name or a loop shape does not need a meeting.

## Execution

### Before you build: the project must exist

Check for a source tree and a package manifest in the folders Project Shape names.

**Nothing there, and this is the first task in the plan.** Then creating the project is the job. Run the framework's own initializer for the stack `architecture.md` names, into the right folder. Install the framework and the runtime, plus only what this first task needs. Do not install every library the design mentions, since each later task installs its own. Confirm a dev server or a build actually runs before you call it done.

Write any `Dockerfile.dev` the compose file expects, then bring the stack up with `docker compose up -d` and confirm the services report healthy. A compose file that has never been run is a guess.

**Nothing there, and this is not the first task.** Stop:

> No project found to build into. Run `/develop` on the first task in `build-plan.md` to scaffold it, then come back to this one.

**Something there.** Proceed.

### Before you build: check you are not building over someone

Skip silently when this is not a git repository, or there is no remote.

Run `git fetch` quietly, pick the base branch (`main` if it exists, else `master`), and count how far behind you are with `git rev-list --count HEAD..origin/<base>`.

- **Behind by any commits.** Warn: a teammate may have already built this. Recommend pulling first.
- **Uncommitted changes in the folders this task touches.** Warn that the build will tangle with them. Let the user proceed if they say so.
- **The task is already ticked in `progress-tracker.md`.** Stop and ask before rebuilding. A ticked box means someone believed it was finished.

These are warnings, not blocks, but say them out loud.

### Step 1: The decision gate

**Do not judge this by feel.** Asking yourself "am I inventing something?" fails, because a build in progress rationalizes a real decision as ordinary wiring and waves it through. Use a mechanical test instead:

> **List every value this task must produce, store, or display. For each one, does an existing document name where it comes from? An input, a database column, a derivation from a named value, or a decision already recorded? Any required value with no named source is an owed decision.**

A decision is also owed when you would otherwise invent:

- A library, provider, or integration that `code-standards.md` does not list.
- A data model or a column that `architecture.md`'s schema does not have.
- A whole page's composition, when `project-overview.md` gives the flow but nothing says what the page is made of.
- A behavior an acceptance step constrains but no document defines.

**What counts as a local detail instead.** Only a choice among options the documents already permit. A variable name, a loop shape, which existing helper to call. The moment a choice fixes where a value comes from, or changes a behavior the flows constrain, it is load bearing however small it looks.

When unsure, treat it as owed. Building an unnoticed decision is the expensive failure. Asking one extra question is not.

**Where to look, in this order.** Read narrowly. Do not read the whole `.konteksto/` tree for every task.

1. This task's entry in `build-plan.md`, with its UI and Logic bullets.
2. `architecture.md` for the stack, the boundaries, the schema, and the invariants.
3. `code-standards.md` for the conventions this file kind must follow.
4. `library-docs.md`, only for a library this task actually uses.
5. `ui-registry.md`, only when the task has UI bullets, to reuse a component instead of building a near duplicate.
6. `progress-tracker.md`'s Decisions Made During Build, for anything an earlier task already settled.

**Nothing owed.** Proceed to step 2.

**Something owed.** Do not guess and do not silently stop. Ask, naming the specific choice:

1. **Design it first** (recommended): stop here and run `/architect` to settle it. Nothing is built.
2. **No decision needed**: the user has judged it is genuine wiring. Proceed.
3. **Build on a stated assumption**: proceed, but write the assumption into `progress-tracker.md` under Decisions Made During Build first, as `assumed, not yet ratified`. The task is built but **cannot be ticked** until `/architect` confirms the assumption. Say this plainly when you report.

On **Design it first**, end with:

> Run this next, then come back:
> ```
> /architect
> ```
> Settle this first: <the specific choice>. Then run `/develop` again and I will build to it.

The third option exists so an assumption becomes durable. Written in the tracker it survives a cleared session, a teammate reads it, and the next task builds against it instead of inventing a second, different assumption.

### Step 2: Build

Follow `code-standards.md` exactly. It exists to stop the drift that shows up across sessions, so its rules outrank your habits: file naming, import style, component ordering, handler shape, error handling, comment policy.

**Logic bullets first, UI second**, when a task has both, so the interface wires to something real rather than to a placeholder you then have to unpick.

**Before building any component, read `ui-registry.md`.** Extend what is there rather than building a near duplicate. A new component gets its section written when it is built, not later.

**Respect the boundaries** in `architecture.md`'s System Boundaries table. A folder that must not hold business logic does not get business logic because it was convenient this once.

**Every environment variable you read is declared** in `code-standards.md`'s table and present in `.env.example`. A variable that is in neither is an undocumented dependency, and the next person to clone this will hit it.

**Confirm it works.** Run the project's own checks: the type checker, the linter, the build, the dev server. For a task with UI, look at the page actually rendering. Quote the command and its result when you report.

### Step 3: Update the tracker

Only after something is verified working. Edit `progress-tracker.md` surgically. Read it again immediately before writing, in case a teammate moved it, and change only these lines:

- Tick this task's checkbox under its phase.
- Set **Last completed** to this task, and **Next** to the following one in `build-plan.md`.
- Set **Phase** when this task closed out a phase.
- Add a line under **Decisions Made During Build** for anything real that came up: a bug found, a fix made, a local choice a later session would otherwise wonder about. Not a diary of every edit.
- Add the command you used to confirm the build is clean under **Notes**, with its result.

Never rewrite the file, and never tick a box for a task you did not build.

**The done gate.** A task built on a stated assumption from step 1 stays unticked, with its assumption noted, until `/architect` ratifies it. Say so in the report rather than quietly leaving the box empty.

### Step 4: Report

Say six things:

- The task built, by its number and name.
- The files written, grouped by folder.
- Anything installed, and why the design called for it.
- The command you ran to confirm it works, and its result. Quote the failing line if something failed rather than describing it.
- Anything you noticed that belongs to another skill: a design document the build proved wrong, a missing compose service, a component worth extracting later.
- The next step: `/check verify` to prove this task actually works against its flow, then the next task from `build-plan.md`.

Then stop. Do not start the next task, and do not verify your own work here. Running the app and confirming it matches the flow is `/check verify`'s job, on purpose, because the thing that wrote the code is the worst judge of whether it does what the product needed.
