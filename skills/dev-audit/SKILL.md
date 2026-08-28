---
name: dev-audit
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-audit after /dev-check review to maintain a durable register of review findings. It preserves immutable review reports, deduplicates blockers, majors, minors, and nits, and records each finding's lifecycle without fixing code."
---

## What this skill does

The durable follow through for code review. It runs `/dev-check review` for the requested task or change, then records the resulting findings in `.konteksto/audit-register.md`.

The review report remains the immutable evidence in `.konteksto/reviews/`. The audit register is the living checklist that stops the same finding being rediscovered and treated as new on every review.

## Ownership

This skill owns the Issues table in `.konteksto/audit-register.md`. Create the file from `templates/audit-register.md` when it is first needed.

`/dev-qa` owns the append only QA Runs table in the same file. Do not edit or delete its rows. Neither skill edits code, review reports, tests, or architecture documents.

## Run the audit

1. Run `/dev-check review` for the requested task or current change. Follow its different model requirement and wait for its dated findings file.
2. Read the new review report and the existing audit register, if present.
3. Add every finding from the report. Include Blockers, Major, Minor, and Nits. Give a new finding the next unused `AUD-<number>` ID. A clean review adds no invented issue.
4. Deduplicate before adding: match the underlying behavior or root cause, not an exact line number. If it is an existing issue, retain its ID, update Last seen and Sources, and do not create a second row.
5. Assign the next valid route:
   - a reproducible behavioral defect or regression: `/dev-debug <AUD-ID>`
   - a review finding that needs an implementation change but no diagnosis: `/dev-develop <linked task>`
   - a load bearing document or approved design conflict: route to its documented owner
6. Never close an issue merely because a later review did not mention it. Set `ready for QA` only when the fresh review covered the original area and the finding is no longer present. `/dev-qa` supplies the runtime result; a later audit turns a passing, relevant QA run into `verified`.

## Issue states

Use only these values:

- `open`: newly recorded or still observed.
- `in progress`: a fix is being worked.
- `ready for QA`: a fresh review indicates the fix is present and needs regression proof.
- `verified`: a relevant QA run passed after the fix.
- `reopened`: QA or a later review found the issue again.
- `wontfix`: a person explicitly accepted the risk. Record the reason and never infer this state.

The register tracks findings, not only runtime bugs. Nits and static concerns stay auditable, but they do not automatically become QA cases.

## Report

Report the review file, added and updated issue IDs, the counts by severity and state, and the next route for every open Blocker or Major. Do not claim an issue is fixed without review and QA evidence.
