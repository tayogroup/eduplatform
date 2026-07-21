// Science visuals: topic-aware labelled SVG diagrams and a WebGL scene for
// each unit. A lightweight classifier maps a unit's title/concepts to one of
// a set of science topics; each topic provides diagram art and, where it adds
// understanding, an interactive WebGL scene id (see science-webgl.js).

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---- topic classification -------------------------------------------------
const TOPIC_RULES = [
  ["living", /living|life process|mrs gren|alive|organism|habitat|classif|animal|plant|leaf|seed|germinat|flower|grow|food chain|microorganism|cell|human|body|organ|digest|reproduc|breath|respir/i],
  ["earthspace", /earth|moon|sun|planet|solar|space|day and night|season|orbit|sky|star|rock|soil|rock cycle/i],
  ["matter", /material|matter|solid|liquid|gas|state|mixture|separat|dissolv|element|periodic|metal|property|properties|changing material|change of/i],
  ["electricity", /electric|circuit|current|conductor|insulator|battery|bulb|charge|magnetism/i],
  ["forces", /force|push|pull|magnet|motion|gravity|friction|speed|energy|machine|float|sink/i],
  ["light", /light|shadow|reflect|refract|vision|see|mirror|colour|color|rainbow/i],
  ["sound", /sound|hearing|ear|vibrat|loud|pitch|noise/i],
];

export function unitTopic(unitTitle, concepts = []) {
  const title = String(unitTitle || "");
  // The unit title is the strongest signal: if it matches a topic, use it.
  for (const [topic, pattern] of TOPIC_RULES) if (pattern.test(title)) return topic;
  // Otherwise score every topic by how many rules its concept text matches.
  const conceptText = concepts.map((c) => `${c.title} ${c.explanation}`).join(" ");
  let best = "general", bestScore = 0;
  for (const [topic, pattern] of TOPIC_RULES) {
    const matches = (conceptText.match(new RegExp(pattern, "gi")) || []).length;
    if (matches > bestScore) { bestScore = matches; best = topic; }
  }
  return best;
}

// ---- SVG diagram library --------------------------------------------------
// Each topic maps to an array of {caption, labels, art} diagrams keyed by the
// concept index (cycled). Art is drawn on a 380x180 viewBox and uses the
// science visual stylesheet classes.
const DIAGRAMS = {
  living: [
    { caption: "Every living thing carries out seven life processes — remember them as MRS GREN.", labels: ["Movement", "Respiration", "Sensitivity", "Growth", "Reproduction", "Excretion", "Nutrition"],
      art: `<circle cx="190" cy="90" r="52" class="sci-fill-green"/><text x="190" y="86" class="sci-mid">MRS</text><text x="190" y="106" class="sci-mid">GREN</text>${[0,1,2,3,4,5,6].map((i)=>{const a=i/7*Math.PI*2-Math.PI/2,x=190+Math.cos(a)*118,y=90+Math.sin(a)*70;return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="15" class="sci-dot"/><text x="${x.toFixed(0)}" y="${(y+4).toFixed(0)}" class="sci-tiny">${"MRSGREN"[i]}</text>`;}).join("")}` },
    { caption: "Living, dead and never-alive are the three groups we sort things into.", labels: ["living", "dead", "never-alive"],
      art: `<circle cx="70" cy="88" r="34" class="sci-fill-green"/><path d="M70 62c-9 8-9 20 0 26 9-6 9-18 0-26z" class="sci-detail"/><rect x="158" y="56" width="64" height="60" rx="4" class="sci-fill-gold"/><path d="M170 70l40 34M210 70l-40 34" class="sci-detail"/><path d="M300 116l30-58 30 58z" class="sci-fill-gray"/><text x="70" y="150" class="sci-label">living</text><text x="190" y="150" class="sci-label">dead</text><text x="330" y="150" class="sci-label">never-alive</text>` },
    { caption: "Green leaves make food from sunlight, water and carbon dioxide, and give off oxygen.", labels: ["sunlight", "carbon dioxide", "water", "oxygen"],
      art: `<circle cx="60" cy="42" r="20" class="sci-fill-gold"/>${[0,1,2,3,4,5,6,7].map((i)=>{const a=i/8*Math.PI*2;return `<path d="M${(60+Math.cos(a)*24).toFixed(0)} ${(42+Math.sin(a)*24).toFixed(0)}l${(Math.cos(a)*10).toFixed(0)} ${(Math.sin(a)*10).toFixed(0)}" class="sci-ray"/>`;}).join("")}<path d="M210 150V70" class="sci-stem"/><path d="M210 92c-30-14-52 2-52 2s22 20 52 6z" class="sci-fill-green"/><path d="M210 74c30-14 52 2 52 2s-22 20-52 6z" class="sci-fill-green"/><path d="M96 60q40 16 96 20" class="sci-arrow"/><text x="70" y="150" class="sci-tiny">sunlight</text><path d="M320 60q-50 16-104 22" class="sci-arrow alt"/><text x="330" y="52" class="sci-tiny">CO₂ in</text><text x="210" y="168" class="sci-tiny">O₂ out ↑</text>` },
    { caption: "A seed germinates: the root grows down, then the shoot grows up towards the light.", labels: ["seed", "root", "shoot", "leaves"],
      art: `<path d="M20 130h340" class="sci-ground"/><ellipse cx="70" cy="120" rx="15" ry="11" class="sci-fill-gold"/><ellipse cx="160" cy="118" rx="13" ry="10" class="sci-fill-gold"/><path d="M160 128c-4 12-10 18-12 26" class="sci-root"/><path d="M260 118c-5 14-9 22-11 30" class="sci-root"/><path d="M260 114c0-16 2-30 2-44" class="sci-stem"/><path d="M262 74c14-6 24 2 24 2s-10 12-24 4z" class="sci-fill-green"/><text x="70" y="156" class="sci-label">seed</text><text x="160" y="156" class="sci-label">root</text><text x="262" y="156" class="sci-label">shoot</text>` },
  ],
  earthspace: [
    { caption: "The Earth orbits the Sun while the Moon orbits the Earth. Drag the model to explore.", labels: ["Sun", "Earth", "Moon", "orbit path"], scene: "orbit" },
    { caption: "Day and night: the Earth spins, so one half faces the Sun (day) and one half faces away (night).", labels: ["Sun", "day side", "night side", "spin →"],
      art: `<circle cx="70" cy="90" r="30" class="sci-fill-gold"/>${[0,1,2,3,4,5].map((i)=>{const a=i/6*Math.PI*2;return `<path d="M${(70+Math.cos(a)*34).toFixed(0)} ${(90+Math.sin(a)*34).toFixed(0)}l${(Math.cos(a)*10).toFixed(0)} ${(Math.sin(a)*10).toFixed(0)}" class="sci-ray"/>`;}).join("")}<circle cx="250" cy="90" r="46" class="sci-fill-blue"/><path d="M250 44a46 46 0 0 0 0 92z" class="sci-night"/><path d="M150 90h54m-10-8l10 8-10 8" class="sci-arrow"/><text x="120" y="80" class="sci-tiny">sunlight</text><text x="228" y="94" class="sci-label light">day</text><text x="286" y="94" class="sci-label">night</text>` },
    { caption: "Rocks form soil over long times; the rock cycle recycles rock through heat, pressure and weathering.", labels: ["igneous", "sedimentary", "metamorphic", "weathering"],
      art: `<circle cx="190" cy="90" r="60" class="sci-ring"/>${[["igneous",-Math.PI/2,"sci-fill-red"],["sedimentary",Math.PI/6,"sci-fill-gold"],["metamorphic",Math.PI*5/6,"sci-fill-gray"]].map(([t,a,cls])=>{const x=190+Math.cos(a)*60,y=90+Math.sin(a)*60;return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="20" class="${cls}"/><text x="${x.toFixed(0)}" y="${(y+38).toFixed(0)}" class="sci-tiny">${t}</text>`;}).join("")}<path d="M150 55a60 60 0 0 1 80 10" class="sci-arrow"/>` },
  ],
  matter: [
    { caption: "Solids, liquids and gases differ in how their particles are arranged and move. Drag to explore.", labels: ["solid — packed", "liquid — sliding", "gas — free"], scene: "states" },
    { caption: "In a mixture, materials are combined but each keeps its own properties and can be separated.", labels: ["material A", "material B", "mixture"],
      art: `<circle cx="70" cy="88" r="30" class="sci-fill-blue"/><circle cx="180" cy="88" r="30" class="sci-fill-gold"/><path d="M120 88h40m-10-8l10 8-10 8" class="sci-arrow"/><path d="M270 56h70v58a10 10 0 0 1-10 10h-50a10 10 0 0 1-10-10z" class="sci-glass"/>${[[288,84,"sci-fill-blue"],[312,74,"sci-fill-gold"],[322,98,"sci-fill-blue"],[296,104,"sci-fill-gold"],[308,92,"sci-fill-blue"]].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="8" class="${c}"/>`).join("")}<text x="70" y="150" class="sci-label">A</text><text x="180" y="150" class="sci-label">B</text><text x="305" y="150" class="sci-label">mixture</text>` },
    { caption: "Heating and cooling change state: melting, freezing, evaporating and condensing.", labels: ["melt →", "freeze ←", "evaporate →", "condense ←"],
      art: `<rect x="40" y="60" width="60" height="56" rx="6" class="sci-fill-gray"/><text x="70" y="94" class="sci-mid">solid</text><path d="M108 88h50m-10-8l10 8-10 8" class="sci-arrow"/><rect x="160" y="60" width="60" height="56" rx="6" class="sci-fill-blue"/><text x="190" y="94" class="sci-mid">liquid</text><path d="M228 88h50m-10-8l10 8-10 8" class="sci-arrow"/><rect x="280" y="60" width="60" height="56" rx="6" class="sci-fill-orange"/><text x="310" y="94" class="sci-mid">gas</text><text x="133" y="130" class="sci-tiny">melt</text><text x="253" y="130" class="sci-tiny">evaporate</text>` },
  ],
  forces: [
    { caption: "A force is a push or a pull. Two forces act on an object at once. Drag to explore.", labels: ["push", "pull", "object"], scene: "forces" },
    { caption: "Magnets attract some metals and have two poles; like poles repel, unlike poles attract.", labels: ["N pole", "S pole", "attract", "repel"],
      art: `<path d="M60 60h20v56H60zM60 60a30 30 0 0 1 60 0h-20a10 10 0 0 0-20 0z" class="sci-fill-red"/><path d="M100 60h20v56h-20z" class="sci-fill-blue"/><text x="70" y="50" class="sci-tiny">N</text><text x="110" y="50" class="sci-tiny">S</text><path d="M150 88h40" class="sci-arrow"/><path d="M340 88h-40" class="sci-arrow"/><rect x="210" y="66" width="18" height="44" class="sci-fill-red"/><rect x="228" y="66" width="18" height="44" class="sci-fill-blue"/><rect x="270" y="66" width="18" height="44" class="sci-fill-blue"/><rect x="288" y="66" width="18" height="44" class="sci-fill-red"/><text x="228" y="132" class="sci-tiny">attract</text><text x="288" y="132" class="sci-tiny">S–N</text>` },
    { caption: "Friction and gravity: gravity pulls down, the surface pushes up, friction opposes sliding.", labels: ["gravity ↓", "support ↑", "friction ⇄"],
      art: `<path d="M40 120h300" class="sci-ground"/><rect x="150" y="80" width="70" height="40" rx="4" class="sci-fill-blue"/><path d="M185 122v34m-8-10l8 10 8-10" class="sci-arrow down"/><path d="M185 78V44m-8 10l8-10 8 10" class="sci-arrow up"/><path d="M150 100h-40m10-8l-10 8 10 8" class="sci-arrow alt"/><text x="185" y="172" class="sci-tiny">gravity</text><text x="100" y="90" class="sci-tiny">friction</text>` },
  ],
  light: [
    { caption: "Light travels in straight rays; drag the wave model to see how it moves.", labels: ["source", "ray", "screen"], scene: "wave" },
    { caption: "Light reflects off objects into our eyes so we can see them.", labels: ["light source", "object", "eye", "reflected ray"],
      art: `<circle cx="60" cy="60" r="18" class="sci-fill-gold"/><path d="M78 68l120 40" class="sci-ray-line"/><rect x="196" y="96" width="34" height="34" rx="3" class="sci-fill-green"/><path d="M214 96l90-40" class="sci-ray-line"/><path d="M320 44a20 14 0 1 0 0 28 20 14 0 1 0 0-28z" class="sci-fill-blue"/><circle cx="320" cy="58" r="6" class="sci-detail"/><text x="60" y="96" class="sci-tiny">source</text><text x="213" y="150" class="sci-tiny">object</text><text x="320" y="96" class="sci-tiny">eye</text>` },
    { caption: "A shadow forms where an opaque object blocks the light.", labels: ["light", "object", "shadow"],
      art: `<circle cx="50" cy="80" r="18" class="sci-fill-gold"/><rect x="170" y="46" width="26" height="80" class="sci-fill-navy"/><path d="M68 74l100 -20M68 90l100 74" class="sci-ray-line"/><path d="M196 60l150 20v40l-150 46z" class="sci-shadow"/><text x="50" y="118" class="sci-tiny">light</text><text x="183" y="140" class="sci-tiny">object</text><text x="290" y="120" class="sci-tiny">shadow</text>` },
  ],
  sound: [
    { caption: "Sound is a vibration that travels as a wave. Drag the model to watch it move.", labels: ["vibration", "wave", "ear"], scene: "wave" },
    { caption: "Vibrations travel from a source through the air to your ear.", labels: ["source", "sound waves", "ear"],
      art: `<rect x="46" y="66" width="34" height="48" rx="4" class="sci-fill-gold"/>${[0,1,2].map((i)=>`<path d="M${100+i*34} 90a30 30 0 0 0 -20 -26M${100+i*34} 90a30 30 0 0 1 -20 26" class="sci-wavearc"/>`).join("")}<path d="M300 60c-20 0-30 18-30 30s10 30 30 30" class="sci-fill-blue"/><circle cx="300" cy="90" r="8" class="sci-detail"/><text x="63" y="132" class="sci-tiny">source</text><text x="300" y="132" class="sci-tiny">ear</text>` },
  ],
  electricity: [
    { caption: "In a complete circuit, current flows from the battery and lights the bulb. Drag to explore.", labels: ["battery", "wire", "bulb", "current →"], scene: "circuit" },
    { caption: "A switch opens or closes the circuit. Open = no current; closed = current flows.", labels: ["open — off", "closed — on"],
      art: `<rect x="40" y="60" width="130" height="64" rx="6" class="sci-panel"/><rect x="60" y="112" width="24" height="10" class="sci-fill-gold"/><path d="M72 112V96M72 96l40 -20" class="sci-wire off"/><circle cx="130" cy="76" r="10" class="sci-bulb off"/><text x="105" y="145" class="sci-tiny">open · off</text><rect x="210" y="60" width="130" height="64" rx="6" class="sci-panel"/><rect x="230" y="112" width="24" height="10" class="sci-fill-gold"/><path d="M242 112V96M242 96h40" class="sci-wire on"/><circle cx="300" cy="76" r="10" class="sci-bulb on"/><text x="275" y="145" class="sci-tiny">closed · on</text>` },
    { caption: "Conductors let current pass; insulators stop it.", labels: ["metal — conductor", "plastic — insulator"],
      art: `<rect x="40" y="70" width="120" height="20" rx="4" class="sci-fill-gray"/><path d="M40 80h-16M160 80h16" class="sci-wire on"/><circle cx="100" cy="46" r="10" class="sci-bulb on"/><path d="M100 60V70" class="sci-wire on"/><rect x="220" y="70" width="120" height="20" rx="4" class="sci-fill-orange"/><path d="M220 80h-16M340 80h16" class="sci-wire off"/><circle cx="280" cy="46" r="10" class="sci-bulb off"/><path d="M280 60V70" class="sci-wire off"/><text x="100" y="120" class="sci-tiny">conductor</text><text x="280" y="120" class="sci-tiny">insulator</text>` },
  ],
  general: [
    { caption: "Scientists observe carefully, ask questions, predict, test and record what they find.", labels: ["observe", "predict", "test", "record"],
      art: `${[["observe",70],["predict",160],["test",250],["record",340]].map(([t,x],i)=>`<circle cx="${x}" cy="80" r="24" class="${["sci-fill-blue","sci-fill-green","sci-fill-gold","sci-fill-orange"][i]}"/><text x="${x}" y="84" class="sci-tiny">${i+1}</text><text x="${x}" y="130" class="sci-label">${t}</text>${i<3?`<path d="M${x+26} 80h${63-26}m-10-8l10 8-10 8" class="sci-arrow"/>`:""}`).join("")}` },
  ],
};

export function scienceDiagram(topic, index, { interactive = true } = {}) {
  const set = DIAGRAMS[topic] || DIAGRAMS.general;
  const diagram = set[index % set.length];
  if (diagram.scene && interactive) {
    const sceneId = `${topic}-${index}`;
    return `<figure class="science-visual" data-science-figure="${sceneId}">
      <div class="geometry-stage"><canvas class="science-webgl" data-science-scene="${diagram.scene}" role="img" aria-label="Interactive model. ${esc(diagram.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive model. Use the labels and caption below.</p></div>
      <div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>
      <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
      <figcaption><strong>Interactive example:</strong> ${esc(diagram.caption)}</figcaption>
    </figure>`;
  }
  return `<figure class="science-visual"><svg viewBox="0 0 380 180" class="sci-diagram" aria-hidden="true" focusable="false">${diagram.art || DIAGRAMS.general[0].art}</svg>
    ${diagram.labels ? `<div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>` : ""}
    <figcaption><strong>Visual example:</strong> ${esc(diagram.caption)}</figcaption></figure>`;
}

export function hasInteractiveScene(topic, index) {
  const set = DIAGRAMS[topic] || DIAGRAMS.general;
  return Boolean(set[index % set.length].scene);
}
