# Architect: skill and MCP discovery, asked for before it runs

Read this only when the stack walk settles one or more **new** tools that are not already installed, and not already recorded as declined in `tooling.md`. Skip it entirely when no new tool was chosen, for example a project reusing the stack that is already in the codebase.

## Step 1: Ask first, this is a consent gate

<!-- TOOL-CONSENT:START -->
**Asking is mandatory. Searching is not.** Nothing is searched, fetched, installed, or spawned for skill and MCP discovery until the user has picked. Offer four choices: find them for me, I will name the ones I want, no and record the decline, or not now. Only the first may run a search. Never silently skip the offer, and never run a search before the user agrees to one.
<!-- TOOL-CONSENT:END -->

Explain the value in a sentence or two, in your own words, then ask. Something close to:

> A skill teaches the agent a tool's real conventions, so the build follows them instead of guessing at them. An MCP server gives the agent live access to the real system, your database or your dashboard, rather than assumptions about it. Both are optional, and both usually make the build better.

Then present a panel with exactly one option marked as recommended.

- **question**: "Want me to find skills and MCP servers for this stack?"
- **header**: "Agent tooling"
- **options**:
  1. `Yes, find them for me` (recommended): "I search for the tools we just chose, then show you what I find. Nothing is set up without your pick."
  2. `I will name the ones I want`: "Tell me which, and I add exactly those. No searching."
  3. `No, skip it`: "Build without them. I record the decline so nothing offers them again."
  4. `Not now, later`: "I note them in `tooling.md` so you can add them when you want."

**Act on the pick:**

- **Yes, find them for me** goes to step 2, then step 3.
- **I will name the ones I want**: run no search. Ask which, take the list as given, confirm each one exists, then set up per step 4 and record per step 5.
- **No, skip it**: run nothing. Record the decline per step 5, so a later session does not offer the same tools again.
- **Not now, later**: run nothing. Note the tools in `tooling.md` under Considered and Rejected, with "deferred" as the reason.

Only the first option may run a search. Until it is picked, do not spawn the discovery subagent and do not fetch anything.

## Step 2: Discover, only after consent

**Inventory first, then discover in one batch.** Build the search set from **every** tool in the Stack table, not just the first one: runtime, framework, routing, styling or UI kit, database, query layer, auth, payments, email, storage, search, queue, and hosting. Include package names and aliases.

**One good hit does not end the search.** A skill found for the framework does not mean you stop before searching the database.

**Run it in the background and keep interviewing.** Consent is given, so hand the whole set to a read only subagent and do not wait on it. Set its model explicitly to a fast, cheap tier rather than inheriting the session model. While it runs, carry on with the rest of the design conversation, and collect its result just before the offer panel. This keeps the fetched pages out of the main context and overlaps the search with work you were doing anyway.

The offer panel always happens on the main thread, since a subagent cannot ask the user anything.

**Search two registries, because they are not the same thing:**

*Skills*, which are reusable procedural knowledge for the agent:

- `skills.sh`, a public directory. Entries install with `npx skills add <owner>/<repo>`.
- The repository behind any entry you shortlist. Open it and confirm it exists and is maintained.

*MCP servers*, which give the agent live access to a running system:

- The official Model Context Protocol servers repository and registry.
- The first party documentation of the vendor whose system the server talks to. A database or hosting platform publishing its own server is the strongest signal there is.
- A marketplace the user already trusts, when they name one.

**Never hardcode which tools have skills or servers.** Detect it fresh every time.

**Skip what is already known.** Do not offer anything already installed, or anything `tooling.md` records as declined. That is the no nag rule, and breaking it trains the user to stop reading these panels. An MCP server that is already connected simply appears as available tools, so use it and do not offer it again.

## Step 3: Judge each candidate, then offer

Before proposing anything, check it. Say which checks it passed.

1. It serves a layer that is actually in the Stack table, or a flow named in `project-overview.md`. **Nothing is added because it is popular.**
2. It is first party, or its repository is public, readable, and recently maintained.
3. **You fetched its real page.** Never propose a tool from memory, and never invent an install command. If you cannot fetch it, say so and drop it.
4. Its access scope is proportionate. Prefer a read only server over a write capable one unless the project genuinely needs writes.

Then present **two separate panels**, skills and MCP servers, each grouped by the layer it serves. Do not pick a single winner. Say plainly which ones you would leave out and why.

Get an explicit yes for each tool by name. **A general "sounds good" is not approval for the whole list.**

**Found nothing that passes?** Say so plainly and move on. Never invent a candidate to fill a panel.

## Step 4: Act on the pick

The two kinds are not set up the same way, and the difference matters:

- **Skills**: you can install them. Run `npx skills add <owner>/<repo>` for each approved one, one at a time, reporting the result before starting the next.
- **MCP servers**: **you cannot connect these.** Connecting one changes the user's own agent configuration, for example `claude mcp add ...`. Give them the exact command from the server's own documentation and let them run it. Once connected, its tools simply become available.

## Step 5: Record

- **Skills installed** go in `tooling.md` under Skills, with the source and what they are for.
- **Servers the user connected** go under MCP Servers, with their configuration and their access scope. Secrets are environment variable names, never values.
- **Anything declined or skipped** goes in the Considered and Rejected table with the reason, so a later session does not raise it again.

## Step 6: When nothing can be searched or installed

No search capability, or the user picked "not now": record the tools in Considered and Rejected as deferred, naming what a skill or a server would have given them. That way the option is preserved rather than forgotten.
