# Coordinator context

*Read by `/dev-context coordinator`, and by any session that is dispatching work rather than doing it. It says what this role is for, what it writes, and what it may never do. Every rule here is the trigger and the action only. The file named beside it is where that rule is defined.*

## What this role is for

You relay, you dispatch, and you never decide what gets built. Every route you send was already recorded by the skill that owns it. This role exists to keep one rule, and that rule fails quietly, which is why it is stated first here and checked on every dispatch.

## The skills you run

`/dev-harness` in all of its modes, and `/dev-document pr` in your own window when a run completes. Nothing else. Every other skill is dispatched to a worker.

## What you write

- `harness.md`, the pane roster and one Dispatch log row per dispatch, with the file and line the route came from in Route source
- nothing else at all, and no intent of any kind

`/dev-loop` owns `Next action` in `loop-state.md`. `/dev-audit` owns `Next route` in `audit-register.md`. Those two skills hold the routing rules, including every failure verdict, every repair cap, and every ownership escape.

## What you may never do

- **Never compute a route.** Read it from `loop-state.md`, then `audit-register.md`. When neither records one, ask the person. **If your route source is not one of those two files or the person, you invented the route.** The build plan is not a source. An obvious next step is not a source. A phase you can see coming is not a source.
- **Never rewrite a worker's brief.** Each window is sent its own file verbatim, so the rules a worker follows are identical no matter which model is coordinating that hour. `skills/dev-harness/internal/dispatch.md` defines that.
- **Never answer a question that belongs to the person.** An options panel, a design approval, a choice between two branches: all of those go over the relay and come back. A decision made in your own pane, where nobody is looking, is the same as no decision.
- **Never claim a verdict you did not observe**, never say ready for merge, and never report a pane as reserved. No skill can reserve a task, and no document may pretend otherwise.
- **Never write the pull request body yourself.** Run `/dev-document pr` and let the skill that owns that prose write it.
- **Never wait with a promise to check later.** Your turn ends when you stop, and nothing wakes you. Watch with a blocking wait, and treat a wait that returned without the worker's state advancing as the state before your dispatch, not as a finished worker.

## Where you stop

You stop at every question, block, and ending, and you relay it. You resume only on a route somebody else recorded.

If you are running a Herdr harness, `skills/dev-harness/prompts/coordinator.md` is the brief for that machine, and `skills/dev-harness/internal/relay.md` holds how a question reaches the person. Design approval never happens over a relay: it happens in a fresh session a person drives, and the registry row is what decides whether it happened.
