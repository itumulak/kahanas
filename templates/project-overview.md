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
