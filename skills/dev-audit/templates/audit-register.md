# Audit Register

*Purpose: the living checklist of findings from independent code reviews. Review reports are immutable evidence; this register preserves each finding's identity and current lifecycle across repeated reviews.*

## Issues

| ID | Severity | Type | Status | Task | First seen | Last seen | Location | Summary | Sources | Review basis | Next route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-001 | <Blocker\|Major\|Minor\|Nit> | <bug\|regression\|security\|test\|performance\|maintainability\|style> | <open\|ready for QA\|verified\|reopened\|wontfix> | <task or —> | <YYYY-MM-DD> | <YYYY-MM-DD> | <path:line> | <one line finding> | <review file paths> | <Git revision, or reviewed path checksums> | <exact next skill or none> |

`/dev-audit` owns this table and its Next route is the canonical current route for each issue. `/dev-qa` may update only Status from `ready for QA` to `verified`, or from `ready for QA` or `verified` to `reopened`, after appending its own QA Run. It updates existing rows rather than creating duplicates. Do not delete an issue. A closed issue remains as history with its final status and evidence.

## QA Runs

| Timestamp | Audit ID | Result | Evidence | Runner |
| --- | --- | --- | --- | --- |
| <YYYY-MM-DD HH:MM> | AUD-001 | <PASS\|FAIL\|BLOCKED> | <what was exercised and what happened> | /dev-qa |

`/dev-qa` owns this append only table. A PASS is regression evidence, not permission to remove an issue. A FAIL routes to `/dev-debug <AUD-ID>`.
