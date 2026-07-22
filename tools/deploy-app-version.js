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
// Usage: BUNNY_KEY=… node tools/deploy-app-version.js [v2]   (default tag: v1)

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-appver-manifest.json");
const CONCURRENCY = 10;
const SUBJECTS = ["english", "mathematics", "science"];

if (!KEY) { console.error("BUNNY_KEY not set"); process.exit(1); }
const TAG = (process.argv.slice(2).find((a) => /^v\d+$/.test(a))) || "v1";
// --shell: package the unified shell (P1.5) instead of the per-subject apps.
// Each subject's v{TAG}/ becomes self-contained: course-ui.js (the subject
// module), course-app.js (the shell core), the subject's visual modules, and
// course-ui.css — with import paths rewritten for the deployed layout.
const SHELL = process.argv.slice(2).includes("--shell");

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
const CT = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
};
const ctFor = (name) => CT[path.extname(name).toLowerCase()] || "application/octet-stream";

// index.html transform: point the CSS link + JS loader at v{TAG}/ instead of the
// dev-time ./shared/…?v=… reference. Robust to both loader shapes (bare <script>
// and the inline courseScript block).
function versionIndexHtml(html) {
  return html
    .replace(/\.\/shared\/course-ui\.css(?:\?v=[^"']*)?/g, `${TAG}/course-ui.css`)
    .replace(/\.\/shared\/course-ui\.js(?:\?v=[^"']*)?/g, `${TAG}/course-ui.js`);
}

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
    .replace(/\.\.\/\.\.\/(?:english|mathematics|science)\/shared\/([A-Za-z0-9_-]+\.js)(\?v=[^"']*)?/g, "./$1")
    .replace(/\.\.\/\.\.\/shared\/(course-shell|progress-client)\.js(\?v=[^"']*)?/g, "./$1.js")
    .replace(/\.\.\/course-app\.js(\?v=[^"']*)?/g, "./course-app.js");
}
function shellCore() {
  return fs.readFileSync(path.join(EHEL, "shell", "course-app.js"), "utf8")
    .replace(/\.\.\/shared\/(course-shell|progress-client)\.js(\?v=[^"']*)?/g, "./$1.js");
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
        if (name !== "course-ui.js") items.push({ remote: `app/${subject}/${TAG}/${name}`, buf });
      } else {
        items.push({ remote: `app/${subject}/${TAG}/${name}`, buf }); // immutable code
      }
    }
    if (SHELL) {
      items.push({ remote: `app/${subject}/${TAG}/course-ui.js`, buf: Buffer.from(shellSubjectModule(subject)) });
      items.push({ remote: `app/${subject}/${TAG}/course-app.js`, buf: Buffer.from(shellCore()) });
      for (const name of ["course-shell.js", "progress-client.js"]) {
        items.push({ remote: `app/${subject}/${TAG}/${name}`, buf: fs.readFileSync(path.join(EHEL, "shared", name)) });
      }
    }
    // Rewritten entry + release pointer (always upload — they carry the version).
    const html = versionIndexHtml(fs.readFileSync(path.join(EHEL, subject, "index.html"), "utf8"));
    items.push({ remote: `app/${subject}/index.html`, buf: Buffer.from(html), always: true });
    const current = { version: TAG, shell: SHELL, builtFrom: SHELL ? "src/prototypes/ehel-academy/shell" : `src/prototypes/ehel-academy/${subject}`, contract: "1.0" };
    items.push({ remote: `app/${subject}/current.json`, buf: Buffer.from(JSON.stringify(current, null, 2) + "\n"), always: true });
  }
  // Shared modules imported via ../../shared/ (course-shell.js, progress-client.js).
  const topShared = path.join(EHEL, "shared");
  for (const name of fs.readdirSync(topShared)) {
    if (!/\.(js|css)$/.test(name)) continue;
    items.push({ remote: `app/shared/${name}`, buf: fs.readFileSync(path.join(topShared, name)) });
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
  const all = buildItems();
  const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));
  console.log(`tag: ${TAG} | items: ${all.length} | to upload: ${todo.length} (${todo.filter((x) => x.always).length} pointer files always sent)`);
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
