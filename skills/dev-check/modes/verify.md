# /dev-check verify (runtime proof)

The `verify` mode of `/dev-check`: run the real app and prove the task works. Follow it fully.

## Your role

The acceptance engineer. Trust observed behavior over green checkmarks. A passing type check proves the code compiles, not that the feature exists. Ask: "if I had to sign off that this is real, what would I need to watch happen with my own eyes?" Then drive the actual thing and judge what you see against what the task was supposed to deliver.

This mode closes the gap between "it builds" and "it works":

1. Turns every UI and Logic subtask goal into its own checklist of observable conditions, anchored to the flows in `project-overview.md` and the architecture.
2. Runs the app the project's own way, which for this workflow means its compose stack.
3. Exercises the changed flow and observes: the rendered page for UI, the response body for an API, the output for a command, the logs for a job.
4. Reports evidence and a verdict for every condition and every subtask, plus the rolled up task verdict.

## Asks vs acts

Acts. Scopes from git, works out how to launch, runs, observes, reports. Asks only when it cannot determine how to start the app, or which flow to exercise, for example a route needing seeded data or credentials.

Never modifies application code. Report the breakage and point at `/dev-develop`.

## Artifact ownership

Owns no whole file. Chat output only, plus screenshots and logs saved to a scratch area, and two narrow writes.

**Write one: Verify Check cells.** After every condition has been judged, update each resolved child row independently. A `MET` subtask receives `PASSED`; a `FAILED` subtask receives `FAILED`; a `BLOCKED` subtask stays unchanged. Then write the aggregate task row: `PASSED` only when the task Goal and every child passed, `FAILED` when the task Goal or any child failed, and unchanged when nothing failed but anything is blocked.

Every written value uses the tracker's three line stamp: `PASSED<br><your exact model identifier><br><YYYY-MM-DD HH:MM from the system clock>`. Never join the fields with commas. The first stamp replaces the untouched `—` placeholder directly. A cell that already holds a stamp is superseded, never overwritten: strike the whole old three line stamp and append the new stamp after `<br><br>`, leaving exactly one unstruck stamp. On a child `FAILED`, put its label and a one line summary in that child's Note. On an aggregate `FAILED`, name the failed task Goal and/or child labels in the aggregate Note. A `PASSED` that supersedes `FAILED` clears that row's Note back to `—` in the same edit.

**A task whose aggregate and child Status rows read `BASELINE` gets no cell written at all.** That value says the feature was finished before this workflow arrived, so there is no build of yours to verify and a `PASSED` beside it would claim this workflow delivered something it did not. Stop, write nothing, and say in the report that the task is baseline and outside verification. `progress-tracker.md` defines the value.

**That is about the task, not about the surfaces.** An ordinary new task touching a surface at `BASELINE` is verified normally, with the one adjustment in the design conformance list below.

**Verify Check is the only column in `progress-tracker.md` you own.** Status is `/dev-develop`'s and the aggregate Assigned cell is a person's. Never change either, however plainly wrong it looks. You may update Note only beside a Verify Check you just changed, under the rule above.

**`design-registry.md` and the prototypes in `.konteksto/designs/` are read only to you, and completely.** Not a status, not a row, and never a line of a prototype, however plainly it needs fixing. That whole folder is `/dev-design`'s, `APPROVED` is a person's word alone, and a design you corrected to match the build is a design nobody approved.

**BLOCKED is local to the unresolved row.** Leave that child Verify Check unchanged. Other children whose conditions fully resolved still receive their own stamps after the run. When any child or task Goal is blocked and none failed, leave the aggregate Verify Check unchanged. This records proven subtask results without fabricating a complete task verdict.

**Write two: the Evidence row.** On a PASS, append an Evidence row to `decision-log.md` recording how many subtasks and conditions you exercised, that every one passed, and the decisive evidence locations. That is how a later session tells a fully exercised task from an assumed one.

Read the log's Who writes what section before the first append. Yours is the row that claims the behavior was observed. Append it at the bottom, and never edit a row `/dev-develop` or `/dev-debug` wrote.

The row carries the Timestamp as `YYYY-MM-DD HH:MM` from the system clock, the Author as your exact model identifier such as `claude-opus-5`, the Skill as `/dev-check`, and on a team project the Actor from `git config user.name`. Write `unknown-model` and say so rather than guessing one. **Author matters most on your rows**, since verify is the mode most often run on a different model than built the code. You write Evidence only, never a Decision.

**A fail writes the tracker cell and no log row.** The tracker cell is the verdict, and a failed verdict is worth recording; an Evidence row records proof that behavior works, and a failure does not provide it.

---

## Execution

### Step 0: Pick the mode

- **Feature mode** (default): the change adds or alters behavior. Confirm it does the new thing. Steps 1 to 5.
- **Refactor mode**: the change is meant to preserve behavior exactly, for example a rename, a deduplication, or a move. Here "works" means identical before and after. Go to step 0a.

### Step 0a: Refactor mode, the before and after diff

Only in refactor mode. This drives the app twice and holds two sets of output, so run it in a subagent to keep the main context clean. Give it a strong model explicitly rather than inheriting the session model.

Its job:

1. **Load the task contract when one exists.** Read the records in step 0b and build the subtask checklist exactly as that step requires. Every subtask condition is in scope. With no task contract, identify affected surfaces from the diff and pick representative ones per changed area.
2. **Capture the before.** Prefer a throwaway git worktree at the reference before the change: `git worktree add <tmp> <ref>`, start the app there, hit each surface, save the raw output, then `git worktree remove <tmp>`. This leaves the working tree and its untracked files untouched.
   Only if worktrees are unavailable, fall back to `git stash --include-untracked`. **Plain `git stash` leaves new files behind and contaminates the before**, which quietly invalidates the whole comparison. Restore with `git stash pop` afterwards.
3. **Capture the after.** With the change applied, start the app, hit the same surfaces the same way, save the output.
4. **Diff before against after**, per subtask condition when a contract exists, otherwise per selected surface. For a behavior preserving change they must be identical, apart from differences that are intentional and documented. Any other difference is a regression.

For a planned task, report every subtask and condition with its before and after evidence. Apply the same rollup rule as step 4: PASS only when every condition is met, FAIL on any regression, and BLOCKED when a required comparison could not run. Write the task verdict and passing Evidence row under the Artifact ownership rules. With no task, relay which surfaces were diffed, which matched, and the exact diff for any that did not. Then stop. Skip the feature mode steps.

### Step 0b: Load the contract

The contract is spread across the records below. Load all of them before scoping.

- **`project-overview.md`**, the Core User Flow section for every page this task touches. Those steps are the real acceptance criteria, because they describe what a person actually does. Give each one a number as you list it, so the verdict can refer to it.
- **`build-plan.md`**, this task's Goal and its UI and Logic subtask goals. Every goal names an outcome that is supposed to exist now.
- **`progress-tracker.md`**, the matching aggregate task row and every child row. The Goal and each numbered UI and Logic subtask must reproduce the plan word for word and in order. If a row is missing, extra, combined, reordered, or reworded, stop and route both documents to `/dev-architect`; do not verify against whichever version looks more complete.
- **`architecture.md`**, every Stack, System Boundary, data flow, Invariant, Security model, Value Sourcing, and operator condition referenced by this task's goals. Read enough surrounding detail to turn each subtask into the right checks rather than testing only that a named component exists.
- **`design-registry.md` and the approved prototype**, for every surface a UI task touches. The prototype is the visual and interaction specification a person approved, and it is as much a contract as the flow steps are. Skip this on a backend, and on a task with no UI.

**Add one behavior per Value Sourcing row**, and exercise the edge that breaks when the source is wrong. Vary the input the source depends on and check the output changes correctly: a different timezone, a different locale or currency, a different tenant.

This is the layer that catches a mis sourced value, and nothing else does. A value derived from the wrong source produces a perfectly plausible result for the common case, passes every type check, and is only wrong for the user in another timezone or another tenant. `/dev-develop` checks at design time that a source is named. This checks that the named source is the right one.

You now hold four lists: the flow steps to confirm, the task and subtask goals to confirm, the values to confirm are sourced correctly, and on a UI task the design conformance list below. Carry all of them into every later step.

### The subtask checklist

Build this before running anything. Number the subtask goals in plan order as `UI 1`, `UI 2`, `Logic 1`, `Logic 2`, and so on. Copy each goal exactly. Then split it into every independently checkable condition it asserts.

**Do not sample and do not merge subtasks.** A task with seven subtask goals gets seven subtask verdicts. A subtask that names four services has at least four conditions. A successful compose command does not prove each service is healthy, reachable, and performing the role the goal names.

For every condition, decide the observation that would prove it before exercising the app:

| Field | Meaning |
| --- | --- |
| Subtask | its stable label and exact text from `build-plan.md` |
| Condition | one concrete claim inside that subtask goal |
| Check | the action that can prove or disprove the condition |
| Evidence | the result captured while running the check |
| Verdict | `MET`, `FAILED`, `BLOCKED`, `MISSING`, `NOT LIVE`, or `OFF DESIGN` |

One observation may support several conditions only when it actually proves each one. Cite it under every condition it supports. Never use a general result such as "the app started" as evidence for a narrower promise such as a working queue handler or WebSocket gateway.

The task Goal gets its own observable conditions too. It is the rolled up outcome, not a free pass inferred from completed subtasks.

**The design conformance list**, built by reading the approved prototype:

- every region present, in the same order and grouping
- the hierarchy reading the same way, meaning what draws the eye first
- every state the prototype demonstrates, reachable in the built page
- every interaction it demonstrates, behaving the same way
- every breakpoint `design.md` defines, composed as designed rather than merely reflowed

**Build no conformance list for a surface at `BASELINE`.** That row means the surface shipped before this workflow and no prototype was ever owed, so there is nothing to compare against and a fail for not matching a file that does not exist is noise. Verify its behavior against the flow steps as normal, and say in the report which surfaces you checked this way. `design-registry.md` defines the value.

**Exact pixel equality is not the bar and you must not report against it.** `/dev-develop`'s `ui-guide.md` defines fidelity and the order in which it yields. The list above is the checkable form of it, which is why it is the list.

**Accessibility outranks reproduction.** Where the built page departs from the prototype to fix a contrast or touch target problem, that is a pass with a note, never a fail. `/dev-develop` was told to report those departures, and a departure it reported and you confirmed is the system working.

**Route every confirmed departure to `/dev-design`, because it makes the prototype stale.** The implementation is right and the approved design is now wrong, so that row has to reach `CHANGE REQUIRED` and the prototype has to be fixed. Neither you nor `/dev-develop` may write that, which is exactly why saying it in your report is the only thing that moves it. A departure nobody routed leaves an inaccessible pattern sitting under the word `APPROVED`, where the next surface copies it.

No task and no matching flow, for example a small fix outside the plan? Verify against observed behavior alone, and say in the report that there was no contract to check against.

### Step 0c: Calibrate what "working" means

Read the **Core Principle** at the top of `build-plan.md`. It is the one fixed rule every task in the plan obeys, and it sets the bar for this task.

The wrong bar produces false failures, such as marking down a task for a stub the plan deliberately allows, and false passes, such as blessing a task that never proved the path it existed to prove. Reason about what this task promised to make real, and what it is still allowed to fake. Verify the first hard, and do not fail the task for the second.

### Step 1: Scope the observable behaviors

Pick the base branch: `main` if it exists, else `master`. List what changed with `git diff --name-status <base>...HEAD`, plus `git diff --name-status` for uncommitted work.

**With a contract loaded**, the contract is the scope. Check every condition from the task Goal and every UI and Logic subtask goal. Each flow step is also a behavior to exercise. **Do not sample subtasks, merge similar ones, or narrow the list to only the changed files.** A promised outcome with no implementation is exactly the miss this gate exists to catch, so keep it on the list and let step 4b flag it.

**Without a contract**, write the 2 to 5 concrete things a person could watch to know the change works, for example "the pricing page renders all three tiers and the button opens checkout". Keep them observable, never internal.

### Step 2: Work out how to run the app

In order:

1. **The compose stack**, which is how this workflow structures local development. `docker compose up -d`, then confirm every service reports healthy before touching anything. A container that is up is not a service that is ready.
2. **The project's own scripts** for anything not in compose: `package.json` scripts, a `Makefile`, whatever `architecture.md` records.
3. **By project type**, when nothing is documented:
   - Web UI: start the dev server and drive the route. Prefer a real browser so you can navigate, click, submit, and screenshot. Failing that, request the route over HTTP and check the returned markup plus a boot check.
   - API: start the server and call the endpoint.
   - Command line: run it with representative arguments.
   - Background job: trigger it and watch it run to completion.

Cannot tell how to launch it? Ask before proceeding. Do not guess a command.

### Step 3: Run and exercise

Launch the app, preferably in the background so you can interact with it.

- **UI**: navigate to the route, interact with it, and screenshot the result and any error state. Check what rendered, not merely that the response was a 200.
- **API**: send the request, capture the status and the body, and check the shape and the key fields.
- **Command or job**: run it, capture its output and exit code.
- **Data**: read the value back through the app or the database, and confirm it actually landed.

Watch the logs for errors and warnings even when the page looks fine.

**Keep an evidence ledger by subtask and condition as you go.** At the moment you observe each condition, write down the artifact that proves you exercised it:

| Behavior kind | The evidence to record |
|---|---|
| UI | the URL you loaded, the screenshot path, and what you saw rendered |
| API | the exact request, the status, and the key fields of the body |
| Command or job | the exact command, its exit code, and the decisive output line |
| Data | the query you ran against the live database, and its result |

You cite these in the report under the exact condition it proves. **A condition with no recorded evidence is not met**, however sure you feel.

### Step 4: Judge each condition and subtask

Give every condition one verdict. `MET` means the expected result was observed with cited evidence. `FAILED` means it ran and produced the wrong result. `BLOCKED` means it could not be exercised and names what was missing. `MISSING`, `NOT LIVE`, and `OFF DESIGN` retain the specific meanings below.

Then give every subtask one verdict:

- **MET** only when every condition inside it is `MET`.
- **FAILED** when any condition is `FAILED`, `MISSING`, `NOT LIVE`, or `OFF DESIGN`.
- **BLOCKED** when no condition failed and at least one condition is `BLOCKED`.

Never report a subtask as met from partial evidence. Keep all condition results visible even when the first one already failed, unless that failure makes the remaining conditions impossible to exercise. Those remaining conditions are `BLOCKED`, with the failed prerequisite named.

### Step 4b: The conformance verdict

Roll the condition results into a verdict per flow step, per subtask, and for the task Goal. Use these exact condition verdicts:

- **MET**: the check passed, and the expected result was observed.
- **FAILED**: the condition ran and produced the wrong behavior, output, or data.
- **MISSING**: the task promises it, with no implementation at all. Never built, nothing to exercise. Name the exact item and the fix, for example "the plan promises a password reset route, and there is no route and no file. Build it before this is done."
- **NOT LIVE**: the code exists, but its runtime check fails. The classic case is a migration that is committed but never applied, for example "the migration adding `verified_at` is committed, and the column is absent from the live database. Run the migration."
- **BLOCKED**: it could not be exercised, for missing data, credentials, or environment.
- **OFF DESIGN**: it exists and works, and it does not match the approved prototype. Name the item from the conformance list, the breakpoint, and what differs, for example "the phone layout keeps the desktop table where the prototype recomposes it as cards".

**Missing and not live are different failures.** Missing is a build gap, and not live is a wiring gap. Both stop a task being done, and reporting them separately makes the fix obvious.

**Off design is a third kind, and it goes to a different place.** Missing and not live go to `/dev-develop`. Off design goes to `/dev-develop` when the build diverged from an approved design, and to `/dev-design` when the prototype itself turns out to be wrong or silent on what was needed. Say which you think it is, and why.

**A design conformance check needs the same evidence as everything else.** A screenshot at that breakpoint, or the item is `blocked`, not met. Reading the code and judging it to match is exactly what this mode exists to prevent, and it is easier to slip into on visual work than on any other kind.

**Use the mechanism `tooling.md` records**, in its Visual verification section: the tool, the browser, and the exact commands. That section exists because this skill has no browser of its own, and on a project with an `app/` it is required rather than optional, since no design on such a project could have been approved without one.

**Comparing a state means opening it, not clicking towards it.** Each prototype exposes every state in its Required states cell from the page address, as `<file>.html#state=<name>`, with the registry's own spelling lowercased and spaces written as hyphens. `internal/design-direction.md` in `/dev-design` defines that contract. Use it, so the state you screenshot is the state you meant rather than whatever the click path happened to reach.

**Where the section is missing or says the project has none, report every conformance item as `blocked` and say why in one line**, and on a project with an `app/` say the second thing too: that section is required there, so its absence is a project setup gap for `/dev-architect` rather than a normal state to keep reporting around. Do not improvise a tool, and do not fall back to reading the markup and calling it a match. A block that keeps appearing is a prompt to install something, and it is honest. A silent downgrade turns the design contract into decoration while still reporting a pass.

Conformance is a PASS only when every task Goal condition and every subtask condition is `MET`, every flow step is met, every promised surface exists, every required value uses its named source, and every applicable design item conforms. One `FAILED`, `MISSING`, `NOT LIVE`, or `OFF DESIGN` condition makes the whole verdict a FAIL. When none failed but at least one is `BLOCKED`, the whole verdict is BLOCKED.

### Step 4c: The evidence gate

This mode exists to prove the change works by running it. Reading the code, seeing a green type check, or reasoning that it should work are not observations, and none of them may produce a pass. Apply these literally:

1. **No evidence, no pass.** A condition is met only if you can cite the ledger entry that proves it, inline in the report: the command and its output, the URL and what rendered, the query and its result. If you cannot cite it, the condition is blocked, not met.
2. **Never started, never PASS.** If you did not actually launch and exercise the app in this run, you may not emit a pass for anything. Report every condition as blocked, say plainly that nothing was exercised and why, and stop.
3. **A tool you could not use is a block, not a pass.** No browser, no database access, missing credentials, a build that will not start: each one makes the conditions that needed it blocked. Degrading to "it looks right in the code" is the exact failure this mode is built to prevent.
4. **Say what you did not check.** When some conditions were exercised and others were not, the unexercised ones stay under their subtasks as `BLOCKED`. A partial run reported as a full pass is worse than no run at all.

An overall PASS requires the task Goal and every subtask to be `MET` with cited condition evidence, every flow step met, and every promised surface present. A failed condition makes the result FAIL. With no failures, any blocked condition makes it BLOCKED.

### Step 5: Stamp, then report

Write resolved child verdicts where they belong before reporting, using the same system clock reading for rows resolved in one run:

- **Each MET subtask**: stamp `PASSED` in its child Verify Check.
- **Each FAILED subtask**: stamp `FAILED` in its child Verify Check with a one line Note.
- **Each BLOCKED subtask**: leave its child Verify Check unchanged.
- **Aggregate PASS**: after all child stamps are `PASSED`, stamp the aggregate task `PASSED` and append the Evidence row to `decision-log.md`.
- **Aggregate FAIL**: stamp the aggregate task `FAILED` with a Note naming every failed child and/or the task Goal. Write no Evidence row.
- **Aggregate BLOCKED**: leave the aggregate Verify Check unchanged and write no Evidence row. Resolved child stamps remain valid.

```
## /dev-check verify complete

**Ran**: <how the app was started, the exact command or URL. "Not started" if you never ran it, in which case no pass is allowed>
**Scope**: <N> subtasks, <C> task and subtask conditions, <M> met, <F> failed including missing, not live, or off design, <B> blocked
**Contract**: <task number and name from build-plan.md, plus the flows from project-overview.md>   (omit when there was none)

**Task Goal:** <exact task Goal>; **Verdict:** MET | FAILED | BLOCKED
- <condition>: <verdict>, evidence: <specific evidence or what blocked it>

**Subtask checks**  (repeat for every UI and Logic subtask in plan order, even when it passed):
- **<UI 1 | Logic 1>: <exact subtask goal>**
  - <condition>: <MET | FAILED | BLOCKED | MISSING | NOT LIVE | OFF DESIGN>, evidence: <specific evidence or what blocked it>
  - **Subtask verdict**: <MET | FAILED | BLOCKED>

**Verified**  (every line MUST cite its evidence; drop the line if you have none):
- <behavior>: <what you observed>, evidence: <command and exit code | URL and screenshot path | request, status and fields | query and result>

**Failed**:
- <behavior>: <what went wrong, with the exact error or screenshot path> → run /dev-develop

**Blocked**:
- <behavior>: <what is needed to verify it: seed data, credentials, environment>

**Conformance**: PASS | FAIL | BLOCKED
- <flow step 1> met: <the observation that confirmed it, with its evidence>
- <flow step 2> promised but missing: <named in the plan, no implementation> → build it before done

**Design conformance** (UI tasks only, drop this section entirely otherwise):
- <conformance item>: met at desktop, tablet, phone, evidence: <screenshot path per breakpoint>
- <conformance item>: built but off design at <breakpoint>: <what differs> → /dev-develop, or /dev-design if the prototype is the thing that is wrong
- <departure>: accepted, <the accessibility reason /dev-develop gave> → /dev-design, to absorb it into the prototype

**Missing outcomes** (in the task's goals, never built):
- <page, route, or table>: <where it was expected> → build before done

**Built but not live** (exists, fails at runtime):
- <surface>: <the runtime failure> → <the fix>

**For /dev-check review**:
- <anything that worked but looked fragile: a slow response, a console warning, a missing empty state>
```

Write "none" in a section that has a contract but no items. Drop the conformance sections entirely when there was no contract.

Clean up any process you started.

This mode confirms reality, and never fixes or asserts. `/dev-develop` fixes a failure and builds a surface that is missing or not live.

**A BLOCKED verdict is an honest, useful result.** It says the change could not be exercised, and names what would make it exercisable. **A fabricated PASS is the one output this mode must never produce**, because every later step trusts it.
