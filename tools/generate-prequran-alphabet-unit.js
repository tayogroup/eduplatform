#!/usr/bin/env node
// Generates PreQuraan Level 0 · Unit 1 (The Arabic Alphabet) — the FIRST unit
// of the Quraan Academy fresh build (Option B: per-level courses,
// qrn-prequran-lNN). Emits the unified-shell data contract:
//   src/prototypes/quraan-academy/prequran/grade-0/data/course-manifest.json
//   src/prototypes/quraan-academy/prequran/grade-0/data/units/unit-1.json
//
// The letter/animal/word DATA originates from the legacy alphabet unit
// (src/units/alphabet/unit.config.js) — content is an asset, code is not.
// Media descriptors use the CANONICAL fresh layout (audio/letters/…,
// video/articulation/…); the subject module maps them to the legacy folder
// names in local dev until the media library is re-uploaded canonically.
// Note: the folder is grade-0/ (shell-core convention gNN) but the SEMANTIC
// label is Level 0 — the manifest carries the truth.
//
// Byte-stable output (no timestamps) so reruns only change on real edits.
// Usage: node tools/generate-prequran-alphabet-unit.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src", "prototypes", "quraan-academy", "prequran", "grade-0", "data");

const pad2 = (n) => String(n).padStart(2, "0");

// ---- letters (glyph, name, grid position, articulation) --------------------
// row/col reproduce the traditional 4-per-row RTL board (col 4 = rightmost).
const LETTERS = [
  [1,  "ا", "alif",  1, 4, "Alif / hamzah starts from the deepest throat; stop the airflow gently, then release the sound."],
  [2,  "ب", "ba",    1, 3, "Ba is made by closing both lips, holding the air for a moment, then releasing it."],
  [3,  "ت", "ta",    1, 2, "Ta is made when the tongue tip touches the gum ridge behind the upper front teeth."],
  [4,  "ث", "tha",   1, 1, "Tha is made by placing the tongue tip lightly between the teeth and letting air pass."],
  [5,  "ج", "jeem",  2, 4, "Jeem is made from the middle of the tongue touching the middle of the upper palate."],
  [6,  "ح", "ha",    2, 3, "Ha is made from the middle throat with an open, breathy sound."],
  [7,  "خ", "kha",   2, 2, "Kha is made from the upper throat with a rough, airy sound."],
  [8,  "د", "dal",   2, 1, "Dal is made when the tongue tip touches the gum ridge behind the upper front teeth."],
  [9,  "ذ", "dhal",  3, 4, "Dhal is made by placing the tongue tip lightly between the teeth and vibrating the voice."],
  [10, "ر", "ra",    3, 3, "Ra is made with the tongue tip near the gum ridge, allowing a light tap or trill."],
  [11, "ز", "zay",   3, 2, "Zay is made by bringing the tongue near the lower front teeth and letting a buzzing sound pass."],
  [12, "س", "seen",  3, 1, "Seen is made by bringing the tongue near the lower front teeth and letting a clear hiss pass."],
  [13, "ش", "sheen", 4, 4, "Sheen is made from the middle of the tongue near the upper palate with spread airflow."],
  [14, "ص", "sad",   4, 3, "Sad is made like Seen, but with a heavier, fuller sound from the back of the mouth."],
  [15, "ض", "dad",   4, 2, "Dad is made from the side of the tongue touching the upper molars, with a heavy sound."],
  [16, "ط", "ta (heavy)", 4, 1, "Ta is made like Ta, but heavier; raise the back of the tongue to make a full sound."],
  [17, "ظ", "za",    5, 4, "Za is made like Dhal, but heavier; place the tongue near the teeth and keep the sound full."],
  [18, "ع", "ayn",   5, 3, "Ayn is made from the middle throat with a pressed, voiced sound."],
  [19, "غ", "ghayn", 5, 2, "Ghayn is made from the upper throat with a voiced, rough sound."],
  [20, "ف", "fa",    5, 1, "Fa is made by touching the upper front teeth to the lower lip and letting air pass."],
  [21, "ق", "qaf",   6, 4, "Qaf is made from the back of the tongue touching the soft palate, with a deep sound."],
  [22, "ك", "kaf",   6, 3, "Kaf is made from the back of the tongue touching the upper palate, lighter than Qaf."],
  [23, "ل", "lam",   6, 2, "Lam is made when the tongue tip and sides touch the gum ridge near the upper front teeth."],
  [24, "م", "meem",  6, 1, "Meem is made by closing both lips and letting the sound pass through the nose."],
  [25, "ن", "noon",  7, 4, "Noon is made with the tongue tip on the gum ridge while the sound passes through the nose."],
  [26, "ه", "ha (soft)", 7, 3, "Ha is made from the deepest throat with a soft, open breath."],
  [27, "و", "waw",   7, 2, "Waw is made by rounding both lips while the voice flows smoothly."],
  [28, "ي", "ya",    7, 1, "Ya is made from the middle of the tongue near the upper palate while the voice flows."],
  [29, "ء", "hamza", 8, 4, "Hamzah starts from the deepest throat; stop the airflow gently, then release the sound."],
];

// ---- Listen+ animal companions (English initial-sound bridge) --------------
const ANIMALS = [
  ["A", "Alligator", "a_alligator"], ["B", "Bear", "b_bear"], ["T", "Tiger", "t_tiger"],
  ["Th", "Thornbill", "th_thornbill"], ["J", "Jaguar", "j_jaguar"], ["H", "Horse", "h_horse"],
  ["Kh", "Kangaroo", "kh_kangaroo"], ["D", "Duck", "d_duck"], ["Dh", "Dhole", "dh_dhole"],
  ["R", "Rabbit", "r_rabbit"], ["Z", "Zebra", "z_zebra"], ["S", "Snake", "s_snake"],
  ["Sh", "Shark", "sh_shark"], ["S", "Seal", "s_seal"], ["D", "Deer", "d_deer"],
  ["T", "Turtle", "t_turtle"], ["Z", "Zebu", "z_zebu"], ["A", "Ant", "a_ant"],
  ["Gh", "Goat", "gh_goat"], ["F", "Fox", "f_fox"], ["Q", "Quail", "q_quail"],
  ["K", "Koala", "k_koala"], ["L", "Lion", "l_lion"], ["M", "Monkey", "m_monkey"],
  ["N", "Newt", "n_newt"], ["H", "Hippo", "h_hippo"], ["W", "Wolf", "w_wolf"],
  ["Y", "Yak", "y_yak"], ["A", "Ape", "a_ape"],
];

// ---- first-word vocabulary (letter → Arabic word) --------------------------
// [arabic, key, transliteration, english]. The hamza image key reuses
// r_rabbit — a legacy media quirk kept until the library is re-cut.
const WORDS = [
  ["أسد", "alif_asad", "asad", "lion"], ["بطة", "ba_batta", "batta", "duck"],
  ["تمر", "ta_tamr", "tamr", "dates"], ["ثعلب", "tha_thalab", "tha'lab", "fox"],
  ["جمل", "jim_jamal", "jamal", "camel"], ["حصان", "ha_hisan", "hisan", "horse"],
  ["خروف", "kha_kharuf", "kharuf", "sheep"], ["دجاجة", "dal_dajaja", "dajaja", "hen"],
  ["ذرة", "dhal_dhurra", "dhurra", "corn"], ["رمان", "ra_rumman", "rumman", "pomegranate"],
  ["زرافة", "zay_zarafa", "zarafa", "giraffe"], ["سمكة", "sin_samaka", "samaka", "fish"],
  ["شمس", "shin_shams", "shams", "sun"], ["صقر", "sad_saqr", "saqr", "falcon"],
  ["ضفدع", "dad_difda", "difda'", "frog"], ["طائرة", "ta_taira", "ta'ira", "airplane"],
  ["ظرف", "za_zarf", "zarf", "envelope"], ["عنب", "ayn_inab", "'inab", "grapes"],
  ["غزال", "ghayn_ghazal", "ghazal", "gazelle"], ["فيل", "fa_fil", "fil", "elephant"],
  ["قطة", "qaf_qitta", "qitta", "cat"], ["كلب", "kaf_kalb", "kalb", "dog"],
  ["ليمون", "lam_laymun", "laymun", "lemon"], ["موز", "mim_mawz", "mawz", "banana"],
  ["نحلة", "nun_nahla", "nahla", "bee"], ["هدهد", "ha_hudhud", "hudhud", "hoopoe"],
  ["وردة", "waw_warda", "warda", "rose"], ["يد", "ya_yad", "yad", "hand"],
  ["أرنب", "hamza_arnab", "arnab", "rabbit"],
];
// Legacy media quirk: the hamza WORD IMAGE file is r_rabbit.png.
const WORD_IMAGE_OVERRIDES = { hamza_arnab: "r_rabbit" };

// ---- transliteration (curriculum-approved 2026-07-23) ----------------------
// Standard marks distinguish the pairs English conflates: t/ṭ, s/ṣ, d/ḍ, z/ẓ,
// ḥ/h, ʾ/ʿ. The animal stays as the child-friendly anchor for the base sound;
// the explainer (spoken after the letter name plays) makes the mapping honest:
// English letters are helpers, the recorded Arabic sound is the authority.
const TRANSLITERATIONS = [
  "a", "b", "t", "th", "j", "ḥ", "kh", "d", "dh", "r", "z", "s", "sh", "ṣ",
  "ḍ", "ṭ", "ẓ", "ʿ", "gh", "f", "q", "k", "l", "m", "n", "h", "w", "y", "ʾ",
];
const TRANSLIT_NOTES = {
  6: "ḥ has a little dot because it is deeper and breathier than the English h.",
  14: "ṣ has a dot because it is the heavy s — fuller and deeper than a normal s.",
  15: "ḍ has a dot because it is the heavy d — a sound English does not have.",
  16: "ṭ has a dot because it is the heavy t — deeper than the light t.",
  17: "ẓ has a dot because it is the heavy z — full and deep.",
  18: "ʿ is a special mark, because ayn is a deep throat sound that English letters cannot write.",
  29: "ʾ is a special mark for the little stop sound — like the tiny pause in \"uh-oh\".",
};
const TRANSLIT_MARK_ONLY = new Set([18, 29]); // ayn + hamza: no English look-alike

// ---- letter groups (tajweed-relevant sets, from curriculum) ----------------
const GROUPS = {
  vowels: [1, 27, 28],
  heavy: [7, 14, 15, 16, 17, 19, 21],
  light: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 18, 20, 22, 23, 24, 25, 26],
  distinctions: [7, 14, 15, 21],
};

const letters = LETTERS.map(([n, glyph, name, row, col, articulation], i) => {
  const id = `alph_${pad2(n)}`;
  const [animalInitial, animalName, animalKey] = ANIMALS[i];
  const [wordArabic, wordKey, translit, english] = WORDS[i];
  const latin = TRANSLITERATIONS[i];
  const note = TRANSLIT_NOTES[n] || "";
  const markOnly = TRANSLIT_MARK_ONLY.has(n);
  const simile = markOnly
    ? "a special Arabic sound with no English look-alike"
    : `like the ${animalInitial.toLowerCase()} in ${animalName}`;
  const explainer = markOnly
    ? `You heard the Arabic sound ${name}. In English letters we write it with the special mark ${latin}. ${note} The English letters are only helpers — the real sound is the one you heard.`
    : `You heard the Arabic sound ${name}. In English letters we write it as ${latin} — like the ${animalInitial.toLowerCase()} in ${animalName}.${note ? " " + note : ""} The English letters are only helpers — the real sound is the one you heard.`;
  return {
    id,
    number: n,
    glyph,
    name,
    row,
    col,
    articulation,
    transliteration: { latin, simile, explainer },
    media: {
      name: `audio/letters/${id}.mp3`,
      sound: `audio/sounds/${id}.mp3`,
      articulationVideo: `video/articulation/${id}.mp4`,
      writingVideo: `video/writing/${id}.mp4`,
      articulationAudio: `audio/captions/${id}.mp3`,
    },
    animal: {
      initial: animalInitial,
      label: animalName,
      image: `images/animals/${animalKey}.png`,
      audio: `audio/animals/${animalKey}.mp3`,
    },
    word: {
      arabic: wordArabic,
      transliteration: translit,
      english,
      // English explainer (spoken by shell TTS after the recorded Arabic word
      // plays). Romanized only — Arabic script is never sent to TTS; the word's
      // authentic pronunciation is the recorded audio.
      explainer: `This word is ${translit}. It means ${english}, and it begins with the letter ${name}. Try saying it with me: ${translit}.`,
      image: `images/words/${WORD_IMAGE_OVERRIDES[wordKey] || wordKey}.png`,
      audio: `audio/words/${wordKey}.mp3`,
    },
    // English explainer for the "Now let's write it!" slide (spoken by shell
    // TTS). Deliberately does NOT prescribe per-letter stroke order (that is
    // curriculum content we do not hold) — it gives the honest, universal guide
    // (Arabic is right-to-left; follow the pen; trace it) and is romanized only
    // so no Arabic script is ever sent to TTS.
    writing: {
      explainer: `To write ${name}, remember that Arabic is written from right to left, so we start on the right side. Watch the pen in the video from the very start to the very end, then trace ${name} in the air with your finger.`,
    },
  };
});

const unit = {
  schemaVersion: 1,
  id: "qrn-prequran-l00-u01",
  unit: 1,
  level: 0,
  subject: "prequran",
  title: "The Arabic Alphabet",
  arabicTitle: "الحروف الهجائية",
  summary: "Meet all 29 Arabic letters: how each one looks, sounds, and is made — with a familiar animal sound bridge and a first Arabic word for every letter.",
  provenance: {
    source: "Quraan Academy legacy alphabet unit (content only; fresh build 2026-07)",
    mediaLibrary: "recorded human audio/video — never synthesized",
  },
  // Repetition config per section (the legacy "passes/repeats per step", now
  // data-driven so a curriculum author tunes it without touching code).
  //   passes  = full loops through the letter set
  //   filter  = all | heavy | light | vowels | distinctions  (uses groups)
  //   play    = name | sound | both   (which recorded audio per letter)
  //   repeats = plays per letter within a pass
  //   gapMs   = pause between letters
  //   echo    = insert a "your turn — say it" pause after each letter
  practice: {
    listen: { passes: 2, filter: "all", play: "name", repeats: 1, gapMs: 700, echo: false },
  },
  groups: GROUPS,
  letters,
};

const manifest = {
  schemaVersion: 1,
  school: "Quraan Academy",
  subject: "prequran",
  stage: { id: 0, label: "Level 0 — Letters" },
  courseKey: "qrn-prequran-l00",
  defaultUnit: 1,
  units: [
    {
      number: 1,
      id: "qrn-prequran-l00-u01",
      title: "The Arabic Alphabet",
      data: "units/unit-1.json",
      implementationStatus: "in_progress",
      reviewStatus: "draft",
    },
    {
      number: 2,
      id: "qrn-prequran-l00-u02",
      title: "Connected Letter Forms",
      data: "units/unit-2.json",
      implementationStatus: "planned",
      reviewStatus: "not_started",
    },
  ],
};

fs.mkdirSync(path.join(OUT_DIR, "units"), { recursive: true });
const write = (file, data) => {
  const target = path.join(OUT_DIR, file);
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`${file}  (${fs.statSync(target).size} bytes)`);
};
write("course-manifest.json", manifest);
write(path.join("units", "unit-1.json"), unit);
console.log(`letters: ${letters.length} | groups: ${Object.keys(GROUPS).join(", ")}`);
