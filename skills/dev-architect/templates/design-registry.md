# Design Registry

*Purpose: every user facing surface this product needs, the design artifact that settles how it looks and behaves, and where that artifact stands. One row per surface, rewritten in place as it moves. This is the file that makes a missing design visible before somebody builds around the hole.*

A surface with no approved design is not a gap in the code. It is a product decision nobody has made, and the only reliable way to notice one is to list the surfaces the flows require and check them off against artifacts that exist.

**This is not `ui-registry.md`.** That file inventories components that exist in the code, written by `/dev-develop` as it builds them. This one lists surfaces the product needs, written by `/dev-architect` before anything is built. One looks backward at what was made, the other forward at what is owed.

---

## Entries

| Surface | Required by | File | Required states | Status | Note |
| --- | --- | --- | --- | --- | --- |
| <SURFACE_NAME> | <FLOW_AND_STEP_IN_PROJECT_OVERVIEW> | `designs/<SLUG>.html` | <STATES_THIS_SURFACE_NEEDS> | <STATUS_STAMP> | — |

One row per surface. Order them the way the flows run, so a reader following a journey reads down the table.

**Required by** names the flow and the step in `project-overview.md` that needs it. This column is what makes the completeness audit mechanical rather than a matter of memory, and it is the column most often left vague. `Enable two factor, step 4` is useful. `Security` is not.

**File** is the path under `.konteksto/designs/`, or `—` when nothing exists yet.

**Required states** lists the states this surface actually has, comma separated: `default, submitting, invalid code, locked`. This is what makes completeness strong without multiplying rows, and it is checked by `/dev-develop` when it builds and by `/dev-check verify` when it looks.

### Surface, state, and interaction are three different things

*Keep this section. Without the distinction, a registry grows a row for every state of every screen, and a six entity product produces eighty rows nobody reads.*

| Term | Means | Gets a row |
| --- | --- | --- |
| **Surface** | a distinct user context needing its own composition | yes |
| **State** | a variation of one surface: loading, empty, error, success, locked | no, it goes in Required states |
| **Interaction** | a behavior within a surface: submit, filter, confirm, regenerate | no, the prototype demonstrates it |

An orders page that is loading, empty, populated, or failing is **one surface with four states**, not four surfaces. Recovery codes after two factor setup is **a separate surface**, because its purpose and composition differ from the setup screen even though the same flow reaches both.

**The test: would a designer compose this from scratch, or is it the same composition showing different content?** Composed from scratch is a surface. Different content in the same frame is a state.

### One prototype may cover several surfaces

**What matters is coverage, not file count.** Every surface must map to an approved prototype. Several surfaces may map to the same file where they are genuinely steps of one thing:

```
| Checkout, cart      | ... | `designs/checkout.html` | ...
| Checkout, shipping  | ... | `designs/checkout.html` | ...
| Checkout, payment   | ... | `designs/checkout.html` | ...
```

And one complex surface may warrant several files. The registry is the mapping, so a rule forcing one file per surface would buy nothing and would split a flow that reads better whole.

**A shared file is approved once, and every row pointing at it moves together.** Approving `checkout.html` approves the three rows above, and a change to it puts all three back into the lifecycle. Where you want them to move independently, they belong in separate files.

---

## Status values

| Status | Means | Written by |
| --- | --- | --- |
| `MISSING` | the flow requires this surface and no artifact exists | `/dev-architect` |
| `DRAFT` | an artifact exists and is not finished | `/dev-architect` |
| `READY FOR REVIEW` | finished, self critiqued, waiting on a person | `/dev-architect` |
| `CHANGE REQUIRED` | was approved, and something has since made it wrong | `/dev-architect` |
| `APPROVED` | a person looked at it and accepted it | **only a person decides**, see below |

**No skill may ever originate an approval.** An approval asserts that a human reviewed something. A tool deciding its own would empty the word, and every rule downstream that depends on approval would then depend on nothing. This is the same rule that governs phase checkpoints, for the same reason.

**A skill may record an approval a person actually gave.** Deciding and writing down are different acts, and requiring somebody to hand edit markdown after saying yes is ceremony rather than safety. Three conditions, all required:

1. **The person said yes to this specific artifact, explicitly.** A direct approval of the thing in front of them.
2. **A vague yes is not one.** "Looks good", "sure", "whatever you think", and silence are not approvals, exactly as `/dev-scope`'s interview refuses them. Ask again as a concrete question rather than banking it.
3. **The name recorded is the person's, taken from what they said or from who you are talking to.** Never from `git config`, which proves who owns the checkout and not who approved anything, and which a skill could otherwise read to approve on its own behalf.

**When in doubt, do not record it.** A design wrongly sitting at `READY FOR REVIEW` costs one question. A design wrongly reading `APPROVED` costs whatever gets built on it.

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

**An accessibility departure makes the prototype stale, not the implementation wrong.** When `/dev-develop` has to depart from an approved prototype to meet the contrast or touch target target in `design.md`, the built page is correct and the prototype is now the thing that disagrees with reality. That row moves to `CHANGE REQUIRED`, and `/dev-architect` fixes the prototype to match what shipped. Leaving it at `APPROVED` would mean the next surface inherits the same inaccessible pattern from a document that says somebody blessed it.

---

## Stamping

**`progress-tracker.md`'s Progress section defines stamping and superseding**, and this file follows it exactly: a value carries who set it and when, and a change is struck through with the new one appended rather than overwritten.

```
DRAFT, claude-opus-5, 2026-08-11 14:02
~~DRAFT, claude-opus-5, 2026-08-11 14:02~~ APPROVED, Ian Tumulak, 2026-08-11 16:30
```

One thing here differs from the tracker and is easy to get wrong. **An `APPROVED` stamp carries the approving person's name**, whether they wrote the row or a skill recorded their explicit yes. Never a model identifier, and never a name read out of `git config`. The evidence that matters is the approval interaction, not who owns the checkout, and a shared machine makes the git identity worth nothing.

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
| `/dev-architect` | every row, every Status except `APPROVED`, and an `APPROVED` a person explicitly gave | decide an approval itself, or infer one from a vague yes |
| a person | anything, including `APPROVED` directly | nothing is off limits, it is their product |
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
