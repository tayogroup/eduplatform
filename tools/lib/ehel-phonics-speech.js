"use strict";

/**
 * What the Phonics level's narration SAYS, where it differs from what it shows.
 *
 * The level's first rule is "say the sound, not the letter name" — Unit 2 opens
 * on it and every card repeats it — and a text-to-speech voice does the
 * opposite by default. Handed `c.` it says "see"; handed `c. a. t.` it spells
 * "see, ay, tee"; handed `Say the sound. s. Not the name.` it says, measured,
 * "Say the sound, ESS, not the name." Before this module, 445 of the level's
 * 1,298 clips — 63% of its characters, and all twenty lectures — carried text
 * the voice would have read as letter names.
 *
 * So, exactly like `passageScriptSpeech` and `speechSpelling` elsewhere, this
 * changes only what is SENT to the voice. The page still shows `c. a. t.`, and
 * the clip is still named cyrb53(displayed text), so nothing here can rename or
 * re-key a clip. It applies to the Phonics level alone (`levelId === "lph"`):
 * in Levels 0-3 "the letter s" really does mean "ess", and they were proven to
 * send byte-identical text before and after this module (9,896 clips, 0 moved).
 *
 * TWO BOOKS, TWO DEFAULTS. Units 1-14 (Book A) teach new SOUNDS, so a grapheme
 * in a sentence is its sound: "Cat starts with kuh", "Shop starts with shh".
 * Units 15-20 (Book B, and the handover) teach new SPELLINGS of sounds already
 * known, so a grapheme in a sentence is a spelling and is said by its letters:
 * "Home has O gap E in it", "Toe ends with O E" — "gap" being Unit 15's own
 * word for the underscore. Voicing Book B by sound was measured on all 683
 * changed sentences and produced things like "Soft kuh" for a soft c, which
 * contradicts itself, and "No English word ends with A" for `ai`, which is
 * false as a sound (`day`). In BOTH books a blend, a drill after "Say", and
 * whatever follows "says", "long" or "short" is a sound.
 *
 * THE SPELLINGS ARE MEASURED, NOT GUESSED (the house rule in lib/ehel-tts.js).
 * Each was synthesised with the course's own voice and model and scored with
 * local Whisper, which ranks candidate transcripts against the audio rather than
 * transcribing sub-second clips (it hallucinates on those). Every candidate was
 * tested INSIDE a sentence, because that is how the level uses them and because
 * this voice is erratic on an isolated token — the same `sss.` scored differently
 * on two takes alone and came back "Tsss" every time in a sentence. Controls ran
 * beside them: the naive `c.`, `s.`, `t.` and `c. a. t.` came back as letter
 * names every time, which is what shows the check could see the defect at all.
 *
 *   long a       `ay` is read "aye", the WRONG vowel. The capital `A` is read as
 *                its name, and the long a IS its name ("the vowel says its
 *                name", Unit 13), so that is the spelling.
 *   short i      no spelling survives alone: `ih`, `ih!`, `ɪ`, `ii` all came back
 *                "I", even at a sentence end ("Pin has I"). Between consonant
 *                sounds it does ("sss, ih, tuh" was heard "sysita, sit"), so it
 *                is kept for blends, and the few isolated drills say WORDS.
 *   short o      `o` is "oh" (the long o). `aw` is the closest the voice gets.
 *   v, z, l, f   `vvv`, `zzz`, `lll` read as letter names in a sentence ("V. Say
 *                it with me. V, V."); `vuh`, `zz`, `luh`, `fuh` do not. `sss`,
 *                `mmm`, `nnn`, `rrr` and `shh` survive as they are.
 *   qu, nk, ng   `kw` and `nk` were spelled out as names ("K-W", "N-K");
 *                `kwah`, `unk` and `ung` were not.
 *   er, ir, ur   `err` is read as the VERB in a sentence, pronounced "air" —
 *                "Bird has err in it." came back "Bird has air in it." on
 *                recorded clips. `urr` held in every shape tested.
 *
 * The VOICE matters too. The same lines in the `alice` voice — which this course
 * records word cards and word sentences in — turned short o into the long o
 * ("aw, as in on" -> "Oh, as in on") and `sss` into "is". So a Phonics clip that
 * carries a respelling is recorded in the standard voice; see `carriesSound`.
 */

// Grapheme -> the spelling this voice says as that sound.
const SOUND = new Map([
  ["s", "sss"], ["a", "ah"], ["t", "tuh"], ["n", "nnn"], ["i", "ih"], ["p", "puh"],
  ["o", "aw"], ["g", "guh"], ["d", "duh"], ["m", "mmm"], ["c", "kuh"], ["k", "kuh"],
  ["r", "rrr"], ["e", "eh"], ["u", "uh"], ["h", "huh"], ["b", "buh"], ["l", "luh"],
  ["f", "fuh"], ["j", "juh"], ["v", "vuh"], ["w", "wuh"], ["x", "ks"], ["y", "yuh"],
  ["z", "zz"],
  ["ck", "kuh"], ["ll", "luh"], ["ff", "fuh"], ["ss", "sss"], ["zz", "zz"], ["qu", "kwah"],
  ["ng", "ung"], ["nk", "unk"], ["th", "th"], ["sh", "shh"], ["ch", "chuh"],
  ["ph", "fuh"], ["wh", "wuh"],
  ["ai", "A"], ["ay", "A"], ["a_e", "A"],
  ["ee", "ee"], ["ea", "ee"],
  ["ie", "eye"], ["igh", "eye"], ["i_e", "eye"],
  ["oa", "oh"], ["oe", "oh"], ["o_e", "oh"],
  ["oo", "ooh"], ["ue", "yoo"], ["ew", "yoo"], ["u_e", "yoo"],
  ["ar", "ar"], ["or", "or"], ["aw", "or"], ["ore", "or"],
  ["er", "urr"], ["ir", "urr"], ["ur", "urr"],
  ["ow", "ow"], ["ou", "ow"], ["oi", "oy"], ["oy", "oy"],
  ["ear", "ear"], ["eer", "ear"], ["air", "air"], ["are", "air"],
]);

// "Long a is in wait" names the LONG vowel; a lone vowel letter's entry above is
// its short sound. The long vowel is also its name — the rule Unit 13 teaches.
const LONG_VOWEL = new Map([["a", "A"], ["e", "ee"], ["i", "eye"], ["o", "oh"], ["u", "yoo"]]);

// The source's own stretched spellings. Four read as letter names in a
// sentence, so they become the forms measured not to.
const STRETCHED = new Map([["lll", "luh"], ["fff", "fuh"], ["zzz", "zz"], ["vvv", "vuh"]]);
// Already sounds as written, and allowed to sit in a run of sounds.
const SOUND_WORDS = new Set(["sss", "mmm", "nnn", "rrr", "shh", ...STRETCHED.keys()]);

// A grapheme said by its letters: `a_e` -> "A gap E", `ck` -> "C K". Spaces,
// never hyphens: lib/ehel-tts.js reads a hyphen between two letters as a range
// ("A-Z" -> "A to Z"). Measured: "O R, A W and O R E" came back spelled, and
// "U R" as "you are", which is those two letters' names.
const spelled = (g) => g.split("").map((ch) => (ch === "_" ? "gap" : ch.toUpperCase())).join(" ");

const G_ALT = [...SOUND.keys(), ...SOUND_WORDS].sort((a, b) => b.length - a.length)
  .map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
// A grapheme standing as a word, lower case or opening a sentence ("Ir", "Oa").
const G = `(?:${G_ALT}|(?:${G_ALT.split("|").filter((g) => g.length > 1).map((g) => g[0].toUpperCase() + g.slice(1)).join("|")}))`;
const NOT_WORD_BEFORE = "(?<![A-Za-z_'\\u2019])";
const NOT_WORD_AFTER = "(?![A-Za-z_'\\u2019])";

// English words spelled like a grapheme. `or`, `ear`, `air`, `ow` respell to
// themselves in Book A, so either reading is harmless there. The article `a`
// and the verb `are` are not, and neither is any of them in Book B, where a
// grapheme is SPELLED — "or" the conjunction must not become "O R".
const ALSO_A_WORD = new Set(["a", "are", "or", "ear", "air", "ow", "oh"]);

/**
 * The shapes, tried in this order at every position, in ONE pass. One pass is
 * load-bearing: respelling is not idempotent (short o is `aw`, and `aw` is a
 * grapheme), and a second pass turned `d-o-g` into "duh, or, guh".
 *
 *   split     `s - a - t`                        sounds, both books
 *   blend     `p-i-n`                            sounds, both books
 *   list      `ai, ay or a_e`, `c and k`         Book A: sounds, unless two of
 *                                                them share a sound — then it is
 *                                                about SPELLING and is spelled.
 *                                                Book B: spelled.
 *   run       `n. a_e. m.`, `a_e ay`             sounds, both books: a lecture
 *                                                blend, or a list to repeat
 *   word      one grapheme                       see respellWord
 */
const SEP = "(?:, and |, or |, | and | or | then )";
const SHAPES = new RegExp([
  `(${NOT_WORD_BEFORE}[A-Za-z_][a-z_]{0,3}(?: - [a-z_]{1,4})+${NOT_WORD_AFTER})`,
  `(${NOT_WORD_BEFORE}[a-z_]{1,3}(?:-[a-z_]{1,3})+${NOT_WORD_AFTER})`,
  `(${NOT_WORD_BEFORE}${G}(?:${SEP}${G})+${NOT_WORD_AFTER})`,
  `(${NOT_WORD_BEFORE}${G}(?:\\.? ${G})+${NOT_WORD_AFTER}\\.?)`,
  "([A-Za-z_]+(?:['\\u2019][A-Za-z]+)*)",
].join("|"), "g");

/**
 * The sounds of one blend, part by part, with the three letter rules the level
 * itself teaches — so a blend follows them rather than a list of exceptions
 * (the first draft patched these one word at a time, and a patch for `age`
 * fired inside `page` and left "P - A, juh"):
 *
 *   c before e, i or y is soft               c-i-t-y -> sss   (Unit 19)
 *   g ending a word after a split vowel      a_e-g   -> juh   (age, page)
 *     — and ONLY there: g before e is hard in get, give, girl, gift, so the
 *     general rule would have taught `get` as "jet"
 *   y ending a word is a vowel: long i in a  m-y     -> eye   (Unit 16)
 *     one-vowel word, long e in a longer one c-i-t-y -> ee    (Unit 19)
 */
function soundsOfBlend(parts) {
  const last = parts.length - 1;
  return parts.map((raw, i) => {
    const p = i === 0 ? lower(raw) : raw;                 // "J - u_e - n": June's capital
    if (p === "c" && /^[eiy]/.test(parts[i + 1] || "")) return "sss";
    if (p === "g" && i === last && /_e$/.test(parts[i - 1] || "")) return "juh";
    if (p === "y" && i === last && i > 0) return parts.slice(0, i).some((q) => /[aeiou]/.test(q)) ? "ee" : "eye";
    return SOUND.get(p) || STRETCHED.get(p);
  });
}

const isSentenceCapital = (w) => w.length > 1 && w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase();
const lower = (w) => w.toLowerCase();

/**
 * Is this lowercase `a` the short-a SOUND rather than the article?
 * The article is always followed by the word it introduces ("a bit of cash").
 * The sound is followed by punctuation ("a. a. a."), or named ("short a",
 * "the a"). Measured on the level: 60 of the first shape, 257 articles.
 */
function aIsSound(text, start, end) {
  if (end === text.length || /^(?:[.,!?;:]| -)/.test(text.slice(end, end + 2))) return true;
  return /\b(?:[Ss]hort|[Ll]ong|[Tt]he) $/.test(text.slice(Math.max(0, start - 7), start));
}

function respellWord(word, offset, whole, spelling) {
  if (STRETCHED.has(word)) return STRETCHED.get(word);
  const g = lower(word);
  if (!SOUND.has(g)) return word;
  const upper = word !== g;
  if (upper && !isSentenceCapital(word)) return word;            // "S", "A": a letter NAME
  if (g === "are") return word;                                   // the verb, always
  if (g === "a" && !upper && !aIsSound(whole, offset, offset + 1)) return word;
  const before = whole.slice(Math.max(0, offset - 12), offset);
  const cap = (s) => (upper ? s[0].toUpperCase() + s.slice(1) : s);
  if (/\b[Ll]ong $/.test(before) && LONG_VOWEL.has(g)) return LONG_VOWEL.get(g);
  if (/\b(?:[Ss]ay|says|[Ss]hort) $/.test(before)) return cap(SOUND.get(g));
  if (/\bthe letters $/.test(before)) return spelled(g);
  if (spelling) return ALSO_A_WORD.has(g) && g !== "a" ? word : spelled(g);
  return cap(SOUND.get(g));
}

const sep = (m) => m.match(new RegExp(SEP, "g")) || [];

function respellList(m, spelling) {
  const parts = m.split(new RegExp(SEP));
  const glue = sep(m);
  const sounds = parts.map((p) => SOUND.get(lower(p)) || STRETCHED.get(lower(p)) || p);
  // Two members sharing a sound means the list is naming SPELLINGS of one
  // sound ("ir and er say one sound"), and a spelling is said by its letters.
  const collide = new Set(sounds.map(lower)).size < sounds.length;
  // A list of "or"s and "a"s is probably English, not graphemes ("on a mat or
  // a bus"). Only lists whose members are all graphemes that are not also
  // everyday words — or that contain at least one that is not — are taken.
  if (parts.every((p) => ALSO_A_WORD.has(lower(p)))) return null;
  // Book B always, Book A on a collision. Even after "say": "then say ir or
  // er" asks the learner which SPELLING, and a spelling is said by its letters.
  const said = spelling || collide
    ? parts.map((p) => (SOUND.has(lower(p)) ? spelled(lower(p)) : p))
    : sounds.map((s, i) => (i === 0 && isSentenceCapital(parts[0]) ? s[0].toUpperCase() + s.slice(1) : s));
  return said.reduce((out, p, i) => out + p + (glue[i] || ""), "");
}

function respellRun(m) {
  const trailing = m.endsWith(".") ? "." : "";
  const body = trailing ? m.slice(0, -1) : m;
  const dotted = body.includes(". ");
  const parts = body.split(dotted ? ". " : " ");
  // `or a` in ordinary prose is two graphemes by spelling and no run at all.
  if (parts.length < 3 && parts.some((p) => ALSO_A_WORD.has(lower(p)))) return null;
  const said = parts.map((p) => {
    const g = lower(p);
    const s = STRETCHED.get(g) || SOUND.get(g) || p;
    return isSentenceCapital(p) ? s[0].toUpperCase() + s.slice(1) : s;
  });
  return said.join(dotted ? ". " : " ") + trailing;
}

/**
 * Whole phrases, rewritten before any shape is tried and parked so nothing
 * reaches inside them. Found by running the transform over every clip and
 * reading all 683 sentences it changed (tools/audit-phonics-speech.js lists
 * them and fails on the shapes that mean the voice says the wrong thing). Each
 * is an exact substring of the CLEANED clip text; one that matches nothing is
 * reported by the audit as stale. Longest first, so a longer phrase is never
 * pre-empted by one it contains (`p - a_e - g` holds `a_e - g`).
 */
const PHRASES = [
  // Book A — capitals that mean SOUNDS (Unit 1 counts the sounds of "cat")
  ["C. A. T.", "kuh. ah. tuh."],
  ["U. P.", "uh. puh."],
  // short i: nothing voices it alone, so the drills say words that carry it
  ["First. i. Short. i. Say it with me. i. i. i.", "First. A short sound, the one in the middle of pin. Say it with me. in. it. pin."],
  ["Say i, short and quick.", "Say the sound in it, short and quick."],
  ["i is the sound in it.", "It is the first sound in it."],
  ["The i has a dot on top.", "The I has a dot on top."],
  ["The i has a dot.", "The I has a dot."],
  ["Pin has i.", "Pin has the sound in it."],
  ["pin has i.", "pin has the sound in it."],
  // ...and in LISTS, which the recorded audio proved: Unit 3's own intro came
  // back "Eye and poo. New sounds. Eye. Pooh." for "i and p. New sounds: i, p."
  // The audit's SHORT_I check finds every lone `ih`; each one is here.
  ["i and p.", "the sound in pin, and puh."],
  ["New sounds: i, p.", "New sounds: the sound in pin, and puh."],
  ["The new sounds: i, p.", "The new sounds: the sound in pin, and puh."],
  ["Joining i, p into words.", "Joining the sound in pin and puh into words."],
  ["Writing words with i, p.", "Writing words with the sound in pin and puh."],
  ["each sound. i p Say", "each sound. The sound in pin. puh. Say"],
  ["Trace the letter i.", "Trace this letter."],
  ["Not o then i.", "Not aw, then the sound in pin."],
  // Unit 10 writes the qu sound as `kw`, which the voice spells "K-W" (measured);
  // `kwah` is what it says as the sound, and between it and `zz` the i blends.
  ["Quiz. kw. i. zzz.", "Quiz. kwah. ih. zz."],
  // the five vowels are introduced as LETTERS, a set to count
  ["count what you know. a. e. i. o. u.", "count what you know. A. E. I. O. U."],
  ["Say them with me. a. e. i. o. u.", "Say them with me. A. E. I. O. U."],
  ["The vowels are a e i o u.", "The vowels are A, E, I, O, U."],
  // letters meant as letters
  ["Not s, i, n, g.", "Not S, I, N, G."],
  ["The c and the k are one sound together.", "The C and the K are one sound together."],
  ["cat, can, cap use c.", "cat, can, cap use C."],
  ["kit, kid use k.", "kit, kid use K."],
  ["We write ck.", "We write C K."],
  ["There, ck was two letters and ONE sound.", "There, C K was two letters and one sound."],
  ["It always has a u after it.", "It always has a U after it."],
  ["qu says kw.", "Q U says kwah."],
  ["That is the letter a, long.", "That is the letter A, long."],
  ["That is e, long.", "That is E, long."],
  ["That is i, long.", "That is I, long."],
  ["That is o, long.", "That is O, long."],
  ["It is a in its own name.", "It is A in its own name."],
  ["It is e in its own name.", "It is E in its own name."],
  ["It is i in its own name.", "It is I in its own name."],
  ["It is o in its own name.", "It is O in its own name."],
  ["Say oo, short, as in foot.", "Say it short, as in foot."],
  // Unit 8's title names LETTER PAIRS ("Double Letters: ..."), so its spellings
  // are said by their letters; the unit then teaches what each pair sounds like.
  ["Double Letters: ck ll ff ss", "Double Letters: C K, L L, F F, S S"],
  // Book A title lists where two letters share a sound and the title says
  // "sounds": the shared sound IS the lesson (c and k, z and zz, ir and er)
  ["m, c, k", "mmm, kuh, kuh"],
  ["y, z, zz, qu", "yuh, zz, zz, kwah"],
  ["ar, or, ir, er, ow, oi", "ar, or, urr, urr, ow, oy"],
  // notices laid out as tables, flattened by the voice
  ["ck ll ff ss -> ONE sound st tr cl sw -> TWO sounds", "C K, L L, F F and S S: one sound each. S T, T R, C L and S W: two sounds each."],
  ["si-ng the sound stays open si-nk it shuts with a k", "sing: the sound stays open. sink: it shuts with a kuh."],
  ["ai rain, wait middle ay day, pay end a_e name, late middle, silent e", "A I: rain, wait, in the middle. A Y: day, pay, at the end. A gap E: name, late, in the middle, with a silent E."],
  ["ie pie at the end i_e time middle, silent e igh night before t y my at the end", "I E: pie, at the end. I gap E: time, in the middle, with a silent E. I G H: night, before T. Y: my, at the end."],
  ["ir ur er bird, turn, her or aw ore fork, saw, more ow ou cow, house oi oy coin, boy", "I R, U R and E R: bird, turn, her. O R, A W and O R E: fork, saw, more. O W and O U: cow, house. O I and O Y: coin, boy."],
  // June's capital J, in a lecture run (the split form is handled by the rule)
  ["J. u_e. n.", "juh. yoo. nnn."],
  // `giant` (gi - ant) blends in Practice 2 only, which is not narrated. The
  // standalone app WILL speak practice lines as slide labels, so when it is
  // built its labels need this module too (see appSlideClips).
  ["Then say or or er.", "Then say O R, or E R."],
].sort((a, b) => b[0].length - a[0].length);

/**
 * Every grapheme a sentence uses, voiced as its sound or its letters.
 * `spelling`: Book B's default (units 15-20); see the header.
 */
function speakablePhonics(text, { spelling = false } = {}) {
  const parked = [];
  let s = String(text);
  for (const [from, to] of PHRASES) {
    if (!s.includes(from)) continue;
    s = s.split(from).join(`\u0000${parked.length}\u0000`);
    parked.push(to);
  }
  s = s.replace(SHAPES, (m, split, blend, list, run, word, offset, whole) => {
    if (split || blend) {
      const parts = m.split(split ? " - " : "-");
      return parts.every((p, i) => SOUND.has(i === 0 ? lower(p) : p) || STRETCHED.has(p))
        ? soundsOfBlend(parts).join(", ") : m;
    }
    if (list) return respellList(m, spelling)
      ?? m.replace(/[A-Za-z_]+/g, (w, o) => respellWord(w, offset + o, whole, spelling));
    if (run) return respellRun(m)
      ?? m.replace(/[A-Za-z_]+/g, (w, o) => respellWord(w, offset + o, whole, spelling));
    return respellWord(word, offset, whole, spelling);
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => parked[Number(i)]);
}

/**
 * The spoken form of a grapheme's WORD CARD — the headword the learner taps to
 * hear what `ng` sounds like. Anchored to the word its own entry uses ("The word
 * sing has ng in it." -> "ung, as in sing."), because an isolated token is where
 * this voice is least reliable and because a sound beside a word it lives in is
 * the better card. Short i and short o say the word alone ("The sound in pin.").
 */
function phonicsWordCard(grapheme, exampleSentence) {
  const anchor = (String(exampleSentence || "").match(/\bThe word (\w+)/) || [])[1];
  const sound = SOUND.get(grapheme);
  if (!sound) return null;
  if (grapheme === "i" || grapheme === "o") return anchor ? `The sound in ${anchor}. ${anchor}.` : null;
  return anchor ? `${sound}, as in ${anchor}.` : `${sound}.`;
}

/** Does this clip's spoken form carry a sound respelling? Then record it in the standard voice. */
const carriesSound = (source, spoken) => source !== spoken;

module.exports = { SOUND, STRETCHED, PHRASES, speakablePhonics, phonicsWordCard, carriesSound, spelled, aIsSound };
