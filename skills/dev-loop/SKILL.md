---
name: dev-loop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
argument-hint: [task selector]
description: "Run /dev-loop to complete one or more build plan tasks through /dev-develop, /dev-check verify, /dev-test, and final /dev-qa regression checks. Recovers failures through /dev-debug, persists the handoff state, and stops at a per task route cap or a whole run repair cap."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The task runner for the delivery chain. It completes one task at a time, in build plan order, through this sequence:

```
/dev-develop  →  /dev-check verify  →  /dev-test
```

After every selected task passes, the run ends with `/dev-qa` to check the audit register for regressions.

Verification is the acceptance gate. Route each failure from its verdict: behavioral failure to `/dev-debug`, promised but missing or built but not live to `/dev-develop`, and a prototype that is wrong or silent to `/dev-design`. A `DONE` task that fails behavior goes to `/dev-debug`; a missing or not live surface remains incomplete implementation work.

The runner selects only the tasks named in its argument. A bare `/dev-loop` resumes its saved state, or starts the next unfinished task in `.konteksto/build-plan.md` when there is no saved run.

One `/dev-loop` invocation owns the whole selected sequence. Treat `/dev-develop`, `/dev-check verify`, `/dev-test`, and the recovery skills as phases to execute within this run, not as commands to hand back to the user. Do not stop after a passing task to ask the user to run the next skill or task.

## State and ownership

This skill owns `.konteksto/loop-state.md`. Create it from `templates/loop-state.md` only when a run begins. Update it after every phase transition and before any session boundary. It must never edit application code, `progress-tracker.md`, `decision-log.md`, `audit-register.md`, design records, test files, or a subskill's artifact.

The build plan and progress tracker remain the source of truth for task status. This file records only loop control state, so a fresh agent can resume without guessing whether testing was completed.

## Select the work

1. Read `.konteksto/build-plan.md`, `.konteksto/progress-tracker.md`, and an existing `.konteksto/loop-state.md` when present.
2. With an argument, resolve every named ID or inclusive range, such as `01-05`, against the build plan. Reject an unknown or ambiguous selector before changing code. Run only the resolved tasks, in plan order.
3. Without an argument, continue the selected task list in `loop-state.md` when it is active. Otherwise scan aggregate task rows in progress tracker order, skipping `DONE` and `BASELINE`, and select the first unfinished task from the build plan. Its first child row whose Status is not `DONE` is the implementation resume point. Child rows never become separate loop task IDs.
4. Never add adjacent tasks merely because they look related.

## Run one task

For the current task, keep the state file current and perform exactly one phase at a time.

1. **Develop.** Run `/dev-develop <task ID>`. Respect its gates and stop if it routes to an owner such as `/dev-architect` or `/dev-design`. **Record the stop the way the Final QA handoff below records its own**, since a stop nobody wrote down is a stop nobody can resume: leave `Phase` at `develop`, write `Next action` as the exact owner invocation naming the thing that is owed, for a visual gap `/dev-design <surface>` with the surface spelled as `design-registry.md` spells it, and put in `Last observed result` which task is `BLOCKED` and what the owner has to settle. **This is a handoff, not a block.** `blocked` means nobody can proceed without a person and stops a harness dispatching anything at all, and a design that is owed is work somebody can go and do.

   **Resume with a bare `/dev-loop`, never with `/dev-develop <task>`.** The owner ran in a different session, or a different terminal, and this file is unchanged by their work. Only this skill can advance it, so re read the registry row and the tracker and recompute the phase from what they now say.
2. **Verify.** Run `/dev-check verify <task ID>`. A pass advances to test only when every child subtask Verify Check and the aggregate task Verify Check were stamped `PASSED` by that completed check. On a failure, preserve the verifier's per condition and per subtask route in Attempt history with its observed evidence. A behavioral failure increments that task's `/dev-debug` repair count and the run total, then advances to debug. A promised but missing or built but not live subtask increments its `/dev-develop` repair count and the run total, then returns to `/dev-develop <task ID>`. A prototype that is wrong or silent routes to `/dev-design`.
3. **Debug.** Run `/dev-debug <task ID>`, then return directly to verify.
4. **Test.** Run `/dev-test`. A passing suite completes the task. If `/dev-test` reports that this project intentionally has no test runner, the Definition of Done in `code-standards.md` is the implementation gate and the task completes once it passes. After either form of passing test gate, if another selected task remains, set Current task to it, Phase to `develop`, and Next action to `/dev-develop <task ID>`, then immediately begin its Develop phase in this same run. Do not report a passing task as a handoff or ask whether to continue. If no selected task remains, advance to Final QA. If the suite exposes a defect, count it against that task's `/dev-debug` route and the run total, record the failing evidence in Attempt history, run `/dev-debug <task ID>`, then verify and test again.
5. Do not change a task's repair route without new observed evidence from its verifier, test, or audit result. Record that evidence and the new route in Attempt history. At ten failed attempts for one task and route, or thirty repairs across the whole run, set the phase to `blocked`, preserve the decisive evidence, and stop. Do not start another selected task.

Do not call a task passed from a clean build alone. It passes only after observed verification and the required test gate both pass.

## Session boundaries

After each completed task, record the next task and exact next action in `loop-state.md`, then execute that action immediately.

**One exception: when the next selected task belongs to a different phase of `build-plan.md`, stop instead, and record `Next action` as `/dev-loop <the remaining selector>`.** Record `/dev-loop`, never `/dev-develop <task>`, because only this skill owns `loop-state.md`: a route naming a subskill cannot advance the state, so whatever ran it would hand back with the file unchanged and the caller would read its own last route as stale.

A phase is where a harness gives the work its own branch and its own pull request, and it is a natural place for a person to look, so a run that crosses one without stopping either lands later phases on the wrong branch or never gets reviewed as a unit. Outside a harness the same stop is a short pause on a boundary somebody chose, and resuming it is one command. A fresh session is used only when the user or host explicitly starts one; it resumes from the saved state and continues automatically. Do not claim that a fresh session was created unless the host confirmed it.

## Final QA

After every selected task has passed its test gate, set the phase to `audit` and run `/dev-audit` over the selected change range. This ingests an existing matching review or runs one when none exists, so the audit register is current. Read the selected review report and the register before starting QA.

- **No review report:** if `.konteksto/reviews/` holds no report covering the selected range, the audit has not run. Do not read an empty `audit-register.md` as a clean result: both files being empty is one fact stated twice, and it is that nobody has looked. What happens next depends on whether this session may run `/dev-audit` at all:
  - **It may:** run it, wait for the report it produces, and carry on through this gate.
  - **It may not, because another window owns that step:** leave the phase at `audit`, write `Next action` as `/dev-audit <selected range>`, and record in Last observed result that no report exists yet and the audit is owed. Then stop. **This is a handoff, not a block.** `blocked` means nobody can proceed without a person, and it stops a harness from dispatching anything at all, so using it here would leave the reviewer waiting for a route the coordinator is forbidden to send.

  **Do not hand back with `Next action` unchanged and nothing recorded.** The phase alone cannot tell audit owed from audit done, and across two windows that becomes a cycle where each side correctly refuses and neither reports it. `Next action` plus Last observed result is what carries the difference.
- **Degraded review:** if the report does not prove a reviewer model different from the author model, set the phase to `blocked`, preserve that fact and the report path in loop state, and stop. A degraded review may record findings, but its absence of findings cannot clear the selected range. Resume only after `/dev-check review` runs on a contrasting model for the current diff.
- **Open review finding:** for an open or reopened Blocker or Major in the selected range, follow the exact route only when its Task is a real task ID and the route is `/dev-debug <AUD-ID>` or `/dev-develop <task ID>`. Record the audit ID, route, and evidence in Attempt history. After the corrective work, run verification, tests, and `/dev-audit <linked task>` again before returning to this gate. If its Task is `—`, its route is absent, or its route names an owner outside this loop, set the run to `blocked`, preserve the exact route and ownership gap in loop state, and stop for that owner or a person to resolve it. Do not begin or complete final QA while such a finding remains.
- **No blocking review finding:** set the phase to `qa` and run `/dev-qa` without an argument.

- **All pass:** complete the run. If QA reports no eligible bugs, say that the audit ran, no runtime bug had a regression case, and no open Blocker or Major remained in the selected range; do not describe it as a QA pass.
- **A regression fails:** set the current task to the audit issue's linked task, increment that task's `/dev-debug` count and Total repair attempts this run, and stop if either cap is reached. Otherwise run `/dev-debug <AUD-ID>`. Then run `/dev-check verify <linked task>`, `/dev-test`, `/dev-audit <linked task>`, and `/dev-qa <AUD-ID>` in that order. The targeted QA run sets the issue to `verified` on PASS; then return to final QA for the remaining register.
- **QA is blocked:** preserve the audit ID and blocker in loop state, then stop. A blocked regression cannot be treated as a passed task.

The repair path applies even when the audit issue came from an earlier task. Do not drop it merely because the selected task list has already completed.

## Finish

When all selected tasks pass, set `Current task` to `none`, `Phase` to `complete`, and `Next action` to `none`. Report the completed task IDs and the verification and test evidence for each.
