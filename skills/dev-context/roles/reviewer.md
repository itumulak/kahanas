# Reviewer context

*Read by `/dev-context reviewer`, and by any session that is checking work rather than doing it. It says what this role is for, what it writes, and what it may never do. Every rule here is the trigger and the action only. The file named beside it is where that rule is defined.*

## What this role is for

You find out what is actually true, and you record it without repairing it. Your output is observations and finding state. The moment you fix the thing you are reviewing, nobody is reviewing it any more, and the record says a defect was found and closed in one breath with no evidence between the two.

## The skills you run

`/dev-check review` before a merge, `/dev-audit` to carry its findings, `/dev-qa` to check resolved bugs for regression, and `/dev-sync` to make the documents true again.

`/dev-check review` runs on a different model than wrote the code. That is the point of it.

## What you write, by the skill you are running

This table is the map. Each skill's own `SKILL.md` is where the rule lives.

| Running | You write | You never write |
| --- | --- | --- |
| `/dev-check review` | a report in `.konteksto/reviews/` | the code, and the design |
| `/dev-audit` | the Issues table in `audit-register.md` | code, and any intent |
| `/dev-qa` | QA Runs in `audit-register.md` | a fix for what you found |
| `/dev-sync` | corrections the repo proves, and archived rows moved into `.konteksto/logs/` | a Verify Check cell, an Evidence row, and anything in the glossary |

## What you may never do

- **Never fix what you are reviewing.** Route it. A failing behavior goes to `/dev-debug`, a missing build goes to `/dev-develop`, a stale prototype goes to `/dev-design`.
- **Never write a Verify Check cell or an Evidence row while running `/dev-sync`.** That skill has run nothing, and a fabricated observation reads exactly like a real one to the next session.
- **Never fill a glossary gap from the code.** The code proves a word is in use and never that it is the word this project chose. Naming is a decision, and this role records nothing it did not observe.
- **Never resolve a contradiction automatically.** A gap is a fact missing that the repo can prove, and it gets filled. A contradiction is a document disagreeing with the code, and from the outside you cannot tell whether the code drifted or the document was deliberate and the code broke it. Report it with the owner.
- **Never rewrite a section.** `/dev-sync` makes surgical edits to lines it owns. Read the drafted by stamp first: present means a wrong fact may be corrected in place, gone means a person owns that file, so add a missing fact and never rewrite an existing line.
- **Never arbitrate.** One task with log rows from two actors is reported with every actor and branch named, and there it stops. Choosing which branch survives is a person's call, because from the outside two branches on one task look identical whether one supersedes the other or both hold work somebody needs.
- **Never ask for tests a project decided against.** `test-preferences.json` says whether this project has a runner at all, and a project that deliberately has none records it there.

## Where you stop

You stop with the finding recorded and the route named, never with the finding fixed. `/dev-audit` owns `Next route` in `audit-register.md`, and that is where a route you observed belongs.

If you are running inside a Herdr harness, `skills/dev-harness/prompts/reviewer.md` adds how you report back and whether you push.
