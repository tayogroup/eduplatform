/* The Science lesson kit's own drawings, for a unit lecture film.
 *
 * A storyboard asks for them with
 *     "renderer": { "art": ["science"], "scenes": [...] }
 * and tools/create-ehel-unit-lecture.js puts the script this module returns
 * between the engine's head and the film's scenes. The film then draws the
 * plant, the body, the growing seed, the sky, the two pots, the track, the
 * tank and the magnet that the lesson draws, so the child watches the same
 * picture they tap two steps later. The Bones and Muscles film started this
 * (its tool slices the skeleton and the arm); this does the same for the
 * drawings of the Grade 1 lessons.
 *
 * SLICED BY THE MARKERS THE FILE CONTAINS, never by line number. A marker
 * that has moved stops the render; it never guesses. It reads the WORKING
 * copy of lesson-kit/lib/science.js, which is the copy the lesson build
 * reads, and lesson-kit/_icons.py through python, as build-lessons.py does.
 *
 * In the page the drawings are one object, ART. Its functions are in
 * ehel-film-art-science.page.js, which runs inside the same scope as the
 * slices. What a film may draw with it is listed there.
 *
 * What it slices, and why that is enough for Grade 1: the first FIGURES,
 * SCENES and SIMS objects in science.js are exactly the Grade 1 set (the plant
 * and the body; the seed, the ground, the globe and the sky; plantWater,
 * plantLight, pushBall, floatSink, magnet, soundFar, shapeChange, globeCatch
 * and sunShade). Grades 2-4 add theirs further down the file, one assignment
 * at a time (FIGURES.mouth = ..., SIMS.circuit = ...). A film for those grades
 * adds a slice here, with its own marker check, before it draws them.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const KIT = path.join(ROOT, "src/prototypes/ehel-academy/science/lesson-kit");
const SCIENCE_JS = path.join(KIT, "lib/science.js");
const PAGE_API = path.join(__dirname, "ehel-film-art-science.page.js");

function refuse(msg) { throw new Error("the Science lesson art: " + msg); }

/* [where it starts, where it ends, what it is, whether the end marker is kept] */
const PIECES = [
  ['  const esc = (s) => String(s == null ? "" : s)', "  const wait = (ms) =>", "the lesson's helpers (esc, glyphAt)", false],
  ["  const FIGURES = {\n", "\n  };\n", "FIGURES (the plant and the body)", true],
  ["  const SCENES = {\n", "\n  };\n", "SCENES (the seed, the ground, the globe, the sky)", true],
  ["  function potSvg(x, state, label, dark, cold) {", "  const SIMS = {\n", "potSvg and twoPots", false],
  ["  const SIMS = {\n", "\n  };\n", "SIMS (the Grade 1 experiments)", true]
];

function slice(src, start, end, what, keepEnd) {
  const a = src.indexOf(start);
  if (a < 0) refuse(`science.js no longer contains ${JSON.stringify(start.trim())}, where ${what} began.`);
  if (src.indexOf(start, a + start.length) >= 0) refuse(`science.js contains ${JSON.stringify(start.trim())} twice, so where ${what} begins would be a guess.`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) refuse(`${what} no longer ends with ${JSON.stringify(end.trim())}.`);
  return src.slice(a, keepEnd ? b + end.length : b);
}

/* The kit's own drawings for the emoji older school devices cannot show, and
   which emoji each replaces, read the way the lesson build reads them. */
function kitIcons() {
  const code = "import json, sys; sys.path.insert(0, sys.argv[1]); import _icons; " +
    "sys.stdout.write(json.dumps({'icons': _icons.ICONS, 'by': {('%x' % k): v for k, v in _icons.BY_CODEPOINT.items()}}))";
  const r = spawnSync("python", ["-c", code, KIT], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.error || r.status !== 0) refuse("could not read lesson-kit/_icons.py: " + String((r.error && r.error.message) || r.stderr || "").slice(0, 400));
  const kit = JSON.parse(r.stdout);
  if (!kit.icons || !Object.keys(kit.icons).length) refuse("lesson-kit/_icons.py gave no drawings.");
  return kit;
}

function script() {
  const src = fs.readFileSync(SCIENCE_JS, "utf8").replace(/\r\n/g, "\n");
  const parts = PIECES.map(([a, b, what, keep]) => slice(src, a, b, what, keep));
  const kit = kitIcons();
  return [
    "  /* ==== the Science lesson kit's drawings ======================================",
    "     Sliced from lesson-kit/lib/science.js by tools/lib/ehel-film-art-science.js",
    "     when the film is built: everything down to \"the film's side\" is the",
    "     lesson's own code, not the film's. */",
    "  var ART = (function () {",
    "    \"use strict\";",
    "    const ICONS = " + JSON.stringify(kit.icons) + ";",
    "    const BY_CODEPOINT = " + JSON.stringify(kit.by) + ";",
    "    /* A film draws the lesson's pictures and never runs the lesson. These stand",
    "       in for what an experiment's run() would reach for, and $ refuses. */",
    "    const $ = () => { throw new Error(\"a film cannot run a lesson's experiment: draw its picture with ART.sim(name, 'draw' or 'init', ...)\"); };",
    "    const SOUND = { play() { return false; }, has() { return false; } };",
    "",
    parts.join("\n"),
    fs.readFileSync(PAGE_API, "utf8"),
    "  })();",
    ""
  ].join("\n");
}

/* The lesson's figures carry a tap outline on every part, which science.css
   draws only while a part is focused, found or pinged. In a film an outline is
   invisible until ART.ring gives it a stroke; without this rule each one would
   fill black over the part it surrounds. */
function css() {
  return "svg .outline { fill: none; stroke: transparent; stroke-width: 3; }";
}

module.exports = { script, css };
