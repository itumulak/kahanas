# Architecture

## Stack

*Purpose: every layer of the system and the specific tool chosen for it, plus why, so a future session never silently swaps a library.*

| Layer | Tool | Purpose |
| --- | --- | --- |
| <LAYER_NAME> | <TOOL_NAME> | <WHAT_IT_DOES> |

**Why these choices:**
- **<TOOL_NAME>** over <ALTERNATIVE> — <REASON>.

---

## Folder Structure

*Purpose: the real directory tree, annotated inline with what each file is for, so a new session can find the right place to work without guessing.*

```
/
├── <TOP_LEVEL_FOLDER>/
│   └── <FILE_OR_SUBFOLDER>          → <WHAT_IT_DOES>
```

---

## System Boundaries

*Purpose: which folder or module owns which responsibility, and what it must never do. This is what stops logic leaking into the wrong layer over many sessions.*

| Folder | Owns |
| --- | --- |
| <FOLDER_PATH> | <RESPONSIBILITY_AND_WHAT_IT_MUST_NOT_DO> |

---

## Data Flow

*Purpose: the major request/data flows through the system, drawn as a simple top to bottom arrow diagram, so an agent can trace what calls what before changing any one step.*

### <FLOW_NAME>

```
<STEP_1>
        ↓
<STEP_2>
        ↓
<STEP_3>
```

Repeat one `### <FLOW_NAME>` subsection per major flow (e.g. one per core user action that touches the backend).

---

## Database Schema

*Purpose: every persisted table, its columns, and any constraint that matters (nullability, cascade, index). Optional: only present once the project has a persistence layer.*

### `<TABLE_NAME>`

| Column | Type | Notes |
| --- | --- | --- |
| <COLUMN_NAME> | <COLUMN_TYPE> | <CONSTRAINT_OR_NOTE> |

Repeat one `### \`<TABLE_NAME>\`` subsection per table. Note cross table relationships (foreign keys, cascade rules) and indexes once, below the last table.

---

## Authentication

*Purpose: how (or whether) the system identifies a caller, and what the actual access model is if there is no login. Optional: state explicitly "None" rather than omitting the section if the project truly has none, since an agent must not assume auth exists.*

<AUTH_MODEL_DESCRIPTION>

---

## Client Patterns

*Purpose: one small, real, copy-pasteable code example per external client or integration point, so new code matches the exact shape already in use instead of inventing a new one.*

### <CLIENT_NAME> (`<FILE_PATH>`)

```<LANGUAGE>
<SHORT_REAL_CODE_EXAMPLE>
```

Repeat one `### <CLIENT_NAME>` subsection per external client (a database connection, a third party API call, a background worker, and so on).

---

## Value Sourcing

*Purpose: every value the product must produce, compute, or display, and where it comes from. This table exists so a build never has to invent a source. `/dev-develop` runs an input coverage test against it before writing code, and a value missing from here is exactly what that test catches.*

| Value | Used in | Source |
| --- | --- | --- |
| <VALUE_NAME> | <FLOW_STEP_OR_SURFACE_THAT_NEEDS_IT> | <INPUT_PARAM \| DB_COLUMN \| DERIVED_FROM_NAMED_VALUE \| RECORDED_DECISION> |

One row per value a Core User Flow step in `project-overview.md` needs. A source is a real origin, never a description of the value: "the timezone column on the user record" is a source, and "the user's timezone" is the value restated.

---

## Invariants

*Purpose: rules that must never be violated by any future change, stated as flat, checkable facts. This is the list a code review checks a diff against.*

- <INVARIANT_STATEMENT>
