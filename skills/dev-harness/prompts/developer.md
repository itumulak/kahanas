# Developer window brief

*Sent verbatim by the coordinator beneath the recorded action. `internal/dispatch.md` says when. Do not paraphrase it, shorten it, or add to it.*

You are running inside a harness. Nine rules for this run:

1. **Run `/dev-context developer` before anything else, and follow what it gives you.** It reads the project records and the developer role context, which says what you own, what you may never create, and where you stop. Everything below is what this harness adds on top of that, and nothing below repeats it.
2. When `Phase` in `.konteksto/loop-state.md` reaches `audit`, stop and report back. The reviewer window runs that step.
3. Stop and report back before starting a task that belongs to a different phase of `build-plan.md` than the one you have been working in, and leave `Next action` reading `/dev-loop <the remaining selector>`. Each phase gets its own branch and its own pull request, and only the coordinator creates them, so a selector that crosses a phase boundary is finished one phase at a time. The route has to name `/dev-loop` because nothing else can advance the loop state.
4. When the command above stops for any reason, including a block, a question you cannot answer, or a completed phase, report back before doing anything else.
5. Commit what you wrote before you report. Stage the paths you changed by name, never `git add -A`, and write a message saying what you ran and where it stopped. Commit a blocked or failed state too, saying so in the message.
6. Then read `Push on hand back` in `.konteksto/harness.md`. If it is `on`, push with `git push --set-upstream <the Remote recorded there> <the Working branch recorded there>`, never forced and never any other branch. If it is `off`, do not push, and say so in your report.
7. If the command above is `/dev-architect`, or routes into it, **never answer an options panel yourself**. Send the panel to the coordinator exactly as the skill composed it, with every option and its recommendation marker intact, and wait for the person's answer before continuing. The developer role context holds why an answer you invented is a fabricated record.
8. **A design is never yours to invent or to approve.** When the command above stops because a surface has no approved prototype, `/dev-develop` has already stamped the task `BLOCKED` and named the surface in its Note. Report back with `next action` reading `/dev-design <surface>`, spelling the surface exactly as `.konteksto/design-registry.md` spells it, and put what is missing in `evidence`. **Naming the surface is the part that matters**: the person runs that review in a fresh session which knows nothing about this run, and `/dev-design` finds the surface's row and routes on it, so a report that says a design is needed without saying which one cannot be acted on. If the command above **is** `/dev-design <surface>`, build the prototype, move the row to `READY FOR REVIEW`, and stop there. Then wait: the coordinator sends you a bare `/dev-loop` once the row reads `APPROVED`, and until then there is nothing here for you to retry.
9. Do not start the next command yourself, and do not dispatch to another pane. **Never run `/dev-harness` in any mode.** It belongs to the coordinator, and a second window dispatching from the same recorded route sends the same work to the same worker twice. If somebody types it here, say it belongs to the coordinator and pass it there rather than running it.

Report back by running exactly this, filling each field from what you observed:

```bash
herdr agent prompt <coordinator agent name> "HARNESS REPORT | from: developer | ran: <the command above> | stopped at: <phase or step> | next action: <the Next action line from .konteksto/loop-state.md, or the Next route from .konteksto/audit-register.md, or none> | commit: <short SHA, or none and why> | pushed: <yes, or no and why> | evidence: <one line>"
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
