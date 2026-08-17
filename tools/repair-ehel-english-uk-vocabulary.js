#!/usr/bin/env node
// UK vocabulary throughout the English course — the user's decision of
// 2026-08-17 ("use UK"). This is the audible half of the British-English pass:
// repair-ehel-english-british-spelling.js changed only spellings (homophones);
// these are DIFFERENT WORDS, so every clip that says one is wrong afterwards and
// is re-recorded (the staleness checker lists them). Four are dictionary
// headwords (janitor, vacation, elevator, railroad): displayWord/lemma/masterWord
// change and the spelling drill is rebuilt; entry ids and vocabularyIds stay as
// the opaque keys they are, and the word clip is regenerated under the new
// lemma by generate-ehel-english-audio.js dictionary --only <word>.
//
// Phrases first (article and number agreement: "an elevator" → "a lift", "too
// much candy" → "too many sweets"), then bare words. Deliberately NOT changed —
// fine or ambiguous in British English: line, fall (rain), store (verb), yard
// (farmyard), period (of time), cart, quotation marks, gas (CO2), principal,
// trunk (tree), truck, apartment, eraser, vest, pharmacy.
//
// Never rewritten: ids, audio paths, filenames, metadata keys. Idempotent.
// Usage: node tools/repair-ehel-english-uk-vocabulary.js [--dry] [--preview]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");
const PREVIEW = process.argv.includes("--preview");

// Ordered: longer / article-bearing phrases before the bare word.
const PHRASES = [
  ["an elevator", "a lift"], ["An elevator", "A lift"], ["elevators", "lifts"], ["elevator", "lift"], ["Elevators", "Lifts"], ["Elevator", "Lift"],
  ["an airplane", "an aeroplane"], ["airplanes", "aeroplanes"], ["airplane", "aeroplane"], ["Airplane", "Aeroplane"],
  ["model railroad", "model railway"], ["railroads", "railways"], ["railroad", "railway"], ["Railroads", "Railways"], ["Railroad", "Railway"],
  ["janitors", "caretakers"], ["janitor's", "caretaker's"], ["janitor", "caretaker"], ["Janitors", "Caretakers"], ["Janitor", "Caretaker"],
  ["on vacation", "on holiday"], ["vacations", "holidays"], ["vacation", "holiday"], ["Vacations", "Holidays"], ["Vacation", "Holiday"],
  ["closets", "wardrobes"], ["closet", "wardrobe"], ["Closet", "Wardrobe"],
  ["candy bar", "chocolate bar"], ["too much candy", "too many sweets"], ["much candy", "many sweets"], ["a lot of candy", "a lot of sweets"], ["candy", "sweets"], ["Candy", "Sweets"],
  ["cookies", "biscuits"], ["cookie", "biscuit"], ["Cookies", "Biscuits"], ["Cookie", "Biscuit"],
  ["lunchroom", "dining hall"], ["Lunchroom", "Dining hall"],
  ["sweaters", "jumpers"], ["sweater", "jumper"], ["Sweater", "Jumper"],
  ["soccer", "football"], ["Soccer", "Football"],
  ["mail carriers", "postal workers"], ["mail carrier", "postal worker"], ["Mail carriers", "Postal workers"], ["Mail carrier", "Postal worker"],
  ["flashlights", "torches"], ["flashlight", "torch"], ["Flashlights", "Torches"], ["Flashlight", "Torch"],
  ["in gym class", "in PE"], ["gym class", "PE lesson"],
  ["during homeroom", "during form time"], ["homeroom", "form time"],
  ["Math Wizard", "Maths Wizard"], ["math ", "maths "], ["math.", "maths."], ["math,", "maths,"], ["Math ", "Maths "],
  ["action movies", "action films"], ["movies", "films"], ["movie", "film"], ["Movies", "Films"], ["Movie", "Film"],
  ["keychains", "keyrings"], ["keychain", "keyring"],
  ["celebration downtown", "celebration in the town centre"], ["downtown", "in the town centre"],
  ["losing recess time", "losing break time"], ["recess", "break time"],
  ["garbage", "rubbish"], ["Garbage", "Rubbish"],
  ["turn it in", "hand it in"],
  ["on the first floor, close to the main entrance", "on the ground floor, close to the main entrance"],
  ["garden hose", "hosepipe"],
  ["many stores under one roof", "many shops under one roof"], ["stores under one roof", "shops under one roof"],
];
const HEADWORDS = { janitor: "caretaker", vacation: "holiday", elevator: "lift", railroad: "railway" };

const SKIP_KEY = /(Id$|^id$|Ids$|Path$|^path$|^src$|^source$|^normal$|^slow$|^href$|^url$|Url$|^file|Hash$|^hash$|^lectureVideo$|^lecturePoster$|^lectureCaptions$|^image$|^audio$|^outcomeIds$|^rubricIds$|^origin$|^reviewStatus$|^sourceFile$|^sourceUnitTitle$|^source|^vocabularyId$|^masterWord$|^dictionaryEntryId$|^senseId$|^lemma$|^displayWord$|^spellingPractice$)/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RULES = PHRASES.map(([a, b]) => [new RegExp(`(?<![\\w-])${esc(a)}(?![\\w-])`, "g"), b]);

const previews = [];
function rewrite(text, where) {
  let out = text;
  for (const [rx, to] of RULES) {
    if (rx.test(out)) {
      rx.lastIndex = 0;
      if (PREVIEW) for (const m of out.matchAll(rx)) previews.push(`${where}: …${out.slice(Math.max(0, m.index - 45), m.index + m[0].length + 45).replace(/\n/g, " ")}…  → ${to}`);
      out = out.replace(rx, to);
    }
  }
  return out;
}
let changed = 0;
function walk(node, key, where) {
  if (Array.isArray(node)) return node.map((v, i) => walk(v, key, `${where}[${i}]`));
  if (node && typeof node === "object") { for (const k of Object.keys(node)) { if (SKIP_KEY.test(k)) continue; node[k] = walk(node[k], k, `${where}.${k}`); } return node; }
  // A path has no spaces; prose with "Yes/No" or "(go / went)" is not a path.
  if (typeof node !== "string" || (!/\s/.test(node) && /[\/\\]/.test(node)) || /\.(mp3|mp4|vtt|png|jpg|json)$/i.test(node)) return node;
  const out = rewrite(node, where);
  if (out !== node) changed += 1;
  return out;
}
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
const drill = (w) => w.toLowerCase().split("").map((c) => (c === " " ? "space" : c)).join(" - ");

let files = 0;
for (let grade = 1; grade <= 8; grade += 1) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  const targets = [];
  for (const name of fs.readdirSync(dataDir)) {
    const full = path.join(dataDir, name);
    if (name === "games") continue;
    if (fs.statSync(full).isDirectory()) { for (const n of fs.readdirSync(full)) if (n.endsWith(".json")) targets.push(path.join(full, n)); }
    else if (name.endsWith(".json")) targets.push(full);
  }
  targets.sort((a, b) => (a.includes("master-dictionary") ? -1 : b.includes("master-dictionary") ? 1 : 0));
  const renamed = new Map(); // dictionaryEntryId → new displayWord
  for (const file of targets) {
    const raw = fs.readFileSync(file, "utf8");
    const doc = JSON.parse(raw);
    const before = changed;
    const rel = path.relative(ENGLISH, file);
    if (file.includes("master-dictionary")) {
      for (const e of doc.entries) {
        const to = HEADWORDS[String(e.displayWord).toLowerCase()];
        if (to) { e.displayWord = to; e.lemma = to; renamed.set(e.dictionaryEntryId, to); changed += 1; }
      }
    }
    walk(doc, null, rel);
    for (const link of doc.dictionaryLinks || []) {
      const to = renamed.get(link.dictionaryEntryId);
      if (to) {
        if (link.masterWord && link.masterWord !== to) { link.masterWord = to; changed += 1; }
        if (link.spellingPractice && link.spellingPractice !== drill(to)) { link.spellingPractice = drill(to); changed += 1; }
      }
    }
    if (changed !== before) { files += 1; if (!DRY && !PREVIEW) fs.writeFileSync(file, serialise(doc, raw), "utf8"); }
  }
}
if (PREVIEW) console.log(previews.join("\n"));
console.log(JSON.stringify({ dry: DRY || PREVIEW, filesChanged: files, stringsChanged: changed }));
