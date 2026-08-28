---
name: dev-audit
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
argument-hint: [task | review file]
description: "Run /dev-audit after /dev-check review to maintain a durable register of review findings. It preserves immutable review reports, deduplicates blockers, majors, minors, and nits, and records each finding's lifecycle without fixing code."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The durable follow through for code review. It ingests the current `/dev-check review` report for the requested task or change, then records the resulting findings in `.konteksto/audit-register.md`.

The review report remains the immutable evidence in `.konteksto/reviews/`. The audit register is the living checklist that stops the same finding being rediscovered and treated as new on every review.

## Ownership

This skill owns the Issues table in `.konteksto/audit-register.md`. Create the file from `templates/audit-register.md` when it is first needed. `/dev-qa` may change an issue Status only from `ready for QA` to `verified`, or from `ready for QA` or `verified` to `reopened`, as the result of its own run.

`/dev-qa` owns the append only QA Runs table in the same file. Do not edit or delete its rows. Neither skill edits code, review reports, tests, or architecture documents.

## Run the audit

1. Find the newest review report whose scope matches the requested change and whose diff has not changed since the review. If one exists, ingest it. Otherwise run `/dev-check review`, follow its different model requirement, and ingest its dated findings file.
2. Read the selected review report and the existing audit register, if present. Confirm from the report header that reviewer and author models differ. If it does not prove that, report the review as degraded; do not call an empty report independent or clean.
3. Add every finding from the report. Include Blockers, Major, Minor, and Nits. Give a new finding the next unused `AUD-<number>` ID. A clean review adds no invented issue.
4. Deduplicate before adding: match the underlying behavior or root cause, not an exact line number. If it is an existing issue, retain its ID, update Last seen and Sources, and do not create a second row. Mark its Type `regression` when the same resolved root cause has returned.
5. Set the table's Next route, the single per issue route record, from these rules:
   - a reproducible behavioral defect or regression: `/dev-debug <AUD-ID>`
   - a review finding that needs an implementation change but no diagnosis: `/dev-develop <linked task>`
   - a load bearing document or approved design conflict: route to its documented owner
6. Never close an issue merely because a later review did not mention it. Set `ready for QA` only when the fresh review covered the original area and the finding is no longer present. Record the current Git revision in Review basis when available, otherwise record the reviewed paths and their content checksums. `/dev-qa` supplies the runtime result and transitions that state to `verified` or `reopened`.

## Issue states

Use only these values:

- `open`: newly recorded or still observed.
- `ready for QA`: a fresh review indicates the fix is present and needs regression proof.
- `verified`: a relevant QA run passed after the fix.
- `reopened`: QA or a later review found the issue again.
- `wontfix`: a person explicitly accepted the risk. Record the reason and never infer this state.

The register tracks findings, not only runtime bugs. Nits and static concerns stay auditable, but they do not automatically become QA cases.

## Report

Report the review file, whether its reviewer model differed from the author model, added and updated issue IDs, the counts by severity and state, and the next route for every open Blocker or Major. Do not claim an issue is fixed without review and QA evidence.
