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

## State and ownership

This skill owns `.konteksto/loop-state.md`. Create it from `templates/loop-state.md` only when a run begins. Update it after every phase transition and before any session boundary. It must never edit application code, `progress-tracker.md`, `decision-log.md`, `audit-register.md`, design records, test files, or a subskill's artifact.

The build plan and progress tracker remain the source of truth for task status. This file records only loop control state, so a fresh agent can resume without guessing whether testing was completed.

## Select the work

1. Read `.konteksto/build-plan.md`, `.konteksto/progress-tracker.md`, and an existing `.konteksto/loop-state.md` when present.
2. With an argument, resolve every named ID or inclusive range, such as `01-05`, against the build plan. Reject an unknown or ambiguous selector before changing code. Run only the resolved tasks, in plan order.
3. Without an argument, continue the selected task list in `loop-state.md` when it is active. Otherwise select the next unfinished task from the build plan.
4. Never add adjacent tasks merely because they look related.

## Run one task

For the current task, keep the state file current and perform exactly one phase at a time.

1. **Develop.** Run `/dev-develop <task ID>`. Respect its gates and stop if it routes to an owner such as `/dev-architect` or `/dev-design`.
2. **Verify.** Run `/dev-check verify <task ID>`. A pass advances to test. On a failure, preserve the verifier's route in Attempt history with its observed evidence. A behavioral failure increments that task's `/dev-debug` repair count and the run total, then advances to debug. A promised but missing or built but not live surface increments its `/dev-develop` repair count and the run total, then returns to `/dev-develop <task ID>`. A prototype that is wrong or silent routes to `/dev-design`.
3. **Debug.** Run `/dev-debug <task ID>`, then return directly to verify.
4. **Test.** Run `/dev-test`. A passing suite completes the task. If the suite exposes a defect, count it against that task's `/dev-debug` route and the run total, record the failing evidence in Attempt history, run `/dev-debug <task ID>`, then verify and test again. If `/dev-test` reports that this project intentionally has no test runner, the Definition of Done in `code-standards.md` is the implementation gate and the task completes once it passes.
5. Do not change a task's repair route without new observed evidence from its verifier, test, or audit result. Record that evidence and the new route in Attempt history. At ten failed attempts for one task and route, or thirty repairs across the whole run, set the phase to `blocked`, preserve the decisive evidence, and stop. Do not start another selected task.

Do not call a task passed from a clean build alone. It passes only after observed verification and the required test gate both pass.

## Session boundaries

After each completed task, record the next task and exact next action in `loop-state.md`.

Continue with the next selected task in the current session. A fresh session is used only when the user or host explicitly starts one; it resumes from the saved state. Do not claim that a fresh session was created unless the host confirmed it.

## Final QA

After every selected task has passed its test gate, set the phase to `audit` and run `/dev-audit` over the selected change range. This ingests an existing matching review or runs one when none exists, so the audit register is current. Read the selected review report and the register before starting QA.

- **Degraded review:** if the report does not prove a reviewer model different from the author model, set the phase to `blocked`, preserve that fact and the report path in loop state, and stop. A degraded review may record findings, but its absence of findings cannot clear the selected range. Resume only after `/dev-check review` runs on a contrasting model for the current diff.
- **Open review finding:** for an open or reopened Blocker or Major in the selected range, follow the exact route only when its Task is a real task ID and the route is `/dev-debug <AUD-ID>` or `/dev-develop <task ID>`. Record the audit ID, route, and evidence in Attempt history. After the corrective work, run verification, tests, and `/dev-audit <linked task>` again before returning to this gate. If its Task is `—`, its route is absent, or its route names an owner outside this loop, set the run to `blocked`, preserve the exact route and ownership gap in loop state, and stop for that owner or a person to resolve it. Do not begin or complete final QA while such a finding remains.
- **No blocking review finding:** set the phase to `qa` and run `/dev-qa` without an argument.

- **All pass:** complete the run. If QA reports no eligible bugs, say that the audit ran, no runtime bug had a regression case, and no open Blocker or Major remained in the selected range; do not describe it as a QA pass.
- **A regression fails:** set the current task to the audit issue's linked task, increment that task's `/dev-debug` count and Total repair attempts this run, and stop if either cap is reached. Otherwise run `/dev-debug <AUD-ID>`. Then run `/dev-check verify <linked task>`, `/dev-test`, `/dev-audit <linked task>`, and `/dev-qa <AUD-ID>` in that order. The targeted QA run sets the issue to `verified` on PASS; then return to final QA for the remaining register.
- **QA is blocked:** preserve the audit ID and blocker in loop state, then stop. A blocked regression cannot be treated as a passed task.

The repair path applies even when the audit issue came from an earlier task. Do not drop it merely because the selected task list has already completed.

## Finish

When all selected tasks pass, set `Current task` to `none`, `Phase` to `complete`, and `Next action` to `none`. Report the completed task IDs and the verification and test evidence for each.
