# The design review harness

Three files `/dev-architect` copies into a review session workspace and runs. **`internal/design-review.md` defines the session and the rules.** This file documents the interfaces only, so a session can be driven without reading the code.

**Copy them as they are.** Do not regenerate them, and do not improve them in the copy. This is the code path that decides whether an approval is genuine, and a file rewritten from memory each session is a file nobody has ever reviewed twice. Where the harness will not do what a session needs, that is a bug to fix here, once, for every project.

---

## The workspace they expect

```text
<system-temp>/kahanas-design-review-<session-id>/
├── proposal.html          the working copy under review, written by /dev-architect
├── baseline.html          the current canonical prototype, when one exists
├── manifest.json          written by /dev-architect
├── decision.json          written by server.mjs, on the person's click
├── errors.json            written by capture.mjs
├── screenshots/           written by capture.mjs
├── server.mjs             copied
├── capture.mjs            copied
└── review.html            copied
```

Any asset a prototype loads relatively goes in beside it. Nothing outside this directory is reachable from the session.

## `manifest.json`

Written before anything starts. `design-review.md` defines the fields and what the hashes are for. `review.html` reads `surfaces`, `prototypePath`, `status`, `proposalHash`, and `states`.

## `server.mjs`

```bash
node server.mjs --dir <session directory> [--host 127.0.0.1] [--port 0]
```

Prints `KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/` on startup, which is the line to parse. Port `0` picks an open one, which is the default and the right choice, since a fixed port collides with the product's own dev server.

**It refuses to bind anything but loopback.** The review page carries an approval endpoint, and binding it anywhere reachable puts a write endpoint for a design decision on the network.

| Route | Method | Does |
| --- | --- | --- |
| `/` | GET | serves `review.html` |
| `/api/session` | GET | the manifest, the capture findings, the screenshot list, whether a baseline exists, and whether a decision was already recorded |
| `/api/decision` | POST | writes `decision.json`, once |
| anything else | GET | serves that file from the session directory, and 403 for anything resolving outside it |

**The decision endpoint is the only thing in the harness that writes.** It writes with the `wx` flag, so a second decision fails on the filesystem rather than on a check that could be raced. It rejects an approve with no name, a request changes or reject with no feedback, and any decision carrying a proposal hash the manifest does not hold, which is what stops a page left open from an earlier session deciding this one.

## `capture.mjs`

```bash
node capture.mjs \
  --url http://127.0.0.1:<port>/proposal.html \
  --out <session directory> \
  --states default,submitting,invalid-code \
  --breakpoints desktop:1440x900,tablet:834x1112,phone:390x844
```

States come from the surface's Required states cell in `design-registry.md`, in that order, **default first**. Breakpoints come from `design.md`. Neither is guessed here.

Writes `screenshots/<state>__<breakpoint>.png` and `errors.json`.

| Exit code | Means |
| --- | --- |
| 0 | the pass ran, read `errors.json` for what it found |
| 2 | a declared state did not activate, which is a defect in the prototype |
| 64 | bad arguments, including a URL pointing at the review page |
| 69 | Playwright is not installed |

**Two rules are enforced in code rather than trusted.**

**It refuses a URL pointing at the review page or the decision endpoint.** The capture pass drives the prototype. A person decides in their own browser. That wall is a convention, and this is the part of it a file can actually hold.

**It imports the Playwright library directly rather than running under the test runner**, so a `playwright.config.ts` in the project is never loaded. That config belongs to the end to end suite `/dev-test` owns, where the base URL points at the product's dev server, the projects fan out across engines, and global setup may sign a user in. Every one of those is wrong for reviewing a prototype on a loopback port with fixture data and no identity. **Never run this file through `npx playwright test`.**

### How a state that did not activate is detected

There is no way to ask a prototype whether it honoured a fragment, so the pass compares what rendered. Each state's body markup is hashed at each breakpoint, and a state whose hash matches the default state's at every breakpoint did not activate: the fragment changed nothing.

**A state that legitimately renders exactly like the default is not a separate state**, so being flagged is the correct outcome there too.

## `review.html`

Served at `/`. Reads everything from `/api/session`, so it needs no arguments and no build step.

| Control | Does |
| --- | --- |
| Breakpoint | resizes the frame, **one button per breakpoint the capture pass recorded**, which came from `design.md` |
| State | reloads the frame at `#state=<name>`, one button per declared state |
| Compare with approved | shows `baseline.html` beside the proposal, only when a baseline exists |
| Full screen | hands the viewport to the design and hides the panels, keeping the controls |
| Open in a new tab | the proposal alone, at native size, at the state currently selected |
| Reload | reloads the frame, for a prototype whose state is stateful |

**The breakpoint buttons are never a fixed device list.** `design.md` is the authority on breakpoints, so a project defining two or four gets exactly those. Hardcoding a desktop, tablet, and phone here would put a second answer beside the one every other rule counts from.

**Full screen keeps the frame at its breakpoint size rather than scaling it to fit.** A scaled prototype is no longer being reviewed at the width it was composed for, and a person approving a phone layout needs to see it at phone width.

## What the harness never does

- decide anything, or write to `design-registry.md`, or touch `.konteksto/` at all
- read or write anything outside the session directory
- open a browser profile that exists, or one that is signed in
- survive the session, which `/dev-architect` deletes with the directory
