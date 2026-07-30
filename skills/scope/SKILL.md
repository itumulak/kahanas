---
name: scope
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch
description: "Run /scope when initializing a project. Checks the root folder for an existing codebase, runs structured discovery that weighs options, finds the MCP servers and skills that match the chosen stack, fills the five foundation docs (project overview, architecture, tooling, code standards, library docs), then fills the three planning docs (build plan, progress tracker, ui registry)."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## Guardrails

Do NOT invoke any implementation skill, write any application code, scaffold any project, install any package the product itself will ship, or take any other implementation action while this skill is running. This skill produces documents. It ends when the eight documents are written and approved, and building the product starts in a separate, later request.

There is one narrow exception. Agent tooling found in step 4, meaning MCP servers and skills, may be installed during this skill, but only after the user has approved that exact tool by name. Installing agent tooling changes the user's environment, so it is never done in bulk and never without an explicit yes for each one. See step 4 for the full rules.

Do NOT fill a document with a guess. Every value written into a document is either read from the existing codebase, stated by the user, found at a source you actually fetched, or chosen from options you presented and the user approved.

These rules apply to EVERY project regardless of how simple it looks.

## What this skill does

Creates a project's living documentation in `.konteksto/` at the project root, using the templates bundled with this skill.

**Templates live in this skill's own `templates/` folder**, next to this file. Read a template from there, then write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place, and never treat a template as the project's document.

The work runs in two stages, in this order, because each later document depends on the earlier ones.

**Stage 1, the foundation docs.** These five describe what the project is, how it is built, and what tooling the agent works with.

| Order | Template | Written to | Depends on |
| --- | --- | --- | --- |
| 1 | `project-overview.md` | `.konteksto/project-overview.md` | nothing |
| 2 | `architecture.md` | `.konteksto/architecture.md` | the pages and flows named in project overview |
| 3 | `tooling.md` | `.konteksto/tooling.md` | the Stack table in architecture |
| 4 | `code-standards.md` | `.konteksto/code-standards.md` | the Stack table in architecture |
| 5 | `library-docs.md` | `.konteksto/library-docs.md` | the approved dependency list in code standards |

**Stage 2, the planning docs.** These three turn the foundation into an ordered build, and may only start once all five Stage 1 documents are approved.

| Order | Template | Written to | Depends on |
| --- | --- | --- | --- |
| 6 | `build-plan.md` | `.konteksto/build-plan.md` | features in scope, plus the architecture |
| 7 | `progress-tracker.md` | `.konteksto/progress-tracker.md` | the exact phases and tasks in build plan |
| 8 | `ui-registry.md` | `.konteksto/ui-registry.md` | the component rules in code standards |

## The "this is too simple to need a design" trap

Every project goes through this process. A todo list, a one function utility, a config change, all of them. Projects that look simple are where unexamined assumptions cause the most wasted work. A document may be short, a few sentences is fine for a genuinely small project, but you MUST write it and get approval.

## Checklist

You MUST create a task for each numbered item and complete them in order.

### 1. Check the root folder for an existing codebase

List the project root and look for source folders, a package manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or similar), config files, and a git history.

- **No codebase found.** This is a fresh project. Start the survey at step 2 with no assumptions about stack or structure.
- **Codebase found.** Read it first: the directory tree, every package manifest, the lint and build config, the entry points, and the recent commits. Draft each document from what the code actually shows. Only ask the user about things the code cannot tell you, such as intent, audience, and what is deliberately out of scope.

Also check whether `.konteksto/` already exists. If it does, do not overwrite it silently: report which of the eight documents are already present and ask whether to update them in place or start over.

### 2. Ask clarifying questions, one at a time

Ask a single question, wait for the answer, then ask the next. Use `AskUserQuestion` when the answer is a choice between known options.

Cover at minimum: what the product is, the problem it solves, who it is for, what it must do in this build pass, what is explicitly out of scope, and what "done" looks like. For an existing codebase, phrase these as confirmations of what you inferred in step 1 rather than asking the user to restate what the code already says.

### 3. Weigh options for every undecided choice

For any stack, structure, or convention choice that is not already fixed by the existing codebase or by the user, present 2 or 3 real approaches with their trade offs and name your recommendation. Wait for the user to pick. Only the picked option goes into a document.

Record the choice and the reason at the point the template asks for it, for example the "Why these choices" list in `architecture.md`.

### 4. Find the MCP servers and skills that match the stack

Run this only after the stack is settled, meaning every layer in the Stack table has a named tool. Tooling is chosen for a known stack, never before one.

**Search these two kinds of source separately, because they are different registries.**

*Skills*, which are reusable procedural knowledge for the agent:

- `skills.sh`, a public skills directory. Entries install with `npx skills add <owner/repo>`.
- The GitHub repository behind any entry you shortlist. Open it and confirm it exists and is maintained before proposing it.

*MCP servers*, which give the agent live access to a running system:

- The official Model Context Protocol servers repository and registry, for reference servers.
- The first party documentation of the vendor whose system the server talks to. A database, hosting platform, or issue tracker publishing its own server is the strongest signal.
- A marketplace the user already trusts, if they name one.

**Judge each candidate against these checks before proposing it.** Say which checks it passed.

1. It serves a layer that is actually in the Stack table, or a task named in `project-overview.md`. No tool is added because it is popular.
2. It is first party, or its repository is public, readable, and recently maintained.
3. You fetched its real source page. Never propose a tool from memory, and never invent an install command. If you cannot fetch it, say so and drop it.
4. Its access scope is proportionate. Prefer a read only server over a write capable one unless the project needs writes.

**Then present, approve, and only then install.**

Present the shortlist as one table: name, kind, source URL, the stack layer it serves, and what it would be allowed to reach. Recommend a subset and say plainly which ones you would skip.

Get an explicit yes for each tool by name. A general "sounds good" is not approval to install everything on the list. For each approved tool, run its documented install command, one at a time, and report the result before starting the next.

Anything the user declines goes into the Considered and Rejected table in `tooling.md` with the reason, so a later session does not raise it again.

If the search finds nothing that passes the checks, that is a valid result. Say so, and write `tooling.md` with the empty sections removed rather than padding it.

### 5. Fill the Stage 1 foundation docs

Work one file at a time, in the table order above: `project-overview.md`, `architecture.md`, `tooling.md`, `code-standards.md`, `library-docs.md`.

For each file:

1. Read the template in full before writing anything.
2. Replace every bracketed placeholder with real project content. A finished file must contain no literal `<TOKEN>` text. Check this before presenting the file.
3. Follow each template's own repeat instruction. Where a template says to repeat a section once per page, per table, per language, or per library, produce exactly that many, not one example.
4. Keep a section marked Optional only when it genuinely applies. Remove it when it does not, and say in your message which optional sections you removed and why. Never present a file with an empty section left in as a placeholder.
5. Present the finished file and get approval before starting the next one. If the user changes something that an earlier file already recorded, go back and update that earlier file too.

### 6. Fill the Stage 2 planning docs

Only start after all five Stage 1 documents are approved. Same order and same per file process as step 5: `build-plan.md`, `progress-tracker.md`, `ui-registry.md`.

Extra rules for this stage:

- `build-plan.md` covers every feature listed under Features in Scope in `project-overview.md`, and nothing that is listed as out of scope. Its Feature Count table must add up to the number of tasks actually written.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one checkbox per task, in the same phase and task order. On a fresh project every box starts unchecked, Last completed reads "nothing yet", and Next names the first task.
- `ui-registry.md` is skipped when the project has no component based UI layer, which is the same condition under which `code-standards.md` has no Component Structure section. Say that you skipped it rather than writing an empty file. On a fresh project with a UI layer, the registry starts empty apart from its heading and intent line, since no component exists yet.

### 7. Close out

Report four things:

- The files written.
- The optional sections and files skipped, and why.
- Every agent tool installed in step 4, by name, so the user has one clear record of what changed in their environment.
- That no application code was written.

Then name the next step, which is a separate request to start building the first task in `build-plan.md`.
