---
name: dev-design
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch
description: "Run /dev-design after /dev-architect on any project with a frontend, and again whenever a surface needs a new or revised design. Maps the product flows to the surfaces they require, settles the design system, builds an interactive HTML prototype for every surface in .konteksto/designs/, then renders each one in a real browser at every breakpoint and every state and puts it in front of a person to approve. Owns design.md, design-registry.md, and the designs folder. Skipped entirely on a backend with no app/."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Answers **how the product looks and behaves**, given a `project-overview.md` that says what it is and an `architecture.md` that says what it is built with.

It finds every surface the flows require, settles the design system once, builds an interactive prototype for each surface, and runs the review that puts a rendered design in front of a person to approve. Nothing else in the workflow may originate a design decision, and nothing else may write the three files this skill owns.

**Skip this skill entirely on a backend with no `app/`.** A service with no screens has no surfaces, no prototypes, and no design system, and `/dev-architect` says so in its report rather than sending you here.

## Where this sits

**Before this:** `/dev-architect`, which settled the stack. The client framework matters here, because a prototype should not fight the thing that will implement it.

**After this:** `/dev-develop`, which builds against an approved prototype.

```
/dev-scope  →  /dev-architect  →  /dev-design  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

**This skill runs more than once, and that is its shape rather than an exception.** The first run covers every surface the flows require. Every run after it handles one thing: a surface `/dev-develop` reported as a visual gap, a design a build made stale, or a new surface a scope change introduced.

```
/dev-develop  →  BLOCKED  →  /dev-design  →  a person approves  →  /dev-develop
```

## Artifact ownership

Three artifacts, owned here and nowhere else:

| Artifact | Holds |
| --- | --- |
| `design.md` | the design system: character, tokens, states vocabulary, breakpoints, component rules |
| `design-registry.md` | one row per required surface, with its design status |
| `.konteksto/designs/` | the prototypes, plus `sources/`, `shared/`, and `drafts/` |

**Nobody else writes any of them.** `/dev-develop` builds from a prototype and never edits one. `/dev-check` compares against one and never edits one. `/dev-sync` writes nothing there at all, including a row for a surface it found in the code, because the code proves a page exists and never that anybody designed it.

**One value in `design-registry.md` is not yours to decide: `APPROVED`.** You write every other status, including moving an approved design to `CHANGE REQUIRED`. **The registry's Status values section defines who may approve and the conditions for recording one**, and it is short. Read it before writing that cell.

### What you may not touch

**`project-overview.md` is `/dev-scope`'s.** If the design work proves it wrong, say so and ask the user to run `/dev-scope` again rather than editing it yourself.

**`architecture.md`, `tooling.md`, `code-standards.md`, and `library-docs.md` are `/dev-architect`'s.** This is the boundary that makes the split worth having, so it is stated exactly: **you work inside the technical constraints, and you may not change them.** No new dependency, no new library, no change to the application structure, and no change to the recorded conventions, however much a design would benefit.

Where a design genuinely needs one, **stop and route it back**, exactly as `/dev-develop` routes a visual gap here. Say what the design needs and why, and let `/dev-architect` decide. A component library added quietly to make one prototype work is a technical decision nobody reviewed.

**`glossary.md` is read here and never written.** Name every surface with the words already in it, and report drift rather than fixing it.

Read a template from `templates/`, in this skill's folder, and write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place.

## Guardrails

Do NOT write application code. Nothing in `app/` is yours, and no line of a prototype is copied into the product by you.

**Two narrow exceptions, and both have tight edges.**

**Design prototypes.** You may write standalone HTML, CSS, and JavaScript **inside `.konteksto/designs/` only**, as design artifacts. Nothing in `app/` may import them.

**The limit is responsibility, not size.** Inside that folder you may not write production anything: no framework components, no API calls, no persistence, no authentication, no business logic. A prototype is made interactive with fixture data, local state, and simulated responses. A genuinely interactive surface may need a few hundred lines of prototype JavaScript, and that is fine. **The moment making it behave would require building a real service, stop**, because that is `/dev-develop`'s work and the prototype does not need it.

**The review session workspace.** A review creates a throwaway directory outside the repository and puts the session's data in it: a copy of the prototype, the manifest, the evidence, and the screenshots. **The harness itself is never copied**, it runs in place out of `review-harness/`. `internal/design-review.md` defines the workspace. Nothing is written inside the repository, nothing is committed, and it exists for the length of one review.

Do NOT install anything. **`/dev-architect` makes every tool call in this workflow**, including installing the browser this skill needs. Where the Visual verification section of `tooling.md` is missing or empty on a project with an `app/`, or where the preflight probe fails, stop and route back rather than installing it yourself.

Do NOT stop a process by signalling it. **A review session ends by creating a file named `stop` in its own directory**, and the server exits on its own. Killing by a stored process id checks nothing about what it is stopping, reports success either way, and can reach anything else on the machine. `internal/design-review.md` step 8 has the procedure and the reasoning, and it applies to every process this skill starts.

Do NOT fill a document with a guess. Every value is read from the existing codebase, stated by the user, or picked by the user from options you presented.

## Asks vs acts

- **INFER**: anything `project-overview.md` or the existing codebase already settles. Which surfaces the flows require, what the product is for, what a screen already looks like.
- **ASK**: what only the user knows. Brand, existing design work, whether a screen they already have is one they like.
- **RECOMMEND**: anything expertise settles. Density, breakpoints, dark mode, the composition of a surface. Make the call, give a one line why. Never a neutral menu, never a silent decision.

## Decision panels

Every user facing choice is an options panel: 2 to 4 concrete options real to this project, exactly one marked as recommended with a one line why. Use `AskUserQuestion` where available, otherwise the same options as plain text. Ask in rounds of up to 4 related questions.

## Execution

### Step 1: Pre flight

- **Read `.konteksto/project-overview.md` in full**, and its Core User Flow section twice. That section is what this skill works from. If the file does not exist, stop and tell the user to run `/dev-scope` first.
- **Read `.konteksto/architecture.md`.** The client framework, the folder layout, and whether there is an `app/` at all. **No `app/` means stop**: say the project has no surfaces and this skill does not apply.
- **Read `.konteksto/glossary.md` in full, and use its words from here on.** Every surface name comes out of it.
- **Read `.konteksto/tooling.md`**, its Visual verification section in particular. It names the browser this skill renders and reviews with. Missing or empty on a project with an `app/` is a stop: report it and route to `/dev-architect`, which owns that file and every install.
- **Then run `review-harness/preflight.mjs` from the project root**, on a project with an `app/`. The document says which browser this project chose; the probe says whether it actually works here, and they are different questions. Any non zero exit is a stop: report what it printed and route to `/dev-architect`. **Do not install it yourself**, and **do not treat a Playwright you found in the project as an answer**, since an end to end suite installs one for its own reasons and choosing what reviews designs is a tool decision. `internal/design-review.md` step 1 holds the three way outcome and the three facts behind it.
- **Read `.konteksto/code-standards.md`.** The conventions a prototype should not fight.
- **Check `.konteksto/` for existing design artifacts.** Report what `design.md` and `design-registry.md` say, and what is in `designs/`. Never overwrite one silently. **An approved prototype is never overwritten at all**, it goes back through the lifecycle.

**Then work out which run this is.** The answer changes everything after it:

**Something arriving from another skill or from the user names a surface, not a route.** A `/dev-develop` visual gap, a `/dev-check verify` off design report or confirmed departure, feedback from an earlier review, or a user asking for a change: in every case, find that surface's row first, then route on what the row and the files say. Route on the state, never on who asked.

| What you found | This is | Go to |
| --- | --- | --- |
| no `design-registry.md` at all | the first run | step 2 |
| a surface the flows require with no row | an unmapped surface | step 3, for that surface only, then step 4 |
| a row at `MISSING`, with no prototype file | a design that was never built | step 4, for that surface only |
| a row at `READY FOR REVIEW`, and nothing new is being asked | a design already finished and waiting on a person | **step 5**, at its session only entry |
| a row at `READY FOR REVIEW`, and something new is being asked | feedback that arrived after it was finished | step 4a |
| a row at `DRAFT` | an unfinished design, whatever its history | step 4a, which is where the feedback is read |
| a row at `CHANGE REQUIRED` | a revision of an approved design | step 4a |
| a row currently `APPROVED`, and something concrete is being asked | a revision of an approved design | step 4a |
| a row currently `APPROVED`, and nothing concrete is being asked | nothing owed | say so and stop |
| a row at `BASELINE`, and the task recomposes the surface | a surface re entering the lifecycle | step 4, and move the row to `MISSING` first |
| a row at `BASELINE`, and the task does not recompose it | nothing owed | say so and stop |

**A revision is the common case after the first run**, and it is a different job from designing something new: the surface already has a design, somebody has said what is wrong with it, and the approved file has to keep standing until a replacement is approved.

**`design-registry.md` defines what recomposing means**, and it is a change to layout, hierarchy, or interaction rather than to copy, content, or data. Read it before moving a `BASELINE` row anywhere.

**`READY FOR REVIEW` means finished and self critiqued**, so redesigning it would throw away work somebody already did and put the same file in front of a person a run later. It goes to the session. It comes back to step 4a only when there is something new to act on.

**An approved design with no concrete request is not an invitation to improve it.** A run that opens a settled surface, finds nothing wrong that anybody named, and revises it anyway has originated design intent, which is the one thing this skill may not do on its own. **Vague is not concrete**: "have another look at the dashboard" is a question to ask back, not a change to make.

**This routing test reads the row's current value, and only that.** A `DRAFT` is a `DRAFT` whether it has been approved before or never, so both go to step 4a. Splitting that row by history left a real state with no route at all: an approved design revised, sent to review, and returned with Request changes sits at `DRAFT` with an approval in its past, and it is the commonest thing this skill will ever be handed.

**The write target test in step 4a reads the whole history instead, and the two are deliberately different questions.** Should anything be revised is about now. Which file may be written is about whether the canonical file is holding something a person once approved, which a current status cannot tell you.

### Step 2: Settle the design line, on an existing codebase

**Skip this on a fresh project, and on a scaffold `/dev-develop` built, and go straight to step 3.** It applies only when the code was already there when this workflow arrived.

**Read `internal/adoption-baseline.md` and follow it.** It asks one question: do the surfaces that already exist owe prototypes. The default is no.

**It runs before step 3, and that ordering is the point.** Step 3 stamps a status on every surface, so a baseline settled after it has already produced the rows it was meant to prevent.

`/dev-architect` asked the other half of this, about the plan. **Do not re ask it, and do not assume their answer here matches the one they gave there.** They are two decisions.

### Step 3: Map the flows to required surfaces

**Read `internal/design-direction.md` and `internal/design-judgment.md`, and follow both.** The first is the procedure. The second is the designer posture and the rules that hold on every surface.

The rule worth seeing from here, because it is the one most often done shallowly. **Work from the flows, not from the page list.** The Pages section of `project-overview.md` holds the screens somebody thought of. The Core User Flow holds what actually happens, and the surface that gets missed is nearly always a failure branch of a step. A product that mocks its dashboard and forgets the verification screen, the recovery codes, and the wrong code path has designed one surface out of eight.

Write one row per surface into `design-registry.md`, with the flow and step in Required by, the states in Required states, and a status.

### Step 4: Settle the design system, then build

Still `internal/design-direction.md`. Breakpoints, density, dark mode, the states vocabulary, and the contrast and touch target targets, settled once before the first prototype so every surface answers them the same way.

Then the prototypes. **Coverage is the rule, not one file per surface.** Several surfaces may share a file where they are genuinely steps of one thing, and one complicated surface may warrant several. The registry holds the mapping.

**Every prototype renders on its own from the filesystem**, with no install, no build step, no dev server, and no network, and **every state it declares opens from the page address**. That state contract is defined in `design-direction.md` and three skills depend on it.

Then go to step 5. **Step 4a is for a surface that already has a design**, and a first run skips it entirely.

### Step 4a: Revise a surface that already has a design

This is the recurring path, and it runs before any critique or review, because there is nothing to critique until the revision exists. **It covers an unfinished design as much as an approved one**: a row at `DRAFT` that a review sent back is here, and so is one nobody has looked at yet.

**First, find out what is actually being asked.** One of these, and the wording matters because they are different problems:

| Where it came from | What it says |
| --- | --- |
| a `/dev-develop` report | a visual gap, meaning the prototype is silent on a state, an interaction, or a breakpoint the task needs |
| a `/dev-check verify` report | a confirmed departure, usually an accessibility fix, which makes the prototype the thing that is now wrong |
| a `Request changes` or `Reject` on an earlier session | the feedback is in the row's Note column, put there by the last review |
| a `/dev-check verify` off design report | the build and the prototype disagree, and the report says which one it thinks is wrong |
| the user, directly | ask what is wrong with it before touching anything |

**Then move the rows, before the file changes.** Every row lands at `DRAFT`, and how it gets there depends on where it started:

| The row reads | Move it | Because |
| --- | --- | --- |
| `APPROVED` | to `CHANGE REQUIRED` with the reason in its Note, then to `DRAFT` | the lifecycle records that something invalidated an approval, rather than an approval quietly vanishing |
| `READY FOR REVIEW` | to `DRAFT` | it claims finished and self critiqued, and it is about to stop being either |
| `CHANGE REQUIRED` | to `DRAFT`, keeping its Note | something already invalidated it and the Note says what; this is the run that acts on it |
| `DRAFT` | leave it, and keep its Note | it is already saying what it is |

**Editing the file while a row still reads `APPROVED` or `READY FOR REVIEW` means the registry is describing something that no longer exists.** One claims a person approved this file, the other claims it is finished and waiting on them, and both stop being true the moment you edit it.

**Rows, plural, because a prototype may cover more than one surface.** Find every row in `design-registry.md` whose File column names the file you are about to edit, and move all of them together. `design-registry.md`'s own rule is that a shared file is approved once and every row pointing at it moves together, so revising one surface of a shared checkout and leaving its two siblings at `APPROVED` leaves those two claiming a person approved a file that has since changed underneath them.

**Then work from all of those rows, not only the one that was reported.** The revision has to keep satisfying every surface the file covers, and the Required states you carry into the review are the union of theirs. A fix for the payment step that quietly drops the cart's empty state has broken a surface nobody was looking at.

**Then edit the working draft, and work out which file that is from what the canonical file is holding rather than from the row's current status.**

| The canonical file holds | The revision is written to |
| --- | --- |
| a design that was ever approved | `.konteksto/designs/drafts/<slug>.html` |
| a design nobody has ever approved | `.konteksto/designs/<slug>.html` |

**The test is the Status cell's whole history, not its current value.** Stamps are superseded by striking through and appending, never deleted, so **an `APPROVED` stamp anywhere in the cell, struck or not, means the canonical file is holding something a person approved**. A row reading `DRAFT` today may well have read `APPROVED` last week, and the file on disk still holds that approved design until a promotion replaces it. **`.konteksto/designs/drafts/<slug>.html` already existing says the same thing**, and either signal is enough.

**Reading the current status instead is a data loss bug, and it is not a theoretical one.** A surface goes `APPROVED`, then `CHANGE REQUIRED`, then `DRAFT`, and the revision lands in `drafts/`. A person clicks Request changes, and the row stays at `DRAFT`. The next run sees `DRAFT`, concludes there is no approved design to protect, and writes over the canonical file with an unapproved revision. **The last approved design is then gone from the working tree**, recoverable only from git by somebody who noticed.

`internal/design-review.md` defines that draft path and what happens to it on each decision.

**Carry the feedback into the design rather than around it.** A person who asked for a denser table and a clearer error state asked for two things, and a revision that fixes one and quietly drops the other comes back for a second round. Say what you changed, and say plainly if you disagreed with something and did not change it.

**A revision that would need a new dependency, a new component library, or a change to the application structure is not yours to make.** Stop and route to `/dev-architect`, per the ownership section above.

Then go to step 5. A revision earns the same critique and the same review session as a new design, because it is going to be approved by the same standard.

### Step 5: Critique, then run the review session

**Arriving from step 1 with an unchanged `READY FOR REVIEW` row? Skip to the session.** Do not critique it again, do not edit it, and do not rewrite its status. The row already says finished and self critiqued, a previous run did that work, and redoing it would change a file a person is waiting to look at and quietly restart the clock on it. Read `internal/design-review.md` and run the session.

**Everything below is for a design that just changed**, meaning one that arrived from step 4 or step 4a.

**Run the self critique in `design-judgment.md` before showing anything**, and say what it found and what you fixed. A first draft that survives its own critique untouched was not really critiqued.

**Then check the surface is actually reviewable**, which is what `READY FOR REVIEW` claims: every declared state opens from its fragment, every breakpoint is composed, and the file renders on its own.

Set the row to `READY FOR REVIEW`, then **read `internal/design-review.md` and run the session it defines.** It renders the proposal at every breakpoint and every state, collects what the page threw while doing it, puts that evidence and the live prototype in front of a person, and reads back the decision they made.

Three rules worth seeing from here.

**You may never decide an `APPROVED`.** An approval you originated would make every rule that depends on approval depend on nothing.

**The browser you drive and the browser they decide in are different browsers.** You drive the capture pass and nothing else. `design-review.md` defines the wall and says honestly what it is worth.

**You may record the approval they gave**, in their name, from the decision record. The registry's Status values section sets the conditions.

### Step 6: Report

Say all of this:

- Every surface, its status, and its prototype file.
- **Every surface still at `MISSING`**, with the flow that needs it, and that a task cannot be built against it. It does not stop the plan; it stops that one task.
- **The `BASELINE` count separately**, as a count rather than a list, and what it does not mean: not reviewed, not accessible, not approved.
- Every review session run: the surface, who decided, what they decided, and where the row landed. **Say which surfaces were never put in front of anybody**, since a prototype nobody reviewed is not a design anybody agreed to.
- Anything the design needed that `/dev-architect` owns, routed back rather than done.
- That no application code was written.

Then name the next step: `/dev-develop`, on the first task whose surfaces are approved.

---

## Reference files

All of these live in this skill's folder, read only when you reach them.

- `internal/design-direction.md`: taking in supplied designs, the flow to surface audit, settling the system, the state contract, building the prototypes, and the approval ask. Read at step 3.
- `internal/design-judgment.md`: the designer posture, the capabilities, the rules that hold on every surface, and the self critique. **Read with `design-direction.md` at step 3.**
- `internal/design-review.md`: the review session. The two browser contexts and the wall between them, the session workspace, the capture pass, the decision record, and the checks that bind an approval to one revision. Read at step 5.
- `internal/adoption-baseline.md`: the one question that decides whether surfaces that already exist owe prototypes. Read at step 2, existing codebases only, and before step 3.
- `review-harness/`: the preflight probe, the session server, the capture pass, and the review page. **They run in place, out of this folder, and nothing is copied anywhere.** Its `README.md` documents the interfaces, including how a session is stopped without signalling a process. **Never regenerate these files**, and never edit one for a single session.
