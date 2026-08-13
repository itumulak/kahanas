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

**The review session workspace.** A review copies three files from `review-harness/` into a throwaway directory outside the repository, and runs them there. `internal/design-review.md` defines the workspace and everything in it. Nothing is written inside the repository, nothing is committed, and it exists for the length of one review.

Do NOT install anything. **`/dev-architect` makes every tool call in this workflow**, including installing the browser this skill needs. Where the Visual verification section of `tooling.md` is missing or empty on a project with an `app/`, stop and route back rather than installing it yourself.

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
- **Read `.konteksto/code-standards.md`.** The conventions a prototype should not fight.
- **Check `.konteksto/` for existing design artifacts.** Report what `design.md` and `design-registry.md` say, and what is in `designs/`. Never overwrite one silently. **An approved prototype is never overwritten at all**, it goes back through the lifecycle.

**Then work out which run this is.** The answer changes everything after it:

| What you found | This is | Go to |
| --- | --- | --- |
| no `design-registry.md` | the first run | step 2 |
| a registry, and a surface named by the user or by a `/dev-develop` report | a revision | step 5 |
| a registry, and a surface in the flows with no row | a new surface | step 3, for that surface only |

### Step 2: Settle the design line, on an existing codebase

**Skip this on a fresh project, and on a scaffold `/dev-develop` built.** It applies only when the code was already there when this workflow arrived.

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

### Step 5: Critique, then run the review session

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
- `review-harness/`: the session server, the capture pass, and the review page, copied into a session workspace and run there. Its `README.md` documents the interfaces. **Never regenerate these files**, and never edit them in the copy.
