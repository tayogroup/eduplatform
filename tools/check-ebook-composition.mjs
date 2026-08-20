#!/usr/bin/env node

// Composition lint for the picture-book pages: does every character actually
// fit inside the 1600x1000 frame?
//
// Written because the first Grade 2 render put Zuri's feet below the bottom
// edge on eleven pages and it read as "she is standing quite low", not as a
// defect — the page still looked like a page. The character kit scales by
// ANIMAL_SCALE on top of the caller's `s`, so a scale that is fine at one y is
// off-canvas at another, and the arithmetic is not something you can eyeball
// from a page composition full of template literals.
//
// It measures the RENDERED geometry, not the source: each page is parsed and
// every character group's own bounds are computed from the local extents below,
// through its transform. So a character moved by editing the page file is
// re-measured automatically.
//
// Usage: node tools/check-ebook-composition.mjs [book-dir ...]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ebooksRoot = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks");
const W = 1600;
const H = 1000;

// Local extents of each character, in its own coordinates before scaling, taken
// from the drawing code: [left, top, right, bottom]. `top` is negative because
// every character is drawn upward from its standing point.
const EXTENTS = {
  zuri: [-52, -74, 46, 64],
  kiki: [-46, -58, 44, 66],
  monkey: [-56, -70, 56, 75],
  zebra: [-115, -125, 195, 110],
  giraffe: [-100, -190, 200, 125],
  elephant: [-90, -100, 120, 98],
  ostrich: [-90, -150, 100, 129],
  donkey: [-100, -125, 175, 100],
  hen: [-70, -60, 50, 73],
  goat: [-70, -80, 120, 91],
  chick: [-32, -30, 32, 35],
  lulu: [-50, -40, 46, 26],
  bird: [-40, -26, 36, 22],
};

// The Grade 3 cast are people, and people are built from ONE parametric figure,
// so they all share a box. The adult/child difference is a scale factor inside
// the transform, which the walk below already composes — it is not a different
// shape. Top extent is the afro puffs (or a raised hand), bottom is the ground
// shadow.
const PERSON = [-52, -197, 52, 14];
// The baby is not a short adult. babyIdris() draws its own shape and carries
// data-figure="baby" so it is measured against that shape rather than against
// a standing child's, which would report it as taller than it is.
EXTENTS.baby = [-70, -162, 70, 8];
for (const who of ["amal", "nora", "mina", "adam", "idris", "noah", "yasmin", "mum", "dad", "hana", "omar", "maya", "sami", "salma", "samira", "hodan", "leo", "faduma", "grandpa", "daniel", "theo", "nadia", "sarah", "rami"]) {
  EXTENTS[who] = PERSON;
}

// A character is allowed to run off the SIDES — a half-visible friend at the
// edge of the frame is a normal picture-book composition, and the Grade 1 books
// do it. Running off the BOTTOM is never intentional: it cuts the feet off a
// character who is supposed to be standing on the ground.
const BOTTOM_LIMIT = H - 4;
const TOP_LIMIT = 4;

const problems = [];
let measured = 0;

// Walks the group tree, composing transforms, and reports each character with
// its ABSOLUTE placement.
//
// The first version matched `<g transform=...>` and then looked ahead a few
// hundred characters for a data-tap to name it. That is wrong wherever a
// character is drawn small inside another prop — a page that puts a picture of
// Zuri on an easel has the easel's own transform in between, and the lookahead
// happily read a later, unrelated character's tap as the easel content's
// identity. It reported four figures "above the top of the frame" that were
// nothing of the kind. Composing the stack is the only way to know where a node
// actually sits.
function characterCalls(markup, where) {
  const results = [];
  const stack = [{ x: 0, y: 0, sx: 1, sy: 1 }];
  const tagRe = /<(\/?)g\b([^>]*)>/g;
  let match;
  while ((match = tagRe.exec(markup))) {
    const [whole, closing, attrs] = match;
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const parent = stack[stack.length - 1];
    let node = parent;
    const transform = attrs.match(/transform="([^"]*)"/);
    if (transform) {
      const spec = transform[1];
      const translate = spec.match(/translate\((-?[\d.]+)[ ,]+(-?[\d.]+)\)/);
      const scale = spec.match(/scale\((-?[\d.]+)(?:[ ,]+(-?[\d.]+))?\)/);
      const tx = translate ? Number(translate[1]) : 0;
      const ty = translate ? Number(translate[2]) : 0;
      const sx = scale ? Number(scale[1]) : 1;
      const sy = scale ? Number(scale[2] ?? scale[1]) : 1;
      node = { x: parent.x + tx * parent.sx, y: parent.y + ty * parent.sy, sx: parent.sx * sx, sy: parent.sy * sy };
    }
    // Self-closing <g/> never happens in this kit, but guard anyway so the
    // stack cannot drift and silently shift every later measurement.
    if (!whole.endsWith("/>")) stack.push(node);
    // `data-figure` first: the Grade 3 people carry it INSTEAD of a data-tap,
    // because a tap value promises a sound clip and there are no human voice
    // clips on the shelf. Measuring a character must not depend on whether
    // somebody has paid for its audio yet.
    const id = attrs.match(/data-figure="([^"]+)"/) || attrs.match(/data-tap="([^"]+)"/);
    if (!id || !EXTENTS[id[1]]) continue;
    results.push({ name: id[1], x: node.x, y: node.y, sx: Math.abs(node.sx), sy: Math.abs(node.sy), where });
  }
  return results;
}

const books = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(ebooksRoot).filter((name) => fs.statSync(path.join(ebooksRoot, name)).isDirectory() && name !== "tap-sounds");

for (const book of books) {
  const dir = path.join(ebooksRoot, book);
  for (const file of fs.readdirSync(dir).filter((name) => /^page-\d+\.svg$/.test(name)).sort()) {
    const markup = fs.readFileSync(path.join(dir, file), "utf8");
    for (const call of characterCalls(markup, `${book}/${file}`)) {
      const [, top, , bottom] = EXTENTS[call.name];
      const bottomEdge = call.y + bottom * call.sy;
      const topEdge = call.y + top * call.sy;
      measured += 1;
      if (bottomEdge > BOTTOM_LIMIT) {
        problems.push(`${book}/${file}: ${call.name} at y=${call.y} scale=${call.sy} reaches y=${Math.round(bottomEdge)} — ${Math.round(bottomEdge - BOTTOM_LIMIT)}px below the frame, so its feet are cut off.`);
      }
      if (topEdge < TOP_LIMIT) {
        problems.push(`${book}/${file}: ${call.name} at y=${call.y} scale=${call.sy} reaches y=${Math.round(topEdge)} — above the top of the frame.`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Composition: ${problems.length} character${problems.length === 1 ? "" : "s"} outside the frame.\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}
console.log(JSON.stringify({ status: "PASS", books: books.length, charactersMeasured: measured, frame: `${W}x${H}` }, null, 2));
