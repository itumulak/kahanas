# The design review harness

The programs `/dev-design` runs to hold a review session. **`internal/design-review.md` defines the session and the rules.** This file documents the interfaces only, so a session can be driven without reading the code.

| File | Does |
| --- | --- |
| `preflight.mjs` | answers whether a review can run here at all, before one is started |
| `server.mjs` | serves one session on two loopback origins and accepts one decision |
| `capture.mjs` | renders the prototype at every breakpoint and state, and records what it threw |
| `review.html` | the page a person decides in, served by `server.mjs` |
| `resolve-playwright.mjs` | finds the project's Playwright from wherever this harness runs |

**Run them in place and copy nothing.** The session directory holds data; the code stays here.

**Copying breaks it.** Node resolves an import by looking beside the importing file and then upwards, so a copy in a temporary directory has neither its own sibling modules nor a `node_modules` above it.

**Playwright is resolved from a package root passed in, rather than by that upward search**, which is what lets the harness sit outside the project it is reviewing. Two ordinary layouts break the search, in opposite directions: a skill installed for the person lives in the home directory and the walk never enters the project, and a workspace with its npm package one level down puts Playwright below the root rather than above it. `resolve-playwright.mjs` asks that root first and falls back to the ambient search.

**Pass `--project` to both `preflight.mjs` and `capture.mjs`, with the same value.** It defaults to the working directory, which is right whenever the project root is also the package root. The Visual verification section of `tooling.md` records it when they differ.

**Do not regenerate them and do not edit them for one session.** This is the code path that decides whether an approval is genuine, and a file rewritten from memory each time is a file nobody has ever reviewed twice. Where the harness will not do what a session needs, that is a bug to fix here, once, for every project.

---

## The workspace they expect

```text
<system-temp>/kahanas-design-review-<session-id>/
├── prototype/             served on the asset origin, and nothing else is
│   ├── proposal.html      the working copy under review, written by /dev-design
│   ├── baseline.html      the current canonical prototype, when one exists
│   └── <assets>           whatever the prototype loads, copied in beside it
├── manifest.json          written by /dev-design
├── decision.json          written by server.mjs, on the person's click
├── errors.json            written by capture.mjs
├── server.json            written by server.mjs while it runs, removed on exit
├── stop                   created by anybody, to end the session
└── screenshots/           written by capture.mjs
```

Nothing outside this directory is reachable from the session.

## `preflight.mjs`

```bash
node preflight.mjs [--project <package root, default cwd>]
```

Run it before building a session. It settles two of the three facts behind "Playwright is installed", and a project can hold either without the other.

| Exit code | Means |
| --- | --- |
| 0 | the package resolves from this project and its browser launched |
| 64 | bad arguments |
| 69 | no Playwright this harness can reach, and the output names every path it tried |
| 70 | Playwright is here and the browser will not launch, or Node is older than 18 |

**It launches a browser and closes it.** Reading a version string proves a package was unpacked, and a machine that never ran `npx playwright install` passes that check and fails a review.

**The third fact is not checkable here**: whether `tooling.md` names Playwright as this project's visual verification tool. A browser in `node_modules` is not a decision anybody made about how designs get reviewed, so `/dev-design` reads the document that owns that answer and this file says so on the way out.

## `manifest.json`

Written before anything starts. `design-review.md` defines the fields and what the hashes are for. `review.html` reads `surfaces`, `prototypePath`, `status`, `proposalHash`, and `states`.

**`proposalHash` must be a full sha256 hex digest of `prototype/proposal.html`.** The server validates it at startup and exits 65 rather than starting, because a session that cannot bind a decision to a revision is a session whose decisions mean nothing.

**`states` and `breakpoints` are required too**, and they are what the capture pass is graded against. A capture output checked against its own state list would grade its own homework: a pass run with a shorter list covered everything it attempted, and the states the registry requires were never rendered. Missing either exits 65, and so does a breakpoint without a width and a height.

**Breakpoints are compared by name and size together**, since a breakpoint is a size rather than a label and evidence captured at `desktop:320x200` is not evidence about a 1440 wide layout. **The capture output must also name this session's proposal**, or any findings file left in the directory would satisfy the gate, including one from a pass against a different page on another loopback port.

## Running the tests

```bash
npm test
```

`scripts/test-review-harness.mjs` in this repository, not shipped with the skill. Playwright is optional: without it the browser cases are skipped and the server cases still run in full.

```bash
npm run test:browser
```

**The same suite with the skip turned into a failure**, which is what CI runs. A silent skip is right on a contributor's machine and wrong in CI, where it lets a change to the capture pass, the resolver, or the browser path go green without any of them ever running.

## `server.mjs`

```bash
node server.mjs --dir <session directory> [--host 127.0.0.1] \
                [--exit-after-decision <seconds>] [--max-minutes <n>]
```

Prints two lines to parse:

```text
KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/
KAHANAS_ASSET_URL=http://127.0.0.1:<other port>/
```

Both ports are picked open, since a fixed one collides with the product's own dev server. **It refuses to bind anything but loopback**, because the review origin carries an approval endpoint.

**One server per session.** A second one on the same directory exits 65 rather than serving one review on four ports. So does a session that already recorded a decision, since a decision cannot be replaced and the page would only ever be refused.

**The claim is atomic**, taken by creating `server.json` with an exclusive create before any port is bound. Checking whether the file exists and then writing it leaves a window both racers pass: eight simultaneous starts on one directory left four servers running, each believing it was alone. A claim left behind by a crash is reported and never cleaned up automatically, because sessions are disposable and building a fresh one is always available, while deleting a claim that turns out to be live is not undoable.

**Every argument is checked, and a flag with no value is an error rather than a default.** `--project` with nothing after it used to read as "not given" and fall back to the working directory, which is the worst thing that flag can do: the caller said which package root to use, the value went missing in the shell, and the run captured against a different Playwright than it was told to. Exit 64.

### Stopping it, without signalling anything

**Create a file named `stop` in the session directory.** The server checks twice a second and exits. That is the whole procedure, and it needs no process id, no shell, and no signal.

**It also stops on its own, two ways**, so an abandoned review does not leave a server holding a port:

| Flag | Default | Zero means |
| --- | --- | --- |
| `--exit-after-decision` | 300 seconds | stay up after a decision |
| `--max-minutes` | 240 minutes | no maximum lifetime |

`server.json`, written on startup and removed on exit, carries the pid, both origins, and the path of the stop file. **It exists so a caller can tell a live session from a finished one**, not so anybody can signal the pid inside it. **It is removed after both listeners have closed and immediately before the process exits**, so teardown reading its absence as "the server is finished" is reading it correctly. A stored pid is a number that was true once: the process may have exited, and the number may since have been reused by something unrelated. Killing by that number checks nothing and reports success either way.

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

**Approve is gated on the capture evidence, at the endpoint and not only in the page.** A state that did not activate refuses the approval outright with 422. Console errors, page errors, failed requests, error responses, and blocked external requests require `acknowledged: true`, which the page collects with a checkbox naming what was found. Console warnings are shown and gate nothing. A session with no usable `errors.json` is blocked, because no evidence is not clean evidence.

**An approve also carries `evidenceHash`, the digest of `errors.json` as the page displayed it.** An acknowledgement is a statement about specific findings, so a capture pass rerunning between the page loading and the click makes it a statement about findings nobody saw. The endpoint refuses a stale one, and the recorded decision keeps `acknowledgedFindings` so a later reader knows what was outstanding once the session is gone.

The record is written whole and then linked into place. **`link` fails with `EEXIST` atomically**, so two decisions arriving together cannot both win and a reader never sees half a file. Checking that the target exists and then renaming would lose that race, since rename overwrites.

## `capture.mjs`

```bash
node capture.mjs \
  --url http://127.0.0.1:<port>/proposal.html \
  --out <session directory> \
  --states default,submitting,invalid-code \
  --breakpoints desktop:1440x900,tablet:834x1112,phone:390x844 \
  [--project <project root, default cwd>]
```

**On a prototype covering several surfaces, group the states by surface**, since a state is only ever compared with its own surface's:

```bash
  --states "cart:cart-default,cart-error|payment:payment-default,payment-error"
```

States come from `design-registry.md`, in that order. On a prototype covering several surfaces, pass one group per surface, each holding that row's Required states, since one file is approved once and all its rows move together. **Names must still be unique across the whole file**, because one address opens one composition, and duplicates are refused after slugging so `Cart Default` and `cart-default` cannot resolve to the same screenshot. Breakpoints come from `design.md`. Neither is guessed here.

The URL is the **asset origin**, never the review one. Writes `screenshots/<state>__<breakpoint>.png` and `errors.json`.

**It clears both first**, so a renamed or dropped state cannot leave an image of something the proposal no longer does, and a crash partway through cannot pair new screenshots with the last pass's clean findings. `errors.json` is written whole and renamed, so a crash never leaves a partial record for the approval gate to interpret.

**State and breakpoint names are checked before they reach a path.** Both come from documents a person edits, and both name a file, so `../../something` in a registry cell would write outside the session. Unusable names exit 64 rather than being quietly rewritten.

`errors.json` carries the breakpoints, a verdict per state, `dependencies` listing every local file the prototype actually loaded, and every finding tagged with the state and breakpoint it happened in. **`/dev-design` hashes those dependencies into the manifest**, so a shared token file changing during a review invalidates the approval the same way editing the prototype would.

**It does not exercise interactions, deliberately.** Driving them would need a second machine readable contract per prototype on top of the state one. The person exercises them in the live frame, which is the one part of a review a person is strictly better at than a script. `design-review.md` step 5 has the reasoning.

**Anything the prototype requests beyond the session is aborted, not merely logged**, and recorded as `external-request`. A prototype renders with no network by construction, so letting a request through would review the design against something that will not be there later. The server sends a matching content security policy, so the person's browser applies the same rule to the live frame.

| Exit code | Means |
| --- | --- |
| 0 | the pass ran, read `errors.json` for what it found |
| 2 | a declared state did not activate, which is a defect in the prototype |
| 64 | bad arguments, including a URL pointing at the review page |
| 69 | no Playwright this harness can reach, and the output names every path it tried |

**Two rules are enforced in code rather than trusted.**

**It refuses a URL pointing at the review page or the decision endpoint.** The capture pass drives the prototype. A person decides in their own browser. That wall is a convention, and this is the part of it a file can actually hold.

**It imports the Playwright library directly rather than running under the test runner**, so a `playwright.config.ts` in the project is never loaded. That config belongs to the end to end suite `/dev-test` owns, where the base URL points at the product's dev server, the projects fan out across engines, and global setup may sign a user in. Every one of those is wrong for reviewing a prototype on a loopback port with fixture data and no identity. **Never run this file through `npx playwright test`.**

### How a state that did not activate is detected

Two ways a state fails, and both mark it unreachable.

**It never rendered.** Navigation failed at some breakpoint, so there is nothing to look at. **The default state is not exempt**: a proposal whose only state failed to load would otherwise report itself reachable, and be approvable by acknowledging the navigation failure.

**Or it rendered exactly what another declared state rendered.** There is no way to ask a prototype whether it honoured a fragment, and a prototype that reported its own state would be reporting rather than demonstrating, so the pass compares what came out. **Two signals, and either one is enough:** the whole document's markup, and the screenshot bytes.

**A state is compared with the other states of its own surface, and nothing else.** Both wider and narrower are wrong, in opposite directions.

Comparing everything against the first state misses a real defect: on a prototype covering several surfaces the first state belongs to some other surface, so `payment-error` rendering `payment-default` differs from `cart-default` and gets called implemented.

Comparing everything against everything blocks correct work, which is worse. **Two surfaces are allowed to look alike.** A standardised loading screen is deliberately the same screen twice, and refusing `payment-loading` for matching `cart-loading` would reject a prototype that is exactly right, with no way around it.

**Both sides of a collision are reported and neither is blamed.** From outside there is no way to tell which of two identical states was never built, and declaration order is a guess rather than evidence.

**Both are needed, and the markup alone is the trap.** A prototype that switches state by setting an attribute on the html element and letting CSS show and hide is an ordinary way to build one, and its body markup is byte identical in every state. Reading only the body reports a correct prototype as unimplemented and blocks its approval. Reading the whole document catches the attribute, and the screenshot catches anything expressed purely in styling.

**A state that renders the same document and the same pixels as the default at every breakpoint is not a separate state**, so being flagged is the correct outcome there too. A state whose only difference is invisible, in metadata nobody can see, is a state a reviewer cannot review.

**Dynamic content cuts the other way.** A prototype rendering a live timestamp differs from itself on every load, so every state reads as reachable and an unimplemented one would slip through. Prototypes use fixture data for other reasons already, and this is one more.

### Origins are parsed, never prefix matched

`http://127.0.0.1:41655@evil.example/` starts with the asset origin as a string and is a request to `evil.example`. So is `http://127.0.0.1:41655.evil.example/`. Every origin comparison in the harness parses the URL and compares `.origin`, and a prototype can read `location.origin` to build exactly that string, so a prefix test is not a hard case to hit.

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
- signal, stop, or otherwise reach any process other than itself
- install anything, which is `/dev-architect`'s and only `/dev-architect`'s
- survive the session, which `/dev-design` deletes with the directory
