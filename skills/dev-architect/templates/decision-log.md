# Decision Log

*Purpose: the running record of real decisions, bugs found, and fixes made during the build, in the order they happened, so a later session does not repeat an investigation somebody already did or silently contradict a choice somebody already made.*

Split out of `progress-tracker.md` so that file stays a scannable state table. A tracker is read at a glance, and a decision needs a paragraph. Growing one inside the other made both worse.

**Two skills write here.** `/dev-develop` records a decision it made or an assumption it built on, and `/dev-debug` records a proven root cause and its fix. Nobody else writes, and `/dev-sync` never does, because it decided nothing.

---

## What belongs here

*Purpose: the boundary, stated up front, because this file is only useful for as long as it stays decisions rather than drifting into a diary.*

Write an entry when a later session would otherwise have to work the same thing out again:

- **A choice made during the build** that the design documents did not settle, and the reason for it.
- **An assumption built on**, marked `assumed, not yet ratified` until `/dev-architect` confirms it.
- **A bug found and why it happened**, meaning the cause rather than the symptom.
- **Something that turned out harder or different than the plan expected**, where the next task will hit the same thing.

Do not write a diary of edits. A line that narrates what a task did is noise, and noise here is expensive: this file is the single best source `/dev-document` has for a changelog or a postmortem, and every worthless line makes the valuable ones harder to find.

**What goes elsewhere:**

- **What was run, and what it proved.** That is a row in `note-registry.md`. This file holds the conclusion, that file holds the observation.
- **A task's state.** That is the Status or Verify Check cell in `progress-tracker.md`.
- **Why a task is blocked**, in one line for somebody scanning the table. That is the Note cell in `progress-tracker.md`. The reasoning behind it still belongs here.
- **Review findings.** Those are `/dev-check review`'s, and they go in `.konteksto/reviews/`.

---

## Entries

*Purpose: every decision in one list, oldest at the top, so reading down gives the build's reasoning in the order it actually happened.*

- **<YYYY-MM-DD>**, <TASK_NUMBER_AND_NAME_OR_DASH>: <WHAT_WAS_DECIDED_OR_FOUND, AND_WHY>

Append one entry per decision, at the bottom.

**The date** is the day it happened, taken from the system clock, never from memory. Order is most of what makes this file readable, and a guessed date breaks it.

**The task** is the number and name from `build-plan.md`, so an entry can be traced back to the work that produced it. Use `—` for a decision that belongs to no single task.

**The entry itself** is one to three sentences, and it says the **why**, not only the what. `switched to Postgres full text search` is worthless six weeks later. `switched to Postgres full text search, since the separate search service was a second thing to run locally for a feature used on one page` is what stops somebody undoing it.

**Append only, and never rewrite an entry.** A decision is a claim about what somebody believed at a moment that has already passed. When a later decision reverses an earlier one, **write a new entry saying so** and leave the old one standing. The pair is the useful thing: it says the first approach was tried and why it did not hold, which is exactly what stops a third session trying it again.

**Team projects** put the git user at the front of the entry, as `**<YYYY-MM-DD>**, <GIT_USER>, <TASK>: ...`. Drop it on a personal project, where every entry carries the same name.

---

## Worked example

**Reference only. Delete this whole section when writing the real file**, and never copy an entry out of it. Every line below is invented.

````markdown
- **2026-08-03**, Ana Reyes, 03 Session auth: the session cookie needs `SameSite=Lax`. A `Strict` cookie is dropped on the return leg of the checkout redirect, so the user landed back logged out. Found by a failed verify, not by the type checker.
- **2026-08-06**, Ian Tumulak, —: booking times are stored as UTC and rendered in the venue timezone. Storing local time seemed simpler until the first venue crossed a daylight saving boundary.
- **2026-08-08**, Ian Tumulak, 05 Availability query endpoint: availability must read the venue timezone from `venues.tz`, never the server clock. `architecture.md`'s Value Sourcing table now records this. Assumed at first, then ratified by `/dev-architect` the same day.
- **2026-08-09**, Ian Tumulak, 06 Booking form page: `assumed, not yet ratified`, the date picker will be the one already used in the admin area rather than a new dependency. Building on this until `/dev-architect` confirms it, and the task stays off `DONE` in the meantime.
````

What it demonstrates: every entry gives a reason, not only an outcome; one belongs to no task and carries `—`; one is explicitly unratified, which is the signal that keeps its task off `DONE`; and the timezone pair shows a general rule and the specific task that forced it, recorded separately because they are useful to different readers.
