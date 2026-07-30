# Architect: settling the coding standards

Read this before writing `code-standards.md`. It holds the questions that fill it, and the four architecture style presets.

**This is the one place conventions get set.** Everything `/dev-develop` writes afterwards follows what lands here, and `/dev-check review` treats it as the canonical rule set. So grill on it rather than assuming defaults, and be thorough rather than minimal.

---

## Read the real project first

Before asking anything, read what already exists: the manifest, the config files, and whatever the scaffold or the existing codebase already installed.

Then tailor every question to it:

- **Skip a question the stack already settles.** Asking which formatter to use, when one is configured, wastes the user's attention on a decision already made.
- **List an already installed tool first, marked as already installed, and treat it as the recommendation.** Two linters in one project is somebody's afternoon.
- **Phrase the options for the actual language and framework.** Type strictness is not a question for an untyped language.

**On an existing codebase, derive rather than ask.** A real codebase already has conventions, and reading them out of the code beats asking someone to recite them from memory. Read a dozen files, state what you found, and ask the user to correct you. Ask only about what the code does not settle, or where it is genuinely inconsistent.

---

## The questions

Decision panels, up to four per round, as many rounds as it takes. Exactly one recommended option each, free text always last.

### Architecture and code conventions

**Architecture style.** Present all four presets by their label and description, without reading any of the files yet. Read only the chosen one, at write time.

| Style | Suits |
|---|---|
| **Clean Architecture** (`patterns/clean-architecture.md`) | Strict layer separation, domain logic never touching frameworks. Scales well for complex business rules. |
| **Functional and immutable** (`patterns/functional.md`) | Pure functions, no shared mutable state. Predictable and easy to test. |
| **Domain Driven Design** (`patterns/domain-driven.md`) | Modelling the business domain explicitly. Best for complex, evolving business logic. |
| **SOLID and object oriented** (`patterns/solid-oop.md`) | Classic object oriented design, dependency injection, small focused classes. |

The user may answer in free text instead. **Use their exact words in `code-standards.md`. Do not interpret or paraphrase them**, because a paraphrase of someone's convention is a different convention.

**Type strictness**, for a typed language only: strict, meaning no escape hatches and exhaustive types · gradual, meaning strict for new code · loose.

**Module and folder structure**: by feature, colocating everything a feature needs · by layer, meaning handlers, services, and data access · match whatever the scaffold already set.

**Additional standards**, more than one may apply: documented public interfaces · one consistent error handling pattern · validate environment variables at startup · named exports only · a consistent naming convention · an accessibility baseline on the interface · a commit message convention.

### Tooling

Asked here because this is where the choice is made and recorded. **Installed later by `/dev-develop`**, as its own task. This skill records, it does not install.

**Linting and formatting**: the standard pair for this stack, listing an installed one first · a named alternative · minimal for now.

**Checks before a commit**: lint, format, and type check on every commit · format only · none.

**The testing gate**, recorded as a convention here, with the runner set up by `/dev-test`: a real test suite · type check plus `/dev-check verify` only · tests written first.

**Continuous integration**: a basic check on push covering lint, type check, and tests · not yet · already configured.

**Adapt the list.** Drop what does not apply, and add anything this particular stack makes worth pinning down. A throwaway prototype does not need a continuous integration question.

---

## Writing it down

Write the chosen preset's Conventions list into `code-standards.md` under Language and Framework Conventions, **adapted to the real stack but not watered down**. A convention rewritten as a vague principle stops being checkable, and `/dev-check review` can only enforce what is specific.

Record the tooling answers clearly enough that `/dev-develop` installs exactly what was chosen, and no more.

**Keep it short.** `code-standards.md` is read on every task by every skill, so every line in it costs attention forever. Cut anything that is not a rule someone could actually break. A standards document nobody finishes reading enforces nothing.
