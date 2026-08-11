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
- every state that step reaches: empty, loading, error, success
- every failure branch, meaning what a person sees when the step does not work
- every confirmation or destructive step
- every recovery path

Then write one row per surface into `design-registry.md`, with the flow and step in the Required by column, and a status of `MISSING` where nothing exists.

**A worked example, because this is the part most often done shallowly.** A product adding two factor authentication has a mockup for the dashboard and nothing else. The flow says: the user opens security settings, enables two factor, scans a code, enters a verification code, and saves recovery codes. That is five surfaces, and the failure branches add more: a wrong verification code, a lost authenticator, and turning it off again. Seven of eight surfaces were missing, and the one that existed was the one nobody needed designed.

**Report the audit as a list of surfaces with their status.** Naming the flow each one belongs to is what makes it checkable rather than a claim.

## Step 4: Settle the design system before the first surface

Only the parts a prototype cannot invent per screen. Ask in one round of up to four questions, and **anchor every one to a real flow** rather than asking in the abstract.

- **Breakpoints.** The exact widths for desktop, tablet, and phone. **Settle these before the first prototype**, since the prototype and the eventual code must use the same numbers or nothing built can match anything designed.
- **Density.** Roomy or compact. A flow about scanning many rows wants a different answer from one about reading.
- **Dark mode.** Whether it exists at all. Deciding later means revisiting every colour.
- **The states vocabulary.** What empty, loading, and error mean in this product, settled once so every surface handles them the same way.
- **Contrast and touch target targets.** A number, not an intention.

Record the answers in `design.md`. **Every answer must be consistent with a flow in `project-overview.md`**, and where one contradicts a flow, say so and settle it now, because one of the two is wrong.

### Where the tokens live before there is any code

On a greenfield project there is no styling config yet, so `.konteksto/designs/shared/tokens.css` is the token source, and every prototype uses it rather than hardcoding a value.

**That is a handover, not a second home.** `/dev-develop` derives the project's real styling config from it on the first UI task, and from that moment `design.md` points at the real one and the prototype file is history. Say this plainly in `design.md`'s Where the tokens live table, because two live copies of a colour drift and the copy in the older file is always the one that goes stale.

On a project that already has a styling config, there is no `shared/tokens.css` at all. The prototypes read the real one.

## Step 5: Build the prototypes

One file per surface, at `.konteksto/designs/<slug>.html`. **Never one large file for the whole application**, which becomes unreadable by the fifth screen and unreviewable by the tenth.

**Each file is self contained and needs no build step and no network.** Inline the CSS and JavaScript, or link only to `shared/`. A prototype that depends on a CDN is a blank page the day that CDN moves, and these files sit in version control for years.

**Interactive means every interaction the flow actually names is demonstrated.** Buttons that do something, navigation that navigates, forms that validate, menus that open, modals that appear, destructive actions that confirm, and every state reachable rather than described. The point is that a still image cannot answer what happens when you click, and half the disagreements about a design are about exactly that.

**Use fixture data and simulated behavior.** Local state, hardcoded rows, a timeout standing in for a request. **Never build a real backend, a real API call, a real database, or real authentication to make a prototype interactive.** That is production code, it is forbidden here, and it is `/dev-develop`'s work.

**All three layouts, deliberately composed.** Desktop uses the space rather than centring a narrow column in it. Tablet reconsiders the grid and the navigation. The phone is a separate composition: what is prioritized, what the navigation becomes, what happens to a dense table, and whether something becomes a sheet or a drawer.

**Later surfaces inherit the approved system.** Once one surface is approved, its colours, type, spacing, components, and structure are the system, and every later prototype adopts them. A departure is a proposal to the user with its reason, never a quiet change.

## Step 6: Critique, then ask for approval

**Run the self critique in `design-judgment.md` before showing anything**, and say what it found and what you fixed. A first draft that survives its own critique untouched was not really critiqued.

Then present the surface and set its row to `READY FOR REVIEW`.

**You may never write `APPROVED`.** Only a person does, by hand, and the registry says so from its own side too. Present the prototype, say what to look at, and ask. An approval you wrote yourself would make every rule that depends on approval depend on nothing.

Where the user asks for changes, revise and present again. Where they accept, they write the row.

## Step 7: Record it

`design.md` gets the system: character, mandate, composition patterns, component rules, states, breakpoints, accessibility targets, and the Source section naming where each direction came from.

`design-registry.md` gets a row per surface, stamped.

**Report every surface still at `MISSING`**, with the flow that needs it, and say plainly that a task cannot be built against a surface with no approved design. It does not stop the plan being written, and it does stop that one task.
