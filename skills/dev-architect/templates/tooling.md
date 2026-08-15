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
| <TOOL_NAME> | MCP server / skill | <SOURCE> | <REASON> |

---

## Review Triggers

*Purpose: the conditions under which this list should be revisited, so tooling does not silently rot as the stack changes.*

- A new layer is added to the Stack table in `architecture.md`.
- <OTHER_REVIEW_TRIGGER>
