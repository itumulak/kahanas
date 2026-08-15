# Architect: the design review session

Read this at step 6 of `design-direction.md`, and only on a project with an `app/`. A backend has no surfaces to review.

**What this file defines, and what nothing else may redefine:** what a review session is, the two browser contexts and the wall between them, the decision record a person produces, and the checks that bind an approval to one exact revision.

The registry still owns who may approve and what a recorded approval must satisfy. Read its Status values section before you write a status cell. This file owns the machinery, that file owns the permission.

---

## Why a session exists at all

A prototype is the visual specification for a surface, and until this step the only thing anybody could do with it was open the file and look at the markup. That is not a review. A person approving a design needs to see it at every breakpoint, reach every state it claims to have, click the things that claim to do something, and know that nothing in it is throwing errors while it looks fine.

**A review session is the act of producing that evidence and putting a person in front of it.** It does not decide anything.

---

## The two contexts, which is the rule the rest of this file protects

Playwright appears twice in a session, doing two jobs, and **they must never be the same browser context.**

| Context | Driven by | Sees | May touch |
| --- | --- | --- | --- |
| **Capture** | this skill, through Playwright | the prototype alone, at each breakpoint and each state | the prototype, and nothing else |
| **Decision** | the person, in their own browser | the review page, carrying the evidence and the three decisions | everything, it is their browser |

**This skill may never dispatch an event to a decision control.** Not a click, not a keystroke, not a script evaluation that reaches one, and not a request to the endpoint behind one. The capture context is closed before the review page is opened for a person, and the capture context never loads the review page at all.

**Say plainly what that rule is and is not.** It is a convention, in the same class as the assignee column in `progress-tracker.md`. A process holding a browser handle can click any button in it, and a process holding the filesystem can write any file on it. Nothing here makes an approval impossible to forge, and pretending otherwise would be worse than saying so.

**What it buys is what conventions buy everywhere in this workflow: a rule an agent reads and follows, and a record a person can check afterwards.** The decision record names a person, a revision, and a minute, and it sits beside the screenshots that person was shown. Real enforcement, where a project needs it, is branch protection on `.konteksto/design-registry.md`, exactly as it is for everything else here.

---

## The session

### 1. Confirm the tooling before anything else

**Two questions, in this order, and they are different questions.** The document settles whether this project has chosen a browser. The probe settles whether that browser actually works here. A session that skips either one fails halfway through, after a person has been told a review is starting.

**First, read the Visual verification section of `tooling.md`.** It names the tool, the browser, and the commands, and on a project with an `app/` it is required rather than optional.

**That file is always written before this skill runs**, since `/dev-architect` completes first and owns it. Missing or empty on a project with an `app/` is a project setup gap rather than something to work around: report it, route to `/dev-architect`, and stop.

**Then run the probe**, from the project root:

```bash
node <skill folder>/review-harness/preflight.mjs
```

| It exits | Means | Do |
| --- | --- | --- |
| 0 | Playwright resolves from this project and its browser launches | continue to step 2 |
| 69 | no Playwright this harness can reach, and its output names every path it tried | **stop**, and route to `/dev-architect` |
| 70 | Playwright is here and the browser will not launch, or Node is too old | **stop**, and route to `/dev-architect` |

**You do not install it, on any of those.** `/dev-architect` makes every tool call in this workflow, and the probe's own output says so rather than leaving it to be remembered. Report what it printed, name the section of `tooling.md` that records the install command, and stop.

**No Playwright and no browser means no review, and the correct move is to stop and say so.** Do not open the file and describe it. Do not screenshot it some other way and call it a review. Report what the probe found and stop, per Preview and capture failures below.

### Playwright already in the project is not this project's answer to this

**A project can have Playwright and still have no visual verification set up**, and this is the ordinary case on a codebase that existed before this workflow. An end to end suite installed it for its own reasons, and nothing about that says anybody decided how designs get reviewed here.

**"Playwright is installed" is three separate facts, and a project can hold any two without the third:**

| Fact | Settled by | A project that has the others without this one |
| --- | --- | --- |
| the Node package resolves from this project | the probe | an end to end suite on Playwright's Python binding, which this harness cannot import |
| the browser is downloaded and launches | the probe | a fresh clone where `npm install` ran and `npx playwright install` never did |
| `tooling.md` names it as the visual verification tool | reading the document | an existing suite nobody has adopted for design review |

**The third is the one that gets assumed, and it is the one this skill may not decide.** Choosing what reviews designs is a tool decision, and `/dev-architect` owns every one of those. **Finding Playwright in `node_modules` is not permission to proceed**, it is a good reason to expect the routing to be quick: route to `/dev-architect`, say the package is already there, and let it record the section.

**The reverse holds too, and matters as much.** A filled Visual verification section with a probe that fails is not a working setup, whatever the document says. The document records a decision, and only the probe knows whether the machine can honour it.

**The probe resolves Playwright from the project root and not from beside the harness**, which is why it can answer this at all. A skill installed for the person rather than the project sits outside the project entirely, and a plain import from there searches the home directory and stops, reporting a project with a perfectly good Playwright as having none. `review-harness/resolve-playwright.mjs` holds that rule, and `capture.mjs` resolves the same way for the same reason.

### 2. Build the session workspace

One disposable directory per session, outside the repository, in the system temporary area:

```text
<system-temp>/kahanas-design-review-<session-id>/
├── prototype/             served on its own origin, nothing else is
│   ├── proposal.html      the working copy under review
│   ├── baseline.html      the current canonical prototype, when one exists
│   └── <assets>           whatever the prototype loads, copied in beside it
├── manifest.json          what this session is reviewing
├── decision.json          written by the person's click, never by this skill
├── errors.json            written by the capture pass
└── screenshots/
```

**The prototype sits in its own folder because it gets its own origin.** Step 4 says why.

**No code goes in here.** The workspace holds data and nothing else. `server.json` and `stop` appear in it while a server is running, and step 8 says what they are for.

**One session at a time, and this is a rule rather than a habit.** A review ends in a person looking at one design and deciding about it, so ten sessions at once is ten servers, ten ports, and a person who can still only look at one. **What it actually produces is a teardown nobody can do safely**: ten processes to find, a list of process ids to keep somewhere, and a loop that kills by number. That loop is one stale entry away from killing something else on the machine, and it is the reason step 8 is written the way it is.

**Where several surfaces are ready, run their sessions one after another** and say so in the report. It is slower by the time a person takes to decide, which is the part that was never parallel.

**Nothing in it is committed and nothing in it survives the session.** Screenshots and error logs are diagnostic evidence, not the design. A project that genuinely wants them retained says so in `tooling.md`, which is the one place a policy like that belongs.

**The working copy is a copy.** The canonical file at `.konteksto/designs/<slug>.html` is not served, not opened, and not touched until an approval is recorded. A revision under review must not be able to damage the design that is currently approved, and the simplest way to guarantee that is to never have the canonical path open for writing.

**Run the harness in place, out of this skill's own `review-harness/` folder, and copy nothing.** Pass it the session directory as an argument. `review-harness/README.md` documents what each file takes.

**Copying the code into the session would break it, and the reason is worth knowing rather than rediscovering.** Node resolves an import by looking beside the importing file and then upwards, so `capture.mjs` running from a temporary directory looks in `/tmp` and then `/` for Playwright, finds nothing, and exits 69 on a project that has it installed perfectly well. Run in place, it looks upward from the skill folder, reaches the project root, and finds it.

**Do not regenerate the harness, and do not edit it for one session.** It is the part of this session that decides whether an approval is genuine, and a file rewritten from memory each time is a file nobody has ever reviewed twice. A harness that is actually wrong is a bug to fix in this repository, where the fix is read once and then applies to every project. Where it will not do what a session needs, say so and stop.

**This skill therefore writes no code outside `.konteksto/designs/` at all.** It writes the session's data files and runs somebody else's program on them.

### 3. Write the manifest

```json
{
  "sessionId": "2026-08-13-account-recovery-01",
  "surfaces": ["Account recovery, step 3"],
  "prototypePath": ".konteksto/designs/account-recovery.html",
  "proposalHash": "sha256 of proposal.html, a full hex digest",
  "baselineHash": "sha256 of the canonical file, or null when none exists",
  "registryRowHashes": { "Checkout, cart": "sha256 of that row's text at session start" },
  "dependencyHashes": {},
  "states": ["default", "submitting", "invalid-code"],
  "breakpoints": [{ "name": "desktop", "width": 1440, "height": 900 }],
  "createdAt": "2026-08-13 15:30",
  "createdByModel": "claude-opus-5"
}
```

**These hashes are why an approval means one revision and not a moment in time.** The proposal hash says what the person was shown. The baseline hash and the row hashes say what the world looked like when they started, so an approval cannot be applied on top of something that moved underneath it. Step 7 checks every one.

**One entry per row, because a prototype may cover more than one surface.** `surfaces` is a list for the same reason. Find every row in `design-registry.md` whose File column names this prototype, and carry all of them: hashing one row and then stamping all of them at promotion would let two of a checkout's three rows change during a review without anything noticing.

**`states` covers every surface this prototype covers, grouped by surface, and it is a list of addresses rather than a set of words.** A session that captured only the surface somebody reported has put a person in front of one third of what they are about to approve.

**A plain union is wrong when two surfaces use the same word, and they usually do.** A checkout whose cart and payment steps both have a `default` and an `error` state unions down to two names, and `#state=default` can open exactly one composition, so a whole surface goes uncaptured while every row is stamped `APPROVED`. **The deduplication is the bug**, and it is silent, which is the worst kind.

**So on a prototype covering more than one surface, the state names are unique across all of them.** `cart-default` and `payment-default` are two different compositions and get two different addresses, which is what the file actually contains. `design-direction.md` owns that rule as part of the state contract, and `capture.mjs` refuses a duplicate outright rather than deduplicating it, so this fails loudly if it is ever got wrong.

**A surface whose states genuinely cannot be named apart from its siblings' does not belong in a shared file.** `design-registry.md` says so already: where rows need to move independently, they belong in separate files.

**Names must be distinct, and compositions need not be.** The capture pass compares a state only with the other states of its own surface, so two surfaces sharing a standardised loading screen are fine and expected. What is not fine is two states of one surface rendering the same thing, since one of them was never built. **Pass the states grouped by surface** so the pass knows which comparison it is making.

**A prototype is not only its own file, and this is the part that is easy to miss.** It loads `shared/tokens.css` on every project, and it may load fonts, images, or another stylesheet. A token file edited during a review changes what the person is looking at while `proposal.html` hashes identically. **So `dependencyHashes` holds one entry per local file the prototype actually loaded**, keyed by its path under `.konteksto/designs/`, and step 7 checks them with the rest.

**Fill it after the capture pass, not before.** `errors.json` carries a `dependencies` list of every local file the prototype really loaded, which is the honest answer and beats parsing the markup for links: it catches what JavaScript fetched and skips what a commented out tag mentions.

**`states` and `breakpoints` say what this prototype requires**, taken from the Required states cells of every surface it covers and from `design.md`, and the session refuses to start without them. **They are what the capture pass is graded against, and the capture output is never graded against itself.** A pass run with a shorter list covered everything it attempted and would otherwise report itself complete, while the states the registry says the surface has were never rendered at all.

**A breakpoint carries its width and height, and all three are checked.** A breakpoint is a size rather than a label, so evidence captured at desktop 320 by 200 says nothing about the desktop layout however it is named. `design.md` holds the real numbers and they travel with the name.

**The capture output also has to name this session's proposal.** Any findings file left in the directory would otherwise satisfy the gate, including one from a pass run against a different page on another loopback port. This is the same failure as grading a pass against its own claims, one step further out.

**A git commit is deliberately not one of these.** It looked like the obvious way to notice the world moving, and it is the wrong instrument: an unrelated backend merge during a review would void a perfectly good approval, while a token file edited without a commit would slip past it. Hash what the design is actually made of.

**`design.md` is deliberately not one either, and the boundary is worth stating.** These hashes answer one question: is this still the thing the person looked at. `design.md` is not part of what they looked at, it is the rule the prototype was built to follow, so a breakpoint added to it during a review does not make their approval a lie about a different artifact. **It makes the approved prototype stale**, which is a different problem with an answer that already exists: the row moves to `CHANGE REQUIRED` and the prototype gets fixed. Folding that into the session would void approvals for something the session cannot see and cannot judge, and would still not catch it a day later.

### 4. Serve it

`server.mjs` does this, and the rules it holds up are here because they are the reason it is shaped the way it is.

- **Bind to loopback.** Never `0.0.0.0`, and never a public interface. The review page is a local tool and it carries an approval endpoint.
- **Pick open ports dynamically**, and report them, since a fixed port collides on a machine already running the product.
- **Serve the session directory only.** No path outside it is reachable, including the repository.
- **One endpoint that writes anything: the decision endpoint**, which accepts a decision and writes `decision.json` once. It writes nothing else, anywhere, and it refuses a second write, so a session can produce exactly one decision.

### The prototype gets its own origin, and this is not a detail

**A prototype is untrusted code.** It may be derived from HTML a user supplied, which is the one artifact in the project nobody here wrote, and it runs unattended during the capture pass with nobody watching what it does.

On one origin with the review page, a prototype could read that page, lift the session token out of it, and post its own approval before a person ever saw the design. That is not a far fetched attack. It is four lines of JavaScript in a file this workflow deliberately treats as a starting point rather than a reviewed artifact.

**So the session runs two origins from one process.** The review origin serves the review page, the evidence, and the decision endpoint, and never serves the prototype. The prototype origin serves the prototype and whatever it loads, and has no endpoint on it at all.

The decision endpoint then accepts a request only when three things hold, and a prototype can satisfy none of them:

1. **The `Origin` header is exactly the review origin.** A prototype is not on it.
2. **The content type is `application/json`**, so any cross origin attempt needs a preflight, which the server never answers.
3. **The session token matches.** It is generated per session and substituted into the review page as it is served, so it exists nowhere the prototype origin can read.

**The review page frames the prototype sandboxed**, and keeps `allow-same-origin`, which is safe here only because the origins already differ: the frame keeps the prototype origin, so a prototype that wants storage still works and still cannot reach the review page.

**Every response carries a content security policy that permits nothing off origin.** The capture pass aborts external requests outright, and this is the same rule expressed so the person's browser applies it too. Without it a prototype behaves one way while nobody is watching and another way during the review, which is exactly the wrong way round.

**None of this stops the process that started the server.** It holds the filesystem and could write `decision.json` directly. That is the convention above, said plainly.

Serving over HTTP is for the review page and the decision endpoint, which need an origin and a server. **It changes nothing about what a prototype may require.** The rule in `design-direction.md` step 5 still holds in full: every prototype opens on its own from the filesystem, with no install, no build step, no dev server, and no network. A prototype that only works under the review server has failed that rule and is not ready to be reviewed.

### 5. Run the capture pass

This is the automated half, and it is the only thing Playwright does that this skill drives.

Launch a fresh browser context. Never an existing profile, never a signed in one. The prototype runs on fixture data, so there is nothing it should need an identity for, and a review harness that carries the user's real session into an automated context is a way to have a prototype's stray fetch reach something real.

**The session ignores the project's own Playwright configuration, and `capture.mjs` is built so it cannot read one.** It drives the browser through the library API rather than the test runner, so a `playwright.config.ts` sitting in the project is never loaded. That file belongs to the end to end suite `/dev-test` owns: its `baseURL` points at the product's dev server, its projects fan out across engines, and its global setup may sign a user in. Every one of those is wrong here. **A design review drives a prototype on a loopback port with fixture data and no identity**, and inheriting the suite's settings would silently point the capture pass at a running application or hand it a real session.

**Where a project has no Playwright config at all, nothing changes.** The isolation is not a workaround for a conflict, it is the session having its own answer to what browser to launch and where to point it, which it needs whether or not anything else in the project has one.

For the surface under review:

1. **Every breakpoint in `design.md`.** That list is the authority and this counts from it, so a project on four breakpoints captures four without anything here being edited.
2. **Every state in `states`**, meaning the union of the Required states cells of every surface this prototype covers, activated through the state contract in `design-direction.md` step 5, and screenshotted at every breakpoint.
3. **Console messages, uncaught page errors, failed requests, and error responses**, collected throughout into `errors.json`, each tagged with the state and breakpoint it happened in.
4. **Every local file the prototype loaded**, which becomes `dependencyHashes` in the manifest.

**Then write those hashes into the manifest, before anybody is shown anything.** This is a step, not a note. `errors.json` lists what actually loaded, and the manifest was written before the server started, so it necessarily went out with `dependencyHashes` empty. Filling it is the only thing standing between a shared token file changing mid review and nobody noticing.

**An empty `dependencyHashes` beside a non empty `dependencies` list is a failure, not a pass.** Step 7's check would otherwise succeed by having nothing to compare, which is the most convincing kind of wrong. Check the two against each other before the session goes in front of a person, and stop if they disagree.

**The capture pass does not exercise interactions, and that is deliberate rather than missing.** Driving them would need every prototype to declare its buttons and flows in a machine readable contract, which is a second contract to write, keep true, and review, on top of the state one. **The person exercises the interactions**, in the live frame, by clicking the thing they are being asked to approve. That is why the live proposal is the review surface and the screenshots are supporting evidence, and it is the one part of a review a person is strictly better at than a script.

**What the pass owes is the evidence a person cannot gather by clicking**: every breakpoint and every state rendered without them resizing a window thirty times, and the errors a prototype threw while looking perfectly fine.

**Name the limit rather than leaving it implied: an error that only appears when somebody clicks is not in `errors.json`.** The pass loads each state and watches, so it catches what a prototype throws on the way in and misses what it throws on the way through. The live frame is a real browser with a real console, and a person who sees a control misbehave says so in their feedback like any other problem with the design. **The gate is honest about what it checked**, which is the point: it never claims a prototype is clean, only that nothing broke while it was being rendered.

**A prototype must render with no network, so the pass aborts anything off session rather than noting it.** Letting it through would review the design against something that will not be there later, and would let an untrusted prototype talk to whatever it liked while nobody was watching. Each blocked request is recorded, so nothing disappears quietly.

**A state that will not activate is a defect in the proposal, not a note on the review.** Fix the prototype and start the session again. A row cannot honestly reach `READY FOR REVIEW` while a state the registry says it has cannot be reached, and asking a person to approve a surface whose error state nobody has ever seen is asking them to approve a claim rather than a design.

**A state is judged by what came out, never by what the prototype says about itself.** The pass compares the whole document and the screenshot bytes against the default state, and either differing is enough. A prototype reporting its own current state would be reporting rather than demonstrating, which is the same distinction as a skill recording its own approval. `review-harness/README.md` has the mechanics and the one build style that makes the naive version of this check wrong.

**A failed request is a finding whatever else is true.** A prototype has no backend by construction, so anything it tried to fetch and could not is either a leftover from a supplied source file or a dependency this file is not allowed to have.

Close the capture context when the pass finishes. It does not stay open into the next step.

### 6. Hand the review page to a person

The page carries the evidence and the decisions, and it is opened by the person, in their browser.

**It shows:**

- the surface name, the prototype path, the registry status, and the proposal hash it is bound to
- the live proposal in a frame, interactive, at a viewport the person controls, with one control per breakpoint in `design.md`
- one control per state the prototype covers, across every surface it covers
- a full screen control, which hands the whole viewport to the design and hides the panels, and a control that opens the proposal on its own in a new tab
- **the breakpoint controls come from `design.md` and are never a fixed set of devices.** That list is the authority, so a project on two breakpoints or four gets exactly those, and hardcoding a desktop, tablet, and phone here would put a second answer beside the one that governs everything else
- the capture screenshots, and the baseline beside them when a canonical version exists
- every console message, page error, and failed request from `errors.json`, in full and not summarised away

**The live proposal is the review surface. Screenshots are supporting evidence.** A still image cannot answer what happens when you click, and half of every disagreement about a design is about exactly that.

**It offers exactly three decisions: Approve, Request changes, and Reject.** Approve requires the person's name and shows the proposal hash it is approving. Request changes and Reject both require written feedback, because a returned design with no reason is a design that comes back the same.

### What the evidence costs before Approve is available

The capture findings are not decoration beside the decision, so the server sorts them into two kinds and enforces both. The page shows them and the endpoint checks them again, because a gate that only exists in a page is a gate that a reloaded page loses.

| Kind | What happens |
| --- | --- |
| **A state that did not activate** | Approve is refused outright, in the page and at the endpoint |
| **Console errors, page errors, failed requests, error responses, blocked external requests** | Approve needs an explicit acknowledgement naming what was found |
| **Console warnings** | shown, and nothing more |

**A state that did not activate blocks because there is nothing there to approve.** The registry says the surface has that state, and the prototype does not implement it, so the person cannot have looked at it whatever they believe. That is the same claim as the row not being ready for review at all.

**Everything else is acknowledged rather than blocked, and that is a real choice.** A prototype with a noisy console can still be the right design, and only a person can say. Blocking on every finding would make the honest move be to silence the console, which buys nothing and hides the next real error. **Acknowledging is recorded in the decision**, so a later reader can see the design was approved with findings outstanding and what they were.

**A capture pass that never ran blocks too.** No evidence is not clean evidence.

**Then this skill waits.** It does not open the review page, poll the DOM of it, or reach the decision endpoint. It waits for `decision.json` to appear.

**Where the person cannot reach the server**, most often because this session runs somewhere their browser does not, say so plainly and stop. They approve by editing the registry row themselves, which the registry has always permitted, and which needs no new rule and no workaround from you.

### 7. Read the decision, and check it before acting

`decision.json` is read, never written, by this skill.

```json
{
  "decision": "approve",
  "person": "Ian Tumulak",
  "proposalHash": "sha256 the page displayed",
  "evidenceHash": "sha256 of the capture findings the page displayed",
  "acknowledged": true,
  "acknowledgedFindings": ["2 console-error"],
  "feedback": null,
  "decidedAt": "2026-08-13 16:05"
}
```

**`acknowledgedFindings` is what the acknowledgement was about**, and it is in the record rather than only in the session, because the session is deleted and a later reader still needs to know a design was approved with findings outstanding and which ones.

**On Approve, five checks, and every one must pass before a status cell is written:**

1. Recompute the working copy hash. It matches `proposalHash` in the decision.
2. Recompute the canonical file hash. It matches `baselineHash` in the manifest, or both are absent.
3. Recompute every entry in `registryRowHashes`. All match, and no row has appeared or disappeared that points at this prototype.
4. Recompute every entry in `dependencyHashes`. All match, and there is one entry for every path in `errors.json`'s `dependencies`. **An empty map here is a failed check rather than a passed one** whenever the capture pass recorded a dependency.
5. `person` is a name, and it is not a model identifier.

**Any check failing stops the approval.** Say which one failed and what it means: the first says the proposal moved after the person looked at it, the fourth says something it renders with did, and the second and third say the world moved underneath the review. **A row that appeared pointing at this prototype during the review is that same failure**, since it is a surface nobody captured and nobody looked at, about to be stamped `APPROVED` along with the rest. Rebase or regenerate the proposal and run a fresh session. **Never record the approval and note the discrepancy.** A stamp that says a person approved something they did not see is the one failure this whole file exists to prevent.

Then, in this order:

1. Write the working copy to `.konteksto/designs/<slug>.html`, **as a temporary file in that folder followed by a rename**, so a reader never sees a half written prototype and a crash leaves either the old file or the new one.
2. Stamp `APPROVED, <person>, <timestamp>` on every registry row pointing at that file, per the registry's own rules for a shared prototype.
3. Confirm both landed, and report exactly what did if only one did.

**The order matters, and no transaction across the two is needed.** The registry is the authority on whether a design is approved. A file written with no stamp beside it is a file nobody approved, which is a safe and readable state. A stamp with no file behind it is not safe: it claims an approved design that is not there. **Write the file first, always**, and the ordering does the work a rollback would, without a rollback that could itself fail halfway.

**Recovering a half finished promotion is its own procedure, and it is not running the session again.** Once step 1 has landed, the canonical file no longer matches `baselineHash`, so check 2 would fail and a fresh session would refuse the approval that already happened. Say what state it is in, and finish it:

Hash the canonical file, and compare it to both hashes you already hold. There are three outcomes and only two of them are actionable.

| The canonical file matches | Means | Do |
| --- | --- | --- |
| `proposalHash` in `decision.json` | step 1 completed, and the decision still applies to exactly what is on disk | write the stamp, on every row pointing at that file, using the person and timestamp from `decision.json` rather than the current time, since the approval happened when they clicked |
| `baselineHash` in the manifest | step 1 never ran, so the last approved design is still in place and nothing was lost | run a fresh session. Nothing is approved, and nothing needs restoring |
| neither | somebody or something else changed the file | **stop, and say so** |

**The third row is why this is a table and not two lines.** A hash that does not match the proposal does not prove the promotion failed. It equally means the promotion worked and the file was edited afterwards, and those need opposite responses. **Never restore from git to resolve it**, which would discard whatever that edit was, possibly a person's work, to fix a problem you have not identified. Report both hashes, what is actually on disk, and let a person say which it is.

**Keep `decision.json` until this is settled**, which is the one reason to delay a teardown. It is the only record that a person decided, and after step 1 the manifest can no longer prove what they decided about.

**Every decision moves every carried row, not only the one somebody named.** The rows in `registryRowHashes` all point at this prototype, a decision is about the file, and leaving a sibling behind is the same defect whichever way the decision went. An approval that stamped all three and a rejection that moved one would be a registry where two rows still claim a design that was just sent back.

**Re read the registry before any of the three decisions writes anything, and check the current set of rows against `registryRowHashes`.** The approval path already does this as check 3, and the other two need it for the same reason: a review takes as long as a person takes, and the file on disk is not the file the session started with.

| What you find | What it means | Do |
| --- | --- | --- |
| the same rows, unchanged | nothing moved | write the decision to all of them |
| a row that changed | somebody edited it during the review | **stop**, report which row and how, and let a person say which version stands |
| a row that appeared, pointing at this prototype | a surface joined the file mid review | **stop**. On an approval it was never captured or looked at; on a return it is about to be moved by feedback nobody gave about it |
| a row that disappeared | a surface left the file mid review | **stop** and report it, rather than writing to a row that is no longer there |

**Writing from the session's own snapshot without looking would be the same class of mistake this whole file exists to prevent**, one step further out: acting on what was true when you started rather than on what is true when you write.

**On Request changes:** move every carried row to `DRAFT`, put the feedback in each Note column, and leave any blocked task blocked. The next approval attempt needs a new session and a new proposal hash.

**On Reject:** the canonical file is not touched at all. Every carried row goes back to `MISSING` where nothing viable is left and `DRAFT` where something is, and any that was already approved stays at `CHANGE REQUIRED` until a replacement exists. The reason goes in each Note column.

### Where an unapproved revision lives, which is not the session

**The working copy is a copy, so it must not be the only place a revision exists.** Deleting the session with the teardown would otherwise throw away the exact thing the person just asked to have changed, and the feedback would arrive attached to nothing.

**For a new surface, the draft already has a home**: `.konteksto/designs/<slug>.html`, with the row at `DRAFT`. There is no approved file to protect, so the session copies from the canonical path and a non approve decision needs nothing preserved.

**For a revision of an approved surface, the canonical path is holding the last approved design** and must keep holding it. That revision lives at `.konteksto/designs/drafts/<slug>.html`, and the session copies from there. **On Request changes or Reject, write the working copy back to the draft path before teardown.** On Approve, the draft is promoted to the canonical path and the draft file is removed.

That folder is `/dev-design`'s like the rest of `designs/`, it is committed like the rest of it, and `/dev-develop` never reads it: a draft is by definition not the approved design, and the registry row points at the canonical path throughout.

**There is no `REJECTED` status, deliberately.** The Status column describes where the artifact stands, and rejection is a thing that happened to it. Adding one would mix an event into a state column and leave a row parked at a value nothing moves it out of.

### 8. Tear down

**Preserve the revision first**, per Where an unapproved revision lives above. Nothing else in the session is worth keeping.

**Never end a session by signalling a process.** This is the sharp edge of the whole file, and it is the one that can damage something outside the review.

**A stored process id is a number that was true once.** Nothing binds it to the process that answered to it: the server may already have exited, the number may have been reused by something else the machine started since, and neither of those is visible from the file holding it. **A zero or a negative number is worse than a wrong one**, because those are not process ids at all and reach a whole process group. And a kill by number never checks what it is about to stop, so the failure is silent and total: the command reports success either way.

**So the server stops itself, and the whole of teardown is three ordinary file operations:**

1. **Create an empty file named `stop` inside the session directory.** The server checks for it twice a second and exits. Use the ordinary file writing tool rather than a shell command, since there is nothing here that needs a shell.
2. **Wait for `server.json` to disappear.** The server writes it on startup and removes it on the way out, so its absence is the server saying it has gone. Give it a few seconds.
3. **Delete the session directory**, and report where the screenshots were and that they are gone.

**A file named `stop` can only ever affect this session.** It names a directory rather than a number, an unrelated process has no idea it exists, and the worst outcome of getting the path wrong is a file in the wrong folder.

**Two other things end a session, and both mean teardown often has nothing left to stop.** The server exits on its own a few minutes after a decision is recorded, and again after a maximum lifetime, so a review nobody came back to does not leave a server holding a port for the rest of the week. **`server.json` already gone is the normal case, not a problem.**

**The delete has its own two rules, and they exist because a wrong path here removes somebody's work.**

**Never build the path by expanding a variable that could be empty.** An unset or empty variable in a shell turns a delete of one session into a delete of whatever the rest of the path points at, and it does it without an error. Delete the literal path you actually built.

**Check it is a session directory before deleting it.** It contains `manifest.json`, and that manifest's `sessionId` is this session's. Anything else, including a directory that merely has the right name, is not yours to remove: say what you found and stop. **A directory inside the repository is never a session directory** whatever it contains, because the workspace is built outside it.

**A session that ends any other way, including a crash, leaves the registry exactly where it was.** Nothing is half approved, because the only write happens in step 7 and it happens after every check. Sessions are disposable and are not resumed, and a server refuses to serve a session that already recorded a decision for exactly that reason.

---

## Preview and capture failures

Report all of this when the session cannot run, and stop rather than degrading:

- the exact command that failed, and its output
- whether the proposal was generated successfully, which separates a design problem from a tooling one
- what is missing, and the exact command that installs it
- that no review happened, so nothing may be approved from this run

**A preview that would not start is never an approval, and it is never a reason to approve on the strength of reading the file.** The failure is honest and it is fixable in one command. A design blessed without being rendered is neither.
