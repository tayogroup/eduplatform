#!/usr/bin/env node
// Gate: every `portal:` link on a portal page must resolve.
//
// A menu entry is written as ["portal:live-ops", "Live operations", "…"], and
// dashboard.html turns that into
// {moodle}/local/prequran/portal_launch.php?report=live-ops. portal_launch.php
// holds an explicit $reports allowlist mapping report id -> page file.
//
// WHY THIS IS A GATE AND NOT A LINT. A report id that is NOT in the allowlist
// does not 404. portal_launch.php falls through to its default (live-reports),
// so the learner or admin silently lands on a different page than the one they
// clicked. There is no error anywhere — the only symptom is a person saying
// "that button goes to the wrong place". Nothing else in the repo reads both
// sides of this mapping.
//
// It became worth writing on 2026-08-21, when dashboard.html shipped after a
// month of drift and took its menu from 40 entries to 112 — 99 portal: links in
// one upload, against an allowlist nothing had ever checked it agreed with.
//
//   npm run check:portal-routes          # offline, deterministic
//   node tools/check-portal-routes.mjs --cdn   # also compare against the CDN
//
// The core checks are local on purpose: no network, no BUNNY_KEY, same answer
// every time, so it can run anywhere. --cdn adds the two questions only the CDN
// can answer and needs a key.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTAL_DIR = path.join(ROOT, "src", "portal");
const LAUNCH = path.join(ROOT, "src", "moodle", "local_prequran", "portal_launch.php");

// Recorded exemptions: an allowlist entry whose page file is deliberately absent
// from src/portal/. Each needs a reason, and an exemption that STOPS firing is
// itself a failure — otherwise the list rots into a permanent amnesty. Same rule
// as check-english-ebooks.mjs.
const MISSING_FILE_EXEMPT = {
  "dashboard-19.html":
    "Live on the CDN with no source in the repo — one of 18 dashboard-N.html design variants uploaded during the 2026-07 portal build and never committed. portal_launch.php routes report=dashboard at it, so it is reachable; nothing can edit it. Delete this exemption when a source lands, or repoint the allowlist at dashboard.html.",
};

const argv = process.argv.slice(2);
const WITH_CDN = argv.includes("--cdn");

const fail = [];
const note = (list, msg) => list.push(msg);

// --- the allowlist ---------------------------------------------------------
if (!fs.existsSync(LAUNCH)) {
  console.error(`✗ portal_launch.php not found at ${LAUNCH} — cannot check anything.`);
  process.exit(2);
}
const launchSrc = fs.readFileSync(LAUNCH, "utf8");
// 'report-id' => ['access_callback', 'page.html'],
const allow = new Map();
for (const m of launchSrc.matchAll(/'([a-z0-9-]+)'\s*=>\s*\[\s*'([a-z0-9_]+)'\s*,\s*'([^']+)'\s*\]/gi)) {
  allow.set(m[1], { access: m[2], file: m[3] });
}
// A parser that silently matched nothing would pass every check below while
// comparing against an empty map — the shape of "green because it did no work".
if (allow.size < 50) {
  console.error(`✗ parsed only ${allow.size} allowlist entries from portal_launch.php — the $reports format has changed and this gate is not reading it.`);
  process.exit(2);
}

// --- what the pages actually link to ---------------------------------------
const pages = fs.readdirSync(PORTAL_DIR).filter((f) => f.endsWith(".html")).sort();
const refs = new Map(); // report id -> [pages linking it]
for (const page of pages) {
  const src = fs.readFileSync(path.join(PORTAL_DIR, page), "utf8");
  for (const m of src.matchAll(/portal:([a-z0-9-]+)/g)) {
    if (!refs.has(m[1])) refs.set(m[1], []);
    const list = refs.get(m[1]);
    if (!list.includes(page)) list.push(page);
  }
}

console.log(`${pages.length} portal page(s) · ${allow.size} allowlist entries · ${refs.size} distinct portal: id(s) linked\n`);

// --- A: every linked id is in the allowlist --------------------------------
const dead = [...refs.keys()].filter((id) => !allow.has(id)).sort();
if (dead.length) {
  for (const id of dead) {
    note(fail, `portal:${id} is linked by ${refs.get(id).join(", ")} but is not in the portal_launch.php allowlist — it will silently open the default page.`);
  }
}
console.log(`A. linked ids missing from the allowlist : ${dead.length === 0 ? "none ✓" : dead.length + " ✗"}`);

// --- B: every allowlist entry has a page file ------------------------------
const missing = [];
const staleExemptions = [];
for (const [id, entry] of allow) {
  const exists = fs.existsSync(path.join(PORTAL_DIR, entry.file));
  const exempt = Object.prototype.hasOwnProperty.call(MISSING_FILE_EXEMPT, entry.file);
  if (!exists && !exempt) missing.push(`${id} -> ${entry.file} (no such file in src/portal/)`);
  if (exists && exempt) staleExemptions.push(entry.file);
}
for (const m of missing) note(fail, `allowlist entry ${m}`);
for (const f of staleExemptions) {
  note(fail, `MISSING_FILE_EXEMPT still lists ${f}, but that file now exists — delete the exemption.`);
}
console.log(`B. allowlist entries with no page file  : ${missing.length === 0 ? "none ✓" : missing.length + " ✗"}${Object.keys(MISSING_FILE_EXEMPT).length ? `  (${Object.keys(MISSING_FILE_EXEMPT).length} exempt)` : ""}`);

// --- C: informational ------------------------------------------------------
const unreferenced = [...allow.keys()].filter((id) => !refs.has(id));
console.log(`C. allowlist entries nothing links to   : ${unreferenced.length} (informational — reachable by direct link)`);

// --- optional CDN comparison ----------------------------------------------
if (WITH_CDN) {
  const keyMatch = process.env.BUNNY_KEY
    || (fs.existsSync(path.join(ROOT, ".env")) && (fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m) || [])[1]);
  if (!keyMatch) {
    console.error("\n✗ --cdn needs BUNNY_KEY in the environment or .env.");
    process.exit(2);
  }
  const res = await fetch("https://storage.bunnycdn.com/ehelacademy/platform/portal/", { headers: { AccessKey: keyMatch.trim() } });
  if (!res.ok) {
    console.error(`\n✗ could not list portal storage (HTTP ${res.status}).`);
    process.exit(2);
  }
  const rows = await res.json();
  const cdn = rows.filter((r) => !r.IsDirectory && r.ObjectName.endsWith(".html")).map((r) => r.ObjectName);
  const orphans = cdn.filter((f) => !pages.includes(f)).sort();
  const unshipped = pages.filter((f) => !cdn.includes(f)).sort();
  console.log(`\nD. live on the CDN with no repo source  : ${orphans.length}${orphans.length ? "  " + orphans.join(", ") : " ✓"}`);
  console.log(`E. in the repo but never uploaded       : ${unshipped.length === 0 ? "none ✓" : unshipped.length + " ✗  " + unshipped.join(", ")}`);
  // An unshipped page is a real failure — someone wrote it and it reaches nobody.
  // An orphan is reported, not failed: the repo cannot delete what it never had,
  // and `npm run check:portal-routes` must not depend on the network to be green.
  for (const f of unshipped) note(fail, `${f} exists in src/portal/ but is not on the CDN — it reaches nobody.`);
}

// --- verdict ---------------------------------------------------------------
if (fail.length) {
  console.error(`\n✗ ${fail.length} problem(s):`);
  for (const f of fail) console.error(`   - ${f}`);
  process.exit(1);
}
console.log("\n✓ every portal: link resolves to an allowlisted report with a page behind it.");
