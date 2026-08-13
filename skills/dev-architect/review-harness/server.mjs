#!/usr/bin/env node
// Kahanas design review session server.
//
// Serves one disposable review session on loopback and accepts exactly one
// decision from the person reviewing it. Node standard library only, so it runs
// anywhere Node runs and adds nothing to the project it is reviewing.
//
// Usage:
//   node server.mjs --dir <session directory> [--host 127.0.0.1]
//
// Prints two machine readable lines on startup:
//   KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/
//   KAHANAS_ASSET_URL=http://127.0.0.1:<other port>/
//
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
import { readFile, readdir, writeFile, link, unlink, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve, join, extname, sep } from "node:path";

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

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (key) out[key] = argv[i + 1];
  }
  return out;
}

const opts = args(process.argv);
if (!opts.dir) {
  console.error("server.mjs: --dir <session directory> is required");
  process.exit(64);
}

const ROOT = resolve(opts.dir);
const PROTOTYPE_ROOT = join(ROOT, "prototype");
const HOST = opts.host ?? "127.0.0.1";
const TOKEN = randomUUID();

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
if (!(await exists(join(PROTOTYPE_ROOT, "proposal.html")))) {
  console.error(`server.mjs: ${join(PROTOTYPE_ROOT, "proposal.html")} does not exist`);
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

  // Every state at every breakpoint, or the person was not shown what they are
  // being asked to approve.
  const present = new Set(screenshots);
  const missing = [];
  for (const state of errors.states) {
    for (const breakpoint of errors.breakpoints) {
      const name = `${slug(state.state)}__${breakpoint.name}.png`;
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
  const errors = await readJson("errors.json", null);
  const decision = await readJson("decision.json", null);
  const screenshots = await listScreenshots();

  return {
    manifest,
    errors,
    screenshots,
    assetOrigin: ASSET_ORIGIN,
    hasBaseline: await exists(join(PROTOTYPE_ROOT, "baseline.html")),
    gate: approvalGate(errors, screenshots),
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

  if (decision === "approve") {
    const { blockers, warnings } = approvalGate(
      await readJson("errors.json", null),
      await listScreenshots()
    );
    if (blockers.length > 0) {
      return sendJson(res, 422, {
        error: "this proposal is not in a state that can be approved",
        blockers,
      });
    }
    if (warnings.length > 0 && payload.acknowledged !== true) {
      return sendJson(res, 422, {
        error: "the capture pass recorded findings that have to be acknowledged before approving",
        warnings,
      });
    }
  }

  const record = {
    decision,
    person: person || null,
    feedback: feedback || null,
    proposalHash: manifest.proposalHash,
    acknowledged: decision === "approve" ? payload.acknowledged === true : null,
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
      const page = await readFile(join(ROOT, "review.html"), "utf8");
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

await new Promise((done) => assetServer.listen(0, HOST, done));
await new Promise((done) => reviewServer.listen(0, HOST, done));

ASSET_ORIGIN = `http://${HOST}:${assetServer.address().port}`;
REVIEW_ORIGIN = `http://${HOST}:${reviewServer.address().port}`;

console.log(`KAHANAS_REVIEW_URL=${REVIEW_ORIGIN}/`);
console.log(`KAHANAS_ASSET_URL=${ASSET_ORIGIN}/`);
console.log(`Serving ${ROOT}`);
console.log("Waiting for a decision. Stop with Ctrl C.");
