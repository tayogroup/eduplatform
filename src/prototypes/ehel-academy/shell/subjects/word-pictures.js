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
//
// PEOPLE CARRY A SKIN TONE: medium-dark, U+1F3FE. The learners are East African
// and the course's own artwork is the source of truth for how people look here —
// english/assets/unit-8-home.png draws the children warm dark brown, which is
// what U+1F3FE matches; U+1F3FF is darker than the illustration. Default emoji
// yellow beside that artwork made the word cards the only place in the course
// where the people were not the children reading it.
//
// Three things follow, and all three are deliberate rather than oversights:
//
//   - Only figures and body parts take it. Smiley faces (😊 😄 😳 🤗 🤔 🤒) have
//     no skin-tone form in Unicode at all — they are not human-figure emoji —
//     so they stay yellow, as do 👀 👅 👄 👁️ 🦷 🧠 and the 👥 silhouette.
//   - The tone goes on the PERSON inside a ZWJ sequence, not on the end:
//     🧑🏾‍🏫, and 🧑🏾‍🤝‍🧑🏾 where the handshake joins two people and is not a third.
//   - Which emoji accept a modifier was measured, not assumed. An unsupported
//     one does not fall back gracefully — it renders as the emoji FOLLOWED BY A
//     BROWN SQUARE, which is worse than leaving it yellow. Every sequence here
//     was width-tested to confirm it draws as one glyph, against controls (🐈,
//     🧠, 👀) that must double in width. That test is also what caught 💪 🧍 🧎
//     🫃 ✊ 🤏 🚣 as people, and rejected the "1000" keycap run as a false
//     positive — it is already four glyphs wide, so a ratio test cannot see it.
//
// Re-run that measurement before adding a person: support is per-font, and the
// newest sequences here (the four-person families, 🤝🏾) are the ones most likely
// to degrade on an older device.
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
  teacher: "🧑🏾‍🏫", friend: "🧑🏾‍🤝‍🧑🏾", boy: "👦🏾", girl: "👧🏾", mother: "👩🏾", mum: "👩🏾",
  father: "👨🏾", dad: "👨🏾", sister: "👧🏾", brother: "👦🏾", grandma: "👵🏾",
  grandpa: "👴🏾", family: "👨🏾‍👩🏾‍👧🏾‍👦🏾", baby: "👶🏾", children: "🧒🏾", queen: "👑",
  clown: "🤡", princess: "👸🏾", superhero: "🦸🏾", pilot: "🧑🏾‍✈️", cook: "🧑🏾‍🍳",
  doctor: "🧑🏾‍⚕️",

  // --- body ----------------------------------------------------------------
  hand: "✋🏾", hands: "✋🏾", foot: "🦶🏾", feet: "🦶🏾", ear: "👂🏾", ears: "👂🏾",
  nose: "👃🏾", finger: "👆🏾", fingers: "👆🏾", arm: "💪🏾", leg: "🦵🏾", eyes: "👀",
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
  like: "👍🏾", read: "📖", write: "✍🏾", draw: "🎨", paint: "🎨", sing: "🎤",
  listen: "👂🏾", hear: "👂🏾", smell: "👃🏾", taste: "👅", point: "👉🏾", help: "🤝🏾",
  work: "🛠️", play: "🧸", eat: "🍽️", drink: "🥤", talk: "💬", laugh: "😄",
  bounce: "⛹🏾", roll: "🎳", throw: "🤾🏾", catch: "🥎", run: "🏃🏾", jump: "🤸🏾",
  clap: "👏🏾", cut: "✂️", make: "🔨", wear: "👕", thank: "🙏🏾", sell: "💰",
  planting: "🌱", growing: "🌱", "grow plants": "🌱", picking: "🧺",
  driving: "🚗", drive: "🚗", carrying: "🧳", travel: "🧳", ride: "🚴🏾",
  fly: "🕊️", float: "🛟", walk: "🚶🏾", wash: "🧼", "sit down": "🪑",
  "lay the table": "🍽️", "tidy your room": "🧹",

  // --- describing words ----------------------------------------------------
  soft: "🧸", hard: "🪨", loud: "🔊", louder: "🔊", quiet: "🤫", quieter: "🤫",
  sweet: "🍬", sweeter: "🍬", cold: "🥶", colder: "🥶", hot: "🥵", juicy: "🧃",
  juicier: "🧃", round: "⚪", wet: "💦", dry: "🌵", clean: "🧼", dirty: "🧹",
  big: "🐘", little: "🐁", small: "🐁", fast: "🏃🏾", faster: "🏃🏾", slow: "🐢",
  stop: "🛑", go: "🟢", up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️",

  // === Grade 2 =============================================================
  calendar: "📅", day: "🌞", week: "📆", month: "📅", date: "📅", birthday: "🎂",
  tablet: "📱", chart: "📊", picture: "🖼️", eleven: "1️⃣1️⃣", twelve: "1️⃣2️⃣",
  first: "🥇", second: "🥈", third: "🥉", "one hundred": "💯",
  "police officer": "👮🏾", officer: "👮🏾", reporter: "🎙️", "bus driver": "🧑🏾‍✈️",
  firefighter: "🧑🏾‍🚒", "window cleaner": "🧽", helmet: "⛑️", gloves: "🧤",
  mask: "😷", uniform: "👔", nurse: "🧑🏾‍⚕️", farmer: "🧑🏾‍🌾",
  head: "🙂", tummy: "🫃🏾", toe: "🦶🏾", wave: "👋🏾", hop: "🦘", exercise: "🏋🏾",
  healthy: "💪🏾", strong: "💪🏾", sleep: "😴", energy: "⚡", turn: "🔄",
  stand: "🧍🏾", flap: "🪽", light: "💡", sky: "🌌", morning: "🌅", midday: "🌞",
  evening: "🌆", sunrise: "🌅", sunset: "🌇", star: "⭐", cloud: "☁️",
  night: "🌙", earth: "🌍", high: "⬆️", low: "⬇️", bright: "🔆", dark: "🌑",
  heart: "❤️", measure: "📏", centimetre: "📏", metre: "📏", length: "📏",
  height: "📐", weight: "⚖️", size: "📏", tall: "🦒", heavy: "🏋🏾", wide: "↔️",
  butterfly: "🦋", cricket: "🦗", ant: "🐜", spider: "🕷️", worm: "🪱",
  insect: "🐛", legs: "🦵🏾", wings: "🪽", anthill: "🐜", web: "🕸️",
  crawl: "🐛", spin: "🌀", chirp: "🐦", collect: "🧺", watering: "💧",
  litter: "🗑️", recycling: "♻️", roots: "🌱", stem: "🌿", leaves: "🍃",
  flower: "🌸", seeds: "🌱", air: "💨", soil: "🪴",
  happy: "😊", glad: "😊", thankful: "🙏🏾",
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
  address: "📮", build: "🏗️", protect: "🛡️", escape: "🏃🏾", search: "🔍",
  celebrate: "🎉", friendly: "😊", care: "❤️", calm: "😌",
  climate: "🌡️", weather: "🌦️", temperature: "🌡️", sunshine: "☀️",
  froze: "🧊", mountain: "⛰️", forest: "🌲", beach: "🏖️", coast: "🏖️",
  nature: "🌿", explore: "🧭", metal: "🔩", planet: "🪐",
  mathematics: "🔢", number: "🔢", million: "🔢", addition: "➕",
  subtraction: "➖", multiplication: "✖️", division: "➗", distance: "📏",
  idea: "💡", imagine: "💭", sadness: "😢", study: "📖", lesson: "📚",
  education: "🎓", grammar: "✍🏾", eraser: "🧽", report: "📋", supply: "📦",
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
  engineer: "👷🏾", merchant: "🏪", governor: "🏛️", senator: "🏛️",
  lawyer: "⚖️", military: "🎖️", artist: "🎨", photographer: "📷",
  messenger: "📨", article: "📰", hero: "🦸🏾", consumer: "🛒",
  nervous: "😰", anxious: "😟", terrified: "😱", curious: "🤔", proud: "😌",
  gentle: "🤲🏾", polite: "🙇🏾", generous: "🎁", serious: "😐", humorous: "😄",
  // shy was a smiling face, which is the picture for "happy" a few lines up and
  // says nothing about feeling nervous with new people — the sense all three
  // grades that teach it give. The flushed face is the shy one.
  fierce: "🦁", shy: "😳", greedy: "🤑",
  equipment: "🧰", folder: "📁", briefcase: "💼", shield: "🛡️",
  stapler: "📎", hardware: "🔧", machinery: "⚙️", curtain: "🪟",
  ingredient: "🥣", cocoa: "🍫", microwave: "🍲", utensil: "🍴",
  toothbrush: "🪥", toothpaste: "🪥", attic: "🏠", crew: "👥",
  telescope: "🔭", ambulance: "🚑", airport: "✈️", station: "🚉",
  railroad: "🛤️", capital: "🏛️", nation: "🏳️", museum: "🏛️", mall: "🏬",
  restaurant: "🍽️", office: "🏢", factories: "🏭", neighbourhood: "🏘️",
  entrance: "🚪", elevator: "🛗", customer: "🛒", arrive: "🛬",
  horizon: "🌅", equator: "🌐", teaching: "🧑🏾‍🏫", helping: "🤝🏾",

  // === Grades 3-4, second pass ============================================
  // The concrete words the first pass missed, plus the abstract ones where a
  // picture is genuinely the idea rather than a decoration for it: "purpose"
  // is a target, "attract" is a magnet, "peace" is the peace sign. Words like
  // careless, similar, quantity-as-a-concept, priority and comma are left
  // bare on purpose — there is no picture of them, only a picture of
  // something nearby, which is what this file exists to avoid.
  parent: "👨🏾‍👩🏾‍👦🏾", student: "🧑🏾‍🎓", author: "✍🏾", "(december)": "📅",
  respect: "🙇🏾", honour: "🏅", private: "🔒", public: "👥", border: "🛂",
  discuss: "💬", complete: "✅", kind: "🤗", kindness: "🤗", able: "💪🏾",
  tough: "🦾", rough: "🪨", favourite: "⭐", extra: "➕", straight: "📏",
  meter: "📏", purpose: "🎯", thoughtful: "💭", suggest: "💡",
  enjoy: "😄", enjoyable: "😄", soon: "⏳",

  agree: "🤝🏾", continue: "➡️", gain: "📈", effort: "💪🏾", maintain: "🔧",
  daily: "📆", cancel: "❌", leave: "🚪", peace: "☮️", moisture: "💧",
  roam: "🚶🏾", fresh: "🥬", chewy: "🍬", deadly: "☠️", gather: "🧺",
  labor: "🛠️", laborer: "🧑🏾‍🏭", pesticide: "🧪", chemicals: "⚗️",
  service: "🛎️", information: "ℹ️", challenge: "🧗🏾", location: "📍",
  quantity: "🔢", erase: "🧽", divorce: "💔", rate: "📊", squeeze: "🤏🏾",
  suffer: "😣", excite: "🎉", prevent: "🛑", doubtful: "🤨", evil: "😈",
  attract: "🧲", risky: "⚠️", frequent: "🔁", plastic: "🧴", rental: "🔑",
  tourism: "🧳",

  // === Grade 1, the picture-dictionary pass ================================
  // Grade 1 has 573 master entries and the first pass pictured 294 of them, so
  // half the dictionary showed a word with nothing beside it — which is the one
  // grade where the picture is doing most of the teaching. This pass adds every
  // Grade 1 lemma a picture can honestly BE.
  //
  // Two kinds of entry come in here that the earlier passes did not have:
  //
  //   - Past tenses and -ing forms. Grade 1 teaches "walked" and "laughed" as
  //     their own entries, so they take the same picture as the base verb they
  //     were built from. The tense is not in the picture, and does not need to
  //     be: the picture says WHICH action, the word says when.
  //   - Sounds. "buzz", "peep", "ding", "mmm" show the thing that makes the
  //     sound, exactly as moo/cluck/quack do above.
  //
  // The rest of Grade 1 stays bare, and most of what stays bare is unpicturable
  // by nature rather than by oversight: the function words the grade is built on
  // (I, a, the, is, my, can, we, it), the position words that need a relation
  // rather than an object (on, under, next to, here, there), and the vague
  // stand-ins (thing, much, every, sometimes, either). A few concrete words are
  // bare only because no emoji exists for them — whiteboard, rectangle, bench,
  // rug, ostrich, scarecrow, shoulder — and those are the ones worth revisiting
  // if the pictures ever become drawings instead.
  //
  // Cross-grade check, because this map is shared and a lemma can be re-taught
  // with a different sense: "back" is directional through Grades 1-4 (it is a
  // body part at Grade 5, which draws no pictures), "spot" is a place, "act" is
  // performing, "pattern" repeats. "row" is deliberately absent — Grade 1 means
  // rowing a boat and Grade 4 means a line of things, so only "rowing" is here.

  // Animals, plants and places
  giraffe: "🦒", donkey: "🫏", swallow: "🐦", baobab: "🌳", acacia: "🌳",
  straw: "🌾", lake: "🏞️", stream: "🏞️", drip: "💧", world: "🌍",
  city: "🏙️", tower: "🗼", lights: "🚦", vehicles: "🚙", sails: "⛵",
  shopkeeper: "🏪", holes: "🕳️", spot: "📍", mirror: "🪞", statue: "🗿",
  treasure: "💎", piece: "🧩", bobbin: "🧵", silver: "🥈", spices: "🌶️",

  // People and body
  king: "🤴🏾", man: "👨🏾", lady: "👩🏾", families: "👨🏾‍👩🏾‍👧🏾‍👦🏾", everyone: "👥",
  toes: "🦶🏾", knees: "🦵🏾", body: "🧍🏾",

  // Music and sound
  piano: "🎹", pia: "🎹", drum: "🥁", violin: "🎻", instrument: "🎺",
  rhythm: "🥁", verse: "🎶", hummed: "🎵", audio: "🔊", buzz: "🐝",
  peep: "🐤", rang: "🔔", ding: "🔔", dong: "🔔", splish: "💦",
  splashing: "💦", shouted: "📣", calling: "📣", cheered: "🥳",

  // School, words and numbers
  "abc chart": "🔤", word: "🔤", name: "📛", named: "📛", label: "🏷️",
  list: "📋", poem: "📜", rhyme: "📜", sentence: "📝", questions: "❓",
  asked: "❓", answers: "💬", numbers: "🔢", counted: "🔢", counting: "🔢",
  adding: "➕", pattern: "🔁", practise: "🔁", repeat: "🔁",
  experiments: "🔬", learn: "📚", learned: "📚", learning: "📚",
  remember: "🧠", reflection: "🤔", capstone: "🏆", goal: "🎯",
  minute: "⏱️", year: "📅", afternoon: "🌤️",

  // Doing words, including the past tenses Grade 1 teaches as their own entries
  see: "👀", touch: "👆🏾", touched: "👆🏾", wore: "👕", wearing: "👕",
  sang: "🎤", sat: "🪑", walked: "🚶🏾", ran: "🏃🏾", ate: "🍽️", drank: "🥤",
  drove: "🚗", threw: "🤾🏾", waved: "👋🏾", flew: "🕊️", slept: "😴",
  talked: "💬", saying: "💬", tell: "🗣️", played: "🧸", worked: "🛠️",
  planted: "🌱", cooked: "🍳", stir: "🥄", washed: "🧼", carried: "🧳",
  danced: "💃🏾", laughed: "😄", cried: "😢", crying: "😢", smelled: "👃🏾",
  tasted: "👅", heard: "👂🏾", liked: "👍🏾", loved: "❤️", hugged: "🤗",
  kiss: "💋", drawn: "🎨", making: "🔨", cutting: "✂️", selling: "💰",
  hid: "🙈", followed: "👣", sailed: "⛵", rowing: "🚣🏾", waited: "⏳",
  stood: "🧍🏾", pointed: "👉🏾", chose: "☑️", choose: "☑️", gave: "🤲🏾",
  hunt: "🔍", act: "🎭", pretend: "🎭", action: "🤸🏾", weave: "🧶",
  // The musical-statues sense Grade 1 teaches — stop still — not ice.
  freeze: "🛑", rush: "💨", back: "🔙", backwards: "🔙", falling: "⬇️",
  dream: "💭", dreamed: "💭", woke: "⏰", started: "▶️", end: "🏁",
  finally: "🏁", lived: "🏠", waste: "🗑️", wasted: "🗑️",

  // Feelings and describing words
  sad: "😔", smile: "😊", smiled: "😊", happily: "😊", merrily: "😄",
  frown: "☹️", sillier: "🤪", patient: "⏳", politely: "🙇🏾", special: "⭐",
  colourful: "🌈", best: "🥇", luck: "🍀", lucky: "🍀", yum: "😋",
  mmm: "😋", hooray: "🎉", celebration: "🎉", whee: "🎢", hello: "👋🏾",
  goodbye: "👋🏾", yes: "✅",

  // === Grades 2-4, the picture-dictionary pass =============================
  // The same pass as Grade 1 above, run over the three grades that also draw
  // pictures. It follows the same three rules and adds a fourth the upper
  // grades need:
  //
  //   - Inflections take the base word's picture. Grades 2-4 teach "swept",
  //     "singing", "grinned" and "measurements" as entries of their own.
  //   - Sounds show what makes them: "bleat" is a sheep, "barked" is a dog.
  //   - No honest picture, no picture — and there is far more of that up here,
  //     because the vocabulary turns abstract. Adverbs (simply, exactly,
  //     usually), quantifiers (enough, least, several), contractions (isn't,
  //     we'll, you're) and the position words (above, between, beyond) are
  //     bare on purpose, as are the words this file's own notes single out:
  //     careless, similar, priority, comma, quantity.
  //   - Ordinals stop at third. "first/second/third" have medals; "seventeenth"
  //     has nothing, and a keycap would be the CARDINAL number, which is a
  //     different word from the one being taught. All 28 of Grade 2's ordinals
  //     are therefore bare, and the cardinals they sit beside are not.
  //
  // Two words are left bare deliberately rather than for want of an emoji.
  // "alcohol" has an obvious glyph and this is a school that does not want it
  // on a word card; "refugee" and "immigrant" would be pictured as luggage,
  // which describes neither and is the kind of stand-in this file exists to
  // prevent.

  // --- Grade 2 -------------------------------------------------------------
  // People and school
  partner: "🧑🏾‍🤝‍🧑🏾", pupil: "🧑🏾‍🎓", classmates: "🧑🏾‍🎓", adult: "🧑🏾", tutor: "🧑🏾‍🏫",
  taught: "🧑🏾‍🏫", teaches: "🧑🏾‍🏫", grandmas: "👵🏾", grandpas: "👴🏾", dads: "👨🏾",
  mama: "👩🏾", aunt: "👩🏾", uncle: "👨🏾", daughter: "👧🏾", grandchild: "🧒🏾",
  crowd: "👥", gathers: "👥", gathered: "👥", pet: "🐕", monkey: "🐒",
  monkeys: "🐒", kings: "🤴🏾", trains: "🚆", passengers: "🚌",
  // Words about words
  spell: "🔤", spelled: "🔤", chapter: "📖", plan: "📋", instruction: "📋",
  notepad: "🗒️", text: "📄", revising: "📝", labelling: "🏷️", asking: "❓",
  studied: "📖", bookshelf: "📚", schedule: "📅", memory: "🧠",
  remembered: "🧠", remembering: "🧠", clever: "🧠", final: "🏁",
  beginning: "▶️", starting: "▶️", began: "▶️",
  // Doing and feeling
  whispers: "🤫", singing: "🎤", sings: "🎤", voice: "🗣️", noise: "🔊",
  loudest: "🔊", ring: "🔔", humming: "🎵", laughs: "😄", funny: "😄",
  enjoyed: "😄", grinned: "😁", smiling: "😊", happiest: "😊", silly: "🤪",
  scared: "😨", worried: "😟", worry: "😟", poorly: "🤒", yawn: "🥱",
  hope: "🤞🏾", surprise: "😲", wow: "😲", amazing: "🤩", excellent: "🌟",
  wish: "🌟", important: "❗", forever: "♾️", true: "✅", checked: "✅",
  wrong: "❌", mistake: "❌", ticked: "✔️", trust: "🤝🏾", agrees: "🤝🏾",
  agreed: "🤝🏾", shared: "🤝🏾", sorry: "🙇🏾", appreciate: "🙏🏾", kindest: "🤗",
  hugging: "🤗", cared: "❤️", welcome: "👋🏾", waving: "👋🏾", call: "📞",
  clapping: "👏🏾", listening: "👂🏾", listener: "👂🏾", sees: "👀", noticed: "👀",
  peeking: "👀", tapped: "👆🏾", poked: "👆🏾", palm: "✋🏾", eye: "👁️",
  heels: "🦶🏾", heel: "🦶🏾", stomach: "🫃🏾", bodies: "🧍🏾", breathing: "😮‍💨",
  breathed: "😮‍💨", lungs: "🫁", clue: "🔍", hunting: "🔍", solve: "🧩",
  problem: "🧩", invented: "💡", wise: "🦉",
  // Moving, playing, winning
  jumping: "🤸🏾", hopping: "🦘", hopped: "🦘", hoop: "⭕", hoops: "⭕",
  dance: "💃🏾", cycling: "🚴🏾", rode: "🚴🏾", swam: "🏊🏾", dived: "🤿",
  raced: "🏃🏾", relay: "🏃🏾", fastest: "🏃🏾", quick: "🏃🏾", hurried: "💨",
  hurry: "💨", crawled: "🐛", spinning: "🌀", rolled: "🎳", catches: "🥎",
  fell: "⬇️", win: "🏆", winning: "🏆", won: "🏆", winner: "🥇",
  cheering: "📣", bouncy: "⛹🏾", smallest: "🐁", giant: "🐘", taller: "🦒",
  highest: "⬆️", rising: "⬆️", darkening: "🌑", shining: "✨", glowed: "✨",
  // Home, town and the wider world
  // stall, flat and lift each mean something else at another grade — see
  // GRADE_WORD_PICTURES below, which is where those senses are resolved.
  stall: "🏪", lift: "🛗",
  "shopping centre": "🏬", rooftops: "🏘️", country: "🏳️", savanna: "🌾",
  beaches: "🏖️", forests: "🌲", floods: "🌊", spring: "🌷", weekend: "📆",
  often: "🔁", repeats: "🔁", continued: "➡️", arrived: "🛬",
  navigator: "🧭", exploring: "🧭", buying: "🛒", log: "🪵", burrow: "🕳️",
  windowsill: "🪟", bath: "🛁", cooker: "🍳", soap: "🧼", cleaning: "🧼",
  wax: "🕯️", laces: "👟", "tidy my room": "🧹", tidied: "🧹", swept: "🧹",
  wiping: "🧽", dish: "🥣", lettuce: "🥬", vegetable: "🥕", pies: "🥧",
  cans: "🥫", eating: "🍽️", drinking: "🥤", age: "🎂", moment: "⏱️",
  alarm: "🚨", siren: "🚨", block: "🛑", blocked: "🛑", fair: "⚖️",
  fairer: "⚖️", measuring: "📏", measurement: "📏", measurements: "📏",
  width: "↔️", tools: "🧰", fix: "🔧", fixed: "🔧", fixing: "🔧",
  working: "🛠️", dig: "⛏️", load: "📦", sorted: "🗂️", protects: "🛡️",
  protecting: "🛡️", recycle: "♻️", weeds: "🌿", petals: "🌸",
  stronger: "💪🏾", dried: "🌵", gas: "💨", blew: "🌬️", blow: "🌬️",
  rained: "🌧️", waiting: "⏳", footsteps: "👣", footstep: "👣",
  "soldier's": "🎖️", creature: "🐾", sting: "🐝", marched: "🚶🏾",
  kneeling: "🧎🏾", great: "👍🏾", pretty: "🌺", beauty: "🌺", dreams: "💭",
  twenty: "2️⃣0️⃣", thirty: "3️⃣0️⃣", forty: "4️⃣0️⃣", fifty: "5️⃣0️⃣",
  sixty: "6️⃣0️⃣", seventy: "7️⃣0️⃣", eighty: "8️⃣0️⃣", ninety: "9️⃣0️⃣",
  fourteen: "1️⃣4️⃣", thousand: "1️⃣0️⃣0️⃣0️⃣",

  // --- Grade 3 -------------------------------------------------------------
  // The day, the year, the place
  routine: "📆", wake: "⏰", teeth: "🦷", brush: "🪥", breakfast: "🥣",
  tea: "🍵", lamp: "💡", tap: "🚰", maps: "🗺️", sweeping: "🧹",
  cleaned: "🧼", fields: "🌾", crops: "🌾", golden: "🟡", rivers: "🏞️",
  birthdays: "🎂", coldest: "🥶", frozen: "🧊", frost: "❄️", holiday: "🏖️",
  "o'clock": "🕐", street: "🛣️", lane: "🛣️", centre: "🎯", middle: "🎯",
  focus: "🎯", junior: "🧒🏾", senior: "🧓🏾", elderly: "🧓🏾", youngest: "🧒🏾",
  nurses: "🧑🏾‍⚕️", nursing: "🧑🏾‍⚕️", medicine: "💊", sick: "🤒",
  sellers: "💰", prices: "💰", shoppers: "🛒", builders: "👷🏾",
  climbed: "🧗🏾", rabbits: "🐇", bird: "🐦", seagulls: "🐦",
  seashells: "🐚", cliffs: "🏔️", hillside: "⛰️", coastal: "🏖️",
  waterfall: "🌊", splash: "💦", foam: "🫧", herbs: "🌿", natural: "🌿",
  leaf: "🍃", dirt: "🪴", breeze: "🌬️", blows: "🌬️", raining: "🌧️",
  // Talking, showing, deciding
  interview: "🎙️", interviewer: "🎙️", microphone: "🎙️", newspaper: "📰",
  shout: "📣", laughter: "😄", laughing: "😄", joy: "😄", drums: "🥁",
  bang: "💥", painting: "🎨", props: "🎭", perform: "🎭", vest: "🦺",
  nickname: "📛", tick: "✔️", correct: "✅", completed: "✅",
  reflect: "🤔", journal: "📓", studying: "📖", classmate: "🧑🏾‍🎓",
  graduated: "🎓", competition: "🏆", prize: "🎁", winners: "🥇",
  teamwork: "🤝🏾", meet: "🤝🏾", grateful: "🙏🏾", proudly: "😌",
  proudest: "😌", pleased: "😊", happiness: "😊", quietest: "🤫",
  noisiest: "🔊", decorations: "🎊", celebrated: "🎉", event: "🎉",
  judges: "⚖️", compare: "⚖️", grams: "⚖️", collected: "🧺",
  supplies: "📦", sort: "🗂️", lent: "🤲🏾", offered: "🤲🏾", offer: "🤲🏾",
  vote: "🗳️", raise: "✋🏾", decide: "☑️", decided: "☑️",
  suggestion: "💡", thinking: "💭", imagination: "💭", imagining: "💭",
  memories: "🧠", smart: "🧠", blank: "📄", design: "📐",
  // The body, the outdoors, getting about
  face: "🙂", arms: "💪🏾", strength: "💪🏾", amazed: "🤩", freedom: "🕊️",
  standing: "🧍🏾", stepped: "👣", step: "👣", footprints: "👣",
  joggers: "🏃🏾", chased: "🏃🏾", cyclists: "🚴🏾", scooter: "🛴",
  adventure: "🧭", explored: "🧭", tour: "🧳", hike: "🥾", pack: "🎒",
  slowly: "🐢", searched: "🔍", hiding: "🙈", grab: "✊🏾", grabbed: "✊🏾",
  fist: "✊🏾", fallen: "🍂", heavier: "🏋🏾", lifted: "🏋🏾", wiped: "🧽",
  wires: "🔌", power: "⚡", machines: "⚙️", thirsty: "🥤", meal: "🍽️",
  lunchtime: "🍱", bowl: "🥣", maths: "🔢", tool: "🧰", shoe: "👟",
  sharp: "🔪", photographs: "📷", photograph: "📷", stared: "👀",
  seen: "👀", glancing: "👀", asleep: "😴", dancing: "💃🏾",
  swapping: "🔄", develop: "📈", discussed: "💬", listened: "👂🏾",
  breathe: "😮‍💨", bigger: "🐘", pausing: "⏸️", opened: "🚪", shuts: "🚪",
  kinder: "🤗", "don": "👕", unsure: "🤨", glisten: "✨",

  // --- Grade 4 -------------------------------------------------------------
  // Weather, land and the storm unit
  mist: "🌫️", fog: "🌫️", foggiest: "🌫️", shower: "🌦️", dawn: "🌅",
  lightning: "🌩️", rainstorm: "⛈️", ice: "🧊", puddles: "💧",
  dripping: "💧", choppy: "🌊", ripple: "🌊", howl: "🐺", frightening: "😨",
  frightened: "😨", fear: "😨", fright: "😱", panic: "😱", shivering: "🥶",
  hotter: "🥵", steaming: "♨️", boil: "♨️", washing: "🧺", basket: "🧺",
  countryside: "🌾", maize: "🌽", coffee: "☕", cows: "🐄", farmed: "🧑🏾‍🌾",
  bleat: "🐑", barked: "🐕", paw: "🐾", predator: "🦁", bugs: "🐛",
  // Work, tools and making
  hammer: "🔨", bolt: "🔩", iron: "🔩", rope: "🪢", ladder: "🪜",
  shovels: "⛏️", engine: "⚙️", machine: "⚙️", wheel: "🛞", crates: "📦",
  resources: "📦", scissors: "✂️", markers: "🖍️", printed: "🖨️",
  erased: "🧽", mended: "🔧", inventor: "💡", tips: "💡", advice: "💡",
  creative: "🎨", brass: "🎺", lens: "🔍", lenses: "🔍",
  observatory: "🔭", astronomers: "🔭", sparks: "✨", twinkling: "✨",
  glow: "✨", glowing: "✨", magic: "🪄", cones: "🚧", banner: "🚩",
  signpost: "🪧", railway: "🛤️", lorries: "🚚", cities: "🏙️",
  streetlamps: "💡", caretaker: "🧹", chores: "🧹", labourer: "🧑🏾‍🏭",
  labour: "🛠️", law: "⚖️", weigh: "⚖️", weighing: "⚖️", weighed: "⚖️",
  vendor: "🏪", stallholder: "🏪", seller: "💰", shopping: "🛒",
  // Reading, speaking and the newsroom unit
  dictionary: "📕", leaflet: "📄", paragraphs: "📄", script: "📜",
  headline: "📰", announcement: "📢", presenter: "🎤", song: "🎵",
  applause: "👏🏾", clapped: "👏🏾", praises: "👏🏾", communication: "💬",
  interviewed: "🎙️", improve: "📈", improved: "📈", risen: "📈",
  written: "✍🏾", metres: "📏", centimetres: "📏", kilometres: "📏",
  miles: "📏", inch: "📏", cancelled: "❌", refused: "❌", file: "📁",
  addressed: "📮", keyrings: "🔑", badge: "📛", souvenirs: "🎁",
  okay: "👌🏾", teach: "🧑🏾‍🏫", students: "🧑🏾‍🎓", childhood: "🧒🏾",
  grandparents: "🧓🏾", woman: "👩🏾", son: "👦🏾", helper: "🤝🏾",
  promising: "🤝🏾", audience: "👥", actors: "🎭", costume: "🎭",
  costumes: "🎭", dancers: "💃🏾", crown: "👑", capes: "🦸🏾", posed: "📷",
  // Health, feeling and the market unit
  disease: "🦠", poisoning: "🤢", sickness: "🤒", illness: "🤒",
  sore: "🤕", dizzy: "😵‍💫", unhappy: "😔", confused: "😕",
  infuriating: "😠", surprised: "😲", gasped: "😲", delighted: "😄",
  giggled: "🤭", grinning: "😁", excited: "🎉", exciting: "🎉",
  calmer: "😌", peaceful: "☮️", curiosity: "🤔", sleeping: "😴",
  belly: "🫃🏾", chewing: "🦷", tastes: "👅", salty: "🧂", spiced: "🌶️",
  freshest: "🥬", sweetest: "🍬", bakes: "🥖", stove: "🍳",
  precious: "💎", valuable: "💎", bracelet: "📿", harmful: "⚠️",
  // Moving, and the parade and race units
  greet: "👋🏾", rushing: "💨", swiftly: "💨", accelerate: "💨",
  escaped: "🏃🏾", wander: "🚶🏾", roamed: "🚶🏾", marching: "🚶🏾",
  // (Grades 5-8 continue after the Grade 4 block below.)
  travels: "🧳", travelled: "🧳", direction: "🧭", flies: "🕊️",
  drives: "🚗", rescued: "🛟", coiled: "🌀", spun: "🌀",
  squeezing: "🤏🏾", handed: "🤲🏾", handful: "✋🏾", handfuls: "✋🏾",
  higher: "⬆️", wider: "↔️", enormous: "🐘", hundred: "💯",
  sixteen: "1️⃣6️⃣", nineteen: "1️⃣9️⃣", staring: "👀", choosing: "☑️",
  chosen: "☑️", hoping: "🤞🏾", trading: "🔄", frequently: "🔁",
  practised: "🔁", frowned: "☹️", powerful: "💪🏾", dresses: "👗",
  borders: "🛂", problems: "🧩", planned: "📋",

  // === Grades 5-8, the picture-dictionary pass ==============================
  // Same rules again, and the yield is far lower — deliberately so. By Grade 8
  // the vocabulary is largely abstract (concise, zeal, plausible, dissent,
  // pervasive, conscientious), and there is no honest picture of any of it. The
  // words that DO earn one up here are concrete nouns from the science, trade
  // and East African life units, and they cluster: 🐆 cheetah, 🦀 crab, 🫓
  // canjeero, 🛺 bajaaj, 🪡 needle, ☄️ meteorite.
  //
  // Expect roughly a third of cards to carry a picture at these grades against
  // four fifths at Grade 1. That is the content, not the effort — and it is why
  // the list gutter is drawn only where a section actually has pictures.
  //
  // Two words are bare by choice rather than for want of an emoji, for the same
  // reason as "alcohol" above: "guns"/"weapons" (Grade 6 war unit) and
  // "refugee"/"refugees" (a suitcase describes neither, and glibly picturing it
  // is worse than leaving it).

  // --- Grade 5 -------------------------------------------------------------
  pouch: "👝", misty: "🌫️", marine: "🌊", species: "🐾", silvery: "🥈",
  rural: "🌾", urban: "🏙️", residence: "🏠", rubble: "🧱", rumble: "⛈️",
  rumbled: "⛈️", tortoise: "🐢", continent: "🌍", continental: "🌍",
  sparrow: "🐦", sandstorm: "🌪️", roar: "🦁", roared: "🦁", timber: "🪵",
  chirped: "🐦", swooped: "🦅", thirst: "🥤", wisdom: "🦉", jug: "🏺",
  broom: "🧹", sweep: "🧹", delivery: "📦", ill: "🤒", women: "👩🏾",
  verdict: "⚖️", unlock: "🔓", unlocking: "🔓", document: "📄", empire: "👑",
  constitution: "📜", charter: "📃", furious: "😠", communicate: "💬",
  quote: "🗨️", uneasy: "😟", unexpected: "😲", local: "📍",
  intelligence: "🧠", citizenship: "🪪", glare: "🔆", brightness: "🔆",
  cooperate: "🤝", cooperation: "🤝", cooperated: "🤝", collaborative: "🤝",
  boycott: "🚫", avoid: "🚫", destroy: "💥", hoist: "🏋🏾", announce: "📢",
  towering: "🗼", drowsy: "😴", booming: "🔊", approval: "👍🏾",
  contract: "📝", consume: "🍽️", brilliant: "🌟", telescopes: "🔭",
  observatories: "🔭", astronomy: "🌌", observers: "👀", observation: "👀",
  observe: "👀", tracked: "👣", mapped: "🗺️", regions: "🗺️",
  instruments: "🧰", angles: "📐", launched: "🚀", astronaut: "🧑🏾‍🚀",
  exploration: "🧭", marvels: "🤩", fault: "❌", damp: "💦", moist: "💦",
  crowding: "👥", blog: "💻", blogs: "💻", typing: "⌨️", typed: "⌨️",
  keyboard: "⌨️", tablets: "📱", meteorite: "☄️", wire: "🔌", bulbs: "💡",
  erupted: "🌋", reduce: "📉", environment: "🌿", recycled: "♻️",
  legislative: "⚖️", mission: "🎯", aim: "🎯", function: "⚙️",
  expansion: "📈", growth: "📈", increase: "📈", comprehension: "📖",
  tension: "😬", dimension: "📐", infection: "🦠", protective: "🛡️",
  competitive: "🏆", alternative: "🔀", fracture: "🦴", posture: "🧍🏾",
  artefacts: "🏺", artefact: "🏺", architect: "📐", reeds: "🌾",
  moans: "😩", rains: "🌧️", hurries: "💨", hasty: "💨", generosity: "🎁",
  friendship: "🧑🏾‍🤝‍🧑🏾", collecting: "🧺", blown: "🌬️", broad: "↔️",
  lowered: "⬇️", stirred: "🥄", names: "📛", value: "💎", adjusted: "🔧",
  resting: "😴", dining: "🍽️", conflict: "⚔️", checklist: "📋",
  policy: "📋", anxiety: "😰", artificial: "🤖", nutrition: "🥗",
  reluctant: "🤨", unsuccessful: "❌", finest: "🥇", wondered: "🤔",
  sheeko: "📖",

  // --- Grade 6 -------------------------------------------------------------
  illegal: "🚫", ban: "🚫", refuse: "❌", harmony: "☮️", warfare: "⚔️",
  battlefield: "⚔️", metamorphosis: "🦋", juror: "⚖️", justice: "⚖️",
  courtroom: "⚖️", courtrooms: "⚖️", prosecution: "⚖️", bailiff: "⚖️",
  courthouse: "🏛️", parliament: "🏛️", minister: "🏛️", ministers: "🏛️",
  civilisation: "🏛️", architecture: "🏛️", politician: "🏛️",
  blockade: "🚧", barricade: "🚧", voltage: "⚡", electric: "⚡",
  generator: "⚡", weaving: "🧶", wove: "🧶", woven: "🧶", weaver: "🧶",
  threads: "🧵", thread: "🧵", seam: "🧵", needle: "🪡", stitched: "🪡",
  seamstress: "🪡", merchants: "🏪", kiosk: "🏪", swirling: "🌀",
  shimmer: "✨", flashing: "✨", spark: "✨", doorstep: "🚪",
  soaked: "💦", wreckage: "🧱", brick: "🧱", monsoon: "🌧️",
  rainfall: "🌧️", howling: "🐺", packs: "🐺", force: "💪🏾",
  muscle: "💪🏾", husband: "👨🏾", men: "👨🏾", planks: "🪵", sticks: "🪵",
  stumps: "🪵", fisherman: "🎣", donated: "🎁", bushes: "🌿",
  shrubs: "🌿", branches: "🌿", herbalists: "🌿", tendril: "🌿",
  flag: "🏳️", builder: "👷🏾", shore: "🏖️", shoreline: "🏖️",
  speech: "🎤", truth: "✅", pounding: "💓", pump: "💓", puzzled: "😕",
  discussion: "💬", dialogue: "💬", copper: "🥉", parchment: "📜",
  chronicle: "📜", joyful: "😄", anger: "😠", aggressive: "😠",
  threat: "⚠️", straits: "🌊", ocean: "🌊", underwater: "🌊",
  explorer: "🧭", expeditions: "🧭", navigation: "🧭", excursion: "🧳",
  traveller: "🧳", migration: "🧳", porter: "🧳", caravan: "🐪",
  camelback: "🐪", nomad: "🐪", commentary: "🎙️", commentator: "🎙️",
  pollination: "🐝", excavation: "⛏️", rehearsal: "🎭", sculpture: "🗿",
  supernova: "💥", radiation: "☢️", bacteria: "🦠", plague: "🦠",
  typhoid: "🦠", mollusc: "🐚", basketball: "🏀", sport: "⚽",
  oxygen: "💨", dust: "💨", diet: "🥗", lentils: "🫘", hygiene: "🧼",
  unwell: "🤒", pain: "🤕", exhaustion: "😩", concentration: "🎯",
  champions: "🏆", swimming: "🏊🏾", riding: "🚴🏾", archery: "🏹",
  cycle: "🔁", physics: "⚛️", physicist: "⚛️", biologist: "🔬",
  fertile: "🌱", root: "🌱", grass: "🌱", photosynthesis: "🌱",
  seedling: "🌱", plant: "🌱", data: "📊", graphs: "📊", smog: "🌫️",
  floating: "🛟", predictions: "🔮", evidence: "🔍", rustled: "🍃",
  funeral: "⚰️", bury: "⚰️", mourn: "😢", grief: "😢", sorrow: "😢",
  crimson: "🟥", arid: "🏜️", grasslands: "🌾", grassland: "🌾",
  flour: "🌾", thorny: "🌵", graze: "🐄", herbivore: "🐄",
  livestock: "🐄", predators: "🦁", zoo: "🦁", gazelle: "🦌",
  gerenuk: "🦌", meat: "🍖", cheetahs: "🐆", chase: "🏃🏾",
  eagles: "🦅", reptiles: "🦎", toads: "🐸", amphibians: "🐸",
  snakes: "🐍", herons: "🐦", crabs: "🦀", turtles: "🐢", sharks: "🦈",
  baskets: "🧺", mangoes: "🥭", shawls: "🧣", scarf: "🧣", unity: "🤝",
  assistant: "🤝", fire: "🔥", bonfire: "🔥", streams: "🏞️",
  riverbed: "🏞️", territory: "🗺️", meteorology: "🌦️", monitor: "🖥️",
  magnetic: "🧲", print: "🖨️", teenager: "🧒🏾", cousin: "🧒🏾",
  chargers: "🔌", phones: "📱", phone: "📱", hook: "🪝",
  candles: "🕯️", satellites: "🛰️", satellite: "🛰️",
  translator: "🗣️", narrator: "🗣️", glory: "🏅", terrain: "⛰️",
  ridge: "⛰️", sour: "🍋", batteries: "🔋", cloak: "🧥", jumper: "🧥",
  skulls: "💀", universities: "🎓", scholar: "🎓", frustrated: "😤",
  hospitable: "🤗", massive: "🐘", bags: "👜", dormitory: "🛏️",
  dormitories: "🛏️", bedding: "🛏️", shelf: "📚", textbook: "📚",
  candidate: "🗳️", representative: "🗳️", trembled: "😰",
  organise: "🗂️", briefcases: "💼", toolboxes: "🧰", toolkit: "🧰",
  physician: "🧑🏾‍⚕️", pharmacist: "💊", driver: "🚗", mechanic: "🔧",
  radio: "📻", broadcast: "📻", documents: "📄",
  sambusas: "🥟", canjeero: "🫓", chapati: "🫓", injera: "🫓",
  cooking: "🍳", ingredients: "🥣", mixture: "🥣", listeners: "👂🏾",
  motorbikes: "🏍️", motorcycle: "🏍️", boda: "🏍️", cassava: "🥔",
  arrested: "🚨", alert: "🚨", witness: "👁️", eyewitness: "👁️",
  container: "📦", carton: "📦", illustration: "🖼️", gallery: "🖼️",
  mural: "🖼️", congregation: "👥", sunglasses: "🕶️", suit: "👔",

  // --- Grades 7-8 ----------------------------------------------------------
  stool: "🪑", camp: "⛺", knife: "🔪", feast: "🍽️",
  procession: "🚶🏾", footpath: "🚶🏾", festival: "🎉", ceremony: "🎉",
  dusk: "🌆", spinach: "🥬", sukuma: "🥬", wiki: "🥬",
  grandson: "👦🏾", wife: "👩🏾", billion: "🔢", tote: "👜", bag: "👜",
  skirt: "👗", denim: "👖", wool: "🐑", outfit: "👕", clay: "🏺",
  mosquito: "🦟", tarmac: "🛣️", minibus: "🚐", bajaaj: "🛺",
  backpack: "🎒", balloon: "🎈", rollercoaster: "🎢", canopy: "🌳",
  mangrove: "🌳", sunlight: "☀️", toilet: "🚽", port: "⚓", quay: "⚓",
  trader: "💰", buyer: "🛒", biography: "📖", definition: "📖",
  liar: "🤥", gratitude: "🙏🏾", campaign: "📢", kerosene: "⛽",
  chain: "⛓️", software: "💻", internet: "🌐", link: "🔗", ink: "🖊️",
  lip: "👄", tyres: "🛞", selfie: "🤳", marker: "🖍️", hashtag: "#️⃣",
  destination: "📍", font: "🔤", vocabulary: "🔤", layout: "📐",
  millimetres: "📏", writer: "✍🏾", signature: "✍🏾",
  invitation: "✉️", thumbs: "👍🏾", locker: "🔒", disaster: "🌪️",
  quotation: "🗨️", sandal: "👡",
};

// Where one lemma is two different words.
//
// The map above has one entry per lemma, which is right until a grade teaches a
// DIFFERENT sense of the same spelling — and English does that on purpose, so
// the collisions are in the content rather than in this file:
//
//   light   Grade 1 teaches the red/amber/green signal; Grade 2 teaches
//           brightness and "not heavy"; Grades 3-4 teach "not heavy" alone.
//   march   Grade 1 teaches walking in step; Grade 3 teaches the month.
//   may     Grade 1, 2 and 4 teach asking permission; Grade 3 the month.
//   earth   Grade 1 teaches the soil in a garden; Grade 2 teaches the planet.
//   sink    Grade 1 teaches going under the water; Grades 2 and 4 the basin.
//   well    Grade 1 teaches the hole you draw water from; Grades 2-4 teach
//           "done in a good way".
//   stall   Grade 1 teaches the space in a barn; Grades 2-4 the market stand.
//   flat    Grades 1, 3 and 4 teach smooth and level; Grade 2 teaches the home.
//   lift    Grades 2 and 4 teach the machine; Grade 3 teaches picking up.
//
// A shared picture gets some of those grades wrong every time, so the sense is
// resolved per grade here. "" means this grade shows no picture — which is the
// right answer for "may", and for a verb like "sink" or "lift", where the
// honest picture would have to be an action rather than a thing.
//
// Every grade that draws pictures at all is listed. Grade 2's "light" keeps the
// bulb because the grade teaches BOTH senses under one lemma and the bulb is
// right for one of them; there is no per-entry resolution to be had, since both
// senses share a master entry.
// The second group is the one the Grade 1 pass did not predict: a word the
// course RE-TEACHES in a new sense two grades later, where the shared picture
// then describes the earlier lesson. These were found by comparing each
// pictured lemma's meaning across the grades that teach it, not by reading the
// map — the map looks right, because each picture is right for the grade it was
// written for.
//
//   left/right  a direction at Grade 1; "went away" and "correct" above it.
//   hard        not soft at Grade 1; difficult above it.
//   drop        a droplet at Grade 1; letting something fall above it.
//   like        to enjoy, until Grade 3 teaches "similar to".
//   point       the finger, until Grade 4 teaches "the main idea".
//   square      the shape, until Grade 4 teaches the town square.
//   head        the body part, until Grade 3 teaches the head of a school.
//   touch       the finger, until Grade 3 teaches "a finishing touch".
//   turn        to rotate, until Grade 3 teaches "your turn".
//   stand       to be on your feet, until Grade 3 teaches the market stand.
//   stop        to halt, until Grade 3 teaches the bus stop.
//   catch       to take hold, until Grade 3 teaches a fisherman's catch.
//   spin        to rotate, but Grade 2 teaches a spider spinning a web.
//   mask        the one over your mouth, until Grade 4's costume mask.
//   picking     fruit off a plant, until Grade 2's "picking up".
//   underground the city train, until Grade 4's "below the surface".
//
// Where the new sense has an honest picture of its own it gets one; where it
// does not, "" is the answer, and the word simply loses its picture in the
// grade that means something else by it.
export const GRADE_WORD_PICTURES = {
  1: { light: "🚦", march: "🚶🏾", earth: "🪴", may: "", sink: "", stall: "" },
  2: {
    may: "", well: "", flat: "🏢",
    left: "", right: "✅", hard: "", drop: "", round: "", picking: "", spin: "🕸️",
  },
  3: {
    light: "", well: "", lift: "",
    left: "", right: "✅", hard: "", drop: "", like: "", touch: "", head: "",
    turn: "", stand: "", stop: "🚏", catch: "🐟",
  },
  4: {
    light: "", well: "", may: "",
    left: "", right: "", hard: "", point: "", square: "", turn: "",
    underground: "", mask: "🎭",
  },
  // Grades 5-8 re-teach a third wave of these, and the pattern is consistent
  // enough to be worth naming: the upper grades take a concrete word a young
  // learner already knows and teach its ABSTRACT sense. "like" stops being
  // enjoyment and becomes "similar to" from Grade 5 on; "kind" becomes a type
  // rather than a feeling; "point" becomes the purpose; "draw" becomes drawing
  // a line between ideas; "square" becomes a place in a town; "roll" becomes a
  // print run; and Grade 8's "book" is the stage manager's record of a show.
  //
  // The picture that was right at Grade 1 is therefore not just imprecise up
  // here, it teaches the wrong sense of the word the lesson is about — which is
  // worse than no picture at exactly the age the learner is being asked to
  // notice the difference.
  //
  // "play" is the one that gets a new picture rather than none: a teddy bear is
  // honest for Grade 1's play and wrong for a Grade 8 who plays sport.
  // "may" is the clearest case of the pattern and the easiest to miss: it is the
  // month only at Grade 3. At 1, 2, 4, 5, 6, 7 and 8 it is the modal verb, and a
  // calendar beside it teaches the wrong word in seven grades out of eight.
  5: {
    like: "", kind: "", play: "",
    back: "", hard: "", left: "", lift: "", may: "", round: "", stand: "",
    right: "✅", stop: "🚏",
  },
  6: {
    like: "", kind: "", square: "", ruler: "👑", hunt: "🏹", play: "⚽",
    back: "", hard: "", left: "", may: "", right: "", stand: "", turn: "",
    spin: "🧵",
  },
  7: {
    like: "", point: "", square: "", roll: "", play: "⚽",
    hard: "", left: "", lift: "", may: "", right: "", round: "", well: "",
    stop: "🚏",
  },
  8: {
    like: "", kind: "", point: "", book: "", draw: "", drawn: "", play: "⚽",
    hard: "", left: "", may: "", round: "", turn: "", well: "", little: "",
    travel: "", right: "✅",
  },
};

/**
 * The picture for a word, or "" when there is no honest one.
 * Pass the grade number to get that grade's sense where the two differ.
 */
export function wordPicture(word, grade) {
  const key = String(word || "").trim().toLowerCase();
  const perGrade = GRADE_WORD_PICTURES[grade];
  if (perGrade && Object.prototype.hasOwnProperty.call(perGrade, key)) return perGrade[key];
  return WORD_PICTURES[key] || "";
}
