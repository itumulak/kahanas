# Design Registry

*Purpose: every user facing surface this product needs, the design artifact that settles how it looks and behaves, and where that artifact stands. One row per surface, rewritten in place as it moves. This is the file that makes a missing design visible before somebody builds around the hole.*

A surface with no approved design is not a gap in the code. It is a product decision nobody has made, and the only reliable way to notice one is to list the surfaces the flows require and check them off against artifacts that exist.

**This is not `ui-registry.md`.** That file inventories components that exist in the code, written by `/dev-develop` as it builds them. This one lists surfaces the product needs, written by `/dev-architect` before anything is built. One looks backward at what was made, the other forward at what is owed.

---

## Entries

| Surface | Required by | File | Status | Note |
| --- | --- | --- | --- | --- |
| <SURFACE_NAME> | <FLOW_AND_STEP_IN_PROJECT_OVERVIEW> | `designs/<SLUG>.html` | <STATUS_STAMP> | — |

One row per surface. Order them the way the flows run, so a reader following a journey reads down the table.

**Surface** is what a person would call the screen or the significant state: `Login`, `Dashboard`, `Two factor challenge`, `Recovery codes`. Not a component, and not a route.

**Required by** names the flow and the step in `project-overview.md` that needs it. This column is what makes the completeness audit mechanical rather than a matter of memory, and it is the column most often left vague. `Enable two factor, step 4` is useful. `Security` is not.

**File** is the path under `.konteksto/designs/`, or `—` when nothing exists yet.

---

## Status values

| Status | Means | Written by |
| --- | --- | --- |
| `MISSING` | the flow requires this surface and no artifact exists | `/dev-architect` |
| `DRAFT` | an artifact exists and is not finished | `/dev-architect` |
| `READY FOR REVIEW` | finished, self critiqued, waiting on a person | `/dev-architect` |
| `CHANGE REQUIRED` | was approved, and something has since made it wrong | `/dev-architect` |
| `APPROVED` | a person looked at it and accepted it | **a person, by hand** |

**Only a person writes `APPROVED`, and no skill may write it under any circumstances.** An approval asserts that a human reviewed something. A tool writing its own would empty the word, and every rule downstream that depends on approval would then depend on nothing. This is the same rule that governs phase checkpoints, for the same reason.

**A skill may write every other value**, including moving an approved design to `CHANGE REQUIRED` when a scope change or a build clearly invalidated it. Recording that something has gone stale is an observation. Deciding it is fixed is not.

### The lifecycle

```
MISSING  →  DRAFT  →  READY FOR REVIEW  →  APPROVED
```

And when something later makes an approved design wrong:

```
APPROVED  →  CHANGE REQUIRED  →  DRAFT  →  READY FOR REVIEW  →  APPROVED
```

**An approved design is never silently changed.** Editing the file without moving the row back through the lifecycle means the word `APPROVED` is describing something nobody approved.

---

## Stamping

Every Status value carries who set it and when, in the same shape `progress-tracker.md` uses:

```
DRAFT, claude-opus-5, 2026-08-11 14:02
APPROVED, Ian Tumulak, 2026-08-11 16:30
```

A model writes its **exact model identifier**, or `unknown-model` when it genuinely cannot tell, and says so in its report rather than guessing one. A person writes their git user name.

**A value that changes is superseded, never overwritten.** Strike the old one through and append the new one after it, leaving exactly one unstruck value, which is the current one:

```
~~DRAFT, claude-opus-5, 2026-08-11 14:02~~ ~~READY FOR REVIEW, claude-opus-5, 2026-08-11 15:40~~ APPROVED, Ian Tumulak, 2026-08-11 16:30
```

The history is the point. A surface that was approved, then required a change, then was approved again is telling a later session something a single final value hides.

**The Note column is narrow.** Only a `MISSING` or a `CHANGE REQUIRED` row carries one, both must, and every other row reads `—`. A `MISSING` note says what the flow needs and nobody has designed. A `CHANGE REQUIRED` note says what made it wrong. It is overwritten rather than superseded, because the struck stamps beside it already hold the history.

---

## What does not belong here

*Purpose: the boundary. Keep this section, since a registry with no stated edge grows into a second progress tracker.*

**No implementation status.** Whether a surface was built, and whether anybody watched it work, are the Status and Verify Check columns of `progress-tracker.md`. This file stops at whether the design is settled. Adding a built or implemented value here would put one fact in two places and make `/dev-develop` a writer on an `/dev-architect` file to record something already recorded.

**No design rationale.** Why a layout is the way it is belongs in `design.md` or in the prototype itself. This is an index.

**No version history in the filename.** A revised design keeps its path and moves through the lifecycle again. Git holds the previous content, and `git log -1 -- .konteksto/designs/<file>` finds it. Filenames like `dashboard-final-v2.html` are how a folder becomes unreadable.

---

## Who writes what

| Skill | May write | Must not |
| --- | --- | --- |
| `/dev-architect` | every row, and every Status except `APPROVED` | write `APPROVED`, ever |
| a person | `APPROVED`, by hand | nothing is off limits, it is their product |
| `/dev-develop` | nothing | write here. It reports a gap and routes to `/dev-architect` |
| `/dev-check` | nothing | write here. It reports a mismatch |
| `/dev-sync` | nothing | write here, including a row for a surface it found in code |

**`/dev-sync` writes nothing here for the same reason it writes nothing in `glossary.md`.** The code proves a page exists. It never proves the page was designed, still less approved, and a row invented from a route would quietly assert both.

---

## Worked example (Reference only)

*This section is an example. It is not part of a real project's registry, and the skill writing this file deletes it. The surfaces, names, and dates in it are invented.*

Same invented booking product as the worked examples in `progress-tracker.md`, `decision-log.md`, `note-registry.md`, and `glossary.md`.

| Surface | Required by | File | Status | Note |
| --- | --- | --- | --- | --- |
| Venue list | Find a venue, steps 1 to 2 | `designs/venue-list.html` | ~~DRAFT, claude-opus-5, 2026-08-04 10:12~~ APPROVED, Ian Tumulak, 2026-08-04 15:20 | — |
| Venue detail | Find a venue, step 3 | `designs/venue-detail.html` | APPROVED, Ian Tumulak, 2026-08-04 15:22 | — |
| Slot picker | Book a slot, steps 1 to 2 | `designs/slot-picker.html` | ~~APPROVED, Ian Tumulak, 2026-08-05 09:40~~ ~~CHANGE REQUIRED, claude-opus-5, 2026-08-08 16:45~~ DRAFT, claude-sonnet-5, 2026-08-09 11:02 | — |
| Payment | Book a slot, step 4 | `designs/payment.html` | READY FOR REVIEW, claude-opus-5, 2026-08-09 12:15 | — |
| Booking confirmed | Book a slot, step 5 | `designs/booking-confirmed.html` | APPROVED, Ana Reyes, 2026-08-06 11:30 | — |
| Hold expired | Book a slot, step 4 fails | — | MISSING, claude-opus-5, 2026-08-09 12:20 | A hold expires after fifteen minutes and the flow says so, and nothing designs what the guest sees when it does |
| Host slot editor | Publish slots, steps 1 to 3 | `designs/host-slot-editor.html` | DRAFT, claude-sonnet-5, 2026-08-10 09:05 | — |

Four things in that table are worth copying, and none of them is the wording.

**The `Hold expired` row is the whole reason this file exists.** Every screen a person would name got designed. The failure branch of step 4 did not, because nobody pictures it when they picture the product. Reading the flow steps rather than the page list is what found it, and its Required by column names the exact step so the claim can be checked.

**The slot picker's history reads left to right and says something.** It was approved, a later decision invalidated it, and it is now back in draft on a different model. A single current value would have hidden that it was ever approved, and a reader deciding whether to trust the built page needs to know it was built against something that has since changed.

**Two different people approved rows.** On a team project that is normal and worth being able to see, which is why the approver is inside the stamp rather than assumed.

**Not one row says whether the surface was built.** The slot picker sitting at `DRAFT` says nothing about whether code for it exists, and `progress-tracker.md` says nothing about whether its design was approved. Both facts are needed and neither file holds the other.
