# Test Writing Guide

Read this in full at write time, just before writing tests. It holds the strategy, the rules, and the iteration loop. Reading it only at write time keeps the detail out of context during the earlier scoping and question steps.

---

## The guiding principle

**A test that passes but fails to catch a real bug is worse than no test.** It costs maintenance, and it buys false confidence, which is the expensive kind. Write tests that verify behavior, catch regressions, and read like documentation of what the thing is supposed to do.

---

## Rules of engagement

**You must not modify application source files.** This skill writes tests. It never changes the code under test to make a test pass. When a test fails because the code is wrong, that is a bug, and it goes to `/debug`.

### The run and iterate loop

When you run the suite, use a terse reporter, and **re run only the files that failed** rather than the whole suite each time. A full re run on every iteration is slow enough that it discourages iterating at all.

Iterate on a failing test only while the fault is in the test. The moment the fault is in the code, stop and report it.

### Existing tests: extend, never duplicate or clobber

Before writing a new test file, look for one that already covers the same source file.

- **Extend it.** Add the missing cases and leave the existing tests intact.
- **Never create a second parallel test file** for the same source, and never overwrite tests a person wrote.
- Existing tests that look wrong, or contradict the current code, do **not** get silently rewritten. Note them in the report as possibly stale and let the user decide, because they may encode a requirement you cannot see.

### Config files: minimal and additive only

You write test files. The one exception is when the chosen runner genuinely cannot run without a config that does not exist yet, in which case create the minimal one.

**Never edit an existing config.** Where one is present, respect it and adapt the tests to it. Report any conflict rather than resolving it by changing their setup.

### Security sensitive code gets security cases by default

When anything in scope touches authentication, authorization, sessions, payments, or personal data, add cases for:

- Access without credentials, and access with the wrong ones.
- Credentials that are missing, expired, or tampered with.
- That secrets and sensitive fields do not leak into a response or a log.

`architecture.md`'s Authentication section and its Invariants list tell you what the rules are supposed to be. **Test the rule, not the current behavior**, since the whole point is catching the moment they diverge.

Any security risk you cannot cover with a test goes in the report.

---

## Strategy per class

| Class | What to write |
|---|---|
| **logic** | Call the function with real inputs and assert the outputs. Cover the edges and errors thoroughly. Mock only true boundaries: network, filesystem, clock, randomness. |
| **component** | Render it, interact through real user events, and assert what a person perceives: text, roles, and state such as disabled or expanded. **Never assert internal state or class names.** |
| **page** | With an end to end runner, write a real browser flow for the primary path through the page, plus one failure path. Without one, cover the page at the component level. |
| **endpoint** | Invoke the real route with representative requests. Assert the status, the response shape, and the error responses: bad input, unauthorized, not found. Mock external services at the boundary only. |
| **data** | Run against the real database in the compose stack rather than a mock, since a mocked query layer proves only that your mock works. Respect `tooling.md`'s Local Data Lifecycle, and never reset data it says to keep. |

---

## Coverage priorities, in order

1. **Happy path**: the normal, expected use.
2. **Edge cases**: empty, null, zero, boundary, maximum length, unicode.
3. **Error states**: invalid input, a dependency failing, unauthorized, not found.
4. **State transitions**: initial, action, expected new state.
5. **Accessibility**, for components and pages: keyboard reachable, correct roles, correct accessible names.

**A suite with only happy path tests is not done.** The happy path is the case that already worked when the developer ran it by hand.

---

## What our documents give you for free

This workflow records things that convert directly into assertions, so use them rather than inventing coverage:

- **Every invariant in `architecture.md` is a test.** They are written as flat checkable facts precisely so something can check them.
- **Every row of the Value Sourcing table is a test** that the value comes from the source it names. Vary the input that source depends on, a different timezone, tenant, or currency, and assert the output follows. This is the class of bug that passes every type check and is wrong only for someone else.
- **Every Core User Flow step in `project-overview.md`** is a behavior worth asserting for anything user facing.
- **Every state in `design.md`**, meaning empty, loading, and error, is a component case. They are the states most often built and least often tested.

---

## Expert rules

- **Test names are sentences.** "returns null when the cart is empty", never "test3".
- **One concept per test.** Several assertions are fine only when they verify the same behavior.
- **Arrange, act, assert**, in that order, in every test body.
- **Test the public interface, not internals.** Assert observable output, never that a private function ran.
- **Do not mock what you own.** Mock only at the system boundary.
- **Deterministic.** No reliance on real time, the real network, or test ordering. Freeze the clock when time matters, and note that a test depending on the machine's timezone is itself the bug the Value Sourcing rows exist to catch.
- **Keep shared setup readable.** The test body still has to make sense on its own.
- **Await every async call.** No floating promises.

---

## What to refuse to test

- **Scaffolding the plan deliberately left as a stub.** Where `build-plan.md` says a task binds to placeholder data and wires the real source later, testing the placeholder locks in something meant to be thrown away.
- **A framework's own behavior.** Testing that a router routes tests the framework.
- **Generated code and type only declarations.**
- **Coverage for its own sake.** A test written to raise a number, asserting nothing a caller relies on, is worse than no test, because it takes maintenance and gives no signal.

Say what you refused and why. A deliberate gap that is stated is a decision; an unstated one is an oversight.
