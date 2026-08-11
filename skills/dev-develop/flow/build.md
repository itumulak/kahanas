# Develop: the build flow

Read this once the decision gate in `SKILL.md` clears, meaning nothing load bearing is owed, or the user chose to build anyway. It holds everything after the gate.

Tracks are additive. A task can be UI, logical, or both. Classify in step 1 and run each part.

Guide paths below are relative to the develop skill folder, which is the parent of this `flow/` directory.

---

## Step 1: Classify the track

| Signals | Track |
|---|---|
| page, component, screen, layout, anything under the task's **UI** bullets | **UI**, follow `ui-guide.md` |
| API, endpoint, service, data, job, webhook, integration, anything under the task's **Logic** bullets | **Logical**, follow `logical-guide.md` |
| Both kinds of bullet present | **Both**, run each track for its part |

`build-plan.md` labels this for you: a task's bullets are already split into **UI** and **Logic**. Trust that split. Ask only when a task has neither, which means the plan itself is thin.

## Step 2: Load the decision and the conventions

Read, in this order, and no more than this:

1. **This task's entry in `build-plan.md`**, with its UI and Logic bullets, and the **Core Principle** at the top of the file, which sets the bar for what "working" means here.
2. **`architecture.md`**, the parts this task touches: the Stack table, the folder structure, the System Boundaries, the data flow, the schema, the Invariants, and **the Value Sourcing table**. That table names where every value comes from, and it is what the input coverage test checks against.
3. **`code-standards.md`**, the whole file. It is the convention set, and it is short by design.
4. **`project-overview.md`**, the Core User Flow steps for any page this task serves. That is the contract `/dev-check verify` will hold the result against.
5. **`library-docs.md`**, only for a library this task actually uses. Skip the rest.
6. **`tooling.md`**, the Local Data Lifecycle section, whenever this task touches the database. It says whether local data resets between tasks or persists, and the exact reset command.
7. **`design.md`** and **`ui-registry.md`**, only on the UI track. `design.md` is the art direction, and it is not optional reading before building a surface.

**Never reset the local database unless Local Data Lifecycle says to.** Someone else's work in progress may be sitting in it, and there is no undo. Where that section says data persists, work with what is there.

**Precedence on a conflict.** `architecture.md` decides structure and invariants. `code-standards.md` decides how code is written. Where they genuinely conflict, say so and stop rather than picking silently, because one of the two documents is wrong and `/dev-architect` needs to fix it.

**Completeness check, before any code, not partway through.**

Confirm the design actually covers this task: on the logical track a data model, an interface surface, and the security expectation; on the UI track the states the surface needs. Then run the **input coverage test** from `SKILL.md` again against the specific values this task produces.

A gap here is not a thing to fill in as you go. Go back to the gate.

## Step 3: Explore before building

Locating the files to touch, and the patterns to match, means reading code. That is the biggest context cost in a large repository, because every file you open inline stays in context for the whole session.

**Skip this** when the change is small and you already know the file, or on a fresh session where context is still light. Reading inline is fast then, and spawning costs more than it saves.

**Do it** when the reading would genuinely bloat the main context: a large repository, many files, an unfamiliar area, or a session already carrying a lot.

Spawn a **read only** subagent with an explicitly cheap and fast model, which does not inherit this session's model. Give it read and search tools only, and no writing tool. Brief it with the exact task and the interfaces involved.

It returns **a compact map and nothing else**: the files to create or edit as paths, the patterns to match as file and line references, the symbols and helpers to reuse, and the gotchas. No file contents, and no dumps.

Then build from the map. The token heavy reading is offloaded, and the deciding and writing stay on the main thread.

## Step 4: Check the documentation, only when you need to

Only when you genuinely need the current usage of a tool the design already chose, and you are unsure your knowledge is current. A fast moving library's setup, or a framework's latest configuration shape.

Most builds do not need this. For a stable and well known stack, build from knowledge and let the type check and build loop catch a stale API cheaply. **Do not search the web by default.**

**Never to choose or reconsider a tool.** That is `/dev-architect`'s job. Look up how to use the decided tool, never whether to use it. If the documentation reveals it genuinely cannot work, that is the "the design is wrong" path in step 5, not a quiet swap for something else.

Where you do need it, spawn a read only subagent with web access on a cheap model, briefed with the exact tool and version. It returns a compact usage summary **and the URL it read**, never raw pages.

**Keep that URL and report it in step 6. Do not write it into `library-docs.md` yourself**, even though that is plainly where it belongs. The file is `/dev-architect`'s, and a second writer on it is how the whole document set rots. You looked something up that the notes did not cover, which is a gap in that file, and naming it in your report is what gets it filled by the skill that owns it.

**Match the version before you trust the page.** Docs sites default to the current release, and the project may be two behind. A page for the wrong version is a confident wrong answer, which is worse than the guess you were trying to avoid.

## Step 5: Resume, then build

**Resume first. Never rebuild what is already done.**

Read `progress-tracker.md`. Find the first task whose Status is not `DONE`, or the one you were asked for. A `DONE` stamp means someone believed it was finished, so stop and ask before rebuilding it. A `BLOCKED` one means someone stopped on purpose: read its Note before doing anything, since the reason may still hold.

Say where you are picking up, plainly: "this plan is 4 of 12 done, resuming at the session handling task."

**Cross check before building.** Hold the task's bullets against the Core User Flow steps they serve. A flow step with no covering bullet is a gap in the plan itself: flag it and say so, rather than quietly building something the plan never described or quietly skipping it.

**Build the coherent slice the Core Principle calls for.** Let it visibly shape what you assemble. A principle that asks for a thin path wired end to end produces something different from one that asks for the smallest usable piece, and neither is the same build relabeled.

**Track order when a task is both.** Logic first, so the interface binds to something real, unless the plan deliberately defers the binding and asks for the shell first.

**Build inline on the main thread.** Only the file locating read was offloaded, in step 3. **Do not spawn a subagent to write code**, even for a large multi file build. Sequence it sensibly instead.

### A large rollout of an already decided pattern

For example applying one change across seventeen files. Still inline, and sequenced to stay safe:

1. **Primitive first.** Build the shared thing and confirm it type checks before touching a single call site.
2. **Apply site by site**, preserving exact behavior at each one.
3. **Gate once at the end.** Run the type check and lint across the package after every site is migrated, not after each one.
4. **Remove the superseded code only on that green sweep**, once every site is migrated and the checks pass. **Deleting early breaks the build**, because the sites you have not reached yet still reference it.
5. **Partial progress is fine, half a migration is not.** If you stop before every site is done, keep the old code, report exactly which files landed and which remain, and say that running `/dev-develop` again resumes the rest. It is resumable because it skips what is already migrated.

### When the design turns out to be wrong

The design proves wrong or incomplete partway through: the schema cannot hold the data, an invariant contradicts the interface, the chosen approach will not work in practice.

**Stop before coding the deviation.** Route to `/dev-architect` to fix the document, then resume. Never silently diverge. A codebase that disagrees with its own design documents is worse than one with no documents, because the next session trusts them.

### Two rules that outlive the build

**A data layer task is not done until the migration is applied and the schema is confirmed live.** The full rule, including how to confirm it, is in `logical-guide.md` phase 2. Do not restate it from memory.

**Remove superseded code in the same task that replaced it.** Old and new side by side is not done. The details are in `logical-guide.md`, phase 6.

## Step 6: Update the documents and report

- **Only stamp `DONE` on what actually landed.** Confirm first: the files exist, the code type checks, and for a data layer task the schema is live. An interrupted task stays `PENDING`, or goes to `BLOCKED` with the reason in its Note, and you report exactly what is incomplete and why.
- **Never mark a task done on an unverified build.** A `DONE` stamp is a claim that someone else will rely on.
- Edit `progress-tracker.md` surgically, per `SKILL.md` step 3: the task's Status cell, Last completed, and Next, plus a Note only when you are leaving the task `BLOCKED`. Supersede an existing Status by striking it through and appending the new stamp, never by overwriting it. **Leave the Verify Check column alone**, it is `/dev-check verify`'s. On a team project, also claim the task's Assigned cell if it reads `unassigned`. With checkpoints on, also move the phase's checkpoint row to `due` when this was the phase's last task, and never write an approval.
- Append one row to `note-registry.md`, also per `SKILL.md` step 3: the clean build command and its result. Leave the rows `/dev-check` and `/dev-debug` wrote alone.
- Append one row to `decision-log.md` only when this task produced a real decision, a cause worth knowing, or a stated assumption. A task that went to plan writes nothing there.
- Both rows carry the Timestamp, the Author as your exact model identifier, the Skill, and the Actor on a team project. `SKILL.md` step 3 has the exact fields.
- **A task built on a stated assumption stays off `DONE`** until `/dev-architect` ratifies it. The assumption goes in `decision-log.md`, marked `assumed, not yet ratified`, and you say so in the report rather than leaving a `PENDING` row nobody can explain.
- **Name any documentation you had to go and read in step 4**, with the URL, the version it covered, and the one sentence it settled. That is a gap in `library-docs.md`, and `/dev-architect` owns filling it. Say it plainly rather than burying it, since the next task on the same library will otherwise pay for the same lookup.
- Relay the track's report block from `ui-guide.md`, `logical-guide.md`, or both.
- Point at `/dev-check verify` next, and name the next task after that.

`/dev-develop` builds. It does not run `/dev-check` or `/dev-architect` for you. It points, and you decide.
