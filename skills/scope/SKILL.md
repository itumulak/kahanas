---
name: scope
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /scope to start a project. Checks the root folder for an existing codebase, then turns the idea into .konteksto/project-overview.md: what the product is, who it is for, its pages, its flows, and what is deliberately out of scope. Owns that one file and nothing else. Stays tool agnostic; /architect picks the stack."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The front door of the workflow, and the answer to one question: **what is being built, and for whom.**

Surveys the project root, then fills `.konteksto/project-overview.md` from `templates/project-overview.md`, then stops.

It does not answer how. Stack, structure, conventions, tooling, and the build order all belong to `/architect`, and every one of those documents reads this file as its input.

## Where this sits

| Skill | Owns | Answers |
| --- | --- | --- |
| `/scope` | `project-overview.md` | What the product is |
| `/architect` | `architecture.md`, `tooling.md`, `code-standards.md`, `library-docs.md`, `build-plan.md`, `progress-tracker.md`, `ui-registry.md` | How it gets built |
| `/develop` | the code | Builds it |

The split follows one rule. **`/scope` owns the what and stays tool agnostic. `/architect` owns the how and makes every tool call.**

## Artifact ownership

`.konteksto/project-overview.md`, created and updated by this skill only.

Writes nothing else. Not `architecture.md`, not `build-plan.md`, not code, not config. If the conversation surfaces something that belongs in another document, note it in your closing report for `/architect` to pick up, and leave the file alone.

## Guardrails

**Never name a tool.** No framework, library, database, ORM, host, provider, or package appears in this file or in any question you ask. That is `/architect`'s job, and a scope that names tools rots the moment one is swapped.

Say "stores the user's saved items", not "stores them in Postgres". Say "sends a confirmation to the user", not "sends it with Resend".

If the user names a tool themselves, that is fine and worth remembering. Record it in your closing report as a constraint for `/architect`, not in this file.

**Never guess.** Every value in the file is stated by the user, read from an existing codebase, or picked by the user from options you presented.

**Never write code, scaffold a project, or install anything.**

## Asks vs acts

Sort every question before you ask it.

- **INFER**: anything the idea or the existing codebase already shows. The product category, the obvious pages, the platform. Derive it, then confirm it in one line. Do not ask.
- **ASK**: only what the user alone knows. The real problem, the audience, the business rules, what is deliberately out of scope, what "done" means for this pass.
- **RECOMMEND**: anything your judgment settles. A sensible page set, a navigation shape, a first pass at what should be out of scope. Make the call, give a one line why, let them override.

Never present a neutral menu with no recommendation, and never bundle the whole product into one accept or change question.

## Decision panels

Every user facing choice is an options panel: 2 to 4 concrete options real to this product, exactly one marked as recommended with a one line why. Use `AskUserQuestion` where available, otherwise ask the same options as plain text. The picker adds its own free text option, so only add one yourself in the plain text fallback.

Ask in small rounds, up to 4 related questions per round. Do not fire one question at a time when four related ones could be answered together, and do not dump twenty at once.

## Execution

### Step 1: Survey the project root

List the project root. Look for source folders, a package manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or similar), config files, and a git history.

- **No codebase found.** Fresh project. Nothing about the product can be inferred yet, so the idea has to come from the user.
- **Codebase found.** Read its routes, entry points, and user facing strings. Draft the pages, the navigation, and the flows from what is actually there, then ask the user to correct you. Never ask someone to describe an app they already built.

Also check `.konteksto/`. If `project-overview.md` already exists, do not overwrite it silently: show what it says and ask whether to update it in place or start over. If the other documents exist too, say so, and note that changing the overview may make them stale.

Carry what you learn here into your closing report, so `/architect` does not survey the same ground again.

### Step 2: Get the idea

If no idea was given and no argument was passed, stop and ask before anything else:

"What are you building? Describe the product in one or two sentences: what it does, and who it is for."

Wait for the answer.

### Step 3: Work through the template, section by section

Read `templates/project-overview.md` in full before writing anything. Then fill it in this order, because each section narrows the next:

1. **About the Project** and **The Problem it Solves.** What it is, and what existing options fail at. Get this in plain language a stranger could act on. If the answer is vague, push once: a scope built on a fuzzy problem produces a fuzzy build plan.
2. **Target Audience.** Who this is for. Shapes which edge cases matter later.
3. **Pages.** One line per route, in the template's exact shape. Recommend a page set from the idea, then let the user cut or add.
4. **Navigation.** The top level shape, so no page invents its own later.
5. **Core User Flow.** One subsection per page, ordered steps in plain language. This is the contract `/architect`'s build plan checks itself against, so it must describe real user actions, not screens.
6. **Features in Scope** and **Features out of Scope.** The fixed list this pass commits to, and the explicit non goals. Be generous with the out of scope list. Every item written there is a feature a later session will not quietly build.

Replace every bracketed placeholder with real content. A finished file contains no literal `<TOKEN>` text. Check this before you present it.

Follow the template's repeat instructions. One line per route, one flow subsection per page, one bullet per feature. Produce as many as the product needs, not one example.

### Step 4: Present and get approval

Show the finished file. Call out plainly:

- Anything you recommended rather than were told, so the user can push back on your judgment and not only on your transcription.
- Anything that came up and was deliberately left out.

Get approval before you finish. If the user changes something, edit the file in place.

### Step 5: Hand off

Report:

- That `.konteksto/project-overview.md` is written and approved.
- What the root survey found: whether a codebase exists, and what it showed.
- Any tool, provider, or constraint the user named during the conversation. This is the only place those belong.
- Any question that came up which is a how question, not a what question, so `/architect` starts with it.
- That you wrote nothing else.

Then name the next step: run `/architect` to design the stack and the build.
