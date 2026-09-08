# Harness

*Purpose: the roster of Herdr panes this project drives, the settings that govern them, and the append only record of what was dispatched. The build plan, progress tracker, loop state, and audit register remain the source of truth for the work itself. Nothing here decides what to build or how.*

## Session

- Herdr session: <session name>
- Workspace: <w1>
- Created by config: <session|workspace|neither>
- Base branch: <main or master>
- Working branch: <the current phase branch, rewritten by the coordinator at each phase, never the base branch>
- Push on hand back: <on|off>
- Remote: <remote name, or none>
- Configured: <YYYY-MM-DD HH:MM>
- Configured by: <model identifier>
- Relay: <remote control|coordinator pane>
- Watch timeout seconds: <300 by default, the longest a person's message may go unread>
- Unattended approvals: <on|off>
- Escalate after failed attempts: <2 to 9, or off>
- Escalations allowed per task: <1 or 2>
- Quota resume: <on|off>
- Extra quota patterns: <literal strings that mean a worker is out of quota, or none>

## Roster

| Role | Agent name | Pane | Kind | Base model | Escalation model | Current model | Escalations used | Skills allowed | Prompt file | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| coordinator | coordinator | <w1:p1> | <kind> | <exact model identifier> | <exact model identifier, or none> | <what it is running right now> | <count for the current task> | /dev-harness, /dev-document pr | `prompts/coordinator.md` | <live\|missing> |
| developer | developer | <w1:p2> | <kind> | <exact model identifier> | <exact model identifier, or none> | <what it is running right now> | <count for the current task> | /dev-loop, /dev-develop, /dev-check verify, /dev-debug, /dev-design, /dev-test | `prompts/developer.md` | <live\|missing> |
| reviewer | reviewer | <w1:p3> | <kind> | <exact model identifier> | <higher reasoning effort, or none> | <what it is running right now> | <count for the current task> | /dev-check review, /dev-audit, /dev-qa | `prompts/reviewer.md` | <live\|missing> |

When Unattended approvals is `on`, every role starts with its own skip approvals flag: `--dangerously-skip-permissions` for `claude`, `--dangerously-bypass-approvals-and-sandbox` for `codex`, `--auto` for `opencode`, and `--approve` for `pi`, which is the closest Pi has rather than the same thing. Each agent then runs whatever command it decides to run, with nothing prompting first.

Base model is what a role starts on. Escalation model is what it moves to when the trigger in Settings fires, and `internal/escalation.md` holds when that is. **Current model and Escalations used are the live state, and they are why the cap and the return home can be enforced at all**: without them nothing can tell a role sitting on its escalation model from one on its base, or count how many steps this task has already spent. The coordinator rewrites both when it escalates and when it drops a role back, and resets Escalations used to zero when the task completes. Record the exact identifier the installed agent accepts, not a family name, because a name that does not resolve fails at the moment a run is already in trouble.

The developer and the reviewer must differ on both rows. **An escalation model that lands on the reviewer's model is refused**, since a developer that quietly becomes the reviewer's model destroys the one guarantee the two windows exist to provide, and it destroys it silently.

The developer model and the reviewer model must differ. `/dev-check review` is only worth running on a model that did not write the code, and `/dev-loop` blocks its final gate on a review that cannot prove the two differ. Recording both models here is what makes that structural instead of hopeful.

Skills are named differently per agent. Claude Code uses `/dev-audit 01`, Codex uses `$dev-audit 01`. The coordinator translates the recorded route to the receiving agent's prefix at send time. A wrong prefix is rejected by the receiving agent rather than run, and the send still reports success, so the pane is the only place that failure is visible.

Every window commits what it wrote before it reports back, staging paths by name, and pushes the working branch when Push on hand back is `on`, so a person can pull the run's work at any point. `internal/dispatch.md` holds the rule, including the four things a push may never do. The Working branch above is what makes both safe: it is the only branch a window pushes, and on the base branch a committed change set makes `/dev-check review` find nothing to review.

Each window is sent its Prompt file verbatim beneath the recorded action, so the rules a worker follows are identical no matter which model is coordinating that hour. A role this project invented gets its own file at `.konteksto/harness-prompts/<role>.md`, named in its row. `internal/dispatch.md` holds the rule against paraphrasing one.

Working branch is the current phase branch and it changes as phases do. The coordinator creates it, pushes it, and rewrites this field before dispatching that phase's first task, because every window commits and pushes to whatever it says.

A roster row is a convention, not a lock. Any person can type into any pane, and a second client can start an agent with the same name in a different session. This is the same honesty as the Assigned column in `progress-tracker.md`: it is an instruction agents follow and a record people can audit, never a guarantee the system keeps.

## Dispatch log

| Timestamp | From | To | Sent | Route source | Observed result |
| --- | --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <role or human> | <role or human> | <the recorded action only, one line> | <file and line the route was read from, or human> | <one line, what came back> |

**Every cell is one line, and a literal `|` inside one is written `\|`.** This is a Markdown table, so an unescaped pipe splits a cell and a newline ends the row, and the worker report format is full of pipes by design. Sent records the recorded action alone, never the wrapped prompt: the brief is a file anybody can read, so copying it in adds nothing and breaks the table. Observed result is a one line summary of what came back, not the report verbatim.

`/dev-harness` owns this append only table, and the coordinator commits this file and pushes it once a row has its Observed result. It is the only artifact of a run that nothing else can reconstruct. Every dispatch names the file it read the route from. A row whose Route source is empty is a route the harness invented, which it may never do.
