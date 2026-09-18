#!/usr/bin/env node
// Shape tests for tools/lib/ehel-phonics-speech.js — each case is a shape that
// broke, or would have, while the module was being written. Free and instant;
// part of `npm run check:intensive`.
//
// Mutation-tested before it was committed: turning off Book B's letter default
// fails 7 cases, turning off the collision rule 3, and a second respelling pass
// (the bug that turned d-o-g into "duh, or, guh") 11.
const { speakablePhonics: sp, phonicsWordCard: card } = require("./lib/ehel-phonics-speech");
const A = (t) => sp(t);
const B = (t) => sp(t, { spelling: true });

const cases = [
  // ---- Book A: sounds --------------------------------------------------------
  [A, "Say it with me. c. c. c.", "Say it with me. kuh. kuh. kuh."],
  [A, "Now join them. c. a. t. Cat.", "Now join them. kuh. ah. tuh. Cat."],
  [A, "Say the sound. s. Not the name.", "Say the sound. sss. Not the name."],
  [A, "Say it with me. d-o-g. Dog.", "Say it with me. duh, aw, guh. Dog."],   // one pass: `aw` is a grapheme too
  [A, "1. s - a - t ... sat", "1. sss, ah, tuh ... sat"],
  [A, "I don't know. It's two o'clock. I'm late.", "I don't know. It's two o'clock. I'm late."],
  [A, "A pin and a pan. It is a hot hill.", "A pin and a pan. It is a hot hill."],
  [A, "I sat on a mat or a bus.", "I sat on a mat or a bus."],
  [A, "Join s, a and t.", "Join sss, ah and tuh."],
  [A, "the POSITION can, a little.", "the POSITION can, a little."],
  [A, "Short a is in cat. Long a is in wait.", "Short ah is in cat. Long A is in wait."],
  [A, "Find the a in sat.", "Find the ah in sat."],
  [A, "Look at the start. S and T.", "Look at the start. S and T."],
  [A, "M. A. N. E. Mane.", "M. A. N. E. Mane."],
  [A, "Not see-kay. Just k.", "Not see-kay. Just kuh."],
  [A, "Em-ay-pee will never make map.", "Em-ay-pee will never make map."],
  [A, "Are they sounds, not names?", "Are they sounds, not names?"],
  [A, "The word sing has ng in it.", "The word sing has ung in it."],
  [A, "sss. mmm. lll. fff. zzz. vvv.", "sss. mmm. luh. fuh. zz. vuh."],
  [A, "The new sounds: ng, nk, th, sh, ch.", "The new sounds: ung, unk, th, shh, chuh."],
  [A, "c and k are the same sound.", "C and K are the same sound."],          // collision: a spelling sentence
  [A, "ir and er say one sound.", "I R and E R say one sound."],
  [A, "Say the word, then say ir or er.", "Say the word, then say I R or E R."],
  [A, "The new sounds: m, c, k.", "The new sounds: mmm, kuh, kuh."],       // PHRASE: the shared sound is the lesson
  [A, "Trace the letters ck.", "Trace the letters C K."],
  [A, "Trace the letter s.", "Trace the letter sss."],
  [A, "Pin has i.", "Pin has the sound in it."],
  [A, "Listen and repeat each sound. ng nk th sh ch ONE sound each.", "Listen and repeat each sound. ung unk th shh chuh ONE sound each."],
  [A, "Now look at it. S. A. C. K. Four letters.", "Now look at it. S. A. C. K. Four letters."],
  // ---- Book B: spellings, said by their letters -------------------------------
  [B, "Home has o_e in it.", "Home has O gap E in it."],
  [B, "Toe ends with oe.", "Toe ends with O E."],
  [B, "No English word ends with ai.", "No English word ends with A I."],
  [B, "Ai never comes at the end. Ay does.", "A I never comes at the end. A Y does."],
  [B, "The c says s.", "The C says sss."],
  [B, "Before e, i or y, g often says j.", "Before E, I or Y, G often says juh."],
  [B, "Say ur.", "Say urr."],
  [B, "Say long a. The same as ai.", "Say long A. The same as A I."],
  [B, "ai, ay or a_e.", "A I, A Y or A gap E."],
  [B, "Or, aw and ore.", "O R, A W and O R E."],
  [B, "Look at would. W, o, u, l, d.", "Look at would. W, O, U, L, D."],
  [B, "After a w, the letters or say er.", "After a W, the letters O R say urr."],
  [B, "Time. t. i_e. m. Three sounds.", "Time. tuh. eye. mmm. Three sounds."],
  [B, "1. n - a_e - m ... name", "1. nnn, A, mmm ... name"],
  [B, "Listen and repeat each sound. a_e ay ONE sound each.", "Listen and repeat each sound. A A ONE sound each."],
  [B, "I got a pot and a pan. Start or end?", "I got a pot and a pan. Start or end?"],
  [B, "3. p - a_e - g ... page 4. a_e - g ... age", "3. puh, A, juh ... page 4. A, juh ... age"],
  // blend rules: soft c, soft g after a split vowel (never `get`), final y
  [B, "1. c - i - t - y ... city 2. c - e - n - t ... cent", "1. sss, ih, tuh, ee ... city 2. sss, eh, nnn, tuh ... cent"],
  [B, "1. m - y ... my 2. t - r - y ... try", "1. mmm, eye ... my 2. tuh, rrr, eye ... try"],
  [A, "1. g - e - t ... get 2. c - a - t ... cat", "1. guh, eh, tuh ... get 2. kuh, ah, tuh ... cat"],
  [B, "1. g - a_e - m ... game 2. J - u_e - n ... June", "1. guh, A, mmm ... game 2. juh, yoo, nnn ... June"],
  [B, "Look for the letters. U_e. June. J. u_e. n.", "Look for the letters. U gap E. June. juh. yoo. nnn."],
];
let fail = 0;
for (const [fn, input, want] of cases) {
  const got = fn(input);
  if (got !== want) { fail += 1; console.log(`FAIL ${fn === B ? "[B]" : "[A]"}\n  in:   ${input}\n  want: ${want}\n  got:  ${got}`); }
}
const cards = [
  [["ng", "The word sing has ng in it."], "ung, as in sing."],
  [["s", "The word sat starts with s."], "sss, as in sat."],
  [["i", "The word pin has i in the middle."], "The sound in pin. pin."],
  [["o", "The word dog has o in the middle."], "The sound in dog. dog."],
  [["a_e", "The word name has a_e in it."], "A, as in name."],
];
for (const [[g, ex], want] of cards) {
  const got = card(g, ex);
  if (got !== want) { fail += 1; console.log(`FAIL card ${g}: want "${want}" got "${got}"`); }
}
console.log(fail ? `${fail} failing` : `all ${cases.length + cards.length} shapes pass`);
process.exitCode = fail ? 1 : 0;
