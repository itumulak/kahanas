# Code Standards

*Purpose: implementation rules the AI agent must follow in every session, without exception. These exist to prevent pattern drift across sessions.*

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception.

---

## Engineering Mindset

*Purpose: the working posture the agent should hold going into any task on this project, not tool specific rules.*

- <MINDSET_RULE>

---

## Language / Framework Conventions

*Purpose: one section per language or framework in the stack, naming its specific rules (strict mode, typing, naming). Repeat this whole section once per language/framework listed in `architecture.md`'s Stack table.*

### <LANGUAGE_OR_FRAMEWORK_NAME>

- <CONVENTION_RULE>

---

## File and Folder Naming

*Purpose: the exact casing and naming convention per file kind, so generated files land with a consistent name on the first try.*

- <FILE_KIND>: <NAMING_CONVENTION> — <EXAMPLE>

---

## Component Structure

*Purpose: the exact internal ordering a reusable UI component or module must follow (imports, types, then body), shown as one small real code block. Optional: only present for projects with a component based UI layer.*

```<LANGUAGE>
// <FILE_PATH>

// 1. External imports
// 2. Internal imports
// 3. Type definitions
// 4. Component / function body
```

- <STRUCTURE_RULE>

---

## Request Handlers

*Purpose: the exact shape a request handler follows (parse, delegate, respond), shown as one small real code block. Optional: only present for projects with an HTTP or RPC layer.*

```<LANGUAGE>
// <FILE_PATH>
<SHORT_REAL_HANDLER_EXAMPLE>
```

- <HANDLER_RULE>

---

## Service Layer

*Purpose: what a service/orchestration function is allowed to do and call, so business logic never leaks into a handler or a data access function. Optional: only present once the project has a distinct service layer.*

```<LANGUAGE>
// <FILE_PATH>
<SHORT_REAL_SERVICE_EXAMPLE>
```

- <SERVICE_RULE>

---

## Background Workers

*Purpose: how concurrent or scheduled work is bounded and how a single unit's failure is handled, so one failure never takes down the whole batch. Optional: only present once the project runs background/async work.*

```<LANGUAGE>
<SHORT_REAL_WORKER_EXAMPLE>
```

- <WORKER_RULE>

---

## API Client

*Purpose: the exact response shape and error handling every outbound fetch/request function must follow. Optional: only present once the project calls its own or a third party API from client code.*

```<LANGUAGE>
<SHORT_REAL_CLIENT_EXAMPLE>
```

- <CLIENT_RULE>

---

## Error Handling

*Purpose: how an error is logged, wrapped, and surfaced to a user, so internals never leak and every error is traceable to its origin.*

- <ERROR_HANDLING_RULE>

---

## Environment Variables

*Purpose: every secret or config value the app reads from its environment, where it's used, and which ones must never be exposed to a client bundle.*

| Variable | Used In | Notes |
| --- | --- | --- |
| <ENV_VAR_NAME> | <FILE_PATH> | <NOTE> |

---

## Domain Constants

*Purpose: a project specific fixed value (a retention window, a rate limit, a threshold) that must be defined exactly once and referenced everywhere, never hardcoded a second time. Optional: only present when the project has such a constant.*

```<LANGUAGE>
// <FILE_PATH>
<CONSTANT_DECLARATION_EXAMPLE>
```

Use `<CONSTANT_NAME>` everywhere this value is referenced.

---

## Import Paths

*Purpose: the exact import style (aliased vs relative, module path vs relative climb) so generated code matches the rest of the codebase.*

- <IMPORT_PATH_RULE>

---

## Comments

*Purpose: what a comment is for on this project (why, not what), so the agent doesn't narrate obvious code.*

- <COMMENT_RULE>

---

## Dependencies

*Purpose: the check to run before adding any new package, and the current approved list, so dependencies don't silently grow.*

Before installing anything, check:
1. <BUILT_IN_ALTERNATIVE_CHECK>

Approved dependencies:
- <DEPENDENCY_NAME> — <WHAT_IT_IS_FOR>

---

## CI Enforcement

*Purpose: which of the above rules are actually checked automatically in CI, and which rely on human or AI code review instead, so nobody assumes a rule is enforced when it isn't. Optional: only present once CI exists.*

| Job | Checks | Command |
| --- | --- | --- |
| <CI_JOB_NAME> | <WHAT_IT_CHECKS> | `<COMMAND>` |

Rules **not** automated and relying on review instead: <LIST_OF_MANUAL_ONLY_RULES>.

---

## Docker / Container Images

*Purpose: base image and hardening rules for any container this project ships. Optional: only present once the project is containerized.*

- <CONTAINER_RULE>
