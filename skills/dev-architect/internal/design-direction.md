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

**Every prototype reads `.konteksto/designs/shared/tokens.css`, on every project**, and never hardcodes a value. That holds whether or not real code exists, because a prototype has to render on its own and a production config is often a `tailwind.config.js` or a `theme.ts` that a plain HTML file cannot read at all.

**What changes between projects is which file is authoritative, not which file the prototypes read.**

- **Greenfield.** Nothing else exists, so `shared/tokens.css` is where you write the starting values, and it is the authority until real code appears.
- **An existing styling config.** That config is the authority. Generate `shared/tokens.css` from it, mark it derived, and change no value in it.

**Fill in `design.md`'s Production source line now, even on a greenfield project**, using the path the folder structure in `architecture.md` implies, marked as not created yet. `/dev-develop` writes that file on the first UI task and the pointer is already correct, so nothing needs repointing afterwards. **Do not leave it to be updated later**, because this skill may not run again at that moment and a pointer waiting on a future session is a pointer that stays wrong.

**The mirror is derived, never authored, once production exists.** A value is changed in the production source and the mirror is regenerated, the way a lockfile is regenerated rather than hand corrected. Both files existing is normal and expected; two files deciding is what must never happen.

## Step 5: Build the prototypes

**What matters is coverage, not file count: every surface in the registry maps to a prototype.** Usually one file per surface, at `.konteksto/designs/<slug>.html`. Several surfaces may share one file where they are genuinely steps of one thing, for example a checkout whose cart, shipping, payment, and confirmation read better as one interactive sequence, and one complicated surface may warrant several files. The registry holds the mapping either way.

**Never one large file for the whole application**, which becomes unreadable by the fifth screen and unreviewable by the tenth.

**Surfaces sharing a file are approved together and go stale together.** Where you want them to move through the lifecycle independently, give them separate files. The registry template's Surface, state, and interaction section has the rest of the distinction, including why a loading state is not its own surface.

**Each file is independently renderable, with no application infrastructure at all.** No install, no build step, no dev server for the product, and no network. Inline the CSS and JavaScript, or link only to `shared/`. **Never link a prototype at anything under `app/`**, including the production styling config, since that reintroduces the dependency this rule exists to prevent and often points at a file a browser cannot read anyway. Two reasons, and the second is the one people forget: a prototype that depends on a CDN is a blank page the day that CDN moves, and these files sit in version control for years. And a prototype needing the app to run cannot be reviewed before the app exists, which is exactly when it needs reviewing.

**Record the preview command in `tooling.md`**, under Previewing a prototype, along with the visual verification tool `/dev-check` will use. Settle both here rather than when the first verify blocks on having no way to take a screenshot.

**Interactive means every interaction the flow actually names is demonstrated.** Buttons that do something, navigation that navigates, forms that validate, menus that open, modals that appear, destructive actions that confirm, and every state reachable rather than described. The point is that a still image cannot answer what happens when you click, and half the disagreements about a design are about exactly that.

**Use fixture data and simulated behavior.** Local state, hardcoded rows, a timeout standing in for a request. **Never build a real backend, a real API call, a real database, or real authentication to make a prototype interactive.** That is production code, it is forbidden here, and it is `/dev-develop`'s work.

**Every breakpoint in `design.md`, deliberately composed.** Three is the usual answer and the default, meaning desktop, tablet, and phone, and a product that genuinely needs two or four says so there instead of fighting this rule. Desktop uses the space rather than centring a narrow column in it. Tablet reconsiders the grid and the navigation. The phone is a separate composition: what is prioritized, what the navigation becomes, what happens to a dense table, and whether something becomes a sheet or a drawer.

**Later surfaces inherit the approved system.** Once one surface is approved, its colours, type, spacing, components, and structure are the system, and every later prototype adopts them. A departure is a proposal to the user with its reason, never a quiet change.

## Step 6: Critique, then ask for approval

**Run the self critique in `design-judgment.md` before showing anything**, and say what it found and what you fixed. A first draft that survives its own critique untouched was not really critiqued.

Then present the surface and set its row to `READY FOR REVIEW`.

**You may never decide an `APPROVED`.** Present the prototype, say what to look at, and ask. An approval you originated would make every rule that depends on approval depend on nothing.

**You may record an approval they gave.** Once they say yes to that specific prototype, write the row in their name rather than sending them off to edit markdown, which is ceremony rather than safety. Three conditions, all required and all in the registry template: the yes is explicit and about this artifact, a vague yes does not count, and the name is theirs rather than one read from `git config`.

**A vague yes gets a concrete question, not a recorded approval.** "Looks good" and "whatever you think" are the same signal `/dev-scope`'s interview refuses, and for the same reason: they usually mean somebody skimmed. Ask about the specific thing you want blessed.

Where the user asks for changes, revise and present again.

## Step 7: Record it

`design.md` gets the system: character, mandate, composition patterns, component rules, states, breakpoints, accessibility targets, and the Source section naming where each direction came from.

`design-registry.md` gets a row per surface, stamped.

**Report every surface still at `MISSING`**, with the flow that needs it, and say plainly that a task cannot be built against a surface with no approved design. It does not stop the plan being written, and it does stop that one task.
