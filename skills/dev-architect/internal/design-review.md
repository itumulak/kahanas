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

Read the Visual verification section of `tooling.md`. It names the tool, the browser, and the commands, and on a project with an `app/` it is required rather than optional.

**On the first run of `/dev-architect`, that file does not exist yet**, since the documents are written after the design work. Use what the stack walk settled and what step 5 of `design-direction.md` had you fill in, and confirm the tool actually runs before the first session rather than discovering it does not halfway through one. Every run after this reads the file.

**No Playwright and no browser means no review, and the correct move is to stop and say so.** Do not open the file and describe it. Do not screenshot it some other way and call it a review. Report exactly what is missing, the command that installs it, and stop, per Preview and capture failures below.

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
├── screenshots/
├── server.mjs             copied from the harness
├── capture.mjs            copied from the harness
└── review.html            copied from the harness
```

**The prototype sits in its own folder because it gets its own origin.** Step 4 says why.

**Nothing in it is committed and nothing in it survives the session.** Screenshots and error logs are diagnostic evidence, not the design. A project that genuinely wants them retained says so in `tooling.md`, which is the one place a policy like that belongs.

**The working copy is a copy.** The canonical file at `.konteksto/designs/<slug>.html` is not served, not opened, and not touched until an approval is recorded. A revision under review must not be able to damage the design that is currently approved, and the simplest way to guarantee that is to never have the canonical path open for writing.

**The three code files are copied from `review-harness/` in this skill's own folder, never written from scratch.** Copy them as they are and pass them arguments. `review-harness/README.md` documents what each one takes.

**Do not regenerate them, and do not improve them in the copy.** They are the part of this session that decides whether an approval is genuine, and a file rewritten from memory each session is a file nobody has ever reviewed twice. A harness that is actually wrong is a bug to fix in this repository, where the fix is read once and then applies to every project. Where the copy will not do what a session needs, say so and stop, rather than patching around it in a temporary directory nobody will ever look at again.

**Copying them is the one place this skill puts code outside `.konteksto/designs/`.** `SKILL.md`'s guardrails carry the exception and its edges. They are session scaffolding, they are thrown away with the directory, and no line of any of them goes near the product.

### 3. Write the manifest

```json
{
  "sessionId": "2026-08-13-account-recovery-01",
  "surfaces": ["Account recovery, step 3"],
  "prototypePath": ".konteksto/designs/account-recovery.html",
  "proposalHash": "sha256 of proposal.html, a full hex digest",
  "baselineHash": "sha256 of the canonical file, or null when none exists",
  "registryRowHash": "sha256 of the registry row text at session start",
  "dependencyHashes": {},
  "states": ["default", "submitting", "invalid-code"],
  "breakpoints": [{ "name": "desktop", "width": 1440, "height": 900 }],
  "createdAt": "2026-08-13 15:30",
  "createdByModel": "claude-opus-5"
}
```

**These hashes are why an approval means one revision and not a moment in time.** The proposal hash says what the person was shown. The baseline hash and the row hash say what the world looked like when they started, so an approval cannot be applied on top of something that moved underneath it. Step 7 checks every one.

**A prototype is not only its own file, and this is the part that is easy to miss.** It loads `shared/tokens.css` on every project, and it may load fonts, images, or another stylesheet. A token file edited during a review changes what the person is looking at while `proposal.html` hashes identically. **So `dependencyHashes` holds one entry per local file the prototype actually loaded**, keyed by its path under `.konteksto/designs/`, and step 7 checks them with the rest.

**Fill it after the capture pass, not before.** `errors.json` carries a `dependencies` list of every local file the prototype really loaded, which is the honest answer and beats parsing the markup for links: it catches what JavaScript fetched and skips what a commented out tag mentions.

**`states` and `breakpoints` say what this surface requires**, taken from the Required states cell and from `design.md`, and the session refuses to start without them. **They are what the capture pass is graded against, and the capture output is never graded against itself.** A pass run with a shorter list covered everything it attempted and would otherwise report itself complete, while the states the registry says the surface has were never rendered at all.

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
2. **Every state in the surface's Required states cell in `design-registry.md`**, activated through the state contract in `design-direction.md` step 5, and screenshotted at every breakpoint.
3. **Console messages, uncaught page errors, failed requests, and error responses**, collected throughout into `errors.json`, each tagged with the state and breakpoint it happened in.
4. **Every local file the prototype loaded**, which becomes `dependencyHashes` in the manifest.

**The capture pass does not exercise interactions, and that is deliberate rather than missing.** Driving them would need every prototype to declare its buttons and flows in a machine readable contract, which is a second contract to write, keep true, and review, on top of the state one. **The person exercises the interactions**, in the live frame, by clicking the thing they are being asked to approve. That is why the live proposal is the review surface and the screenshots are supporting evidence, and it is the one part of a review a person is strictly better at than a script.

**What the pass owes is the evidence a person cannot gather by clicking**: every breakpoint and every state rendered without them resizing a window thirty times, and the errors a prototype threw while looking perfectly fine.

**Name the limit rather than leaving it implied: an error that only appears when somebody clicks is not in `errors.json`.** The pass loads each state and watches, so it catches what a prototype throws on the way in and misses what it throws on the way through. The live frame is a real browser with a real console, and a person who sees a control misbehave says so in their feedback like any other problem with the design. **The gate is honest about what it checked**, which is the point: it never claims a prototype is clean, only that nothing broke while it was being rendered.

**A prototype must render with no network, so the pass aborts anything off session rather than noting it.** Letting it through would review the design against something that will not be there later, and would let an untrusted prototype talk to whatever it liked while nobody was watching. Each blocked request is recorded, so nothing disappears quietly.

**A state that will not activate is a defect in the proposal, not a note on the review.** Fix the prototype and start the session again. A row cannot honestly reach `READY FOR REVIEW` while a state the registry says it has cannot be reached, and asking a person to approve a surface whose error state nobody has ever seen is asking them to approve a claim rather than a design.

**A failed request is a finding whatever else is true.** A prototype has no backend by construction, so anything it tried to fetch and could not is either a leftover from a supplied source file or a dependency this file is not allowed to have.

Close the capture context when the pass finishes. It does not stay open into the next step.

### 6. Hand the review page to a person

The page carries the evidence and the decisions, and it is opened by the person, in their browser.

**It shows:**

- the surface name, the prototype path, the registry status, and the proposal hash it is bound to
- the live proposal in a frame, interactive, at a viewport the person controls, with one control per breakpoint in `design.md`
- one control per state in the Required states cell
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
3. Recompute the registry row hash. It matches `registryRowHash` in the manifest.
4. Recompute every entry in `dependencyHashes`. All match.
5. `person` is a name, and it is not a model identifier.

**Any check failing stops the approval.** Say which one failed and what it means: the first says the proposal moved after the person looked at it, the fourth says something it renders with did, and the second and third say the world moved underneath the review. Rebase or regenerate the proposal and run a fresh session. **Never record the approval and note the discrepancy.** A stamp that says a person approved something they did not see is the one failure this whole file exists to prevent.

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

**On Request changes:** move the row to `DRAFT`, put the feedback in the Note column, and leave any blocked task blocked. The next approval attempt needs a new session and a new proposal hash.

**On Reject:** the canonical file is not touched at all. A new surface goes back to `MISSING` when nothing viable is left and `DRAFT` when something is, and a surface that was already approved stays at `CHANGE REQUIRED` until a replacement exists. The reason goes in the Note column.

### Where an unapproved revision lives, which is not the session

**The working copy is a copy, so it must not be the only place a revision exists.** Deleting the session with the teardown would otherwise throw away the exact thing the person just asked to have changed, and the feedback would arrive attached to nothing.

**For a new surface, the draft already has a home**: `.konteksto/designs/<slug>.html`, with the row at `DRAFT`. There is no approved file to protect, so the session copies from the canonical path and a non approve decision needs nothing preserved.

**For a revision of an approved surface, the canonical path is holding the last approved design** and must keep holding it. That revision lives at `.konteksto/designs/drafts/<slug>.html`, and the session copies from there. **On Request changes or Reject, write the working copy back to the draft path before teardown.** On Approve, the draft is promoted to the canonical path and the draft file is removed.

That folder is `/dev-architect`'s like the rest of `designs/`, it is committed like the rest of it, and `/dev-develop` never reads it: a draft is by definition not the approved design, and the registry row points at the canonical path throughout.

**There is no `REJECTED` status, deliberately.** The Status column describes where the artifact stands, and rejection is a thing that happened to it. Adding one would mix an event into a state column and leave a row parked at a value nothing moves it out of.

### 8. Tear down

**Preserve the revision first**, per Where an unapproved revision lives above. Nothing else in the session is worth keeping.

Then stop both servers, close every browser context, and delete the session directory. Report where the screenshots were, and that they are gone.

**A session that ends any other way, including a crash, leaves the registry exactly where it was.** Nothing is half approved, because the only write happens in step 7 and it happens after every check. Sessions are disposable and are not resumed.

---

## Preview and capture failures

Report all of this when the session cannot run, and stop rather than degrading:

- the exact command that failed, and its output
- whether the proposal was generated successfully, which separates a design problem from a tooling one
- what is missing, and the exact command that installs it
- that no review happened, so nothing may be approved from this run

**A preview that would not start is never an approval, and it is never a reason to approve on the strength of reading the file.** The failure is honest and it is fixable in one command. A design blessed without being rendered is neither.
