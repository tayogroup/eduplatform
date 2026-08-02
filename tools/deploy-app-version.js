#!/usr/bin/env node
// App-code path versioning (P1.6) — deploys the learner-app CODE as an immutable,
// version-pinned bundle so a redeploy never needs a pull-zone purge.
//
// Per subject, the code that today lives at app/{subject}/shared/ is uploaded to
//   app/{subject}/v{TAG}/…            (immutable — a new TAG = a new path = a
//                                      guaranteed cache miss, no purge needed)
// and app/{subject}/index.html is rewritten to reference v{TAG}/course-ui.{js,css}
// directly (short-cached — it IS the release pointer; flipping it swaps versions).
// The 6-line grade redirect stays stable at app/{subject}/shared/grade-redirect.js
// (grade-N/index.html already points there). Because v{TAG}/ is the SAME directory
// depth as shared/, every ../../shared|media|content import still resolves — no
// source edits, and dev keeps loading shared/ exactly as before.
//
// Assets (grade-N/media, ebooks, vocabulary) and content/media trees are deployed
// by the other tools and are unaffected. Shared modules (course-shell.js,
// progress-client.js) go to app/shared/ (short-cached; imported via ../../shared/).
//
// Usage: BUNNY_KEY=… node tools/deploy-app-version.js [v2] [--shell] [subject…]
//   default tag: v1. Name one or more subjects (english mathematics science
//   computing) to release only those and leave the rest on their current version;
//   omit for all. A one-subject --shell release also skips app/shared/, since
//   v{TAG}/ already carries those modules and app/shared/ is read by every subject.
//   e.g. BUNNY_KEY=… node tools/deploy-app-version.js v111 --shell english

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-appver-manifest.json");
const CONCURRENCY = 10;
// Every course ships through this tool. global-perspectives and intensive-english
// were absent, which is why they grew their own cache-busting: GP minted dated
// filenames (course-ui-20260802a.css) and intensive-english relied on ?v=, which
// does nothing — the pull zone serves a never-before-seen query string as
// `CDN-Cache: HIT` off the same entry as the bare URL. Both now use the version
// path like every other subject.
const ALL_SUBJECTS = ["english", "mathematics", "science", "computing", "global-perspectives", "intensive-english"];
// Every subject now runs from shell/subjects/. The standalone shared/course-ui.js
// files are one-line loaders kept only so index.html can keep referencing the
// stable name the deploy contract rewrites. Releases are therefore always
// --shell; this list exists so the guard below still has something to check if a
// future subject arrives with its own runtime before it is migrated.
const NON_SHELL_SUBJECTS = [];

const argv = process.argv.slice(2);
// --dry prints the exact remote paths a release would write and exits without
// uploading. Worth having: this tool's whole job is which path a file lands on,
// and until now the only way to see that was to run a real deploy.
const DRY = argv.includes("--dry");
if (!KEY && !DRY) { console.error("BUNNY_KEY not set (use --dry to preview without uploading)"); process.exit(1); }
const TAG = (argv.find((a) => /^v\d+$/.test(a))) || "v1";
// Optional subject filter: name one or more subjects to release only those. The
// release pointer is already per-subject (app/{subject}/index.html + current.json),
// so a single-subject cutover is well defined -- there was just no way to ask for
// one, which meant shipping a fix to one course rewrote every course's pointer and
// dragged in whatever else happened to be sitting in the tree. Omit to release all,
// exactly as before.
const picked = argv.filter((a) => !a.startsWith("--") && !/^v\d+$/.test(a));
const unknown = picked.filter((s) => !ALL_SUBJECTS.includes(s));
if (unknown.length) {
  // Fail rather than fall back to every subject: a typo'd name would otherwise
  // silently widen a one-subject release into a full one.
  console.error(`unknown subject(s): ${unknown.join(", ")}\nexpected any of: ${ALL_SUBJECTS.join(", ")}`);
  process.exit(1);
}
const SUBJECTS = picked.length ? picked : ALL_SUBJECTS;
const PARTIAL = picked.length > 0;
// --shell: package the unified shell (P1.5) instead of the per-subject apps.
// Each subject's v{TAG}/ becomes self-contained: course-ui.js (the subject
// module), course-app.js (the shell core), the subject's visual modules, and
// course-ui.css — with import paths rewritten for the deployed layout.
const SHELL = process.argv.slice(2).includes("--shell");
// computing and global-perspectives have no shell/subjects/ module — a --shell
// release naming them would fail on a missing file part-way through, after some
// items had already uploaded. Refuse up front instead.
const shellless = SHELL ? SUBJECTS.filter((s) => NON_SHELL_SUBJECTS.includes(s)) : [];
if (shellless.length) {
  console.error(`--shell was given but ${shellless.join(", ")} run a standalone shared/course-ui.js.\n` +
    `Release them without --shell: node tools/deploy-app-version.js ${TAG} ${shellless.join(" ")}`);
  process.exit(1);
}

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
const CT = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
};
const ctFor = (name) => CT[path.extname(name).toLowerCase()] || "application/octet-stream";

// index.html transform: point the CSS link + JS loader at v{TAG}/ instead of the
// dev-time ./shared/…?v=… reference. Robust to both loader shapes (bare <script>
// and the inline courseScript block).
function versionIndexHtml(html, subject) {
  const out = html
    .replace(/\.\/shared\/course-ui\.css(?:\?v=[^"']*)?/g, `${TAG}/course-ui.css`)
    .replace(/\.\/shared\/course-ui\.js(?:\?v=[^"']*)?/g, `${TAG}/course-ui.js`)
    // brand-fx.js is loaded straight from app/shared/ by computing's entry. That
    // path is max-age=2592000 and unversioned, so it outlives the release that
    // introduced it; pull it into v{TAG}/ with everything else.
    .replace(/\.\.\/shared\/brand-fx\.js(?:\?v=[^"']*)?/g, `${TAG}/brand-fx.js`);

  // Fail rather than ship an unversioned pointer. Before this guard, a subject
  // whose entry did not match these patterns — GP's dated course-ui-20260802a.js
  // was exactly that — deployed an index.html still pointing at ./shared/, so the
  // release uploaded a v{TAG}/ bundle nothing ever loaded and the course kept
  // serving the thirty-day-cached copy.
  if (!out.includes(`${TAG}/course-ui.css`) || !out.includes(`${TAG}/course-ui.js`)) {
    throw new Error(
      `${subject}/index.html does not reference ./shared/course-ui.css and ./shared/course-ui.js — ` +
      `nothing was version-pinned. Point the entry at those two stable names.`);
  }
  return out;
}

// --- keeping v{TAG}/ self-contained -----------------------------------------
// The version path only busts the cache for what is INSIDE it. Anything a bundle
// reaches out to still comes from an unversioned, thirty-day-cached path — so a
// release that imports app/shared/ or app/english/shared/ is only partly pinned.
// That was live: mathematics and science on v110 both opened course-ui.css with
//   @import url("../../english/shared/course-ui-20260723e.css")
// which resolves to app/english/shared/ and carries the 67 KB design system —
// most of the CSS in the release. Dating that filename by hand was the workaround
// this replaces.
// NOTE: brand-fx.js is NOT tracked in git (nor is shared/ehel-academy-logo.png),
// though computing/index.html loads it and it now ships inside every version
// bundle. It resolves from the working tree today, but a fresh clone would not
// have it — so a missing module is reported and skipped rather than throwing
// part-way through a release. Committing it is the real fix.
const SHARED_MODULES = ["course-shell.js", "progress-client.js", "seb-session.js", "lesson-gate.js", "brand-fx.js"];
const sharedModuleItems = (subject) => SHARED_MODULES.flatMap((name) => {
  const src = path.join(EHEL, "shared", name);
  if (!fs.existsSync(src)) { console.log(`  (skip ${name}: not in the working tree)`); return []; }
  return [{ remote: `app/${subject}/${TAG}/${name}`, buf: fs.readFileSync(src) }];
});
const selfContainJs = (src) => src.replace(
  /\.\.\/\.\.\/shared\/(course-shell|progress-client|seb-session|lesson-gate|brand-fx)\.js(\?v=[^"']*)?/g, "./$1.js");
const selfContainCss = (src) => src.replace(
  /@import url\(["']\.\.\/\.\.\/english\/shared\/course-ui\.css["']\);/, '@import url("./design-system.css");');

// Import rewrites for the deployed shell layout. Modules resolve imports against
// their own URL (app/{subject}/v{TAG}/…), so:
//   subject module: ../../{subject}/shared/X.js → ./X.js   (X copied into vN)
//                   ../course-app.js            → ./course-app.js
//                   ../../shared/…              → unchanged (→ app/shared/) ✓
//   shell core:     ../shared/X.js              → ../../shared/X.js (→ app/shared/)
// vN is fully self-contained: the subject module, the shell core, the subject's
// visuals, AND the cross-subject modules (course-shell, progress-client) all
// live inside the immutable version path — so a release can never be skewed by
// a stale cached shared file.
function shellSubjectModule(subject) {
  return fs.readFileSync(path.join(EHEL, "shell", "subjects", `${subject}.js`), "utf8")
    .replace(/\.\.\/\.\.\/(?:english|mathematics|science|computing|global-perspectives|intensive-english)\/shared\/([A-Za-z0-9_-]+\.js)(\?v=[^"']*)?/g, "./$1")
    .replace(/\.\.\/\.\.\/shared\/(course-shell|progress-client)\.js(\?v=[^"']*)?/g, "./$1.js")
    .replace(/\.\.\/course-app\.js(\?v=[^"']*)?/g, "./course-app.js");
}
function shellCore() {
  return fs.readFileSync(path.join(EHEL, "shell", "course-app.js"), "utf8")
    .replace(/\.\.\/shared\/(course-shell|progress-client|seb-session|lesson-gate)\.js(\?v=[^"']*)?/g, "./$1.js");
}

// Build the deploy list. Each item is {remote, buf, always?} — always-upload items
// (the pointer files) skip the hash cache since they change every release.
function buildItems() {
  const items = [];
  for (const subject of SUBJECTS) {
    const sharedDir = path.join(EHEL, subject, "shared");
    for (const name of fs.readdirSync(sharedDir)) {
      if (!/\.(js|css)$/.test(name)) continue;
      const buf = fs.readFileSync(path.join(sharedDir, name));
      if (name === "grade-redirect.js") {
        // stable entry-layer file — grade-N/index.html loads ../shared/grade-redirect.js
        items.push({ remote: `app/${subject}/shared/${name}`, buf });
      } else if (SHELL) {
        // shell mode: vN gets the subject's visuals/css; course-ui.js is replaced
        // by the shell subject module below.
        if (name !== "course-ui.js") {
          items.push({ remote: `app/${subject}/${TAG}/${name}`, buf: name.endsWith(".css") ? Buffer.from(selfContainCss(buf.toString("utf8"))) : buf });
        }
      } else {
        // Standalone subject: its own course-ui.js reaches into app/shared/ for
        // course-shell/progress-client, so rewrite those the same way shell mode
        // does and copy the modules in below.
        const text = /\.(js|css)$/.test(name) ? buf.toString("utf8") : null;
        const fixed = name.endsWith(".css") ? selfContainCss(text) : selfContainJs(text);
        items.push({ remote: `app/${subject}/${TAG}/${name}`, buf: Buffer.from(fixed) }); // immutable code
      }
    }
    // The design system lives in the English tree and every other subject
    // @imports it. Carry a copy into this subject's version path so the import
    // resolves inside v{TAG}/ instead of the unversioned app/english/shared/.
    if (subject !== "english") {
      items.push({
        remote: `app/${subject}/${TAG}/design-system.css`,
        buf: fs.readFileSync(path.join(EHEL, "english", "shared", "course-ui.css")),
      });
    }
    if (SHELL) {
      items.push({ remote: `app/${subject}/${TAG}/course-ui.js`, buf: Buffer.from(shellSubjectModule(subject)) });
      items.push({ remote: `app/${subject}/${TAG}/course-app.js`, buf: Buffer.from(shellCore()) });
    }
    items.push(...sharedModuleItems(subject));
    // Rewritten entry + release pointer (always upload — they carry the version).
    const html = versionIndexHtml(fs.readFileSync(path.join(EHEL, subject, "index.html"), "utf8"), subject);
    items.push({ remote: `app/${subject}/index.html`, buf: Buffer.from(html), always: true });
    const current = { version: TAG, shell: SHELL, builtFrom: SHELL ? "src/prototypes/ehel-academy/shell" : `src/prototypes/ehel-academy/${subject}`, contract: "1.0" };
    items.push({ remote: `app/${subject}/current.json`, buf: Buffer.from(JSON.stringify(current, null, 2) + "\n"), always: true });
  }
  // Shared modules imported via ../../shared/ (course-shell.js, progress-client.js).
  //
  // Skipped for a single-subject shell release: v{TAG}/ already carries its own
  // copies of these (see the SHELL block above, which is what makes the version
  // path self-contained), while app/shared/ is read by every OTHER subject too.
  // Writing it during a one-subject cutover would push whatever else is currently
  // in ehel-academy/shared/ into courses this release was never meant to touch.
  // Non-shell releases still need it: there, subjects import ../../shared/ directly.
  if (!(PARTIAL && SHELL)) {
    const topShared = path.join(EHEL, "shared");
    for (const name of fs.readdirSync(topShared)) {
      if (!/\.(js|css)$/.test(name)) continue;
      items.push({ remote: `app/shared/${name}`, buf: fs.readFileSync(path.join(topShared, name)) });
    }
  }
  return items;
}

async function put(remote, buf) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": ctFor(remote) }, body: buf });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
}

(async () => {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  let all;
  // A contract failure is a configuration mistake, not a crash — report it as
  // one line rather than a stack trace, and before anything has been uploaded.
  try { all = buildItems(); }
  catch (e) { console.error(e.message); process.exit(1); }
  const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));
  console.log(`tag: ${TAG} | subjects: ${SUBJECTS.join(",")}${PARTIAL ? ` (partial release — ${ALL_SUBJECTS.filter((s) => !SUBJECTS.includes(s)).join(",")} left on their current version)` : " (all)"}${SHELL ? " | shell" : ""}`);
  console.log(`items: ${all.length} | to upload: ${todo.length} (${todo.filter((x) => x.always).length} pointer files always sent)`);
  if (DRY) {
    for (const item of all) console.log(`  ${String(item.buf.length).padStart(7)}B  ${item.remote}${item.always ? "  (pointer)" : ""}`);
    // app/shared/fonts/ is exempt. A woff2 is immutable under its own name — the
    // filename carries family, style and weight range — so it is already
    // content-versioned and a change means a new file, not a new byte stream at
    // the same path. Copying 115 KB of it into every subject's every release
    // would cost real bandwidth to pin something that cannot go stale.
    const escapes = all.filter((x) => /\/v\d+\//.test(x.remote) && /\.(js|css)$/.test(x.remote))
      .flatMap((x) => (x.buf.toString("utf8").match(/\.\.\/\.\.\/(?:shared|english)\/[^"')?\s]+/g) || [])
        .filter((ref) => !ref.startsWith("../../shared/fonts/"))
        .map((ref) => `  ${x.remote} → ${ref}`));
    console.log(escapes.length
      ? `\nWARNING — ${escapes.length} reference(s) escape the version path to an unversioned, 30-day-cached location:\n${escapes.join("\n")}`
      : `\nAll ${TAG} bundles are self-contained: no reference reaches outside the version path.`);
    console.log("\n(dry run — nothing uploaded)");
    return;
  }
  let done = 0, failed = 0;
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
  let idx = 0;
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++];
      let ok = false;
      for (let a = 1; a <= 4 && !ok; a += 1) {
        try { await put(item.remote, item.buf); ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${item.remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { if (!item.always) manifest[item.remote] = sha1(item.buf); done += 1; process.stdout.write(`  ✓ ${item.remote}\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`\n──────── done ──────── uploaded: ${done} | failed: ${failed}`);
  console.log(`Release ${TAG} is live once app/{subject}/index.html is served fresh (short-cache or one purge on first cutover).`);
})();
