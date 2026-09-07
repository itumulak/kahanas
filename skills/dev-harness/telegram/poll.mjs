#!/usr/bin/env node
// Telegram transport for /dev-harness.
//
// Three commands:
//   send "<text>"                          send one message
//   ask "<question>" --option a --option b send a numbered question
//   poll [--timeout <seconds>]             print accepted messages, one JSON object per line
//
// Inbound is untrusted. Anyone who can post in the chat can try to steer the
// run, so a message is accepted only when its chat id matches and its sender is
// on the allowlist. Everything else is dropped and reported as dropped.
//
// The bot token is read from the environment and never printed, never placed in
// an argument, and never written to the state file.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const VERBS = new Set(["status", "stop", "pause", "resume", "answer", "approve", "deny"]);
const DEFAULT_STATE_DIR = join(".konteksto", ".harness");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    fail(`Missing ${name} in the environment.`);
  }
  return value;
}

function config() {
  return {
    token: env("KAHANAS_TELEGRAM_BOT_TOKEN"),
    chatId: String(env("KAHANAS_TELEGRAM_CHAT_ID")),
    senders: (process.env.KAHANAS_TELEGRAM_ALLOWED_SENDERS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    base: process.env.KAHANAS_TELEGRAM_API_BASE ?? "https://api.telegram.org",
    stateDir: process.env.KAHANAS_HARNESS_STATE_DIR ?? DEFAULT_STATE_DIR,
  };
}

// The token sits in the path, so a thrown URL would leak it into a log or a
// transcript. Report the method name instead.
async function call(cfg, method, body) {
  let response;
  try {
    response = await fetch(`${cfg.base}/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  } catch (error) {
    fail(`Telegram ${method} could not be reached: ${error.code ?? error.name ?? "request failed"}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    fail(`Telegram ${method} returned a body that is not JSON (status ${response.status}).`);
  }
  if (!payload.ok) {
    fail(`Telegram ${method} failed: ${payload.description ?? `status ${response.status}`}`);
  }
  return payload.result;
}

async function offsetFile(cfg) {
  return join(cfg.stateDir, "offset.json");
}

async function readOffset(cfg) {
  try {
    const raw = JSON.parse(await readFile(await offsetFile(cfg), "utf8"));
    return Number.isInteger(raw.offset) ? raw.offset : 0;
  } catch {
    return 0;
  }
}

async function writeOffset(cfg, offset) {
  const file = await offsetFile(cfg);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify({ offset }, null, 2)}\n`);
}

// A control instruction is a known first word. Everything else is a freeform
// instruction, which the coordinator weighs under the ownership rules rather
// than executing as a command.
export function parseMessage(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { verb: "instruction", argument: "" };
  const [first, ...rest] = trimmed.split(/\s+/);
  const verb = first.toLowerCase();
  if (!VERBS.has(verb)) return { verb: "instruction", argument: trimmed };
  return { verb, argument: trimmed.slice(first.length).trim() };
}

export function accept(cfg, update) {
  const message = update.message ?? update.edited_message;
  if (!message) return { accepted: false, reason: "not a message" };
  if (String(message.chat?.id ?? "") !== cfg.chatId) {
    return { accepted: false, reason: "chat is not the configured chat" };
  }
  const from = String(message.from?.id ?? "");
  if (cfg.senders.length && !cfg.senders.includes(from)) {
    return { accepted: false, reason: "sender is not on the allowlist" };
  }
  return { accepted: true, message };
}

async function send(cfg, text) {
  await call(cfg, "sendMessage", { chat_id: cfg.chatId, text });
  process.stdout.write(`${JSON.stringify({ sent: true })}\n`);
}

async function ask(cfg, question, options) {
  const numbered = options.map((option, index) => `${index + 1}. ${option}`).join("\n");
  const body = options.length
    ? `${question}\n\n${numbered}\n\nReply with: answer <number>`
    : `${question}\n\nReply with: answer <your answer>`;
  await call(cfg, "sendMessage", { chat_id: cfg.chatId, text: body });
  process.stdout.write(`${JSON.stringify({ sent: true, options: options.length })}\n`);
}

async function poll(cfg, timeout) {
  const offset = await readOffset(cfg);
  const updates = await call(cfg, "getUpdates", { offset, timeout });
  let highest = offset;
  for (const update of updates) {
    if (Number.isInteger(update.update_id) && update.update_id >= highest) {
      highest = update.update_id + 1;
    }
    const verdict = accept(cfg, update);
    if (!verdict.accepted) {
      process.stdout.write(`${JSON.stringify({ dropped: true, reason: verdict.reason })}\n`);
      continue;
    }
    const { verb, argument } = parseMessage(verdict.message.text);
    process.stdout.write(
      `${JSON.stringify({
        verb,
        argument,
        text: verdict.message.text ?? "",
        from: String(verdict.message.from?.id ?? ""),
        message_id: verdict.message.message_id,
      })}\n`,
    );
  }
  // The offset advances past dropped updates too. Leaving them would replay the
  // same rejected message on every cycle forever.
  if (highest !== offset) await writeOffset(cfg, highest);
}

async function main(argv) {
  const [command, ...rest] = argv;
  const cfg = config();
  if (command === "send") {
    if (!rest[0]) fail("send needs a message.");
    return send(cfg, rest[0]);
  }
  if (command === "ask") {
    if (!rest[0]) fail("ask needs a question.");
    const options = [];
    for (let index = 1; index < rest.length; index += 1) {
      if (rest[index] === "--option") {
        const value = rest[index + 1];
        if (!value) fail("--option needs a value.");
        options.push(value);
        index += 1;
      } else {
        fail(`Unknown argument for ask: ${rest[index]}`);
      }
    }
    return ask(cfg, rest[0], options);
  }
  if (command === "poll") {
    let timeout = 0;
    if (rest[0] === "--timeout") {
      timeout = Number(rest[1]);
      if (!Number.isFinite(timeout) || timeout < 0) fail("--timeout needs a number of seconds.");
    } else if (rest.length) {
      fail(`Unknown argument for poll: ${rest[0]}`);
    }
    return poll(cfg, timeout);
  }
  fail('Usage: poll.mjs send "<text>" | ask "<question>" [--option <text>] | poll [--timeout <seconds>]');
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith("poll.mjs");
if (invokedDirectly) await main(process.argv.slice(2));
