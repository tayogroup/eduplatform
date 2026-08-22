// The cursive stroke alphabet — the pen's PATH through each letter, not the
// letter's outline.
//
// This exists because a font cannot drive a handwriting animation. A glyph in
// Edu NSW ACT Cursive (the face the printed worksheet uses) is a filled contour,
// so stroking it and animating stroke-dashoffset traces the letter's EDGE: up one
// side, back down the other, with the dot of an i as a separate closed ring. It
// renders as a hollow double-walled letter and looks nothing like writing. There
// is no centreline in a font to recover, so the centrelines are authored here.
//
// FRAME. One letter is authored in the same proportions the worksheet prints, so
// the animation and the paper agree:
//
//     y=0    ascender line
//     y=87   midline (top of the x-height)
//     y=187  baseline          <- every letter enters and most exit here
//     y=274  descender line
//
// x-height is 100 units, and 87/187/274 are 1.01em/0.54em/0.47em from
// CURSIVE_ASCENDER/X_HEIGHT/DESCENDER in english.js scaled to it. Keep them in
// step: those three were measured off the shipped woff2 and are what put the
// printed model on its rules.
//
// JOINS. A letter's path starts at its entry point and ends at its exit point,
// and the composer draws a connector between one letter's exit and the next
// letter's entry — which is what makes the writing continuous. Most letters exit
// on the baseline. The four BRIDGE letters (b, o, v, w) exit at the midline, the
// way continuous cursive actually works, so `exitY` is per letter and the
// connector is generic rather than four special cases.
//
// Every path is one continuous pen stroke unless the letter genuinely needs the
// pen lifted — i and j (the dot), t and x (the cross). Those are `marks`, drawn
// after the body and numbered separately, because "lift the pen here" is the
// thing a learner most needs told.

export const CURSIVE_FRAME = { asc: 0, mid: 87, base: 187, desc: 274, xHeight: 100 };

// The slant of the printed face, applied to a whole word rather than baked into
// each letter — authoring upright keeps the paths readable and lets the slant be
// tuned in one place against the real font.
export const CURSIVE_SLANT = -6;

// w        advance width, entry of the next letter = this letter's entry + w
// exitY    where the pen leaves; the connector starts here
// d        the body stroke, starting at the entry point (0, 187)
// marks    strokes drawn after a pen lift, in order
// say      what the learner is told, imperative and in order of the strokes
const L = (w, exitY, d, say, marks = []) => ({ w, exitY, d, say, marks });

export const CURSIVE_LETTERS = {
  a: L(95, 187,
    "M0,187 C8,158 26,104 50,90 C28,86 14,112 14,140 C14,168 30,187 50,187 C64,187 72,172 72,145 L72,187 C79,187 88,176 95,162",
    "Up to the top, round the oval to the left, back to the line, straight down, then flick up."),
  b: L(92, 87,
    "M0,187 C6,150 14,60 22,4 C26,40 24,120 24,150 C30,130 44,120 56,124 C70,129 74,150 66,166 C58,182 38,190 24,178 C36,176 60,150 92,110",
    "Tall stroke up, back down, round the bump to the right, then join high."),
  c: L(88, 187,
    "M0,187 C8,158 26,104 52,90 C30,84 14,112 14,140 C14,168 30,187 50,187 C66,187 78,178 88,164",
    "Up to the top, round to the left, all the way down and stop with a flick."),
  d: L(95, 187,
    "M0,187 C8,158 26,104 50,90 C28,86 14,112 14,140 C14,168 30,187 50,187 C64,187 72,172 72,145 C72,110 74,50 78,4 C74,60 72,140 72,187 C79,187 88,176 95,162",
    "Round the oval first, then a tall stroke up, back down and flick up."),
  e: L(85, 187,
    "M0,187 C14,172 30,142 42,110 C26,104 14,122 14,148 C14,170 30,187 50,187 C64,187 76,178 85,164",
    "A small loop to the right, round to the left, down to the line and flick."),
  f: L(90, 187,
    "M0,187 C10,150 20,60 28,10 C32,40 26,120 22,180 C18,225 12,262 0,268 C-8,262 -4,232 22,206 C40,190 60,190 90,164",
    "Tall stroke up, straight down below the line, loop back to the left and out."),
  g: L(95, 187,
    "M0,187 C8,158 26,104 50,90 C28,86 14,112 14,140 C14,168 30,187 50,187 C64,187 72,172 72,145 C72,190 74,240 70,262 C62,278 40,278 30,264 C26,254 32,244 44,244",
    "Round the oval, straight down past the line, then a loop back to the left."),
  h: L(92, 187,
    "M0,187 C6,150 14,60 22,4 C26,40 24,120 24,150 C32,126 46,116 58,122 C70,128 72,148 72,170 L72,187 C79,187 86,178 92,166",
    "Tall stroke up, back down, over the bridge and down, then flick up."),
  i: L(70, 187,
    "M0,187 C10,160 24,110 34,90 C34,120 34,160 34,180 C40,187 52,182 70,164",
    "Up to the middle, straight down, then flick up.",
    [{ d: "M34,64 l0.01,0", say: "Lift the pen and dot it." }]),
  j: L(70, 187,
    "M0,187 C10,160 24,110 34,90 C34,130 34,200 32,240 C28,266 14,278 2,270 C-4,262 2,250 16,250",
    "Up to the middle, straight down past the line, then loop to the left.",
    [{ d: "M34,64 l0.01,0", say: "Lift the pen and dot it." }]),
  // One continuous stroke. The first draft hid two pen lifts inside this path —
  // the arm and the leg each started with their own M — so the animation would
  // have shown the pen jumping without saying so, which is the one thing a
  // handwriting demo must never do silently. A lift belongs in `marks`, where it
  // is numbered and narrated; k does not need one.
  k: L(92, 187,
    "M0,187 C6,150 14,60 22,4 C26,40 24,110 24,140 C42,128 58,116 70,104 C56,112 44,124 38,138 C48,152 60,170 72,182 C80,187 88,180 92,166",
    "Tall stroke up and back down, out to the top corner, back in, then down and flick."),
  l: L(78, 187,
    "M0,187 C6,150 16,60 26,4 C30,40 28,130 28,170 C30,182 40,187 52,187 C62,187 70,178 78,166",
    "One tall stroke up, straight back down, then flick up."),
  m: L(120, 187,
    "M0,187 C8,164 18,130 26,120 C26,140 26,170 26,187 C26,160 32,128 44,120 C54,126 54,158 54,187 C54,160 60,128 72,120 C84,126 84,160 84,187 C90,187 104,180 120,164",
    "Up and over, down, over again, down, and over once more, then flick up."),
  n: L(96, 187,
    "M0,187 C8,164 18,130 26,120 C26,140 26,170 26,187 C26,160 32,128 44,120 C56,126 58,158 58,187 C66,187 80,180 96,164",
    "Up and over, straight down, over again, down, then flick up."),
  o: L(88, 87,
    "M0,187 C8,158 26,104 52,90 C30,84 14,112 14,140 C14,168 30,187 50,187 C66,187 76,170 76,142 C76,120 70,102 54,92 C64,96 74,100 88,96",
    "Up to the top, round to the left and all the way back up, then join high."),
  p: L(92, 187,
    "M0,187 C8,164 18,130 26,120 C24,160 22,230 20,268 C22,230 24,190 26,160 C34,132 50,116 64,124 C76,131 78,152 68,168 C58,183 38,186 26,176 C40,180 66,176 92,164",
    "Up and straight down below the line, back up, round the bump, then out."),
  q: L(95, 187,
    "M0,187 C8,158 26,104 50,90 C28,86 14,112 14,140 C14,168 30,187 50,187 C64,187 72,172 72,145 C72,190 72,240 72,262 C78,272 88,268 95,258",
    "Round the oval, straight down past the line, then a small flick to the right."),
  r: L(84, 187,
    "M0,187 C8,164 20,132 28,122 C28,140 26,166 26,187 C26,156 34,130 46,122 C56,118 62,124 62,134 C68,128 74,126 84,128",
    "Up and over, a small shoulder, then across to join."),
  s: L(80, 187,
    "M0,187 C10,162 26,110 44,92 C26,96 20,120 30,136 C40,152 52,162 48,176 C44,186 30,190 18,182 C30,184 56,176 80,164",
    "Up to the top, back down in a curve, then a small tail to the right."),
  t: L(80, 187,
    "M0,187 C8,158 18,90 26,40 C28,80 26,150 26,172 C30,184 42,188 54,186 C64,184 72,176 80,164",
    "A tall stroke up, straight down, then flick up.",
    [{ d: "M6,74 L48,70", say: "Lift the pen and cross it." }]),
  u: L(96, 187,
    "M0,187 C8,160 20,128 28,120 C28,150 26,176 34,183 C44,189 54,172 58,150 C60,132 60,124 62,120 C62,150 62,176 62,187 C70,187 82,180 96,164",
    "Up, down and round the dip, up again, down, then flick up."),
  v: L(90, 87,
    "M0,187 C8,160 20,128 28,120 C30,148 36,172 46,182 C56,172 62,146 66,120 C68,140 68,160 74,168 C80,172 84,168 90,150",
    "Up, down to the point, up again, then a small hook to join high."),
  w: L(112, 87,
    "M0,187 C8,160 20,128 28,120 C30,148 36,172 46,182 C54,172 58,146 60,120 C62,148 68,172 78,182 C86,172 90,146 92,120 C94,142 96,160 102,168 C108,172 110,166 112,150",
    "Up, down, up, down, up — then a small hook to join high."),
  x: L(86, 187,
    "M0,187 C8,164 20,132 28,122 C34,140 44,166 56,182 C64,188 74,182 86,166",
    "Up and over, then down in a curve to the line.",
    [{ d: "M78,116 C64,134 46,160 34,180", say: "Lift the pen and cross it the other way." }]),
  y: L(96, 187,
    "M0,187 C8,160 20,128 28,120 C28,150 26,176 34,183 C44,189 54,172 58,150 C60,132 60,124 62,120 C62,160 60,220 56,252 C50,274 34,280 22,272 C16,266 20,256 32,254",
    "Up, down and round the dip, up, then straight down and loop to the left."),
  z: L(92, 187,
    "M0,187 C8,164 20,134 28,124 C28,140 26,152 26,158 C40,148 56,138 70,130 C60,150 48,172 40,186 C44,192 56,196 68,240 C64,262 48,272 34,266 C28,262 30,252 42,250",
    "Up and over, across to the right, back down to the line, then a loop below."),
};

// The apostrophe is not a letter and does not join. It hangs from the ascender
// line and the pen lifts on both sides, so it is its own entry rather than a
// `mark` on the letter before it — 13 of the Grade 1-2 glossary words need it
// ("didn't", "wasn't") and treating it as a mark would attach it to whatever
// letter happened to precede it.
export const CURSIVE_APOSTROPHE = { w: 30, exitY: 187, d: "", say: "Lift the pen and make a comma up high.", marks: [{ d: "M14,20 C16,32 14,42 8,50", say: "Add the apostrophe." }] };

export const cursiveGlyph = (ch) => (ch === "'" || ch === "’" ? CURSIVE_APOSTROPHE : CURSIVE_LETTERS[ch] || null);
export const cursiveCanWrite = (word) => [...word.toLowerCase()].every((ch) => cursiveGlyph(ch));

// ── composing a word ─────────────────────────────────────────────────────────
// Letters are placed left to right and a CONNECTOR is drawn from where the pen
// left the last letter to where it starts the next. The connector is a real
// stroke, not a cosmetic seam: it is what the pen actually does, it animates in
// sequence with everything else, and it is what makes b/o/v/w — which leave the
// pen up at the midline — join downward into the next letter instead of teleporting.
//
// JOIN_GAP gives the connector somewhere to go. Without it the next letter starts
// at exactly the x the last one ended at, so the connector is a vertical tick and
// the join reads as a stutter rather than a stroke.
const JOIN_GAP = 10;

// Where a stroke ends, measured from the path rather than declared beside it. An
// authored `exitY` drifts the moment a path is retouched — and it did: every
// letter declared 187 while its flick actually finished around 162.
function pathEnd(d) {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;
  return { x: Number(numbers[numbers.length - 2]), y: Number(numbers[numbers.length - 1]) };
}

const connector = (from, to) => {
  const dx = Math.max(6, to.x - from.x);
  return `M${from.x.toFixed(1)},${from.y.toFixed(1)} C${(from.x + dx * 0.45).toFixed(1)},${(from.y + (to.y - from.y) * 0.25).toFixed(1)} `
    + `${(to.x - dx * 0.35).toFixed(1)},${(to.y - 14).toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
};

// A letter that leaves the pen above this line has "exited high" — b, o, v and w.
const HIGH_EXIT = 150;

// Every letter is authored with a lead-in rising from the baseline, which is right
// when the pen is ON the baseline and wrong when it is not. After a bridge letter
// the pen is already up at the midline, so drawing the lead-in anyway sent it down
// to the baseline and straight back up: "wore" came out with a spurious loop
// between the w and the o. Joining from a high exit therefore drops the lead-in and
// starts the letter at the top of its first curve, which is what the hand does.
//
// The lead-in is always the first curve of the path, so this is a split rather
// than a second set of 26 authored variants.
function trimLeadIn(d) {
  const match = d.match(/^M\s*-?[\d.]+\s*,\s*-?[\d.]+\s*C\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s+(-?[\d.]+)\s*,\s*(-?[\d.]+)\s+(-?[\d.]+)\s*,\s*(-?[\d.]+)([\s\S]*)$/);
  if (!match) return null;
  return { d: `M${match[5]},${match[6]}${match[7]}`, start: { x: Number(match[5]), y: Number(match[6]) } };
}

// Returns the strokes in the order the pen makes them. `kind` drives how each is
// presented: a body stroke is the letter, a join is the travel between letters,
// and a mark is what the learner does AFTER lifting the pen.
export function cursiveWord(word) {
  const chars = [...String(word).toLowerCase()];
  if (!chars.length || chars.some((ch) => !cursiveGlyph(ch))) return null;
  const strokes = [];
  let x = 0;
  let pen = null;
  chars.forEach((ch, index) => {
    const glyph = cursiveGlyph(ch);
    let body = glyph.d;
    let start = { x, y: CURSIVE_FRAME.base };
    if (pen && glyph.d && pen.y < HIGH_EXIT) {
      const trimmed = trimLeadIn(glyph.d);
      if (trimmed) { body = trimmed.d; start = { x: x + trimmed.start.x, y: trimmed.start.y }; }
    }
    if (pen && body) strokes.push({ kind: "join", ch, index, dx: 0, d: connector(pen, start) });
    if (body) {
      strokes.push({ kind: "body", ch, index, dx: x, d: body, say: glyph.say });
      const end = pathEnd(body);
      pen = end ? { x: end.x + x, y: end.y } : start;
    }
    for (const mark of glyph.marks) strokes.push({ kind: "mark", ch, index, dx: x, d: mark.d, say: mark.say });
    x += glyph.w + JOIN_GAP;
  });
  return { word: String(word), strokes, width: x - JOIN_GAP, frame: CURSIVE_FRAME };
}
