# Design

*Purpose: the art direction every UI build follows, so pages built in different sessions look like one product. Holds the character, the build mandate, and the composition rules. The token values themselves live in the project's own CSS or styling config, never duplicated here, because two copies of a colour drift. Optional: only present when the project has a frontend.*

---

## What this file decides, and what it does not

*Purpose: the precedence rule. Keep this section. Three artifacts describe how this product looks, and without a stated order a builder facing a disagreement picks one silently, which is how half a product ends up matching a document nobody reads.*

| Artifact | Decides |
| --- | --- |
| `project-overview.md` | what the product does. **Always wins.** |
| this file | the design system: character, tokens, states, breakpoints, component rules. Governs every prototype and every built page. |
| `.konteksto/designs/<surface>.html` | how one surface looks and behaves. Governs the implementation of that surface. |

**A prototype never overrides a flow.** Where an approved prototype contradicts `project-overview.md`, that is a defect in one of them, and it goes back to `/dev-architect` rather than being resolved at build time.

**This file wins over a prototype on anything cross page**, meaning tokens, breakpoints, and the meaning of a state. A prototype wins on the layout, hierarchy, spacing, and composition of its own surface, which is exactly what this file does not describe.

**A genuine conflict between the two is a design bug, not a judgment call.** Stop and route it back. One of them is wrong, and a builder choosing quietly picks wrong roughly half the time and leaves no trace either way.

---

## Source

*Purpose: where this direction came from, so a later session extends it instead of inventing a second one.*

**Origin:** <STARTER_TEMPLATE_NAME_AND_URL | PROVIDED_DESIGN | DERIVED_FROM_DESCRIPTION | EXTRACTED_FROM_EXISTING_UI>

**License:** <LICENSE_OF_THE_TEMPLATE_IF_ONE_WAS_USED>

**What was kept, and what was changed:** <WHAT_CAME_FROM_THE_SOURCE_AND_WHAT_WAS_DELIBERATELY_ALTERED>

---

## Character

*Purpose: the product's personality in a few words, and what that rules out. This is what stops a page drifting toward generic.*

<PROJECT_NAME> feels <CHARACTER_ADJECTIVES>. It is not <WHAT_IT_IS_DELIBERATELY_NOT>.

Reference points: <PRODUCTS_OR_SITES_WHOSE_FEEL_IS_CLOSE>

---

## Build mandate

*Purpose: the non negotiable rules for every page. These are the ones a build checks itself against before reporting done.*

- <MANDATE_RULE>

---

## Where the tokens live

*Purpose: a pointer, never a copy. Values live in one place so they cannot drift.*

| Kind | Where it is defined |
| --- | --- |
| Colour | <FILE_PATH> |
| Typography | <FILE_PATH> |
| Spacing | <FILE_PATH> |
| Radius and shadow | <FILE_PATH> |

**Dark mode:** <HOW_IT_IS_SWITCHED_AND_WHERE_THE_DARK_VALUES_LIVE | NONE>

**Font:** <FONT_NAME_AND_HOW_IT_IS_LOADED>

**Before any app code exists**, the table above points at `.konteksto/designs/shared/tokens.css`, which the prototypes use so no prototype hardcodes a value. **That is a handover, not a second home.** `/dev-develop` derives the project's real styling config from it on the first UI task, then this table is updated to point at the real one and the prototype file stops being the source.

**Both entries must never be live at once.** Two copies of a colour drift, and the copy in the older file is always the one that goes stale. On a project that already has a styling config there is no `shared/tokens.css` at all, and the prototypes read the real one.

---

## Composition patterns

*Purpose: how a page is put together, so every screen shares a skeleton rather than each inventing its own.*

- **Page shell:** <WHAT_WRAPS_EVERY_PAGE: NAV_POSITION_CONTAINER_WIDTH_FOOTER>
- **Section rhythm:** <HOW_SECTIONS_ARE_SPACED_AND_SEPARATED>
- **Density:** <HOW_MUCH_BREATHING_ROOM_CONTENT_GETS>
- <OTHER_COMPOSITION_PATTERN>

---

## Component rules

*Purpose: the do and do not list, stated concretely enough that a build can check itself against it.*

**Do:**
- <DO_RULE>

**Do not:**
- <DO_NOT_RULE>

---

## States

*Purpose: what empty, loading, and error look like in this product. Named once here so every surface handles them the same way, since these are the states that get skipped.*

- **Empty:** <WHAT_AN_EMPTY_SURFACE_SHOWS_AND_WHAT_IT_OFFERS_NEXT>
- **Loading:** <SKELETON_SPINNER_OR_OPTIMISTIC_AND_WHERE>
- **Error:** <WHAT_A_USER_SEES_AND_WHAT_ACTION_IS_AVAILABLE>

---

## Responsive and accessibility direction

*Purpose: the decisions a single mockup cannot show, settled once rather than per page.*

- **Breakpoints:** <THE_BREAKPOINTS_THIS_PROJECT_USES>
- **Mobile approach:** <WHAT_CHANGES_AT_THE_SMALL_END: NAV_TABLES_DENSITY>
- **Contrast target:** <THE_MINIMUM_THIS_PROJECT_HOLDS_TO>
- <OTHER_ACCESSIBILITY_DIRECTION>
