// The rest of the Grade 4 shelf.
//
// Grade 4 shipped with one picture book per unit, each built on that unit's
// closing narrative — the post counter, the science tent, the spiral cave. This
// file carries the props the OTHER four books per unit need, so every one of
// the ten units ends with five books rather than one.
//
// Each of those four is built on one of the unit's remaining readings, which is
// why the props read like a list of the Grade 4 curriculum: a radio weather
// desk, a bakery, a circular news board, a bridge under construction, a
// microwave, a telescope dome, an ambulance, a station platform, a shopping
// mall. Nothing here is invented for its own sake; every prop is named in a
// passage a Grade 4 learner has already read.
//
// Additive, exactly as the four kits under it are: this file spreads
// ehel-ebook-kit-grade4.js and adds to it, so no page already on the shelf can
// move. Motion reuses the existing animation classes only — a new @keyframes in
// STYLE is embedded verbatim in every SVG of every book, so it would rewrite
// all of them for a change nobody can see.
//
// The new ANIMALS carry no data-tap. A tap value promises a clip in
// ebooks/tap-sounds/, and there is no dog, horse, snail or cat recording; the
// gate would fail, and if it did not, the tap would be silent. Give one a tap
// in the same change that buys the audio, never before.

const kit4 = require("./ehel-ebook-kit-grade4.js");

const { C, W, H, delayAt, G2, G3, person, CAST4 } = kit4;

// ---------------------------------------------------------------- cast additions
//
// Six more presets, and not one of them is invented: each is a person a Grade 4
// reading names and the shipped books never had to draw, because the shipped
// book per unit was built on the unit's closing narrative and these people are
// in the other four readings. Elena builds the Unit 6 bridge, Talia is the
// animal helper who takes Simba in, the librarian pushes the Unit 4 cart, the
// mayor opens the town meeting, Karim mends the market stall, and the uncle
// takes Amal and Noah to Mombasa.
//
// Leo, Theo, Doctor Sarah, Daniel, Nadia and Officer Rami are NOT here on
// purpose: they are already in the Grade 3 CAST this file inherits, and
// redefining one would make the same child two different children between the
// Grade 3 books and these. Look before adding — the Grade 3 cast is longer than
// the Grade 4 additions suggest.
//
// A person() figure emits data-tap="<name>", and a tap value promises a clip. It
// resolves through TAP_VOICE_GROUPS in shell/subjects/english.js — several human
// characters sharing one voice by type — so every name below is registered
// there in the same change, and check-english-ebooks.mjs proves it. Adding a
// name here without adding it there fails the gate, which is the point.
const CAST_SHELF = {
  ...CAST4,
  elena: { adult: true, skin: G3.skinWarm, hair: G3.hair, style: "bun", top: G3.gold, bottom: "#4a5b6b", legs: "trousers", coat: G3.teal },
  talia: { adult: true, skin: G3.skin, style: "bun", top: G3.leafy, bottom: "#6b5a44", legs: "trousers", apron: "#d8c9a8" },
  librarian: { adult: true, skin: G3.skinWarm, style: "bun", top: G3.plum, bottom: G3.tealDark, legs: "long", glasses: true },
  mayor: { adult: true, skin: G3.skinDeep, hair: G3.hair, style: "crop", top: G3.cream, bottom: "#3d4a5c", legs: "trousers", coat: "#3d4a5c" },
  karim: { adult: true, skin: G3.skinWarm, hair: G3.hair, style: "crop", top: "#8a9a5b", bottom: "#6b5a44", legs: "trousers", apron: "#a8845a" },
  uncle: { adult: true, skin: G3.skin, hair: G3.hair, style: "crop", top: G3.tealDark, bottom: "#6b5a44", legs: "trousers" },
  // Unit 6 names four more roles and gives two of them a pronoun: the governor
  // is "she", the lawyer "he". Drawing either as the other contradicts the page
  // a learner reads beside the book.
  governor: { adult: true, skin: G3.skinDeep, style: "bun", top: G3.cream, bottom: G3.plum, legs: "long", coat: G3.plum, glasses: true },
  lawyer: { adult: true, skin: G3.skinWarm, hair: G3.hair, style: "crop", top: G3.cream, bottom: "#4a5b6b", legs: "trousers", coat: "#4a5b6b", glasses: true },
  caretaker: { adult: true, skin: G3.skin, hair: G3.hairSoft, style: "crop", top: "#4d9d94", bottom: "#4a5b6b", legs: "trousers" },
  labourer: { adult: true, skin: G3.skinDeep, hair: G3.hair, style: "crop", top: "#c98f6a", bottom: "#6b5a44", legs: "trousers", apron: "#a8845a" },
};

function figureShelf(who, options = {}) {
  const preset = CAST_SHELF[who];
  if (!preset) throw new Error(`Unknown Grade 4 shelf character "${who}". Known: ${Object.keys(CAST_SHELF).join(", ")}`);
  return person({ ...preset, ...options, name: who });
}

// ---------------------------------------------------------------- animals
//
// Unit 5 is Action and Movement, and its readings name four animals by the way
// they move: a horse that gallops, a snail that spirals, a cat that squeezes
// through a gap, and Simba, the thin dog the children carry out of the cave.

// Simba. `thin` is the state the children find him in — ribs showing; without
// it he is the dog he becomes once Talia has fed him.
function dog(x, y, s = 1, { flip = false, thin = false, sitting = false } = {}) {
  const coat = thin ? "#c9a97f" : "#d9b98a";
  const leg = (lx, back) => `<rect x="${lx - 7}" y="-30" width="14" height="32" rx="6" fill="${back ? "#bfa070" : coat}" stroke="${C.ink}" stroke-width="3.4"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="4" rx="60" ry="10" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 2.6)}">
      ${sitting ? "" : `${leg(-34, true)}${leg(30, true)}`}
      <g class="anim-tail" style="${delayAt(x, y, 2.2)}"><path d="M -50 -58 q -26 -18 -20 -40 q 16 4 26 34 z" fill="${coat}" stroke="${C.ink}" stroke-width="3.4"/></g>
      ${sitting
        ? `<path d="M -54 2 q -6 -54 26 -60 q 34 -6 40 34 q 4 26 -12 26 z" fill="${coat}" stroke="${C.ink}" stroke-width="4.2"/>`
        : `<ellipse cx="0" cy="-46" rx="56" ry="30" fill="${coat}" stroke="${C.ink}" stroke-width="4.2"/>`}
      ${sitting ? "" : `${leg(-20, false)}${leg(40, false)}`}
      ${thin ? `<path d="M -14 -60 v 26 M 4 -62 v 28 M 22 -60 v 26" stroke="#a8875e" stroke-width="4" stroke-linecap="round" opacity="0.8"/>` : ""}
      <g transform="translate(52 -82)">
        <ellipse cx="0" cy="0" rx="27" ry="23" fill="${coat}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M -22 -14 q -12 -22 0 -30 q 14 6 14 28 z" fill="#bfa070" stroke="${C.ink}" stroke-width="3.4"/>
        <path d="M 16 -16 q 12 -20 22 -24 q 4 14 -8 30 z" fill="#bfa070" stroke="${C.ink}" stroke-width="3.4"/>
        <path d="M 20 6 q 18 0 20 10 q -2 9 -18 8 q -12 -2 -14 -9 z" fill="#efe2cb" stroke="${C.ink}" stroke-width="3.4"/>
        <ellipse cx="36" cy="12" rx="6" ry="5" fill="${C.ink}"/>
        <circle cx="-2" cy="-4" r="4" fill="${C.ink}"/>
        <circle cx="18" cy="-6" r="4" fill="${C.ink}"/>
        <path d="M 12 22 q 8 6 16 0" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </g>`;
}

// A horse. `gallop` stretches the legs the way the Unit 5 recount describes it
// running along the fence beside the race.
function horse(x, y, s = 1, { flip = false, gallop = false } = {}) {
  const coat = "#8a5a37";
  const mane = "#3f2c1c";
  const leg = (lx, rot, back) => `<g transform="translate(${lx} -66) rotate(${rot})"><rect x="-9" y="0" width="18" height="70" rx="8" fill="${back ? "#77492c" : coat}" stroke="${C.ink}" stroke-width="3.6"/><rect x="-11" y="62" width="22" height="12" rx="4" fill="#3f352c"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="4" rx="94" ry="12" fill="${C.ink}" opacity="0.10"/>
    <g class="${gallop ? "anim-strain" : "anim-idle"}" style="${delayAt(x, y, 2.4)}">
      ${gallop ? `${leg(-56, 36, true)}${leg(-34, 20, true)}` : `${leg(-54, 0, true)}${leg(-30, 0, true)}`}
      <g class="anim-tail" style="${delayAt(x, y, 2.4)}"><path d="M -80 -92 q -34 12 -40 62 q 22 -6 34 -34 z" fill="${mane}" stroke="${C.ink}" stroke-width="3.6"/></g>
      <ellipse cx="0" cy="-108" rx="86" ry="46" fill="${coat}" stroke="${C.ink}" stroke-width="4.6"/>
      ${gallop ? `${leg(38, -34, false)}${leg(62, -18, false)}` : `${leg(34, 0, false)}${leg(60, 0, false)}`}
      <path d="M 44 -132 q 20 -50 66 -84 l 44 30 q -46 34 -62 84 z" fill="${coat}" stroke="${C.ink}" stroke-width="4.4"/>
      <path d="M 52 -150 q 22 -44 62 -74 l 16 12 q -40 30 -58 74 z" fill="${mane}" stroke="${C.ink}" stroke-width="3.2"/>
      <g transform="translate(140 -212)">
        <path d="M -34 -4 q 2 -40 34 -46 q 30 -6 40 22 q 10 30 -10 46 q -30 22 -54 6 q -12 -8 -10 -28 z" fill="${coat}" stroke="${C.ink}" stroke-width="4.2"/>
        <path d="M -8 -48 q -6 -28 4 -34 q 14 10 12 34 z" fill="${coat}" stroke="${C.ink}" stroke-width="3.2"/>
        <path d="M 20 -48 q 6 -26 18 -30 q 6 14 -4 32 z" fill="${coat}" stroke="${C.ink}" stroke-width="3.2"/>
        <circle cx="8" cy="-14" r="5.4" fill="${C.ink}"/>
        <ellipse cx="44" cy="24" rx="10" ry="7" fill="#5a3820"/>
        <path d="M 26 40 q 14 4 24 -6" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </g>`;
}

// A snail, drawn for the spiral on its shell — the Unit 5 reading's own image.
function snail(x, y, s = 1, { flip = false } = {}) {
  const coils = [0, 1, 2, 3].map((i) => {
    const r = 34 - i * 8;
    return `<path d="M ${-r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0" fill="none" stroke="${i % 2 ? "#a8763f" : "#c99a5c"}" stroke-width="7"/>`;
  }).join("");
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M -54 0 q -12 -22 8 -26 q 28 -6 52 0 l 0 26 z" fill="#dcc9a8" stroke="${C.ink}" stroke-width="3.4"/>
    <g transform="translate(4 -32)"><circle cx="0" cy="0" r="36" fill="#e0c08a" stroke="${C.ink}" stroke-width="4"/>${coils}</g>
    <g transform="translate(-52 -14)">
      <path d="M -6 0 q -14 -18 -4 -26" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M 4 -2 q -8 -22 2 -30" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <circle cx="-11" cy="-28" r="4" fill="${C.ink}"/><circle cx="6" cy="-33" r="4" fill="${C.ink}"/>
    </g>
  </g>`;
}

// A cat. `squeezing` flattens the body the way the Unit 5 reading describes it
// bending through a narrow gap in a fence.
function cat(x, y, s = 1, { flip = false, squeezing = false } = {}) {
  const coat = "#5f5750";
  const leg = (lx) => `<rect x="${lx - 6}" y="-24" width="12" height="26" rx="6" fill="${coat}" stroke="${C.ink}" stroke-width="3"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="3" rx="46" ry="8" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 2.8)}">
      ${leg(-26)}${leg(22)}
      <g class="anim-tail" style="${delayAt(x, y, 2.4)}"><path d="M -40 -40 q -28 -6 -26 -40 q 14 2 16 26 z" fill="${coat}" stroke="${C.ink}" stroke-width="3"/></g>
      <ellipse cx="0" cy="-36" rx="${squeezing ? 46 : 42}" ry="${squeezing ? 16 : 24}" fill="${coat}" stroke="${C.ink}" stroke-width="3.8"/>
      ${leg(-12)}${leg(32)}
      <g transform="translate(40 -58)">
        <circle cx="0" cy="0" r="21" fill="${coat}" stroke="${C.ink}" stroke-width="3.6"/>
        <path d="M -18 -12 l -4 -20 l 18 10 z M 16 -14 l 8 -18 l -20 8 z" fill="${coat}" stroke="${C.ink}" stroke-width="3"/>
        <circle cx="-6" cy="-2" r="3.4" fill="#f0b429"/><circle cx="10" cy="-2" r="3.4" fill="#f0b429"/>
        <path d="M 2 8 q 6 5 10 0" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- Units 1, 3 and 6

// A bakery front: the shop Amal buys the bad sandwich from in Unit 3.
function bakeryFront(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-230" y="-300" width="460" height="300" rx="8" fill="#efe0c6" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -256 -300 h 512 l -26 -46 h -460 z" fill="#b06a4a" stroke="${C.ink}" stroke-width="4.5"/>
    <g class="anim-canopy" style="animation-duration:5.4s"><path d="M -210 -240 h 420 l -18 62 h -384 z" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="4.4"/></g>
    <rect x="-190" y="-160" width="220" height="130" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.4"/>
    ${[0, 1, 2].map((i) => `<path d="M ${-166 + i * 66} -66 q 22 -26 44 0 z" fill="#d3a663" stroke="${C.ink}" stroke-width="3.4"/>`).join("")}
    ${[0, 1, 2].map((i) => `<ellipse cx="${-152 + i * 66}" cy="-114" rx="22" ry="14" fill="#c98f4a" stroke="${C.ink}" stroke-width="3.2"/>`).join("")}
    <rect x="70" y="-170" width="120" height="170" rx="6" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="100" cy="-84" r="7" fill="${G2.metal}"/>
  </g>`;
}

// A tray of shared food — the community lunch of Unit 3 and the cultural fair
// of Unit 7, where every family brings one dish to the table.
function foodTray(x, y, s = 1, { bowls = 3 } = {}) {
  const colours = [G3.gold, G3.coral, G3.leafy, G3.teal];
  const step = bowls > 1 ? 180 / (bowls - 1) : 0;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-130" y="-26" width="260" height="26" rx="8" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4"/>
    ${Array.from({ length: bowls }, (unused, i) => {
      const bx = bowls > 1 ? -90 + i * step : 0;
      return `<path d="M ${bx - 34} -28 q 34 30 68 0 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.6"/>
        <path d="M ${bx - 28} -30 q 28 -20 56 0 z" fill="${colours[i % colours.length]}" stroke="${C.ink}" stroke-width="3.2"/>`;
    }).join("")}
  </g>`;
}

// A broom, leaning or being pushed — Unit 6's caretaker, and Unit 1's early
// morning sweeping before school. The head is one outlined block with the
// straws drawn INSIDE it: six loose strokes on their own read as the tines of
// a rake, which is what the first draft put in Amal's kitchen.
function broomProp(x, y, s = 1, { lean = -12 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${lean})">
    <rect x="-7" y="-330" width="14" height="286" rx="7" fill="#a8845a" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -30 -52 h 60 l 26 52 h -112 z" fill="#c9a06c" stroke="${C.ink}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M ${-20 + i * 10} -48 L ${-42 + i * 21} -2" stroke="#a8845a" stroke-width="3.4" opacity="0.7"/>`).join("")}
    <path d="M -56 -2 h 112 q 0 12 -14 12 h -84 q -14 0 -14 -12 z" fill="#8a6242" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
}

// A dry canyon: layered walls stepping back, with a thread of river at the
// bottom. Unit 2 names a canyon eight times and calls it the deepest land on
// Earth, and a plain brown wedge on the horizon does not say "deep".
function canyonScene() {
  const wall = (dir, i) => {
    const inset = 120 + i * 150;
    const edge = dir < 0 ? inset : W - inset;
    const shade = ["#c98f6a", "#b57a56", "#a36a49", "#8f5b3e"][i];
    return `<path d="M ${dir < 0 ? 0 : W} ${380 + i * 40} L ${edge} ${470 + i * 90} L ${edge} 940 L ${dir < 0 ? 0 : W} 940 Z" fill="${shade}" stroke="${C.ink}" stroke-width="4"/>
      ${[0, 1, 2, 3].map((r) => `<path d="M ${dir < 0 ? 10 : W - 10} ${540 + i * 70 + r * 84} L ${edge - dir * 10} ${590 + i * 70 + r * 84}" stroke="#7d4a32" stroke-width="6" opacity="0.4"/>`).join("")}`;
  };
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc4e8"/><stop offset="1" stop-color="#f0e0c0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <circle cx="1330" cy="170" r="72" fill="${C.sun}" opacity="0.95"/>
    <path d="M 0 380 q 400 -40 800 -10 q 400 30 800 -20 L 1600 940 L 0 940 Z" fill="#d9a86a"/>
    ${[0, 1, 2, 3].map((i) => `${wall(-1, i)}${wall(1, i)}`).join("")}
    <path class="anim-flow" d="M 700 940 q 100 -180 190 -300" stroke="#7fc2d6" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.85"/>
    <rect x="0" y="930" width="${W}" height="${H - 930}" fill="#c9a06c"/>
    <path d="M 0 930 h ${W}" stroke="#a8845a" stroke-width="8"/>`;
}

// A ring of keys: the caretaker unlocks the gate before the first bell.
function keyRing(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="anim-idle" style="animation-duration:2.8s">
      <circle cx="0" cy="0" r="26" fill="none" stroke="${G2.metalDark}" stroke-width="7"/>
      ${[-30, 0, 30].map((rot, i) => `<g transform="rotate(${rot}) translate(0 26)">
        <rect x="-5" y="0" width="10" height="${44 + i * 6}" rx="4" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/>
        <path d="M 5 ${30 + i * 6} h 10 v 8 h -10 z" fill="${G2.metal}" stroke="${C.ink}" stroke-width="2.6"/>
      </g>`).join("")}
    </g>
  </g>`;
}

// A school corridor seen down its length: the place the caretaker sweeps before
// anyone arrives. Doors recede on both sides towards a lit door at the end.
function corridorScene() {
  const doors = [0, 1].map((side) => {
    const near = side === 0 ? 0 : W;
    const far = side === 0 ? 520 : 1080;
    return [0, 1, 2].map((i) => {
      const t0 = 0.16 + i * 0.26;
      const t1 = t0 + 0.2;
      const x0 = near + (far - near) * t0;
      const x1 = near + (far - near) * t1;
      const top0 = 250 * t0 + 120;
      const top1 = 250 * t1 + 150;
      const bot0 = 1000 - 300 * t0 - 150;
      const bot1 = 1000 - 300 * t1 - 120;
      return `<path d="M ${x0.toFixed(0)} ${top0.toFixed(0)} L ${x1.toFixed(0)} ${top1.toFixed(0)} L ${x1.toFixed(0)} ${bot1.toFixed(0)} L ${x0.toFixed(0)} ${bot0.toFixed(0)} Z" fill="#7d4a32" stroke="${C.ink}" stroke-width="4" opacity="${(0.92 - i * 0.1).toFixed(2)}"/>`;
    }).join("");
  }).join("");
  return `<rect width="${W}" height="${H}" fill="${G3.wallCool}"/>
    <path d="M 0 0 L 520 250 L 1080 250 L 1600 0 Z" fill="#c8d4dd"/>
    <rect x="520" y="250" width="560" height="450" fill="#dbe4ea"/>
    ${doors}
    <rect x="700" y="380" width="200" height="240" rx="6" fill="#7d4a32" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 800 380 v 240" stroke="#5f3826" stroke-width="4"/>
    <g class="anim-glow"><rect x="716" y="396" width="168" height="90" rx="5" fill="#fff3cd" opacity="0.35"/></g>
    <path d="M 0 1000 L 520 700 L 1080 700 L 1600 1000 Z" fill="#b3a68f"/>
    <path d="M 520 700 h 560" stroke="#9c8e73" stroke-width="8"/>`;
}

// ---------------------------------------------------------------- Unit 2 weather

// A hillside lost in fog, for the Unit 2 poem. Nothing sharp: the hills are
// drawn and then veiled, so the page reads as "almost gone away".
function foggyScene() {
  const bands = [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${200 + i * 260}" cy="${420 + (i % 3) * 90}" rx="${360 - i * 18}" ry="${110 - i * 6}" fill="#e6ecef" opacity="${0.5 + (i % 3) * 0.12}"/>`).join("");
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3ccd2"/><stop offset="1" stop-color="#e8edf0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <path d="M -40 620 q 300 -190 640 -90 q 320 96 660 -30 q 200 -74 380 -10 L 1600 1000 L 0 1000 Z" fill="#9aa8ac" opacity="0.55"/>
    <path d="M -40 720 q 340 -150 700 -50 q 340 94 620 -30 L 1600 1000 L 0 1000 Z" fill="#8b9a9e" opacity="0.5"/>
    <rect x="0" y="700" width="${W}" height="${H - 700}" fill="#9fae9a" opacity="0.7"/>
    ${bands}
    ${[0, 1, 2, 3].map((i) => `<g class="anim-cloud" style="animation-delay:${i * 1.7}s"><ellipse cx="${180 + i * 420}" cy="${540 + (i % 2) * 110}" rx="420" ry="90" fill="#eef2f4" opacity="0.55"/></g>`).join("")}`;
}

// A snowy mountainside, for the Unit 2 information text.
function snowyScene() {
  let flakes = "";
  for (let i = 0; i < 60; i += 1) {
    const fx = (i * 191) % W;
    const fy = 30 + ((i * 269) % 780);
    flakes += `<circle class="anim-float" style="animation-delay:${((i % 11) / 11 * 2.4).toFixed(2)}s" cx="${fx}" cy="${fy}" r="${4 + (i % 3) * 2}" fill="#ffffff" opacity="0.9"/>`;
  }
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4c6"/><stop offset="1" stop-color="#d7e2ea"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <path d="M -40 700 L 300 300 L 560 620 L 820 260 L 1160 660 L 1400 420 L 1660 700 Z" fill="${G3.mountainDark}"/>
    <path d="M 300 300 L 380 400 L 300 430 L 240 390 Z M 820 260 L 906 366 L 820 400 L 748 356 Z M 1400 420 L 1462 494 L 1400 518 L 1348 486 Z" fill="${G3.snow}"/>
    <path d="M 0 700 q 400 -60 800 0 q 400 60 800 0 L 1600 1000 L 0 1000 Z" fill="#eef4f8"/>
    <path d="M 0 760 q 400 -50 800 10 q 400 60 800 -10" stroke="#d5e2ea" stroke-width="12" fill="none"/>
    ${flakes}`;
}

// Hail falling in front of whatever scene is already drawn.
function hailFall({ stones = 46 } = {}) {
  let out = "";
  for (let i = 0; i < stones; i += 1) {
    const hx = (i * 173) % W;
    const hy = 20 + ((i * 233) % 660);
    out += `<circle class="anim-rain" style="animation-delay:${((i % 9) / 9 * 1.1).toFixed(2)}s" cx="${hx}" cy="${hy}" r="${7 + (i % 3) * 3}" fill="#eef6fb" stroke="#b9d3e2" stroke-width="3"/>`;
  }
  return out;
}

// The local radio weather desk: microphone, mixing panel and an ON AIR lamp.
function radioDesk(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-240" y="-170" width="480" height="170" rx="8" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-256" y="-196" width="512" height="30" rx="8" fill="#a8845a" stroke="${C.ink}" stroke-width="4.4"/>
    <rect x="-190" y="-260" width="200" height="64" rx="7" fill="#3f4a52" stroke="${C.ink}" stroke-width="4.4"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${-166 + i * 34}" cy="-228" r="10" fill="${i % 2 ? G3.gold : G2.metal}" stroke="${C.ink}" stroke-width="3"/>`).join("")}
    <g transform="translate(120 -196)">
      <rect x="-6" y="-84" width="12" height="84" fill="${G2.metalDark}"/>
      <rect x="-40" y="-10" width="80" height="12" rx="6" fill="${G2.metalDark}"/>
      <g class="anim-idle" style="animation-duration:3s">
        <ellipse cx="0" cy="-104" rx="26" ry="32" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4"/>
        ${[0, 1, 2, 3].map((i) => `<path d="M -20 ${-124 + i * 14} h 40" stroke="${G2.metalDark}" stroke-width="3.4"/>`).join("")}
      </g>
    </g>
    <g class="anim-glow" transform="translate(-140 -300)">
      <rect x="-80" y="-32" width="160" height="60" rx="9" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="4.4"/>
      <path d="M -52 -4 h 104" stroke="${G3.cream}" stroke-width="9" stroke-linecap="round"/>
    </g>
  </g>`;
}

// A weather chart: the sun, cloud, rain and hail icons a report points at.
function weatherChart(x, y, s = 1) {
  const rays = [0, 45, 90, 135].map((a) => {
    const rad = a * Math.PI / 180;
    const dx = (34 * Math.cos(rad)).toFixed(1);
    const dy = (34 * Math.sin(rad)).toFixed(1);
    return `<path d="M ${-dx} ${-dy} L ${dx} ${dy}" stroke="${C.sun}" stroke-width="6" stroke-linecap="round"/>`;
  }).join("");
  const icon = (ix, kind) => {
    if (kind === "sun") return `<g transform="translate(${ix} 0)">${rays}<circle cx="0" cy="0" r="24" fill="${C.sun}" stroke="${C.ink}" stroke-width="3.4"/></g>`;
    if (kind === "cloud") return `<g transform="translate(${ix} 0)"><ellipse cx="-12" cy="4" rx="24" ry="17" fill="#f2f6f8" stroke="${C.ink}" stroke-width="3.4"/><ellipse cx="14" cy="-2" rx="20" ry="15" fill="#f2f6f8" stroke="${C.ink}" stroke-width="3.4"/></g>`;
    if (kind === "rain") return `<g transform="translate(${ix} 0)"><ellipse cx="0" cy="-8" rx="26" ry="16" fill="#c8d4dd" stroke="${C.ink}" stroke-width="3.4"/>${[-14, 0, 14].map((dx) => `<path d="M ${dx} 12 l -5 16" stroke="#7fa8d9" stroke-width="5" stroke-linecap="round"/>`).join("")}</g>`;
    return `<g transform="translate(${ix} 0)"><ellipse cx="0" cy="-8" rx="26" ry="16" fill="#b9c8d2" stroke="${C.ink}" stroke-width="3.4"/>${[-14, 0, 14].map((dx) => `<circle cx="${dx}" cy="20" r="7" fill="#eef6fb" stroke="${C.ink}" stroke-width="2.6"/>`).join("")}</g>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-210" y="-150" width="420" height="300" rx="10" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -180 -104 h 360" stroke="${G3.teal}" stroke-width="9" stroke-linecap="round"/>
    <g transform="translate(0 -30)">${icon(-130, "sun")}${icon(-42, "cloud")}${icon(46, "rain")}${icon(134, "hail")}</g>
    ${[0, 1, 2].map((i) => `<path d="M -170 ${52 + i * 34} h ${300 - i * 60}" stroke="#9fb4c6" stroke-width="7" stroke-linecap="round"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 4 community

// The Circular Plan: the spinning news wheel the class builds by the school
// gate. Six wedges, one subject each, exactly as the Unit 4 story describes it.
function circularNews(x, y, s = 1) {
  const wedge = (i) => {
    const a0 = (i * 60 - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 60 - 90) * Math.PI / 180;
    const r = 150;
    return `<path d="M 0 0 L ${(r * Math.cos(a0)).toFixed(1)} ${(r * Math.sin(a0)).toFixed(1)} A ${r} ${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(1)} ${(r * Math.sin(a1)).toFixed(1)} Z" fill="${C.rainbow[i % C.rainbow.length]}" stroke="${C.ink}" stroke-width="4"/>`;
  };
  const label = (i) => {
    const a = ((i + 0.5) * 60 - 90) * Math.PI / 180;
    return `<path d="M ${(78 * Math.cos(a) - 26).toFixed(1)} ${(78 * Math.sin(a)).toFixed(1)} h 52" stroke="${G3.cream}" stroke-width="7" stroke-linecap="round"/>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="90" ry="14" fill="${C.ink}" opacity="0.10"/>
    <rect x="-16" y="-230" width="32" height="230" rx="10" fill="#8a6242" stroke="${C.ink}" stroke-width="4.4"/>
    <g transform="translate(0 -390)">
      <g class="anim-idle" style="animation-duration:5.2s">
        <circle cx="0" cy="0" r="156" fill="${G3.cream}" stroke="${C.ink}" stroke-width="6"/>
        ${[0, 1, 2, 3, 4, 5].map(wedge).join("")}
        ${[0, 1, 2, 3, 4, 5].map(label).join("")}
        <circle cx="0" cy="0" r="26" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
      </g>
    </g>
  </g>`;
}

// Rows of chairs, for the town meeting and the Exhibition evening. Rows behind
// are drawn first and smaller, so the hall reads as deep rather than flat.
function chairRows(x, y, s = 1, { rows = 3, seats = 6 } = {}) {
  let out = "";
  for (let r = rows - 1; r >= 0; r -= 1) {
    const rs = 1 - r * 0.13;
    const ry = -r * 96;
    for (let i = 0; i < seats; i += 1) {
      const cx = (-((seats - 1) / 2) + i) * 132 * rs;
      out += `<g transform="translate(${cx.toFixed(1)} ${ry}) scale(${rs.toFixed(3)})">
        <rect x="-34" y="-58" width="68" height="16" rx="6" fill="${C.rainbow[(i + r) % C.rainbow.length]}" stroke="${C.ink}" stroke-width="3.4"/>
        <rect x="-34" y="-116" width="68" height="58" rx="7" fill="${C.rainbow[(i + r) % C.rainbow.length]}" stroke="${C.ink}" stroke-width="3.4"/>
        <path d="M -26 -42 v 42 M 26 -42 v 42" stroke="${G2.metalDark}" stroke-width="7" stroke-linecap="round"/>
      </g>`;
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${out}</g>`;
}

// A town-hall interior: tall arched windows and a wooden floor.
function hallScene() {
  return `<rect width="${W}" height="${H}" fill="#e2dbcb"/>
    <rect x="0" y="0" width="${W}" height="26" fill="#cdc4b0"/>
    ${[0, 1, 2, 3].map((i) => `<g transform="translate(${230 + i * 380} 250)">
      <path d="M -84 190 v -160 q 84 -80 168 0 v 160 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M 0 -46 v 236 M -84 72 h 168" stroke="${C.ink}" stroke-width="5"/>
    </g>`).join("")}
    <rect x="0" y="660" width="${W}" height="${H - 660}" fill="#b9a98c"/>
    <path d="M 0 660 h ${W}" stroke="#9c8e73" stroke-width="10"/>
    ${[0, 300, 600, 900, 1200, 1500].map((fx) => `<path d="M ${fx} 672 L ${fx - 100} 1000" stroke="#a89877" stroke-width="5" opacity="0.5"/>`).join("")}`;
}

// ---------------------------------------------------------------- Unit 6 the bridge

// Elena's bridge over the river. `done` opens it: the scaffold comes down, the
// cones go away and the deck carries a centre line instead of a gap.
function bridgeSite(x, y, s = 1, { done = false } = {}) {
  const hangers = [-300, -160, 0, 160, 300].map((px) => {
    const py = -14 - (1 - (px / 420) ** 2) * 166;
    return `<path d="M ${px} ${py.toFixed(1)} v ${(-96 - Math.abs(px) / 8).toFixed(1)}" stroke="${G2.metalDark}" stroke-width="9"/>`;
  }).join("");
  const cones = [-360, -240, 240, 360].map((cx) => `<g transform="translate(${cx} 30)"><path d="M -18 0 l 18 -46 l 18 46 z" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4"/><path d="M -14 -14 h 28" stroke="${G3.cream}" stroke-width="5"/></g>`).join("");
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -420 0 q 420 -180 840 0" fill="none" stroke="#9c8e73" stroke-width="26"/>
    <path d="M -420 -14 q 420 -180 840 0" fill="none" stroke="#b9a98c" stroke-width="18"/>
    ${hangers}
    <path d="M -420 -110 q 420 -270 840 0" fill="none" stroke="${G3.tealDark}" stroke-width="14"/>
    ${done
      ? `<path d="M -420 -46 q 420 -180 840 0" fill="none" stroke="${G3.teal}" stroke-width="8" stroke-dasharray="26 20"/>`
      : `${cones}<path d="M -70 -180 h 140 M -70 -230 h 140 M -70 -280 h 140 M -70 -180 v -100 M 70 -180 v -100" stroke="${G2.metal}" stroke-width="8" stroke-linecap="round"/>`}
  </g>`;
}

// A bright site helmet, sitting on a plan or held out to a visitor.
function helmetProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -44 0 q 0 -54 44 -54 q 44 0 44 54 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -58 0 h 116 q 0 12 -14 12 h -88 q -14 0 -14 -12 z" fill="#d99f18" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 0 -54 v 44" stroke="#d99f18" stroke-width="5"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 8 tools and sky

// A microwave, door shut or open, from the Unit 8 safety talk.
function microwaveProp(x, y, s = 1, { open = false, lit = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-140" y="-120" width="280" height="120" rx="9" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4.6"/>
    <rect x="-124" y="-106" width="176" height="92" rx="6" fill="${lit ? "#f6e2a8" : "#3f4a52"}" stroke="${C.ink}" stroke-width="4"/>
    ${lit ? `<g class="anim-glow"><ellipse cx="-36" cy="-60" rx="56" ry="34" fill="#fff3cd" opacity="0.5"/></g>` : ""}
    <path d="M -84 -34 q 26 -22 52 0 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.2"/>
    <rect x="64" y="-100" width="60" height="80" rx="5" fill="#d3cdc4" stroke="${C.ink}" stroke-width="3.6"/>
    ${[0, 1, 2].map((r) => [0, 1].map((c) => `<circle cx="${80 + c * 28}" cy="${-84 + r * 26}" r="7" fill="${G2.metalDark}"/>`).join("")).join("")}
    ${open ? `<path d="M -124 -106 L -300 -140 L -300 -6 L -124 -14 Z" fill="#c9cdd2" stroke="${C.ink}" stroke-width="4.4"/>` : ""}
  </g>`;
}

// A bench of the small tools Unit 8 names: a stapler, a folder and a briefcase.
function toolRack(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-200" y="-20" width="400" height="20" rx="7" fill="#a8845a" stroke="${C.ink}" stroke-width="4"/>
    <g transform="translate(-140 -22)">
      <path d="M -46 0 h 92 v -18 h -92 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="3.4"/>
      <path d="M -44 -18 q 44 -22 88 0 z" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4"/>
    </g>
    <g transform="translate(-16 -22)">
      <path d="M -44 0 v -74 h 52 l 12 14 h 26 v 60 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M -30 -18 h 62" stroke="#d99f18" stroke-width="5"/>
    </g>
    <g transform="translate(120 -22)">
      <rect x="-56" y="-72" width="112" height="72" rx="7" fill="#7d4a32" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -20 -72 v -18 q 20 -12 40 0 v 18" fill="none" stroke="${C.ink}" stroke-width="4.4"/>
      <rect x="-12" y="-46" width="24" height="18" rx="4" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/>
    </g>
  </g>`;
}

// An observatory: a round building with a dome whose roof opens on the sky.
//
// The first draft put the open slit OUTSIDE the dome — the shape ran from the
// apex up past it — so the page showed a white hut with a bent black pole on
// top. The slit is a wedge cut into the dome and stays inside it; the telescope
// tip leaning out of the slit is what says "this roof is open".
function observatory(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-170" y="-190" width="340" height="190" rx="8" fill="#e2dbcb" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${-150 + i * 100} -190 v 190" stroke="#cdc4b0" stroke-width="4" opacity="0.7"/>`).join("")}
    <path d="M -186 -190 q 186 -216 372 0 z" fill="#cdd6dc" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -186 -190 q 186 -216 372 0" fill="none" stroke="#aab6bf" stroke-width="6"/>
    <path d="M -30 -190 q 4 -110 32 -152 q 26 30 30 152 z" fill="#2f3a44" stroke="${C.ink}" stroke-width="4.4"/>
    <g class="anim-glow"><ellipse cx="2" cy="-268" rx="34" ry="46" fill="#f6e9a8" opacity="0.30"/></g>
    <g transform="translate(2 -268) rotate(-32)">
      <rect x="-16" y="-96" width="34" height="120" rx="14" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4.4"/>
      <rect x="-22" y="-116" width="46" height="28" rx="10" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4"/>
    </g>
    <rect x="-52" y="-96" width="104" height="96" rx="6" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.4"/>
    ${[-140, 76].map((wx) => `<rect x="${wx}" y="-152" width="64" height="56" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>`).join("")}
  </g>`;
}

// A planet with rings, for the Unit 8 star reading.
function ringedPlanet(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="anim-float" style="animation-duration:7s">
      <circle cx="0" cy="0" r="76" fill="#d9a463" stroke="#a8763f" stroke-width="5"/>
      <path d="M -70 -26 q 70 -18 140 0 M -74 8 q 74 20 148 0 M -60 40 q 60 16 120 0" stroke="#c08a4a" stroke-width="8" fill="none" opacity="0.8"/>
      <ellipse cx="0" cy="6" rx="132" ry="30" fill="none" stroke="#efd9a8" stroke-width="10" opacity="0.9"/>
      <ellipse cx="0" cy="6" rx="110" ry="24" fill="none" stroke="#c9b183" stroke-width="6" opacity="0.85"/>
    </g>
  </g>`;
}

// The moon with its craters — the first thing a telescope shows you.
function craterMoon(x, y, s = 1) {
  const craters = [[-30, -22, 16], [22, -34, 11], [38, 14, 18], [-14, 30, 13], [-48, 12, 9], [8, -2, 8]];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="anim-glow"><circle cx="0" cy="0" r="104" fill="#fff6cf" opacity="0.20"/></g>
    <circle cx="0" cy="0" r="78" fill="#e8e6de" stroke="#b9b5a8" stroke-width="4"/>
    ${craters.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#cfcabc" stroke="#b0aa9c" stroke-width="3"/>`).join("")}
  </g>`;
}

// A night sky with NO moon in it.
//
// nightScene() draws its own moon at 1320,170, and the Unit 8 star book is about
// looking at the moon through a telescope — so drawing craterMoon() on top of it
// put two moons in the sky on four pages, which is the two-suns defect the Grade
// 2 shelf already shipped once. Same ground and stars, moon left to the page.
function starrySky() {
  let stars = "";
  for (let i = 0; i < 26; i += 1) {
    const sx = (i * 197 + 60) % W;
    const sy = 40 + ((i * 131) % 520);
    stars += `<circle class="anim-glow" style="animation-delay:${((i % 5) / 2).toFixed(1)}s" cx="${sx}" cy="${sy}" r="${3 + (i % 3)}" fill="#f6f0d8" opacity="0.9"/>`;
  }
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2f4e" stop-opacity="1"/><stop offset="1" stop-color="#51678f"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${stars}
    ${kit4.hills()}${kit4.ground()}
    <rect x="0" y="590" width="${W}" height="${H - 590}" fill="#1d2b4a" opacity="0.30"/>`;
}

// A kitchen worktop, so an appliance stands on something instead of hovering at
// chest height in the middle of the room.
function counterTop(x, y, s = 1, { width = 520 } = {}) {
  const half = width / 2;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="${-half}" y="-176" width="${width}" height="176" rx="6" fill="#b08758" stroke="${C.ink}" stroke-width="4.6"/>
    <rect x="${-half - 14}" y="-206" width="${width + 28}" height="34" rx="8" fill="#d3c3a4" stroke="${C.ink}" stroke-width="4.6"/>
    ${[0, 1].map((i) => `<rect x="${-half + 34 + i * (width / 2 - 24)}" y="-140" width="${width / 2 - 68}" height="110" rx="6" fill="#a8845a" stroke="${C.ink}" stroke-width="3.6"/>
      <circle cx="${-half + 34 + i * (width / 2 - 24) + (width / 2 - 68) / 2}" cy="-84" r="8" fill="${G2.metal}"/>`).join("")}
  </g>`;
}

// An ambulance, from the Unit 8 helper-vehicles song.
function ambulance(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="6" rx="180" ry="14" fill="${C.ink}" opacity="0.10"/>
    <rect x="-180" y="-180" width="250" height="150" rx="10" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 70 -180 h 76 q 34 0 44 40 l 14 66 v 44 h -134 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="96" y="-160" width="76" height="56" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -170 -104 h 230" stroke="${G3.coral}" stroke-width="16"/>
    <g transform="translate(-96 -128)">
      <path d="M -12 -30 h 24 v 18 h 18 v 24 h -18 v 18 h -24 v -18 h -18 v -24 h 18 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="3.4"/>
    </g>
    <g class="anim-glow"><rect x="-70" y="-206" width="80" height="28" rx="9" fill="${G3.coral}" stroke="${C.ink}" stroke-width="4"/></g>
    <circle cx="-110" cy="-24" r="40" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-110" cy="-24" r="15" fill="${G2.metal}"/>
    <circle cx="120" cy="-24" r="40" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="120" cy="-24" r="15" fill="${G2.metal}"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 9 places

// A lorry carrying goods from the factories to the markets.
function lorry(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="6" rx="190" ry="14" fill="${C.ink}" opacity="0.10"/>
    <rect x="-200" y="-190" width="266" height="160" rx="8" fill="${G3.teal}" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2].map((i) => `<path d="M ${-176 + i * 84} -180 v 140" stroke="${G3.tealDark}" stroke-width="7"/>`).join("")}
    <path d="M 66 -150 h 74 q 26 0 34 32 l 16 58 v 30 h -124 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="86" y="-132" width="66" height="48" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="-130" cy="-24" r="40" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-130" cy="-24" r="15" fill="${G2.metal}"/>
    <circle cx="-40" cy="-24" r="40" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-40" cy="-24" r="15" fill="${G2.metal}"/>
    <circle cx="130" cy="-24" r="40" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="130" cy="-24" r="15" fill="${G2.metal}"/>
  </g>`;
}

// A factory: the chimneys and saw-tooth roof of Unit 9's information text.
function factory(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-250" y="-190" width="500" height="190" rx="6" fill="#b9ac96" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${-240 + i * 124} -190 l 62 -70 l 0 70 z" fill="#cdc0aa" stroke="${C.ink}" stroke-width="4.4"/>`).join("")}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${-210 + i * 96}" y="-140" width="60" height="70" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`).join("")}
    <rect x="-60" y="-70" width="120" height="70" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.4"/>
    <rect x="180" y="-360" width="52" height="180" rx="6" fill="#a8987f" stroke="${C.ink}" stroke-width="4.4"/>
    ${[0, 1, 2].map((i) => `<g class="anim-cloud" style="animation-delay:${i * 1.5}s"><ellipse cx="${210 + i * 34}" cy="${-400 - i * 40}" rx="${40 + i * 10}" ry="${26 + i * 6}" fill="#dfe4e6" opacity="0.75"/></g>`).join("")}
  </g>`;
}

// A passenger train, seen side-on, drawn leftwards from its engine.
function passengerTrain(x, y, s = 1, { flip = false, carriages = 2 } = {}) {
  let cars = "";
  for (let i = 0; i < carriages; i += 1) {
    const cx = -260 - i * 300;
    cars += `<g transform="translate(${cx} 0)">
      <rect x="-140" y="-200" width="280" height="170" rx="14" fill="${G3.sky}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -130 -128 h 260" stroke="${G3.cream}" stroke-width="10"/>
      ${[0, 1, 2].map((w) => `<rect x="${-108 + w * 78}" y="-182" width="58" height="46" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`).join("")}
      <circle cx="-76" cy="-18" r="26" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4.4"/>
      <circle cx="76" cy="-18" r="26" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4.4"/>
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="-200" cy="10" rx="460" ry="14" fill="${C.ink}" opacity="0.10"/>
    ${cars}
    <path d="M -120 -30 v -180 q 0 -26 26 -26 h 130 q 26 0 34 34 l 22 96 v 76 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-96" y="-196" width="90" height="60" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="18" y="-160" width="62" height="48" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -120 -84 h 212" stroke="${G3.gold}" stroke-width="12"/>
    <circle cx="-70" cy="-18" r="28" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4.4"/>
    <circle cx="42" cy="-18" r="28" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4.4"/>
    <g class="anim-glow"><circle cx="82" cy="-58" r="15" fill="#fff3cd" stroke="${C.ink}" stroke-width="3.4"/></g>
  </g>`;
}

// A station platform under a canopy, with the big clock the Unit 9 recount
// waits beneath.
function stationScene() {
  return `<rect width="${W}" height="${H}" fill="#dfe6ea"/>
    <rect x="0" y="0" width="${W}" height="150" fill="#5d6a75"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M ${100 + i * 240} 150 v 60" stroke="#4b5660" stroke-width="14"/>`).join("")}
    <path d="M 0 150 h ${W}" stroke="#3f4a52" stroke-width="12"/>
    <rect x="0" y="210" width="${W}" height="380" fill="#c8d2d8"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${120 + i * 320}" y="210" width="34" height="470" fill="#8f9aa2" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    <g transform="translate(800 300)">
      <circle cx="0" cy="0" r="72" fill="#f6f0d8" stroke="${C.ink}" stroke-width="6"/>
      <circle cx="0" cy="0" r="58" fill="none" stroke="#b9b0a6" stroke-width="4"/>
      <path d="M 0 0 v -44 M 0 0 l 30 18" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="7" fill="${C.ink}"/>
    </g>
    <rect x="0" y="680" width="${W}" height="${H - 680}" fill="#b3aa9c"/>
    <path d="M 0 690 h ${W}" stroke="#8f8a80" stroke-width="10"/>
    <path d="M 0 800 h ${W}" stroke="${G3.gold}" stroke-width="12" stroke-dasharray="60 40"/>`;
}

// Inside the mall: a bright upper corridor with shop fronts along it.
function mallScene() {
  return `<rect width="${W}" height="${H}" fill="#f2eee6"/>
    <path d="M 0 0 h ${W} v 130 h -${W} z" fill="#e2dbcb"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<g class="anim-glow" style="animation-delay:${i * 0.6}s"><ellipse cx="${140 + i * 260}" cy="120" rx="70" ry="20" fill="#fff3cd" opacity="0.55"/></g>`).join("")}
    ${[0, 1, 2, 3].map((i) => `<g transform="translate(${230 + i * 380} 300)">
      <rect x="-130" y="-140" width="260" height="170" rx="8" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.6"/>
      <rect x="-130" y="-180" width="260" height="42" rx="8" fill="${C.rainbow[i % C.rainbow.length]}" stroke="${C.ink}" stroke-width="4.4"/>
      <path d="M -96 -160 h 192" stroke="${G3.cream}" stroke-width="8" stroke-linecap="round"/>
    </g>`).join("")}
    <rect x="0" y="470" width="${W}" height="26" fill="#cdc4b0"/>
    <rect x="0" y="640" width="${W}" height="${H - 640}" fill="#e6e1d6"/>
    <path d="M 0 640 h ${W}" stroke="#cdc4b0" stroke-width="10"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M ${i * 210} 656 L ${i * 210 - 120} 1000" stroke="#d6d0c3" stroke-width="6"/>`).join("")}`;
}

// A lift, doors shut or open, with its floor indicator lit above.
function liftProp(x, y, s = 1, { open = false, floor = 2 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-130" y="-360" width="260" height="360" rx="8" fill="${G2.metal}" stroke="${C.ink}" stroke-width="5"/>
    ${open
      ? `<rect x="-96" y="-330" width="192" height="330" rx="5" fill="#57616b" stroke="${C.ink}" stroke-width="4"/>
         <g class="anim-glow"><rect x="-80" y="-314" width="160" height="120" rx="5" fill="#fff3cd" opacity="0.30"/></g>
         <rect x="-130" y="-330" width="34" height="330" fill="#7d868f" stroke="${C.ink}" stroke-width="3.6"/>
         <rect x="96" y="-330" width="34" height="330" fill="#7d868f" stroke="${C.ink}" stroke-width="3.6"/>`
      : `<rect x="-96" y="-330" width="192" height="330" rx="5" fill="#a3aab1" stroke="${C.ink}" stroke-width="4"/>
         <path d="M 0 -330 v 330" stroke="${C.ink}" stroke-width="4.4"/>`}
    <g class="anim-glow" transform="translate(0 -400)">
      <rect x="-52" y="-30" width="104" height="46" rx="8" fill="#2f3a44" stroke="${C.ink}" stroke-width="4"/>
      <text x="0" y="4" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${G3.gold}">${floor}</text>
    </g>
  </g>`;
}

// The fountain on the mall's ground floor.
function fountainProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="170" ry="46" fill="#8fc2d6" stroke="${C.ink}" stroke-width="5"/>
    <ellipse cx="0" cy="-10" rx="150" ry="36" fill="#bfe0f4" opacity="0.9"/>
    <g class="anim-ripple"><ellipse cx="0" cy="-10" rx="96" ry="22" fill="none" stroke="#e6f4fb" stroke-width="6"/></g>
    <rect x="-16" y="-140" width="32" height="130" rx="8" fill="${G3.stone}" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="0" cy="-140" rx="66" ry="18" fill="${G3.stone}" stroke="${C.ink}" stroke-width="4"/>
    ${[-1, 1].map((dir) => `<path class="anim-shimmer" d="M 0 -156 q ${dir * 70} -46 ${dir * 92} 46" fill="none" stroke="#bfe0f4" stroke-width="8" stroke-linecap="round"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- held props

// A folded newspaper, for Maya the young reporter and the Unit 6 messenger.
const heldNewspaper = `<g transform="translate(0 -6)">
  <rect x="-46" y="-32" width="92" height="64" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.6"/>
  <path d="M -34 -18 h 40 M -34 -6 h 40 M -34 6 h 40 M -34 18 h 26" stroke="#9fb4c6" stroke-width="4" stroke-linecap="round"/>
  <rect x="14" y="-20" width="26" height="26" rx="3" fill="${G3.sky}" stroke="${C.ink}" stroke-width="2.6"/>
</g>`;

// An open notebook: the reporter's tool, and the interviewer's.
const heldNotebook = `<g transform="translate(0 -4)">
  <path d="M -44 -26 q 44 -14 88 0 l 0 52 q -44 -14 -88 0 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.6"/>
  <path d="M 0 -30 v 60" stroke="${C.ink}" stroke-width="3"/>
  <path d="M -32 -8 h 24 M -32 6 h 24 M 8 -8 h 24 M 8 6 h 24" stroke="#9fb4c6" stroke-width="3.4" stroke-linecap="round"/>
</g>`;

// A single key, held up.
const heldKey = `<g transform="translate(0 -8)">
  <circle cx="-16" cy="0" r="18" fill="none" stroke="${G2.metalDark}" stroke-width="7"/>
  <rect x="0" y="-5" width="52" height="10" rx="4" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/>
  <path d="M 36 5 v 12 M 48 5 v 12" stroke="${G2.metal}" stroke-width="6" stroke-linecap="round"/>
</g>`;

module.exports = {
  ...kit4,
  CAST_SHELF, figureShelf,
  dog, horse, snail, cat,
  bakeryFront, foodTray, broomProp, keyRing, corridorScene, canyonScene,
  foggyScene, snowyScene, hailFall, radioDesk, weatherChart,
  circularNews, chairRows, hallScene,
  bridgeSite, helmetProp,
  microwaveProp, toolRack, observatory, ringedPlanet, craterMoon, ambulance, starrySky, counterTop,
  lorry, factory, passengerTrain, stationScene, mallScene, liftProp, fountainProp,
  heldNewspaper, heldNotebook, heldKey,
};
