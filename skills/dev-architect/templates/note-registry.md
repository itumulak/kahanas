# Note Registry

*Purpose: the running record of what was actually run against this build and what it proved, one row per entry, each row naming the skill that wrote it and when. Split out of `progress-tracker.md` because a verdict and its evidence are different things: that file holds one word per task saying where it stands, and this one holds the run that backs the word up, in as much detail as it takes.*

A living log. Append a row, never rewrite one, and never delete a row someone else's skill wrote. An entry is a claim about a moment that has already passed, so editing it after the fact makes the whole file untrustworthy.

---

## Entries

*Purpose: every entry in one table, oldest at the top, so a new session reads down and sees the build's real history of checks, proofs, and fixes in the order they happened.*

| Timestamp | Actor | Author | Skill | Task | Note |
| --- | --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <GIT_USER> | <MODEL_ID> | <WRITING_SKILL> | <TASK_NUMBER_AND_NAME> | <WHAT_WAS_RUN_AND_WHAT_IT_PROVED> |

Append one row per entry, at the bottom.

**Timestamp** is local time to the minute, `YYYY-MM-DD HH:MM`. Take it from the system clock, never from memory, because a guessed timestamp puts entries in the wrong order and the order is most of this file's value.

**Actor** is who ran it, read from `git config user.name` at the time of writing. **Team projects only**: drop this column entirely on a personal project, where every row would carry the same name. It records who ran a check, which is a fact about the past and therefore safe in an append only file. It is **not** an assignment, and nothing here is reassigned. Task ownership lives in `progress-tracker.md`, where it can change.

**Author** is the exact model identifier that wrote the row, for example `claude-opus-5`. Not a product name, not a skill name, and not "an assistant". **Keep this column on a personal project too**, unlike Actor, because the model changes between sessions even when the person does not, and a reader deciding how much to trust an old observation wants to know what produced it. Where a person wrote the row by hand, put their git user name here as well, which says plainly that no model was involved. **Never guess an identifier you do not know**: write `unknown-model` and say so in your report.

**Skill** is the writing skill's exact command name: `/dev-develop`, `/dev-check`, or `/dev-debug`. No other skill writes here.

**Task** is the task number and name from `build-plan.md`. Use `—` for an entry that belongs to no single task.

**Note** is one line: the command or flow that was run, and its result. Quote a failing line exactly rather than describing it.

---

## Who writes what

*Purpose: the three writers and the one kind of entry each is allowed to add, stated here so a skill reading this file knows which rows are its own and which it must leave alone.*

| Skill | Writes | Meaning |
| --- | --- | --- |
| `/dev-develop` | the command that confirmed the build is clean, with its result | the code compiles and the toolchain is happy |
| `/dev-check` | on a verify PASS, what was exercised and that it passed | the behavior was actually observed, not assumed |
| `/dev-debug` | the reproduction and the check that confirmed the fix | the bug was proven gone, not presumed gone |

These are different claims and they do not substitute for one another. A clean build is not a working feature, and a passing verify is not a fixed bug. Keeping them as separate rows is what lets a later session tell which of the three it actually has.

**`/dev-check` writes only on a pass.** A fail or a block writes nothing here, because this file records what was proven, and a failure proves nothing about the build. A failed verify is still recorded, as `FAILED` in that task's Verify Check cell in `progress-tracker.md`. The verdict lives there, and only the proof lives here.

---

## Excluded

*Purpose: what deliberately does not belong here, so this file stays a record of checks rather than drifting into a second decision log.*

- **Decisions, bugs found, and design choices.** Those go in `decision-log.md`. This file is what was run and what it showed.
- **Review findings.** Those belong to `/dev-check review` and go in `.konteksto/reviews/`.
- **Test cases.** Those are `/dev-test`'s files.

---

## Worked example

**Reference only. Delete this whole section when writing the real file**, and never copy a row out of it. Every row below is invented, and an invented row is a fabricated observation, which is the one thing this file must never contain.

A team project part way through its second phase, eight tasks planned and five built. It is the same build shown in the Worked example sections of `progress-tracker.md` and `decision-log.md`, so the three can be read side by side.

````markdown
| Timestamp | Actor | Author | Skill | Task | Note |
| --- | --- | --- | --- | --- | --- |
| 2026-08-02 10:14 | Ian Tumulak | claude-opus-5 | /dev-develop | 01 Project scaffold and compose stack | `docker compose up -d` brought all four services healthy, `pnpm build` clean |
| 2026-08-02 10:41 | Ian Tumulak | claude-opus-5 | /dev-check | 01 Project scaffold and compose stack | loaded http://localhost:3000, the placeholder page rendered, no console errors |
| 2026-08-02 15:22 | Ian Tumulak | claude-opus-5 | /dev-develop | 02 Postgres schema and migrations | `pnpm migrate up` applied 3 migrations, `pnpm typecheck` clean |
| 2026-08-03 09:05 | Ian Tumulak | claude-sonnet-5 | /dev-check | 02 Postgres schema and migrations | `\d bookings` against the live database shows all 9 columns including `venue_id` and `starts_at` |
| 2026-08-04 16:58 | Ana Reyes | claude-opus-5 | /dev-develop | 03 Session auth | `pnpm typecheck && pnpm build` clean |
| 2026-08-05 08:50 | Ana Reyes | claude-opus-5 | /dev-debug | 03 Session auth | reproduced the logout by completing checkout and returning; with `SameSite=Lax` the session survived the redirect on 5 of 5 attempts |
| 2026-08-05 09:12 | Ana Reyes | claude-opus-5 | /dev-check | 03 Session auth | signed in, completed the checkout redirect, still signed in on return, screenshot at `.scratch/auth-return.png` |
| 2026-08-06 11:03 | Ana Reyes | claude-opus-5 | /dev-develop | 04 Booking model and repository | `pnpm typecheck && pnpm test:unit` clean, 12 passing |
| 2026-08-06 11:44 | Ana Reyes | claude-opus-5 | /dev-check | 04 Booking model and repository | POST /api/bookings returned 201, the row is in the live database with the venue's UTC offset applied |
| 2026-08-07 14:20 | Ian Tumulak | claude-opus-5 | /dev-develop | 05 Availability query endpoint | `pnpm typecheck && pnpm build` clean |
````

What it demonstrates:

- **All three writers appear**, and each says a different thing. `/dev-develop` says the toolchain is happy. `/dev-check` says somebody watched the behavior. `/dev-debug` says a bug was proven gone. None of them substitutes for another, which is why task 03 has all three.
- **Task 05 has one row, from the build**, and nothing else. Its verify failed, and a failure writes nothing here. The verdict is recorded as `FAILED` in that task's Verify Check cell in `progress-tracker.md` instead, with a one line Note. Reading this file alone, a task with a `/dev-develop` row and no `/dev-check` row is exactly a task nobody has proven yet.
- **Task 06 has no rows at all.** It is `BLOCKED` and was never built, so nothing was run and nothing is recorded.
- **Every Note names a command or a surface and its result**, not an intention. `pnpm build clean` and `POST /api/bookings returned 201` can both be re run by somebody who doubts them. "auth works now" cannot.
- **The `/dev-debug` row records the reproduction as well as the fix**, because a fix confirmed without a reproduction is a fix nobody can trust.
- **The order is the value.** Task 03's rows read build, then debug, then verify, which tells the story of the failure without any of them describing it.
- **Task 02 was verified by a different model than built it**, which the Author column is what makes visible. Actor stayed the same, so a person reading only Actor would never know.

Two things this example deliberately does not contain: the reason `SameSite=Lax` was needed, which is an entry in `decision-log.md`, and the fact that task 03 is now `DONE`, which is a cell in `progress-tracker.md`.
