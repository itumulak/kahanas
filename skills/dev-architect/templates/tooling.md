# Tooling

*Purpose: the agent tooling this project runs with, meaning MCP servers, skills, and the code graph, plus where each came from and why it was chosen. Kept separate from `library-docs.md` because these are tools the agent uses while working, not packages the product ships. Optional sections stay only when the project actually uses that kind of tool.*

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

## Code Graph

*Purpose: the code graph this project queries to find code, if it has one, plus the one rule every skill applies to what it gets back. Written by `/dev-architect` and read by `/dev-context`, `/dev-develop`, `/dev-debug`, `/dev-check review`, and `/dev-sync`. This is the canonical definition of what a graph answer is worth, and every one of those skills carries only its own trigger, its own action, and a pointer here. Optional: on a project with no graph, keep the heading and write the decline line, so a later session does not offer it again.*

**Status:** <WIRED | DECLINED | DEFERRED>

| What | Value |
| --- | --- |
| Tool | <TOOL_NAME_AND_VERSION, FOR_EXAMPLE_GRAFT> |
| Source | <OFFICIAL_DOCS_OR_REPO_URL> |
| Install | `<EXACT_COMMAND_THE_PERSON_RAN>` |
| Wiring | `<EXACT_COMMAND_THAT_WIRED_IT_INTO_THE_AGENT, OR: none>` |
| Cache | <WHERE_THE_GRAPH_LIVES_AND_WHETHER_IT_IS_IGNORED_BY_GIT> |
| Enrichment | <STRUCTURAL_ONLY | SUMMARIES_TOO, AND_WHICH_PROVIDER_KEY_PAID_FOR_THEM> |
| Build | `<COMMAND_THAT_BUILDS_OR_REBUILDS_THE_GRAPH>` |
| Freshness check | `<COMMAND_THAT_REPORTS_DRIFT_FROM_THE_WORKING_TREE>` |
| Locate | `<COMMAND_THAT_RANKS_CODE_FOR_A_TASK_DESCRIPTION>` |
| Surface of a file | `<COMMAND_THAT_PRINTS_SIGNATURES_WITHOUT_BODIES>` |
| References to a symbol | `<COMMAND_THAT_LISTS_CALLERS_AND_ITS_DEPTH_FLAG>` |
| Reach of a diff | `<COMMAND_THAT_REPORTS_WHAT_A_CHANGE_TOUCHES>` |
| Repo orientation | `<COMMAND_THAT_PRINTS_HUBS_AND_CLUSTERS>` |

### The graph locates code and never decides anything

**A graph answer is a pointer, and the file it points at is the evidence.** Open the file and read the lines before writing a single claim anywhere. This is the whole rule, and every consequence below follows from it.

**The reason is that a graph node carries prose a model wrote about code.** A summary is a paraphrase, produced at some earlier moment, by some model nobody recorded, against bytes that may since have changed. It reads exactly like an observation and it is not one, which is the same failure as fabricated evidence: the next session cannot tell them apart. So it is a lead worth following and never a line worth quoting.

Four consequences, one per skill that reads this:

- **No document cell is filled from the graph.** Not a Status, not a Verify Check, not an Evidence row, not a component in `ui-registry.md`, not a term in `glossary.md`. Those are claims about something somebody ran or somebody chose, and a graph has run nothing and chosen nothing.
- **No finding cites a node.** A review finding names a file and a line the reviewer read. A node identifier in a finding is a finding nobody can check.
- **No decision comes out of it.** A graph showing one pattern used everywhere is not a decision that the pattern is right. Load bearing choices stay with `/dev-architect` and the person.
- **Absence is normal and never a blocker.** A project with no graph, a stale graph, or a language the tool parses poorly falls back to search and read, which is what every skill did before. A skill that cannot query the graph says so in one line and carries on.

### No section at all is a fourth state, and it means nobody has been asked

`WIRED`, `DECLINED`, and `DEFERRED` are answers. **A `tooling.md` with no Code Graph section in it is a project that predates the question**, and that is a different thing from a project that said no.

**A skill that reaches this state says so once and names `/dev-architect`, then carries on as it always did.** One line in its report, not a panel and not a repeated warning. The person may well have the tool installed already and be wondering why nothing is using it, and that line is the whole answer.

**It routes rather than querying, and the reason is this section.** The rows above are what hold the commands, so a skill querying a graph with no section to read is guessing at the commands, and two skills guessing differently on the same repository is a worse outcome than neither of them using it. Recording the answer is one `/dev-architect` run, and after it the question is settled either way.

**Where the graph tool's own commands or tools are already available to the session**, say that in the same line. The answer is then plainly yes, and the person only needs it written down.

### What the structural pass proves, and what the summaries do not

**Two layers, two different degrees of trust, and they are easy to confuse because one command prints both.**

The structural layer is a parse: symbols, imports, and call edges, derived from the bytes on disk with no model involved. It is as right as the parser is, it costs nothing, and a query refreshes it against the working tree, so uncommitted edits are visible. Treat it as a reliable index that still gets confirmed in the file, for the ordinary reason an index can be wrong about the thing you actually asked.

The summary layer is generated prose. It was written once, by a model, and nothing rebuilds it when the code moves under it. **Never quote it, never paste it into a document, and never treat a summary that disagrees with the code as anything other than the summary being stale.**

**Run the freshness check before trusting anything the graph said about an area under active work**, and where it reports drift, say so and read the files instead.

### Who installs it, and who pays for it

**A person installs it and a person wires it.** A global package install and a wiring command that writes agent configuration, hooks, a statusline, or an MCP registration all change the person's own setup rather than this project's, which is the same line already drawn for an MCP server. `/dev-architect` gives the exact commands and the person runs them.

**Building the graph is repo local, so `/dev-architect` may run it once consent is given.** The structural build needs no key and costs nothing. **The enrichment pass spends the person's own provider credit**, so it is a separate yes with the cost named, and it is never run to refresh a graph nobody asked to enrich.

**Nothing else may install, wire, build, or enrich it.** A second skill reaching for the graph tool would be a second answer to what this project is built with, which is the same rule that keeps every other tool call in `/dev-architect`.

**The cache is regenerable and stays out of version control.** It is the tool's own working directory and not a project record, so it belongs in `.gitignore` beside `node_modules`. Nothing in `.konteksto/` is ever derived from it.

**Where the project already has a knowledge graph tool of its own**, record that here as the tool, along with which of the rows above it can answer. The rule set does not care which tool it is, only that a graph answer is a pointer.

---

## Local Data Lifecycle

*Purpose: what happens to the local database between tasks, so a build never guesses whether it may reset the data it is working against. Optional: only present once the project has a local data store.*

**Between tasks:** <RESET_EVERY_TASK | PERSIST_WITH_SEED_DATA | PERSIST_UNTOUCHED>

**Reset command:** `<THE_EXACT_COMMAND_THAT_RESETS_LOCAL_DATA>`

**Seed data:** <WHERE_THE_SEED_LIVES_AND_WHAT_IT_CONTAINS | NONE>

Whoever builds a task follows this and nothing else. A build never drops a local database on its own initiative, because someone else's work in progress may be sitting in it.

---

## Visual verification

*Purpose: how a person or a skill renders a page and captures it at each breakpoint. Required on any project with an `app/`, and deleted entirely on a backend. Two skills depend on it: `/dev-design` cannot run a design review session without it, and `/dev-check verify` must produce a screenshot per breakpoint or report the item as blocked. `/dev-architect` writes this section and installs the tool, and uses neither.*

**On a project with an `app/`, this section is required and a browser is not optional.** The design lifecycle ends in a person looking at a rendered prototype, so a project with no way to render one cannot approve a design, and a project that cannot approve a design cannot build a surface. Settle it during the stack walk and install it before the first prototype is finished.

| What | Value |
| --- | --- |
| Tool | <BROWSER_AUTOMATION_TOOL, DEFAULT_PLAYWRIGHT> |
| Browser | <BROWSER_AND_HOW_IT_IS_INSTALLED, DEFAULT_CHROMIUM> |
| Install | `<EXACT_COMMAND_THAT_INSTALLS_THE_TOOL_AND_ITS_BROWSER>` |
| Package root | <THE_DIRECTORY_WHOSE_PACKAGE_JSON_HAS_PLAYWRIGHT, OR: the project root> |
| Check | `<EXACT_COMMAND_THAT_PROVES_THE_TOOL_AND_ITS_BROWSER_BOTH_WORK>` |
| Review command | `<COMMAND_THAT_STARTS_A_DESIGN_REVIEW_SESSION>` |
| Capture command | `<COMMAND_THAT_RENDERS_A_ROUTE_AND_WRITES_AN_IMAGE>` |
| Output | <WHERE_THE_IMAGES_LAND> |
| Remote access | <NONE_WHEN_THE_HARNESS_RUNS_ON_THE_MACHINE_A_PERSON_SITS_AT, OTHERWISE_THE_FORWARDING_COMMAND> |

**The Package root row exists because the project root and the package root are not always the same directory**, and where they differ nothing can work it out on its own. A workspace holding `.konteksto/` at the top and the actual npm package one level down, as its own repository, puts Playwright somewhere no search from the top will ever reach: it is below rather than above. **Record that directory here, and every session passes it as `--project`.** Where they are the same directory, which is the usual case, write the project root and it costs nothing.

**Do not solve this with a second install at the top instead.** A `package.json` at the project root whose only purpose is to put `node_modules` on a search path is a second copy of Playwright to keep in step with the first, and a version drift between them is a review running against a browser the product never uses. One install, named here.

**The Check row is a command that fails when the setup is broken, and it is not the install command run twice.** A package manager reports success for a package whose browser binary was never downloaded, so an install that returned zero proves less than it looks like it does. On the default answer the check is `/dev-design`'s own probe, which resolves the package from the project root and then launches the browser:

```bash
node <skill folder>/dev-design/review-harness/preflight.mjs --project <PACKAGE_ROOT>
```

**Run it once here, after installing, and record what it printed.** `/dev-design` runs the same probe before every session, and a project where the first run of it happens in front of a person waiting to approve a design is a project that discovers its own setup problem at the worst moment.

**A project that already has Playwright still gets this row filled.** An end to end suite installs one for its own reasons, and that says nothing about whether the package this harness imports is reachable or the browser is downloaded. Check it rather than assuming it, and where it is already working, record that nothing needed installing.

**Playwright with Chromium is the default answer**, because it drives a real browser, sets a viewport exactly, and reports console errors, page errors, and failed requests without extra tooling, which is the whole evidence set a review session needs. A project already carrying a different browser automation tool records that one instead rather than installing a second.

**Chromium alone is enough for a design review.** A review answers whether this is the design to build, and rendering it in three engines answers a different question. Where a project needs cross browser evidence, that belongs to `/dev-check verify` against the built product, not to the approval of a prototype.

**The review harness runs on Node, whatever the product is written in.** It ships with `/dev-design` as a handful of small files, and Node plus the Playwright package is what runs them. A Go or Python or Rust product with an `app/` therefore needs Node available to review a design, and that is a real requirement rather than an implied one, so it is written here where somebody setting the project up will see it.

**The reason is that one harness beats one per language.** The alternative is the same review page and the same decision endpoint reimplemented per ecosystem, drifting apart, each one separately wrong in its own way, and this is the code path that decides whether an approval is genuine. **A project with an `app/` almost always has Node already**, since the client tooling brought it, so the requirement usually costs nothing. Where it genuinely does not, that is worth saying in this section along with what the project does instead.

**A project using Playwright's Python or other language binding still needs the Node package for this.** The bindings are not interchangeable here, and installing both is cheaper than maintaining a second harness.

**This is a development tool and not a package the product ships**, so it stays here and never enters `library-docs.md`, whatever the manifest says.

**Where the tool cannot be installed at all**, say so here in one line, and say what blocks it. Two consequences follow and both are worth knowing in advance: `/dev-check verify` reports UI conformance as blocked, honestly and every time, rather than degrading into reading the markup and calling it a match, and every design approval has to be a person editing `design-registry.md` by hand. Both are honest, both are workable, and both are worse than installing a browser.

### Where the harness runs on a machine nobody sits at

*Purpose: what the Remote access row records, and why a review session needs it. Fill it in on a VPS, a container, a remote development box, or anywhere `/dev-harness` runs its panes away from the person who has to approve a design. Write NONE and skip the rest when the harness runs on a desktop.*

**The capture pass needs no display and works unchanged.** It launches the browser headless, so a machine with no X server renders every breakpoint and state and collects what the page threw exactly as a desktop does. What such a machine usually lacks is the shared libraries the browser links against, which the tool's own install flag pulls in:

```bash
npx playwright install --with-deps chromium
```

Record that as the Install command where it applies, and prove it with the Check row rather than assuming it, for the reason that row already gives.

**The person's half is what needs setting up, because the review origin is bound to loopback and refuses anything else.** That endpoint accepts a design approval, so binding it to an address the network can reach would put a write endpoint for a design decision on the network, and the server exits rather than doing it. On a remote machine the consequence is that nothing reaches the review page until a person forwards it to their own machine, and **the forwarding command is what the Remote access row holds**, so the next session does not work it out again.

**Forward both origins, and keep the port numbers identical on both sides.** A session serves the review page and the prototype on two separate ports, and every origin check in the harness parses the URL and compares origins, so a port remapped in transit is a different origin and the review page can no longer load the prototype it is reviewing.

**The ports are chosen at startup rather than fixed**, so the command is built after the session starts, from what the server published. `review-harness/README.md` names the file it writes them to and the variables it prints, and it is the authority on the origins and the rules around them. `dev-design/internal/design-review.md` owns the session itself.

**A browser extension driven through the agent is not an option here, and Playwright is.** An extension needs a desktop browser running under a real profile, which a headless machine does not have, and the profile is a signed in one, which a review session may not open in any case. This is one more reason the default answer is the default answer.

**The wall between the browser a skill drives and the browser a person decides in is unchanged by any of this, and it is still a convention rather than a guarantee.** A tunnel moves where the review page is reachable from. It does not make the approval harder to forge, and it was never the thing making it honest.

### Previewing a prototype

*Purpose: how anybody opens a file in `.konteksto/designs/` to look at it, outside a review session. Needed by whoever is building the surface as much as by whoever approved it.*

**Command:** `<COMMAND_THAT_SERVES_THE_DESIGNS_FOLDER, FOR_EXAMPLE_A_STATIC_FILE_SERVER>`

**No application infrastructure may be required to view a prototype.** No install, no build step, no dev server for the product itself. A prototype that needs the app running to be looked at cannot be reviewed before the app exists, which is precisely when it needs reviewing.

**The review session does not relax that.** It serves a copy of the prototype over HTTP because the review page and its decision endpoint need an origin, and the prototype itself must still open on its own from the filesystem. One that only works under the session server has failed the rule and is not ready to review.

---

## Doubt pass rounds

*Purpose: how many adversarial review rounds `/dev-architect` may run on one load bearing decision before it stops and brings the question to a person. Recorded here because it is a fact about how the agent works on this project, not about the product, and because a preference asked once should not be asked again every session.*

**Rounds:** <1_2_OR_3>

Each round spawns a read only subagent on a different model, so this is the main cost lever on the doubt pass. `/dev-architect` asks once, on the first decision that triggers a pass, and reads this line on every run after that. Change the number by hand at any time.

**This is a ceiling, not a quota.** The pass stops the moment the findings go trivial, which is usually after one round whatever this says. A higher number does not mean more rounds get run, it means more are available on a decision that keeps producing real objections.

**At the cap with something substantive unresolved, it stops and asks.** A decision that survives its allowed rounds still contested is not one more round away from settled, it needs a fact only a person has.

---

## Considered and Rejected

*Purpose: tools that came up during discovery and were deliberately not installed, with the reason. Stops a later session from re proposing the same thing.*

| Tool | Kind | Source | Why rejected |
| --- | --- | --- | --- |
| <TOOL_NAME> | MCP server / skill / code graph | <SOURCE> | <REASON> |

---

## Review Triggers

*Purpose: the conditions under which this list should be revisited, so tooling does not silently rot as the stack changes.*

- A new layer is added to the Stack table in `architecture.md`.
- <OTHER_REVIEW_TRIGGER>
