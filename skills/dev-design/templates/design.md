# Design

*Purpose: the art direction every UI build follows, so pages built in different sessions look like one product. Holds the character, the build mandate, and the composition rules. The token values themselves live wherever the Where the tokens live table points, never duplicated here, because two copies of a colour drift. Optional: only present when the project has a frontend.*

---

## What this file decides, and what it does not

*Purpose: the precedence rule. Keep this section. Three artifacts describe how this product looks, and without a stated order a builder facing a disagreement picks one silently, which is how half a product ends up matching a document nobody reads.*

| Artifact | Decides |
| --- | --- |
| `project-overview.md` | what the product does. **Always wins.** |
| this file | the design system: character, tokens, states, breakpoints, component rules. Governs every prototype and every built page. |
| `.konteksto/designs/<surface>.html` | how one surface looks and behaves. Governs the implementation of that surface. |

**A prototype never overrides a flow.** Where an approved prototype contradicts `project-overview.md`, that is a defect in one of them, and it goes back to `/dev-design` to fix the prototype or to `/dev-scope` to fix the flow, rather than being resolved at build time.

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

*Purpose: names the one file that decides each token value, and the one file the prototypes read. They are usually not the same file, and saying which is authoritative is what stops them drifting.*

**Production source**, the authority once it exists: <PATH_TO_THE_STYLING_CONFIG>

| Kind | Defined in |
| --- | --- |
| Colour | <FILE_PATH> |
| Typography | <FILE_PATH> |
| Spacing | <FILE_PATH> |
| Radius and shadow | <FILE_PATH> |

**Dark mode:** <HOW_IT_IS_SWITCHED_AND_WHERE_THE_DARK_VALUES_LIVE | NONE>

**Font:** <FONT_NAME_AND_HOW_IT_IS_LOADED>

**Prototype mirror:** `.konteksto/designs/shared/tokens.css`

### Which one is authoritative

**Exactly one file decides a value, and the other copies it.** Which one depends only on whether the production config exists yet.

| When | The authority | The mirror |
| --- | --- | --- |
| No app code yet | `shared/tokens.css`, since nothing else exists | none |
| Production config exists | the production source above | `shared/tokens.css`, **derived from it, never authored** |

**Write the production path in from the start, even before the file exists**, taking it from the folder structure in `architecture.md` and marking it not created yet. That way nothing has to be repointed later: the path was always right, and the file simply becomes real when `/dev-develop` writes it on the first UI task. **A pointer that has to be updated later is a pointer nobody updates**, because the skill that owns this file may not run again at that moment.

**The mirror exists on every project, including one with a real config already.** Prototypes must render on their own with no application infrastructure, and a production config is often a `tailwind.config.js`, a `theme.ts`, or something else a plain HTML file cannot read at all. Pointing a prototype at it would break the prototype for no gain.

**The mirror is a derived artifact, and this is what stops it becoming a second source of truth.** Nobody edits a value in it to change the product. When the production source changes, the mirror is regenerated from it, exactly as a lockfile is regenerated rather than hand corrected. Where the two disagree, the production source is right and the mirror is stale, always, with no case where it goes the other way.

**Both files existing is normal, and only one of them ever decides anything.**

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

- **Breakpoints:** <THE_BREAKPOINTS_THIS_PROJECT_USES, NAMED_AND_WITH_THEIR_WIDTHS>

  **This list is the authority, and everything downstream counts from it.** Prototypes compose one layout per breakpoint, `/dev-develop` builds them all, and `/dev-check verify` needs a screenshot of each. The default is three, meaning desktop, tablet, and phone. A project needing two, or four with a wide desktop, changes this line only, and every rule follows without being edited.
- **Mobile approach:** <WHAT_CHANGES_AT_THE_SMALL_END: NAV_TABLES_DENSITY>
- **Contrast target:** <THE_MINIMUM_THIS_PROJECT_HOLDS_TO>
- <OTHER_ACCESSIBILITY_DIRECTION>
