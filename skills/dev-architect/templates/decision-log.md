# Decision Log

*Purpose: the running record of real decisions, bugs found, and fixes made during the build, in the order they happened, so a later session does not repeat an investigation somebody already did or silently contradict a choice somebody already made.*

Split out of `progress-tracker.md` because the two are indexed differently. That file is one row per task and it is rewritten in place as a task moves. This one is one row per decision, in the order they happened, and nothing in it is ever rewritten. A file cannot be both, and trying made both worse.

**Two skills write here.** `/dev-develop` records a decision it made or an assumption it built on, and `/dev-debug` records a proven root cause and its fix. Nobody else writes, and `/dev-sync` never does, because it decided nothing.

---

## What belongs here

*Purpose: the boundary, stated up front, because this file is only useful for as long as it stays decisions rather than drifting into a diary.*

Append a row when a later session would otherwise have to work the same thing out again:

- **A choice made during the build** that the design documents did not settle, and the reason for it.
- **An assumption built on**, marked `assumed, not yet ratified` until `/dev-architect` confirms it.
- **A bug found and why it happened**, meaning the cause rather than the symptom.
- **Something that turned out harder or different than the plan expected**, where the next task will hit the same thing.

Do not write a diary of edits. A row that narrates what a task did is noise, and noise here is expensive: this file is the single best source `/dev-document` has for a changelog or a postmortem, and every worthless line makes the valuable ones harder to find.

**What goes elsewhere:**

- **What was run, and what it proved.** That is a row in `note-registry.md`. This file holds the conclusion, that file holds the observation.
- **A task's state.** That is the Status or Verify Check cell in `progress-tracker.md`.
- **Why a task is blocked**, in one line for somebody scanning the table. That is the Note cell in `progress-tracker.md`. The reasoning behind it still belongs here.
- **Review findings.** Those are `/dev-check review`'s, and they go in `.konteksto/reviews/`.

---

## Entries

*Purpose: every decision in one table, oldest at the top, so reading down gives the build's reasoning in the order it actually happened.*

| Timestamp | Actor | Author | Skill | Task | Decision |
| --- | --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <GIT_USER> | <MODEL_ID> | <WRITING_SKILL> | <TASK_NUMBER_AND_NAME_OR_DASH> | <WHAT_WAS_DECIDED_OR_FOUND, AND_WHY> |

Append one row per decision, at the bottom.

**Timestamp** is local time to the minute, `YYYY-MM-DD HH:MM`, taken from the system clock at the moment of writing, never from memory. Order is most of what makes this file readable, and a guessed timestamp breaks it. Two decisions in one afternoon are common, and a date alone cannot say which came first.

**Actor** is the person the work was done for, read from `git config user.name`. **Team projects only**: drop the column on a personal project, where every row carries the same name.

**Author** is the exact model identifier that wrote the row, for example `claude-opus-5`. Not a product name, not a skill name, and not "an assistant". **Keep this column on a personal project too**, since the model changes from session to session even when the person does not, and a reader weighing an old decision wants to know what produced it. Where a person wrote the row by hand, put their git user name here as well, which says plainly that no model was involved. **Never guess an identifier you do not know**: write `unknown-model` and say so in your report.

**Skill** is the writing skill's exact command name, `/dev-develop` or `/dev-debug`. No other skill writes here.

**Task** is the number and name from `build-plan.md`, so a row can be traced back to the work that produced it. Use `—` for a decision that belongs to no single task.

**Decision** is one to three sentences, and it says the **why**, not only the what. `switched to Postgres full text search` is worthless six weeks later. `switched to Postgres full text search, since the separate search service was a second thing to run locally for a feature used on one page` is what stops somebody undoing it. **Length is the one place this table bends**: a cell that needs three sentences gets three sentences, and squeezing a reason down to fit a column is how the file stops being worth keeping.

**Append only, and never rewrite a row.** A decision is a claim about what somebody believed at a moment that has already passed. When a later decision reverses an earlier one, **append a new row saying so** and leave the old one standing. The pair is the useful thing: it says the first approach was tried and why it did not hold, which is exactly what stops a third session trying it again. Nothing here is struck through either, because a row is not a state that changes, it is an event that happened.

---

## Worked example

**Reference only. Delete this whole section when writing the real file**, and never copy a row out of it. Every row below is invented.

A team project part way through its second phase, eight tasks planned and five built. It is the same build shown in the Worked example sections of `progress-tracker.md` and `note-registry.md`, so the three can be read side by side.

````markdown
| Timestamp | Actor | Author | Skill | Task | Decision |
| --- | --- | --- | --- | --- | --- |
| 2026-08-05 08:55 | Ana Reyes | claude-opus-5 | /dev-debug | 03 Session auth | the session cookie needs `SameSite=Lax`. A `Strict` cookie is dropped on the return leg of the checkout redirect, so the user came back logged out. Found by a failed verify, and invisible to the type checker |
| 2026-08-06 11:03 | Ana Reyes | claude-opus-5 | /dev-develop | — | booking times are stored as UTC and rendered in the venue timezone. Local time in the column looked simpler until the first venue crossed a daylight saving boundary twice a year |
| 2026-08-08 16:45 | Ian Tumulak | claude-opus-5 | /dev-develop | 06 Booking form page | stopped rather than choosing a date picker. Two candidates, neither on `code-standards.md`'s approved list, and the choice fixes the accessibility story for every form after this one. Routed to `/dev-architect`, and the task is `BLOCKED` until it comes back |
````

What it demonstrates:

- **Every row gives the reason, not only the outcome.** `SameSite=Lax` on its own would be undone by the first person who found it inconvenient. The redirect sentence is what stops them.
- **The second row belongs to no single task** and carries `—`. It is a rule the whole build now obeys, and it came out of one task without belonging to it.
- **The third is a decision owed rather than a decision made.** `/dev-develop` refused to invent it, and this row is why task 06 sits at `BLOCKED` in the tracker with a one line Note pointing this way. Its timestamp matches the `BLOCKED` stamp on that row exactly, because they were written in the same edit.
- **Actor and Author are different questions.** Ana Reyes ran the debug session, and `claude-opus-5` wrote the row. One says whose work it was, the other says what produced the words, and on a stale decision the second is often what a reader wants first.
- **Nothing here records that a build passed or that a task got finished.** Those are a `note-registry.md` row and a Status cell. Five tasks were built, and only two of them produced a row here, which is the normal ratio: most tasks go to plan and decide nothing.
- **Timestamps track when the thinking happened, not when the code landed.** The `SameSite` row is stamped the morning the cause was proven, minutes after the `/dev-debug` row in `note-registry.md` that proved it, and a day after the verify that exposed it. Ordering by the fix commit would have put it in the wrong place in the story.
