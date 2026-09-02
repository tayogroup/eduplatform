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
// Usage: BUNNY_KEY=… node tools/deploy-app-version.js [v2] [--shell] [--verify] [--dry] [--force-tag] [--force-lock] [--skip-print-check] [subject…]
//   An english release first renders the three Student-resources print sheets
//   through Chrome and REFUSES to upload if any is wrong (--skip-print-check
//   overrides). No other subject has a print path, so no other subject pays
//   for it. See lib/require-print-sheets.js.
//   A real upload takes a machine-wide lock on the storage zone first (see
//   lib/release-lock.js) and holds it until the manifest is written back, so two
//   releases on one machine cannot interleave. --dry and --plan-json neither take
//   it nor wait for it. --force-lock overrides a live holder and is the one flag
//   here that can cause the damage the lock prevents.
//   --verify  after uploading, read the release back through the CDN and fail if
//             the edge does not serve it (catches a version path poisoned by a
//             cached 404 — see docs/bunny-cache-config.md). Recommended always.
//   --dry     print the remote paths a release would write, and exit.
//   --plan-json  print {tag, shell, items:[{remote, sha1, pointer}]} and exit,
//             uploading nothing. Machine-readable twin of --dry; needs no
//             BUNNY_KEY. This is what check-ehel-deploy-sync.mjs reads to learn
//             which files a release contains.
//   default tag: v1. Name one or more subjects (english mathematics science
//   computing) to release only those and leave the rest on their current version;
//   omit for all. A one-subject --shell release also skips app/shared/, since
//   v{TAG}/ already carries those modules and app/shared/ is read by every subject.
//   e.g. BUNNY_KEY=… node tools/deploy-app-version.js v111 --shell english

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { requireTiersInStep } = require("./lib/require-tiers-in-step");
const { requirePlatformCors } = require("./lib/require-platform-cors");
const { acquireReleaseLock } = require("./lib/release-lock");
const { requirePrintSheets } = require("./lib/require-print-sheets");
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
// --plan-json prints WHAT a release contains and the sha1 of every byte stream it
// would write, then exits. It exists so check-ehel-deploy-sync.mjs can ask this
// tool what a version path holds instead of re-deriving the list itself.
//
// That check used to compare a single file — app/{subject}/{tag}/course-ui.js —
// and report the whole app tier as matching on the strength of it. A release
// ships fifteen. So a change to course-ui.css, word-pictures.js, lesson-gate.js
// or any other member was invisible to it, and on 2026-08-14 it reported English
// "in step" while an unreleased stylesheet fix sat in the tree. Nothing was
// wrong with the file it did check; everything it did not check was simply
// absent from the question.
//
// Emitted from buildItems() rather than from a list kept over there, because a
// second description of a release is a description free to drift from the one
// that ships.
const PLAN_JSON = argv.includes("--plan-json");
// --verify re-reads the release back THROUGH THE CDN once every file is up, and
// fails if the edge does not serve what storage now holds. It exists because a
// successful upload does not mean a served release: Edge Rule #1 puts a 1-year
// override on */app/*/v and Bunny applies it to a 404 as readily as a 200, so a
// version path that was requested before it existed keeps answering 404 for a
// year while this tool reports every file uploaded. See docs/bunny-cache-config.md.
//
// It runs AFTER the upload on purpose. Checking the same URLs beforehand is the
// thing that causes the fault — which is why this is a flag on the deploy rather
// than a script anyone would be tempted to run first.
const VERIFY = argv.includes("--verify");
if (!KEY && !DRY && !PLAN_JSON) { console.error("BUNNY_KEY not set (use --dry to preview without uploading)"); process.exit(1); }
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

// The mirror of the guard above, and the one that actually fires — NON_SHELL_
// SUBJECTS is empty, so the case worth refusing is --shell being LEFT OUT.
//
// Every subject runs from shell/subjects/ now, and each shared/course-ui.js is
// a one-line loader kept only so index.html can keep referencing the stable
// name. Release without --shell and that stub is what lands in v{TAG}/ —
// ~1.2 KB where the app is ~150 KB — and NOTHING downstream objects: --verify
// confirms the bytes arrived, not that they are the right bytes, and the
// "self-contained" line below is computed from the references in what was
// packaged, so a stub that references nothing passes it too. The release then
// serves 200 on every path and shows a learner a blank course.
//
// Refused up front rather than warned about, because the failure is silent
// everywhere else it could be caught.
const missingShell = SHELL ? [] : SUBJECTS.filter((s) => !NON_SHELL_SUBJECTS.includes(s));
if (missingShell.length) {
  console.error(`✗ --shell is required: ${missingShell.join(", ")} run from shell/subjects/.`);
  console.error("  Without it, course-ui.js ships as the ~1.2 KB loader stub instead of the app,");
  console.error("  and --verify still passes because it checks that bytes arrived, not which bytes.");
  console.error(`\n  node tools/deploy-app-version.js ${TAG} --shell --verify ${SUBJECTS.join(" ")}`);
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
    .replace(/\.\.\/shared\/brand-fx\.js(?:\?v=[^"']*)?/g, `${TAG}/brand-fx.js`)
    // Same shape, same reason: english/index.html loads the lucide runtime from
    // app/shared/. Left alone it would point at a path this release never
    // uploads, and every icon in the release would be an empty <i data-lucide>.
    .replace(/\.\.\/shared\/lucide\.min\.js(?:\?v=[^"']*)?/g, `${TAG}/lucide.min.js`);

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
// lucide.min.js rides along for the same reason brand-fx.js does — English's
// entry loads it straight from app/shared/, which this release does not upload
// and which is served max-age=2592000. Unlike the others it is vendored
// upstream (lucide 0.468.0, unmodified) and IS tracked in git, so it never hits
// the skip path below.
// html2canvas.min.js is the classroom chat's screenshot renderer (1.4.1,
// upstream-unmodified, tracked in git like lucide). The app lazy-loads it by
// deriving its URL from the lucide script tag already on the page, so it only
// needs to sit BESIDE lucide in every release -- no index.html rewrite.
const SHARED_MODULES = ["course-shell.js", "progress-client.js", "seb-session.js", "lesson-gate.js", "brand-fx.js", "lucide.min.js", "html2canvas.min.js"];
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
    // Every shell/ sibling the module imports, not just course-app.js. wehel.js
    // was the second one and had no rule, so a release rewrote course-app.js and
    // left `../wehel.js` pointing at app/{subject}/wehel.js — a path nothing
    // uploads. The entry module would fail to import and the whole course would
    // render blank, not merely lose its tutor. Matching the filename shape keeps
    // this true for the next component without another rule here.
    .replace(/\.\.\/([A-Za-z0-9_-]+\.js)(\?v=[^"']*)?/g, "./$1")
    // A subjects/ sibling is already written `./x.js`, but keeps its ?v= — and
    // shellCore() strips the query on its side, so the same file would arrive
    // under two URLs and be instantiated twice. Inside v{TAG}/ the immutable
    // path is what guarantees freshness; the query is redundant either way.
    .replace(/\.\/([A-Za-z0-9_-]+\.js)\?v=[^"']*/g, "./$1");
}

// The shell/ siblings a subject module imports, course-app.js aside — it is
// packaged separately through shellCore(). Read from the module's own imports so
// a component added later ships without this file changing.
function shellComponents(subject) {
  const src = fs.readFileSync(path.join(EHEL, "shell", "subjects", `${subject}.js`), "utf8");
  // BOTH sibling shapes a subject module uses: `../x.js` is a file in shell/,
  // `./x.js` one in shell/subjects/ — english's word-pictures.js. Only `../`
  // was matched, so word-pictures.js was never carried into v{TAG}/, the entry
  // module 404ed on its own import, and the course never booted at all: no
  // console error the app could show, just "Preparing your English lesson…"
  // forever. The self-containment check passed because `./word-pictures.js`
  // does not reach outside the version path — it only pointed at a file the
  // release had not put there.
  return [...src.matchAll(/^import\s[^"']*["'](\.\.?)\/([A-Za-z0-9_-]+\.js)(?:\?[^"']*)?["']/gm)]
    .map((m) => ({ name: m[2], from: `${m[1]}/${m[2]}`, src: path.join(EHEL, "shell", m[1] === ".." ? "." : "subjects", m[2]) }))
    .filter((item) => item.name !== "course-app.js");
}
function shellCore() {
  return fs.readFileSync(path.join(EHEL, "shell", "course-app.js"), "utf8")
    .replace(/\.\.\/shared\/(course-shell|progress-client|seb-session|lesson-gate)\.js(\?v=[^"']*)?/g, "./$1.js")
    // The shell/ siblings course-app.js imports by name — wehel.js today. The
    // subject module imports the SAME file, and shellSubjectModule drops the
    // ?v= when it rewrites `../wehel.js?v=…` to `./wehel.js`. Leaving the query
    // here gave the bundle two URLs for one file, so the browser instantiated
    // the module twice: the dock's chat panel and the subject's own tutor page
    // then held separate livePanels sets and separate Focus listeners, and
    // stopped seeing each other's changes. Strip on this side too — inside vN
    // the immutable version path is what guarantees freshness, so the query is
    // redundant, and both sides must agree for the module to be one instance.
    .replace(/\.\/([A-Za-z0-9_-]+\.js)\?v=[^"']*/g, "./$1");
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
      // Throw rather than skip: a component the module imports but that never
      // reaches v{TAG}/ is a bundle that cannot load at all. buildItems() runs
      // before the first upload, so failing here leaves the live release intact.
      for (const { name, from, src } of shellComponents(subject)) {
        if (!fs.existsSync(src)) {
          throw new Error(`shell/subjects/${subject}.js imports ${from}, which is not in the working tree — `
            + "the release would ship an entry module that cannot resolve it.");
        }
        items.push({ remote: `app/${subject}/${TAG}/${name}`, buf: fs.readFileSync(src) });
      }
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

// Which of this release's version-path files already sit on storage with other
// bytes. Reads the storage listing (one request per subject), never the CDN.
// Bunny's listing carries Length and a SHA-256 Checksum per object; a missing
// checksum falls back to length alone, and an unreadable listing is reported
// as such rather than treated as "free" — the tool would rather stop on a
// storage hiccup than mint a second release onto a taken tag.
async function tagAlreadyWritten(items, manifest) {
  const found = [];
  const bySubject = new Map();
  for (const item of items) {
    const m = item.remote.match(/^app\/([a-z-]+)\/(v\d+)\/(.+)$/);
    if (m && m[2] === TAG) { if (!bySubject.has(m[1])) bySubject.set(m[1], new Map()); bySubject.get(m[1]).set(m[3], item.buf); }
  }
  for (const [subject, files] of bySubject) {
    const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/app/${subject}/${TAG}/`);
    let listing;
    try {
      const r = await fetch(url, { headers: { AccessKey: KEY } });
      if (r.status === 404) continue;
      if (!r.ok) throw new Error(`${r.status}`);
      listing = await r.json();
    } catch (e) {
      found.push(`app/${subject}/${TAG}/ — could not read the storage listing (${e.message}); not proven free`);
      continue;
    }
    for (const entry of listing || []) {
      if (entry.IsDirectory) continue;
      const buf = files.get(entry.ObjectName);
      if (!buf) continue; // a file we are not writing cannot be overwritten
      const same = entry.Checksum
        ? entry.Checksum.toLowerCase() === crypto.createHash("sha256").update(buf).digest("hex")
        : entry.Length === buf.length;
      if (!same) {
        found.push(`app/${subject}/${TAG}/${entry.ObjectName} (on storage since ${entry.DateCreated}, ${entry.Length}B; this release: ${buf.length}B)`);
        continue;
      }
      // SAME bytes, and this checkout has no record of putting them there.
      //
      // "Same bytes are allowed: a retry after a failed upload is not a second
      // release" was true for one writer and false for two. On 2026-08-24 two
      // sessions were separately told to release english v261 from the same
      // HEAD; their bundles were byte-identical (both af28fd9d…), so every
      // check here passed for the second one and the only damage would have
      // been a silently clobbered manifest. Byte equality proves the release is
      // correct, not that it is ours.
      //
      // The manifest is what tells them apart. Our own retry has the record —
      // we wrote it when the PUT succeeded — and somebody else's release does
      // not. That is why the temp-tree recipe in CLAUDE.md copies the manifest
      // in and back out; a release tree without it fails this check, which is
      // the right outcome for a tree that cannot tell whose release it is
      // resuming.
      if (manifest[`app/${subject}/${TAG}/${entry.ObjectName}`] === undefined) {
        found.push(`app/${subject}/${TAG}/${entry.ObjectName} (identical bytes, on storage since ${entry.DateCreated}, but this checkout never uploaded it — another release wrote this tag)`);
      }
    }
  }
  return found;
}

// Read the release back through the edge. Returns true if anything is wrong.
async function verifyRelease(items) {
  const CDN = `https://${ZONE}.b-cdn.net/` + encodeURI(`${ROOT_FOLDER}/`);
  const versioned = items.map((i) => i.remote).filter((r) => r.includes(`/${TAG}/`));

  // Also verify what the ENTRY asks for, not only what we uploaded. Those two
  // sets are not the same: versionIndexHtml() rewrites computing's brand-fx.js
  // reference into v{TAG}/, but shared/brand-fx.js is untracked in git, so a
  // clean checkout has nothing to upload and the entry ends up pointing at a
  // file that was never sent. Checking only our own upload list cannot see that.
  const resolveRef = (subject, ref) => {
    if (/^(https?:)?\/\/|^#|^data:|^mailto:/.test(ref)) return null;
    const base = `app/${subject}`.split("/");
    for (const part of ref.replace(/^\.\//, "").split("/")) {
      if (part === "..") base.pop();
      else if (part && part !== ".") base.push(part);
    }
    return base.join("/");
  };
  for (const item of items.filter((i) => /^app\/[^/]+\/index\.html$/.test(i.remote))) {
    const subject = item.remote.split("/")[1];
    for (const m of item.buf.toString("utf8").matchAll(/(?:src|href)="([^"]+)"/g)) {
      const p = resolveRef(subject, m[1]);
      if (p && /\.(js|css)$/.test(p) && !versioned.includes(p)) versioned.push(p);
    }
  }

  console.log(`\n──────── verify ──────── reading ${versioned.length} file(s) back through ${ZONE}.b-cdn.net`);

  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < versioned.length) {
      const remote = versioned[idx++];
      // Retry transient failures. A verifier that reports a network blip as a
      // broken release trains people to ignore it, which costs more than the
      // fault it exists to catch.
      let last;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const r = await fetch(CDN + encodeURI(remote), { method: "HEAD" });
          last = {
            remote,
            status: r.status,
            // The fingerprint of the poisoned-path fault: a cache HIT whose
            // cached response was itself a 404 from the origin.
            poisoned: r.status === 404 && r.headers.get("cdn-cache") === "HIT",
            cachedAt: r.headers.get("cdn-cachedat") || "",
          };
          break;
        } catch (e) {
          last = { remote, status: 0, error: e.message };
          if (attempt < 3) await new Promise((res) => setTimeout(res, 400 * attempt));
        }
      }
      results.push(last);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const broken = results.filter((r) => r.status !== 200);
  // A 404 at the edge has two very different causes, and the fix differs: either
  // the file is in storage and the edge cached a miss (bump the tag), or it was
  // never uploaded (find out why — brand-fx.js is untracked in git, so a clean
  // checkout silently has nothing to send). Ask storage rather than guess; a 404
  // there is against the origin, so it caches nothing.
  for (const b of broken) {
    if (b.status !== 404) continue;
    try {
      const r = await fetch(`${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${b.remote}`), { method: "HEAD", headers: { AccessKey: KEY } });
      b.inStorage = r.ok;
    } catch { b.inStorage = null; }
  }
  if (!broken.length) {
    console.log(`  ✓ all ${results.length} files serve 200 from the edge`);
  } else {
    for (const b of broken.sort((x, y) => x.remote.localeCompare(y.remote))) {
      const why = b.status !== 404 ? "" : b.inStorage ? "  [in storage — edge cached a 404]" : "  [NOT in storage — never uploaded]";
      console.log(`  ✗ ${b.status || b.error} ${b.remote}${why}`);
    }
    const missing = broken.filter((b) => b.status === 404 && b.inStorage === false);
    if (missing.length) {
      console.log(`\n  ${missing.length} file(s) reached the release only as a REFERENCE — the entry points\n` +
        `  at them but nothing uploaded them. A file untracked in git is the usual\n` +
        `  cause: a clean checkout has nothing to send and the deploy cannot tell.\n` +
        `  Commit the file, or stop the entry referencing it.`);
    }
    if (broken.some((b) => b.poisoned && b.inStorage)) {
      console.log(`\n  These paths are serving a CACHED 404. Something requested them before\n` +
        `  this deploy uploaded them, and Edge Rule #1 pinned that 404 for a year.\n` +
        `  The files ARE in storage — only the edge is wrong.\n\n` +
        `  Fix: re-run with the next tag. A path nothing has requested cannot be\n` +
        `  poisoned, and that is faster than obtaining an account API key to purge.\n` +
        `      node tools/deploy-app-version.js v${Number(TAG.slice(1)) + 1} ${SHELL ? "--shell " : ""}--verify${PARTIAL ? " " + SUBJECTS.join(" ") : ""}`);
    }
  }

  // The pointer is short-cached, so a lag here is normal rather than a fault.
  const stale = [];
  for (const subject of SUBJECTS) {
    try {
      const r = await fetch(CDN + encodeURI(`app/${subject}/index.html`), { cache: "no-store" });
      const html = await r.text();
      if (!html.includes(`${TAG}/course-ui.`)) stale.push(subject);
    } catch { /* a pointer we cannot read is not evidence of a bad release */ }
  }
  console.log(stale.length
    ? `  … ${stale.length} pointer(s) still on the previous release (${stale.join(", ")}) — index.html is max-age=300, re-check shortly`
    : `  ✓ every index.html already points at ${TAG}`);

  return broken.length > 0;
}

// Held from before the manifest is read to after it is written back. Set by the
// upload path only: --dry and --plan-json touch nothing, so they must neither
// block a real release nor be blocked by one — a plan is exactly what somebody
// waiting for the lock wants to be able to run.
let releaseLock = null;
const dropReleaseLock = () => { if (releaseLock) releaseLock(); releaseLock = null; };
// A release killed with ctrl-C must not wedge the next one. The staleness check
// in release-lock.js would eventually free it anyway; this makes the common case
// immediate. Re-raising after cleanup keeps the exit code honest.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { dropReleaseLock(); process.exit(130); });
}
process.on("exit", dropReleaseLock);

(async () => {
  // Before the lock, not after: this renders for two and a half minutes, and it
  // asks about the working tree rather than about the zone, so holding the lock
  // across it would block every other subject's release for nothing. English
  // only — see require-print-sheets.js for why, and why it blocks rather than
  // reporting after the fact like the two post-deploy hooks.
  if (!DRY && !PLAN_JSON && !requirePrintSheets(SUBJECTS, { skip: argv.includes("--skip-print-check") })) {
    process.exit(1);
  }
  // BEFORE the manifest is read. The manifest is a read-modify-write across the
  // whole run — read here, written back after the last PUT — so a lock taken
  // after the read would protect the uploads and lose the record of them, which
  // is the half that fails silently.
  if (!DRY && !PLAN_JSON) {
    try {
      releaseLock = acquireReleaseLock({
        zone: ZONE,
        what: `${TAG} → ${SUBJECTS.join(",")}`,
        tree: ROOT,
        force: argv.includes("--force-lock"),
      });
    } catch (e) {
      if (e.code !== "ERELEASELOCKED") throw e;
      console.error(`\nREFUSING: ${e.message}`);
      process.exit(1);
    }
  }
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  let all;
  // A contract failure is a configuration mistake, not a crash — report it as
  // one line rather than a stack trace, and before anything has been uploaded.
  try { all = buildItems(); }
  catch (e) { console.error(e.message); process.exit(1); }
  // Before any human-readable line, so stdout is parseable on its own.
  if (PLAN_JSON) {
    process.stdout.write(JSON.stringify({
      tag: TAG,
      shell: SHELL,
      items: all.map((x) => ({ remote: x.remote, sha1: sha1(x.buf), pointer: !!x.always })),
    }) + "\n");
    return;
  }
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
  // A version path is immutable at the edge — Edge Rule #1 caches it for a year
  // — so writing DIFFERENT bytes to a tag that already exists on storage does
  // not update anything a learner sees: every POP that fetched the tag before
  // keeps serving the old release, forever, and there is no purge key in .env.
  // That happened on 2026-08-17: english v164 had been written the day before
  // from another checkout, this checkout's manifest did not know, the tool
  // overwrote it, --verify passed (the files did serve 200), and the learner
  // still saw the previous release. Ask STORAGE, not the CDN — the storage API
  // caches nothing, so the question is free; a probe against the edge is what
  // mints the cached 404s the manifest warning below is about. Same bytes are
  // allowed: a retry after a failed upload is not a second release.
  const taken = await tagAlreadyWritten(all, manifest);
  if (taken.length && !argv.includes("--force-tag")) {
    console.error(`\nREFUSING: ${TAG} already exists on storage with different bytes:`);
    for (const t of taken) console.error(`  ${t}`);
    console.error("A version path is cached at the edge for a year, so overwriting it does not reach learners.\nRelease under a tag that has never been written (check with the storage listing, never by fetching from the CDN),\nor pass --force-tag if you truly mean to overwrite.");
    process.exit(1);
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

  if (VERIFY && !failed) {
    const bad = await verifyRelease(all);
    if (bad) process.exitCode = 1;
  } else if (VERIFY) {
    console.log(`\nSkipping --verify: ${failed} upload(s) failed, so a 404 would not tell you anything.`);
  }

  // --verify proves the release is SERVED. It cannot tell whether the content
  // that code reads was shipped with it, and that gap is what reached learners
  // on 2026-08-12: v141 verified perfectly against three-week-old content.
  if (!failed) requireTiersInStep(SUBJECTS);
  // And the tier the other checks cannot see: the platform the app calls at
  // runtime. A release can be perfectly shipped and perfectly in step while
  // every cross-origin call it makes is being refused — see 2026-08-26.
  if (!failed) requirePlatformCors();
})();
