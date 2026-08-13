#!/usr/bin/env node
// Kahanas design review session server.
//
// Serves one disposable review session on a loopback address and accepts exactly
// one decision from the person reviewing it. Node standard library only, so it
// runs anywhere Node runs and adds nothing to the project it is reviewing.
//
// Usage:
//   node server.mjs --dir <session directory> [--host 127.0.0.1] [--port 0]
//
// Prints one machine readable line on startup:
//   KAHANAS_REVIEW_URL=http://127.0.0.1:<port>/
//
// See README.md in this folder, and internal/design-review.md for the rules
// this file exists to hold up.

import { createServer } from "node:http";
import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";

const DECISIONS = new Set(["approve", "request-changes", "reject"]);

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
const HOST = opts.host ?? "127.0.0.1";
const PORT = Number(opts.port ?? 0);

if (HOST !== "127.0.0.1" && HOST !== "::1" && HOST !== "localhost") {
  // The review page carries an approval endpoint. Binding it anywhere reachable
  // puts a write endpoint for a design decision on the network.
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

async function exists(name) {
  try {
    await stat(join(ROOT, name));
    return true;
  } catch {
    return false;
  }
}

// Resolve a request path to a file inside the session directory, or null.
// Anything that escapes the directory resolves to null rather than being served.
function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = resolve(join(ROOT, decoded === "/" ? "review.html" : decoded));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  return target;
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    // The session serves only its own files and talks only to itself.
    "content-security-policy": "default-src 'self' 'unsafe-inline' data: blob:",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2), MIME[".json"]);
}

async function sessionState() {
  const manifest = await readJson("manifest.json", {});
  const errors = await readJson("errors.json", null);
  const decision = await readJson("decision.json", null);

  let screenshots = [];
  try {
    screenshots = (await readdir(join(ROOT, "screenshots")))
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .sort();
  } catch {
    screenshots = [];
  }

  return {
    manifest,
    errors,
    screenshots,
    hasBaseline: await exists("baseline.html"),
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

// The one endpoint that writes anything. It writes decision.json once and then
// refuses, so a session can produce exactly one decision.
async function postDecision(req, res) {
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

  // A page left open from an earlier session must not be able to decide this one.
  const manifest = await readJson("manifest.json", {});
  if (manifest.proposalHash && payload.proposalHash !== manifest.proposalHash) {
    return sendJson(res, 409, {
      error:
        "this page is bound to a different proposal than the session holds, reload before deciding",
    });
  }

  const record = {
    decision,
    person: person || null,
    feedback: feedback || null,
    proposalHash: manifest.proposalHash ?? null,
    decidedAt: new Date().toISOString(),
  };

  try {
    // wx fails if the file exists, which is the whole guarantee: one decision.
    await writeFile(join(ROOT, "decision.json"), JSON.stringify(record, null, 2), {
      flag: "wx",
    });
  } catch (err) {
    if (err.code === "EEXIST") {
      return sendJson(res, 409, {
        error: "this session already recorded a decision",
      });
    }
    return sendJson(res, 500, { error: `could not write decision: ${err.message}` });
  }

  return sendJson(res, 201, record);
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url ?? "/";

    if (url === "/api/session" && req.method === "GET") {
      return sendJson(res, 200, await sessionState());
    }

    if (url === "/api/decision") {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "decisions are posted" });
      }
      return await postDecision(req, res);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "method not allowed");
    }

    const target = safePath(url);
    if (!target) return send(res, 403, "outside the session directory");

    let body;
    try {
      body = await readFile(target);
    } catch {
      return send(res, 404, "not found");
    }

    return send(res, 200, body, MIME[extname(target).toLowerCase()] ?? "application/octet-stream");
  } catch (err) {
    return send(res, 500, `session server error: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  const { port } = server.address();
  console.log(`KAHANAS_REVIEW_URL=http://${HOST}:${port}/`);
  console.log(`Serving ${ROOT}`);
  console.log("Waiting for a decision. Stop with Ctrl C.");
});
