#!/usr/bin/env node
// Tests for the /dev-harness Telegram transport.
//
// The poller is shipped as an executable inside a skill, so it is code nobody
// rewrites from memory each session, and that means it needs a suite here.
// A fake Telegram server stands in for the real one through
// KAHANAS_TELEGRAM_API_BASE, so nothing in this file touches the network.

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const POLLER = join(REPO, "skills", "dev-harness", "telegram", "poll.mjs");
const TOKEN = "111:SECRET-TOKEN-VALUE";
const CHAT = "4242";

const { parseMessage, accept } = await import(POLLER);

const requests = [];
let updates = [];

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const method = req.url.split("/").pop();
    requests.push({ url: req.url, method, body: body ? JSON.parse(body) : {} });
    const result = method === "getUpdates" ? updates : { message_id: 1 };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, result }));
  });
});

await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const scratch = await mkdtemp(join(tmpdir(), "kahanas-harness-"));

// The fake server runs in this process, so the poller must be spawned without
// blocking this event loop. A synchronous spawn would deadlock: the child waits
// for a reply the parent cannot send.
function run(args, extraEnv = {}) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [POLLER, ...args],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          KAHANAS_TELEGRAM_BOT_TOKEN: TOKEN,
          KAHANAS_TELEGRAM_CHAT_ID: CHAT,
          KAHANAS_TELEGRAM_API_BASE: base,
          KAHANAS_HARNESS_STATE_DIR: scratch,
          ...extraEnv,
        },
      },
      (error, stdout, stderr) => done({ status: error ? (error.code ?? 1) : 0, stdout, stderr }),
    );
  });
}

function lines(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function message(id, text, { chat = CHAT, from = "7" } = {}) {
  return { update_id: id, message: { message_id: id, text, chat: { id: Number(chat) }, from: { id: Number(from) } } };
}

try {
  // Every known first word is a control verb, and its argument is the rest.
  assert.deepEqual(parseMessage("status"), { verb: "status", argument: "" });
  assert.deepEqual(parseMessage("  STOP  "), { verb: "stop", argument: "" });
  assert.deepEqual(parseMessage("answer 2"), { verb: "answer", argument: "2" });
  assert.deepEqual(parseMessage("answer use the second option"), {
    verb: "answer",
    argument: "use the second option",
  });
  for (const verb of ["pause", "resume", "approve", "deny"]) {
    assert.equal(parseMessage(verb).verb, verb);
  }

  // Anything else is freeform, carried whole, never split into a command.
  assert.deepEqual(parseMessage("rebuild the login page please"), {
    verb: "instruction",
    argument: "rebuild the login page please",
  });
  assert.deepEqual(parseMessage(""), { verb: "instruction", argument: "" });
  assert.deepEqual(parseMessage(undefined), { verb: "instruction", argument: "" });

  // A verb hidden later in the sentence is not a control instruction.
  assert.equal(parseMessage("please stop the developer").verb, "instruction");

  // The allowlist is the whole defence against a stranger in the chat.
  const cfg = { chatId: CHAT, senders: ["7"] };
  assert.equal(accept(cfg, message(1, "status")).accepted, true);
  assert.equal(accept(cfg, message(2, "status", { chat: "9999" })).accepted, false);
  assert.equal(accept(cfg, message(3, "status", { from: "8" })).accepted, false);
  assert.equal(accept(cfg, { update_id: 4 }).accepted, false);
  // With no allowlist configured, any sender in the configured chat is accepted.
  assert.equal(accept({ chatId: CHAT, senders: [] }, message(5, "status", { from: "8" })).accepted, true);

  // send posts the configured chat id and the message text.
  requests.length = 0;
  let result = await run(["send", "phase 3 is done"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "sendMessage");
  assert.deepEqual(requests[0].body, { chat_id: CHAT, text: "phase 3 is done" });

  // ask numbers the options and says how to reply.
  requests.length = 0;
  result = await run(["ask", "Which stack?", "--option", "Postgres", "--option", "SQLite"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(requests[0].body.text, /Which stack\?/);
  assert.match(requests[0].body.text, /1\. Postgres/);
  assert.match(requests[0].body.text, /2\. SQLite/);
  assert.match(requests[0].body.text, /answer <number>/);

  // poll accepts the good message, drops the other two, and reports both drops.
  requests.length = 0;
  updates = [
    message(10, "status"),
    message(11, "stop", { chat: "9999" }),
    message(12, "resume", { from: "8" }),
  ];
  result = await run(["poll"], { KAHANAS_TELEGRAM_ALLOWED_SENDERS: "7" });
  assert.equal(result.status, 0, result.stderr);
  let out = lines(result.stdout);
  assert.equal(out.length, 3);
  assert.deepEqual(
    { verb: out[0].verb, from: out[0].from, message_id: out[0].message_id },
    { verb: "status", from: "7", message_id: 10 },
  );
  assert.equal(out[1].dropped, true);
  assert.equal(out[2].dropped, true);
  // A dropped message is never quoted back, only counted.
  assert.ok(!JSON.stringify(out[1]).includes("stop"));

  // The offset advances past dropped updates so nothing replays.
  const saved = JSON.parse(await readFile(join(scratch, "offset.json"), "utf8"));
  assert.equal(saved.offset, 13);
  assert.equal(requests[0].body.offset, 0);

  requests.length = 0;
  updates = [];
  result = await run(["poll"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "");
  assert.equal(requests[0].body.offset, 13);

  // --timeout is passed through to getUpdates.
  requests.length = 0;
  result = await run(["poll", "--timeout", "25"]);
  assert.equal(requests[0].body.timeout, 25);
  assert.equal((await run(["poll", "--timeout", "soon"])).status, 1);

  // A missing credential stops with a clear reason and no token anywhere.
  result = await run(["send", "hello"], { KAHANAS_TELEGRAM_BOT_TOKEN: "" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /KAHANAS_TELEGRAM_BOT_TOKEN/);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("SECRET-TOKEN-VALUE"));

  // A Telegram error is reported by method name, never by the URL that holds
  // the token.
  const failing = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, description: "chat not found" }));
  });
  await new Promise((done) => failing.listen(0, "127.0.0.1", done));
  result = await run(["send", "hello"], { KAHANAS_TELEGRAM_API_BASE: `http://127.0.0.1:${failing.address().port}` });
  failing.close();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /sendMessage failed: chat not found/);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("SECRET-TOKEN-VALUE"));

  // An unreachable server does not leak the token either.
  result = await run(["send", "hello"], { KAHANAS_TELEGRAM_API_BASE: "http://127.0.0.1:1" });
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("SECRET-TOKEN-VALUE"));

  // An unknown command explains itself rather than doing something.
  assert.equal((await run(["shout", "hello"])).status, 1);
  assert.equal((await run(["send"])).status, 1);
  assert.equal((await run(["ask", "why?", "--option"])).status, 1);

  console.log("harness telegram: transport, allowlist, verbs, offset, and secret handling passed");
} finally {
  server.close();
  await rm(scratch, { recursive: true, force: true });
}
