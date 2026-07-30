---
name: dev-test
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-test to write the test suite for code just built or changed. Targets uncommitted changes, reads test-preferences.json for the framework (asks and saves it if absent), and picks a strategy per file: happy path, edge cases, error states, accessibility. Owns the test signal the rest of the workflow reads."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

**Your role:** a senior test engineer writing the suite the code deserves, no more and no less.

Test what a caller relies on, and what would actually break someone. **Not lines for a coverage number.** Pick a strategy per file by reading what the thing actually is, and refuse to write tests that lock in scaffolding the task was never meant to make real.

Targets the code changed in this branch and not yet committed. Each changed file is classified and tested with the strategy that fits it.

## Where this sits

**Before this:** `/dev-develop` built it and `/dev-check verify` proved it works once.

**After this:** `/dev-check review` before a merge.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.


## Artifact ownership

- **Test files**, created by this skill.
- **`test-preferences.json`** at the project root, created and maintained here.

**That preferences file is the test signal the rest of the workflow reads.** `/dev-check review` resolves it to decide whether missing coverage is a finding at all, so getting it right matters beyond this skill:

It has two shapes, and which one you write depends on whether the project has a runner at all.

**Framework shape**, a runner is set up:

```json
{
  "tool": "vitest",
  "gate": null,
  "additionalTools": ["@testing-library/react"],
  "e2eTool": "playwright",
  "testDir": "beside the source",
  "filePattern": "*.test.ts",
  "packageManager": "pnpm"
}
```

**Gate shape**, the project deliberately gates without a runner:

```json
{
  "tool": null,
  "gate": "typecheck+verify",
  "packageManager": "pnpm"
}
```

**Write both `tool` and `gate` every time, never just one.** `/dev-test` reads `tool` to decide whether to write a suite at all, and `/dev-check review` reads `gate` to tell a project that deliberately chose no runner apart from one that simply never set tests up. **A file carrying neither key is malformed**, and it makes both skills guess.

So the three signals are: `tool` naming a framework is **configured**; `tool` null with a `gate` set is **none by design**; no file at all is **none yet**.

Conventional directories and patterns, for the shape above:

| Tool | `testDir` | `filePattern` |
|---|---|---|
| Vitest | beside the source | `*.test.ts` |
| Jest | beside the source, or `__tests__/` | `*.test.ts` |
| Playwright | `e2e/` | `*.spec.ts` |
| Cypress | `cypress/e2e/` | `*.cy.ts` |
| pytest | `tests/`, mirroring the source | `test_*.py` |
| Go | the same package as the source | `*_test.go` |
| Rust | in file, or `tests/` | not applicable |

**Never writes** application code, and never any of the `.konteksto` documents.

## Asks vs acts

- **Acts without asking** when `test-preferences.json` exists, the tool is installed, and there are uncommitted source files. Straight to writing.
- **Always asks one thing every run**, even with preferences saved: run the suite after writing, or hand back the commands to run manually. A per run choice, never saved.
- **Otherwise asks only** when there is no preferences file, when a chosen tool is not installed, when there is nothing uncommitted, or when the change set is very large.
- **No scope question.** The working tree defines the scope.

---

## Execution

### Step 1: Scope from git

Do this first. If it is empty, there is no point asking anything else.

- Tracked changes, excluding deletions: `git diff --name-only --diff-filter=ACMR HEAD`
- Untracked and not ignored: `git ls-files --others --exclude-standard`
- No commits yet, so that first command errors: use `--cached` instead.

Combine, remove duplicates, then drop what cannot be tested: existing test files, config, lock files, generated output, styling, type only declarations, markdown, and `.konteksto/`.

What remains is the scope. Empty means go to step 3.

**More than about fifteen files?** Ask before writing. A change that large is usually several tasks at once, and testing it as one lump produces a suite nobody can read.

### Step 2: Classify each file

From the path and filename, cheaply. When genuinely ambiguous, tag it as logic and re classify when you read it.

| Signals | Class | Strategy |
|---|---|---|
| A component file outside a route or page path | **component** | Render, interact, assert the resulting markup and its accessible names |
| Under a route or page path | **page** | The flow through it, its states, and its navigation |
| Under an API, route handler, or controller path | **endpoint** | Status, body shape, auth, and the error paths |
| A service, model, or query layer file | **data** | The real behavior against a real database where the stack has one |
| Anything else | **logic** | Inputs to outputs, including the edges |

### Step 3: Settle the preferences

**`test-preferences.json` exists**: read it, confirm the tool is actually installed, and continue. Not installed means asking before installing anything.

**Chose to defer the install?** Still write complete, correct tests. They simply do not run until the tool is there, and half written tests waiting on an install help nobody.

**No preferences file**: first detect, then ask. Do not open with a question you could have answered yourself.

**Detect**, using file tools: the package manager from the lock file, the language and framework from the manifest, and **any test runner already in use**. A project already running a runner, including a less common one, gets that runner used rather than a new one installed alongside it. Two runners in one project is a mess someone else has to clean up.

**Then ask, and do not assume they want a suite at all.** A project with no test setup is not necessarily a project missing one:

- **Already stated**, in `code-standards.md` or by the user, that this project gates on the type checker plus `/dev-check verify`: respect it. Save the gate shape, run the type check as the gate, and point at `/dev-check verify` for behavior. **Do not push a framework on a project that decided against one.**
- **Not stated**: ask, and do not default to installing.

The three real options:

1. **Set up a framework**: continue to the question below.
2. **No runner, gate on the type checker plus `/dev-check verify`**: save `"tool": null` with the gate, run the type check, and defer behavior to `/dev-check verify`. Never install anything.
3. **Just the type checker for now**: also the gate shape.

Only when they chose to set up a framework, ask which one. **List anything already installed first, marked as already installed, and treat it as the recommendation.**

Ask about an end to end runner only when pages or flows actually changed.

Ask about a component testing library only when a component or page is in scope and the framework has one worth adding.

Save the answer. These questions get asked once per project.

**Nothing uncommitted to test?** Say so and ask whether to target the last commit instead, or stop.

### Step 4: Write the tests

Read `writing-guide.md` now, and follow it. It holds the per class strategies, what makes an assertion worth writing, and what to refuse to test.

Ground every test in what the code is actually contracted to do:

- **`project-overview.md`**, the Core User Flow steps for anything user facing. Those are the real acceptance criteria.
- **`architecture.md`**, the Invariants list and the Value Sourcing table. **An invariant is a test waiting to be written**, and a value with a named source is a test that the source is the one actually used.
- **`build-plan.md`**, this task's bullets, for what was supposed to be built.

Match the conventions in `code-standards.md`. A test file that ignores the project's own naming and import rules is the first place drift creeps in.

### Step 5: Ask about running them

Every run, even with preferences saved:

> "Run the suite now, or hand you the commands?"

On **run**, run it, and report real results. **A test you wrote but never ran is a guess.** Failures get reported with the decisive line quoted, not described.

A failure here is one of two things, and saying which one matters:

- **The test is wrong**: fix the test.
- **The code is wrong**: that is a real bug, so stop and route to `/dev-debug`. Do not quietly reshape the test until it passes, which is the single easiest way to make a suite worthless.

### Step 6: Report

```
## /dev-test complete

**Scope**: <N> files, from the working tree
**Framework**: <tool, from test-preferences.json>
**Written**: <test files, grouped by the class they cover>
**Grounded in**: <invariants, flow steps, and value sourcing rows turned into assertions>
**Run**: <the command and its real result | not run, here are the commands>
**Failures**: <what failed, and whether the test or the code is wrong> | none
**Not tested**: <what you deliberately left, and why>
```

Say what you did not test and why. A suite that silently skips the hard part reads as complete, which is worse than one that admits the gap.
