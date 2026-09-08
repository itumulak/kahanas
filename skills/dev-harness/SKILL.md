---
name: dev-harness
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
argument-hint: [start | stop | config | instruction]
description: "Run /dev-harness to drive the delivery loop across separate Herdr panes: a coordinator that relays, a developer that builds, and a reviewer on a different model that reads the code it did not write. It dispatches only routes the owning skills already recorded, and relays every decision a person owns to the person, over Claude Remote Control or its own pane. Config can install Herdr when missing. Running the harness requires HERDR_ENV=1."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The delivery loop already knows what to do next. `/dev-loop` records `Next action` in `.konteksto/loop-state.md`, and `/dev-audit` records `Next route` for every open finding. What neither of them can do is run the next step somewhere else, on a different model, while a person is away from the keyboard.

That is this skill. It runs one agent per Herdr pane and moves recorded routes between them:

```
coordinator  →  developer  →  coordinator  →  reviewer  →  coordinator  →  person
```

- **coordinator** relays. It reads the route, sends it to the right pane, watches, and reaches the person when a decision is theirs.
- **developer** builds: `/dev-loop`, `/dev-develop`, `/dev-check verify`, `/dev-debug`, `/dev-design`, `/dev-architect`, `/dev-test`. It runs `/dev-architect` so a run does not stop at every unmade decision, and it relays every options panel rather than answering one.
- **reviewer** reads code it did not write: `/dev-check review`, `/dev-audit`, `/dev-qa`, `/dev-sync`. On a different model from the developer, which `config` enforces.

`config` asks which AI and which model runs each role, and what each moves to when the work turns out to be harder than its base model. Claude and Codex are offered first because Herdr recognizes both and both are known to work here, and any other agent this machine has installed is offered beside them.

**It requires Herdr.** `config` checks for the CLI first and offers the official stable installer when it is missing. **`config` itself runs anywhere**, inside a pane or outside one, because it is the setup step and driving a named session over the CLI is what it does either way. `start` and `stop` need a live session and the coordinator's own pane, since that is where a run is held. Never fall back to something weaker: a subagent is not a pane, it does not survive the session, a person cannot type into it, and it cannot be a second model holding a second window open for an hour.

## The rule this skill exists to keep

**The coordinator dispatches a route another skill recorded. It never computes one.**

Reading a review report and choosing between `/dev-debug` and `/dev-loop` looks like the coordinator being useful. It is the project growing a second copy of routing rules that `/dev-loop` and `/dev-audit` already own, including every failure verdict, every repair cap, and every ownership escape. The copy nobody edits is the copy that goes wrong, and this project has already shipped that bug twice with plain counts.

When no route is recorded, the harness asks a person. It does not choose. `internal/dispatch.md` is where that rule lives.

## Where this sits

**Before this:** `/dev-architect`, so there is a build plan to run. `/dev-design`, on a project with an `app/`.

**After this:** nothing. This skill is the outermost loop. It calls no skill itself; it sends text to a pane where a person or another agent runs one.

## Artifact ownership

**Owns `.konteksto/harness.md`**, created from `templates/harness.md`. The Session and Roster sections are rewritten by `config`. The Dispatch log is append only and survives a reconfigure.

**Owns nothing else, and this is most of the skill.** It never writes `loop-state.md`, `progress-tracker.md`, `decision-log.md`, `audit-register.md`, `human-decisions.md`, a review report, a design record, a test, or a line of application code. It never writes a Status, a Verify Check, an Evidence row, or a QA result.

**The coordinator runs `/dev-document pr` when a pushed run completes, and that is running a skill rather than owning its output.** A local-only run stops after reporting completion. `/dev-document` still owns the title, the body, and what may go in them. The coordinator does not compose a pull request body, summarize the run into one, or add a line to what that skill wrote. It is the same rule as never inventing a route, applied to prose.

**It always causes commits; pushing is the one configured action that moves work outside this machine.** Each window commits what it wrote before it hands back, and pushes the roster's working branch only when the roster says to. **The coordinator commits `.konteksto/harness.md` under the same rule**, because the Dispatch log is the only record of what was sent and where each route came from, and nothing else in the project can reconstruct it. The harness never pushes the base branch, never forces, and never reconciles a rejected push. `internal/dispatch.md` holds the whole envelope.

A person's answer relayed from a phone is delivered to the pane that asked, and the skill that asked is the skill that records it. That keeps every answer filed by the owner of the stage it belongs to, which is the whole point of splitting `human-decisions.md` by stage in the first place.

## Guardrails

**`start` and `stop` run in the coordinator's pane and nowhere else.** Typed in a worker's window, or outside Herdr entirely, they are passed to the coordinator and the person is told so in the window they typed into. A relay that says nothing looks exactly like a command that did nothing, and the next thing somebody does is run it again somewhere else. `modes/start.md` Step 1 is the check, and `stop` runs the same one. `config` is the exception and runs anywhere, because it is what creates the coordinator in the first place.

**Never invent a route.** Covered above, and it is the one that matters most. It is also the rule this skill has actually seen broken: a small coordinator model broke it twice in one run, dispatching a selector it worked out from `build-plan.md`, which is not in the read order. `modes/config.md` holds the floor that follows from that, and the Dispatch log's Route source column is what makes a break visible at all.

**Never claim a verdict you did not observe.** The harness watched a pane and moved text. It did not run the app, and it did not read the diff. `PASSED` belongs to `/dev-check verify`, `DONE` to `/dev-develop`, a QA result to `/dev-qa`. Repeating one of their verdicts as though the harness confirmed it reads exactly like a real observation to the next session, which is what makes it worse than saying nothing.

**Never claim to measure token usage.** Herdr reports `idle`, `working`, `blocked`, `done`, and `unknown`, and there is no usage API behind them. What the harness can do is read the pane, recognize that a worker said it is out, and wake it at the time that worker itself printed. Report it that way. `internal/quota-resume.md` holds the detail.

**Never treat `unknown` as finished.** Herdr says so itself: an agent is present but could not be classified. Read the pane before acting on it.

**Never collect a design approval.** Approval means a person saw the prototype rendered at every breakpoint and state it claims, in the `/dev-design` review session. A yes to a line of text in a chat is a different act, and recording it as approval would let every later surface inherit a pattern nobody actually looked at.

**Never let an escalation land on the reviewer's model.** A developer that climbs its ladder into the reviewer's model breaks the different model guarantee both windows exist to provide, and breaks it silently, so every review after that point is worth less than it appears. `internal/escalation.md` refuses that step.

**Never rewrite history that has been pushed, and never push anywhere but the working branch.** A commit that left this machine may already have been pulled, so amending, rebasing, or forcing it costs somebody else their afternoon, and a rejected push means another writer is on the run's own branch, which is a fact the person needs before anything is reconciled. Report it and stop.

**Never close a pane, tab, or workspace you did not create**, and never run `herdr server stop` unasked. A worker mid task holds work that is not written down yet. `config` asks whether the run lives in this workspace, a new one, or a new session, and records the answer as Created by config, which is what makes this rule checkable later instead of a judgment about who made what.

**A roster row is a convention, not a lock.** Any person can type into any pane, and another client can hold a session with the same names. This is the same honesty as the Assigned column in `progress-tracker.md`: an instruction agents follow and a record people can audit. A guarantee the system cannot keep is worse than no guarantee at all, so never report a pane as reserved.

## Pick the mode

Route before touching anything. Look at what followed `/dev-harness`:

- **`start`**, read `modes/start.md`. An optional task selector may follow it.
- **`stop`**, read `modes/stop.md`.
- **`config`**, read `modes/config.md`.
- **Anything else**, including a bare `/dev-harness`, read `modes/instruction.md`. A bare invocation asks which of the three the person meant, with `start` recommended when `.konteksto/harness.md` already exists and `config` recommended when it does not.

`start` and `stop` both run the `config` mode first when `.konteksto/harness.md` is missing or incomplete.

**Read only the mode file you routed to.**

## Reference files

- `modes/start.md`: read the recorded route, dispatch it, watch, relay.
- `modes/stop.md`: end dispatching without touching the panes.
- `modes/config.md`: the roster, the model split, the escalation ladder, the relay, the file.
- `modes/instruction.md`: what a person may change, and the two things they may not.
- `internal/dispatch.md`: the routing table, the wrapped prompt, the audit handoff, the watch cycle.
- `internal/relay.md`: the two transports, why Remote Control is preferred, and why a coordinator that is not Claude cannot reach anybody who is not watching its pane.
- `internal/escalation.md`: when a role moves up its model ladder, and the collision it may never cause.
- `prompts/coordinator.md`, `prompts/developer.md`, `prompts/reviewer.md`: the brief each window is sent verbatim. Read the one for the window you are dispatching to, at send time. Never rewrite one.
- `internal/quota-resume.md`: what a quota block looks like from outside, and when to wake a worker.
- `templates/harness.md`: the file this skill owns.
