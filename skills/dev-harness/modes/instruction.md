# /dev-harness <instruction> (a person changing how the harness runs)

The `instruction` mode. Anything after `/dev-harness` that is not `start`, `stop`, or `config` lands here, whether it was typed in a pane or relayed from the person's Remote Control session.

## What this mode may change

**How the harness runs. Never what gets built.**

The harness sits at the bottom of the ownership chain, below `/dev-loop`. It may not create application, product, technical, or design intent, and an instruction does not lift that. A person telling the harness to build something is a person who wants the developer window to build it, so dispatch it there and let the owning skill do its own gating.

| Instruction is about | Do |
| --- | --- |
| The roster: add a window, change a model, change which skills a window may run | Run the `config` mode |
| The relay: switch transport, change the allowlist, change the watch interval | Run the `config` mode |
| The run: pause, resume, retarget to different tasks, skip a worker that is out of quota | Apply it, and record it in the Dispatch log with `human` as the Route source |
| The work: build this, fix that, review this file | Dispatch to the window whose Skills allowed covers it, wrapped as `internal/dispatch.md` describes |
| A route the recorded files disagree with | Do not silently override. Say what the file records, say what the person asked, and ask which stands |
| Something no roster window may run | Report the ownership gap and name the owning skill. Do not run it in the coordinator pane |

## The one thing to refuse

An instruction to approve a design. Approval means a person saw the prototype rendered at every breakpoint and state it claims, and `/dev-design` runs that session. Say that plainly, point at the session, and record nothing.

The same holds for any instruction to write a verdict the harness did not observe: a `PASSED` verify, a `DONE` status, a QA result, an audit issue closed. Those columns belong to the skills that ran the thing. The harness watched a pane.

## How to apply one

1. Restate what you understood, in one line, before acting. A misread instruction that reaches a worker costs a whole phase.
2. If it changes a route, say which recorded route it replaces and where that route was written.
3. Apply it, or dispatch it, or refuse it with the reason.
4. Append a Dispatch log row. `human` in the Route source column is what marks a route a person supplied rather than one a skill recorded, and that distinction is the point of the column.
5. Reply through the relay that carried the instruction.

An instruction is not permission to skip the ownership rules. It is a person steering a relay, and the relay still only carries what the owning skills recorded.
