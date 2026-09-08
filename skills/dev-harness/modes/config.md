# /dev-harness config (set up the roster)

The `config` mode. It decides which panes this project drives, which skills each may run, and how the person is reached. It dispatches nothing.

## Asks vs acts

Asks, almost entirely. This mode exists to record choices a person makes about their own machine and their own chat. It starts agents in panes, and it writes `.konteksto/harness.md`. It never touches project documents or code.

Running `config` again reconfigures. Read the existing file first, offer each current value as the default, and rewrite the Session and Roster sections. **Keep the Dispatch log.** It is append only history of what was actually sent, and a reconfigure is not a reason to lose it.

## Execution

### Step 1: Install Herdr when it is missing, then confirm the environment

Check for the CLI before checking the session:

```bash
command -v herdr >/dev/null 2>&1
```

If it is missing, explain that the harness cannot create or drive its panes without Herdr. Ask whether to install the current stable release with the official installer. Show the exact command before running it. Installing software on the person's machine is a real change, so a no stops configuration and reports the [official install guide](https://herdr.dev/docs/install/) without substituting subagents.

On Linux or macOS, the official command is:

```bash
curl -fsSL https://herdr.dev/install.sh | sh
```

On Windows PowerShell, the official command is:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

After installation, refresh command lookup and verify the binary:

```bash
hash -r 2>/dev/null || true
command -v herdr
herdr --version
```

If either check fails, stop and report the installer's output. Say that a new terminal may be required for the install directory to reach `PATH`. Do not claim that Herdr is installed merely because the installer exited without an error.

Installing the binary does not move the current agent into a Herdr pane. If the CLI is now available but this is not a Herdr session, tell the person to launch `herdr`, open the project there, and run `/dev-harness config` again. Stop after that handoff. Do not launch an interactive Herdr client inside the agent's shell and pretend configuration can continue in it.

Now confirm the live session:

```bash
test "${HERDR_ENV:-}" = 1
```

If that fails while the CLI is already installed, say plainly that this skill drives Herdr panes and cannot finish configuration outside a Herdr session. Tell the person to launch `herdr`, open the project there, and run `/dev-harness config` again. Do not fall back to subagents. A subagent is not a pane, does not survive the session, and cannot be typed into by a person, which is most of what this skill is for.

Read the current session:

```bash
herdr agent list
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

### Step 2: Ask for the roster

Offer the three defaults and the option to add more. Use `AskUserQuestion` where available.

> Which windows should the harness drive?
> **The three defaults** (recommended): coordinator, developer, reviewer. Coordinator relays, developer builds, reviewer reads the code it did not write.
> **The three defaults plus more**: name each extra window and the skills it may run.
> **A custom set**: name every window yourself.

For each role, settle four things:

- **Agent name.** Must match `[a-z][a-z0-9_-]{0,31}` and be unique among live agents. Default to the role name.
- **Pane.** An existing pane with an agent already in it, or a new split. Reuse what the person already has open before creating anything.
- **Skills allowed.** The default split is in `templates/harness.md`. The coordinator's row carries `/dev-document pr` beside `/dev-harness`, because it opens the pull request itself when a pushed run completes rather than dispatching that to a window whose own code is in it.
- **Prompt file.** The brief that window is sent verbatim on every dispatch. The three default roles use the skill's own `prompts/coordinator.md`, `prompts/developer.md`, and `prompts/reviewer.md`. **A role this project invented needs its own**: write it to `.konteksto/harness-prompts/<role>.md`, copying the shape of `prompts/developer.md`, and name it in the row. Ask the person what that role must always do and always refuse, and put only that in the file. A role with no brief cannot be dispatched, because the coordinator would have to write one, and a brief a coordinator writes is different for every coordinator model. An extra window needs its own list, and a skill listed for no window cannot be dispatched at all.

### Step 3: Ask which AI and which model runs each role

**Ask per role. Never detect a model and assume it.** The three roles do different work and are worth different money, so they are three separate questions, each with its own recommendation.

Claude and Codex come first because both are known to work in this workflow and Herdr recognizes both. Other agents are offered and never discouraged. **OpenCode and Pi are the way to an open weight model here**, since both front many providers and local models, so a person who wants an open weight model on a role picks one of those and names the model inside it. Gemini and every other kind Herdr recognizes stay on the list too.

Run `herdr agent start --help` for the kinds this Herdr build supports, and check which of those agents are actually installed on this machine. **Offer nothing that is not installed**, and record the exact model identifier the installed agent accepts rather than a family name. A name that does not resolve fails at the moment a run is already in trouble.

**The coordinator's kind decides whether this run can reach the person at all, so ask it that way.** Only Claude Code can hold a Remote Control session, and that session is the only transport that reaches somebody who is not at the terminal. Every other kind leaves the coordinator pane as the transport, which reaches a person only while they are watching it. That is not a small preference between providers: it is the difference between a run you can walk away from and one you cannot.

> Which AI runs the coordinator? It relays routes and messages and writes no code, so it looks like the place to save money. The kind decides how you get reached, and the tier decides whether the routing rule holds.
> **Claude, on its small fast model** (recommended): enough for reading a route and relaying a question, and the only kind that can hold a Remote Control session you answer from your phone. Pick this unless you have a reason not to.
> **Codex, on its small fast model**: the same relaying job on the other provider. **You lose Remote Control**, so every question is asked in the coordinator pane and nothing reaches you while you are away.
> **OpenCode or Pi**: the route to an open weight or locally hosted model, and often the cheapest of the three. **You lose Remote Control** the same way.

State that cost in the option itself rather than after the answer. A person choosing a free coordinator is making a real trade, and it is not one they can see from the model name.

**There is a floor under this role, and it is higher than the job description suggests.** The coordinator's whole task is one sentence, but that sentence is a negative: dispatch the route another skill recorded, and never compute one. Negative instructions are the hardest kind for a small model to hold, because nothing in the moment reminds it of the rule and the invented answer is usually reasonable. The routing table is right there, the build plan is readable, and the next step is often obvious. Working it out is exactly what must not happen.

So recommend a provider's small fast model, not the cheapest thing that runs. Free and locally hosted models belong on this role only when somebody is watching the Dispatch log.

**This is observed, and it is one observation.** In this project's own demo a free model on the coordinator broke that rule twice inside one run: it dispatched `/dev-loop 01` with a Route source of `build-plan.md`, a file that is not in the read order at all, dropping a task from the run, and later reasoned two steps ahead into a question about a phase it had not reached while `loop-state.md` plainly recorded the next action. It got every other new rule right, including ones far more elaborate. One model on one run is not a law, and it is enough to stop recommending the bottom of the range without saying anything.

**Tell the person how they would catch it.** The Route source column in the Dispatch log names the file every route was read from, so a route the coordinator invented shows up as a source outside `loop-state.md` and `audit-register.md`. That column is the only reason both violations were found. On a coordinator below the floor, say plainly that this is the thing to read.

> Which AI runs the developer? It builds, verifies, debugs, and tests.
> **Claude, on its mid tier model** (recommended): the usual balance of cost and capability for building from a plan.
> **Codex, on its mid tier model at high effort**: the same balance on the other provider.
> **OpenCode or Pi, on the model you prefer**: an open weight or locally hosted model, or a provider the other options do not cover.

> Which AI runs the reviewer? It reads code it did not write, and finds what the builder could not see.
> **The strongest reasoning model you have** (recommended): review is where a cheaper model costs the most, because a finding it misses ships.
> **Claude or Codex at their highest reasoning tier**: pick whichever is not running the developer.
> **OpenCode or Pi, on the strongest model they reach**: an open weight or locally hosted model. Judge it on review quality, not on cost, because this is the role where a missed finding ships.

### Step 4: Enforce the different model rule

**The developer model and the reviewer model must differ.** If the person picks the same for both, say why it does not work and ask again:

> `/dev-check review` is only worth running on a model that did not write the code, and `/dev-loop` blocks its final gate on a review that cannot prove the two differ. Two windows on the same model would fail that gate every time.

If no second model is available on this machine, record the roster with the reviewer model as `same as developer`, and say plainly that the review gate will report degraded and the loop will block there. Let the person decide. Do not record a model you did not confirm.

### Step 5: Ask for the escalation ladder

A role starts on the cheapest model that does its job. Ask what it moves to when the work turns out to be harder than that.

> When a task keeps failing, should the developer move to a stronger model?
> **Yes, one step up** (recommended): after a few failed attempts on the same task and route, the developer moves up, and returns to its base model when that task completes. `/dev-loop` already counts the attempts, so nothing new is being tracked.
> **No, stay put**: the run blocks at `/dev-loop`'s own cap instead. Cheaper, and slower to tell you the model was the problem.

Ask the same for the coordinator, whose trigger is different: it escalates when it has twice failed to resolve the same request or route. The reviewer does not escalate to another model, because it started at the top; where its agent supports it, raise its reasoning effort instead.

Then settle two numbers:

- **Escalate after failed attempts.** Default 3. It must stay well below `/dev-loop`'s cap of ten attempts on one task and route, so the stronger model gets real attempts before the run blocks.
- **Escalations allowed per task.** Default 1.

**Refuse an escalation model that equals the reviewer's model.** A developer that silently becomes the reviewer's model breaks the guarantee both windows exist to provide, and breaks it where nobody would see. Say that, and ask for a different step.

### Step 5b: Settle the working branch

Every window commits what it wrote before it hands back, so the run needs a branch of its own. Read where the project is:

```bash
git rev-parse --abbrev-ref HEAD
git branch --list main master
```

Record the base branch, `main` or `master`, in its own field.

**Do not pick a working branch here.** The coordinator creates one branch per phase of `build-plan.md` and rewrites the Working branch field as each phase starts, so a branch chosen at configure time would be wrong by the second phase. `internal/dispatch.md` holds the naming and where each phase branch is cut from. Set Working branch to the first phase's branch name if a run is starting now, and leave it empty otherwise.

If the project is sitting on the base branch with uncommitted work, say that the first phase branch will be cut from here and that the work will travel with it. That is usually what a person wants, and it is not what they expect if nobody says it.

Say why in one line, because it reads like ceremony otherwise: `/dev-check review` reviews everything differing from the merge base on a feature branch, and reviews only the working tree on the base branch. Once a window commits, the working tree is clean, so a run committing on the base branch hands the reviewer an empty change set and the review stops with nothing to review. That failure looks exactly like a clean run.

If the person wants no branch at all, say the commit rule and the review gate cannot both hold, and let them choose which to give up. Do not record a roster that quietly does neither.

Then settle where that branch goes. Read what the project already has:

```bash
git remote -v
```

With a remote configured, ask:

> Should each window push its commits after it hands back?
> **Yes, push the working branch** (recommended): the work leaves this machine on every hand back, so you can pull it, read it, or take it over from anywhere while the run continues. An unattended run you cannot see is an unattended run you have to trust.
> **No, commit only**: the work stays on this machine until you push it yourself. Nothing the harness commits reaches anybody else.

Say the cost in the same line rather than burying it: pushing sends whatever was committed to a server, and deleting it there later does not reliably remove it. That matters because the roles are running with approvals skipped, so nobody is checking each commit before it goes out.

Record the remote name and the answer. **With no remote configured, record push as off and move on.** Do not offer to add one and do not add one: where a person's code goes is their decision, and it is not a setting a harness should be inventing at three in the morning.

### Step 5c: Ask where this run lives

**A harness needs three panes, and where they go is the person's call, not a default.** Ask before creating anything.

Read what is already there:

```bash
herdr session list
herdr workspace list
```

> Where should the harness panes live?
> **This workspace** (recommended when you are already in the project you want built): the panes split from the one you are in and nothing new is created. Everything stays in one place and `herdr session attach` reaches it the way it already does.
> **A new workspace in this session**: the harness gets a space of its own, so it does not crowd the panes you are working in, and it is still one server, one socket, and one session to attach to.
> **A new session**: full isolation. Its own server, its own socket, and its own agent names.

**The deciding fact between the last two is agent names, which are scoped to the session and not to the workspace.** Two harness runs in one session cannot both hold an agent called `coordinator`; the second one fails with `agent_name_taken`. So a second run beside one already going wants a new session, and a single run that just wants elbow room wants a new workspace.

**A new session moves the run out from under you, and that is the part to say out loud.** This mode is running in a pane of the current session, and it cannot follow itself into a new one. So when a new session is chosen: create it, create its workspace and panes, start the agents, write `.konteksto/harness.md`, then tell the person to attach to it and run `/dev-harness start` there. **Do not dispatch anything.** The coordinator of that run is a pane in the new session, and this pane is not it. Two coordinators reading one recorded route send the same work twice.

```bash
herdr --session <name> server
```

Record what was created, because `stop` needs it. A session or workspace this mode made is one the harness may later take down; one the person already had is not, and that difference is invisible after the fact.

Whatever the answer, **do not create a tab or a worktree, and do not change the working directory.** The harness builds the project the person pointed it at.

### Step 5d: Ask whether the roles run unattended

The whole point of a harness is that work continues while the person is away. An agent that stops for approval on every command does not do that: it waits, the coordinator waits on it, and the run is still exactly where it was an hour later.

So ask, once, and record the answer:

> Should the roles run without asking permission for each command?
> **Yes, unattended** (recommended for a scratch or containerized project): every role starts with its own skip approvals flag and runs to completion without stopping. This means each agent runs whatever command it decides to run, including deleting files and reaching the network, with nothing prompting first.
> **No, ask each time**: safer on a repository you care about, and the run stops whenever an agent wants a command approved. Someone has to be at the panes.

State the cost in that one line and let the person choose. Do not soften it and do not repeat it: they are running an autonomous build loop, and they know what that is.

The flag differs per kind. Pass it after `--`, with the model arguments:

| Kind | Flag | What it does |
| --- | --- | --- |
| `claude` | `--dangerously-skip-permissions` | Bypasses all permission checks |
| `codex` | `--dangerously-bypass-approvals-and-sandbox` | Skips confirmation prompts and runs without the sandbox |
| `opencode` | `--auto` | Auto approves any permission that is not explicitly denied |
| `pi` | `--approve` | Trusts project local files for the run. **Not the same thing**: Pi has no flag that skips tool approvals, because it does not prompt per command the way the others do. Record it as the closest equivalent and say so. |

Check the flag against the installed agent with `<kind> --help` before recording it. These names change, and a flag that no longer exists stops the agent at startup rather than skipping anything.

**Even unattended, a folder trust prompt still appears the first time an agent starts in a directory**, and the skip approvals flags do not answer it. Step 6 covers that when it starts the agents.

**Allow the coordinator to run `herdr` commands without asking.** Its watch cycle calls `herdr agent wait`, `herdr agent get`, and `herdr agent read` continuously, and an agent that needs approval for each one stops on the first poll and never reaches the worker it is watching. In this project's own demo the coordinator stalled on `herdr agent get developer` while the developer sat blocked on a question. Tell the person to accept the standing permission for `herdr agent *` the first time that pane asks, or to add it to the project's allowed tools before starting.

This applies to the coordinator pane only. A worker has no reason to drive Herdr beyond its one hand back call.

### Step 6: Create what is missing

**Create the panes where Step 5c said, not where this mode happens to be running.** In the current workspace, split from the caller. In a new workspace or a new session, create that first and split from its root pane, whose id the create call returns. Splitting `--current` regardless would put the roster's panes in the space the person asked to keep clear.

```bash
# current workspace
herdr pane split --current --direction right --cwd "$PWD" --no-focus \
  --env POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true

# new workspace, or a new session with --session <name> on every call
herdr workspace create --cwd "$PWD" --label <project> --no-focus \
  --env POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true
herdr pane split <the returned root pane id> --direction right --cwd "$PWD" --no-focus \
  --env POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true
```

Split a wide pane to the right and a tall one down. Read the new pane id from `.result.pane.pane_id`.

**That environment variable is not decoration.** A shell using Powerlevel10k with no saved configuration for this terminal opens its setup wizard instead of a prompt, and a pane sitting in a wizard is not a pane an agent can start in. `agent start` then fails with a pane that looks perfectly healthy from the outside. This project's own first demo lost three panes to exactly that. The variable is harmless on a shell that does not use Powerlevel10k.

**Check the pane reached a prompt before starting an agent in it.** Read it, and expect a prompt rather than a question:

```bash
herdr pane read <pane id> --source visible --lines 12
```

Anything that is asking the person something, from any prompt framework, means the shell is not at its prompt yet. Say what the pane is showing and let the person settle it. Do not send keys into a wizard to guess your way past it.

Then start the agent in it, with the flags Step 5d settled. **The answer is known before any agent starts, which is the point of asking it there**: an agent already running cannot be given a skip approvals flag without being killed and started again.

Start the agent:

```bash
herdr agent start <name> --kind <kind> --pane <pane id> -- \
  <model arguments for the base model> <the skip approvals flag from Step 5d, when unattended is on>
```

Native agent arguments go after `--`, and that is where both the base model and the skip approvals flag go. Start each role on its base model, never on its escalation model, and put the flag in the same command rather than adding it later: an agent already running cannot be given one without being killed and started again, which is why Step 5d asks before this step runs.

**Start a Claude coordinator with Remote Control on**, so step 7 has the option available without a restart:

```bash
herdr agent start coordinator --kind claude --pane <pane id> -- --remote-control coordinator --model <base model>
```

It costs nothing if the person then picks a different relay, and it saves killing a freshly started agent to add one flag.

**Expect a trust prompt the first time an agent starts in a directory.** Claude Code and Codex both ask whether the folder can be trusted before they will accept input, and Herdr returns `agent_not_ready` while that dialog is up. The name still resolves for `agent read` and `agent send-keys`, so read the pane, show the person exactly what it asks, and let them answer. **Never answer it yourself**, and never send a blind Enter: the two agents do not agree on which option is highlighted, so the same keystroke trusts one and quits the other. Answering once usually covers every later pane of that same agent in that same directory.

Confirm each role really came up before moving on:

```bash
herdr agent list
```

Expect the name, the pane, the kind you chose, and a status of `idle`. A role that is not in that list did not start, whatever the pane looks like.

**Expect a trust prompt the first time an agent starts in a directory.** Claude Code and Codex both ask whether the folder can be trusted, and a pane sitting on that question returns `agent_not_ready` even though the agent is running and the name still works for `agent read` and `agent send-keys`.

**Relay it. Never answer it yourself**, and never send a bare Enter to clear it. It is a security question about the person's own machine, and the two agents do not even default to the same answer: Codex preselects yes, Claude Code preselects `No, exit`, so one blind Enter trusts a folder and the other quits the agent. Read the dialog, show it to the person, and send only the choice they make.

Answering it once usually covers the other panes of the same agent kind in the same directory, since the trust decision is stored per directory. Do not assume that; read each pane.

### Step 7: Ask how the harness reaches the person

**The answer depends on the coordinator's kind, so ask it after step 3, not before.** Claude Code can hold a session the person reaches from their phone, and no other agent in the roster can. When the coordinator runs Claude, that is the recommended answer, subject to the test below, since an organization can switch the feature off for an account. When the coordinator is not Claude, Remote Control is not on the list at all, because offering something this machine cannot do wastes the person's time at exactly the wrong moment.

With a Claude coordinator, there is one recommended answer and one fallback:

> How should the harness reach you when a decision is yours?
> **Claude Remote Control** (recommended): the coordinator pushes a one line notice to your phone, you open that session, and you answer in it. Nothing to create, no token to keep out of a file, and no channel a third party can post into, because it is your own authenticated session.
> **The coordinator pane**: every question is asked in this pane instead. Nothing reaches you while you are away, and a coordinator that asks its own question goes `blocked`, which stops its watch cycle until somebody answers.

Without a Claude coordinator there is nothing to ask. The relay is the coordinator pane, and say so in one line: Remote Control is a Claude Code feature and this coordinator runs something else, so this run cannot reach you while you are away from it.

**For Remote Control**, the coordinator must have been started with it enabled. If step 6 already started it without, restart that pane:

```bash
herdr agent start coordinator --kind claude --pane <pane id> -- --remote-control coordinator --model <base model>
```

**Then check the coordinator's own banner, which says outright whether the feature came up:**

```bash
herdr agent read coordinator --source visible --lines 12
```

A working session prints a line naming Remote Control as active, with a `https://claude.ai/code/session_...` link to continue on a phone. That link is the fastest way to hand the person the session, so relay it to them. No such line means the feature did not come up, whatever the agent's status says.

**Then test the relay, because a started agent proves nothing.** Ask the coordinator to send one notice, then read its pane for the result and ask the person whether the session reaches them.

Two results are not a working relay:

- `Remote Control is disabled by your organization's policy. Contact your organization admin for access.` This project's own demo hit exactly this, with the flag accepted and the agent idle and the relay reaching nobody. **Before treating it as settled, say which account this session is signed in as and ask whether that is the one they meant.** The message names an organization, and a person with both a work account and a personal one can be signed in to the work one without noticing, where the feature is off by policy rather than off for them. If they are on the account they intended, say the transport is unavailable, record the coordinator pane as the relay, and say plainly that this run now has no way to reach them while they are away.
- The person does not see the session in their app. Treat a no as a no.

**Never record Remote Control as the relay on either.** A relay recorded but never reachable fails silently at the first real question, which is the one moment nobody is watching the terminal.

A not sent result while the person is at the terminal is different, and it is fine: that is `PushNotification` refusing to be redundant, not a block.

**Whichever transport was chosen, test it before moving on.** A relay nobody tested is a relay that fails at the first real question, which is the one moment nobody is watching the terminal.

### Step 8: Ask about the rest

- **Watch timeout seconds.** Not a polling interval: `herdr agent wait` returns the moment a worker settles, so a worker finishing never has to wait for it. **It is the longest a person's message can go unread**, because a tool call has to return before the agent sees anything new, so a coordinator sitting in a wait cannot read a stop request until that wait ends. Default 300, five minutes. Longer suits a run nobody intends to interrupt, and say so when recording it. Below 60 is waste, since each expiry costs a turn.

  **Record it in seconds and pass it to Herdr in milliseconds.** `herdr agent wait --timeout` takes milliseconds, so 300 in the roster is `--timeout 300000` on the command line. Writing the roster value straight into the flag makes a five minute wait a five second one.
- **Quota resume.** Default on. Explain it honestly: the harness reads the pane, recognizes that the worker said it is out, and wakes it at the time the worker itself printed. It does not measure token usage, because nothing here can.

### Step 9: Write the file

Write `.konteksto/harness.md` from `templates/harness.md`. Fill every field. Preserve any existing Dispatch log rows. End the file with the drafted by line, as every generated document in this workflow does.

Report the roster, the transport, and the exact next command, which is `/dev-harness start`.
