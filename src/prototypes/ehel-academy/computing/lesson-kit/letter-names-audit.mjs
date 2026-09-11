/*
 * letter-names-audit.mjs - what lib/voice.js :: letterNames() changes in the
 * words a Computing lesson speaks, and a self-test that it still behaves.
 *
 *   node ../lesson-kit/letter-names-audit.mjs            # from a grade directory: that grade
 *   node letter-names-audit.mjs ../grade-1-app ../grade-3-app
 *   node letter-names-audit.mjs --all                    # every grade-*-app beside the kit
 *
 * letterNames() hands the voice a lone letter in capitals ("A is 1" where the
 * page shows "a is 1") so the engines read the letter's name, not the article
 * (Grade 3 validation, 2026-09-11). It runs on EVERY line a Computing page
 * speaks, in every grade, so it has to be read, not trusted: this lists every
 * change it makes in the built pages - the slides' data-say and data-explain,
 * every string in each lesson's data, and the lines the cipher renderer builds
 * for its rounds - and then every lone lowercase "a" it left alone, by the
 * word after it, which is where a missed letter would hide.
 *
 * The function is not copied here: it is cut out of lib/voice.js between its
 * two marker comments and run, so this audits the shipped code. The self-test
 * below must pass first (exit 1 if not): sentences that must change and
 * sentences that must not. Exit 2 if the function cannot be found.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const voice = fs.readFileSync(path.join(KIT, "lib", "voice.js"), "utf8");
const a = voice.indexOf("/* LETTER NAMES."), b = voice.indexOf("/* end LETTER NAMES */");
if (a < 0 || b < a) { console.log("  cannot run: the LETTER NAMES block is not in lib/voice.js"); process.exit(2); }
const { letterNames, letterNamesInSsml } = new Function(voice.slice(a, b) + "\nreturn { letterNames, letterNamesInSsml };")();

/* ---- the self-test: a rule that is not watched failing is not known to work */
const MUST = [
  ["a is 1", "A is 1"],
  ["Give each letter its number. a is 1, b is 2, c is 3.", "Give each letter its number. A is 1, B is 2, C is 3."],
  ["8 is h, 9 is i. Hi.", "8 is H, 9 is I. Hi."],
  ["cat is c, a, t: 3, 1, 20.", "cat is C, A, T: 3, 1, 20."],
  ["It starts with a", "It starts with A"],
  ["the 1 = a code", "the 1 = A code"],
  ["under a is d", "under A is D"],
  ["1 is a and 2 is b", "1 is A and 2 is B"],
  ["the alphabet, a to z, is 26 letters", "the alphabet, A to Z, is 26 letters"],
  ["Look at the strip: 1 is the letter a.", "Look at the strip: 1 is the letter A."],
  ["A shift of 3 turns a into d.", "A shift of 3 turns A into D."],
];
const MUSTNOT = [
  "This is a cat.", "Each number is a letter: tap it.", "Is a game something you can touch?", "a to-do list",
  "It's a dog.", "it&#39;s a dog", "Meet at 8 a.m. sharp.", "Use a key, e.g. a password.", "Robots in films often have feelings.",
  "A Caesar cipher, shift 3.", "a b-side", "the grids that give each letter a shape",
  "A mistake in a program is called a...", "Phones on a train are on a…", "Tap the %s.",
];
let bad = 0;
for (const [x, want] of MUST) { const got = letterNames(x); if (got !== want) { bad++; console.log("  SELF-TEST  %j -> %j, wanted %j", x, got, want); } }
for (const x of MUSTNOT) { const got = letterNames(x); if (got !== x) { bad++; console.log("  SELF-TEST  %j changed to %j; it must not", x, got); } }
const tagged = '<s>a is 1</s><mstts:express-as style="calm" styledegree="1.15">so is a b</mstts:express-as>';
const tagWant = '<s>A is 1</s><mstts:express-as style="calm" styledegree="1.15">so is a B</mstts:express-as>';
if (letterNamesInSsml(tagged) !== tagWant) { bad++; console.log("  SELF-TEST  SSML %j -> %j", tagged, letterNamesInSsml(tagged)); }
if (bad) { console.log("\n  the self-test failed %d time(s): lib/voice.js :: letterNames() does not do what the rule says", bad); process.exit(1); }
console.log("  self-test: %d must change, %d must not, and text inside tags untouched - all as they should be\n", MUST.length, MUSTNOT.length);

/* ---- the grades */
/* --show WORD prints where a lone "a" stands before WORD, to read one entry of the list at the end */
const SHOW = process.argv.includes("--show") ? process.argv[process.argv.indexOf("--show") + 1] : null;
let dirs = process.argv.slice(2).filter((x, k, all) => !x.startsWith("--") && all[k - 1] !== "--show");
if (process.argv.includes("--all")) dirs = fs.readdirSync(path.dirname(KIT)).filter((d) => /^grade-\d+-app$/.test(d)).map((d) => path.join(path.dirname(KIT), d));
if (!dirs.length) dirs = [process.cwd()];

const unattr = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
/* what reaches the voice from a line of display HTML: lib/deck.js :: plain() */
const plain = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const SSML = /<(mstts:)?express-as|<prosody|<emphasis|<break|<say-as|<[sp]>/i;
const ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
const decodeCode = (code) => code.map((n) => ALPHA[n - 1]).join("");
const caesar = (w, k) => w.split("").map((c) => (ALPHA.includes(c) ? ALPHA[(ALPHA.indexOf(c) + k + 26) % 26] : c)).join("");

/* the lines cipher() in lib/computing.js builds for a round (askText, the
   wrong-key line for each position); kept in step with it by hand, which the
   listing makes visible - a template that changes shows here as new text */
function cipherLines(rd) {
  const m = rd.mode || "number", decode = rd.kind === "decode", out = [];
  if (m === "number") {
    out.push(decode ? "Each number is a letter: 1 is a, 2 is b. Tap the letters to decode " + rd.code.join(" ") + "." : "Each letter is a number: a is 1, b is 2. Tap the numbers to write " + rd.word + " in code.");
    const target = decode ? decodeCode(rd.code).split("") : rd.word.split("").map((c) => String(ALPHA.indexOf(c) + 1));
    target.forEach((want, k) => out.push(decode ? "Look at the strip: " + rd.code[k] + " is the letter " + want + "." : "Look at the strip: " + rd.word[k] + " is number " + want + "."));
  } else if (m === "caesar") {
    const target = decode ? rd.answer.split("") : caesar(rd.word, rd.shift).split("");
    target.forEach((want, k) => out.push(decode ? "Look at the strip: " + rd.code[k] + " in the bottom row sits under " + want + "." : "Look at the strip: under " + rd.word[k] + " is " + want + "."));
  } else if (m === "pigpen") {
    const target = (decode ? rd.answer : rd.word).split("");
    target.forEach((want) => out.push(decode ? "Look at the grid: that symbol is " + want + "." : "Look at the grid: the symbol for " + want + " is in its own cell."));
  }
  return out;
}

let changedTotal = 0;
const leftA = new Map();
for (const dir of dirs) {
  const cfgPath = path.join(dir, "app.config.json");
  if (!fs.existsSync(cfgPath)) { console.log("  %s: no app.config.json - not a grade directory", dir); process.exitCode = 2; continue; }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const lines = [];
  cfg.lessons.forEach((l, i) => {
    const page = fs.readFileSync(path.join(dir, l.file), "utf8");
    const tag = "L" + (i + 1);
    for (const m of page.matchAll(/data-explain='([^']*)'/g)) lines.push([tag, "explain", unattr(m[1]), true]);
    for (const m of page.matchAll(/<section class="slide"[^>]*? data-say="([^"]*)"/g)) lines.push([tag, "say", unattr(m[1]), false]);
    const data = page.match(/\n  const LESSON = (\{.*?\n  \});\n/s);
    if (data) {
      const L = JSON.parse(data[1]);
      const walk = (o) => {
        if (typeof o === "string") lines.push(SSML.test(o) ? [tag, "data", o, true] : [tag, "data", plain(o), false]);
        else if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if (!["kind", "id", "objectives", "icon", "pic", "scene", "sound", "mode"].includes(k)) walk(v); });
      };
      walk(L.steps.map((s) => s.data));
      L.steps.forEach((s) => { if (s.kind === "cipher") (s.data.rounds || []).forEach((rd) => cipherLines(rd).forEach((t) => lines.push([tag, "cipher", t, false]))); });
    }
  });
  const seen = new Set();
  let changed = 0;
  console.log("  " + path.basename(dir) + ":");
  for (const [tag, where, text, ssml] of lines) {
    const got = ssml ? letterNamesInSsml(text) : letterNames(text);
    const plainText = ssml ? text.replace(/<[^>]*>/g, " ") : text;
    for (const m of plainText.matchAll(/(^|[^A-Za-z0-9'‘’-])a(?=\s+([A-Za-z]+))/g)) {
      const w = m[2].toLowerCase();
      if (!/^(is|becomes|moves|to|and|or|into)$/.test(w)) leftA.set(w, (leftA.get(w) || 0) + 1);
      if (w === SHOW) console.log("    [a %s] %s %s: %s", SHOW, tag, where, JSON.stringify(plainText.slice(Math.max(0, m.index - 60), m.index + 30)));
    }
    if (got === text) continue;
    const shown = (ssml ? got.replace(/<[^>]*>/g, " ") : got).replace(/\s+/g, " ").trim();
    const key = shown;
    if (seen.has(key)) continue;
    seen.add(key);
    changed++;
    console.log("    " + tag.padEnd(4) + " " + where.padEnd(7) + " " + (shown.length > 150 ? shown.slice(0, 147) + "..." : shown));
  }
  console.log("    %d distinct line(s) changed\n", changed);
  changedTotal += changed;
}
console.log("  a lone lowercase \"a\" left as the article, by the word after it (a letter hiding here would be missed):");
console.log("    " + [...leftA.entries()].sort((x, y) => y[1] - x[1]).map(([w, n]) => w + " " + n).join(", "));
console.log("\n  %d distinct spoken line(s) changed across %d grade(s); read them - the rule is only as good as that list", changedTotal, dirs.length);
