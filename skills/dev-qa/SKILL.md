---
name: dev-qa
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
argument-hint: [AUD-ID]
description: "Run /dev-qa to check resolved audit findings for runtime regressions. Without an argument it checks every eligible bug in the audit register; with an audit ID it checks only that finding."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The regression gate. It reads `.konteksto/audit-register.md` and reruns the documented reproduction or acceptance case for audit findings that have a runtime behavior to test.

A bare `/dev-qa` checks every bug or regression in state `ready for QA` or `verified`. `/dev-qa AUD-012` checks only that issue. Reject an unknown ID, a non bug or regression issue, or an issue without a reproducible case rather than guessing what to test.

**A rejected issue is not a stuck one, and saying so matters.** A finding with no runtime case belongs in `resolved`, which `/dev-audit` sets and this skill never touches. So when an ID is rejected for its type, say that its state is `/dev-audit`'s to settle and route it there, rather than reporting the run as blocked. A rejection here used to read as a dead end, and a harness demo stalled on exactly that reading.

If the audit register does not exist, report that there are no registered bugs to check. That is a successful no work result, not a reason to block a new project.

## Ownership

This skill appends QA Runs rows in `.konteksto/audit-register.md`. It may update only the selected issue's Status after its own run: `ready for QA` to `verified` on PASS, or `ready for QA` or `verified` to `reopened` on FAIL. It never changes any other issue field, fixes code, changes review findings, or writes test files. `/dev-test` owns regression tests; if a repeatable automated test is missing, report the gap and route it there.

## Check a finding

1. Read the audit issue, its linked review report, the decision log, and the task's flow or test evidence. For a `ready for QA` issue, confirm that Review basis matches the current revision or reviewed scope fingerprint. If it is stale, do not run QA or change Status; route it to `/dev-audit <linked task>` for a fresh review.
2. Reproduce the original failing case or run the documented regression test against the real application. Do not substitute a type check or code reading for observed behavior.
3. Append one QA Runs row with `PASS`, `FAIL`, or `BLOCKED`, timestamped from the system clock. Include the decisive evidence.
4. On PASS, update the selected issue to `verified`.
5. On FAIL, update the selected issue to `reopened`, report the audit ID, and route to `/dev-debug <AUD-ID>`. Do not fix it here.
6. On BLOCKED, report the missing prerequisite and leave the issue unchanged for `/dev-audit`; a blocked run is not a pass.

Nits and purely static review findings are not QA cases. They remain in the audit register for their implementation route.

## Report

List each selected audit ID, result, and evidence. Lead with failures. A no argument run with no eligible bug findings is a successful no work result.
