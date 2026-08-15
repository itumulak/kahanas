#!/usr/bin/env node
// Regression suite for the design review harness.
//
//   node scripts/test-review-harness.mjs
//
// Lives here rather than beside the harness because the harness is installed
// into other people's projects and a test file would go with it.
//
// Playwright is optional. Without it the capture pass tests are skipped and the
// server tests still run in full, so this is worth running on any machine.
//
// Every case here is a bug that was found in review and fixed. A suite of the
// mistakes actually made beats a suite of the mistakes imagined.

import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { Agent, get } from "node:http";

const HARNESS = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "dev-design", "review-harness");

let passed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`  ok   ${name}\n`);
  } catch (err) {
    failures.push({ name, message: err.message });
    process.stdout.write(`  FAIL ${name}\n       ${err.message}\n`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function equal(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: expected ${expected}, got ${actual}`);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

// A session workspace with a working prototype, ready to be broken per test.
async function makeSession({ states = ["default", "empty"], breakpoints = [{ name: "desktop", width: 800, height: 600 }], prototype, manifest: manifestOverrides = {} } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "kahanas-harness-test-"));
  await mkdir(join(dir, "prototype"), { recursive: true });
  await mkdir(join(dir, "screenshots"), { recursive: true });

  const html = prototype ?? `<!doctype html><html><head><meta charset="utf-8"><title>T</title></head><body>
<h1>Surface</h1><div id="default"><p>Default.</p></div><div id="empty" hidden><p>Empty.</p></div>
<script>
var s=(location.hash.match(/state=([\\w-]+)/)||[,'default'])[1];
if(s==='empty'){document.getElementById('empty').hidden=false;document.getElementById('default').hidden=true;}
</script></body></html>`;
  await writeFile(join(dir, "prototype", "proposal.html"), html);

  // Nothing from the harness is copied. It runs in place out of the skill folder,
  // which is what a real session does and what lets Playwright resolve.

  await writeFile(
    join(dir, "manifest.json"),
    JSON.stringify({
      sessionId: "test",
      surfaces: ["Test surface"],
      prototypePath: ".konteksto/designs/test.html",
      status: "READY FOR REVIEW",
      proposalHash: sha256(html),
      states,
      breakpoints,
      ...manifestOverrides,
    })
  );

  return { dir, html, states, breakpoints };
}

// A clean capture output, as capture.mjs would have written it.
async function writeEvidence(session, server, { states, breakpoints, findings = [], url } = {}) {
  const s = states ?? session.states;
  const b = breakpoints ?? session.breakpoints;
  await writeFile(
    join(session.dir, "errors.json"),
    JSON.stringify({
      capturedAt: new Date().toISOString(),
      url: url ?? `${server.asset}/proposal.html`,
      breakpoints: b,
      states: s.map((name) => ({ state: name, activated: true, note: null })),
      dependencies: ["/proposal.html"],
      findings,
    })
  );
  for (const state of s) {
    for (const bp of b) {
      await writeFile(join(session.dir, "screenshots", `${state}__${bp.name}.png`), "x");
    }
  }
}

function run(file, args, cwd) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [file, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => done({ code, out, err }));
  });
}

// Every server this suite starts, so a failed assertion before stop() cannot
// leave a child holding a port and hang the run at exactly the moment it is
// reporting a regression.
const running = new Set();
function stopEverything() {
  for (const child of running) {
    try {
      child.kill();
    } catch {}
  }
  running.clear();
}
process.on("exit", stopEverything);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopEverything();
    process.exit(130);
  });
}

// Start a session server and return its two origins plus the page token.
async function startServer(dir, extraArgs = []) {
  const child = spawn(process.execPath, [join(HARNESS, "server.mjs"), "--dir", dir, ...extraArgs], {
    cwd: dir,
    stdio: ["ignore", "pipe", "pipe"],
  });
  running.add(child);
  let out = "";
  let err = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (err += d));

  const started = Date.now();
  while (Date.now() - started < 5000) {
    if (/KAHANAS_ASSET_URL=/.test(out)) break;
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}: ${err.trim()}`);
    await new Promise((r) => setTimeout(r, 40));
  }
  if (!/KAHANAS_ASSET_URL=/.test(out)) {
    child.kill();
    throw new Error(`server did not start: ${err.trim() || out.trim()}`);
  }

  const review = out.match(/KAHANAS_REVIEW_URL=(\S+)/)[1].replace(/\/$/, "");
  const asset = out.match(/KAHANAS_ASSET_URL=(\S+)/)[1].replace(/\/$/, "");
  const page = await (await fetch(review + "/")).text();
  const token = page.match(/const TOKEN = "([^"]+)"/)?.[1];

  return {
    child,
    review,
    asset,
    token,
    stop: () => {
      child.kill();
      running.delete(child);
    },
  };
}

function decide(server, body, headers = {}) {
  return fetch(server.review + "/api/decision", {
    method: "POST",
    headers: {
      origin: server.review,
      "content-type": "application/json",
      "x-kahanas-token": server.token,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const cleanups = [];

// ---------------------------------------------------------------- server start

process.stdout.write("\nstartup validation\n");

for (const [name, overrides] of [
  ["a missing proposal hash is refused", { proposalHash: undefined }],
  ["a short proposal hash is refused", { proposalHash: "abc" }],
  ["missing required states are refused", { states: [] }],
  ["missing required breakpoints are refused", { breakpoints: [] }],
  ["a nameless breakpoint is refused", { breakpoints: [{ width: 1, height: 1 }] }],
  ["a breakpoint with no dimensions is refused", { breakpoints: [{ name: "desktop" }] }],
]) {
  await check(name, async () => {
    const session = await makeSession({ manifest: overrides });
    cleanups.push(session.dir);
    const result = await run(join(HARNESS, "server.mjs"), ["--dir", session.dir], session.dir);
    equal(result.code, 65, "exit code");
  });
}

await check("a non loopback bind is refused", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const result = await run(
    join(HARNESS, "server.mjs"),
    ["--dir", session.dir, "--host", "0.0.0.0"],
    session.dir
  );
  equal(result.code, 64, "exit code");
});

// ------------------------------------------------------------- endpoint guards

process.stdout.write("\ndecision endpoint guards\n");

{
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server);
  const hash = sha256(session.html);
  const evidenceHash = sha256(await readFile(join(session.dir, "errors.json")));

  await check("a decision with no origin is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", proposalHash: hash }, { origin: undefined });
    equal(res.status, 403, "status");
  });

  await check("a decision from another origin is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", proposalHash: hash }, { origin: server.asset });
    equal(res.status, 403, "status");
  });

  await check("a non json content type is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", proposalHash: hash }, { "content-type": "text/plain" });
    equal(res.status, 415, "status");
  });

  await check("a wrong token is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", proposalHash: hash }, { "x-kahanas-token": "nope" });
    equal(res.status, 403, "status");
  });

  await check("an unknown decision is refused", async () => {
    const res = await decide(server, { decision: "maybe", proposalHash: hash });
    equal(res.status, 400, "status");
  });

  await check("approve with no name is refused", async () => {
    const res = await decide(server, { decision: "approve", proposalHash: hash, evidenceHash });
    equal(res.status, 400, "status");
  });

  await check("request changes with no feedback is refused", async () => {
    const res = await decide(server, { decision: "request-changes", proposalHash: hash });
    equal(res.status, 400, "status");
  });

  await check("a missing proposal hash is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", evidenceHash });
    equal(res.status, 409, "status");
  });

  await check("a stale evidence hash is refused", async () => {
    const res = await decide(server, { decision: "approve", person: "P", proposalHash: hash, evidenceHash: sha256("other") });
    equal(res.status, 409, "status");
  });

  await check("the review origin does not serve the prototype", async () => {
    equal((await fetch(server.review + "/prototype/proposal.html")).status, 404, "status");
  });

  await check("the asset origin has no api", async () => {
    equal((await fetch(server.asset + "/api/session")).status, 404, "status");
  });

  await check("a traversal path is refused", async () => {
    equal((await fetch(server.review + "/%2e%2e%2f%2e%2e%2fetc%2fpasswd")).status, 403, "status");
  });

  await check("the review page frames the asset origin", async () => {
    const res = await fetch(server.review + "/");
    assert(res.headers.get("content-security-policy").includes(`frame-src ${server.asset}`), "frame-src missing the asset origin");
  });

  server.stop();
}

// ---------------------------------------------------------------- the approval gate

process.stdout.write("\napproval gate\n");

async function gateOf(server) {
  return (await (await fetch(server.review + "/api/session")).json()).gate;
}

await check("no capture pass blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  const gate = await gateOf(server);
  server.stop();
  equal(gate.blockers.length, 1, "blocker count");
});

await check("an empty capture output blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeFile(join(session.dir, "errors.json"), "{}");
  const gate = await gateOf(server);
  server.stop();
  assert(gate.blockers.length > 0, "expected a blocker");
});

await check("a short capture pass cannot grade itself complete", async () => {
  const session = await makeSession({ states: ["default", "empty"] });
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { states: ["default"] });
  const gate = await gateOf(server);
  server.stop();
  assert(gate.blockers.some((b) => b.includes("empty")), `expected the missing state named, got ${JSON.stringify(gate.blockers)}`);
});

await check("a missing breakpoint blocks approval", async () => {
  const session = await makeSession({
    breakpoints: [{ name: "desktop", width: 800, height: 600 }, { name: "phone", width: 390, height: 844 }],
  });
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { breakpoints: [{ name: "desktop", width: 800, height: 600 }] });
  const gate = await gateOf(server);
  server.stop();
  assert(gate.blockers.some((b) => b.includes("phone")), `expected phone named, got ${JSON.stringify(gate.blockers)}`);
});

await check("a breakpoint captured at the wrong size blocks approval", async () => {
  const session = await makeSession({ breakpoints: [{ name: "desktop", width: 1440, height: 900 }] });
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { breakpoints: [{ name: "desktop", width: 320, height: 200 }] });
  const gate = await gateOf(server);
  server.stop();
  assert(
    gate.blockers.some((b) => b.includes("1440x900")),
    `expected the required size named, got ${JSON.stringify(gate.blockers)}`
  );
});

await check("evidence from another page blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { url: "http://127.0.0.1:9/proposal.html" });
  const gate = await gateOf(server);
  server.stop();
  assert(
    gate.blockers.some((b) => b.includes("not this session's proposal")),
    `expected the foreign capture named, got ${JSON.stringify(gate.blockers)}`
  );
});

await check("evidence naming another page of this session blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { url: `${server.asset}/baseline.html` });
  const gate = await gateOf(server);
  server.stop();
  assert(gate.blockers.length > 0, "expected a blocker");
});

await check("a missing screenshot blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server);
  await rm(join(session.dir, "screenshots", "empty__desktop.png"));
  const gate = await gateOf(server);
  server.stop();
  assert(gate.blockers.some((b) => b.includes("empty__desktop.png")), `expected the screenshot named, got ${JSON.stringify(gate.blockers)}`);
});

await check("a state that did not activate blocks approval", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server);
  const evidence = JSON.parse(await readFile(join(session.dir, "errors.json"), "utf8"));
  evidence.states[1].activated = false;
  evidence.states[1].note = "did not render at desktop";
  await writeFile(join(session.dir, "errors.json"), JSON.stringify(evidence));
  const gate = await gateOf(server);
  const res = await decide(server, {
    decision: "approve",
    person: "P",
    acknowledged: true,
    proposalHash: sha256(session.html),
    evidenceHash: sha256(await readFile(join(session.dir, "errors.json"))),
  });
  server.stop();
  assert(gate.blockers.length > 0, "expected a blocker");
  equal(res.status, 422, "approve status");
});

await check("findings require an acknowledgement, and it is recorded", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, {
    findings: [
      { kind: "console-error", state: "default", breakpoint: "desktop", message: "boom" },
      { kind: "console-error", state: "empty", breakpoint: "desktop", message: "boom" },
    ],
  });
  const body = {
    decision: "approve",
    person: "Ian Tumulak",
    proposalHash: sha256(session.html),
    evidenceHash: sha256(await readFile(join(session.dir, "errors.json"))),
  };

  const refused = await decide(server, body);
  equal(refused.status, 422, "unacknowledged status");

  const accepted = await decide(server, { ...body, acknowledged: true });
  equal(accepted.status, 201, "acknowledged status");
  server.stop();

  const record = JSON.parse(await readFile(join(session.dir, "decision.json"), "utf8"));
  equal(record.acknowledgedFindings?.[0], "2 console-error", "recorded findings");
  equal(record.person, "Ian Tumulak", "recorded person");
});

await check("a console warning alone gates nothing", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server, { findings: [{ kind: "console-warning", message: "meh" }] });
  const gate = await gateOf(server);
  server.stop();
  equal(gate.blockers.length, 0, "blockers");
  equal(gate.warnings.length, 0, "warnings");
});

// ------------------------------------------------------------------ one decision

process.stdout.write("\none decision per session\n");

await check("twenty concurrent approvals record exactly one", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeEvidence(session, server);
  const body = {
    decision: "approve",
    proposalHash: sha256(session.html),
    evidenceHash: sha256(await readFile(join(session.dir, "errors.json"))),
  };

  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => decide(server, { ...body, person: `P${i}` }).then((r) => r.status))
  );
  server.stop();

  equal(results.filter((s) => s === 201).length, 1, "accepted");
  equal(results.filter((s) => s === 409).length, 19, "refused");

  const record = JSON.parse(await readFile(join(session.dir, "decision.json"), "utf8"));
  assert(/^P\d+$/.test(record.person), `decision.json holds ${record.person}`);
});

// -------------------------------------------------------------------- preflight

// Whether a review can run at all, which is three facts and not one. These cases
// are the two this harness can settle; tooling.md settles the third.

process.stdout.write("\npreflight\n");

await check("Playwright is resolved from the project, not from beside the harness", async () => {
  // The failure this reproduces: the skill installed for the person rather than
  // the project, so the upward search walks ~/.claude and never enters the
  // project that has Playwright installed.
  const project = await mkdtemp(join(tmpdir(), "kahanas-fake-project-"));
  cleanups.push(project);
  await mkdir(join(project, "node_modules", "playwright"), { recursive: true });
  await writeFile(
    join(project, "node_modules", "playwright", "package.json"),
    JSON.stringify({ name: "playwright", version: "0.0.0-test", main: "index.js" })
  );
  await writeFile(
    join(project, "node_modules", "playwright", "index.js"),
    "module.exports = { chromium: { marker: 'from the project' } };"
  );

  const { loadChromium } = await import(join(HARNESS, "resolve-playwright.mjs"));
  const found = await loadChromium(project);
  equal(found.package, "playwright", "package");
  assert(found.from.startsWith(project), `resolved ${found.from}, which is outside ${project}`);
  equal(found.chromium.marker, "from the project", "module");
});

await check("an unreachable Playwright names every place it looked", async () => {
  const empty = await mkdtemp(join(tmpdir(), "kahanas-empty-project-"));
  cleanups.push(empty);
  const { loadChromium, missingPlaywrightMessage } = await import(
    join(HARNESS, "resolve-playwright.mjs")
  );
  let message = null;
  try {
    // Resolution walks upward from the given root, so a temporary directory is
    // only empty if nothing above it has Playwright either. On a machine where
    // it does, this case has nothing to prove and passes trivially.
    await loadChromium(empty);
  } catch (err) {
    message = missingPlaywrightMessage(err, empty);
  }
  if (message === null) return;
  assert(message.includes(empty), "the message does not say which package root it searched");
  assert(message.includes("/dev-architect"), "the message does not route the install anywhere");
  assert(message.includes("--project"), "the message does not cover a package below the root");
});

await check("preflight reports one of its three answers, and says which", async () => {
  const result = await run(join(HARNESS, "preflight.mjs"), [], process.cwd());
  const output = `${result.out}${result.err}`;
  if (result.code === 0) {
    assert(/KAHANAS_PREFLIGHT=ok/.test(result.out), `a pass without its marker: ${output}`);
    assert(/KAHANAS_BROWSER=chromium /.test(result.out), "a pass that never launched a browser");
  } else if (result.code === 69) {
    assert(/Package root searched/.test(result.err), `69 without a searched root: ${output}`);
    assert(/--project/.test(result.err), "69 without the answer for a package below the root");
  } else if (result.code === 70) {
    assert(/browser|Node/.test(result.err), `70 without a reason: ${output}`);
  } else {
    throw new Error(`preflight exited ${result.code}, which is not one of its answers: ${output}`);
  }
});

// --------------------------------------------------------------------- stopping

// A session that has to be killed is a session somebody kills wrongly. Every
// case here is a way this server ends without anybody signalling a pid.

process.stdout.write("\nstopping a session\n");

function waitForExit(child, ms = 8000) {
  return new Promise((done, fail) => {
    if (child.exitCode !== null) return done(child.exitCode);
    const timer = setTimeout(() => fail(new Error(`still running after ${ms}ms`)), ms);
    child.on("close", (code) => {
      clearTimeout(timer);
      done(code);
    });
  });
}

await check("it publishes its pid and origins, and removes the file on the way out", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);

  const published = JSON.parse(await readFile(join(session.dir, "server.json"), "utf8"));
  equal(published.pid, server.child.pid, "pid");
  equal(published.reviewUrl, `${server.review}/`, "review url");
  equal(published.assetUrl, `${server.asset}/`, "asset url");

  await writeFile(join(session.dir, "stop"), "");
  await waitForExit(server.child);
  assert(
    !(await readFile(join(session.dir, "server.json")).catch(() => null)),
    "server.json outlived the server"
  );
});

await check("a stop file ends it, with no signal sent", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  await writeFile(join(session.dir, "stop"), "");
  equal(await waitForExit(server.child), 0, "exit code");
});

await check("a recorded decision ends it on its own", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir, ["--exit-after-decision", "1"]);
  await writeEvidence(session, server);
  const res = await decide(server, {
    decision: "approve",
    person: "P",
    proposalHash: sha256(session.html),
    evidenceHash: sha256(await readFile(join(session.dir, "errors.json"))),
  });
  equal(res.status, 201, "status");
  equal(await waitForExit(server.child), 0, "exit code");
});

await check("the lifetime cap ends an abandoned session", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  // A hundredth of a minute, which is the same code path a four hour cap takes.
  const server = await startServer(session.dir, ["--max-minutes", "0.01"]);
  equal(await waitForExit(server.child), 0, "exit code");
});

await check("zero means never, so a decision leaves it running", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir, ["--exit-after-decision", "0"]);
  await writeEvidence(session, server);
  const res = await decide(server, {
    decision: "approve",
    person: "P",
    proposalHash: sha256(session.html),
    evidenceHash: sha256(await readFile(join(session.dir, "errors.json"))),
  });
  equal(res.status, 201, "status");
  await new Promise((r) => setTimeout(r, 1200));
  equal(server.child.exitCode, null, "exit code");
  server.stop();
});

await check("a second server on one session is refused", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);
  const result = await run(join(HARNESS, "server.mjs"), ["--dir", session.dir], session.dir);
  equal(result.code, 65, "exit code");
  assert(/already running/.test(result.err), `error said: ${result.err.trim()}`);
  server.stop();
});

await check("eight simultaneous starts leave exactly one server", async () => {
  // Reading server.json and then writing it passed this with four survivors:
  // every racer read the file before any of them had written it. The claim is
  // taken with an atomic create, so the filesystem picks one winner.
  const session = await makeSession();
  cleanups.push(session.dir);

  const children = Array.from({ length: 8 }, () =>
    spawn(process.execPath, [join(HARNESS, "server.mjs"), "--dir", session.dir], {
      cwd: session.dir,
      stdio: ["ignore", "pipe", "pipe"],
    })
  );
  for (const child of children) running.add(child);

  const outputs = children.map(() => ({ out: "", err: "" }));
  children.forEach((child, i) => {
    child.stdout.on("data", (d) => (outputs[i].out += d));
    child.stderr.on("data", (d) => (outputs[i].err += d));
  });

  const settled = await Promise.all(
    children.map(
      (child, i) =>
        new Promise((done) => {
          const timer = setInterval(() => {
            if (/KAHANAS_ASSET_URL=/.test(outputs[i].out)) {
              clearInterval(timer);
              done("started");
            }
          }, 30);
          child.on("close", () => {
            clearInterval(timer);
            done("exited");
          });
          setTimeout(() => {
            clearInterval(timer);
            done(/KAHANAS_ASSET_URL=/.test(outputs[i].out) ? "started" : "exited");
          }, 6000);
        })
    )
  );

  const started = settled.filter((s) => s === "started").length;
  for (const child of children) {
    child.kill();
    running.delete(child);
  }
  equal(started, 1, "servers that started");

  const refused = outputs.filter((o) => /already running|is already there/.test(o.err)).length;
  equal(refused, 7, "starts refused with a reason");
});

await check("nothing is serving once the marker is gone", async () => {
  // Teardown reads server.json disappearing as the server being finished, so
  // this guards that meaning: keep alive sockets held open, stop, and the
  // origin must be dead the moment the marker vanishes.
  //
  // **It does not by itself catch the ordering it was written for.** Removing
  // the marker before closing also passes, because close stops accepting
  // immediately even though its callback comes later. What the old ordering
  // actually cost was measured rather than asserted: with three keep alive
  // sockets held, the marker was gone 10.7ms before the process ended, against
  // 2.8ms once the close is awaited first. A timing assertion that tight would
  // be flaky, so the invariant is tested and the margin is not.
  const session = await makeSession();
  cleanups.push(session.dir);
  const server = await startServer(session.dir);

  // Hold keep alive sockets open, as the review page does. fetch cannot do
  // this, so the raw client is the only way to reproduce the case that matters.
  const url = new URL(server.review);
  const agent = new Agent({ keepAlive: true, maxSockets: 4 });
  await Promise.all(
    [0, 1, 2].map(
      () =>
        new Promise((done, fail) => {
          const req = get(
            { host: url.hostname, port: url.port, path: "/api/session", agent },
            (res) => {
              res.resume();
              res.on("end", done);
            }
          );
          req.on("error", fail);
        })
    )
  );

  await writeFile(join(session.dir, "stop"), "");

  let markerGone = false;
  const started = Date.now();
  while (Date.now() - started < 8000) {
    if (!(await readFile(join(session.dir, "server.json")).catch(() => null))) {
      markerGone = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 5));
  }
  assert(markerGone, "server.json was still there after the stop file");

  // The instant the marker is gone, nothing may still be accepting requests.
  const stillServing = await fetch(`${server.review}/api/session`)
    .then(() => true)
    .catch(() => false);
  agent.destroy?.();
  assert(!stillServing, "the review origin still answered after the marker was removed");

  equal(await waitForExit(server.child), 0, "exit code");
});

await check("a session that already decided will not be served again", async () => {
  const session = await makeSession();
  cleanups.push(session.dir);
  await writeFile(join(session.dir, "decision.json"), JSON.stringify({ decision: "approve" }));
  const result = await run(join(HARNESS, "server.mjs"), ["--dir", session.dir], session.dir);
  equal(result.code, 65, "exit code");
});

for (const [name, args] of [
  ["a nonsense grace period is refused", ["--exit-after-decision", "soon"]],
  ["a negative grace period is refused", ["--exit-after-decision", "-1"]],
  ["a nonsense lifetime is refused", ["--max-minutes", "forever"]],
]) {
  await check(name, async () => {
    const session = await makeSession();
    cleanups.push(session.dir);
    const result = await run(join(HARNESS, "server.mjs"), ["--dir", session.dir, ...args], session.dir);
    equal(result.code, 64, "exit code");
  });
}

// ------------------------------------------------------------------ capture pass

process.stdout.write("\ncapture pass\n");

let playwright = true;
try {
  await import("playwright");
} catch {
  try {
    await import("@playwright/test");
  } catch {
    playwright = false;
  }
}

// A skip is the right default on a contributor's machine and the wrong default
// in CI, where a silent skip lets a change to the capture pass, the resolver, or
// the browser path go green without any of them ever running. `--require-playwright`
// turns the skip into a failure, and the workflow in .github uses it.
const REQUIRE_PLAYWRIGHT = process.argv.includes("--require-playwright");
if (!playwright && REQUIRE_PLAYWRIGHT) {
  process.stdout.write(
    "\n  FAIL Playwright is required for this run and is not installed\n" +
      "       npm install --no-save playwright && npx playwright install --with-deps chromium\n"
  );
  process.exit(1);
}

const captureSession = await makeSession();
cleanups.push(captureSession.dir);
const captureArgs = (extra) => [
  "--url",
  "http://127.0.0.1:1/proposal.html",
  "--out",
  captureSession.dir,
  ...extra,
];

for (const [name, extra] of [
  ["a traversal state name is refused", ["--states", "default,../../escaped", "--breakpoints", "desktop:800x600"]],
  ["a slash in a breakpoint name is refused", ["--states", "default", "--breakpoints", "a/b:800x600"]],
  ["a malformed breakpoint is refused rather than dropped", ["--states", "default", "--breakpoints", "desktop:800x600,tablet:bad"]],
  ["a duplicate state is refused", ["--states", "default,default", "--breakpoints", "desktop:800x600"]],
  ["two state names that resolve to one address are refused", ["--states", "Cart Default,cart-default", "--breakpoints", "desktop:800x600"]],
]) {
  await check(name, async () => {
    const result = await run(join(HARNESS, "capture.mjs"), captureArgs(extra), captureSession.dir);
    equal(result.code, 64, `exit code, stderr was: ${result.err.trim()}`);
  });
}

await check("a non loopback capture url is refused", async () => {
  const result = await run(
    join(HARNESS, "capture.mjs"),
    ["--url", "http://evil.example/proposal.html", "--out", captureSession.dir, "--states", "default", "--breakpoints", "desktop:800x600"],
    captureSession.dir
  );
  equal(result.code, 64, `exit code, stderr was: ${result.err.trim()}`);
});

await check("the review page is refused as a capture target", async () => {
  const result = await run(
    join(HARNESS, "capture.mjs"),
    ["--url", "http://127.0.0.1:1/review.html", "--out", captureSession.dir, "--states", "default", "--breakpoints", "desktop:800x600"],
    captureSession.dir
  );
  equal(result.code, 64, `exit code, stderr was: ${result.err.trim()}`);
});

if (!playwright) {
  process.stdout.write("  skip Playwright is not installed, browser cases not run\n");
} else {
  const session = await makeSession({
    prototype: `<!doctype html><html><head><meta charset="utf-8"><title>T</title>
<link rel="stylesheet" href="shared/tokens.css"></head><body>
<h1>Surface</h1><div id="default"><p>Default.</p></div><div id="empty" hidden><p>Empty.</p></div>
<img src="https://example.com/tracker.gif" alt="">
<script>
var s=(location.hash.match(/state=([\\w-]+)/)||[,'default'])[1];
if(s==='empty'){document.getElementById('empty').hidden=false;document.getElementById('default').hidden=true;}
</script></body></html>`,
    states: ["default", "empty", "never-built"],
  });
  cleanups.push(session.dir);
  await mkdir(join(session.dir, "prototype", "shared"), { recursive: true });
  await writeFile(join(session.dir, "prototype", "shared", "tokens.css"), ":root{--ink:#000}");
  const server = await startServer(session.dir);

  const result = await run(
    join(HARNESS, "capture.mjs"),
    ["--url", `${server.asset}/proposal.html`, "--out", session.dir, "--states", "default,empty,never-built", "--breakpoints", "desktop:800x600"],
    session.dir
  );
  const evidence = JSON.parse(await readFile(join(session.dir, "errors.json"), "utf8"));
  const gate = await gateOf(server);
  server.stop();

  await check("an unimplemented state exits non zero and is reported", async () => {
    equal(result.code, 2, `exit code, stderr was: ${result.err.trim()}`);
    const never = evidence.states.find((s) => s.state === "never-built");
    equal(never.activated, false, "activated");
  });

  await check("an implemented state is reachable", async () => {
    equal(evidence.states.find((s) => s.state === "empty").activated, true, "activated");
  });

  // A prototype that switches state with an attribute on the html element and
  // lets CSS show and hide is a normal way to build one, and its body markup is
  // identical in every state. Reading only the body reported it unimplemented
  // and blocked approval of a correct prototype.
  // A shared prototype covers several surfaces, so the first declared state
  // belongs to some other surface. Comparing everything against it finds
  // payment-error different from cart-default and calls it implemented, while it
  // is really rendering payment-default. States are compared pairwise for this.
  await check("an unimplemented state in a second surface is caught", async () => {
    const shared = await makeSession({
      states: ["cart-default", "cart-error", "payment-default", "payment-error"],
      prototype: `<!doctype html><html><head><meta charset="utf-8"><title>Checkout</title></head><body>
<div id="cart-default"><h1>Cart</h1></div>
<div id="cart-error" hidden><h1>Cart</h1><p>Out of stock.</p></div>
<div id="payment-default" hidden><h1>Payment</h1></div>
<script>
var s=(location.hash.match(/state=([\\w-]+)/)||[,'cart-default'])[1];
// payment-error is declared in the registry and never built, so it falls back
// to payment-default rather than to the first state of the file.
if(s==='payment-error'){s='payment-default';}
['cart-default','cart-error','payment-default'].forEach(function(id){
  document.getElementById(id).hidden=(id!==s);
});
</script></body></html>`,
    });
    cleanups.push(shared.dir);
    const sharedServer = await startServer(shared.dir);
    const sharedResult = await run(
      join(HARNESS, "capture.mjs"),
      ["--url", `${sharedServer.asset}/proposal.html`, "--out", shared.dir, "--states", "cart:cart-default,cart-error|payment:payment-default,payment-error", "--breakpoints", "desktop:800x600"],
      shared.dir
    );
    const sharedEvidence = JSON.parse(await readFile(join(shared.dir, "errors.json"), "utf8"));
    sharedServer.stop();

    equal(sharedResult.code, 2, `exit code, stderr was: ${sharedResult.err.trim()}`);
    const byName = Object.fromEntries(sharedEvidence.states.map((s) => [s.state, s]));
    // Both sides of the collision are reported, since from outside there is no
    // way to tell which of two identical states was never built.
    equal(byName["payment-error"].activated, false, "payment-error activated");
    equal(byName["payment-default"].activated, false, "payment-default activated");
    assert(
      byName["payment-error"].note.includes("payment-default"),
      `expected the collision named, got ${byName["payment-error"].note}`
    );
    // The cart surface is untouched by the payment surface's problem.
    equal(byName["cart-default"].activated, true, "cart-default activated");
    equal(byName["cart-error"].activated, true, "cart-error activated");
    equal(byName["payment-error"].surface, "payment", "surface recorded");
  });

  // A standardised loading screen is deliberately the same screen twice. A
  // global pairwise comparison would refuse a prototype that is exactly right.
  await check("two surfaces may render an identical state", async () => {
    const twin = await makeSession({
      states: ["cart-default", "cart-loading", "payment-default", "payment-loading"],
      prototype: `<!doctype html><html><head><meta charset="utf-8"><title>Checkout</title></head><body>
<div id="cart-default" hidden><h1>Cart</h1></div>
<div id="payment-default" hidden><h1>Payment</h1></div>
<div id="loading" hidden><p>Loading...</p></div>
<script>
var s=(location.hash.match(/state=([\\w-]+)/)||[,'cart-default'])[1];
var show = (s==='cart-loading'||s==='payment-loading') ? 'loading' : s;
['cart-default','payment-default','loading'].forEach(function(id){
  document.getElementById(id).hidden=(id!==show);
});
</script></body></html>`,
    });
    cleanups.push(twin.dir);
    const twinServer = await startServer(twin.dir);
    const twinResult = await run(
      join(HARNESS, "capture.mjs"),
      ["--url", `${twinServer.asset}/proposal.html`, "--out", twin.dir, "--states", "cart:cart-default,cart-loading|payment:payment-default,payment-loading", "--breakpoints", "desktop:800x600"],
      twin.dir
    );
    const twinEvidence = JSON.parse(await readFile(join(twin.dir, "errors.json"), "utf8"));
    twinServer.stop();
    equal(twinResult.code, 0, `exit code, stderr was: ${twinResult.err.trim()}`);
    assert(
      twinEvidence.states.every((s) => s.activated),
      `identical states across surfaces must be allowed, got ${JSON.stringify(twinEvidence.states)}`
    );
  });

  await check("a state driven by an attribute and CSS is reachable", async () => {
    const cssSession = await makeSession({
      states: ["default", "empty"],
      prototype: `<!doctype html><html><head><meta charset="utf-8"><title>T</title><style>
html[data-state="default"] #empty { display: none }
html[data-state="empty"] #default { display: none }
</style></head><body>
<div id="default"><p>Default.</p></div><div id="empty"><p>Empty.</p></div>
<script>
document.documentElement.dataset.state=(location.hash.match(/state=([\\w-]+)/)||[,'default'])[1];
</script></body></html>`,
    });
    cleanups.push(cssSession.dir);
    const cssServer = await startServer(cssSession.dir);
    const cssResult = await run(
      join(HARNESS, "capture.mjs"),
      ["--url", `${cssServer.asset}/proposal.html`, "--out", cssSession.dir, "--states", "default,empty", "--breakpoints", "desktop:800x600"],
      cssSession.dir
    );
    const cssEvidence = JSON.parse(await readFile(join(cssSession.dir, "errors.json"), "utf8"));
    cssServer.stop();
    equal(cssResult.code, 0, `exit code, stderr was: ${cssResult.err.trim()}`);
    equal(cssEvidence.states.find((s) => s.state === "empty").activated, true, "activated");
  });

  await check("a loaded dependency is recorded for hashing", async () => {
    assert(evidence.dependencies.includes("/shared/tokens.css"), `dependencies were ${JSON.stringify(evidence.dependencies)}`);
  });

  // Two defences cover this and the content security policy is the faster one,
  // so the request is usually refused by the browser before Playwright routing
  // sees it and is recorded as a console error rather than an external request.
  // What matters is the behavior rather than which layer won: it did not load,
  // it is visible in the review, and it is not a dependency of the design.
  await check("an off session request is refused and recorded", async () => {
    const mentions = evidence.findings.filter((f) => /example\.com/.test(f.message ?? ""));
    assert(mentions.length > 0, "expected the tracker to appear in the findings");
    assert(
      !evidence.dependencies.some((d) => /example/.test(d)),
      `a refused request must not be a dependency, got ${JSON.stringify(evidence.dependencies)}`
    );
  });

  await check("an unimplemented state blocks approval", async () => {
    assert(gate.blockers.some((b) => b.includes("never-built")), `blockers were ${JSON.stringify(gate.blockers)}`);
  });
}

// ------------------------------------------------------------------------ done

stopEverything();
for (const dir of cleanups) await rm(dir, { recursive: true, force: true });

process.stdout.write(
  `\n${passed} passed, ${failures.length} failed` +
    `${playwright ? "" : ", browser cases skipped without Playwright"}\n`
);
if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  ${failure.name}: ${failure.message}\n`);
  process.exit(1);
}
