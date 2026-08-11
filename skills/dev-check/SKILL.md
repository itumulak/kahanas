---
name: dev-check
allowed-tools: Bash, Read, Grep, Glob, Write, Agent, AskUserQuestion
argument-hint: [verify | review]
description: "Run /dev-check to confirm a task is sound before moving on. Two modes: verify runs the real app and proves the behavior against the flows in project-overview.md, and on a UI task checks it against the approved design at all three breakpoints; review runs a senior code read on a different model than wrote the code. Verify after /dev-develop, review before a merge. Never edits your code, and never edits a design."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The gate between a task being built and a task being trusted. It confirms soundness in two different ways, run as two modes. They are separate jobs, and both are usually worth running, verify first.

- **`verify`**, runtime proof. Runs the real app and watches the change behave. Proves the task actually works and matches the flow it was built from. This is what a green type check never tells you, because compiling proves the code is well formed, not that the feature exists.
- **`review`**, a fresh read of the code. A senior pass over the diff, run on **a different model than wrote the code**, because a model reading its own output shares its own blind spots. Findings come back ranked by severity.

**Neither mode edits code.** Verify points failures at `/dev-develop`. Review reports findings for someone else to fix. A checker that also fixes stops being a checker.

## Where this sits

**Before this:** `/dev-develop`, for verify. Any finished change, for review.

**After this:** `/dev-test` once verify passes, `/dev-debug` when it fails, and `/dev-document pr` plus `/dev-sync` before a merge.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.


## Artifact ownership

**Verify** owns no whole file. Chat output only, plus screenshots and logs in a scratch area, and two narrow writes. It stamps the task's **Verify Check** cell in `progress-tracker.md`, `PASSED` or `FAILED`, and it appends a row to `note-registry.md` on a pass, which is how a later session tells an exercised task from an assumed one. That one column is all of `progress-tracker.md` it may touch: Status belongs to `/dev-develop`, and checkpoint rows and assignees to neither of them.

**Review** owns `.konteksto/reviews/<date>-<task-slug>.md`, one file per run. Dated records, never edited afterwards. A later run writes a new file.

Neither writes application code, any of the design documents, or a fix of any kind. `glossary.md` is included in that: read it, hold the code and the flows against its words, and **report a name that disagrees with it rather than correcting either side**. A drifted name is a contradiction, and which of the two is wrong is not visible from here.

## Guardrails

**Never fix what you find.** Not even an obvious one line fix. Report it and stop. This skill is worth having because it is independent of the thing that built the code, and a checker that reaches for the keyboard throws that away.

**Never mark a task done.** That is `/dev-develop`'s line, and only after this passes.

**Never claim a pass you did not observe.** "The code looks correct" is not a pass. A pass means you ran something and watched the result. The evidence gate in `modes/verify.md` makes this literal, and it is the rule that matters most in this whole skill.

**Never review on the model that wrote the code.** If no different model is available, say so plainly and let the user decide. A same model review is worth much less, and reporting it as a real review would mislead.

## Pick the mode

Route before touching the repo. Look at what followed `/dev-check`:

- Starts with **`verify`** or **`run`**, read `modes/verify.md` and follow it fully.
- Starts with **`review`**, read `modes/review.md` and follow it fully.
- **Anything else**, including a bare `/dev-check` or a task name with no mode, do not guess and do not default. Ask, and wait:

> Which check do you want?
> **verify**, run the real app and prove the task works against its flow, usually right after `/dev-develop`.
> **review**, a fresh model read of the diff with ranked findings, usually before a merge.
> **both**, verify first, then review.

Use `AskUserQuestion` where available, otherwise ask as plain text with the same three options.

A task name passed with no mode is carried through as the target once the mode is picked. Still ask the mode.

**Read only the mode file you routed to.** Not both.

**Never run both at once.** On **both**, verify first, and only offer review once verify passes. Reviewing code that does not run is wasted effort.

## Reference files

All four live in this skill's folder.

- `modes/verify.md`: the runtime proof mode. Scoping, launching, the evidence ledger, the evidence gate, and the conformance verdict.
- `modes/review.md`: the fresh model review mode. Author model detection, the contrast mapping, scoping, and the spawn.
- `review-agent-prompt.md`: the template the main thread fills and hands to the review subagent. Read in review step 4.
- `review-guide.md`: the reviewer's rubric, severity scale, test adequacy rules, and both output formats. **The main thread never reads this.** It passes the path to the subagent, which is the entire point: the detail stays out of the main context.
