#!/usr/bin/env node
// Fills tools/server/install-bbb-duration-caps.php.tpl with the 19 BBB
// duration-cap files (commit 0133895c3) as base64 payloads, and writes the
// self-contained installer to the path given as argv[2] (default
// ./install-bbb-duration-caps-1.php). The staged filename carries a revision
// number — a re-stage after any edit needs a FRESH name, because the edge
// caches the old bytes at the old path.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const tpl = fs.readFileSync(path.join(ROOT, "tools", "server", "install-bbb-duration-caps.php.tpl"), "utf8");

// Docroot-relative target => [repo path, marker]. accesslib.php FIRST: it
// defines the pqh_live_duration_* helpers every other file calls, so it must
// be on disk before any caller lands.
const HUB = "src/moodle/local_hubredirect";
const PQ = "src/moodle/local_prequran";
const FILES = [
  ["local/hubredirect/accesslib.php", `${HUB}/accesslib.php`, "function pqh_live_duration_cap_minutes"],
  ["local/prequran/locallib.php", `${PQ}/locallib.php`, "$merged['duration'] = 270"],
  ["local/hubredirect/live_capacity.php", `${HUB}/live_capacity.php`, "pqh_live_duration_"],
  ["local/hubredirect/live_create_wizard.php", `${HUB}/live_create_wizard.php`, "pqh_live_duration_"],
  ["local/hubredirect/live_review.php", `${HUB}/live_review.php`, "pqh_live_duration_"],
  ["local/hubredirect/live_series.php", `${HUB}/live_series.php`, "pqh_live_duration_"],
  ["local/hubredirect/live_series_wizard.php", `${HUB}/live_series_wizard.php`, "pqh_live_duration_"],
  ["local/hubredirect/live_sessions.php", `${HUB}/live_sessions.php`, "pqh_live_duration_"],
  ["local/hubredirect/workspace_series.php", `${HUB}/workspace_series.php`, "pqh_live_duration_"],
  ["local/hubredirect/workspace_series_portallib.php", `${HUB}/workspace_series_portallib.php`, "pqh_live_duration_"],
  ["local/hubredirect/workspace_sessions.php", `${HUB}/workspace_sessions.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-capacity.php", `${PQ}/portal_handlers/live-capacity.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-create-wizard.php", `${PQ}/portal_handlers/live-create-wizard.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-review.php", `${PQ}/portal_handlers/live-review.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-series-wizard.php", `${PQ}/portal_handlers/live-series-wizard.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-series.php", `${PQ}/portal_handlers/live-series.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/live-sessions.php", `${PQ}/portal_handlers/live-sessions.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/workspace-series.php", `${PQ}/portal_handlers/workspace-series.php`, "pqh_live_duration_"],
  ["local/prequran/portal_handlers/workspace-sessions.php", `${PQ}/portal_handlers/workspace-sessions.php`, "pqh_live_duration_"],
];

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const manifest = {};
for (const [target, repoPath, marker] of FILES) {
  const bytes = fs.readFileSync(path.join(ROOT, repoPath));
  if (!bytes.toString("utf8").includes(marker)) {
    console.error(`REFUSING: ${repoPath} does not contain its marker '${marker}' — wrong tree?`);
    process.exit(1);
  }
  manifest[target] = { sha1: sha1(bytes), b64: bytes.toString("base64"), marker };
  console.log(`  ${target}  ${sha1(bytes)}  ${bytes.length}B`);
}

const out = tpl.replace("{{MANIFEST_B64}}", Buffer.from(JSON.stringify(manifest)).toString("base64"));
const dest = process.argv[2] || path.join(ROOT, "install-bbb-duration-caps-1.php");
fs.writeFileSync(dest, out);
console.log(`${dest} (${out.length} bytes)  installer sha1 ${sha1(fs.readFileSync(dest))}`);
