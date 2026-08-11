---
name: dev-architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch
description: "Run /dev-architect after /dev-scope to design how the product gets built and how it looks. Weighs options, settles the stack, and on a frontend project designs every surface the flows require as an interactive HTML prototype in .konteksto/designs/ for a person to approve. Audits an existing codebase for outdated or vulnerable packages, finds the MCP servers and skills that fit, then writes architecture, tooling, design, design registry, code standards, library docs, build plan, progress tracker, and ui registry into .konteksto/."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Answers **how the product gets built**, given a `project-overview.md` that already says what it is. Settles every load bearing technical decision, and on a project with a frontend every design decision too, then records the result across the documents in `.konteksto/` plus interactive prototypes covering every surface.

`/dev-scope` owns the what and never names a tool. This skill makes every tool call there is.

## Where this sits

**Before this:** `/dev-scope`, which settled what the product is.

**After this:** `/dev-develop`, which builds the first task in the plan.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.

## Artifact ownership

The documents below, all created and updated by this skill only, filled from the matching template in `templates/`, which lives in this skill's own folder. Plus, on a project with an `app/`, the prototypes in `.konteksto/designs/`.

**No count appears anywhere in these instructions, deliberately.** A number written beside a list that later grows is wrong the first time somebody adds to it, and it had already gone wrong twice here before anybody noticed. The list is the list.

**Stage 1, the foundation.** What the system is made of.

| Order | Document | Depends on |
| --- | --- | --- |
| 1 | `architecture.md` | the pages and flows in `project-overview.md` |
| 2 | `tooling.md` | the Stack table in `architecture.md` |
| 3 | `design.md` | the client framework, and the flows in `project-overview.md`. **Frontend only**, skip it entirely when there is no `app/` |
| 4 | `design-registry.md`, plus the prototypes in `.konteksto/designs/` | the flows in `project-overview.md`, and the system in `design.md`. **Frontend only**, skipped with `design.md` |
| 5 | `code-standards.md` | the Stack table, and where `design.md` says the tokens live |
| 6 | `library-docs.md` | the approved dependency list in `code-standards.md` |

**Stage 2, the plan.** Turns the foundation into an ordered build. Starts only once every **applicable** Stage 1 artifact is approved, meaning the design ones do not hold up a backend that never had them.

| Order | Document | Depends on |
| --- | --- | --- |
| 7 | `build-plan.md` | Features in Scope, plus the architecture |
| 8 | `progress-tracker.md` | the exact phases and tasks in `build-plan.md` |
| 9 | `decision-log.md` | nothing, it starts empty |
| 10 | `note-registry.md` | nothing, it starts empty |
| 11 | `ui-registry.md` | the component rules in `code-standards.md` and `design.md` |

Never touch `project-overview.md`. It is `/dev-scope`'s file. If the design work proves it wrong, say so and ask the user to run `/dev-scope` again rather than editing it yourself.

**`glossary.md` is the one exception, and a narrow one.** `/dev-scope` creates it, and you are its second writer. Read it before the design conversation, name everything you write with its words, and add to it only in these two cases:

- **A concept the design brought into existence** that the product conversation had no word for. A join table's row is not one. A thing a user would name in a sentence is.
- **A definition the schema proved imprecise**, most often one word that turned out to be covering two concepts.

**You may sharpen a definition and you may not rename a term.** A rename is a decision about the product's own language, and it belongs to the person whose product it is. Where a term is genuinely wrong, say so and ask.

**No implementation words go in, ever.** Not a table, a type, a field, an endpoint, or a library. That file has to survive a rewrite that changes every one of them. Its What does not belong here and Who writes what sections state the rest, and they stay as they are.

**`.konteksto/designs/` is yours and nobody else's.** Every prototype in it, and the `sources/` folder holding what the user supplied. `/dev-develop` builds from a prototype and never edits one. `/dev-check` compares against one and never edits one. A design that turns out to be wrong comes back here.

**One value in `design-registry.md` is not yours to decide: `APPROVED`.** You may **record** an approval a person actually gave, on the strict conditions the registry template sets out, and you may never originate one. An explicit yes to that specific artifact counts; "looks good" does not, and the name you write is theirs rather than whatever `git config` holds. You write every other status, including moving an approved design to `CHANGE REQUIRED` when something invalidated it, because noticing that is an observation and deciding it is fixed is not.

**Four of these are living files, created here and updated elsewhere.** `progress-tracker.md`, `decision-log.md`, `note-registry.md`, and `ui-registry.md` are written once by this skill, in their starting state, and every update after that belongs to another skill: a task's Status and a new component section to `/dev-develop`, a task's Verify Check to `/dev-check verify`, a decision row to `/dev-develop` or `/dev-debug`, and a note row to whichever of `/dev-develop`, `/dev-check`, or `/dev-debug` ran the thing. Do not stamp a task, register a component, log a decision, or write a note row for something that does not exist yet.

Read a template from `templates/`, in this skill's folder, and write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place.

## Guardrails

Do NOT write application code, scaffold a project, or install a package the product itself ships. This skill produces documents and settles decisions. Building starts as a separate, later request.

Four narrow exceptions. Agent tooling found in step 6, meaning skills and MCP servers, may be set up during this skill, but only per the consent rules in that step, and only for a tool the user approved by name. `docker-compose.yml` plus `.env.example` are written in step 5, because they are the structure the build sits in rather than the product itself. On a team project, `.gitignore` gains a line for `.konteksto/role.local.json`, because that file must never be committed and this is the only skill that creates the need for it.

**The fourth is design prototypes**, and it is the widest, so its edges are stated exactly. You may write standalone HTML, CSS, and JavaScript **inside `.konteksto/designs/` only**, as design artifacts. They are not application code, nothing in `app/` may import them, and no line of one is copied into the product by you.

**The limit is responsibility, not size.** Inside that folder you may not write production anything: no framework components, no API calls, no persistence, no authentication, no business logic. A prototype is made interactive with fixture data, local state, and simulated responses. A genuinely interactive surface may need a few hundred lines of prototype JavaScript, and that is fine. **The moment making it behave would require building a real service, stop**, because that is `/dev-develop`'s work and the prototype does not need it.

Do NOT fill a document with a guess. Every value is read from the existing codebase, stated by the user, found at a source you actually fetched, or picked by the user from options you presented.

Do NOT let a document look simple enough to skip. A one page tool still needs its stack recorded. The document can be short. It cannot be absent.

## Asks vs acts

- **INFER**: anything `project-overview.md` or the existing codebase already settles. The platform, whether there is a UI layer, an already chosen provider, the shape of the data. Derive it and confirm in one line.
- **ASK**: only what the user alone knows. Hosting constraints, existing accounts and contracts, compliance scope, team familiarity, budget.
- **RECOMMEND**: anything expertise settles. Which framework, which database, which pattern. Make the call, give a one line why, name the runner up. Never a neutral menu, never a silent decision.

Recommendations build on what the project already uses. If the codebase is already on a platform, prefer that platform's own auth and storage over adding an external tool. Reuse beats sprawl.

**That is the intent, not the procedure.** How to actually run the questioning, stage by stage, what to grill on, and what to infer rather than ask, lives in `internal/design-conversation.md`. The Execution section below makes you read it in full before you ask a single design question.

## Decision panels

Every user facing choice is an options panel: 2 to 4 concrete options real to this project, exactly one marked as recommended with a one line why. Use `AskUserQuestion` where available, otherwise the same options as plain text. Ask in rounds of up to 4 related questions.

The full mechanics, including the free text slot, generating options fresh rather than from a canned list, and never bundling a whole decision into one panel, are in `internal/design-conversation.md`.

## Execution

### Step 1: Pre flight

- **Read `.konteksto/project-overview.md` in full.** If it does not exist, stop and tell the user to run `/dev-scope` first. Everything here depends on it.
- **Read `.konteksto/glossary.md` in full, and use its words from here on.** Every table, boundary, component, and phase name you write comes out of it, because a schema that renames the product's concepts forces every later reader to translate, and eventually one of them translates wrongly. Where the file is missing on a project that has a `project-overview.md`, say so and write it from the terms already in that file rather than proceeding without one.
- **Read what `/dev-scope` handed you**, if anything: whether a codebase exists, the stack it showed, and any tool or constraint the user named during scoping. Do not survey the same ground again.
- **Work out whether the code is actually somebody else's.** A manifest and a source tree are not proof of an existing codebase, because `/dev-develop` scaffolds this project itself as the first task in the plan. Code whose stack matches what `.konteksto/architecture.md` already specifies is **our own scaffold**, and it is not brownfield. Only code with no matching documents, or code that diverges from them, is a real existing codebase.
- **If a real codebase exists and you were not handed a survey**, read it now: the directory tree, every package manifest, the lint and build config, the entry points. The stack that is already there is a decision already made. Record it, do not re litigate it.
- **Check `.konteksto/` for existing documents.** Report which of the expected artifacts are present, plus any prototypes in `designs/` and what `design-registry.md` says about them. Never overwrite one silently; ask whether to update in place or start over. **An approved prototype is never overwritten at all**, it goes back through the lifecycle.

### Step 2: Run the design conversation

**This is a hard gate. Read `internal/judgment.md` and `internal/design-conversation.md` in full before you ask the user a single design question, and follow both.**

`judgment.md` is the judgment you bring: the posture, the failure patterns to name on sight, and the instruction to **challenge the premise before designing anything**. `design-conversation.md` is the procedure. A perfectly run interview that arrives at the wrong stack has helped nobody, which is why the judgment file is read first.

It holds the already built check, the framing, the dimension enumeration, the question mechanics, the six stages, and the completeness gate that decides when the questioning is finished. Do not open the interview, generate questions, or write any document until you have read it.

Steps 2 through 6 here are the outline. That file is the protocol.

**How the two line up.** Everything from here to step 6 is one continuous conversation, not five separate phases with pauses between them:

| Conversation stage | Where it is spelled out |
| --- | --- |
| Framing, and the already built check | `internal/design-conversation.md` |
| Stage A, requirements | `internal/design-conversation.md` |
| Stage B, the data model | `internal/design-conversation.md` |
| Stage C, the stack walk | step 2 below |
| The page design stage | step 3 below |
| Stage D, interfaces and value sourcing | `internal/design-conversation.md` |
| Stages E and F, security and edge cases | `internal/design-conversation.md` |
| The brownfield audit | step 4 below |
| Containers and data lifecycle | step 5 below |
| Tooling discovery | step 6 below |

Nothing gets written until the completeness gate in that file passes.

#### Settle the stack

Read the Project Shape section of `project-overview.md` first. It says whether the product is frontend only, backend only, or both, and it fixes the folder layout. Ask stack questions only for the halves that exist. Never ask which database a frontend only project uses.

Walk every layer that half needs:

- **Client**, when `app/` exists: language, framework, routing, styling or UI kit, state handling.
- **Server**, when `backend/` exists: language, framework, data storage, migrations, auth and sessions.
- **Anything the flows imply**, either half: payments, transactional email, file storage, search, caching, queues, background work, realtime.

**Read `internal/stack-defaults.md` before the first stack question.** It holds the pattern to settle before any technology, the default category per layer, and the opinions to apply. Its central rule: **reason in the durable category, then pick the current product fresh**, because the category stays true and the product name rots.

Settle the **pattern** first, meaning one application or several, from the scale and team size. Choosing a framework before that is answering before understanding the question.

For each layer not already fixed by the existing codebase or named by the user, present a panel with 2 or 3 real options, their trade offs, and your recommendation. **Always include the simplest option**, described honestly rather than as a straw man. Name real tools here. This is the one place in the workflow where that happens. Only the picked option goes into a document.

Record each pick and its reason in the "Why these choices" list in `architecture.md`.

The stack is settled when every layer of every existing half has a named tool. Do not start step 3 before that.

Stages A, B, D, E, and F of the design conversation happen here too, not only the stack walk. The data model is elicited and confirmed, and the value sourcing loop is closed. Both are in `internal/design-conversation.md`, and skipping either produces a document set `/dev-develop` cannot build from.

### Step 3: The design direction

**Skip this whole step when there is no `app/`.** A backend has no art direction. `design.md`, `design-registry.md`, and `.konteksto/designs/` are all skipped together.

Otherwise **read `internal/design-judgment.md` and `internal/design-direction.md`, and follow both.** The first is the designer posture and its rules. The second is the procedure: taking in what the user supplied, mapping flows to required surfaces, settling the system, building the prototypes, critiquing them, and asking for approval.

Four rules worth seeing from here, because they are the ones that change what this step is.

**You produce the designs.** Where the user has none, you design them from the scope. Where they supplied images, you build the HTML equivalent. Their originals are copied to `.konteksto/designs/sources/` first and **never overwritten**, since that artifact is the only thing in the project they actually authored.

**Map flows to surfaces, not pages to mockups.** The Pages list holds the screens somebody thought of. The Core User Flow holds what actually happens, and the surface that gets missed is nearly always a failure branch of a step rather than a page. A product designing a dashboard and forgetting the verification screen, the recovery codes, and the wrong code path has designed one surface out of eight.

**A missing design blocks its own task and nothing else.** Write the whole plan regardless. `/dev-develop` stops on the task whose surface has no approved design, exactly like an unratified assumption keeps one task off `DONE` without holding up the project.

**You may never decide an `APPROVED`.** Present, set the row to `READY FOR REVIEW`, and ask. Once they say yes to that specific prototype, you may record it in their name.

### Step 4: Audit an existing codebase

**Skip this step entirely on a fresh project, and on our own scaffold.** It applies only when step 1 found code this workflow did not generate.

Otherwise **read `internal/brownfield-audit.md` and follow it.** It confirms the project structure, settles what happens to existing components, and audits every dependency for age, abandonment, and known vulnerabilities.

The rule worth carrying from here: **a vulnerable dependency is recommended plainly, not offered as one option among equals**, and a declined update is recorded as an accepted risk rather than forgotten.

### Step 5: Local development containers

Run this once the stack is settled. Every service the stack named needs somewhere to run locally, and a compose file is how this project structures that.

#### Propose the services

Derive the service list from the stack, never from a fixed menu:

- **One service per stored data store** picked in step 2, for example Postgres, MySQL, or Redis.
- **One service per half that exists**, building from `backend/Dockerfile.dev` and `app/Dockerfile.dev`.
- **A local stand in for every external service the flows need**, so the build never depends on a real account. Mail becomes MailHog or Mailpit. S3 style file storage becomes MinIO. Name the real service it stands in for, so nobody ships the stand in.
- **An admin interface only when asked for.** A database console is convenience, not structure.

Present the list as one panel with your recommendation, and say plainly which ones you would leave out. The user can decline any service, and can decline Docker entirely. A no is a complete answer. Record a decline in `tooling.md` so a later session does not raise it again.

#### Write the compose file

On confirmation, write `docker-compose.yml` at the project root, in the layout `project-overview.md` recorded. Follow these rules, which exist because each one has bitten a real project:

1. **Every value that differs between machines is an environment variable with a default**, in the form `${DB_PORT:-5432}`. A fresh clone must come up with no `.env` file present.
2. **Every service another service waits on has a healthcheck**, and the waiting service uses `depends_on` with `condition: service_healthy`. A plain `depends_on` waits for the container to start, not for the service inside it to be ready, which is the usual cause of a backend that dies on first boot.
3. **A one shot setup container uses `condition: service_completed_successfully`**, for example the container that creates the storage bucket.
4. **Persistent data goes in a named volume**, declared at the bottom. Every declared volume is actually used by a service. An unused volume is a leftover.
5. **The network key and the network name match.** Declaring the key `my-network` while every service references `${NETWORK_NAME:-project-network}` only works because `name:` overrides the key, and it breaks the moment someone reads it. Use the same string for both.
6. **Source folders are bind mounted for live reload**, and the dependency folder is mounted separately so the host's copy does not shadow the container's.
7. **Secrets have obvious throwaway defaults** such as `minioadmin`, and the file says in a comment that they are for local development only. Never write a real credential into this file.

Then write the matching `.env.example` listing every variable the compose file reads, with its default. Never write `.env` itself.

#### Settle what happens to local data between tasks

Only when the stack has a data store. Ask, because both answers are reasonable and a build must never decide this on its own:

> "Between tasks, should the local database reset to a clean state, or keep its data?"

1. **Reset every task** (recommended when the schema is still moving): every task starts from a known state, migrations get exercised constantly, and nothing accumulates. The cost is retyping anything you were testing with.
2. **Keep it, with seed data**: a fixture set loads once and survives. Better once the schema settles, and much better when a realistic data set is needed to judge a UI.
3. **Keep it untouched**: whatever is in there stays. Simplest, and the most likely to drift into a state nobody can reproduce.

Record the answer, the exact reset command, and where any seed data lives in `tooling.md`'s Local Data Lifecycle section.

**A build never drops a local database on its own initiative.** Someone else's work in progress may be sitting in it, and there is no undo. That rule is in the template so it reaches whoever builds.

Record every service, its purpose, and its ports in `tooling.md`.

Writing this file is the one exception to the no code rule, because it is the structure the build sits in rather than the product itself. Do not write a `Dockerfile.dev`, and do not run `docker compose up`. `/dev-develop` does both.

### Step 6: Agent tooling discovery

Run this only once the stack is settled, and only for tools not already installed or already recorded as declined.

**Read `internal/tool-discovery.md` and follow it.** It holds the consent gate, the two registries, the candidate checks, and the recording rules.

The headline, so it is visible from here: **asking is mandatory, searching is not.** Nothing is searched, fetched, or installed until the user picks. And you can install a skill, but you **cannot** connect an MCP server for them, because that changes their own configuration.

Skip the file entirely when the stack walk chose no new tool.

### Step 6a: Doubt the decisions that are expensive to undo

Run this once the design conversation's completeness gate has passed and before a single document is written, on the few decisions a later skill cannot cheaply reverse.

**Read `internal/doubt-pass.md` and follow it.** It holds the trigger list, the brief for the doubter, how to sort what comes back, and the cap.

Three rules worth seeing from here. **Send the doubter the decision and what it must satisfy, and none of your reasoning**, because a reviewer given your argument reviews your argument and finds it coherent, which it is. **It writes nothing anywhere**, including `decision-log.md`, which is not this skill's file to write rows in.

And **each round spawns a subagent, so the user sets the cap.** Read the Doubt pass rounds section of `tooling.md`, and where it is empty ask once, recommending 3, then record the answer there so no later run asks again. Never ask per decision, and never raise the cap partway through a pass.

Skip the file when nothing this pass settled meets the trigger list. That is a normal outcome on a small project, and doubting an easily reversed choice costs an afternoon and buys nothing.

### Step 7: Write the Stage 1 documents

**Read `internal/standards.md` before writing `code-standards.md`.** It holds the convention questions, the four architecture style presets in `patterns/`, and the rule that an existing codebase gets its conventions derived from the code rather than recited from memory.

One file at a time, in order: `architecture.md`, `tooling.md`, `design.md`, `design-registry.md`, `code-standards.md`, `library-docs.md`.

`design.md` and `design-registry.md` are written during step 3, alongside the prototypes, since none of the three can be settled without the other two. Skip both on a backend.

**Stamp every document you create.** End each one with a single line:

```
_Drafted by /dev-architect on <date>. Edited by hand since then, in part or whole, unless this line says otherwise._
```

This exists so a later run, here or in `/dev-sync`, can tell what a tool wrote from what a person wrote, **instead of guessing**. Without it, every skill that maintains these files is left inferring intent from prose style, which it will get wrong.

**The stamp records provenance, not permission.** It never licenses overwriting a line someone edited. A stamped file still gets the same care as an unstamped one.

Skip `design.md` when there is no `app/`. **Never copy token values into `design.md` itself**, which only ever points at where they live, because two copies of a colour drift and the copy in the document is always the one that goes stale.

Where the values go depends on whether the project has code yet:

- **An existing project with a styling config.** Point `design.md` at it. Change nothing, since those values are decisions already made.
- **A greenfield project.** Write the starting values to `.konteksto/designs/shared/tokens.css` and point `design.md` there. `/dev-develop` moves them into the real styling config on the first UI task, and `design.md` is repointed then.

**You may not write the project's styling config yourself**, on a greenfield project or any other. That is application code and the guardrail above covers it with no exception. `shared/tokens.css` is inside `.konteksto/designs/`, which is why it is allowed and why it is temporary.

**Write the round cap into `tooling.md`'s Doubt pass rounds section**, using the answer step 6a got, or `3` where no doubt pass ran and nothing was asked. That section is what stops a later run asking the same question again.

**Fill the Definition of Done in `code-standards.md` with this project's real commands**, not a generic list. It is the standing bar every later skill checks before stamping a task `DONE`, so a row reading "tests pass" on a project whose test command you never confirmed is worse than an empty table: it will be ticked from memory. Keep the section and its Not on this list subsection as the template has them, since the exclusions are what stop it growing into a gate that swallows `/dev-check` and `/dev-test`.

**`library-docs.md` is sourced, not recalled.** Read the version out of the project's manifest, fetch the docs page for that version, and put its URL and the date you read it on the section's Source line. Where you keep a note you could not verify, write the unverified shape the template gives rather than softening the note itself, since a hedge inside prose gets skimmed and a Source line does not. Keep the Where a note comes from section exactly as the template has it: `/dev-sync` and `/dev-develop` both read it, and a sourcing rule only holds while it is written down.

For each:

1. Read the template in full before writing.
2. Replace every bracketed placeholder with real content. No literal `<TOKEN>` survives. Check before presenting.
3. Follow the template's repeat instructions. One section per table, per language, per client, per library. Produce as many as the project needs.
4. Keep a section marked Optional only when it genuinely applies. Remove it otherwise and say which you removed and why. Never present an empty section as a placeholder.
5. **Delete every section marked Reference only**, meaning the Worked example at the end of `progress-tracker.md`, `decision-log.md`, `note-registry.md`, and `design-registry.md`. Read it, then leave it out of the file you write. Its content is invented, and invented tasks, names, and dates left in a real document send the next session looking for work nobody did.
6. Present the file, get approval, then start the next. If a change contradicts an earlier file, go back and fix that file too.

### Step 8: Write the Stage 2 documents

Only after every **applicable** Stage 1 artifact is approved. Applicable matters: a backend with no `app/` never had `design.md`, `design-registry.md`, or any prototype, and waiting on them would wait forever. Same per file process, in order: `build-plan.md`, `progress-tracker.md`, `decision-log.md`, `note-registry.md`, `ui-registry.md`.

Extra rules:

- `build-plan.md` covers every feature in the Features in Scope list and nothing from the out of scope list. Its Feature Count table must match the number of tasks actually written. Order the phases so each one is visible and testable before the next starts.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one Progress table per phase and one row per task, same phase and task order. On a fresh project every row reads `PENDING` with no stamp, an empty Verify Check and Note written as `—`, Last completed reads "nothing yet", and Next names the first task. **Never stamp a row here.** A stamp names a model and a minute, and nothing has run yet. Its Worked example section is Reference only: read it for the shape, and delete it from the file you write.
- `decision-log.md` always ships, and always starts with its headings and an empty Entries table. Nothing has been decided during a build that has not started, so a row here would be invented reasoning. Keep the What belongs here section exactly as the template has it, since it is the boundary the writing skills read, and delete the Worked example.
- `note-registry.md` always ships, backend or frontend, and always starts with its headings and an empty Entries table. Nothing has been run yet, so writing a row here would be inventing evidence. Keep the Who writes what and Excluded sections exactly as the template has them, since they are the contract the three writing skills read, and delete the Worked example.

**Team Shape decides the shape of three of these.** Read that section in `project-overview.md` before writing any of them, and follow it exactly rather than deciding for yourself. `/dev-scope` asked the user, and this is where their answer takes effect.

**Mode is `team`:**

- Every task row in `progress-tracker.md` keeps its Assigned column, and every cell in it reads `unassigned`. Never fill in a name here. Nobody has picked up a task yet, and an assignee you invented would send someone to the wrong person.
- `note-registry.md` and `decision-log.md` both keep their Actor column. **Their Author column stays either way**, since the model varies between sessions even when the person does not.
- Say plainly in your handoff that the assignee is a convention rather than a lock, so nobody reads the column as a reservation the system enforces. It does not, and cannot.

**Mode is `personal`:** drop the Assigned column from every Progress table in `progress-tracker.md`, and delete the Actor column from `note-registry.md` and `decision-log.md` along with the paragraph describing it in each. One person means one value in all three, and a column with one value is noise that makes the file harder to read for no gain. **Keep the Author column in both.** It is not the same fact: the person is fixed on a personal project and the model is not.

**On `team`, also set up the role file.** Add `.konteksto/role.local.json` to the project's `.gitignore`, and write nothing into it yourself.

It holds one machine's answer to "am I a developer or a project manager", in the shape `{"role": "developer"}` or `{"role": "project-manager"}`. **It must stay out of git.** Role is a fact about a person, not about the project, so a committed copy would hold whatever the last person to answer said, and every teammate would then read somebody else's role as their own.

Do not ask during this run and do not create the file. You are one person setting the project up, and your own answer is the only one you could record. `/dev-develop` asks on first use, on each machine, and saves it there.

**Keep the scope of this honest when you report it, because it is easy to overstate.** It answers one question only: *is the person at this machine a developer or a project manager*. It cannot answer *who is the project manager on this project*, since it is never committed and every machine holds only its own answer.

That is why it is not how checkpoint sign off is checked. Each approver writes their own role beside their name in the Checkpoints table, so the record is self describing and needs no lookup. What the local file buys is smaller and worth having anyway: a skill can tell whether the person it is talking to may approve a checkpoint or reassign a task, and offer accordingly rather than prompting everybody with everything.

**Checkpoints are on:** give every phase in `build-plan.md` a Checkpoint block as its last subsection, and give `progress-tracker.md` its Checkpoints table with one row per phase, every row starting at `not due` with no approvals. Write real criteria per phase, drawn from what that phase actually delivers, not a generic "review the code". The Needs test coverage line names what should be covered and nothing more, since `/dev-test` writes the tests.

**Checkpoints are off:** omit the Checkpoint blocks and delete the Checkpoints section from `progress-tracker.md` entirely. Do not leave an empty section as a placeholder.
- `ui-registry.md` is skipped when the project has no component based UI layer, the same condition under which `code-standards.md` has no Component Structure section. Say you skipped it rather than writing an empty file. On a fresh project with a UI layer it starts empty apart from its heading, since no component exists yet.

### Step 9: Check, cross check, and confirm

**Read `internal/after-writing.md` and follow it**, once the documents exist.

It covers confirming the write landed, checking your own work for blank fields, offering a cross check on a different model, and the acceptance loop. Its two rules that matter most: **always ask about the cross check rather than running or skipping it yourself**, and **never silently resolve a gap it finds**, because each one is a load bearing decision that belongs to the user.

### Step 10: Report

Say six things:

- The files written, including `docker-compose.yml` and `.env.example` if step 5 wrote them.
- The optional sections and files skipped, and why, including `design.md` when there is no frontend.
- The design source: the template chosen and its license, the design provided, or that there was none.
- Every container in the compose file, its purpose, and the port it is on. Name any stand in service and the real service it stands in for. State what happens to local data between tasks.
- **Every security finding from the dependency audit**, with its severity and whether the fix became a task. If the user declined an update, say so plainly here as well as recording it, so an accepted risk stays visible.
- Every skill installed, by name.
- Every MCP server the user still needs to connect themselves, with the exact command.
- That no application code was written.

Then name the next step: a separate request to build the first task in `build-plan.md`.

---

## Reference files

All of these live in this skill's folder, read only when you reach them.

- `internal/design-direction.md`: taking in supplied designs, the flow to surface audit, settling the system, building the prototypes, and the approval ask. Read at step 3, frontend only.
- `internal/design-judgment.md`: the designer posture, the ten capabilities, the rules that hold on every surface, and the self critique. **Read with `design-direction.md` at step 3**, frontend only, and never on a backend.
- `internal/brownfield-audit.md`: the structure confirmation, the existing component decision, and the dependency audit. Read at step 4, existing codebases only.
- `internal/standards.md`: the convention and tooling questions that fill `code-standards.md`, and how to derive conventions from an existing codebase. Read at step 7.
- `patterns/*.md`: the four architecture style presets. Read only the one the user picks, at write time.
- `internal/stack-defaults.md`: the architecture pattern table, the durable category per layer, and the opinions to apply. Read during the stack walk in step 2.
- `internal/after-writing.md`: the self check, the cross check offer, the acceptance loop, and the closing summary. Read at step 9, never earlier.
- `internal/judgment.md`: the posture, the known failure patterns, the challenge the premise step, and the rules that hold across every decision. **Read in full before step 2**, alongside the conversation protocol.
- `internal/design-conversation.md`: the interview protocol. The already built check, framing, the dimension checklist, question mechanics, the six stages, and the completeness gate. **Read in full before step 2**, and it is a hard gate, not a suggestion.
- `internal/tool-discovery.md`: the skill and MCP consent gate, the two registries, the candidate checks, and how each kind is set up. Read at step 6, and only when the stack walk chose a new tool.
- `internal/doubt-pass.md`: the trigger list, the adversarial brief, how to sort the findings, and the three round cap. Read at step 6a, and only for a decision that is expensive to undo.
