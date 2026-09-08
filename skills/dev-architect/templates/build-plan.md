# Build Plan

*Purpose: the ordered, phased list of build tasks for the whole project, each one visible and testable before the next starts. Every task states its goal and its UI and Logic subtask goals, including the architecture commitments it must deliver. Shown here with one demonstrative phase and one demonstrative task rather than an invented full project history.*

## Core Principle

*Purpose: the one fixed rule every phase and task below must obey, stated once so it never has to be repeated per task.*

<CORE_BUILD_PRINCIPLE_STATEMENT>

---

## Phase 1 — <PHASE_NAME>

*Purpose: a named group of related tasks built in order, so the plan reads as milestones rather than one flat task list.*

### 01 <TASK_NAME>

**Goal:** <TASK_ONE_LINE_GOAL>

**UI subtask goals:**

- <CHECKABLE_UI_OUTCOME>

**Logic subtask goals:**

- <CHECKABLE_LOGIC_OUTCOME_WITH_RELEVANT_ARCHITECTURE_NAMES>

Repeat one `### NN <TASK_NAME>` subsection per task in the phase. Give every task one `**Goal:**` sentence, then a `**UI subtask goals:**` and/or `**Logic subtask goals:**` bullet list, keeping only the tracks that apply. Repeat one `## Phase N — <PHASE_NAME>` section per phase in the project.

The Goal says the observable outcome of the whole task. Each subtask goal is a checkable result needed to reach it, not a vague activity. Name every relevant stack component, runtime, protocol, boundary, invariant, security rule, and operator obligation from `architecture.md` exactly. Do not replace an approved name with a generic category. If the architecture says `OpenSwoole 26.2`, the task that establishes or uses it says `OpenSwoole 26.2`, not only `realtime service`.

Before the plan is complete, account for every feature in scope and every build affecting commitment in `architecture.md`. Each must appear in at least one task Goal or subtask goal. Put a project wide rule in Core Principle as well, but do not use Core Principle as a substitute for naming it in the tasks that must deliver or preserve it.

## Feature Count

*Purpose: a running total of tasks per phase, so the plan's scope stays visible at a glance as it grows.*

| Phase | Features |
| --- | --- |
| Phase 1 — <PHASE_NAME> | <COUNT> |
| **Total** | **<TOTAL_COUNT>** |
