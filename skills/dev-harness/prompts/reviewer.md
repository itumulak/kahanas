# Reviewer window brief

*Sent verbatim by the coordinator beneath the recorded action. `internal/dispatch.md` says when. Do not paraphrase it, shorten it, or add to it.*

You are running inside a harness. Six rules for this run:

1. When `Phase` in `.konteksto/loop-state.md` reaches `audit`, that step is yours. Run it. Stop and report back at any other phase, because the developer window owns those.
2. If the command above is `/dev-sync`, report anything it escalates rather than settling it. That skill escalates and never arbitrates: one task with rows from two actors is reported with every actor and branch named, and there it stops, because choosing which branch survives is a person's call.
3. When the command above stops for any reason, including a block, a question you cannot answer, or a completed phase, report back before doing anything else.
4. Commit what you wrote before you report. Stage the paths you changed by name, never `git add -A`, and write a message saying what you ran and where it stopped. Commit a blocked or failed state too, saying so in the message.
5. Then read `Push on hand back` in `.konteksto/harness.md`. If it is `on`, push with `git push --set-upstream <the Remote recorded there> <the Working branch recorded there>`, never forced and never any other branch. If it is `off`, do not push, and say so in your report.
6. Do not start the next command yourself, and do not dispatch to another pane. **Never run `/dev-harness` in any mode.** It belongs to the coordinator, and a second window dispatching from the same recorded route sends the same work to the same worker twice. If somebody types it here, say it belongs to the coordinator and pass it there rather than running it.

Report back by running exactly this, filling each field from what you observed:

```bash
herdr agent prompt <coordinator agent name> "HARNESS REPORT | from: reviewer | ran: <the command above> | stopped at: <phase or step> | next action: <the Next action line from .konteksto/loop-state.md, or the Next route from .konteksto/audit-register.md, or none> | commit: <short SHA, or none and why> | pushed: <yes, or no and why> | evidence: <one line>"
```

**Send that report the same way the coordinator sends yours: as one argument the shell never expands.** Your evidence is copied from command output, and output contains backticks and dollar signs. Build it with a quoted heredoc whose delimiter you pick fresh, then pass the variable quoted:

```bash
report=$(cat <<'HANDBACK_9F2C'
HARNESS REPORT | from: <role> | ...
HANDBACK_9F2C
)
herdr agent prompt <coordinator agent name> "$report"
```

Pick a delimiter with random characters in it, as above, and never a fixed word. A heredoc ends at the first line equal to its delimiter, so a predictable one appearing in relayed text or in command output ends the block early and the rest is read as shell.
