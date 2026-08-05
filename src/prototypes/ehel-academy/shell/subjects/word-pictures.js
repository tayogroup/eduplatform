// A picture for each vocabulary word.
//
// The word carousel used to show a decorative emoji from a rotating list, which
// meant the picture beside "table" was a star and the picture beside "apple" was
// an apple only because apple happened to fall first. A picture that does not
// mean the word is worse than no picture: a five-year-old reads it as part of
// the lesson.
//
// So this maps a lemma to a picture that IS the word. Where no honest picture
// exists — function words (the, is, my), abstract adjectives (busy, near),
// anything that would need a caption to make sense — the word is simply absent
// and the card shows no picture at all. Guessing here is the failure mode this
// file exists to prevent.
//
// Keyed by lemma, lowercased. Shared across grades, because the lemmas are.
export const WORD_PICTURES = {
  // --- animals -------------------------------------------------------------
  cat: "🐈", dog: "🐕", puppy: "🐶", elephant: "🐘", fish: "🐟", goat: "🐐",
  lion: "🦁", zebra: "🦓", rabbit: "🐇", duck: "🦆", frog: "🐸", bee: "🐝",
  bug: "🐛", cow: "🐄", hen: "🐔", chick: "🐤", goose: "🦢", pig: "🐖",
  sheep: "🐑", horse: "🐎", turtle: "🐢", whale: "🐋", crocodile: "🐊",
  // Animal sounds show the animal that makes them.
  moo: "🐄", cluck: "🐔", quack: "🦆", baa: "🐑", neigh: "🐎", oink: "🐖", honk: "🦢",

  // --- food ----------------------------------------------------------------
  apple: "🍎", jam: "🍯", pancakes: "🥞", cereal: "🥣", milk: "🥛", noodles: "🍜",
  fruit: "🍊", mango: "🥭", banana: "🍌", grapes: "🍇", strawberries: "🍓",
  watermelon: "🍉", egg: "🥚", tomatoes: "🍅", onions: "🧅", potatoes: "🥔",
  carrots: "🥕", beans: "🫘", wheat: "🌾", seed: "🌱",

  // --- home, school, town --------------------------------------------------
  chair: "🪑", clock: "🕐", book: "📖", pencil: "✏️", pen: "🖊️", ruler: "📏",
  crayon: "🖍️", lunchbox: "🍱", box: "📦", kite: "🪁", ball: "⚽", "yo-yo": "🪀",
  hat: "🎩", umbrella: "☂️", glasses: "👓", bell: "🔔", nest: "🪹",
  school: "🏫", library: "📚", shop: "🏬", market: "🏪", hospital: "🏥",
  park: "🎠", "bus stop": "🚏", town: "🏘️", road: "🛣️", farm: "🏡", barn: "🛖",
  field: "🌾", tractor: "🚜", sink: "🚰", river: "🏞️", sea: "🌊", well: "🪣",

  // --- people --------------------------------------------------------------
  teacher: "🧑‍🏫", friend: "🧑‍🤝‍🧑", boy: "👦", girl: "👧", mother: "👩", mum: "👩",
  father: "👨", dad: "👨", sister: "👧", brother: "👦", grandma: "👵",
  grandpa: "👴", family: "👨‍👩‍👧‍👦", baby: "👶", children: "🧒", queen: "👑",
  clown: "🤡", princess: "👸", superhero: "🦸", pilot: "🧑‍✈️", cook: "🧑‍🍳",
  doctor: "🧑‍⚕️",

  // --- body ----------------------------------------------------------------
  hand: "✋", hands: "✋", foot: "🦶", feet: "🦶", ear: "👂", ears: "👂",
  nose: "👃", finger: "👆", fingers: "👆", arm: "💪", leg: "🦵", eyes: "👀",
  tongue: "👅", mouth: "👄",

  // --- clothes -------------------------------------------------------------
  shirt: "👕", dress: "👗", jacket: "🧥", trousers: "👖", shoes: "👟", boots: "🥾",

  // --- getting around ------------------------------------------------------
  bus: "🚌", car: "🚗", bicycle: "🚲", boat: "⛵", train: "🚆", plane: "✈️",
  helicopter: "🚁", van: "🚐", wheels: "🛞", seat: "💺",

  // --- weather and nature --------------------------------------------------
  sun: "☀️", moon: "🌙", tree: "🌳", rainbow: "🌈", water: "💧", rain: "🌧️",
  drop: "💧", rainy: "🌧️", sunny: "☀️", cloudy: "☁️", windy: "🌬️", igloo: "🧊",

  // --- shapes and colours --------------------------------------------------
  square: "⬜", circle: "⚪", triangle: "🔺",
  red: "🟥", blue: "🟦", green: "🟩", yellow: "🟨", orange: "🟧", purple: "🟪",
  black: "⬛", white: "⬜", pink: "🩷", brown: "🟫", gold: "🟡",

  // --- numbers -------------------------------------------------------------
  one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣", six: "6️⃣",
  seven: "7️⃣", eight: "8️⃣", nine: "9️⃣", ten: "🔟",

  // --- doing words ---------------------------------------------------------
  like: "👍", read: "📖", write: "✍️", draw: "🎨", paint: "🎨", sing: "🎤",
  listen: "👂", hear: "👂", smell: "👃", taste: "👅", point: "👉", help: "🤝",
  work: "🛠️", play: "🧸", eat: "🍽️", drink: "🥤", talk: "💬", laugh: "😄",
  bounce: "⛹️", roll: "🎳", throw: "🤾", catch: "🥎", run: "🏃", jump: "🤸",
  clap: "👏", cut: "✂️", make: "🔨", wear: "👕", thank: "🙏", sell: "💰",
  planting: "🌱", growing: "🌱", "grow plants": "🌱", picking: "🧺",
  driving: "🚗", drive: "🚗", carrying: "🧳", travel: "🧳", ride: "🚴",
  fly: "🕊️", float: "🛟", walk: "🚶", wash: "🧼", "sit down": "🪑",
  "lay the table": "🍽️", "tidy your room": "🧹",

  // --- describing words ----------------------------------------------------
  soft: "🧸", hard: "🪨", loud: "🔊", louder: "🔊", quiet: "🤫", quieter: "🤫",
  sweet: "🍬", sweeter: "🍬", cold: "🥶", colder: "🥶", hot: "🥵", juicy: "🧃",
  juicier: "🧃", round: "⚪", wet: "💦", dry: "🌵", clean: "🧼", dirty: "🧹",
  big: "🐘", little: "🐁", small: "🐁", fast: "🏃", faster: "🏃", slow: "🐢",
  stop: "🛑", go: "🟢", up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️",

  // === Grade 2 =============================================================
  calendar: "📅", day: "🌞", week: "📆", month: "📅", date: "📅", birthday: "🎂",
  tablet: "📱", chart: "📊", picture: "🖼️", eleven: "1️⃣1️⃣", twelve: "1️⃣2️⃣",
  first: "🥇", second: "🥈", third: "🥉", "one hundred": "💯",
  "police officer": "👮", officer: "👮", reporter: "🎙️", "bus driver": "🧑‍✈️",
  firefighter: "🧑‍🚒", "window cleaner": "🧽", helmet: "⛑️", gloves: "🧤",
  mask: "😷", uniform: "👔", nurse: "🧑‍⚕️", farmer: "🧑‍🌾",
  head: "🙂", tummy: "🫃", toe: "🦶", wave: "👋", hop: "🦘", exercise: "🏋️",
  healthy: "💪", strong: "💪", sleep: "😴", energy: "⚡", turn: "🔄",
  stand: "🧍", flap: "🪽", light: "💡", sky: "🌌", morning: "🌅", midday: "🌞",
  evening: "🌆", sunrise: "🌅", sunset: "🌇", star: "⭐", cloud: "☁️",
  night: "🌙", earth: "🌍", high: "⬆️", low: "⬇️", bright: "🔆", dark: "🌑",
  heart: "❤️", measure: "📏", centimetre: "📏", metre: "📏", length: "📏",
  height: "📐", weight: "⚖️", size: "📏", tall: "🦒", heavy: "🏋️", wide: "↔️",
  butterfly: "🦋", cricket: "🦗", ant: "🐜", spider: "🕷️", worm: "🪱",
  insect: "🐛", legs: "🦵", wings: "🪽", anthill: "🐜", web: "🕸️",
  crawl: "🐛", spin: "🌀", chirp: "🐦", collect: "🧺", watering: "💧",
  litter: "🗑️", recycling: "♻️", roots: "🌱", stem: "🌿", leaves: "🍃",
  flower: "🌸", seeds: "🌱", air: "💨", soil: "🪴",
  happy: "😊", glad: "😊", thankful: "🙏",
  house: "🏠", apartment: "🏢", hut: "🛖", "tree house": "🏡", hive: "🐝",
  hole: "🕳️", bedroom: "🛏️", kitchen: "🍳", bathroom: "🛁",
  "living room": "🛋️", "dining room": "🍽️", bed: "🛏️", table: "🍽️",
  sofa: "🛋️", window: "🪟", "make my bed": "🛏️", "sweep the floor": "🧹",
  "set the table": "🍽️", "wash the dishes": "🧼", "adobe house": "🛖",
  "stilt house": "🏚️", "cave house": "🕳️", skyscraper: "🏙️",
  "shopping center": "🏬", underground: "🚇", ferry: "⛴️",
  "ferris wheel": "🎡", traffic: "🚦", map: "🗺️", directions: "🧭",
  aquarium: "🐠", octopus: "🐙", penguin: "🐧", shark: "🦈",
  dangerous: "⚠️", huge: "🐘", scary: "😱", beautiful: "🌺",

  // === Grade 3 =============================================================
  january: "📅", february: "📅", march: "📅", april: "📅", may: "📅",
  june: "📅", july: "📅", august: "📅", september: "📅", october: "📅",
  november: "📅", december: "📅",
  hour: "⏰", vacation: "🏖️", future: "🔮", sailor: "⚓", court: "⚖️",
  college: "🎓", graduate: "🎓", garden: "🌷", exit: "🚪", village: "🏘️",
  address: "📮", build: "🏗️", protect: "🛡️", escape: "🏃", search: "🔍",
  celebrate: "🎉", friendly: "😊", care: "❤️", calm: "😌",
  climate: "🌡️", weather: "🌦️", temperature: "🌡️", sunshine: "☀️",
  froze: "🧊", mountain: "⛰️", forest: "🌲", beach: "🏖️", coast: "🏖️",
  nature: "🌿", explore: "🧭", metal: "🔩", planet: "🪐",
  mathematics: "🔢", number: "🔢", million: "🔢", addition: "➕",
  subtraction: "➖", multiplication: "✖️", division: "➗", distance: "📏",
  idea: "💡", imagine: "💭", sadness: "😢", study: "📖", lesson: "📚",
  education: "🎓", grammar: "✍️", eraser: "🧽", report: "📋", supply: "📦",
  health: "💚", safety: "🦺", contest: "🏆",

  // === Grade 4 =============================================================
  mail: "📬", language: "🗣️", citizen: "🪪", speed: "💨", balance: "⚖️",
  breath: "😮‍💨", sweat: "💦", canyon: "🏜️", meadow: "🌾", bay: "🌊",
  storm: "⛈️", hail: "🧊", hurricane: "🌀", tornado: "🌪️", foggy: "🌫️",
  snowy: "🌨️", volcano: "🌋", solar: "☀️", royal: "👑",
  sandwich: "🥪", lamb: "🐑", rice: "🍚", spice: "🌶️", bakery: "🥖",
  brain: "🧠", cattle: "🐄", deliver: "📦", thought: "💭", discover: "🔍",
  knowledge: "📚", judge: "⚖️", scientist: "🔬", fiction: "📖",
  circular: "⭕", population: "👥", gallop: "🐎", spiral: "🌀",
  peek: "👀", gaze: "👀", check: "✅", signal: "🚦", rescue: "🛟",
  rescuing: "🛟", defend: "🛡️", janitor: "🧹", carpenter: "🔨",
  engineer: "👷", merchant: "🏪", governor: "🏛️", senator: "🏛️",
  lawyer: "⚖️", military: "🎖️", artist: "🎨", photographer: "📷",
  messenger: "📨", article: "📰", hero: "🦸", consumer: "🛒",
  nervous: "😰", anxious: "😟", terrified: "😱", curious: "🤔", proud: "😌",
  gentle: "🤲", polite: "🙇", generous: "🎁", serious: "😐", humorous: "😄",
  fierce: "🦁", shy: "😊", greedy: "🤑",
  equipment: "🧰", folder: "📁", briefcase: "💼", shield: "🛡️",
  stapler: "📎", hardware: "🔧", machinery: "⚙️", curtain: "🪟",
  ingredient: "🥣", cocoa: "🍫", microwave: "🍲", utensil: "🍴",
  toothbrush: "🪥", toothpaste: "🪥", attic: "🏠", crew: "👥",
  telescope: "🔭", ambulance: "🚑", airport: "✈️", station: "🚉",
  railroad: "🛤️", capital: "🏛️", nation: "🏳️", museum: "🏛️", mall: "🏬",
  restaurant: "🍽️", office: "🏢", factories: "🏭", neighbourhood: "🏘️",
  entrance: "🚪", elevator: "🛗", customer: "🛒", arrive: "🛬",
  horizon: "🌅", equator: "🌐", teaching: "🧑‍🏫", helping: "🤝",

  // === Grades 3-4, second pass ============================================
  // The concrete words the first pass missed, plus the abstract ones where a
  // picture is genuinely the idea rather than a decoration for it: "purpose"
  // is a target, "attract" is a magnet, "peace" is the peace sign. Words like
  // careless, similar, quantity-as-a-concept, priority and comma are left
  // bare on purpose — there is no picture of them, only a picture of
  // something nearby, which is what this file exists to avoid.
  parent: "👨‍👩‍👦", student: "🧑‍🎓", author: "✍️", "(december)": "📅",
  respect: "🙇", honour: "🏅", private: "🔒", public: "👥", border: "🛂",
  discuss: "💬", complete: "✅", kind: "🤗", kindness: "🤗", able: "💪",
  tough: "🦾", rough: "🪨", favourite: "⭐", extra: "➕", straight: "📏",
  meter: "📏", purpose: "🎯", thoughtful: "💭", suggest: "💡",
  enjoy: "😄", enjoyable: "😄", soon: "⏳",

  agree: "🤝", continue: "➡️", gain: "📈", effort: "💪", maintain: "🔧",
  daily: "📆", cancel: "❌", leave: "🚪", peace: "☮️", moisture: "💧",
  roam: "🚶", fresh: "🥬", chewy: "🍬", deadly: "☠️", gather: "🧺",
  labor: "🛠️", laborer: "🧑‍🏭", pesticide: "🧪", chemicals: "⚗️",
  service: "🛎️", information: "ℹ️", challenge: "🧗", location: "📍",
  quantity: "🔢", erase: "🧽", divorce: "💔", rate: "📊", squeeze: "🤏",
  suffer: "😣", excite: "🎉", prevent: "🛑", doubtful: "🤨", evil: "😈",
  attract: "🧲", risky: "⚠️", frequent: "🔁", plastic: "🧴", rental: "🔑",
  tourism: "🧳",
};

/** The picture for a word, or "" when there is no honest one. */
export function wordPicture(word) {
  return WORD_PICTURES[String(word || "").trim().toLowerCase()] || "";
}
