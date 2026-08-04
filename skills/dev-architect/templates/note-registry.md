# Note Registry

*Purpose: the running record of what was actually run against this build and what it proved, one row per entry, each row naming the skill that wrote it and when. Split out of `progress-tracker.md` because three skills write here and only one writes there, and a shared section inside a single owner's file is how ownership blurs.*

A living log. Append a row, never rewrite one, and never delete a row someone else's skill wrote. An entry is a claim about a moment that has already passed, so editing it after the fact makes the whole file untrustworthy.

---

## Entries

*Purpose: every entry in one table, oldest at the top, so a new session reads down and sees the build's real history of checks, proofs, and fixes in the order they happened.*

| Timestamp | Actor | Skill | Task | Note |
| --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <GIT_USER> | <WRITING_SKILL> | <TASK_NUMBER_AND_NAME> | <WHAT_WAS_RUN_AND_WHAT_IT_PROVED> |

Append one row per entry, at the bottom.

**Timestamp** is local time to the minute, `YYYY-MM-DD HH:MM`. Take it from the system clock, never from memory, because a guessed timestamp puts entries in the wrong order and the order is most of this file's value.

**Actor** is who ran it, read from `git config user.name` at the time of writing. **Team projects only**: drop this column entirely on a personal project, where every row would carry the same name. It records who ran a check, which is a fact about the past and therefore safe in an append only file. It is **not** an assignment, and nothing here is reassigned. Task ownership lives in `progress-tracker.md`, where it can change.

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

**`/dev-check` writes only on a pass.** A fail or a block writes nothing here, because this file records what was proven, and a failure proves nothing about the build.

---

## Excluded

*Purpose: what deliberately does not belong here, so this file stays a record of checks rather than drifting into a second decision log.*

- **Decisions, bugs found, and design choices.** Those go in `progress-tracker.md` under Decisions Made During Build. This file is what was run and what it showed.
- **Review findings.** Those belong to `/dev-check review` and go in `.konteksto/reviews/`.
- **Test cases.** Those are `/dev-test`'s files.
