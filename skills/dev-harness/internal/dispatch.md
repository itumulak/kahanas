# Dispatch (how the coordinator turns a recorded route into a prompt)

Read this at the dispatch step of `modes/start.md`. It holds the one rule this skill exists to keep, plus the exact Herdr calls.

## The rule

**The coordinator dispatches a route that another skill already recorded. It never computes one.**

`/dev-loop` owns `Next action` in `.konteksto/loop-state.md`. `/dev-audit` owns `Next route` in `.konteksto/audit-register.md`. Those two skills hold the routing rules, including every failure verdict, every repair cap, and every ownership escape. If this skill read a review report and decided between `/dev-debug` and `/dev-loop` on its own, the project would carry two copies of the same routing rules, and the copy nobody edits is the one that goes wrong.

When no route is recorded, the harness asks a person. It does not choose.

## Read the route

Read in this order and stop at the first that applies.

1. `.konteksto/loop-state.md`, when it exists. Take `Phase`, `Current task`, and `Next action` exactly as written.
2. `.konteksto/audit-register.md`, when loop state is absent or its `Next action` is `none` while open findings remain. Take `Next route` from the highest severity open or reopened issue, and its `Task`.
3. Nothing recorded. Ask a person which tasks to run. Their answer is the route.

## Route to a window

Match the recorded action to the role whose Skills allowed column in `.konteksto/harness.md` contains it.

| Recorded action | Window |
| --- | --- |
| `/dev-loop`, with or without a selector | developer |
| `/dev-develop <task>` | developer |
| `/dev-check verify <task>` | developer |
| `/dev-debug <task or AUD-ID>` | developer |
| `/dev-design <surface>` | developer |
| `/dev-test` | developer |
| `/dev-check review` | reviewer |
| `/dev-audit <task>` | reviewer |
| `/dev-qa` or `/dev-qa <AUD-ID>` | reviewer |

If the recorded action names a skill that no roster row allows, the harness does not run it anywhere. Report the action and the ownership gap to the person and stop. `/dev-scope` and `/dev-architect` are the usual cases: they settle product and technical intent, and no window in this roster may hold that.

If `Phase` is `blocked`, do not dispatch. Escalate the preserved evidence to the person and stop.

If `Phase` is `complete` and `Next action` is `none`, the selected work is finished. Report the phase as done and stop.

## The audit handoff

`/dev-loop` runs develop, verify, and test itself, then reaches its own audit gate. That gate needs a review from a model that did not write the code, which is the whole reason the reviewer window exists. So the developer dispatch tells `/dev-loop` to hand back when it reaches that gate, and the coordinator dispatches the audit to the reviewer window instead.

This assigns who runs a step. It does not change what the step is, or what `/dev-loop` does with the result.

After the reviewer finishes, dispatch a bare `/dev-loop` to the developer. It resumes from its own saved state with a current audit register, and continues to QA or to the repair route it recorded.

## A route you just completed is stale

**Never dispatch the same action twice in a row.** A worker that finished `/dev-audit 01-02` leaves `Next action` in `loop-state.md` still naming `/dev-audit 01-02`, because the skill that owns that line was not the skill that ran. A coordinator that only re reads and dispatches would send it again, and again.

So before every dispatch, compare the route to the last completed row in the Dispatch log. If they match, the route is stale and its owner has not recomputed it yet:

- After the reviewer completes an audit, the audit handoff below says what to send: a bare `/dev-loop` to the developer.
- In any other case, ask the person. A stale route is not permission to guess the next one.

## Send it

Never use `--wait` for a build phase. A coordinator blocked inside `agent prompt` cannot read what the person sent, cannot notice a quota block, and cannot answer a question the worker is stuck on. Dispatch, then watch.

```bash
herdr agent prompt <agent name> "<wrapped prompt>"
```

**Translate the skill prefix for the receiving agent.** A route is recorded as `/dev-audit 01`, because that is how Claude Code names a skill. Other agents do not use that prefix, and the dispatch is rejected rather than run. In this project's own demo Codex answered a slash route with `Unrecognized command '/dev-audit'` and did nothing else, while the send itself reported success and the dispatch log recorded a dispatch.

| Kind | Prefix | Example |
| --- | --- | --- |
| `claude` | `/` | `/dev-audit 01` |
| `codex` | `$` | `$dev-audit 01` |

For any other kind, check how that agent invokes a skill before dispatching to it, and record what you found in the roster row. Never assume the recorded slash works.

This is a translation at send time and nothing more. The route itself, and the file it came from, do not change.

**A successful send is not a started job, so read the pane after dispatching.** `agent prompt` reports success once the text is delivered, which says nothing about what the agent did with it. The rejection lives in the pane, not in the send result. An empty input box is not evidence either way: the agent may have taken the prompt and refused it, and the same blank pane appears when it is quietly working.

The wrapped prompt is the recorded action plus the hand back instruction, and nothing else. Do not add advice about how to do the work. That would be this skill creating intent through the back door.

```
<recorded action>

You are running inside a harness. Two rules for this run:
1. When `Phase` in .konteksto/loop-state.md reaches `audit`, stop and report back. The reviewer window runs that step.
2. When the command above stops for any reason, including a block, a question you cannot answer, or a completed phase, report back before doing anything else.

Report back by running exactly this, filling each field from what you observed:

herdr agent prompt <coordinator agent name> "HARNESS REPORT | from: <role> | ran: <the command above> | stopped at: <phase or step> | next action: <the Next action line from .konteksto/loop-state.md, or the Next route from .konteksto/audit-register.md, or none> | evidence: <one line>"

Do not start the next command yourself. Do not dispatch to another pane.
```

Append one Dispatch log row in `.konteksto/harness.md` before you send, with the file the route came from in Route source.

**Resolve the timestamp before writing it.** Read the clock, then write the value it returned. A row carrying an unexpanded `$(date ...)` instead of a time is worse than a row with no time at all, because it looks like a record until somebody tries to order two of them. This project's own demo produced exactly that row.

## Watch

**An agent cannot wake itself.** A turn ends and nothing schedules the next one, so a plan to check again in thirty seconds is a plan the coordinator cannot keep: it says it will look later, stops, and the run sits still with a worker blocked on a question nobody sees. This project's own demo did exactly that.

So the watch is a blocking wait inside one turn, not a promise to return. Wait for the worker to leave `working`, with a timeout short enough to check the relay in between:

```bash
herdr agent wait <agent name> --timeout 60000
```

That returns as soon as the worker settles into `idle`, `done`, or `blocked`, and returns on the timeout otherwise. On a timeout, check the relay and any quota output, then wait again. Keep looping in this turn until the worker settles, the person stops the run, or the recorded phase ends the cycle.

Then read what state it settled into:

```bash
herdr agent get <agent name>
```

- `working`: nothing to do.
- `blocked`: Herdr recognized an approval or question dialog. Read it with `herdr agent read <agent name> --source recent-unwrapped --lines 60`, relay it to the person, and send only the answer they give. Never answer it yourself.
- `idle` or `done` with no hand back report: read the pane. If the worker finished but did not report, take the route from `loop-state.md` yourself rather than guessing from the pane text.
- `unknown`: this does not prove the worker finished. Read the pane before treating it as anything.

**`recent-unwrapped` can come back empty.** It has on a plain shell pane in this project's own demo. When it does, read `--source visible` before concluding the pane said nothing. An empty read is a failed read, not silence.

**Match on something only the result prints.** `pane wait-output` and its agent equivalent search a snapshot that already holds the command text you just sent, so matching a word that appears in your own prompt returns immediately and you carry on before the worker has done anything. Match a token the worker prints when it is actually finished.

Check for anything the person sent in the same cycle, as `internal/relay.md` describes. Check for a quota block as `internal/quota-resume.md` describes.

## What a hand back does

1. Append the Observed result to the open Dispatch log row. **Rewrite that one row.** Do not reach for a substitution across the file: a blind replace of a word like `dispatched` hits every row that ever carried it, and the log is the one file here whose whole value is that old rows do not change. Read the row, write the row.
2. Re read the route from its file. The report is a notice that something changed, not the route itself. A worker that misreports its next action must not be able to steer the run.
3. Dispatch the next recorded route, or notify the person that the phase is done, or escalate.
