# Architect: settling the history line

Read this at step 2a, and only when step 1 found a real existing codebase, meaning code this workflow did not generate. Skip it on a fresh project and on our own scaffold.

**This is one half of a pair.** `/dev-design` asks the other half, the design line, which decides whether surfaces that already exist owe prototypes. The two are separate decisions with separate defaults and separate owners, and each is asked next to the artifact it governs. **Do not ask the design question here**, and do not answer it on the user's behalf when you write the plan.

---

An existing product is already built and already being used. This workflow arriving late does not make any of that work missing, and treating it as missing is the failure this step exists to prevent: a plan padded with tasks for features that shipped last year.

**The baseline is the line between what came before and what this workflow governs.** Everything before it is recorded as it is and never re litigated. Everything after it follows the process in full.

## First, sort what is actually finished

**`BASELINE` means existed and finished before the line, not merely present in the repository.** A half built feature, a route behind a flag nobody has turned on, a scaffolded module with a TODO in it: all of those exist, and none of them is baseline. Calling one baseline records a false history and quietly removes the only thing that would have made somebody finish it.

| What you found | Where it goes |
| --- | --- |
| finished and in use | eligible for `BASELINE`, subject to the question below |
| half built, stubbed, disabled, or abandoned | an ordinary task in `build-plan.md` |

**`progress-tracker.md`'s Status values section defines `BASELINE` for a task**, including why it is never `DONE`. Read it before writing the first row.

**Where you cannot tell, ask rather than assuming.** From the outside a feature nobody finished looks much like one nobody needed to change, and only the user knows which. **When the answer stays unclear, it is not baseline**, because an ordinary task costs a question and a false baseline costs the work nobody now knows is owed.

## The question

> "Should the features that are already built appear in the plan and the tracker, or does the plan start at what is not built yet?"

**This question is about the finished pile only.** A half built feature is an ordinary task in an ordinary phase either way, and it is the first thing the plan should carry, so never fold one into Phase 0 on the grounds that it predates the workflow.

1. **Unrecorded, the plan starts at the next task** (recommended): `build-plan.md` and `progress-tracker.md` hold only work that is not finished, which includes the half built pile. What is already finished is described in `architecture.md`, which is where a reader looks to find out what the system is made of anyway. Cheapest, and it keeps the tracker meaning what it says: live state of a build in progress.
2. **Recorded as baseline**: `build-plan.md` gains `## Phase 0 — Already built`, one task per finished feature, mirrored in `progress-tracker.md` with Status `BASELINE` and an empty Verify Check. Worth its cost when the user wants one table showing the whole product rather than only the part this workflow touched. It is a survey pass over the codebase, so say that before they pick.

**A recorded row never reads `DONE`, and never carries a Verify Check.** `DONE` says this workflow built it and watched the build come back clean, and `PASSED` says a model exercised the behavior and saw it work. Neither happened. A fabricated `DONE` reads exactly like a real one to every later session.

## Record it under Core Principle

One line in `build-plan.md`, whichever way it goes, because a plan with no Phase 0 is otherwise indistinguishable from a plan where nobody asked.

Option 1:

```
**Adoption baseline:** this plan starts at work that was not finished as of <DATE>. Features finished before then are described in `architecture.md` and are not tasks here.
```

Option 2:

```
**Adoption baseline:** Phase 0 lists the features finished before <DATE>. Its tasks were not built by this workflow and are recorded at `BASELINE` in `progress-tracker.md`, never `DONE`. Every phase after it is real work.
```

## What this does not exempt

Name these plainly when you report the answer, because a user who took the default is usually picturing a wider amnesty than they got:

- **The dependency audit still runs**, in step 4, in full. A known vulnerability in code that shipped last year is still a known vulnerability.
- **Only what is finished is baseline.** Half built work is an ordinary task, per the classification above.
- **A Phase 0 gets no checkpoint**, and `progress-tracker.md`'s Checkpoints section says why: its tasks never reach `DONE`, so the row could only sit at `not due` for the life of the project. A review of the code that was already there is a task in the plan instead.
- **Nothing here is a claim that the existing code works.** `BASELINE` means it predates this workflow. It does not mean it was reviewed, tested, or verified, and no skill may later read it as though it were.
- **The design line is a separate question with a separate answer.** On a project with an `app/`, `/dev-design` asks it. Taking the default here says nothing about what surfaces owe.

## Carrying the answer forward

The answer is not written now. `build-plan.md` is written in step 8, so hold it as part of the same list of findings step 4 hands forward, and write it when you reach that file.
