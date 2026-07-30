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

Read a template from `templates/`, write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place.

## Guardrails

Do NOT write application code, scaffold a project, or install a package the product itself ships. This skill produces documents and settles decisions. Building starts as a separate, later request.

One narrow exception: agent tooling found in step 3, meaning skills and MCP servers, may be set up during this skill, but only per the consent rules in that step, and only for a tool the user approved by name.

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

Walk every layer the product needs: runtime, language, framework, routing, styling or UI kit, data storage, auth, and anything the flows in `project-overview.md` imply, such as payments, email, file storage, search, or background work.

For each layer that is not already fixed by the existing codebase or named by the user, present a panel with 2 or 3 real options, their trade offs, and your recommendation. Only the picked option goes into a document.

Record each pick and its reason in the "Why these choices" list in `architecture.md`.

The stack is settled when every layer has a named tool. Do not start step 3 before that, because tooling is chosen for a known stack.

### Step 3: Agent tooling discovery

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

### Step 4: Write the Stage 1 documents

One file at a time, in order: `architecture.md`, `tooling.md`, `code-standards.md`, `library-docs.md`.

For each:

1. Read the template in full before writing.
2. Replace every bracketed placeholder with real content. No literal `<TOKEN>` survives. Check before presenting.
3. Follow the template's repeat instructions. One section per table, per language, per client, per library. Produce as many as the project needs.
4. Keep a section marked Optional only when it genuinely applies. Remove it otherwise and say which you removed and why. Never present an empty section as a placeholder.
5. Present the file, get approval, then start the next. If a change contradicts an earlier file, go back and fix that file too.

### Step 5: Write the Stage 2 documents

Only after all four Stage 1 documents are approved. Same per file process, in order: `build-plan.md`, `progress-tracker.md`, `ui-registry.md`.

Extra rules:

- `build-plan.md` covers every feature in the Features in Scope list and nothing from the out of scope list. Its Feature Count table must match the number of tasks actually written. Order the phases so each one is visible and testable before the next starts.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one checkbox per task, same phase and task order. On a fresh project every box starts unchecked, Last completed reads "nothing yet", and Next names the first task.
- `ui-registry.md` is skipped when the project has no component based UI layer, the same condition under which `code-standards.md` has no Component Structure section. Say you skipped it rather than writing an empty file. On a fresh project with a UI layer it starts empty apart from its heading, since no component exists yet.

### Step 6: Report

Say five things:

- The files written.
- The optional sections and files skipped, and why.
- Every skill installed, by name.
- Every MCP server the user still needs to connect themselves, with the exact command.
- That no application code was written.

Then name the next step: a separate request to build the first task in `build-plan.md`.
