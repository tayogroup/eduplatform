// Grade 2 SHELF additions — the props and the one new face that Grade 2's books
// four to seven need and the five kits below do not have.
//
// Grade 2 shipped with three books per unit, all of them Zuri's. This file is
// the sixth layer, for the four books added to each unit in 2026-08:
//
//   book 4  the unit's own STORY, retold          (its Story reading — Amal's)
//   book 5  the unit's POEM, said out loud        (its poem)
//   book 6  the unit's LISTENING text             (its listening)
//   book 7  a look-and-name book of its WORDS     (its vocabularyGroups)
//
// The largest thing that changes here is not a prop. **Every Grade 2 unit's
// Story stars AMAL, and not one of the thirty Zuri books tells it.** Amal's
// First Week, The Helpers of Warta Street, The Big Race, The Night Amal Counted
// the Stars, A Fair Way to Measure, Amal and the Little Garden Friends, Amal and
// the Little Tree, Helping Hands at Home, A Big Day in the City — ten finished
// stories, already narrated, already reviewed, and invisible on the shelf. So
// book four needed no invention at all, and the cast it needs was already drawn:
// Amal, Adam, Nora, Leo, Sami, Theo, Maya, Daniel, Mina, Idris, Teacher Yasmin,
// Grandma Hana, Grandpa, Omar, Karim, Nadia and Rami are all in CAST_AMAL.
//
// Exactly ONE face was missing — Leila, the firefighter of Unit 2, who has a
// name, a uniform and a speaking part in both the story and the listening.
//
// Additive, as every kit here is. Nothing below is modified, so no page a
// learner has already read can move, and motion reuses the existing animation
// classes only — a new @keyframes in STYLE is embedded verbatim in every SVG of
// every book and would rewrite all 2,110 of them for a change nobody can see.
//
// This file and its generator were UNTRACKED for a day after the forty books
// they draw had been committed and deployed. See the provenance note at the top
// of tools/create-grade2-shelf-ebook-illustrations.js for why no gate said so.

const kit = require("./ehel-ebook-kit-grade1-shelf.js");

const { C, delayAt, G2, G3, A1, person, CAST_AMAL } = kit;

// ---------------------------------------------------------------- the one new face
//
// Leila wears the fire service's blue uniform in both texts ("a tall woman in a
// blue uniform walked into the classroom"), so she is drawn in it rather than in
// turnout gear — the helmet, boots, gloves and mask are OBJECTS she shows the
// class, which is what the Unit 2 vocabulary group actually asks a learner to
// name. `fireKit()` in the Grade 2 kit already draws all four in a row.
const CAST_G2 = {
  ...CAST_AMAL,
  leila: { adult: true, skin: G3.skinWarm, hair: G3.hair, style: "bun", top: "#3f6ea5", bottom: "#2e5480", legs: "trousers" },
  // Karim the window cleaner and Sami's uncle are NOT new. They exist in
  // CAST_SHELF (tools/lib/ehel-ebook-kit-grade4-shelf.js) and are copied here
  // BYTE FOR BYTE, the way the Grade 3 kit copied sami and maya out of CAST4.
  // This file's chain runs through the Amal kit, which does not include the
  // Grade 4 shelf's additions, so without these two lines figureG2("karim")
  // throws — and inventing a second Karim would make the same man two different
  // men between shelves, which is the defect the Grade 3 cast note warns about
  // and which a gate cannot see.
  karim: { adult: true, skin: G3.skinWarm, hair: G3.hair, style: "crop", top: "#8a9a5b", bottom: "#6b5a44", legs: "trousers", apron: "#a8845a" },
  uncle: { adult: true, skin: G3.skin, hair: G3.hair, style: "crop", top: G3.tealDark, bottom: "#6b5a44", legs: "trousers" },
};

// figureG2("leila", { x, y, s, mood, arms }) — the preset with per-page
// overrides, exactly as figureA()/figure4()/figure() work in the kits below.
function figureG2(who, options = {}) {
  const preset = CAST_G2[who];
  if (!preset) throw new Error(`Unknown Grade 2 character "${who}". Known: ${Object.keys(CAST_G2).join(", ")}`);
  return person({ ...preset, ...options, name: who });
}

// ---------------------------------------------------------------- Unit 3: Get Up and Move Day

// The hoops Sami and Leo bounce between on the grass. Drawn as flat rings on the
// ground rather than upright, because they are jumped INTO, not through.
function hoopProp(x, y, s = 1, { colour = A1.orange, count = 1 } = {}) {
  const tints = [A1.orange, A1.blue, A1.green, A1.red, A1.purple];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${Array.from({ length: count }, (unused, i) => `<ellipse cx="${(i - (count - 1) / 2) * 190}" cy="0" rx="86" ry="26" fill="none" stroke="${count > 1 ? tints[i % tints.length] : colour}" stroke-width="16"/><ellipse cx="${(i - (count - 1) / 2) * 190}" cy="0" rx="86" ry="26" fill="none" stroke="${C.ink}" stroke-width="3.4" opacity="0.5"/>`).join("")}
  </g>`;
}

// A flag on a stick, for the "Get Up and Move" parade.
function flagProp(x, y, s = 1, { colour = A1.red, flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <rect x="-5" y="-210" width="10" height="210" rx="5" fill="#a5764f" stroke="${C.ink}" stroke-width="4"/>
    <g class="anim-grass" style="${delayAt(x, y, 2.4)}">
      <path d="M 5 -206 q 74 18 130 -6 q -18 44 0 84 q -66 20 -130 4 z" fill="${colour}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    </g>
    <circle cx="0" cy="-216" r="10" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 4: why we have day and night

// Adam's torch, the one he switches on to BE the sun. The beam is optional
// because half the pages want the torch as an object and half want it shining.
function torchProp(x, y, s = 1, { beam = false, angle = 0 } = {}) {
  return `<g transform="translate(${x} ${y})">
    <g transform="rotate(${angle}) scale(${s})">
    ${beam ? `<g class="anim-shimmer"><path d="M 92 -30 L 420 -150 L 420 90 L 92 20 z" fill="${A1.yellow}" opacity="0.34"/></g>` : ""}
    <rect x="-110" y="-30" width="200" height="60" rx="16" fill="#4a5668" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-40" y="-30" width="34" height="60" fill="#2f3846"/>
    <path d="M 90 -44 q 30 0 30 44 q 0 44 -30 44 z" fill="${A1.metal}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="104" cy="0" rx="12" ry="34" fill="${beam ? "#fdf3c8" : "#cfd8de"}" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="-70" cy="0" r="11" fill="${A1.red}" stroke="${C.ink}" stroke-width="4"/>
  </g>
  </g>`;
}

// The orange ball Adam turns in front of the torch, with the mark he has drawn
// on it. `lit` is which side faces the light — the whole point of the page is
// that ONE side is day and the other is night.
function earthBall(x, y, s = 1, { markAt = "light" } = {}) {
  const markX = markAt === "light" ? 46 : -46;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="0" cy="0" r="92" fill="${A1.orange}" stroke="${C.ink}" stroke-width="7"/>
    <path d="M 0 -92 a 92 92 0 0 0 0 184 z" fill="#a8552a" opacity="0.45"/>
    <circle cx="${markX}" cy="-14" r="15" fill="${C.ink}"/>
    <path d="M -66 -50 q 66 -22 132 0 M -66 50 q 66 22 132 0" fill="none" stroke="#a8552a" stroke-width="4" opacity="0.6"/>
  </g>`;
}

// The carved metal sundial in the school garden — Unit 4's shadow clock. The
// gnomon's shadow falls on a numbered face, which is the object the reading
// describes and nothing in the chain draws.
function sundialProp(x, y, s = 1, { hour = 3 } = {}) {
  const angle = -90 + hour * 30;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-24" y="-90" width="48" height="90" rx="8" fill="#9a8f80" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="0" cy="-96" rx="130" ry="40" fill="#b0a495" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="0" cy="-102" rx="118" ry="34" fill="#c9c3b4" stroke="${C.ink}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const a = (-180 + i * 30) * Math.PI / 180;
      return `<circle cx="${(Math.cos(a) * 98).toFixed(0)}" cy="${(-102 + Math.sin(a) * 28).toFixed(0)}" r="5" fill="${C.ink}"/>`;
    }).join("")}
    <path d="M 0 -102 l 0 -74 l 24 74 z" fill="${A1.metal}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <g transform="rotate(${angle} 0 -102)"><path d="M 0 -102 h 96" stroke="${C.ink}" stroke-width="9" opacity="0.45" stroke-linecap="round"/></g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 6: Grandpa's cricket

// The jar Nora keeps the cricket in, with air holes in the lid and a slice of
// apple inside — the two things Grandpa's instructions turn on.
function cricketJar(x, y, s = 1, { inner = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -74 -150 h 148 v 132 q 0 26 -30 26 h -88 q -30 0 -30 -26 z" fill="${G2.glass}" opacity="0.55" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="-84" y="-176" width="168" height="30" rx="10" fill="${A1.metal}" stroke="${C.ink}" stroke-width="6"/>
    ${[-52, -18, 16, 50].map((hx) => `<circle cx="${hx}" cy="-161" r="5" fill="#4a4a52"/>`).join("")}
    <path d="M -60 -140 q 10 60 6 120" stroke="#ffffff" stroke-width="9" opacity="0.45" fill="none" stroke-linecap="round"/>
    <g transform="translate(0 -30)">${inner}</g>
    <path d="M -50 -14 q 50 -14 100 0 q -8 22 -50 22 q -42 0 -50 -22 z" fill="#c9d99a" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 8: the things in a home
//
// roomBox() already draws all five rooms as cutaways, which is what the ROOMS
// want. These are the individual objects of the "Things at Home" group, which a
// look-and-name page shows one at a time and a cutaway is too small to carry.

function sofaProp(x, y, s = 1, { tint = "#6f8fa8" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -190 -60 q 0 -70 40 -70 h 300 q 40 0 40 70 v 60 h -380 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -150 -56 q 0 -40 26 -40 h 248 q 26 0 26 40 v 12 h -300 z" fill="#f3ecdd" opacity="0.35"/>
    <rect x="-200" y="-64" width="400" height="52" rx="18" fill="${tint}" stroke="${C.ink}" stroke-width="6"/>
    ${[-100, 100].map((cx) => `<rect x="${cx - 56}" y="-118" width="112" height="58" rx="14" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="5"/>`).join("")}
    ${[-172, 172].map((lx) => `<rect x="${lx - 10}" y="-12" width="20" height="34" rx="7" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>`).join("")}
  </g>`;
}

function sinkProp(x, y, s = 1, { running = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-120" y="-90" width="240" height="90" rx="12" fill="#dfe9f2" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-100" y="-76" width="200" height="60" rx="8" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-70" y="0" width="140" height="76" rx="8" fill="#b0a495" stroke="${C.ink}" stroke-width="6"/>
    <path d="M -10 -90 v -70 q 0 -22 40 -22 q 40 0 40 30" fill="none" stroke="${A1.metal}" stroke-width="14" stroke-linecap="round"/>
    <circle cx="70" cy="-172" r="12" fill="${A1.metalDark}" stroke="${C.ink}" stroke-width="4"/>
    ${running ? `<g class="anim-drip" style="${delayAt(x, y, 1.1)}"><path d="M 70 -152 v 70" stroke="${C.waterLight}" stroke-width="9" stroke-linecap="round"/></g>` : ""}
  </g>`;
}

function rugProp(x, y, s = 1, { tint = A1.red } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="180" ry="52" fill="${tint}" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="0" cy="0" rx="132" ry="36" fill="none" stroke="#f3ecdd" stroke-width="8" opacity="0.75"/>
    <ellipse cx="0" cy="0" rx="78" ry="20" fill="none" stroke="#f3ecdd" stroke-width="7" opacity="0.6"/>
    ${[-180, -120, -60, 0, 60, 120, 180].map((fx) => `<path d="M ${fx} ${Math.round(Math.sqrt(Math.max(0, 1 - (fx / 180) ** 2)) * 52)} l 0 14" stroke="${tint}" stroke-width="6" stroke-linecap="round"/>`).join("")}
  </g>`;
}

function broomProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <g transform="rotate(-16)">
      <rect x="-7" y="-260" width="14" height="222" rx="7" fill="#b08758" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -40 -42 h 80 l 22 62 q -62 16 -124 0 z" fill="#d9b45f" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      ${[-40, -20, 0, 20, 40].map((bx) => `<path d="M ${bx} -30 l ${(bx / 4).toFixed(0)} 48" stroke="#b8955a" stroke-width="4"/>`).join("")}
    </g>
  </g>`;
}

// ---------------------------------------------------------------- shared page furniture

// A speech pair: two short lines with a tail, for the LISTENING books, which are
// conversations and otherwise draw as two people standing near each other. Kept
// wordless on purpose — the page text carries the words, and a bubble with
// writing in it would be a second, competing copy of the sentence.
function speechPair(x, y, s = 1, { flip = false, tint = "#fdfbf6" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <g class="anim-float" style="${delayAt(x, y, 2.6)}">
      <path d="M -110 -60 h 220 q 18 0 18 18 v 62 q 0 18 -18 18 h -150 l -46 34 l 8 -34 h -32 q -18 0 -18 -18 v -62 q 0 -18 18 -18 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M -80 -18 h 160 M -80 16 h 108" stroke="#9fb4c6" stroke-width="10" stroke-linecap="round"/>
    </g>
  </g>`;
}

// A word card with the thing on it and a coloured ground, for the look-and-name
// books. wordTile() in the Grade 1 shelf kit is square and holds ONE object;
// this is the wide form, for a pair the page is comparing (big/small,
// long/short, heavy/light) — Grade 2's comparing words come in pairs and a page
// that shows them one at a time loses the comparison.
function comparePair(x, y, s = 1, { left = "", right = "", leftTint = A1.blue, rightTint = A1.orange } = {}) {
  const half = (inner, tint, dx) => `<g transform="translate(${dx} 0)">
    <rect x="-165" y="-150" width="330" height="300" rx="28" fill="${tint}" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-143" y="-128" width="286" height="256" rx="18" fill="#fdfbf6" stroke="${C.ink}" stroke-width="4"/>
    ${inner}
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${half(left, leftTint, -180)}${half(right, rightTint, 180)}
  </g>`;
}

module.exports = {
  ...kit,
  CAST_G2, figureG2,
  hoopProp, flagProp,
  torchProp, earthBall, sundialProp,
  cricketJar,
  sofaProp, sinkProp, rugProp, broomProp,
  speechPair, comparePair,
};
