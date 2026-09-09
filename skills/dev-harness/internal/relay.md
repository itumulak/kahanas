# Relay (how the harness reaches the person)

Read this when the harness needs a person, or at each watch cycle to read what they sent back.

## What a relay is

**A transport, never a decider.** It carries a question out and an answer back. The skill that asked the question is the skill that records the answer.

This matters because of the one invariant the whole workflow rests on: no downstream skill may create upstream intent. When `/dev-develop` stops on a decision it may not make, the harness relays the question, the person answers, the harness delivers that answer to the pane that asked, and `/dev-develop` proceeds and records it. The harness writes nothing into `human-decisions.md`, `project-overview.md`, or any design record. If it did, a person's answer would be filed by a skill that does not own the stage it belongs to.

**Relay the question whole.** Send the question text, every option, and the recommendation marker exactly as the asking pane presented them. The owning document keeps the question and all options for provenance, and a relay that sends only the recommended option destroys that.

**Design approval never happens over a relay.** Approving a design means a person saw the prototype rendered at every breakpoint and state it claims. `/dev-design` runs that session, and a yes to a line of text is not the same act. A relay may say a design is ready to review. It may not collect the approval. If an answer tries to approve a design, reply that the approval belongs in the `/dev-design` review session and record it nowhere.

**So say where the approval does happen, and name the surface.** Refusing to carry the approval is only half the job, and on its own it leaves a person told that something is blocked with no way to unblock it. The review is a browser session somebody drives, usually a fresh session in another terminal rather than a pane, and that session starts cold: it knows nothing about this run, and `/dev-design` routes on the surface's row in `design-registry.md`. **A message that does not name the surface cannot be acted on**, whatever else it says.

Carry all five, every time:

| What | From |
| --- | --- |
| The surface, spelled exactly as `design-registry.md` spells it | the worker's report, or the tracker Note on the `BLOCKED` task |
| The task it is blocking, and its phase | `.konteksto/loop-state.md` |
| What is missing or wrong | the tracker Note, which the visual gap rule requires |
| The command to run, `/dev-design <surface>` | this table, verbatim |
| That it runs in a fresh session, and that the run stays stopped until the row reads `APPROVED` | this row |

**Then say the run is waiting, and on what.** A person who does not know the harness is stopped will not think to come back, and the pane sits idle while they assume it is working.

**When they say it is done, the row is what decides.** Read the surface's row in `design-registry.md` before resuming anything. A person saying they approved it and a row that still reads `READY FOR REVIEW` means the approval was not recorded, and resuming on the word rather than the record sends the developer back into the same gap. `internal/dispatch.md` holds the resume route.

## When to reach out

Reach the person on exactly these:

- A worker stopped on a decision a person owns.
- A worker is blocked on an approval dialog.
- **A design is waiting on a person**, meaning a surface reached `READY FOR REVIEW` or a worker stopped on a visual gap.
- A phase is done.
- The run is blocked, including a route no roster window may run.
- A worker is out of quota, with the resume time it reported.
- A role escalated to a stronger model.
- A reply to a status request.

Do not narrate ordinary progress. A channel that reports every step is a channel nobody reads, and the one message that mattered arrives in the middle of forty that did not.

## Pick the transport

`config` settles this and records it in `.konteksto/harness.md`. There are two, and the first is better wherever it is available, which is why the coordinator's own kind is chosen with this in mind rather than after it.

### Remote Control, when the coordinator runs Claude

Claude Code can hold a session the person reaches from their phone. Start the coordinator with it enabled:

```bash
herdr agent start coordinator --kind claude --pane <pane id> -- --remote-control coordinator --model <base model>
```

Then reaching the person is one call from inside the coordinator session:

```
PushNotification with a one line message saying what is needed
```

The person opens that session on their phone and answers in it. Their answer arrives as ordinary input to the coordinator, which then delivers it to the pane that asked.

A working coordinator says so in its own banner at startup, naming Remote Control as active and printing a `https://claude.ai/code/session_...` link. Read that link once and give it to the person: it is the session, and it is how they reach it from anywhere.

**This is the recommended transport, and the reason is mostly about the inbound side.** There is no bot to create, no token to keep out of a file, and no chat that a third party can post into, because the channel is the person's own authenticated session. They also see the real session rather than a summary somebody wrote of it, which matters most in exactly the case that needs them: a question whose options only make sense next to what the worker was doing.

**It only works when the coordinator is Claude.** A coordinator on Codex, OpenCode, or Pi has no Remote Control, so that roster falls back to the coordinator pane and cannot reach anybody who is not watching it.

**An organization can switch Remote Control off, and the flag still starts.** On a blocked account the coordinator comes up, reports itself started and idle, carries `--remote-control` in its argv, prints no active banner, and reaches nobody. The block itself only surfaces when something tries to use it:

```
Remote Control is disabled by your organization's policy. Contact your organization admin for access.
```

So the flag being accepted is not evidence. The banner is, and a delivered message is.

That message names an organization, and the policy belongs to the account the session is signed in as. **Check which account before concluding anything.** This project's own demo lost an afternoon to exactly this: the same machine and the same command reached nobody on a work account and worked immediately on a personal one, with nothing but the signed in account different. A person holding both can be on the work one without noticing.

On an account that really is blocked, Remote Control is not an option, whatever the coordinator's kind. Fall back to the coordinator pane, and say plainly that the run can no longer reach the person while they are away from it.

**A push is not guaranteed delivery, and the session is what carries the question.** `PushNotification` deliberately sends nothing when it judges the person to be at the terminal, returning a not sent result that says so, and a prompt arriving in the coordinator counts as the person being there. So the push is a nudge, never the message. **Always leave the question in the coordinator pane**, where the person reads it whether the nudge fired or not, and never treat a sent push as proof anybody was told.

### The coordinator pane, when the coordinator is not Claude

Every moment in the list above becomes a question in the coordinator's own pane, asked with `AskUserQuestion` where available. Nothing in the routing changes. The transport decides where the person is reached, never what they are asked.

## The coordinator pane is a fallback, not a peer

It reaches the person only while somebody is looking at that pane, which is the opposite of what a harness is for. **It is also the transport that can deadlock**: an agent that asks its own question goes `blocked`, which ends the watch cycle, and a coordinator that is not watching is a coordinator that cannot relay anything at all. This project's own demo hit exactly that on an OpenCode coordinator, which sat blocked on its own dialog for nine minutes with nobody watching.

So when the coordinator does not run Claude, say plainly that this run has no way to reach the person while they are away, and that switching the coordinator to Claude is what buys it back.
