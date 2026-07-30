# Architect: the design conversation

Read this in full **before asking a single design question**. The *Asks vs acts* section in `SKILL.md` is a summary of the intent. It is not the protocol, and it is not enough to run the conversation from.

---

## Before the stages: check what you are actually doing

### Check 1: is this documenting a decision that is already made?

Scan what the user said, and what the codebase shows, for signs of a decision already taken: "we built", "we are using", "we already chose", "just document it", or simply a working application in the folder.

Where a decision is already live, present a panel:

> "This sounds like something already decided. Document what is there, or design it again from scratch?"
>
> 1. **Document what is there** (recommended): faster, and it records the reasoning while you still remember it.
> 2. **Design it again**: only worth it when the existing choice is genuinely up for reversal.

On **document**, ask for the reasoning as **free text, not a menu**, because only the user has it. Cover at least three angles, worded for what they actually built:

- The **alternatives** they weighed before choosing this.
- The **main reason** they went with it.
- The **tradeoffs** they accepted, meaning what it made harder.

Then write those into the "Why these choices" list in `architecture.md` as a record of a decision made, not as a fresh evaluation. Read the code to verify and supplement what they told you.

**A decision already in the code is not up for re litigation.** Record it and move on, unless the user asks otherwise.

### Check 2: state the framing back

Infer the framing rather than interrogating for it, then say it in one or two lines so a wrong reading is cheap to correct:

- **Which halves exist**, from Project Shape in `project-overview.md`.
- **The platform**: web, mobile, an API, or a mix. **Never assume web.** It changes the questions entirely, since mobile authentication, offline behavior, and push notifications have nothing to do with the web equivalents.
- **What is already fixed**: the stack in the existing code, and anything the user named during scoping.
- **Constraints**, from what `project-overview.md` says about the audience and the scope.

State it: "reading this as a new web application, both halves, nothing fixed yet. Correct me if not."

Then begin.

---

## Enumerate the dimensions before you ask anything

**Before the stages, list every load bearing dimension this project has**, and assign each one to the stage that owns it. Sort each into infer, ask, or recommend.

The checklist below is a prompt, not a script. Not all of it applies, and a real project adds its own.

- **Functional scope and boundaries**: what is in, what is explicitly out, the happy and unhappy paths.
- **Data model and persistence**: entities, fields, types, nullability, relationships, indexes, uniqueness, retention and deletion.
- **Lifecycle and state machine**: the states, the valid transitions, and what triggers each.
- **Interface surface**: endpoints or actions, inputs, outputs, status codes.
- **Authentication and authorization**: who may do what, ownership, roles, scoping across tenants.
- **Validation and business rules**: limits, quotas, and the invariants that must always hold.
- **External integrations**: providers, webhooks, idempotency, reconciliation.
- **Library and provider choices**: central for anything with a real implementation choice, meaning auth, payments, search, storage, email, or realtime.
- **Failure and edge cases**: concurrency, retries, timeouts, partial failure, and the empty, error, and loading states.
- **Performance and scale**: expected volume, pagination, synchronous or not, caching.
- **Security and compliance**: personal data, encryption, audit logging, rate limiting, regulatory scope.
- **Observability**: what gets logged, what is measured, what alerts.
- **Configuration and secrets**: new environment variables, feature flags, credentials.
- **The visual surface**, when there is a frontend: what each screen shows and does, its states, its accessibility bar.
- **Discoverability**, for anything publicly indexed: metadata, structured data, social cards, canonical URLs, and whether pages render on the server.

**Your mandate.** You are the engineer accountable if this ships wrong. These documents are what `/develop` builds from, so **any blank dimension becomes a guess partway through a build**. Leaving a gap is the failure mode here, not asking one question too many.

---

## Question mechanics, every question, no exceptions

- **Offer the real options, with exactly one marked as recommended** and a one line why. You make the call, and the user overrides. List every choice that genuinely applies, never a token two.
- **The last option is always free text.** `AskUserQuestion` appends that slot itself, so do not add your own. In a plain text fallback, add it explicitly.
- **Generate the options fresh at runtime.** Never a canned list. This category rots faster than anything else in software, so be honest when you are unsure: say it is as of your knowledge and that the space moves quickly.
- **Never bundle a whole decision into one accept or change panel.** Not the entire data model, not the whole stack, not a finished endpoint table. Ask each dimension as its own question and assemble as you go.
- **Grill down to the smallest load bearing decision.** No choice is too small to route through the user when it is load bearing. Silently deciding one is the thing this whole protocol exists to prevent.
- **Batch up to four related questions per round**, run as many rounds as a stage needs, and fold earlier answers forward so it reads as one continuous conversation rather than a form.
- **Never put a citation in an option label.** The reasoning belongs in the written document, not in the live panel.

**The quality bar.** Every option maps to a real decision about this specific project, with a one line tradeoff. A placeholder option like "how complex is your data model?" is a wasted question, and the user notices.

---

## The stages

Walk these in order, as one continuous interview.

### Stage A: Requirements

Do not open with a finished list. Ask one question at a time, seeded from the Core User Flow steps already in `project-overview.md`, and suggest an answer each time: the core job, the happy path, the rules and limits, the failure cases that matter.

The flows in `project-overview.md` are the contract. This stage sharpens them into something buildable, and it never contradicts them. Where an answer does contradict a flow, stop: `/scope` owns that file, so say so and settle which of the two is wrong.

### Stage B: Data model

**Mandatory for anything that stores data. Never skipped.**

Ask, assemble, show, confirm, iterate. In that order.

1. **Ask, do not guess.** Never open with a finished schema. Elicit in batched rounds: first the **entities**, then per entity the **fields** with their types and whether each is required, then the **relationships** and their cardinality, then the **rules**, meaning uniqueness, retention, and the invariants.
2. **Assemble** the model from their answers.
3. **Show** it as a table: entities, primary keys, foreign keys, cardinality.
4. **Confirm** with a panel: it matches (recommended) · a field or entity is wrong · a relationship is wrong.
5. **Iterate** until it is accepted.

This is the one artifact worth showing whole and confirming mid conversation, because a wrong data model cascades into every later decision and every build task.

On sign off, the migration becomes the first task in `build-plan.md`.

### Stage C: The stack walk

Drive it yourself in dependency order, batching independent layers up to four per round. The user should never have to ask you to move on.

Which layers apply is your judgment from the platform and the product. A web application, a mobile application, an API service, and a data pipeline share no layer list, so do not run one script across all four.

Per layer: present the real current options, mark your suggested pick with a one line why, and let the user choose. **Prefer reuse of what the project already runs.** Skip any layer the existing code already settles, and do not ask again about something decided.

**Note every new tool the walk settles, but do not go looking for skills or MCP servers yet.** Discovery runs later, at `SKILL.md` step 6, after the brownfield audit. That ordering is deliberate: the audit can replace a package, and searching now would hunt for tooling around a library you are about to drop. Carry the list forward.

**Cap any research.** Where you check the current landscape, run it once, in a read only subagent on a cheap model. Official documentation and registries first. At most five searches and eight pages, returning the options, freshness notes, and links, and nothing else. No web access means proceeding from knowledge and flagging the staleness plainly.

### Stage D: The interface surface, then close the value sourcing loop

First, which surfaces the product needs. Then per surface: the method, the inputs, the outputs, the auth requirement, and the errors that matter.

**Then the part that is easy to skip and expensive to skip.**

For every Core User Flow step, take each value it needs the product to produce, compute, or display, and confirm something names where that value comes from: an input, a database column, a derivation from a named value, or a decision already recorded.

**A required value with no named source is an undecided input, not a build detail.** Ask when only the user knows it, recommend otherwise, and resolve it before moving on.

This is procedural, not a checklist. Trace each value the flows actually need rather than scanning a fixed list.

Illustrations of the shape only:

- A flow that says a streak resets when the last activity was before yesterday needs the user's local day, so something must name where the timezone comes from: a column, a parameter, or a request header.
- A displayed total needs its rounding and its currency named.
- A per tenant view needs the tenant resolution named.

**This fills the Value Sourcing table in `architecture.md`**, and that table is what stops `/develop` inventing a source partway through a build. `/develop` runs the same test again before writing code, and a gap here is what it catches.

### Stage E: Security and authorization

Walk the rules one at a time. Who may do what, ownership, roles, scoping across tenants and organizations, plus any compliance scope this product triggers through payments, personal data, or health information.

### Stage F: Edge cases and failure modes

One case at a time: concurrency, retries, timeouts, partial failure, and the empty, error, and loading states.

### The page design stage, when there is a frontend

Insert this between Stage A and Stage D. `SKILL.md` step 3 spells it out in full, and it walks the design source, the page composition, the component inventory, and the asset strategy, one question at a time. It is a stage of this conversation, not a separate phase that happens afterwards.

**When the visual side is not specified, you extract the page contents from the user. Never invent them.** What goes on a page is something only they know.

---

## The completeness gate

**Do not start writing a document until every dimension you enumerated is accounted for.** Each one is asked, or inferred with the inference stated back, or explicitly not applicable.

Anything still open means keep asking. An unasked dimension becomes a guess partway through a build, and by then it is expensive.

**A short interview is a red flag.** A real project spans many dimensions and several rounds. When in doubt, ask the extra question.

**Collect the recommend items** you will settle yourself when you write, meaning the calls better made with the full picture in view. Decide each one in the document, stating the pick, a one line why, and the runner up. Never echo one back later as an open question.
