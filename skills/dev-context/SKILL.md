---
name: dev-context
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [task]
description: "Run /dev-context to establish project context before development, verification, or a handoff. Reads the project records in their required order, identifies the active task and governing decisions, then follows their ownership and workflow rules."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The context entry point for a fresh agent or a task that needs a complete project view. It reads the project records in a fixed order, so the plan, current state, and documented decisions are interpreted against the architecture and standards that govern them. It prepares a session; it does not replace the narrower records each delivery skill must read for its own work.

This skill is read only. It does not repair stale documents or change code. Report contradictions with the document and owner that must resolve them.

## Read in this order

Read each existing item completely before moving to the next:

1. `.konteksto/architecture.md`
2. `.konteksto/tooling.md`
3. `.konteksto/code-standards.md`
4. `.konteksto/library-docs.md`
5. `.konteksto/build-plan.md`
6. `.konteksto/progress-tracker.md`
7. `.konteksto/decision-log.md`
8. `.konteksto/audit-register.md`, when it exists
9. `.konteksto/ui-registry.md`
10. The approved design, as identified by `build-plan.md` or the design registry.

If a required record is absent, do not invent it. State which record is missing and use the owning workflow to resolve it. If no approved design applies to the active task, say so and route UI work to `/dev-design`.

## Establish the active context

After reading, identify:

- the project shape, runtime, and verification commands
- the active or next task, its dependencies, and its progress and verification state
- the decisions and terminology that constrain that task
- open audit findings and any QA regressions that affect that task
- the approved design surface, when the task has UI work
- document ownership and the next valid workflow step

Read `.konteksto/loop-state.md` after the required records when it exists. It is supplemental execution state, not a replacement for the progress tracker.

## Apply the protocols

Follow the ownership, approval, and routing rules recorded in the documents. In particular:

- Build only the active task and do not make load bearing decisions without the documented owner.
- Treat a `DONE` status as a build claim, not acceptance proof. A `PASSED` Verify Check is the observed runtime signal.
- Do not edit records owned by another workflow merely to remove a contradiction.
- Preserve the approved design boundary for UI work.

Finish with a concise context brief: active task, current phase, governing constraints, applicable design, blockers, and next valid skill. Do not claim verification or approval that the records do not support.
