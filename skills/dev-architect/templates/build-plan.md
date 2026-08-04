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

### Checkpoint

*Purpose: what a reviewer other than the builder must confirm before this phase is considered sound. Optional: only present when Team Shape in `project-overview.md` says checkpoints are on. Repeat one Checkpoint block per phase, as the last subsection of that phase.*

- <WHAT_A_REVIEWER_MUST_CONFIRM>

**Needs test coverage:** <WHAT_SHOULD_BE_COVERED_OR_NONE>

This block **names** what needs covering; it does not write tests. `/dev-test` owns every test file, and a checkpoint writing its own would put a second writer on them. Run `/dev-test` against this line.

Review state is tracked in `progress-tracker.md`'s Checkpoints table, not here. This block is the criteria and does not change once the phase is planned.

---

Repeat one `### NN <TASK_NAME>` subsection per task in the phase, each with a `**UI:**` and/or `**Logic:**` bullet list (only the ones that apply to that task). Repeat one `## Phase N — <PHASE_NAME>` section per phase in the project, and where checkpoints are on, its own Checkpoint block as that phase's last subsection.

## Feature Count

*Purpose: a running total of tasks per phase, so the plan's scope stays visible at a glance as it grows.*

| Phase | Features |
| --- | --- |
| Phase 1 — <PHASE_NAME> | <COUNT> |
| **Total** | **<TOTAL_COUNT>** |
