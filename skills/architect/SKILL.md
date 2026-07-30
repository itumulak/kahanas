---
name: architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch
description: "Run /architect after /scope to design how the product gets built. Weighs options, settles the stack, finds the MCP servers and skills that fit it, then writes architecture, tooling, code standards, library docs, build plan, progress tracker, and ui registry into .konteksto/."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Answers **how the product gets built**, given a `project-overview.md` that already says what it is. Settles every load bearing technical decision, then records the result across seven documents in `.konteksto/`.

`/scope` owns the what and never names a tool. This skill makes every tool call there is.

## Artifact ownership

Seven documents, all created and updated by this skill only, filled from the matching template in `templates/`.

**Stage 1, the foundation.** What the system is made of.

| Order | Document | Depends on |
| --- | --- | --- |
| 1 | `architecture.md` | the pages and flows in `project-overview.md` |
| 2 | `tooling.md` | the Stack table in `architecture.md` |
| 3 | `code-standards.md` | the Stack table in `architecture.md` |
| 4 | `library-docs.md` | the approved dependency list in `code-standards.md` |

**Stage 2, the plan.** Turns the foundation into an ordered build. Starts only once all four Stage 1 documents are approved.

| Order | Document | Depends on |
| --- | --- | --- |
| 5 | `build-plan.md` | Features in Scope, plus the architecture |
| 6 | `progress-tracker.md` | the exact phases and tasks in `build-plan.md` |
| 7 | `ui-registry.md` | the component rules in `code-standards.md` |

Never touch `project-overview.md`. It is `/scope`'s file. If the design work proves it wrong, say so and ask the user to run `/scope` again rather than editing it yourself.

**Two of these are living files, created here and updated elsewhere.** `progress-tracker.md` and `ui-registry.md` are written once by this skill, in their starting state, and every update after that belongs to `/develop`: a ticked task, a new component section. Do not tick a box or register a component that does not exist yet.

Read a template from `templates/`, write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place.

## Guardrails

Do NOT write application code, scaffold a project, or install a package the product itself ships. This skill produces documents and settles decisions. Building starts as a separate, later request.

Two narrow exceptions. Agent tooling found in step 4, meaning skills and MCP servers, may be set up during this skill, but only per the consent rules in that step, and only for a tool the user approved by name. And `docker-compose.yml` plus `.env.example` are written in step 3, because they are the structure the build sits in rather than the product itself.

Do NOT fill a document with a guess. Every value is read from the existing codebase, stated by the user, found at a source you actually fetched, or picked by the user from options you presented.

Do NOT let a document look simple enough to skip. A one page tool still needs its stack recorded. The document can be short. It cannot be absent.

## Asks vs acts

- **INFER**: anything `project-overview.md` or the existing codebase already settles. The platform, whether there is a UI layer, an already chosen provider, the shape of the data. Derive it and confirm in one line.
- **ASK**: only what the user alone knows. Hosting constraints, existing accounts and contracts, compliance scope, team familiarity, budget.
- **RECOMMEND**: anything expertise settles. Which framework, which database, which pattern. Make the call, give a one line why, name the runner up. Never a neutral menu, never a silent decision.

Recommendations build on what the project already uses. If the codebase is already on a platform, prefer that platform's own auth and storage over adding an external tool. Reuse beats sprawl.

## Decision panels

Every user facing choice is an options panel: 2 to 4 concrete options real to this project, exactly one marked as recommended with a one line why. Use `AskUserQuestion` where available, otherwise the same options as plain text. Ask in rounds of up to 4 related questions.

## Execution

### Step 1: Pre flight

- **Read `.konteksto/project-overview.md` in full.** If it does not exist, stop and tell the user to run `/scope` first. Everything here depends on it.
- **Read what `/scope` handed you**, if anything: whether a codebase exists, the stack it showed, and any tool or constraint the user named during scoping. Do not survey the same ground again.
- **If a codebase exists and you were not handed a survey**, read it now: the directory tree, every package manifest, the lint and build config, the entry points. The stack that is already there is a decision already made. Record it, do not re litigate it.
- **Check `.konteksto/` for existing documents.** Report which of the seven are present. Never overwrite one silently; ask whether to update in place or start over.

### Step 2: Settle the stack

Read the Project Shape section of `project-overview.md` first. It says whether the product is frontend only, backend only, or both, and it fixes the folder layout. Ask stack questions only for the halves that exist. Never ask which database a frontend only project uses.

Walk every layer that half needs:

- **Client**, when `app/` exists: language, framework, routing, styling or UI kit, state handling.
- **Server**, when `backend/` exists: language, framework, data storage, migrations, auth and sessions.
- **Anything the flows imply**, either half: payments, transactional email, file storage, search, caching, queues, background work, realtime.

For each layer not already fixed by the existing codebase or named by the user, present a panel with 2 or 3 real options, their trade offs, and your recommendation. Name real tools here. This is the one place in the workflow where that happens. Only the picked option goes into a document.

Record each pick and its reason in the "Why these choices" list in `architecture.md`.

The stack is settled when every layer of every existing half has a named tool. Do not start step 3 before that.

### Step 3: Local development containers

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

Record every service, its purpose, and its ports in `tooling.md`.

Writing this file is the one exception to the no code rule, because it is the structure the build sits in rather than the product itself. Do not write a `Dockerfile.dev`, and do not run `docker compose up`. `/develop` does both.

### Step 4: Agent tooling discovery

Run this only once the stack is settled, and only for tools that are not already installed or already recorded as declined.

#### Ask first, this is a consent gate

**Asking is mandatory. Searching is not.** Nothing is searched, fetched, installed, or spawned until the user has picked. Never run a search before they agree to one, and never skip the offer.

Explain the value in a sentence or two, in your own words, then ask. Something close to:

> A skill teaches the agent a tool's real conventions, so the build follows them instead of guessing. An MCP server gives the agent live access to the real system, your database or your dashboard, rather than assumptions about it. Both are optional, both usually make the build better.

Present a panel: "Want me to find skills and MCP servers for this stack?"

1. **Yes, find them for me** (recommended): "I search for the tools we just chose, then show you what I find. Nothing is set up without your pick."
2. **I will name the ones I want**: "Tell me which, and I add exactly those. No searching."
3. **No, skip it**: "Build without them. I record the decline so nothing offers them again."
4. **Not now, later**: "I note them in `tooling.md` so you can add them when you want."

Only the first option may run a search.

#### Search two registries, they are not the same

*Skills*, which are reusable procedural knowledge for the agent:

- `skills.sh`, a public skills directory. Entries install with `npx skills add <owner>/<repo>`.
- The GitHub repository behind any entry you shortlist. Open it and confirm it exists and is maintained.

*MCP servers*, which give the agent live access to a running system:

- The official Model Context Protocol servers repository and registry.
- The first party documentation of the vendor whose system the server talks to. A database or hosting platform publishing its own server is the strongest signal.
- A marketplace the user already trusts, if they name one.

Build the search set from every layer in the Stack table, not just the first one. One good hit for the framework does not mean you stop before searching the database.

#### Judge each candidate before proposing it

Say which checks it passed.

1. It serves a layer that is actually in the Stack table, or a flow named in `project-overview.md`. Nothing is added because it is popular.
2. It is first party, or its repository is public, readable, and recently maintained.
3. You fetched its real source page. Never propose a tool from memory, and never invent an install command. If you cannot fetch it, say so and drop it.
4. Its access scope is proportionate. Prefer a read only server over a write capable one unless the project needs writes.

#### Offer, then act

Present two panels, skills and MCP servers separately, each listing everything you found grouped by the layer it serves. Do not pick a single winner. Say plainly which ones you would skip.

Get an explicit yes for each tool by name. A general "sounds good" is not approval for the whole list.

Then act, and note that the two kinds are not set up the same way:

- **Skills**: you can install them. Run `npx skills add <owner>/<repo>` for each approved one, one at a time, and report the result before starting the next.
- **MCP servers**: you cannot connect these for the user. Connecting one is a change to their own agent configuration, for example `claude mcp add ...`. Give them the exact command from the server's own documentation and let them run it. Once connected, its tools simply become available.

Anything declined goes in the Considered and Rejected table in `tooling.md` with the reason, so a later session does not raise it again.

Found nothing that passes the checks? Say so plainly and move on. Never invent a candidate to fill a panel.

### Step 5: Write the Stage 1 documents

One file at a time, in order: `architecture.md`, `tooling.md`, `code-standards.md`, `library-docs.md`.

For each:

1. Read the template in full before writing.
2. Replace every bracketed placeholder with real content. No literal `<TOKEN>` survives. Check before presenting.
3. Follow the template's repeat instructions. One section per table, per language, per client, per library. Produce as many as the project needs.
4. Keep a section marked Optional only when it genuinely applies. Remove it otherwise and say which you removed and why. Never present an empty section as a placeholder.
5. Present the file, get approval, then start the next. If a change contradicts an earlier file, go back and fix that file too.

### Step 6: Write the Stage 2 documents

Only after all four Stage 1 documents are approved. Same per file process, in order: `build-plan.md`, `progress-tracker.md`, `ui-registry.md`.

Extra rules:

- `build-plan.md` covers every feature in the Features in Scope list and nothing from the out of scope list. Its Feature Count table must match the number of tasks actually written. Order the phases so each one is visible and testable before the next starts.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one checkbox per task, same phase and task order. On a fresh project every box starts unchecked, Last completed reads "nothing yet", and Next names the first task.
- `ui-registry.md` is skipped when the project has no component based UI layer, the same condition under which `code-standards.md` has no Component Structure section. Say you skipped it rather than writing an empty file. On a fresh project with a UI layer it starts empty apart from its heading, since no component exists yet.

### Step 7: Report

Say six things:

- The files written, including `docker-compose.yml` and `.env.example` if step 3 wrote them.
- The optional sections and files skipped, and why.
- Every container in the compose file, its purpose, and the port it is on. Name any stand in service and the real service it stands in for.
- Every skill installed, by name.
- Every MCP server the user still needs to connect themselves, with the exact command.
- That no application code was written.

Then name the next step: a separate request to build the first task in `build-plan.md`.
