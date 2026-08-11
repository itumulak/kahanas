# Glossary

*Purpose: the one word this project uses for each thing in its domain, and the words it does not use. Every other document, every table name, every variable, and every user facing string draws from this list, so the product, the code, and the conversation are all saying the same thing.*

Two words for one concept is not a style problem. It is how a later session builds a second thing, decides the existing one must be different, and leaves both in the codebase.

---

## Language

*Purpose: the terms themselves. One entry per concept, in the shape below. Group them under subheadings only when natural clusters appear; a flat list is fine and usually better.*

**<TERM>**
<ONE_OR_TWO_SENTENCE_DEFINITION_OF_WHAT_IT_IS>
*Avoid*: <REJECTED_WORD>, <REJECTED_WORD>

Repeat one entry per term. Keep them in alphabetical order, so a reader checking a word finds it without reading the file.

### How to write an entry

**Be opinionated. Pick one word and reject the rest by name.** The Avoid line is the part that does the work. A definition alone changes nothing, because nobody looks up a word they believe they already understand, and the person about to write `client` is not wondering whether the project says `customer`. Seeing their word listed as rejected is what stops them.

**Define what it is, not what it does.** One or two sentences. A definition that lists behavior turns into a specification, and a specification here goes stale the first time the behavior changes.

**Leave an entry out when the word is a general programming term.** Cache, retry, timeout, repository, handler. Those belong in `code-standards.md` or nowhere. Before adding one, ask whether it means something particular in this product, or something it would mean in any product. Only the first belongs here.

**Where a term genuinely has two meanings, that is two entries with two words.** Renaming one of them is the work. Documenting the collision and keeping both is how it survives.

---

## What does not belong here

*Purpose: the boundary. Keep this section. This file sits next to four others that also hold project knowledge, and without a stated line it slowly becomes a second copy of all of them.*

**No implementation details, at all.** Not a table name, not a type, not a field, not an endpoint, not a library. Those live in `architecture.md`. This file must stay true after a rewrite that changes every one of them, and that is only possible if none of them are in it.

**Not a specification.** What a Booking does, when it may be cancelled, and who may see it are flows in `project-overview.md` and rules in `architecture.md`. This file says only what a Booking is.

**Not a decision record.** Choosing `Booking` over `Reservation` is a decision, and if it was a hard one with a real reason, that reason goes in `decision-log.md` during a build, or in the Why these choices list in `architecture.md` at design time. What lands here is the outcome: one word, and the words it beat.

**Not a scratch pad.** A term nobody has settled is not an entry. Leave it out and ask.

---

## Who writes what

*Purpose: this file has two writers, so the split is stated here as well as in both skills. An unstated second writer is how a shared document rots.*

| Skill | May write | Must not |
| --- | --- | --- |
| `/dev-scope` | creates the file, and writes every term that comes out of the product conversation | name a tool, or invent a term the user never used |
| `/dev-architect` | adds a term the design forced into existence, and sharpens a definition the schema proved imprecise | rename a term the user gave, or add an implementation word |
| `/dev-develop`, `/dev-check`, `/dev-debug`, `/dev-test`, `/dev-document` | nothing | write here at all. Read it, use its words, and report drift |
| `/dev-sync` | nothing | write here at all, including a term found in the code |

**The two writers are split by stage, not by term.** `/dev-scope` writes what the user said, in the user's own words wherever those words work. `/dev-architect` writes what designing the thing revealed, for example that the product's single word `account` was covering two separate concepts all along.

**`/dev-architect` may sharpen a definition and may not rename a term.** A rename is a decision about the product's own language, and the person whose product it is owns it. Where a term is genuinely wrong, say so and ask, rather than quietly correcting it in a file everything else reads.

**`/dev-sync` writes nothing here, and this is not an oversight.** A term in the code that is missing from this file looks exactly like a gap it is allowed to fill elsewhere, and it is not one.

**The code proves a word is in use. This file claims that word is the one the project chose.** Those are different facts, and only the first is in the repository, so reading the code can never prove what belongs here. That is what separates this file from `ui-registry.md`, which records what exists and which `/dev-sync` does correct from the code.

So it reports and stops: a word this file rejects on an Avoid line, named alongside the entry it disagrees with, or a concept in the code with no entry at all. Both go to a person, and the fix is often a rename in the code rather than an edit here.

---

## Keeping it true

*Purpose: what happens when the code and this file disagree. Keep this section, since the drift rule is the only reason a glossary is worth more than the first afternoon it took to write.*

**A term here appears in the code with the same word.** Not a paraphrase, not a shortening. Where the glossary says `Venue`, the table, the type, the variable, and the button label all say venue.

**A rename is a rename everywhere, in one task.** Changing the entry and leaving the code is worse than not changing it, because now both words are in use and one of them claims to be canonical.

**Report a disagreement, never resolve one silently.** Say which word the code uses, which the glossary says, and where. The person decides which one is wrong, because from the outside a drifted name and a deliberate exception look the same.

---

## Worked example (Reference only)

*This section is an example. It is not part of a real project's glossary, and the skill writing this file deletes it. It exists so a first entry has a shape to copy, and the terms in it are invented.*

The example is the same invented booking product used by the worked examples in `progress-tracker.md`, `decision-log.md`, and `note-registry.md`, so the four can be read together.

---

**Booking**
A confirmed agreement that one guest takes one slot at one venue. It exists only once payment has cleared.
*Avoid*: Reservation, appointment, event

**Guest**
The person who takes a slot. They may have no account, since a booking can be made from an emailed link.
*Avoid*: Customer, client, user

**Hold**
A slot reserved for fifteen minutes while a guest completes payment. It is not a booking, and it expires on its own.
*Avoid*: Pending booking, provisional booking, lock

**Host**
The person who owns a venue and publishes its slots. Every host is also a user of the admin side.
*Avoid*: Owner, vendor, provider, admin

**Slot**
A window of time at a venue that a guest may take. A slot is published by a host and exists whether or not anybody books it.
*Avoid*: Time, availability, opening

**Venue**
A physical place with its own address, timezone, and opening hours, belonging to exactly one host.
*Avoid*: Location, site, place

---

Three things in that example are worth copying, and none of them is the wording.

**`Guest` rejects `user` even though the code has users.** A host is a user too, and letting one word cover both is how a permission check ends up asking the wrong question. Where two concepts overlap in ordinary speech, the Avoid lines are what separate them.

**`Hold` exists because the team kept saying "pending booking".** A concept with no word of its own gets described instead of named, differently every time, and eventually two people build two versions of it. Naming it is the fix.

**Not one entry names a table, a type, or a field.** `Venue` mentions a timezone because a venue has one in the world, not because a column does. The moment an entry says `venues.tz`, this file has started decaying into `architecture.md`.
