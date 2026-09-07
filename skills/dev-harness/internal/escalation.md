# Escalation (moving a role to a stronger model)

Read this at each watch cycle when Escalate after failed attempts is not `off`.

## What escalation is for

A role starts on the cheapest model that does its job well. When the work turns out to be harder than that model can handle, the role moves up one step rather than burning the run's repair budget on attempts that were never going to land.

The ladder is not a judgement the harness makes about quality. It is a threshold a person set at config time, compared against a count another skill already recorded.

## The trigger is a number somebody else wrote

**Never count failures yourself.** `/dev-loop` already records `Failed attempts by task and route` in `.konteksto/loop-state.md`, and it already holds the caps that stop a run. A second counter here would drift from that one, and the two would disagree exactly when a person needs to trust them.

Escalate the developer when, for the current task and route:

```
failed attempts recorded by /dev-loop  >=  Escalate after failed attempts in .konteksto/harness.md
```

The default threshold sits well below `/dev-loop`'s own cap of ten attempts on one task and route, so the stronger model gets real attempts before the run blocks. Escalating at the cap would be escalating into a stop.

Escalate the coordinator on a different trigger, since it runs no tasks: when it has failed twice to resolve the same request or route on its own, meaning it read a route it could not map, or relayed a question whose answer it could not apply. Two is the count because a third attempt at the same confusion is not thinking, it is looping.

The reviewer starts at the top already. It does not escalate to a different model. When a review needs more, raise its reasoning effort, which is the same model working harder.

## Escalations are capped

At most Escalations allowed per task, from Settings. After that, the role stays where it is and the run follows `/dev-loop`'s own cap. **Escalation is not a way around a blocked run.** A task that fails ten times on the strongest model available is telling the person something, and quietly climbing a ladder forever hides it.

A role returns to its base model when the task that escalated it completes. Otherwise one hard task makes every later task expensive.

## Before you escalate

1. **Check the collision.** If the escalation model equals the reviewer's model, refuse and say so. The developer and the reviewer must differ, and a developer that silently becomes the reviewer's model breaks a guarantee nobody would see break.
2. **Check the model exists.** If the recorded escalation model is `none`, or the agent rejects it, do not restart the worker on a guess. Notify the person and leave the role where it is.
3. **Notify, do not ask.** The person chose the ladder and the threshold at config time, so this is a step they already authorized. Say which role, which model, and which recorded count fired it. A stronger model costs more, and finding that out from a bill rather than a message is the wrong order.

## Move the model

Prefer switching inside the running session, since it keeps the worker's context:

```bash
herdr agent prompt <agent name> "/model <exact model identifier>"
```

If the agent kind has no in session switch, restart it in the same pane. Bring the pane back to a shell prompt first, then:

```bash
herdr agent start <agent name> --kind <kind> --pane <pane id> -- <model arguments>
```

**A restart loses everything the worker had in context.** That is survivable here, and only here, because the route lives in a file rather than in the worker's memory: after the restart, dispatch the currently recorded route from the start. It is not survivable in the middle of a phase whose state was never written down, so never restart a worker that is `working`.

Record the escalation in the Dispatch log with the recorded count that fired it as the Route source, and update the role's row so a later session can see which model is actually running.

## Not the same thing as a quota block

A worker that ran out of quota has not failed at anything, and moving it to a different model to keep going would break the model split for a reason that has nothing to do with the work. `internal/quota-resume.md` covers that case: wait, then resume on the same model.
