/* Every clip a built programme page lists (LESSON.clips), checked against a
   STORAGE listing of that page's own media folder (mediaProd, gNN).

     node src/prototypes/ehel-academy/intensive-english/program/kit/check-clips-on-storage.mjs

   Run it after the media upload and BEFORE deploying the pages. A page asks for
   the clips it lists and no others, so this is the question that matters. A
   deployed page that asks for a clip that is not there caches a 404 on a media
   path for a year.

   tools/verify-course-audio-deployed.mjs asks a different question: whether the
   CLAIM MAP is on storage. The claim map and the pages are two lists. On
   2026-09-18 they disagreed: the Letters & Sounds pages listed 64 Phonics
   recordings that no manifest claimed. The verifier was green; this check was not.

   Passive: it only LISTs storage, never touches the edge, and never prints the
   key (read from BUNNY_KEY or .env). Exit 0 all present, 1 something missing,
   2 could not check. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..", "app");
const REPO = path.resolve(HERE, "../../../../../..");
const LEVELS = ["letters", "starter", "level-1", "level-2", "level-3", "level-4"];

function key() {
  if (process.env.BUNNY_KEY) return process.env.BUNNY_KEY.trim();
  const env = path.join(REPO, ".env");
  const m = fs.existsSync(env) && fs.readFileSync(env, "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error("No BUNNY_KEY (environment or .env)."); process.exit(2); }
  return m[1].trim().replace(/^["']|["']$/g, "");
}
const KEY = key();

const listed = new Map();
async function list(g) {
  if (listed.has(g)) return listed.get(g);
  const url = "https://storage.bunnycdn.com/ehelacademy/" + encodeURI(`Ehel Primary/media/intensive-english/${g}/audio/tts/`);
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { AccessKey: KEY, Accept: "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      // a folder never written answers 200 with an empty list: count, never trust the status
      const names = new Set((await r.json()).filter((o) => !o.IsDirectory).map((o) => o.ObjectName.replace(/\.mp3$/, "")));
      listed.set(g, names);
      return names;
    } catch (e) {
      if (attempt >= 4) { console.error(`${g}: LIST failed (${e.message}); nothing was checked.`); process.exit(2); }
      await new Promise((ok) => setTimeout(ok, 2000 * attempt));
    }
  }
}

let refs = 0, missing = 0;
for (const level of LEVELS) {
  const cfg = JSON.parse(fs.readFileSync(path.join(APP, level, "app.config.json"), "utf8"));
  let lvRefs = 0, lvMiss = 0;
  const folders = new Set();
  for (const l of cfg.lessons) {
    const html = fs.readFileSync(path.join(APP, level, l.file), "utf8");
    const g = /"mediaProd":\s*"\.\.\/\.\.\/\.\.\/\.\.\/media\/intensive-english\/(g\d\d)\/audio\/tts"/.exec(html)?.[1];
    const m = /"clips":\s*(\[[^\]]*\])/.exec(html);
    if (!g || !m) { console.log(`  ${level}/${l.file}: no mediaProd or clips; rebuild with build_program.py`); missing++; continue; }
    folders.add(g);
    const have = await list(g);
    const miss = JSON.parse(m[1]).filter((c) => !have.has(c));
    lvRefs += JSON.parse(m[1]).length;
    lvMiss += miss.length;
    for (const c of miss.slice(0, 3)) console.log(`  MISSING ${level}/${l.file} -> ${g}/${c}.mp3`);
  }
  refs += lvRefs;
  missing += lvMiss;
  console.log(`${level.padEnd(8)} ${[...folders].join(",")}  ${String(cfg.lessons.length).padStart(2)} pages  ${String(lvRefs).padStart(5)} clip references  ${lvMiss} missing`);
}
console.log(missing
  ? `\nFAIL: ${missing} clip reference(s) not on storage. Upload the media (tools/upload-media-to-bunny.js intensive-english) before any page.`
  : `\nok: all ${refs} clip references are on storage`);
process.exitCode = missing ? 1 : 0;
