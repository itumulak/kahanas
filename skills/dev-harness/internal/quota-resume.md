# Quota resume (a worker that ran out, and when to wake it)

Read this at each watch cycle when Quota resume is `on`.

## What can honestly be observed

Herdr reports a pane lifecycle: `idle`, `working`, `blocked`, `done`, `unknown`. There is no token counter and no usage API. So the harness never claims to track token usage. What it can do is read the pane and recognize that the agent itself said it is out, then wake it when the time that agent printed has passed.

Say it that way in every report. "Developer is out of quota until 14:00, as its own output stated" is true. "Developer has 12 percent of its tokens left" is not something this skill can know, and a number nobody measured reads exactly like one somebody did.

## Detect

At each watch cycle, for a worker that is `idle`, `done`, or `unknown` without having reported back:

```bash
herdr agent read <agent name> --source recent-unwrapped --lines 60
```

If that comes back empty, read `--source visible` instead. An empty read is a failed read, and treating it as a quiet pane would miss a worker that is out.

Match the text against these, and against any Extra quota patterns in `.konteksto/harness.md`:

- `usage limit reached`
- `rate limit`
- `quota`
- `resets at`
- `try again at`
- `out of credits`

A match is a candidate, not a verdict. Read the surrounding lines and confirm the agent is refusing work rather than quoting one of those words back from the code it was reading. A worker that is genuinely out sits idle with that message as its last output.

## Resume

1. Take the reset time from the worker's own output. **Never estimate one.** If the output gives no time, notify the person that the worker is out with no stated reset, and stop watching that worker.
2. Record the worker, the quoted line, and the reset time in the Dispatch log.
3. Notify the person once, with the reset time.
4. Wait until that time has passed by the system clock, then check the pane again before sending anything.
5. Re dispatch the route currently recorded in its file, not the one that was in flight when the quota ran out. The recorded route may have moved while the worker was down.

While one worker waits on quota, the other keeps running if it has a recorded route of its own. A quota block on the developer does not stop a review already dispatched to the reviewer.

## Never

Do not restart a worker to clear a quota block, and do not start a second agent of the same kind to work around it. Both spend the same quota and neither is what the person asked for. **The agent may offer you the downgrade itself, and that is still a no.** A worker that hits its limit can present a cheaper model as the way to carry on, one keystroke away, at the exact moment the run is stuck and the cheap option looks like the helpful one. This project's own demo hit it: the reviewer stopped on a usage limit and offered its small fast tier in the same breath. Accepting rewrites the model recorded in the roster with nobody deciding to, and the review that follows is quietly worth less than the one the person configured. Decline it, take the reset time, and wait.

Do not switch a worker to a different model to keep going. The developer and reviewer models are recorded for a reason, and changing one silently breaks the different model guarantee that `/dev-check review` and `/dev-audit` depend on. Moving a role up its ladder is a different act, with its own trigger and its own collision check, and `internal/escalation.md` holds it. A worker that ran out of quota has not failed at anything.
