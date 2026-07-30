# Tooling

*Purpose: the agent tooling this project runs with, meaning MCP servers and skills, plus where each came from and why it was chosen. Kept separate from `library-docs.md` because these are tools the agent uses while working, not packages the product ships. Optional sections stay only when the project actually uses that kind of tool.*

Every entry here was found during discovery, checked against the stack in `architecture.md`, and approved by a human before install. Anything found and rejected is recorded at the bottom, so a later session does not re propose it.

---

## MCP Servers

*Purpose: servers that give the agent live access to a system this project depends on (a database, a hosting platform, a design tool, an issue tracker). Repeat this whole section once per server. Optional: omit the whole heading when the project uses none.*

### <SERVER_NAME>

**Source**: <OFFICIAL_DOCS_OR_REPO_URL>
**First party**: <YES_IF_MAINTAINED_BY_THE_VENDOR_OF_THE_SYSTEM_IT_TALKS_TO>
**Used for**: <WHICH_STACK_LAYER_OR_TASK_IT_SERVES>
**Chosen over**: <ALTERNATIVE_CONSIDERED> because <REASON>

**Install**:

```bash
<EXACT_INSTALL_COMMAND>
```

**Configuration**:

| Setting | Value | Notes |
| --- | --- | --- |
| <SETTING_NAME> | <VALUE_OR_ENV_VAR_NAME> | <NOTE> |

Secrets stay in environment variables and are listed in `code-standards.md` under Environment Variables. Never write a real key into this file.

**Scope**: <WHAT_IT_IS_ALLOWED_TO_REACH_AND_WHETHER_IT_CAN_WRITE>

---

## Skills

*Purpose: installed agent skills that encode procedural knowledge for this stack. Repeat this whole section once per skill. Optional: omit the whole heading when the project uses none.*

### <SKILL_NAME>

**Source**: <REGISTRY_OR_REPO> (`<OWNER_REPO>`)
**Used for**: <WHICH_TASK_ON_THIS_PROJECT_IT_SERVES>
**Trigger**: <WHEN_IT_SHOULD_RUN>

**Install**:

```bash
npx skills add <OWNER_REPO>
```

---

## Local Data Lifecycle

*Purpose: what happens to the local database between tasks, so a build never guesses whether it may reset the data it is working against. Optional: only present once the project has a local data store.*

**Between tasks:** <RESET_EVERY_TASK | PERSIST_WITH_SEED_DATA | PERSIST_UNTOUCHED>

**Reset command:** `<THE_EXACT_COMMAND_THAT_RESETS_LOCAL_DATA>`

**Seed data:** <WHERE_THE_SEED_LIVES_AND_WHAT_IT_CONTAINS | NONE>

Whoever builds a task follows this and nothing else. A build never drops a local database on its own initiative, because someone else's work in progress may be sitting in it.

---

## Considered and Rejected

*Purpose: tools that came up during discovery and were deliberately not installed, with the reason. Stops a later session from re proposing the same thing.*

| Tool | Kind | Source | Why rejected |
| --- | --- | --- | --- |
| <TOOL_NAME> | MCP server / skill | <SOURCE> | <REASON> |

---

## Review Triggers

*Purpose: the conditions under which this list should be revisited, so tooling does not silently rot as the stack changes.*

- A new layer is added to the Stack table in `architecture.md`.
- <OTHER_REVIEW_TRIGGER>
