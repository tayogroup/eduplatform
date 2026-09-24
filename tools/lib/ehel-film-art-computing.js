/* The Computing lesson kit's own drawings, for a unit lecture film.
 *
 * A storyboard asks for them with
 *     "renderer": { "art": ["computing"], "scenes": [...] }
 * and tools/create-ehel-unit-lecture.js puts the script this module returns
 * between the engine's head and the film's scenes. The film then draws the
 * child getting dressed, the sandwich, the tower, the smoothie, the kite, the
 * cake, the present and the internet; what Robo draws from a vague
 * instruction; the laptop and the tablet with their parts; the Pigpen glyphs
 * and Bitsy's lights - the pictures the lesson draws, so the child watches the
 * same picture they tap two steps later.
 *
 * It also hands a film the lesson's own RULES: what a repeat block expands to,
 * what a machine rule does to a number, how a loop, a sub-routine and a branch
 * flatten out, what a Caesar shift makes of a word. Those are the functions
 * computing.js marks "mirrored in _rules.py", so a film narrating an algorithm
 * and the lesson running it agree by construction.
 *
 * SLICED BY THE MARKERS THE FILE CONTAINS, never by line number. A marker that
 * has moved, or that has come to appear twice, stops the render; it never
 * guesses. It reads the WORKING copy of lesson-kit/lib/computing.js, which is
 * the copy the lesson build reads. Unlike the Science adapter it runs no
 * python: the Computing kit has no _icons.py, because nothing in it swaps an
 * Emoji 13+ picture for a drawing.
 *
 * In the page the drawings are one object, ART. Its functions are in
 * ehel-film-art-computing.page.js, which runs inside the same scope as the
 * slices. What a film may draw with it is listed there.
 *
 * WHAT IT DOES NOT SLICE, and why, because the next person will look for it.
 * Science keeps its experiments in a top-level SIMS object whose entries have
 * draw() and init(), so the adapter can call them. Computing keeps nothing of
 * the sort: its thirty-odd activities are `function someActivity(o)` and EVERY
 * drawing they make is a closure inside one of them - Robo's grid (gridSvg),
 * Bitsy's board (board), the spreadsheet, the network, the bar graph, the
 * cipher wheel. None of them can be reached without running the activity, and
 * running one needs the lesson page's own element ids. What IS top level is
 * the four objects of pure markup (SCENES, DRAWINGS, FIGURES, plus pigpenSvg)
 * and the rule functions, and that is what this lifts. The rest a film draws
 * itself, in the engine's own idiom.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const KIT = path.join(ROOT, "src/prototypes/ehel-academy/computing/lesson-kit");
const COMPUTING_JS = path.join(KIT, "lib/computing.js");
const PAGE_API = path.join(__dirname, "ehel-film-art-computing.page.js");

function refuse(msg) { throw new Error("the Computing lesson art: " + msg); }

/* [where it starts, where it ends, what it is, whether the end marker is kept] */
const PIECES = [
  ['  const esc = (s) => String(s == null ? "" : s)', "  const wait = (ms) =>",
    "the lesson's helpers (esc, picHtml, small)", false],
  ["  const T = (x, y, size, glyph) =>", "\n  };\n",
    "T, LABEL, NOTE and SCENES (the everyday tasks, drawn from an ordered list of ids)", true],
  ["  const BLOCKS = {\n", "  /* ==================================================================\n     RENDERERS shared with the Science kit",
    "BLOCKS, the sprite stage, and the repeat block (expandProgram, runWords)", false],
  ["  const DIRS = { up: [0, -1]", "  function robotGrid(o) {",
    "Robo's rules (the facings, the two turn tables, the four commands)", false],
  ["  const DRAWINGS = {\n", "\n  };\n",
    "DRAWINGS (what Robo draws from a precise or a vague instruction)", true],
  ["  const FIGURES = {\n", "\n  };\n",
    "FIGURES (the laptop and the tablet, with a tap part each)", true],
  ["  function ruleOutput(rule, x) {", "  /* paint a scene one step at a time",
    "the Stage 3 rules mirrored in _rules.py (ruleOutput, walkEnd, the cipher numbers)", false],
  ["  const DEVICE_BLOCKS = {\n", "  function deviceProgram(o) {",
    "Bitsy: its blocks, its five inputs, its light patterns, and devicePlan", false],
  ["  function expandLoop(before, body, times, after) {", "  /* an algorithm list with repeat and forever boxes",
    "the Stage 4 rules mirrored in _rules.py, and the Pigpen glyphs", false]
];

function slice(src, start, end, what, keepEnd) {
  const a = src.indexOf(start);
  if (a < 0) refuse(`computing.js no longer contains ${JSON.stringify(start.trim())}, where ${what} began.`);
  if (src.indexOf(start, a + start.length) >= 0) refuse(`computing.js contains ${JSON.stringify(start.trim())} twice, so where ${what} begins would be a guess.`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) refuse(`${what} no longer ends with ${JSON.stringify(end.trim())}.`);
  return src.slice(a, keepEnd ? b + end.length : b);
}

function script() {
  const src = fs.readFileSync(COMPUTING_JS, "utf8").replace(/\r\n/g, "\n");
  const parts = PIECES.map(([a, b, what, keep]) => slice(src, a, b, what, keep));
  const page = fs.readFileSync(PAGE_API, "utf8");
  /* The page file is the tail of the IIFE, so it has to end by returning the
     drawings. A file that has stopped doing that would make ART undefined and
     every frame blank, which is worth refusing here rather than discovering in
     a render. */
  if (!/\n\s*return \{[\s\S]*place: place[\s\S]*\};\s*$/.test(page))
    refuse("ehel-film-art-computing.page.js no longer ends by returning its drawings");
  return [
    "  /* ==== the Computing lesson kit's drawings ====================================",
    "     Sliced from lesson-kit/lib/computing.js by tools/lib/ehel-film-art-computing.js",
    "     when the film is built: everything down to \"the film's side\" is the",
    "     lesson's own code, not the film's. */",
    "  var ART = (function () {",
    "    \"use strict\";",
    "    /* A film draws the lesson's pictures and never runs a lesson activity.",
    "       Every activity reaches the page through $ by the ids the lesson gave it,",
    "       and a film has none of them, so $ refuses by name. The ONE thing here",
    "       that legitimately wants the DOM is the lesson's own sprite stage, which",
    "       opens this gate around its own call and shuts it again. */",
    "    var DOM_OPEN = false;",
    "    function $(id) {",
    "      if (!DOM_OPEN) throw new Error(\"a film cannot run a Computing activity: draw its picture with ART.scene, ART.drawing, ART.figure or ART.stage\");",
    "      var node = document.getElementById(id);",
    "      if (!node) throw new Error(\"ART: the scratch stage has no #\" + id);",
    "      return node;",
    "    }",
    "    var SOUND = { play: function () { return false; }, has: function () { return false; } };",
    "",
    parts.join("\n"),
    page,
    "  })();",
    ""
  ].join("\n");
}

/* The lesson's figures carry a tap outline on every part. computing.css draws
   it as the tap TARGET - fill: transparent, so a tap between a speaker's six
   dots still counts - and rings it only while a part is focused, found or
   pinged. In a film an outline is invisible until ART.ring gives it a stroke;
   without this rule each one would fill black over the part it surrounds. */
function css() {
  return "svg .outline { fill: none; stroke: transparent; stroke-width: 3; }";
}

module.exports = { script, css };
