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

function head({ mouth = "smile", anim = "", hair = P.hair } = {}) {
  return `<g transform="translate(0 -47)"><g>${anim}<circle r="13.5" fill="${P.skin}"/><path d="M-13.5 -1.5 a13.5 13.5 0 0 1 27 0 z" fill="${hair}"/>${face(mouth)}</g></g>`;
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
  legs = "stand", flip = false, hair = P.hair,
} = {}) {
  const legsHtml = legs === "hop" ? legsHop() : legs === "seated" ? legsSeated() : legsStanding();
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g>${bodyAnim}
    ${legsHtml}
    <rect x="-14" y="-37" width="28" height="31" rx="10" fill="${shirt}"/>
    ${arm("l", armLBase, { anim: armLAnim, hold: armLHold })}
    ${arm("r", armRBase, { anim: armRAnim, hold: armRHold })}
    ${head({ mouth, anim: headAnim, hair })}
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

// ================================================================ Grades 2-4
// The second tranche (owner, 2026-08-31): every concrete action verb of the
// Grade 2-4 Core words — 56, 45 and 44 scenes. The state and mental verbs are
// deliberately absent, as at Grade 1: hope, know, need, think (G2); agree,
// annoy, believe, dare, decide, enjoy, happen, imagine, promise, remember,
// understand (G3); accept, become, belong, cause, continue, forgive, improve,
// manage, notice, predict, respect, trust, wonder (G4) — a scene for "believe"
// would be a scene of something else. "beginning" and "pound" are skipped too:
// their dictionary tags say verb while their taught senses look nominal, the
// same defect class as king/mouth (flagged, not fixed here).

// ------------------------------------------------- shared props and builders
const tableProp = (x, y, w = 84) => `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="0" width="${w}" height="7" rx="3" fill="${P.wood}"/><rect x="${-w / 2 + 6}" y="7" width="5" height="22" fill="${P.wood}"/><rect x="${w / 2 - 11}" y="7" width="5" height="22" fill="${P.wood}"/></g>`;
const doorProp = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-22" y="-62" width="44" height="62" rx="3" fill="${P.wood}" stroke="#7d5227" stroke-width="2"/><circle cx="13" cy="-30" r="2.6" fill="#f2c94c"/></g>`;
const openBook = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-24 0 Q-12 -7 0 0 Q12 -7 24 0 L24 16 Q12 10 0 16 Q-12 10 -24 16 Z" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.6"/><path d="M0 0 V16" stroke="${P.grey}" stroke-width="1.2"/>${[3, 7, 11].map((ly) => `<path d="M-19 ${ly} H-5 M5 ${ly} H19" stroke="#c6d2dc" stroke-width="1.6"/>`).join("")}</g>`;
const boxProp = (x, y, w, h, color, extra = "") => `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="1.4"/>${extra}</g>`;
const football = (r = 9) => `<circle r="${r}" fill="#ffffff" stroke="${P.line}" stroke-width="1.6"/><circle r="${r * 0.38}" fill="${P.line}"/>`;
const envelopeProp = (s = 1) => `<g transform="scale(${s})"><rect x="-13" y="-9" width="26" height="18" rx="2" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.5"/><path d="M-13 -9 L0 2 L13 -9" fill="none" stroke="${P.grey}" stroke-width="1.5"/></g>`;
const puppyProp = (tailAnim = "") => `<g><ellipse cx="0" cy="-8" rx="13" ry="9" fill="#c8965c"/><circle cx="12" cy="-14" r="7.5" fill="#c8965c"/><circle cx="14.5" cy="-15" r="1.4" fill="${P.line}"/><ellipse cx="18" cy="-12.5" rx="2.6" ry="1.8" fill="#8a5a33"/><path d="M8 -20 Q6 -26 10 -26 Q13 -22 12 -19 Z" fill="#8a5a33"/><path d="M-6 -2 V0 M4 -2 V0" stroke="#8a5a33" stroke-width="3.4" stroke-linecap="round"/><g transform="translate(-12 -12)"><g>${tailAnim}<path d="M0 0 Q-7 -4 -8 -10" fill="none" stroke="#c8965c" stroke-width="4" stroke-linecap="round"/></g></g></g>`;
const sparkle = (x, y, s, color, anim = "") => `<g transform="translate(${x} ${y}) scale(${s})"><g>${anim}<path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" fill="${color}"/></g></g>`;

// A kid beside a board that carries the word's content — the desk family
// (reading, writing, arithmetic). The board is the draw scene's paper, kept at
// its size and place so the family reads as one furniture set.
const boardScene = (boardInner, { shirt = P.blue, mouth = "smile", armR = -95, extra = "" } = {}) => scene(`
  <rect x="128" y="46" width="96" height="74" rx="6" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <g transform="translate(176 83)">${boardInner}</g>${extra}
  ${kid({ x: 84, y: 148, s: 1.15, shirt, mouth, armLBase: 12, armRBase: armR })}`);
const boardText = (text, size = 20, color = P.line, dy = 0) => `<text x="0" y="${dy + size * 0.36}" text-anchor="middle" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="${size}" font-weight="bold" fill="${color}">${text}</text>`;

// One kid speaking — the bubble family. What is in the bubble is the word.
const bubbleScene = (bubbleInner, { shirt = P.blue, w = 58, h = 32, anim = null, armR = -120, mouth = "o", extra = "" } = {}) => scene(`${sun()}
  ${speechBubble(178, 60, w, h, bubbleInner, anim === null ? fade(2.2, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"') : anim)}${extra}
  ${kid({ x: 118, y: 148, s: 1.15, shirt, mouth, armLBase: 12, armRBase: armR })}`);

// ------------------------------------------------------------ Grade 2 scenes
// add — the answer arrives on the board.
SCENES.add = () => boardScene(`${boardText("2 + 3", 20, P.line, -12)}<g>${fade(2.4, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}${boardText("= 5", 22, P.green, 16)}</g>`, { shirt: P.gold });

// ask — a question mark pops up.
SCENES.ask = () => bubbleScene(bubbleText("?", 20), { shirt: P.teal, w: 40, h: 30 });

// bring — carrying the box over to the table.
SCENES.bring = () => scene(`${sun(38, 30)}${tableProp(206, 120)}
  <g>${shift(2.6, "0 0;58 0;58 0", 'keyTimes="0;0.7;1"')}${fade(2.6, "1;1;0", 'keyTimes="0;0.8;1"')}
    ${kid({ x: 92, y: 148, s: 1.1, shirt: P.red, armLBase: -62, armRBase: 62, bodyAnim: shift(0.45, "0 0;0 -2;0 0") })}
    ${boxProp(92, 139, 28, 20, P.gold)}
  </g>`);

// burn — the candle flame dances.
SCENES.burn = () => scene(`${tableProp(160, 118)}
  <g transform="translate(160 118)"><rect x="-7" y="-30" width="14" height="30" rx="3" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/><path d="M0 -30 V-34" stroke="${P.line}" stroke-width="1.6"/><g transform="translate(0 -40)"><g>${grow(0.5, "1 1;1.15 0.85;1 1")}<path d="M0 -8 Q6 0 0 7 Q-6 0 0 -8 Z" fill="${P.gold}"/><path d="M0 -3 Q3 1 0 4 Q-3 1 0 -3 Z" fill="${P.red}"/></g></g></g>
  ${kid({ x: 84, y: 148, s: 1.1, shirt: P.purple, mouth: "o", armLBase: 10, armRBase: -60 })}`);

// buy — a coin for an apple at the shop table.
SCENES.buy = () => scene(`${tableProp(170, 118)}
  <circle cx="188" cy="112" r="7" fill="${P.red}"/><path d="M188 -0 " fill="none"/>
  <g transform="translate(150 96)"><g>${shift(2.2, "0 0;12 14;12 14;0 0", 'keyTimes="0;0.4;0.7;1"')}<circle r="6" fill="#f2c94c" stroke="#d8a01f" stroke-width="1.6"/>${boardText("1", 9)}</g></g>
  ${kid({ x: 98, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -80 })}`);

// call — cupped hands and a name, loudly.
SCENES.call = () => bubbleScene(bubbleText("Amal!", 14), { shirt: P.red, w: 66, h: 30, armR: -140, extra: `<g transform="translate(196 84)">${[0, 1].map((i) => `<path d="M${6 + i * 8} -10 A ${12 + i * 8} ${12 + i * 8} 0 0 1 ${6 + i * 8} 10" fill="none" stroke="${P.gold}" stroke-width="2.4" stroke-linecap="round">${fade(1.1, "0;1;0", `begin="${-i * 0.4}s"`)}</path>`).join("")}</g>` });

// carry — the box rides in both arms, step by step. The box is drawn free in
// front of the child rather than inside the rotated arm group — inherited arm
// rotation walked it onto the chest, invisibly (found on the contact sheet).
SCENES.carry = () => scene(`${sun()}
  <g>${shift(2.2, "-12 0;12 0;-12 0")}
    ${kid({ x: 130, y: 148, s: 1.15, shirt: P.green, armLBase: -58, armRBase: 58, bodyAnim: shift(0.55, "0 0;0 -2;0 0") })}
    ${boxProp(130, 138, 34, 24, P.purple)}
  </g>`);

// catch — the ball drops into waiting hands.
SCENES.catch = () => scene(`${sun(38, 30)}
  <g transform="translate(176 56)"><g>${shift(1.7, "0 0;-44 66;-44 66;0 0", 'keyTimes="0;0.45;0.75;1"')}${fade(1.7, "1;1;1;0", 'keyTimes="0;0.45;0.9;1"')}${football()}</g></g>
  ${kid({ x: 128, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 130, armRBase: -130 })}`);

// clap — hands meet in the middle, with a spark.
SCENES.clap = () => scene(`${sun()}
  ${sparkle(130, 96, 1, P.gold, fade(0.7, "0;1;0"))}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.red, mouth: "o",
    armLBase: 60, armLAnim: rot(0.7, "0 0 0;28 0 0;0 0 0"),
    armRBase: -60, armRAnim: rot(0.7, "0 0 0;-28 0 0;0 0 0") })}`);

// close — the lid swings shut on the box.
SCENES.close = () => scene(`${tableProp(172, 118)}
  ${boxProp(172, 118, 44, 26, P.teal)}
  <g transform="translate(150 92)"><g>${rot(2.4, "-70 0 0;-70 0 0;0 0 0;0 0 0", 'keyTimes="0;0.3;0.55;1"')}<rect x="0" y="-5" width="44" height="6" rx="2" fill="#26847d"/></g></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -75 })}`);

// count — one, two, three apples.
SCENES.count = () => boardScene(`${[-24, 0, 24].map((dx, i) => `<g>${fade(2.7, "0;0;1;1", `keyTimes="0;${(0.15 + i * 0.22).toFixed(2)};${(0.25 + i * 0.22).toFixed(2)};1"`)}<circle cx="${dx}" cy="-8" r="8" fill="${P.red}"/>${boardText(String(i + 1), 13, P.line, 14).replace('x="0"', `x="${dx}"`)}</g>`).join("")}`, { shirt: P.teal, mouth: "o" });

// cut — scissors open and shut along the dotted line.
SCENES.cut = () => scene(`
  <rect x="96" y="70" width="110" height="52" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <path d="M96 96 H206" stroke="${P.grey}" stroke-width="1.6" stroke-dasharray="5 5"/>
  <g><animateMotion path="M110 96 H186 H110" dur="3.4s" repeatCount="indefinite"/><g transform="rotate(-90)"><g>${rot(0.5, "-16 6 0;16 6 0;-16 6 0")}<path d="M6 0 L26 6" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round"/><circle cx="3" cy="3" r="3.4" fill="none" stroke="${P.red}" stroke-width="2.4"/></g><g>${rot(0.5, "16 6 0;-16 6 0;16 6 0")}<path d="M6 0 L26 -6" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round"/><circle cx="3" cy="-3" r="3.4" fill="none" stroke="${P.red}" stroke-width="2.4"/></g></g></g>
  ${kid({ x: 60, y: 148, s: 1.05, shirt: P.gold, armLBase: 12, armRBase: -85 })}`);

// find — lift the leaf, and there it is!
SCENES.find = () => scene(`${sun(38, 30)}
  ${sparkle(178, 128, 1.1, P.gold, fade(2.4, "0;0;1;1;0", 'keyTimes="0;0.35;0.5;0.85;1"'))}
  <g transform="translate(196 138)"><g>${rot(2.4, "0 -18 0;0 -18 0;-55 -18 0;-55 -18 0;0 -18 0", 'keyTimes="0;0.25;0.4;0.85;1"')}<path d="M-18 0 Q0 -14 18 0 Q0 8 -18 0 Z" fill="${P.green}"/></g></g>
  ${kid({ x: 118, y: 148, s: 1.15, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -60 })}`);

// finish — through the ribbon with arms up.
SCENES.finish = () => scene(`
  <rect x="186" y="76" width="5" height="76" fill="${P.wood}"/><rect x="64" y="76" width="5" height="76" fill="${P.wood}"/>
  <path d="M69 96 H186" stroke="${P.red}" stroke-width="5" stroke-linecap="round"/>
  ${kid({ x: 126, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 145, armRBase: -145, bodyAnim: shift(0.9, "0 0;0 -6;0 0") })}`);

// give — the present passes from one friend to the other.
SCENES.give = () => scene(`${sun(38, 30)}
  <g transform="translate(112 96)"><g>${shift(2.4, "0 0;38 0;38 0;0 0", 'keyTimes="0;0.45;0.8;1"')}${boxProp(0, 10, 22, 16, P.red, `<path d="M-11 -8 H11 M0 -16 V0" stroke="${P.gold}" stroke-width="2.6"/>`)}</g></g>
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -85 })}
  ${kid({ x: 176, y: 148, s: 1.1, shirt: P.green, flip: true, armLBase: 12, armRBase: -85 })}`);

// grow — sprout to flower, with the sun on it.
SCENES.grow = () => scene(`${sun(38, 30)}
  <path d="M118 152 Q152 146 186 152 Z" fill="#8a6a48"/>
  <g>${fade(3.6, "1;1;0;0;0;1", 'keyTimes="0;0.28;0.34;0.62;0.95;1"')}<path d="M152 148 Q150 138 152 132" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round"/><path d="M152 138 Q146 136 144 131" fill="none" stroke="${P.green}" stroke-width="2.6" stroke-linecap="round"/></g>
  <g opacity="0">${fade(3.6, "0;0;1;1;0;0", 'keyTimes="0;0.3;0.36;0.6;0.66;1"')}<path d="M152 148 Q150 128 152 116" fill="none" stroke="${P.green}" stroke-width="3.4" stroke-linecap="round"/><path d="M152 132 Q143 129 141 122 Z" fill="${P.green}"/><path d="M152 126 Q161 123 163 116 Z" fill="${P.green}"/></g>
  <g opacity="0">${fade(3.6, "0;0;1;1;0", 'keyTimes="0;0.6;0.68;0.95;1"')}<path d="M152 148 Q150 120 152 102" fill="none" stroke="${P.green}" stroke-width="3.6" stroke-linecap="round"/><path d="M152 128 Q141 125 139 117 Z" fill="${P.green}"/><path d="M152 120 Q163 117 165 109 Z" fill="${P.green}"/><g transform="translate(152 96)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-8" rx="4.5" ry="7" fill="${P.purple}" transform="rotate(${a})"/>`).join("")}<circle r="5" fill="${P.gold}"/></g></g>`);

// hear — the bell's sound arrives at a listening ear.
SCENES.hear = () => scene(`
  <g transform="translate(66 66)"><g>${rot(0.6, "-12 0 -10;12 0 -10;-12 0 -10")}<path d="M-11 8 Q-11 -10 0 -10 Q11 -10 11 8 Z" fill="${P.gold}" stroke="#d88f22" stroke-width="1.4"/><circle cx="0" cy="10" r="3" fill="${P.line}"/></g></g>
  ${[0, 1, 2].map((i) => `<path d="M${86 + i * 16} ${58 + i * 6} q8 8 2 18" fill="none" stroke="${P.gold}" stroke-width="2.4" stroke-linecap="round">${fade(1.2, "0;1;0", `begin="${-i * 0.4}s"`)}</path>`).join("")}
  ${kid({ x: 168, y: 148, s: 1.15, shirt: P.teal, armLBase: -170, armRBase: -8, headAnim: rot(1.6, "-5 0 -47;3 0 -47;-5 0 -47") })}`);

// help — a hand up for a friend who fell.
SCENES.help = () => scene(`${sun(38, 30)}
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -78, bodyAnim: shift(1.8, "0 0;0 -2;0 0") })}
  <g>${fade(2.8, "1;1;0;0;1", 'keyTimes="0;0.4;0.48;0.92;1"')}<g transform="translate(178 136)"><ellipse cx="0" cy="8" rx="16" ry="6" fill="rgba(0,0,0,0.07)"/>${kid({ x: 0, y: 4, s: 0.9, shirt: P.gold, flip: true, legs: "seated", armLBase: 12, armRBase: -85, mouth: "o" })}</g></g>
  <g opacity="0">${fade(2.8, "0;0;1;1;0", 'keyTimes="0;0.4;0.48;0.92;1"')}${kid({ x: 172, y: 148, s: 1.05, shirt: P.gold, flip: true, armLBase: 12, armRBase: -85 })}</g>`);

// hold — the teddy stays hugged tight.
SCENES.hold = () => scene(`${sun()}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.purple, armLBase: -52, armRBase: 52,
    armRHold: `<g transform="translate(0 24)"><circle cy="-8" r="7" fill="#c8965c"/><circle cx="-5" cy="-13" r="2.6" fill="#c8965c"/><circle cx="5" cy="-13" r="2.6" fill="#c8965c"/><ellipse cy="2" rx="8" ry="7" fill="#c8965c"/><circle cx="-2" cy="-9" r="1" fill="${P.line}"/><circle cx="2" cy="-9" r="1" fill="${P.line}"/></g>`,
    bodyAnim: shift(1.8, "0 0;0 -3;0 0") })}`);

// hurt — a sore knee, and a plaster already on it.
SCENES.hurt = () => scene(`
  <ellipse cx="150" cy="150" rx="26" ry="7" fill="rgba(0,0,0,0.07)"/>
  ${kid({ x: 150, y: 146, s: 1.15, shirt: P.teal, legs: "seated", mouth: "o", armLBase: 45, armRBase: -45, headAnim: rot(2.2, "8 0 -47;8 0 -47") })}
  <g transform="translate(160 143) rotate(-24)"><rect x="-11" y="-4.6" width="22" height="9.2" rx="4.6" fill="#f2c9a0" stroke="#d8a878" stroke-width="1.2"/><circle r="1.2" fill="#d8a878"/><circle cx="-5" r="1.2" fill="#d8a878"/><circle cx="5" r="1.2" fill="#d8a878"/></g>
  ${[0, 1].map((i) => `${sparkle(186 + i * 12, 118 - i * 12, 0.7, P.gold, fade(1.3, "0;1;0", `begin="${-i * 0.5}s"`))}`).join("")}`);

// keep — the treasure box holds what is yours.
SCENES.keep = () => scene(`
  ${boxProp(166, 132, 52, 30, P.wood, `<rect x="-26" y="-36" width="52" height="8" rx="3" fill="#7d5227"/><circle cy="-14" r="3" fill="${P.gold}"/>`)}
  <g transform="translate(166 96)"><g>${shift(2, "0 0;0 -4;0 0")}<circle cy="-8" r="7" fill="#c8965c"/><circle cx="-5" cy="-13" r="2.6" fill="#c8965c"/><circle cx="5" cy="-13" r="2.6" fill="#c8965c"/><circle cx="-2" cy="-9" r="1" fill="${P.line}"/><circle cx="2" cy="-9" r="1" fill="${P.line}"/></g></g>
  <path d="M196 76 a5 5 0 0 1 10 0 q0 5 -5 8 q-5 -3 -5 -8 Z" fill="${P.red}">${fade(2, "0.4;1;0.4")}</path>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -70 })}`);

// kick — the ball flies clean off the boot.
SCENES.kick = () => scene(`${sun(38, 30)}
  <g transform="translate(158 144)"><g>${shift(1.7, "0 0;0 0;62 -34;62 -34", 'keyTimes="0;0.2;0.5;1"')}${fade(1.7, "1;1;1;0", 'keyTimes="0;0.2;0.75;1"')}${football()}</g></g>
  <g transform="translate(122 149)">
    <path d="M-4 -9 L-6 -2" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="-7" cy="-0.5" rx="5.5" ry="3" fill="${P.line}"/>
    <g transform="translate(5 -9)"><g>${rot(1.7, "-32 0 0;44 0 0;-32 0 0;-32 0 0", 'keyTimes="0;0.2;0.55;1"')}<path d="M0 0 Q3 7 3 13" fill="none" stroke="${P.skin}" stroke-width="7" stroke-linecap="round"/><ellipse cx="4" cy="14.5" rx="5.5" ry="3" fill="${P.line}"/></g></g>
    <rect x="-14" y="-41" width="28" height="32" rx="10" fill="${P.blue}"/>
    <g transform="translate(-13 -34)"><g>${rot(1.7, "22 0 0;-25 0 0;22 0 0", 'keyTimes="0;0.2;1"')}<path d="M0 0 Q-3 9 -2 17" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="-2" cy="18.5" r="3.6" fill="${P.skin}"/></g></g>
    <g transform="translate(13 -34)"><g>${rot(1.7, "-22 0 0;25 0 0;-22 0 0", 'keyTimes="0;0.2;1"')}<path d="M0 0 Q3 9 2 17" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/><circle cx="2" cy="18.5" r="3.6" fill="${P.skin}"/></g></g>
    <g transform="translate(0 -4)">${head({ mouth: "o" })}</g>
  </g>`);

// laugh — rocking with ha-ha in the air.
SCENES.laugh = () => scene(`${sun()}
  ${speechBubble(176, 58, 62, 30, bubbleText("ha ha!", 13), fade(1.6, "0.4;1;0.4"))}
  ${kid({ x: 120, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: -50, armRBase: 50,
    bodyAnim: rot(0.8, "-4 0 -20;4 0 -20;-4 0 -20") })}`);

// learn — the book goes in, the idea lights up.
SCENES.learn = () => scene(`${tableProp(150, 122)}${openBook(150, 104)}
  <g transform="translate(108 56)"><g>${fade(2.4, "0;0;1;1;0", 'keyTimes="0;0.4;0.55;0.9;1"')}<circle r="8" fill="${P.gold}"/><path d="M-3 8 H3 M-2 12 H2" stroke="#d88f22" stroke-width="2" stroke-linecap="round"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -12 V-15" stroke="${P.gold}" stroke-width="2" stroke-linecap="round" transform="rotate(${a})"/>`).join("")}</g></g>
  ${kid({ x: 108, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -80 })}`);

// listen — leaning in to the bird's song.
SCENES.listen = () => scene(`
  <path d="M186 72 Q206 64 230 70" fill="none" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/>
  <path d="M196 68 q3 -8 10 -9 q-2 7 -10 9 Z M216 66 q4 -7 11 -7 q-3 7 -11 7 Z" fill="${P.green}"/>
  <g transform="translate(206 60)"><ellipse cx="0" cy="0" rx="7" ry="5.5" fill="${P.red}"/><circle cx="6.5" cy="-3.5" r="4" fill="${P.red}"/><path d="M9.6 -4 L14 -3 L9.6 -1.6 Z" fill="${P.gold}"/><circle cx="7.6" cy="-4.6" r="1.1" fill="${P.line}"/><path d="M-3 -1 Q-8 -4 -9 -8 Q-4 -6 -1 -3 Z" fill="#c23e3a"/></g>
  ${[0, 1].map((i) => musicNote(180 - i * 18, 52 - i * 4, i ? P.blue : P.purple, `${fade(1.6, "0;1;0", `begin="${-i * 0.8}s"`)}${shift(1.6, "0 4;0 -8", `begin="${-i * 0.8}s"`)}`)).join("")}
  ${kid({ x: 108, y: 148, s: 1.15, shirt: P.green, armLBase: 12, armRBase: -170, headAnim: rot(2.4, "0 0 -47;7 0 -47;0 0 -47"), bodyAnim: rot(2.4, "0 0 -20;4 0 -20;0 0 -20") })}`);

// live — home, with smoke curling from the chimney.
SCENES.live = () => scene(`
  <g transform="translate(178 148)"><rect x="-36" y="-52" width="72" height="52" rx="3" fill="#fdf3df" stroke="${P.grey}" stroke-width="2"/><path d="M-42 -52 L0 -80 L42 -52 Z" fill="${P.red}"/><rect x="14" y="-76" width="9" height="16" fill="#b0563f"/><rect x="-9" y="-26" width="18" height="26" fill="${P.wood}"/><rect x="-28" y="-42" width="14" height="12" fill="#cfe6f5" stroke="${P.grey}" stroke-width="1.4"/></g>
  ${[0, 1, 2].map((i) => `<circle cx="${196 + i * 3}" cy="${64 - i * 10}" r="${3 + i}" fill="#d8dee4">${fade(2.4, "0;0.8;0", `begin="${-i * 0.8}s"`)}${shift(2.4, "0 6;0 -12", `begin="${-i * 0.8}s"`)}</circle>`).join("")}
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -150, armRAnim: rot(0.9, "-12 0 0;14 0 0;-12 0 0") })}`);

// move — stepping from here to there and back.
SCENES.move = () => scene(`${sun()}
  <path d="M84 158 H176 M84 158 l7 -4 M84 158 l7 4 M176 158 l-7 -4 M176 158 l-7 4" stroke="${P.grey}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.red, armLBase: 25, armRBase: -25,
    bodyAnim: `${shift(2.6, "-34 0;34 0;-34 0")}` })}`);

// open — the lid lifts and light spills out.
SCENES.open = () => scene(`${tableProp(172, 118)}
  ${sparkle(172, 84, 1, P.gold, fade(2.4, "0;0;1;1;0", 'keyTimes="0;0.35;0.5;0.85;1"'))}
  ${boxProp(172, 118, 44, 26, P.purple)}
  <g transform="translate(150 92)"><g>${rot(2.4, "0 0 0;0 0 0;-70 0 0;-70 0 0;0 0 0", 'keyTimes="0;0.25;0.4;0.85;1"')}<rect x="0" y="-5" width="44" height="6" rx="2" fill="#6f54a3"/></g></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -75 })}`);

// pick — up from the ground and into the hand.
SCENES.pick = () => scene(`${sun(38, 30)}
  <path d="M150 152 Q170 146 190 152 Z" fill="#8a6a48"/>
  <g transform="translate(178 146)"><g>${shift(2.2, "0 0;0 0;-32 -52;-32 -52;0 0", 'keyTimes="0;0.25;0.5;0.85;1"')}<circle r="7" fill="${P.red}"/><path d="M0 -7 Q1 -10 3 -11" fill="none" stroke="${P.green}" stroke-width="2" stroke-linecap="round"/></g></g>
  ${kid({ x: 122, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -35, armRAnim: rot(2.2, "0 0 0;30 0 0;-60 0 0;-60 0 0;0 0 0", 'keyTimes="0;0.25;0.5;0.85;1"') })}`);

// pull — the rope wins, slowly.
SCENES.pull = () => scene(`
  <g>${shift(2.2, "0 0;-26 0;0 0")}${boxProp(196, 148, 34, 26, P.gold)}<path d="M179 136 H150" stroke="#8a6a48" stroke-width="3" stroke-linecap="round"/></g>
  <g transform="rotate(-8 120 148)">${kid({ x: 120, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 12, armRBase: -78 })}</g>`);

// push — lean in and slide it along.
SCENES.push = () => scene(`
  <g>${shift(2.2, "0 0;26 0;0 0")}${boxProp(184, 148, 34, 26, P.teal)}</g>
  <g transform="rotate(10 118 148)">${kid({ x: 118, y: 148, s: 1.15, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -82 })}</g>`);

// put — the ball goes onto the table.
SCENES.put = () => scene(`${tableProp(182, 118)}
  <g transform="translate(150 100)"><g>${shift(2.4, "0 0;32 10;32 10;0 0", 'keyTimes="0;0.4;0.75;1"')}<circle r="8" fill="${P.red}"/></g></g>
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.green, armLBase: 12, armRBase: -78, armRAnim: rot(2.4, "0 0 0;-18 0 0;-18 0 0;0 0 0", 'keyTimes="0;0.4;0.75;1"') })}`);

// read — eyes on the open book.
SCENES.read = () => scene(`
  <ellipse cx="140" cy="152" rx="42" ry="6" fill="rgba(0,0,0,0.06)"/>
  ${kid({ x: 140, y: 144, s: 1.15, shirt: P.blue, legs: "seated", armLBase: -55, armRBase: 55 })}
  ${openBook(140, 116, 1.1)}
  <path d="M118 122 H134" stroke="${P.gold}" stroke-width="3" stroke-linecap="round">${shift(2.6, "0 0;0 5;0 10", 'keyTimes="0;0.5;1"')}${fade(2.6, "1;1;0", 'keyTimes="0;0.85;1"')}</path>`);

// ride — pedalling along on two wheels.
SCENES.ride = () => scene(`${sun(38, 30)}
  <g transform="translate(140 132)"><g>${shift(0.9, "0 0;0 -2;0 0")}
    <g transform="translate(-26 12)"><g>${rot(1.2, "0 0 0;360 0 0")}<circle r="14" fill="none" stroke="${P.line}" stroke-width="3"/><path d="M0 -14 V14 M-14 0 H14" stroke="${P.line}" stroke-width="1.6"/></g></g>
    <g transform="translate(26 12)"><g>${rot(1.2, "0 0 0;360 0 0")}<circle r="14" fill="none" stroke="${P.line}" stroke-width="3"/><path d="M0 -14 V14 M-14 0 H14" stroke="${P.line}" stroke-width="1.6"/></g></g>
    <path d="M-26 12 L-8 -8 L14 -8 L26 12 M-8 -8 L-14 -16 M14 -8 L18 -18" fill="none" stroke="${P.red}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-19 -16 H-9 M14 -20 H22" stroke="${P.line}" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(6 -46)"><circle r="12.5" fill="${P.skin}"/><path d="M-12.5 -1.5 a12.5 12.5 0 0 1 25 0 z" fill="${P.hair}"/><circle cx="3.5" cy="-1" r="1.6" fill="${P.line}"/><circle cx="8.5" cy="-1" r="1.6" fill="${P.line}"/><path d="M3 5 Q6 7 9 5" fill="none" stroke="#7c3f21" stroke-width="1.7" stroke-linecap="round"/></g>
    <rect x="-8" y="-36" width="24" height="22" rx="9" fill="${P.gold}" transform="rotate(14 4 -25)"/>
    <path d="M12 -26 Q18 -24 20 -19" fill="none" stroke="${P.skin}" stroke-width="6" stroke-linecap="round"/>
  </g></g>
  ${[0, 1].map((i) => `<path d="M${76 - i * 14} ${128 + i * 8} h12" stroke="#b7cede" stroke-width="3.4" stroke-linecap="round">${fade(0.6, "0;1;0", `begin="${-i * 0.25}s"`)}</path>`).join("")}`);

// sail — the little boat rocks along the waves.
SCENES.sail = () => scene(`
  <rect x="0" y="112" width="260" height="30" fill="${P.water}"/>
  <path d="M0 114 Q11 109 22 114 T44 114 T66 114 T88 114 T110 114 T132 114 T154 114 T176 114 T198 114 T220 114 T242 114 T264 114 T286 114 V130 H0 Z" fill="#ffffff" opacity="0.35">${shift(1.6, "0 0;-44 0")}</path>
  <g transform="translate(140 112)"><g>${rot(2.6, "-4 0 0;4 0 0;-4 0 0")}
    <path d="M-34 0 L34 0 L22 14 L-22 14 Z" fill="${P.red}"/>
    <path d="M0 0 V-44" stroke="${P.wood}" stroke-width="3.4"/>
    <path d="M2 -44 L30 -6 L2 -6 Z" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/>
    <g transform="translate(-12 -14) scale(0.75)"><circle cy="-8" r="10" fill="${P.skin}"/><path d="M-10 -9.5 a10 10 0 0 1 20 0 z" fill="${P.hair}"/><circle cx="-3" cy="-9" r="1.4" fill="${P.line}"/><circle cx="3" cy="-9" r="1.4" fill="${P.line}"/><path d="M-3 -4 Q0 -2 3 -4" fill="none" stroke="#7c3f21" stroke-width="1.5" stroke-linecap="round"/><rect x="-9" y="0" width="18" height="14" rx="6" fill="${P.teal}"/></g>
  </g></g>`, { ground: P.sand });

// share — one biscuit each, and a smile.
SCENES.share = () => scene(`${sun(38, 30)}
  <g transform="translate(118 92)"><circle r="8" fill="${P.gold}"/><circle cx="-2" cy="-2" r="1.2" fill="#8a5a33"/><circle cx="3" cy="1" r="1.2" fill="#8a5a33"/></g>
  <g transform="translate(118 92)"><g>${shift(2.4, "0 0;40 0;40 0;0 0", 'keyTimes="0;0.45;0.8;1"')}<g transform="translate(0 14)"><circle r="8" fill="${P.gold}"/><circle cx="2" cy="-2" r="1.2" fill="#8a5a33"/><circle cx="-3" cy="2" r="1.2" fill="#8a5a33"/></g></g></g>
  ${kid({ x: 94, y: 148, s: 1.1, shirt: P.purple, armLBase: 12, armRBase: -82 })}
  ${kid({ x: 178, y: 148, s: 1.1, shirt: P.teal, flip: true, armLBase: 12, armRBase: -82 })}`);

// show — look what I made!
SCENES.show = () => scene(`${sun(38, 30)}
  ${speechBubble(96, 54, 52, 28, bubbleText("Look!", 13), fade(2.2, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"'))}
  <g transform="translate(146 84) rotate(8)"><rect x="-17" y="-13" width="34" height="26" rx="3" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.6"/><path d="M-8 6 L-3 -4 L2 3 L7 -6" fill="none" stroke="${P.red}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 12, armRBase: -105 })}
  ${kid({ x: 196, y: 148, s: 1.05, shirt: P.blue, flip: true, armLBase: 12, armRBase: -12, headAnim: rot(1.8, "-5 0 -47;5 0 -47;-5 0 -47") })}`);

// sleep — tucked in, with z's floating up.
SCENES.sleep = () => scene(`
  <g transform="translate(148 128)"><rect x="-58" y="-4" width="116" height="24" rx="6" fill="${P.wood}"/><rect x="-64" y="-24" width="12" height="44" rx="4" fill="#7d5227"/><rect x="52" y="-14" width="12" height="34" rx="4" fill="#7d5227"/><rect x="-52" y="-14" width="30" height="12" rx="6" fill="#fffdf5"/><rect x="-24" y="-12" width="76" height="18" rx="7" fill="${P.teal}"/><g transform="translate(-38 -14)"><circle r="11" fill="${P.skin}"/><path d="M-11 -1.4 a11 11 0 0 1 22 0 z" fill="${P.hair}"/><path d="M-5 -1 q2 1.5 4 0 M2 -1 q2 1.5 4 0" fill="none" stroke="${P.line}" stroke-width="1.4" stroke-linecap="round"/><path d="M-2 5 Q0 6.5 2 5" fill="none" stroke="#7c3f21" stroke-width="1.5" stroke-linecap="round"/></g></g>
  ${[0, 1, 2].map((i) => `<text x="${168 + i * 14}" y="${92 - i * 14}" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="${11 + i * 3}" font-weight="bold" fill="${P.grey}">z${fade(2.4, "0;1;0", `begin="${-i * 0.8}s"`)}</text>`).join("")}`);

// smell — the flower's scent drifts up to a nose.
SCENES.smell = () => scene(`${sun(38, 30)}
  <g transform="translate(176 128)"><path d="M0 20 Q-2 6 0 -4" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="4" ry="6.5" fill="${P.red}" transform="translate(0 -6) rotate(${a})"/>`).join("")}<circle cy="-6" r="4.4" fill="${P.gold}"/></g>
  ${[0, 1].map((i) => `<path d="M${168 - i * 10} ${102 - i * 12} q4 -6 -1 -12 q-4 -5 1 -11" fill="none" stroke="${P.grey}" stroke-width="2" stroke-linecap="round">${fade(1.8, "0;0.9;0", `begin="${-i * 0.7}s"`)}</path>`).join("")}
  ${kid({ x: 122, y: 148, s: 1.15, shirt: P.gold, armLBase: 12, armRBase: -45, headAnim: rot(2.6, "0 0 -47;9 0 -47;9 0 -47;0 0 -47", 'keyTimes="0;0.3;0.7;1"') })}`);

// speak — a clear hello.
SCENES.speak = () => bubbleScene(bubbleText("Hello!", 13), { shirt: P.green, w: 64, h: 30 });

// stand — up from the chair, tall.
SCENES.stand = () => scene(`
  <g transform="translate(150 148)"><rect x="-4" y="-52" width="44" height="8" rx="3" fill="${P.wood}"/><rect x="-4" y="-30" width="44" height="7" rx="3" fill="${P.wood}"/><rect x="-2" y="-26" width="5" height="26" fill="${P.wood}"/><rect x="33" y="-52" width="5" height="52" fill="${P.wood}"/></g>
  <g opacity="0">${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.45;0.93;1"')}${kid({ x: 158, y: 124, s: 1.15, shirt: P.red, legs: "seated" })}</g>
  <g>${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.45;0.93;1"')}${kid({ x: 112, y: 148, s: 1.15, shirt: P.red, armLBase: 25, armRBase: -25 })}</g>`);

// start — the flag drops, and off you go.
SCENES.start = () => scene(`
  <path d="M74 152 V72" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/>
  <g transform="translate(74 72)"><g>${rot(2.6, "0 0 0;0 0 0;70 0 0;70 0 0;0 0 0", 'keyTimes="0;0.3;0.45;0.85;1"')}<path d="M0 0 H34 L26 8 L34 16 H0 Z" fill="${P.red}"/></g></g>
  <g transform="rotate(14 150 148)">${kid({ x: 150, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 40, armRBase: -50, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}</g>`);

// stay — the puppy sits, the hand says wait there.
SCENES.stay = () => scene(`${sun(38, 30)}
  <g transform="translate(184 148)">${puppyProp(rot(0.6, "-16 0 0;16 0 0;-16 0 0"))}</g>
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -85 })}`);

// take — from the table into your own hands.
SCENES.take = () => scene(`${tableProp(184 , 118)}
  <g transform="translate(184 110)"><g>${shift(2.4, "0 0;0 0;-42 -8;-42 -8;0 0", 'keyTimes="0;0.25;0.5;0.85;1"')}<circle r="7" fill="${P.red}"/><path d="M0 -7 Q1 -10 3 -11" fill="none" stroke="${P.green}" stroke-width="2" stroke-linecap="round"/></g></g>
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -70, armRAnim: rot(2.4, "0 0 0;-15 0 0;15 0 0;15 0 0;0 0 0", 'keyTimes="0;0.25;0.5;0.85;1"') })}`);

// talk — words going back and forth.
SCENES.talk = () => scene(`
  ${speechBubble(84, 56, 46, 28, bubbleText("Hi!", 13), fade(3, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${speechBubble(176, 56, 46, 28, bubbleText("Hello!", 11), fade(3, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -60 })}
  ${kid({ x: 166, y: 148, s: 1.1, shirt: P.purple, mouth: "o", flip: true, armLBase: 12, armRBase: -60 })}`);

// taste — a little spoonful, mmm.
SCENES.taste = () => scene(`${tableProp(170, 122)}
  <path d="M148 112 Q148 122 170 122 Q192 122 192 112 Q181 116 170 116 Q159 116 148 112 Z" fill="#fff1d6" stroke="#e0b96a" stroke-width="2"/>
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.red, mouth: "o",
    armLBase: 12, armRBase: 0,
    armRAnim: rot(2.2, "-30 0 0;-125 0 0;-125 0 0;-30 0 0", 'keyTimes="0;0.4;0.65;1"'),
    armRHold: `<g transform="translate(2 22)"><path d="M0 -10 V4" stroke="${P.grey}" stroke-width="2.6" stroke-linecap="round"/><ellipse cy="7" rx="4.5" ry="5.5" fill="${P.grey}"/></g>` })}`);

// throw — up and away, right over the fence.
SCENES.throw = () => scene(`${sun(38, 30)}
  <g transform="translate(134 96)"><g>${shift(1.9, "0 0;0 0;66 -44;66 -44", 'keyTimes="0;0.3;0.6;1"')}${fade(1.9, "0;1;1;0", 'keyTimes="0;0.28;0.8;1"')}${football(7)}</g></g>
  ${kid({ x: 120, y: 148, s: 1.15, shirt: P.purple, mouth: "o",
    armLBase: 15, armRBase: 0,
    armRAnim: rot(1.9, "40 0 0;-160 0 0;-160 0 0;40 0 0", 'keyTimes="0;0.3;0.55;1"') })}`);

// touch — gently, on the kitten's head.
SCENES.touch = () => scene(`${sun(38, 30)}
  <g transform="translate(182 148)"><ellipse cx="0" cy="-8" rx="12" ry="8.5" fill="${P.grey}"/><circle cx="10" cy="-15" r="6.5" fill="${P.grey}"/><path d="M6 -20 L4 -26 L9 -22 Z M12 -21 L14 -27 L16 -21 Z" fill="${P.grey}"/><circle cx="12" cy="-16" r="1.2" fill="${P.line}"/><path d="M-10 -10 Q-16 -12 -17 -18" fill="none" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round"/></g>
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.gold, armLBase: 12, armRBase: -62, armRAnim: rot(1.4, "0 0 0;9 0 0;0 0 0") })}`);

// try — on tiptoes, nearly reaching the jar.
SCENES.try = () => scene(`
  <path d="M148 70 H228" stroke="${P.wood}" stroke-width="5" stroke-linecap="round"/>
  <g transform="translate(196 70)"><rect x="-10" y="-22" width="20" height="22" rx="3" fill="#cfe6f5" stroke="${P.grey}" stroke-width="1.6"/><rect x="-11" y="-26" width="22" height="5" rx="2" fill="${P.grey}"/></g>
  ${kid({ x: 152, y: 146, s: 1.15, shirt: P.green, mouth: "o", armLBase: 12, armRBase: -168,
    bodyAnim: shift(1.3, "0 0;0 -5;0 0") })}`);

// turn — all the way around.
SCENES.turn = () => scene(`${sun()}
  <path d="M96 66 A 40 18 0 1 1 92 76 M92 76 l-2 -8 M92 76 l8 -3" fill="none" stroke="${P.grey}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <g>${fade(2.4, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"')}${kid({ x: 130, y: 148, s: 1.15, shirt: P.teal, armLBase: 15, armRBase: -15 })}</g>
  <g opacity="0">${fade(2.4, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"')}<g transform="translate(130 148) scale(1.15)">${legsStanding()}<rect x="-14" y="-37" width="28" height="31" rx="10" fill="#26847d"/><g transform="translate(0 -47)"><circle r="13.5" fill="${P.skin}"/><path d="M-13.5 0 a13.5 13.5 0 0 1 27 0 a13.5 13.5 0 0 1 -27 0 Z" fill="${P.hair}"/></g></g></g>`);

// use — the right tool taps the peg home.
SCENES.use = () => scene(`${tableProp(178, 122)}
  <rect x="160" y="106" width="38" height="16" rx="3" fill="${P.gold}"/><rect x="174" y="96" width="8" height="12" rx="2" fill="${P.red}">${shift(1.2, "0 0;0 5;0 5;0 0", 'keyTimes="0;0.3;0.7;1"')}</rect>
  ${kid({ x: 114, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -70,
    armRAnim: rot(1.2, "-20 0 0;16 0 0;-20 0 0", 'keyTimes="0;0.3;1"'),
    armRHold: `<g transform="translate(2 20) rotate(-115)"><rect x="-1.8" y="0" width="3.6" height="18" rx="1.8" fill="${P.wood}"/><rect x="-7" y="16" width="14" height="9" rx="3" fill="${P.grey}"/></g>` })}`);

// wait — watching the clock, tapping a foot.
SCENES.wait = () => scene(`
  <g transform="translate(186 74)"><circle r="17" fill="#fffdf5" stroke="${P.grey}" stroke-width="2.6"/><path d="M0 0 V-11" stroke="${P.line}" stroke-width="2.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite"/></path><path d="M0 0 H7" stroke="${P.line}" stroke-width="2.4" stroke-linecap="round"/></g>
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.purple, armLBase: 8, armRBase: -8, headAnim: rot(2.6, "0 0 -47;8 0 -47;0 0 -47") })}
  <path d="M124 149 h10" stroke="${P.line}" stroke-width="3.4" stroke-linecap="round">${rot(0.6, "0 124 149;-14 124 149;0 124 149")}</path>`);

// wash — soap, bubbles and running water.
SCENES.wash = () => scene(`
  <g transform="translate(176 66)"><path d="M-20 0 H8 Q16 0 16 8 V16" fill="none" stroke="${P.grey}" stroke-width="5" stroke-linecap="round"/><path d="M16 22 V34 M12 26 V36 M20 26 V36" stroke="${P.water}" stroke-width="3" stroke-linecap="round">${fade(0.7, "0.4;1;0.4")}</path></g>
  ${[0, 1, 2].map((i) => `<circle cx="${168 + i * 12}" cy="${112 - i * 8}" r="${3.4 - i * 0.6}" fill="none" stroke="${P.water}" stroke-width="1.6">${fade(1.6, "0;1;0", `begin="${-i * 0.5}s"`)}${shift(1.6, "0 4;0 -8", `begin="${-i * 0.5}s"`)}</circle>`).join("")}
  ${kid({ x: 122, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -95,
    armRAnim: rot(0.6, "-6 0 0;8 0 0;-6 0 0") })}`);

// watch — eyes on the bouncing ball on screen.
SCENES.watch = () => scene(`
  <g transform="translate(176 96)"><rect x="-34" y="-28" width="68" height="50" rx="5" fill="${P.line}"/><rect x="-29" y="-23" width="58" height="40" rx="3" fill="#cfe6f5"/><rect x="-7" y="22" width="14" height="6" fill="${P.grey}"/><g transform="translate(0 4)"><g>${shift(1.2, "-18 6;0 -14;18 6;0 -14;-18 6", 'keyTimes="0;0.25;0.5;0.75;1"')}<circle r="5" fill="${P.red}"/></g></g></g>
  <ellipse cx="92" cy="152" rx="30" ry="5" fill="rgba(0,0,0,0.06)"/>
  ${kid({ x: 92, y: 144, s: 1.1, shirt: P.gold, legs: "seated", armLBase: 8, armRBase: -8 })}`);

// work — the wheel goes back on the cart.
SCENES.work = () => scene(`${tableProp(180, 122)}
  <g transform="translate(180 108)"><rect x="-22" y="-8" width="44" height="14" rx="4" fill="${P.red}"/><circle cx="-13" cy="9" r="6" fill="${P.line}"/><circle cx="13" cy="9" r="6" fill="${P.line}"/></g>
  ${sparkle(206, 88, 0.8, P.gold, fade(1.6, "0;1;0"))}
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -70,
    armRAnim: rot(1.2, "-14 0 0;12 0 0;-14 0 0"),
    armRHold: `<g transform="translate(2 20) rotate(-100)"><path d="M0 0 H16" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round"/><path d="M16 0 a4 4 0 1 1 4 4" fill="none" stroke="${P.grey}" stroke-width="3"/></g>` })}`);

// write — letters appear under the pencil.
SCENES.write = () => scene(`
  <rect x="118" y="60" width="104" height="64" rx="6" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <path d="M128 96 H212" stroke="#c6d2dc" stroke-width="1.6"/>
  <text x="132" y="92" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="17" font-weight="bold" fill="${P.blue}">a b c<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.2;0.75;1" dur="3s" repeatCount="indefinite"/></text>
  <g><animateMotion path="M136 90 H196 H136" keyPoints="0;0.75;1" keyTimes="0;0.75;1" dur="3s" repeatCount="indefinite"/><g transform="rotate(-40)"><rect x="-2.4" y="-18" width="4.8" height="15" rx="1.6" fill="${P.gold}"/><path d="M-2.4 -3 L0 3 L2.4 -3 Z" fill="${P.skin}"/></g></g>
  ${kid({ x: 78, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -90 })}`);

// ------------------------------------------------------------ Grade 3 scenes
// arrive — here at last, right at the door.
SCENES.arrive = () => scene(`${doorProp(196, 152)}
  <g>${shift(3, "-64 0;0 0;0 0", 'keyTimes="0;0.55;1"')}
    ${kid({ x: 148, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -140, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
  </g>
  ${sparkle(216, 66, 1, P.gold, fade(3, "0;0;1;1;0", 'keyTimes="0;0.55;0.65;0.9;1"'))}`);

// bake — the loaf rises behind the oven glass.
SCENES.bake = () => scene(`
  <g transform="translate(168 148)"><rect x="-44" y="-72" width="88" height="72" rx="6" fill="${P.grey}"/><rect x="-34" y="-62" width="68" height="44" rx="4" fill="#3a4753"/><rect x="-30" y="-58" width="60" height="36" rx="3" fill="#5b6b7c"/><rect x="-38" y="-12" width="76" height="6" rx="3" fill="#7c8a97"/><circle cx="-30" cy="-67" r="2.6" fill="${P.red}"/><circle cx="-20" cy="-67" r="2.6" fill="${P.gold}"/>
    <g transform="translate(0 -28)"><g>${grow(3.2, "1 0.7;1 1;1 1;1 0.7", 'keyTimes="0;0.5;0.9;1"')}<path d="M-20 0 Q-20 -16 0 -16 Q20 -16 20 0 Z" fill="${P.gold}"/><path d="M-8 -9 q3 -2 6 0 M2 -12 q3 -2 6 0" fill="none" stroke="#d88f22" stroke-width="1.8" stroke-linecap="round"/></g></g>
  </g>
  ${[0, 1].map((i) => `<path d="M${152 + i * 24} ${64 - i * 4} q4 -6 -1 -12" fill="none" stroke="#d8dee4" stroke-width="2.4" stroke-linecap="round">${fade(2, "0;0.9;0", `begin="${-i * 0.8}s"`)}</path>`).join("")}
  ${kid({ x: 82, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -60 })}`);

// begin — the curtains open on an empty stage: it is starting.
SCENES.begin = () => scene(`
  <rect x="70" y="52" width="120" height="100" fill="#3a2d52"/>
  <ellipse cx="130" cy="112" rx="26" ry="34" fill="#f6ecc9" opacity="0.9">${fade(3, "0;0;0.9;0.9", 'keyTimes="0;0.35;0.55;1"')}</ellipse>
  <g>${shift(3, "0 0;0 0;-42 0;-42 0", 'keyTimes="0;0.25;0.55;1"')}<rect x="70" y="52" width="62" height="100" fill="${P.red}"/><path d="M78 52 V152 M92 52 V152 M106 52 V152 M120 52 V152" stroke="#c23e3a" stroke-width="3"/></g>
  <g>${shift(3, "0 0;0 0;42 0;42 0", 'keyTimes="0;0.25;0.55;1"')}<rect x="128" y="52" width="62" height="100" fill="${P.red}"/><path d="M136 52 V152 M150 52 V152 M164 52 V152 M178 52 V152" stroke="#c23e3a" stroke-width="3"/></g>
  <rect x="64" y="44" width="132" height="10" rx="4" fill="${P.wood}"/>`);

// borrow — the friend's book, for now.
SCENES.borrow = () => scene(`${sun(38, 30)}
  <g transform="translate(168 92)"><g>${shift(2.6, "0 0;-44 0;-44 0;0 0", 'keyTimes="0;0.45;0.8;1"')}<g transform="rotate(-8)"><rect x="-13" y="-9" width="26" height="18" rx="2" fill="${P.purple}"/><path d="M-13 -3 H13" stroke="#6f54a3" stroke-width="1.6"/></g></g></g>
  ${speechBubble(96, 50, 62, 26, bubbleText("Thank you!", 9), fade(2.6, "0;0;1;1;0", 'keyTimes="0;0.45;0.55;0.9;1"'))}
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -82 })}
  ${kid({ x: 182, y: 148, s: 1.1, shirt: P.blue, flip: true, armLBase: 12, armRBase: -82 })}`);

// break — the stick snaps in two.
SCENES.break = () => scene(`${sun()}
  <g>${fade(2.6, "1;1;0;0;1", 'keyTimes="0;0.4;0.46;0.92;1"')}<path d="M96 100 L164 92" stroke="${P.wood}" stroke-width="6" stroke-linecap="round"/></g>
  <g opacity="0">${fade(2.6, "0;0;1;1;0", 'keyTimes="0;0.4;0.46;0.92;1"')}<path d="M96 100 L126 96" stroke="${P.wood}" stroke-width="6" stroke-linecap="round" transform="rotate(14 96 100)"/><path d="M136 95 L164 92" stroke="${P.wood}" stroke-width="6" stroke-linecap="round" transform="rotate(-16 164 92)"/><path d="M128 84 l3 -6 M134 84 l0 -7 M140 85 l3 -5" stroke="${P.gold}" stroke-width="2" stroke-linecap="round"/></g>
  ${kid({ x: 196, y: 148, s: 1.1, shirt: P.green, mouth: "o", armLBase: 12, armRBase: -55 })}`);

// build — the wall goes up brick by brick.
SCENES.build = () => scene(`
  <g transform="translate(176 152)">
    ${[[-30, -12, 0], [0, -12, 0], [30, -12, 0], [-15, -25, 1], [15, -25, 1], [0, -38, 2]].map(([bx, by, tier]) => `<g>${fade(3.6, `0;0;1;1${tier === 2 ? ";0" : ";1"}`, `keyTimes="0;${(0.1 + tier * 0.22).toFixed(2)};${(0.2 + tier * 0.22).toFixed(2)};${tier === 2 ? "0.9;1" : "1"}"`)}<rect x="${bx - 14}" y="${by}" width="28" height="12" rx="2" fill="${P.red}" stroke="#c23e3a" stroke-width="1.4"/></g>`).join("")}
  </g>
  ${kid({ x: 100, y: 148, s: 1.15, shirt: P.gold, armLBase: 12, armRBase: -60, armRAnim: rot(1.2, "-12 0 0;10 0 0;-12 0 0") })}`);

// change — same child, new colour.
SCENES.change = () => scene(`${sun()}
  ${sparkle(130, 84, 1, P.purple, fade(2.6, "0;1;0;1;0", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  <g>${fade(2.6, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"')}${kid({ x: 130, y: 148, s: 1.15, shirt: P.blue, armLBase: 15, armRBase: -15 })}</g>
  <g opacity="0">${fade(2.6, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"')}${kid({ x: 130, y: 148, s: 1.15, shirt: P.gold, armLBase: 15, armRBase: -15 })}</g>`);

// check — down the list, tick by tick.
SCENES.check = () => boardScene(`${[[-14, -18], [-14, 0], [-14, 18]].map(([lx, ly], i) => `<circle cx="${lx - 14}" cy="${ly}" r="3" fill="${P.grey}"/><path d="M${lx - 2} ${ly} H${lx + 26}" stroke="#c6d2dc" stroke-width="2.4"/><g>${fade(3, "0;0;1;1", `keyTimes="0;${(0.15 + i * 0.25).toFixed(2)};${(0.25 + i * 0.25).toFixed(2)};1"`)}<path d="M${lx + 30} ${ly} l3 4 l6 -8" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`).join("")}`, { shirt: P.teal });

// cheer — arms up, confetti down.
SCENES.cheer = () => scene(`
  ${speechBubble(190, 54, 48, 28, bubbleText("Yay!", 14), fade(1.6, "0.5;1;0.5"))}
  ${[[92, 60, P.red], [116, 44, P.gold], [148, 56, P.teal], [72, 84, P.purple]].map(([cx, cy, cc], i) => `<rect x="${cx}" y="${cy}" width="5" height="8" rx="1" fill="${cc}" transform="rotate(${20 + i * 40} ${cx} ${cy})">${shift(2, "0 -8;0 26", `begin="${-i * 0.5}s"`)}${fade(2, "0;1;0", `begin="${-i * 0.5}s"`)}</rect>`).join("")}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 145, armRBase: -145, bodyAnim: shift(0.8, "0 0;0 -7;0 0") })}`);

// choose — this one, or that one? This one!
SCENES.choose = () => scene(`${tableProp(166, 118)}
  <g transform="translate(146 104)"><path d="M0 14 V4" stroke="${P.wood}" stroke-width="3"/><circle cy="-4" r="9" fill="${P.red}"/></g>
  <g transform="translate(188 104)"><path d="M0 14 V4" stroke="${P.wood}" stroke-width="3"/><circle cy="-4" r="9" fill="${P.gold}"/></g>
  <circle cx="188" cy="100" r="15" fill="none" stroke="${P.green}" stroke-width="2.6">${fade(2.8, "0;0;1;1", 'keyTimes="0;0.55;0.68;1"')}</circle>
  ${kid({ x: 100, y: 148, s: 1.15, shirt: P.purple, armLBase: 12, armRBase: -70, armRAnim: rot(2.8, "-16 0 0;10 0 0;-6 0 0;-6 0 0", 'keyTimes="0;0.3;0.6;1"') })}`);

// climb — rung by rung, up the ladder.
SCENES.climb = () => scene(`
  <g transform="translate(180 152)"><path d="M-14 0 V-118 M14 0 V-118" stroke="${P.wood}" stroke-width="5" stroke-linecap="round"/>${[-16, -40, -64, -88, -108].map((ry) => `<path d="M-14 ${ry} H14" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/>`).join("")}</g>
  <g>${shift(3, "0 26;0 -34;0 -34", 'keyTimes="0;0.7;1"')}${fade(3, "1;1;0", 'keyTimes="0;0.85;1"')}
    ${kid({ x: 180, y: 118, s: 0.95, shirt: P.red, armLBase: 165, armRBase: -165, bodyAnim: shift(0.6, "0 0;0 -2;0 0") })}
  </g>`);

// collect — shells, one by one, into the basket.
SCENES.collect = () => scene(`${sun(38, 30)}
  <g transform="translate(178 132)"><path d="M-20 0 H20 L14 20 H-14 Z" fill="${P.wood}"/><path d="M-14 0 A 14 12 0 0 1 14 0" fill="none" stroke="${P.wood}" stroke-width="3.4"/></g>
  ${[[104, 146, 0], [126, 150, 1]].map(([cx, cy, i]) => `<g transform="translate(${cx} ${cy})"><g>${shift(2.6, `0 0;0 0;${172 - cx} ${118 - cy};${178 - cx} ${140 - cy}`, `keyTimes="0;${(0.15 + i * 0.3).toFixed(2)};${(0.35 + i * 0.3).toFixed(2)};${(0.45 + i * 0.3).toFixed(2)}"`)}${fade(2.6, "1;1;1;0", `keyTimes="0;${(0.35 + i * 0.3).toFixed(2)};${(0.42 + i * 0.3).toFixed(2)};${(0.45 + i * 0.3).toFixed(2)}"`)}<path d="M-6 3 A 6 6 0 0 1 6 3 Z" fill="#f6d8b8" stroke="#d8a878" stroke-width="1.4"/></g></g>`).join("")}
  ${kid({ x: 148, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -50, armRAnim: rot(1.3, "-10 0 0;22 0 0;-10 0 0") })}`);

// copy — the same star, drawn again.
SCENES.copy = () => scene(`
  <rect x="96" y="58" width="52" height="66" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <rect x="164" y="58" width="52" height="66" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <path d="M150 90 H162 M158 86 l4 4 l-4 4" fill="none" stroke="${P.grey}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M122 74 L126 85 L137 85 L128 92 L131 103 L122 96 L113 103 L116 92 L107 85 L118 85 Z" fill="${P.gold}"/>
  <path d="M190 74 L194 85 L205 85 L196 92 L199 103 L190 96 L181 103 L184 92 L175 85 L186 85 Z" fill="none" stroke="${P.gold}" stroke-width="2.4" stroke-dasharray="120" stroke-dashoffset="120"><animate attributeName="stroke-dashoffset" values="120;0;0" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/></path>
  ${kid({ x: 66, y: 148, s: 1.05, shirt: P.blue, armLBase: 12, armRBase: -85 })}`);

// cover — the cloth slides over the bowl.
SCENES.cover = () => scene(`${tableProp(172, 122)}
  <path d="M150 112 Q150 122 172 122 Q194 122 194 112 Q183 116 172 116 Q161 116 150 112 Z" fill="#fff1d6" stroke="#e0b96a" stroke-width="2"/>
  <g transform="translate(132 100)"><g>${shift(2.6, "0 0;24 6;24 6;0 0", 'keyTimes="0;0.4;0.75;1"')}<path d="M-14 0 Q0 -8 14 0 L18 10 Q0 4 -18 10 Z" fill="${P.teal}" opacity="0.95"/></g></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -78 })}`);

// cross — look both ways, then over the stripes.
SCENES.cross = () => scene(`
  ${[0, 1, 2, 3].map((i) => `<rect x="${86 + i * 30}" y="140" width="18" height="16" fill="#fffdf5"/>`).join("")}
  <g>${shift(3.4, "-30 0;-30 0;58 0;58 0", 'keyTimes="0;0.3;0.8;1"')}${fade(3.4, "1;1;1;0", 'keyTimes="0;0.85;0.95;1"')}
    ${kid({ x: 120, y: 144, s: 1.1, shirt: P.gold, armLBase: 25, armRBase: -25, headAnim: rot(3.4, "-14 0 -47;12 0 -47;0 0 -47;0 0 -47", 'keyTimes="0;0.15;0.3;1"'), bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
  </g>`);

// exercise — star jumps in the sun.
SCENES.exercise = () => scene(`${sun()}
  <g>${fade(1.2, "1;1;0;0;1", 'keyTimes="0;0.45;0.5;0.95;1"')}${kid({ x: 130, y: 148, s: 1.15, shirt: P.green, armLBase: 15, armRBase: -15 })}</g>
  <g opacity="0">${fade(1.2, "0;0;1;1;0", 'keyTimes="0;0.45;0.5;0.95;1"')}${kid({ x: 130, y: 144, s: 1.15, shirt: P.green, mouth: "o", armLBase: 140, armRBase: -140 })}</g>`);

// fetch — the stick goes out, the puppy brings it back.
SCENES.fetch = () => scene(`${sun(38, 30)}
  <g transform="translate(128 92)"><g>${shift(3.2, "0 0;74 44;74 44;74 44", 'keyTimes="0;0.25;0.9;1"')}${fade(3.2, "1;1;1;0", 'keyTimes="0;0.25;0.9;1"')}<path d="M-9 3 L9 -3" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/></g></g>
  <g transform="translate(150 148)"><g>${shift(3.2, "0 0;0 0;52 0;0 0", 'keyTimes="0;0.25;0.55;0.95"')}${puppyProp(rot(0.5, "-14 0 0;14 0 0;-14 0 0"))}</g></g>
  ${kid({ x: 100, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -120, armRAnim: rot(3.2, "30 0 0;-20 0 0;-20 0 0;30 0 0", 'keyTimes="0;0.2;0.85;1"') })}`);

// float — the little duck bobs on top of the water.
SCENES.float = () => scene(`
  <rect x="0" y="104" width="260" height="38" fill="${P.water}"/>
  <path d="M0 108 Q11 103 22 108 T44 108 T66 108 T88 108 T110 108 T132 108 T154 108 T176 108 T198 108 T220 108 T242 108 T264 108 T286 108 V124 H0 Z" fill="#ffffff" opacity="0.35">${shift(1.6, "0 0;-44 0")}</path>
  <g transform="translate(130 100)"><g>${shift(2.2, "0 2;0 -3;0 2")}<g>${rot(2.2, "-5 0 0;5 0 0;-5 0 0")}<ellipse cx="0" cy="0" rx="16" ry="10" fill="${P.gold}"/><circle cx="13" cy="-9" r="7" fill="${P.gold}"/><path d="M19 -10 L26 -8 L19 -6 Z" fill="#e8842f"/><circle cx="15" cy="-11" r="1.4" fill="${P.line}"/><path d="M-4 -6 Q-12 -10 -14 -2 Q-8 0 -4 -3 Z" fill="#e8b73a"/></g></g></g>`, { ground: P.sand });

// follow — ducklings in a line behind their mother.
SCENES.follow = () => scene(`${sun(38, 30)}
  <g>${shift(3.4, "-16 0;24 0;-16 0")}
    <g transform="translate(168 142)"><ellipse rx="17" ry="11" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/><circle cx="14" cy="-10" r="7.5" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/><path d="M20 -11 L27 -9 L20 -7 Z" fill="#e8842f"/><circle cx="16" cy="-12" r="1.4" fill="${P.line}"/></g>
    ${[0, 1, 2].map((i) => `<g transform="translate(${132 - i * 26} 146)"><g>${shift(0.8, "0 0;0 -3;0 0", `begin="${-i * 0.25}s"`)}<ellipse rx="8" ry="6" fill="${P.gold}"/><circle cx="7" cy="-5" r="4.4" fill="${P.gold}"/><path d="M10.5 -5.5 L15 -4.5 L10.5 -3.5 Z" fill="#e8842f"/><circle cx="8" cy="-6" r="1" fill="${P.line}"/></g></g>`).join("")}
  </g>`);

// invite — a party envelope, held out: please come!
SCENES.invite = () => scene(`
  <g transform="translate(196 56)"><g>${shift(2.2, "0 0;0 -5;0 0")}<path d="M0 12 Q-2 4 -6 0" fill="none" stroke="${P.grey}" stroke-width="1.6"/><ellipse cx="-8" cy="-8" rx="9" ry="11" fill="${P.red}"/></g></g>
  ${speechBubble(94, 52, 54, 26, bubbleText("Come!", 12), fade(2.2, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"'))}
  <g transform="translate(134 92)"><g>${shift(2.2, "0 0;10 0;0 0")}${envelopeProp(1)}<path d="M0 -2 L0 -2" stroke="none"/><circle cx="0" cy="1" r="3" fill="${P.red}"/></g></g>
  ${kid({ x: 98, y: 148, s: 1.1, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -85 })}
  ${kid({ x: 186, y: 148, s: 1.1, shirt: P.gold, flip: true, armLBase: 12, armRBase: -60 })}`);

// join — two pieces that fit, clicked together.
SCENES.join = () => scene(`${sun()}
  <g transform="translate(104 96)"><g>${shift(2.6, "0 0;22 0;22 0;0 0", 'keyTimes="0;0.4;0.8;1"')}<path d="M-20 -18 H12 A 8 8 0 0 0 12 -2 H-20 Z" fill="${P.teal}" transform="translate(0 10)"/></g></g>
  <g transform="translate(160 96)"><g>${shift(2.6, "0 0;-22 0;-22 0;0 0", 'keyTimes="0;0.4;0.8;1"')}<path d="M20 -18 H-4 A 8 8 0 0 1 -4 -2 H20 Z" fill="${P.gold}" transform="translate(0 10)"/></g></g>
  ${sparkle(132, 74, 0.9, P.purple, fade(2.6, "0;0;1;0;0", 'keyTimes="0;0.4;0.5;0.62;1"'))}
  ${kid({ x: 62, y: 148, s: 1.02, shirt: P.red, armLBase: 12, armRBase: -60 })}`);

// knock — knuckles on the door, knock knock.
SCENES.knock = () => scene(`${doorProp(184, 152)}
  ${[0, 1].map((i) => `<path d="M${208 + i * 8} ${86 - i * 6} a ${8 + i * 6} ${8 + i * 6} 0 0 1 0 ${16 + i * 8}" fill="none" stroke="${P.gold}" stroke-width="2.4" stroke-linecap="round">${fade(1, "0;1;0", `begin="${-i * 0.3}s"`)}</path>`).join("")}
  ${kid({ x: 120, y: 148, s: 1.15, shirt: P.green, armLBase: 12, armRBase: -95, armRAnim: rot(0.9, "-8 0 0;10 0 0;-8 0 0", 'keyTimes="0;0.25;1"') })}`);

// leave — out through the door, waving back.
SCENES.leave = () => scene(`${doorProp(74, 152)}
  <g>${shift(3.2, "0 0;74 0;74 0", 'keyTimes="0;0.7;1"')}${fade(3.2, "1;1;0", 'keyTimes="0;0.8;1"')}
    ${kid({ x: 112, y: 148, s: 1.1, shirt: P.purple, flip: true, armLBase: 12, armRBase: -145, armRAnim: rot(0.9, "-12 0 0;14 0 0;-12 0 0"), bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
  </g>`);

// meet — two friends walk up and say hello.
SCENES.meet = () => scene(`${sun(38, 30)}
  <g>${shift(3, "-42 0;0 0;0 0", 'keyTimes="0;0.5;1"')}${kid({ x: 104, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -140, armRAnim: rot(0.9, "-10 0 0;12 0 0;-10 0 0") })}</g>
  <g>${shift(3, "42 0;0 0;0 0", 'keyTimes="0;0.5;1"')}${kid({ x: 168, y: 148, s: 1.1, shirt: P.gold, flip: true, armLBase: 12, armRBase: -140, armRAnim: rot(0.9, "-10 0 0;12 0 0;-10 0 0") })}</g>`);

// order — three, one, two becomes one, two, three.
SCENES.order = () => scene(`${tableProp(168, 122)}
  <g>${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.46;0.92;1"')}${[[136, "3", P.red], [168, "1", P.teal], [200, "2", P.gold]].map(([bx, n, c]) => `<g transform="translate(${bx} 104)"><rect x="-13" y="-13" width="26" height="26" rx="4" fill="${c}"/>${boardText(n, 15, "#ffffff")}</g>`).join("")}</g>
  <g opacity="0">${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.46;0.92;1"')}${[[136, "1", P.teal], [168, "2", P.gold], [200, "3", P.red]].map(([bx, n, c]) => `<g transform="translate(${bx} 104)"><rect x="-13" y="-13" width="26" height="26" rx="4" fill="${c}"/>${boardText(n, 15, "#ffffff")}</g>`).join("")}</g>
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.purple, armLBase: 12, armRBase: -75 })}`);

// pack — everything into the suitcase.
SCENES.pack = () => scene(`
  <g transform="translate(176 148)"><rect x="-36" y="-26" width="72" height="26" rx="5" fill="${P.wood}"/><path d="M-36 -26 Q-36 -40 -20 -40 L-14 -40" fill="none" stroke="#7d5227" stroke-width="4" stroke-linecap="round"/><rect x="-10" y="-34" width="20" height="6" rx="3" fill="#7d5227"/></g>
  ${[[112, 80, `<rect x="-9" y="-7" width="18" height="14" rx="2" fill="${P.teal}"/>`, 0], [96, 96, `<circle r="7" fill="${P.red}"/>`, 1]].map(([ix, iy, prop, i]) => `<g transform="translate(${ix} ${iy})"><g>${shift(2.8, `0 0;0 0;${168 - ix} ${118 - iy};${172 - ix} ${132 - iy}`, `keyTimes="0;${(0.15 + i * 0.35).toFixed(2)};${(0.35 + i * 0.35).toFixed(2)};${(0.45 + i * 0.35).toFixed(2)}"`)}${fade(2.8, "1;1;1;0", `keyTimes="0;${(0.35 + i * 0.35).toFixed(2)};${(0.42 + i * 0.35).toFixed(2)};${(0.45 + i * 0.35).toFixed(2)}"`)}${prop}</g></g>`).join("")}
  ${kid({ x: 68, y: 148, s: 1.05, shirt: P.gold, armLBase: 12, armRBase: -70 })}`);

// pass — the ball goes over, and comes back.
SCENES.pass = () => scene(`${sun(38, 30)}
  <g transform="translate(112 122)"><g>${shift(2.4, "0 0;56 0;56 0;0 0;0 0", 'keyTimes="0;0.35;0.5;0.85;1"')}${football(8)}</g></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -70 })}
  ${kid({ x: 184, y: 148, s: 1.1, shirt: P.blue, flip: true, armLBase: 12, armRBase: -70 })}`);

// point — right there! See it?
SCENES.point = () => scene(`${sun(38, 30)}
  <path d="M138 96 L196 74" stroke="${P.grey}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>
  <g transform="translate(208 70)"><g>${grow(1.6, "1 1;1.2 1.2;1 1")}<path d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z" fill="${P.gold}"/></g></g>
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -78 })}`);

// practise — b, b, b — again and again until it sits right.
SCENES.practise = () => scene(`
  <rect x="118" y="60" width="104" height="64" rx="6" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <path d="M128 100 H212" stroke="#c6d2dc" stroke-width="1.6"/>
  ${[0, 1, 2].map((i) => `<text x="${138 + i * 28}" y="96" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="20" font-weight="bold" fill="${P.blue}">b<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${(0.1 + i * 0.28).toFixed(2)};${(0.2 + i * 0.28).toFixed(2)};1" dur="3.2s" repeatCount="indefinite"/></text>`).join("")}
  ${kid({ x: 78, y: 148, s: 1.1, shirt: P.green, armLBase: 12, armRBase: -90 })}`);

// reach — fingertips stretching for the apple on the branch.
SCENES.reach = () => scene(`
  <path d="M170 60 Q200 54 236 62" fill="none" stroke="${P.wood}" stroke-width="6" stroke-linecap="round"/>
  ${[0, 1, 2].map((i) => `<path d="M${188 + i * 18} ${58 - i * 1} q4 -8 10 -9" fill="none" stroke="${P.green}" stroke-width="4" stroke-linecap="round"/>`).join("")}
  <g transform="translate(196 66)"><g>${rot(1.3, "-5 0 -8;5 0 -8;-5 0 -8")}<circle cy="6" r="7" fill="${P.red}"/><path d="M0 -1 V-6" stroke="${P.wood}" stroke-width="2"/></g></g>
  ${kid({ x: 168, y: 144, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -172, bodyAnim: shift(1.3, "0 0;0 -6;0 0") })}`);

// return — the book goes back to its place on the shelf.
SCENES.return = () => scene(`
  <g transform="translate(190 96)"><rect x="-34" y="-40" width="68" height="80" rx="4" fill="${P.wood}"/><rect x="-28" y="-34" width="56" height="30" fill="#fdf3df"/><rect x="-28" y="4" width="56" height="30" fill="#fdf3df"/>${[[-22, -34, P.red], [-12, -34, P.teal], [8, -34, P.purple], [-22, 4, P.gold], [-2, 4, P.green]].map(([bx, by, c]) => `<rect x="${bx}" y="${by + 2}" width="8" height="26" rx="1.5" fill="${c}"/>`).join("")}</g>
  <g transform="translate(120 90)"><g>${shift(2.8, "0 0;66 -32;66 -28;66 -28", 'keyTimes="0;0.45;0.6;1"')}${fade(2.8, "1;1;1;0", 'keyTimes="0;0.55;0.9;1"')}<rect x="-4" y="-13" width="8" height="26" rx="1.5" fill="${P.blue}"/></g></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -85 })}`);

// save — coins into the money box, clink by clink.
SCENES.save = () => scene(`${tableProp(172, 122)}
  ${boxProp(172, 122, 44, 28, P.teal, `<rect x="-10" y="-30" width="20" height="3.4" rx="1.7" fill="#1d6b64"/>`)}
  ${[0, 1].map((i) => `<g transform="translate(150 78)"><g>${shift(2.2, "0 0;22 14;22 18", `keyTimes="0;0.45;0.6" begin="${-i * 1.1}s"`)}${fade(2.2, "0;1;1;0", `keyTimes="0;0.1;0.5;0.62" begin="${-i * 1.1}s"`)}<circle r="6" fill="#f2c94c" stroke="#d8a01f" stroke-width="1.4"/></g></g>`).join("")}
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.purple, armLBase: 12, armRBase: -85 })}`);

// scratch — that itchy spot on the other arm.
SCENES.scratch = () => scene(`${sun()}
  ${[0, 1, 2].map((i) => `<path d="M${102 - i * 7} ${112 - i * 6} l-6 -7" stroke="${P.red}" stroke-width="2.2" stroke-linecap="round">${fade(0.8, "0;1;0", `begin="${-i * 0.25}s"`)}</path>`).join("")}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.gold, mouth: "o",
    armLBase: 30,
    armRBase: -108, armRAnim: rot(0.4, "-6 0 0;7 0 0;-6 0 0") })}`);

// search — the magnifying glass sweeps the grass.
SCENES.search = () => scene(`${sun(38, 30)}
  ${[0, 1, 2].map((i) => `<path d="M${138 + i * 30} 148 q2 -7 6 -9 M${142 + i * 30} 148 q0 -5 2 -8" stroke="${P.green}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`).join("")}
  <text x="196" y="82" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="15" font-weight="bold" fill="${P.grey}">?${fade(2.6, "0;1;0")}</text>
  <g><animateMotion path="M150 100 q30 8 56 0 q-30 10 -56 0" dur="2.6s" repeatCount="indefinite"/><g transform="rotate(35)"><circle r="13" fill="none" stroke="${P.grey}" stroke-width="3.4"/><circle r="10" fill="#cfe6f5" opacity="0.5"/><path d="M9 9 L20 20" stroke="${P.grey}" stroke-width="4.4" stroke-linecap="round"/></g></g>
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -75 })}`);

// send — the letter drops into the postbox.
SCENES.send = () => scene(`
  <g transform="translate(186 152)"><rect x="-20" y="-64" width="40" height="64" rx="6" fill="${P.red}"/><rect x="-12" y="-52" width="24" height="5" rx="2.5" fill="#8f2723"/><rect x="-10" y="-30" width="20" height="14" rx="2" fill="#fffdf5" opacity="0.9"/></g>
  <g transform="translate(130 92)"><g>${shift(2.4, "0 0;42 -6;46 6;46 6", 'keyTimes="0;0.4;0.55;1"')}${fade(2.4, "1;1;0;0", 'keyTimes="0;0.42;0.56;1"')}${envelopeProp(0.9)}</g></g>
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -85 })}`);

// shout — big voice, big letters.
SCENES.shout = () => scene(`
  <g transform="translate(182 58)"><g>${grow(1.4, "0.9 0.9;1.08 1.08;0.9 0.9")}<path d="M-34 -16 L-28 -20 L-22 -15 L-15 -21 L-8 -15 L-1 -21 L6 -15 L13 -20 L20 -15 L27 -20 L33 -14 L28 -7 L34 0 L27 6 L32 13 L24 16 L17 12 L10 17 L2 12 L-6 17 L-13 12 L-21 16 L-27 11 L-33 14 L-30 6 L-35 -1 L-29 -8 Z" fill="#fffdf5" stroke="${P.red}" stroke-width="2.4" stroke-linejoin="round"/>${bubbleText("HEY!", 16)}</g></g>
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 40, armRBase: -130 })}`);

// splash — feet first into the puddle!
SCENES.splash = () => scene(`
  <ellipse cx="150" cy="150" rx="34" ry="8" fill="${P.water}"/>
  ${[[-26, -18, 0], [26, -20, 0.3], [-16, -30, 0.6], [18, -32, 0.15]].map(([dx, dy, b]) => `<path d="M${150 + dx} 146 q${dx * 0.2} ${dy} ${dx * 0.35} ${dy * 1.4}" fill="none" stroke="${P.waterDeep}" stroke-width="3.4" stroke-linecap="round">${fade(1.1, "0;1;0", `begin="${-b}s"`)}</path>`).join("")}
  ${kid({ x: 150, y: 142, s: 1.15, shirt: P.teal, mouth: "o", armLBase: 130, armRBase: -130,
    bodyAnim: shift(1.1, "0 -22;0 0;0 -22", 'keyTimes="0;0.45;1"') })}`);

// stretch — arms high and wide, tall as can be.
SCENES.stretch = () => scene(`${sun(38, 30)}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.purple, mouth: "o",
    armLBase: 135, armLAnim: rot(2.6, "0 0 0;18 0 0;0 0 0"),
    armRBase: -135, armRAnim: rot(2.6, "0 0 0;-18 0 0;0 0 0"),
    bodyAnim: shift(2.6, "0 0;0 -5;0 0") })}`);

// study — book open, lamp on, pencil moving.
SCENES.study = () => scene(`${tableProp(150, 122)}${openBook(136, 106)}
  <g transform="translate(196 122)"><path d="M0 0 V-26 Q0 -34 -8 -34" fill="none" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round"/><path d="M-16 -34 A 8 8 0 0 1 0 -34 Z" fill="${P.gold}"/><path d="M-8 -30 L-8 -24" stroke="#f6d96b" stroke-width="10" stroke-linecap="round" opacity="0.55">${fade(2.4, "0.3;0.7;0.3")}</path></g>
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -80, headAnim: rot(3, "6 0 -47;6 0 -47")})}`);

// teach — a-b-c at the little board, with a pointer.
SCENES.teach = () => scene(`
  <g transform="translate(172 90)"><rect x="-40" y="-34" width="80" height="56" rx="4" fill="#2f4f43"/><rect x="-44" y="-38" width="88" height="6" rx="3" fill="${P.wood}"/><rect x="-44" y="22" width="88" height="6" rx="3" fill="${P.wood}"/>${boardText("a b c", 18, "#fffdf5", -4)}</g>
  ${kid({ x: 92, y: 148, s: 1.15, shirt: P.teal, mouth: "o", armLBase: 12, armRBase: -95,
    armRAnim: rot(1.8, "-8 0 0;10 0 0;-8 0 0"),
    armRHold: `<path d="M2 20 L26 8" stroke="${P.wood}" stroke-width="2.6" stroke-linecap="round"/>` })}
  ${kid({ x: 214, y: 150, s: 0.85, shirt: P.gold, flip: true, legs: "seated", armLBase: 8, armRBase: -8 })}`);

// visit — knock knock, hello! Come in!
SCENES.visit = () => scene(`${doorProp(180, 152)}
  <g transform="translate(180 152)"><g>${rot(3, "0 -22 0;0 -22 0;-52 -22 0;-52 -22 0", 'keyTimes="0;0.35;0.55;1"')}<rect x="-22" y="-62" width="22" height="62" rx="3" fill="#8f6234" stroke="#7d5227" stroke-width="2"/></g></g>
  <g opacity="0">${fade(3, "0;0;1;1", 'keyTimes="0;0.5;0.62;1"')}${kid({ x: 196, y: 148, s: 0.95, shirt: P.green, flip: true, armLBase: 12, armRBase: -140 })}</g>
  ${kid({ x: 116, y: 148, s: 1.1, shirt: P.gold, armLBase: -55, armRBase: -95, armLHold: `<g transform="translate(-2 22)">${boxProp(0, 6, 16, 12, P.red, `<path d="M-8 -6 H8" stroke="${P.gold}" stroke-width="2"/>`)}</g>` })}`);

// wake — the sun is up, and so are you.
SCENES.wake = () => scene(`${sun(48, 36)}
  <g transform="translate(158 128)"><rect x="-58" y="-4" width="116" height="24" rx="6" fill="${P.wood}"/><rect x="-64" y="-24" width="12" height="44" rx="4" fill="#7d5227"/><rect x="52" y="-14" width="12" height="34" rx="4" fill="#7d5227"/><rect x="-24" y="-12" width="76" height="18" rx="7" fill="${P.purple}"/></g>
  <g>${fade(3, "1;1;0;0;1", 'keyTimes="0;0.35;0.42;0.93;1"')}<g transform="translate(120 114)"><circle r="11" fill="${P.skin}"/><path d="M-11 -1.4 a11 11 0 0 1 22 0 z" fill="${P.hair}"/><path d="M-5 -1 q2 1.5 4 0 M2 -1 q2 1.5 4 0" fill="none" stroke="${P.line}" stroke-width="1.4" stroke-linecap="round"/></g></g>
  <g opacity="0">${fade(3, "0;0;1;1;0", 'keyTimes="0;0.35;0.42;0.93;1"')}<g transform="translate(120 96)"><g transform="scale(0.95)"><circle cy="-8" r="11.5" fill="${P.skin}"/><path d="M-11.5 -9.4 a11.5 11.5 0 0 1 23 0 z" fill="${P.hair}"/><circle cx="-4" cy="-10" r="1.5" fill="${P.line}"/><circle cx="4" cy="-10" r="1.5" fill="${P.line}"/><path d="M-3 -3 Q0 -1 3 -3" fill="none" stroke="#7c3f21" stroke-width="1.6" stroke-linecap="round"/><rect x="-11" y="0" width="22" height="18" rx="8" fill="${P.purple}"/><path d="M-11 4 Q-18 -2 -16 -10 M11 4 Q18 -2 16 -10" fill="none" stroke="${P.skin}" stroke-width="5.5" stroke-linecap="round"/></g></g></g>`);

// wear — the hat comes down just right.
SCENES.wear = () => scene(`${sun()}
  <g transform="translate(130 66)"><g>${shift(2.6, "0 -16;0 8;0 8;0 -16", 'keyTimes="0;0.4;0.8;1"')}<path d="M-16 6 H16 M-10 6 Q-10 -8 0 -8 Q10 -8 10 6" fill="${P.red}" stroke="${P.red}" stroke-width="4" stroke-linecap="round"/></g></g>
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.blue, armLBase: 110, armRBase: -110 })}`);

// win — the cup held high!
SCENES.win = () => scene(`
  ${[[92, 60, P.red], [120, 44, P.gold], [168, 52, P.teal]].map(([cx, cy, cc], i) => `<rect x="${cx}" y="${cy}" width="5" height="8" rx="1" fill="${cc}" transform="rotate(${20 + i * 40} ${cx} ${cy})">${shift(2, "0 -8;0 26", `begin="${-i * 0.6}s"`)}${fade(2, "0;1;0", `begin="${-i * 0.6}s"`)}</rect>`).join("")}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.gold, mouth: "o",
    armLBase: 30, armRBase: -160,
    armRHold: `<g transform="translate(0 24) rotate(155)"><path d="M-9 -12 H9 V-4 Q9 5 0 5 Q-9 5 -9 -4 Z" fill="${P.gold}" stroke="#d88f22" stroke-width="1.4"/><path d="M-9 -9 Q-16 -9 -14 -1 M9 -9 Q16 -9 14 -1" fill="none" stroke="#d88f22" stroke-width="2"/><rect x="-3.4" y="5" width="6.8" height="5" fill="#d88f22"/></g>`,
    bodyAnim: shift(0.9, "0 0;0 -6;0 0") })}`);

// wrap — ribbon round the box, and a bow on top.
SCENES.wrap = () => scene(`${tableProp(170, 122)}
  ${boxProp(170, 122, 46, 32, P.teal)}
  <path d="M170 90 V122 M147 106 H193" stroke="${P.gold}" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="80"><animate attributeName="stroke-dashoffset" values="80;0;0" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite"/></path>
  <g transform="translate(170 88)"><g>${fade(3, "0;0;1;1", 'keyTimes="0;0.5;0.62;1"')}<path d="M0 0 Q-10 -8 -6 -2 Q-12 2 0 0 Q12 2 6 -2 Q10 -8 0 0 Z" fill="${P.gold}" stroke="#d88f22" stroke-width="1.6"/></g></g>
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -80 })}`);

// ------------------------------------------------------------ Grade 4 scenes
// act — a lion, for as long as the mask is up.
SCENES.act = () => scene(`
  <rect x="60" y="146" width="140" height="8" rx="3" fill="${P.wood}"/>
  ${kid({ x: 130, y: 146, s: 1.15, shirt: P.purple,
    armLBase: 12,
    armRBase: -120, armRAnim: rot(2.8, "0 0 0;-38 0 0;-38 0 0;0 0 0", 'keyTimes="0;0.3;0.75;1"'),
    armRHold: `<g transform="translate(0 24)"><path d="M0 6 V22" stroke="${P.wood}" stroke-width="2.6"/><g transform="translate(0 -2)"><circle r="10" fill="${P.gold}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="0" cy="-12" r="3" fill="#d88f22" transform="rotate(${a})"/>`).join("")}<circle cx="-3.5" cy="-2" r="1.4" fill="${P.line}"/><circle cx="3.5" cy="-2" r="1.4" fill="${P.line}"/><path d="M-2 4 Q0 5.5 2 4" fill="none" stroke="${P.line}" stroke-width="1.4"/></g></g>` })}`);

// arrange — the books line up by size.
SCENES.arrange = () => scene(`${tableProp(168, 122)}
  <g>${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.46;0.92;1"')}<rect x="134" y="92" width="10" height="30" rx="2" fill="${P.red}"/><rect x="182" y="104" width="10" height="18" rx="2" fill="${P.teal}"/><rect x="156" y="98" width="10" height="24" rx="2" fill="${P.gold}"/></g>
  <g opacity="0">${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.46;0.92;1"')}<rect x="134" y="92" width="10" height="30" rx="2" fill="${P.red}"/><rect x="148" y="98" width="10" height="24" rx="2" fill="${P.gold}"/><rect x="162" y="104" width="10" height="18" rx="2" fill="${P.teal}"/></g>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -75 })}`);

// attend — present, at the lesson, hand up.
SCENES.attend = () => scene(`
  <g transform="translate(186 84)"><rect x="-34" y="-30" width="68" height="48" rx="4" fill="#2f4f43"/><rect x="-38" y="-34" width="76" height="6" rx="3" fill="${P.wood}"/>${boardText("1 + 1", 15, "#fffdf5", -2)}</g>
  ${kid({ x: 84, y: 150, s: 0.95, shirt: P.gold, legs: "seated", armLBase: 8, armRBase: -160, armRAnim: rot(1.8, "0 0 0;-10 0 0;0 0 0") })}
  ${kid({ x: 138, y: 150, s: 0.95, shirt: P.teal, legs: "seated", armLBase: 8, armRBase: -8 })}`);

// avoid — neatly around the puddle, not through it.
SCENES.avoid = () => scene(`${sun(38, 30)}
  <ellipse cx="140" cy="150" rx="26" ry="7" fill="${P.water}"/>
  <g><animateMotion path="M-38 0 Q30 -34 76 0 L134 0" keyPoints="0;0.7;1" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/><g>${fade(3.4, "1;1;1;0", 'keyTimes="0;0.8;0.94;1"')}${kid({ x: 104, y: 148, s: 1.05, shirt: P.green, armLBase: 20, armRBase: -20, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}</g></g>`);

// breathe — in fills you up, out lets it go.
SCENES.breathe = () => scene(`${sun(38, 30)}
  ${[0, 1].map((i) => `<path d="M${162 + i * 10} ${86 - i * 6} q6 -4 4 -12" fill="none" stroke="#a5c8e4" stroke-width="2.6" stroke-linecap="round">${fade(3, "0;0.9;0", `begin="${-i * 1.5}s"`)}</path>`).join("")}
  <g transform="translate(130 148) scale(1.15)">${legsStanding()}
    <g>${grow(3, "1 1;1.12 1.06;1 1")}<rect x="-14" y="-37" width="28" height="31" rx="10" fill="${P.teal}"/></g>
    ${arm("l", 25, {})}${arm("r", -25, {})}${head({ mouth: "o" })}
  </g>`);

// calculate — bigger sums, same pencil.
SCENES.calculate = () => boardScene(`${boardText("12 + 34", 16, P.line, -14)}<g>${fade(2.6, "0;0;1;1", 'keyTimes="0;0.45;0.6;1"')}${boardText("= 46", 18, P.green, 14)}</g>`, { shirt: P.purple });

// compare — bigger on one side, smaller on the other.
SCENES.compare = () => boardScene(`<circle cx="-22" cy="-4" r="16" fill="${P.red}"/><circle cx="22" cy="2" r="8" fill="${P.red}"/><g>${fade(2.6, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}${boardText(">", 20, P.line, 2)}</g>`, { shirt: P.gold });

// complete — the last piece of the puzzle goes in.
SCENES.complete = () => scene(`${tableProp(170, 122)}
  <g transform="translate(170 100)"><rect x="-26" y="-18" width="26" height="18" fill="${P.teal}"/><rect x="0" y="-18" width="26" height="18" fill="${P.gold}"/><rect x="-26" y="0" width="26" height="18" fill="${P.purple}"/>
  <g>${shift(2.8, "18 26;0 0;0 0", 'keyTimes="0;0.5;1"')}${fade(2.8, "0;1;1", 'keyTimes="0;0.15;1"')}<rect x="0" y="0" width="26" height="18" fill="${P.red}"/></g></g>
  ${sparkle(206, 78, 0.9, P.gold, fade(2.8, "0;0;1;0", 'keyTimes="0;0.5;0.62;1"'))}
  ${kid({ x: 100, y: 148, s: 1.1, shirt: P.green, armLBase: 12, armRBase: -75 })}`);

// connect — plug meets socket, and the lamp lights.
SCENES.connect = () => scene(`
  <g transform="translate(196 96)"><path d="M0 22 V0 Q0 -8 -8 -8" fill="none" stroke="${P.grey}" stroke-width="3.4" stroke-linecap="round" transform="translate(0 26)"/><path d="M-16 -8 A 8 8 0 0 1 0 -8 Z" fill="${P.gold}" transform="translate(0 26)"/><path d="M-8 14 L-8 22" stroke="#f6d96b" stroke-width="12" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;0;0.65;0.65" keyTimes="0;0.45;0.6;1" dur="3s" repeatCount="indefinite"/></path></g>
  <g transform="translate(120 130)"><rect x="-8" y="-8" width="14" height="16" rx="3" fill="${P.grey}"/><circle cx="-1" cy="-2" r="1.6" fill="${P.line}"/><circle cx="-1" cy="4" r="1.6" fill="${P.line}"/></g>
  <g transform="translate(84 130)"><g>${shift(3, "0 0;22 0;22 0;0 0", 'keyTimes="0;0.45;0.8;1"')}<rect x="-14" y="-6" width="14" height="12" rx="3" fill="${P.teal}"/><path d="M0 -3 H6 M0 3 H6" stroke="${P.grey}" stroke-width="2.4" stroke-linecap="round"/><path d="M-14 0 H-26" stroke="${P.grey}" stroke-width="3" stroke-linecap="round"/></g></g>`);

// create — out of a blank page, a rocket.
SCENES.create = () => scene(`
  <rect x="128" y="46" width="96" height="78" rx="6" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>
  <g transform="translate(176 84)"><path d="M0 -22 Q10 -10 10 4 L4 10 H-4 L-10 4 Q-10 -10 0 -22 Z M-10 6 L-16 16 L-6 12 Z M10 6 L16 16 L6 12 Z" fill="${P.red}" stroke-dasharray="160" stroke-dashoffset="160" stroke="${P.red}" fill-opacity="0"><animate attributeName="stroke-dashoffset" values="160;0;0" keyTimes="0;0.55;1" dur="3.4s" repeatCount="indefinite"/><animate attributeName="fill-opacity" values="0;0;1;1" keyTimes="0;0.55;0.7;1" dur="3.4s" repeatCount="indefinite"/></path><circle cy="-6" r="3.4" fill="#cfe6f5" opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.6;0.72;1" dur="3.4s" repeatCount="indefinite"/></circle></g>
  ${sparkle(216, 56, 0.8, P.purple, fade(3.4, "0;0;1;0", 'keyTimes="0;0.6;0.75;1"'))}
  ${kid({ x: 84, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -95 })}`);

// deliver — the parcel arrives at the door.
SCENES.deliver = () => scene(`${doorProp(200, 152)}
  <g>${shift(3, "-44 0;0 0;0 0", 'keyTimes="0;0.5;1"')}
    ${kid({ x: 140, y: 148, s: 1.1, shirt: P.red, armLBase: -62, armRBase: 62, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
    ${boxProp(140, 139, 28, 20, P.wood, `<path d="M-14 -10 H14" stroke="#7d5227" stroke-width="2.4"/>`)}
  </g>`);

// describe — the cat, told in colours and size.
SCENES.describe = () => scene(`${sun(38, 30)}
  ${speechBubble(172, 62, 74, 44, `<g transform="translate(-14 0)"><ellipse cx="0" cy="2" rx="9" ry="6.5" fill="${P.grey}"/><circle cx="8" cy="-3" r="5" fill="${P.grey}"/><path d="M5 -7 L4 -11 L8 -8 Z M10 -8 L12 -12 L13 -7 Z" fill="${P.grey}"/></g><circle cx="14" cy="-6" r="4" fill="${P.grey}"/><circle cx="24" cy="-6" r="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/><path d="M10 8 H28" stroke="${P.grey}" stroke-width="2.4" stroke-linecap="round"/>`, fade(2.4, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"'))}
  ${kid({ x: 108, y: 148, s: 1.15, shirt: P.teal, mouth: "o", armLBase: 12, armRBase: -110 })}`);

// disappear — into the hat, and gone.
SCENES.disappear = () => scene(`${tableProp(160, 124)}
  <g transform="translate(160 124)"><rect x="-13" y="-26" width="26" height="26" rx="3" fill="#3a3f52"/><rect x="-13" y="-10" width="26" height="6" fill="${P.purple}"/><ellipse cx="0" cy="0" rx="22" ry="4.6" fill="#3a3f52"/></g>
  <g transform="translate(160 86)"><g>${shift(3, "0 -14;0 -14;0 12;0 12", 'keyTimes="0;0.3;0.55;1"')}${fade(3, "1;1;0;0", 'keyTimes="0;0.35;0.55;1"')}<ellipse cy="2" rx="8" ry="9" fill="#fffdf5"/><circle cy="-9" r="6" fill="#fffdf5"/><path d="M-4 -13 Q-6 -24 -2 -24 Q0 -18 -1 -14 Z M4 -13 Q6 -24 2 -24 Q0 -18 1 -14 Z" fill="#fffdf5"/><circle cx="-2" cy="-10" r="1" fill="${P.line}"/><circle cx="2" cy="-10" r="1" fill="${P.line}"/></g></g>
  ${sparkle(160, 66, 1, P.purple, fade(3, "0;0;1;0;0", 'keyTimes="0;0.5;0.6;0.72;1"'))}
  ${kid({ x: 84, y: 148, s: 1.1, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -70 })}`);

// discover — the chest opens on treasure.
SCENES.discover = () => scene(`
  <g transform="translate(172 138)"><rect x="-30" y="-22" width="60" height="22" rx="4" fill="${P.wood}" stroke="#7d5227" stroke-width="2"/><g>${fade(2.8, "0;0;1;1;0", 'keyTimes="0;0.35;0.5;0.88;1"')}${[[-12, -26], [0, -30], [12, -26]].map(([gx, gy]) => `<circle cx="${gx}" cy="${gy}" r="4" fill="${P.gold}"/>`).join("")}</g><g>${rot(2.8, "0 -30 -22;0 -30 -22;-58 -30 -22;-58 -30 -22;0 -30 -22", 'keyTimes="0;0.3;0.45;0.88;1"')}<rect x="-30" y="-30" width="60" height="9" rx="4" fill="#7d5227"/></g></g>
  ${sparkle(206, 92, 1, P.gold, fade(2.8, "0;0;1;1;0", 'keyTimes="0;0.4;0.55;0.85;1"'))}
  ${kid({ x: 100, y: 148, s: 1.1, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -65 })}`);

// discuss — a question meets an idea.
SCENES.discuss = () => scene(`
  ${speechBubble(84, 54, 40, 28, bubbleText("?", 16), fade(3, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${speechBubble(176, 54, 40, 28, `<circle r="6" fill="${P.gold}"/><path d="M-2 6 H2 M-1.4 9 H1.4" stroke="#d88f22" stroke-width="1.6" stroke-linecap="round"/>`, fade(3, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -60 })}
  ${kid({ x: 166, y: 148, s: 1.1, shirt: P.red, mouth: "o", flip: true, armLBase: 12, armRBase: -60 })}`);

// divide — six dots become two equal threes.
SCENES.divide = () => boardScene(`${boardText("6 ÷ 2", 15, P.line, -24)}
  <g>${shift(2.8, "0 0;-14 0;-14 0", 'keyTimes="0;0.5;1"')}${[[-8, 2], [-16, 12], [0, 12]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="4.4" fill="${P.teal}"/>`).join("")}</g>
  <g>${shift(2.8, "0 0;14 0;14 0", 'keyTimes="0;0.5;1"')}${[[8, 2], [0, 12], [16, 12]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="4.4" fill="${P.gold}"/>`).join("")}</g>
  <path d="M0 -4 V22" stroke="${P.grey}" stroke-width="1.6" stroke-dasharray="4 4">${fade(2.8, "0;0;1;1", 'keyTimes="0;0.45;0.55;1"')}</path>`, { shirt: P.teal });

// edit — cross out the wrong word, write it right.
SCENES.edit = () => boardScene(`${boardText("kat", 19, P.grey, -10)}<path d="M-18 -12 L18 -8" stroke="${P.red}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="40" stroke-dashoffset="40"><animate attributeName="stroke-dashoffset" values="40;0;0" keyTimes="0;0.35;1" dur="3s" repeatCount="indefinite"/></path><g>${fade(3, "0;0;1;1", 'keyTimes="0;0.45;0.6;1"')}${boardText("cat", 19, P.green, 16)}</g>`, { shirt: P.red });

// enter — in through the open door.
SCENES.enter = () => scene(`
  <g transform="translate(184 152)"><rect x="-26" y="-66" width="52" height="66" fill="#3a4753"/><rect x="-30" y="-70" width="60" height="8" rx="3" fill="${P.wood}"/><rect x="26" y="-66" width="6" height="66" fill="${P.wood}"/><rect x="-32" y="-66" width="6" height="66" fill="${P.wood}"/></g>
  <g>${shift(3, "-40 0;12 0;12 0", 'keyTimes="0;0.6;1"')}${fade(3, "1;1;0", 'keyTimes="0;0.62;0.85"')}
    ${kid({ x: 148, y: 148, s: 1.05, shirt: P.gold, armLBase: 20, armRBase: -20, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
  </g>`);

// explain — this arrow is why: from here to there.
SCENES.explain = () => scene(`
  <g transform="translate(176 84)"><rect x="-44" y="-32" width="88" height="60" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/><circle cx="-24" cy="-8" r="9" fill="${P.teal}"/><circle cx="24" cy="-8" r="9" fill="${P.gold}"/><path d="M-12 -8 H10 M4 -14 L12 -8 L4 -2" fill="none" stroke="${P.line}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="36" stroke-dashoffset="36"><animate attributeName="stroke-dashoffset" values="36;0;0" keyTimes="0;0.5;1" dur="2.6s" repeatCount="indefinite"/></path><path d="M-24 12 H24" stroke="#c6d2dc" stroke-width="2.4"/></g>
  ${kid({ x: 92, y: 148, s: 1.15, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -95, armRAnim: rot(2, "-6 0 0;8 0 0;-6 0 0") })}`);

// explore — map in hand, off into the hills.
SCENES.explore = () => scene(`
  <path d="M150 152 Q186 112 226 152 Z" fill="#bcd9a8"/><path d="M196 152 Q226 122 258 152 Z" fill="#a8cd92"/>
  ${sun(226, 40)}
  ${kid({ x: 104, y: 148, s: 1.1, shirt: P.green, mouth: "o",
    armLBase: -60, armRBase: 60,
    armRHold: `<g transform="translate(2 24)"><path d="M-12 -8 L-4 -11 L4 -8 L12 -11 L12 7 L4 10 L-4 7 L-12 10 Z" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.4"/><path d="M-7 0 Q0 -4 7 1" fill="none" stroke="${P.red}" stroke-width="1.6" stroke-dasharray="3 2"/></g>`,
    bodyAnim: shift(1.6, "-8 0;8 0;-8 0") })}`);

// fix — the wheel goes back on, good as new.
SCENES.fix = () => scene(`${tableProp(180, 122)}
  <g transform="translate(180 108)"><rect x="-22" y="-8" width="44" height="14" rx="4" fill="${P.teal}"/><circle cx="-13" cy="9" r="6" fill="${P.line}"/><g>${shift(2.8, "10 16;0 0;0 0;10 16", 'keyTimes="0;0.4;0.85;1"')}${fade(2.8, "0.9;1;1;0.9")}<circle cx="13" cy="9" r="6" fill="${P.line}"/></g></g>
  ${sparkle(208, 86, 0.8, P.gold, fade(2.8, "0;0;1;0", 'keyTimes="0;0.4;0.55;1"'))}
  ${kid({ x: 112, y: 148, s: 1.15, shirt: P.red, armLBase: 12, armRBase: -70,
    armRHold: `<g transform="translate(2 20) rotate(-100)"><path d="M0 0 H14" stroke="${P.grey}" stroke-width="3.2" stroke-linecap="round"/><path d="M14 0 a4 4 0 1 1 4 4" fill="none" stroke="${P.grey}" stroke-width="2.8"/></g>` })}`);

// gather — the leaves come together into one pile.
SCENES.gather = () => scene(`
  <path d="M158 152 Q176 136 194 152 Z" fill="#c98f4a"/>
  ${[[104, 148, 0], [128, 150, 0.4], [230, 148, 0.8]].map(([lx, ly, b]) => `<g transform="translate(${lx} ${ly})"><g>${shift(2.6, `0 0;${176 - lx} ${144 - ly};${176 - lx} ${144 - ly}`, `keyTimes="0;0.6;1" begin="${-b}s"`)}${fade(2.6, "1;1;0", `keyTimes="0;0.62;0.75" begin="${-b}s"`)}<path d="M0 0 Q4 -6 9 -6 Q7 0 2 2 Z" fill="#c98f4a"/></g></g>`).join("")}
  ${kid({ x: 76, y: 148, s: 1.05, shirt: P.gold, armLBase: 12, armRBase: -70,
    armRHold: `<g transform="translate(2 20) rotate(-125)"><path d="M0 0 V22" stroke="${P.wood}" stroke-width="2.6"/><path d="M-7 22 H7 M-7 22 V28 M-2.4 22 V28 M2.4 22 V28 M7 22 V28" stroke="${P.wood}" stroke-width="2" stroke-linecap="round"/></g>`,
    armRAnim: rot(1.3, "-10 0 0;10 0 0;-10 0 0") })}`);

// include — the circle opens, and there is room for one more.
SCENES.include = () => scene(`${sun(38, 30)}
  <g>${shift(3, "0 0;-14 0;-14 0", 'keyTimes="0;0.4;1"')}${kid({ x: 110, y: 148, s: 0.95, shirt: P.teal, armLBase: 12, armRBase: -60 })}</g>
  <g>${shift(3, "0 0;14 0;14 0", 'keyTimes="0;0.4;1"')}${kid({ x: 152, y: 148, s: 0.95, shirt: P.gold, flip: true, armLBase: 12, armRBase: -60 })}</g>
  <g>${shift(3, "0 26;0 26;0 0;0 0", 'keyTimes="0;0.35;0.65;1"')}${fade(3, "0.4;0.4;1;1", 'keyTimes="0;0.35;0.65;1"')}${kid({ x: 131, y: 122, s: 0.95, shirt: P.red, mouth: "o", armLBase: 25, armRBase: -25 })}</g>`);

// introduce — this is my friend.
SCENES.introduce = () => scene(`
  ${speechBubble(130, 46, 76, 26, bubbleText("This is Sami!", 10), fade(2.6, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"'))}
  ${kid({ x: 130, y: 148, s: 1.1, shirt: P.purple, mouth: "o", armLBase: -70, armRBase: -70 })}
  ${kid({ x: 70, y: 148, s: 1.02, shirt: P.gold, armLBase: 12, armRBase: -140, armRAnim: rot(1, "-10 0 0;12 0 0;-10 0 0") })}
  ${kid({ x: 192, y: 148, s: 1.02, shirt: P.teal, flip: true, armLBase: 12, armRBase: -140, armRAnim: rot(1, "-10 0 0;12 0 0;-10 0 0") })}`);

// mark — a big tick, well done.
SCENES.mark = () => boardScene(`${boardText("2 + 2 = 4", 13, P.line, -12)}<path d="M-14 10 l7 8 l16 -18" fill="none" stroke="${P.green}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="42" stroke-dashoffset="42"><animate attributeName="stroke-dashoffset" values="42;0;0" keyTimes="0;0.4;1" dur="2.6s" repeatCount="indefinite"/></path>`, { shirt: P.green });

// measure — the ruler tells you how long.
SCENES.measure = () => scene(`${tableProp(172, 122)}
  <g transform="translate(172 104)"><rect x="-34" y="-6" width="68" height="12" rx="2" fill="${P.gold}"/>${[-26, -18, -10, -2, 6, 14, 22].map((mx) => `<path d="M${mx} -6 V-1" stroke="#a06d1e" stroke-width="1.6"/>`).join("")}</g>
  <path d="M138 88 H206" stroke="${P.teal}" stroke-width="4" stroke-linecap="round"/>
  <text x="172" y="76" text-anchor="middle" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="13" font-weight="bold" fill="${P.line}">10${fade(2.6, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}</text>
  ${kid({ x: 100, y: 148, s: 1.1, shirt: P.blue, armLBase: 12, armRBase: -75 })}`);

// multiply — two rows of three make six.
SCENES.multiply = () => boardScene(`${boardText("2 × 3", 15, P.line, -24)}${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${(i % 3) * 16 - 16}" cy="${Math.floor(i / 3) * 14 + 2}" r="4.4" fill="${P.purple}"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${(0.1 + i * 0.11).toFixed(2)};${(0.18 + i * 0.11).toFixed(2)};1" dur="3s" repeatCount="indefinite"/></circle>`).join("")}`, { shirt: P.blue });

// organise — every toy into its own colour bin.
SCENES.organise = () => scene(`
  ${[[128, P.red], [172, P.teal], [216, P.gold]].map(([bx, c]) => `<g transform="translate(${bx} 148)"><path d="M-17 -22 L17 -22 L13 0 H-13 Z" fill="${c}"/></g>`).join("")}
  ${[[100, 92, P.red, 128, 0], [116, 78, P.teal, 172, 0.9], [132, 90, P.gold, 216, 1.8]].map(([ix, iy, c, bx, b]) => `<g transform="translate(${ix} ${iy})"><g>${shift(2.7, `0 0;${bx - ix} ${118 - iy};${bx - ix} ${130 - iy}`, `keyTimes="0;0.5;0.62" begin="${-b}s"`)}${fade(2.7, "1;1;0", `keyTimes="0;0.56;0.64" begin="${-b}s"`)}<circle r="6.5" fill="${c}"/></g></g>`).join("")}
  ${kid({ x: 72, y: 148, s: 1.05, shirt: P.purple, armLBase: 12, armRBase: -80 })}`);

// perform — a bow on the stage, and the crowd claps.
SCENES.perform = () => scene(`
  <rect x="46" y="40" width="168" height="112" fill="#3a2d52"/>
  <ellipse cx="130" cy="120" rx="34" ry="40" fill="#f6ecc9" opacity="0.85"/>
  <rect x="46" y="40" width="34" height="112" fill="${P.red}"/><path d="M54 40 V152 M64 40 V152 M74 40 V152" stroke="#c23e3a" stroke-width="3"/>
  <rect x="180" y="40" width="34" height="112" fill="${P.red}"/><path d="M188 40 V152 M198 40 V152 M208 40 V152" stroke="#c23e3a" stroke-width="3"/>
  <rect x="40" y="32" width="180" height="10" rx="4" fill="#8f2723"/>
  ${[0, 1].map((i) => sparkle(226 + i * 8, 70 + i * 24, 0.7, P.gold, fade(1.2, "0;1;0", `begin="${-i * 0.4}s"`))).join("")}
  <g transform="translate(130 148)"><g>${rot(2.8, "0 0 0;0 0 0;16 0 0;16 0 0;0 0 0", 'keyTimes="0;0.3;0.48;0.8;1"')}${kid({ x: 0, y: 0, s: 1.05, shirt: P.purple, armLBase: -45, armRBase: 45 })}</g></g>`);

// prepare — everything into the bowl before the baking starts.
SCENES.prepare = () => scene(`${tableProp(168, 122)}
  <path d="M142 104 Q142 122 168 122 Q194 122 194 104 Q181 110 168 110 Q155 110 142 104 Z" fill="#fff1d6" stroke="#e0b96a" stroke-width="2"/>
  <g transform="translate(150 76)"><g>${shift(2.6, "0 0;16 22;16 26", 'keyTimes="0;0.4;0.5"')}${fade(2.6, "1;1;0", 'keyTimes="0;0.45;0.55"')}<ellipse rx="5.5" ry="7" fill="#fffdf5" stroke="${P.grey}" stroke-width="1.2"/></g></g>
  <g transform="translate(196 96)"><g>${rot(1.4, "-14 0 -10;14 0 -10;-14 0 -10")}<path d="M0 -10 V10" stroke="${P.wood}" stroke-width="3" stroke-linecap="round"/><ellipse cy="13" rx="5" ry="6" fill="${P.wood}"/></g></g>
  ${kid({ x: 100, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -85 })}`);

// present — the chart, shown to everyone.
SCENES.present = () => scene(`
  <g transform="translate(176 92)"><path d="M-34 30 L-44 52 M34 30 L44 52 M0 30 V52" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/><rect x="-40" y="-34" width="80" height="64" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/><rect x="-26" y="6" width="12" height="16" fill="${P.teal}"/><rect x="-6" y="-6" width="12" height="28" fill="${P.gold}"/><rect x="14" y="-16" width="12" height="38" fill="${P.red}"/></g>
  ${kid({ x: 92, y: 148, s: 1.15, shirt: P.teal, mouth: "o", armLBase: 12, armRBase: -95, armRAnim: rot(2, "-8 0 0;6 0 0;-8 0 0") })}`);

// preview — a first little look before the whole story.
SCENES.preview = () => scene(`${tableProp(160, 124)}
  <g transform="translate(160 124)"><rect x="-24" y="-18" width="48" height="18" rx="2" fill="${P.purple}"/><g>${rot(2.8, "0 -24 0;-28 -24 0;-28 -24 0;0 -24 0", 'keyTimes="0;0.35;0.75;1"')}<rect x="-24" y="-22" width="48" height="6" rx="2" fill="#6f54a3"/></g>${sparkle(0, -30, 0.7, P.gold, fade(2.8, "0;0;1;1;0", 'keyTimes="0;0.35;0.5;0.75;1"'))}</g>
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -75, headAnim: rot(2.8, "0 0 -47;8 0 -47;8 0 -47;0 0 -47", 'keyTimes="0;0.35;0.75;1"') })}`);

// protect — the umbrella keeps the puppy dry.
SCENES.protect = () => scene(`
  ${[0, 1, 2, 3].map((i) => `<path d="M${76 + i * 26} 46 l-4 14" stroke="${P.water}" stroke-width="2.4" stroke-linecap="round">${fade(0.9, "0;1;0", `begin="${-i * 0.22}s"`)}${shift(0.9, "0 0;0 22", `begin="${-i * 0.22}s"`)}</path>`).join("")}
  <g transform="translate(174 148)">${puppyProp(rot(0.7, "-12 0 0;12 0 0;-12 0 0"))}</g>
  ${kid({ x: 118, y: 148, s: 1.15, shirt: P.red,
    armLBase: 12, armRBase: -95,
    armRHold: `<g transform="translate(2 22)"><path d="M0 4 V-26" stroke="${P.wood}" stroke-width="2.8"/><path d="M-34 -26 Q0 -54 34 -26 Q22 -32 12 -26 Q0 -34 -12 -26 Q-22 -32 -34 -26 Z" fill="${P.teal}" transform="translate(28 0)"/></g>` })}`);

// record — writing down what the bird really did.
SCENES.record = () => scene(`
  <path d="M186 66 Q206 58 226 66" fill="none" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/>
  <g transform="translate(206 56)"><path d="M0 0 Q6 -3 10 1 Q6 4 0 2 Q-7 6 -12 3 Q-8 -1 0 0 Z" fill="${P.teal}"/><circle cx="8" cy="-1" r="3.4" fill="${P.teal}"/><path d="M10.5 -1.5 L14 -0.5 L10.5 0.8 Z" fill="${P.gold}"/></g>
  <g transform="translate(120 96)"><rect x="-20" y="-26" width="40" height="52" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/><rect x="-8" y="-30" width="16" height="7" rx="3" fill="${P.grey}"/>${[-14, -4, 6].map((ly, i) => `<path d="M-13 ${ly} H13" stroke="#c6d2dc" stroke-width="2.4"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${(0.15 + i * 0.25).toFixed(2)};${(0.25 + i * 0.25).toFixed(2)};1" dur="3s" repeatCount="indefinite"/></path>`).join("")}</g>
  ${kid({ x: 76, y: 148, s: 1.05, shirt: P.green, armLBase: 12, armRBase: -85 })}`);

// recycle — the bottle goes round again.
SCENES.recycle = () => scene(`
  <g transform="translate(178 148)"><path d="M-19 -26 L19 -26 L15 0 H-15 Z" fill="${P.green}"/><g transform="translate(0 -13)"><g>${rot(4, "0 0 0;360 0 0")}${[0, 120, 240].map((a) => `<path d="M0 -7 L3 -2 H-3 Z M0 -7 L1.4 -4" fill="#fffdf5" stroke="#fffdf5" stroke-width="1.2" transform="rotate(${a}) translate(0 0)"/>`).join("")}</g></g></g>
  <g transform="translate(124 92)"><g>${shift(2.6, "0 0;50 24;54 36", 'keyTimes="0;0.5;0.62"')}${fade(2.6, "1;1;0", 'keyTimes="0;0.56;0.66"')}<path d="M-4 -12 H4 V-7 Q7 -4 7 2 V12 H-7 V2 Q-7 -4 -4 -7 Z" fill="${P.water}" stroke="#6fb3e0" stroke-width="1.4"/></g></g>
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -85 })}`);

// repeat — say it once, then say it again.
SCENES.repeat = () => scene(`
  ${speechBubble(90, 54, 46, 28, bubbleText("cat", 14), fade(3, "1;1;0;0;1", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${speechBubble(180, 54, 46, 28, bubbleText("cat", 14), fade(3, "0;0;1;1;0", 'keyTimes="0;0.42;0.5;0.92;1"'))}
  ${kid({ x: 100, y: 148, s: 1.1, shirt: P.teal, mouth: "o", armLBase: 12, armRBase: -60 })}
  ${kid({ x: 170, y: 148, s: 1.1, shirt: P.gold, mouth: "o", flip: true, armLBase: 12, armRBase: -60 })}`);

// retell — the story comes out of the book and into your own words.
SCENES.retell = () => scene(`${tableProp(96, 128)}
  <g transform="translate(96 128)"><rect x="-16" y="-22" width="32" height="22" rx="2" fill="${P.purple}"/><path d="M-16 -16 H16" stroke="#6f54a3" stroke-width="1.8"/></g>
  ${speechBubble(180, 58, 66, 40, `<path d="M-14 8 L-8 -12 L-2 8 Z M-11 2 H-5" fill="none" stroke="${P.grey}" stroke-width="2" stroke-linejoin="round"/><path d="M6 -8 L8.4 -1.4 L15 0 L8.4 1.4 L6 8 L3.6 1.4 L-3 0 L3.6 -1.4 Z" fill="${P.gold}" transform="translate(8 -2)"/>`, fade(2.4, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"'))}
  ${kid({ x: 130, y: 148, s: 1.1, shirt: P.red, mouth: "o", armLBase: 12, armRBase: -110 })}`);

// rewrite — the scribbles become neat lines.
SCENES.rewrite = () => scene(`
  <g>${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.46;0.92;1"')}<rect x="96" y="58" width="52" height="66" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/><path d="M104 76 q8 -8 12 2 q6 -10 10 0 q6 -8 12 2 M104 94 q10 -10 16 0 q8 -8 16 2" fill="none" stroke="${P.grey}" stroke-width="2" stroke-linecap="round"/></g>
  <g opacity="0">${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.46;0.92;1"')}<rect x="164" y="58" width="52" height="66" rx="4" fill="#fffdf5" stroke="${P.grey}" stroke-width="2"/>${[74, 88, 102].map((ly) => `<path d="M172 ${ly} H208" stroke="${P.blue}" stroke-width="2.6" stroke-linecap="round"/>`).join("")}</g>
  ${kid({ x: 66, y: 148, s: 1.05, shirt: P.purple, armLBase: 12, armRBase: -85 })}`);

// separate — the reds go one way, the blues the other.
SCENES.separate = () => scene(`${tableProp(160, 122)}
  <g>${shift(2.8, "0 0;-26 0;-26 0;0 0", 'keyTimes="0;0.5;0.85;1"')}${[[-10, -4], [2, -12]].map(([dx, dy]) => `<circle cx="${150 + dx}" cy="${106 + dy}" r="7" fill="${P.red}"/>`).join("")}</g>
  <g>${shift(2.8, "0 0;26 0;26 0;0 0", 'keyTimes="0;0.5;0.85;1"')}${[[10, -4], [-2, -14]].map(([dx, dy]) => `<circle cx="${170 + dx}" cy="${106 + dy}" r="7" fill="${P.blue}"/>`).join("")}</g>
  ${kid({ x: 92, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -75 })}`);

// solve — the missing number clicks into place.
SCENES.solve = () => boardScene(`${boardText("2 + ? = 5", 14, P.line, -12)}<g>${fade(2.8, "0;0;1;1", 'keyTimes="0;0.45;0.6;1"')}${boardText("3", 22, P.green, 16)}${sparkle(22, 14, 0.7, P.gold)}</g>`, { shirt: P.teal, mouth: "o" });

// sort — circles in one tray, squares in the other.
SCENES.sort = () => scene(`
  ${[[128, "circle"], [196, "square"]].map(([bx, kind]) => `<g transform="translate(${bx} 148)"><path d="M-24 -14 H24 L19 0 H-19 Z" fill="${P.wood}"/>${kind === "circle" ? `<circle cx="-16" cy="-20" r="5" fill="${P.teal}"/>` : `<rect x="-21" y="-25" width="10" height="10" fill="${P.red}"/>`}</g>`).join("")}
  ${[[100, 84, "circle", 128, 0], [116, 72, "square", 196, 1.3]].map(([ix, iy, kind, bx, b]) => `<g transform="translate(${ix} ${iy})"><g>${shift(2.6, `0 0;${bx - ix} ${120 - iy};${bx - ix} ${132 - iy}`, `keyTimes="0;0.5;0.62" begin="${-b}s"`)}${fade(2.6, "1;1;0", `keyTimes="0;0.56;0.64" begin="${-b}s"`)}${kind === "circle" ? `<circle r="6.5" fill="${P.teal}"/>` : `<rect x="-6" y="-6" width="12" height="12" fill="${P.red}"/>`}</g></g>`).join("")}
  ${kid({ x: 72, y: 148, s: 1.05, shirt: P.blue, armLBase: 12, armRBase: -80 })}`);

// subtract — five dots, take two away.
SCENES.subtract = () => boardScene(`${boardText("5 − 2", 15, P.line, -24)}${[0, 1, 2, 3, 4].map((i) => `<circle cx="${i * 15 - 30}" cy="6" r="4.6" fill="${i > 2 ? P.red : P.teal}">${i > 2 ? fade(2.8, "1;1;0.15;0.15", 'keyTimes="0;0.4;0.55;1"') : ""}</circle>`).join("")}`, { shirt: P.red });

// travel — the bus rolls right across town.
SCENES.travel = () => scene(`
  ${[[70, 44], [150, 36], [216, 50]].map(([cx, cy]) => `<g transform="translate(${cx} ${cy})"><ellipse rx="16" ry="7" fill="#ffffff" opacity="0.9"/><ellipse cx="10" cy="-3" rx="10" ry="6" fill="#ffffff" opacity="0.9"/></g>`).join("")}
  <g>${shift(4, "-96 0;96 0")}
    <g transform="translate(130 128)"><rect x="-52" y="-30" width="104" height="42" rx="8" fill="${P.gold}"/><rect x="-42" y="-22" width="20" height="16" rx="3" fill="#cfe6f5"/><rect x="-14" y="-22" width="20" height="16" rx="3" fill="#cfe6f5"/><rect x="14" y="-22" width="20" height="16" rx="3" fill="#cfe6f5"/><g transform="translate(-30 12)"><g>${rot(0.8, "0 0 0;360 0 0")}<circle r="8" fill="${P.line}"/><path d="M0 -8 V8 M-8 0 H8" stroke="#5b6b7c" stroke-width="2"/></g></g><g transform="translate(30 12)"><g>${rot(0.8, "0 0 0;360 0 0")}<circle r="8" fill="${P.line}"/><path d="M0 -8 V8 M-8 0 H8" stroke="#5b6b7c" stroke-width="2"/></g></g><g transform="translate(-32 -18) scale(0.55)"><circle cy="0" r="10" fill="${P.skin}"/><path d="M-10 -1 a10 10 0 0 1 20 0 z" fill="${P.hair}"/></g></g>
  </g>`);

// whisper — quietly, just for one friend to hear.
SCENES.whisper = () => scene(`
  <g transform="translate(148 58)"><g>${fade(2.4, "0;1;1;0", 'keyTimes="0;0.2;0.8;1"')}<path d="M-18 -8 Q0 -16 18 -8" fill="none" stroke="${P.grey}" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/><circle cx="-8" cy="0" r="1.6" fill="${P.grey}"/><circle cx="0" cy="2" r="1.6" fill="${P.grey}"/><circle cx="8" cy="0" r="1.6" fill="${P.grey}"/></g></g>
  ${kid({ x: 108, y: 148, s: 1.1, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -125 })}
  ${kid({ x: 172, y: 148, s: 1.05, shirt: P.gold, flip: true, armLBase: 12, armRBase: -12, headAnim: rot(2.4, "8 0 -47;8 0 -47") })}`);

// ============================================================ state verbs
// The third tranche (owner, 2026-08-31): the 30 verbs the first two tranches
// deliberately skipped. The genuinely MENTAL ones get the thought-bubble
// convention — a cloud over the child's head showing what is in the mind, the
// picture-book grammar every five-year-old already reads. The abstract ones
// that are NOT mental (become, cause, happen, continue…) would be lied about
// by a bubble, so they get event scenes instead: a caterpillar becomes a
// butterfly, a finger causes the dominoes to fall, a balloon popping happens.
// Only "beginning" and "pound" stay absent — suspect verb tags, not verbs.

const thoughtBubble = (x, y, w, h, inner, anim = "") =>
  `<g transform="translate(${x} ${y})"><g>${anim === "" ? fade(2.6, "0;1;1;0", 'keyTimes="0;0.15;0.85;1"') : anim}
    <ellipse rx="${w / 2}" ry="${h / 2}" fill="${P.bubble}" stroke="${P.grey}" stroke-width="1.5"/>
    <circle cx="${-w / 2 + 4}" cy="${h / 2 + 7}" r="4.2" fill="${P.bubble}" stroke="${P.grey}" stroke-width="1.4"/>
    <circle cx="${-w / 2 - 4}" cy="${h / 2 + 16}" r="2.6" fill="${P.bubble}" stroke="${P.grey}" stroke-width="1.3"/>
    ${inner}
  </g></g>`;
const heartShape = (x, y, s, color = P.red) => `<path d="M0 3 C-1 0 -6 -3 -6 -7 a3.6 3.6 0 0 1 6 -2.6 A3.6 3.6 0 0 1 6 -7 C6 -3 1 0 0 3 Z" fill="${color}" transform="translate(${x} ${y}) scale(${s})"/>`;
const starShape = (x, y, s, color = P.gold) => `<path d="M0 -8 L2.2 -2.4 L8 -2 L3.6 1.8 L5 7.6 L0 4.4 L-5 7.6 L-3.6 1.8 L-8 -2 L-2.2 -2.4 Z" fill="${color}" transform="translate(${x} ${y}) scale(${s})"/>`;

// like — a heart for the football in the mind.
SCENES.like = () => scene(`${sun(38, 30)}
  ${thoughtBubble(178, 58, 62, 38, `<g transform="translate(-10 2) scale(0.9)">${football(9)}</g>${heartShape(16, -2, 1.1)}`)}
  ${kid({ x: 122, y: 148, s: 1.15, shirt: P.red, armLBase: 12, armRBase: -12 })}`);

// want — the teddy on the shelf, and the same teddy in the bubble.
SCENES.want = () => {
  const teddy = `<g><circle cy="-6" r="6" fill="#c8965c"/><circle cx="-4.4" cy="-10.5" r="2.2" fill="#c8965c"/><circle cx="4.4" cy="-10.5" r="2.2" fill="#c8965c"/><ellipse cy="2.6" rx="7" ry="6" fill="#c8965c"/><circle cx="-1.8" cy="-7" r="0.9" fill="${P.line}"/><circle cx="1.8" cy="-7" r="0.9" fill="${P.line}"/></g>`;
  return scene(`
  <path d="M168 84 H236" stroke="${P.wood}" stroke-width="5" stroke-linecap="round"/>
  <g transform="translate(206 82)">${teddy}</g>
  ${thoughtBubble(96, 56, 54, 38, `<g transform="translate(0 2)">${teddy}</g>${sparkle(19, -10, 0.6, P.gold)}`)}
  ${kid({ x: 138, y: 148, s: 1.15, shirt: P.purple, mouth: "o", armLBase: 12, armRBase: -65 })}`);
};

// hope — rain at the window, sunshine in the bubble.
SCENES.hope = () => scene(`
  ${[0, 1, 2].map((i) => `<path d="M${66 + i * 22} 48 l-4 12" stroke="${P.water}" stroke-width="2.4" stroke-linecap="round">${fade(0.9, "0;1;0", `begin="${-i * 0.3}s"`)}${shift(0.9, "0 0;0 20", `begin="${-i * 0.3}s"`)}</path>`).join("")}
  ${thoughtBubble(182, 60, 58, 40, `<circle cy="0" r="9" fill="#ffd166"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -13 V-16" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round" transform="rotate(${a})"/>`).join("")}`)}
  ${kid({ x: 122, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -12, headAnim: rot(2.6, "-6 0 -47;4 0 -47;-6 0 -47") })}`);

// know — the answer is already there, hand up and sure.
SCENES.know = () => scene(`
  <g transform="translate(84 84)"><rect x="-34" y="-30" width="68" height="48" rx="4" fill="#2f4f43"/><rect x="-38" y="-34" width="76" height="6" rx="3" fill="${P.wood}"/>${boardText("2 + 2 = ?", 13, "#fffdf5", -2)}</g>
  ${thoughtBubble(196, 56, 44, 34, boardText("4", 20, P.green))}
  ${kid({ x: 156, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -160 })}`);

// need — a hot day, and the one thing that matters is water.
SCENES.need = () => scene(`${sun(38, 28)}
  <path d="M148 74 q-3 5 0 8 q4 -3 0 -8 Z" fill="${P.water}">${fade(1.8, "0;1;0")}${shift(1.8, "0 0;0 8")}</path>
  ${thoughtBubble(192, 58, 50, 38, `<path d="M-8 -10 L8 -10 L6 8 Q0 12 -6 8 Z" fill="${P.water}" stroke="#6fb3e0" stroke-width="1.4"/><path d="M-4 -13 L2 -22" stroke="${P.red}" stroke-width="2" stroke-linecap="round"/>`)}
  ${kid({ x: 130, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 30, armRBase: -30 })}`);

// think — a question mark becomes an idea.
SCENES.think = () => scene(`
  ${thoughtBubble(180, 56, 52, 40, `<g>${fade(3, "1;1;0;0;1", 'keyTimes="0;0.4;0.48;0.9;1"')}${bubbleText("?", 20)}</g><g opacity="0">${fade(3, "0;0;1;1;0", 'keyTimes="0;0.4;0.48;0.9;1"')}<circle cy="-2" r="7" fill="${P.gold}"/><path d="M-2.6 7 H2.6 M-1.8 10.4 H1.8" stroke="#d88f22" stroke-width="1.8" stroke-linecap="round"/></g>`, `${fade(3, "1;1")}`)}
  ${kid({ x: 124, y: 148, s: 1.15, shirt: P.blue, armLBase: 12, armRBase: -108, headAnim: rot(3, "6 0 -47;6 0 -47") })}`);

// agree — two minds with the very same picture in them.
SCENES.agree = () => scene(`
  ${thoughtBubble(78, 52, 42, 30, `<g transform="scale(0.75)">${football(9)}</g>`, fade(2.6, "1;1"))}
  ${thoughtBubble(182, 52, 42, 30, `<g transform="scale(0.75)">${football(9)}</g>`, fade(2.6, "1;1"))}
  <path d="M121 60 l5 6 l11 -13" fill="none" stroke="${P.green}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${fade(2.6, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}</path>
  ${kid({ x: 94, y: 148, s: 1.1, shirt: P.teal, armLBase: 12, armRBase: -12, headAnim: rot(1.4, "-5 0 -47;5 0 -47;-5 0 -47") })}
  ${kid({ x: 168, y: 148, s: 1.1, shirt: P.gold, flip: true, armLBase: 12, armRBase: -12, headAnim: rot(1.4, "-5 0 -47;5 0 -47;-5 0 -47") })}`);

// annoy — the fly will not go away.
SCENES.annoy = () => scene(`${sun(38, 30)}
  <g><animateMotion path="M150 78 q20 -14 34 0 q-12 12 -34 8 q-20 -6 0 -8" dur="2.2s" repeatCount="indefinite"/><ellipse rx="3.4" ry="2.4" fill="${P.line}"/><ellipse cx="-1" cy="-2.4" rx="2.2" ry="1.4" fill="#9fb4c4" transform="rotate(-30)"/><ellipse cx="1" cy="-2.4" rx="2.2" ry="1.4" fill="#9fb4c4" transform="rotate(30)"/></g>
  <path d="M118 96 l4 -3 M132 96 l-4 -3" stroke="${P.line}" stroke-width="1.8" stroke-linecap="round"/>
  ${kid({ x: 125, y: 148, s: 1.15, shirt: P.gold, mouth: "o", armLBase: 12, armRBase: -120, armRAnim: rot(0.5, "-16 0 0;16 0 0;-16 0 0") })}`);

// believe — held to the heart, and true.
SCENES.believe = () => scene(`${sun(38, 30)}
  ${thoughtBubble(184, 56, 52, 38, `${starShape(-6, 0, 1)}<path d="M6 2 l4 5 l9 -11" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)}
  ${kid({ x: 126, y: 148, s: 1.15, shirt: P.purple, armLBase: 12, armRBase: -68 })}`);

// dare — the big step, and the self in the bubble already up there.
SCENES.dare = () => scene(`
  ${boxProp(188, 148, 56, 44, P.grey, `<path d="M-28 -44 H28" stroke="#7c8a97" stroke-width="2"/>`)}
  ${thoughtBubble(92, 52, 56, 40, `<g transform="translate(0 12) scale(0.5)">${kid({ x: 0, y: 0, s: 1, shirt: P.red, mouth: "o", armLBase: 145, armRBase: -145 })}</g>${sparkle(20, -10, 0.55, P.gold)}`)}
  ${kid({ x: 128, y: 148, s: 1.15, shirt: P.red, mouth: "o", armLBase: 25, armRBase: -25, bodyAnim: shift(1.4, "0 0;0 -3;0 0") })}`);

// decide — two choices in one bubble, and the tick lands on one.
SCENES.decide = () => scene(`
  ${thoughtBubble(178, 58, 74, 44, `<path d="M0 -16 V16" stroke="${P.grey}" stroke-width="1.4" stroke-dasharray="3 3"/><g transform="translate(-17 2)"><circle r="8" fill="${P.red}"/><path d="M0 -8 Q1 -11 3 -12" fill="none" stroke="${P.green}" stroke-width="1.8" stroke-linecap="round"/></g><g transform="translate(17 0)"><circle cy="2" r="7" fill="${P.gold}"/><circle cx="-2" cy="0" r="1" fill="#8a5a33"/><circle cx="3" cy="4" r="1" fill="#8a5a33"/></g><path d="M-24 12 l4 5 l9 -11" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${fade(2.8, "0;0;1;1", 'keyTimes="0;0.5;0.65;1"')}</path>`, fade(2.8, "1;1"))}
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -108 })}`);

// enjoy — on the swing, and loving every bit of it.
SCENES.enjoy = () => scene(`
  <path d="M96 44 L86 148 M164 44 L174 148" stroke="${P.wood}" stroke-width="5" stroke-linecap="round"/>
  <path d="M76 46 H184" stroke="${P.wood}" stroke-width="6" stroke-linecap="round"/>
  <g transform="translate(130 48)"><g>${rot(2.2, "-14 0 0;14 0 0;-14 0 0")}<path d="M-14 0 V72 M14 0 V72" stroke="#8a6a48" stroke-width="2.6"/><rect x="-20" y="70" width="40" height="7" rx="3" fill="${P.wood}"/><g transform="translate(0 62)">${kid({ x: 0, y: 0, s: 0.95, shirt: P.gold, mouth: "o", legs: "seated", armLBase: -55, armRBase: 55 })}</g></g></g>
  ${[0, 1].map((i) => `<g transform="translate(${186 + i * 16} ${76 - i * 14})">${heartShape(0, 0, 0.8 - i * 0.2)}<animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="${-i * 0.9}s" repeatCount="indefinite"/></g>`).join("")}`);

// happen — pop! Something just took place.
SCENES.happen = () => scene(`${sun(38, 30)}
  <g>${fade(2.4, "1;1;0;0;1", 'keyTimes="0;0.42;0.47;0.94;1"')}<g transform="translate(168 84)"><g>${shift(2.4, "0 0;0 -5;0 0")}<ellipse rx="16" ry="19" fill="${P.red}"/><path d="M0 19 L-3 25 H3 Z" fill="${P.red}"/><path d="M0 25 Q4 40 0 56" fill="none" stroke="${P.grey}" stroke-width="1.6"/></g></g></g>
  <g opacity="0">${fade(2.4, "0;0;1;1;0", 'keyTimes="0;0.42;0.47;0.94;1"')}<g transform="translate(168 84)">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -10 L0 -20" stroke="${P.red}" stroke-width="3" stroke-linecap="round" transform="rotate(${a})"/>`).join("")}${bubbleText("POP!", 13)}</g></g>
  ${kid({ x: 104, y: 148, s: 1.15, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -55 })}`);

// imagine — a castle and a dragon, conjured out of nothing.
SCENES.imagine = () => scene(`
  ${thoughtBubble(168, 60, 96, 52, `
    <g transform="translate(-24 6)"><rect x="-12" y="-12" width="24" height="16" fill="#c9b8e8"/><rect x="-16" y="-20" width="8" height="24" fill="#b39fdc"/><rect x="8" y="-20" width="8" height="24" fill="#b39fdc"/><path d="M-16 -20 L-12 -27 L-8 -20 Z M8 -20 L12 -27 L16 -20 Z" fill="${P.purple}"/><rect x="-3" y="-4" width="6" height="8" fill="#6f54a3"/></g>
    <g transform="translate(24 -6)"><g>${shift(1.6, "0 0;0 -4;0 0")}<path d="M-10 2 Q0 -6 10 2 Q4 6 -2 5 Q-7 6 -10 2 Z" fill="${P.green}"/><circle cx="9" cy="-1" r="4" fill="${P.green}"/><path d="M12 -2 q4 0 5 3 q-3 1 -5 -1 Z" fill="${P.red}"/><circle cx="10" cy="-2" r="1" fill="${P.line}"/><path d="M-2 -3 Q-6 -12 2 -10 Z" fill="#8fce9d"/></g></g>`, fade(3, "1;1"))}
  ${kid({ x: 108, y: 148, s: 1.15, shirt: P.purple, armLBase: 12, armRBase: -12, headAnim: rot(3, "-4 0 -47;6 0 -47;-4 0 -47") })}`);

// promise — pinkies linked; it will surely be done.
SCENES.promise = () => scene(`${sun(38, 30)}
  ${heartShape(130, 66, 1.2)}
  <path d="M118 96 Q130 88 142 96" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/>
  ${kid({ x: 102, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -78 })}
  ${kid({ x: 158, y: 148, s: 1.1, shirt: P.teal, flip: true, armLBase: 12, armRBase: -78 })}`);

// remember — yesterday's birthday cake, still there in the mind.
SCENES.remember = () => scene(`
  ${thoughtBubble(180, 58, 66, 44, `
    <g opacity="0.75"><rect x="-16" y="-2" width="32" height="14" rx="3" fill="#d8c4a8"/><rect x="-13" y="-9" width="26" height="8" rx="2" fill="#c9ab88"/>${[-8, 0, 8].map((cx) => `<path d="M${cx} -9 V-14" stroke="#a98f6f" stroke-width="1.8"/><circle cx="${cx}" cy="-15.4" r="1.6" fill="${P.gold}"/>`).join("")}</g>
    <g transform="translate(23 -13)"><circle r="6" fill="none" stroke="${P.grey}" stroke-width="1.6"/><path d="M0 0 V-3.6 M0 0 H2.6" stroke="${P.grey}" stroke-width="1.4" stroke-linecap="round"/></g>`, fade(3, "1;1"))}
  ${kid({ x: 116, y: 148, s: 1.15, shirt: P.gold, armLBase: 12, armRBase: -108, headAnim: rot(3, "5 0 -47;5 0 -47") })}`);

// understand — the light goes on, and it is right.
SCENES.understand = () => scene(`
  <g transform="translate(80 84)"><rect x="-32" y="-28" width="64" height="46" rx="4" fill="#2f4f43"/><rect x="-36" y="-32" width="72" height="6" rx="3" fill="${P.wood}"/>${boardText("2 + 2 = 4", 11, "#fffdf5", -2)}</g>
  ${thoughtBubble(196, 56, 50, 38, `<g>${fade(2.8, "0;0;1;1", 'keyTimes="0;0.35;0.5;1"')}<circle cy="-3" r="7.5" fill="${P.gold}"/><path d="M-2.8 6.5 H2.8 M-2 10 H2" stroke="#d88f22" stroke-width="1.8" stroke-linecap="round"/><path d="M10 4 l3.4 4 l7 -9" fill="none" stroke="${P.green}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`, fade(2.8, "1;1"))}
  ${kid({ x: 152, y: 148, s: 1.15, shirt: P.green, armLBase: 12, armRBase: -12 })}`);

// accept — a yes, a nod, and the gift is taken.
SCENES.accept = () => scene(`${sun(38, 30)}
  <g transform="translate(130 92)">${boxProp(0, 10, 24, 18, P.teal, `<path d="M-12 -9 H12 M0 -18 V0" stroke="${P.gold}" stroke-width="2.4"/>`)}</g>
  <path d="M170 62 l5 6 l10 -12" fill="none" stroke="${P.green}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${fade(2.4, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}</path>
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.purple, armLBase: 12, armRBase: -82 })}
  ${kid({ x: 172, y: 148, s: 1.1, shirt: P.gold, flip: true, armLBase: 12, armRBase: -82, headAnim: rot(1.2, "-6 0 -47;6 0 -47;-6 0 -47") })}`);

// become — the caterpillar becomes a butterfly.
SCENES.become = () => scene(`${sun(38, 30)}
  <path d="M96 152 Q108 118 100 96 M100 118 Q112 114 118 106" fill="none" stroke="${P.green}" stroke-width="4" stroke-linecap="round"/>
  <g>${fade(3.4, "1;1;0;0;1", 'keyTimes="0;0.38;0.45;0.93;1"')}<g transform="translate(150 142)">${[0, 1, 2, 3].map((i) => `<circle cx="${i * 9}" cy="${-Math.sin(i * 1.1) * 3}" r="5.5" fill="${P.green}"/>`).join("")}<circle cx="-7" cy="-2" r="6" fill="#8fce9d"/><circle cx="-9" cy="-4" r="1" fill="${P.line}"/><path d="M-9 -9 l-2 -4 M-5 -9 l1 -4" stroke="${P.line}" stroke-width="1.2" stroke-linecap="round"/></g></g>
  <g opacity="0">${fade(3.4, "0;0;1;1;0", 'keyTimes="0;0.38;0.45;0.93;1"')}<g transform="translate(160 100)"><g>${shift(1.4, "0 0;0 -6;0 0")}<ellipse cx="-8" cy="0" rx="9" ry="12" fill="${P.purple}" transform="rotate(20)"><animateTransform attributeName="transform" type="rotate" values="0;26;0" dur="0.4s" repeatCount="indefinite" additive="sum"/></ellipse><ellipse cx="8" cy="0" rx="9" ry="12" fill="${P.gold}" transform="rotate(-20)"><animateTransform attributeName="transform" type="rotate" values="0;-26;0" dur="0.4s" repeatCount="indefinite" additive="sum"/></ellipse><rect x="-1.6" y="-9" width="3.2" height="18" rx="1.6" fill="${P.line}"/><path d="M-1 -9 q-2 -5 -5 -6 M1 -9 q2 -5 5 -6" fill="none" stroke="${P.line}" stroke-width="1.2" stroke-linecap="round"/></g></g></g>`);

// belong — the teddy's own basket, marked with its own picture.
SCENES.belong = () => scene(`
  <g transform="translate(178 148)"><path d="M-22 0 H22 L16 -22 H-16 Z" fill="${P.wood}" transform="scale(1 -1)"/><rect x="-11" y="-19" width="22" height="14" rx="2" fill="#fffdf5"/><g transform="translate(0 -12) scale(0.55)"><circle cy="-6" r="6" fill="#c8965c"/><circle cx="-4.4" cy="-10.5" r="2.2" fill="#c8965c"/><circle cx="4.4" cy="-10.5" r="2.2" fill="#c8965c"/><ellipse cy="2.6" rx="7" ry="6" fill="#c8965c"/></g></g>
  <g transform="translate(112 92)"><g>${shift(2.8, "0 0;62 30;66 44", 'keyTimes="0;0.5;0.62"')}${fade(2.8, "1;1;0", 'keyTimes="0;0.56;0.66"')}<circle cy="-6" r="6" fill="#c8965c"/><circle cx="-4.4" cy="-10.5" r="2.2" fill="#c8965c"/><circle cx="4.4" cy="-10.5" r="2.2" fill="#c8965c"/><ellipse cy="2.6" rx="7" ry="6" fill="#c8965c"/><circle cx="-1.8" cy="-7" r="0.9" fill="${P.line}"/><circle cx="1.8" cy="-7" r="0.9" fill="${P.line}"/></g></g>
  ${heartShape(206, 106, 1, P.red)}
  ${kid({ x: 84, y: 148, s: 1.05, shirt: P.teal, armLBase: 12, armRBase: -80 })}`);

// cause — one small push makes all of them fall.
SCENES.cause = () => scene(`
  ${[0, 1, 2, 3].map((i) => `<g transform="translate(${138 + i * 26} 148)"><g>${rot(3, `0 0 0;0 0 0;72 8 0;72 8 0`, `keyTimes="0;${(0.25 + i * 0.09).toFixed(2)};${(0.36 + i * 0.09).toFixed(2)};1"`)}<rect x="-6" y="-38" width="14" height="38" rx="3" fill="${[P.red, P.gold, P.teal, P.purple][i]}"/></g></g>`).join("")}
  ${kid({ x: 96, y: 148, s: 1.1, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -78, armRAnim: rot(3, "-14 0 0;8 0 0;8 0 0;-14 0 0", 'keyTimes="0;0.25;0.6;1"') })}`);

// continue — up the stairs, and keep on going.
SCENES.continue = () => scene(`
  ${[0, 1, 2, 3].map((i) => `<rect x="${118 + i * 30}" y="${148 - (i + 1) * 22}" width="30" height="${(i + 1) * 22 + 4}" fill="${i % 2 ? "#c8d8c2" : "#bccfb6"}"/>`).join("")}
  <path d="M226 48 H244 M238 42 l7 6 l-7 6" fill="none" stroke="${P.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <g>${shift(3, "-28 22;-28 22;2 0;2 0;30 -22", 'keyTimes="0;0.15;0.45;0.6;1"')}${fade(3, "1;1;1;1;0", 'keyTimes="0;0.8;0.9;0.96;1"')}
    ${kid({ x: 132, y: 122, s: 0.95, shirt: P.gold, armLBase: 25, armRBase: -25, bodyAnim: shift(0.5, "0 0;0 -2;0 0") })}
  </g>`);

// forgive — the toy broke, and the hug still happens.
SCENES.forgive = () => scene(`
  <g transform="translate(130 144)"><path d="M-8 0 L-2 -6 M2 -4 L8 0" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/></g>
  ${heartShape(130, 58, 1.3, P.red)}
  <g>${shift(3, "-12 0;0 0;0 0", 'keyTimes="0;0.4;1"')}${kid({ x: 112, y: 148, s: 1.1, shirt: P.red, armLBase: 12, armRBase: -85 })}</g>
  <g>${shift(3, "12 0;0 0;0 0", 'keyTimes="0;0.4;1"')}${kid({ x: 150, y: 148, s: 1.1, shirt: P.teal, flip: true, armLBase: 12, armRBase: -85 })}</g>`);

// improve — the wobbly letter grows up into a neat one.
SCENES.improve = () => boardScene(`<text x="-22" y="4" text-anchor="middle" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="20" fill="${P.grey}" transform="rotate(-8 -22 0)">a</text><path d="M-6 -2 H6 M2 -6 L8 -2 L2 2" fill="none" stroke="${P.line}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -1)"/><g>${fade(2.8, "0;0;1;1", 'keyTimes="0;0.4;0.55;1"')}${boardText("a", 24, P.green, 4).replace('x="0"', 'x="22"')}${starShape(22, -18, 0.55)}</g>`, { shirt: P.gold });

// manage — a wobbly armful of books, safely held after all.
SCENES.manage = () => scene(`${sun(38, 30)}
  <g>${rot(2.6, "-3 130 148;3 130 148;-3 130 148")}
    ${kid({ x: 130, y: 148, s: 1.15, shirt: P.green, mouth: "o", armLBase: -58, armRBase: 58 })}
    <g transform="translate(130 116)">${[[0, P.red], [-12, P.gold], [-24, P.teal], [-36, P.purple]].map(([dy, c]) => `<rect x="-16" y="${dy - 10}" width="32" height="10" rx="2" fill="${c}"/>`).join("")}</g>
  </g>
  <path d="M186 70 l5 6 l10 -12" fill="none" stroke="${P.green}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${fade(2.6, "0;0;1;1", 'keyTimes="0;0.5;0.65;1"')}</path>`);

// notice — the tiny ladybird, seen.
SCENES.notice = () => scene(`${sun(38, 30)}
  <path d="M168 152 Q186 128 214 136 Q206 152 186 152 Z" fill="${P.green}"/>
  <g transform="translate(192 138)"><ellipse rx="5" ry="4" fill="${P.red}"/><circle cx="4" cy="-1" r="2" fill="${P.line}"/><circle cx="-2" cy="-1.4" r="0.9" fill="${P.line}"/><circle cx="0.5" cy="1.6" r="0.9" fill="${P.line}"/></g>
  <text x="206" y="106" font-family="'Comic Sans MS','Segoe UI',sans-serif" font-size="17" font-weight="bold" fill="${P.gold}">!${fade(2.2, "0;0;1;1;0", 'keyTimes="0;0.35;0.5;0.85;1"')}</text>
  ${kid({ x: 128, y: 148, s: 1.15, shirt: P.blue, mouth: "o", armLBase: 12, armRBase: -60, headAnim: rot(2.2, "0 0 -47;9 0 -47;9 0 -47;0 0 -47", 'keyTimes="0;0.35;0.85;1"') })}`);

// predict — the cloud says rain is coming; the bubble is already ready.
SCENES.predict = () => scene(`
  <g transform="translate(70 40)"><ellipse rx="19" ry="9" fill="#9fb4c4"/><ellipse cx="12" cy="-4" rx="12" ry="7" fill="#9fb4c4"/></g>
  ${thoughtBubble(186, 60, 58, 42, `${[0, 1].map((i) => `<path d="M${-10 + i * 10} -12 l-3 8" stroke="${P.water}" stroke-width="2" stroke-linecap="round">${fade(1, "0;1;0", `begin="${-i * 0.4}s"`)}</path>`).join("")}<g transform="translate(4 6)"><path d="M0 4 V-4" stroke="${P.wood}" stroke-width="2"/><path d="M-12 -4 Q0 -14 12 -4 Q8 -6 4 -4 Q0 -7 -4 -4 Q-8 -6 -12 -4 Z" fill="${P.teal}"/><path d="M0 4 q2 3 4 1" fill="none" stroke="${P.wood}" stroke-width="1.8" stroke-linecap="round"/></g>`, fade(3, "1;1"))}
  ${kid({ x: 126, y: 148, s: 1.15, shirt: P.teal, armLBase: 12, armRBase: -12, headAnim: rot(3, "-8 0 -47;-8 0 -47;5 0 -47;5 0 -47", 'keyTimes="0;0.3;0.5;1"') })}`);

// respect — a chair offered, and a bow of the head for Grandma.
SCENES.respect = () => scene(`
  <g transform="translate(174 148)"><rect x="-4" y="-52" width="44" height="8" rx="3" fill="${P.wood}"/><rect x="-4" y="-30" width="44" height="7" rx="3" fill="${P.wood}"/><rect x="-2" y="-26" width="5" height="26" fill="${P.wood}"/><rect x="33" y="-52" width="5" height="52" fill="${P.wood}"/></g>
  ${heartShape(130, 54, 1.1)}
  ${kid({ x: 128, y: 148, s: 1.05, shirt: P.grey, flip: true, hair: "#e8e4de", armLBase: 12, armRBase: -35 })}
  ${kid({ x: 84, y: 148, s: 1.1, shirt: P.gold, armLBase: 12, armRBase: -80, headAnim: rot(2.4, "0 0 -47;10 0 -47;10 0 -47;0 0 -47", 'keyTimes="0;0.3;0.7;1"') })}`);

// trust — across the stepping stones, holding the hand that leads.
SCENES.trust = () => scene(`
  <rect x="0" y="128" width="260" height="18" fill="${P.water}"/>
  ${[104, 134, 164, 194].map((sx) => `<ellipse cx="${sx}" cy="140" rx="13" ry="5.5" fill="${P.grey}"/>`).join("")}
  ${heartShape(148, 60, 1)}
  <path d="M136 102 Q148 94 160 102" fill="none" stroke="${P.skin}" stroke-width="6.5" stroke-linecap="round"/>
  ${kid({ x: 174, y: 136, s: 1.05, shirt: P.teal, flip: true, armLBase: 12, armRBase: -78, bodyAnim: shift(0.6, "0 0;0 -2;0 0") })}
  ${kid({ x: 122, y: 136, s: 1.05, shirt: P.red, mouth: "o", armLBase: 12, armRBase: -78, bodyAnim: shift(0.6, "0 0;0 -2;0 0") })}`);

// wonder — the night sky is full of question marks.
SCENES.wonder = () => scene(`
  ${[[60, 40], [96, 28], [216, 34], [238, 62]].map(([sx, sy]) => starShape(sx, sy, 0.5, "#f6d96b")).join("")}
  <circle cx="196" cy="40" r="13" fill="#f6ecc9"/><circle cx="190" cy="36" r="11.6" fill="#3a4a6b"/>
  ${thoughtBubble(112, 58, 52, 38, `${bubbleText("?", 18)}${starShape(16, -8, 0.55)}`, fade(3, "1;1"))}
  ${kid({ x: 152, y: 148, s: 1.15, shirt: P.purple, armLBase: 12, armRBase: -12, headAnim: rot(3, "-9 0 -47;-9 0 -47") })}`, { sky: "#3a4a6b", ground: "#41595e" });

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
