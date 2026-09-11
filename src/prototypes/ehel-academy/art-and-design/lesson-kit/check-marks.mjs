/* The keyboard and switch route through the marks step, checked against the
 * SHIPPED pages: every mark a round can ask for is drawn by markPts() and
 * judged by the page's own CHECKS through the page's own strokeFeatures -
 * the same judge a finger's stroke meets - and must pass it, from the middle
 * of the paper and from 40 px above and below (the free round stamps at a
 * random height). And no RIVAL shape offered beside it may pass the same
 * check, or a hand-drawn rival would be marked right: that is how a big
 * zigzag was found passing as a circle (2026-09-11).
 *
 *   node ../lesson-kit/check-marks.mjs <page.html> [<page.html> ...]
 *
 * Called by check-coverage.py for every lesson page. Prints one line per page
 * and exits 1 on a finding, 2 when it cannot read a page's code - a check that
 * cannot find the functions it tests and passes is green about nothing.
 */
import fs from "node:fs";

const START = "  const CHECKS = {", END = "  /* the little picture of a mark";
let bad = 0;
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, "utf8");
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a < 0 || b < a) { console.log("  cannot read CHECKS..markPts in " + file); process.exit(2); }
  let T;
  try { T = new Function(src.slice(a, b) + ";return {CHECKS, TOOLS, strokeFeatures, markPts, MARK_RIVALS, MARK_NAME};")(); }
  catch (e) { console.log("  cannot evaluate the marks code in " + file + ": " + e.message); process.exit(2); }
  const wants = Object.keys(T.CHECKS);
  if (wants.length < 6) { console.log("  only " + wants.length + " checks read from " + file); process.exit(2); }
  /* thick and thin are the TOOL's width, not the shape: the round's tool is
     what makes them, so their rivals are not a shape question */
  const toolFor = { thick: "brush", thin: "pencil" };
  const judge = (want, shape, dy) => {
    const session = { dots: 0 };
    let f = null;
    for (const s of T.markPts(shape, dy)) {
      f = T.strokeFeatures(s, toolFor[want] || "crayon", session);
      if (f.len < 14) session.dots++;
      f = T.strokeFeatures(s, toolFor[want] || "crayon", session);
    }
    return f && T.CHECKS[want](f);
  };
  const findings = [];
  for (const want of wants) {
    if (!T.MARK_NAME[want]) findings.push(want + " has no name to read out");
    for (const dy of [0, -40, 40]) {
      if (!judge(want, want, dy)) findings.push(want + " drawn at " + dy + " fails its own check");
      if (!T.markPts(want, dy).flat().every((p) => p.x >= 0 && p.x <= 320 && p.y >= 0 && p.y <= 220)) findings.push(want + " at " + dy + " leaves the paper");
    }
    const rivals = T.MARK_RIVALS[want] || [];
    if (!rivals.length) findings.push(want + " has no rivals to choose between");
    if (!toolFor[want]) for (const r of rivals) if (judge(want, r, 0)) findings.push("a " + r + " passes the " + want + " check");
  }
  if (findings.length) { bad++; console.log("  FAIL " + file.split(/[\\/]/).pop() + ": " + findings.join("; ")); }
  else console.log("  ok   " + file.split(/[\\/]/).pop().padEnd(28) + " " + wants.length + " marks drawn and judged, no rival passes");
}
process.exit(bad ? 1 : 0);
