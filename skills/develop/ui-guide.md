# /develop: UI track guide

The UI build track. Read this once `flow/build.md` classifies a task as UI: components, pages, or layouts. Any web stack.

Read the bar below before building anything.

## The bar, which is the definition of done

You are a senior product designer shipping a real product, not a developer wiring up a form. Every page leaves this skill as a complete, professional surface. Never a bare minimum stub.

This is committed here, at the top, before the token and accessibility rules, precisely so it cannot get crowded out by them.

**Design first, then integrate.** The same model produces a beautiful interface in a chat window and a plain one inside a codebase, because in a codebase it tries to satisfy tokens, conventions, and accessibility before it has designed anything at all, and the ambition dies there. Build in two passes:

1. **Design the surface.** Bold, complete, opinionated, composed as a whole page, as though you were shipping it on its own.
2. **Integrate it.** The installed styling library, the real tokens, semantic markup, accessibility, responsive behavior.

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

This workflow keeps its visual decisions in two places, and neither is a separate design document:

1. **`code-standards.md`**, the Component Structure section, which fixes the internal ordering of a component, and the token discipline the project expects.
2. **`ui-registry.md`**, the inventory of components that already exist, with their props and a usage example.

**Read `ui-registry.md` before building any component.** Extending what is there beats building a near duplicate, and a near duplicate is a review finding. Register anything new the moment you build it.

When the task gives you a screenshot or an image to work from, match it faithfully and do not embellish beyond it. Derive the responsive and accessible behavior a single image cannot show.

When nothing visual is given at all, design to the bar above, consistently with whatever is already shipped in `app/`.

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

Match all four. A component that introduces a second styling approach is a new pattern, and a new pattern is a decision that belongs to `/architect`.

### Phase 2: Compose the whole surface

Lay out the entire page before refining any part of it: the regions, the hierarchy, the real copy, the supporting content. Work top down.

A page assembled from the inside out, one widget at a time, is how you end up with a control floating in a dead zone.

### Phase 3: Build to the structure

Follow the Component Structure section of `code-standards.md` exactly: the import order, where types go, and how the body is arranged.

- Reuse a registered component wherever one fits.
- Build every state the surface needs: populated, empty, loading, and error. **All four, not just the populated one.** The other three are where products feel unfinished.
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

### Phase 7: Look at it

Render the page and check it against the disqualifier list at the top of this guide, and against every state you built. Fix what you see.

Say in your report what you audited and what you fixed.

## Report

```
## /develop complete (UI)

**Task**: <number and name from build-plan.md>
**Built**: <pages and components, with paths>
**Registered**: <components added to ui-registry.md> | none
**Reused**: <existing registered components used> | none
**States**: populated, empty, loading, error, all built | <which are missing and why>
**Data**: <real source bound> | <placeholder, deferred by the plan, wired in task N>
**Accessibility**: <checklist.md worked through, anything outstanding>
**Audited**: <what you rendered and looked at, and what you fixed as a result> | <not rendered, and why>
**For /check verify**: <the flow steps this surface should now satisfy>
```
