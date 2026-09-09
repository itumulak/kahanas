---
name: dev-context
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [role] [task]
description: "Run /dev-context to establish project context before development, verification, or a handoff. Reads the project records in their required order, including the person's recorded choices and recommendation overrides, identifies the active task and governing decisions, then follows their ownership and workflow rules. Takes an optional role, one of planner, developer, designer, coordinator, or reviewer, and folds that role's protocol into the brief so a fresh agent on any model knows what it owns and what it may never do."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The context entry point for a fresh agent or a task that needs a complete project view. It reads the project records in a fixed order, so the plan, current state, and documented decisions are interpreted against the architecture and standards that govern them. It prepares a session; it does not replace the narrower records each delivery skill must read for its own work.

This skill is read only. It does not repair stale documents or change code. Report contradictions with the document and owner that must resolve them.

## The files this skill ships

- `roles/planner.md`, `roles/developer.md`, `roles/designer.md`, `roles/coordinator.md`, `roles/reviewer.md`: the protocol for each default role. Read the one the argument named, and never the others.
- `roles/writing-a-role.md`: the shape a project's own role file needs, and where it goes. Read it only when a named role has no file, or when somebody asks how to add one.

## The argument

`/dev-context [role] [task]`. Both parts are optional.

If the first word matches a role, it is the role and the rest is the task. Otherwise the whole argument is the task and no role applies.

| Role | Runs | Also accepted |
| --- | --- | --- |
| `planner` | `/dev-scope`, `/dev-architect` | `architect`, `scope` |
| `developer` | `/dev-develop`, `/dev-check verify`, `/dev-test`, `/dev-debug`, `/dev-loop` | `dev`, `builder`, `engineer` |
| `designer` | `/dev-design` | `design` |
| `coordinator` | `/dev-harness`, `/dev-document pr` | `manager`, `lead` |
| `reviewer` | `/dev-check review`, `/dev-audit`, `/dev-qa`, `/dev-sync` | `qa`, `auditor` |

## Read the role context

**Trigger:** the argument named a role.

**Action:** resolve it in this order and stop at the first file that exists.

1. `.konteksto/roles/<role>.md`, this project's own file
2. `roles/<role>.md`, the default this skill ships

Read that file completely, before the records, and apply it for the rest of the session. It says what the role runs, what it writes, and what it may never do. It is the answer to a fresh agent arriving on a different model or a different tool and building on habit rather than on this project's rules.

**No file for that role?** Say so in one line, name `roles/writing-a-role.md` as the shape it needs and `.konteksto/roles/<role>.md` as where it goes, and brief without one. This skill is read only, so it never writes that file. A person does, and commits it, because a role a model invents each session is not a role.

**No role in the argument?** Brief without one. Then, in one line, name the roles in the table above and say the argument exists, because the session that most needs a role context is the one that did not know to ask for it.

**A role is the skill in your hand, not the window you are sitting in.** A session dispatched a command that belongs to another role reads that role's file and follows it while the command runs. Each file says so at the point it matters.

## Read in this order

Read each existing item completely before moving to the next:

1. `.konteksto/project-overview.md`
2. `.konteksto/glossary.md`
3. `.konteksto/human-decisions.md`
4. `.konteksto/architecture.md`
5. `.konteksto/tooling.md`
6. `.konteksto/code-standards.md`
7. `.konteksto/library-docs.md`
8. `.konteksto/build-plan.md`
9. `.konteksto/progress-tracker.md`
10. `.konteksto/decision-log.md`
11. `.konteksto/audit-register.md`, when it exists, because unresolved findings constrain the active task before its component inventory is read
12. `.konteksto/ui-registry.md`
13. The approved design, as identified by `build-plan.md` or the design registry.

If a required record is absent, do not invent it. State which record is missing and use the owning workflow to resolve it. If no approved design applies to the active task, say so and route UI work to `/dev-design`.

## Establish the active context

After reading, identify:

- the project shape, runtime, and verification commands
- the active or next task, its Goal and subtask goals, its dependencies, and its progress and verification state
- the decisions and terminology that constrain that task
- the human choices that departed from the recommendation presented, especially any that govern the active task
- open audit findings and any QA regressions that affect that task
- the approved design surface, when the task has UI work
- document ownership and the next valid workflow step

Read `.konteksto/loop-state.md` after the required records when it exists. It is supplemental execution state, not a replacement for the progress tracker. When it describes an active run, its Next action is the current workflow instruction; report it verbatim rather than deriving a competing next step.

## Orient from the code graph, when the project has one

**Trigger:** the Code Graph section of `tooling.md`, read at step 5 above, has Status `WIRED`.

**Action:** run its Repo orientation command, and its Locate command against the active task's Goal. Fold what comes back into the brief as pointers: the files that task most likely touches, and the areas they sit in. Run nothing else, and never the build or enrichment commands, which cost time or money and belong to `/dev-architect`.

**Pointer:** that section defines what a graph answer is worth. The short of it is that a pointer is a lead and never evidence, so the brief presents these as places to look and never as facts about the project.

Any other Status, no graph tool on the machine, or a command that fails: say so in one line and brief from the documents alone, which is the whole job anyway.

**No Code Graph section at all?** Nobody has been asked yet. Say so once, name `/dev-architect`, and carry on. Do not query a graph no document records: the section holds the commands, so querying without it is guessing at them. This is the same shape as any other missing record: report it with the owner, and change nothing.

## Apply the protocols

Follow the ownership, approval, and routing rules recorded in the documents. In particular:

- Build only the active task and do not make load bearing decisions without the documented owner.
- Confirm the aggregate task row reproduces the task number, title, and Goal from `build-plan.md`, and that every UI and Logic subtask has its own child row in plan order with its goal copied word for word. Report any missing, extra, combined, reordered, or reworded row as stale planning owned by `/dev-architect`.
- Treat a `DONE` status as a build claim, not acceptance proof. A `PASSED` Verify Check is the observed runtime signal.
- Do not edit records owned by another workflow merely to remove a contradiction.
- Preserve the approved design boundary for UI work.

Finish with a concise context brief: active aggregate task, first unfinished subtask, all task and subtask goals, current phase, governing constraints, applicable design, blockers, and next valid skill. Do not claim verification or approval that the records do not support.

When a role context was read, open the brief with that role's name and the file it came from, and close it with the next valid step **for that role**, which is not always the project's next step. A reviewer's next step on a task that needs building is to say so and stop, not to build it.
