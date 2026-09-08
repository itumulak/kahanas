# Progress Tracker

*Purpose: the live state of the build, so any agent or person picking up the project mid session immediately knows what each task and subtask must achieve, what is done, what is in progress, and what is next. Two sections: Current Status and a Progress section whose phase tables mirror every task Goal and UI and Logic subtask goal in build-plan.md. Shown here with one demonstrative phase rather than an invented full project history.*

Update this file whenever task state changes. Any AI agent reading this should immediately know what each task owes, what is done, what is in progress, and what is next.

**`/dev-architect` owns the Task or subtask column. `/dev-develop` owns Assigned on aggregate task rows, Status on every row, and its blocked Notes. `/dev-check verify` owns Verify Check on every row and its failed Notes.** Task and subtask text changes only with an accepted plan revision, never as ordinary build state. See Who writes what below. `/dev-sync` may also correct build state from repo evidence, after the fact, never during a build.

**This file holds each task Goal, each subtask goal, and their live state.** That is enough context to understand the work without turning the tracker into an event history. One neighbour carries the reasoning and evidence:

- **`decision-log.md`**, the chronological record of what was decided and why, plus what was run and what it proved. It is appended to by `/dev-develop`, `/dev-check`, and `/dev-debug`; the tracker is one aggregate row per task plus one child row per subtask, rewritten as each item moves. Different index, different file.

A stamp stays short enough to scan a whole phase precisely because that history does not live here.

---

## Current Status

*Purpose: the three line answer to "where are we right now," so a new session never has to reconstruct it by reading every phase table below.*

**Phase:** <CURRENT_PHASE_NAME_AND_STATE>
**Last completed:** <LAST_COMPLETED_TASK_OR_SUBTASK>
**Next:** <NEXT_TASK_AND_SUBTASK_OR_ACTION>

---

## Progress

*Purpose: a table mirror of `build-plan.md`'s phases, tasks, and goals. Each task has one aggregate row followed by one child row per UI and Logic subtask, so required outcomes, build state, and verification state are visible without re reading the plan or reconstructing goals from other files.*

### Phase 1 — <PHASE_NAME>

| Task or subtask | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| **01 <TASK_NAME>**<br>**Goal:** <TASK_GOAL> | unassigned | PENDING | — | — |
| ↳ **UI 1:** <UI_SUBTASK_GOAL> | inherits task | PENDING | — | — |
| ↳ **Logic 1:** <LOGIC_SUBTASK_GOAL> | inherits task | PENDING | — | — |
| **02 <NOT_YET_STARTED_TASK_NAME>**<br>**Goal:** <TASK_GOAL> | unassigned | PENDING | — | — |
| ↳ **Logic 1:** <LOGIC_SUBTASK_GOAL> | inherits task | PENDING | — | — |

Repeat one `### Phase N — <PHASE_NAME>` subsection per phase in `build-plan.md`. For every task, write its aggregate row first, then one child row for every UI subtask goal followed by every Logic subtask goal, all in plan order.

On a fresh project every aggregate and child row reads `PENDING` with no stamp, an empty Verify Check, and an empty Note. A cell with nothing in it yet is written as `—`, never left blank, because an empty markdown cell reads as a rendering accident rather than as a state.

**Task or subtask** mirrors `build-plan.md` word for word. The aggregate row carries the task number, task name, and Goal sentence. Each child row carries its stable `UI N` or `Logic N` label and exactly one subtask goal. Never summarize, shorten, combine, or replace an exact architecture name with a generic term. Escape any literal `|` as `\|` so it does not split the table.

The aggregate and child labels are plan time context, not live state. Only `/dev-architect` changes them, and whenever the plan changes it updates the matching tracker rows in the same accepted revision. A missing, extra, reordered, or reworded child row means the documents are stale. No builder, verifier, or sync pass chooses which wording wins.

**Assigned** is **team projects only**. Drop the column entirely on a personal project. The aggregate task row carries `unassigned` or the task owner. Every child row reads `inherits task`, because `/dev-develop` still builds one task at a time and assignment is not split silently at the subtask level.

The assignee is a **convention, not a lock.** `/dev-develop` reads it and stops when a task belongs to someone else, but two people running on two machines both pass that check, and either can proceed anyway. Nothing here reserves a task. A team that needs a real guarantee wants branch protection or an issue tracker, outside these documents.

**How the assignee changes.** `/dev-develop` writes the aggregate row when someone picks a task up, replacing `unassigned` with the git user. Child rows keep `inherits task`. Any other change, meaning a reassignment, is made **by a person editing the aggregate cell by hand**. No skill reassigns a task, because deciding a task should move from one person to another needs context that is not in the repository.

**Status** has three current values. `PENDING` is the unstamped starting placeholder. The other two carry stamps:

- `PENDING`, not built yet, or built and not finished.
- `DONE`, built, and confirmed to compile and run at least as far as the build gate goes.
- `BLOCKED`, work stopped on something outside the task, with the reason in Note.

`/dev-develop` stamps each child row as soon as that subtask is complete and its applicable build checks pass. The aggregate task row becomes `DONE` only when every child Status is `DONE` and the task clears the full Definition of Done. If work stops, completed children keep `DONE`, untouched children stay `PENDING`, the affected child becomes `BLOCKED`, and the aggregate row becomes `BLOCKED`. This makes partial progress visible without pretending the task is finished.

**Verify Check** is one of two words, followed by its stamp, and it stays `—` until `/dev-check verify` has completed the matching check:

- `PASSED` on a child row, every condition in that one subtask was exercised and observed to work.
- `FAILED` on a child row, at least one condition in that subtask failed, was missing, was not live, or was off the approved design.
- `PASSED` on the aggregate task row, every child row reads `PASSED` and the task Goal, applicable flows, value sources, and design conditions all passed.
- `FAILED` on the aggregate task row, the task Goal failed or at least one child row reads `FAILED`. The Note names the affected Goal or subtask labels.

A subtask whose conditions are all resolved may receive its own stamp even when another subtask is blocked. A check where no condition failed but at least one could not be exercised leaves the affected child and aggregate task Verify Check unchanged. A partial check never produces an aggregate `PASSED`.

**One more Status exists on a project that adopted this workflow with a codebase already shipped**, and only there. Delete this paragraph on a fresh project, where nothing can be baseline.

- `BASELINE`, the task or subtask was already built and finished before this workflow arrived. It was not built here and it has not been verified here.

**Finished is part of that, not a detail of it.** A half built feature existed before the line too, and it is an ordinary `PENDING` task rather than a baseline row, because the row saying it is not done is the only thing that will get it finished.

**Every aggregate and child row for a baseline task reads `BASELINE`, never `DONE`, and never carries a Verify Check.** `DONE` claims this workflow built it and saw the build come back clean. `PASSED` claims a model exercised the behavior and watched it work. Neither happened, and a fabricated one reads exactly like a real one to every later session, which is the whole reason the value is separate rather than borrowed.

**The stamp on a `BASELINE` row records the recording, not the building.** It says which model wrote the row down and at what minute, which is true and useful. It says nothing about when the task or subtask was written or by whom.

**`/dev-architect` writes these rows once, while settling the adoption baseline, and nothing ever promotes one.** A later change to that feature is an ordinary new task with an aggregate row and child rows, because the work being done now is work this workflow really is doing.

**A `DONE` Status and a `PASSED` Verify Check are different claims, which is why they are separate columns on every row.** `DONE` says that task or subtask was built and its build checks are clean. `PASSED` says somebody ran its conditions and watched them work. A row can sit at `DONE` with a `FAILED` verify for as long as it takes `/dev-debug` to find the cause, and that pair is exactly the state a later session needs to see.

### The stamp

Every stamped Status and Verify Check uses three rendered lines inside its table cell:

```
DONE<br>claude-opus-5<br>2026-08-09 14:32
```

The first line is the value. The second is the author. The third is the local timestamp. Use the literal `<br>` tag because a Markdown table row must remain one source line while the rendered stamp needs one field per line. **Never use commas to join stamp fields.**

**The author is the exact model identifier** of whatever wrote the cell, for example `claude-opus-5`, not a product name and not a skill name. It is the model that matters, because a later reader judging a stale verdict wants to know what produced it. Where a stamp was set by a person rather than a model, write the git user name instead. **Never guess an identifier you do not know**: write `unknown-model` and say so in the report.

**The timestamp** is local time to the minute, `YYYY-MM-DD HH:MM`, read from the system clock at the moment of writing, never from memory. A guessed timestamp puts states in the wrong order, and the order is most of what this column is for.

`PENDING` on a fresh project and `—` in an untouched Verify Check carry no stamp, because nothing has happened yet. The first real stamp replaces that placeholder directly. Every other value carries a stamp.

### Superseding a value

A cell keeps its own recorded history. When a stamped value changes, **strike the whole old three line stamp and append the new one after a blank rendered line**, so the cell reads oldest to newest and the last unstruck stamp is current. A bare initial `PENDING` or `—` is only a placeholder, so the first stamp replaces it without preserving it:

```
~~BLOCKED<br>claude-opus-5<br>2026-08-08 11:04~~<br><br>DONE<br>claude-opus-5<br>2026-08-09 09:12
```

Three rules hold it together:

- **Exactly one unstruck value or stamp per cell**, always the last. Two unstruck values means the current state is unreadable, which is worse than either of them being wrong.
- **Never delete a struck stamp, and never rewrite one.** A struck stamp is a claim about a moment that has already passed. The history is the point: a subtask that went `DONE` then `BLOCKED` then `DONE` again is telling a later session something a single `DONE` hides.
- **Strike, never edit in place.** Correcting a stamp by editing it destroys the record of what the previous session actually believed.

A cell that grows unreadably long is a signal, not a formatting problem. Say so in the report rather than trimming it, because whatever is thrashing that task is the real thing to deal with.

### Note

**Only two kinds of row carry a Note, and both of them must.** Every other row reads `—`.

- A **`BLOCKED`** Status: one line saying what is blocking it. A `BLOCKED` row without a Note is incomplete, because the whole point of the state is telling the next person what to unblock.
- A **`FAILED`** Verify Check: one line saying what failed, with the detail left to `/dev-check`'s report.

Nothing else. **This column is deliberately not a general comment field**, and the restriction is what makes it useful: a Note in this table means something is wrong right now, so a reader scans for a non empty cell instead of reading every one. Open it up to observations and remarks and the column stops carrying that signal within a week.

The reasoning and evidence behind a Note belong in `decision-log.md`. A Note is a flag, one line, and never a substitute for the log.

A Note is cleared the moment its reason goes: when `BLOCKED` is superseded by `DONE`, or a `FAILED` verify by a `PASSED` one, the skill writing that new value replaces the Note with `—` in the same edit. **The Note is the only thing in this table that is overwritten rather than superseded**, because it describes the current state rather than recording history, and the history it would otherwise accumulate is already kept in the struck stamps beside it.

**When a row is both `BLOCKED` and `FAILED`**, one Note covers both, and whichever skill writes last owns the cell: it keeps what still applies and drops what does not. This is the one cell two skills share, and it works only because it holds the present rather than a record. Clear it only when **neither** reason is left.

### Who writes what

| Column | Writer | Also correctable by |
| --- | --- | --- |
| Task or subtask | `/dev-architect`, at plan time and with an accepted plan change | nobody, it mirrors `build-plan.md` |
| Assigned | `/dev-develop` claims `unassigned` on aggregate task rows only | a person, by hand, for any reassignment |
| Status | `/dev-develop`, on aggregate and child rows | `/dev-sync`, from repo evidence, after the fact |
| Verify Check | `/dev-check verify`, on aggregate and child rows | nobody |
| Note | `/dev-develop` on a `BLOCKED` row, `/dev-check verify` on a `FAILED` one | a person |

**`/dev-check verify` writes the Verify Check cell on a fail as well as a pass**, while it writes an Evidence row in `decision-log.md` only on a pass. The difference is deliberate: this column is a verdict, and a failed verdict is a fact worth recording. An Evidence row holds proof that behavior works, and a failure provides none.

**No skill edits another skill's cell.** `/dev-develop` never touches Verify Check, not even to clear a stale one, and `/dev-check` never touches Status, however plainly wrong it looks. A wrong cell is reported, and its owner fixes it.

---

## Worked example

**Reference only. Delete this whole section when writing the real file**, and never copy a task, a name, a model, or a date out of it. Every task below is invented, and an invented task in a real tracker sends the next session looking for code nobody wrote.

A team project, part way through its second phase, shown in full so the stamp shape and the superseding rule can be read against real looking content rather than placeholders.

````markdown
## Current Status

**Phase:** Phase 2 — Booking flow, in progress
**Last completed:** 04 Booking model and repository
**Next:** 07 Confirmation email, once 05's failed verify is dealt with

---

## Progress

### Phase 1 — Foundation

| Task or subtask | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| **01 Project scaffold and compose stack**<br>**Goal:** Run the application through its supported local topology. | Ian Tumulak | DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:41 | — |
| ↳ **Logic 1:** Scaffold the API and client with exact lockfiles. | inherits task | ~~BLOCKED<br>claude-opus-5<br>2026-08-02 09:18~~<br><br>DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:38 | — |
| ↳ **Logic 2:** Run Caddy, PostgreSQL 17, the worker, and the scheduler through Docker Compose. | inherits task | DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:41 | — |

### Phase 2 — Booking flow

| Task or subtask | Assigned | Status | Verify Check | Note |
| --- | --- | --- | --- | --- |
| **05 Availability query endpoint**<br>**Goal:** Return bookable slots in the venue's local day. | Ian Tumulak | DONE<br>claude-opus-5<br>2026-08-07 14:20 | FAILED<br>claude-opus-5<br>2026-08-07 15:02 | Logic 2 returned slots in the server timezone |
| ↳ **Logic 1:** Expose the permitted slots through the generated API contract. | inherits task | DONE<br>claude-opus-5<br>2026-08-07 14:20 | PASSED<br>claude-opus-5<br>2026-08-07 14:58 | — |
| **06 Booking form page**<br>**Goal:** Let a person choose and submit an available slot. | Ian Tumulak | BLOCKED<br>claude-opus-5<br>2026-08-08 16:45 | — | Logic 1 is waiting on the date picker decision |
| ↳ **UI 1:** Build every approved form, validation, conflict, and success state. | inherits task | DONE<br>claude-opus-5<br>2026-08-08 16:31 | PASSED<br>claude-opus-5<br>2026-08-08 16:40 | — |
| ↳ **Logic 1:** Submit through the generated API client and refresh availability after a conflict. | inherits task | BLOCKED<br>claude-opus-5<br>2026-08-08 16:45 | — | Waiting on the date picker decision, see `/dev-architect` |
| **07 Confirmation email**<br>**Goal:** Confirm a completed booking through email. | unassigned | PENDING | — | — |
| ↳ **Logic 1:** Send one idempotent confirmation through the approved mail transport. | inherits task | PENDING | — | — |

````

What each part of it demonstrates:

- **Task 01 has an aggregate row and two child rows.** The task is built and verified only because both children are built and verified and the Goal passed too.
- **Logic 1 on task 01 keeps its history.** Each stamp renders value, author, and time on separate lines. A blank rendered line separates the struck old stamp from the current one.
- **Task 05 is built and still fails verification.** Logic 1 passed and keeps that stamp. Logic 2 failed and names the exact problem. The aggregate row fails because one child failed.
- **Task 06 shows partial progress.** Its UI child is built and verified. Its Logic child and aggregate row are blocked. Finished work stays visible without calling the task complete.
- **Task 07 and its child are untouched.** Both use bare `PENDING`, since nothing has happened and there is nothing to stamp.

On a personal project the same table drops one column and nothing else changes:

````markdown
| Task or subtask | Status | Verify Check | Note |
| --- | --- | --- | --- |
| **01 Project scaffold and compose stack**<br>**Goal:** Run the application through its supported local topology. | DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:41 | — |
| ↳ **Logic 1:** Scaffold the API and client with exact lockfiles. | DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:38 | — |
| ↳ **Logic 2:** Run Caddy, PostgreSQL 17, the worker, and the scheduler through Docker Compose. | DONE<br>claude-opus-5<br>2026-08-02 10:14 | PASSED<br>claude-opus-5<br>2026-08-02 10:41 | — |
````

Where the rest of task 05 lives. `decision-log.md` holds one Evidence row from the build:

````markdown
| 2026-08-07 14:20 | Ian Tumulak | claude-opus-5 | /dev-develop | 05 Availability query endpoint | Evidence | `pnpm typecheck && pnpm build` clean |
````

**No row for the 15:02 verify**, because the task failed, and the log writes Evidence only for a complete task pass. The failure is recorded here instead, in Logic 2 and in the aggregate task Verify Check, with one line in each Note. When `/dev-debug` finds the cause and `/dev-check verify` runs again and passes, both cells gain a struck three line `FAILED` stamp and a live three line `PASSED` stamp, both Notes return to `—`, and the log gains its next Evidence row.

Task 05 has no `decision-log.md` row yet either, because nobody has worked out why it fails. Task 06 does, and it is the row its `BLOCKED` Note points at:

````markdown
| 2026-08-08 16:45 | Ian Tumulak | claude-opus-5 | /dev-develop | 06 Booking form page | Decision | stopped rather than choosing a date picker. Two candidates, neither on `code-standards.md`'s approved list, and the choice fixes the accessibility story for every form after this one. Routed to `/dev-architect`, and the task is `BLOCKED` until it comes back |
````

Two files, two different questions: where each task and subtask stands, and the chronological record of what was run and why work changed. The Worked example in `decision-log.md` shows the supporting events.
