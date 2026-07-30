# Architect: the design direction

Read this at step 3, and only when the project has an `app/`. Skip it entirely for a backend with no frontend, in which case `design.md` is not written at all.

---

**Skip this whole step when there is no `app/`**, meaning Project Shape said backend only. A backend has no art direction, and `design.md` is not written at all.

The client framework is now known, which matters, because a starter template is framework specific.

#### Ask whether a design already exists

> "Do you have a design ready for this, or should I recommend a starting point?"

1. **I have a design**: a mockup, a Figma file, a screenshot, or a live site to match. Ask which, and where it is. Record what it is in `design.md`'s Source section, then go to the follow up questions below to fill the parts a static picture cannot answer.
2. **Recommend a starting point** (recommended when nothing exists): go to the next part.
3. **No visual direction, build to the defaults**: `design.md` still gets written, derived from the follow up questions alone. Say plainly that the result will be competent rather than distinctive, since nothing anchors it.

#### Recommend free starter templates

Only for the framework already chosen in step 2. A template for a different framework is not a recommendation, it is a stack change.

Find two or three real, free, actively maintained templates for that exact framework. **Fetch each one's page before proposing it.** Never recommend a template from memory, because template galleries change constantly and a dead link wastes the user's time.

For each, say: its name, its link, its license, what kind of product it suits, and what it would cost to bend it toward this product. Recommend one, with a one line why.

Check each against the product before proposing it:

- It fits the pages in `project-overview.md`. A marketing template for an application with a dense data table is a fight, not a head start.
- Its license permits the intended use. Say the license out loud rather than assuming it is permissive.
- It is maintained. An abandoned template carries abandoned dependencies, which lands you in the audit in step 4 on day one.

The user may decline all of them. That is option 3 above, not a failure.

#### Follow up on behavior, not looks

A template settles how it looks. It settles almost nothing about how it behaves. Ask about the parts a picture cannot show, in one round of up to four questions, and **anchor every one to a real flow in `project-overview.md`** rather than asking in the abstract.

Cover, choosing what actually applies:

- **The empty state** for each list or feed the flows describe. What does a person see before there is any data, and what does it offer them next? This is the state most often skipped and most often noticed.
- **Loading.** A skeleton, a spinner, or an optimistic update? This changes how a component is built, not only how it looks.
- **Errors.** What a person sees when something fails, and what they can do about it.
- **Density.** Roomy or compact. A flow that involves scanning many rows wants a different answer from one that involves reading.
- **Navigation at the small end.** What happens to the navigation `project-overview.md` describes on a phone.
- **Dark mode.** Whether it exists at all. Deciding this later means revisiting every colour.

Record the answers in `design.md`'s States, Composition patterns, and Responsive sections. **Every answer must be consistent with a flow in `project-overview.md`.** Where an answer contradicts a flow, say so and settle it now, because one of the two is wrong.

