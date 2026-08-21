#!/usr/bin/env node
// Upload the portal pages (src/portal/*.html) to Bunny storage at
// platform/portal/ — the second of the two manual deploy channels
// (docs: plugin PHP goes to the Moodle server, portal HTML goes here).
//
// Written because this channel had NO tool. Every other tier has one, and the
// cost of that gap is measurable: on 2026-08-21 the two live portal pages were
// serving 2026-07-22 and 2026-07-31 builds, three merged commits behind, and
// nothing in the repo could say so. A channel nobody can inspect is a channel
// that silently drifts.
//
// So the default action is a DRIFT REPORT, not an upload. It compares every
// local page against the bytes the CDN actually serves and prints which differ
// — the question "what is stale?" had no answer before, and it is the question
// worth asking most often.
//
//   node tools/upload-portal-to-bunny.js                     # drift report, uploads nothing
//   node tools/upload-portal-to-bunny.js --upload teacher-portal.html student-parent-portal.html
//   node tools/upload-portal-to-bunny.js --upload --all      # every page that differs
//
// Named pages are uploaded even if they look identical; --all uploads only what
// differs. BUNNY_KEY comes from the environment or .env.
//
// Pages are served max-age=300 (verified, not assumed — re-measure with
// `curl -sI`), so a release propagates in five minutes with no purge. Query
// strings are ignored by this pull zone, so the ?probe= below is a cache-buster
// for the READ only in the sense that it cannot create a new entry; the compare
// therefore reflects what the edge is really holding.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const LOCAL_DIR = path.join(ROOT, "src", "portal");
const ZONE = "ehelacademy";
const REMOTE_DIR = "platform/portal";
const CDN = "https://ehelacademy.b-cdn.net";
const STORAGE = "https://storage.bunnycdn.com";

function bunnyKey() {
  if (process.env.BUNNY_KEY) return process.env.BUNNY_KEY.trim();
  const envFile = path.join(ROOT, ".env");
  if (fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim();
  }
  console.error("No BUNNY_KEY in the environment or .env.");
  process.exit(2);
}

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const short = (h) => h.slice(0, 16);

const argv = process.argv.slice(2);
const UPLOAD = argv.includes("--upload");
const ALL = argv.includes("--all");
const named = argv.filter((a) => !a.startsWith("--"));

async function liveBytes(page) {
  // A never-before-seen query string returns the SAME cached entry on this pull
  // zone (query strings are ignored for caching), so this reads what the edge
  // holds rather than minting a new object.
  const res = await fetch(`${CDN}/${REMOTE_DIR}/${page}?probe=${Date.now()}`);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function put(page, buf, key) {
  const res = await fetch(`${STORAGE}/${ZONE}/${REMOTE_DIR}/${page}`, {
    method: "PUT",
    headers: { AccessKey: key, "Content-Type": "text/html; charset=utf-8" },
    body: buf,
  });
  if (!res.ok) throw new Error(`PUT ${page} → ${res.status} ${await res.text()}`);
}

(async () => {
  const pages = named.length
    ? named
    : fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".html")).sort();

  if (!named.length && !ALL && UPLOAD) {
    console.error("Refusing to upload every page implicitly. Name the pages, or pass --all.");
    process.exit(2);
  }

  console.log(`${pages.length} page(s) · comparing ${LOCAL_DIR} against ${CDN}/${REMOTE_DIR}/\n`);

  const differ = [];
  const missing = [];
  for (const page of pages) {
    const localPath = path.join(LOCAL_DIR, page);
    if (!fs.existsSync(localPath)) {
      console.log(`  ?  ${page.padEnd(42)} not in src/portal/`);
      continue;
    }
    const local = fs.readFileSync(localPath);
    const live = await liveBytes(page);
    if (!live) {
      missing.push({ page, local });
      console.log(`  +  ${page.padEnd(42)} not on the CDN yet (${local.length}B)`);
    } else if (sha(live) !== sha(local)) {
      differ.push({ page, local });
      console.log(`  ≠  ${page.padEnd(42)} live ${String(live.length).padStart(7)}B ${short(sha(live))}  local ${String(local.length).padStart(7)}B ${short(sha(local))}`);
    } else {
      console.log(`  =  ${page.padEnd(42)} in sync`);
    }
  }

  const stale = [...missing, ...differ];
  console.log(`\n${stale.length} page(s) differ from the CDN, ${pages.length - stale.length} in sync.`);

  if (!UPLOAD) {
    console.log("\nDrift report only — nothing uploaded. Add --upload to push.");
    return;
  }

  // A named page is uploaded whether or not it differs; --all pushes the drift.
  const queue = named.length
    ? named.filter((p) => fs.existsSync(path.join(LOCAL_DIR, p)))
        .map((p) => ({ page: p, local: fs.readFileSync(path.join(LOCAL_DIR, p)) }))
    : stale;

  if (!queue.length) {
    console.log("Nothing to upload.");
    return;
  }

  // Gate BEFORE the PUT, not after. A `portal:` target that is not in
  // portal_launch.php's allowlist does not 404 — the launcher falls through to
  // its default and the user silently lands on a different page. Once that is
  // on the CDN the only symptom is somebody saying "that button goes to the
  // wrong place", so the moment to catch it is here.
  if (!argv.includes("--skip-route-check")) {
    const { spawnSync } = require("child_process");
    console.log("\nchecking portal: routes resolve…");
    const gate = spawnSync(process.execPath, [path.join(__dirname, "check-portal-routes.mjs")], { stdio: "inherit" });
    if (gate.status !== 0) {
      console.error("\n✗ route check failed — nothing uploaded. Fix the links, or pass --skip-route-check if you know why.");
      process.exit(1);
    }
  }

  const key = bunnyKey();
  console.log(`\nuploading ${queue.length} page(s)…`);
  for (const { page, local } of queue) {
    await put(page, local, key);
    console.log(`  ✓ ${page} (${local.length}B)`);
  }

  // Two verifications, in this order, because they answer different questions
  // and only the first is immediate.
  //
  // STORAGE is authoritative for "did the write land", and answers now. THE
  // EDGE is what a parent actually sees, but these pages are max-age=300 with a
  // warm cache entry, so straight after a PUT the edge is still legitimately
  // serving the old copy. The first version of this tool checked only the edge
  // and reported a perfectly good deploy as ✗ STILL STALE — a false alarm that,
  // left in, teaches whoever runs it to ignore the check.
  console.log("\nverifying on storage (authoritative — did the write land?)…");
  let bad = 0;
  const key2 = key;
  for (const { page, local } of queue) {
    const res = await fetch(`${STORAGE}/${ZONE}/${REMOTE_DIR}/${page}`, { headers: { AccessKey: key2 } });
    const ok = res.ok && sha(Buffer.from(await res.arrayBuffer())) === sha(local);
    if (!ok) bad++;
    console.log(`  ${ok ? "✓" : "✗"} ${page.padEnd(42)} ${ok ? "stored" : "NOT STORED — the upload did not take"}`);
  }
  if (bad) {
    console.error(`\n✗ ${bad} page(s) are not on storage. This is a real failure — retry.`);
    process.exit(1);
  }

  console.log("\nwaiting for the edge (max-age=300, so up to five minutes)…");
  const deadline = Date.now() + 330000;
  const pending = new Map(queue.map((q) => [q.page, q.local]));
  while (pending.size && Date.now() < deadline) {
    for (const [page, local] of [...pending]) {
      const live = await liveBytes(page);
      if (live && sha(live) === sha(local)) {
        pending.delete(page);
        console.log(`  ✓ ${page.padEnd(42)} served by the edge`);
      }
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 15000));
  }
  if (pending.size) {
    console.log(`\n  ${pending.size} page(s) still cached at the edge after five minutes: ${[...pending.keys()].join(", ")}`);
    console.log("  Storage is correct, so this is cache lag rather than a failed deploy — re-check with the drift report.");
    return;
  }
  console.log("\n✓ every uploaded page is on storage and served by the edge.");
})();
