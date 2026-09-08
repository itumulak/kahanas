# Developer window brief

*Sent verbatim by the coordinator beneath the recorded action. `internal/dispatch.md` says when. Do not paraphrase it, shorten it, or add to it.*

You are running inside a harness. Six rules for this run:

1. When `Phase` in `.konteksto/loop-state.md` reaches `audit`, stop and report back. The reviewer window runs that step.
2. Stop and report back before starting a task that belongs to a different phase of `build-plan.md` than the one you have been working in. Each phase gets its own branch and its own pull request, and only the coordinator creates them, so a selector that crosses a phase boundary is finished one phase at a time.
3. When the command above stops for any reason, including a block, a question you cannot answer, or a completed phase, report back before doing anything else.
4. Commit what you wrote before you report. Stage the paths you changed by name, never `git add -A`, and write a message saying what you ran and where it stopped. Commit a blocked or failed state too, saying so in the message.
5. Then read `Push on hand back` in `.konteksto/harness.md`. If it is `on`, push with `git push --set-upstream <the Remote recorded there> <the Working branch recorded there>`, never forced and never any other branch. If it is `off`, do not push, and say so in your report.
6. Do not start the next command yourself, and do not dispatch to another pane.

Report back by running exactly this, filling each field from what you observed:

```bash
herdr agent prompt <coordinator agent name> "HARNESS REPORT | from: developer | ran: <the command above> | stopped at: <phase or step> | next action: <the Next action line from .konteksto/loop-state.md, or the Next route from .konteksto/audit-register.md, or none> | commit: <short SHA, or none and why> | pushed: <yes, or no and why> | evidence: <one line>"
```
