# /dev-harness start (run the loop across panes)

The `start` mode. It reads the route another skill recorded, sends it to the window that owns it, watches, and relays anything a person must decide.

Accepts an optional task selector, as in `/dev-harness start 03-05`. That selector is a route a person supplied, so it may be dispatched. Without one, the route comes from the files.

## Execution

### Step 1: Confirm the environment and the roster

```bash
test "${HERDR_ENV:-}" = 1
```

Fail that check and stop, with the same reason as `config`.

Read `.konteksto/harness.md`. If it is missing, or any required Session field or Roster row is unfilled, say the harness is not configured yet and run the `config` mode. Do not guess a roster from the panes that happen to be open.

Confirm every roster agent is live:

```bash
herdr agent list
```

A named agent that is not live is a stopped or replaced pane. Report which role is missing and offer to run `config` for that role alone. Do not start an agent of a different kind in its place.

### Step 2: Confirm you are the coordinator

```bash
printf '%s\n' "$HERDR_PANE_ID"
```

If that pane is the coordinator row, continue.

If it is not, this mode was started in the wrong window. Do not run the loop from here. Tell the coordinator and stop:

```bash
herdr agent prompt <coordinator agent name> "HARNESS START | requested from: <this role> | selector: <selector or none>"
```

Then say which pane the run is now in. Two coordinators dispatching from the same recorded route will send the same work to the same worker twice.

### Step 3: Read the route

Follow `internal/dispatch.md`. Read the route, map it to a window, and stop at any of its escapes: a blocked phase, a completed phase, or a skill no roster row allows.

With a selector supplied on the command, the route is `/dev-loop <selector>` to the developer window. Record `human` as the Route source.

With no selector and nothing recorded anywhere, ask the person which tasks to run, through the relay in `internal/relay.md`. Wait for the answer. Do not read the build plan and pick.

### Step 4: Dispatch and watch

Follow `internal/dispatch.md` for the wrapped prompt and the watch cycle. Every cycle does three things:

1. Check each dispatched worker with `herdr agent get`.
2. Check for anything the person sent, per `internal/relay.md`.
3. Check for a quota block, per `internal/quota-resume.md`.

Never hold the coordinator inside a blocking wait. A coordinator that cannot read its inbox is a coordinator that cannot relay the question the worker is stuck on, which is the whole reason it exists.

### Step 5: Handle what comes back

A hand back report, a `blocked` pane, a person's message, and a quota block are the four things that happen. Each is handled where it is defined: reports and blocked panes in `internal/dispatch.md`, messages in `internal/relay.md`, quota in `internal/quota-resume.md`.

After each one, re read the route from its file and dispatch again. The cycle ends when the recorded phase is `complete`, when it is `blocked`, when a person says `stop`, or when the route names an owner outside the roster.

**Every one of those endings reaches the person through the relay, not by writing a question into your own pane and waiting.** Read `internal/relay.md` and use the transport recorded in `.konteksto/harness.md`. This project's own demo had a coordinator reach the right verdict, name the ownership gap correctly, and then ask about it only in its own pane, where nobody was looking. A correct decision nobody is told about is the same as no decision.

On Remote Control that means calling `PushNotification` with a one line summary. **Expect it to decline while the person is at the terminal, and send it anyway**: the decline is the tool refusing to be redundant, the session still carries the question, and the question stays in your pane either way.

### Step 6: Report the phase as done

On `complete`, notify the person with the task ids, the phase reached, and where the evidence is. Append the closing Dispatch log row. Leave `loop-state.md`, `progress-tracker.md`, `decision-log.md`, and `audit-register.md` exactly as their owners wrote them.

Say what was actually observed. The harness watched panes and relayed text; it did not run the app and it did not read the code. The pass belongs to `/dev-check verify` and `/dev-qa`, and repeating their verdict as though the harness confirmed it is the same failure as fabricated evidence.
