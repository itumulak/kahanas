# Architect: the design direction

Read this at step 3, and only when the project has an `app/`. Skip it entirely for a backend with no frontend, in which case `design.md`, `design-registry.md`, and the `designs/` folder are all skipped too.

**Read `design-judgment.md` alongside it.** That file is the posture and the rules. This one is the procedure.

The client framework is now known, which matters, because a starter template is framework specific and a prototype should not fight the thing that will implement it.

---

## What this step produces

Three artifacts, and they hold different things.

| Artifact | Holds | Governs |
| --- | --- | --- |
| `design.md` | the design system: character, tokens, states vocabulary, breakpoints, component rules | every prototype and every built page |
| `design-registry.md` | one row per required surface, with its design status | what may be built |
| `.konteksto/designs/*.html` | how one surface looks and behaves | how that surface is implemented |

**The precedence, when two of them disagree.** `project-overview.md` decides product behavior and always wins. `design.md` governs the prototypes. An approved prototype governs the implementation of its surface.

**A prototype may never silently override a flow.** Where an approved prototype contradicts `project-overview.md`, stop and reconcile it before anything is built, because one of the two is wrong and building either way bakes in the wrong one.

---

## Step 1: Find out what already exists

> "Do you have designs for this, or should I produce them?"

1. **Designs exist.** Ask what form: images or screenshots, a Figma file, static HTML, or a live site. Ask where they are. Go to step 2.
2. **Nothing exists, produce them** (recommended when nothing exists): go to step 3.
3. **A starter template instead.** Recommend two or three real, free, actively maintained templates for the framework already chosen. **Fetch each one's page before proposing it**, since template galleries change constantly and a dead link wastes the user's time. Say each one's name, link, license, what product it suits, and what bending it to this product would cost. A template settles a starting point, not the surfaces: you still produce prototypes from it, and steps 3 onward still apply.

Check any template against the pages in `project-overview.md`, its license, and whether it is maintained. An abandoned template carries abandoned dependencies into the audit in step 4 on day one.

## Step 2: Take in what was provided, and never overwrite it

**Copy every artifact the user supplied into `.konteksto/designs/sources/`, unchanged.** An image, an export, a static HTML file. That folder is theirs, it is read only to every skill forever, and nothing in it is ever edited or replaced.

**This matters more than it looks.** The supplied artifact is the only thing in the project the user actually authored, and a refactor in place destroys the one reference that could settle a later disagreement about what they asked for.

Then produce the working prototype beside it, derived from the source:

```
.konteksto/designs/
├── sources/
│   └── dashboard-supplied.png
└── dashboard.html
```

- **An image or screenshot** becomes an HTML equivalent that faithfully represents it, plus everything a still picture cannot carry: the states, the interactions, and the two layouts it does not show.
- **Static HTML** becomes an interactive prototype derived from it. The original stays in `sources/`.
- **A live site** is recorded in `design.md`'s Source section and treated as a reference, not copied.

**Faithful does not mean uncritical.** Report every usability, accessibility, responsive, state, and flow gap you find in what was supplied. A supplied design is a starting point, and the user handed it over to be built on rather than admired.

**When a supplied design conflicts with an already approved system**, for example a screenshot in a different palette, **stop and ask.** Matching the image and adopting the established system are both rules here and they point opposite ways, and which one gives is the user's call, not yours.

## Step 3: Map the flows to required surfaces

The completeness audit, and the reason this step exists at all.

**Work from the flows, not from the page list.** `project-overview.md`'s Pages section holds the screens somebody thought of. Its Core User Flow section holds what actually happens, step by step, including the parts nobody pictures. The surface that gets missed is almost never a page in the list; it is a step in a flow, and most often a failure branch of one.

For every flow, enumerate every surface it requires:

- the screens it names
- every failure branch, meaning what a person sees when the step does not work
- every confirmation or destructive step
- every recovery path

Then write one row per surface into `design-registry.md`, with the flow and step in the Required by column, the states that surface needs in the Required states column, and a status of `MISSING` where nothing exists.

**On a codebase that was already shipped, step 2a settled which of those rows are `MISSING` and which are `BASELINE`.** Apply that answer here, and write its one line note above the Entries table, using the wording `internal/adoption-baseline.md` gives for the option the user picked. **Map every surface either way**, since that file's Still map the flows to surfaces rule holds whatever the answer was. The registry's Status values section defines what `BASELINE` means and what puts a surface back into the lifecycle.

**States do not get their own rows.** An orders page that is loading, empty, populated, or failing is one surface with four states, and listing them in the Required states column keeps completeness strong without turning a six entity product into eighty rows. Read the Surface, state, and interaction section of the registry template before the first row: the test is whether a designer would compose it from scratch, or whether it is the same composition holding different content.

**A worked example, because this is the part most often done shallowly.** A product adding two factor authentication has a mockup for the dashboard and nothing else. The flow says: the user opens security settings, enables two factor, scans a code, enters a verification code, and saves recovery codes. That is five surfaces, and the failure branches add more: a wrong verification code, a lost authenticator, and turning it off again. Seven of eight surfaces were missing, and the one that existed was the one nobody needed designed.

**Report the audit as a list of surfaces with their status.** Naming the flow each one belongs to is what makes it checkable rather than a claim.

## Step 4: Settle the design system before the first surface

Only the parts a prototype cannot invent per screen. Ask in one round of up to four questions, and **anchor every one to a real flow** rather than asking in the abstract.

- **Breakpoints.** The exact widths, and how many. Three is the default and the usual answer, meaning desktop, tablet, and phone, and a product genuinely needing two or four says so here so every later rule follows this list rather than a fixed number. **Settle them before the first prototype**, since the prototype and the eventual code must use the same values or nothing built can match anything designed.
- **Density.** Roomy or compact. A flow about scanning many rows wants a different answer from one about reading.
- **Dark mode.** Whether it exists at all. Deciding later means revisiting every colour.
- **The states vocabulary.** What empty, loading, and error mean in this product, settled once so every surface handles them the same way.
- **Contrast and touch target targets.** A number, not an intention.

Record the answers in `design.md`. **Every answer must be consistent with a flow in `project-overview.md`**, and where one contradicts a flow, say so and settle it now, because one of the two is wrong.

### Where the tokens live before there is any code

**`design.md`'s Where the tokens live section defines this.** Read it and follow it. In short: every prototype reads `.konteksto/designs/shared/tokens.css` on every project, and which file is authoritative depends on whether the production config exists yet.

What it needs from you at this step: write the starting values into the mirror on a greenfield project, generate the mirror from the real config on a project that has one, and **fill in the Production source line either way**, so nothing needs repointing later.

## Step 5: Build the prototypes

**What matters is coverage, not file count: every surface in the registry maps to a prototype.** Usually one file per surface, at `.konteksto/designs/<slug>.html`. Several surfaces may share one file where they are genuinely steps of one thing, for example a checkout whose cart, shipping, payment, and confirmation read better as one interactive sequence, and one complicated surface may warrant several files. The registry holds the mapping either way.

**Never one large file for the whole application**, which becomes unreadable by the fifth screen and unreviewable by the tenth.

**Surfaces sharing a file are approved together and go stale together.** Where you want them to move through the lifecycle independently, give them separate files. The registry template's Surface, state, and interaction section has the rest of the distinction, including why a loading state is not its own surface.

**Revising a surface that is already approved writes to `.konteksto/designs/drafts/<slug>.html`, not to the canonical path.** The canonical file has to keep holding the last approved design until a person approves the replacement, since it is what `/dev-develop` is building against in the meantime and what the review compares the revision to. `internal/design-review.md` defines that path and what happens to it on each decision. A brand new surface has no approved design to protect, so it drafts at the canonical path as usual.

**Each file is independently renderable, with no application infrastructure at all.** No install, no build step, no dev server for the product, and no network. Inline the CSS and JavaScript, or link only to `shared/`. **Never link a prototype at anything under `app/`**, including the production styling config, since that reintroduces the dependency this rule exists to prevent and often points at a file a browser cannot read anyway. Two reasons, and the second is the one people forget: a prototype that depends on a CDN is a blank page the day that CDN moves, and these files sit in version control for years. And a prototype needing the app to run cannot be reviewed before the app exists, which is exactly when it needs reviewing.

**Read the Visual verification section of `tooling.md`**, which names the tool, the browser, and the commands a review runs with. **You do not write it**: `tooling.md` is `/dev-architect`'s and it makes every tool call in this workflow. Where it is missing or empty on a project with an `app/`, stop and route back rather than installing anything yourself, since step 6 cannot run a review without it.

**Interactive means every interaction the flow actually names is demonstrated.** Buttons that do something, navigation that navigates, forms that validate, menus that open, modals that appear, destructive actions that confirm, and every state reachable rather than described. The point is that a still image cannot answer what happens when you click, and half the disagreements about a design are about exactly that.

### Every state is reachable from outside the prototype

**This is the state contract, and it is defined here and nowhere else.** The review session in step 6 activates every state in the surface's Required states cell and screenshots each one at each breakpoint, and `/dev-check verify` reaches the same states later. Neither can do it if the only way into the error state is to know which button to click in which order.

**Each prototype exposes every one of its required states through the page address**, as a fragment naming the state exactly as the registry spells it:

```
account-recovery.html#state=invalid-code
```

Opening that address puts the surface in that state directly, on load, with no click path. The state names come from the Required states cell, lowercased with spaces as hyphens, so `invalid code` becomes `invalid-code` and nothing has to be looked up anywhere.

**The controls stay too.** A person reviewing this file should still be able to click through the flow the way a user would, and the fragment is an additional way in rather than a replacement for the design. A prototype whose states are only reachable by fragment has stopped demonstrating its own interactions.

**The address is the contract because it survives everything else.** A prototype opened from the filesystem, served by the review session, or loaded by `/dev-check verify` a month later all read the same fragment, and none of them needs a global object, a build step, or an agreement about a function name that a later prototype spells differently.

**Use fixture data and simulated behavior.** Local state, hardcoded rows, a timeout standing in for a request. **Never build a real backend, a real API call, a real database, or real authentication to make a prototype interactive.** That is production code, it is forbidden here, and it is `/dev-develop`'s work.

**Every breakpoint in `design.md`, deliberately composed.** Three is the usual answer and the default, meaning desktop, tablet, and phone, and a product that genuinely needs two or four says so there instead of fighting this rule. Desktop uses the space rather than centring a narrow column in it. Tablet reconsiders the grid and the navigation. The phone is a separate composition: what is prioritized, what the navigation becomes, what happens to a dense table, and whether something becomes a sheet or a drawer.

**Later surfaces inherit the approved system.** Once one surface is approved, its colours, type, spacing, components, and structure are the system, and every later prototype adopts them. A departure is a proposal to the user with its reason, never a quiet change.

## Step 6: Critique, then run the review session

**Run the self critique in `design-judgment.md` before showing anything**, and say what it found and what you fixed. A first draft that survives its own critique untouched was not really critiqued.

**Then check the surface is actually reviewable**, which is what the row moving to `READY FOR REVIEW` claims. Every state in its Required states cell opens from its fragment, every breakpoint in `design.md` is composed, and the file renders on its own from the filesystem. A state the registry claims and the prototype cannot reach is a defect to fix now, not a note to hand to a reviewer.

Set the row to `READY FOR REVIEW`, then **read `internal/design-review.md` and run the session it defines.** It renders the proposal at every breakpoint and every state, collects what the page threw while doing it, puts that evidence and the live prototype in front of a person, and reads back the decision they made.

The three rules worth seeing from here, since they are what make the session mean anything.

**You may never decide an `APPROVED`.** An approval you originated would make every rule that depends on approval depend on nothing.

**The browser you drive and the browser they decide in are different browsers.** You drive the capture pass and nothing else. You never open the review page, click a decision, or reach the endpoint behind one. `design-review.md` defines the wall and says honestly what it is worth.

**You may record the approval they gave**, in their name, from the decision record. The registry template's Status values section sets the conditions first, including the two that only apply to a session. Follow it exactly.

On Request changes or Reject, the feedback goes in the row's Note column and the surface comes back here for another revision and another session.

## Step 7: Record it

`design.md` gets the system: character, mandate, composition patterns, component rules, states, breakpoints, accessibility targets, and the Source section naming where each direction came from.

`design-registry.md` gets a row per surface, stamped.

**Report every surface still at `MISSING`**, with the flow that needs it, and say plainly that a task cannot be built against a surface with no approved design. It does not stop the plan being written, and it does stop that one task.

**Report the `BASELINE` count separately**, as a count rather than a list, and say what it does not mean: not reviewed, not accessible, not approved. Folding baseline rows into the missing list overstates the work owed, and folding them into the approved list understates what nobody has ever looked at.
