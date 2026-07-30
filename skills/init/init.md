---
name: init
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /init when initializing a project. Checks the root folder for an existing codebase, runs structured discovery that weighs options, fills the four foundation docs (project overview, architecture, code standards, library docs), then fills the three planning docs (build plan, progress tracker, ui registry)."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## Guardrails

Do NOT invoke any implementation skill, write any application code, scaffold any project, install any dependency, or take any other implementation action while this skill is running. This skill produces documents only. It ends when the seven documents are written and approved, and implementation starts in a separate, later request.

Do NOT fill a document with a guess. Every value written into a document is either read from the existing codebase, stated by the user, or chosen from options you presented and the user approved.

Both rules apply to EVERY project regardless of how simple it looks.

## What this skill does

Creates a project's living documentation in `.konteksto/` at the project root, using the templates bundled with this skill.

**Templates live in this skill's own `templates/` folder**, next to this file. Read a template from there, then write the filled copy to `.konteksto/<same-file-name>`. Never edit a template in place, and never treat a template as the project's document.

The work runs in two stages, in this order, because each later document depends on the earlier ones.

**Stage 1, the foundation docs.** These four describe what the project is and how it is built.

| Order | Template | Written to | Depends on |
| --- | --- | --- | --- |
| 1 | `project-overview.md` | `.konteksto/project-overview.md` | nothing |
| 2 | `architecture.md` | `.konteksto/architecture.md` | the pages and flows named in project overview |
| 3 | `code-standards.md` | `.konteksto/code-standards.md` | the Stack table in architecture |
| 4 | `library-docs.md` | `.konteksto/library-docs.md` | the approved dependency list in code standards |

**Stage 2, the planning docs.** These three turn the foundation into an ordered build, and may only start once all four Stage 1 documents are approved.

| Order | Template | Written to | Depends on |
| --- | --- | --- | --- |
| 5 | `build-plan.md` | `.konteksto/build-plan.md` | features in scope, plus the architecture |
| 6 | `progress-tracker.md` | `.konteksto/progress-tracker.md` | the exact phases and tasks in build plan |
| 7 | `ui-registry.md` | `.konteksto/ui-registry.md` | the component rules in code standards |

## The "this is too simple to need a design" trap

Every project goes through this process. A todo list, a one function utility, a config change, all of them. Projects that look simple are where unexamined assumptions cause the most wasted work. A document may be short, a few sentences is fine for a genuinely small project, but you MUST write it and get approval.

## Checklist

You MUST create a task for each numbered item and complete them in order.

### 1. Check the root folder for an existing codebase

List the project root and look for source folders, a package manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or similar), config files, and a git history.

- **No codebase found.** This is a fresh project. Start the survey at step 2 with no assumptions about stack or structure.
- **Codebase found.** Read it first: the directory tree, every package manifest, the lint and build config, the entry points, and the recent commits. Draft each document from what the code actually shows. Only ask the user about things the code cannot tell you, such as intent, audience, and what is deliberately out of scope.

Also check whether `.konteksto/` already exists. If it does, do not overwrite it silently: report which of the seven documents are already present and ask whether to update them in place or start over.

### 2. Ask clarifying questions, one at a time

Ask a single question, wait for the answer, then ask the next. Use `AskUserQuestion` when the answer is a choice between known options.

Cover at minimum: what the product is, the problem it solves, who it is for, what it must do in this build pass, what is explicitly out of scope, and what "done" looks like. For an existing codebase, phrase these as confirmations of what you inferred in step 1 rather than asking the user to restate what the code already says.

### 3. Weigh options for every undecided choice

For any stack, structure, or convention choice that is not already fixed by the existing codebase or by the user, present 2 or 3 real approaches with their trade offs and name your recommendation. Wait for the user to pick. Only the picked option goes into a document.

Record the choice and the reason at the point the template asks for it, for example the "Why these choices" list in `architecture.md`.

### 4. Fill the Stage 1 foundation docs

Work one file at a time, in the table order above: `project-overview.md`, `architecture.md`, `code-standards.md`, `library-docs.md`.

For each file:

1. Read the template in full before writing anything.
2. Replace every bracketed placeholder with real project content. A finished file must contain no literal `<TOKEN>` text. Check this before presenting the file.
3. Follow each template's own repeat instruction. Where a template says to repeat a section once per page, per table, per language, or per library, produce exactly that many, not one example.
4. Keep a section marked Optional only when it genuinely applies. Remove it when it does not, and say in your message which optional sections you removed and why. Never present a file with an empty section left in as a placeholder.
5. Present the finished file and get approval before starting the next one. If the user changes something that an earlier file already recorded, go back and update that earlier file too.

### 5. Fill the Stage 2 planning docs

Only start after all four Stage 1 documents are approved. Same order and same per file process as step 4: `build-plan.md`, `progress-tracker.md`, `ui-registry.md`.

Extra rules for this stage:

- `build-plan.md` covers every feature listed under Features in Scope in `project-overview.md`, and nothing that is listed as out of scope. Its Feature Count table must add up to the number of tasks actually written.
- `progress-tracker.md` mirrors `build-plan.md` exactly, one checkbox per task, in the same phase and task order. On a fresh project every box starts unchecked, Last completed reads "nothing yet", and Next names the first task.
- `ui-registry.md` is skipped when the project has no component based UI layer, which is the same condition under which `code-standards.md` has no Component Structure section. Say that you skipped it rather than writing an empty file. On a fresh project with a UI layer, the registry starts empty apart from its heading and intent line, since no component exists yet.

### 6. Close out

Report the list of files written, the list of optional sections and files skipped and why, and state plainly that no code was written. Name the next step for the user, which is a separate request to start building the first task in `build-plan.md`.
