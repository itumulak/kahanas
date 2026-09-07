# /dev-harness config (set up the roster)

The `config` mode. It decides which panes this project drives, which skills each may run, and how the person is reached. It dispatches nothing.

## Asks vs acts

Asks, almost entirely. This mode exists to record choices a person makes about their own machine and their own chat. It starts agents in panes, and it writes `.konteksto/harness.md`. It never touches project documents or code.

Running `config` again reconfigures. Read the existing file first, offer each current value as the default, and rewrite the Session and Roster sections. **Keep the Dispatch log.** It is append only history of what was actually sent, and a reconfigure is not a reason to lose it.

## Execution

### Step 1: Confirm the environment

```bash
test "${HERDR_ENV:-}" = 1
```

If that fails, say plainly that this skill drives Herdr panes and cannot run outside a Herdr session, and stop. Do not fall back to subagents. A subagent is not a pane, does not survive the session, and cannot be typed into by a person, which is most of what this skill is for.

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
- **Skills allowed.** The default split is in `templates/harness.md`. An extra window needs its own list, and a skill listed for no window cannot be dispatched at all.

### Step 3: Ask which AI and which model runs each role

**Ask per role. Never detect a model and assume it.** The three roles do different work and are worth different money, so they are three separate questions, each with its own recommendation.

Claude and Codex come first because both are known to work in this workflow and Herdr recognizes both. Other agents are offered and never discouraged. **OpenCode and Pi are the way to an open weight model here**, since both front many providers and local models, so a person who wants an open weight model on a role picks one of those and names the model inside it. Gemini and every other kind Herdr recognizes stay on the list too.

Run `herdr agent start --help` for the kinds this Herdr build supports, and check which of those agents are actually installed on this machine. **Offer nothing that is not installed**, and record the exact model identifier the installed agent accepts rather than a family name. A name that does not resolve fails at the moment a run is already in trouble.

> Which AI runs the coordinator? It relays routes and messages, and does not write code, so the cheapest capable model is usually right.
> **Claude, on its small fast model** (recommended): enough for reading a route and relaying a question.
> **Codex, on its small fast model**: the same job on the other provider.
> **OpenCode or Pi**: the route to an open weight or locally hosted model, or to a provider the other options do not cover.
> **Another agent**: Gemini, or anything else Herdr recognizes and this machine has installed.

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

### Step 6: Create what is missing

For a role with no pane yet, split from the caller and keep the person's focus where it is:

```bash
herdr pane split --current --direction right --cwd "$PWD" --no-focus \
  --env POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true
```

Split a wide pane to the right and a tall one down. Read the new pane id from `.result.pane.pane_id`.

**That environment variable is not decoration.** A shell using Powerlevel10k with no saved configuration for this terminal opens its setup wizard instead of a prompt, and a pane sitting in a wizard is not a pane an agent can start in. `agent start` then fails with a pane that looks perfectly healthy from the outside. This project's own first demo lost three panes to exactly that. The variable is harmless on a shell that does not use Powerlevel10k.

**Check the pane reached a prompt before starting an agent in it.** Read it, and expect a prompt rather than a question:

```bash
herdr pane read <pane id> --source visible --lines 12
```

Anything that is asking the person something, from any prompt framework, means the shell is not at its prompt yet. Say what the pane is showing and let the person settle it. Do not send keys into a wizard to guess your way past it.

Then start the agent in it:

```bash
herdr agent start <name> --kind <kind> --pane <pane id> -- <model arguments for the base model>
```

Native agent arguments go after `--`, and that is where the base model is selected. Start each role on its base model, never on its escalation model.

**Start a Claude coordinator with Remote Control on**, so step 7 has the option available without a restart:

```bash
herdr agent start coordinator --kind claude --pane <pane id> -- --remote-control coordinator --model <base model>
```

It costs nothing if the person then picks a different relay, and it saves killing a freshly started agent to add one flag.

**Expect a trust prompt the first time an agent starts in a directory.** Claude Code and Codex both ask whether the folder can be trusted before they will accept input, and Herdr returns `agent_not_ready` while that dialog is up. The name still resolves for `agent read` and `agent send-keys`, so read the pane, show the person exactly what it asks, and let them answer. **Never answer it yourself**, and never send a blind Enter: the two agents do not agree on which option is highlighted, so the same keystroke trusts one and quits the other. Answering once usually covers every later pane of that same agent in that same directory.

### Step 6b: Ask whether the roles run unattended

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

**Even unattended, a folder trust prompt still appears the first time an agent starts in a directory**, and the skip approvals flags do not answer it. Step 6 covers that.

**Allow the coordinator to run `herdr` commands without asking.** Its watch cycle calls `herdr agent wait`, `herdr agent get`, and `herdr agent read` continuously, and an agent that needs approval for each one stops on the first poll and never reaches the worker it is watching. In this project's own demo the coordinator stalled on `herdr agent get developer` while the developer sat blocked on a question. Tell the person to accept the standing permission for `herdr agent *` the first time that pane asks, or to add it to the project's allowed tools before starting.

This applies to the coordinator pane only. A worker has no reason to drive Herdr beyond its one hand back call.

Confirm each role really came up before moving on:

```bash
herdr agent list
```

Expect the name, the pane, the kind you chose, and a status of `idle`. A role that is not in that list did not start, whatever the pane looks like.

**Expect a trust prompt the first time an agent starts in a directory.** Claude Code and Codex both ask whether the folder can be trusted, and a pane sitting on that question returns `agent_not_ready` even though the agent is running and the name still works for `agent read` and `agent send-keys`.

**Relay it. Never answer it yourself**, and never send a bare Enter to clear it. It is a security question about the person's own machine, and the two agents do not even default to the same answer: Codex preselects yes, Claude Code preselects `No, exit`, so one blind Enter trusts a folder and the other quits the agent. Read the dialog, show it to the person, and send only the choice they make.

Answering it once usually covers the other panes of the same agent kind in the same directory, since the trust decision is stored per directory. Do not assume that; read each pane.

Do not create a workspace, a tab, or a worktree. Do not change the working directory. The harness drives the project the person is already in.

### Step 7: Ask how the harness reaches the person

**The answer depends on the coordinator's kind, so ask it after step 3, not before.** Claude Code can hold a session the person reaches from their phone, and no other agent in the roster can. When the coordinator runs Claude, that is the recommended answer, subject to the test below, since an organization can switch the feature off for an account. When the coordinator is not Claude, Remote Control is not on the list at all, because offering something this machine cannot do wastes the person's time at exactly the wrong moment.

With a Claude coordinator:

> How should the harness reach you when a decision is yours?
> **Claude Remote Control** (recommended): the coordinator pushes a one line notice to your phone, you open that session, and you answer in it. Nothing to create, no token to keep out of a file, and no channel a third party can post into, because it is your own authenticated session. You see the real session rather than a summary of it.
> **Telegram with the shipped poller**: reaches a chat rather than the session. The poller holds the update offset, applies the sender allowlist, and parses the verbs, so nothing is replayed and a stranger in the chat cannot steer the run.
> **Telegram with curl**: nothing to install. The coordinator sends and reads inside its own watch cycle, and keeps the offset and the allowlist itself.
> **No relay**: every question is asked in the coordinator pane instead. The routing does not change.

Without a Claude coordinator, ask the same question with the first option removed, and say in one line why: Remote Control is a Claude Code feature, and this coordinator runs something else.

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

- `Remote Control is disabled by your organization's policy. Contact your organization admin for access.` This project's own demo hit exactly this, with the flag accepted and the agent idle and the relay reaching nobody. **Before treating it as settled, say which account this session is signed in as and ask whether that is the one they meant.** The message names an organization, and a person with both a work account and a personal one can be signed in to the work one without noticing, where the feature is off by policy rather than off for them. If they are on the account they intended, say the transport is unavailable and ask them to pick Telegram or the coordinator pane instead.
- The person does not see the session in their app. Treat a no as a no.

**Never record Remote Control as the relay on either.** A relay recorded but never reachable fails silently at the first real question, which is the one moment nobody is watching the terminal.

A not sent result while the person is at the terminal is different, and it is fine: that is `PushNotification` refusing to be redundant, not a block.

**For either Telegram choice**, collect the environment variable names, not the values. Default to `KAHANAS_TELEGRAM_BOT_TOKEN` and `KAHANAS_TELEGRAM_CHAT_ID`. Confirm both are set in this shell without printing either:

```bash
test -n "${KAHANAS_TELEGRAM_BOT_TOKEN:-}" && echo "token variable is set"
test -n "${KAHANAS_TELEGRAM_CHAT_ID:-}" && echo "chat variable is set"
```

If either is missing, say so and let the person set it or pick another transport. **Do not record Telegram as the relay when its credentials are absent**, since a relay recorded but never reachable fails silently at the first real question.

Ask for the allowed sender ids. Explain what the setting is for in one line: anyone who can post in that chat can try to steer the run, and an allowlist is what limits that to the person who owns it.

Create `.konteksto/.harness/` for the update offset, and add that folder to `.gitignore`. It is churn, and it is per machine.

**Whichever transport was chosen, test it before moving on.** A relay nobody tested is a relay that fails at the first real question, which is the one moment nobody is watching the terminal.

### Step 8: Ask about the rest

- **Watch interval seconds.** Default 15. Under 5 is noise, over 120 makes a blocked worker wait too long.
- **Quota resume.** Default on. Explain it honestly: the harness reads the pane, recognizes that the worker said it is out, and wakes it at the time the worker itself printed. It does not measure token usage, because nothing here can.

### Step 9: Write the file

Write `.konteksto/harness.md` from `templates/harness.md`. Fill every field. Preserve any existing Dispatch log rows. End the file with the drafted by line, as every generated document in this workflow does.

Report the roster, the transport, and the exact next command, which is `/dev-harness start`.
