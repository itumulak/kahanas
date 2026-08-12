# Architect: settling the adoption baseline

Read this at step 2a, and only when step 1 found a real existing codebase, meaning code this workflow did not generate. Skip it on a fresh project and on our own scaffold.

---

An existing product is already built and already being used. This workflow arriving late does not make any of that work missing, and treating it as missing is the failure this step exists to prevent: a hundred surfaces stamped `MISSING`, a plan padded with tasks for features that shipped last year, and a first build that blocks on a design nobody needs.

**The baseline is the line between what came before and what this workflow governs.** Everything before it is recorded as it is and never re litigated. Everything after it follows the process in full: a new page still needs a prototype, and still needs a person to approve it.

Two questions settle it, and both are the user's call. Ask them together, in one round, because they are one decision about where the line sits.

## First, classify what is actually finished

**`BASELINE` means existed and finished before the line, not merely present in the repository.** A half built page, a route behind a flag nobody has turned on, a scaffolded component with a TODO in it: all of those exist, and none of them is baseline. Calling one baseline records a false history and quietly removes the only thing that would have made somebody finish it.

Sort what you found in step 1 into two piles, and say which is which when you ask:

| What you found | Where it goes |
| --- | --- |
| finished and in use | eligible for `BASELINE`, subject to the two questions below |
| half built, stubbed, disabled, or abandoned | an ordinary task in `build-plan.md`, and on a surface an ordinary `MISSING` row |

**Where you cannot tell, ask rather than assuming.** From the outside a feature nobody finished looks much like a feature nobody needed to change, and only the user knows which. **When the answer stays unclear, it is not baseline**, because an ordinary task costs a question and a false baseline costs the work nobody now knows is owed.

## Question 1: the design line

Only on a project with an `app/`. Skip it entirely on a backend, where there are no surfaces and no prototypes.

> "This codebase already has screens people use. Should the surfaces that already exist get prototypes now, or does the design process start at the next new surface?"

**Ask it against the eligible pile only.** The half built pile is already settled: those surfaces owe designs whatever the answer here is, and offering them as though they were on the table would ask the user to waive work they never had a choice about.

1. **Start at the next new surface** (recommended on anything larger than a few screens): every eligible finished surface gets a row in `design-registry.md` at `BASELINE`, owing no prototype and blocking nothing. Every new surface goes through the full process, prototype and approval included.
2. **Retro design a named few, baseline the rest**: the user names the finished surfaces worth redoing, those go to `MISSING`, and the remaining eligible ones go to `BASELINE`. Good when a handful of screens are already known to be the weak ones.
3. **Retro design everything**: every eligible finished surface goes to `MISSING` too, so nothing is baseline and every surface owes a prototype. Honest, and sometimes right before a large redesign, but it is its own phase of real work in `build-plan.md`, never invisible work folded into a feature.

**`BASELINE` is defined in `design-registry.md`, in its Status values section, along with what puts a baseline surface back into the lifecycle.** Read it before writing the first row. The short version, so this step is usable on its own: a baseline surface owes nothing until a task recomposes it, and a recomposition is a change to layout, hierarchy, or interaction rather than to copy, content, or data.

**Still map the flows to surfaces in step 3.** The baseline changes what a row's status is, not whether the row exists. A product that skips the mapping has no registry at all, and then nobody can tell an existing surface from one nobody has noticed is missing.

**Record the answer as one line in `design-registry.md`, above the Entries table**, so a later session can tell a deliberate baseline from a registry somebody never finished. **Use the wording for the option they picked**, because a line claiming every existing surface is baseline is simply false after options 2 and 3, and it is the kind of false that nobody rereads:

Option 1:

```
**Adoption baseline:** surfaces finished before <DATE> are recorded at `BASELINE` and owe no prototype. Every surface added after that date follows the full lifecycle.
```

Option 2:

```
**Adoption baseline:** surfaces finished before <DATE> are recorded at `BASELINE` and owe no prototype, except <SURFACES_THE_USER_NAMED>, which are being redesigned and owe one. Every surface added after that date follows the full lifecycle.
```

Option 3:

```
**Adoption baseline:** none. Every surface owes a prototype, including the ones already built, and the retro design work is <PHASE_NAME_IN_BUILD_PLAN>.
```

**Write the line even on option 3**, where no row reads `BASELINE`. A registry with nothing to say about a codebase that plainly predates it reads as an oversight, and the next session cannot tell a deliberate answer from a question nobody asked.

## Question 2: the history line

Every project, backend or frontend.

> "Should the features that are already built appear in the plan and the tracker, or does the plan start at what is not built yet?"

**This question is about the finished pile too.** A half built feature is an ordinary task in an ordinary phase either way, and it is the first thing the plan should carry, so never fold one into Phase 0 on the grounds that it predates the workflow.

1. **Unrecorded, the plan starts at the next task** (recommended): `build-plan.md` and `progress-tracker.md` hold only work that is not finished, which includes the half built pile. What is already finished is described in `architecture.md`, which is where a reader looks to find out what the system is made of anyway. Cheapest, and it keeps the tracker meaning what it says: live state of a build in progress.
2. **Recorded as baseline**: `build-plan.md` gains `## Phase 0 — Already built`, one task per finished feature, mirrored in `progress-tracker.md` with Status `BASELINE` and an empty Verify Check. Worth its cost when the user wants one table showing the whole product rather than only the part this workflow touched. It is a survey pass over the codebase, so say that before they pick.

**A recorded row never reads `DONE`, and never carries a Verify Check.** `DONE` says this workflow built it and watched the build come back clean, and `PASSED` says a model exercised the behavior and saw it work. Neither happened. `progress-tracker.md` defines `BASELINE` alongside them, and the distinction is the whole reason the value exists: a fabricated `DONE` reads exactly like a real one to every later session.

**Record the answer as one line in `build-plan.md`, under Core Principle**, whichever way it goes, because a plan with no Phase 0 is otherwise indistinguishable from a plan where nobody asked.

Option 1:

```
**Adoption baseline:** this plan starts at work that was not finished as of <DATE>. Features finished before then are described in `architecture.md` and are not tasks here.
```

Option 2:

```
**Adoption baseline:** Phase 0 lists the features finished before <DATE>. Its tasks were not built by this workflow and are recorded at `BASELINE` in `progress-tracker.md`, never `DONE`. Every phase after it is real work.
```

## What the baseline does not exempt

Name these plainly when you report the answers, because a user picking option 1 twice is usually picturing a wider amnesty than they actually got:

- **The dependency audit still runs**, in step 4, in full. A known vulnerability in code that shipped last year is still a known vulnerability.
- **Every new task still needs its design**, on a project with an `app/`. That is the point of the line rather than an exception to it.
- **A baseline surface being recomposed re enters the lifecycle**, and needs a prototype and an approval like any other.
- **Only what is finished is baseline.** Half built work is an ordinary task and an ordinary `MISSING` row, per the classification above.
- **A Phase 0 gets no checkpoint**, and `progress-tracker.md`'s Checkpoints section says why: its tasks never reach `DONE`, so the row could only sit at `not due` for the life of the project. A review of the code that was already there is a task in the plan instead.
- **Nothing here is a claim that the existing code works.** `BASELINE` means it predates this workflow. It does not mean it was reviewed, tested, or verified, and no skill may later read it as though it were.

## Carrying the answers forward

Neither answer is written now. `design-registry.md` is written in step 3 and `build-plan.md` in step 8, so hold both as part of the same list of findings step 4 hands forward, and write them when you reach those files.

**Step 3 needs the design answer before it stamps a single row**, which is the only reason this step runs before it rather than beside the rest of the brownfield work.
