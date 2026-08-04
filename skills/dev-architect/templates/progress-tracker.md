# Progress Tracker

*Purpose: the live state of the build, so any agent picking up the project mid session immediately knows what is done, what is in progress, and what is next. This file keeps its exact original structure (Current Status, a checklist Progress section mirroring build-plan.md's phases, Decisions Made During Build), shown here with one demonstrative phase and one demonstrative decision rather than an invented full project history.*

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

**`/dev-develop` is this file's builder.** `/dev-sync` may also correct it, but only from repo evidence, after the fact, never during a build. What was run and what it proved goes in `note-registry.md` instead, which `/dev-develop`, `/dev-check`, and `/dev-debug` all append to. One builder here, three appenders there, and the split is deliberate: it keeps this file's ticks meaning one thing said by one skill while it is being built.

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

**Team projects only.** Every task line ends with an assignee in round brackets, and an unassigned task carries `(unassigned)`:

- [ ] 02 <NOT_YET_STARTED_TASK_NAME> (<GIT_USER_OR_UNASSIGNED>)

Leave this off entirely on a personal project, where every task has the same owner.

The assignee is a **convention, not a lock.** `/dev-develop` reads it and stops when a task belongs to someone else, but two people running on two machines both pass that check, and either can proceed anyway. Nothing here reserves a task. A team that needs a real guarantee wants branch protection or an issue tracker, outside these documents.

**How it changes.** `/dev-develop` writes the assignee when someone picks a task up, replacing `(unassigned)` with the git user. Any other change, meaning a reassignment, is made **by a person editing this line by hand**. No skill reassigns a task, because deciding a task should move from one person to another needs context that is not in the repository.

---

## Decisions Made During Build

*Purpose: a running log of real decisions, bugs found, and fixes made during the build, in the order they happened, so later sessions don't repeat the same investigation or silently contradict an earlier choice.*

- <DECISION_OR_BUG_OR_FIX_LOG_ENTRY>

---

## Checkpoints

*Purpose: the review state of each finished phase, so a later session can see which phases a second pair of eyes has actually signed off and which are still waiting. Optional: only present when Team Shape in `project-overview.md` says checkpoints are on.*

| Phase | State | Approved by | Outstanding |
| --- | --- | --- | --- |
| Phase 1 — <PHASE_NAME> | <NOT_DUE_OR_DUE_OR_APPROVED> | <NAME_AND_ROLE_PER_APPROVER_OR_NONE> | <WHAT_WAS_RAISED_AND_NOT_YET_ADDRESSED_OR_NONE> |

One row per phase in `build-plan.md`. What each phase's reviewer must confirm lives in that phase's Checkpoint block in `build-plan.md`, not here. This table only tracks state.

**State** is one of three. `not due` means the phase still has unticked tasks. `due` means every task in the phase is ticked and nobody has approved yet. `approved` means a reviewer other than the builder confirmed the phase against its criteria.

**Approved by** carries each approver's name and their role in brackets, as `Sam (project manager), Ali (developer)`. **The role is written by the approver, about themselves, at the moment they approve.** It is recorded here rather than looked up because there is nowhere to look it up: role is per person, so it is never committed, and a reader months later has no way to recover who held which role at the time. A self recorded role is accurate the day it is written and stays accurate afterwards.

Where a project wants a project manager's sign off and only developers have approved, that is visible directly in this column, and it belongs in Outstanding until it happens.

**Checkpoints are non blocking.** A phase sitting at `due` does not stop the next phase starting. It is a flag, and the Outstanding column is what a later session reads to see what was raised and never dealt with. Addressing an outstanding item before building on top of it is the recommendation, not a rule.

**Who writes here.** `/dev-develop` moves a row from `not due` to `due` when it ticks the last task in a phase, which is the one transition the repository can prove. **Approvals are recorded by a person**, because an approval is a claim that a human reviewed something, and no skill may write one. A skill that filled in its own approval would defeat the entire point of having a checkpoint.
