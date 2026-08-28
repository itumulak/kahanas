---
name: dev-loop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-loop to complete one or more build plan tasks through /dev-develop, /dev-check verify, and /dev-test. Recovers verification failures through /dev-debug, persists the handoff state, and stops only after all selected tasks pass or one task reaches ten failed attempts."
---

## What this skill does

The task runner for the delivery chain. It completes one task at a time, in build plan order, through this sequence:

```
/dev-develop  →  /dev-check verify  →  /dev-test
```

Verification is the acceptance gate. If it fails, run `/dev-debug`, then return to `/dev-check verify`. Do not send a failed verification back to `/dev-develop`: that skill has already marked the task `DONE`, while `/dev-debug` owns the smallest corrective fix.

The runner selects only the tasks named in its argument. A bare `/dev-loop` resumes its saved state, or starts the next unfinished task in `.konteksto/build-plan.md` when there is no saved run.

## State and ownership

This skill owns `.konteksto/loop-state.md`. Create it only when a run begins. Update it after every phase transition and before any session boundary.

Keep these fields in it:

```md
# Dev loop state

- Selected tasks: <ordered task IDs>
- Current task: <task ID or none>
- Phase: <develop | verify | debug | test | complete | blocked>
- Failed attempts for current task: <0 to 10>
- Last observed result: <short evidence based summary>
- Next action: <exact skill invocation>
```

The build plan and progress tracker remain the source of truth for task status. This file records only loop control state, so a fresh agent can resume without guessing whether testing was completed.

## Select the work

1. Read `.konteksto/build-plan.md`, `.konteksto/progress-tracker.md`, and an existing `.konteksto/loop-state.md` when present.
2. With an argument, resolve every named ID or inclusive range, such as `01-05`, against the build plan. Reject an unknown or ambiguous selector before changing code. Run only the resolved tasks, in plan order.
3. Without an argument, continue the selected task list in `loop-state.md` when it is active. Otherwise select the next unfinished task from the build plan.
4. Never add adjacent tasks merely because they look related.

## Run one task

For the current task, keep the state file current and perform exactly one phase at a time.

1. **Develop.** Run `/dev-develop <task ID>`. Respect its gates and stop if it routes to an owner such as `/dev-architect` or `/dev-design`.
2. **Verify.** Run `/dev-check verify <task ID>`. A pass advances to test. A failure increments `Failed attempts for current task`, records the checker evidence, and advances to debug.
3. **Debug.** Run `/dev-debug <task ID>`, then return directly to verify. Do not rerun develop for a task already marked `DONE`.
4. **Test.** Run `/dev-test`. A passing suite completes the task. If the suite exposes a defect, count it as a failed attempt, record the failing evidence, run `/dev-debug <task ID>`, then verify and test again. If `/dev-test` reports that this project intentionally has no test runner, its configured gate is sufficient and the task completes once that gate passes.
5. At ten failed attempts, set the phase to `blocked`, preserve the decisive evidence, and stop. Do not start another selected task.

Do not call a task passed from a clean build alone. It passes only after observed verification and the required test gate both pass.

## Session boundaries

After each completed task, record the next task and exact next action in `loop-state.md`.

If the host can create and start a new agent session programmatically, start a fresh session with `/dev-loop` and let it resume the saved state. If it cannot, continue with the next selected task in the current session. Do not claim that a fresh session was created unless the host confirmed it.

The saved state is mandatory in both cases. It makes the workflow portable across Codex, Claude Code, OpenCode, and any host that cannot delegate session creation to a skill.

## Finish

When all selected tasks pass, set `Current task` to `none`, `Phase` to `complete`, and `Next action` to `none`. Report the completed task IDs and the verification and test evidence for each.
