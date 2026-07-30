# Progress Tracker

*Purpose: the live state of the build, so any agent picking up the project mid session immediately knows what is done, what is in progress, and what is next. This file keeps its exact original structure (Current Status, a checklist Progress section mirroring build-plan.md's phases, Decisions Made During Build, Notes), shown here with one demonstrative phase, one demonstrative decision, and one demonstrative note rather than an invented full project history.*

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

*Purpose: the three line answer to "where are we right now," so a new session never has to reconstruct it by reading the whole Progress checklist below.*

**Phase:** <CURRENT_PHASE_NAME_AND_STATE>
**Last completed:** <LAST_COMPLETED_TASK>
**Next:** <NEXT_TASK_OR_ACTION>

---

## Progress

*Purpose: a checkbox mirror of `build-plan.md`'s phases and tasks, so completion state is visible at a glance without re reading the plan itself.*

### Phase 1 — <PHASE_NAME>

- [x] 01 <COMPLETED_TASK_NAME>
- [ ] 02 <NOT_YET_STARTED_TASK_NAME>

Repeat one `### Phase N — <PHASE_NAME>` subsection per phase in `build-plan.md`, each with one checkbox line per task in that phase, checked once built.

---

## Decisions Made During Build

*Purpose: a running log of real decisions, bugs found, and fixes made during the build, in the order they happened, so later sessions don't repeat the same investigation or silently contradict an earlier choice.*

- <DECISION_OR_BUG_OR_FIX_LOG_ENTRY>

---

## Notes

*Purpose: the exact commands used to confirm the build is currently clean, so a new session can re run the same checks instead of inventing its own.*

- <TOOLCHAIN_OR_LINT_CHECK_COMMAND_AND_RESULT>
