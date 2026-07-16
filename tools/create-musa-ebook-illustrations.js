#!/usr/bin/env node

// Generates the vector illustrations for the Musa picture-book series:
//   - Musa's Muddy Stripes        (book 1)
//   - Musa Helps a Friend         (book 2, sequel)
// One shared character/scenery kit keeps the cast identical across books.
// Every page carries subtle ambient CSS animation (rain, ripples, tails,
// blinks, swaying grass); all motion is disabled automatically for
// prefers-reduced-motion users.
// Usage: node tools/create-musa-ebook-illustrations.js [muddy-stripes|helps-a-friend|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ebooksRoot = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks");

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
  leaf: "#79a15a", leafDark: "#5c7d43",
  rainbow: ["#e76f51", "#f4c95d", "#8ab17d", "#7fa8d9", "#9d82c4"],
};

// ---------------------------------------------------------------- animation

// All motion lives inside this stylesheet, embedded per SVG. Everything is
// wrapped in prefers-reduced-motion so sensitive readers get still pages.
const STYLE = `<style>
@media (prefers-reduced-motion: no-preference) {
  .anim-idle { animation: idle 3.8s ease-in-out infinite alternate; }
  @keyframes idle { from { transform: translateY(0); } to { transform: translateY(-6px); } }
  .anim-tail { transform-box: fill-box; transform-origin: 100% 20%; animation: tail 2.6s ease-in-out infinite alternate; }
  @keyframes tail { from { transform: rotate(-6deg); } to { transform: rotate(8deg); } }
  .anim-blink { transform-box: fill-box; transform-origin: center; animation: blink 5.2s infinite; }
  @keyframes blink { 0%, 93%, 100% { transform: scaleY(1); } 95%, 97% { transform: scaleY(0.12); } }
  .anim-glow { transform-box: fill-box; transform-origin: center; animation: glow 4.2s ease-in-out infinite alternate; }
  @keyframes glow { from { transform: scale(1); opacity: 0.5; } to { transform: scale(1.08); opacity: 0.75; } }
  .anim-shimmer { animation: shimmer 5s ease-in-out infinite alternate; }
  @keyframes shimmer { from { opacity: 0.62; } to { opacity: 0.92; } }
  .anim-grass { transform-box: fill-box; transform-origin: 50% 100%; animation: sway 3.2s ease-in-out infinite alternate; }
  .anim-canopy { transform-box: fill-box; transform-origin: 50% 100%; animation: sway 5.6s ease-in-out infinite alternate; }
  @keyframes sway { from { transform: rotate(-1.8deg); } to { transform: rotate(2.2deg); } }
  .anim-rain { animation: rainfall 1.15s linear infinite; }
  @keyframes rainfall { from { transform: translateY(-32px); opacity: 0.85; } 75% { opacity: 0.55; } to { transform: translateY(72px); opacity: 0; } }
  .anim-ripple { transform-box: fill-box; transform-origin: center; animation: ripple 3.4s ease-in-out infinite alternate; }
  @keyframes ripple { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.18); opacity: 0.55; } }
  .anim-drip { animation: drip 1s ease-in infinite; }
  @keyframes drip { from { transform: translateY(-12px); opacity: 0.95; } to { transform: translateY(28px); opacity: 0; } }
  .anim-flow { stroke-dasharray: 26 20; animation: flow 0.8s linear infinite; }
  @keyframes flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -46; } }
  .anim-splash { transform-box: fill-box; transform-origin: 50% 100%; animation: splashPulse 1.7s ease-in-out infinite alternate; }
  @keyframes splashPulse { from { transform: scale(0.97); } to { transform: scale(1.05); } }
  .anim-strain { transform-box: fill-box; transform-origin: center; animation: strain 0.9s ease-in-out infinite alternate; }
  @keyframes strain { from { transform: translateX(-5px); } to { transform: translateX(4px); } }
  .anim-float { transform-box: fill-box; transform-origin: center; animation: floaty 2.6s ease-in-out infinite alternate; }
  @keyframes floaty { from { transform: translateY(0) scale(1); } to { transform: translateY(-12px) scale(1.08); } }
  .anim-wave { animation: wave 2.4s ease-in-out infinite; opacity: 0; }
  @keyframes wave { 0% { opacity: 0; } 30% { opacity: 0.9; } 60%, 100% { opacity: 0; } }
  .anim-cloud { animation: cloudDrift 9s ease-in-out infinite alternate; }
  @keyframes cloudDrift { from { transform: translateX(-18px); } to { transform: translateX(22px); } }
  .tap-target { cursor: pointer; }
  .tap-target.tap-play { transform-box: fill-box; transform-origin: 50% 85%; animation: tapWiggle 0.7s ease-in-out; }
  .tap-target[data-tap="puddle"].tap-play { transform-origin: center; animation: tapSplash 0.85s ease-out; }
  .tap-target[data-tap="sun"].tap-play { transform-origin: center; animation: tapPulse 0.6s ease-in-out; }
  .tap-target[data-tap="tree"].tap-play { transform-origin: 50% 100%; animation: tapShake 0.7s ease-in-out; }
  @keyframes tapWiggle { 0% { transform: rotate(0); } 25% { transform: rotate(-4deg) scale(1.03); } 55% { transform: rotate(3deg) scale(1.04); } 80% { transform: rotate(-1.5deg); } 100% { transform: rotate(0); } }
  @keyframes tapSplash { 0% { transform: scale(1); } 40% { transform: scale(1.06, 0.94); } 70% { transform: scale(0.97, 1.03); } 100% { transform: scale(1); } }
  @keyframes tapPulse { 0% { transform: scale(1); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }
  @keyframes tapShake { 0% { transform: rotate(0); } 20% { transform: rotate(2.4deg); } 45% { transform: rotate(-2deg); } 70% { transform: rotate(1.2deg); } 100% { transform: rotate(0); } }
  .tap-burst { opacity: 0; }
  .tap-target.tap-play .tap-burst { opacity: 1; }
  .tap-target.tap-play .tap-burst circle { animation: burstUp 0.6s ease-out forwards; }
  @keyframes burstUp { from { transform: translateY(0); opacity: 0.95; } to { transform: translateY(-90px); opacity: 0; } }
}
</style>`;

// Deterministic per-instance delay so herds don't move in lockstep.
function delayAt(x, y, spread = 2.4) {
  const t = ((Math.abs(x * 7 + y * 13)) % 24) / 24;
  return `animation-delay:${(t * spread).toFixed(2)}s`;
}

// ---------------------------------------------------------------- shared bits

function face(mood, s = 1) {
  const eye = `<g class="anim-blink"><circle cx="0" cy="0" r="${9 * s}" fill="${C.eyeBrown}"/><circle cx="${2.5 * s}" cy="${-3 * s}" r="${3 * s}" fill="#fff"/></g>`;
  if (mood === "sad") return `${eye}<path d="M ${-14 * s} ${-14 * s} q ${10 * s} ${-6 * s} ${20 * s} ${-2 * s}" stroke="${C.ink}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
  return eye;
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
// All characters face right at scale 1; flip mirrors them. The ground shadow
// stays outside the idle-bob wrapper so it never floats.

function zebra({ x, y, s = 1, flip = false, mood = "happy", pose = "stand", muddy = false, heavyMud = false, pull = false, sunk = false }) {
  let legBack = 0;
  let legFront = 0;
  let lean = 0;
  if (pose === "run") { legBack = -22; legFront = 24; }
  if (pose === "leap") { legBack = 44; legFront = -48; lean = -16; }
  if (pull) { legBack = -30; legFront = 26; lean = -12; }
  const stripes = `
    <path d="M -55 -48 q 6 30 -2 52" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M -28 -55 q 5 34 -2 62" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M -2 -57 q 4 32 -1 64" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M 24 -54 q 4 28 0 56" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M 62 -30 q 14 2 24 -6" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M 70 -52 q 12 4 22 -2" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const heart = `<path d="M 46 -18 c -5 -8 -16 -5 -16 3 c 0 7 9 12 16 17 c 7 -5 16 -10 16 -17 c 0 -8 -11 -11 -16 -3 z" fill="${C.ink}"/>`;
  const mud = heavyMud
    ? mudSpots([[-52, -6, 26], [-12, 14, 24], [22, -18, 20], [48, 10, 16], [-30, -38, 15], [10, -44, 13]])
    : muddy ? mudSpots([[-40, 6, 20], [8, 22, 16], [-4, -30, 13], [40, 6, 12]]) : "";
  const leg = (lx, rot, back) => `<g transform="translate(${lx} 34) rotate(${rot})"><rect x="-9" y="0" width="18" height="66" rx="9" fill="${back ? "#f1ede9" : C.zebraBody}" stroke="${C.ink}" stroke-width="4"/><path d="M -9 18 h 18 M -9 36 h 18" stroke="${C.ink}" stroke-width="6"/><rect x="-10" y="58" width="20" height="12" rx="5" fill="${C.ink}"/></g>`;
  const legs = sunk ? "" : `${leg(-58, legBack, true)}${leg(30, -legFront * 0.4, true)}`;
  const legsFront = sunk ? "" : `${leg(-38, legFront, false)}${leg(58, pose === "leap" ? legBack * 0.7 : legBack ? -legBack : 0, false)}`;
  const shadow = sunk || pose === "leap" ? "" : `<ellipse cx="0" cy="96" rx="88" ry="14" fill="${C.ink}" opacity="0.10"/>`;
  const tail = `<g class="anim-tail" style="${delayAt(x, y)}">
    <path d="M -86 6 q -20 -4 -26 12 q 12 8 26 2" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -108 16 l -6 16 q 10 4 14 -4 z" fill="${C.ink}"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${lean})">
    ${shadow}
    <g class="tap-target" data-tap="zebra" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y)}">
    ${legs}${tail}
    <ellipse cx="0" cy="-6" rx="95" ry="58" fill="${C.zebraBody}" stroke="${C.ink}" stroke-width="5"/>
    ${stripes}${mud}${heart}
    ${legsFront}
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
    </g>
    </g>
  </g>`;
}

function giraffe({ x, y, s = 1, flip = false, mood = "happy", bend = false, pose = "stand", glasses = false }) {
  const neck = bend
    ? `<path d="M 40 -30 q 60 -10 96 44 l 26 -6 q -22 -74 -104 -74 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>`
    : `<path d="M 40 -30 q 24 -90 56 -128 l 30 10 q -14 84 -52 130 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>`;
  const headPos = bend ? "translate(158 16) rotate(24)" : "translate(120 -156) rotate(-12)";
  const patches = [[-46, -18, 15], [-8, -34, 13], [-16, 14, 14], [26, -6, 12], [18, 30, 10], [52, -26, 9]]
    .map(([px, py, r]) => `<circle cx="${px}" cy="${py}" r="${r}" fill="${C.giraffePatch}"/>`).join("");
  const rot = pose === "run" ? 14 : 0;
  const leg = (lx, back, r) => `<g transform="translate(${lx} 30) rotate(${r})"><rect x="-8" y="0" width="16" height="86" rx="8" fill="${back ? "#d8a552" : C.giraffe}" stroke="${C.ink}" stroke-width="4"/><rect x="-9" y="76" width="18" height="12" rx="5" fill="${C.ink}"/></g>`;
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 3)}">
    <path d="M -80 -10 q -18 6 -16 24 l 10 4 q 8 -12 14 -18 z" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -92 16 l -4 14 q 10 2 12 -8 z" fill="${C.ink}"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="112" rx="82" ry="13" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="giraffe" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 3)}">
    ${leg(-52, true, -rot)}${leg(28, true, rot)}
    <ellipse cx="-4" cy="-4" rx="82" ry="52" fill="${C.giraffe}" stroke="${C.ink}" stroke-width="5"/>
    ${patches}
    ${leg(-30, false, rot)}${leg(52, false, -rot)}
    ${tail}
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
      ${glasses ? `<g fill="none" stroke="${C.ink}" stroke-width="3.4"><circle cx="4" cy="-5" r="13"/><circle cx="26" cy="-1" r="11"/><path d="M 16 -7 q 3 2 4 5"/></g>` : ""}
    </g>
    </g>
    </g>
  </g>`;
}

function elephant({ x, y, s = 1, flip = false, mood = "happy", stuck = false, trunkUp = false, muddy = false, pose = "stand" }) {
  const rot = pose === "run" ? 12 : 0;
  const legs = stuck ? "" : `
    <g transform="translate(-42 28) rotate(${-rot})"><rect x="-13" y="0" width="26" height="56" rx="12" fill="${C.elephantDark}" stroke="${C.ink}" stroke-width="4"/></g>
    <g transform="translate(34 28) rotate(${rot})"><rect x="-13" y="0" width="26" height="56" rx="12" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4"/></g>`;
  const trunk = trunkUp
    ? `<path d="M 74 -26 q 40 -12 44 -52 q 0 -12 -12 -10 q -6 30 -40 40 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4.5"/>`
    : `<path d="M 74 -26 q 34 12 30 56 q -2 12 -14 8 q 0 -34 -24 -44 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4.5"/>`;
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 2)}">
    <path d="M -80 0 q -14 4 -12 18 l 8 2 q 6 -10 12 -12 z" fill="${C.elephant}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    ${stuck ? "" : `<ellipse cx="0" cy="86" rx="78" ry="12" fill="${C.ink}" opacity="0.10"/>`}
    <g class="tap-target" data-tap="elephant" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 2)}">
    ${legs}
    <ellipse cx="-6" cy="-2" rx="80" ry="56" fill="${C.elephant}" stroke="${C.ink}" stroke-width="5"/>
    ${muddy ? mudSpots([[-30, 10, 18], [16, -18, 13], [8, 26, 12]]) : ""}
    ${tail}
    <g transform="translate(44 -40)">
      <path d="M -26 -6 q -34 -22 -30 6 q 4 26 28 22 z" fill="${C.elephantDark}" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -40 -2 q -14 -10 -12 4 q 2 12 14 10 z" fill="${C.elephantInnerEar}"/>
      <ellipse cx="8" cy="0" rx="42" ry="34" fill="${C.elephant}" stroke="${C.ink}" stroke-width="5"/>
      <g transform="translate(6 -6)">${face(mood, 1)}</g>
      <g transform="translate(16 16)">${mouth(mood, 0.8)}</g>
    </g>
    ${trunk}
    </g>
    </g>
  </g>`;
}

function ostrich({ x, y, s = 1, flip = false, mood = "happy", pose = "stand", fanning = false }) {
  const legRot = pose === "run" ? 20 : 0;
  const leg = (lx, rot) => `<g transform="translate(${lx} 26) rotate(${rot})"><rect x="-5" y="0" width="10" height="88" rx="5" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="3.4"/><path d="M -8 84 l 10 12 l 8 -12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/></g>`;
  const fan = fanning
    ? `<g class="anim-splash" stroke="#f4efe4" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.9">
        <path d="M -70 -40 q -40 -20 -50 -56"/><path d="M -78 -16 q -46 -6 -66 -32"/><path d="M -76 8 q -48 8 -72 -8"/>
      </g>`
    : "";
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 2)}">
    <path d="M -58 -18 q -22 -4 -30 12 q 14 12 32 4 z M -52 6 q -22 0 -28 16 q 16 10 32 0 z" fill="#f4efe4" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="118" rx="58" ry="11" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="ostrich" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 2)}">
    ${leg(-20, legRot)}${leg(18, -legRot)}
    <ellipse cx="-6" cy="0" rx="62" ry="46" fill="${C.ostrichBody}" stroke="${C.ink}" stroke-width="5"/>
    ${tail}${fan}
    <path d="M 34 -22 q 10 -66 22 -92 l 22 4 q -4 34 -18 94 z" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="4.5"/>
    <g transform="translate(72 -122)">
      <ellipse cx="0" cy="0" rx="26" ry="22" fill="${C.ostrichNeck}" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M 20 0 l 26 6 l -24 10 z" fill="${C.ostrichBeak}" stroke="${C.ink}" stroke-width="3.4"/>
      <g transform="translate(0 -4)">${face(mood, 0.85)}</g>
      <path d="M -14 -18 q 2 -10 10 -10 M 0 -20 q 4 -8 10 -6" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    </g>
    </g>
    </g>
  </g>`;
}

function monkey({ x, y, s = 1, flip = false, mood = "happy", arms = "down", leaves = false, flower = false, shade = null }) {
  const bodyFill = shade || C.monkey;
  const arm = (ax, rot) => `<g transform="translate(${ax} -14) rotate(${rot})"><rect x="-6" y="0" width="12" height="52" rx="6" fill="${bodyFill}" stroke="${C.ink}" stroke-width="3.4"/><circle cx="0" cy="54" r="8" fill="${C.monkeyFace}" stroke="${C.ink}" stroke-width="3"/></g>`;
  const flowerMark = flower
    ? `<g transform="translate(-20 -52)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="5" ry="8" fill="#e78fb3" transform="rotate(${a})"/>`).join("")}<circle cx="0" cy="0" r="5" fill="${C.sun}"/></g>`
    : "";
  const up = arms === "up";
  const leafFan = leaves
    ? `<g transform="translate(${up ? -52 : -44} ${up ? -66 : 40})"><g class="anim-splash">
        <path d="M 0 0 q -26 -20 -18 -48 q 24 6 24 44 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3"/>
        <path d="M 8 2 q 0 -34 22 -48 q 14 22 -10 50 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3"/>
        <path d="M -4 6 q -34 -4 -44 -26 q 20 -14 44 12 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3"/>
      </g></g>`
    : "";
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 1.8)}">
    <path d="M -30 30 q -44 4 -48 -34 q 0 -14 12 -10 q 2 26 34 30 z" fill="${bodyFill}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="66" rx="42" ry="9" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="monkey" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 1.8)}">
    ${tail}
    <ellipse cx="0" cy="16" rx="38" ry="42" fill="${bodyFill}" stroke="${C.ink}" stroke-width="4.5"/>
    <ellipse cx="4" cy="26" rx="20" ry="24" fill="${C.monkeyFace}"/>
    ${arm(-24, up ? 150 : 24)}${arm(24, up ? -150 : -24)}
    ${leafFan}
    <g transform="translate(-14 52)"><rect x="-6" y="0" width="12" height="24" rx="6" fill="${bodyFill}" stroke="${C.ink}" stroke-width="3.4"/></g>
    <g transform="translate(16 52)"><rect x="-6" y="0" width="12" height="24" rx="6" fill="${bodyFill}" stroke="${C.ink}" stroke-width="3.4"/></g>
    <g transform="translate(0 -30)">
      <circle cx="0" cy="0" r="26" fill="${bodyFill}" stroke="${C.ink}" stroke-width="4.5"/>
      <ellipse cx="2" cy="6" rx="17" ry="15" fill="${C.monkeyFace}"/>
      <circle cx="-24" cy="-4" r="9" fill="${bodyFill}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="24" cy="-4" r="9" fill="${bodyFill}" stroke="${C.ink}" stroke-width="3.4"/>
      <g transform="translate(2 0)">${face(mood, 0.75)}</g>
      <g transform="translate(2 8)">${mouth(mood, 0.6)}</g>
      ${flowerMark}
    </g>
    </g>
    </g>
  </g>`;
}

// Kiki: a young vervet monkey (Musa's monkey friend is her uncle). Rounder
// head, cheek tufts, and an optional little red school backpack.
function kiki({ x, y, s = 1, flip = false, mood = "happy", arms = "down", backpack = false }) {
  const up = arms === "up";
  const arm = (ax, rot) => `<g transform="translate(${ax} -6) rotate(${rot})"><rect x="-5" y="0" width="10" height="40" rx="5" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3"/><circle cx="0" cy="42" r="7" fill="${C.monkeyFace}" stroke="${C.ink}" stroke-width="2.6"/></g>`;
  const pack = backpack
    ? `<g><rect x="-52" y="-26" width="30" height="42" rx="10" fill="#d94f43" stroke="${C.ink}" stroke-width="3.4"/><rect x="-47" y="-18" width="20" height="14" rx="5" fill="#f4c95d" stroke="${C.ink}" stroke-width="2.6"/><path d="M -24 -20 q 14 -4 22 4 M -24 2 q 14 -2 22 6" stroke="#a53a30" stroke-width="5" fill="none"/></g>`
    : "";
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 1.6)}">
    <path d="M -24 26 q -38 6 -42 -26 q 0 -12 10 -9 q 2 22 30 25 z" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="58" rx="34" ry="8" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="kiki" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 1.6)}">
    ${tail}${pack}
    <ellipse cx="0" cy="18" rx="28" ry="32" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.8"/>
    <ellipse cx="2" cy="26" rx="15" ry="18" fill="${C.monkeyFace}"/>
    ${arm(-18, up ? 150 : 20)}${arm(18, up ? -150 : -20)}
    <g transform="translate(-11 44)"><rect x="-5" y="0" width="10" height="20" rx="5" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3"/></g>
    <g transform="translate(12 44)"><rect x="-5" y="0" width="10" height="20" rx="5" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3"/></g>
    <g transform="translate(0 -22)">
      <circle cx="0" cy="0" r="24" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3.8"/>
      <path d="M -24 -8 q -10 -4 -12 4 q 4 8 14 4 z M 24 -8 q 10 -4 12 4 q -4 8 -14 4 z" fill="${C.monkeyFace}" stroke="${C.ink}" stroke-width="2.6"/>
      <ellipse cx="1" cy="7" rx="16" ry="14" fill="${C.monkeyFace}"/>
      <circle cx="-21" cy="-4" r="8" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="21" cy="-4" r="8" fill="${C.monkey}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M -8 -22 q -2 -12 6 -14 q 8 0 6 12 M 4 -23 q 4 -10 10 -8 q 6 4 0 12" fill="${C.monkey}" stroke="${C.ink}" stroke-width="2.6"/>
      <g transform="translate(1 -1)">${face(mood, 0.72)}</g>
      <g transform="translate(1 9)">${mouth(mood, 0.6)}</g>
    </g>
    </g>
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
  return `<g class="tap-target" data-tap="sun"><circle class="anim-glow" cx="${x}" cy="${y}" r="120" fill="${C.sunGlow}" opacity="0.6"/><circle cx="${x}" cy="${y}" r="78" fill="${C.sun}"/></g>`;
}

function hills() {
  return `<path d="M 0 560 q 260 -110 520 -30 q 300 90 620 -20 q 240 -76 460 10 L 1600 640 L 0 640 Z" fill="${C.hills}" opacity="0.55"/>`;
}

function ground() {
  return `<rect x="0" y="590" width="${W}" height="${H - 590}" fill="${C.grassFar}"/>
    <path d="M 0 720 q 400 -50 800 0 q 400 50 800 0 L 1600 1000 L 0 1000 Z" fill="${C.grassNear}"/>
    ${[120, 380, 660, 940, 1240, 1480].map((gx) => `<g class="anim-grass" style="${delayAt(gx, 800, 3)}"><path d="M ${gx} ${780 + (gx % 3) * 40} q 6 -34 14 -40 q 2 24 10 38 q 10 -18 18 -22 q -2 22 -8 34 z" fill="${C.grassDark}" opacity="0.8"/></g>`).join("")}`;
}

function tallGrass(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-grass" style="${delayAt(x, y, 3)}" stroke="${C.grassDark}" stroke-width="10" fill="none" stroke-linecap="round">
    <path d="M 0 0 q -10 -70 -34 -96"/><path d="M 22 0 q 4 -80 -6 -116"/><path d="M 44 0 q 18 -66 44 -88"/><path d="M 66 0 q 8 -56 0 -80"/>
  </g></g>`;
}

function acacia(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="tap-target" data-tap="tree">
    <path d="M -8 0 q -4 -70 -30 -110 M 6 0 q 8 -76 40 -116 M 0 -60 q -20 -30 -52 -44 M 2 -66 q 26 -26 58 -36" stroke="${C.acaciaTrunk}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <g class="anim-canopy" style="${delayAt(x, y, 4)}">
      <ellipse cx="-46" cy="-124" rx="86" ry="30" fill="${C.acaciaLeafDark}"/>
      <ellipse cx="30" cy="-142" rx="110" ry="34" fill="${C.acaciaLeaf}"/>
    </g>
    </g>
  </g>`;
}

function puddle(x, y, rx, ry, muddyLevel = 1) {
  const fill = muddyLevel > 0 ? C.mud : C.water;
  const inner = muddyLevel > 0 ? C.mudLight : C.waterLight;
  const burst = [-0.6, -0.25, 0.05, 0.35, 0.65]
    .map((t, i) => `<circle cx="${x + rx * t}" cy="${y - ry - 8}" r="${8 + (i % 3) * 2}" fill="${fill}" style="animation-delay:${(i * 0.04).toFixed(2)}s"/>`).join("");
  return `<g class="tap-target" data-tap="puddle">
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.mudDark}"/>
    <ellipse cx="${x}" cy="${y - 6}" rx="${rx - 14}" ry="${ry - 10}" fill="${fill}"/>
    <ellipse class="anim-ripple" style="${delayAt(x, y, 2.6)}" cx="${x - rx * 0.3}" cy="${y - ry * 0.34}" rx="${rx * 0.36}" ry="${ry * 0.26}" fill="${inner}" opacity="0.8"/>
    <g class="tap-burst">${burst}</g>
  </g>`;
}

function fallenBranch(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -130 10 q 90 -26 260 -6" stroke="${C.acaciaTrunk}" stroke-width="26" fill="none" stroke-linecap="round"/>
    <path d="M -40 -2 l -26 -38 M 60 -6 l 20 -40 M -100 4 l -18 -28" stroke="${C.acaciaTrunk}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <ellipse cx="-14" cy="34" rx="150" ry="14" fill="${C.ink}" opacity="0.08"/>
  </g>`;
}

// Night version of the standard scene: deep-blue sky, glowing moon, stars.
function nightScene() {
  let stars = "";
  for (let i = 0; i < 16; i += 1) {
    const sx = (i * 197 + 60) % W;
    const sy = 40 + ((i * 131) % 420);
    stars += `<circle class="anim-glow" style="animation-delay:${((i % 5) / 2).toFixed(1)}s" cx="${sx}" cy="${sy}" r="${3 + (i % 3)}" fill="#f6f0d8" opacity="0.9"/>`;
  }
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27395c"/><stop offset="1" stop-color="#51678f"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${stars}
    <g class="tap-target" data-tap="moon"><circle cx="1320" cy="170" r="95" fill="#fdeebc" opacity="0.35"/><circle cx="1320" cy="170" r="66" fill="#f6ecc4"/><circle cx="1298" cy="152" r="12" fill="#e8dca8"/><circle cx="1338" cy="188" r="8" fill="#e8dca8"/></g>
    ${hills()}${ground()}
    <rect x="0" y="590" width="${W}" height="${H - 590}" fill="#1d2b4a" opacity="0.30"/>`;
}

// The tree school: a big shade acacia with a chalkboard, benches and a bell.
function chalkboard(x, y, s = 1, content = "shapes") {
  const doodle = content === "dots"
    ? `<circle cx="-42" cy="-58" r="9" fill="#f6f0d8"/><circle cx="0" cy="-58" r="9" fill="#f6f0d8"/><circle cx="42" cy="-58" r="9" fill="#f6f0d8"/>`
    : `<circle cx="-40" cy="-62" r="14" fill="none" stroke="#f6f0d8" stroke-width="4"/><path d="M 20 -76 l 8 16 l 18 2 l -13 12 l 3 18 l -16 -9 l -16 9 l 3 -18 l -13 -12 l 18 -2 z" fill="none" stroke="#f6f0d8" stroke-width="4"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -70 0 l 22 -110 M 70 0 l -22 -110" stroke="${C.acaciaTrunk}" stroke-width="10" stroke-linecap="round"/>
    <rect x="-84" y="-140" width="168" height="104" rx="8" fill="#3d5245" stroke="${C.acaciaTrunk}" stroke-width="8"/>
    ${doodle}
  </g>`;
}

function bench(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-90" y="-14" width="180" height="16" rx="7" fill="#b08758" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-74" y="2" width="12" height="34" fill="#8a6242"/>
    <rect x="62" y="2" width="12" height="34" fill="#8a6242"/>
  </g>`;
}

function schoolBell(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-6" y="-150" width="12" height="150" rx="6" fill="${C.acaciaTrunk}"/>
    <path d="M -6 -150 q 40 -10 60 8" stroke="${C.acaciaTrunk}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <g class="tap-target" data-tap="bell"><g class="anim-tail" style="animation-duration:1.8s">
      <path d="M 54 -138 q -26 4 -26 34 q 0 14 26 14 q 26 0 26 -14 q 0 -30 -26 -34 z" fill="${C.sun}" stroke="${C.ink}" stroke-width="4"/>
      <circle cx="54" cy="-84" r="7" fill="${C.ink}"/>
    </g></g>
  </g>`;
}

// The monkey family home: a stout baobab with a round door and window.
function baobabHome(x, y, s = 1, { lit = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -110 0 q -18 -150 -40 -190 q 60 -34 150 -34 q 90 0 150 34 q -22 40 -40 190 z" transform="scale(0.9 1) translate(-10 0)" fill="#9c7550" stroke="${C.ink}" stroke-width="6"/>
    <path d="M -150 -200 q -50 -40 -60 -90 M -90 -214 q -10 -60 -40 -90 M 0 -220 q 0 -60 -6 -96 M 90 -214 q 16 -56 44 -86 M 150 -200 q 46 -44 56 -88" stroke="#8a6242" stroke-width="16" fill="none" stroke-linecap="round"/>
    <ellipse cx="-120" cy="-300" rx="90" ry="34" fill="${C.acaciaLeafDark}"/>
    <ellipse cx="20" cy="-330" rx="120" ry="40" fill="${C.acaciaLeaf}"/>
    <ellipse cx="150" cy="-296" rx="80" ry="30" fill="${C.acaciaLeafDark}"/>
    <path d="M -34 0 q 0 -76 34 -76 q 34 0 34 76 z" fill="${lit ? "#f4c95d" : "#5f4630"}" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="70" cy="-120" r="26" fill="${lit ? "#f4c95d" : "#7d5b3e"}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 58 -120 h 24 M 70 -132 v 24" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
}

function swing(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -120 -190 q 120 -40 240 0" stroke="${C.acaciaTrunk}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <g class="anim-tail" style="animation-duration:2.8s">
      <path d="M -34 -182 l 6 128 M 40 -184 l -4 130" stroke="#c9b699" stroke-width="6"/>
      <rect x="-42" y="-56" width="88" height="14" rx="7" fill="#b08758" stroke="${C.ink}" stroke-width="3.4"/>
    </g>
  </g>`;
}

function kite(x, y, s = 1, { stuck = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="${stuck ? "" : "anim-float"}">
      <g class="tap-target" data-tap="kite">
      <path d="M 0 -70 L 44 0 L 0 70 L -44 0 Z" fill="#d94f43" stroke="${C.ink}" stroke-width="4"/>
      <path d="M 0 -70 V 70 M -44 0 H 44" stroke="#a53a30" stroke-width="3.4"/>
      <path d="M 0 70 q 14 24 2 44 q -14 18 -2 40" stroke="#a53a30" stroke-width="4" fill="none"/>
      <path d="M -8 108 l 16 -8 M -4 148 l 16 -8" stroke="#f4c95d" stroke-width="7" stroke-linecap="round"/>
      </g>
    </g>
    ${stuck ? "" : `<path d="M 0 74 q -60 130 -170 210" stroke="#8f8f96" stroke-width="3.4" fill="none"/>`}
  </g>`;
}

function playBall(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="ball"><g class="anim-idle" style="animation-duration:1.4s">
    <circle cx="0" cy="0" r="42" fill="#f4efe4" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -42 q 20 20 0 42 q -20 22 0 42 M -42 0 q 22 -18 42 0 q 20 18 42 0" stroke="#e76f51" stroke-width="6" fill="none"/>
    <circle cx="0" cy="0" r="13" fill="#7fa8d9" stroke="${C.ink}" stroke-width="3.4"/>
  </g></g></g>`;
}

function cookpot(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="-30" cy="26" rx="16" ry="10" fill="#8f8f96"/><ellipse cx="30" cy="26" rx="16" ry="10" fill="#8f8f96"/><ellipse cx="0" cy="32" rx="16" ry="10" fill="#a5a5ac"/>
    <path d="M -20 16 q 20 -18 40 0 M -6 20 l 6 -14 l 6 14" stroke="#e08a3c" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M -52 -6 q 0 -30 52 -30 q 52 0 52 30 q 0 26 -52 26 q -52 0 -52 -26 z" fill="#4a4a52" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -52 -10 h 104" stroke="${C.ink}" stroke-width="3.4"/>
    <g class="anim-wave" style="animation-delay:0s"><path d="M -16 -44 q -8 -16 4 -30" stroke="#dfe6ea" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    <g class="anim-wave" style="animation-delay:0.8s"><path d="M 14 -44 q 10 -18 -2 -34" stroke="#dfe6ea" stroke-width="6" fill="none" stroke-linecap="round"/></g>
  </g>`;
}

function mango(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -14 q 22 -4 26 16 q 2 22 -22 24 q -26 0 -26 -22 q 0 -16 22 -18 z" fill="#f2a541" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 2 -14 q 4 -10 12 -12" stroke="#5c7d43" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

function thoughtBubble(x, y, s = 1, inner = "") {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-120" cy="120" r="12" fill="#ffffff" opacity="0.9"/>
    <circle cx="-88" cy="86" r="20" fill="#ffffff" opacity="0.92"/>
    <ellipse cx="30" cy="-10" rx="170" ry="110" fill="#ffffff" opacity="0.95" stroke="#cbd7df" stroke-width="4"/>
    ${inner}
  </g>`;
}

function raceBanner(x, y, s = 1) {
  let flags = "";
  for (let i = 0; i < 8; i += 1) {
    const t = (i + 0.5) / 8;
    const fx = -304 + 608 * t;
    const fy = (1 - t) * (1 - t) * -180 + 2 * (1 - t) * t * -134 + t * t * -180;
    flags += `<path d="M ${fx.toFixed(0)} ${fy.toFixed(0)} l 26 5 l -10 36 z" fill="${C.rainbow[i % C.rainbow.length]}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-310" y="-190" width="12" height="190" rx="6" fill="${C.acaciaTrunk}"/>
    <rect x="298" y="-190" width="12" height="190" rx="6" fill="${C.acaciaTrunk}"/>
    <path d="M -304 -180 q 304 46 608 0" stroke="#5c7d43" stroke-width="6" fill="none"/>
    ${flags}
  </g>`;
}

function dustPuffs(x, y) {
  return `<g class="anim-splash" opacity="0.55">
    <ellipse cx="${x - 60}" cy="${y}" rx="34" ry="16" fill="#c9b699"/>
    <ellipse cx="${x + 10}" cy="${y - 14}" rx="26" ry="12" fill="#d6c6ac"/>
    <ellipse cx="${x + 70}" cy="${y + 4}" rx="30" ry="14" fill="#c9b699"/>
  </g>`;
}

function confetti(x, y) {
  let dots = "";
  for (let i = 0; i < 14; i += 1) {
    const dx = x - 260 + (i * 41) % 520;
    const dy = y - 60 - ((i * 73) % 180);
    dots += `<circle class="anim-drip" style="animation-delay:${((i % 7) / 7).toFixed(2)}s" cx="${dx}" cy="${dy}" r="${7 + (i % 3) * 2}" fill="${C.rainbow[i % C.rainbow.length]}" opacity="0.9"/>`;
  }
  return dots;
}

function rain() {
  let drops = "";
  for (let i = 0; i < 60; i += 1) {
    const rx = (i * 137) % W;
    const ry = 40 + ((i * 211) % 520);
    drops += `<line class="anim-rain" style="animation-delay:${((i % 13) / 13 * 1.15).toFixed(2)}s" x1="${rx}" y1="${ry}" x2="${rx - 10}" y2="${ry + 34}" stroke="#7d97ad" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`;
  }
  return drops;
}

function splashArcs(x, y, color = C.mud) {
  return `<g class="anim-splash"><g stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round">
      <path d="M ${x - 120} ${y - 20} q -40 -70 -100 -90"/><path d="M ${x + 120} ${y - 20} q 40 -70 100 -90"/>
      <path d="M ${x - 60} ${y - 50} q -16 -80 -50 -120"/><path d="M ${x + 60} ${y - 50} q 16 -80 50 -120"/>
      <path d="M ${x} ${y - 60} q 0 -80 -10 -130"/>
    </g>
    ${mudSpots([[x - 210, y - 150, 14], [x + 220, y - 160, 16], [x - 120, y - 220, 11], [x + 100, y - 230, 12], [x - 20, y - 250, 10]], color)}</g>`;
}

function waterSpray(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 180;
  let drops = "";
  for (let i = 1; i < 8; i += 1) {
    const t = i / 8;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    drops += `<circle class="anim-drip" style="animation-delay:${(t * 0.9).toFixed(2)}s" cx="${bx}" cy="${by + 26}" r="${7 + (i % 3) * 2}" fill="${C.water}" opacity="0.85"/>`;
  }
  return `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" stroke="${C.water}" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path class="anim-flow" d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" stroke="${C.waterLight}" stroke-width="7" fill="none" stroke-linecap="round"/>${drops}`;
}

function sunnyPatch(x, y) {
  return `<ellipse class="anim-glow" cx="${x}" cy="${y}" rx="220" ry="52" fill="${C.sunGlow}" opacity="0.8"/>`;
}

function rainbow(x, y) {
  return `<g class="anim-shimmer">${C.rainbow.map((color, index) => `<path d="M ${x - 330 + index * 22} ${y} a ${330 - index * 22} ${330 - index * 22} 0 0 1 ${(330 - index * 22) * 2} 0" fill="none" stroke="${color}" stroke-width="20" opacity="0.75"/>`).join("")}</g>`;
}

function vine(points, width = 12, taut = false) {
  return `<g class="${taut ? "anim-strain" : ""}"><path d="${points}" fill="none" stroke="#5c7d43" stroke-width="${width}" stroke-linecap="round"/>
    <path d="${points}" fill="none" stroke="#79a15a" stroke-width="${width * 0.45}" stroke-linecap="round"/></g>`;
}

const basicScene = (rainy = false) => `${sky(rainy)}${rainy ? "" : sun()}${hills()}${ground()}`;

// ---------------------------------------------------------------- book 1: Musa's Muddy Stripes

const muddyStripesPages = [
  `${basicScene()}${acacia(210, 640, 1.1)}${acacia(1430, 620, 0.9)}
   ${puddle(800, 880, 280, 62)}
   ${giraffe({ x: 380, y: 640, s: 1.02 })}
   ${elephant({ x: 1220, y: 700, s: 0.98, flip: true })}
   ${ostrich({ x: 1040, y: 650, s: 0.9, flip: true })}
   ${monkey({ x: 540, y: 740, s: 0.95 })}
   ${zebra({ x: 800, y: 670, s: 1.12 })}`,

  `${basicScene()}${acacia(1380, 640, 1.05)}
   ${tallGrass(220, 900, 1.4)}${tallGrass(1240, 940, 1.5)}${tallGrass(1420, 860, 1.1)}
   ${zebra({ x: 720, y: 690, s: 1.2, pose: "run" })}
   <g stroke="${C.grassDark}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7"><path d="M 430 800 q -50 -8 -80 10"/><path d="M 1030 810 q 50 -10 84 6"/></g>`,

  `${basicScene()}${acacia(200, 630, 1)}
   ${giraffe({ x: 430, y: 630, s: 0.98, pose: "run" })}
   ${zebra({ x: 1050, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 780 760 q -40 -12 -70 6"/><path d="M 690 800 q -36 -8 -62 8"/></g>`,

  `${basicScene()}${acacia(1420, 630, 1)}
   ${elephant({ x: 420, y: 710, s: 1, trunkUp: true, pose: "run" })}
   ${zebra({ x: 1080, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 760 780 q -40 -12 -70 6"/><path d="M 680 820 q -36 -8 -62 8"/></g>`,

  `${basicScene()}${acacia(240, 640, 1.05)}${tallGrass(1400, 900, 1.3)}
   ${ostrich({ x: 560, y: 660, s: 0.95, pose: "run" })}
   ${zebra({ x: 1020, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 330 800 q -40 -12 -70 6"/><path d="M 760 800 q -36 -10 -64 6"/></g>`,

  `${basicScene()}${acacia(1400, 640, 1)}
   ${fallenBranch(800, 900, 1.15)}
   ${zebra({ x: 790, y: 560, s: 1.15, pose: "leap" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"><path d="M 520 700 q -46 -8 -80 10"/><path d="M 470 750 q -40 -6 -70 10"/></g>`,

  `${basicScene()}${acacia(220, 630, 1)}
   ${puddle(900, 870, 330, 76)}
   ${splashArcs(900, 850)}
   ${zebra({ x: 900, y: 750, s: 1.1, mood: "surprised", sunk: true })}`,

  `${basicScene()}${acacia(1410, 640, 1)}
   ${puddle(1030, 890, 280, 62)}
   ${zebra({ x: 620, y: 700, s: 1.12, mood: "sad", heavyMud: true })}
   ${mudSpots([[420, 870, 22], [820, 930, 18]])}`,

  `${basicScene()}${acacia(240, 640, 1.05)}
   ${puddle(1240, 900, 200, 48)}
   ${zebra({ x: 850, y: 700, s: 1.1, mood: "sad", heavyMud: true, flip: true })}
   ${monkey({ x: 430, y: 750, s: 1, arms: "up", leaves: true })}
   <g class="anim-splash" stroke="${C.leaf}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 560 620 q 30 -20 60 -14"/><path d="M 560 660 q 34 -8 64 2"/></g>`,

  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${puddle(760, 910, 220, 50, 0)}
   ${elephant({ x: 380, y: 710, s: 1.05, trunkUp: true })}
   ${waterSpray(500, 540, 900, 560)}
   ${zebra({ x: 980, y: 700, s: 1.1, mood: "surprised", muddy: true, flip: true })}
   <g stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 880 760 q -14 30 -34 40"/><path d="M 1100 750 q 14 32 32 44"/></g>`,

  `${basicScene()}${sunnyPatch(1180, 840)}${acacia(180, 630, 1)}
   ${ostrich({ x: 480, y: 660, s: 0.95, fanning: true })}
   ${zebra({ x: 880, y: 690, s: 1.08 })}
   ${giraffe({ x: 1330, y: 620, s: 0.95, flip: true })}`,

  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${puddle(800, 890, 280, 62, 0)}
   ${zebra({ x: 780, y: 680, s: 1.1 })}
   ${elephant({ x: 1120, y: 700, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 360, y: 620, s: 0.92 })}
   ${ostrich({ x: 1330, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 540, y: 770, s: 0.9, arms: "up" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 600 840 q -24 -36 -58 -44"/><path d="M 1000 850 q 26 -38 60 -46"/></g>`,
];

// ---------------------------------------------------------------- book 2: Musa Helps a Friend

const helpsAFriendPages = [
  `${basicScene()}${acacia(210, 640, 1.1)}${acacia(1430, 620, 0.9)}
   ${puddle(800, 870, 300, 66)}
   ${giraffe({ x: 400, y: 640, s: 1.05 })}
   ${elephant({ x: 1210, y: 700, s: 1, flip: true, trunkUp: true })}
   ${ostrich({ x: 1050, y: 650, s: 0.92, flip: true })}
   ${monkey({ x: 560, y: 740, s: 0.95, arms: "up" })}
   ${zebra({ x: 800, y: 680, s: 1.1 })}`,

  `${basicScene(true)}
   <g class="anim-cloud"><circle cx="1330" cy="150" r="62" fill="#f4f0e2" opacity="0.85"/><circle cx="1306" cy="138" r="52" fill="${C.rainTop}"/></g>
   ${acacia(280, 650, 1.15)}${acacia(1330, 630, 0.95)}
   ${puddle(520, 850, 200, 48)}${puddle(1080, 900, 240, 54)}${puddle(820, 760, 120, 30)}
   ${rain()}`,

  `${basicScene()}${acacia(1380, 640, 1.05)}
   ${puddle(560, 900, 210, 50)}
   ${zebra({ x: 620, y: 700, s: 1.15, pose: "run" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="8" fill="none" stroke-linecap="round"><path d="M 430 860 q -30 -40 -70 -50"/><path d="M 700 870 q 30 -44 66 -56"/></g>`,

  `${basicScene()}${acacia(260, 640, 1.1)}
   ${zebra({ x: 560, y: 690, s: 1.15, mood: "surprised" })}
   <g stroke="#7d97ad" stroke-width="8" fill="none" stroke-linecap="round">
     <path class="anim-wave" style="animation-delay:0s" d="M 1160 420 q 30 -30 0 -60"/>
     <path class="anim-wave" style="animation-delay:0.4s" d="M 1210 440 q 46 -46 0 -92"/>
     <path class="anim-wave" style="animation-delay:0.8s" d="M 1260 460 q 62 -62 0 -124"/>
   </g>
   <path d="M 1000 620 q 60 -20 120 0 q -20 60 -60 60 q -40 0 -60 -60 z" fill="${C.grassDark}" opacity="0.6"/>`,

  `${basicScene()}${acacia(220, 630, 1.05)}
   ${puddle(980, 850, 340, 80)}
   ${elephant({ x: 980, y: 760, s: 1.05, stuck: true, mood: "sad" })}
   ${mudSpots([[760, 800, 24], [1220, 810, 20], [980, 900, 26]])}`,

  `${basicScene()}${acacia(1400, 640, 1)}
   ${puddle(1000, 860, 320, 74)}
   ${elephant({ x: 1030, y: 780, s: 1, stuck: true, mood: "sad" })}
   ${zebra({ x: 520, y: 700, s: 1.1 })}
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 700 400 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  `${basicScene()}${acacia(200, 640, 1.05)}
   ${zebra({ x: 430, y: 690, s: 1.02, mood: "surprised" })}
   ${giraffe({ x: 900, y: 620, s: 0.98, flip: true })}
   ${ostrich({ x: 1180, y: 660, s: 0.9, flip: true, pose: "run" })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}`,

  `${basicScene()}${acacia(1410, 630, 1)}
   ${puddle(1060, 860, 300, 70)}
   ${elephant({ x: 1090, y: 780, s: 1, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 420 700 q 200 -90 420 -40 q 140 30 220 -10")}
   ${monkey({ x: 400, y: 700, s: 0.95, arms: "up" })}`,

  `${basicScene()}${acacia(180, 630, 1)}
   ${puddle(1180, 870, 280, 66)}
   ${elephant({ x: 1200, y: 790, s: 0.98, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 340 680 q 240 -60 520 -20 q 160 20 260 -30", 12, true)}
   ${zebra({ x: 760, y: 700, s: 1, pull: true, flip: true })}
   ${giraffe({ x: 480, y: 630, s: 0.95, flip: true })}
   ${ostrich({ x: 300, y: 680, s: 0.85, flip: true, pose: "run" })}
   ${monkey({ x: 940, y: 760, s: 0.85, arms: "up", mood: "surprised" })}`,

  `${basicScene()}${acacia(1420, 640, 0.95)}
   ${puddle(1080, 890, 300, 66)}
   ${splashArcs(1080, 890)}
   ${elephant({ x: 830, y: 640, s: 1.02, flip: true, mood: "surprised", trunkUp: true, muddy: true })}
   ${zebra({ x: 460, y: 700, s: 1, mood: "surprised", muddy: true })}
   ${monkey({ x: 1330, y: 780, s: 0.88, arms: "up", mood: "surprised" })}`,

  `${basicScene()}${acacia(230, 640, 1)}
   ${puddle(820, 900, 240, 54)}
   ${zebra({ x: 620, y: 690, s: 1.05, muddy: true })}
   ${elephant({ x: 1120, y: 700, s: 0.95, flip: true, muddy: true, trunkUp: true })}
   ${giraffe({ x: 320, y: 620, s: 0.92 })}
   ${ostrich({ x: 900, y: 640, s: 0.85, flip: true })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}
   ${mudSpots([[350, 560, 12], [980, 520, 12], [1240, 600, 10]])}`,

  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${puddle(800, 890, 280, 62, 0)}
   ${zebra({ x: 660, y: 690, s: 1.05 })}
   ${elephant({ x: 1000, y: 700, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 380, y: 620, s: 0.92 })}
   ${ostrich({ x: 1240, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 820, y: 770, s: 0.85, arms: "up" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 600 840 q -24 -36 -58 -44"/><path d="M 1010 850 q 26 -38 60 -46"/></g>`,
];

// ---------------------------------------------------------------- book 3: Musa's Big Race

const bigRacePages = [
  // 1 cover: everyone at the race banner
  `${basicScene()}${acacia(180, 640, 1)}${acacia(1450, 630, 0.9)}
   ${raceBanner(800, 560, 1.1)}
   ${giraffe({ x: 360, y: 640, s: 0.98 })}
   ${elephant({ x: 1200, y: 700, s: 0.96, flip: true, trunkUp: true })}
   ${ostrich({ x: 1030, y: 650, s: 0.9, flip: true })}
   ${monkey({ x: 540, y: 750, s: 0.92, arms: "up" })}
   ${zebra({ x: 790, y: 690, s: 1.1 })}`,

  // 2 race day: friends line up
  `${basicScene()}${acacia(1440, 630, 0.9)}
   ${raceBanner(430, 570, 0.9)}
   ${zebra({ x: 340, y: 700, s: 0.95 })}
   ${giraffe({ x: 620, y: 650, s: 0.9 })}
   ${elephant({ x: 900, y: 720, s: 0.9 })}
   ${ostrich({ x: 1130, y: 680, s: 0.85 })}
   ${monkey({ x: 1380, y: 770, s: 0.9, flip: true })}`,

  // 3 ready steady go
  `${basicScene()}${acacia(220, 630, 1)}
   ${monkey({ x: 350, y: 730, s: 1.05, arms: "up", mood: "surprised" })}
   ${zebra({ x: 700, y: 700, s: 0.98, pose: "run" })}
   ${ostrich({ x: 1000, y: 660, s: 0.86, pose: "run" })}
   ${elephant({ x: 1280, y: 720, s: 0.86, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 520 810 q -40 -12 -70 6"/><path d="M 850 820 q -36 -10 -64 6"/></g>`,

  // 4 Musa in front
  `${basicScene()}${acacia(1400, 640, 1)}${tallGrass(1280, 930, 1.3)}
   ${zebra({ x: 1000, y: 680, s: 1.18, pose: "run" })}
   ${ostrich({ x: 420, y: 690, s: 0.7, pose: "run" })}
   ${giraffe({ x: 220, y: 660, s: 0.68, pose: "run" })}
   ${elephant({ x: 590, y: 740, s: 0.66, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 760 790 q -40 -12 -70 6"/><path d="M 700 830 q -36 -8 -62 8"/></g>`,

  // 5 past the big acacia
  `${basicScene()}${acacia(400, 620, 1.5)}${tallGrass(180, 920, 1.4)}
   ${zebra({ x: 950, y: 690, s: 1.15, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 700 800 q -46 -8 -80 10"/></g>`,

  // 6 the leap (series motif)
  `${basicScene()}${acacia(210, 640, 0.95)}
   ${fallenBranch(870, 900, 1.1)}
   ${zebra({ x: 860, y: 560, s: 1.15, pose: "leap" })}
   ${tallGrass(1400, 920, 1.2)}`,

  // 7 BUMP! the little elephant trips
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${dustPuffs(760, 830)}
   ${elephant({ x: 760, y: 770, s: 1.05, stuck: true, mood: "sad" })}
   ${ostrich({ x: 1350, y: 660, s: 0.7, flip: false, pose: "run" })}`,

  // 8 Musa stops: the finish line is so close
  `${basicScene()}${raceBanner(1330, 580, 0.85)}${acacia(180, 630, 0.95)}
   ${zebra({ x: 820, y: 690, s: 1.12, flip: true, mood: "surprised" })}
   ${elephant({ x: 300, y: 790, s: 0.62, stuck: true, mood: "sad" })}`,

  // 9 Musa runs back to his friend
  `${basicScene()}${acacia(1430, 640, 0.95)}
   ${elephant({ x: 950, y: 770, s: 1, stuck: true, mood: "sad" })}
   ${zebra({ x: 480, y: 700, s: 1.08, pose: "run" })}
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 700 400 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  // 10 running the last part together
  `${basicScene()}${raceBanner(1350, 570, 0.8)}${acacia(200, 630, 0.95)}
   ${zebra({ x: 640, y: 690, s: 1.05, pose: "run" })}
   ${elephant({ x: 1000, y: 710, s: 0.95, pose: "run", trunkUp: true })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 430 800 q -40 -12 -70 6"/><path d="M 810 820 q -36 -8 -62 8"/></g>`,

  // 11 the ostrich wins; everyone cheers
  `${basicScene()}${raceBanner(800, 560, 1.05)}${confetti(800, 420)}
   ${ostrich({ x: 800, y: 650, s: 1 })}
   ${monkey({ x: 470, y: 760, s: 0.95, arms: "up" })}
   ${giraffe({ x: 250, y: 630, s: 0.88 })}
   ${zebra({ x: 1120, y: 700, s: 0.95, flip: true })}
   ${elephant({ x: 1420, y: 730, s: 0.85, flip: true, trunkUp: true })}`,

  // 12 a real winner (trilogy rainbow ending)
  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${zebra({ x: 700, y: 690, s: 1.08 })}
   ${elephant({ x: 1020, y: 710, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 360, y: 620, s: 0.9 })}
   ${ostrich({ x: 1260, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 850, y: 780, s: 0.85, arms: "up" })}`,
];

// ---------------------------------------------------------------- Kiki series (Term 1)
// Book 1: Kiki Goes to School

const kikiSchoolPages = [
  // 1 cover: the tree school
  `${basicScene()}${acacia(1150, 600, 1.35)}
   ${chalkboard(1130, 830, 1)}${schoolBell(360, 840, 1)}
   ${giraffe({ x: 620, y: 630, s: 0.9, glasses: true })}
   ${elephant({ x: 1420, y: 760, s: 0.6 })}
   ${ostrich({ x: 880, y: 740, s: 0.55 })}
   ${kiki({ x: 470, y: 800, s: 1.25, backpack: true, arms: "up" })}`,

  // 2 first day: leaving home with the new red bag
  `${basicScene()}${baobabHome(320, 900, 0.9)}
   ${monkey({ x: 210, y: 760, s: 0.95, flower: true, arms: "up" })}
   ${monkey({ x: 420, y: 750, s: 1.1, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 900, y: 800, s: 1.2, backpack: true })}
   ${tallGrass(1360, 930, 1.3)}`,

  // 3 Musa cameo on the path
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${zebra({ x: 1000, y: 690, s: 1.05 })}
   ${kiki({ x: 480, y: 800, s: 1.2, backpack: true, flip: true, arms: "up" })}`,

  // 4 the school looks big; Kiki feels shy
  `${basicScene()}${acacia(1050, 590, 1.5)}
   ${chalkboard(1040, 840, 1.1)}${schoolBell(1420, 840, 1)}${bench(760, 900, 1)}
   ${kiki({ x: 280, y: 810, s: 1.15, backpack: true, mood: "sad" })}`,

  // 5 Miss Twiga says welcome
  `${basicScene()}${acacia(240, 630, 1)}
   ${giraffe({ x: 850, y: 620, s: 1.05, glasses: true, bend: true })}
   ${kiki({ x: 1250, y: 800, s: 1.2, backpack: true, arms: "up" })}`,

  // 6 sitting next to the little elephant
  `${basicScene()}${acacia(1400, 620, 1.1)}${chalkboard(1380, 850, 0.9)}
   ${elephant({ x: 900, y: 720, s: 0.8 })}
   ${kiki({ x: 560, y: 790, s: 1.15 })}
   ${bench(720, 900, 1.5)}`,

  // 7 learning hello
  `${basicScene()}${chalkboard(400, 800, 1.3)}
   ${giraffe({ x: 800, y: 620, s: 0.85, glasses: true })}
   ${kiki({ x: 1100, y: 800, s: 1.1, arms: "up" })}
   ${elephant({ x: 1380, y: 760, s: 0.62, trunkUp: true })}`,

  // 8 counting one two three
  `${basicScene()}${chalkboard(400, 800, 1.3, "dots")}
   ${giraffe({ x: 800, y: 620, s: 0.85, glasses: true })}
   ${kiki({ x: 1080, y: 800, s: 1.1, arms: "up" })}
   ${ostrich({ x: 1360, y: 740, s: 0.6 })}`,

  // 9 sharing the mango
  `${basicScene()}${acacia(220, 630, 1)}
   ${kiki({ x: 660, y: 800, s: 1.15 })}
   ${elephant({ x: 1020, y: 740, s: 0.75, trunkUp: true })}
   ${mango(830, 830, 1.4)}${mango(880, 850, 1.1)}`,

  // 10 a new friend
  `${basicScene()}${acacia(1420, 630, 0.95)}${tallGrass(200, 920, 1.3)}
   ${kiki({ x: 620, y: 800, s: 1.15, arms: "up" })}
   ${ostrich({ x: 950, y: 720, s: 0.72, pose: "run" })}`,

  // 11 the bell rings
  `${basicScene()}${schoolBell(800, 840, 1.4)}${acacia(1350, 630, 1)}
   ${giraffe({ x: 320, y: 630, s: 0.85, glasses: true })}
   ${kiki({ x: 1080, y: 800, s: 1.15, backpack: true, arms: "up" })}
   ${elephant({ x: 1370, y: 770, s: 0.6 })}`,

  // 12 telling the family at night
  `${nightScene()}${baobabHome(1150, 900, 1, { lit: true })}
   ${monkey({ x: 420, y: 760, s: 0.95, flower: true })}
   ${monkey({ x: 640, y: 750, s: 1.1, shade: "#77836f" })}
   ${kiki({ x: 850, y: 800, s: 1.2, arms: "up" })}
   ${kiki({ x: 260, y: 830, s: 0.62 })}`,
];

// Book 2: Kiki's Family Day

const kikiFamilyPages = [
  // 1 cover: the family at the baobab
  `${basicScene()}${baobabHome(1100, 900, 1.05)}
   ${monkey({ x: 340, y: 750, s: 0.98, flower: true })}
   ${monkey({ x: 560, y: 740, s: 1.15, shade: "#77836f" })}
   ${kiki({ x: 760, y: 800, s: 1.2, arms: "up" })}
   ${kiki({ x: 420, y: 840, s: 0.62 })}`,

  // 2 the baobab home
  `${basicScene()}${baobabHome(800, 910, 1.25)}${tallGrass(220, 930, 1.4)}${tallGrass(1400, 940, 1.3)}`,

  // 3 Mama, Papa and little Nia
  `${basicScene()}${baobabHome(240, 890, 0.8)}
   ${monkey({ x: 620, y: 750, s: 1, flower: true })}
   ${monkey({ x: 900, y: 740, s: 1.18, shade: "#77836f" })}
   ${kiki({ x: 1160, y: 830, s: 0.62 })}
   ${kiki({ x: 1360, y: 790, s: 1.15, arms: "up" })}`,

  // 4 helping Mama cook
  `${basicScene()}${baobabHome(1350, 890, 0.8)}
   ${cookpot(780, 870, 1.3)}
   ${monkey({ x: 480, y: 750, s: 1, flower: true })}
   ${kiki({ x: 1050, y: 810, s: 1.15, arms: "up" })}`,

  // 5 helping Papa with mangoes
  `${basicScene()}${acacia(1150, 620, 1.3)}
   ${mango(1050, 470, 1)}${mango(1180, 440, 1)}${mango(1280, 490, 1)}
   ${monkey({ x: 880, y: 740, s: 1.18, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 480, y: 810, s: 1.15 })}
   ${mango(560, 860, 1.2)}${mango(610, 880, 1)}`,

  // 6 Nia drops her banana
  `${basicScene()}${baobabHome(280, 890, 0.85)}
   ${kiki({ x: 850, y: 830, s: 0.72, mood: "sad" })}
   <path d="M 940 900 q 30 -26 64 -10 q -8 26 -40 26 q -18 0 -24 -16 z" fill="#f4d35e" stroke="${C.ink}" stroke-width="3.4"/>
   ${kiki({ x: 1250, y: 790, s: 1.15, mood: "surprised", flip: true })}`,

  // 7 Kiki shares hers (series kindness motif)
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${kiki({ x: 700, y: 800, s: 1.15, arms: "up" })}
   ${kiki({ x: 1000, y: 840, s: 0.72 })}
   <path d="M 850 760 q 30 -26 64 -10 q -8 26 -40 26 q -18 0 -24 -16 z" fill="#f4d35e" stroke="${C.ink}" stroke-width="3.4"/>
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 860 520 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  // 8 dinner together
  `${basicScene()}${baobabHome(1350, 890, 0.8)}
   ${cookpot(800, 880, 1.2)}
   ${monkey({ x: 430, y: 760, s: 0.95, flower: true })}
   ${monkey({ x: 620, y: 750, s: 1.12, shade: "#77836f" })}
   ${kiki({ x: 1010, y: 810, s: 1.1 })}
   ${kiki({ x: 1160, y: 850, s: 0.6 })}
   ${mango(900, 920, 1.1)}${mango(700, 940, 1)}`,

  // 9 Papa's story about a brave zebra
  `${nightScene()}${baobabHome(280, 890, 0.85, { lit: true })}
   ${monkey({ x: 640, y: 760, s: 1.15, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 900, y: 820, s: 1.1 })}
   ${kiki({ x: 1040, y: 850, s: 0.6 })}
   ${thoughtBubble(1180, 380, 1, zebra({ x: 30, y: 30, s: 0.34, pose: "run" }))}`,

  // 10 Mama's soft song
  `${nightScene()}${baobabHome(1280, 890, 0.85, { lit: true })}
   ${monkey({ x: 620, y: 750, s: 1, flower: true })}
   ${kiki({ x: 900, y: 830, s: 1.1 })}
   ${kiki({ x: 1030, y: 860, s: 0.6 })}
   <g fill="#f6f0d8"><g class="anim-float" style="animation-delay:0s"><circle cx="700" cy="520" r="9"/><rect x="706" y="470" width="5" height="52" rx="2.5"/></g><g class="anim-float" style="animation-delay:0.9s"><circle cx="790" cy="470" r="9"/><rect x="796" y="420" width="5" height="52" rx="2.5"/></g></g>`,

  // 11 goodnight hugs
  `${nightScene()}${baobabHome(1200, 900, 1, { lit: true })}
   ${monkey({ x: 480, y: 760, s: 0.98, flower: true, arms: "up" })}
   ${monkey({ x: 700, y: 750, s: 1.15, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 590, y: 820, s: 1.1, arms: "up" })}
   ${kiki({ x: 820, y: 850, s: 0.6, arms: "up" })}`,

  // 12 dreaming of a happy home
  `${nightScene()}${baobabHome(800, 920, 1.2, { lit: false })}
   ${kiki({ x: 1330, y: 840, s: 0.9 })}
   ${tallGrass(220, 940, 1.3)}`,
];

// Book 3: Kiki and the Big Game

const kikiGamePages = [
  // 1 cover: the playground
  `${basicScene()}${acacia(1150, 590, 1.4)}${swing(1150, 780, 1)}
   ${kite(400, 300, 0.9)}
   ${playBall(700, 880, 1)}
   ${kiki({ x: 480, y: 800, s: 1.2, arms: "up" })}
   ${elephant({ x: 900, y: 750, s: 0.62 })}
   ${ostrich({ x: 1400, y: 750, s: 0.58 })}`,

  // 2 play day at school
  `${basicScene()}${chalkboard(320, 800, 1)}${schoolBell(1430, 840, 1)}
   ${giraffe({ x: 650, y: 630, s: 0.85, glasses: true })}
   ${kiki({ x: 950, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1200, y: 760, s: 0.6, trunkUp: true })}`,

  // 3 playing ball
  `${basicScene()}${acacia(220, 630, 1)}
   ${playBall(800, 860, 1.2)}
   ${kiki({ x: 520, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1080, y: 740, s: 0.72, trunkUp: true })}
   ${ostrich({ x: 1350, y: 720, s: 0.62 })}`,

  // 4 the ostrich runs fast
  `${basicScene()}${acacia(1420, 630, 0.95)}${tallGrass(200, 920, 1.3)}
   ${ostrich({ x: 900, y: 690, s: 0.95, pose: "run" })}
   ${kiki({ x: 400, y: 800, s: 1.15, arms: "up" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 660 800 q -40 -12 -70 6"/></g>`,

  // 5 high on the swing
  `${basicScene()}${acacia(800, 570, 1.5)}${swing(800, 760, 1.3)}
   ${kiki({ x: 800, y: 640, s: 1, arms: "up" })}
   ${elephant({ x: 320, y: 760, s: 0.62 })}`,

  // 6 flying the big red kite
  `${basicScene()}${acacia(220, 630, 1)}
   ${kite(1050, 320, 1.1)}
   ${kiki({ x: 850, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1200, y: 760, s: 0.62, trunkUp: true })}`,

  // 7 the wind takes the kite
  `${basicScene()}
   ${kite(1250, 240, 0.95)}
   <g stroke="#9db4c6" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 500 320 q 90 -40 180 0 q 90 40 180 0"/><path d="M 420 440 q 90 -40 180 0 q 90 40 180 0"/></g>
   ${kiki({ x: 620, y: 800, s: 1.15, mood: "surprised", arms: "up" })}
   ${elephant({ x: 950, y: 760, s: 0.62, mood: "surprised" })}`,

  // 8 stuck in the tall tall tree
  `${basicScene()}${acacia(1050, 600, 1.5)}
   ${kite(1120, 420, 0.85, { stuck: true })}
   ${kiki({ x: 550, y: 810, s: 1.15, mood: "sad" })}
   ${elephant({ x: 850, y: 770, s: 0.6, mood: "sad" })}`,

  // 9 Kiki has an idea
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${kiki({ x: 700, y: 800, s: 1.25, mood: "surprised", arms: "up" })}
   ${elephant({ x: 1050, y: 760, s: 0.62 })}
   ${ostrich({ x: 1300, y: 730, s: 0.58 })}`,

  // 10 the tall friend reaches up up up
  `${basicScene()}${acacia(1050, 600, 1.5)}
   ${kite(1120, 420, 0.85, { stuck: true })}
   ${giraffe({ x: 780, y: 620, s: 1.1 })}
   ${kiki({ x: 420, y: 810, s: 1.1, arms: "up" })}`,

  // 11 hooray - and Musa comes to play
  `${basicScene()}${acacia(220, 630, 1)}
   ${kite(600, 330, 0.9)}
   ${giraffe({ x: 950, y: 620, s: 0.95 })}
   ${zebra({ x: 1300, y: 700, s: 0.95 })}
   ${kiki({ x: 550, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 800, y: 770, s: 0.58, trunkUp: true })}`,

  // 12 games are best with friends
  `${basicScene()}${acacia(1400, 620, 1.1)}${swing(1400, 800, 0.9)}
   ${kite(300, 280, 0.85)}
   ${playBall(760, 880, 1)}
   ${kiki({ x: 550, y: 800, s: 1.15, arms: "up" })}
   ${zebra({ x: 1050, y: 700, s: 0.9 })}
   ${elephant({ x: 1330, y: 760, s: 0.55, trunkUp: true })}
   ${ostrich({ x: 900, y: 740, s: 0.55 })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "muddy-stripes": { dir: "musas-muddy-stripes", pages: muddyStripesPages },
  "helps-a-friend": { dir: "musa-helps-a-friend", pages: helpsAFriendPages },
  "big-race": { dir: "musas-big-race", pages: bigRacePages },
  "kiki-school": { dir: "kiki-goes-to-school", pages: kikiSchoolPages },
  "kiki-family": { dir: "kikis-family-day", pages: kikiFamilyPages },
  "kiki-game": { dir: "kiki-and-the-big-game", pages: kikiGamePages },
};

const selection = process.argv[2] && process.argv[2] !== "all" ? [process.argv[2]] : Object.keys(books);

for (const key of selection) {
  const book = books[key];
  if (!book) {
    console.error(`Unknown book "${key}". Use: ${Object.keys(books).join(", ")}, or all.`);
    process.exit(1);
  }
  const outDir = path.join(ebooksRoot, book.dir);
  fs.mkdirSync(outDir, { recursive: true });
  book.pages.forEach((body, index) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">\n${STYLE}\n${body}\n</svg>\n`;
    fs.writeFileSync(path.join(outDir, `page-${String(index + 1).padStart(2, "0")}.svg`), svg, "utf8");
  });
  console.log(`Wrote ${book.pages.length} animated pages to ${path.relative(root, outDir)}`);
}
