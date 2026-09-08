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
| `/dev-document pr` | coordinator, run in place and never dispatched |

If the recorded action names a skill that no roster row allows, the harness does not run it anywhere. Report the action and the ownership gap to the person and stop. `/dev-scope` and `/dev-architect` are the usual cases: they settle product and technical intent, and no window in this roster may hold that.

If `Phase` is `blocked`, do not dispatch. Escalate the preserved evidence to the person and stop.

If `Phase` is `complete` and `Next action` is `none`, the selected work is finished. Report the phase as done and stop.

## The audit handoff

`/dev-loop` runs develop, verify, and test itself, then reaches its own audit gate. That gate needs a review from a model that did not write the code, which is the whole reason the reviewer window exists. So the developer dispatch tells `/dev-loop` to hand back when it reaches that gate, and the coordinator dispatches the audit to the reviewer window instead.

This assigns who runs a step. It does not change what the step is, or what `/dev-loop` does with the result.

After the reviewer finishes, dispatch a bare `/dev-loop` to the developer. It resumes from its own saved state with a current audit register, and continues to QA or to the repair route it recorded.

**Check the reviewer produced a review report before dispatching that hand back.** `/dev-audit` ingests a report and writes findings; when `.konteksto/reviews/` still holds no file covering this change, the audit did not run whatever the reviewer reported. Sending the developer back to a gate that is still waiting on the same missing report starts the cycle described below. Report the missing report to the person and stop.

## Two windows can both be right and still make no progress

**A crossing that leaves `loop-state.md` byte identical is a livelock, not a wait.** Compare the file before dispatching and after the hand back. If a full crossing changed nothing, stop and tell the person, naming both windows and what each said.

This is the failure mode a single agent cannot have and a harness can. In this project's own demo the loop reached `Phase: audit`, and from there: the developer stopped because the harness gives the audit to the reviewer, the reviewer stopped because it read an empty register and called it nothing to do, and the coordinator read the unchanged `Next action` and sent each of them back to the other. Every one of those three was following its own rules correctly. Progress still stopped, and nothing in any single pane looked like a failure.

So the coordinator is the only place that can see it, because it is the only one that sees both sides. A counted retry is not the fix either: a route that produced no state change will produce no state change the second time. Stop on the first repeat.

## A route you just completed is stale

**Never dispatch the same action twice in a row.** A worker that finished `/dev-audit 01-02` leaves `Next action` in `loop-state.md` still naming `/dev-audit 01-02`, because the skill that owns that line was not the skill that ran. A coordinator that only re reads and dispatches would send it again, and again.

So before every dispatch, compare the route to the last completed row in the Dispatch log. If they match, the route is stale and its owner has not recomputed it yet:

- After the reviewer completes an audit, the audit handoff below says what to send: a bare `/dev-loop` to the developer.
- In any other case, ask the person. A stale route is not permission to guess the next one.

## Send it

Never use `--wait` for a build phase. A coordinator blocked inside `agent prompt` cannot read what the person sent, cannot notice a quota block, and cannot answer a question the worker is stuck on. Dispatch, then watch.

**Pass the prompt as one argument that the shell never expands.** The wrapped prompt carries a brief file verbatim and, for an instruction relayed from a person, their exact words. Both routinely contain backticks, quotes, and dollar signs, and pasting that between double quotes hands it to the shell to interpret: at best the command breaks, at worst `$(...)` inside a message runs. Build it with a quoted heredoc, whose delimiter in single quotes turns off every substitution, then pass the variable quoted:

```bash
prompt=$(cat <<'HARNESS_PROMPT'
<recorded action>

<the receiving role's brief file, verbatim>
HARNESS_PROMPT
)
herdr agent prompt <agent name> "$prompt"
```

Never assemble it inline as `herdr agent prompt <name> "text with $VARS and `backticks`"`. The quoting looks fine until the first prompt that contains a character somebody did not think about, and the failure lands in the middle of an unattended run.

**Translate the skill prefix for the receiving agent.** A route is recorded as `/dev-audit 01`, because that is how Claude Code names a skill. Other agents do not use that prefix, and the dispatch is rejected rather than run. In this project's own demo Codex answered a slash route with `Unrecognized command '/dev-audit'` and did nothing else, while the send itself reported success and the dispatch log recorded a dispatch.

| Kind | Prefix | Example |
| --- | --- | --- |
| `claude` | `/` | `/dev-audit 01` |
| `codex` | `$` | `$dev-audit 01` |

For any other kind, check how that agent invokes a skill before dispatching to it, and record what you found in the roster row. Never assume the recorded slash works.

This is a translation at send time and nothing more. The route itself, and the file it came from, do not change.

**A successful send is not a started job, so read the pane after dispatching.** `agent prompt` reports success once the text is delivered, which says nothing about what the agent did with it. The rejection lives in the pane, not in the send result. An empty input box is not evidence either way: the agent may have taken the prompt and refused it, and the same blank pane appears when it is quietly working.

The wrapped prompt is the recorded action plus the receiving window's brief, and nothing else. Do not add advice about how to do the work. That would be this skill creating intent through the back door.

**The brief is a file, and it is sent verbatim.** Read the role's file and send its body under the recorded action:

| Role | File |
| --- | --- |
| coordinator | `prompts/coordinator.md` |
| developer | `prompts/developer.md` |
| reviewer | `prompts/reviewer.md` |
| any other role | the Prompt file named in its roster row |

**Do not paraphrase it, shorten it, or improve it.** The reason it is a file rather than a paragraph here is that a coordinator writes this text on every dispatch, and a different coordinator model writes it differently: the same run then means different things to the developer depending on which model happened to be relaying that hour. Rules a worker follows have to be identical every time, and the only way to make that true across models is to stop asking a model to reproduce them.

A role the roster added gets its own file, written by `config` at `.konteksto/harness-prompts/<role>.md` and named in its row. It is a project file rather than a skill file because the role is this project's invention, and it is versioned rather than ignored because it is part of how the run behaves.

If a brief file is missing, stop and say which one. Do not write a replacement from memory: a brief reconstructed by the coordinator is exactly the drift the files exist to remove.

## Commit before every hand back

**A window commits what it wrote before it reports, and never pushes.** A hand back is a claim about a state the next window has to read, and an uncommitted working tree is a state nobody can name. Committing turns it into one short identifier that every later file can point at.

**Stage paths by name.** `git add -A` sweeps in whatever another window is part way through writing, and the reviewer and the developer share one working tree. The coordinator is also editing `.konteksto/harness.md` between dispatches, so a blind stage commits the dispatch log mid row.

**Commit a blocked run too.** The temptation is to leave a broken state uncommitted so it looks like nothing happened. Nothing happening is exactly what the next window cannot distinguish from a worker that died, and a blocked state that cannot be read is worse than a broken one that can. Say `blocked` in the message.

**Then push the working branch, but only when `Push on hand back` in `.konteksto/harness.md` says `on`.** A run that only commits leaves the work on one machine, and the person watching from a phone or another desk cannot see it, cannot pull it, and cannot take it over when the harness stops. Pushing on every hand back is what makes an unattended run something a person can join at any moment. It is still a recorded choice, and `off` means no window pushes anything.

```bash
git push --set-upstream <Remote from the roster> <Working branch from the roster>
```

**Both of those come from the roster, and neither is assumed.** `origin` is the usual remote and it is not the only one, and a run configured against a different remote that silently pushes to `origin` sends work somewhere nobody asked for. Name the branch every time too: a bare `git push` follows whatever `push.default` and the branch configuration say, which is not always the branch you are on.

Four things this may never do, and each one is about a push being the one act here that leaves the machine:

- **Never push the base branch.** The roster's Working branch is the only branch a window pushes. Work reaches `main` through whatever review a person already uses, not through an agent that finished a task.
- **Never force.** Not `--force`, not `--force-with-lease`. Once a commit is pushed, the person may already have pulled it, and rewriting shared history is the one git mistake that costs somebody else their afternoon. For the same reason, do not amend or rebase a commit that has been pushed.
- **Never push tags**, and never create one. A tag is a release decision.
- **A rejected push means somebody else moved the branch.** Report it and stop. Do not pull, do not merge, do not rebase to get past it: another writer on the run's own branch is a fact the person needs to know before anything is reconciled.

**Do not stage a file git is already ignoring**, and never use `git add -f`. A push sends whatever was committed to a server, where deleting it later does not reliably remove it. `.gitignore` is where this project already recorded what must not leave the machine, and an unattended run with approvals skipped is exactly when nobody is watching for a key file going out.

**No remote configured?** Commit, say the work is local only, and carry on. Do not add a remote. That is a person's decision about where their code goes.

**The commit SHA is evidence, so carry it.** Put it in the report and in the Dispatch log's Observed result. `/dev-audit` records a Review basis for every finding and prefers the current Git revision, falling back to file checksums when there is none. In this project's own demo every finding fell back to a SHA256 of the file contents, because nothing had been committed, and a checksum is unreadable next to a commit anyone can check out.

### The coordinator creates a branch per phase

**One branch per phase of `build-plan.md`, created by the coordinator before it dispatches that phase's first task.** A phase is the unit a person reviews, so it is the unit that gets a branch and, at the end, a pull request. A single branch carrying every phase of a project is a pull request nobody can read.

Name it from the phase heading: `phase-<number>-<slug>`, so `phase-1-store-and-service`.

**Where it starts from is a fact the repository proves, not a judgment you make:**

- **The previous phase is merged into the base branch, or there is no previous phase.** Cut from the base branch. `git switch -c phase-2-... <base>`.
- **The previous phase is not merged.** Cut from the previous phase's branch. Starting from base instead would drop code the tracker says exists, and the first task would fail on an import of a file that is not there.

Check it rather than assuming: `git branch --merged <base>` lists what has landed.

That second case makes the phases a stack, so the pull request for a phase targets whatever its branch was cut from, not always the base branch. `/dev-document pr` reads the branch point; do not tell it a base.

**Push the branch when you create it**, so the person can see and pull the phase from the moment it starts rather than after the first hand back. This obeys `Push on hand back` like every other push: `off` means the branch stays local, and it uses the roster's `Remote`, never a hardcoded `origin`.

**Record the branch in the roster's Working branch field before dispatching.** Every window commits and pushes to whatever that field says, so a field that lags the phase sends the developer's commits to the previous phase's branch.

**Never delete a phase branch, and never merge one.** Both are decisions about what becomes the project's history, and the pull request is where a person makes them.

### This only works on a working branch

**The run happens on a branch off the base, never on the base branch itself.** That is not a preference, and skipping it silently disables the review.

`/dev-check review` picks its scope from the branch. On a feature branch it reviews everything differing from the merge base, so committed work is still in scope. On the base branch it reviews the working tree instead, with `git diff --name-only HEAD`, and once a window has committed, that diff is empty and the review stops with nothing to review.

So committing on the base branch would hand the reviewer an empty change set at the exact gate built to catch what the builder could not see, and it would look like a clean run. `config` settles the branch and records it, and `start` refuses to dispatch when the roster's branch is the base branch.

**Commit at the hand back, not during the work.** `/dev-test` and `/dev-sync` scope themselves by what is uncommitted inside a single leg, so a window that commits part way through its own run hides its work from its own next step. The commit is the last thing before the report.

Append one Dispatch log row in `.konteksto/harness.md` before you send, with the file the route came from in Route source. **Sent holds the recorded action alone, on one line, and never the wrapped prompt.** It is a Markdown table cell: a newline ends the row and a literal `|` splits the cell, and the report format the briefs use is made of pipes. Escape any pipe that has to stay as `\|`.

**Resolve the timestamp before writing it.** Read the clock, then write the value it returned. A row carrying an unexpanded `$(date ...)` instead of a time is worse than a row with no time at all, because it looks like a record until somebody tries to order two of them. This project's own demo produced exactly that row.

**Read the local clock, never UTC.** Use `date '+%Y-%m-%d %H:%M'` with no `-u`. Every other stamped file in this workflow records local time, and a dispatch log eight hours out from the tracker beside it cannot be read against it. A later session reconstructing what happened has no way to tell a shifted clock from a run that actually took eight hours, and this project's own demo wrote `10:48` for a dispatch the pane clock showed at `18:48`.

**Commit `.konteksto/harness.md` once the row has an Observed result, and push it.** The coordinator lives under the same rule as every window it dispatches to, and for a sharper reason: the Dispatch log is the only artifact of a run that nothing else can reconstruct. The tracker says what was built, the register says what was found, the loop state says where it stopped. Only this file says what was sent, to which window, and which file the route was read from, which is the record that proves the coordinator dispatched rather than invented.

In this project's own demo it went uncommitted for an entire run, on a machine whose panes had pushed ten commits of everything else. It was also the file that had caught two route violations that day, and it was the only one not being preserved.

```bash
git add .konteksto/harness.md
git commit -m "chore(harness): dispatch <route> to <role>"
git push <Remote from the roster> <Working branch from the roster>   # only when Push on hand back is on
```

Stage that path alone. The same fence applies as everywhere else: the phase branch only, never forced, never the base branch. Commit after the result is known rather than before the send, so one row is one commit and a reader can follow the run by reading the log backwards.
## Watch

**An agent cannot wake itself.** A turn ends and nothing schedules the next one, so a plan to check again in thirty seconds is a plan the coordinator cannot keep: it says it will look later, stops, and the run sits still with a worker blocked on a question nobody sees. This project's own demo did exactly that.

So the watch is a blocking wait inside one turn, not a promise to return.

```bash
herdr agent wait <agent name> --timeout <milliseconds>
```

**Capture the agent's state sequence before you dispatch, and ignore any wait that returns without it advancing.**

```bash
herdr agent get <agent name>    # read state_change_seq, keep it
herdr agent prompt <agent name> "<wrapped prompt>"
herdr agent wait <agent name> --timeout <milliseconds>
herdr agent get <agent name>    # advanced past the kept value, or wait again
```

The wait matches the state the agent is in **now**, not only a change into it. A worker takes a moment to leave `idle` after being prompted, so a wait started immediately after a dispatch returns `idle` at once, describing the state before the work rather than after it. Measured on this project: a dispatch followed straight away by a wait returned `idle` in six milliseconds, and the worker then ran for two seconds and answered. A coordinator that trusted that first return would read a finished worker that had not begun, go to read the pane, and find the state from before its own dispatch.

`state_change_seq` settles it exactly. In that same measurement it read 98 before the dispatch, still 98 when the wait returned wrongly, and 100 once the worker had really finished. **Do not wait for `--until working` instead.** Fast work finishes before that state can be observed, and the wait then times out on a job that already succeeded, which is the same wrong answer from the other direction.

**That wait is edge triggered once the sequence guard is in place, and this is the whole reason it is cheap.** It returns the moment the worker reaches `idle`, `done`, or `blocked`, not when the timeout elapses. Measured on this project: a wait carrying a ten minute timeout returned in two milliseconds against a worker that was already idle. So the timeout is not a polling interval and there is no cost per minute of it. It only bounds how long you sit when nothing at all happens.

**But the timeout is also the only thing that lets a person reach you mid wait, and that sets a ceiling on it.** A tool call has to return before the agent sees anything new, so a message the person sends while you sit inside `agent wait` is not read until that wait ends. A one hour wait means a stop request, an answer, or a change of direction can sit unread for an hour, which is exactly the moment the relay exists for.

So the timeout is not free after all, and an earlier version of this file said it was. **It is the longest a person's message can go unread.** Set it from that, not from how long a worker might take:

| Relay | Timeout | Why |
| --- | --- | --- |
| Remote Control | 300000, five minutes | The person's message lands in your own session, but only when the wait returns. Five minutes is the delay they will feel when they interrupt. |
| Coordinator pane | 300000, five minutes | The same, typed into this pane instead. |

Longer is defensible on a run nobody intends to interrupt, and say that plainly when recording it rather than treating it as the cheap default. Shorter than a minute is waste: each expiry costs a turn and a worker that finishes wakes you regardless.

**Nothing here watches files, and nothing needs to.** `loop-state.md` is written only by a worker, and a worker that writes it settles immediately afterwards, so the state change and the wake are the same event. A file watcher would fire slightly earlier on a file that is still being written, which is worse. If a person edits `loop-state.md` by hand mid run, that is a message to you, and it belongs on the relay where you will see it.

On an expiry, check the relay and any quota output, then wait again. Keep looping in this turn until the worker settles, the person stops the run, or the recorded phase ends the cycle.

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
