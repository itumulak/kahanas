---
name: dev-qa
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
description: "Run /dev-qa to check resolved audit findings for runtime regressions. Without an argument it checks every eligible bug in the audit register; with an audit ID it checks only that finding."
---

## What this skill does

The regression gate. It reads `.konteksto/audit-register.md` and reruns the documented reproduction or acceptance case for audit findings that have a runtime behavior to test.

A bare `/dev-qa` checks every bug in state `ready for QA` or `verified`. `/dev-qa AUD-012` checks only that issue. Reject an unknown ID, a non bug issue, or an issue without a reproducible case rather than guessing what to test.

If the audit register does not exist, report that there are no registered bugs to check. That is a successful no work result, not a reason to block a new project.

## Ownership

This skill appends QA Runs rows only in `.konteksto/audit-register.md`. It never edits the Issues table, fixes code, changes review findings, or writes test files. `/dev-test` owns regression tests; if a repeatable automated test is missing, report the gap and route it there.

## Check a finding

1. Read the audit issue, its linked review report, the decision log, and the task's flow or test evidence.
2. Reproduce the original failing case or run the documented regression test against the real application. Do not substitute a type check or code reading for observed behavior.
3. Append one QA Runs row with `PASS`, `FAIL`, or `BLOCKED`, timestamped from the system clock. Include the decisive evidence.
4. On PASS, append an Evidence row to `decision-log.md` identifying the audit ID and the observed result.
5. On FAIL, report the audit ID and route to `/dev-debug <AUD-ID>`. Do not fix it here.
6. On BLOCKED, report the missing prerequisite and leave the issue for `/dev-audit`; a blocked run is not a pass.

Nits and purely static review findings are not QA cases. They remain in the audit register for their implementation route.

## Report

List each selected audit ID, result, and evidence. Lead with failures. A no argument run with no eligible bug findings is a successful no work result.
