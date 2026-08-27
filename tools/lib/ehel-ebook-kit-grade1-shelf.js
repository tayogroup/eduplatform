// Grade 1 SHELF additions — the props books three, four and five of every
// Grade 1 unit need and the four existing kits do not have.
//
// Grade 1 used to carry two books per unit: the animal fable (Kiki, Duku, Lulu)
// from tools/lib/ehel-ebook-kit.js, and the child's own day (the Amal series)
// from tools/lib/ehel-ebook-kit-amal.js. This file is the third layer, for the
// three books added to each unit in 2026-08:
//
//   book 3  the unit's own rhyme or song, acted out
//   book 4  the unit's shared-reading frame, filled in — look, point and say
//   book 5  a second fable in the animal storyworld
//
// Almost everything those books need already exists somewhere in the four-kit
// chain (kit -> grade2 -> grade3 -> grade4 -> amal), which this file requires
// and re-exports whole. What is here is only what a Grade 1 unit NAMES and no
// earlier grade did: the animals of Unit 3 and Unit 8, the dressing-up things
// Unit 4 makes, the instruments Unit 6's Music Man plays, and the aeroplane
// Unit 7 lists beside the bus and the boat.
//
// Additive, as every kit here is. Nothing in the four kits below is modified,
// so no page a learner has already read can move — and motion reuses the
// existing animation classes only, because a new @keyframes in STYLE is
// embedded verbatim in every SVG of every book and would rewrite all 1,750 of
// them for a change nobody can see.
//
// Two rules the earlier kits learned the hard way and this one follows:
//
//  - An `anim-*` class and a `transform` attribute cannot share an element. The
//    animation animates the transform PROPERTY, which replaces the attribute
//    outright, so the element snaps to its parent's origin. Put the translate
//    on an outer <g> and the class on an inner one.
//  - A new animal carries `data-figure`, never `data-tap`. A tap value promises
//    a clip exists, and there is no rabbit.mp3, duck.mp3 or whale.mp3 on the
//    shelf. They get one in the same change that pays for the recording. The
//    composition lint reads either attribute, so they are still measured — and
//    every name below is in the EXTENTS table of tools/check-ebook-composition.mjs,
//    which is what makes "measured" true rather than assumed.

const kit = require("./ehel-ebook-kit-amal.js");

const { C, delayAt, A1, face, mouth } = kit;

// ---------------------------------------------------------------- Unit 1: the classroom

// The lunchbox. It is the tenth word of Unit 1's "Classroom objects" group and
// the only one of the ten with no drawing anywhere in the chain.
function lunchboxProp(x, y, s = 1, { colour = A1.red, open = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -96 -70 h 192 q 14 0 14 14 v 96 q 0 14 -14 14 h -192 q -14 0 -14 -14 v -96 q 0 -14 14 -14 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -110 -34 h 220" stroke="${C.ink}" stroke-width="5" opacity="0.55"/>
    <rect x="-26" y="-96" width="52" height="30" rx="12" fill="none" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-20" y="-44" width="40" height="22" rx="6" fill="#f6f0e8" stroke="${C.ink}" stroke-width="4"/>
    ${open ? `<circle cx="-44" cy="18" r="20" fill="${A1.green}" stroke="${C.ink}" stroke-width="4"/><rect x="12" y="-4" width="52" height="40" rx="6" fill="#f0e2c8" stroke="${C.ink}" stroke-width="4"/>` : ""}
  </g>`;
}

// A door, for Unit 3's "point to the window and point to the door" and for the
// classroom pages that need a way in. The kit's rooms have a window and a board
// and no door at all.
function doorProp(x, y, s = 1, { colour = "#a5764f", open = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-92" y="-260" width="184" height="260" rx="8" fill="#8a6242" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-76" y="-244" width="152" height="244" rx="6" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-54" y="-218" width="108" height="86" rx="6" fill="none" stroke="${C.ink}" stroke-width="5" opacity="0.6"/>
    <rect x="-54" y="-112" width="108" height="86" rx="6" fill="none" stroke="${C.ink}" stroke-width="5" opacity="0.6"/>
    <circle cx="${open ? -50 : 52}" cy="-124" r="12" fill="${A1.metal}" stroke="${C.ink}" stroke-width="5"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 3: the animals of the games unit
//
// Unit 3's "Animals in our stories" group is rabbit, duck, frog, lion, puppy,
// bee and bug. The bee and the bug are in the Grade 2 kit; the lion belongs to
// no Grade 1 reading and is not drawn. These four are.

function rabbitProp(x, y, s = 1, { flip = false, mood = "happy" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="4" rx="52" ry="10" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="rabbit">
    <g class="anim-idle" style="${delayAt(x, y, 2.1)}">
    <circle cx="-46" cy="-16" r="18" fill="#efe6d8" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="0" cy="-40" rx="46" ry="42" fill="#d8cbb4" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -34 -6 q 18 12 40 2 M 10 -4 q 18 10 38 -2" fill="none" stroke="${C.ink}" stroke-width="4" opacity="0.45"/>
    <ellipse cx="-24" cy="0" rx="26" ry="14" fill="#efe6d8" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="30" cy="0" rx="26" ry="14" fill="#efe6d8" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="18" cy="-84" r="34" fill="#d8cbb4" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 0 -110 q -14 -46 2 -52 q 16 -2 12 50 z" fill="#d8cbb4" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 30 -112 q 10 -46 26 -44 q 12 6 -10 52 z" fill="#d8cbb4" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 4 -128 q -6 -26 2 -32 M 38 -128 q 6 -26 16 -30" fill="none" stroke="#efe6d8" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="40" cy="-70" rx="13" ry="10" fill="#e8b7c4" stroke="${C.ink}" stroke-width="3.4"/>
    <g transform="translate(16 -88)">${face(mood, 0.62)}</g>
    <g transform="translate(30 -66)">${mouth(mood, 0.5)}</g>
    </g>
    </g>
  </g>`;
}

function duckProp(x, y, s = 1, { flip = false, mood = "happy" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="6" rx="58" ry="10" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="duck">
    <g class="anim-idle" style="${delayAt(x, y, 1.9)}">
    <path d="M -14 -2 l -4 12 h -20 M 16 -2 l 4 12 h 20" stroke="${A1.orange}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g class="anim-tail" style="${delayAt(x, y, 1.9)}"><path d="M -52 -40 q -30 -14 -34 -34 q 20 -6 40 12 z" fill="#f2ece0" stroke="${C.ink}" stroke-width="4"/></g>
    <ellipse cx="0" cy="-34" rx="60" ry="40" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -6 -44 q 34 -10 46 14 q -10 26 -44 18 z" fill="#e8ddc6" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 40 -78 q 6 -30 22 -30 q 12 0 8 26" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="62" cy="-92" r="26" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 82 -92 q 26 -6 30 6 q -4 12 -30 8 z" fill="${A1.orange}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <g transform="translate(60 -98)">${face(mood, 0.5)}</g>
    </g>
    </g>
  </g>`;
}

function frogProp(x, y, s = 1, { flip = false, mood = "happy" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="4" rx="56" ry="9" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="frog">
    <g class="anim-idle" style="${delayAt(x, y, 2.4)}">
    <path d="M -58 -22 q -18 8 -12 22 h 34 z" fill="#6f9a4a" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 58 -22 q 18 8 12 22 h -34 z" fill="#6f9a4a" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-28" rx="56" ry="34" fill="#79a15a" stroke="${C.ink}" stroke-width="5"/>
    <ellipse cx="0" cy="-16" rx="34" ry="18" fill="#c8d99a"/>
    <circle cx="-24" cy="-58" r="19" fill="#79a15a" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="24" cy="-58" r="19" fill="#79a15a" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="-24" cy="-60" r="9" fill="#f6f0e8"/><circle cx="24" cy="-60" r="9" fill="#f6f0e8"/>
    <circle cx="-22" cy="-60" r="5" fill="${C.ink}"/><circle cx="26" cy="-60" r="5" fill="${C.ink}"/>
    <g transform="translate(0 -22)">${mouth(mood, 0.9)}</g>
    </g>
    </g>
  </g>`;
}

function puppyProp(x, y, s = 1, { flip = false, mood = "happy" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="6" rx="72" ry="11" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="puppy">
    <g class="anim-idle" style="${delayAt(x, y, 2.2)}">
    ${[-46, -14, 26, 54].map((lx) => `<rect x="${lx - 10}" y="-30" width="20" height="36" rx="8" fill="#d8a765" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    <g class="anim-tail" style="${delayAt(x, y, 2.2)}"><path d="M -62 -52 q -28 -18 -26 -40 q 18 -4 32 20 z" fill="#d8a765" stroke="${C.ink}" stroke-width="4"/></g>
    <ellipse cx="-4" cy="-46" rx="62" ry="38" fill="#e0b478" stroke="${C.ink}" stroke-width="5"/>
    <ellipse cx="-4" cy="-32" rx="38" ry="20" fill="#f2e2c4"/>
    <circle cx="62" cy="-74" r="32" fill="#e0b478" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 40 -96 q -20 -6 -22 18 q 0 22 20 18 z" fill="#c08a4e" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 86 -96 q 22 -6 24 18 q 0 22 -22 18 z" fill="#c08a4e" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="80" cy="-56" rx="20" ry="15" fill="#f2e2c4" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="88" cy="-62" rx="8" ry="6" fill="${C.ink}"/>
    <g transform="translate(60 -80)">${face(mood, 0.56)}</g>
    <g transform="translate(76 -50)">${mouth(mood, 0.5)}</g>
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 4: the things they make
//
// Unit 4's costumes are things the children CUT and MAKE, so they are drawn as
// objects on the table rather than as headwear on a figure. That is not a
// shortcut: person() takes a `cap`, and a crown or a clown hat pinned to a head
// at the wrong scale is the one composition error the lint cannot see, because
// the hat is inside the figure's own group and moves with it however wrong it
// looks. As objects they are also what the unit's verbs act on — cut, make,
// paint, wear.

function crownProp(x, y, s = 1, { colour = "#f0b429", jewels = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -86 20 v -66 l 30 30 l 26 -56 l 26 56 l 30 -30 v 66 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -86 -2 h 172" stroke="${C.ink}" stroke-width="5" opacity="0.5"/>
    ${jewels ? `<circle cx="-44" cy="8" r="9" fill="${A1.red}" stroke="${C.ink}" stroke-width="3.4"/><circle cx="0" cy="8" r="9" fill="${A1.blue}" stroke="${C.ink}" stroke-width="3.4"/><circle cx="44" cy="8" r="9" fill="${A1.green}" stroke="${C.ink}" stroke-width="3.4"/>` : ""}
  </g>`;
}

function clownHatProp(x, y, s = 1, { colour = A1.purple } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -140 l 54 140 h -108 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="-16" cy="-46" r="11" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="18" cy="-14" r="11" fill="${A1.green}" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="-22" cy="-8" r="9" fill="${A1.red}" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="0" cy="-148" r="16" fill="${A1.red}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -62 0 h 124" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}

function capeProp(x, y, s = 1, { colour = A1.red } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -70 -110 q 70 -22 140 0 l 34 190 q -104 26 -208 0 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -70 -110 q 70 -22 140 0 q -70 34 -140 0 z" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 0 -46 l 14 40 h 42 l -34 26 l 13 42 l -35 -26 l -35 26 l 13 -42 l -34 -26 h 42 z" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
  </g>`;
}

function maskProp(x, y, s = 1, { colour = A1.green } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -96 -30 q 44 -34 96 -6 q 52 -28 96 6 q 8 56 -50 66 q -34 6 -46 -22 q -12 28 -46 22 q -58 -10 -50 -66 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="-48" cy="6" rx="22" ry="15" fill="#2b2b33"/>
    <ellipse cx="48" cy="6" rx="22" ry="15" fill="#2b2b33"/>
    <path d="M -96 -22 h -26 M 96 -22 h 26" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}

// A paper chain, the Unit 4 making-things project that is easiest to see going
// wrong and right: a row of coloured rings, cut and joined.
function paperChain(x, y, s = 1, { rings = 7, span = 520 } = {}) {
  const tints = [A1.red, A1.yellow, A1.green, A1.blue, A1.purple, A1.orange, A1.pink];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${Array.from({ length: rings }, (unused, i) => {
      const rx = -span / 2 + (span / (rings - 1)) * i;
      const dip = Math.sin((i / (rings - 1)) * Math.PI) * 40;
      return `<g transform="translate(${rx} ${dip})"><g class="anim-idle" style="${delayAt(x + rx, y, 3)}"><ellipse cx="0" cy="0" rx="30" ry="22" fill="none" stroke="${tints[i % tints.length]}" stroke-width="14"/><ellipse cx="0" cy="0" rx="30" ry="22" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.45"/></g></g>`;
    }).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 5: the vegetables that grow
//
// carrot() and the tomato of fruitProp() already exist. Onions, potatoes and
// beans are the other three of Unit 5's "Vegetables that grow" group.
function vegProp(x, y, s = 1, kind = "onion") {
  const shapes = {
    onion: `<path d="M 0 -66 q 62 22 62 74 q 0 52 -62 52 q -62 0 -62 -52 q 0 -52 62 -74 z" fill="#e6d3b0" stroke="${C.ink}" stroke-width="5.5"/>
      <path d="M -32 -24 q 32 -30 64 0 M -46 12 q 46 -22 92 0" fill="none" stroke="#c2a97e" stroke-width="5"/>
      <path d="M 0 -66 q -12 -40 -30 -52 M 0 -66 q 4 -44 24 -56" fill="none" stroke="#7fa05a" stroke-width="7" stroke-linecap="round"/>`,
    potato: `<path d="M -78 -6 q -14 -52 40 -58 q 56 -6 88 20 q 34 28 12 60 q -22 32 -76 26 q -52 -6 -64 -48 z" fill="#c9a06c" stroke="${C.ink}" stroke-width="5.5" stroke-linejoin="round"/>
      ${[[-30, -20], [16, 6], [46, -22], [-8, 26]].map(([bx, by]) => `<ellipse cx="${bx}" cy="${by}" rx="7" ry="5" fill="#a8845a"/>`).join("")}`,
    beans: `${[[-46, 0, -14], [0, -8, 6], [44, 2, 18]].map(([bx, by, rot]) => `<g transform="translate(${bx} ${by}) rotate(${rot})"><path d="M -14 -60 q 26 -8 26 60 q 0 66 -26 58 q -18 -6 -18 -58 q 0 -54 18 -60 z" fill="#6f9a4a" stroke="${C.ink}" stroke-width="5"/><path d="M 0 -46 q 8 46 0 92" fill="none" stroke="#4f7433" stroke-width="4" opacity="0.7"/></g>`).join("")}`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${shapes[kind] || shapes.onion}</g>`;
}

// ---------------------------------------------------------------- Unit 6: the Music Man's instruments
//
// Unit 6's second rhyme is "The Music Man": piano, drum, violin, named in that
// order and pretended one at a time. All three are new — the chain has a school
// bell and nothing else that makes a sound on purpose.

function drumProp(x, y, s = 1, { beating = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -84 -80 h 168 v 96 q 0 16 -84 16 q -84 0 -84 -16 z" fill="${A1.red}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-80" rx="84" ry="24" fill="#f0e2c8" stroke="${C.ink}" stroke-width="6"/>
    ${[-56, -18, 20, 58].map((zx, i) => `<path d="M ${zx} -70 l ${i % 2 ? 22 : -22} 74" stroke="#f6f0e8" stroke-width="6" opacity="0.85"/>`).join("")}
    <path d="M -84 -58 h 168" stroke="#f6f0e8" stroke-width="7" opacity="0.7"/>
    ${beating ? `<g class="anim-strain" style="${delayAt(x, y, 1.4)}"><path d="M -70 -150 l 44 56" stroke="#8a6242" stroke-width="10" stroke-linecap="round"/><circle cx="-74" cy="-156" r="14" fill="#e6d3b0" stroke="${C.ink}" stroke-width="4"/><path d="M 70 -150 l -44 56" stroke="#8a6242" stroke-width="10" stroke-linecap="round"/><circle cx="74" cy="-156" r="14" fill="#e6d3b0" stroke="${C.ink}" stroke-width="4"/></g>` : ""}
  </g>`;
}

function keyboardProp(x, y, s = 1) {
  const whites = 10;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -190 -50 h 380 q 12 0 12 12 v 62 q 0 12 -12 12 h -380 q -12 0 -12 -12 v -62 q 0 -12 12 -12 z" fill="#3a3a42" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    ${Array.from({ length: whites }, (unused, i) => `<rect x="${-178 + i * 36}" y="-38" width="32" height="72" rx="4" fill="#fdfbf6" stroke="${C.ink}" stroke-width="3.4"/>`).join("")}
    ${[0, 1, 3, 4, 5, 7, 8].map((i) => `<rect x="${-158 + i * 36}" y="-38" width="20" height="44" rx="3" fill="#2b2b33"/>`).join("")}
    <path d="M -190 -50 h 380" stroke="#5f5f68" stroke-width="6"/>
  </g>`;
}

function violinProp(x, y, s = 1, { rotate = -18 } = {}) {
  return `<g transform="translate(${x} ${y})">
    <g transform="rotate(${rotate}) scale(${s})">
    <path d="M 0 -120 q 34 0 34 30 q 0 22 -18 32 q 26 12 26 46 q 0 46 -42 46 q -42 0 -42 -46 q 0 -34 26 -46 q -18 -10 -18 -32 q 0 -30 34 -30 z" fill="#a5623a" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -8 -160 q 8 -34 16 -2 l -4 44 h -8 z" fill="#8a6242" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -14 -108 v 148 M 0 -108 v 148 M 14 -108 v 148" stroke="#f0e2c8" stroke-width="3"/>
    <path d="M -30 20 h 60" stroke="#2b2b33" stroke-width="6"/>
    <path d="M -26 -18 q -8 18 0 34 M 26 -18 q 8 18 0 34" fill="none" stroke="${C.ink}" stroke-width="4"/>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 7: the aeroplane
//
// The chain has a bus, a car, a bicycle, a boat, a ferry, a train and a
// helicopter. "plane" is the eighth word of Unit 7's "Ways to travel" group and
// the only one with nothing to draw.
function planeProp(x, y, s = 1, { flip = false, colour = "#f6f0e8" } = {}) {
  return `<g transform="translate(${x} ${y})">
    <g class="anim-float" style="${delayAt(x, y, 3)}">
    <g transform="scale(${flip ? -s : s} ${s})">
    <path d="M -170 0 q -14 -34 26 -40 l 210 -14 q 60 -4 96 24 q 24 20 -4 32 l -238 22 q -76 6 -90 -24 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -150 -34 l -34 -76 h 40 l 60 70 z" fill="#dfe6ec" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -60 -12 l 26 66 h -44 l -40 -60 z" fill="#c9d3dc" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    ${[-60, -14, 32, 76].map((wx) => `<circle cx="${wx}" cy="-14" r="11" fill="${A1.glass}" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    <path d="M 128 -18 q 22 -4 30 8 q -12 12 -32 10 z" fill="${A1.glass}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M -170 0 q -20 6 -8 18 q 10 8 26 -6 z" fill="${A1.red}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 8: the animals that live in water
//
// Unit 8's group is fish, frog, turtle, whale and crocodile. fish() and
// seaTurtle() exist; frogProp is above; these two are the rest.

function whaleProp(x, y, s = 1, { flip = false, spouting = true } = {}) {
  return `<g transform="translate(${x} ${y})">
    <g class="anim-float" style="${delayAt(x, y, 3.4)}">
    <g transform="scale(${flip ? -s : s} ${s})">
    <g class="tap-target" data-figure="whale">
    <path d="M -140 -10 q 20 -66 110 -66 q 96 0 128 52 q 16 26 -6 40 q -40 26 -128 26 q -92 0 -104 -52 z" fill="#5d86b8" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -140 -10 q 40 40 118 42 q -10 26 -50 24 q -62 -4 -68 -66 z" fill="#8fb0d6"/>
    <path d="M -140 -10 q -34 -34 -46 -66 q 44 4 62 40 z" fill="#3f6ea5" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 40 4 q 40 22 82 8" fill="none" stroke="#3f6ea5" stroke-width="5" stroke-linecap="round"/>
    <circle cx="86" cy="-42" r="8" fill="${C.ink}"/>
    <path d="M 100 -20 q 22 6 34 -4" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    </g>
    ${spouting ? `<g class="anim-drip" style="${delayAt(x, y, 1.2)}"><path d="M 20 -78 q -14 -44 4 -70 M 34 -78 q 10 -46 30 -66" fill="none" stroke="#bfe0f4" stroke-width="9" stroke-linecap="round"/></g>` : ""}
    </g>
    </g>
  </g>`;
}

function crocodileProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <g class="tap-target" data-figure="crocodile">
    <g class="anim-idle" style="${delayAt(x, y, 2.6)}">
    <path d="M -180 -6 q -20 -18 -6 -32 q 18 -6 30 18 z" fill="#5c7d43" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -156 -12 q 40 -34 116 -32 q 76 2 108 26 l 62 4 q 26 2 26 16 q 0 14 -26 14 l -66 4 q -40 22 -108 22 q -80 0 -112 -34 z" fill="#6f9a4a" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    ${[-120, -80, -40, 0].map((bx) => `<path d="M ${bx} -34 l 14 -20 l 14 20 z" fill="#5c7d43" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`).join("")}
    <path d="M 96 4 q 76 4 130 6 q -54 6 -130 8 z" fill="#f6f0e8" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="86" cy="-24" r="13" fill="#e0d08a" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="88" cy="-24" r="5" fill="${C.ink}"/>
    ${[-96, 30].map((lx) => `<path d="M ${lx} 16 q 6 22 -14 26 q -22 2 -18 -18 z" fill="#5c7d43" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>`).join("")}
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- shared page furniture

// A row of numbered cards, for Unit 2's counting pages. numberLadder() in the
// Grade 3 kit counts UP a wall and tensLine() counts in tens; neither shows
// "one, then two, then three" laid out side by side, which is what a page that
// counts a family out loud needs.
//
// It counts UP from `from`, left to right, because that is the direction the
// page's own words go. The first version counted DOWN and the pages read
// "3 2 1" under the sentence "One, two, three" — which is the one thing a
// counting page must not do.
function countRow(x, y, s = 1, { from = 1, count = 5 } = {}) {
  const tints = [A1.red, A1.orange, A1.yellow, A1.green, A1.blue, A1.purple, A1.pink];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${Array.from({ length: count }, (unused, i) => {
      const cx = (i - (count - 1) / 2) * 130;
      return `<g transform="translate(${cx} 0)">
        <rect x="-54" y="-64" width="108" height="128" rx="12" fill="#fdfbf6" stroke="${C.ink}" stroke-width="6"/>
        <text x="0" y="26" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="72" font-weight="700" fill="${tints[i % tints.length]}">${from + i}</text>
      </g>`;
    }).join("")}
  </g>`;
}

// A word card: the thing on one side and nothing else on it. The Grade 2 kit's
// pictureCard() is a frame with a picture in it, which is what a book-four page
// wants for an OBJECT; this is what it wants for a SENTENCE PATTERN, where the
// picture sits on a coloured ground so a row of them reads as a set.
function wordTile(x, y, s = 1, { inner = "", tint = A1.blue } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-140" y="-140" width="280" height="280" rx="30" fill="${tint}" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-118" y="-118" width="236" height="236" rx="20" fill="#fdfbf6" stroke="${C.ink}" stroke-width="4"/>
    ${inner}
  </g>`;
}

// Two little musical notes, so a page about a song is visibly a page about a
// song. Placed in the air, never on a character.
function songNotes(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="anim-float" style="${delayAt(x, y, 2.8)}">
      <path d="M -40 -60 v 74 q -22 -10 -30 8 q -8 20 14 24 q 26 4 30 -22 v -70 l 54 -14 v 56 q -22 -10 -30 8 q -8 20 14 24 q 26 4 30 -22 v -84 z" fill="${C.ink}"/>
    </g>
  </g>`;
}

module.exports = {
  ...kit,
  lunchboxProp, doorProp,
  rabbitProp, duckProp, frogProp, puppyProp,
  crownProp, clownHatProp, capeProp, maskProp, paperChain,
  vegProp,
  drumProp, keyboardProp, violinProp,
  planeProp,
  whaleProp, crocodileProp,
  countRow, wordTile, songNotes,
};
