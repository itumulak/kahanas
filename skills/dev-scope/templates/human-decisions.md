# Human Decisions

*Purpose: the append only question and answer record of durable choices made by the person directing this project. It preserves what they selected beside what was recommended, so a later reader can see every place where the two differ.*

This file records human choices from `/dev-scope`, `/dev-architect`, and `/dev-design`. It does not replace the documents those choices govern. `project-overview.md`, `architecture.md`, and `design.md` hold the current intent. This file preserves how the person chose it.

This file also does not replace `decision-log.md`. That log records decisions and evidence produced during a build. This one records answers a person gave before or during scope, architecture, and design work.

---

## How to record a choice

Append one entry immediately after the person answers a decision panel. Preserve the question and every option as they were presented. Mark exactly the chosen answer with `[x]`; every other answer stays `[ ]`. Preserve `(recommended)` on the option that carried it when asked. Never add that marker after the answer, and never move it onto the selected option.

An option description stays on the same line after a colon. When the person chooses the free text option, record it as `[x] Other: <their answer>`. A formal approval control may have no recommended option. Do not invent one.

Use the next unused ID in numeric order. Never reuse a missing number. Record local time to the minute and the skill that asked. State the effect on the project documents, not a prediction about implementation.

Use this shape:

```text
### HD001: <short subject>

**Asked:** <the question exactly as presented>

[ ] <option not selected> (recommended): <description shown>
[x] <selected option>: <description shown>
[ ] <option not selected>: <description shown>

**Recorded:** <YYYY-MM-DD HH:MM> by /dev-scope
**Effect:** <what this answer settles in the project documents>
```

When a later answer changes an earlier one, append a new entry and add `**Replaces:** HD<earlier ID>`. Never edit the earlier checkboxes to make history match the new answer.

Do not record inferred facts, an agent's own recommendation, permission prompts, or routine execution choices such as which task to run next. A person correcting an inference becomes a human decision only when they choose from a panel that settles durable project intent.

## Who writes what

| Skill | May write | Must not |
| --- | --- | --- |
| `/dev-scope` | creates the file and appends product scope, language, team, and project shape choices | record an inference as though the person selected it |
| `/dev-architect` | appends requirements, data, stack, standards, tooling, risk, and architecture acceptance choices; may create an empty copy from this template during an upgrade when scope documents already exist | rewrite a scope entry, reconstruct an old choice, or log its own recommendations as human choices |
| `/dev-design` | appends design direction, system, surface, revision, and formal approval choices | originate an approval or alter an earlier choice |
| every other skill | nothing | append, reconstruct, rewrite, or delete an entry |

The three writers append only their own answers. Nobody tidies another writer's wording. `/dev-context` reads the file and calls out choices where the selected option was not the recommended one.

---

## Decisions
