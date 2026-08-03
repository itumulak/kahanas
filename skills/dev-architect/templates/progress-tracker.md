# Progress Tracker

*Purpose: the live state of the build, so any agent picking up the project mid session immediately knows what is done, what is in progress, and what is next. This file keeps its exact original structure (Current Status, a checklist Progress section mirroring build-plan.md's phases, Decisions Made During Build), shown here with one demonstrative phase and one demonstrative decision rather than an invented full project history.*

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

**`/dev-develop` is the only skill that writes here.** What was run and what it proved goes in `note-registry.md` instead, which `/dev-develop`, `/dev-check`, and `/dev-debug` all append to. One owner here, three there, and the split is deliberate: it keeps this file's ticks meaning one thing said by one skill.

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
