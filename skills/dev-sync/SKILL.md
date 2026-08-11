---
name: dev-sync
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent
description: "Run /dev-sync as the last step after a change is complete, around merge, to keep the .konteksto documents true. Reconciles the progress tracker and the ui registry against what the repo actually shows, and flags the design documents the change made stale. Surgical edits only: it corrects lines it owns, and never rewrites a section."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Closes the loop on a finished change. The `.konteksto` documents are only worth reading if they are true, and they drift the moment a build goes slightly differently from the plan.

This reconciles what it is allowed to, from **repo evidence rather than from what anyone said**, and flags the rest. The Boundaries table below is the exact contract, and it is the whole skill.

**Reconciles what can be verified. Flags what needs a decision.** It never guesses, and it never quietly edits a document owned by another skill.

**Default to doing nothing.** A change that alters no command, convention, constraint, dependency, or structural fact does not belong in durable knowledge. A line that narrates what this change did is churn, not maintenance. **Finding nothing to sync is a normal, good outcome**, and reporting it plainly is a complete result.

**Idempotent, and that is testable.** Running this twice on the same change must make **zero** new edits the second time. Before adding anything, read the target again and check whether the fact is already there, even worded differently. Before writing any line, read the file again, because a teammate or another session may have edited it since you looked.

## Boundaries

These keep the skill from sprawling, which is the failure mode for anything that edits shared documents.

| Action | `/dev-sync` | Owner |
|---|---|---|
| Stamp a `progress-tracker.md` task `DONE` the repo proves is done | ✅ corrects | `/dev-sync` |
| Update Last completed, Next, and Phase to match the Status column | ✅ corrects | `/dev-sync` |
| Write or change a Verify Check cell | ❌ leaves alone | `/dev-check verify` |
| Register a component in `ui-registry.md` that exists in code but is missing | ✅ adds | `/dev-sync` |
| Correct a registry entry whose props no longer match the code | ✅ corrects | `/dev-sync` |
| Add a dependency to `library-docs.md` that the manifest gained | ✅ adds a stub, flags it for detail | `/dev-sync` |
| Add a task or reorder `build-plan.md` | ❌ leaves alone | `/dev-architect` |
| Edit `architecture.md`, `code-standards.md`, `design.md`, or `tooling.md` | ❌ flags as stale | `/dev-architect` |
| Edit `project-overview.md` | ❌ flags as stale | `/dev-scope` |
| Clear a task built on an unratified assumption | ❌ flags as decision debt | `/dev-architect` |
| Add or rewrite any row in `note-registry.md` | ❌ leaves alone | `/dev-develop`, `/dev-check`, `/dev-debug` |
| Add or rewrite any row in `decision-log.md` | ❌ leaves alone | `/dev-develop`, `/dev-debug` |
| Reassign a task, or change an assignee | ❌ flags for escalation | a person |
| Approve a checkpoint, or change its approvals | ❌ leaves alone | a person |
| Move a checkpoint row to `due` the repo proves is due | ✅ corrects | `/dev-sync` |
| Rewrite a line a person wrote by hand | ❌ flags the conflict | the person |
| Correct a fact in a still stamped document | ✅ corrects surgically | `/dev-sync` |

**How to tell what a person wrote.** Every document `/dev-architect` creates ends with a drafted by line. Use it:

- **The stamp is still there**: the untouched parts are a tool's work. Correct a wrong fact surgically, and leave the stamp in place.
- **The stamp is gone**: a person has taken the file over. **Add a missing fact only. Never rewrite an existing line**, and route anything that would change existing prose to a flag instead.

The stamp records provenance, not permission. It never licenses overwriting a line someone edited, and a stamped file gets the same care as any other.

**The dividing line is evidence, not policy.** Correct what the repo can prove. Flag what needs a judgment. **When unsure, flag rather than edit**, because a wrong correction to a shared document is worse than a missing one: it looks authoritative.

## Asks vs acts

**Acts.** Pauses only when there is nothing to sync. Every edit is listed in the report so it can be reviewed or reverted.

## Where this sits

**Before this:** everything else. This runs last, around a merge.

**After this:** nothing. The loop starts again at `/dev-develop` with the next task.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.

## Artifact ownership

Exactly what the Boundaries table grants, and nothing else.

It is the **sweeper**: the one skill that stamps a task another skill finished but never recorded, and registers a component someone built without registering it. Those gaps accumulate silently, and they are what make a tracker stop being trusted.

---

## Execution

### Step 1: Scope the change set

**Freshness first.** `git fetch --quiet`, then count commits behind the base branch. Behind means warning the user to pull first, since a teammate may have already synced these documents and you would be reconciling against a stale picture.

Base is `main` if it exists, else `master`.

- On the base branch: `git diff --name-status HEAD`.
- On a feature branch: `git merge-base <base> HEAD`, then `git diff --name-status <merge-base>`.

Either way add untracked files as added. Use `--name-status`, not `--name-only`, because added, modified, and deleted drive different work below.

Then filter to what you sync **from**:

- **Drop documentation and config.** `.konteksto/**`, markdown, lock files, generated output. These are targets and context, never a source.
- **Keep deletions in a separate list.** They drive the cleanup in step 3.
- **Keep dependency manifest changes in their own list**, since a new package is what `library-docs.md` needs to hear about.

**Nothing left in any list?** Stop. There is nothing to sync, and saying so is a complete result.

### Step 2: Gather the evidence

Read the tracker, the registry, and `decision-log.md`, plus the parts of the plan you need. Read narrowly. The decision log is where an unratified assumption is recorded, and that is the one thing in it that changes what you may do here.

For each task in `progress-tracker.md` whose Status is not `DONE`, ask whether the repo **proves** it is done:

- The files its bullets describe exist and contain what they promised.
- For a data task, the migration exists **and** the schema is live, per the rule in `/dev-develop`'s `logical-guide.md` phase 2. Query the real database rather than trusting the migration file.
- For a UI task, the component exists and is reachable.

**Proof means what is in the repo, not what a commit message claims.** A commit saying "add password reset" is a claim, and the route either exists or it does not.

**Only act on an unambiguous match.** Stamp a task only when the file plainly belongs to it. Where code could belong to either of two tasks, do not pick: record it as ambiguous and move on.

**Be conservative.** Stamp on clearly present evidence, and when unsure, leave it. A finished task still reading `PENDING` is a small annoyance. An unfinished one stamped `DONE` sends the next session past work that was never done.

**You cannot confirm the Definition of Done, so say so rather than implying you did.** That table in `code-standards.md` is the bar `/dev-develop` clears before stamping, and clearing it means running its commands. You run nothing, for the same reason you write no note row: a check you did not run and an observation you did not make are the two things this skill must never fabricate.

So the stamp you write here is a narrower claim than the one `/dev-develop` writes, and your report says which tasks carry it: the code the task promised is plainly in the repo, and nobody has confirmed it meets the project's bar. Point those at `/dev-develop` to finish the check, alongside `/dev-check verify` for the ones with an empty Verify Check.

**Do not run the commands yourself to close the gap.** Running a build is not reconciliation, it changes the working tree, and it turns a maintenance pass into a build session nobody asked for.

**A document you cannot parse does not get edited.** A tracker with broken headings or a hand edit that broke its shape is reported as needing a person, never repaired by guessing. Never act on a misread.

### Step 3: Reconcile

**The tracker.** Stamp `DONE` on every task the evidence proves, in the shape that file's Progress section sets: `DONE, <your exact model identifier>, <YYYY-MM-DD HH:MM from the system clock>`, superseding the old value by striking it through rather than overwriting it. Update Last completed, Next, and Phase to match the Status column.

**The Verify Check column is read only to you**, exactly as the note registry is, and for the same reason. That cell says a model ran the app and watched a behavior, and you have run nothing. Stamping it would be fabricating an observation. A task stamped `DONE` here with an empty Verify Check is reported as never verified, and pointed at `/dev-check verify`.

**The note registry is read only to you.** Never append a row, and never edit one. Every row there is a claim that a specific skill ran a specific thing and saw a specific result, and you have run nothing. A row you wrote would be a fabricated observation, which is worse than a missing one, because it reads exactly like a real one to the next session.

**`decision-log.md` is read only to you for the same reason.** Every row there is somebody's reasoning at a moment, and you did not build anything, so you decided nothing. Read it for the rows marked `assumed, not yet ratified`, which are what keep their tasks off `DONE`, and write nothing into it. Its Task column is what lets you match a row to a task without guessing.

**Read it for evidence, though.** It is the best record of who touched what, and on a team project its Actor column is the only place that says so.

**Assignments.** Do not change one, ever, in either direction. Claiming a task belongs to somebody needs a reason that lives in a conversation, not in the repository. Two things get flagged instead:

- **A task with note rows from more than one actor.** Two or more people worked the same task. Flag it for escalation and name every actor, every commit involved, and every branch you can see carrying the work. **Stop there.** Deciding which branch survives, or resolving the conflict between them, is a person's call and usually a project manager's. Recommending a branch would be guessing at intent from file contents, and the wrong guess quietly discards somebody's work.
- **A `DONE` task still reading `unassigned`.** Somebody built it without claiming it. Flag it, and name the actor from its note rows as the likely owner. **Do not write that name in.** A note row proves who ran a check, not who owns the task.

**Checkpoints.** One correction only: a phase whose tasks all read `DONE` but whose checkpoint row still reads `not due` moves to `due`, because the repository proves that much. Never write an approval and never clear one. An approval is a claim that a person reviewed something, and you have reviewed nothing. A phase sitting at `due` is reported, not resolved, and it blocks nothing, so never treat it as a reason to hold anything up.

Report, without changing anything, a phase approved by developers only where the project wanted a project manager's sign off. The roles are written beside the names in the Approved by column, so this is read directly rather than worked out. Say it once in the report and leave the table alone.

**A task built on an unratified assumption stays off `DONE`**, however finished the code looks. Only `/dev-architect` clears that, and stamping it here would erase the one signal that a decision is still owed.

**The registry.** For every reusable component in the code with no entry, add one: what it is for, its props, and a short real usage example read from an actual call site. For an entry whose props no longer match the code, correct the entry, because the code is the truth and a stale registry causes duplicates.

**Deletions.** A component deleted in this change gets its registry entry removed. An orphaned entry is worse than a missing one: it sends the next session looking for something that is gone.

Fix any pointer in a document that now targets a deleted or moved path. **If you are not certain a deletion is permanent, flag it rather than deleting.** Removing a real entry costs more than leaving a stale one for a day.

**Dependencies.** A new package in the manifest gets a stub entry in `library-docs.md` naming what it is and where it is used, then flag it so `/dev-architect` can add the version specific notes. **Do not invent gotchas you have not verified.**

Give the stub the Source line the template defines for exactly this case:

```
**Source**: none yet, stub added from the manifest, needs `/dev-architect`
```

**Write that line even though it looks like filler.** A section with no Source reads as an oversight, and the next skill along cannot tell whether somebody checked the docs and forgot the line or never checked at all. This says which, in one line, and it is the only reason the stub is safe to leave behind.

### Step 4: Separate a gap from a contradiction

These are different problems and they get handled differently. Conflating them is how a maintenance pass quietly overwrites something deliberate.

- **A gap** is a fact missing from a document that the repo can prove. Nothing disagrees, something is simply absent. **Apply it**, within the boundaries above.
- **A contradiction** is a document saying one thing while the code shows another. **Never resolve one yourself.** Say what the document claims, what the repo actually shows, and let the user decide which is wrong. Either the code drifted, or the document was deliberate and the code broke it, and **you cannot tell which from the outside**.

Report a contradiction in that shape: this file says X, the code shows Y.

### Step 5: Flag what you must not touch

This is half the value of the skill, so be specific. A flag naming the file, the line, and the contradiction is actionable. "Docs may be stale" is not.

**Be strict. Noise erodes trust.** Flag only when you can name the specific thing the change contradicts. **Never flag a vague "this might be affected"**, because a report full of maybes trains the reader to skim past the one that mattered. When in doubt, do not flag.

Flag when:

- The folder structure no longer matches `architecture.md`.
- A boundary in the System Boundaries table is being violated by code that now exists.
- A new value is produced with no row in the Value Sourcing table.
- The stack gained something `architecture.md` does not list.
- A convention in `code-standards.md` is contradicted by the code that shipped.
- `build-plan.md` has no task for work that clearly happened.

Each flag names the document, what the repo shows instead, and which skill fixes it.

**Escalations are a separate list**, because they go to a person rather than to a skill, and burying them among the document flags is how they get skimmed past. Raise one when a task's note rows carry more than one actor, or when a `DONE` task is still unassigned. Name the task, every actor on it, and the branches involved, then stop. **Never recommend which branch to keep.** From the outside, two branches touching one task look the same whether one is a rewrite of the other or both hold work nobody wants lost, and picking wrong throws away someone's day.

### Step 6: Report

Output this block. **Omit any section that is empty** rather than writing a heading with nothing under it.

```
## /dev-sync complete

SCOPE: <N> changed files, <branch against base | uncommitted>

RECONCILED:
- <file>, <what you stamped, added, or corrected, one line>

CONTRADICTIONS:
- <file> says <what it claims>, the code shows <what is actually there> → your call which is wrong

FLAGGED:
- <file>, <what the repo shows instead> → run <skill>

ESCALATIONS:
- <task>, worked by <actors>, on <branches> → needs a person to decide

AMBIGUOUS:
- <area> → <task A> or <task B>, left alone

ORPHANS_CLEANED:
- <entry removed, or pointer fixed, after a deletion>

CONFLICTS:
- <file>, <hand written content that would need rewriting, left for a person>

MALFORMED:
- <file>, <what is broken about its shape> → needs a person
```

When you made no edits and found nothing stale, output the scope line followed by `NOTHING_TO_SYNC: everything is already current.`

List every edit. These are shared documents, and someone has to be able to see at a glance what changed and undo it.

**A flag is not a failure.** It is this skill working: the documents and the code have diverged, and now somebody knows.

List every edit. These are shared documents, and someone has to be able to see at a glance what changed and undo it.
