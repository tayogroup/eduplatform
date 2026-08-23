// A picture for each Science glossary word.
//
// Modelled on shell/subjects/word-pictures.js and computing/shared/
// computing-word-pictures.js, and deliberately NOT sharing either map. Science
// redefines ordinary words at least as aggressively as Computing does:
//
//   cell      a store of electrical energy — a battery, not a room or an organism
//   focus     where an earthquake BEGINS inside the crust, not attention
//   hard      does not press in; a property of a material, not "difficult"
//   product   a new substance made in a reaction, not something you buy
//   medium    what a wave travels through, not a size
//   normal    an imaginary line at 90 degrees to a surface
//   crust     the Earth's outer rocky layer, not bread
//   mould     a fungus growing on food
//   volume    how loud a sound is at Stage 1; the space in a box at Stage 8
//
// Reaching into English's map would put a target beside "focus" and a rock
// beside "hard" on a science card, which is the failure both other files exist
// to prevent.
//
// Same rule as those files: the picture must BE the word. Where no honest
// picture exists the word is simply absent and the card shows none — and that
// is MOST of this vocabulary, because most of it is abstract or has no glyph:
// respiration, adaptation, refraction, neutralisation, malleable, solubility,
// gravitational field strength. Roughly a third of terms are pictured.
//
// Two categories are left bare on purpose rather than for want of an emoji:
//
//   the Stage 8 reproduction unit  oviduct, uterus, cervix, vagina, puberty,
//                                  gestation. There is no honest glyph, and a
//                                  decorative one on this material is worse
//                                  than none.
//   virus, protozoa, algae         🦠 is already bacteria's. One picture for
//                                  four different microorganisms teaches that
//                                  they are the same thing, which is the
//                                  distinction the unit is making.
//
// NOT VOCABULARY, AND SO NOT PICTURED: the glossary carries rows that are really
// table cells from the source booklets. Two kinds, and only one is unpicturable:
//
//   keyed on a heading or a derivation  "Group", "Feature", "Method", "Day 1",
//                                       "Weight from mass" (W = m x g), "Earth
//                                       spins once", "Volume of a box". The key
//                                       is not a word, so a picture beside it
//                                       would be labelling a table.
//   keyed on a real thing               "Fish", "Wind", "Table salt", "Temperature".
//                                       These are words whatever table they came
//                                       from, and they get their picture.
//
// Chemical notation is left bare either way — "H2O", "NaCl", "Iron :: Fe" sit in
// symbol tables, and a droplet beside a formula reads as decoration on a
// reference chart rather than as the meaning of a word.
//
// The rows themselves are reported, not fixed here; the fix belongs in the
// extractor, which is picking up table headers as glossary terms.
//
// Keyed by the glossary term, lowercased. Terms written "Living / Alive" or
// "Rotate / Spin" are looked up whole and by each half, so both forms resolve.
export const SCIENCE_WORD_PICTURES = {
  // --- living things, plants, the body -------------------------------------
  animal: "🐾", animals: "🐾", plant: "🌱", plants: "🌱", grow: "📈",
  roots: "🌿", root: "🌿", stem: "🌱", leaves: "🍃", flower: "🌸",
  soil: "🪴", seed: "🌰", shoot: "🌱", germination: "🌱", fruit: "🍎",
  pollination: "🐝", nectar: "🍯", "life cycle": "🔄", fungi: "🍄",
  yeast: "🍞", bacteria: "🦠", minibeast: "🐛", insect: "🐜",
  invertebrate: "🐛", vertebrate: "🦴", fish: "🐟", bird: "🐦",
  birds: "🐦", reptile: "🦎", reptiles: "🦎", amphibian: "🐸",
  amphibians: "🐸", mammal: "🐕", mammals: "🐕", herbivore: "🐄",
  carnivore: "🦁", habitat: "🌿", shelter: "🏠",
  head: "🙂", arms: "💪🏾", legs: "🦵🏾", hands: "✋🏾", feet: "🦶🏾",
  eyes: "👀", ears: "👂🏾", ear: "👂🏾", nose: "👃🏾", mouth: "👄",
  brain: "🧠", heart: "❤️", lungs: "🫁", stomach: "🫃🏾", skeleton: "🦴",
  pulse: "💓", blood: "🩸", vision: "👁️",

  // --- materials, forces, movement -----------------------------------------
  rock: "🪨", mineral: "💎", concrete: "🧱", metal: "🔩",
  "table salt": "🧂", soft: "🧸", solid: "🧊", liquid: "💧", gas: "💨",
  freezing: "❄️", boiling: "♨️", stop: "🛑", fast: "🏃🏾", slow: "🐢",
  turn: "🔄", roll: "🎳", magnet: "🧲", speed: "💨", weight: "⚖️",
  distance: "📏", time: "⏱️", "straight line": "📏", normal: "📐",
  mixture: "🥣",

  // --- light, sound, electricity -------------------------------------------
  "light source": "🔦", "natural light": "☀️", "artificial light": "🔦",
  "natural light source": "☀️", "artificial light source": "🔦",
  light: "☀️", darkness: "🌑", mirror: "🪞", luminous: "🔆",
  "non-luminous": "🌙", dispersion: "🌈", "convex lens": "🔍",
  sound: "🔊", loud: "📢", quiet: "🤫", pitch: "🎵", listen: "👂🏾",
  electricity: "⚡", battery: "🔋", cell: "🔋", wire: "🔌", bulb: "💡",
  motor: "⚙️", current: "⚡", "renewable energy": "♻️",
  "thermal energy": "🔥", combustion: "🔥", warmth: "🔥", acid: "🧪",

  // --- Earth, sky, weather -------------------------------------------------
  earth: "🌍", sun: "☀️", star: "⭐", moon: "🌕", crescent: "🌙",
  "new moon": "🌑", "full moon": "🌕", "solar system": "🪐", satellite: "🛰️",
  constellation: "🌌", "rotate / spin": "🌀", rotate: "🌀", spin: "🌀",
  sunrise: "🌅", sunset: "🌇", day: "🌞", night: "🌙", season: "🍂",
  "time zone": "🕐", weather: "🌦️", temperature: "🌡️", drought: "🏜️",
  flood: "🌊", precipitation: "🌧️", wind: "🌬️", water: "💧", air: "💨",
  volcano: "🌋", crater: "🕳️", explosion: "💥",
  pollution: "☣️",

  // --- food and nutrition --------------------------------------------------
  nutrients: "🥗", carbohydrate: "🍚", protein: "🍖", fat: "🧈",
  vitamin: "🍊", fibre: "🥬", "food and water": "🥗",
};

// Per-stage senses, on the model of GRADE_WORD_PICTURES in
// shell/subjects/word-pictures.js. An empty string means "this stage teaches a
// sense the shared picture is wrong for", so the card shows none.
//
// Science's polysemy is NOT English's. There a lemma means one thing per grade,
// so a per-grade map settles it. Here a term can carry both senses inside ONE
// stage, taught by two different units:
//
//   cell     Stage 7 Unit 1 is "the smallest unit of a living thing"; a later
//            Stage 7 unit draws the circuit symbol for a store of electrical
//            energy. Both are Stage 7, so no stage entry can be right for both
//            and Stage 7 shows nothing. Stages 4, 6 and 8 teach only the
//            electrical one and keep the battery.
//   mineral  Stage 8 teaches "a natural solid; the building block of rock" in
//            the rocks unit AND "simple nutrient for bones and blood (calcium,
//            iron)" in the nutrition unit. A gem is wrong for the second, so
//            Stage 8 shows nothing and Stage 2 keeps it.
//
// Found by comparing every pictured term's meaning across the stages that teach
// it — never by reading the map, because each picture is right for the stage it
// was written for. Two more came out of the same pass:
//
//   nutrients  Stage 5 means minerals a plant draws from soil, not food.
//   wire       Stages 6 and 7 mean the plain straight LINE in a circuit
//              diagram, an entry in a symbol table, not a length of cable.
export const STAGE_WORD_PICTURES = {
  5: { nutrients: "" },
  6: { wire: "" },
  7: { cell: "", wire: "" },
  8: { mineral: "" },
};

/**
 * The picture for a science glossary term, or "" when there is no honest one.
 *
 * `stage` is the Cambridge stage number the term is being read at. It is what
 * separates the two senses above; omitting it falls back to the shared map,
 * which is right for most terms and wrong for exactly the four listed there.
 *
 * Terms arrive from the booklets in mixed case and sometimes as a pair —
 * "Living / Alive", "Rotate / Spin", "Reflect / Reflection" — so the whole
 * string is tried first and then each half, which is how "Spin" resolves from
 * "Rotate / Spin" without a second entry.
 */
export function scienceWordPicture(term, stage) {
  const key = String(term || "").trim().toLowerCase();
  if (!key) return "";
  const perStage = STAGE_WORD_PICTURES[stage];
  if (perStage && Object.prototype.hasOwnProperty.call(perStage, key)) return perStage[key];
  if (SCIENCE_WORD_PICTURES[key]) return SCIENCE_WORD_PICTURES[key];
  if (key.includes("/")) {
    for (const half of key.split("/")) {
      const trimmed = half.trim();
      if (perStage && Object.prototype.hasOwnProperty.call(perStage, trimmed)) return perStage[trimmed];
      if (SCIENCE_WORD_PICTURES[trimmed]) return SCIENCE_WORD_PICTURES[trimmed];
    }
  }
  return "";
}
