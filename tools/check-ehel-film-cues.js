/* A storyboard declares art cues (art.at.<key>); the scene files read them with
 * sc(scene, i, "<key>") or cue(i, "<key>"). A key that is declared and never
 * read is invisible to --dry (which counts characters and objectives) and to
 * --sweep (which draws frames and finds none wrong): nothing happens when the
 * words are said, and nothing reports it. This finds them.
 *
 * It is deliberately CRUDE: it asks only whether the key appears as a quoted
 * string anywhere in the film's own scene files plus the shared marks library.
 * Crude on purpose - a stricter version that matched sc(..., "k") call sites and
 * counted them was written, tested and thrown away, because several scenes drive
 * a row of cards from a table and call sc(scene, 1, a.at) in a loop, so the key
 * is never at the call site at all. It reported four cues as dead on one Grade 4
 * film that are read on one line of its own source. A checker that cries wolf on
 * every cue is worse than one that misses some.
 *
 * So this one misses things, and here is a PROVEN miss, found by a reviewer on
 * 2026-09-24 rather than by the tool: Grade 4's backbone-or-not declares "size"
 * TWICE - sort beat 3 and recap beat 3 - and reads it once, in the sort chapter.
 * The single occurrence clears both, and the dead recap cue passes. Anywhere two
 * chapters of one film name a cue the same way, only the first is really checked.
 *
 * Treat a hit as certainly worth looking at, and a clean run as evidence rather
 * than proof.
 */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = require("path").resolve(__dirname, "..");
const marks = fs.readFileSync(path.join(ROOT, "tools/lib/ehel-film-marks.js"), "utf8");

/* Where a grade's storyboards and scenes live, per subject. Mathematics Grade 1
   keeps its app under g1v2, so the app path is listed rather than derived. */
const SUBJECTS = {
  science: { app: (g) => "src/prototypes/ehel-academy/science/grade-" + g + "-app", scenes: (g) => "science-g" + g },
  computing: { app: (g) => "src/prototypes/ehel-academy/computing/grade-" + g + "-app", scenes: (g) => "computing-g" + g },
  mathematics: {
    app: (g) => "src/prototypes/ehel-academy/mathematics/grade-" + g + "-app" + (g === "1" ? "/g1v2" : ""),
    scenes: (g) => "math-g" + g,
  },
};
const args = process.argv.slice(2);
/* The subject is optional and defaults to science, which is a silent trap: a
   Maths agent running `node tools/check-ehel-film-cues.js 1` gets a confident
   summary about SCIENCE grade 1 and no hint that it asked the wrong question.
   Found by the first Mathematics film agent, 2026-09-24. The default stays, so
   the Science READMEs' documented call still works - but every line of output
   now names the subject it actually checked, so a summary cannot be read as
   being about the wrong one. */
const subject = SUBJECTS[args[0]] ? args.shift() : "science";
const S = SUBJECTS[subject];

let total = 0, unread = 0;
for (const grade of args) {
  const sbDir = path.join(ROOT, S.app(grade), "lecture-video");
  const scDir = path.join(ROOT, "tools/lib/film-scenes", S.scenes(grade));
  if (!fs.existsSync(sbDir)) { console.log("no lecture-video for " + subject + " grade " + grade); continue; }
  for (const f of fs.readdirSync(sbDir).filter((x) => x.endsWith(".json"))) {
    const slug = f.replace(/\.json$/, "");
    let sb; try { sb = JSON.parse(fs.readFileSync(path.join(sbDir, f), "utf8")); } catch (e) { console.log("!! unparseable", f); continue; }
    if (!sb.renderer) continue;
    let code = marks;
    if (fs.existsSync(scDir)) for (const s of fs.readdirSync(scDir))
      if (s === slug + ".js" || s.startsWith(slug + "-")) code += fs.readFileSync(path.join(scDir, s), "utf8");
    const bad = [];
    for (const scene of sb.scenes || []) for (const [bi, beat] of (scene.beats || []).entries())
      for (const key of Object.keys((beat.art && beat.art.at) || {})) {
        total++;
        if (!code.includes('"' + key + '"') && !code.includes("'" + key + "'")) {
          bad.push(scene.id + " beat " + bi + ': "' + key + '" -> ' + JSON.stringify(beat.art.at[key]));
          unread++;
        }
      }
    if (bad.length) { console.log("\n" + subject + " G" + grade + "  " + slug); bad.forEach((b) => console.log("   " + b)); }
  }
}
console.log("\n" + subject + ": " + total + " declared cues checked, " + unread + " never read by any scene file.");

/* A run that checked nothing reads exactly like a clean one, so it says so
   rather than printing a tick over no work. */
if (!total) {
  console.log("nothing was checked. Name the grades: node tools/check-ehel-film-cues.js [science|mathematics] 1 2 3 4");
  process.exitCode = 2;
}
