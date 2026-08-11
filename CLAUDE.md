# Kahanas

A skill set that carries a project from an idea to shipped code, keeping the reasoning in version controlled documents rather than in a chat log.

## The workflow

| Skill | Owns | Answers |
| --- | --- | --- |
| `/dev-scope` | `project-overview.md`, and `glossary.md` | What the product is, what its parts are called, and whether a team builds it |
| `/dev-architect` | `architecture.md`, `tooling.md`, `design.md`, `design-registry.md`, `.konteksto/designs/`, `code-standards.md`, `library-docs.md`, `build-plan.md`, additions to `glossary.md`, plus the starting state of `progress-tracker.md`, `decision-log.md`, `note-registry.md`, and `ui-registry.md` | How it gets built, and how it looks |
| `/dev-develop` | the code, every column of `progress-tracker.md` except Verify Check, all of `ui-registry.md`, a clean build row in `note-registry.md`, and a `decision-log.md` row when there was one | Builds it |
| `/dev-check` | `.konteksto/reviews/`, the Verify Check column in `progress-tracker.md`, plus one `note-registry.md` row on a verify pass | Confirms it actually works |
| `/dev-debug` | the minimal fix, a cause row in `decision-log.md`, and a fix confirmed row in `note-registry.md` | Finds out why it does not |
| `/dev-test` | the test files, and `test-preferences.json` | Stops it breaking again |
| `/dev-document` | `CHANGELOG.md`, `.konteksto/releases/`, `.konteksto/postmortems/` | Explains it to people |
| `/dev-sync` | corrections to `progress-tracker.md` and `ui-registry.md` from repo evidence | Makes the documents true again |

Thirteen documents in all, plus the design prototypes. `design.md` and `design-registry.md` are the optional ones, skipped together with `.konteksto/designs/` for a backend with no `app/`.

**The usual loop:** `/dev-scope` once, `/dev-architect` once, then per task `/dev-develop`, `/dev-check verify`, `/dev-test`. A verify failure goes to `/dev-debug`. Before a merge, `/dev-check review`, then `/dev-document pr`, then `/dev-sync`.

**Do not write a document count into a skill's instructions.** The number above is here, in the overview, where a person maintaining the set will see it. A count written beside a list inside a procedure is wrong the first time anybody extends the list, and this project has already shipped that bug twice.

## The one invariant behind most of the ownership rules

**No downstream skill may create upstream intent.**

| Skill | Owns | May never create |
| --- | --- | --- |
| `/dev-scope` | product intent | — |
| `/dev-architect` | technical and design intent | product intent |
| `/dev-develop` | implementation | design or product intent |
| `/dev-check` | observations | any intent at all |
| `/dev-test` | regression protection | any intent at all |
| `/dev-sync` | corrections the repo proves | any intent at all |

Most of the individual rules below are this one rule applied to a particular file. `/dev-develop` finding a missing design cannot design it. `/dev-check` finding a wrong prototype cannot fix it. `/dev-sync` finding a term in the code cannot make it the project's word. `/dev-architect` finding a product requirement cannot add it to the scope.

**When a new rule is needed, check whether this already covers it.** A rule derived from the invariant needs no separate justification and will not drift out of step with the others.

## A rule has one canonical definition

**One file defines a rule. Every other file states only its own consequence, and points.**

A non owner carries three things and never a fourth:

1. **The trigger.** When the rule fires here.
2. **The action.** What this skill does about it.
3. **A pointer.** Where the rule is actually defined.

It does not carry the definition, the boundary cases, or the reasoning. **Those are what drift**, because a definition written in five places gets edited in one.

**This is not theoretical.** Every stale string found in review so far came from exactly this: a document count written beside a list in three places, a breakpoint count in five, an approval condition in four. Each was correct when written and wrong the moment its neighbour changed.

**The test for what stays local: could this skill act correctly reading only this file?** The trigger and the action must be here, since a pointer followed on every task is a pointer nobody follows. The definition and the why do not, since a skill that already knows to stop does not need to be re convinced.

| Rule | Defined in |
| --- | --- |
| Stamping a value, and superseding it | `progress-tracker.md` |
| What a visual gap is, and what it stops | `dev-develop/ui-guide.md` |
| Who may approve a design, and how it is recorded | `design-registry.md` |
| Surface, state, and interaction | `design-registry.md` |
| Which token file is authoritative | `design.md` |
| Fidelity, and what outranks it | `dev-develop/ui-guide.md` |
| The bar for `DONE` | `code-standards.md` |

**This overview and `README.md` are the exception, and they still may not carry specifics.** Their job is orientation for somebody maintaining the skills, so they say what a rule is for and why it exists. They do not restate its exact conditions, values, or counts, because a summary that carries operational detail is just another copy waiting to go stale.

**A new artifact needs a fundamentally different owner, lifecycle, or truth source.** There are already six state and knowledge files: `progress-tracker.md`, `decision-log.md`, `note-registry.md`, `ui-registry.md`, `design-registry.md`, and `glossary.md`. Each earns its place on that test. New information goes into an existing artifact unless it can pass the same one, because the cost of another file is paid by every session that has to know it exists.

## Design

**Design is decided upstream and never invented during a build.** `/dev-architect` produces interactive HTML prototypes in `.konteksto/designs/` covering every surface, a person approves them, and `/dev-develop` implements them. **Coverage is the rule, not one file per surface**: several steps of a checkout may share one prototype, and one complicated screen may need several, with `design-registry.md` holding the mapping either way.

**A surface is a distinct user context, and its states are not more surfaces.** `design-registry.md` draws the line, and it exists because without it a six entity product produces eighty rows nobody reads.

**A design the user supplied is never overwritten.** Their originals are copied to `designs/sources/` and stay there untouched, because that artifact is the only thing in the project they actually authored, and it is what settles a later disagreement about what they asked for.

**The surfaces come from the flows, not from the page list.** The Pages section of `project-overview.md` holds the screens somebody thought of. The Core User Flow holds what actually happens, and the surface that gets missed is nearly always a failure branch of a step. A product that mocks its dashboard and forgets the verification screen, the recovery codes, and the wrong code path has designed one surface out of eight, and only reading the flows finds that.

**A missing design blocks its own surface and nothing else.** The plan is written in full regardless, and it never blocks an endpoint, a migration, or a job, because none of those shows anybody anything. This is the same shape as an unratified assumption keeping one task off `DONE` without holding up the project, and it is deliberately not a project wide gate, because a gate nobody can work around is a gate everybody works around. `ui-guide.md` draws the exact edges.

**`/dev-develop` is not the designer on a project with an `app/`.** It implements an approved prototype at high fidelity and may not introduce a layout, an interaction, or a product decision. **The stated assumption option is withdrawn for a visual gap**: a recorded assumption about a retry policy is visible and obviously provisional, while an invented layout looks exactly like a designed one, so nobody reviews it and the next surface invents a different answer.

**Exact pixel equality is not the bar, because nothing can check it.** A component library injects its own spacing and fonts rasterize differently on every machine, so a pixel comparison fails on a correct build. `ui-guide.md` defines the checkable form and the order in which fidelity yields, with accessibility above reproduction.

**No skill may originate an approval, and a skill may record one a person actually gave.** Deciding and writing down are different acts, and making somebody hand edit markdown after saying yes is ceremony rather than safety. `design-registry.md` sets the conditions a yes has to meet. A skill writes every other status including `CHANGE REQUIRED`, because noticing a design has gone stale is an observation while deciding it is fixed is not.

**An accessibility departure makes the prototype stale, not the implementation wrong.** The build is correct and the approved design is what now disagrees with reality, so it is the design that gets fixed. Unrouted, the next surface inherits the same inaccessible pattern from a document still claiming somebody blessed it. `design-registry.md` holds the routing.

## The documents, and who writes them

**`test-preferences.json` is a cross skill contract.** `/dev-test` owns it, and `/dev-check review` reads it to decide whether missing coverage is a finding at all. A project that deliberately has no test runner records that there, and the review then stops asking for one.

**Where a document has more than one writer, every side says so.** `note-registry.md` is created empty by `/dev-architect` and appended to by three skills: `/dev-develop` records the command that proved the build clean, `/dev-check verify` records what it exercised on a pass, and `/dev-debug` records the check that proved a fix. All four files state the rule from their own side, and so does the registry itself, in its Who writes what section. An unstated extra writer is how this system rots.

**`glossary.md` is the second shared document, and it splits by stage rather than by row or column.** `/dev-scope` creates it and writes the words the user used. `/dev-architect` adds a term the design brought into being and sharpens a definition the schema proved imprecise, and **may never rename one**, because a rename is a decision about the product's own language and belongs to the person whose product it is. Everything else reads it, names what it builds from it, and reports drift.

**`/dev-sync` writes nothing there either, and the reason is not the gap and contradiction rule.** A term in the code that is missing from the glossary reads as a plain gap, and by that rule's own words it is one. It still may not be filled, because **the code proves a word is in use and never that it is the word this project chose.** Naming is a decision, and this skill records nothing it did not observe.

**That is the sharper form of "a fact the repo can prove", and it is worth stating because the loose form misleads.** `ui-registry.md` records what exists, so the code proves it end to end and `/dev-sync` corrects it. A glossary records what was chosen, and no amount of reading the code will ever prove that. Before filling any gap, check the repo proves the fact the document actually claims rather than a neighbouring one.

**Those three rows are three different claims, which is why they are not one row.** A clean build is not a working feature, and a passing verify is not a fixed bug. Collapsing them loses exactly the distinction a later session needs.

**Append only, and never across writers.** A row is a claim about a moment that has already passed. A skill appends its own row and edits nobody's, and `/dev-sync` writes none at all, because it has run nothing and a fabricated observation reads exactly like a real one.

`progress-tracker.md` splits differently, **by column rather than by row.** `/dev-architect` creates it, `/dev-develop` owns every column of its phase tables except one, and `/dev-check verify` owns that one, Verify Check, and touches nothing else in the file. `/dev-sync` may still correct `/dev-develop`'s columns from repo evidence after the fact, never during a build, and it writes no Verify Check cell at all, for the same reason it writes no note row: it has run nothing.

**A `DONE` Status and a `PASSED` Verify Check are two different claims, so they are two columns.** `DONE` says the code was built and the build is clean. `PASSED` says a model ran the thing and watched it work. A task holding `DONE` with a `FAILED` verify is a real and useful state, and one column could not express it.

**Every Status and Verify Check value is stamped with the model that wrote it and the minute it wrote it**, and a value that changes is superseded by striking the old one through and appending the new, so a cell reads oldest to newest and the last unstruck value is current. Nothing is deleted and nothing is edited in place. A task that went `DONE`, then `BLOCKED`, then `DONE` again is telling a later session something a single final value hides, and the model name is what lets a reader judge how much to trust a stale verdict.

**Three files hold three different things about the same task, and none of them may absorb another.** `progress-tracker.md` says where it stands, in one word per cell, so a phase can be read at a glance. `note-registry.md` says what was run and what it showed, an observation somebody could reproduce. `decision-log.md` says what was decided and why, which no command produces and no repository preserves. The test when placing something is whether you watched it happen or concluded it: watched goes to the registry, concluded goes to the log.

`decision-log.md` was inside the tracker until the tracker became a state table, and it moved out for the same reason the note rows did: **the two are indexed differently.** The tracker is one row per task, rewritten in place as that task moves. The log and the registry are one row per event, in the order events happened, and nothing in either is ever rewritten. A file cannot be both at once. The log is also what `/dev-document` mines for changelogs and postmortems, which is why padding it with narration costs something real.

**All three tables stamp who wrote each row and when**, to the minute. The tracker stamps inside its Status and Verify Check cells; the log and the registry each carry a Timestamp and an Author column. **Author is the exact model identifier**, and it survives on a personal project even though Actor does not, because the model changes between sessions when the person does not, and a reader weighing a six week old verdict wants to know what produced it.

**The tracker's Note column is deliberately narrow.** Only a `BLOCKED` Status or a `FAILED` Verify Check carries one, both must, and every other row reads `—`. A Note means something is wrong right now, so a reader scans for a non empty cell rather than reading every one. It is also the one cell that is overwritten rather than superseded: when its reason goes, it clears, because the struck stamps beside it already keep the history.

**Every generated document is stamped.** A document written by a skill ends with a drafted by line, so a later maintenance pass can tell what a tool wrote from what a person wrote **instead of guessing**. `/dev-sync` reads it: stamp present means a wrong fact may be corrected surgically; stamp gone means a person owns the file, so add a missing fact but never rewrite an existing line.

The stamp records provenance, not permission. It never licenses overwriting something someone edited.

**A gap and a contradiction are different problems.** A gap is a fact missing that the repo can prove, and it gets filled. A contradiction is a document disagreeing with the code, and it never gets resolved automatically, because from the outside you cannot tell whether the code drifted or the document was deliberate and the code broke it.

## Team shape and checkpoints

**Team Shape is asked in scope and applied in architect.** `/dev-scope` asks two questions, personal or team, and phase checkpoints on or off, and records the answers in `project-overview.md`. It touches nothing else, because both answers are facts about the work rather than tool choices. `/dev-architect` reads them and shapes three documents: an Assigned column in `progress-tracker.md`, an Actor column in `note-registry.md`, and a Checkpoint block per phase in `build-plan.md` with a Checkpoints table tracking their state. Personal projects get none of it, since a column with one value in it is noise.

**No skill can reserve a task, and no document may pretend otherwise.** The assignee is a convention. `/dev-develop` reads it and stops when a task belongs to someone else, but two people on two machines both pass that check and either can proceed. These are instructions an agent reads, not a server holding a lock. Real enforcement is branch protection or an issue tracker, and every place that mentions assignment says so, because a guarantee the system cannot keep is worse than no guarantee at all.

**A person owns anything a skill cannot honestly claim.** `/dev-develop` claims an unassigned task and moves a checkpoint to due, both of which the repository proves. **Reassigning a task and approving a checkpoint are hand edits**, and no skill writes either. A reassignment needs a reason that exists only in a conversation, and an approval asserts that a human reviewed something, so a skill writing its own would defeat the entire point of having a checkpoint.

**Checkpoints are non blocking, and name coverage rather than writing it.** A phase may start with the last one unapproved. The Checkpoint block says what a reviewer must confirm and what needs test coverage, then routes to `/dev-test`, which stays the only writer of test files.

**`/dev-sync` escalates, and never arbitrates.** One task with note rows from two actors is reported with every actor and branch named, and there it stops. Choosing which branch survives, or resolving the conflict, is a person's call: from the outside two branches on one task look identical whether one supersedes the other or both hold work someone needs.

One rule holds the split together: **`/dev-scope` owns the what and never names a tool. `/dev-architect` owns the how and makes every tool call.**

Projects consume this through `.konteksto/`, filled from `templates/`. A template is read, never edited in place.

## Writing a new skill

Every skill in `skills/` follows this shape. A new one is not finished until it has all of it.

```
skills/dev-<name>/
├── SKILL.md              required, the instructions every client reads
├── agents/
│   └── openai.yaml       required, interface metadata for Codex
├── modes/                optional, one file per mode when the skill routes
└── *.md                  optional, bundled files read on demand
```

**Every skill carries the `dev-` prefix in three places**, and they must agree: the folder name, the `name:` frontmatter inside `SKILL.md`, and every reference to it in any document. The registry keys on the frontmatter name, so a folder and a name that disagree install something the agent then cannot find. The local installer refuses that case, which is the check that catches it.

The prefix is not cosmetic. The names these skills want, `scope`, `check`, `test`, are ordinary words, and a personal skill of the same name in `~/.claude/skills` shadows a bare project skill with no error to say which one ran. That is a real failure this project already hit. `dev-scope` collides with nothing.

**Never name a file after its own folder.** `skills/dev-check/SKILL.md`, never `skills/dev-check/dev-check.md`.

**`SKILL.md`, exactly that name, in that case.** Linux is case sensitive, so `SKILL.MD` will not load.

**Every `SKILL.md` opens with the frontmatter and the output style block**, copied verbatim from an existing skill. The block is delimited by `OUTPUT-STYLE:START` and `OUTPUT-STYLE:END` so it can be updated across every skill at once.

**Every skill gets `agents/openai.yaml`.** These are distributed to Codex as well as Claude Code, and the file supplies the name, blurb, and opening prompt its agent picker shows. It is interface metadata only and carries no logic, since the instructions live in `SKILL.md`. Copy the shape from any existing skill and change the three values.

**State artifact ownership explicitly**, both what the skill writes and what it must never touch. Two skills writing the same file is how this whole system rots.

**Put detail a skill only sometimes needs in a bundled file**, and say in `SKILL.md` when to read it. A rubric that only a subagent needs is passed to it as a path, and never read into the main context.

## Conventions inside a skill

**Plain words, no dashes, no hyphens.** The output style block is the full rule, and it applies to the skill file itself, not only to what the skill produces.

**Ask with a recommendation, never a neutral menu.** 2 to 4 real options, exactly one marked as recommended with a one line why. `AskUserQuestion` where available, the same options as plain text otherwise.

**Say why a rule exists** when the reason is not obvious. A rule with its reasoning survives editing; a bare rule gets optimized away by the next person who reads it.
