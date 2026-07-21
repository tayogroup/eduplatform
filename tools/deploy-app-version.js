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
      } else {
        items.push({ remote: `app/${subject}/${TAG}/${name}`, buf }); // immutable code
      }
    }
    // Rewritten entry + release pointer (always upload — they carry the version).
    const html = versionIndexHtml(fs.readFileSync(path.join(EHEL, subject, "index.html"), "utf8"));
    items.push({ remote: `app/${subject}/index.html`, buf: Buffer.from(html), always: true });
    const current = { version: TAG, builtFrom: `src/prototypes/ehel-academy/${subject}`, contract: "1.0" };
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
