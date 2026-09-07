# Harness

*Purpose: the roster of Herdr panes this project drives, the settings that govern them, and the append only record of what was dispatched. The build plan, progress tracker, loop state, and audit register remain the source of truth for the work itself. Nothing here decides what to build or how.*

## Session

- Herdr session: <session name>
- Workspace: <w1>
- Configured: <YYYY-MM-DD HH:MM>
- Configured by: <model identifier>
- Relay: <remote control|telegram poller|telegram curl|coordinator pane>
- Telegram bot token variable: <environment variable name, never the value, or none>
- Telegram chat variable: <environment variable name, never the value, or none>
- Allowed sender ids: <comma separated Telegram user ids, any sender in the chat, or none>
- Watch interval seconds: <5 to 120>
- Unattended approvals: <on|off>
- Escalate after failed attempts: <2 to 9, or off>
- Escalations allowed per task: <1 or 2>
- Quota resume: <on|off>
- Extra quota patterns: <literal strings that mean a worker is out of quota, or none>

## Roster

| Role | Agent name | Pane | Kind | Base model | Escalation model | Skills allowed | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| coordinator | coordinator | <w1:p1> | <kind> | <exact model identifier> | <exact model identifier, or none> | /dev-harness | <live\|missing> |
| developer | developer | <w1:p2> | <kind> | <exact model identifier> | <exact model identifier, or none> | /dev-loop, /dev-develop, /dev-check verify, /dev-debug, /dev-design, /dev-test | <live\|missing> |
| reviewer | reviewer | <w1:p3> | <kind> | <exact model identifier> | <higher reasoning effort, or none> | /dev-check review, /dev-audit, /dev-qa | <live\|missing> |

When Unattended approvals is `on`, every role starts with its own skip approvals flag: `--dangerously-skip-permissions` for `claude`, `--dangerously-bypass-approvals-and-sandbox` for `codex`, `--auto` for `opencode`, and `--approve` for `pi`, which is the closest Pi has rather than the same thing. Each agent then runs whatever command it decides to run, with nothing prompting first.

Base model is what a role starts on. Escalation model is what it moves to when the trigger in Settings fires, and `internal/escalation.md` holds when that is. Record the exact identifier the installed agent accepts, not a family name, because a name that does not resolve fails at the moment a run is already in trouble.

The developer and the reviewer must differ on both rows. **An escalation model that lands on the reviewer's model is refused**, since a developer that quietly becomes the reviewer's model destroys the one guarantee the two windows exist to provide, and it destroys it silently.

The developer model and the reviewer model must differ. `/dev-check review` is only worth running on a model that did not write the code, and `/dev-loop` blocks its final gate on a review that cannot prove the two differ. Recording both models here is what makes that structural instead of hopeful.

Skills are named differently per agent. Claude Code uses `/dev-audit 01`, Codex uses `$dev-audit 01`. The coordinator translates the recorded route to the receiving agent's prefix at send time, and a wrong prefix is typed as plain text that silently does nothing.

A roster row is a convention, not a lock. Any person can type into any pane, and a second client can start an agent with the same name in a different session. This is the same honesty as the Assigned column in `progress-tracker.md`: it is an instruction agents follow and a record people can audit, never a guarantee the system keeps.

## Dispatch log

| Timestamp | From | To | Sent | Route source | Observed result |
| --- | --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | <role or human> | <role or human> | <exact text sent> | <file and line the route was read from, or human> | <what came back> |

`/dev-harness` owns this append only table. Every dispatch names the file it read the route from. A row whose Route source is empty is a route the harness invented, which it may never do.
