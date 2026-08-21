#!/usr/bin/env node
// Respells US forms as British throughout the English course data — headwords,
// meanings, example and practice sentences, readings, quizzes, keys, manifests.
//
// The 2026-08-17 review found ~30 US spellings used as TAUGHT vocabulary in an
// en-GB course (emphasize, organization, laborer, meter, honorable, mold,
// artifact, demeanor, defense, archeological, …), some inconsistent within one
// unit (organise/organize, characterise/characterize). The course's own house
// style is -ise (recognise, organise in the grammar lessons), so -ise it is.
//
// SPELLING ONLY. Every pair here sounds the same when read aloud, so every
// existing recording — word clips, practice-sentence clips, readings — stays
// correct; nothing is orphaned or made stale by ear (the git-based staleness
// check will list these commits, and that is a false positive to wave through).
// US VOCABULARY is deliberately not touched: airplane, elevator, railroad,
// vacation, closet, candy, cookies, flashlight, janitor, mail carrier are
// different words, some audible, and swapping them is a content decision.
//
// What is never rewritten: ids, audio paths, filenames, anything under a key
// that names an id or a path — the entry ids embed the old spelling
// (ehel-dict-en-emphasize-verb-01) and stay as opaque keys, and word audio is
// filed under the old spelling (dictionary/emphasize.mp3) and keeps working
// because the descriptor path is left alone. `spellingPractice` is rebuilt
// from the new displayWord for the links whose word changed.
//
// Grade 6 carried both `archeological` and `archaeological` as separate
// entries; the US one is dropped and its single link repointed.
//
// Idempotent. Usage: node tools/repair-ehel-english-british-spelling.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

// stem → British stem; suffixes handled per family below.
const IZE = ["synthes", "emphas", "organ", "antagon", "material", "character", "plagiar", "critic", "civil", "mechan", "recogn", "real", "apolog", "memor", "summar", "visual", "categor", "priorit", "minim", "maxim", "special", "util", "stabil", "modern", "industrial", "author", "global", "social", "harmon", "ideal", "mobil", "normal", "optim", "personal", "popular", "public", "random", "revolution", "standard", "sympath", "symbol", "theor", "vandal", "victim", "fertil", "familiar", "dramat", "digit", "custom", "colon", "capital", "central", "commercial", "criminal", "econom", "energ", "equal", "final", "formal", "general", "human", "hypnot", "item", "jeopard", "legitim", "local", "marginal", "mesmer", "monopol", "national", "neutral", "patron", "penal", "polar", "pressur", "privat", "rational", "satir", "scrutin", "steril", "subsid", "terror", "traumat", "trivial", "urban", "verbal", "vocal", "agon", "empath", "epitom", "fantas", "immortal", "individual", "internal", "ion", "legal", "liberal", "magnet", "memorial", "moral", "natural", "prior", "reorgan", "roman", "sanit", "scandal", "sensational", "solemn", "stigmat", "tender", "vapor"];
const IZE_SUFFIX = ["ize", "izes", "ized", "izing", "ization", "izations", "izer", "izers", "izable"];
// Words that end in -ize legitimately (or are not -ise words) and must not be touched.
const IZE_KEEP = /^(size|sizes|sized|sizing|prize|prizes|prized|seize|seized|seizes|seizing|capsize|capsized|resize|resized|maize|oversize|oversized|midsize|citizen|citizens|horizon|horizons)$/i;

const PAIRS = [
  // -or → -our
  ["labor", "labour"], ["labors", "labours"], ["labored", "laboured"], ["laboring", "labouring"], ["laborer", "labourer"], ["laborers", "labourers"],
  ["honor", "honour"], ["honors", "honours"], ["honored", "honoured"], ["honoring", "honouring"], ["honorable", "honourable"], ["honorably", "honourably"],
  ["demeanor", "demeanour"], ["candor", "candour"], ["clamor", "clamour"], ["clamors", "clamours"], ["clamored", "clamoured"], ["clamoring", "clamouring"],
  ["humor", "humour"], ["behavior", "behaviour"], ["behaviors", "behaviours"], ["neighbor", "neighbour"], ["neighbors", "neighbours"], ["neighborhood", "neighbourhood"], ["neighborhoods", "neighbourhoods"],
  ["favor", "favour"], ["favors", "favours"], ["favorite", "favourite"], ["favorites", "favourites"], ["flavor", "flavour"], ["flavors", "flavours"], ["color", "colour"], ["colors", "colours"], ["colored", "coloured"], ["colorful", "colourful"],
  ["harbor", "harbour"], ["harbors", "harbours"], ["rumor", "rumour"], ["rumors", "rumours"], ["odor", "odour"], ["odors", "odours"], ["vigor", "vigour"], ["endeavor", "endeavour"], ["endeavors", "endeavours"], ["splendor", "splendour"], ["valor", "valour"], ["fervor", "fervour"], ["armor", "armour"],
  // -er → -re
  ["center", "centre"], ["centers", "centres"], ["centered", "centred"], ["meter", "metre"], ["meters", "metres"], ["centimeter", "centimetre"], ["centimeters", "centimetres"], ["kilometer", "kilometre"], ["kilometers", "kilometres"], ["millimeter", "millimetre"], ["millimeters", "millimetres"], ["liter", "litre"], ["liters", "litres"], ["theater", "theatre"], ["theaters", "theatres"], ["fiber", "fibre"], ["fibers", "fibres"], ["somber", "sombre"], ["meager", "meagre"], ["luster", "lustre"], ["specter", "spectre"],
  // assorted
  ["defense", "defence"], ["defenses", "defences"], ["offense", "offence"], ["offenses", "offences"], ["mold", "mould"], ["molds", "moulds"], ["moldy", "mouldy"], ["artifact", "artefact"], ["artifacts", "artefacts"], ["mollusk", "mollusc"], ["mollusks", "molluscs"],
  ["archeological", "archaeological"], ["archeology", "archaeology"], ["archeologist", "archaeologist"], ["archeologists", "archaeologists"],
  ["instill", "instil"], ["instills", "instils"], ["grueling", "gruelling"], ["cozy", "cosy"], ["cozier", "cosier"], ["coziest", "cosiest"], ["curb", "kerb"], ["curbs", "kerbs"],
  ["traveling", "travelling"], ["traveled", "travelled"], ["traveler", "traveller"], ["travelers", "travellers"], ["canceled", "cancelled"], ["canceling", "cancelling"], ["labeled", "labelled"], ["labeling", "labelling"], ["modeled", "modelled"], ["modeling", "modelling"], ["marvelous", "marvellous"], ["jewelry", "jewellery"], ["gray", "grey"], ["skeptical", "sceptical"], ["skeptic", "sceptic"], ["catalog", "catalogue"], ["catalogs", "catalogues"], ["plow", "plough"], ["plows", "ploughs"], ["analyze", "analyse"], ["analyzes", "analyses"], ["analyzed", "analysed"], ["analyzing", "analysing"], ["paralyze", "paralyse"], ["paralyzed", "paralysed"],
];
// "kerb" is only the street edge; "curb" the verb (to restrain) is British too.
const CONTEXT_ONLY = { curb: /\b(?:on|off|onto|at|by|near|the) (?:the )?curbs?\b/i, curbs: /\b(?:on|off|onto|at|by|near|the) (?:the )?curbs\b/i };

const MAP = new Map(PAIRS);
for (const stem of IZE) for (const suf of IZE_SUFFIX) MAP.set(stem + suf, stem + suf.replace("iz", "is"));
const TOKEN = /[A-Za-z]+/g;

function respell(text) {
  return text.replace(TOKEN, (word, offset) => {
    const lower = word.toLowerCase();
    if (IZE_KEEP.test(lower)) return word;
    const to = MAP.get(lower);
    if (!to) return word;
    if (CONTEXT_ONLY[lower] && !CONTEXT_ONLY[lower].test(text.slice(Math.max(0, offset - 12), offset + word.length + 1))) return word;
    if (word === lower) return to;
    if (word === word.toUpperCase()) return to.toUpperCase();
    if (word[0] === word[0].toUpperCase()) return to[0].toUpperCase() + to.slice(1);
    return to;
  });
}

// Keys whose values are ids, paths or filenames — never rewritten.
const SKIP_KEY = /(Id$|^id$|Ids$|Path$|^path$|^src$|^source$|^normal$|^slow$|^href$|^url$|Url$|^file|Hash$|^hash$|^lectureVideo$|^lecturePoster$|^lectureCaptions$|^image$|^audio$|^outcomeIds$|^rubricIds$|^origin$|^reviewStatus$|^sourceFile$|^sourceUnitTitle$|^source)/;
// Keys that legitimately hold a bare word (no space) and must still be respelled.
const WORD_KEY = /^(displayWord|lemma|masterWord|correctAnswer|answer|word|term|headword|title|question|options|statement|clue|target|prompt|explanation|childMeaning|canonicalMeaning|exampleSentence|sentenceStarter|learningOutcome|note|agenda|instructions|instructionsAndItems|instructionsAndModelLines|promptAndInstructions|modelText|successCriteria|support|extension|practice|ruleAndExamples|commonMistake|memoryTip|passageScript|unitOverview|learningPath|description|answerOrGuidance|answerSummary|evidenceOfLearning|level[1-4]|beforeSession|afterSession|pronunciationText|partOfSpeechDefinition|groupTitle|unitTitle|practiceSentences|choices|pairs|tokens|bullets|narration|kicker)$/;

let changedStrings = 0;
const touched = [];
function walk(node, key) {
  if (Array.isArray(node)) return node.map((v) => walk(v, key));
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      if (SKIP_KEY.test(k)) continue;
      node[k] = walk(node[k], k);
    }
    return node;
  }
  if (typeof node !== "string") return node;
  // A slug/path-looking string is only respelled under an explicit word key.
  // A path has no spaces; "Yes/No questions" and "(Have / got)" are prose. The
  // first version treated any "/" as a path and skipped 20 real strings.
  const looksLikeIdOrPath = (!/\s/.test(node) && /[\/\\]/.test(node)) || /\.(mp3|mp4|vtt|png|jpg|json|js|css)$/i.test(node) || (!/\s/.test(node) && !WORD_KEY.test(key || ""));
  if (looksLikeIdOrPath) return node;
  const out = respell(node);
  if (out !== node) { changedStrings += 1; if (touched.length < 40) touched.push(`${key}: ${node.slice(0, 70)} -> ${out.slice(0, 70)}`); }
  return out;
}

function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
const spellingPractice = (word) => word.split("").map((ch) => (ch === " " ? "space" : ch)).join(" - ");

let files = 0;
const summary = {};
for (let grade = 1; grade <= 8; grade += 1) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  const targets = [];
  for (const name of fs.readdirSync(dataDir)) {
    const full = path.join(dataDir, name);
    if (name === "games") continue; // generated — rebuilt afterwards
    if (fs.statSync(full).isDirectory()) { for (const n of fs.readdirSync(full)) if (n.endsWith(".json")) targets.push(path.join(full, n)); }
    else if (name.endsWith(".json")) targets.push(full);
  }
  // Dictionary first so displayWords are known when links are rebuilt.
  targets.sort((a, b) => (a.includes("master-dictionary") ? -1 : b.includes("master-dictionary") ? 1 : 0));
  const dictWords = new Map();
  for (const file of targets) {
    const raw = fs.readFileSync(file, "utf8");
    const doc = JSON.parse(raw);
    const before = changedStrings;
    if (file.includes("master-dictionary")) {
      // Grade 6: drop the US duplicate of archaeological (its link is repointed below).
      if (grade === 6) {
        const i = doc.entries.findIndex((e) => e.dictionaryEntryId === "ehel-dict-en-archeological-adjective-01");
        if (i >= 0) { doc.entries.splice(i, 1); changedStrings += 1; }
      }
      walk(doc, null);
      for (const e of doc.entries) dictWords.set(e.dictionaryEntryId, e.displayWord);
    } else {
      walk(doc, null);
      for (const link of doc.dictionaryLinks || []) {
        if (grade === 6 && link.dictionaryEntryId === "ehel-dict-en-archeological-adjective-01") {
          link.dictionaryEntryId = "ehel-dict-en-archaeological-adjective-01"; link.senseId = "ehel-dict-en-archaeological-adjective-01-sense-01"; changedStrings += 1;
        }
        const w = dictWords.get(link.dictionaryEntryId);
        if (w && typeof link.spellingPractice === "string" && /^[a-z]( - [a-z]| - space)*$/i.test(link.spellingPractice)) {
          const want = spellingPractice(w.toLowerCase());
          if (link.spellingPractice.toLowerCase() !== want && link.spellingPractice.replace(/ - /g, "").replace(/space/g, " ").toLowerCase() !== w.toLowerCase()) { link.spellingPractice = want; changedStrings += 1; }
        }
      }
    }
    if (changedStrings !== before) {
      files += 1; summary[path.relative(ENGLISH, file)] = changedStrings - before;
      if (!DRY) fs.writeFileSync(file, serialise(doc, raw), "utf8");
    }
  }
}
console.log(touched.join("\n"));
console.log(JSON.stringify({ dry: DRY, filesChanged: files, stringsChanged: changedStrings }));
console.log(Object.entries(summary).map(([f, n]) => `  ${n} ${f}`).join("\n"));
