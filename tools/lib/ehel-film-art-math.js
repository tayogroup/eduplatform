/* The Mathematics films' pictures, for a unit lecture film.
 *
 * A storyboard asks for them with
 *     "renderer": { "art": ["math"], "scenes": [...] }
 * and tools/create-ehel-unit-lecture.js puts the script this module returns
 * between the engine's head and the film's scenes. The film can then draw a
 * ten frame, a number line, coins, a clock, a bar model, an array, a fraction,
 * place value blocks, tallies, a bar chart, a pictogram, a pan balance, a
 * ruler, a flat shape, a squared grid, a growing pattern and a spinner - the
 * pictures the Mathematics lessons build, so the child watches the same
 * picture they tap two steps later.
 *
 * IT SLICES NOTHING, and that is the difference from
 * ehel-film-art-science.js. Science has a lesson kit whose drawings are one
 * file of functions, so the science adapter cuts them out by marker and hands
 * a film the lesson's own code. Mathematics has no kit: every lesson page
 * builds its ten frames, number lines, coins and bars out of its own HTML and
 * CSS, differently each time, so there is nothing to cut. These drawings are
 * therefore WRITTEN, once, in ehel-film-art-math.page.js, which is the whole
 * of what this module wraps. They match the lessons by reading their look -
 * the light :root palette, the dark ten frame, the gold coin, the short ink
 * hour hand and the long accent minute hand - not their markup.
 *
 * In the page the drawings are one object, ART. What a film may draw with it
 * is listed at the top of the page file.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const PAGE_API = path.join(__dirname, "ehel-film-art-math.page.js");

function script() {
  const page = fs.readFileSync(PAGE_API, "utf8");
  /* The page file is the body of the IIFE, so it has to end by returning the
     drawings. A file that has stopped doing that would make ART undefined and
     every frame blank, which is worth refusing here rather than discovering in
     a render. */
  if (!/\n\s*return \{[\s\S]*place: place[\s\S]*\};\s*$/.test(page))
    throw new Error("the Mathematics film art: ehel-film-art-math.page.js no longer ends by returning its drawings");
  return [
    "  /* ==== the Mathematics films' drawings ======================================",
    "     tools/lib/ehel-film-art-math.page.js, put here by",
    "     tools/lib/ehel-film-art-math.js when the film is built. Nothing in it is",
    "     sliced from a lesson: Mathematics has no lesson kit to slice. */",
    "  var ART = (function () {",
    '    "use strict";',
    "",
    page,
    "  })();",
    ""
  ].join("\n");
}

/* The drawings carry their own colours and sizes as attributes, so they need
   no stylesheet. This one rule is the exception: the lessons set numbers in
   tabular figures so that a digit changing does not shift the ones beside it,
   and a film redraws the same number every frame. The drawings ask for it
   inline as well; this keeps it true if a film's own CSS resets style. */
function css() {
  return "svg text { font-variant-numeric: tabular-nums; }";
}

module.exports = { script, css };
