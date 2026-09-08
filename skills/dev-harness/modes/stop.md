# /dev-harness stop (end the run, leave the panes)

The `stop` mode. It ends dispatching. It does not close anything a person did not ask it to close.

## Execution

1. Confirm the environment with `test "${HERDR_ENV:-}" = 1`. If the harness was never configured, there is nothing to stop: say so and offer the `config` mode.

2. Confirm you are the coordinator, the same way `start` does. Started elsewhere, tell the coordinator and stop:

```bash
herdr agent prompt <coordinator agent name> "HARNESS STOP | requested from: <this role>"
```

3. Stop dispatching immediately. Do not send a queued route, and do not wait for a worker to finish first.

4. Leave every worker exactly as it is. **Do not close a pane, a tab, or a workspace, and do not interrupt a running agent.** A worker mid task holds work that is not written down yet, and killing it to tidy up loses that. If the person wants a worker interrupted, they will say so, and then a single `herdr agent send-keys <name> esc` is the whole of it.

5. Append a closing Dispatch log row: what was in flight, which worker holds it, and where the route stands.

6. Report where each worker is, what is still running, and the exact command to pick the run back up, which is `/dev-harness start`. The recorded route in `loop-state.md` and `audit-register.md` is untouched, so a later `start` resumes from the same place.

7. Notify the person through the relay, once.

A stopped harness is a harness that is no longer relaying. The panes, the agents, and the recorded work all stay.

**Even a session or workspace that `config` created stays up, unless the person asks for it.** The Created by config field in the roster says what this harness made, and it exists so that offer can be made honestly rather than guessed at. Offer it, name what would close, and close it only on a yes. What `config` created it may take down; what the person already had it may not, and after the fact those look identical.

The reason to leave it even so is the same one as for the panes: a worker holds work that is not written down yet, and a session is the last thing standing between that work and losing it.
