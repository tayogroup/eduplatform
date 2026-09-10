/* Run a build's RUNTIME question generators and emit what they produce.
 *
 *   node lesson-app-tools/emit-generated-questions.mjs --app ../grade-3-app
 *   node lesson-app-tools/emit-generated-questions.mjs --app ../grade-3-app --samples 40 --out qs.json
 *
 * WHY THIS EXISTS. Grade 3 builds most of its check questions at runtime -
 * `const QS = [ () => { const n = rnd(11, 89); return { q: "What is " + n +
 * " x 10?", opts: [...], a: n * 10 }; }, ... ]` - so 33 of the 53 questions a
 * learner is asked have no answer key in the source at all. check-answer-keys.py
 * reported them as "generated at runtime and cannot be read from source", which
 * is true of a STATIC reader and was being read as "cannot be checked".
 *
 * They can be checked. The answer is an expression over the same variables as
 * the question - `a: n * 10` beside `"What is " + n + " x 10?"` - so a wrong
 * key (`a: n + 10`) is an ordinary defect that only needs the code RUN to see.
 * This runs each generator many times and prints the questions it makes.
 *
 * IT DOES NOT JUDGE ANY ANSWER, deliberately. The rules live in
 * check-answer-keys.py and a second copy here would be two definitions of a
 * correct answer, free to drift, with the copy passing while the shipped one
 * was broken. This emits; that judges (`--generated`).
 *
 * TWO THINGS IT MIRRORS FROM THE APP, because the point is to check what a
 * LEARNER meets rather than what the generator can emit:
 *   - an item whose options are not all distinct is DROPPED, exactly as
 *     nextQ() regenerates it - the app never shows one, so a rule failing on
 *     one would be a finding about a question nobody is asked.
 *   - the generators are run in a vm with only rnd/two/Math in scope, so a
 *     lesson that reaches for the DOM fails loudly here instead of silently
 *     emitting nothing.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const argv = process.argv.slice(2);
const FLAGS = ["--app", "--samples", "--out"];
const val = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
// REFUSE AN UNRECOGNISED ARGUMENT rather than falling back to the default set.
// A typo would otherwise emit a different build's questions under the name of
// the one you asked for, which reads as a clean result about the wrong thing.
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    if (!FLAGS.includes(argv[i])) {
      console.error("unrecognised argument: " + argv[i]);
      process.exit(2);
    }
    i++;                                  // its value
  } else if (i === 0 || !FLAGS.includes(argv[i - 1])) {
    console.error("unexpected argument: " + argv[i]);
    process.exit(2);
  }
}

const SRC = path.resolve(process.cwd(), val("--app", "."));
const SAMPLES = Number(val("--samples", 25));
const OUT = val("--out", null);

// MIRROR check-answer-keys.py's fallback rather than refusing. A build with no
// app.config.json is a real thing to point at - ../grade-1-app, the superseded
// five-lesson build - and the checker reads it by listing .html files. Refusing
// here made the emitter unable to look at a build the checker can, which reads
// as "no runtime questions there" when nothing has been asked.
const cfgPath = path.join(SRC, "app.config.json");
let lessons;
if (fs.existsSync(cfgPath)) {
  lessons = JSON.parse(fs.readFileSync(cfgPath, "utf8")).lessons.map((l) => l.file);
} else if (fs.existsSync(SRC)) {
  lessons = fs.readdirSync(SRC)
    .filter((f) => f.endsWith(".html") && !f.endsWith("index.html")).sort();
} else {
  console.error("No such build: " + SRC + "\n  pass --app <dir>");
  process.exit(2);
}
const cfg = { lessons: lessons.map((f) => ({ file: f })) };

// the helpers every generator in these builds uses. Identical in all eight
// Grade 3 lessons; `two` is a zero-pad for clock faces.
const PRELUDE = `
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const two = (n) => (n < 10 ? "0" : "") + n;
`;

/* A GENERATOR CLOSES OVER ITS LESSON'S OWN CONSTANTS, and a fixed prelude
 * cannot know them. equal-parts reaches for NAMES, shapes-and-symmetry for
 * SHAPES and SOLIDS, and those four generators failed outright when this
 * shipped a hard-coded prelude - correctly and loudly, which is the only
 * reason they were found rather than quietly emitting fewer questions.
 *
 * So the lesson's own `const X = <literal>` declarations are hoisted, in
 * source order so one may use another. Anything reaching for the DOM is left
 * out: those belong to the page, never to a question, and evaluating one here
 * would fail for a reason that has nothing to do with the answer keys.
 */
function topLevelConsts(js) {
  const out = [];
  for (const m of js.matchAll(/\n[ \t]*const\s+([A-Za-z_$][\w$]*)\s*=\s*/g)) {
    let i = m.index + m[0].length, depth = 0, end = -1;
    for (let j = i; j < js.length; j++) {
      const c = js[j];
      if ("[{(".includes(c)) depth++;
      else if ("]})".includes(c)) depth--;
      else if (c === ";" && depth === 0) { end = j; break; }
      else if (c === "\n" && depth === 0 && js.slice(i, j).trim()) { end = j; break; }
    }
    if (end < 0) continue;
    const text = js.slice(m.index, end + 1);
    if (/\bdocument\b|\bwindow\b|\$\(/.test(text)) continue;
    // A DATA TABLE ONLY. Matching every `const` also caught the single-letter
    // LOCALS inside the generators themselves - `const s = ...` - because those
    // lines are indented too, and re-declaring them around the block failed it
    // outright ("Identifier 's' has already been declared"). A hoisted constant
    // has to be an array or object literal, declared once in the file, and not
    // a name the prelude already provides.
    if (!/^[[{]/.test(js.slice(m.index + m[0].length).trimStart())) continue;
    // SCREAMING_CASE ONLY, three characters or more - the convention these
    // lessons use for a data table. Accepting any name hoisted the LOCALS
    // inside the generators instead, because the reference test `\bopts\b`
    // matches the property name `opts:` in every generator's own return: that
    // pulled in `const opts = [right, ...]` from inside a function and failed
    // the whole block on an undefined `right`. Three characters keeps out the
    // single-letter locals A, B and CX, which are uppercase and are not tables.
    if (!/^[A-Z][A-Z0-9_]{2,}$/.test(m[1])) continue;
    out.push({ name: m[1], text });
  }
  const once = new Map();
  for (const c of out) once.set(c.name, once.has(c.name) ? null : c);
  return [...once.values()].filter(Boolean);
}

const out = [];
let files = 0, gens = 0, dropped = 0, failed = 0, statics = 0;

for (const lesson of cfg.lessons) {
  const p = path.join(SRC, lesson.file);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, "utf8");
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");

  // every `const QS = [ ... ];` block, brace-counted rather than regexed to a
  // closing bracket: the generators contain `]` inside their own opts arrays
  const blocks = [];
  for (const m of js.matchAll(/const\s+QS\s*=\s*\[/g)) {
    let i = m.index + m[0].length - 1, depth = 0;
    for (let j = i; j < js.length; j++) {
      if (js[j] === "[") depth++;
      else if (js[j] === "]" && --depth === 0) { blocks.push(js.slice(i, j + 1)); break; }
    }
  }
  if (!blocks.length) continue;
  files++;

  const consts = topLevelConsts(js).filter((c) => c.name !== "QS");
  for (const block of blocks) {
    let arr;
    const needed = consts
      .filter((c) => new RegExp("\\b" + c.name + "\\b").test(block))
      .map((c) => c.text).join("\n");
    try {
      arr = vm.runInNewContext(PRELUDE + needed + "\n(" + block + ")",
                               Object.create(null), { timeout: 5000 });
    } catch (e) {
      console.error("  FAILED to evaluate a QS block in " + lesson.file + ": " + e.message);
      failed++;
      continue;
    }
    arr.forEach((gen, gi) => {
      // A `QS` ARRAY IS NOT ALWAYS GENERATORS. Grade 2's sides-and-corners
      // holds four PLAIN OBJECTS - `{ q, a, opts, why }` - under the same name,
      // and calling one failed the whole block with "g is not a function",
      // which reads as a broken build rather than as a build whose questions
      // are static. They already have keys in the source, so check-answer-keys
      // reads them by its ordinary path and there is nothing to run here.
      if (typeof gen !== "function") { statics++; return; }
      gens++;
      const seen = new Map();
      for (let s = 0; s < SAMPLES * 20 && seen.size < SAMPLES; s++) {
        let item;
        try {
          item = vm.runInNewContext("g()", Object.assign(Object.create(null), { g: gen }), { timeout: 2000 });
        } catch (e) {
          console.error("  FAILED " + lesson.file + " generator " + gi + ": " + e.message);
          failed++;
          break;
        }
        if (!item || item.q === undefined || item.opts === undefined || item.a === undefined) continue;
        const opts = item.opts.map(String);
        if (new Set(opts).size !== opts.length) { dropped++; continue; }   // nextQ() would regenerate
        const k = JSON.stringify([item.q, opts]);
        if (!seen.has(k)) seen.set(k, { file: lesson.file, gen: gi, q: String(item.q), opts, a: String(item.a) });
      }
      out.push(...seen.values());
    });
  }
}

if (!gens) {
  // SAY WHICH KIND OF NOTHING. "No runtime generators" is true of a build with
  // no QS array at all AND of one whose QS holds plain objects - Grade 2's
  // sides-and-corners has four - and those are different facts: the second
  // build's questions ARE checked, by the ordinary static path. Reporting only
  // the first invites the reading that its questions go unexamined.
  console.error("REFUSED: nothing to run in " + SRC + " - " +
    (statics
      ? statics + " QS entr" + (statics === 1 ? "y is" : "ies are") +
        " plain object(s) with keys already in the source, which" +
        " check-answer-keys.py reads by its ordinary path"
      : "this build declares no runtime question generators") +
    ".\n  Emitting an empty set would read as 'nothing to check'.");
  process.exit(2);
}

const text = JSON.stringify(out, null, 1);
if (OUT) fs.writeFileSync(OUT, text);
else process.stdout.write(text + "\n");
console.error("\n  " + files + " lesson(s), " + gens + " generator(s) -> " + out.length +
              " distinct question(s)" +
              (dropped ? ", " + dropped + " draw(s) dropped for repeated options" : "") +
              (failed ? ", " + failed + " FAILED" : ""));
process.exit(failed ? 1 : 0);
