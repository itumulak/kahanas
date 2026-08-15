# Changelog

What changed in these skills, and what it means for a project already using them. Newest first.

Entries describe the effect on someone running the skills, not the edit that produced it.

## [0.6.1] — 2026-08-15

Three gaps found by running `/dev-design` on a real project: it could not tell a Playwright it can use from one it cannot, it had no way to prove the browser works before a person was waiting, and ending a session meant killing processes by number.

### Added

- **A preflight probe, `review-harness/preflight.mjs`.** `/dev-design` runs it before building a session, and `/dev-architect` runs it once after installing. It resolves the Playwright package and then launches the browser, because those are two different facts and a package manager reports success for a package whose browser binary was never downloaded. It exits 69 when no Playwright is reachable, naming every path it tried, and 70 when the browser will not launch.

- **A Check row in the Visual verification section of `tooling.md`**, holding the command that proves the tool and its browser both work. The install command returning zero was being read as evidence of a working setup, and it is not.

- **Continuous integration, with a job that requires Playwright.** The suite skips its browser cases when Playwright is absent, which is right on a contributor's machine and wrong in CI, where it let a change to the capture pass, the resolver, or the browser path go green without any of them running. `npm run test:browser` turns that skip into a failure, and the workflow runs both that and the plain suite, since the harness has to work with nothing installed beside it.

### Changed

- **A review session ends by creating a file, not by killing a process.** Writing `stop` in the session directory stops the server, which also exits on its own a few minutes after a decision and again after a maximum lifetime, so an abandoned review no longer leaves a server holding a port. **A stored process id is a number that was true once**: the process may have exited and the number may since have been reused, and killing by it checks nothing and reports success either way. The server publishes `server.json` while it runs and removes it on exit, so a caller can tell a live session from a finished one without going near a signal.

- **Playwright is resolved from a recorded package root rather than from beside the harness.** Node's upward search from the harness breaks on two ordinary layouts, in opposite directions: a skill installed for the person sits in the home directory and the walk never enters the project, and a workspace whose npm package is one level down puts Playwright below the root rather than above it. Either way a session insisted Playwright was missing on a machine where the end to end suite ran fine, because **confirming one consumer never proves the other**.

- **A Package root row in the Visual verification section of `tooling.md`**, for the second of those. Where the project root and the package root differ, nothing can work it out on its own, and the tempting fix is a `package.json` at the top whose only purpose is to sit on a search path, plus a duplicate Playwright to keep in version step with the real one. **A version drift between those two is a review running against a browser the product never uses.** Record the one directory instead, and every session passes it as `--project`.

- **Finding Playwright in a project is no longer treated as an answer.** "Playwright is installed" is three separate facts and a project can hold any two without the third: the Node package resolving from this project, the browser being downloaded, and `tooling.md` naming it as the visual verification tool. An existing end to end suite settles none of them for design review, and choosing what reviews designs is a tool decision, so `/dev-design` routes it to `/dev-architect` rather than adopting what it found.

- **One review session at a time**, stated as a rule. Several at once produced several servers, a list of process ids kept somewhere, and a teardown loop that kills by number, for no gain: a person can only look at one design at a time, which is the part that was never parallel.

- **A server refuses to serve a session that already recorded a decision**, and refuses to be the second server on one session directory. Both put a live approval page in front of somebody whose click can only be refused.

### Fixed

- **Two servers could start on one session directory.** The one server check read `server.json` and then wrote it, and every racer read it before any of them had written. Eight simultaneous starts left four servers running, each believing it was alone. The claim is now taken with an atomic exclusive create before any port is bound, so the filesystem picks one winner however many arrive together. A claim left behind by a crash is reported rather than cleaned up automatically, since building a fresh session is always available and deleting a claim that turns out to be live is not undoable.

- **`server.json` is removed after both listeners close**, not before them. Teardown reads that file disappearing as the server being finished, and it was being removed while both listeners were still draining. With keep alive connections held open, as the review page holds them, the marker was gone for around ten milliseconds while the process was still shutting down.

- **A flag with no value is an error rather than a default.** `--project` with nothing after it read as "not given" and fell back to the working directory, which is the worst available behaviour for that flag: the caller said which package root to use, the value went missing in the shell, and the run validated and captured against a different Playwright than it was told to. Every program in the harness now exits 64 on a dangling or empty argument.

- **Deleting a session directory now has rules**, because a wrong path there removes somebody's work. The path is never built by expanding a variable that could be empty, and the directory is confirmed to hold this session's `manifest.json` before it goes.

## [0.6.0] — 2026-08-13

Design becomes a skill of its own, and design approval becomes something that runs. Approving a prototype used to mean a skill saying "here it is" and a person reading a file, which is the weakest step in the whole workflow and the one everything visual depends on.

### Added

- **`/dev-design`, a skill of its own.** Design has moved out of `/dev-architect`, which now settles how the product gets built while `/dev-design` settles how it looks. It owns `design.md`, `design-registry.md`, and `.konteksto/designs/`, maps the flows to the surfaces they require, builds the prototypes, runs the review sessions, and records the approval a person gave. Skipped entirely on a backend with no `app/`.

  **The reason is not size, though the size is stark.** `/dev-architect` was the only skill in the set that owned two kinds of intent, and the invariant table said so in its own words while every other row named one thing. The two also have different lifecycles: stack decisions happen once, and the design lifecycle recurs by construction, once per revision of every surface. Re-reviewing one surface used to mean re-entering a ten step skill that starts with databases.

  **The chain is now `/dev-scope` to `/dev-architect` to `/dev-design` to `/dev-develop`**, and the visual gap loop is `/dev-develop` to `BLOCKED` to `/dev-design` to a person to `/dev-develop`. Nothing waits on a design that is not ready: the build plan is written whatever the design status is, exactly as before.

- **`/dev-architect` and `/dev-design` are peers rather than a chain of authority.** Both sit downstream of `/dev-scope` and neither is downstream of the other. `/dev-design` works inside the technical constraints and may not add a dependency or change the application structure to suit a design, and `/dev-architect` may not decide what a screen looks like while settling the stack. Each routes to the other.

- **A design review session, driven by Playwright.** Before asking for approval, `/dev-design` renders the proposal at every breakpoint `design.md` defines and every state the registry says the surface has, and collects every console message, page error, and failed request it produced. The prototype stays live and interactive in the review page, so the person exercises the interactions themselves rather than reading a script's account of them. It serves a working copy plus that evidence on a loopback address and hands a person the review page, which offers Approve, Request changes, and Reject. `internal/design-review.md` defines the session, and nothing else may redefine it.
- **A state contract, so a state can be opened rather than clicked towards.** Every prototype now reaches each of its required states from the page address, as `<file>.html#state=<name>`, using the registry's own spelling. `/dev-design` captures with it, `/dev-develop` reads the prototype with it, and `/dev-check verify` compares against it, so all three land on the state they meant instead of whatever a guessed click path reached.
- **An approval is bound to one exact revision.** The session records the working copy, the canonical file, and the registry row as they were when the review started, and re checks all three before it writes a status. Anything moved underneath the review and the approval is void rather than recorded with a caveat, because a stamp saying a person approved something they did not see is the failure the whole step exists to prevent.
- **A state is compared with the other states of its own surface, and nothing else.** Comparing against the first state alone misses a real defect on a prototype covering several surfaces, where the first state belongs to a different surface. Comparing against every other state blocks correct work instead: two surfaces are allowed to look alike, and a standardised loading screen is deliberately the same screen twice. Both sides of a collision are reported and neither is blamed, since from outside there is no telling which of two identical states was never built.
- **Duplicate state names are checked after slugging.** `Cart Default` and `cart-default` are two entries that resolve to one address and one screenshot, and exact comparison let them through. On a prototype covering several surfaces the first state belongs to some other surface, so `payment-error` was found different from `cart-default`, called implemented, and shipped to a person while it was really rendering `payment-default`. Comparing pairwise catches it and needs no surface metadata to do it.

- **State names are unique across the surfaces a shared prototype covers.** One address opens one composition, so a checkout whose cart and payment steps both called a state `default` had two screens competing for `#state=default` and one of them simply never rendered, while every row was stamped approved. `capture.mjs` refuses a duplicate rather than deduplicating it, so this now stops a session instead of quietly leaving a surface unreviewed.

- **A prototype covering several surfaces is reviewed as all of them.** One file is approved once and every row pointing at it moves together, which was already the registry's rule and was not carried into the session: it hashed one row, captured one surface's states, and then stamped every row at promotion. The manifest now carries a hash per row and the union of every covered surface's states, and a row that appears pointing at the prototype mid review stops the approval like any other thing that moved.

- **A Note on a `DRAFT` row that a review sent back**, carrying the feedback the person gave. It had nowhere to go before, so a design returned for changes came back round with the reason dropped. It clears when the row next reaches `READY FOR REVIEW`.
- **A regression suite for the harness**, at `scripts/test-review-harness.mjs`, run with `npm test`. It stays in this repository rather than beside the harness, which is installed into other people's projects. Every case in it is a bug that was actually found in review, because the checks that matter are the mistakes already made rather than the ones imagined. Playwright is optional: without it the browser cases skip and the rest run in full.
- **The harness ships as code**, in `dev-design/review-harness/`: a session server, a capture pass, and the review page. `/dev-design` copies the three files and passes them arguments rather than writing them fresh each session, because this is the path that decides whether an approval is genuine and a file regenerated every time is a file nobody has ever reviewed twice. **This is the first executable thing these skills ship**, and it stays confined to a disposable session directory outside the project.
- **A state that did not activate is detected rather than assumed.** There is no way to ask a prototype whether it honoured a fragment, so the capture pass hashes what rendered and flags any state whose markup matches the default at every breakpoint. The pass exits non zero on one, since asking somebody to approve a surface whose error state nobody has ever seen is asking them to approve a claim.
- **A prototype reaching the network is a finding.** A prototype renders from fixture data with no backend by construction, so anything it requested that was not local is a dependency it is not allowed to have, and it now shows up in the review rather than silently working on the machine that built it.
- **What a prototype loads is hashed with it.** A design is not only its own file: it reads shared tokens, and it may read fonts or images. The capture pass records every local file the prototype actually loaded, and an approval is checked against all of them, so a token file edited mid review invalidates the approval exactly as editing the prototype would.
- **A revision of an approved surface drafts at `.konteksto/designs/drafts/<slug>.html`.** The canonical path keeps the last approved design, which is what `/dev-develop` builds against and what the review compares to, so an in progress revision needed somewhere else to live. On Request changes or Reject it is written back there before the session is deleted, since otherwise teardown threw away the exact thing the person just asked to have changed.

### Security

- **The prototype gets its own origin, and the review page keeps the decision endpoint.** A prototype is untrusted code: it may be derived from HTML a user supplied, and it runs unattended during the capture pass. On one origin it could read the review page, lift the session token, and post its own approval before anybody saw the design. The session now runs two loopback origins, and a decision needs the review origin, a JSON content type, and a per session token that exists nowhere the prototype can read. Verified against a prototype written to attack it.
- **A prototype reaching the network is aborted rather than logged**, and the same rule is served as a content security policy so the person's browser applies it to the live frame. Otherwise a prototype behaves one way while nobody is watching and another way during the review.
- **Approval is gated on the capture evidence, at the endpoint and not only in the page.** A state that did not activate refuses the approval outright, since the prototype does not implement something the registry says the surface has. Errors, failed requests, and blocked requests need an acknowledgement that is recorded in the decision. Console warnings gate nothing. A session with no capture pass is blocked, because no evidence is not clean evidence.
- **A decision must name the revision it decided.** The proposal hash was previously optional, so a session with a malformed manifest would accept a decision bound to nothing. The manifest is validated at startup and the server refuses to run without a full digest.
- **Origins are parsed rather than prefix matched.** `http://127.0.0.1:41655@evil.example/` starts with the asset origin as a string and is a request to somebody else's host, and a prototype can read `location.origin` to build one. Three such forms passed the old check and are now refused.
- **Two decisions arriving together cannot both win.** The record is linked into place rather than checked for and renamed, which is atomic. Verified with twenty concurrent approvals: one recorded, nineteen refused.
- **A capture pass that produced nothing usable is not a clean capture pass.** An empty or truncated output previously read as no findings, which is the most dangerous kind of clean. The shape is validated, and a missing screenshot for any state at any breakpoint blocks approval, since the person was not shown what they are being asked to approve.
- **A state is judged on the whole document and on the pixels, not on the body markup.** A prototype that switches state by setting an attribute on the html element and letting CSS show and hide is an ordinary way to build one, and its body markup is identical in every state, so the narrower check called a correct prototype unimplemented and blocked its approval outright.
- **A state that never rendered is unreachable, including the default one.** A proposal whose only state failed to load reported itself reachable and could be approved by acknowledging the navigation failure.
- **The live frame cannot open popups.** A popup escapes the frame and the asset origin's policy with it, so a prototype could navigate one anywhere. A design has nothing to demonstrate that needs a new window.
- **An acknowledgement names the findings it acknowledged.** It was a bare boolean, so a capture pass rerunning between the page loading and the click would have had somebody acknowledging findings they never saw. The decision now carries the digest of the evidence the page displayed, the endpoint refuses a stale one, and `decision.json` records exactly what was waved through, since the session is deleted and a later reader still needs to know.
- **A rerun clears the previous findings, not only the previous screenshots.** A crash partway through would otherwise pair new screenshots with the last pass's clean findings, which reads as a proposal that improved. The findings file is also written whole and renamed, so a crash never leaves a partial record for the gate to interpret.
- **State and breakpoint names are checked before they reach a file path.** Both come from documents a person edits, and both name a screenshot, so a cell holding `../../something` wrote outside the session.
- **The capture pass is graded against what the surface requires, not against what it says it did.** A pass run with a shorter state list covered everything it attempted and reported itself complete, while states the registry requires were never rendered. The manifest now carries the required states and breakpoints, the session refuses to start without them, and the gate demands exact coverage.
- **A breakpoint is a size, not a label.** Coverage compared names only, so evidence captured at `desktop:320x200` satisfied a surface needing 1440 by 900. Name, width, and height are compared together, and a breakpoint without dimensions is refused at startup.
- **The capture output has to name this session's proposal.** Any findings file left in the directory satisfied the gate, including one from a pass run against a different page on another loopback port. Same failure as grading a pass against its own claims, one step further out.
- **The evidence is read once per request.** Reading the findings and then the digest separately reopened the race that binding was meant to close, since a capture pass renaming between the two reads pairs one pass's findings with another pass's hash.
- **A malformed breakpoint is refused rather than dropped.** `tablet:bad` was silently filtered out, producing a review with no tablet coverage that reported itself complete. Duplicates are refused too.
- **The capture URL must be loopback.** It decides which origin the pass trusts, so a wrong one did not merely point elsewhere, it made elsewhere the trusted origin.
- **Arguments are validated before Playwright is loaded**, so a bad argument reports itself as a bad argument rather than as a missing browser. Found by the new test suite on its first run.
- **IPv6 loopback origins are bracketed.** `--host ::1` built `http://::1:41655`, which is not a URL, so every origin comparison would have failed against it.
- **Recovering a half finished promotion no longer restores from git.** A canonical file that does not match the proposal does not prove the promotion failed: it equally means the promotion worked and somebody edited the file afterwards. Those need opposite responses, and restoring would have discarded that edit to fix a problem nobody had identified. The procedure now compares against both hashes and stops for a person when it matches neither.

### Requires

- **Node, on any project with an `app/`, whatever the product is written in.** The harness is three Node files, and one harness beats the same review page and decision endpoint reimplemented per ecosystem and drifting apart. A project with an `app/` almost always has Node already. A Python or other language binding of Playwright does not substitute, and `tooling.md` says so where somebody setting a project up will see it.

### Changed

- **The adoption baseline's two questions now have two owners.** `/dev-design` asks whether surfaces that already exist owe prototypes, next to the registry that answer governs, and `/dev-architect` asks whether features already built appear in the plan. They were always two decisions with two defaults, and a user may well want one and not the other.
- **`/dev-architect` still makes every tool call, including the one it does not use.** It installs the browser, and `/dev-design` and `/dev-check verify` read what it recorded. A second skill reaching for a package manager would be a second answer to what a project is built with.
- **No document changes in the split.** Every artifact keeps its path, its shape, and its contents. Only the name of the skill that writes three of them is different.
- **A browser is required on a project with an `app/`, not optional.** The Visual verification section of `tooling.md` is no longer an optional section, and it now records the install command and the review command alongside the capture one. Playwright with Chromium is the default answer, because it sets a viewport exactly and reports page errors and failed requests without extra tooling. A project that genuinely cannot install one still works: `/dev-check verify` blocks UI conformance honestly, and a person approves by editing `design-registry.md` themselves, which was always allowed.
- **`/dev-architect` may install Playwright, and `/dev-design` may write a session workspace outside the repository.** Two narrow exceptions to the no code rule, each with its edges stated where the rule is. The workspace is disposable, is never committed, and dies with the session, because a review harness accumulating in a project is a product nobody agreed to maintain.
- **The browser a skill drives and the browser a person decides in are different browsers.** The capture pass never loads the review page, and `/dev-design` never clicks a decision control, evaluates script that reaches one, or calls the endpoint behind one. **This is a convention and not a guarantee**, and it says so everywhere it appears: a process holding a browser handle can click any button in it. It is worth what the Assigned column is worth, meaning an instruction agents follow and a record people can audit, and real enforcement is branch protection on the registry.
- **Playwright being installed does not make it the test runner.** `/dev-test` still reads `test-preferences.json` and nothing else, so a browser that arrived for reviewing designs never produces an end to end suite nobody asked for.
- **A review ignores the project's own `playwright.config.ts`, and the capture pass is built so it cannot read one.** It drives the browser through the library API rather than the test runner. That config belongs to the end to end suite: its base URL points at the product's dev server, its projects fan out across engines, and its global setup may sign a user in. A design review drives a prototype on a loopback port with fixture data and no identity, and inheriting any of that would point the capture pass at a running application or hand it a real session.

### Fixed

- **The review harness runs in place instead of being copied into the session.** Copying it could not work: Node resolves an import by looking beside the importing file and then upwards, so `capture.mjs` running from a temporary directory searched `/tmp` and `/` for Playwright and exited 69 on a project that had it installed correctly. Found by running the workflow end to end on a real project rather than by reading it, which is the only way it could have been found: the test suite ran the harness in place and so tested a configuration the instructions never described.
- **The dependency hashes are written into the manifest as a step of the capture pass.** They can only be known after the pass runs, the manifest is written before the server starts, and nothing said to go back and fill them in, so they stayed empty. The promotion check then passed by having nothing to compare, which is the most convincing kind of wrong. An empty map beside a non empty dependency list is now a failed check.
- **A fresh project's design line step says where to go next.** It said to skip and then said nothing.

## [0.5.0] — 2026-08-13

### Added

- **An adoption baseline, for a product that already shipped before these skills arrived.** `/dev-architect` now asks two questions on an existing codebase, before it maps any surface: do the screens that already exist owe prototypes, and do the features that are already built appear in the plan. The default on both is no, so the workflow starts at the next piece of work rather than declaring a working product entirely undesigned and unbuilt. Everything after the line follows the process in full, meaning a new page still needs a prototype and still needs a person to approve it.
- **Two new status values carry it, and neither can be mistaken for work this workflow did.** `BASELINE` in `design-registry.md` says a surface shipped before the line was drawn, so `/dev-develop` does not block on it and `/dev-check verify` does not compare it to a prototype that was never owed. `BASELINE` in `progress-tracker.md` says the same about a feature, and a row carrying it never reads `DONE` and never carries a Verify Check, because nobody here built it and nobody here watched it work. A baseline surface re enters the design lifecycle when a task recomposes it, meaning layout, hierarchy, or interaction, and stays baseline for a copy or content change, since a gate that stops a one word fix is a gate everybody routes around.
- **Baseline means finished before the line, not merely present in the repository.** A half built page, a stubbed component, or a route behind a flag nobody turned on is an ordinary task and an ordinary missing design, because the row saying a thing is unfinished is the only thing that will get it finished. `/dev-architect` sorts the two piles before it asks either question, and asks the user where it cannot tell.
- **A copy and paste prompt in `UPGRADING.md`**, so the document migration can be handed to an agent rather than done by hand. It carries the honesty rules rather than pointing at them, since the prompt gets pasted into a session that has no access to this repository: never backfill, never stamp work whose model and minute nobody knows, and never write `APPROVED` for a design that does not exist. It ends by asking for the list of everything left as a placeholder, because the failure worth catching is a plausible migration rather than a broken one.

## [0.4.1] — 2026-08-11

### Added

- **`UPGRADING.md`**, for moving a project already using these skills onto a newer version. The core of it is that the skills folder is disposable and `.konteksto/` never is, plus three rules that keep a migration honest: never backfill a new file, never stamp old work with a model and minute nobody knows, and let new sections arrive when `/dev-architect` next runs. Covers the two migrations that need real care, converting the tracker to a table and adopting the design registry on a frontend that already exists.

## [0.4.0] — 2026-08-11

Maintenance. Nothing a project using these skills will run differently, and the reason it exists is that every stale instruction found while reviewing 0.3.0 came from one cause.

### Changed

- **Each rule now has one canonical definition.** A rule was being written out in several files, correct when written and wrong the moment one copy changed. That produced a document count beside a list in three files, a breakpoint count in five, an approval condition in four, and a token instruction contradicting its own guardrail. Every other file now carries only the trigger, the action, and a pointer, never the definition or the reasoning.
- **`CLAUDE.md` says which file owns which rule**, and states the test for what a non owner may still keep: the trigger and the action stay local, since a pointer followed on every task is a pointer nobody follows, while the definition and the why do not.
- **`CLAUDE.md` is navigable again.** It had grown to forty paragraphs with no heading between the workflow table and the section on writing a skill, and the usual loop had drifted thirty lines from the table it explains.

## [0.3.0] — 2026-08-11

Design moves upstream. `/dev-architect` now settles how the product looks, not only how it is built, and `/dev-develop` implements what a person approved rather than composing a surface itself. Three new documents, and one change of role.

### Added

- **An interviewing technique for `/dev-scope`**, in `interview.md`, for the case where an idea is too vague to build options from. One question per turn, each carrying a guess at the answer, until the answers stop surprising you. It runs only when the idea is genuinely unclear, since interviewing a clear request reads as stalling.
- **A Source line on every section of `library-docs.md`**, holding the documentation URL and the date it was read, or a plain statement that nobody checked. A remembered gotcha and a verified one used to look identical on the page, and only one of them was safe to build against.
- **An Accepted risks section in `library-docs.md`**, where a knowingly kept vulnerable dependency lands. `/dev-architect` was already told to record one there and the template had nowhere to put it.
- **`design-registry.md`, a thirteenth document, and `.konteksto/designs/`.** `/dev-architect` now produces interactive HTML prototypes covering every surface, and the registry tracks every surface a flow requires against the artifact that settles it. Frontend only, skipped with `design.md`. A prototype is a design artifact and never application code: nothing in `app/` may import one, and no real backend, API, or authentication is built to make one behave.
- **A design completeness audit, run against the flows rather than the page list.** Every step, including its failure branches, is mapped to a required surface. This is what catches the case where a product mocks its dashboard and forgets the verification screen, the recovery codes, and the wrong code path.
- **A design lifecycle with human only approval.** `MISSING`, `DRAFT`, `READY FOR REVIEW`, `CHANGE REQUIRED` are a skill's to write. **No skill may originate an `APPROVED`**, and one may record an approval a person actually gave, provided it was an explicit yes to that artifact and the name recorded is theirs rather than whatever `git config` holds.
- **`glossary.md`, a twelfth document.** The project's own word for each thing in its domain, plus the words it rejects for that thing. `/dev-scope` writes it from the product conversation, `/dev-architect` adds what the design revealed, and everything else reads it and names what it builds from it. The Avoid line is the working part: a definition alone stops nobody, since the person about to write `client` is not wondering what `customer` means.
- **A Definition of Done section in `code-standards.md`**, a short table of checks with the exact command for each, written once by `/dev-architect`. The bar for stamping a task `DONE` was scattered across two skills as prose before this, which meant every session set it again from memory. It deliberately excludes runtime proof, tests, and human review, since those are other skills' claims and folding them in would have made `DONE` mean four things.
- **A doubt pass in `/dev-architect`**, in `internal/doubt-pass.md`, for the few decisions a later skill cannot cheaply reverse. It sends the decision and what it must satisfy to a fresh reviewer on another model, with its own reasoning stripped out, then sorts the findings. **The user sets how many rounds it may run, 1 to 3, asked once and recorded in `tooling.md` so no later session asks again**, since every round costs a subagent on another model. The cap is a ceiling rather than a quota: a pass stops as soon as findings go trivial, which is usually after one. Separate from the cross check, which reads a finished document and is always the user's call.
- **A Visual verification section in `tooling.md`**, naming the browser tool, the command, and where the images land, plus a preview command for the prototypes. `/dev-check` has no browser of its own, so without this it would report every UI conformance item as blocked forever. A project with no such tool says so in one line, and verify then blocks honestly instead of quietly reading markup and calling it a match.
- **A Required states column in `design-registry.md`**, with the distinction between a surface, a state, and an interaction. Loading, empty, and error are states of one surface rather than three more surfaces, without which a six entity product produces eighty rows nobody reads.
- **The invariant behind most of the ownership rules**, stated once near the top of `CLAUDE.md` and `README.md`: **no downstream skill may create upstream intent**. Plus the test a new artifact has to pass before the set grows again.

### Changed

- **Prototypes cover surfaces rather than mapping one to one.** Several steps of a checkout may share a file, one complicated screen may need several, and `design-registry.md` holds the mapping. Surfaces sharing a file are approved together and go stale together.
- **Breakpoints come from `design.md` rather than being fixed at three.** Three stays the default, meaning desktop, tablet, and phone, and a product needing two or four says so in one place instead of fighting every rule that mentioned them.
- **An accessibility departure makes the prototype stale, not the implementation wrong.** The built page is correct, the approved design is now what disagrees with reality, and the row goes to `CHANGE REQUIRED`. Unrouted, the next surface inherits the same inaccessible pattern from a document still claiming somebody blessed it.
- **`/dev-develop` runs implementation checks and never acceptance verification**, said in those words. "Never verify your own work" read as permission to skip its own build, type check, and render pass, which is the opposite of what was meant.
- **The prototype JavaScript limit is responsibility, not size.** A genuinely interactive surface may need a few hundred lines. What it may not have is an API call, persistence, authentication, or business logic.
- **The token model names an authority instead of forbidding two files.** Prototypes always read `.konteksto/designs/shared/tokens.css`, on every project, because they must render alone and a production config is often a `tailwind.config.js` or `theme.ts` no browser can read. Exactly one file decides a value: the mirror before app code exists, the production source after, with the mirror derived and regenerated rather than edited. The old rule that both must never be live at once could not survive the handover, which necessarily has a moment where both exist.
- **`design.md` names the production path before the file exists**, taken from the folder structure, so nothing needs repointing after `/dev-develop` creates it. The previous version relied on `/dev-architect` running again at exactly that moment, which the workflow never guaranteed.
- **`/dev-architect` no longer tells itself to write the project's styling config.** On a greenfield project that would have been application code, which its own guardrail forbids, and it contradicted the token handover the design step already describes. Existing project: point at the config that is there. Greenfield: write `.konteksto/designs/shared/tokens.css` and let `/dev-develop` move the values on the first UI task.
- **No document count appears in any skill's instructions.** A number beside a list is wrong the first time somebody extends it, and this project shipped that bug twice: `/dev-architect` claimed eight and then nine over a list of eleven, and waited for "all four Stage 1 documents" over a list of six.
- **`/dev-architect` reads the version from the manifest before writing a library note**, then fetches the docs page for that version rather than writing from memory.
- **`/dev-develop` reports the documentation it had to go and read**, with the URL and the version, instead of quietly using it and moving on. It still writes nothing to `library-docs.md`, which stays `/dev-architect`'s file.
- **`/dev-sync` marks its dependency stubs unsourced** when a manifest gains a package, so a placeholder cannot be mistaken for a note somebody verified.
- **`/dev-develop` runs every row of the Definition of Done before stamping `DONE`**, and reports each result. A row it skipped counts as a row that failed.
- **`/dev-develop` implements an approved design rather than composing one.** On a project with an `app/` it is a senior frontend engineer, not a designer: it builds to the prototype at high fidelity and may not introduce a layout, an interaction, or a product decision. Its phase 2 reads the prototype as a specification where it used to compose a surface from scratch.
- **The stated assumption option is withdrawn for a visual gap.** A missing state, interaction, breakpoint, or approval stops that task, which goes `BLOCKED` and routes to `/dev-architect`. It stops nothing else, and the plan is still written in full.
- **`/dev-check verify` checks design conformance at every breakpoint `design.md` defines**, inside its existing conformance verdict rather than beside it, with a new `built but off design` result. It obeys the same evidence gate as everything else: a screenshot per breakpoint, or the item is blocked rather than met, using the tool `tooling.md` records.
- **Fidelity replaces pixel equality, with a stated priority order.** Behavior, then accessibility, then interaction, then layout, then typography and spacing, then visual detail. A prototype with an unreachable touch target is fixed in the build and reported, never reproduced faithfully.
- **`design.md` states its precedence against the prototypes.** It governs anything cross page, a prototype governs its own surface's composition, and `project-overview.md` beats both. A genuine conflict is a design bug that routes back rather than a judgment call at build time.
- **`/dev-architect`'s data model stage challenges a term that disagrees with the glossary**, splits one word covering two entities, and names an entity that has none. The schema is the last cheap moment to notice that the code has quietly stopped using the product's language.
- **`/dev-sync` reports a name in the code that the glossary rejects, and a domain concept with no entry**, writing nothing into that file either way. The first is a contradiction. The second reads as a plain gap and still may not be filled, because the code proves a word is in use and never that it is the word the project chose.
- **`/dev-sync`'s gap rule now says what "a fact the repo can prove" excludes.** The loose reading let a fact in the neighbourhood of a document's claim pass for the claim itself, which is how a careless name would have become canonical.
- **`/dev-sync` says plainly that its own `DONE` stamps are the narrower claim.** It runs nothing, so it cannot confirm the Definition of Done, and a task it stamped from repo evidence is now reported as needing that check rather than passing as finished.

## [0.2.0] — 2026-08-09

### Added

- **`decision-log.md`, an eleventh document.** What was decided during a build, and why, in one append only table. `/dev-develop` and `/dev-debug` write to it, and only when there was something to decide, so a task that goes to plan adds nothing. `/dev-document` reads it for changelogs and postmortems.
- **A Verify Check column in `progress-tracker.md`**, written by `/dev-check verify`. A task now records both that it was built and whether somebody ran it and watched it work. Those were the same tick before, and a task could look finished having never been exercised.
- **An Author column in `decision-log.md` and `note-registry.md`**, holding the exact model identifier that wrote the row. It stays on a personal project even though the Actor column does not, since the model changes between sessions when the person does not.
- **A Note column in `progress-tracker.md`**, on a blocked task or a failing verify only, saying in one line what somebody needs to deal with.
- **Worked example sections** in the `progress-tracker.md`, `decision-log.md`, and `note-registry.md` templates, all three showing the same invented build from their own side. `/dev-architect` deletes them when it writes the real files.

### Changed

- **The Progress section of `progress-tracker.md` is a table per phase**, not a checkbox list. Each task carries its status, its verify result, who it is assigned to on a team project, and a note when something is wrong.
- **Status is one of `PENDING`, `DONE`, or `BLOCKED`**, where before a task was only ticked or unticked. A task stopped on something outside itself now says so instead of looking untouched.
- **Every status and verify result is stamped** with the model that set it and the local time to the minute. A value that changes is struck through and the new one appended after it, so a task that went `DONE`, then `BLOCKED`, then `DONE` again still says so.
- **`progress-tracker.md` has two writers now, split by column.** `/dev-develop` owns everything except Verify Check, which is `/dev-check verify`'s. `/dev-sync` still corrects the first set from repo evidence and never touches the second.
- **`/dev-check verify` records a failed verify** as `FAILED` on the task, with a one line note. It still writes nothing to `note-registry.md` on a failure, because that file holds what was proven.
- **`decision-log.md` entries are rows in a table**, carrying a timestamp to the minute, the actor, the author, the writing skill, and the task. They were dated bullets, which could not be sorted or matched to a task without reading every one.

### Removed

- **The Decisions Made During Build section of `progress-tracker.md`.** It is `decision-log.md` now. An existing project keeps working: move the section into the new file, or leave it where it is and start the new file empty.

## [0.1.0] — 2026-08-07

The first working set. Not tagged, so this records the state of `main` before the above.

### Added

- **Eight skills**, each prefixed `dev-` so a personal skill of the same name cannot shadow it: `/dev-scope`, `/dev-architect`, `/dev-develop`, `/dev-check`, `/dev-debug`, `/dev-test`, `/dev-document`, `/dev-sync`.
- **Ten documents in `.konteksto/`**, written from templates, carrying the reasoning a chat log would have lost.
- **`note-registry.md`**, split out of `progress-tracker.md`, recording what was actually run and what it proved. Three skills append to it, each making a different claim.
- **Team Shape**, asked once by `/dev-scope` and applied by `/dev-architect`: an assignee per task, an actor per note row, and a review checkpoint per phase. Personal projects get none of it.
- **A local installer**, for trying the skills before publishing them.
