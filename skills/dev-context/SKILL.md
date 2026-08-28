---
name: dev-context
allowed-tools: Bash, Read, Grep, Glob
description: "Run /dev-context to establish project context before development, verification, or a handoff. Reads the project records in their required order, identifies the active task and governing decisions, then follows their ownership and workflow rules."
---

## What this skill does

The context entry point for a fresh agent or a task that needs a complete project view. It reads the project records in a fixed order, so the plan, current state, and documented decisions are interpreted against the architecture and standards that govern them.

This skill is read only. It does not repair stale documents or change code. Report contradictions with the document and owner that must resolve them.

## Read in this order

Read each existing item completely before moving to the next:

1. `.konteksto/architecture.md`
2. `.konteksto/tooling.md`
3. `.konteksto/code-standards.md`
4. `.konteksto/library-docs.md`
5. `.konteksto/build-plan.md`
6. `.konteksto/progress-tracker.md`
7. `.konteksto/decision-log.md`
8. `.konteksto/note-registry.md`
9. `.konteksto/ui-registry.md`
10. The approved design, as identified by `build-plan.md`, `project-overview.md`, or the design registry.

If a required record is absent, do not invent it. State which record is missing and use the owning workflow to resolve it. If no approved design applies to the active task, say so and route UI work to `/dev-design`.

## Establish the active context

After reading, identify:

- the project shape, runtime, and verification commands
- the active or next task, its dependencies, and its progress and verification state
- the decisions and terminology that constrain that task
- the approved design surface, when the task has UI work
- document ownership and the next valid workflow step

Read `.konteksto/loop-state.md` after the required records when it exists. It is supplemental execution state, not a replacement for the progress tracker.

## Apply the protocols

Follow the ownership, approval, and routing rules recorded in the documents. In particular:

- Build only the active task and do not make load bearing decisions without the documented owner.
- Treat a `DONE` status as a build claim, not acceptance proof. A `PASSED` Verify Check is the observed runtime signal.
- Do not edit records owned by another workflow merely to remove a contradiction.
- Preserve the approved design boundary for UI work.

Finish with a concise context brief: active task, current phase, governing constraints, applicable design, blockers, and next valid skill. Do not claim verification or approval that the records do not support.
