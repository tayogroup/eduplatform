#!/usr/bin/env node

// Generates the 12 vector illustrations for "Musa Helps a Friend",
// the sequel to "Musa's Muddy Stripes". Flat picture-book style with the
// same cast and visual continuity rules documented in the book's PROMPTS.md.
// Output: src/prototypes/ehel-academy/english/ebooks/musa-helps-a-friend/page-NN.svg

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks", "musa-helps-a-friend");

const W = 1600;
const H = 1000;

// ---------------------------------------------------------------- palette

const C = {
  skyTop: "#bfe0f4", skyBottom: "#eef8fd",
  rainTop: "#9fb4c6", rainBottom: "#d7e2ea",
  sun: "#f9d976", sunGlow: "#fdeebc",
  hills: "#a9c4dd",
  grassFar: "#e7cd7f", grassNear: "#d9b45f", grassDark: "#c39c48",
  acaciaTrunk: "#8a6242", acaciaLeaf: "#7fa05a", acaciaLeafDark: "#6c8b4a",
  mud: "#8b6b4a", mudDark: "#6f5238", mudLight: "#a5825e",
  water: "#9cc8e0", waterLight: "#c4e1f0",
  ink: "#2b2b33",
  zebraBody: "#ffffff", zebraMuzzle: "#5a4f49", eyeBrown: "#6b4a2f",
  giraffe: "#e8b45f", giraffePatch: "#b9803e",
  elephant: "#aab4be", elephantDark: "#8e99a5", elephantInnerEar: "#cfb6b6",
  ostrichBody: "#33333d", ostrichNeck: "#e9ddc8", ostrichBeak: "#d9a05b",
  monkey: "#8f9a86", monkeyFace: "#e8dcc8",
  rainbow: ["#e76f51", "#f4c95d", "#8ab17d", "#7fa8d9", "#9d82c4"],
};

// ---------------------------------------------------------------- helpers

function face(mood, s = 1) {
  // eye + mouth for a character group already positioned at head origin
  const eye = `<circle cx="0" cy="0" r="${9 * s}" fill="${C.eyeBrown}"/><circle cx="${2.5 * s}" cy="${-3 * s}" r="${3 * s}" fill="#fff"/>`;
  if (mood === "sad") return `${eye}<path d="M ${-14 * s} ${-14 * s} q ${10 * s} ${-6 * s} ${20 * s} ${-2 * s}" stroke="${C.ink}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
  if (mood === "surprised") return `${eye}`;
  return eye; // happy default; mouths are drawn on the muzzle by each character
}

function mouth(mood, s = 1) {
  if (mood === "sad") return `<path d="M ${-10 * s} ${6 * s} q ${10 * s} ${-8 * s} ${20 * s} 0" stroke="${C.ink}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
  if (mood === "surprised") return `<ellipse cx="0" cy="${6 * s}" rx="${6 * s}" ry="${8 * s}" fill="${C.ink}"/>`;
  return `<path d="M ${-10 * s} ${2 * s} q ${10 * s} ${10 * s} ${20 * s} 0" stroke="${C.ink}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
}

function mudSpots(list, color = C.mud) {
  return list.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${color}" opacity="0.85"/>`).join("");
}

// ---------------------------------------------------------------- characters
// All characters face right at scale 1; wrap with translate/scale(-1,1) to flip.

function zebra({ x, y, s = 1, flip = false, mood = "happy", pose = "stand", muddy = false, pull = false }) {
  const legBack = pose === "run" ? -22 : pull ? -30 : 0;
  const legFront = pose === "run" ? 24 : pull ? 26 : 0;
  const lean = pull ? -12 : 0;
  const stripes = `
    <path d="M -55 -48 q 6 30 -2 52" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M -28 -55 q 5 34 -2 62" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M -2 -57 q 4 32 -1 64" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M 24 -54 q 4 28 0 56" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M 62 -30 q 14 2 24 -6" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M 70 -52 q 12 4 22 -2" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const heart = `<path d="M 46 -18 c -5 -8 -16 -5 -16 3 c 0 7 9 12 16 17 c 7 -5 16 -10 16 -17 c 0 -8 -11 -11 -16 -3 z" fill="${C.ink}"/>`;
  const leg = (lx, rot, back) => `<g transform="translate(${lx} 34) rotate(${rot})"><rect x="-9" y="0" width="18" height="66" rx="9" fill="${back ? "#f1ede9" : C.zebraBody}" stroke="${C.ink}" stroke-width="4"/><path d="M -9 18 h 18 M -9 36 h 18" stroke="${C.ink}" stroke-width="6"/><rect x="-10" y="58" width="20" height="12" rx="5" fill="${C.ink}"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${lean})">
    <ellipse cx="0" cy="96" rx="88" ry="14" fill="${C.ink}" opacity="0.10"/>
    ${leg(-58, legBack, true)}${leg(30, -legFront * 0.4, true)}
    <path d="M -86 6 q -20 -4 -26 12 q 12 8 26 2" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -108 16 l -6 16 q 10 4 14 -4 z" fill="${C.ink}"/>
    <ellipse cx="0" cy="-6" rx="95" ry="58" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="5"/>
    ${stripes}${muddy ? mudSpots([[-40, 6, 20], [8, 22, 16], [-4, -30, 13], [40, 6, 12]]) : ""}${heart}
    ${leg(-38, legFront, false)}${leg(58, legBack ? -legBack : 0, false)}
    <path d="M 62 -34 q 26 -34 52 -44 l 26 8 q -8 34 -34 48 z" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 84 -66 q 4 14 -6 24 M 104 -72 q 2 12 -6 22" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g transform="translate(150 -84)">
      <ellipse cx="0" cy="0" rx="44" ry="34" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M 24 4 q 24 2 26 16 q -2 14 -24 12 q -16 -2 -20 -14 z" fill="${C.zebraMuzzle}" stroke="${C.ink}" stroke-width="4"/>
      <circle cx="38" cy="14" r="3.4" fill="${C.ink}"/>
      <g transform="translate(34 22)">${mouth(mood, 0.9)}</g>
      <path d="M -20 -28 l -12 -26 l 22 12 z" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -24 -46 l 8 18" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -34 -12 q -6 12 -2 22 M -14 -22 q -4 10 -2 18" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <g transform="translate(6 -4)">${face(mood, 1.1)}</g>
      <path d="M -42 -22 q -14 -18 -2 -30 q 12 -8 18 6 M -22 -34 q -8 -18 6 -24 q 12 -4 12 10 M -2 -40 q -2 -18 12 -18 q 12 2 6 16" fill="${C.ink}"/>
    </g>
  </g>`;
}

function giraffe({ x, y, s = 1, flip = false, mood = "happy", bend = false }) {
  const neck = bend
    ? `<path d="M 40 -30 q 60 -10 96 44 l 26 -6 q -22 -74 -104 -74 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>`
    : `<path d="M 40 -30 q 24 -90 56 -128 l 30 10 q -14 84 -52 130 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>`;
  const headPos = bend ? "translate(158 16) rotate(24)" : "translate(120 -156) rotate(-12)";
  const patches = [[-46, -18, 15], [-8, -34, 13], [-16, 14, 14], [26, -6, 12], [18, 30, 10], [52, -26, 9]]
    .map(([px, py, r]) => `<circle cx="${px}" cy="${py}" r="${r}" fill="${C.giraffePatch}"/>`).join("");
  const leg = (lx, back) => `<g transform="translate(${lx} 30)"><rect x="-8" y="0" width="16" height="86" rx="8" fill="${back ? "#d8a552" : C.giraffe}" stroke="${C.ink}" stroke-width="4"/><rect x="-9" y="76" width="18" height="12" rx="5" fill="${C.ink}"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="112" rx="82" ry="13" fill="${C.ink}" opacity="0.10"/>
    ${leg(-52, true)}${leg(28, true)}
    <ellipse cx="-4" cy="-4" rx="82" ry="52" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>
    ${patches}
    ${leg(-30, false)}${leg(52, false)}
    <path d="M -80 -10 q -18 6 -16 24 l 10 4 q 8 -12 14 -18 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -92 16 l -4 14 q 10 2 12 -8 z" fill="${C.ink}"/>
    ${neck}
    <g transform="${headPos}">
      <ellipse cx="0" cy="0" rx="36" ry="27" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M 20 2 q 20 0 22 13 q -2 12 -20 10 q -13 -2 -16 -11 z" fill="#d8a552" stroke="${C.ink}" stroke-width="4"/>
      <circle cx="32" cy="10" r="3" fill="${C.ink}"/>
      <g transform="translate(28 18)">${mouth(mood, 0.75)}</g>
      <path d="M -12 -22 l -4 -20 q 8 -4 10 4 z M 8 -24 l 2 -20 q 8 0 8 8 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="-14" cy="-44" r="6" fill="${C.giraffePatch}" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="16" cy="-46" r="6" fill="${C.giraffePatch}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M -28 -14 l -14 -8 q -2 10 8 14 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="3.4"/>
      <g transform="translate(4 -4)">${face(mood, 0.9)}</g>
    </g>
  </g>`;
}

function elephant({ x, y, s = 1, flip = false, mood = "happy", stuck = false, trunkUp = false, muddy = false }) {
  const legs = stuck ? "" : `
    <g transform="translate(-42 28)"><rect x="-13" y="0" width="26" height="56" rx="12" fill="${C.elephantDark}" stroke="${C.ink}" stroke-width="4"/></g>
    <g transform="translate(34 28)"><rect x="-13" y="0" width="26" height="56" rx="12" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4"/></g>`;
  const trunk = trunkUp
    ? `<path d="M 74 -26 q 40 -12 44 -52 q 0 -12 -12 -10 q -6 30 -40 40 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4.5"/>`
    : `<path d="M 74 -26 q 34 12 30 56 q -2 12 -14 8 q 0 -34 -24 -44 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4.5"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    ${stuck ? "" : `<ellipse cx="0" cy="86" rx="78" ry="12" fill="${C.ink}" opacity="0.10"/>`}
    ${legs}
    <ellipse cx="-6" cy="-2" rx="80" ry="56" fill="${C.elephant}" stroke="${C.ink}" stroke-width="5"/>
    ${muddy ? mudSpots([[-30, 10, 18], [16, -18, 13], [8, 26, 12]]) : ""}
    <path d="M -80 0 q -14 4 -12 18 l 8 2 q 6 -10 12 -12 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4"/>
    <g transform="translate(44 -40)">
      <path d="M -26 -6 q -34 -22 -30 6 q 4 26 28 22 z" fill="${C.elephantDark}" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -40 -2 q -14 -10 -12 4 q 2 12 14 10 z" fill="${C.elephantInnerEar}"/>
      <ellipse cx="8" cy="0" rx="42" ry="34" fill="${C.elephant}" stroke="${C.ink}" stroke-width="5"/>
      <g transform="translate(6 -6)">${face(mood, 1)}</g>
      <g transform="translate(16 16)">${mouth(mood, 0.8)}</g>
    </g>
    ${trunk}
  </g>`;
}

function ostrich({ x, y, s = 1, flip = false, mood = "happy", pose = "stand" }) {
  const legRot = pose === "run" ? 20 : 0;
  const leg = (lx, rot) => `<g transform="translate(${lx} 26) rotate(${rot})"><rect x="-5" y="0" width="10" height="88" rx="5" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="3.4"/><path d="M -8 84 l 10 12 l 8 -12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="118" rx="58" ry="11" fill="${C.ink}" opacity="0.10"/>
    ${leg(-20, legRot)}${leg(18, -legRot)}
    <ellipse cx="-6" cy="0" rx="62" ry="46" fill="${C.ostrichBody}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -58 -18 q -22 -4 -30 12 q 14 12 32 4 z M -52 6 q -22 0 -28 16 q 16 10 32 0 z" fill="#f4efe4" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 34 -22 q 10 -66 22 -92 l 22 4 q -4 34 -18 94 z" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="4.5"/>
    <g transform="translate(72 -122)">
      <ellipse cx="0" cy="0" rx="26" ry="22" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M 20 0 l 26 6 l -24 10 z" fill="${C.ostrichBeak}" stroke="${C.ink}" stroke-width="3.4"/>
      <g transform="translate(0 -4)">${face(mood, 0.85)}</g>
      <path d="M -14 -18 q 2 -10 10 -10 M 0 -20 q 4 -8 10 -6" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    </g>
  </g>`;
}

function monkey({ x, y, s = 1, flip = false, mood = "happy", arms = "down" }) {
  const arm = (ax, rot) => `<g transform="translate(${ax} -14) rotate(${rot})"><rect x="-6" y="0" width="12" height="52" rx="6" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/><circle cx="0" cy="54" r="8" fill="${C.monkeyFace}" stroke="${C.ink}" stroke-width="3"/></g>`;
  const up = arms === "up";
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="66" rx="42" ry="9" fill="${C.ink}" opacity="0.10"/>
    <path d="M -30 30 q -44 4 -48 -34 q 0 -14 12 -10 q 2 26 34 30 z" fill="${C.monkey}" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="0" cy="16" rx="38" ry="42" fill="${C.monkey}" stroke="${C.ink}" stroke-width="4.5"/>
    <ellipse cx="4" cy="26" rx="20" ry="24" fill="${C.monkeyFace}"/>
    ${arm(-24, up ? 150 : 24)}${arm(24, up ? -150 : -24)}
    <g transform="translate(-14 52)"><rect x="-6" y="0" width="12" height="24" rx="6" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/></g>
    <g transform="translate(16 52)"><rect x="-6" y="0" width="12" height="24" rx="6" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/></g>
    <g transform="translate(0 -30)">
      <circle cx="0" cy="0" r="26" fill="${C.monkey}" stroke="${C.ink}" stroke-width="4.5"/>
      <ellipse cx="2" cy="6" rx="17" ry="15" fill="${C.monkeyFace}"/>
      <circle cx="-24" cy="-4" r="9" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="24" cy="-4" r="9" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/>
      <g transform="translate(2 0)">${face(mood, 0.75)}</g>
      <g transform="translate(2 8)">${mouth(mood, 0.6)}</g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- scenery

function sky(rainy = false) {
  const top = rainy ? C.rainTop : C.skyTop;
  const bottom = rainy ? C.rainBottom : C.skyBottom;
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
}

function sun(x = 1350, y = 160) {
  return `<circle cx="${x}" cy="${y}" r="120" fill="${C.sunGlow}" opacity="0.6"/><circle cx="${x}" cy="${y}" r="78" fill="${C.sun}"/>`;
}

function hills() {
  return `<path d="M 0 560 q 260 -110 520 -30 q 300 90 620 -20 q 240 -76 460 10 L 1600 640 L 0 640 Z" fill="${C.hills}" opacity="0.55"/>`;
}

function ground() {
  return `<rect x="0" y="590" width="${W}" height="${H - 590}" fill="${C.grassFar}"/>
    <path d="M 0 720 q 400 -50 800 0 q 400 50 800 0 L 1600 1000 L 0 1000 Z" fill="${C.grassNear}"/>
    ${[120, 380, 660, 940, 1240, 1480].map((gx) => `<path d="M ${gx} ${780 + (gx % 3) * 40} q 6 -34 14 -40 q 2 24 10 38 q 10 -18 18 -22 q -2 22 -8 34 z" fill="${C.grassDark}" opacity="0.8"/>`).join("")}`;
}

function acacia(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -8 0 q -4 -70 -30 -110 M 6 0 q 8 -76 40 -116 M 0 -60 q -20 -30 -52 -44 M 2 -66 q 26 -26 58 -36" stroke="${C.acaciaTrunk}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <ellipse cx="-46" cy="-124" rx="86" ry="30" fill="${C.acaciaLeafDark}"/>
    <ellipse cx="30" cy="-142" rx="110" ry="34" fill="${C.acaciaLeaf}"/>
  </g>`;
}

function puddle(x, y, rx, ry, muddyLevel = 1) {
  const fill = muddyLevel > 0 ? C.mud : C.water;
  const inner = muddyLevel > 0 ? C.mudLight : C.waterLight;
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.mudDark}"/>
    <ellipse cx="${x}" cy="${y - 6}" rx="${rx - 14}" ry="${ry - 10}" fill="${fill}"/>
    <ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.34}" rx="${rx * 0.36}" ry="${ry * 0.26}" fill="${inner}" opacity="0.8"/>`;
}

function rain() {
  let drops = "";
  for (let i = 0; i < 60; i += 1) {
    const rx = (i * 137) % W;
    const ry = 40 + ((i * 211) % 520);
    drops += `<line x1="${rx}" y1="${ry}" x2="${rx - 10}" y2="${ry + 34}" stroke="#7d97ad" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`;
  }
  return drops;
}

function splashArcs(x, y, color = C.mud) {
  return `<g stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round">
      <path d="M ${x - 120} ${y - 20} q -40 -70 -100 -90"/><path d="M ${x + 120} ${y - 20} q 40 -70 100 -90"/>
      <path d="M ${x - 60} ${y - 50} q -16 -80 -50 -120"/><path d="M ${x + 60} ${y - 50} q 16 -80 50 -120"/>
      <path d="M ${x} ${y - 60} q 0 -80 -10 -130"/>
    </g>
    ${mudSpots([[x - 210, y - 150, 14], [x + 220, y - 160, 16], [x - 120, y - 220, 11], [x + 100, y - 230, 12], [x - 20, y - 250, 10]], color)}`;
}

function rainbow(x, y) {
  return C.rainbow.map((color, index) => `<path d="M ${x - 330 + index * 22} ${y} a ${330 - index * 22} ${330 - index * 22} 0 0 1 ${(330 - index * 22) * 2} 0" fill="none" stroke="${color}" stroke-width="20" opacity="0.75"/>`).join("");
}

function vine(points, width = 12) {
  return `<path d="${points}" fill="none" stroke="#5c7d43" stroke-width="${width}" stroke-linecap="round"/>
    <path d="${points}" fill="none" stroke="#79a15a" stroke-width="${width * 0.45}" stroke-linecap="round"/>`;
}

// ---------------------------------------------------------------- pages

const basicScene = (rainy = false) => `${sky(rainy)}${rainy ? "" : sun()}${hills()}${ground()}`;

const pages = [
  // 1 cover: all five friends around the puddle
  `${basicScene()}${acacia(210, 640, 1.1)}${acacia(1430, 620, 0.9)}
   ${puddle(800, 870, 300, 66)}
   ${giraffe({ x: 400, y: 640, s: 1.05, flip: false })}
   ${elephant({ x: 1210, y: 700, s: 1, flip: true, trunkUp: true })}
   ${ostrich({ x: 1050, y: 650, s: 0.92, flip: true })}
   ${monkey({ x: 560, y: 740, s: 0.95, arms: "up" })}
   ${zebra({ x: 800, y: 680, s: 1.1 })}`,

  // 2 rainy night over the savanna
  `${basicScene(true)}
   <circle cx="1330" cy="150" r="62" fill="#f4f0e2" opacity="0.85"/><circle cx="1306" cy="138" r="52" fill="${C.rainTop}"/>
   ${acacia(280, 650, 1.15)}${acacia(1330, 630, 0.95)}
   ${puddle(520, 850, 200, 48)}${puddle(1080, 900, 240, 54)}${puddle(820, 760, 120, 30)}
   ${rain()}`,

  // 3 Musa splashes out to play
  `${basicScene()}${acacia(1380, 640, 1.05)}
   ${puddle(560, 900, 210, 50)}
   ${zebra({ x: 620, y: 700, s: 1.15, pose: "run" })}
   <g stroke="${C.water}" stroke-width="8" fill="none" stroke-linecap="round"><path d="M 430 860 q -30 -40 -70 -50"/><path d="M 700 870 q 30 -44 66 -56"/></g>`,

  // 4 Musa hears a sad sound
  `${basicScene()}${acacia(260, 640, 1.1)}
   ${zebra({ x: 560, y: 690, s: 1.15, mood: "surprised" })}
   <g stroke="#7d97ad" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.85">
     <path d="M 1160 420 q 30 -30 0 -60"/><path d="M 1210 440 q 46 -46 0 -92"/><path d="M 1260 460 q 62 -62 0 -124"/>
   </g>
   <path d="M 1000 620 q 60 -20 120 0 q -20 60 -60 60 q -40 0 -60 -60 z" fill="${C.grassDark}" opacity="0.6"/>`,

  // 5 the little elephant is stuck in the deep mud
  `${basicScene()}${acacia(220, 630, 1.05)}
   ${puddle(980, 850, 340, 80)}
   ${elephant({ x: 980, y: 760, s: 1.05, stuck: true, mood: "sad" })}
   ${mudSpots([[760, 800, 24], [1220, 810, 20], [980, 900, 26]])}`,

  // 6 Musa comforts her
  `${basicScene()}${acacia(1400, 640, 1)}
   ${puddle(1000, 860, 320, 74)}
   ${elephant({ x: 1030, y: 780, s: 1, stuck: true, mood: "sad" })}
   ${zebra({ x: 520, y: 700, s: 1.1 })}
   <g fill="#e76f51" opacity="0.9"><path d="M 700 400 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  // 7 Musa calls the friends
  `${basicScene()}${acacia(200, 640, 1.05)}
   ${zebra({ x: 430, y: 690, s: 1.02, mood: "surprised" })}
   ${giraffe({ x: 900, y: 620, s: 0.98, flip: true })}
   ${ostrich({ x: 1180, y: 660, s: 0.9, flip: true, pose: "run" })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}`,

  // 8 monkey brings a vine; elephant holds it
  `${basicScene()}${acacia(1410, 630, 1)}
   ${puddle(1060, 860, 300, 70)}
   ${elephant({ x: 1090, y: 780, s: 1, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 420 700 q 200 -90 420 -40 q 140 30 220 -10")}
   ${monkey({ x: 400, y: 700, s: 0.95, arms: "up" })}`,

  // 9 everyone pulls
  `${basicScene()}${acacia(180, 630, 1)}
   ${puddle(1180, 870, 280, 66)}
   ${elephant({ x: 1200, y: 790, s: 0.98, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 340 680 q 240 -60 520 -20 q 160 20 260 -30")}
   ${zebra({ x: 760, y: 700, s: 1, pull: true, flip: true })}
   ${giraffe({ x: 480, y: 630, s: 0.95, flip: true })}
   ${ostrich({ x: 300, y: 680, s: 0.85, flip: true, pose: "run" })}
   ${monkey({ x: 940, y: 760, s: 0.85, arms: "up", mood: "surprised" })}`,

  // 10 POP! out she comes, mud everywhere
  `${basicScene()}${acacia(1420, 640, 0.95)}
   ${puddle(1080, 890, 300, 66)}
   ${splashArcs(1080, 890)}
   ${elephant({ x: 830, y: 640, s: 1.02, flip: true, mood: "surprised", trunkUp: true, muddy: true })}
   ${zebra({ x: 460, y: 700, s: 1, mood: "surprised", muddy: true })}
   ${monkey({ x: 1330, y: 780, s: 0.88, arms: "up", mood: "surprised" })}`,

  // 11 everyone muddy and laughing
  `${basicScene()}${acacia(230, 640, 1)}
   ${puddle(820, 900, 240, 54)}
   ${zebra({ x: 620, y: 690, s: 1.05, muddy: true })}
   ${elephant({ x: 1120, y: 700, s: 0.95, flip: true, muddy: true, trunkUp: true })}
   ${giraffe({ x: 320, y: 620, s: 0.92 })}
   ${ostrich({ x: 900, y: 640, s: 0.85, flip: true })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}
   ${mudSpots([[350, 560, 12], [980, 520, 12], [1240, 600, 10]])}`,

  // 12 rainbow ending
  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${puddle(800, 890, 280, 62, 0)}
   ${zebra({ x: 660, y: 690, s: 1.05 })}
   ${elephant({ x: 1000, y: 700, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 380, y: 620, s: 0.92 })}
   ${ostrich({ x: 1240, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 820, y: 770, s: 0.85, arms: "up" })}
   <g stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 600 840 q -24 -36 -58 -44"/><path d="M 1010 850 q 26 -38 60 -46"/></g>`,
];

// ---------------------------------------------------------------- write files

fs.mkdirSync(outDir, { recursive: true });

pages.forEach((body, index) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">\n${body}\n</svg>\n`;
  const file = path.join(outDir, `page-${String(index + 1).padStart(2, "0")}.svg`);
  fs.writeFileSync(file, svg, "utf8");
  console.log(`Wrote ${path.relative(root, file)}`);
});

console.log(`Done: ${pages.length} illustrations in ${path.relative(root, outDir)}`);
