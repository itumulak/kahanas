# Project Overview

## About the Project

*Purpose: one or two sentences on what the product is and the core problem it solves, in plain language a new reader (human or agent) can act on immediately.*

<PROJECT_NAME> is <PRODUCT_TYPE> that lets <PRIMARY_USER> <CORE_ACTION>. It provides <KEY_CAPABILITY_1>, <KEY_CAPABILITY_2>, and <KEY_CAPABILITY_3>.

---

## The Problem it Solves

*Purpose: what existing options fall short on, and why this product's approach is different or better. Keeps every later decision anchored to a real need instead of a feature for its own sake.*

Unlike <ALTERNATIVE_OR_COMPETITOR>, which only <ALTERNATIVE_LIMITATION>, <PROJECT_NAME> is built for <TARGET_USE_CASE>, offering <DIFFERENTIATING_CAPABILITY>.

---

## Pages

*Purpose: every route the app exposes, in one place, so no page gets built without a named purpose first.*

```
<ROUTE_PATH>   → <PAGE_NAME> (<PAGE_PURPOSE>)
```

Add one line per route, in this exact shape. Repeat for every page the product needs.

---

## Navigation

*Purpose: the top level navigation shape, so every page built later reuses the same nav rather than inventing its own.*

<NAV_DESCRIPTION>. Contains:
- <NAV_ITEM_1>
- <NAV_ITEM_2>

---

## Core User Flow

*Purpose: what a user actually does on each page, step by step, in plain language. This is the contract a build plan feature checks itself against, and design specs may still be wrong or over engineered relative to it.*

### <PAGE_NAME>

- <USER_STEP_1>
- <USER_STEP_2>
- <USER_STEP_3>

Repeat one `### <PAGE_NAME>` subsection per page listed above, each with its own ordered steps.

---

## Features in Scope

*Purpose: the fixed list this build pass commits to. Anything not on this list is not assumed, even if it seems obviously useful.*

- <IN_SCOPE_FEATURE>

List every feature genuinely committed to; one bullet each.

---

## Features Out of Scope

*Purpose: explicitly named non goals, so a later session doesn't quietly build them "since it seemed related."*

- <OUT_OF_SCOPE_FEATURE>

---

## Target Audience

*Purpose: who this is for, in one or two bullets. Shapes tone, complexity, and which edge cases matter.*

- <TARGET_AUDIENCE_DESCRIPTION>

---

## Team Shape

*Purpose: who is building this and how they coordinate. Recorded here because it is a fact about the work, not a tool choice, and because it changes the shape of several documents `/dev-architect` writes later. A personal project and a team project need different bookkeeping, and guessing wrong in either direction is expensive: a solo developer does not want assignment columns, and a team without them loses track of who is on what.*

**Mode:** <PERSONAL_OR_TEAM>

**Phase checkpoints:** <YES_OR_NO>

On **team**, `/dev-architect` adds an Assigned column to every phase table in `progress-tracker.md` and an actor column to `note-registry.md`, so the plan records who owns a task and the log records who ran each check. On **personal**, both are left out, since there is only ever one answer.

On **yes** to phase checkpoints, `/dev-architect` gives every phase in `build-plan.md` a checkpoint: what a reviewer must confirm before the phase is considered sound. Checkpoints are **non blocking**, so the next phase may start while one is still unapproved, and an unapproved checkpoint is a flag rather than a stop.

---

## Project Shape

*Purpose: which halves of the product exist, and the folder layout everything is built into. Recorded here because it is a fact about what is being built, not a tool choice. `architecture.md` expands the tree with annotations and real file names; this section only fixes the top level shape.*

**Parts:** <FRONTEND_ONLY_OR_BACKEND_ONLY_OR_BOTH>

**Layout:** <RECOMMENDED_OR_CUSTOM>

```
.
└── /
    ├── backend/
    ├── app/
    ├── other-folders/
    └── docker-compose.yml
```

The recommended layout puts server code in `backend/`, client code in `app/`, and the local development stack in `docker-compose.yml` at the root. Any further top level folder replaces the `other-folders/` line with its real name and a short note on what it holds. Drop `backend/` or `app/` when that half is out of scope.

When the project keeps a different layout, replace the tree above with the real one and record the reason on the Layout line, so no later session tries to reshape it again.
