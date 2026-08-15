#!/usr/bin/env node
// Kahanas design review session server.
//
// Serves one disposable review session on loopback and accepts exactly one
// decision from the person reviewing it. Node standard library only, so it runs
// anywhere Node runs and adds nothing to the project it is reviewing.
//
// Usage:
//   node server.mjs --dir <session directory> [--host 127.0.0.1]
//                   [--exit-after-decision <seconds>] [--max-minutes <n>]
//
// Prints two machine readable lines on startup:
//   KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/
//   KAHANAS_ASSET_URL=http://127.0.0.1:<other port>/
//
// HOW IT STOPS, AND WHY IT STOPS ITSELF
//
// Nothing should ever have to find this process and signal it. A caller that
// hunts a pid out of a file and kills it is one stale entry away from killing
// something else, and that is not a hypothetical: it is how a review teardown
// turns into an incident. So there are three ways this exits and none of them
// is somebody else's kill:
//
//   1. A decision was recorded, after a grace period for the person to finish
//      reading the evidence.
//   2. A file named `stop` appeared in the session directory. Creating a file
//      is something every caller can already do, it names this session and
//      nothing else, and it cannot reach any other process on the machine.
//   3. The session hit its maximum lifetime, so an abandoned review does not
//      leave a server holding a port for the rest of the week.
//
// `server.json` in the session directory carries the pid and both origins while
// this runs, and is removed on the way out. It exists so a caller can tell a
// live session from a finished one without parsing stdout, not so anybody can
// signal the pid inside it.
// TWO ORIGINS, AND THE REASON THEY ARE TWO
//
// A prototype is untrusted code. It may be derived from HTML a user supplied,
// and it runs unattended during the capture pass. On one origin it could read
// the review page, lift the session token out of it, and post its own approval
// before a person ever saw the design.
//
// So the prototype gets its own origin with no API on it at all, and the
// decision endpoint accepts a request only when all three hold:
//
//   1. Origin is exactly the review origin. A prototype is not on it.
//   2. Content type is application/json, so any cross origin attempt needs a
//      preflight, which this server never answers.
//   3. The session token matches. It is injected into review.html at serve time
//      and exists nowhere the prototype origin can read.
//
// None of that stops the process that started this server from posting a
// decision itself. Nothing can. See internal/design-review.md, which says so
// plainly rather than claiming a guarantee this cannot keep.

import { createServer } from "node:http";
import { readFile, readdir, writeFile, link, unlink, stat, open } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { resolve, join, extname, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgsOrExit } from "./args.mjs";

const DECISIONS = new Set(["approve", "request-changes", "reject"]);
const SHA256 = /^[a-f0-9]{64}$/i;

// Findings that a person has to acknowledge before approving. A console warning
// is not on the list: prototypes log, and a gate that fires on everything is a
// gate that gets clicked through without reading.
const MUST_ACKNOWLEDGE = new Set([
  "console-error",
  "page-error",
  "request-failed",
  "response-error",
  "external-request",
  "navigation-failed",
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const opts = parseArgsOrExit(process.argv, "server.mjs", [
  "dir",
  "host",
  "exit-after-decision",
  "max-minutes",
]);
if (!opts.dir) {
  console.error("server.mjs: --dir <session directory> is required");
  process.exit(64);
}

// Zero means never, for both of these, which is why the floor is zero rather
// than one: a caller that wants a session to stay up says so with a number
// instead of learning a separate flag.
function duration(value, fallback, flag, unit) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    console.error(`server.mjs: ${flag} must be a number of ${unit}, zero or more, zero meaning never`);
    process.exit(64);
  }
  return n;
}

// Long enough that a person who has just decided can finish reading the
// findings, short enough that a decided session does not sit there for a day.
const EXIT_AFTER_DECISION = duration(
  opts["exit-after-decision"],
  300,
  "--exit-after-decision",
  "seconds"
);
// A review takes as long as a person takes, so this is a leak guard rather than
// a deadline. It ends a session nobody came back to.
const MAX_MINUTES = duration(opts["max-minutes"], 240, "--max-minutes", "minutes");

const ROOT = resolve(opts.dir);
// The review page is read from this file's own folder, never from the session.
// The harness runs in place out of the skill, and the session directory holds
// only data: a copy of the code there could not resolve its dependencies,
// because Node looks for them beside the importing file and a temporary
// directory has no node_modules above it.
const HARNESS = dirname(fileURLToPath(import.meta.url));
const PROTOTYPE_ROOT = join(ROOT, "prototype");
const STOP_FILE = join(ROOT, "stop");
const SERVER_FILE = join(ROOT, "server.json");
const HOST = opts.host ?? "127.0.0.1";
const TOKEN = randomUUID();
// Identifies this server, and is deliberately not TOKEN. TOKEN is a secret that
// gates the decision endpoint and goes only into the review page as it is
// served. CLAIM_ID is an identifier, published to anyone who can reach the
// review origin, and it settles one question: is the server answering here the
// one that wrote this session's claim file.
const CLAIM_ID = randomUUID();

if (HOST !== "127.0.0.1" && HOST !== "::1" && HOST !== "localhost") {
  // The review origin carries an approval endpoint. Binding it anywhere
  // reachable puts a write endpoint for a design decision on the network.
  console.error(`server.mjs: refusing to bind ${HOST}, loopback only`);
  process.exit(64);
}

async function readJson(name, fallback = null) {
  try {
    return JSON.parse(await readFile(join(ROOT, name), "utf8"));
  } catch {
    return fallback;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// The manifest is what binds an approval to one revision, so a session with a
// broken one must not start rather than start and accept a decision bound to
// nothing.
const manifest = await readJson("manifest.json", null);
if (!manifest) {
  console.error("server.mjs: manifest.json is missing or is not valid JSON");
  process.exit(65);
}
if (!SHA256.test(String(manifest.proposalHash ?? ""))) {
  console.error(
    "server.mjs: manifest.proposalHash must be a full sha256 hex digest of the working copy"
  );
  process.exit(65);
}
// The states and breakpoints this surface requires, taken from the registry and
// design.md by /dev-design. They are what the capture pass is graded against,
// so a session without them cannot tell a complete pass from a short one.
if (!Array.isArray(manifest.states) || manifest.states.length === 0) {
  console.error("server.mjs: manifest.states must list the states this surface requires");
  process.exit(65);
}
if (
  !Array.isArray(manifest.breakpoints) ||
  manifest.breakpoints.length === 0 ||
  manifest.breakpoints.some(
    (b) =>
      !b ||
      typeof b.name !== "string" ||
      b.name === "" ||
      !(Number(b.width) > 0) ||
      !(Number(b.height) > 0)
  )
) {
  console.error(
    "server.mjs: manifest.breakpoints must list the breakpoints in design.md, " +
      "each with a name, a width, and a height"
  );
  process.exit(65);
}
if (!(await exists(join(PROTOTYPE_ROOT, "proposal.html")))) {
  console.error(`server.mjs: ${join(PROTOTYPE_ROOT, "proposal.html")} does not exist`);
  process.exit(65);
}

// One server per session. Two of them would serve one directory on four ports,
// and the caller would then have two pids for one review and no way to tell
// which page a person is actually looking at.
//
// THE CLAIM IS ATOMIC, AND READING FIRST WOULD NOT BE
//
// Checking whether server.json exists and then writing it leaves a window
// between the two, and both racers pass the check. That is not theoretical:
// six simultaneous starts on one session directory left four servers running,
// each believing it was the only one.
//
// `wx` creates the file and fails with EEXIST if it is already there, in one
// operation the filesystem serialises, so exactly one starter wins however
// many arrive together.
//
// The claim is taken before the ports are bound, so a loser never reaches a
// listen call, and it is released on every path out of here.
//
// WHY THE CLAIM IS PROBED AND NOT PID CHECKED
//
// A pid proves something exists, never that it is the thing you meant. Pids are
// reused, so a claim left by a crashed server can name a number the machine has
// since handed to something unrelated, and asking whether that number is alive
// answers yes. The advice that follows is then actively wrong: it tells somebody
// to create a stop file and wait, and no server will ever read it.
//
// So the claim is asked to prove itself instead. Two things make that safe, and
// both are here because the obvious version of this check is wrong.
//
// THE URL COMES OUT OF A FILE, SO IT IS NOT A URL TO BE TRUSTED
//
// Handing `server.json`'s `reviewUrl` straight to fetch makes this process a
// request forwarder for whoever can write that file: a cloud metadata address,
// a service that is only reachable from this machine, a redirect to somewhere
// else entirely. It is a small window, since writing there already needs the
// session directory, but this is the code path that decides whether an approval
// is genuine and it should not be the weakest thing in the room.
//
// So the probe accepts plain HTTP on loopback with no credentials in it,
// refuses to follow a redirect at all, and stops reading after a small body.
//
// A CONTENT HASH IS NOT A SESSION
//
// Comparing the proposal hash asks "is a server serving this same file", which
// two sessions reviewing the same prototype both answer yes to. This session
// would then report the other session's server as its own, and the stop file
// somebody wrote here would not stop it: the pid mistake again, wearing a
// different hat. So each server mints a claim id at startup, writes it into its
// own claim, and returns it. Only the process that wrote this file can answer
// with what is in it.
const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

function safeClaimUrl(reviewUrl) {
  let url;
  try {
    url = new URL("/api/session", reviewUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:") return null;
  if (url.username !== "" || url.password !== "") return null;
  // `new URL("http://[::1]:1/")` keeps the brackets on hostname.
  if (!LOOPBACK.has(url.hostname.replace(/^\[|\]$/g, ""))) return null;
  return url;
}

// A rogue service on a loopback port could stream for as long as the timeout
// allows, and res.json() would hold all of it. A claim id is a few dozen bytes.
async function readCapped(res, limit = 64 * 1024) {
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function claimIsLive(previous) {
  if (!previous?.claimId) return false;
  const url = safeClaimUrl(previous.reviewUrl);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(1500),
      redirect: "error",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return false;
    const body = await readCapped(res);
    if (body === null) return false;
    return JSON.parse(body)?.claimId === previous.claimId;
  } catch {
    return false;
  }
}

let claim;
try {
  claim = await open(SERVER_FILE, "wx");
} catch (err) {
  if (err.code !== "EEXIST") throw err;
  const previous = await readJson("server.json", null);

  // Three states, and they need three different things said, because the
  // action is different in each. The claim is created empty and filled once
  // the ports are bound, so an empty one is a server mid startup or one that
  // died before it finished starting, and neither of those is a running server
  // somebody can go and stop.
  let why;
  if (await claimIsLive(previous)) {
    why =
      `a server for this session is already answering on ${previous.reviewUrl}.\n` +
      `  Stop it by creating ${STOP_FILE}.`;
  } else if (previous === null) {
    why =
      `${SERVER_FILE} is already there and has nothing in it yet.\n` +
      `  Another server is claiming this session right now, or one died before it\n` +
      `  finished starting. Wait a moment and look again: a real one fills that file\n` +
      `  in as soon as its ports are bound.`;
  } else {
    why =
      `${SERVER_FILE} is already there, so this session is claimed,\n` +
      `  and nothing is answering on it. It was most likely left behind by a crash.\n` +
      `  A stop file will not clear it, because no server is there to read one.\n` +
      `  Sessions are disposable and are not resumed: build a fresh one, or delete that\n` +
      `  file yourself if you are certain no server is using this directory.`;
  }
  console.error(`server.mjs: ${why}`);
  process.exit(65);
}

// Anything failing between here and a successful listen has to give the claim
// back, or a retry finds a session claimed by a process that never started.
async function releaseClaim() {
  await claim.close().catch(() => {});
  await unlink(SERVER_FILE).catch(() => {});
}

// A decision that already exists cannot be replaced, so serving the session
// again would put a live approval page in front of somebody whose click can
// only ever be refused.
if (await exists(join(ROOT, "decision.json"))) {
  await releaseClaim();
  console.error(
    "server.mjs: this session already recorded a decision, so there is nothing left to decide"
  );
  process.exit(65);
}

// Resolve a request path to a file inside one root, or null. Anything escaping
// that root resolves to null rather than being served.
function safePath(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = resolve(join(root, decoded));
  if (target !== root && !target.startsWith(root + sep)) return null;
  return target;
}

// A prototype renders with no network, and the capture pass enforces that by
// aborting anything off session. The person's browser has no such interception,
// so the same rule is served as a policy the browser applies. Without it a
// prototype behaves one way while nobody is watching and another way during the
// review, which is the wrong way round.
//
// The two origins need different policies, and getting this wrong is quiet: a
// review origin that does not name the asset origin under frame-src blocks its
// own live frame, and the page still looks like it is working.
const BASE_CSP = "default-src 'self' 'unsafe-inline' data: blob:; form-action 'self'; base-uri 'none'";
const csp = (kind) =>
  kind === "review"
    ? `${BASE_CSP}; frame-src ${ASSET_ORIGIN}`
    : `${BASE_CSP}; frame-ancestors ${REVIEW_ORIGIN}`;

function send(res, status, body, type = "text/plain; charset=utf-8", kind = "review") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": csp(kind),
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2), MIME[".json"]);
}

async function serveFile(res, root, urlPath, kind, fallback = null) {
  const target = safePath(root, urlPath === "/" && fallback ? fallback : urlPath);
  if (!target) return send(res, 403, "outside the session directory", undefined, kind);
  let body;
  try {
    body = await readFile(target);
  } catch {
    return send(res, 404, "not found", undefined, kind);
  }
  return send(
    res,
    200,
    body,
    MIME[extname(target).toLowerCase()] ?? "application/octet-stream",
    kind
  );
}

// What a person has to clear before approving.
//
// A state that did not activate is a blocker: the prototype does not implement
// something the registry says the surface has, so there is nothing to approve.
// Everything else is acknowledged rather than blocked, because a prototype with
// a noisy console can still be the right design and only a person can say.
const slug = (value) => String(value).toLowerCase().trim().replace(/\s+/g, "-");

// A capture pass that produced nothing usable is not a clean capture pass.
// Checking only that errors.json exists would let an empty object, a truncated
// write, or a crashed run read as no findings, which is the most dangerous kind
// of clean.
function captureIsUnusable(errors, screenshots) {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return "no capture pass has run for this session, so there is no evidence to review";
  }
  if (!errors.capturedAt) return "the capture output has no timestamp, so it is not a finished pass";
  if (!Array.isArray(errors.breakpoints) || errors.breakpoints.length === 0) {
    return "the capture output records no breakpoints";
  }
  if (!Array.isArray(errors.states) || errors.states.length === 0) {
    return "the capture output records no states";
  }
  if (!Array.isArray(errors.findings) || !Array.isArray(errors.dependencies)) {
    return "the capture output is incomplete";
  }

  // The evidence has to be evidence about this proposal. Without this check any
  // capture output left in the directory satisfies the gate, including a pass
  // run against a different page on another loopback port.
  let capturedFrom;
  try {
    capturedFrom = new URL(errors.url);
  } catch {
    return "the capture output does not record which page it rendered";
  }
  if (capturedFrom.origin !== ASSET_ORIGIN || capturedFrom.pathname !== "/proposal.html") {
    return `the capture pass rendered ${errors.url}, which is not this session's proposal`;
  }

  // Checked against what the manifest requires, never against what the capture
  // output says it did. A pass run with a shorter state list would otherwise
  // grade its own homework: it covered everything it attempted, and the states
  // the registry says the surface has were never rendered at all.
  const expectedStates = new Set(manifest.states.map(slug));
  const capturedStates = new Set(errors.states.map((s) => slug(s.state)));
  const missedStates = [...expectedStates].filter((s) => !capturedStates.has(s));
  if (missedStates.length > 0) {
    return `the capture pass never rendered ${missedStates.join(", ")}, which this surface requires`;
  }

  // Name, width, and height together. A breakpoint is a size, so evidence
  // captured at desktop 320 by 200 is not evidence about the desktop layout
  // however it is labelled, and a name only comparison accepts it.
  const size = (b) => `${b.name}:${Number(b.width)}x${Number(b.height)}`;
  const capturedSizes = new Set(errors.breakpoints.map(size));
  const missedBreakpoints = manifest.breakpoints.map(size).filter((b) => !capturedSizes.has(b));
  if (missedBreakpoints.length > 0) {
    return `the capture pass never rendered at ${missedBreakpoints.join(", ")}`;
  }

  // Every required state at every required breakpoint, or the person was not
  // shown what they are being asked to approve.
  const present = new Set(screenshots);
  const missing = [];
  for (const state of expectedStates) {
    for (const breakpoint of manifest.breakpoints.map((b) => b.name)) {
      const name = `${state}__${breakpoint}.png`;
      if (!present.has(name)) missing.push(name);
    }
  }
  if (missing.length > 0) {
    return `the capture pass is missing ${missing.length} screenshots, including ${missing[0]}`;
  }

  return null;
}

function approvalGate(errors, screenshots = []) {
  const blockers = [];
  const warnings = [];

  const unusable = captureIsUnusable(errors, screenshots);
  if (unusable) {
    blockers.push(unusable);
    return { blockers, warnings };
  }

  for (const state of errors.states ?? []) {
    if (!state.activated) {
      blockers.push(`state did not activate: ${state.state}${state.note ? `, ${state.note}` : ""}`);
    }
  }

  const counts = {};
  for (const finding of errors.findings ?? []) {
    if (MUST_ACKNOWLEDGE.has(finding.kind)) counts[finding.kind] = (counts[finding.kind] ?? 0) + 1;
  }
  for (const [kind, n] of Object.entries(counts)) warnings.push(`${n} ${kind}`);

  return { blockers, warnings };
}

// One read, one snapshot, and everything derived from it.
//
// An acknowledgement is a statement about specific findings, so the decision has
// to name which ones, the same way it names the revision. Reading the file twice
// to get the findings and then the digest reintroduces the very race that is
// being closed: a capture pass renaming between the two reads pairs one pass's
// findings with another pass's hash, and every check downstream then agrees with
// itself about the wrong thing.
async function evidenceSnapshot() {
  let bytes;
  try {
    bytes = await readFile(join(ROOT, "errors.json"));
  } catch {
    return { parsed: null, hash: null };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    parsed = null;
  }
  return { parsed, hash: createHash("sha256").update(bytes).digest("hex") };
}

async function listScreenshots() {
  try {
    return (await readdir(join(ROOT, "screenshots")))
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .sort();
  } catch {
    return [];
  }
}

async function sessionState() {
  const evidence = await evidenceSnapshot();
  const decision = await readJson("decision.json", null);
  const screenshots = await listScreenshots();

  return {
    manifest,
    // Read by another server deciding whether this session is already claimed,
    // never by the review page. Not a secret, and not the decision token.
    claimId: CLAIM_ID,
    errors: evidence.parsed,
    screenshots,
    assetOrigin: ASSET_ORIGIN,
    hasBaseline: await exists(join(PROTOTYPE_ROOT, "baseline.html")),
    gate: approvalGate(evidence.parsed, screenshots),
    evidenceHash: evidence.hash,
    decided: decision !== null,
    decision,
  };
}

async function readBody(req, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// The one endpoint in the harness that writes anything.
async function postDecision(req, res) {
  // Guard 1: the review origin, which no prototype is on.
  if (req.headers.origin !== REVIEW_ORIGIN) {
    return sendJson(res, 403, {
      error: "a decision is posted from the review page, and this request was not",
    });
  }
  // Guard 2: forces a preflight on any cross origin attempt, which is never answered.
  if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) {
    return sendJson(res, 415, { error: "a decision is posted as application/json" });
  }
  // Guard 3: the token exists only where the prototype origin cannot read it.
  if (req.headers["x-kahanas-token"] !== TOKEN) {
    return sendJson(res, 403, { error: "this session token is wrong or missing" });
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { error: "decision must be a JSON object" });
  }

  const decision = String(payload.decision ?? "");
  if (!DECISIONS.has(decision)) {
    return sendJson(res, 400, {
      error: `decision must be one of ${[...DECISIONS].join(", ")}`,
    });
  }

  const person = String(payload.person ?? "").trim();
  const feedback = String(payload.feedback ?? "").trim();

  if (decision === "approve" && !person) {
    return sendJson(res, 400, { error: "approve requires the person's name" });
  }
  if (decision !== "approve" && !feedback) {
    return sendJson(res, 400, { error: `${decision} requires feedback` });
  }

  // The revision is not optional. A decision carrying no hash, or a hash this
  // session does not hold, is a decision about something else.
  if (payload.proposalHash !== manifest.proposalHash) {
    return sendJson(res, 409, {
      error: "this page is bound to a different revision than the session holds, reload before deciding",
    });
  }

  let acknowledgedFindings = null;
  const evidence = await evidenceSnapshot();
  if (decision === "approve") {
    const { blockers, warnings } = approvalGate(evidence.parsed, await listScreenshots());
    if (blockers.length > 0) {
      return sendJson(res, 422, {
        error: "this proposal is not in a state that can be approved",
        blockers,
      });
    }
    // The evidence must be the evidence the page showed. A capture pass that
    // reran since then changes what an acknowledgement would mean.
    if (payload.evidenceHash !== evidence.hash) {
      return sendJson(res, 409, {
        error: "the capture evidence changed since this page loaded, reload before deciding",
      });
    }
    if (warnings.length > 0) {
      if (payload.acknowledged !== true) {
        return sendJson(res, 422, {
          error: "the capture pass recorded findings that have to be acknowledged before approving",
          warnings,
        });
      }
      // Recorded, so a later reader sees what was outstanding and waved through.
      acknowledgedFindings = warnings;
    }
  }

  const record = {
    decision,
    person: person || null,
    feedback: feedback || null,
    proposalHash: manifest.proposalHash,
    acknowledged: decision === "approve" ? payload.acknowledged === true : null,
    acknowledgedFindings,
    evidenceHash: decision === "approve" ? evidence.hash : null,
    decidedAt: new Date().toISOString(),
  };

  const target = join(ROOT, "decision.json");
  const staged = `${target}.${randomUUID()}.part`;
  try {
    // Written whole, then linked into place. link fails with EEXIST atomically,
    // so two decisions arriving together cannot both win, and a reader never
    // sees a half written file. Checking that the target exists and then
    // renaming would lose that race: rename overwrites, so the second decision
    // would quietly replace the first.
    await writeFile(staged, JSON.stringify(record, null, 2));
    try {
      await link(staged, target);
    } catch (err) {
      if (err.code === "EEXIST") {
        return sendJson(res, 409, { error: "this session already recorded a decision" });
      }
      throw err;
    } finally {
      await unlink(staged).catch(() => {});
    }
  } catch (err) {
    return sendJson(res, 500, { error: `could not write decision: ${err.message}` });
  }

  // A session with a decision in it has done its job. It closes itself after a
  // grace period, so nobody has to find this process and signal it, and so a
  // machine running reviews all week is not running a server for each of them.
  if (EXIT_AFTER_DECISION > 0) {
    setTimeout(() => shutdown("a decision was recorded"), EXIT_AFTER_DECISION * 1000).unref();
  }

  return sendJson(res, 201, record);
}

// The review origin. Serves the review page, the evidence, and the one endpoint.
// It never serves the prototype.
const reviewServer = createServer(async (req, res) => {
  try {
    const url = req.url ?? "/";

    if (url === "/api/session" && req.method === "GET") {
      return sendJson(res, 200, await sessionState());
    }

    if (url === "/api/decision") {
      if (req.method !== "POST") return sendJson(res, 405, { error: "decisions are posted" });
      return await postDecision(req, res);
    }

    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method not allowed");

    // The prototype lives on the other origin, and serving it here as well would
    // hand it back the same origin this split exists to take away.
    if (/^\/prototype(\/|$)/.test(url)) {
      return send(res, 404, "the prototype is served on the asset origin");
    }

    if (url === "/" || url.startsWith("/review.html")) {
      const page = await readFile(join(HARNESS, "review.html"), "utf8");
      return send(
        res,
        200,
        page
          .replaceAll("__KAHANAS_TOKEN__", TOKEN)
          .replaceAll("__KAHANAS_ASSET_ORIGIN__", ASSET_ORIGIN),
        MIME[".html"]
      );
    }

    return await serveFile(res, ROOT, url, "review");
  } catch (err) {
    return send(res, 500, `session server error: ${err.message}`);
  }
});

// The asset origin. Serves the prototype and whatever it loads, and nothing else.
// There is no API here to reach.
const assetServer = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD")
      return send(res, 405, "method not allowed", undefined, "asset");
    return await serveFile(res, PROTOTYPE_ROOT, req.url ?? "/", "asset", "/proposal.html");
  } catch (err) {
    return send(res, 500, `asset server error: ${err.message}`, undefined, "asset");
  }
});

let REVIEW_ORIGIN = "";
let ASSET_ORIGIN = "";

// A port already taken, or a host the machine will not bind, has to give the
// claim back. Left behind, it reads exactly like a live session and blocks
// every retry on a directory nothing is serving.
try {
  await new Promise((done, fail) => {
    assetServer.once("error", fail);
    assetServer.listen(0, HOST, done);
  });
  await new Promise((done, fail) => {
    reviewServer.once("error", fail);
    reviewServer.listen(0, HOST, done);
  });
} catch (err) {
  await releaseClaim();
  console.error(`server.mjs: could not listen on ${HOST}: ${err.message}`);
  process.exit(70);
}

// An IPv6 literal has to be bracketed in a URL, or http://::1:41655 is nonsense
// that every origin comparison then fails against.
const HOST_IN_URL = HOST.includes(":") ? `[${HOST}]` : HOST;
ASSET_ORIGIN = `http://${HOST_IN_URL}:${assetServer.address().port}`;
REVIEW_ORIGIN = `http://${HOST_IN_URL}:${reviewServer.address().port}`;

// Written through the handle that claimed the file, so the claim and the thing
// it publishes are the same file and never two.
await claim.writeFile(
  JSON.stringify(
    {
      claimId: CLAIM_ID,
      pid: process.pid,
      dir: ROOT,
      reviewUrl: `${REVIEW_ORIGIN}/`,
      assetUrl: `${ASSET_ORIGIN}/`,
      startedAt: new Date().toISOString(),
      stopFile: STOP_FILE,
      maxMinutes: MAX_MINUTES,
    },
    null,
    2
  )
);
await claim.close();

let stopping = false;
let watcher = null;
async function shutdown(reason) {
  if (stopping) return;
  stopping = true;
  if (watcher) clearInterval(watcher);
  console.log(`KAHANAS_STOPPING=${reason}`);

  // Both listeners fully closed BEFORE the file goes.
  //
  // Teardown waits for server.json to disappear and then deletes the session
  // directory. Removing it first would announce a stopped server while this
  // one was still accepting requests, and the directory would go out from
  // under a live process. The marker is the last thing to go, so its absence
  // means what teardown reads it as meaning.
  await Promise.race([
    Promise.all(
      [reviewServer, assetServer].map(
        (server) =>
          new Promise((done) => {
            server.close(done);
            // A browser holding a keep alive connection would otherwise keep an
            // abandoned session running for as long as that tab stays open.
            server.closeAllConnections?.();
          })
      )
    ),
    // A socket that will not die must not strand the marker forever. Exiting
    // is imminent either way, which closes every listener the hard way.
    new Promise((done) => setTimeout(done, 3000)),
  ]);

  // Removed last, and followed immediately by the exit rather than by waiting
  // for the event loop to drain. Teardown treats this file disappearing as the
  // server being finished, so every instruction that runs after it here is a
  // moment where that is not quite true yet.
  await unlink(SERVER_FILE).catch(() => {});
  process.exit(0);
}

const startedAtMs = Date.now();
watcher = setInterval(async () => {
  if (stopping) return;
  if (await exists(STOP_FILE)) return shutdown("a stop file appeared in the session directory");
  if (MAX_MINUTES > 0 && Date.now() - startedAtMs > MAX_MINUTES * 60_000) {
    return shutdown(`the session reached its maximum lifetime of ${MAX_MINUTES} minutes`);
  }
}, 500);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutdown(`received ${signal}`);
  });
}

console.log(`KAHANAS_REVIEW_URL=${REVIEW_ORIGIN}/`);
console.log(`KAHANAS_ASSET_URL=${ASSET_ORIGIN}/`);
console.log(`Serving ${ROOT}`);
console.log(`Stop it by creating ${STOP_FILE}, rather than by signalling pid ${process.pid}.`);
console.log(
  EXIT_AFTER_DECISION > 0
    ? `It also stops ${EXIT_AFTER_DECISION} seconds after a decision is recorded.`
    : "It will not stop itself when a decision is recorded."
);
console.log(
  MAX_MINUTES > 0
    ? `It stops either way after ${MAX_MINUTES} minutes.`
    : "It has no maximum lifetime, so it runs until it is stopped."
);
