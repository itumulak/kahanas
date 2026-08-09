# Progress Tracker

*Purpose: the live state of the build, so any agent picking up the project mid session immediately knows what is done, what is in progress, and what is next. This file keeps its exact original structure (Current Status, a Progress section whose phase tables mirror build-plan.md's phases, Decisions Made During Build), shown here with one demonstrative phase and one demonstrative decision rather than an invented full project history.*

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

**`/dev-develop` is this file's builder**, and owns every column of the Progress tables except one. **`/dev-check verify` owns the Verify Check column, and writes nothing else here.** Two writers, split by column, and each side states it: see Who writes what below. `/dev-sync` may also correct this file, but only from repo evidence, after the fact, never during a build.

What was run and what it proved goes in `note-registry.md` instead, which `/dev-develop`, `/dev-check`, and `/dev-debug` all append to. A Status cell here is a verdict, one word plus who stamped it. A note row there is the evidence behind it. Keeping the verdict and its proof in different files is why a stamp stays short enough to scan a whole phase at a glance.

---

## Current Status

*Purpose: the three line answer to "where are we right now," so a new session never has to reconstruct it by reading the whole Progress checklist below.*

**Phase:** <CURRENT_PHASE_NAME_AND_STATE>
**Last completed:** <LAST_COMPLETED_TASK>
**Next:** <NEXT_TASK_OR_ACTION>

---

## Progress

*Purpose: a table mirror of `build-plan.md`'s phases and tasks, one row per task, so build state and verification state are both visible at a glance without re reading the plan itself.*

### Phase 1 — <PHASE_NAME>

| Task | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| 01 <COMPLETED_TASK_NAME> | <GIT_USER_OR_UNASSIGNED> | DONE, <MODEL_ID>, <YYYY-MM-DD HH:MM> | PASSED, <MODEL_ID>, <YYYY-MM-DD HH:MM> | — |
| 02 <NOT_YET_STARTED_TASK_NAME> | unassigned | PENDING | — | — |

Repeat one `### Phase N — <PHASE_NAME>` subsection per phase in `build-plan.md`, each with one row per task in that phase, in the plan's order.

On a fresh project every row reads `PENDING` with no stamp, an empty Verify Check, and an empty Note. A cell with nothing in it yet is written as `—`, never left blank, because an empty markdown cell reads as a rendering accident rather than as a state.

**Task** is the task number and name exactly as `build-plan.md` writes them. Never renumber or reword a task here. This table mirrors the plan, and a row that no longer matches its task is a row nobody can match back.

**Assigned** is **team projects only**. Drop the column entirely on a personal project, where every row would carry the same name, and a column with one value is noise.

The assignee is a **convention, not a lock.** `/dev-develop` reads it and stops when a task belongs to someone else, but two people running on two machines both pass that check, and either can proceed anyway. Nothing here reserves a task. A team that needs a real guarantee wants branch protection or an issue tracker, outside these documents.

**How the assignee changes.** `/dev-develop` writes it when someone picks a task up, replacing `unassigned` with the git user. Any other change, meaning a reassignment, is made **by a person editing this cell by hand**. No skill reassigns a task, because deciding a task should move from one person to another needs context that is not in the repository.

**Status** is one of three words, followed by its stamp:

- `PENDING`, not built yet, or built and not finished.
- `DONE`, built, and confirmed to compile and run at least as far as the build gate goes.
- `BLOCKED`, work stopped on something outside the task, with the reason in Note.

**Verify Check** is one of two words, followed by its stamp, and it stays `—` until `/dev-check verify` has run against the task:

- `PASSED`, the behavior was exercised and observed to work.
- `FAILED`, it was exercised and did not.

**A `DONE` Status and a `PASSED` Verify Check are different claims, which is why they are separate columns.** `DONE` says the code was built and the build is clean. `PASSED` says somebody ran the thing and watched it work. A task can sit at `DONE` with a `FAILED` verify for as long as it takes `/dev-debug` to find the cause, and that pair is exactly the state a later session needs to see.

### The stamp

Every Status and Verify Check value carries who set it and when, in this shape, comma separated:

```
DONE, claude-opus-5, 2026-08-09 14:32
```

**The author is the exact model identifier** of whatever wrote the cell, for example `claude-opus-5`, not a product name and not a skill name. It is the model that matters, because a later reader judging a stale verdict wants to know what produced it. Where a stamp was set by a person rather than a model, write the git user name instead. **Never guess an identifier you do not know**: write `unknown-model` and say so in the report.

**The timestamp** is local time to the minute, `YYYY-MM-DD HH:MM`, read from the system clock at the moment of writing, never from memory. A guessed timestamp puts states in the wrong order, and the order is most of what this column is for.

`PENDING` on a fresh project carries no stamp, because nothing has happened yet. Every other value carries one.

### Superseding a value

A cell keeps its own history. When a value changes, **strike the old one through and append the new one after it**, so the whole cell reads oldest to newest and the last unstruck value is the current one:

```
~~PENDING, claude-opus-5, 2026-08-08 09:10~~ ~~BLOCKED, claude-opus-5, 2026-08-08 11:04~~ DONE, claude-opus-5, 2026-08-09 09:12
```

Three rules hold it together:

- **Exactly one unstruck value per cell**, always the last. Two unstruck values means the current state is unreadable, which is worse than either of them being wrong.
- **Never delete a struck value, and never rewrite one.** A struck stamp is a claim about a moment that has already passed. The history is the point: a task that went `DONE` then `BLOCKED` then `DONE` again is telling a later session something a single `DONE` hides.
- **Strike, never edit in place.** Correcting a stamp by editing it destroys the record of what the previous session actually believed.

A cell that grows unreadably long is a signal, not a formatting problem. Say so in the report rather than trimming it, because whatever is thrashing that task is the real thing to deal with.

### Note

One short line, for a human, on anything the state alone does not explain. **Why it is blocked** is the main case, and the reason a `BLOCKED` row without a Note is incomplete. A `FAILED` verify gets the one line summary of what failed, with the detail left to `/dev-check`'s report. Anything a person should notice before picking the task up belongs here too.

Keep it short. This is a flag, not the decision log, and not a substitute for a `note-registry.md` row. `—` when there is nothing to say.

### Who writes what

| Column | Writer | Also correctable by |
| --- | --- | --- |
| Task | `/dev-architect`, once, at plan time | nobody, it mirrors `build-plan.md` |
| Assigned | `/dev-develop` claims `unassigned` only | a person, by hand, for any reassignment |
| Status | `/dev-develop` | `/dev-sync`, from repo evidence, after the fact |
| Verify Check | `/dev-check verify` | nobody |
| Note | whichever skill wrote the stamp it explains | a person |

**`/dev-check verify` writes the Verify Check cell on a fail as well as a pass**, which is the one place its behavior differs from `note-registry.md`, where it writes only on a pass. The difference is deliberate: this column is a verdict, and a failed verdict is a fact worth recording. That file holds proofs, and a failure proves nothing about the build.

**No skill edits another skill's cell.** `/dev-develop` never touches Verify Check, not even to clear a stale one, and `/dev-check` never touches Status, however plainly wrong it looks. A wrong cell is reported, and its owner fixes it.

---

## Decisions Made During Build

*Purpose: a running log of real decisions, bugs found, and fixes made during the build, in the order they happened, so later sessions don't repeat the same investigation or silently contradict an earlier choice.*

- <DECISION_OR_BUG_OR_FIX_LOG_ENTRY>

---

## Checkpoints

*Purpose: the review state of each finished phase, so a later session can see which phases a second pair of eyes has actually signed off and which are still waiting. Optional: only present when Team Shape in `project-overview.md` says checkpoints are on.*

| Phase | State | Approved by | Outstanding |
| --- | --- | --- | --- |
| Phase 1 — <PHASE_NAME> | <NOT_DUE_OR_DUE_OR_APPROVED> | <NAME_AND_ROLE_PER_APPROVER_OR_NONE> | <WHAT_WAS_RAISED_AND_NOT_YET_ADDRESSED_OR_NONE> |

One row per phase in `build-plan.md`. What each phase's reviewer must confirm lives in that phase's Checkpoint block in `build-plan.md`, not here. This table only tracks state.

**State** is one of three. `not due` means the phase still has tasks whose Status is not `DONE`. `due` means every task in the phase reads `DONE` and nobody has approved yet. `approved` means a reviewer other than the builder confirmed the phase against its criteria.

**Approved by** carries each approver's name and their role in brackets, as `Sam (project manager), Ali (developer)`. **The role is written by the approver, about themselves, at the moment they approve.** It is recorded here rather than looked up because there is nowhere to look it up: role is per person, so it is never committed, and a reader months later has no way to recover who held which role at the time. A self recorded role is accurate the day it is written and stays accurate afterwards.

Where a project wants a project manager's sign off and only developers have approved, that is visible directly in this column, and it belongs in Outstanding until it happens.

**Checkpoints are non blocking.** A phase sitting at `due` does not stop the next phase starting. It is a flag, and the Outstanding column is what a later session reads to see what was raised and never dealt with. Addressing an outstanding item before building on top of it is the recommendation, not a rule.

**Who writes here.** `/dev-develop` moves a row from `not due` to `due` when it sets the last task in a phase to `DONE`, which is the one transition the repository can prove. **Approvals are recorded by a person**, because an approval is a claim that a human reviewed something, and no skill may write one. A skill that filled in its own approval would defeat the entire point of having a checkpoint.

---

## Worked example

**Reference only. Delete this whole section when writing the real file**, and never copy a task, a name, a model, or a date out of it. Every task below is invented, and an invented task in a real tracker sends the next session looking for code nobody wrote.

A team project with checkpoints on, part way through its second phase, shown in full so the stamp shape and the superseding rule can be read against real looking content rather than placeholders.

````markdown
## Current Status

**Phase:** Phase 2 — Booking flow, in progress
**Last completed:** 05 Availability query endpoint
**Next:** 07 Confirmation email

---

## Progress

### Phase 1 — Foundation

| Task | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| 01 Project scaffold and compose stack | Ian Tumulak | DONE, claude-opus-5, 2026-08-02 10:14 | PASSED, claude-opus-5, 2026-08-02 10:41 | — |
| 02 Postgres schema and migrations | Ian Tumulak | DONE, claude-opus-5, 2026-08-02 15:22 | PASSED, claude-sonnet-5, 2026-08-03 09:05 | — |
| 03 Session auth | Ana Reyes | ~~PENDING~~ ~~BLOCKED, claude-opus-5, 2026-08-03 11:40~~ DONE, claude-opus-5, 2026-08-04 16:58 | ~~FAILED, claude-sonnet-5, 2026-08-04 17:30~~ PASSED, claude-opus-5, 2026-08-05 09:12 | Cookie was set without `SameSite`, fixed in 4a91c02 |

### Phase 2 — Booking flow

| Task | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| 04 Booking model and repository | Ana Reyes | DONE, claude-opus-5, 2026-08-06 11:03 | PASSED, claude-opus-5, 2026-08-06 11:44 | — |
| 05 Availability query endpoint | Ian Tumulak | DONE, claude-opus-5, 2026-08-07 14:20 | ~~FAILED, claude-opus-5, 2026-08-07 15:02~~ PASSED, claude-opus-5, 2026-08-08 10:31 | Timezone came from the server, not the venue |
| 06 Booking form page | Ian Tumulak | BLOCKED, claude-opus-5, 2026-08-08 16:45 | — | Waiting on the date picker decision, see `/dev-architect` |
| 07 Confirmation email | unassigned | PENDING | — | — |
| 08 Cancellation flow | unassigned | PENDING | — | — |

---

## Decisions Made During Build

- 2026-08-03: the session cookie needs `SameSite=Lax`, since the checkout redirect drops a `Strict` cookie. Found by a failed verify on task 03.
- 2026-08-08: availability must read the venue timezone from `venues.tz`, never the server clock. `architecture.md`'s Value Sourcing table updated.

---

## Checkpoints

| Phase | State | Approved by | Outstanding |
| --- | --- | --- | --- |
| Phase 1 — Foundation | approved | Ana Reyes (developer), Sam Okafor (project manager) | none |
| Phase 2 — Booking flow | not due | none | none |
````

What each part of it demonstrates:

- **Task 03** is a whole life in two cells: pending, blocked, done, then a failed verify superseded by a passing one. Two different models appear in one row, because whichever model was running at the time stamps its own work. None of that history is recoverable from a single final value.
- **Task 05** holds `DONE` beside a struck `FAILED`. That pair is the reason Status and Verify Check are separate columns: the build was clean and the behavior was still wrong.
- **Task 06** is `BLOCKED` with its reason in Note, and its Verify Check stays `—`. Nothing ran, so nothing is stamped. A `BLOCKED` row with an empty Note is the one shape that is always incomplete.
- **Tasks 07 and 08** are untouched rows: bare `PENDING`, no stamp, `—` in both trailing columns. That is exactly how `/dev-architect` writes every row on a fresh project.
- **The struck `PENDING` on task 03** carries no stamp either, because it never had one to keep.
- **The Notes** are one line each and point at the cause. The reasoning behind them lives in the decision log, and the commands that proved them live in `note-registry.md`.

On a personal project the same table drops one column and nothing else changes:

````markdown
| Task | Status | Verify Check | Note |
| --- | --- | --- | --- |
| 01 Project scaffold and compose stack | DONE, claude-opus-5, 2026-08-02 10:14 | PASSED, claude-opus-5, 2026-08-02 10:41 | — |
````

The two `note-registry.md` rows that back task 05's cells, showing the split between a verdict and its evidence:

````markdown
| 2026-08-07 14:20 | Ian Tumulak | /dev-develop | 05 Availability query endpoint | `pnpm typecheck && pnpm build` clean |
| 2026-08-08 10:31 | Ian Tumulak | /dev-check | 05 Availability query endpoint | GET /api/availability?venue=3&date=2026-09-01 returned the 09:00 to 17:00 slots in Asia/Manila, matching the venue row |
````

There is no registry row for the 15:02 failure. The verdict is recorded here, in the Verify Check cell, and only what was proven is recorded there.
