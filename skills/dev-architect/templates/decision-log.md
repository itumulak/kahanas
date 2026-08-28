# Decision and Evidence Log

*Purpose: the append only record of meaningful build decisions and observed evidence, in the order they happened. A later session can read one file to see both why work changed direction and what was actually run to support it.*

`progress-tracker.md` is the current task state. This file is the history behind that state. Keep it chronological and append only.

---

## Entries

| Timestamp | Actor | Author | Skill | Task | Kind | Entry |
| --- | --- | --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <GIT_USER> | <MODEL_ID> | <WRITING_SKILL> | <TASK_NUMBER_AND_NAME_OR_DASH> | <DECISION_OR_EVIDENCE> | <WHAT_WAS_DECIDED_OR_OBSERVED_AND_WHY> |

Append one row per event at the bottom. A decision and the evidence that established it may be separate adjacent rows when that reads more clearly. Never rewrite or delete a row. If a later event reverses an earlier decision, append the new event and name what changed.

**Timestamp** is local time to the minute, from the system clock when writing. **Actor** is `git config user.name`; remove that column for a personal project. **Author** is the exact model identifier, or `unknown-model` when it cannot be determined. Keep Author on personal projects. **Task** is the build plan number and name, or `—` when the event applies across tasks.

Use one of two values for **Kind**:

- **Decision**: a build choice, an assumption, a proven root cause and its fix, or a meaningful departure from the plan. Explain why it was necessary. Mark unratified assumptions `assumed, not yet ratified`.
- **Evidence**: a command, observed flow, reproduction, or confirming check and its result. State what was run or observed and exactly what it proved. Quote decisive failures when relevant.

Do not use this as an edit diary. Task status belongs in `progress-tracker.md`; review findings belong in `.konteksto/reviews/`; test cases belong in test files.

---

## Who writes what

| Skill | Allowed entries | Meaning |
| --- | --- | --- |
| `/dev-develop` | Decision and Evidence | a build choice, assumption, or the clean implementation checks |
| `/dev-check verify` | Evidence on a pass | the behavior was observed, not assumed |
| `/dev-debug` | Decision and Evidence | the proven root cause and fix, plus the reproduction and confirmation |

`/dev-check verify` writes no entry on a fail. The failed verdict belongs in the task's Verify Check cell and Note in `progress-tracker.md`; it is not proof that the task works.

No other skill writes entries. `/dev-sync` reads the log but never reconstructs or edits history.

---

## Worked example

**Reference only. Delete this section when creating a real project log.**

````markdown
| Timestamp | Actor | Author | Skill | Task | Kind | Entry |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-05 08:50 | Ana Reyes | claude-opus-5 | /dev-debug | 03 Session auth | Evidence | reproduced logout after checkout redirect; with `SameSite=Lax`, the session survived 5 of 5 attempts |
| 2026-08-05 08:55 | Ana Reyes | claude-opus-5 | /dev-debug | 03 Session auth | Decision | used `SameSite=Lax`; `Strict` dropped the cookie on the checkout return leg, which caused the logout |
| 2026-08-05 09:12 | Ana Reyes | claude-opus-5 | /dev-check | 03 Session auth | Evidence | signed in, completed checkout, and remained signed in on return; screenshot at `.scratch/auth-return.png` |
````

The rows stay in event order. They show what was observed, why the fix was chosen, and the later acceptance proof without sending the reader to a second file.
