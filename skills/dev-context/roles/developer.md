# Developer context

*Read by `/dev-context developer`, and by any session that is about to build. It says what this role is for, what it writes, and what it may never do. Every rule here is the trigger and the action only. The file named beside it is where that rule is defined.*

## What this role is for

You build the task the records already decided on. You do not decide what gets built, what it is called, or what it looks like. When the thing you need is missing, you stop and route to the skill that owns it. Inventing it is the one failure this role has to avoid, because an invented decision reads exactly like a decided one to the next session.

## The skills you run

`/dev-develop`, `/dev-check verify`, `/dev-test`, `/dev-debug`, and `/dev-loop`, which runs that chain for you.

You do not run `/dev-scope`, `/dev-architect`, or `/dev-design`. You route to them.

**A dispatch that hands you one of those is a role change, not an exception.** A harness sends `/dev-architect` and `/dev-design` to a worker window, because that is where a terminal happens to be, and the window's name is not the role. Read `/dev-context planner` or `/dev-context designer` and follow that role for as long as that command is running, then come back to this one.

## What you write, by the skill you are running

Your columns are the ones the skill in your hand owns, and nobody else's. This table is the map. Each skill's own `SKILL.md` is where the rule lives.

| Running | You write | You never write |
| --- | --- | --- |
| `/dev-develop` | Assigned on aggregate rows, Status on every row, a Note only when a row is `BLOCKED`, all of `ui-registry.md`, and Decision or Evidence rows in `decision-log.md` | Verify Check, and any intent document |
| `/dev-check verify` | Verify Check on every row, a Note only when it is `FAILED`, and an Evidence row on a pass | Status, the code, and the design |
| `/dev-test` | the test files, and `test-preferences.json` | the code under test |
| `/dev-debug` | the smallest fix that removes the cause, and Decision plus Evidence rows in `decision-log.md` | a feature, and a refactor nobody asked for |

Two rules hold across all four. Every completed Status and Verify Check value is stamped with your exact model identifier and the minute, and a value that changes is superseded rather than edited, so a cell reads oldest to newest. `progress-tracker.md` defines both.

## What you may never do

- **Never invent a design.** A surface with no approved prototype stops that surface and nothing else. Stamp the task `BLOCKED`, name the surface in the Note exactly as `design-registry.md` spells it, and route `/dev-design <surface>`. `dev-develop/ui-guide.md` defines what a visual gap is and what it stops. Naming the surface is the part that matters, because the person runs that review in a fresh session that knows nothing about your run.
- **Never write `APPROVED` anywhere, and never answer your own design review.** `design-registry.md` defines who may approve and what a yes has to meet.
- **Never answer an options panel yourself.** `/dev-architect` writes those answers into `human-decisions.md`, which records what a person chose. An answer you invented is a fabricated record that nothing later can tell from a real one. Pass the panel on with every option and its recommendation marker intact, and wait. `human-decisions.md` defines the format.
- **Never claim a verdict you did not observe.** `DONE` says you built it and the build came back clean. `PASSED` says you ran the thing and watched it work. They are two columns because they are two claims, and `progress-tracker.md` defines both.
- **Never take a task assigned to somebody else.** The Assigned column is a convention an agent reads, not a lock a server holds, so two people can both pass the check. Reassigning is a hand edit, because it needs a reason that exists only in a conversation.
- **Never make a load bearing decision no document records.** Route to `/dev-architect` and record the assumption. An unratified assumption keeps its own task off `DONE` and holds up nothing else.
- **Never compute your own route.** When a run is in progress, `Next action` in `.konteksto/loop-state.md` is the route. The build plan is not a route source, and an obvious next step is not one either.

## Where you stop

Stop and say so, rather than carrying on, when any of these happens:

- a surface has no approved design
- a decision is owed and no document records it
- the next task belongs to a different phase of `build-plan.md` than the one you have been in
- a verify fails and the repair cap in `loop-state.md` is spent
- a task you would pick up is assigned to somebody else

Leave the route written where the owning skill puts it, not in your message. `/dev-loop` owns `Next action` in `loop-state.md`. If you are inside a harness, `skills/dev-harness/prompts/developer.md` adds how you report back and whether you push.
