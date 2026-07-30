# Build Plan

*Purpose: the ordered, phased list of build tasks for the whole project, each one visible and testable before the next starts. This file keeps its exact original structure (Core Principle, numbered phases, numbered tasks with UI/Logic bullets, a closing Feature Count table), shown here with one demonstrative phase and one demonstrative task rather than an invented full project history.*

## Core Principle

*Purpose: the one fixed rule every phase and task below must obey, stated once so it never has to be repeated per task.*

<CORE_BUILD_PRINCIPLE_STATEMENT>

---

## Phase 1 — <PHASE_NAME>

*Purpose: a named group of related tasks built in order, so the plan reads as milestones rather than one flat task list.*

### 01 <TASK_NAME>

<TASK_ONE_LINE_DESCRIPTION>

**UI:**

- <UI_BUILD_ITEM>

**Logic:**

- <LOGIC_BUILD_ITEM>

---

Repeat one `### NN <TASK_NAME>` subsection per task in the phase, each with a `**UI:**` and/or `**Logic:**` bullet list (only the ones that apply to that task). Repeat one `## Phase N — <PHASE_NAME>` section per phase in the project.

## Feature Count

*Purpose: a running total of tasks per phase, so the plan's scope stays visible at a glance as it grows.*

| Phase | Features |
| --- | --- |
| Phase 1 — <PHASE_NAME> | <COUNT> |
| **Total** | **<TOTAL_COUNT>** |
