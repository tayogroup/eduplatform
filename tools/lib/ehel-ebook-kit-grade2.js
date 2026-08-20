// Grade 2 additions to the shared picture-book kit.
//
// Everything here is NEW. Nothing in ehel-ebook-kit.js is touched, because the
// Grade 1 books are drawn from that file and already shipped — a tweak to the
// giraffe there repaints 156 pages a learner has already read. So the Grade 2
// storyworld extends the cast and the props rather than editing them, and the
// Grade 1 art regenerates byte-identical.
//
// The same rule applies to the animation stylesheet. STYLE is embedded verbatim
// in every SVG, so a new @keyframes would rewrite all 156 Grade 1 files for a
// change no reader could see. Grade 2 motion therefore reuses the existing
// classes only: anim-idle, anim-tail, anim-blink, anim-glow, anim-shimmer,
// anim-grass, anim-canopy, anim-rain, anim-ripple, anim-drip, anim-flow,
// anim-splash, anim-strain, anim-float, anim-wave, anim-cloud, and the
// tap-target/tap-burst pair.
//
// Tap sounds: a data-tap value must name a file in english/ebooks/tap-sounds/
// or an alias in english.js. Grade 2 introduces one alias (zuri -> chick); every
// other tap target here reuses a cue Grade 1 already paid for.

const kit = require("./ehel-ebook-kit.js");

const { C, W, H, delayAt, face, mouth, sky, sun, hills, ground, acacia, tallGrass, mango, carrot } = kit;

const ANIMAL_SCALE = kit.ANIMAL_SCALE;

// ---------------------------------------------------------------- palette additions
// Town, classroom and city colours. Kept in the same warm, chalky family as C.

const G2 = {
  road: "#c9bda8", roadDark: "#b3a68f", kerb: "#e2d9c6",
  brickWarm: "#c98f6a", brickCool: "#8fa8c9", brickMint: "#8ab17d", brickPlum: "#9d82c4",
  awningRed: "#e76f51", awningTeal: "#4d9d94", awningGold: "#f4c95d",
  paper: "#f6f0d8", paperEdge: "#e2d9c6", board: "#3d5245",
  metal: "#8f8f96", metalDark: "#5f5f68",
  meerkat: "#c9a06c", meerkatDark: "#ab8253", meerkatBelly: "#efe2cb", meerkatPatch: "#5a4a3a",
  soil: "#8a6242", soilDark: "#6f5238",
  glass: "#bfe0f4", deepWater: "#5d86b8", deepWaterDark: "#3f6ea5",
  bugRed: "#d94f43", bugGold: "#f2a541", bugGreen: "#79a15a", bugBlue: "#7fa8d9",
  shadow: "#4a4a52",
};

// ---------------------------------------------------------------- Zuri the meerkat
// Grade 2's lead: a young meerkat who notices things and writes them down.
// Drawn upright the way meerkats stand, so she reads as a different shape from
// Kiki at a glance even at thumbnail size on the shelf.

function zuri({ x, y, s = 1, flip = false, mood = "happy", arms = "down", book = false, pointing = false }) {
  s *= ANIMAL_SCALE;
  const up = arms === "up";
  // A raised arm has to clear the head, or it reads as no arm at all: at the
  // first draft the hands landed level with her ears and disappeared behind
  // them, so every "arms up" page showed a meerkat standing perfectly still.
  // Raised arms are longer, start from a higher shoulder and swing wider.
  const arm = (ax, ay, rot, length) => `<g transform="translate(${ax} ${ay}) rotate(${rot})"><rect x="-4.5" y="0" width="9" height="${length}" rx="4.5" fill="${G2.meerkat}" stroke="${C.ink}" stroke-width="3"/><circle cx="0" cy="${length + 2}" r="6" fill="${G2.meerkatBelly}" stroke="${C.ink}" stroke-width="2.6"/></g>`;
  // The notebook rides at her side in the near hand. Drawn across her chest it
  // read as a bib rather than as something she is carrying.
  const notebook = book
    ? `<g transform="translate(-31 22) rotate(-10)"><rect x="-15" y="-12" width="30" height="24" rx="3" fill="${G2.paper}" stroke="${C.ink}" stroke-width="2.6"/><path d="M -9 -5 h 18 M -9 1 h 18 M -9 7 h 12" stroke="#9fb4c6" stroke-width="2"/></g>`
    : "";
  const tail = `<g class="anim-tail" style="${delayAt(x, y, 1.5)}">
    <path d="M -18 30 q -40 12 -34 -26 q 2 -12 11 -9 q -2 22 25 27 z" fill="${G2.meerkat}" stroke="${C.ink}" stroke-width="3.2"/>
    <path d="M -46 -4 q -8 -6 -6 -14 q 8 0 10 12 z" fill="${G2.meerkatPatch}"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="56" rx="30" ry="8" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="zuri" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 1.5)}">
    ${tail}
    <path d="M -20 46 q -6 -44 20 -44 q 26 0 20 44 z" fill="${G2.meerkat}" stroke="${C.ink}" stroke-width="3.6"/>
    <ellipse cx="1" cy="24" rx="12" ry="20" fill="${G2.meerkatBelly}"/>
    ${up ? `${arm(-19, -16, 150, 40)}${arm(18, -16, -150, 40)}` : `${arm(-17, -8, pointing ? 8 : 22, 34)}${arm(16, -8, pointing ? -96 : -22, 34)}`}
    ${notebook}
    <g transform="translate(-10 44)"><rect x="-5" y="0" width="10" height="16" rx="5" fill="${G2.meerkatDark}" stroke="${C.ink}" stroke-width="3"/></g>
    <g transform="translate(11 44)"><rect x="-5" y="0" width="10" height="16" rx="5" fill="${G2.meerkatDark}" stroke="${C.ink}" stroke-width="3"/></g>
    <g transform="translate(0 -24)">
      <circle cx="-19" cy="-13" r="8" fill="${G2.meerkatDark}" stroke="${C.ink}" stroke-width="2.8"/>
      <circle cx="19" cy="-13" r="8" fill="${G2.meerkatDark}" stroke="${C.ink}" stroke-width="2.8"/>
      <circle cx="0" cy="0" r="21" fill="${G2.meerkat}" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M 14 2 q 20 1 21 11 q -2 10 -19 9 q -13 -2 -15 -10 z" fill="${G2.meerkatBelly}" stroke="${C.ink}" stroke-width="2.8"/>
      <circle cx="31" cy="10" r="3" fill="${C.ink}"/>
      <ellipse cx="-8" cy="-3" rx="9" ry="8" fill="${G2.meerkatPatch}" opacity="0.9"/>
      <ellipse cx="10" cy="-6" rx="8" ry="7" fill="${G2.meerkatPatch}" opacity="0.9"/>
      <g transform="translate(-8 -3)">${face(mood, 0.6)}</g>
      <g transform="translate(10 -6)">${face(mood, 0.55)}</g>
      <g transform="translate(18 16)">${mouth(mood, 0.5)}</g>
    </g>
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- base scenes

// The standard savanna scene with the sun where this page needs it. basicScene()
// draws its own sun at a fixed spot, so a page that wanted the sun somewhere
// else and simply added sun(x, y) on top ended up with two of them in the sky —
// which is what the first Shadow-book render showed, on the very pages about
// where the sun is.
function daylightScene(sunX = 1350, sunY = 160) {
  return `${sky()}${sun(sunX, sunY)}${hills()}${ground()}`;
}

// The aquarium hall: a dark room so the tank is the brightest thing in it, with
// a real floor for the characters to stand on. Without the floor the tank pages
// were a lit rectangle over a flat grey void.
function aquariumRoom() {
  return `<defs><linearGradient id="hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232c39"/><stop offset="1" stop-color="#3a4657"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#hall)"/>
    ${[220, 800, 1380].map((lx) => `<g class="anim-glow" style="animation-delay:${(lx % 3) * 0.6}s"><ellipse cx="${lx}" cy="70" rx="120" ry="46" fill="#8fd0e8" opacity="0.16"/></g><circle cx="${lx}" cy="52" r="17" fill="#cfeaf5" opacity="0.75"/>`).join("")}
    <rect x="0" y="838" width="${W}" height="${H - 838}" fill="#2c3543"/>
    <path d="M 0 838 h ${W}" stroke="#4a5668" stroke-width="8"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M ${i * 200 + 40} 846 L ${i * 200 - 40} 1000" stroke="#39434f" stroke-width="5"/>`).join("")}`;
}

// The town street: savanna sky and hills, then a swept sand road with a kerb.
function streetScene({ rainy = false, lit = false } = {}) {
  return `${sky(rainy)}${rainy || lit ? "" : sun()}${hills()}
    <rect x="0" y="590" width="${W}" height="${H - 590}" fill="${C.grassFar}"/>
    <path d="M 0 700 q 400 -34 800 0 q 400 34 800 0 L 1600 1000 L 0 1000 Z" fill="${G2.road}"/>
    <path d="M 0 700 q 400 -34 800 0 q 400 34 800 0" stroke="${G2.kerb}" stroke-width="12" fill="none"/>
    <path d="M 0 848 q 400 -30 800 0 q 400 30 800 0" stroke="${G2.roadDark}" stroke-width="7" stroke-dasharray="58 44" fill="none" opacity="0.7"/>`;
}

// The garden behind the tree school: grass, a hedge along the back, and one
// long raised bed of turned soil.
//
// The first version drew the bed as a thin lens of flat brown, which rendered as
// a dark smear across the page — it read as a shadow, or a hole, not as soil.
// A bed needs a front edge and a lit top to be a bed.
function gardenScene({ bedY = 880 } = {}) {
  const bush = (bx, bs) => `<g transform="translate(${bx} 700) scale(${bs})"><g class="anim-canopy" style="${delayAt(bx, 700, 5)}">
    <ellipse cx="-46" cy="-26" rx="62" ry="44" fill="${C.acaciaLeafDark}"/>
    <ellipse cx="30" cy="-40" rx="74" ry="52" fill="${C.acaciaLeaf}"/>
    <ellipse cx="86" cy="-22" rx="54" ry="38" fill="${C.acaciaLeafDark}"/>
  </g></g>`;
  return `${sky()}${sun(1360, 150)}${hills()}${ground()}
    ${bush(230, 1)}${bush(720, 0.86)}${bush(1240, 1.05)}${bush(1520, 0.8)}
    <path d="M 90 ${bedY} q 700 -46 1420 0 l 0 46 q -710 50 -1420 0 z" fill="${G2.soilDark}" stroke="${G2.soilDark}" stroke-width="4"/>
    <path d="M 90 ${bedY} q 700 -46 1420 0 q -710 50 -1420 0 z" fill="${G2.soil}"/>
    ${[220, 470, 720, 980, 1240, 1440].map((cx) => `<ellipse cx="${cx}" cy="${bedY - 6 + (cx % 3) * 4}" rx="26" ry="7" fill="${G2.soilDark}" opacity="0.55"/>`).join("")}`;
}

// Inside a home: a painted wall, a skirting board and a wooden floor.
function roomScene({ wall = "#e8dcc8", floor = "#c9a06c" } = {}) {
  return `<rect width="${W}" height="${H}" fill="${wall}"/>
    <rect x="0" y="0" width="${W}" height="14" fill="#d8cbb4"/>
    <rect x="0" y="700" width="${W}" height="${H - 700}" fill="${floor}"/>
    <rect x="0" y="692" width="${W}" height="22" fill="#b08758"/>
    ${[0, 200, 400, 600, 800, 1000, 1200, 1400].map((fx) => `<path d="M ${fx} 714 L ${fx - 60} 1000" stroke="#b08758" stroke-width="4" opacity="0.55"/>`).join("")}`;
}

// ---------------------------------------------------------------- Unit 1: school and calendar

// A month grid on an easel, with one date ringed in red.
function calendarBoard(x, y, s = 1, { ring = 12, month = "" } = {}) {
  let cells = "";
  for (let i = 0; i < 28; i += 1) {
    const cx = -126 + (i % 7) * 42;
    const cy = -96 + Math.floor(i / 7) * 34;
    const isRing = i + 1 === ring;
    cells += `<rect x="${cx}" y="${cy}" width="34" height="26" rx="4" fill="${isRing ? "#fbe3df" : G2.paper}" stroke="${G2.paperEdge}" stroke-width="2"/>`;
    cells += `<path d="M ${cx + 9} ${cy + 8} h 16 M ${cx + 9} ${cy + 16} h 11" stroke="#9fb4c6" stroke-width="2.4" stroke-linecap="round"/>`;
    if (isRing) cells += `<ellipse cx="${cx + 17}" cy="${cy + 13}" rx="21" ry="17" fill="none" stroke="${G2.bugRed}" stroke-width="4"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -80 0 l 26 -132 M 80 0 l -26 -132" stroke="${C.acaciaTrunk}" stroke-width="10" stroke-linecap="round"/>
    <rect x="-146" y="-158" width="292" height="152" rx="8" fill="${G2.paper}" stroke="${C.acaciaTrunk}" stroke-width="8"/>
    <path d="M -126 -122 h 252" stroke="${G2.paperEdge}" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((d) => `<circle cx="${-109 + d * 42}" cy="-134" r="7" fill="${C.rainbow[d % C.rainbow.length]}"/>`).join("")}
    ${month ? `<text x="0" y="-136" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${C.ink}">${month}</text>` : ""}
    ${cells}
  </g>`;
}

// The classroom colour chart: ten paint swatches pegged to a string.
function colourChart(x, y, s = 1) {
  const swatches = ["#d94f43", "#7fa8d9", "#8ab17d", "#f4c95d", "#e08a3c", "#9d82c4", "#2b2b33", "#f6f0d8", "#e78fb3", "#8a6242"];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -180 0 q 180 40 360 0" stroke="#c9b699" stroke-width="5" fill="none"/>
    ${swatches.map((colour, i) => {
      const t = (i + 0.5) / swatches.length;
      const sx = -180 + 360 * t;
      const sy = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * 40 + t * t * 0;
      // The translate and the animation MUST be on separate elements. An
      // anim-* class animates the `transform` property, which replaces the
      // transform attribute on the same element outright — put both here and
      // all ten swatches snap to the origin and stack into one, which is
      // exactly what the first render showed.
      return `<g transform="translate(${sx.toFixed(0)} ${sy.toFixed(0)})"><g class="anim-grass" style="${delayAt(sx, sy, 3)}"><rect x="-16" y="0" width="32" height="42" rx="4" fill="${colour}" stroke="${C.ink}" stroke-width="2.6"/></g></g>`;
    }).join("")}
  </g>`;
}

// A short shelf of picture books; `count` spines, in reading colours.
function bookShelf(x, y, s = 1, { count = 12 } = {}) {
  let spines = "";
  for (let i = 0; i < count; i += 1) {
    const bx = -140 + i * 24;
    const bh = 62 + (i % 4) * 9;
    spines += `<rect x="${bx}" y="${-bh}" width="19" height="${bh}" rx="3" fill="${C.rainbow[i % C.rainbow.length]}" stroke="${C.ink}" stroke-width="2.6"/>`;
    spines += `<path d="M ${bx + 4} ${-bh + 14} h 11" stroke="${G2.paper}" stroke-width="3"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${spines}
    <rect x="-152" y="0" width="316" height="14" rx="5" fill="#b08758" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-140" y="14" width="14" height="34" fill="#8a6242"/><rect x="134" y="14" width="14" height="34" fill="#8a6242"/>
  </g>`;
}

// One open book, held or lying flat, with lines of writing on both pages.
function openBook(x, y, s = 1, { left = "", right = "" } = {}) {
  const lines = (side) => [0, 1, 2, 3].map((i) => `<path d="M ${side * 12 + side * 4} ${-30 + i * 17} h ${side > 0 ? 66 : -66}" stroke="#9fb4c6" stroke-width="3" stroke-linecap="round"/>`).join("");
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -46 q -52 -16 -96 -6 l 0 92 q 46 -10 96 6 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 0 -46 q 52 -16 96 -6 l 0 92 q -46 -10 -96 6 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.6"/>
    ${left ? "" : lines(-1)}${right ? "" : lines(1)}
    ${left}${right}
    <path d="M 0 -46 v 92" stroke="${G2.paperEdge}" stroke-width="4"/>
  </g>`;
}

// A tablet propped on a desk, showing three lines of English words.
function tabletProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-46" y="-64" width="92" height="122" rx="10" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="-36" y="-54" width="72" height="98" rx="4" fill="${G2.glass}"/>
    <path d="M -26 -34 h 52 M -26 -14 h 40 M -26 6 h 46 M -26 26 h 30" stroke="${G2.deepWater}" stroke-width="5" stroke-linecap="round"/>
    <path d="M -30 62 l 12 -14 h 36 l 12 14 z" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/>
  </g>`;
}

// A folded greeting card with a heart on the front.
function greetingCard(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-idle" style="animation-duration:3s">
    <path d="M -44 -50 l 44 -12 l 0 108 l -44 10 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 44 -50 l -44 -12 l 0 108 l 44 10 z" fill="#fbe3df" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 24 -14 c -5 -9 -18 -6 -18 3 c 0 8 10 14 18 19 c 8 -5 18 -11 18 -19 c 0 -9 -13 -12 -18 -3 z" fill="${G2.bugRed}"/>
  </g></g>`;
}

// ---------------------------------------------------------------- Unit 2: the neighbourhood

// A terrace of small shops with striped awnings; windows glow when lit.
function shopRow(x, y, s = 1, { lit = false } = {}) {
  const shop = (sx, width, height, wall, awning) => {
    const stripes = [];
    for (let i = 0; i * 26 < width; i += 1) stripes.push(`<rect x="${sx + i * 26}" y="${-height - 34}" width="13" height="34" fill="${G2.paper}" opacity="0.75"/>`);
    return `<rect x="${sx}" y="${-height}" width="${width}" height="${height}" rx="6" fill="${wall}" stroke="${C.ink}" stroke-width="5"/>
      <rect x="${sx + 18}" y="${-height + 34}" width="${width - 36}" height="62" rx="5" fill="${lit ? "#f4c95d" : "#dfe9f2"}" stroke="${C.ink}" stroke-width="3.6"/>
      <rect x="${sx + width / 2 - 22}" y="-72" width="44" height="72" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="3.6"/>
      <circle cx="${sx + width / 2 + 12}" cy="-36" r="4" fill="${G2.paper}"/>
      <rect x="${sx - 8}" y="${-height - 34}" width="${width + 16}" height="34" rx="6" fill="${awning}" stroke="${C.ink}" stroke-width="4"/>
      <g clip-path="none">${stripes.join("")}</g>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${shop(-330, 190, 210, G2.brickWarm, G2.awningRed)}
    ${shop(-120, 200, 250, G2.brickCool, G2.awningTeal)}
    ${shop(110, 190, 190, G2.brickMint, G2.awningGold)}
  </g>`;
}

// The town bus: long, yellow, and stopping right here.
function townBus(x, y, s = 1, { flip = false } = {}) {
  const win = (wx) => `<rect x="${wx}" y="-104" width="52" height="46" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="34" rx="200" ry="14" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-tap="bell"><g class="anim-idle" style="animation-duration:3.4s">
    <path d="M -190 0 v -108 q 0 -22 22 -22 h 300 q 20 0 32 20 l 30 50 q 12 18 12 40 v 20 z" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="5"/>
    ${win(-168)}${win(-104)}${win(-40)}${win(24)}
    <path d="M 96 -126 h 52 q 16 0 26 18 l 26 44 h -104 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-190" y="-38" width="380" height="14" fill="${G2.awningRed}"/>
    <rect x="-156" y="-142" width="150" height="24" rx="6" fill="${G2.board}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M -140 -130 h 40 M -90 -130 h 62" stroke="${G2.paper}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-118" cy="4" r="34" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-118" cy="4" r="13" fill="${G2.metal}"/>
    <circle cx="128" cy="4" r="34" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="128" cy="4" r="13" fill="${G2.metal}"/>
    </g></g>
  </g>`;
}

// A small town fire engine with a ladder on the roof and a flashing light.
function fireEngine(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="34" rx="170" ry="13" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="animation-duration:2.6s">
    <path d="M -160 0 v -86 h 200 v -46 h 68 q 18 0 28 20 l 24 42 v 70 z" fill="${G2.bugRed}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="60" y="-124" width="60" height="42" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-140" y="-64" width="80" height="40" rx="5" fill="#f0e4d2" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-46" y="-64" width="72" height="40" rx="5" fill="#f0e4d2" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -150 -96 h 180 M -150 -108 h 180" stroke="${G2.metal}" stroke-width="7" stroke-linecap="round"/>
    ${[-130, -96, -62, -28, 6].map((lx) => `<path d="M ${lx} -108 v 12" stroke="${G2.metal}" stroke-width="5"/>`).join("")}
    <g class="anim-wave"><circle cx="-108" cy="-124" r="16" fill="${G2.awningGold}" opacity="0.85"/></g>
    <rect x="-118" y="-122" width="22" height="16" rx="6" fill="${G2.bugGold}" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="-104" cy="4" r="32" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-104" cy="4" r="12" fill="${G2.metal}"/>
    <circle cx="112" cy="4" r="32" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="112" cy="4" r="12" fill="${G2.metal}"/>
    </g>
  </g>`;
}

// A leaning ladder, for the window cleaner and the kite rescue.
function ladder(x, y, s = 1, { lean = -14 } = {}) {
  let rungs = "";
  for (let i = 1; i < 9; i += 1) rungs += `<path d="M -22 ${-i * 34} h 44" stroke="#c9a06c" stroke-width="8" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${lean})">
    <rect x="-30" y="-292" width="12" height="292" rx="5" fill="#b08758" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="18" y="-292" width="12" height="292" rx="5" fill="#b08758" stroke="${C.ink}" stroke-width="3.4"/>
    ${rungs}
  </g>`;
}

// A bucket and squeegee: the window cleaner's kit.
function cleaningKit(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -30 -44 q 30 -10 60 0 l -8 44 q -22 8 -44 0 z" fill="${G2.brickCool}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -28 -44 q 28 -34 56 0" stroke="${G2.metal}" stroke-width="4" fill="none"/>
    <ellipse cx="0" cy="-42" rx="30" ry="8" fill="${C.waterLight}"/>
    <g transform="translate(46 -30) rotate(14)"><rect x="-4" y="-58" width="8" height="58" rx="4" fill="#b08758"/><rect x="-20" y="0" width="40" height="12" rx="4" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/></g>
  </g>`;
}

// The firefighter's kit laid out: helmet, boots, gloves and a folded mask.
function fireKit(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -140 0 q 4 -54 46 -54 q 42 0 46 54 z" fill="${G2.bugRed}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -150 0 h 120 q 6 0 6 -8 q -66 -12 -126 0 z" fill="#a53a30" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="-94" cy="-30" r="11" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="-6" y="-62" width="32" height="62" rx="6" fill="${G2.board}" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="32" y="-62" width="32" height="62" rx="6" fill="${G2.board}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -6 -22 h 70" stroke="${G2.awningGold}" stroke-width="5"/>
    <path d="M 96 0 q -6 -44 16 -46 q 6 -22 16 -2 q 12 -14 16 4 q 14 -6 12 12 l -6 32 z" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 172 0 q 0 -34 30 -34 q 30 0 30 34 z" fill="#dfe9f2" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 178 -16 h 48" stroke="${G2.metal}" stroke-width="4"/>
  </g>`;
}

// A zebra crossing painted across the road, with a STOP lollipop sign.
function crossing(x, y, s = 1, { sign = true } = {}) {
  let bars = "";
  for (let i = 0; i < 6; i += 1) bars += `<path d="M ${-150 + i * 52} 0 l 22 0 l 32 74 l -22 0 z" fill="${G2.paper}" opacity="0.92"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${bars}
    ${sign ? `<g transform="translate(210 8)"><rect x="-6" y="-190" width="12" height="190" rx="5" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/><circle cx="0" cy="-206" r="42" fill="${G2.bugRed}" stroke="${G2.paper}" stroke-width="7"/><path d="M -20 -206 h 40" stroke="${G2.paper}" stroke-width="8" stroke-linecap="round"/></g>` : ""}
  </g>`;
}

// The clinic: a white door, a green cross and a bench for waiting.
function clinicFront(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-170" y="-250" width="340" height="250" rx="8" fill="#f0e9dc" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -190 -250 h 380 l -18 -40 h -344 z" fill="${G2.brickMint}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-46" y="-120" width="92" height="120" rx="6" fill="#dfe9f2" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-142" y="-196" width="76" height="60" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="66" y="-196" width="76" height="60" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>
    <g transform="translate(0 -196)"><rect x="-14" y="-40" width="28" height="80" rx="6" fill="${G2.brickMint}"/><rect x="-40" y="-14" width="80" height="28" rx="6" fill="${G2.brickMint}"/></g>
  </g>`;
}

// A doctor's bag with a stethoscope curling out of it.
function doctorKit(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -52 0 q -6 -62 52 -62 q 58 0 52 62 z" fill="#7d4a32" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -24 -60 q 0 -22 24 -22 q 24 0 24 22" stroke="${C.ink}" stroke-width="4.5" fill="none"/>
    <rect x="-14" y="-40" width="28" height="10" rx="4" fill="${G2.paper}"/><rect x="-5" y="-49" width="10" height="28" rx="4" fill="${G2.paper}"/>
    <path d="M 46 -30 q 52 6 40 54 q -12 34 -50 20" stroke="${G2.metalDark}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="44" r="14" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
}

// The reporter's notepad and pencil, mid-scribble.
function notepad(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-idle" style="animation-duration:2.4s">
    <rect x="-38" y="-50" width="76" height="100" rx="5" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -38 -34 h 76" stroke="${G2.bugRed}" stroke-width="3"/>
    <path d="M -26 -18 h 52 M -26 -2 h 52 M -26 14 h 38 M -26 30 h 44" stroke="#9fb4c6" stroke-width="3.4" stroke-linecap="round"/>
    <g transform="translate(46 -8) rotate(22)"><rect x="-5" y="-56" width="10" height="56" rx="3" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="2.6"/><path d="M -5 0 l 5 14 l 5 -14 z" fill="#7d4a32"/></g>
  </g></g>`;
}

// ---------------------------------------------------------------- Unit 3: bodies and moving

// Curved swoosh marks that say "this is moving", the way a comic does.
function motionArcs(x, y, s = 1, { flip = false } = {}) {
  // Bolder and larger than the first draft, whose thin 45%-opacity hairlines
  // disappeared on a sunlit page — the movement books then showed characters
  // standing perfectly still with a faint scratch beside them.
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="anim-wave" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round" opacity="0.6">
    <path d="M 0 0 q -46 -34 -52 -84"/><path d="M 40 12 q -38 -46 -34 -102"/><path d="M -34 -18 q -52 -18 -70 -58"/>
  </g></g>`;
}

// A bowl of fruit for the healthy-snack pages.
function fruitBowl(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${mango(-34, -30, 1)}${mango(6, -38, 1.05)}${mango(44, -28, 0.95)}${carrot(20, -46, 0.8)}
    <path d="M -72 -30 q 72 26 144 0 q -14 46 -72 46 q -58 0 -72 -46 z" fill="#b06a4a" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -64 -22 q 64 22 128 0" stroke="#8a5238" stroke-width="4" fill="none"/>
  </g>`;
}

// A clear water bottle, capped, with the level showing.
function waterBottle(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -22 0 v -70 q 0 -14 8 -20 v -14 h 28 v 14 q 8 6 8 20 v 70 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6" opacity="0.95"/>
    <path d="M -22 -46 v 46 h 44 v -46 q -22 8 -44 0 z" fill="${C.water}"/>
    <rect x="-16" y="-118" width="32" height="16" rx="5" fill="${G2.deepWater}" stroke="${C.ink}" stroke-width="3"/>
  </g>`;
}

// Three drowsy Zs rising from a sleeper.
function sleepyZs(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${C.ink}" opacity="0.72" font-family="Georgia, serif">
    <g class="anim-drip" style="animation-delay:0s"><text x="0" y="0" font-size="72">Z</text></g>
    <g class="anim-drip" style="animation-delay:0.4s"><text x="56" y="-62" font-size="54">z</text></g>
    <g class="anim-drip" style="animation-delay:0.8s"><text x="100" y="-114" font-size="40">z</text></g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 4: sky and shadows

// A cast shadow on the ground: a stretched, squashed copy of whoever is
// standing there. It carries a head at the far end, because the first version
// was a plain tapering wedge and every reader of the contact sheet read it as a
// stick lying on the grass — a shadow has to be recognisable as a body or the
// page is not about a shadow at all.
// `length` is how far it reaches, `dir` which way the light throws it.
// `height` is the shadow's THICKNESS at the feet, not its depth on the page. A
// second draft built the body out of a thin wedge plus two small ellipses and it
// read as a blob with pebbles trailing away from it; a shadow is legible when it
// is one continuous body with a head on the end, at a thickness that scales with
// how long it is.
function castShadow(x, y, { length = 200, dir = 1, height = 70, opacity = 0.24 } = {}) {
  const head = x + length * dir;
  // The head has to MEET the trunk. Ending the trunk at a fixed fraction of the
  // length left a growing gap as the shadow got longer, so a long shadow read as
  // a bar with a loose dot floating past the end of it.
  const neck = head - height * 0.55 * dir;
  return `<g opacity="${opacity}">
    <ellipse cx="${x}" cy="${y}" rx="${height * 0.9}" ry="${height * 0.34}" fill="${G2.shadow}"/>
    <path d="M ${x} ${y} L ${neck} ${y}" stroke="${G2.shadow}" stroke-width="${height * 0.95}" stroke-linecap="round" fill="none"/>
    <ellipse cx="${head}" cy="${y}" rx="${height * 0.62}" ry="${height * 0.58}" fill="${G2.shadow}"/>
  </g>`;
}

// A soft cloud that drifts.
function cloudPuff(x, y, s = 1, { grey = false } = {}) {
  const fill = grey ? "#c3ccd6" : "#f7fbfe";
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-cloud" style="${delayAt(x, y, 6)}">
    <ellipse cx="-52" cy="10" rx="56" ry="34" fill="${fill}"/>
    <ellipse cx="14" cy="-8" rx="70" ry="46" fill="${fill}"/>
    <ellipse cx="74" cy="14" rx="52" ry="32" fill="${fill}"/>
    <rect x="-104" y="8" width="230" height="34" rx="17" fill="${fill}"/>
  </g></g>`;
}

// A low sun sitting on the horizon, warm at sunrise and sunset.
function lowSun(x, y, { colour = "#f4a259" } = {}) {
  return `<g class="tap-target" data-tap="sun">
    <circle class="anim-glow" cx="${x}" cy="${y}" r="150" fill="${colour}" opacity="0.35"/>
    <circle cx="${x}" cy="${y}" r="86" fill="${colour}"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${x - 300} ${y + 60 + i * 34} h 600" stroke="${colour}" stroke-width="${10 - i * 2}" opacity="${0.4 - i * 0.08}" stroke-linecap="round"/>`).join("")}
  </g>`;
}

// A sunset sky: the standard gradient swapped for warm bands.
function sunsetScene() {
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b6fa8"/><stop offset="0.45" stop-color="#e78fb3"/><stop offset="0.78" stop-color="#f4a259"/><stop offset="1" stop-color="#f7d9a8"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${lowSun(1180, 560)}
    ${hills()}${ground()}
    <rect x="0" y="590" width="${W}" height="${H - 590}" fill="#7d5b7a" opacity="0.20"/>`;
}

// ---------------------------------------------------------------- Unit 5: measuring

// A wooden ruler, marked in centimetres.
function rulerProp(x, y, s = 1, { rotate = 0, length = 300 } = {}) {
  let ticks = "";
  const step = length / 20;
  for (let i = 0; i <= 20; i += 1) {
    const tx = -length / 2 + i * step;
    ticks += `<path d="M ${tx} ${-26} v ${i % 5 === 0 ? 18 : 11}" stroke="${C.ink}" stroke-width="${i % 5 === 0 ? 3.4 : 2.4}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rotate})">
    <rect x="${-length / 2 - 10}" y="-30" width="${length + 20}" height="42" rx="6" fill="#e9c86a" stroke="${C.ink}" stroke-width="3.6"/>
    ${ticks}
  </g>`;
}

// A metre stick standing upright beside whatever is being measured.
function metreStick(x, y, s = 1) {
  let ticks = "";
  for (let i = 0; i <= 10; i += 1) ticks += `<path d="M -16 ${-i * 34} h ${i % 5 === 0 ? 30 : 20}" stroke="${C.ink}" stroke-width="${i % 5 === 0 ? 3.6 : 2.4}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-18" y="-352" width="36" height="352" rx="6" fill="#f0e4d2" stroke="${C.ink}" stroke-width="3.6"/>
    ${ticks}
  </g>`;
}

// One flat shape tile: circle, square, triangle, rectangle or heart.
function shapeTile(x, y, s = 1, kind = "circle", colour = "#7fa8d9") {
  const shapes = {
    circle: `<circle cx="0" cy="0" r="42" fill="${colour}" stroke="${C.ink}" stroke-width="4"/>`,
    square: `<rect x="-40" y="-40" width="80" height="80" rx="6" fill="${colour}" stroke="${C.ink}" stroke-width="4"/>`,
    triangle: `<path d="M 0 -46 L 44 36 L -44 36 Z" fill="${colour}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`,
    rectangle: `<rect x="-56" y="-32" width="112" height="64" rx="6" fill="${colour}" stroke="${C.ink}" stroke-width="4"/>`,
    heart: `<path d="M 0 40 c -34 -22 -46 -42 -46 -60 c 0 -18 24 -28 46 -8 c 22 -20 46 -10 46 8 c 0 18 -12 38 -46 60 z" fill="${colour}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${shapes[kind] || shapes.circle}</g>`;
}

// A repeating pattern strip: the shapes alternate, and the last cell is empty
// so the reader can answer "what comes next?".
function patternStrip(x, y, s = 1, { kinds = ["circle", "square"], cells = 5, blankLast = true } = {}) {
  let tiles = "";
  for (let i = 0; i < cells; i += 1) {
    const tx = -((cells - 1) * 110) / 2 + i * 110;
    if (blankLast && i === cells - 1) {
      tiles += `<rect x="${tx - 48}" y="-48" width="96" height="96" rx="8" fill="none" stroke="${C.ink}" stroke-width="4" stroke-dasharray="12 10"/>`;
      tiles += `<text x="${tx}" y="16" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="${C.ink}" opacity="0.5">?</text>`;
    } else {
      tiles += shapeTile(tx, 0, 0.78, kinds[i % kinds.length], C.rainbow[i % C.rainbow.length]);
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="${-((cells - 1) * 110) / 2 - 70}" y="-70" width="${(cells - 1) * 110 + 140}" height="140" rx="12" fill="${G2.paper}" stroke="${G2.paperEdge}" stroke-width="5"/>
    ${tiles}
  </g>`;
}

// A pan balance: pass a positive tilt to sink the left pan.
function balanceScale(x, y, s = 1, { tilt = 0, left = "", right = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -50 0 h 100 l -18 -60 h -64 z" fill="#b08758" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-7" y="-190" width="14" height="132" rx="6" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>
    <g transform="rotate(${tilt})">
      <rect x="-150" y="-198" width="300" height="14" rx="7" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>
      <path d="M -130 -184 v 44 M 130 -184 v 44" stroke="${G2.metalDark}" stroke-width="4"/>
      <path d="M -180 -140 q 50 34 100 0 z" fill="#c9a06c" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M 80 -140 q 50 34 100 0 z" fill="#c9a06c" stroke="${C.ink}" stroke-width="3.6"/>
      <g transform="translate(-130 -158)">${left}</g>
      <g transform="translate(130 -158)">${right}</g>
    </g>
  </g>`;
}

// A single feather, the lightest thing in the classroom.
function feather(x, y, s = 1, { rotate = -20 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rotate})"><g class="anim-float" style="animation-duration:3.4s">
    <path d="M 0 40 q -30 -34 -22 -70 q 8 -34 22 -46 q 14 12 22 46 q 8 36 -22 70 z" fill="#f4efe4" stroke="${C.ink}" stroke-width="3"/>
    <path d="M 0 40 v -110" stroke="${G2.metal}" stroke-width="3"/>
  </g></g>`;
}

// A number line counting in tens to one hundred.
function tensLine(x, y, s = 1) {
  let marks = "";
  for (let i = 0; i <= 10; i += 1) {
    const tx = -300 + i * 60;
    marks += `<circle cx="${tx}" cy="0" r="${i === 10 ? 15 : 10}" fill="${i === 10 ? G2.bugRed : C.rainbow[i % C.rainbow.length]}" stroke="${C.ink}" stroke-width="3"/>`;
    marks += `<path d="M ${tx} 18 v 12" stroke="${C.ink}" stroke-width="3"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -330 0 h 660" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    ${marks}
  </g>`;
}

// ---------------------------------------------------------------- Unit 6: bugs

function butterflyBug(x, y, s = 1, { colour = G2.bugGold } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="bird"><g class="anim-float" style="${delayAt(x, y, 2)}; animation-duration:2.4s">
    <path d="M -6 -4 q -46 -46 -62 -14 q -14 30 56 26 z" fill="${colour}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 6 -4 q 46 -46 62 -14 q 14 30 -56 26 z" fill="${colour}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -6 6 q -38 26 -46 2 q -6 -22 44 -14 z" fill="${G2.bugRed}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 6 6 q 38 26 46 2 q 6 -22 -44 -14 z" fill="${G2.bugRed}" stroke="${C.ink}" stroke-width="3.4"/>
    <ellipse cx="0" cy="2" rx="8" ry="26" fill="${C.ink}"/>
    <path d="M -4 -22 q -12 -18 -22 -22 M 4 -22 q 12 -18 22 -22" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-26" cy="-46" r="4" fill="${C.ink}"/><circle cx="26" cy="-46" r="4" fill="${C.ink}"/>
  </g></g></g>`;
}

function beeBug(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="crickets"><g class="anim-float" style="${delayAt(x, y, 1.6)}; animation-duration:1.8s">
    <ellipse cx="-22" cy="-16" rx="22" ry="14" fill="#dfe9f2" opacity="0.85" stroke="${C.ink}" stroke-width="2.4"/>
    <ellipse cx="14" cy="-18" rx="20" ry="13" fill="#dfe9f2" opacity="0.85" stroke="${C.ink}" stroke-width="2.4"/>
    <ellipse cx="0" cy="4" rx="34" ry="24" fill="${G2.awningGold}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -12 -18 q 6 44 2 46 M 8 -18 q -4 44 -8 44" stroke="${C.ink}" stroke-width="8"/>
    <circle cx="30" cy="-4" r="15" fill="${C.ink}"/>
    <circle cx="35" cy="-8" r="4" fill="${G2.paper}"/>
    <path d="M 26 -18 q 4 -14 14 -16 M 34 -14 q 10 -12 20 -10" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </g></g></g>`;
}

function antBug(x, y, s = 1, { flip = false, carrying = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="tap-target" data-tap="crickets"><g class="anim-idle" style="${delayAt(x, y, 1.2)}; animation-duration:1.3s">
    <path d="M -20 6 l -14 16 M -6 6 l -4 18 M 8 6 l 10 18" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="-24" cy="-2" rx="16" ry="13" fill="#7d4a32" stroke="${C.ink}" stroke-width="2.8"/>
    <ellipse cx="-2" cy="-2" rx="10" ry="9" fill="#7d4a32" stroke="${C.ink}" stroke-width="2.8"/>
    <circle cx="17" cy="-6" r="12" fill="#7d4a32" stroke="${C.ink}" stroke-width="2.8"/>
    <path d="M 20 -16 q 6 -12 16 -14 M 12 -17 q 0 -14 8 -18" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="21" cy="-8" r="2.6" fill="${G2.paper}"/>
    ${carrying ? `<circle cx="22" cy="-28" r="11" fill="${G2.bugGreen}" stroke="${C.ink}" stroke-width="2.8"/>` : ""}
  </g></g></g>`;
}

function anthill(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -90 0 q 12 -76 90 -76 q 78 0 90 76 z" fill="${G2.soil}" stroke="${G2.soilDark}" stroke-width="4"/>
    <path d="M -50 -20 q 20 -14 34 0 M 22 -34 q 20 -12 34 2 M -14 -50 q 16 -10 28 2" stroke="${G2.soilDark}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="0" cy="-62" rx="16" ry="9" fill="${C.ink}" opacity="0.65"/>
  </g>`;
}

function spiderWeb(x, y, s = 1) {
  // Drawn twice: a pale halo so it reads against the dark, then a dark line so
  // it reads against the sky. A single white web vanished completely outdoors.
  const strand = (d, colour, width, opacity) => `<path d="${d}" stroke="${colour}" stroke-width="${width}" fill="none" opacity="${opacity}"/>`;
  const ringPath = (r) => `M ${-r} 0 q ${r * 0.6} ${r * 0.5} ${r} 0 q ${-r * 0.6} ${-r * 0.5} ${-r} 0 M ${-r} 0 q ${r * 0.6} ${-r * 0.5} ${r} 0 q ${-r * 0.6} ${r * 0.5} ${-r} 0`;
  const rings = [40, 74, 108, 142].map((r) => strand(ringPath(r), G2.paper, 7, 0.5) + strand(ringPath(r), "#6b7280", 3, 0.95)).join("");
  const spokes = [0, 45, 90, 135].map((a) => `<g transform="rotate(${a})">${strand("M -152 0 h 304", G2.paper, 7, 0.5)}${strand("M -152 0 h 304", "#6b7280", 3, 0.95)}</g>`).join("");
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-shimmer">${spokes}${rings}</g></g>`;
}

function spiderBug(x, y, s = 1, { dangling = false } = {}) {
  const leg = (rot, len) => `<path d="M 0 0 q ${len * 0.5} ${-len * 0.4} ${len} ${len * 0.3}" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round" transform="rotate(${rot})"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${dangling ? `<path d="M 0 -300 v 268" stroke="${G2.paper}" stroke-width="3" opacity="0.9"/>` : ""}
    <g class="tap-target" data-tap="crickets"><g class="anim-idle" style="animation-duration:2.2s">
    ${[20, 55, 125, 160, 200, 235, 305, 340].map((a) => leg(a, 40)).join("")}
    <ellipse cx="0" cy="0" rx="26" ry="22" fill="#4a3a52" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="20" cy="-6" r="15" fill="#5f4a68" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="24" cy="-10" r="4" fill="${G2.paper}"/><circle cx="15" cy="-12" r="3" fill="${G2.paper}"/>
    </g></g>
  </g>`;
}

function wormBug(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="crickets"><g class="anim-strain" style="animation-duration:2.4s">
    <path d="M -70 10 q 24 -34 48 0 q 24 34 48 0 q 20 -28 44 -6" stroke="#d98f8f" stroke-width="24" fill="none" stroke-linecap="round"/>
    <path d="M -70 10 q 24 -34 48 0 q 24 34 48 0 q 20 -28 44 -6" stroke="#c97a7a" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.5"/>
    <circle cx="66" cy="0" r="3.4" fill="${C.ink}"/>
  </g></g></g>`;
}

function cricketBug(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="tap-target" data-tap="crickets"><g class="anim-idle" style="${delayAt(x, y, 1.4)}; animation-duration:1.5s">
    <path d="M -6 8 q 26 26 34 6 q -6 26 -34 22" fill="${G2.bugGreen}" stroke="${C.ink}" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="34" ry="19" fill="${G2.bugGreen}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -26 -6 q 26 -14 50 -2 q -22 12 -50 2 z" fill="#8fbd6c" stroke="${C.ink}" stroke-width="2.6"/>
    <circle cx="32" cy="-8" r="13" fill="${G2.bugGreen}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M 36 -20 q 12 -18 26 -18 M 30 -20 q 4 -20 14 -26" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="36" cy="-10" r="2.8" fill="${C.ink}"/>
    <path d="M -18 12 l -18 22 M 4 14 l -2 22" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
  </g></g></g>`;
}

// A wet log to look under, and the flat stone beside it.
function fallenLog(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -160 0 q 0 -44 44 -44 h 232 q 44 0 44 44 q 0 44 -44 44 h -232 q -44 0 -44 -44 z" fill="#8a6242" stroke="${C.ink}" stroke-width="4.5"/>
    <ellipse cx="-160" cy="0" rx="26" ry="44" fill="#a3542f" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="-160" cy="0" rx="14" ry="26" fill="none" stroke="#7d4a32" stroke-width="4"/>
    <path d="M -80 -20 h 160 M -60 16 h 130" stroke="#7d4a32" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

function flatStone(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -70 0 q -14 -34 30 -40 q 60 -10 84 8 q 24 18 -10 32 z" fill="#b9b0a6" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -40 -18 q 30 -10 60 0" stroke="#a39a8f" stroke-width="4" fill="none"/>
  </g>`;
}

// A leafy garden plant to hold bugs.
function gardenPlant(x, y, s = 1, { flowers = true } = {}) {
  // Bigger and bushier than the first draft, which drew one thin stem with two
  // small leaves and left the "garden" pages looking like bare ground with a
  // single flower stuck in it.
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-grass" style="${delayAt(x, y, 3)}">
    <path d="M 0 0 q -8 -84 -3 -134" stroke="#5c7d43" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M -2 -26 q -54 -8 -70 -42 q 50 -16 74 30 z" fill="${C.leafDark}" stroke="${C.leafDark}" stroke-width="3.4"/>
    <path d="M 0 -44 q 56 -10 74 -46 q -52 -16 -78 32 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3.4"/>
    <path d="M -2 -66 q -62 -18 -78 -62 q 58 -10 82 44 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3.4"/>
    <path d="M 0 -92 q 52 -22 66 -60 q -48 -12 -70 36 z" fill="${C.leafDark}" stroke="${C.leafDark}" stroke-width="3.4"/>
    ${flowers ? `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-160" rx="15" ry="24" fill="#e78fb3" transform="rotate(${a} 0 -134)"/>`).join("")}<circle cx="0" cy="-134" r="15" fill="${C.sun}" stroke="${C.ink}" stroke-width="3.4"/>` : ""}
  </g></g>`;
}

// ---------------------------------------------------------------- Unit 7: growing and caring

// One seed, on a palm or on the soil.
function seedProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="15" ry="20" fill="#a3542f" stroke="${C.ink}" stroke-width="3" transform="rotate(-16)"/>
    <path d="M -5 -8 q 6 8 8 16" stroke="#7d4a32" stroke-width="3" fill="none"/>
  </g>`;
}

// A hole scooped in the soil, with the little pile of earth beside it.
function dugHole(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="52" ry="22" fill="${G2.soilDark}"/>
    <ellipse cx="0" cy="-4" rx="40" ry="15" fill="#4f3a26"/>
    <path d="M 70 4 q 6 -34 40 -34 q 34 0 40 34 z" fill="${G2.soil}" stroke="${G2.soilDark}" stroke-width="3.4"/>
  </g>`;
}

// A plant at one of four stages: seed, sprout, leafy, flowering.
function plantStage(x, y, s = 1, stage = "sprout") {
  const stem = `<path d="M 0 0 q -4 -50 0 -78" stroke="#5c7d43" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const leaves = `<path d="M -2 -34 q -40 -10 -50 -42 q 38 -6 52 30 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3.4"/>
    <path d="M 2 -52 q 40 -12 50 -44 q -38 -6 -52 32 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3.4"/>`;
  const bloom = `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-98" rx="13" ry="20" fill="${G2.awningGold}" transform="rotate(${a} 0 -78)"/>`).join("")}
    <circle cx="0" cy="-78" r="14" fill="#e08a3c" stroke="${C.ink}" stroke-width="3"/>
    ${[[-9, -74], [8, -80], [1, -70]].map(([sx2, sy2]) => `<circle cx="${sx2}" cy="${sy2}" r="3" fill="#5f4630"/>`).join("")}`;
  const body = stage === "seed"
    ? seedProp(0, -10, 1)
    : stage === "sprout"
      ? `<path d="M 0 0 q -2 -26 0 -34" stroke="#5c7d43" stroke-width="7" fill="none" stroke-linecap="round"/>
         <path d="M 0 -22 q -26 -8 -32 -28 q 26 -4 34 20 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3"/>
         <path d="M 2 -30 q 26 -10 32 -30 q -26 -4 -34 22 z" fill="${C.leaf}" stroke="${C.leafDark}" stroke-width="3"/>`
      : stage === "flower" ? `${stem}${leaves}${bloom}` : `${stem}${leaves}`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-grass" style="${delayAt(x, y, 3)}">${body}</g></g>`;
}

// A labelled cutaway: roots below the line, stem, leaves and flower above.
function plantParts(x, y, s = 1) {
  // A cutaway: soil below the line, plant above it. The roots are drawn in a
  // colour that reads AGAINST the soil — the first version used a pale tan on a
  // tan block and the whole point of the diagram, the part you cannot normally
  // see, was the part you could not see here either.
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -250 0 q 250 34 500 0 L 250 190 q -250 26 -500 0 z" fill="${G2.soil}"/>
    <path d="M -250 0 q 250 34 500 0" stroke="${G2.soilDark}" stroke-width="7" fill="none"/>
    ${[[-170, 60], [110, 96], [-60, 140], [190, 52]].map(([px, py]) => `<ellipse cx="${px}" cy="${py}" rx="30" ry="9" fill="${G2.soilDark}" opacity="0.45"/>`).join("")}
    <path d="M 0 6 q -44 56 -96 86 M 0 6 q -8 74 -6 116 M 0 6 q 46 58 100 80 M -42 48 q -28 30 -64 42 M 46 54 q 26 32 62 40" stroke="#7d5a38" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${plantStage(0, 0, 1.7, "flower")}
  </g>`;
}

// A watering can, tipped and pouring when `pouring` is set.
function wateringCan(x, y, s = 1, { pouring = false, flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${pouring ? -34 : 0})">
    <path d="M -50 0 q -8 -74 54 -74 q 62 0 54 74 z" fill="${G2.brickMint}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -22 -74 q 26 -34 52 -2" stroke="${G2.metalDark}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 54 -50 q 46 -6 62 -30 l 22 12 q -20 34 -76 40 z" fill="${G2.brickMint}" stroke="${C.ink}" stroke-width="4"/>
    <ellipse cx="130" cy="-70" rx="17" ry="13" fill="#6f9a63" stroke="${C.ink}" stroke-width="3.4" transform="rotate(-28 130 -70)"/>
    ${pouring ? `<g class="anim-drip">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${140 + i * 16}" cy="${-46 + i * 22}" r="${6 - i * 0.5}" fill="${C.water}" style="animation-delay:${(i * 0.12).toFixed(2)}s"/>`).join("")}</g>
       <path class="anim-flow" d="M 138 -58 q 40 40 74 120" stroke="${C.waterLight}" stroke-width="7" fill="none" stroke-linecap="round"/>` : ""}
  </g>`;
}

// Litter scattered on the ground: paper, a tin and a bottle.
function litterBits(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g transform="rotate(-12 -150 -20)"><path d="M -206 0 q -14 -54 34 -60 q 54 -6 50 34 q -4 32 -48 30 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="4"/><path d="M -186 -34 h 44 M -190 -18 h 30" stroke="#9fb4c6" stroke-width="4"/></g>
    <g transform="rotate(18 -20 -30)"><rect x="-52" y="-66" width="58" height="72" rx="8" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4"/><path d="M -52 -46 h 58 M -52 -20 h 58" stroke="${G2.metalDark}" stroke-width="4"/></g>
    <g transform="rotate(74 116 -34)"><path d="M 90 0 v -62 q 0 -14 8 -20 v -14 h 30 v 14 q 8 6 8 20 v 62 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/><rect x="94" y="-30" width="30" height="20" rx="4" fill="#a8cddd"/></g>
  </g>`;
}

// A recycling bin. `kind` picks the lid colour and the mark on the front.
function recycleBin(x, y, s = 1, kind = "paper") {
  const colours = { paper: G2.brickCool, tins: G2.awningGold, glass: G2.brickMint };
  const colour = colours[kind] || G2.brickCool;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -56 0 l 8 -128 h 96 l 8 128 z" fill="${colour}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -66 -128 h 132 q 8 0 8 -14 h -148 q 0 14 8 14 z" fill="${C.ink}" opacity="0.75"/>
    <path d="M -66 -142 h 148" stroke="${C.ink}" stroke-width="4"/>
    <g transform="translate(0 -62) scale(0.9)" fill="${G2.paper}">
      ${[0, 120, 240].map((a) => `<g transform="rotate(${a})"><path d="M -6 -34 L 12 -34 L 22 -18 L 8 -10 L -2 -26 Z"/><path d="M 12 -36 L 26 -30 L 16 -14 Z"/></g>`).join("")}
    </g>
  </g>`;
}

// A young tree, just planted, staked and watered.
function sapling(x, y, s = 1, { staked = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${staked ? `<rect x="42" y="-190" width="12" height="190" rx="5" fill="#b08758" stroke="${C.ink}" stroke-width="3"/><path d="M 4 -140 h 46" stroke="#c9b699" stroke-width="6"/>` : ""}
    <path d="M -6 0 q -6 -120 4 -176 M 0 -104 q -26 -22 -50 -32 M 2 -132 q 28 -20 54 -28" stroke="${C.acaciaTrunk}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <g class="anim-canopy" style="${delayAt(x, y, 4)}">
      <ellipse cx="-58" cy="-186" rx="82" ry="34" fill="${C.acaciaLeafDark}"/>
      <ellipse cx="26" cy="-212" rx="104" ry="40" fill="${C.acaciaLeaf}"/>
      <ellipse cx="104" cy="-180" rx="62" ry="26" fill="${C.acaciaLeafDark}"/>
    </g>
    <ellipse cx="0" cy="4" rx="54" ry="16" fill="${G2.soil}" stroke="${G2.soilDark}" stroke-width="3.4"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 8: homes

// A small house with a pitched roof and a chimney.
function house(x, y, s = 1, { lit = false, wall = "#f0e4d2", roof = "#b06a4a" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-140" y="-190" width="280" height="190" rx="6" fill="${wall}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -168 -190 L 0 -300 L 168 -190 Z" fill="${roof}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="76" y="-296" width="34" height="60" rx="5" fill="#8a5238" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-42" y="-116" width="84" height="116" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="26" cy="-56" r="5" fill="${G2.awningGold}"/>
    <rect x="-116" y="-160" width="60" height="56" rx="5" fill="${lit ? "#f4c95d" : G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="58" y="-160" width="60" height="56" rx="5" fill="${lit ? "#f4c95d" : G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -86 -160 v 56 M -116 -132 h 60 M 88 -160 v 56 M 58 -132 h 60" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
}

// A block of flats: four storeys, four windows each.
function flatBlock(x, y, s = 1, { lit = false } = {}) {
  let windows = "";
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const on = lit && (row + col) % 2 === 0;
      windows += `<rect x="${-96 + col * 72}" y="${-330 + row * 78}" width="52" height="52" rx="5" fill="${on ? "#f4c95d" : G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`;
      windows += `<path d="M ${-96 + col * 72} ${-292 + row * 78} h 52" stroke="${C.ink}" stroke-width="2.6" opacity="0.7"/>`;
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-130" y="-370" width="260" height="370" rx="8" fill="${G2.brickCool}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-142" y="-392" width="284" height="26" rx="6" fill="#7a90ae" stroke="${C.ink}" stroke-width="4"/>
    ${windows}
    <rect x="-34" y="-84" width="68" height="84" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="20" cy="-42" r="5" fill="${G2.awningGold}"/>
  </g>`;
}

// A round hut with a thatched roof.
function hut(x, y, s = 1) {
  let thatch = "";
  for (let i = -6; i <= 6; i += 1) thatch += `<path d="M ${i * 22} -132 L ${i * 30} -238" stroke="#c39c48" stroke-width="5" opacity="0.8"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -120 0 v -132 q 120 -22 240 0 V 0 z" fill="#c9a06c" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -160 -132 L 0 -250 L 160 -132 Z" fill="#e9c86a" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    ${thatch}
    <path d="M -40 0 q 0 -90 40 -90 q 40 0 40 90 z" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="70" cy="-84" r="24" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// A tree house up in the baobab, with a rope ladder down.
function treeHouse(x, y, s = 1) {
  let rungs = "";
  for (let i = 0; i < 9; i += 1) rungs += `<path d="M -104 ${-24 - i * 34} h 32" stroke="#c9a06c" stroke-width="7" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -52 0 q -12 -180 4 -318 q 44 -12 88 0 q 18 138 6 318 z" fill="#9c7550" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -30 -180 q -46 -30 -74 -84 M 26 -210 q 44 -34 70 -78" stroke="#8a6242" stroke-width="16" fill="none" stroke-linecap="round"/>
    <g class="anim-canopy" style="${delayAt(x, y, 5)}">
      <ellipse cx="-96" cy="-470" rx="94" ry="34" fill="${C.acaciaLeafDark}"/>
      <ellipse cx="46" cy="-500" rx="122" ry="42" fill="${C.acaciaLeaf}"/>
      <ellipse cx="150" cy="-462" rx="76" ry="28" fill="${C.acaciaLeafDark}"/>
    </g>
    <rect x="-130" y="-330" width="260" height="24" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-108" y="-436" width="216" height="106" rx="6" fill="#c9a06c" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -128 -436 L 0 -510 L 128 -436 Z" fill="#b06a4a" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-70" y="-406" width="56" height="56" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="18" y="-406" width="60" height="76" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -104 -306 v -20 M -72 -306 v -20" stroke="#c9b699" stroke-width="5"/>
    <path d="M -104 -306 v 306 M -72 -306 v 306" stroke="#c9b699" stroke-width="5"/>
    ${rungs}
  </g>`;
}

// A beehive hanging from a branch.
function beehive(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -110 v -40" stroke="${C.acaciaTrunk}" stroke-width="7"/>
    <g class="anim-idle" style="animation-duration:3.6s">
      <path d="M -46 -110 q 46 -24 92 0 z" fill="#e9c86a" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -60 -84 q 60 -26 120 0 q -60 22 -120 0 z" fill="#f0d888" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -66 -56 q 66 -26 132 0 q -66 24 -132 0 z" fill="#e9c86a" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -58 -28 q 58 -26 116 0 q -58 30 -116 0 z" fill="#f0d888" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -40 0 q 40 -22 80 0 q -40 20 -80 0 z" fill="#e9c86a" stroke="${C.ink}" stroke-width="4"/>
      <ellipse cx="0" cy="-40" rx="17" ry="14" fill="${C.ink}" opacity="0.7"/>
    </g>
  </g>`;
}

// A burrow: Zuri's front door, a neat hole in a grassy bank.
function burrow(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -190 0 q 20 -110 190 -110 q 170 0 190 110 z" fill="${C.grassNear}" stroke="${C.grassDark}" stroke-width="5"/>
    <path d="M -56 0 q 0 -84 56 -84 q 56 0 56 84 z" fill="${G2.soilDark}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -34 0 q 0 -60 34 -60 q 34 0 34 60 z" fill="#3b2c1e"/>
    <path d="M -150 -22 q 20 -30 40 -34 M 116 -30 q 22 -26 44 -28" stroke="${C.grassDark}" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g>`;
}

// A cutaway room. `kind` chooses which room's furniture is drawn.
function roomBox(x, y, s = 1, kind = "kitchen", { label = "" } = {}) {
  const floor = -52;
  // A cutaway room, drawn as the doll's-house cross-section a 7-year-old reads
  // straight away: thick outer walls, a floor with boards, and a skirting where
  // they meet. The first version was a thin-outlined pale rectangle and every
  // room page read as a framed picture hung on the wall behind the characters.
  const frame = `<rect x="-212" y="-272" width="424" height="272" rx="12" fill="#8a6242"/>
    <rect x="-200" y="-260" width="400" height="260" rx="6" fill="#f3ecdd"/>
    <rect x="-200" y="-52" width="400" height="52" fill="#c9a06c"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M ${-180 + i * 60} -52 L ${-200 + i * 60} 0" stroke="#b08758" stroke-width="4"/>`).join("")}
    <rect x="-200" y="-58" width="400" height="10" fill="#b08758"/>
    <rect x="-212" y="-272" width="424" height="272" rx="12" fill="none" stroke="${C.ink}" stroke-width="7"/>`;
  const win = `<rect x="86" y="-216" width="94" height="84" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 133 -216 v 84 M 86 -174 h 94" stroke="${C.ink}" stroke-width="3.4"/>`;
  const bits = {
    kitchen: `<rect x="-176" y="-146" width="200" height="94" rx="6" fill="#b08758" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M -150 -146 h 148" stroke="#8a6242" stroke-width="5"/>
      <path d="M -130 -166 q 40 24 80 0 q 0 20 -40 20 q -40 0 -40 -20 z" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M -90 -190 q 6 -24 -6 -34" stroke="${G2.metalDark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="-60" y="-118" width="34" height="46" rx="4" fill="#8a6242"/><rect x="-14" y="-118" width="34" height="46" rx="4" fill="#8a6242"/>`,
    dining: `<rect x="-110" y="-124" width="220" height="16" rx="6" fill="#b08758" stroke="${C.ink}" stroke-width="4"/>
      <rect x="-96" y="-108" width="14" height="82" fill="#8a6242"/><rect x="82" y="-108" width="14" height="82" fill="#8a6242"/>
      ${[-150, 130].map((cx2) => `<g transform="translate(${cx2} -26)"><rect x="-26" y="-64" width="52" height="12" rx="5" fill="#a3542f" stroke="${C.ink}" stroke-width="3.4"/><rect x="-26" y="-130" width="12" height="70" rx="5" fill="#a3542f" stroke="${C.ink}" stroke-width="3.4"/><rect x="-22" y="-52" width="10" height="52" fill="#8a5238"/><rect x="12" y="-52" width="10" height="52" fill="#8a5238"/></g>`).join("")}
      <circle cx="-40" cy="-134" r="18" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3"/><circle cx="30" cy="-134" r="18" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3"/>`,
    living: `<path d="M -170 -26 v -74 q 0 -26 30 -26 h 150 q 30 0 30 26 v 74 z" fill="#8fa8c9" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M -140 -26 v -60 q 0 -14 20 -14 h 110 q 20 0 20 14 v 60" fill="#a4b9d4" stroke="${C.ink}" stroke-width="3.6"/>
      <rect x="-116" y="-96" width="60" height="44" rx="8" fill="#dfe9f2" stroke="${C.ink}" stroke-width="3"/>
      <rect x="-40" y="-96" width="60" height="44" rx="8" fill="#dfe9f2" stroke="${C.ink}" stroke-width="3"/>
      <ellipse cx="60" cy="-14" rx="120" ry="20" fill="${G2.awningRed}" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M -30 -14 h 170" stroke="#c9563d" stroke-width="5"/>`,
    bedroom: `<rect x="-170" y="-116" width="240" height="90" rx="8" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.5"/>
      <rect x="-170" y="-96" width="240" height="34" rx="8" fill="#dfe9f2" stroke="${C.ink}" stroke-width="3.6"/>
      <rect x="-158" y="-128" width="76" height="40" rx="10" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.6"/>
      <rect x="-186" y="-150" width="16" height="124" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="3.4"/>`,
    bathroom: `<path d="M -150 -26 v -70 q 0 -20 26 -20 h 150 q 26 0 26 20 v 70 z" fill="#dfe9f2" stroke="${C.ink}" stroke-width="4.5"/>
      <ellipse cx="0" cy="-96" rx="150" ry="20" fill="${C.waterLight}" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M -130 -134 q 4 -30 30 -30 h 20" stroke="${G2.metal}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="-96" y="-206" width="60" height="46" rx="6" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.4"/>`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${frame}${win}${bits[kind] || ""}
    ${label ? `<text x="0" y="-274" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${C.ink}">${label}</text>` : ""}
  </g>`;
}

// Four homes from around the world, drawn small and side by side.
function worldHome(x, y, s = 1, kind = "adobe") {
  const shapes = {
    adobe: `<rect x="-84" y="-124" width="168" height="124" rx="8" fill="#d9a86a" stroke="${C.ink}" stroke-width="4.5"/>
      <rect x="-96" y="-148" width="192" height="26" rx="6" fill="#c9955a" stroke="${C.ink}" stroke-width="4"/>
      ${[-60, -20, 20, 60].map((bx) => `<rect x="${bx}" y="-104" width="12" height="12" rx="3" fill="#8a6242"/>`).join("")}
      <rect x="-24" y="-72" width="48" height="72" rx="4" fill="#7d4a32" stroke="${C.ink}" stroke-width="4"/>`,
    stilt: `<path d="M -70 0 v -150 M -22 0 v -150 M 26 0 v -150 M 74 0 v -150" stroke="#a3542f" stroke-width="12" stroke-linecap="round"/>
      <rect x="-96" y="-232" width="192" height="86" rx="6" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M -114 -232 L 0 -294 L 114 -232 Z" fill="#e9c86a" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
      <rect x="-20" y="-206" width="44" height="60" rx="4" fill="#7d4a32" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -150 -6 q 150 26 300 0" stroke="${C.waterLight}" stroke-width="8" fill="none"/>`,
    cave: `<path d="M -150 0 q 10 -186 150 -186 q 140 0 150 186 z" fill="#b9b0a6" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -110 -30 q 20 -40 46 -50 M 70 -46 q 24 -34 50 -40" stroke="#a39a8f" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M -40 0 q 0 -92 40 -92 q 40 0 40 92 z" fill="#5f5148" stroke="${C.ink}" stroke-width="4.5"/>
      <circle cx="0" cy="-46" r="16" fill="${G2.awningGold}" opacity="0.85"/>`,
    skyscraper: `<rect x="-72" y="-360" width="144" height="360" rx="6" fill="#8fa8c9" stroke="${C.ink}" stroke-width="5"/>
      ${[0, 1, 2, 3, 4, 5].map((r) => [0, 1].map((c) => `<rect x="${-48 + c * 52}" y="${-334 + r * 56}" width="40" height="38" rx="4" fill="${(r + c) % 2 ? "#f4c95d" : G2.glass}" stroke="${C.ink}" stroke-width="3"/>`).join("")).join("")}
      <rect x="-16" y="-400" width="32" height="42" rx="5" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${shapes[kind] || shapes.adobe}</g>`;
}

// ---------------------------------------------------------------- Unit 9: the city

function libraryBuilding(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-200" y="-250" width="400" height="250" rx="6" fill="#e6d7bd" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -230 -250 h 460 l -26 -46 h -408 z" fill="#c98f6a" stroke="${C.ink}" stroke-width="4.5"/>
    ${[-150, -50, 50, 150].map((cx2) => `<rect x="${cx2 - 20}" y="-250" width="40" height="250" rx="8" fill="#f0e4d2" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    <rect x="-56" y="-140" width="112" height="140" rx="5" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -140 v 140" stroke="#5f3826" stroke-width="4"/>
    <rect x="-150" y="-336" width="300" height="46" rx="8" fill="${G2.board}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -122 -312 h 60 M -48 -312 h 40 M 6 -312 h 52 M 72 -312 h 46" stroke="${G2.paper}" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(0 -300) scale(0.5)">${openBook(0, 0, 1)}</g>
  </g>`;
}

function shoppingCentre(x, y, s = 1, { lit = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-260" y="-300" width="520" height="300" rx="10" fill="${G2.brickPlum}" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${-224 + c * 94}" y="${-268 + r * 84}" width="70" height="58" rx="5" fill="${lit ? "#f4c95d" : G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`).join("")).join("")}
    <rect x="-90" y="-96" width="180" height="96" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -96 v 96" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-140" y="-350" width="280" height="46" rx="10" fill="${G2.awningTeal}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -110 -326 h 220" stroke="${G2.paper}" stroke-width="7" stroke-linecap="round"/>
  </g>`;
}

function ferrisWheel(x, y, s = 1, { lit = false } = {}) {
  const cabins = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const cx2 = Math.cos(a) * 250;
    const cy2 = Math.sin(a) * 250;
    cabins.push(`<path d="M ${cx2.toFixed(1)} ${cy2.toFixed(1)} l 0 26" stroke="${G2.metalDark}" stroke-width="4"/>`);
    cabins.push(`<rect x="${(cx2 - 22).toFixed(1)}" y="${(cy2 + 26).toFixed(1)}" width="44" height="34" rx="8" fill="${C.rainbow[i % C.rainbow.length]}" stroke="${C.ink}" stroke-width="3.6"/>`);
  }
  const spokes = [];
  for (let i = 0; i < 10; i += 1) spokes.push(`<path d="M 0 0 L ${(Math.cos((i / 10) * Math.PI * 2) * 250).toFixed(1)} ${(Math.sin((i / 10) * Math.PI * 2) * 250).toFixed(1)}" stroke="${G2.metal}" stroke-width="6"/>`);
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -150 300 L 0 0 L 150 300" stroke="${G2.metalDark}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M -110 220 h 220" stroke="${G2.metalDark}" stroke-width="10"/>
    <g class="anim-canopy" style="animation-duration:9s; transform-origin:0 0">
      <circle cx="0" cy="0" r="250" fill="none" stroke="${G2.metal}" stroke-width="10"/>
      <circle cx="0" cy="0" r="200" fill="none" stroke="${G2.metal}" stroke-width="5" opacity="0.7"/>
      ${spokes.join("")}
      ${cabins.join("")}
      <circle cx="0" cy="0" r="26" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="4"/>
    </g>
    ${lit ? `<circle class="anim-glow" cx="0" cy="0" r="286" fill="${C.sunGlow}" opacity="0.28"/>` : ""}
  </g>`;
}

// An underground train arriving at a tiled platform.
function undergroundTrain(x, y, s = 1) {
  const win = (wx) => `<rect x="${wx}" y="-118" width="58" height="52" rx="7" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -300 -20 v -140 q 0 -50 60 -50 h 460 q 40 0 40 40 v 150 z" fill="${G2.awningRed}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -300 -60 h 560" stroke="#a53a30" stroke-width="10"/>
    ${win(-276)}${win(-190)}${win(-104)}${win(-18)}${win(68)}${win(154)}
    <path d="M -252 -186 q 24 -18 52 0" stroke="${G2.metalDark}" stroke-width="6" fill="none"/>
    <g class="anim-glow"><circle cx="252" cy="-96" r="24" fill="${G2.awningGold}" opacity="0.8"/></g>
    <circle cx="252" cy="-96" r="14" fill="#fff3cd" stroke="${C.ink}" stroke-width="3.4"/>
    <path class="anim-flow" d="M -320 -14 h 620" stroke="${G2.metal}" stroke-width="8" stroke-linecap="round"/>
    <path d="M -340 6 h 660" stroke="${G2.metalDark}" stroke-width="10" stroke-linecap="round"/>
  </g>`;
}

function ferryBoat(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="anim-idle" style="animation-duration:3.4s">
    <path d="M -220 0 q 220 46 440 0 l -40 66 q -180 26 -360 0 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-170" y="-92" width="330" height="92" rx="8" fill="#e6d7bd" stroke="${C.ink}" stroke-width="4.5"/>
    ${[-140, -76, -12, 52, 116].map((wx) => `<rect x="${wx}" y="-70" width="44" height="40" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>`).join("")}
    <rect x="-70" y="-166" width="150" height="74" rx="8" fill="${G2.paper}" stroke="${C.ink}" stroke-width="4.5"/>
    <rect x="-46" y="-148" width="102" height="42" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="106" y="-206" width="34" height="114" rx="8" fill="${G2.awningRed}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 106 -178 h 34" stroke="${G2.paper}" stroke-width="8"/>
    <path d="M -240 60 q 60 -22 120 0 q 60 22 120 0 q 60 -22 120 0 q 60 22 120 0" stroke="${C.waterLight}" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g></g>`;
}

function helicopterProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="anim-float" style="animation-duration:2.8s">
    <path d="M -30 0 q -6 -46 56 -46 q 62 0 74 30 q 40 8 44 16 q -8 24 -60 26 q -60 2 -114 -26 z" fill="${G2.awningTeal}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 66 -30 q 26 4 34 14 q -22 8 -44 6 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M -30 -8 q -78 -6 -110 4 l 4 20 q 66 6 108 0 z" fill="${G2.awningTeal}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -132 -18 v 44" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M 30 -46 v -22" stroke="${G2.metalDark}" stroke-width="6"/>
    <path class="anim-flow" d="M -70 -70 h 200" stroke="${G2.metalDark}" stroke-width="7" stroke-linecap="round"/>
    <path d="M -12 24 h 84 M -6 24 v 18 M 62 24 v 18 M -34 42 h 130" stroke="${G2.metalDark}" stroke-width="5" stroke-linecap="round"/>
  </g></g>`;
}

// A folded street map with a route drawn on it.
function mapProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-idle" style="animation-duration:3s">
    <path d="M -130 -84 l 86 -14 l 88 14 l 86 -14 v 168 l -86 14 l -88 -14 l -86 14 z" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -44 -98 v 168 M 44 -84 v 168" stroke="${G2.paperEdge}" stroke-width="3"/>
    <path d="M -110 44 h 60 v -64 h 74 v -46 h 66" stroke="${G2.awningRed}" stroke-width="5" fill="none" stroke-dasharray="12 9" stroke-linecap="round"/>
    <path d="M -100 -30 h 46 M 60 20 h 50" stroke="${G2.deepWater}" stroke-width="5" opacity="0.6"/>
    <circle cx="106" cy="-66" r="9" fill="${G2.awningRed}"/>
  </g></g>`;
}

// A row of small cars with a bit of traffic haze.
function trafficRow(x, y, s = 1) {
  const car = (cx2, colour) => `<g transform="translate(${cx2} 0)">
    <path d="M -60 0 v -26 q 0 -14 16 -18 l 14 -22 q 4 -8 16 -8 h 34 q 12 0 16 8 l 14 22 q 16 4 16 18 v 26 z" fill="${colour}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -22 -46 h 54 l -8 -18 h -38 z" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="-34" cy="0" r="16" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="42" cy="0" r="16" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="3.4"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${car(-260, G2.awningRed)}${car(-40, G2.brickCool)}${car(190, G2.awningGold)}
  </g>`;
}

// The aquarium tank: thick glass, blue water, a sandy floor and rising bubbles.
function aquariumTank(x, y, s = 1, { inner = "" } = {}) {
  let bubbles = "";
  for (let i = 0; i < 9; i += 1) {
    bubbles += `<circle class="anim-drip" style="animation-delay:${((i % 5) / 5).toFixed(2)}s; animation-direction:reverse" cx="${-320 + i * 82}" cy="${-40 - (i % 4) * 40}" r="${6 + (i % 3) * 3}" fill="${G2.glass}" opacity="0.6"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-400" y="-420" width="800" height="420" rx="14" fill="${G2.deepWater}" stroke="${G2.metalDark}" stroke-width="14"/>
    <rect x="-380" y="-400" width="760" height="380" rx="8" fill="${G2.deepWaterDark}"/>
    <path d="M -380 -400 q 380 60 760 0 v 120 q -380 -60 -760 0 z" fill="${G2.deepWater}" opacity="0.5"/>
    <path d="M -380 -30 q 380 -46 760 0 v 10 h -760 z" fill="#e6d7bd"/>
    ${[-300, -140, 60, 240].map((px) => `<g class="anim-grass" style="${delayAt(px, 0, 3)}"><path d="M ${px} -30 q -14 -60 -4 -96 M ${px + 22} -30 q 10 -70 26 -100" stroke="#4d9d94" stroke-width="10" fill="none" stroke-linecap="round"/></g>`).join("")}
    ${bubbles}
    ${inner}
    <path d="M -370 -394 q 40 -14 90 -10" stroke="${G2.paper}" stroke-width="10" fill="none" opacity="0.35" stroke-linecap="round"/>
  </g>`;
}

function octopus(x, y, s = 1) {
  // Arms as thick round strokes fanning DOWNWARD from the body. The first
  // version rotated a filled path through a full circle, which threw half the
  // arms up behind the head and left a pink blob that read as a large fish.
  const arm = (i) => {
    const spread = -70 + i * 20;
    const reach = 96 + (i % 3) * 22;
    const curl = i % 2 ? 1 : -1;
    return `<path d="M 0 0 q ${spread * 0.5} ${reach * 0.55} ${spread} ${reach} q ${18 * curl} ${reach * 0.28} ${34 * curl} ${-reach * 0.1}" stroke="#b3568f" stroke-width="17" fill="none" stroke-linecap="round"/>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="fish"><g class="anim-float" style="animation-duration:3.2s">
    <g transform="translate(0 26)">${[0, 1, 2, 3, 4, 5, 6, 7].map(arm).join("")}</g>
    <path d="M -68 16 q -8 -92 68 -92 q 76 0 68 92 q -68 24 -136 0 z" fill="#c96aa5" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="-24" cy="-34" r="15" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3"/><circle cx="-21" cy="-31" r="6" fill="${C.ink}"/>
    <circle cx="26" cy="-36" r="15" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3"/><circle cx="29" cy="-33" r="6" fill="${C.ink}"/>
    <path d="M -6 -8 q 12 10 24 0" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="-40" cy="-58" rx="16" ry="10" fill="#d98cba" opacity="0.7" transform="rotate(-24 -40 -58)"/>
  </g></g></g>`;
}

function penguin(x, y, s = 1, { flip = false, diving = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${diving ? 38 : 0})"><g class="tap-target" data-tap="chick"><g class="anim-idle" style="animation-duration:2.4s">
    ${diving ? "" : `<path d="M -18 62 l -16 14 h 34 z M 18 62 l 16 14 h -34 z" fill="${C.ostrichBeak}" stroke="${C.ink}" stroke-width="3"/>`}
    <path d="M -44 62 q -14 -110 44 -110 q 58 0 44 110 q -44 16 -88 0 z" fill="#2f3a4a" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -26 58 q -10 -84 26 -84 q 36 0 26 84 q -26 12 -52 0 z" fill="${G2.paper}"/>
    <path d="M -44 -14 q -26 22 -22 56 q 16 -4 26 -34 z" fill="#232c39" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="0" cy="-58" r="30" fill="#2f3a4a" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -18 -50 q 18 22 36 0 q -6 -22 -18 -22 q -12 0 -18 22 z" fill="${G2.paper}"/>
    <path d="M 26 -54 l 24 8 l -24 10 z" fill="${C.ostrichBeak}" stroke="${C.ink}" stroke-width="3"/>
    <g transform="translate(6 -62)">${face("happy", 0.6)}</g>
  </g></g></g>`;
}

function seaTurtle(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="tap-target" data-tap="fish"><g class="anim-float" style="animation-duration:4s">
    <path d="M -70 10 q -46 -6 -66 22 q 34 20 68 2 z" fill="#7fa06a" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 30 22 q 30 22 20 44 q -34 0 -42 -34 z" fill="#7fa06a" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -96 -6 q -22 -10 -30 -4 q 8 14 30 14 z" fill="#7fa06a" stroke="${C.ink}" stroke-width="3"/>
    <path d="M -86 -4 q 0 -66 88 -66 q 88 0 88 66 q -88 34 -176 0 z" fill="#6f8f5c" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -40 -60 q 6 44 4 52 M 42 -60 q -6 44 -4 52 M -80 -22 h 168" stroke="#54703f" stroke-width="5" fill="none"/>
    <circle cx="104" cy="-14" r="24" fill="#8fa87a" stroke="${C.ink}" stroke-width="3.6"/>
    <g transform="translate(110 -20)">${face("happy", 0.55)}</g>
    <path d="M 118 -6 q 10 6 16 0" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g></g></g>`;
}

function shark(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="tap-target" data-tap="fish"><g class="anim-idle" style="animation-duration:3.6s">
    <path d="M -150 0 l -56 -44 l 10 44 l -10 44 z" fill="#7d8b9c" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -150 0 q 30 -62 150 -62 q 120 0 160 62 q -40 62 -160 62 q -120 0 -150 -62 z" fill="#8f9daf" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -140 26 q 130 26 290 8" stroke="#e2e8ee" stroke-width="0" fill="none"/>
    <path d="M -134 20 q 120 40 286 4 q -60 42 -160 42 q -100 0 -126 -46 z" fill="#e2e8ee"/>
    <path d="M 10 -60 l 22 -60 l 42 66 z" fill="#7d8b9c" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 20 52 l 6 42 l 44 -34 z" fill="#7d8b9c" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M 210 24 q 60 8 96 -4 q -32 26 -92 24" fill="${G2.paper}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 226 22 l 10 14 M 250 22 l 8 14 M 274 18 l 8 14" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="222" cy="-16" r="8" fill="${C.ink}"/><circle cx="225" cy="-19" r="3" fill="${G2.paper}"/>
    <path d="M 104 -30 q 4 26 2 34 M 132 -22 q 2 22 0 30" stroke="#7d8b9c" stroke-width="5" fill="none"/>
  </g></g></g>`;
}

// ---------------------------------------------------------------- shared extras

// A speech-free "look at this" pointer: a dashed line from a character to a thing.
function lookLine(x1, y1, x2, y2) {
  return `<path d="M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 90} ${x2} ${y2}" stroke="${C.ink}" stroke-width="4" stroke-dasharray="14 12" fill="none" opacity="0.4" stroke-linecap="round"/>`;
}

// Bunting for the party and exhibition pages, drawn low so it frames the top.
function bunting(x, y, s = 1, { span = 700 } = {}) {
  let flags = "";
  for (let i = 0; i < 12; i += 1) {
    const t = (i + 0.5) / 12;
    const fx = -span / 2 + span * t;
    const fy = (1 - t) * (1 - t) * -20 + 2 * (1 - t) * t * 70 + t * t * -20;
    flags += `<path d="M ${fx.toFixed(0)} ${fy.toFixed(0)} l 30 6 l -14 42 z" fill="${C.rainbow[i % C.rainbow.length]}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M ${-span / 2} -20 q ${span / 2} 90 ${span} 0" stroke="#5c7d43" stroke-width="6" fill="none"/>
    ${flags}
  </g>`;
}

// An easel holding one of the pupils' pages, for the capstone exhibition.
function easel(x, y, s = 1, { inner = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -70 0 l 40 -196 M 70 0 l -40 -196 M -46 -100 h 92" stroke="#b08758" stroke-width="10" stroke-linecap="round"/>
    <rect x="-92" y="-250" width="184" height="150" rx="6" fill="${G2.paper}" stroke="${C.ink}" stroke-width="4.5"/>
    <g transform="translate(0 -175)">${inner}</g>
  </g>`;
}

module.exports = {
  ...kit,
  G2, zuri,
  daylightScene, streetScene, gardenScene, roomScene, sunsetScene, aquariumRoom,
  calendarBoard, colourChart, bookShelf, openBook, tabletProp, greetingCard,
  shopRow, townBus, fireEngine, ladder, cleaningKit, fireKit, crossing, clinicFront, doctorKit, notepad,
  motionArcs, fruitBowl, waterBottle, sleepyZs,
  castShadow, cloudPuff, lowSun,
  rulerProp, metreStick, shapeTile, patternStrip, balanceScale, feather, tensLine,
  butterflyBug, beeBug, antBug, anthill, spiderWeb, spiderBug, wormBug, cricketBug, fallenLog, flatStone, gardenPlant,
  seedProp, dugHole, plantStage, plantParts, wateringCan, litterBits, recycleBin, sapling,
  house, flatBlock, hut, treeHouse, beehive, burrow, roomBox, worldHome,
  libraryBuilding, shoppingCentre, ferrisWheel, undergroundTrain, ferryBoat, helicopterProp, mapProp, trafficRow,
  aquariumTank, octopus, penguin, seaTurtle, shark,
  lookLine, bunting, easel,
};
