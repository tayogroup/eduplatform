// Grade 4 additions to the shared picture-book kit.
//
// Grade 4 keeps the Grade 3 cast — Amal, Nora, Teacher Yasmin, Omar, Sami, Noah
// and the family all continue through the Grade 4 readings, a year older — and
// adds MAYA, the young reporter of Unit 4 (17 mentions). So this file adds two
// presets and the props Grade 4's units call for, and takes everything else from
// tools/lib/ehel-ebook-kit-grade3.js unchanged.
//
// The Grade 4 setting is named in the readings: an East African coastal town,
// with Mombasa and the capital reachable by train. Omar runs the market shop and
// the town post counter stands beside his till.
//
// Same additive rule as Grades 2 and 3: nothing already shipped is modified, so
// no earlier book's art can move. Motion reuses the existing animation classes
// only — a new @keyframes in STYLE would rewrite every SVG of every book.

const kit3 = require("./ehel-ebook-kit-grade3.js");

const { C, W, H, delayAt, G2, G3, person, CAST, sky, sun, hills, ground, acacia } = kit3;

// ---------------------------------------------------------------- cast additions

// Maya reports for the town paper: a notebook always in hand, and a bright
// press-red jacket so she is findable in a crowd scene.
// Sami is in the Grade 3 readings too but only got a stand-in there; Grade 4
// gives him nine mentions in the Emotions unit, so he gets his own preset.
const CAST4 = {
  ...CAST,
  maya: { skin: G3.skinWarm, hair: G3.hair, style: "bun", top: G3.cream, bottom: "#3d4a5c", legs: "trousers", coat: G3.coralDark },
  sami: { skin: G3.skinDeep, hair: G3.hair, style: "crop", top: "#4d9d94", bottom: "#6b5a44", legs: "trousers" },
  salma: { adult: true, skin: G3.skinWarm, style: "bun", top: G3.cream, bottom: "#8a7f6a", legs: "long", scarf: { colour: "#d8c9a8", shade: "#b8a888" }, glasses: true },
};

function figure4(who, options = {}) {
  const preset = CAST4[who];
  if (!preset) throw new Error(`Unknown Grade 4 character "${who}". Known: ${Object.keys(CAST4).join(", ")}`);
  return person({ ...preset, ...options, name: who });
}

// ---------------------------------------------------------------- scenes

// Omar's market shop with the town post counter beside the till.
function postCounterScene() {
  return `<rect width="${W}" height="${H}" fill="#e8dcc2"/>
    <rect x="0" y="0" width="${W}" height="20" fill="#d3c3a4"/>
    <rect x="0" y="672" width="${W}" height="${H - 672}" fill="#b9865e"/>
    <rect x="0" y="654" width="${W}" height="30" fill="#9c6f4c"/>
    ${[0, 240, 480, 720, 960, 1200, 1440].map((fx) => `<path d="M ${fx} 684 L ${fx - 110} 1000" stroke="#a2764f" stroke-width="5" opacity="0.45"/>`).join("")}
    <g transform="translate(300 400)">
      ${[0, 1, 2].map((r) => `<rect x="-230" y="${-150 + r * 96}" width="460" height="18" rx="6" fill="#8a6242"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-210 + i * 74}" y="${-206 + r * 96}" width="52" height="56" rx="5" fill="${C.rainbow[(i + r) % C.rainbow.length]}" stroke="${C.ink}" stroke-width="3"/>`).join("")}`).join("")}
    </g>
    <g transform="translate(1250 360)">
      <rect x="-190" y="-160" width="380" height="70" rx="10" fill="${G3.teal}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -150 -125 h 300" stroke="${G3.cream}" stroke-width="9" stroke-linecap="round"/>
      <rect x="-160" y="-70" width="320" height="230" rx="8" fill="#d8cbb4" stroke="${C.ink}" stroke-width="4.5"/>
      ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${-134 + c * 100}" y="${-44 + r * 104}" width="82" height="86" rx="5" fill="#c2b295" stroke="${C.ink}" stroke-width="3.4"/><circle cx="${-93 + c * 100}" cy="${-1 + r * 104}" r="7" fill="#8a6242"/>`).join("")).join("")}
    </g>`;
}

// The counter itself, with parcels and a set of scales.
function counter(x, y, s = 1, { parcels = 3 } = {}) {
  let stack = "";
  for (let i = 0; i < parcels; i += 1) {
    stack += `<g transform="translate(${-120 + i * 92} ${-212 - (i % 2) * 8})">
      <rect x="-36" y="-40" width="72" height="42" rx="5" fill="#c9a06c" stroke="${C.ink}" stroke-width="3.6"/>
      <path d="M 0 -40 v 42 M -36 -20 h 72" stroke="#8a6242" stroke-width="4"/>
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-256" y="-210" width="512" height="34" rx="9" fill="#a8845a" stroke="${C.ink}" stroke-width="4.5"/>
    <rect x="-238" y="-176" width="476" height="176" rx="7" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -170 -120 h 340 M -170 -58 h 340" stroke="#a8845a" stroke-width="5"/>
    ${stack}
    <g transform="translate(180 -216)">
      <path d="M -34 0 h 68 l -8 -20 h -52 z" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>
      <rect x="-5" y="-52" width="10" height="34" fill="${G2.metalDark}"/>
      <path d="M -40 -52 q 40 22 80 0 z" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3.4"/>
    </g>
  </g>`;
}

// A letter or a postcard, held or lying on the counter.
function letterProp(x, y, s = 1, { open = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-46" y="-32" width="92" height="64" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.6"/>
    ${open
      ? `<path d="M -34 -14 h 68 M -34 0 h 68 M -34 14 h 44" stroke="#9fb4c6" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M -46 -32 L 0 6 L 46 -32" fill="none" stroke="${C.ink}" stroke-width="3.4"/>
         <rect x="22" y="-26" width="20" height="16" rx="2" fill="${G3.coral}" stroke="${C.ink}" stroke-width="2.6"/>`}
  </g>`;
}

// A science-fair tent, open at the front. `stormy` darkens it and whips the flap.
function scienceTent(x, y, s = 1, { stormy = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -300 0 L 0 -300 L 300 0 Z" fill="${stormy ? "#8fa0ae" : "#e2ecef"}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -300 0 L 0 -300 L 300 0 Z" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <g class="${stormy ? "anim-strain" : ""}">
      <path d="M -104 0 L 0 -230 L 104 0 Z" fill="${stormy ? "#4d5b66" : "#7d8b94"}" stroke="${C.ink}" stroke-width="5"/>
    </g>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${-260 + i * 150} 0 L ${-190 + i * 150} -140" stroke="${stormy ? "#7d8b94" : "#c9d4d9"}" stroke-width="5" opacity="0.85"/>`).join("")}
    <path d="M -318 0 h 636" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
    <path d="M 0 -300 v -46" stroke="${G2.metalDark}" stroke-width="6"/>
    <path d="M 4 -346 q 60 14 0 30 z" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4" class="${stormy ? "anim-strain" : ""}"/>
  </g>`;
}

// Storm sky: dark gradient, rain, and a fork of lightning.
function stormScene({ lightning = true } = {}) {
  let drops = "";
  for (let i = 0; i < 70; i += 1) {
    const rx = (i * 137) % W;
    const ry = 20 + ((i * 211) % 620);
    drops += `<line class="anim-rain" style="animation-delay:${((i % 13) / 13 * 1.15).toFixed(2)}s" x1="${rx}" y1="${ry}" x2="${rx - 14}" y2="${ry + 40}" stroke="#8fa4b6" stroke-width="5" stroke-linecap="round" opacity="0.75"/>`;
  }
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f4a5c"/><stop offset="1" stop-color="#8090a0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${[300, 780, 1280].map((cx, i) => `<g class="anim-cloud" style="animation-delay:${i * 1.4}s"><ellipse cx="${cx}" cy="${150 + i * 30}" rx="${190 - i * 20}" ry="${70 - i * 8}" fill="#5a6675" opacity="0.9"/><ellipse cx="${cx + 110}" cy="${176 + i * 26}" rx="${140 - i * 14}" ry="${56 - i * 6}" fill="#4d5865" opacity="0.9"/></g>`).join("")}
    ${lightning ? `<g class="anim-wave"><path d="M 1090 200 L 1030 380 L 1090 380 L 1010 580 L 1120 360 L 1058 360 L 1130 200 Z" fill="#f6e9a8" stroke="#fff6cf" stroke-width="5" stroke-linejoin="round"/></g>` : ""}
    ${drops}
    <path d="M 0 700 q 400 -40 800 0 q 400 40 800 0 L 1600 1000 L 0 1000 Z" fill="#6d7a63"/>
    <rect x="0" y="690" width="${W}" height="${H - 690}" fill="#5d6a55" opacity="0.55"/>`;
}

// A field with furrows, for the farm-to-plate pages.
function farmField(x, y, s = 1, { rows = 5 } = {}) {
  let furrows = "";
  for (let i = 0; i < rows; i += 1) {
    const fy = -i * 34;
    furrows += `<path d="M ${-420 + i * 26} ${fy} q ${420 - i * 26} -26 ${840 - i * 52} 0" stroke="${i % 2 ? "#7d5a38" : "#8a6242"}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
    furrows += `${[0, 1, 2, 3, 4, 5].map((c) => `<g class="anim-grass" style="${delayAt(c * 90, fy, 3)}"><path d="M ${-330 + i * 20 + c * 130} ${fy - 8} q -8 -30 -2 -44 M ${-322 + i * 20 + c * 130} ${fy - 8} q 10 -26 20 -36" stroke="#6f9a4a" stroke-width="7" fill="none" stroke-linecap="round"/></g>`).join("")}`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${furrows}</g>`;
}

// The library cart: a hand cart of books, the travelling library of Unit 4.
function libraryCart(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="10" rx="180" ry="14" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="animation-duration:3.2s">
      <rect x="-160" y="-190" width="320" height="180" rx="10" fill="#b06a4a" stroke="${C.ink}" stroke-width="5"/>
      ${[0, 1].map((r) => `<rect x="-140" y="${-176 + r * 84}" width="280" height="14" rx="5" fill="#8a5238"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${-134 + i * 40}" y="${-232 + r * 84}" width="30" height="56" rx="3" fill="${C.rainbow[(i + r) % C.rainbow.length]}" stroke="${C.ink}" stroke-width="2.8"/>`).join("")}`).join("")}
      <path d="M 160 -150 q 70 -14 92 26" stroke="#8a6242" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="-96" cy="-6" r="42" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="-96" cy="-6" r="15" fill="${G2.metal}"/>
      <circle cx="96" cy="-6" r="42" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/><circle cx="96" cy="-6" r="15" fill="${G2.metal}"/>
    </g>
  </g>`;
}

// Inside the spiral cave: a dark chamber with a coil of rock and a lit opening.
function caveScene() {
  const spiral = [0, 1, 2, 3, 4].map((i) => {
    const r = 340 - i * 62;
    return `<path d="M ${800 - r} 640 a ${r} ${r * 0.62} 0 0 1 ${r * 2} 0" fill="none" stroke="${i % 2 ? "#5b4f45" : "#6d6055"}" stroke-width="22" opacity="${0.9 - i * 0.1}"/>`;
  }).join("");
  return `<rect width="${W}" height="${H}" fill="#2f2a26"/>
    <path d="M 0 1000 L 0 300 q 240 -220 560 -240 q 380 -24 640 200 q 260 200 400 240 L 1600 1000 Z" fill="#3d362f"/>
    ${spiral}
    <g class="anim-glow"><ellipse cx="1330" cy="470" rx="180" ry="150" fill="#f4e4b8" opacity="0.30"/></g>
    <path d="M 1210 700 q 40 -240 200 -260 q 120 -14 150 260 z" fill="#cfe4ef"/>
    <rect x="0" y="690" width="${W}" height="${H - 690}" fill="#4a423a"/>
    <path d="M 0 700 q 400 -30 800 0 q 400 30 800 0" stroke="#5b5148" stroke-width="12" fill="none"/>`;
}

// A stage with curtains, for the school play.
function stageScene({ open = true } = {}) {
  return `<rect width="${W}" height="${H}" fill="#2e2233"/>
    <rect x="0" y="0" width="${W}" height="120" fill="#241a28"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<path d="M ${i * 140} 100 q 20 40 0 80" stroke="#7d2f45" stroke-width="12" fill="none" opacity="0.5"/>`).join("")}
    <path d="M 0 100 h ${W} l 0 40 q -800 60 -1600 0 z" fill="#8f3550"/>
    ${open
      ? `${[0, 1].map((sideIndex) => {
          const side = sideIndex === 0 ? -1 : 1;
          const base = sideIndex === 0 ? 0 : W;
          return `<path d="M ${base} 100 q ${side * 40} 300 ${side * 300} 380 q ${side * -60} 260 ${side * 60} 420 L ${base} 1000 Z" fill="#a03d5c" stroke="#7d2f45" stroke-width="6"/>
            ${[0, 1, 2, 3].map((i) => `<path d="M ${base + side * (60 + i * 62)} 140 q ${side * 30} 380 ${side * -10} 820" stroke="#7d2f45" stroke-width="9" fill="none" opacity="0.65"/>`).join("")}`;
        }).join("")}`
      : `<rect x="0" y="140" width="${W}" height="860" fill="#a03d5c"/>`}
    <rect x="0" y="820" width="${W}" height="${H - 820}" fill="#a8845a"/>
    <path d="M 0 820 h ${W}" stroke="#8a6242" stroke-width="10"/>
    ${[0, 260, 520, 780, 1040, 1300, 1560].map((fx) => `<path d="M ${fx} 830 L ${fx - 60} 1000" stroke="#8a6242" stroke-width="5" opacity="0.5"/>`).join("")}`;
}

// A telescope on a tripod.
function telescope(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -70 0 L -12 -140 M 70 0 L 12 -140 M 0 0 L 0 -140" stroke="#6b5a44" stroke-width="12" stroke-linecap="round"/>
    <g class="anim-idle" style="animation-duration:4s" transform="rotate(-26)">
      <rect x="-30" y="-236" width="150" height="56" rx="26" fill="${G2.metalDark}" stroke="${C.ink}" stroke-width="5"/>
      <rect x="104" y="-244" width="52" height="72" rx="14" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4.5"/>
      <ellipse cx="152" cy="-208" rx="9" ry="32" fill="${G3.teal}" stroke="${C.ink}" stroke-width="3.4"/>
      <rect x="-58" y="-222" width="34" height="28" rx="10" fill="${G2.metal}" stroke="${C.ink}" stroke-width="4"/>
    </g>
  </g>`;
}

// The attic: rafters, a small window and stacked boxes.
function atticScene() {
  return `<rect width="${W}" height="${H}" fill="#6b5a48"/>
    <path d="M 0 0 L 800 -60 L 1600 0 L 1600 260 L 800 130 L 0 260 Z" fill="#4f4237"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M ${140 + i * 320} 120 L ${300 + i * 320} 660" stroke="#3f352c" stroke-width="26" opacity="0.8"/>`).join("")}
    <path d="M 0 240 q 800 -110 1600 0 L 1600 300 q -800 -110 -1600 0 z" fill="#3f352c"/>
    <g transform="translate(1250 430)">
      <path d="M -110 110 L 0 -120 L 110 110 Z" fill="#dcecf5" stroke="#3f352c" stroke-width="12" stroke-linejoin="round"/>
      <path d="M 0 -120 v 230 M -74 20 h 148" stroke="#3f352c" stroke-width="9"/>
      <g class="anim-glow"><ellipse cx="0" cy="40" rx="120" ry="90" fill="#fff3cd" opacity="0.22"/></g>
    </g>
    <rect x="0" y="700" width="${W}" height="${H - 700}" fill="#7d6a54"/>
    <path d="M 0 700 h ${W}" stroke="#5f5142" stroke-width="10"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M ${i * 280} 712 L ${i * 280 - 90} 1000" stroke="#5f5142" stroke-width="5" opacity="0.5"/>`).join("")}`;
}

// A stack of old boxes and a trunk, for the attic.
function oldBoxes(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-150" y="-110" width="180" height="110" rx="6" fill="#a8845a" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -150 -74 h 180" stroke="#8a6242" stroke-width="5"/>
    <rect x="-120" y="-196" width="140" height="86" rx="6" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -50 -196 v 86" stroke="#8a6242" stroke-width="5"/>
    <g transform="translate(120 -60)">
      <path d="M -80 60 v -76 q 80 -30 160 0 v 76 z" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
      <path d="M -80 -16 q 80 -30 160 0" stroke="#5f3826" stroke-width="6" fill="none"/>
      <rect x="-14" y="-6" width="28" height="24" rx="4" fill="${G2.metal}" stroke="${C.ink}" stroke-width="3"/>
    </g>
  </g>`;
}

// A big-city street for the capital: taller blocks, a station front, traffic.
function capitalScene() {
  const block = (bx, h, colour) => `<rect x="${bx}" y="${640 - h}" width="180" height="${h}" rx="8" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    ${Array.from({ length: Math.floor(h / 84) }, (unused, r) => [0, 1].map((c) => `<rect x="${bx + 30 + c * 84}" y="${666 - h + r * 84}" width="56" height="54" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>`).join("")).join("")}`;
  return `${sky()}${sun(230, 150)}${hills()}
    ${block(60, 300, "#c98f6a")}${block(280, 430, "#8fa8c9")}${block(500, 350, "#9d82c4")}
    ${block(1160, 400, "#8ab17d")}${block(1380, 320, "#c98f6a")}
    <g transform="translate(860 640)">
      <rect x="-220" y="-280" width="440" height="280" rx="8" fill="#e6d7bd" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -250 -280 h 500 l -30 -50 h -440 z" fill="#b06a4a" stroke="${C.ink}" stroke-width="4.5"/>
      ${[-160, -60, 60, 160].map((cx) => `<rect x="${cx - 22}" y="-280" width="44" height="280" rx="8" fill="#f0e4d2" stroke="${C.ink}" stroke-width="4"/>`).join("")}
      <rect x="-62" y="-150" width="124" height="150" rx="6" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
      <circle cx="0" cy="-236" r="40" fill="#f6f0d8" stroke="${C.ink}" stroke-width="5"/>
      <path d="M 0 -236 v -26 M 0 -236 l 18 10" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <rect x="0" y="640" width="${W}" height="${H - 640}" fill="#cfc3ab"/>
    <path d="M 0 640 h ${W}" stroke="#e2d9c6" stroke-width="12"/>
    <path d="M 0 800 h ${W}" stroke="#b3a68f" stroke-width="8" stroke-dasharray="70 52" opacity="0.7"/>`;
}

// A signpost with arms pointing several ways — for the getting-lost pages.
function signpost(x, y, s = 1, { arms = 3 } = {}) {
  const colours = [G3.teal, G3.coral, G3.gold, G3.plum];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-9" y="-320" width="18" height="320" rx="7" fill="#8a6242" stroke="${C.ink}" stroke-width="4"/>
    ${Array.from({ length: arms }, (unused, i) => {
      const dir = i % 2 ? 1 : -1;
      const ay = -290 + i * 74;
      return `<path d="M ${dir * 8} ${ay} h ${dir * 150} l ${dir * 34} 24 l ${dir * -34} 24 h ${dir * -150} z" fill="${colours[i % colours.length]}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M ${dir * 34} ${ay + 24} h ${dir * 96}" stroke="${G3.cream}" stroke-width="7" stroke-linecap="round"/>`;
    }).join("")}
  </g>`;
}

// A museum front for the capital trip.
function museum(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-240" y="-260" width="480" height="260" rx="6" fill="#efe6d2" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -280 -260 L 0 -390 L 280 -260 Z" fill="#c98f6a" stroke="${C.ink}" stroke-width="5.5" stroke-linejoin="round"/>
    ${[-180, -90, 0, 90, 180].map((cx) => `<rect x="${cx - 26}" y="-260" width="52" height="260" rx="9" fill="#f7f1e2" stroke="${C.ink}" stroke-width="4.5"/>`).join("")}
    <rect x="-66" y="-140" width="132" height="140" rx="6" fill="#7d4a32" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -140 v 140" stroke="#5f3826" stroke-width="4"/>
    <path d="M -140 -320 h 280" stroke="${G3.cream}" stroke-width="10" stroke-linecap="round"/>
  </g>`;
}

// A parade banner carried between two poles.
function paradeBanner(x, y, s = 1, { colour = G3.teal } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-210" y="-200" width="12" height="200" rx="5" fill="#8a6242"/>
    <rect x="198" y="-200" width="12" height="200" rx="5" fill="#8a6242"/>
    <g class="anim-canopy" style="animation-duration:5s">
      <path d="M -200 -196 q 200 34 400 0 l 0 130 q -200 34 -400 0 z" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M -150 -140 h 300 M -150 -100 h 220" stroke="${G3.cream}" stroke-width="10" stroke-linecap="round"/>
    </g>
  </g>`;
}

module.exports = {
  ...kit3,
  CAST4, figure4,
  postCounterScene, counter, letterProp,
  scienceTent, stormScene, farmField, libraryCart,
  caveScene, stageScene, telescope, atticScene, oldBoxes,
  capitalScene, signpost, museum, paradeBanner,
};
