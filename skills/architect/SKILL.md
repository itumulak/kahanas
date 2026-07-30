---
name: architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch
description: "Run /architect after /scope to design how the product gets built. Weighs options, settles the stack and the design direction, audits an existing codebase for outdated or vulnerable packages, finds the MCP servers and skills that fit, then writes architecture, tooling, design, code standards, library docs, build plan, progress tracker, and ui registry into .konteksto/."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Answers **how the product gets built**, given a `project-overview.md` that already says what it is. Settles every load bearing technical decision, then records the result across eight documents in `.konteksto/`.

`/scope` owns the what and never names a tool. This skill makes every tool call there is.

## Artifact ownership

Eight documents, all created and updated by this skill only, filled from the matching template in `templates/`.

**Stage 1, the foundation.** What the system is made of.

| Order | Document | Depends on |
| --- | --- | --- |
| 1 | `architecture.md` | the pages and flows in `project-overview.md` |
| 2 | `tooling.md` | the Stack table in `architecture.md` |
| 3 | `design.md` | the client framework, and the flows in `project-overview.md`. **Frontend only**, skip it entirely when there is no `app/` |
| 4 | `code-standards.md` | the Stack table, and where `design.md` says the tokens live |
| 5 | `library-docs.md` | the approved dependency list in `code-standards.md` |

**Stage 2, the plan.** Turns the foundation into an ordered build. Starts only once every Stage 1 document is approved.

| Order | Document | Depends on |
| --- | --- | --- |
| 6 | `build-plan.md` | Features in Scope, plus the architecture |
| 7 | `progress-tracker.md` | the exact phases and tasks in `build-plan.md` |
| 8 | `ui-registry.md` | the component rules in `code-standards.md` and `design.md` |

Never touch `project-overview.md`. It is `/scope`'s file. If the design work proves it wrong, say so and ask the user to run `/scope` again rather than editing it yourself.

**Two of these are living files, created here and updated elsewhere.** `progress-tracker.md` and `ui-registry.md` are written once by this skill, in their starting state, and every update after that belongs to `/develop`: a ticked task, a new component section. Do not tick a box or register a component that does not exist yet.

Read a template from `templates/`, write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place.

## Guardrails

Do NOT write application code, scaffold a project, or install a package the product itself ships. This skill produces documents and settles decisions. Building starts as a separate, later request.

Two narrow exceptions. Agent tooling found in step 6, meaning skills and MCP servers, may be set up during this skill, but only per the consent rules in that step, and only for a tool the user approved by name. And `docker-compose.yml` plus `.env.example` are written in step 5, because they are the structure the build sits in rather than the product itself.

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

- **Read `.konteksto/project-overview.md` in full.** If it does not exist, stop and tell the user to run `/scope` first. Everything here depends on it.
- **Read what `/scope` handed you**, if anything: whether a codebase exists, the stack it showed, and any tool or constraint the user named during scoping. Do not survey the same ground again.
- **Work out whether the code is actually somebody else's.** A manifest and a source tree are not proof of an existing codebase, because `/develop` scaffolds this project itself as the first task in the plan. Code whose stack matches what `.konteksto/architecture.md` already specifies is **our own scaffold**, and it is not brownfield. Only code with no matching documents, or code that diverges from them, is a real existing codebase.
- **If a real codebase exists and you were not handed a survey**, read it now: the directory tree, every package manifest, the lint and build config, the entry points. The stack that is already there is a decision already made. Record it, do not re litigate it.
- **Check `.konteksto/` for existing documents.** Report which of the eight are present. Never overwrite one silently; ask whether to update in place or start over.

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

Stages A, B, D, E, and F of the design conversation happen here too, not only the stack walk. The data model is elicited and confirmed, and the value sourcing loop is closed. Both are in `internal/design-conversation.md`, and skipping either produces a document set `/develop` cannot build from.

### Step 3: The design direction

**Skip this whole step when there is no `app/`**, meaning Project Shape said backend only. A backend has no art direction, and `design.md` is not written at all.

The client framework is now known, which matters, because a starter template is framework specific.

#### Ask whether a design already exists

> "Do you have a design ready for this, or should I recommend a starting point?"

1. **I have a design**: a mockup, a Figma file, a screenshot, or a live site to match. Ask which, and where it is. Record what it is in `design.md`'s Source section, then go to the follow up questions below to fill the parts a static picture cannot answer.
2. **Recommend a starting point** (recommended when nothing exists): go to the next part.
3. **No visual direction, build to the defaults**: `design.md` still gets written, derived from the follow up questions alone. Say plainly that the result will be competent rather than distinctive, since nothing anchors it.

#### Recommend free starter templates

Only for the framework already chosen in step 2. A template for a different framework is not a recommendation, it is a stack change.

Find two or three real, free, actively maintained templates for that exact framework. **Fetch each one's page before proposing it.** Never recommend a template from memory, because template galleries change constantly and a dead link wastes the user's time.

For each, say: its name, its link, its license, what kind of product it suits, and what it would cost to bend it toward this product. Recommend one, with a one line why.

Check each against the product before proposing it:

- It fits the pages in `project-overview.md`. A marketing template for an application with a dense data table is a fight, not a head start.
- Its license permits the intended use. Say the license out loud rather than assuming it is permissive.
- It is maintained. An abandoned template carries abandoned dependencies, which lands you in the audit in step 4 on day one.

The user may decline all of them. That is option 3 above, not a failure.

#### Follow up on behavior, not looks

A template settles how it looks. It settles almost nothing about how it behaves. Ask about the parts a picture cannot show, in one round of up to four questions, and **anchor every one to a real flow in `project-overview.md`** rather than asking in the abstract.

Cover, choosing what actually applies:

- **The empty state** for each list or feed the flows describe. What does a person see before there is any data, and what does it offer them next? This is the state most often skipped and most often noticed.
- **Loading.** A skeleton, a spinner, or an optimistic update? This changes how a component is built, not only how it looks.
- **Errors.** What a person sees when something fails, and what they can do about it.
- **Density.** Roomy or compact. A flow that involves scanning many rows wants a different answer from one that involves reading.
- **Navigation at the small end.** What happens to the navigation `project-overview.md` describes on a phone.
- **Dark mode.** Whether it exists at all. Deciding this later means revisiting every colour.

Record the answers in `design.md`'s States, Composition patterns, and Responsive sections. **Every answer must be consistent with a flow in `project-overview.md`.** Where an answer contradicts a flow, say so and settle it now, because one of the two is wrong.

### Step 4: Audit an existing codebase

**Skip this step entirely on a fresh project, and on our own scaffold.** It applies only when step 1 found code that this workflow did not generate. Auditing dependencies `/develop` installed from your own stack decision minutes earlier is pure noise, and it teaches the user to skim these reports.

Existing code is a set of decisions already made, most of them by someone with context you do not have. The job is to surface them and get a ruling, not to quietly modernize.

#### Confirm the project structure

`project-overview.md`'s Project Shape already records whether the user wanted the recommended layout or kept their own. **Read it and confirm that decision still holds**, now that the stack is settled and the real cost of moving folders is visible.

If they change their mind, that section belongs to `/scope`. Say so and route them back rather than editing it here. Do not move any file yourself: `/develop` does that, as a task in the plan.

#### Decide what happens to existing components

Ask directly, because both answers are defensible and the wrong assumption is expensive:

> "There are existing components that no task touches yet. Leave them exactly as they are, or bring them in line with the new standards now?"

1. **Leave them, change one only when a task touches it** (recommended): the plan stays small, nothing unrelated breaks, and the codebase converges gradually. Record this as a rule in `code-standards.md`, so no later session treats an old component as a defect.
2. **Bring them all in line now**: honest, and sometimes right before a large build, but it becomes its own phase in `build-plan.md` with its own tasks, never invisible work folded into a feature.

Whichever is chosen, write it down. An unrecorded answer here produces a build where half the sessions refactor on sight and half do not.

#### Audit the dependencies

Read the lock file and the manifest, then check each dependency's real current state. **Fetch the registry or repository page rather than relying on memory**, because a version you remember as current may be two years stale.

Sort every dependency into one of four groups, and handle each differently:

| Finding | What to do |
| --- | --- |
| **Has a known vulnerability** | Update it. This is not a preference, and it is not deferred to a later phase. |
| **Outdated, still maintained** | Update to the current version. Where the jump crosses a major version, say what breaks and make it its own task. |
| **Archived or unmaintained, with a security fix available** | Update to the fixed version now, and plan the replacement separately. |
| **Archived or unmaintained, with no fix coming** | Propose a replacement. |

**On vulnerabilities.** Run the ecosystem's own audit command and read what it reports. Present each finding with its severity, what the package is used for in this project, and the fixed version. **A vulnerable dependency is not a matter of taste**, so recommend the update plainly rather than offering it as one option among equals. The user can still decline, and if they do, record the decision and the reason in `library-docs.md` so it is a known accepted risk rather than an oversight.

**On proposing a replacement**, it must clear the same bar as any other tool in step 2, and you say which checks it passed:

- It genuinely covers what the current package is used for here. Check the actual usage in the code, not the package description.
- It is actively maintained, with real recent activity.
- Its license works for this project.
- The migration cost is stated honestly, including how many files change.

Never swap a library silently as part of another change. Every replacement is its own task in `build-plan.md`, with the reason recorded in `library-docs.md`.

**Record everything.** Updates and replacements become tasks in `build-plan.md`, and `library-docs.md` carries the version notes and the reasons. A finding that is only mentioned in conversation is a finding that gets lost.

Both of those files are written later, in steps 7 and 8. Hold the findings until then rather than writing early, and carry them forward as a list.

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

Writing this file is the one exception to the no code rule, because it is the structure the build sits in rather than the product itself. Do not write a `Dockerfile.dev`, and do not run `docker compose up`. `/develop` does both.

### Step 6: Agent tooling discovery

Run this only once the stack is settled, and only for tools not already installed or already recorded as declined.

**Read `internal/tool-discovery.md` and follow it.** It holds the consent gate, the two registries, the candidate checks, and the recording rules.

The headline, so it is visible from here: **asking is mandatory, searching is not.** Nothing is searched, fetched, or installed until the user picks. And you can install a skill, but you **cannot** connect an MCP server for them, because that changes their own configuration.

Skip the file entirely when the stack walk chose no new tool.

### Step 7: Write the Stage 1 documents

**Read `internal/standards.md` before writing `code-standards.md`.** It holds the convention questions, the four architecture style presets in `patterns/`, and the rule that an existing codebase gets its conventions derived from the code rather than recited from memory.

One file at a time, in order: `architecture.md`, `tooling.md`, `design.md`, `code-standards.md`, `library-docs.md`.

**Stamp every document you create.** End each one with a single line:

```
_Drafted by /architect on <date>. Edited by hand since then, in part or whole, unless this line says otherwise._
```

This exists so a later run, here or in `/sync`, can tell what a tool wrote from what a person wrote, **instead of guessing**. Without it, every skill that maintains these files is left inferring intent from prose style, which it will get wrong.

**The stamp records provenance, not permission.** It never licenses overwriting a line someone edited. A stamped file still gets the same care as an unstamped one.

Skip `design.md` when there is no `app/`. Write the token values into the project's own styling config and **point at them** from `design.md`, never copy them into it. Two copies of a colour drift, and the copy in the document is always the one that goes stale.

For each:

1. Read the template in full before writing.
2. Replace every bracketed placeholder with real content. No literal `<TOKEN>` survives. Check before presenting.
3. Follow the template's repeat instructions. One section per table, per language, per client, per library. Produce as many as the project needs.
4. Keep a section marked Optional only when it genuinely applies. Remove it otherwise and say which you removed and why. Never present an empty section as a placeholder.
5. Present the file, get approval, then start the next. If a change contradicts an earlier file, go back and fix that file too.

### Step 8: Write the Stage 2 documents

Only after all four Stage 1 documents are approved. Same per file process, in order: `build-plan.md`, `progress-tracker.md`, `ui-registry.md`.

Extra rules:

- `build-plan.md` covers every feature in the Features in Scope list and nothing from the out of scope list. Its Feature Count table must match the number of tasks actually written. Order the phases so each one is visible and testable before the next starts.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one checkbox per task, same phase and task order. On a fresh project every box starts unchecked, Last completed reads "nothing yet", and Next names the first task.
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

Both live in this skill's folder, read only when you reach them.

- `internal/standards.md`: the convention and tooling questions that fill `code-standards.md`, and how to derive conventions from an existing codebase. Read at step 7.
- `patterns/*.md`: the four architecture style presets. Read only the one the user picks, at write time.
- `internal/stack-defaults.md`: the architecture pattern table, the durable category per layer, and the opinions to apply. Read during the stack walk in step 2.
- `internal/after-writing.md`: the self check, the cross check offer, the acceptance loop, and the closing summary. Read at step 9, never earlier.
- `internal/judgment.md`: the posture, the known failure patterns, the challenge the premise step, and the rules that hold across every decision. **Read in full before step 2**, alongside the conversation protocol.
- `internal/design-conversation.md`: the interview protocol. The already built check, framing, the dimension checklist, question mechanics, the six stages, and the completeness gate. **Read in full before step 2**, and it is a hard gate, not a suggestion.
- `internal/tool-discovery.md`: the skill and MCP consent gate, the two registries, the candidate checks, and how each kind is set up. Read at step 6, and only when the stack walk chose a new tool.
