#!/usr/bin/env node
// Fills tools/server/install-wehel-tutoring-framing.php.tpl with the current
// wehel_chat.php + wehel_prompt.json as base64 payloads, and writes the
// self-contained installer to the scratch path given as argv[2] (or stdout
// path default ./install-wehel-tutoring-framing-1.php). The staged filename
// carries a revision number — a re-stage after any edit needs a FRESH name,
// because the edge caches the old bytes at the old path.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const tpl = fs.readFileSync(path.join(ROOT, "tools", "server", "install-wehel-tutoring-framing.php.tpl"), "utf8");
const chat = fs.readFileSync(path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_chat.php"));
const prompt = fs.readFileSync(path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_prompt.json"));

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const out = tpl
  .replace("{{CHAT_SHA1}}", sha1(chat))
  .replace("{{CHAT_B64}}", chat.toString("base64"))
  .replace("{{PROMPT_SHA1}}", sha1(prompt))
  .replace("{{PROMPT_B64}}", prompt.toString("base64"));

const dest = process.argv[2] || path.join(ROOT, "install-wehel-tutoring-framing-1.php");
fs.writeFileSync(dest, out);
console.log(`${dest} (${out.length} bytes)  chat sha1 ${sha1(chat)}  prompt sha1 ${sha1(prompt)}`);
