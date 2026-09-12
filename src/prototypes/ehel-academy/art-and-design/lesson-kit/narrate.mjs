/* Record the narration of an Art & Design build: one mp3 per sentence the
 * pages speak, named cyrb53(sentence).mp3, in the platform's own ElevenLabs
 * voice (tools/lib/ehel-tts.js :: VOICE_ID, the voice quiz_tts.php speaks at
 * runtime), so a recorded line and a line composed at runtime are one speaker.
 *
 *   node ../lesson-kit/narrate.mjs --app . --trace <trace.json> --dry   # count, send nothing
 *   node ../lesson-kit/narrate.mjs --app . --trace <trace.json>         # record what is missing
 *   node ../lesson-kit/narrate.mjs --app . --index                      # rewrite index.json only
 *
 * WHAT IS RECORDED is decided, not guessed:
 *   1. every sentence the pages ACTUALLY spoke in a full run with Explain
 *      pressed on every step (drive-lessons.mjs --trace), and
 *   2. the sentences a correct run never reaches: every `why`, `say`,
 *      `fact`, `done`, `cap`, `problem` and `fixed` in the shipped LESSON
 *      data (the wrong-answer feedback lives there), and the complete
 *      sentences written as literals in lib/art.js, lib/deck.js and
 *      lib/voice.js (the cheers, "Try another.", the mark hints).
 * Both are split into sentences by lib/art.js's OWN functions, lifted out of
 * the file between its NARRATION-TEXT markers - so the page and this tool
 * cannot disagree about where a sentence ends or what it hashes to.
 *
 * ElevenLabs bills per character: --dry first, always. An existing clip is
 * never re-bought (a file over 1 KB is kept). A credential or quota failure
 * stops the run at once rather than failing every remaining clip.
 *
 * Writes media/tts/<hash>.mp3, media/tts/index.json (the hashes the page may
 * ask for - only files that exist) and media/tts/scripts.json (hash -> the
 * exact words, the review surface for a human listening back).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const KNOWN = new Set(["--app", "--trace", "--dry", "--index", "--concurrency", "--budget", "--prune"]);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) continue;
  if (!KNOWN.has(argv[i])) { console.error("unknown argument " + argv[i] + " - refusing, because the default action spends money"); process.exit(2); }
}
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const APP = path.resolve(process.cwd(), arg("--app", "."));
const DRY = argv.includes("--dry");
const INDEX_ONLY = argv.includes("--index");
const CONC = Math.max(1, Number(arg("--concurrency", "4")));
const BUDGET = Number(arg("--budget", "0"));
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");
const OUT = path.join(APP, "media", "tts");
const cfgPath = path.join(APP, "app.config.json");
if (!fs.existsSync(cfgPath)) { console.error("no app.config.json in " + APP); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

/* ---- the page's own text rules ------------------------------------------ */
const ART = fs.readFileSync(path.join(HERE, "lib", "art.js"), "utf8");
const region = ART.split("/* NARRATION-TEXT-START */")[1]?.split("/* NARRATION-TEXT-END */")[0];
if (!region) { console.error("cannot find the NARRATION-TEXT markers in lib/art.js"); process.exit(2); }
const T = new Function(region + "; return { speechText, sentencesOf, cyrb53 };")();
const shared = require(path.join(REPO, "tools", "lib", "ehel-narration-hash.js"));
for (const probe of ["Red and blue make purple.", "Tap the lightest one first.", "Yes!"]) {
  if (T.cyrb53(probe) !== shared.cyrb53(probe)) { console.error("lib/art.js cyrb53 disagrees with tools/lib/ehel-narration-hash.js"); process.exit(2); }
}

function writeIndex() {
  fs.mkdirSync(OUT, { recursive: true });
  const clips = fs.readdirSync(OUT).filter((f) => /^[0-9a-f]+\.mp3$/.test(f) && fs.statSync(path.join(OUT, f)).size > 1024)
    .map((f) => f.replace(/\.mp3$/, "")).sort();
  const { VOICE_ID, MODEL_ID } = require(path.join(REPO, "tools", "lib", "ehel-tts.js"));
  const body = JSON.stringify({ voice: VOICE_ID, model: MODEL_ID, clips }) + "\n";
  fs.writeFileSync(path.join(OUT, "index.json"), body);
  /* the copy a PAGE reads, named for its content (lib/art.js ::
     NARRATION_INDEX says why); the builders point every page at it */
  const named = "index." + crypto.createHash("sha1").update(body).digest("hex").slice(0, 10) + ".json";
  for (const f of fs.readdirSync(OUT)) if (/^index\.[0-9a-f]{10}\.json$/.test(f) && f !== named) fs.unlinkSync(path.join(OUT, f));
  fs.writeFileSync(path.join(OUT, named), body);
  return clips.length;
}
if (INDEX_ONLY) { console.log("index.json: " + writeIndex() + " clips"); process.exit(0); }

/* ---- what to record ------------------------------------------------------ */
const want = new Map();   // hash -> sentence
const add = (x, from) => { for (const s of T.sentencesOf(x)) { const h = T.cyrb53(s); if (!want.has(h)) want.set(h, { s, from }); } };

const TRACE = arg("--trace", null);
if (TRACE) {
  const tr = JSON.parse(fs.readFileSync(TRACE, "utf8"));
  for (const s of tr.sentences || []) add(s, "trace");
} else {
  console.warn("  (no --trace: recording from the static sources alone, which misses every line the renderers compose)");
}
const SPOKEN_KEYS = new Set(["why", "say", "fact", "done", "cap", "problem", "fixed"]);
/* every page the build ships that speaks: the lessons, and the pages beside
   them that are not lessons (the starting check) */
/* extraPages carries whatever deploy.mjs must upload beside the lessons,
   and since 2026-09-12 that includes lesson-search.json (another session's
   lesson search). Only a PAGE can be read for spoken lines. */
const PAGES = [...cfg.lessons.map((l) => l.file), ...(cfg.extraPages || [])].filter((f) => /\.html$/.test(f));
/* the marks step's keyboard route names marks out loud; its names and rivals
   are lib/art.js's own tables, lifted out rather than retyped */
const MK = new Function(ART.slice(ART.indexOf("  const MARK_NAME = {"), ART.indexOf("  function markPts(")) + "; return { MARK_NAME, MARK_RIVALS };")();
function walk(o) {
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (!o || typeof o !== "object") return;
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && SPOKEN_KEYS.has(k)) add(v, "lesson:" + k);
    else if (typeof v === "object") walk(v);
  }
}
for (const file of PAGES) {
  const s = fs.readFileSync(path.join(APP, file), "utf8");
  const m = /\n  const LESSON = (\{.*?\n  \});\n/s.exec(s);
  if (!m) { console.error(file + ": no LESSON block"); process.exit(2); }
  const data = JSON.parse(m[1]);
  for (const st of data.steps) { add(st.done || "", "lesson:done"); walk(st.data); }
}
/* lines the renderers COMPOSE from a closed set of the child's choices: a run
   picks one option, the child may pick any, and each set is small */
for (const file of PAGES) {
  const s = fs.readFileSync(path.join(APP, file), "utf8");
  const data = JSON.parse(/\n  const LESSON = (\{.*?\n  \});\n/s.exec(s)[1]);
  for (const st of data.steps) {
    const d = st.data;
    if (st.kind === "journal") for (const c of d.changes || []) add("You said: Next time I would " + c + ".", "template:journal");
    if (st.kind === "experiment") for (const rd of d.rounds) for (const o of rd.opts) { add("You think " + o + ".", "template:predict"); add("You said " + o + ".", "template:predict"); }
    if (st.kind === "sort") for (const it of d.items) add(it.label + ".", "template:sort");
    if (st.kind === "compare") for (const c of d.cards) add(c.t + ".", "template:compare");
    if (st.kind === "mix") for (const rd of d.rounds) for (const o of rd.opts) add("You think " + o + ".", "template:predict");
    /* every Listen button, not only the ones one run happened to press: a run
       that never pressed part 1's Listen once pruned "Marks." and seven other
       lecture titles the videos are made of */
    if (st.kind === "lecture") for (const p of d.parts) add(p.title + ". " + p.say, "template:lecture");
    if (st.kind === "words") for (const w of d.items) add(w.w + ". " + w.meaning + " " + ((w.uses || [])[0] || ""), "template:words");
    if (st.kind === "source") for (const sp of d.spots) add(sp.label + ". " + sp.fact, "template:spot");
    /* the keyboard route: the question it asks, and what a wrong pick hears */
    if (st.kind === "marks") for (const rd of d.rounds) {
      add("Which one is " + MK.MARK_NAME[rd.want] + "? Tap it.", "template:marks");
      for (const r of MK.MARK_RIVALS[rd.want] || []) add("That is " + MK.MARK_NAME[r] + ". Look for " + MK.MARK_NAME[rd.want] + ".", "template:marks");
    }
    /* the starting check: every question, every explanation, every band */
    if (st.kind === "readiness") {
      for (const q of d.exam.questions) { add(q.question, "template:check"); add(q.explanation, "template:check"); }
      for (const b of Object.values(d.exam.banding)) if (b && b.label && b.message) add(b.label + ". " + b.message, "template:check");
    }
  }
}
/* the voice's reaction banks (lib/voice.js :: BANKS) are SSML, which the
   literal scan below skips for its tags - and a run speaks one of each bank
   at random, so a trace alone keeps some and loses the rest (a prune on
   2026-09-11 would have deleted "Hmm." and "Let us think it through again."
   that way). Every line of every bank, tags stripped, is wanted. */
{
  const VOICE_SRC = fs.readFileSync(path.join(HERE, "lib", "voice.js"), "utf8");
  const banks = VOICE_SRC.slice(VOICE_SRC.indexOf("const BANKS = {"), VOICE_SRC.indexOf("};", VOICE_SRC.indexOf("const BANKS = {")));
  let n = 0;
  for (const m of banks.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    const t = m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (/[a-z]/i.test(t) && !/^[\d.]+$/.test(t)) { add(t, "template:voice"); n++; }
  }
  if (n < 10) { console.error("read only " + n + " lines out of lib/voice.js's BANKS - the parser is broken"); process.exit(2); }
}
/* complete sentences written as string literals in the page's own scripts */
function literals(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  return (code.match(/"(?:[^"\\\n]|\\.)*"/g) || []).map((q) => q.slice(1, -1).replace(/\\"/g, '"'));
}
for (const file of ["art.js", "deck.js", "voice.js"]) {
  for (const lit of literals(fs.readFileSync(path.join(HERE, "lib", file), "utf8"))) {
    if (/[<>{}$\\]|https?:|\.js|\.mp3/.test(lit)) continue;
    for (const s of T.sentencesOf(lit)) {
      const words = s.split(/\s+/).length;
      if (!/[.!?…]["'”’)]*$/.test(s)) continue;                 /* a fragment glued to a variable */
      if (words < 2 && !/^[A-Z][a-z']+!$/.test(s)) continue;     /* keep "Yes!", drop "a." */
      if (/^[a-z]/.test(s)) continue;                           /* the tail of a composed line */
      const h = T.cyrb53(s); if (!want.has(h)) want.set(h, { s, from: "literal:" + file });
    }
  }
}

/* ---- the plan ------------------------------------------------------------ */
fs.mkdirSync(OUT, { recursive: true });
const have = (h) => { const f = path.join(OUT, h + ".mp3"); return fs.existsSync(f) && fs.statSync(f).size > 1024; };
const todo = [...want.entries()].filter(([h]) => !have(h));
const chars = (xs) => xs.reduce((n, [, v]) => n + v.s.length, 0);
const bySource = {};
for (const [, v] of want) { const k = v.from.split(":")[0]; bySource[k] = (bySource[k] || 0) + 1; }
console.log("\n  " + cfg.subjectLabel + " " + cfg.gradeLabel + " narration");
console.log("  sentences: " + want.size + " (" + Object.entries(bySource).map(([k, n]) => k + " " + n).join(", ") + "), " + chars([...want.entries()]).toLocaleString() + " characters");
console.log("  on disk:   " + (want.size - todo.length));
console.log("  to record: " + todo.length + " sentences, " + chars(todo).toLocaleString() + " characters" + (DRY ? "   (--dry: nothing sent)" : ""));

const scripts = {};
for (const [h, v] of want) scripts[h] = v.s;
fs.writeFileSync(path.join(OUT, "scripts.json"), JSON.stringify(scripts, null, 1) + "\n");

/* --prune: a clip no current sentence names is a clip no page can ask for -
   left behind when wording changes. Only with a trace, because without one
   `want` misses every composed line and would prune live clips. Clips are
   committed, so a prune is recoverable from git. */
if (argv.includes("--prune")) {
  if (!TRACE) { console.error("  refusing to prune without --trace: the static sources alone miss every composed line"); process.exit(2); }
  const gone = fs.readdirSync(OUT).filter((f) => /^[0-9a-f]+\.mp3$/.test(f) && !want.has(f.slice(0, -4)));
  for (const f of gone) fs.unlinkSync(path.join(OUT, f));
  console.log("  pruned " + gone.length + " clip(s) no sentence names; index.json lists " + writeIndex());
}
if (DRY) { console.log(""); process.exit(0); }
if (BUDGET && chars(todo) > BUDGET) { console.error("  refusing: " + chars(todo) + " characters is over --budget " + BUDGET); process.exit(1); }

/* ---- record -------------------------------------------------------------- */
function loadEnv() {
  const f = path.join(REPO, ".env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const { tts, FatalTtsError, PermanentTtsError } = require(path.join(REPO, "tools", "lib", "ehel-tts.js"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let done = 0, failed = 0, spent = 0, fatal = null;
const refused = [];
async function one(h, s) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (fatal) return;
    try {
      /* the words sent, not the words hashed: an emphasis word written in
         capitals ("what it IS like") is read as a word, not spelled out */
      const buf = await tts(s.replace(/[A-Z]{2,}/g, (w) => w.toLowerCase()));
      if (buf.length < 1024) throw new Error("a " + buf.length + "-byte clip is not audio");
      fs.writeFileSync(path.join(OUT, h + ".mp3"), buf);
      done++; spent += s.length;
      if (done % 50 === 0) console.log("  … " + done + " recorded, " + spent.toLocaleString() + " characters");
      return;
    } catch (e) {
      if (e instanceof FatalTtsError) { fatal = e; return; }
      if (e instanceof PermanentTtsError) { failed++; refused.push(h + " " + s + " :: " + e.message); return; }
      if (attempt === 3) { failed++; refused.push(h + " " + s + " :: " + e.message); return; }
      await sleep(1500 * attempt);
    }
  }
}
let next = 0;
await Promise.all(Array.from({ length: Math.min(CONC, todo.length) }, async () => {
  while (next < todo.length && !fatal) { const [h, v] = todo[next++]; await one(h, v.s); }
}));
const n = writeIndex();
console.log("\n  recorded " + done + ", failed " + failed + ", " + spent.toLocaleString() + " characters sent; index.json lists " + n + " clips");
for (const r of refused.slice(0, 20)) console.log("  REFUSED " + r);
if (fatal) { console.error("\n  STOPPED: " + fatal.message); process.exit(1); }
process.exit(failed ? 1 : 0);
