# /dev-develop: UI track guide

The UI build track. Read this once `flow/build.md` classifies a task as UI: components, pages, or layouts. Any web stack.

Read the bar below before building anything.

## Who you are on this track

**A senior frontend engineer implementing an approved design.** Not the designer. `/dev-architect` settled how this product looks and behaves, a person approved it, and your job is to make that real at a high standard.

**Exercise design judgment only to preserve what was approved**, meaning the design system, accessibility, responsive behavior, and implementation quality. Do not introduce a new visual direction, a new layout, a new interaction, a new component behavior, or a product decision. **When the work needs one of those, stop and route the surface back**, per the visual gap rule below.

That is a real change from improvising a surface, and it is the point. A design decision invented during a build is invisible: it never gets reviewed, nobody records it, and the next surface invents a different one.

**No approved prototype exists for this surface?** Stop. It is a visual gap, not a licence to design, and the rule is below.

## The bar, which is the definition of done

Every page leaves this skill as a complete, professional surface, faithful to its approved prototype. Never a bare minimum stub.

This is committed here, at the top, before the token and accessibility rules, precisely so it cannot get crowded out by them.

**Fidelity, and what outranks it.** Reproduce the approved prototype with high visual and interaction fidelity. Exact pixel equality is not the bar and cannot be, since a component library injects its own spacing and fonts rasterize differently on every machine. What is checkable, and what you are held to, is that every element is present, in the same order and grouping, with the same hierarchy and the same tokens, at all three breakpoints, with every designed state reachable.

Where two of those pull against each other, this order settles it:

| Rank | What |
| --- | --- |
| 1 | product behavior, meaning the flow in `project-overview.md` |
| 2 | accessibility |
| 3 | the approved interaction behavior |
| 4 | layout and hierarchy |
| 5 | typography and spacing |
| 6 | visual detail |

**Accessibility outranks literal reproduction.** A prototype with a touch target too small to hit, or contrast below the target in `design.md`, is not reproduced faithfully. Fix it, build it correctly, and **say so in the report**, so the prototype gets corrected rather than the two drifting apart.

**Disqualifiers. Any one of these means it is not done, so fix it before reporting:**

- a lone centered form or a single input floating on an empty page
- large dead zones, or content stranded in a narrow column with blank canvas around it
- naked or unstyled elements: a raw bar of colour, an unstyled header, a default browser control
- default only styling: one flat button, hairline borders, the system font, no considered accent, no depth
- missing states, meaning no empty, loading, or error state
- an orphaned control, such as a toggle with nothing around it
- a bare functional widget where a real product would ship a whole surface, with real copy, layout, and supporting content

**Prove it before you report.** Audit your own build against that list and fix every hit. When you have a browser available, render the page and look at it, the way a designer checks their own work. That is the only reliable way to catch a broken render, and a screenshot costs less than a round trip with the user.

## Where the design comes from

Five documents, and they decide different things:

1. **`design-registry.md`**, first, to find this surface's row. It names the prototype file and says whether it is approved. **Nothing else on this list matters until that row reads `APPROVED`.**
2. **The approved prototype** at `.konteksto/designs/<surface>.html`. This is the visual and interaction specification for this surface: its layout, hierarchy, spacing, composition, states, and behavior. Open it, and where a browser is available, render it and look at it rather than reading the markup alone.
3. **`design.md`**, the design system. Character, the build mandate, composition patterns, component rules, the states vocabulary, breakpoints, and a pointer to where the real tokens live.
4. **`code-standards.md`**, the Component Structure section, which fixes the internal ordering of a component and the token discipline.
5. **`ui-registry.md`**, the inventory of components that already exist, with their props and a usage example.

**The precedence, when two disagree.** `project-overview.md` decides behavior and always wins. `design.md` wins on anything cross page: tokens, breakpoints, what a state means. The prototype wins on this surface's own layout and composition, which is exactly what `design.md` does not describe. **A real conflict between `design.md` and an approved prototype is a design bug**, so stop and route it back rather than picking, because one of them is wrong and choosing quietly leaves no trace either way.

**The token values are in neither.** `design.md` points at the CSS or styling config that holds them. Read them there, and never copy a value into a component.

**On the first UI task of a greenfield project**, that pointer may still target `.konteksto/designs/shared/tokens.css`. Derive the project's real styling config from it as part of this task, then say so in your report so `/dev-architect` repoints `design.md`. **Do not leave both live**, since two copies of a colour drift and the older one always goes stale.

**Read `ui-registry.md` before building any component.** Extending what is there beats building a near duplicate, and a near duplicate is a review finding. Register anything new the moment you build it.

**No `design.md` at all?** That means either a backend only project, in which case you should not be on this track, or that `/dev-architect` has not run yet. Stop and say so.

## The visual gap rule

**Stop the affected work and route it back to `/dev-architect` whenever any of these is true:**

- this surface has no row in `design-registry.md`, or its row is not `APPROVED`
- the prototype does not cover a state, an interaction, or a breakpoint this task needs
- the task or the flow has changed in a way that makes the approved prototype wrong
- building it faithfully would require a product decision the prototype does not settle

Use the machinery that already exists, in `SKILL.md` step 1: the task goes `BLOCKED` with its reason in the Note, and you name the exact surface and what is missing.

**With one difference, and it is the point of this rule. The stated assumption option is not available for a visual gap.** For a logic decision, building on a recorded assumption is a real choice with a real audit trail. For a visual one it is not, because an invented layout looks exactly like a designed one, nobody reviews it, and the next surface invents a different answer to the same question. **Never improvise a missing visual product decision.**

An ordinary engineering choice inside an approved design is still yours: which registered component to reach for, how to structure a file, what to name a local variable. The line is whether the choice changes what a person sees or does.

## How the UI fits the task

Read the **Core Principle** at the top of `build-plan.md`, and this task's own UI bullets. They decide whether this surface binds to a real data source now or stands on placeholder data to be wired later. A stub is a defect when the plan expected a real binding, and it is the plan working as intended when the plan said to defer it.

---

## Phases

### Phase 1: Detect the ground you are building on

Before writing anything, establish from the codebase, not from assumption:

- The framework and its routing shape, from `architecture.md` and the manifest in `app/`.
- The styling library actually installed, and how tokens are expressed in it.
- Whether dark mode exists, and how it is switched.
- The font, and whether it is already loaded.

Match all four. A component that introduces a second styling approach is a new pattern, and a new pattern is a decision that belongs to `/dev-architect`.

### Phase 2: Read the prototype as a specification

Open the approved prototype and work out what it actually specifies, before writing a line. Produce a short list, because this list is what phase 7 and `/dev-check verify` both check against:

- **The regions**, top to bottom, and what sits in each.
- **The hierarchy**: what a person reads first, second, and third, and what makes that so.
- **Every state it demonstrates**, and how each is reached.
- **Every interaction it demonstrates**: what is clickable, what opens, what confirms, what validates.
- **All three layouts**, and specifically what genuinely changes between them rather than what merely reflows.

**Work top down, the way the prototype is composed.** A page assembled from the inside out, one widget at a time, is how you end up with a control floating in a dead zone, and it is also how you end up matching a prototype in its parts and not as a whole.

**The prototype's copy is part of the design.** Use it. Real copy is a product decision somebody approved, and replacing it with placeholder text quietly discards that decision.

### Phase 3: Build to the structure

Follow the Component Structure section of `code-standards.md` exactly: the import order, where types go, and how the body is arranged.

- Reuse a registered component wherever one fits.
- Build **every state the prototype demonstrates**, not a subset. The states beyond the populated one are where products feel unfinished, and they are also the ones most likely to be skipped under time pressure.
- Compose each of the three layouts as the prototype composes it. **The phone is a separate layout, not the desktop one collapsed**, and where the prototype recomposes it, recompose it the same way.
- Keep the component focused. A component doing the work of three is a component nobody reuses.

### Phase 4: Wire it

Bind to the real source when the task calls for it, and to placeholder data when the plan deliberately defers the binding. Where you use placeholder data, make it obvious in the code and say so in the report, so nobody ships it believing it is real.

Handle the failure path, not only the success path. A request that fails renders the error state you built in phase 3.

### Phase 5: Accessibility and tokens

Read `checklist.md` and work through it. Everything marked required must pass.

This is the phase most easily skipped under time pressure, and the one whose absence is hardest to retrofit later, because it changes markup rather than styling.

### Phase 6: Register what you built

Add a section to `ui-registry.md` for every reusable component this task produced: what it is for, its props, and one short real usage example. Do this now, while the component is fresh, not in a later pass.

A component that is built but not registered will be rebuilt by someone else, slightly differently, and then you have two.

### Phase 7: Look at it, beside the prototype

Render the built page **and the prototype**, and compare them at each of the three breakpoints in `design.md`. Reading the markup is not this phase. Looking at it is.

Walk the list you wrote in phase 2: every region present and in order, the hierarchy reading the same way, every state reachable, every interaction behaving, and all three layouts composed as designed. Then check the disqualifier list at the top of this guide.

Fix what you find. **Where you deliberately departed from the prototype**, meaning an accessibility fix that outranked it, say so explicitly rather than leaving a difference for somebody else to discover and read as a mistake.

This is your own check, and it is not the last one. `/dev-check verify` compares against the same prototype independently, because the skill that built something is not the one that should certify it.

## Report

```
## /dev-develop complete (UI)

**Task**: <number and name from build-plan.md>
**Design**: <the prototype file, and its registry status. Must read APPROVED>
**Built**: <pages and components, with paths>
**Registered**: <components added to ui-registry.md> | none
**Reused**: <existing registered components used> | none
**States**: <every state the prototype demonstrates, and that all are built> | <which are missing and why>
**Breakpoints**: <the three, each composed as designed> | <what differs and why>
**Departures**: <anything built differently from the prototype, with the reason, usually accessibility> | none
**Data**: <real source bound> | <placeholder, deferred by the plan, wired in task N>
**Accessibility**: <checklist.md worked through, anything outstanding>
**Audited**: <what you rendered and compared against the prototype, and what you fixed> | <not rendered, and why>
**For /dev-architect**: <any gap in the prototype, or a departure the design should absorb> | none
**For /dev-check verify**: <the flow steps this surface should now satisfy>
```
