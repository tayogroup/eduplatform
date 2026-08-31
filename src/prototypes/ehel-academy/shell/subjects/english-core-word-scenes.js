// The action words of the Grade 1 Core words, acted out.
//
// word-pictures.js answers "what does this word LOOK like" and honestly cannot
// answer it for a verb: a still picture of a child mid-air says "child", not
// "jump". These scenes answer "what does this word DO" — a small animated SVG
// loop in which a child acts the word out, shown on the word's own deck slide
// where the static picture would sit. Owner asked for an interactive video
// teaching the Core words (2026-08-31); the deck's Play mode plus these scenes
// is that video, built from parts instead of rendered frames so a content fix
// never re-bills or re-records anything.
//
// Grade 1 pilot: the 21 concrete action verbs of the Grade 1 Core words, plus
// the two inflected forms that share a scene (ran -> run, said -> say). The
// grades share one word list with no cross-grade duplicates, so keying by lemma
// gates this to Grade 1 by construction. State verbs (like, want) are left to
// the meaning and sentence on purpose — a scene for "want" would be a scene of
// something else.
//
// Drawing rules, all inherited from the harder-won corners of this repo:
//
//  - The child is East African with natural hair and bright everyday clothes,
//    because english/assets/unit-8-home.png is the source of truth for how
//    people look in this course (the same rule word-pictures.js follows with
//    its skin-tone modifiers).
//  - SMIL (<animateTransform>/<animate>), not CSS keyframes: every deck slide
//    is in the DOM at once, so a scene may appear beside 40 siblings. SMIL
//    needs no stylesheet, no unique ids and no transform-origin arithmetic —
//    and it sidesteps the ebook kit's trap where a CSS transform animation
//    replaces the element's own transform attribute. Rotations always sit on
//    an inner group that carries NO transform attribute of its own.
//  - No <defs>, no id= anywhere. Ids would collide the moment two scenes (or
//    two copies of one scene after a redraw) share the document.
//  - prefers-reduced-motion strips every animation tag at build time, keeping
//    the still scene: the tableau reads (a child holding a cup IS "drink"),
//    it just stops moving. CSS cannot pause SMIL, so this is done here.
//  - A word with no honest scene has no entry, exactly as word-pictures.js
//    shows no picture. Guessing is the failure mode both files exist to stop.

const P = {
  skin: "#8a5a33",
  hair: "#2b1c12",
  shorts: "#3d4f63",
  red: "#e2504c",
  blue: "#2f7fd0",
  gold: "#f2a63b",
  green: "#3f9c5c",
  purple: "#8e6fc8",
  teal: "#2fa8a0",
  sky: "#eaf4fb",
  ground: "#dcecd2",
  sand: "#f0d9a6",
  water: "#9fd0ef",
  waterDeep: "#6fb3e0",
  line: "#20303f",
  bubble: "#ffffff",
  wood: "#a9713d",
  grey: "#93a3b1",
};

// ---------------------------------------------------------------- SMIL helpers
// values-based loops. `rot` spins about the LOCAL origin of the group it sits
// in, which is why every rotating part is authored with its pivot at (0,0).
const rot = (dur, vals, opts = "") =>
  `<animateTransform attributeName="transform" type="rotate" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${opts}/>`;
const shift = (dur, vals, opts = "") =>
  `<animateTransform attributeName="transform" type="translate" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${opts}/>`;
const grow = (dur, vals, opts = "") =>
  `<animateTransform attributeName="transform" type="scale" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${opts}/>`;
const fade = (dur, vals, opts = "") =>
  `<animate attributeName="opacity" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${opts}/>`;

// ---------------------------------------------------------------- the child
// Local space: feet on y=0, head top near y=-62. Arms hang from the shoulders
// at (±13,-30) and are drawn pointing DOWN, so rotate(180) points one straight
// up. Each arm is [attr-translate to shoulder] > [animation group, no attr
// transform] > [attr-rotate base pose holding the limb and anything in its
// hand] — the nesting that lets SMIL and the base pose compose instead of
// fight.
function face(mouth) {
  return `<circle cx="-4.5" cy="-2" r="1.7" fill="${P.line}"/><circle cx="4.5" cy="-2" r="1.7" fill="${P.line}"/>${
    mouth === "o"
      ? `<circle cx="0" cy="5.5" r="2.6" fill="#7c3f21"/>`
      : `<path d="M-4 4.5 Q0 8 4 4.5" fill="none" stroke="#7c3f21" stroke-width="1.8" stroke-linecap="round"/>`
  }`;
}

function head({ mouth = "smile", anim = "" } = {}) {
  return `<g transform="translate(0 -47)"><g>${anim}<circle r="13.5" fill="${P.skin}"/><path d="M-13.5 -1.5 a13.5 13.5 0 0 1 27 0 z" fill="${P.hair}"/>${face(mouth)}</g></g>`;
}

function arm(side, base, { anim = "", hold = "" } = {}) {
  const sx = side === "l" ? -13 : 13;
  const bend = side === "l" ? -3 : 3;
  return `<g transform="translate(${sx} -30)"><g>${anim}<g transform="rotate(${base})"><path d="M0 0 Q ${bend} 9 ${bend * 0.6} 17" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="${bend * 0.6}" cy="18.5" r="3.6" fill="${P.skin}"/>${hold}</g></g></g>`;
}

function legsStanding() {
  return `<path d="M-5 -8 L-7 -1" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><path d="M5 -8 L7 -1" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="-8" cy="0.5" rx="5.5" ry="3" fill="${P.line}"/><ellipse cx="8" cy="0.5" rx="5.5" ry="3" fill="${P.line}"/>`;
}

function legsHop() {
  // Standing on the left leg, right leg tucked up behind.
  return `<path d="M-4 -8 L-6 -1" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="-7" cy="0.5" rx="5.5" ry="3" fill="${P.line}"/><path d="M6 -9 Q13 -8 13 -16" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="14" cy="-17" rx="5" ry="3" fill="${P.line}" transform="rotate(-40 14 -17)"/>`;
}

function legsSeated() {
  return `<path d="M-5 -8 L4 -6 L4 1" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" transform="translate(-9 0)"/><path d="M-5 -8 L4 -6 L4 1" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 0)"/><ellipse cx="-4" cy="2.5" rx="5" ry="3" fill="${P.line}"/><ellipse cx="8" cy="2.5" rx="5" ry="3" fill="${P.line}"/>`;
}

function kid({
  x = 0, y = 0, s = 1, shirt = P.blue, mouth = "smile",
  armLBase = 8, armRBase = -8, armLAnim = "", armRAnim = "",
  armLHold = "", armRHold = "", headAnim = "", bodyAnim = "",
  legs = "stand", flip = false,
} = {}) {
  const legsHtml = legs === "hop" ? legsHop() : legs === "seated" ? legsSeated() : legsStanding();
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g>${bodyAnim}
    ${legsHtml}
    <rect x="-14" y="-37" width="28" height="31" rx="10" fill="${shirt}"/>
    ${arm("l", armLBase, { anim: armLAnim, hold: armLHold })}
    ${arm("r", armRBase, { anim: armRAnim, hold: armRHold })}
    ${head({ mouth, anim: headAnim })}
  </g></g>`;
}

// ---------------------------------------------------------------- scenery
function scene(inner, { sky = P.sky, ground = P.ground } = {}) {
  return `<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
    <rect x="0" y="0" width="260" height="170" rx="16" fill="${sky}"/>
    <path d="M0 132 H260 V152 Q260 170 242 170 H18 Q0 170 0 152 Z" fill="${ground}"/>
    ${inner}
  </svg>`;
}

const sun = (x = 222, y = 30) => `<circle cx="${x}" cy="${y}" r="13" fill="#ffd166"/><g transform="translate(${x} ${y})">${["0", "45", "90", "135"].map((a) => `<path d="M-19 0 H-15 M15 0 H19" stroke="#ffd166" stroke-width="3" stroke-linecap="round" transform="rotate(${a})"/>`).join("")}</g>`;

const speechBubble = (x, y, w, h, inner, anim = "") =>
  `<g transform="translate(${x} ${y})"><g>${anim}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="9" fill="${P.bubble}" stroke="${P.grey}" stroke-width="1.5"/><path d="M-6 ${h / 2 - 1} L0 ${h / 2 + 9} L6 ${h / 2 - 1} Z" fill="${P.bubble}" stroke="${P.grey}" stroke-width="1.5" stroke-linejoin="round"/><rect x="${-w / 2 + 2}" y="${h / 2 - 3}" width="${w - 4}" height="4" fill="${P.bubble}"/>${inner}</g></g>`;

const bubbleText = (text, size = 15) =>
  `<text x="0" y="${size * 0.36}" text-anchor="middle" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="${size}" font-weight="bold" fill="${P.line}">${text}</text>`;

const musicNote = (x, y, color, anim) =>
  `<g transform="translate(${x} ${y})"><g>${anim}<ellipse cx="0" cy="0" rx="4" ry="3" fill="${color}" transform="rotate(-20)"/><path d="M3.4 -1 V-14 q5 0 6 4" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/></g></g>`;

// ---------------------------------------------------------------- the scenes
const SCENES = {};

// run — legs scissor, motion lines stream behind.
SCENES.run = () => scene(`${sun()}
  <g transform="translate(64 96)">${[0, 14, 28].map((dy, i) => `<path d="M0 ${dy} H26" stroke="#b7cede" stroke-width="4" stroke-linecap="round">${fade(0.55, "0;1;0", `begin="${-i * 0.18}s"`)}</path>`).join("")}</g>
  <g transform="translate(140 149)"><g>${shift(0.28, "0 0;0 -3;0 0")}
    <g transform="translate(-4 -9)"><g>${rot(0.56, "-38 0 0;38 0 0;-38 0 0")}<path d="M0 0 Q2 8 1 15" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="1" cy="16.5" rx="5.5" ry="3" fill="${P.line}"/></g></g>
    <g transform="translate(4 -9)"><g>${rot(0.56, "38 0 0;-38 0 0;38 0 0")}<path d="M0 0 Q2 8 1 15" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="1" cy="16.5" rx="5.5" ry="3" fill="${P.line}"/></g></g>
    <g transform="rotate(12)"><rect x="-14" y="-40" width="28" height="32" rx="10" fill="${P.red}"/>
      <g transform="translate(-12 -33)"><g>${rot(0.56, "50 0 0;-30 0 0;50 0 0")}<path d="M0 0 Q-4 8 -3 15" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="-3" cy="16.5" r="3.6" fill="${P.skin}"/></g></g>
      <g transform="translate(12 -33)"><g>${rot(0.56, "-30 0 0;50 0 0;-30 0 0")}<path d="M0 0 Q4 8 3 15" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="3" cy="16.5" r="3.6" fill="${P.skin}"/></g></g>
      ${head()}
    </g>
  </g></g>`);

// jump — up and over a puddle, shadow shrinking underneath.
SCENES.jump = () => scene(`${sun()}
  <ellipse cx="130" cy="152" rx="30" ry="7" fill="${P.water}"/>
  <ellipse cx="130" cy="152" rx="20" ry="5" fill="#0a0a0a" opacity="0.12">${grow(1.6, "1 1;0.55 0.55;1 1")}</ellipse>
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.gold, mouth: "o",
    armLBase: 140, armRBase: -140,
    bodyAnim: shift(1.6, "0 0;0 0;0 -30;0 -30;0 0", 'keyTimes="0;0.2;0.45;0.6;1"') })}`);

// hop — quick one-legged bounces.
SCENES.hop = () => scene(`${sun()}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.green, legs: "hop",
    armLBase: -35, armRBase: 35,
    bodyAnim: shift(0.75, "0 0;0 -14;0 0", 'keyTimes="0;0.4;1"') })}`);

// swim — arm windmilling over the water.
SCENES.swim = () => scene(`
  <rect x="0" y="92" width="260" height="50" fill="${P.water}"/>
  <path d="M0 96 Q11 91 22 96 T44 96 T66 96 T88 96 T110 96 T132 96 T154 96 T176 96 T198 96 T220 96 T242 96 T264 96 T286 96 T308 96 V112 H0 Z" fill="#ffffff" opacity="0.35">${shift(1.6, "0 0;-44 0")}</path>
  <g transform="translate(84 86)"><g>${shift(1.6, "0 0;0 -3;0 0")}
    <path d="M-34 2 Q-6 -8 30 2 Q30 12 -2 12 Q-34 12 -34 2 Z" fill="${P.teal}"/>
    <g transform="translate(42 -6)"><circle r="12.5" fill="${P.skin}"/><path d="M-12.5 -1.5 a12.5 12.5 0 0 1 25 0 z" fill="${P.hair}"/><circle cx="3.5" cy="-1" r="1.7" fill="${P.line}"/><circle cx="9" cy="-1" r="1.7" fill="${P.line}"/><circle cx="7" cy="5.5" r="2.2" fill="#7c3f21"/></g>
    <g transform="translate(26 -3)"><g>${rot(1.1, "0 0 0;-360 0 0")}<path d="M0 0 Q7 -9 3 -19" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="3" cy="-20" r="3.6" fill="${P.skin}"/></g></g>
    ${[0, 1, 2].map((i) => `<circle cx="${58 + i * 8}" cy="${-14 - i * 3}" r="${2.6 - i * 0.5}" fill="#ffffff" opacity="0.9">${fade(0.9, "0;1;0", `begin="${-i * 0.3}s"`)}</circle>`).join("")}
  </g></g>`, { ground: P.sand });

// eat — the apple travels to the mouth.
SCENES.eat = () => scene(`${sun(38, 30)}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.purple, mouth: "o",
    armLBase: 12,
    armRBase: 0,
    armRAnim: rot(1.8, "-8 0 0;-135 0 0;-135 0 0;-8 0 0", 'keyTimes="0;0.35;0.6;1"'),
    armRHold: `<g transform="translate(2 22)"><circle r="6.5" fill="${P.red}"/><path d="M0 -6 Q1 -9 3 -10" fill="none" stroke="${P.green}" stroke-width="2" stroke-linecap="round"/></g>` })}`);

// drink — the cup tips up to the mouth.
SCENES.drink = () => scene(`${sun(38, 30)}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.teal, mouth: "o",
    armLBase: 12,
    armRBase: 0,
    armRAnim: rot(2, "-10 0 0;-128 0 0;-128 0 0;-10 0 0", 'keyTimes="0;0.35;0.65;1"'),
    armRHold: `<g transform="translate(2 22)"><path d="M-6 -7 L6 -7 L4.5 7 L-4.5 7 Z" fill="${P.gold}" stroke="#d88f22" stroke-width="1"/><path d="M-4 -7 L1 -16" stroke="${P.red}" stroke-width="2" stroke-linecap="round"/></g>` })}`);

// draw — a crayon lays a line down as we watch.
SCENES.draw = () => scene(`
  <rect x="128" y="52" width="92" height="72" rx="6" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <path d="M140 100 Q158 66 176 92 T208 84" fill="none" stroke="${P.red}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="110" stroke-dashoffset="110"><animate attributeName="stroke-dashoffset" values="110;0;0" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/></path>
  <g><animateMotion path="M140 100 Q158 66 176 92 T208 84 L140 100" keyPoints="0;0.72;1" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/><g transform="rotate(-35)"><rect x="-2.5" y="-16" width="5" height="14" rx="1.5" fill="${P.red}"/><path d="M-2.5 -2 L0 3 L2.5 -2 Z" fill="#b03a37"/></g></g>
  ${kid({ x: 84, y: 148, s: 1.15, shirt: P.blue, armLBase: 15, armRBase: -95 })}`);

// dig — the spade rocks into a mound of soil, crumbs hopping.
SCENES.dig = () => scene(`${sun()}
  <path d="M150 152 Q172 132 196 152 Z" fill="#8a6a48"/>
  ${[0, 1].map((i) => `<circle cx="${168 + i * 14}" cy="138" r="3" fill="#8a6a48">${shift(1.4, "0 0;0 -12;0 0", `begin="${-i * 0.5}s"`)}${fade(1.4, "0;1;0", `begin="${-i * 0.5}s"`)}</circle>`).join("")}
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.gold,
    armLBase: 20,
    armRBase: -55,
    armRAnim: rot(1.4, "-12 0 0;16 0 0;-12 0 0"),
    armRHold: `<g transform="translate(2 20) rotate(115)"><rect x="-1.8" y="-2" width="3.6" height="26" rx="1.8" fill="${P.wood}"/><path d="M-7 24 H7 L5 36 Q0 40 -5 36 Z" fill="${P.grey}"/></g>` })}`);

// dip — bread down into the bowl and back, ripples spreading.
SCENES.dip = () => scene(`
  <path d="M148 118 H232 V126 Q232 132 226 132 H154 Q148 132 148 126 Z" fill="${P.wood}"/>
  <path d="M162 104 Q162 118 190 118 Q218 118 218 104 Q204 110 190 110 Q176 110 162 104 Z" fill="#fff1d6" stroke="#e0b96a" stroke-width="2"/>
  <ellipse cx="190" cy="106" rx="24" ry="5" fill="#f2c94c"/>
  <g transform="translate(190 106)"><g>${grow(1.9, "0.4 0.4;1 1;0.4 0.4")}${fade(1.9, "0.9;0;0.9")}<ellipse rx="14" ry="3" fill="none" stroke="#d88f22" stroke-width="1.6"/></g></g>
  ${kid({ x: 110, y: 148, s: 1.15, shirt: P.red, mouth: "o",
    armLBase: 15,
    armRBase: -70,
    armRAnim: rot(1.9, "-16 0 0;14 0 0;-16 0 0"),
    armRHold: `<rect x="-1" y="18" width="14" height="8" rx="4" transform="rotate(-50 2 22)" fill="${P.gold}" stroke="#d88f22" stroke-width="1.2"/>` })}`);

// sit — standing fades into sitting on the chair, and back.
SCENES.sit = () => scene(`
  <g transform="translate(150 148)"><rect x="-4" y="-52" width="44" height="8" rx="3" fill="${P.wood}"/><rect x="-4" y="-30" width="44" height="7" rx="3" fill="${P.wood}"/><rect x="-2" y="-26" width="5" height="26" fill="${P.wood}"/><rect x="33" y="-52" width="5" height="52" fill="${P.wood}"/></g>
  <g opacity="0">${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.45;0.93;1"')}${kid({ x: 116, y: 148, s: 1.15, shirt: P.green })}</g>
  <g>${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.45;0.93;1"')}${kid({ x: 158, y: 124, s: 1.15, shirt: P.green, legs: "seated" })}</g>`);

// sing — mouth open, notes rising and melting away.
SCENES.sing = () => scene(`${sun(38, 30)}
  ${[[168, 92, P.red, 0], [186, 104, P.blue, 0.7], [176, 74, P.green, 1.4]].map(([x, y, c, b]) =>
    musicNote(x, y, c, `${shift(2.1, "0 6;0 -18", `begin="${-b}s"`)}${fade(2.1, "0;1;0", `begin="${-b}s"`)}`)).join("")}
  ${kid({ x: 118, y: 148, s: 1.15, shirt: P.purple, mouth: "o",
    armLBase: -35, armRBase: -140,
    bodyAnim: shift(1.6, "0 0;0 -2;0 0") })}`);

// say — a bright hello pops out.
SCENES.say = () => scene(`${sun()}
  ${speechBubble(176, 62, 62, 34, bubbleText("Hi!", 17), `${grow(1.8, "0.85 0.85;1 1;1 1;0.85 0.85", 'keyTimes="0;0.2;0.8;1"')}${fade(1.8, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"')}`)}
  ${kid({ x: 118, y: 148, s: 1.15, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -120 })}`);

// tell — the big one tells, the little one listens and nods.
SCENES.tell = () => scene(`
  ${speechBubble(96, 52, 58, 32, `<circle cx="-12" cy="0" r="5" fill="${P.gold}"/><path d="M2 -6 L4 -1 L9 -1 L5 2 L7 7 L2 4 L-3 7 L-1 2 L-5 -1 L0 -1 Z" fill="${P.purple}"/>`, fade(2.6, "0;1;1;0", 'keyTimes="0;0.12;0.88;1"'))}
  ${kid({ x: 96, y: 148, s: 1.2, shirt: P.teal, mouth: "o", armLBase: 15, armRBase: -95 })}
  ${kid({ x: 172, y: 148, s: 0.95, shirt: P.gold, flip: true, armLBase: 10, armRBase: -10,
    headAnim: rot(1.3, "-6 0 -47;6 0 -47;-6 0 -47") })}`);

// chat — two friends, bubbles taking turns.
SCENES.chat = () => scene(`
  ${speechBubble(84, 56, 44, 28, bubbleText("...", 16), fade(3, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${speechBubble(176, 56, 44, 28, bubbleText("...", 16), fade(3, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.red, mouth: "o", armLBase: 12, armRBase: -70 })}
  ${kid({ x: 166, y: 148, s: 1.1, shirt: P.green, mouth: "o", flip: true, armLBase: 12, armRBase: -70 })}`);

// look — hand shading the eyes, head sweeping, a butterfly to find.
SCENES.look = () => scene(`${sun(38, 30)}
  <g transform="translate(196 64)"><g>${shift(3.4, "0 0;10 -10;0 -18;-8 -8;0 0")}<ellipse cx="-4" cy="0" rx="5" ry="7" fill="${P.purple}" transform="rotate(24)"><animateTransform attributeName="transform" type="rotate" values="0;30;0" dur="0.3s" repeatCount="indefinite" additive="sum"/></ellipse><ellipse cx="4" cy="0" rx="5" ry="7" fill="${P.gold}" transform="rotate(-24)"><animateTransform attributeName="transform" type="rotate" values="0;-30;0" dur="0.3s" repeatCount="indefinite" additive="sum"/></ellipse><rect x="-1.2" y="-6" width="2.4" height="12" rx="1.2" fill="${P.line}"/></g></g>
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.gold,
    armLBase: 15, armRBase: -178,
    headAnim: rot(3.4, "-8 0 -47;9 0 -47;-8 0 -47") })}`);

// see — the eye finds the bird; the sight-line draws itself.
SCENES.see = () => scene(`${sun(38, 30)}
  <path d="M128 96 L196 62" stroke="${P.grey}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"><animate attributeName="stroke-dashoffset" values="80;0" dur="2.2s" repeatCount="indefinite"/></path>
  <g transform="translate(206 58)"><path d="M0 0 Q6 -3 10 1 Q6 4 0 2 Q-7 6 -12 3 Q-8 -1 0 0 Z" fill="${P.teal}"/><circle cx="8" cy="-1" r="3.4" fill="${P.teal}"/><path d="M10.5 -1.5 L14 -0.5 L10.5 0.8 Z" fill="${P.gold}"/><g transform="translate(-3 0)"><g>${rot(0.45, "-24 0 0;18 0 0;-24 0 0")}<path d="M0 0 Q-4 -8 -10 -9 Q-4 -3 0 0 Z" fill="${P.green}"/></g></g></g>
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.blue, armLBase: 15, armRBase: -68 })}`);

// play — a kick, and the ball bounces off and rolls home.
SCENES.play = () => scene(`${sun()}
  <g transform="translate(158 144)"><g>${shift(1.7, "0 0;30 -16;58 0;0 0", 'keyTimes="0;0.3;0.55;1"')}<g>${rot(1.7, "0 0 0;360 0 0")}<circle r="9" fill="#ffffff" stroke="${P.line}" stroke-width="1.6"/><path d="M0 -9 L0 9 M-9 0 L9 0" stroke="${P.line}" stroke-width="1.2" opacity="0.5"/><circle r="3.4" fill="${P.line}"/></g></g></g>
  <g transform="translate(122 149)">
    <path d="M-4 -9 L-6 -2" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="-7" cy="-0.5" rx="5.5" ry="3" fill="${P.line}"/>
    <g transform="translate(5 -9)"><g>${rot(1.7, "-30 0 0;42 0 0;-30 0 0;-30 0 0", 'keyTimes="0;0.18;0.5;1"')}<path d="M0 0 Q3 7 3 13" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="4" cy="14.5" rx="5.5" ry="3" fill="${P.line}"/></g></g>
    <rect x="-14" y="-41" width="28" height="32" rx="10" fill="${P.red}"/>
    <g transform="translate(-13 -34)"><g>${rot(1.7, "20 0 0;-25 0 0;20 0 0", 'keyTimes="0;0.18;1"')}<path d="M0 0 Q-3 9 -2 17" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="-2" cy="18.5" r="3.6" fill="${P.skin}"/></g></g>
    <g transform="translate(13 -34)"><g>${rot(1.7, "-20 0 0;25 0 0;-20 0 0", 'keyTimes="0;0.18;1"')}<path d="M0 0 Q3 9 2 17" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="2" cy="18.5" r="3.6" fill="${P.skin}"/></g></g>
    <g transform="translate(0 -4)">${head()}</g>
  </g>`);

// hit — the bat swings and the ball flies.
SCENES.hit = () => scene(`${sun(38, 30)}
  <g transform="translate(158 108)"><g>${shift(1.9, "0 0;0 0;52 -26;52 -26", 'keyTimes="0;0.3;0.55;1"')}${fade(1.9, "1;1;1;0", 'keyTimes="0;0.3;0.55;1"')}<circle r="6.5" fill="#ffffff" stroke="${P.line}" stroke-width="1.5"/></g></g>
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.green, mouth: "o",
    armLBase: 15,
    armRBase: -40,
    armRAnim: rot(1.9, "30 0 0;30 0 0;-70 0 0;30 0 0", 'keyTimes="0;0.28;0.45;1"'),
    armRHold: `<g transform="translate(2 20) rotate(-150)"><rect x="-2.5" y="0" width="5" height="10" rx="2.5" fill="#8a5a33"/><rect x="-4" y="9" width="8" height="28" rx="4" fill="${P.wood}"/></g>` })}`);

// make — blocks stack themselves into a tower.
SCENES.make = () => scene(`
  <g transform="translate(178 148)">
    <rect x="-15" y="-15" width="30" height="15" rx="3" fill="${P.red}"/>
    <g>${fade(3, "0;1;1;1;0", 'keyTimes="0;0.25;0.3;0.92;1"')}${shift(3, "0 -14;0 0;0 0", 'keyTimes="0;0.25;1"')}<rect x="-13" y="-29" width="26" height="14" rx="3" fill="${P.gold}"/></g>
    <g>${fade(3, "0;0;1;1;0", 'keyTimes="0;0.45;0.62;0.92;1"')}${shift(3, "0 -14;0 -14;0 0;0 0", 'keyTimes="0;0.45;0.62;1"')}<rect x="-11" y="-42" width="22" height="13" rx="3" fill="${P.green}"/></g>
  </g>
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.blue, armLBase: 15,
    armRBase: -60, armRAnim: rot(3, "-15 0 0;12 0 0;-15 0 0;12 0 0;-15 0 0") })}`);

// ring — the handbell shakes and the sound spreads.
SCENES.ring = () => scene(`${sun(38, 30)}
  <g transform="translate(186 78)">${[0, 1, 2].map((i) => `<path d="M${8 + i * 9} -12 A ${14 + i * 9} ${14 + i * 9} 0 0 1 ${8 + i * 9} 12" fill="none" stroke="${P.gold}" stroke-width="2.6" stroke-linecap="round">${fade(1.2, "0;1;0", `begin="${-i * 0.4}s"`)}</path>`).join("")}</g>
  ${kid({ x: 124, y: 148, s: 1.15, shirt: P.red, mouth: "o",
    armLBase: 15,
    armRBase: -95,
    armRAnim: rot(0.5, "-10 0 0;10 0 0;-10 0 0"),
    armRHold: `<g transform="translate(2 22)"><path d="M-8 6 Q-8 -8 0 -8 Q8 -8 8 6 Z" fill="${P.gold}" stroke="#d88f22" stroke-width="1.4"/><rect x="-9" y="5" width="18" height="3.4" rx="1.7" fill="#d88f22"/><circle cx="0" cy="10.5" r="2.6" fill="${P.line}"/><rect x="-1.6" y="-13" width="3.2" height="6" rx="1.6" fill="${P.wood}"/></g>` })}`);

// come — one friend beckons, the other hurries over.
SCENES.come = () => scene(`${sun()}
  <g>${shift(2.6, "0 0;44 0;44 0", 'keyTimes="0;0.75;1"')}${fade(2.6, "1;1;0", 'keyTimes="0;0.75;1"')}
    ${kid({ x: 58, y: 148, s: 1.05, shirt: P.purple, armLBase: 25, armRBase: -25, bodyAnim: shift(0.4, "0 0;0 -3;0 0") })}
  </g>
  ${kid({ x: 190, y: 148, s: 1.15, shirt: P.gold, mouth: "o", flip: true, armLBase: 12,
    armRBase: -150, armRAnim: rot(0.9, "-14 0 0;16 0 0;-14 0 0") })}`);

// The two Grade 1 inflected forms keep the base word's scene: the deck slide
// for "ran" shows running, which is what the word says happened.
SCENES.ran = () => SCENES.run();
SCENES.said = () => SCENES.say();

// ---------------------------------------------------------------- exports
// SMIL cannot be paused from CSS, so reduced motion is honoured here: the
// animation tags are stripped and the still tableau remains. Read once — the
// preference changing mid-session repaints on the next slide draw anyway.
const REDUCED_MOTION = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function coreWordScene(lemma) {
  const build = SCENES[String(lemma || "").toLowerCase()];
  if (!build) return "";
  const svg = build();
  return REDUCED_MOTION ? svg.replace(/<animate(?:Transform|Motion)?\b[^>]*\/>/g, "").replace(/<animate(?:Transform|Motion)?\b[^>]*>[\s\S]*?<\/animate(?:Transform|Motion)?>/g, "") : svg;
}
