# The design review harness

Three files `/dev-architect` copies into a review session workspace and runs. **`internal/design-review.md` defines the session and the rules.** This file documents the interfaces only, so a session can be driven without reading the code.

**Copy them as they are.** Do not regenerate them, and do not improve them in the copy. This is the code path that decides whether an approval is genuine, and a file rewritten from memory each session is a file nobody has ever reviewed twice. Where the harness will not do what a session needs, that is a bug to fix here, once, for every project.

---

## The workspace they expect

```text
<system-temp>/kahanas-design-review-<session-id>/
├── prototype/             served on the asset origin, and nothing else is
│   ├── proposal.html      the working copy under review, written by /dev-architect
│   ├── baseline.html      the current canonical prototype, when one exists
│   └── <assets>           whatever the prototype loads, copied in beside it
├── manifest.json          written by /dev-architect
├── decision.json          written by server.mjs, on the person's click
├── errors.json            written by capture.mjs
├── screenshots/           written by capture.mjs
├── server.mjs             copied
├── capture.mjs            copied
└── review.html            copied
```

Nothing outside this directory is reachable from the session.

## `manifest.json`

Written before anything starts. `design-review.md` defines the fields and what the hashes are for. `review.html` reads `surfaces`, `prototypePath`, `status`, `proposalHash`, and `states`.

**`proposalHash` must be a full sha256 hex digest of `prototype/proposal.html`.** The server validates it at startup and exits 65 rather than starting, because a session that cannot bind a decision to a revision is a session whose decisions mean nothing.

## `server.mjs`

```bash
node server.mjs --dir <session directory> [--host 127.0.0.1]
```

Prints two lines to parse:

```text
KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/
KAHANAS_ASSET_URL=http://127.0.0.1:<other port>/
```

Both ports are picked open, since a fixed one collides with the product's own dev server. **It refuses to bind anything but loopback**, because the review origin carries an approval endpoint.

### Two origins

A prototype is untrusted code: it may be derived from HTML a user supplied, and it runs unattended during the capture pass. On one origin it could read the review page, lift the session token, and approve itself before anybody saw the design.

| Origin | Serves | Has an API |
| --- | --- | --- |
| review | `review.html`, `screenshots/`, `errors.json`, `manifest.json` | yes |
| asset | `prototype/` and nothing else | no |

The review origin returns 404 for any path under `/prototype`, so the split cannot be undone by asking for it the other way.

| Route, review origin | Method | Does |
| --- | --- | --- |
| `/` | GET | serves `review.html`, with the token and asset origin substituted in |
| `/api/session` | GET | the manifest, capture findings, screenshots, asset origin, approval gate, and any decision already made |
| `/api/decision` | POST | writes `decision.json`, once |
| anything else | GET | serves that file from the session directory, 403 outside it |

### What the decision endpoint requires

**All three, and a prototype can satisfy none of them:**

1. `Origin` exactly the review origin.
2. `content-type: application/json`, so a cross origin attempt needs a preflight the server never answers.
3. `x-kahanas-token` matching the token generated at startup and substituted into `review.html` as it is served.

Then the payload itself: a known decision, a name on approve, feedback on anything else, and a `proposalHash` equal to the manifest's. **The hash is not optional**, which is what stops a page left open from an earlier session deciding this one.

**Approve is gated on the capture evidence, at the endpoint and not only in the page.** A state that did not activate refuses the approval outright with 422. Console errors, page errors, failed requests, error responses, and blocked external requests require `acknowledged: true`, which the page collects with a checkbox naming what was found. Console warnings are shown and gate nothing. A session with no `errors.json` at all is blocked, because no evidence is not clean evidence.

The write is staged to a temporary file and renamed, and refuses when `decision.json` already exists, so a session produces exactly one decision and a reader never sees half of it.

## `capture.mjs`

```bash
node capture.mjs \
  --url http://127.0.0.1:<port>/proposal.html \
  --out <session directory> \
  --states default,submitting,invalid-code \
  --breakpoints desktop:1440x900,tablet:834x1112,phone:390x844
```

States come from the surface's Required states cell in `design-registry.md`, in that order, **default first**. Breakpoints come from `design.md`. Neither is guessed here.

The URL is the **asset origin**, never the review one. Writes `screenshots/<state>__<breakpoint>.png` and `errors.json`, and clears `screenshots/` first so a renamed or dropped state cannot leave an image of something the proposal no longer does.

`errors.json` carries the breakpoints, a verdict per state, `dependencies` listing every local file the prototype actually loaded, and every finding tagged with the state and breakpoint it happened in. **`/dev-architect` hashes those dependencies into the manifest**, so a shared token file changing during a review invalidates the approval the same way editing the prototype would.

**It does not exercise interactions, deliberately.** Driving them would need a second machine readable contract per prototype on top of the state one. The person exercises them in the live frame, which is the one part of a review a person is strictly better at than a script. `design-review.md` step 5 has the reasoning.

**Anything the prototype requests beyond the session is aborted, not merely logged**, and recorded as `external-request`. A prototype renders with no network by construction, so letting a request through would review the design against something that will not be there later. The server sends a matching content security policy, so the person's browser applies the same rule to the live frame.

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
