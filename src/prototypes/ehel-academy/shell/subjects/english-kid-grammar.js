// The Grades 1-4 Pattern Lab — the grammar section, made into something a hand
// does rather than something an eye reads.
//
// What it replaced, and why. At Grades 1-4 the grammar section is the gc-* deck:
// one pattern per slide, a picture, the rule, and — for the practice, which is
// the only part where the learner does anything — a `<details>Show practice`
// holding the exercises as one paragraph of prose:
//
//     "Write he or she in each gap. | This is my brother. ____ likes running. |
//      … Check yourself: 1. He 2. She 3. He 4. She."
//
// So the one active minute of the section was folded shut by default, printed as
// a paragraph, and marked by the child reading the answers off the end of it. A
// seven-year-old could swipe through all six patterns of a unit without tapping,
// typing or saying a single word. Owner, 2026-09-01: make it interactive.
//
// The deck STAYS. It is what the hard rule in CLAUDE.md means at 1-4 — the
// slides are the page — and it already gives a young learner what is worth
// having: one pattern at a time, a big Hear it, arrows, dots, swipe, full
// screen, and a closing slide that finishes the section. What changes is what a
// slide's practice IS: this module turns that paragraph into the exercises it
// describes, one question at a time, with tiles to tap, a blank that fills in,
// instant marking and a star row.
//
// Five rules the build is held to, each from a scar already in CLAUDE.md:
//
//  - GRADES 5-8 ARE UNTOUCHED. renderGrammarClassic keeps its grid workshop and
//    its `<details>`; this module is only ever constructed at 1-4. Every class
//    here is `gl-*` and every rule lives in the stylesheet this file injects, so
//    no upper-stage page can match one even by accident.
//  - NOT ONE WORD IS RE-AUTHORED. Every prompt, answer, instruction and model
//    answer below is read out of the unit's own `grammar[].practice` string —
//    the same string the print worksheet reads, through the same three helpers,
//    which english.js passes IN rather than this file redefining. A second copy
//    of GRAMMAR_ANSWER_KEY would be a second thing to keep in step, and
//    check-english-content.mjs reads that declaration out of english.js by name.
//  - THE PROGRESS CONTRACT IS UNCHANGED. Reaching the last slide still finishes
//    the section and the closing slide's button still finishes it. Nothing here
//    can gate `grammar`, because `grammar` gates the rest of the unit through
//    SECTION_CHAIN — a child who cannot spell "visited" must not lose Speaking,
//    Writing and the Quiz behind it. Answers are practice; practice is not a gate.
//  - IT NEVER CLAIMS TO HAVE MARKED WHAT IT HAS NOT. An answer is bound to a
//    question only where the authored key can be read with confidence; where it
//    cannot, the question is still asked, and asked as an OPEN one — a box to
//    write in, a model answer to compare against, and no tick either way. The
//    binding rules are in parseAnswerRun() and they refuse rather than guess.
//    Same line the reading self-assessment and the board's activity ring hold:
//    silence beats a confident mark nobody measured.
//  - NO NEW ASSET AND NO NEW FETCH ON PAINT. Pictures come from
//    word-pictures.js (already loaded), praise is text, and the audio is the
//    clip the lesson already carries. The one paid call is the runtime voice
//    reading a Grade 1 sentence the child has just built — a tap they asked
//    for, on the same helper the Game Park already speaks through.

const STYLE_ID = "gl-pattern-lab-style";

// A tap, a right answer and a miss, synthesised. No file, no fetch, nothing to
// 404, and it respects the header's sound toggle like everything else here.
//
// The Game Park has its own `makeSound` and this is deliberately not that one:
// it lives in another section's module, unexported, and reaching into it would
// mean editing the games lane to ship a grammar change. These are decoration —
// every state they sound out is also written on screen — so two copies cannot
// drift into a defect the way two copies of a narration string can. If the two
// sections are ever refactored together, this is the one to delete.
function makeChimes(isOn) {
  let ctx = null;
  const tone = (freq, at, dur, type = "sine", peak = 0.12) => {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + at;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.04);
  };
  const play = (notes) => {
    if (!isOn()) return;
    try { for (const note of notes) tone(...note); } catch { /* garnish only */ }
  };
  return {
    tap: () => play([[620, 0, 0.06, "triangle", 0.06]]),
    right: () => play([[523.25, 0, 0.18], [659.25, 0.08, 0.18], [783.99, 0.16, 0.3]]),
    miss: () => play([[233, 0, 0.14, "triangle", 0.08], [185, 0.12, 0.22, "triangle", 0.08]]),
    win: () => play([[523.25, 0, 0.16], [659.25, 0.1, 0.16], [783.99, 0.2, 0.16], [1046.5, 0.3, 0.42]]),
  };
}

// --------------------------------------------------------------- the parsing
//
// Everything below reads the authored `practice` string. Its shape, measured
// across all 41 units of Grades 1-4 (246 lessons at 2-4, 66 at Grade 1):
//
//   Grades 2-4   an instruction, then exercises, then the answer key — pieces
//                separated by " | " or by newlines, the key either its own
//                piece or welded to the end of the last question. 151 of the
//                180 lessons carry a key; Grade 2 is the thin one (32 of 60).
//   Grade 1      no key anywhere and no gaps: the practice is ORAL, three
//                worked examples of the rule's own frame —
//                "Say and do three: I can hop. I can catch. I can climb."
//                against a frame of "I can ___."
//
// Those are two different sections, so they get two different labs. Grade 1
// gets tiles that build the frame and a voice that says what was built; Grades
// 2-4 get the gap-fill the author wrote, actually filled in.

// A piece is an EXERCISE if it has somewhere to answer — a gap, a bracketed
// choice, or its own number. Deliberately the same test english.js uses to
// decide whether the worksheet gives a prompt one line or three.
const isExercise = (piece) => /_{2,}|\(.+\/.+\)/.test(piece) || /^\d+\s*[.)]/.test(piece);
const stripNumber = (piece) => String(piece).replace(/^\d+\s*[.)]\s*/, "").trim();
const wordsOf = (text) => String(text).trim().split(/\s+/).filter(Boolean);

// What the learner typed, against what the author wrote. Case, the two kinds of
// apostrophe, and the full stop a child adds out of habit are not what is being
// taught here, so none of them makes an answer wrong.
export const normaliseAnswer = (text) => String(text || "")
  .toLowerCase()
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[–—]/g, "-")
  .replace(/[.,!?;:"“”]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// The key's own text with the marker that introduced it taken off:
// "Check yourself: 1. He 2. She" -> "1. He 2. She".
//
// The marker is REMOVED BY LENGTH, using the match english.js's own
// GRAMMAR_ANSWER_KEY made — never by a second pattern here. Cutting at "the
// first colon or dash" was tried and is wrong on the commonest wording in the
// content: "Self-check" contains a dash, so it left "check:" behind and, in a
// comma-separated key, "check: a spiral staircase" became the answer to
// question one. The regex that found the marker is the only thing that knows
// how long the marker is.
export const keyBody = (keyText, marker) => {
  const text = String(keyText || "");
  const found = String(marker || "");
  return (found && text.startsWith(found) ? text.slice(found.length) : text.replace(/^[^:\n]{0,80}?[:—]\s*/, "")).trim();
};

// An answer may carry a short ALTERNATIVE in brackets — "will not forget (won't
// forget)" — and it may equally carry a NOTE — "when (because can also work in
// 1 and 2, since both give a reason)". Three words or fewer and no comma is the
// line between them: an alternative is another way to write the same answer, a
// note is a sentence about it.
// An answer may also BE two answers — "“Yes, I have.” or “No, I haven't.”" is
// what the author wrote for a question the learner chooses the sense of, and a
// child who typed the second one must not be told they are wrong.
export function splitAlternative(answer) {
  const tidy = (text) => String(text).trim().replace(/^[“”"']+|[“”"']+$/g, "").replace(/[.,;]+$/, "").trim();
  let text = String(answer).trim();
  const alternatives = [];
  const bracketed = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (bracketed) {
    const inside = bracketed[2].trim();
    if (wordsOf(inside).length <= 3 && !inside.includes(",")) alternatives.push(tidy(inside));
    text = bracketed[1];
  }
  const either = text.match(/^(.+?)\s+or\s+(.+)$/i);
  if (either && wordsOf(either[1]).length <= 5 && wordsOf(either[2]).length <= 5) {
    text = either[1];
    alternatives.push(tidy(either[2]));
  }
  return { text: tidy(text), alternatives: alternatives.filter(Boolean) };
}

// The answer run, read out of the key and bound to the questions BY POSITION —
// which is only honest under conditions, so this returns null rather than a
// half-right list whenever they do not hold:
//
//   - the numbers must be 1..N with nothing missing. A key that starts at 2 or
//     jumps is a key this has misread, and the Computing answer-key gate
//     learned what that costs: one question that fails to parse shifts every
//     later answer onto the wrong question, and the result then asserts the
//     wrong answer with complete confidence.
//   - there must not be MORE answers than questions. Fewer is normal and
//     expected (a lesson ending "now write your own reason" keys the first four
//     of seven); more means the run is not what it looks like.
//   - an answer of more than eight words is prose, not an answer. The tail of a
//     key often carries a sentence about the open questions, and this is what
//     stops that sentence being marked as the answer to question four.
//
// An UNNUMBERED run is accepted only when it splits into exactly as many parts
// as there are questions — the rule the Computing booklet keys are read under,
// for the same reason: position is trustworthy only when the two runs are the
// same length. Three separators appear in the authored keys and each is tried
// in turn, most distinctive first: semicolons ("took; went; ate; had; saw."),
// then whole sentences ("Wash your hands before eating. Close the door when you
// leave. …"), then commas ("plays, studies, rises, go, helps"). Anything that
// does not land on the question count exactly is refused — which is what keeps
// a key's closing PROSE from being split into four "answers" and marked.
// Several key PIECES — "Answers, Part A: …" and "Answers, Part B: …" written as
// two separate pieces of the practice — are parsed one at a time and joined.
// Joining their text first and reading it as one run cannot work: each piece
// starts its own marker and its own "1.", so the numbers restart mid-string and
// the second marker ends up inside an answer ("so that Answers"), which is
// exactly what shipped for one Grade 4 lesson before this existed.
export function parseAnswerRuns(bodies, questionCount) {
  const list = bodies.filter(Boolean);
  if (!list.length) return null;
  if (list.length === 1) return parseAnswerRun(list[0], questionCount);
  const runs = list.map((body) => numberedRun(body));
  if (!runs.every(Boolean)) return null;
  return finishRun(runs.flat(), questionCount, true);
}

// `body` is the key with its marker already removed — see keyBody, and see
// parseUpperPractice, which is the only thing that knows how long a marker is.
export function parseAnswerRun(body, questionCount) {
  if (!body) return null;
  // A key in PARTS restarts its numbering: "Part A — 1. What, 2. What, 3. When,
  // 4. Who. Part B — 1. What, 2. What, 3. When, 4. How." Read as one run the
  // numbers go 1,2,3,4,1,2,3,4 and the sequence test rejects it — correctly,
  // because two runs read as one would bind Part B's answers to Part A's
  // questions. Split at the part headings and each half is an ordinary run
  // again; the halves then join in the order the questions are asked, which is
  // the order the author wrote them in. Eight questions a side, at Grade 4, is
  // the commonest layout there.
  const segments = body.split(/\bPart\s+[A-Z0-9]\b\s*[—:.-]?\s*/i).map((part) => part.trim()).filter(Boolean);
  if (segments.length > 1) {
    const runs = segments.map((segment) => numberedRun(segment));
    if (runs.every(Boolean)) {
      const joined = runs.flat();
      return finishRun(joined, questionCount, true);
    }
  }
  const marks = [...body.matchAll(/(\d+)\s*[.)]\s+/g)];
  let parts = null;
  if (marks.length >= 2) {
    if (marks.some((mark, index) => Number(mark[1]) !== index + 1)) return null;
    parts = marks.map((mark, index) => {
      const from = mark.index + mark[0].length;
      const to = index + 1 < marks.length ? marks[index + 1].index : body.length;
      return body.slice(from, to);
    });
  } else {
    for (const separator of [/\s*;\s*/, /(?<=[.!?])\s+(?=[A-Z“"])/, /\s*,\s*/]) {
      const tried = body.split(separator).map((part) => part.trim()).filter(Boolean);
      if (tried.length === questionCount) { parts = tried; break; }
    }
    if (!parts) return null;
  }
  const answers = cleanParts(parts);
  return finishRun(answers, questionCount, marks.length >= 2);
}

// A numbered run, 1..N, or nothing. Used on its own for a key in parts.
function numberedRun(segment) {
  const marks = [...segment.matchAll(/(\d+)\s*[.)]\s+/g)];
  if (marks.length < 2) return null;
  if (marks.some((mark, index) => Number(mark[1]) !== index + 1)) return null;
  return cleanParts(marks.map((mark, index) => {
    const from = mark.index + mark[0].length;
    const to = index + 1 < marks.length ? marks[index + 1].index : segment.length;
    return segment.slice(from, to);
  }));
}

const cleanParts = (parts) => parts
  .map((part) => part.trim().replace(/^[,;]\s*/, "").replace(/[.,;]+$/, "").trim())
  // The last part of a run often has the key's closing sentence welded to it
  // ("child's. The last three sentences are your own ideas…"). A new sentence
  // opening with a capital, after a stop, is where the answer ended.
  .map((part) => part.split(/(?<=[.;])\s+(?=[A-Z“"])/)[0].trim().replace(/[.,;]+$/, ""))
  .filter(Boolean)
  .map(splitAlternative);

// The last three tests every run has to pass, in one place because the parts
// path and the plain path must not drift apart on what they will accept.
//
// An over-long answer at the END of a run is DROPPED rather than failing the
// whole run: the tail of a key is where the author's closing prose is welded on
// ("has got, and item 4 becomes “Has he got…”"), so the run before it is still
// perfectly readable, and the question it belonged to simply becomes an open
// one. An over-long answer in the MIDDLE is a different thing — it means the
// splitting itself went wrong — and that still refuses everything. Truncating
// either of them is not on the table: a guessed answer is marked against a
// child, and there is no version of that which is better than asking openly.
function finishRun(answers, questionCount, numbered) {
  let run = answers;
  while (run.length && wordsOf(run[run.length - 1].text).length > 8) run = run.slice(0, -1);
  if (!run.length) return null;
  if (run.some((answer) => wordsOf(answer.text).length > 8)) return null;
  if (run.length > questionCount) return null;
  if (!numbered && run.length !== questionCount) return null;
  return run;
}

// The closed set of words a question is choosing BETWEEN, read off the
// instruction the author already wrote: "Write he or she in each gap.", "Fill
// in the blank with Did, Was, or Were.", "…the correct Wh- word (What, When, or
// Where)". Where it is found the question becomes tiles to tap instead of a box
// to type in, which is the difference between a Grade 2 learner doing the
// exercise and a Grade 2 learner watching it.
//
// Used only when EVERY answer in the lesson is in the set. A set that does not
// cover the answers is a set this has misread, and tiles that cannot produce
// the right answer are worse than a box.
export function optionsFromInstruction(instruction) {
  const text = String(instruction || "");
  const inside = text.match(/\(([^)]*\bor\b[^)]*)\)/i);
  const run = (inside ? inside[1] : text).match(/([\w'’-]+(?:\s*,\s*[\w'’-]+)*\s*,?\s+or\s+[\w'’-]+)/i);
  if (!run) return [];
  const options = run[1].split(/\s*,\s*|\s+or\s+/i).map((option) => option.trim()).filter(Boolean);
  const unique = new Set(options.map((option) => option.toLowerCase()));
  if (options.length < 2 || options.length > 5 || unique.size !== options.length) return [];
  return options;
}

// Tiles or a box? Tiles wherever a closed set of two to four words covers every
// answer — from the instruction first, and failing that from the answers
// themselves when they repeat ("1. He 2. She 3. He 4. She" is a two-word
// choice, and saying so is not a spoiler, it is the exercise).
//
// A set of ONE is refused: a single tile that is always right teaches nothing
// and reads as broken. Those lessons ("fill each blank with from") keep the box.
export function chooserFor(answers, instruction) {
  const texts = answers.map((answer) => answer.text);
  if (texts.some((text) => wordsOf(text).length > 2)) return null;
  const covers = (set) => {
    const lower = set.map((option) => normaliseAnswer(option));
    return texts.every((text) => lower.includes(normaliseAnswer(text)));
  };
  const fromInstruction = optionsFromInstruction(instruction);
  if (fromInstruction.length >= 2 && covers(fromInstruction)) return fromInstruction;
  const distinct = [];
  for (const text of texts) {
    if (!distinct.some((seen) => normaliseAnswer(seen) === normaliseAnswer(text))) distinct.push(text);
  }
  if (distinct.length >= 2 && distinct.length <= 4 && distinct.length < texts.length) return distinct;
  return null;
}

// GRADES 2-4: one lesson's practice, as questions.
//
// `instruction` is the first piece when the pieces after it are exercises —
// 135 of the 155 multi-piece items are that shape, and english.js's worksheet
// makes the same split for the same reason. A piece that is neither the opening
// instruction nor an exercise (an author's "Now finish each sentence with your
// own reason") is kept as a `note` item, in place, because it is addressed to
// the learner and dropping it loses the only thing that explains the questions
// under it.
export function parseUpperPractice(lesson, { split, strip, take, marker = () => "" }) {
  const raw = split(lesson.practice);
  // One body per key piece, each with its own marker taken off by the pattern
  // that matched it.
  const keyBodies = raw.map((piece) => {
    const key = take(piece);
    return key ? keyBody(key, marker(piece)) : "";
  }).filter(Boolean);
  const pieces = raw.map(strip).map((piece) => piece.trim()).filter(Boolean);
  let instruction = "";
  let body = pieces;
  if (pieces.length >= 2 && !isExercise(pieces[0])) {
    const rest = pieces.slice(1);
    if (rest.filter(isExercise).length >= Math.ceil(rest.length * 0.6)) {
      instruction = pieces[0];
      body = rest;
    }
  }
  const questions = body.filter(isExercise);
  const answers = questions.length ? parseAnswerRuns(keyBodies, questions.length) : null;
  const options = answers ? chooserFor(answers, instruction || lesson.practice) : null;
  // Whatever the key said after its answers is the author talking to the
  // learner about the open questions — model sentences, most often. It is shown
  // where those questions are, and never as a mark.
  const modelNote = modelAnswerNote(keyBodies.join(" "), answers);

  let answered = 0;
  const items = body.map((piece) => {
    if (!isExercise(piece)) return { kind: "note", text: piece };
    const prompt = stripNumber(piece);
    const answer = answers && answered < answers.length ? answers[answered] : null;
    if (answer) answered += 1;
    // An answer with an ellipsis in it — "There are … beside the showcase
    // table" — is the author showing the SHAPE of the sentence, not the words
    // of it. Nothing a child types can equal that string, so marking against it
    // would be a wrong mark every time. The question is still asked; it is just
    // asked openly, with that shape offered as the guide.
    if (!answer || /[…]|\.\.\./.test(answer.text)) {
      return { kind: "open", prompt, guide: answer ? answer.text : "" };
    }
    const gaps = (prompt.match(/_{2,}/g) || []).length;
    const size = wordsOf(answer.text).length;
    const common = { prompt, answer: answer.text, alternatives: answer.alternatives, inline: gaps === 1 && size <= 3 };
    // Tiles wherever the lesson has a closed set and the answer is a word or
    // two: the tap is the point at this age.
    if (options && size <= 2) return { kind: "choose", ...common, options };
    // A word or short phrase into a blank — typed, and marked, because the
    // answer is determinate and short enough that a near miss really is a miss.
    if (size <= 3) return { kind: "type", ...common, hint: bracketHint(prompt) };
    // A whole line written out ("Would you like to join us for lunch?", "She
    // measures the rope every morning"). Deliberately NOT marked wrong: at four
    // words and up a learner can be right in a way the single authored key does
    // not spell, and "✗" against a correct sentence is the one mistake that
    // teaches a child their right answer was wrong. An exact match still earns
    // its tick; anything else is offered the model to compare against.
    return { kind: "write", ...common, hint: bracketHint(prompt) };
  });
  return { instruction, items, modelNote, markable: !!answers };
}

// "______ (visit)" — the author's own hint about which word to change. It moves
// out of the sentence and onto a chip beside the box, because inside the
// sentence a six-year-old reads it as part of the sentence, and printing it in
// both places says the same thing twice. A bracket holding a CHOICE ("(not /
// touch)", "(This / These)") is left exactly where it is: that one is not a
// hint, it is the question.
const HINT_BRACKET = /\s*\(([^)/]{1,24})\)/;
const bracketHint = (prompt) => {
  const found = String(prompt).match(HINT_BRACKET);
  return found ? found[1].trim() : "";
};
const withoutHint = (prompt) => String(prompt).replace(HINT_BRACKET, "").replace(/\s+([.!?,])/g, "$1").trim();

// The key's closing prose, if it has any — everything after the answers that is
// a sentence rather than an answer.
function modelAnswerNote(body, answers) {
  if (!body) return "";
  // A note is PROSE. Anything still carrying a numbered run is the answer key
  // itself, and the first version of this offered exactly that to the learner:
  // splitting the whole body at sentence boundaries turned "1. He 2. She 3. He
  // 4. She." into a tail of "He 2. She 3. He 4. She." and printed it under an
  // open question as "One good answer". 100 open questions were about to be
  // handed the answers to the questions above them. It was invisible until the
  // note was actually drawn on a page.
  const prose = (text) => {
    const trimmed = String(text).trim();
    return /[a-z]/i.test(trimmed) && !/\d\s*[.)]\s/.test(trimmed) ? trimmed : "";
  };
  if (!answers) {
    const whole = prose(body);
    return wordsOf(whole).length > 8 ? whole : "";
  }
  // With answers parsed, the note is whatever the author wrote AFTER the last
  // one — measured from the last number marker, not from the start of the body.
  const marks = [...body.matchAll(/(\d+)\s*[.)]\s+/g)];
  if (!marks.length) return "";
  const last = marks[marks.length - 1];
  const after = body.slice(last.index + last[0].length);
  const tail = prose(after.split(/(?<=[.;])\s+(?=[A-Z“"])/).slice(1).join(" "));
  return wordsOf(tail).length >= 6 ? tail : "";
}

// GRADE 1: the frame, and the three sentences that fill it.
//
// The rule is a frame with a gap ("I can ___.", "The ball is on the ___.") and
// the practice is an instruction, a colon, then three worked examples. Where
// the examples genuinely fit the frame, the lesson becomes tiles: the child
// taps a word, the blank fills, and the sentence is read back to them. Where
// they do not — a rule with no gap ("I can see with my eyes."), a practice that
// lists nouns rather than sentences — it becomes cards to hear and say, which
// claims nothing the data cannot support.
export function parseGrade1Practice(lesson) {
  const frame = String(lesson.ruleAndExamples || "").trim();
  const practice = String(lesson.practice || "").trim();
  const colon = practice.indexOf(":");
  const instruction = colon > 0 ? practice.slice(0, colon).trim() : "";
  const rest = (colon > 0 ? practice.slice(colon + 1) : practice).trim();
  const examples = rest
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => wordsOf(sentence).length >= 2);
  const fills = frameFills(frame, examples);
  if (fills.length >= 2) return { kind: "build", instruction, frame, fills, examples };
  // A LIST, not sentences: "…then name three things you can see: a window, a
  // book, a friend." and the phonics practices ("ant, apple, arm."). These are
  // one "example" holding several things, so as cards they were a single card
  // with three items printed inside it — the blob the whole change is about,
  // one size smaller. Each item becomes its own tile with its own picture.
  //
  // Only where there is exactly ONE example and it is a run of short items.
  // "Red, Stop." and "Smelling bread, my nose." are commas INSIDE a sentence
  // and there are three of them on the slide, so those stay as cards.
  const list = examples.length === 1 ? listItems(examples[0]) : [];
  if (list.length >= 2) return { kind: "list", instruction, frame, items: list };
  return { kind: "say", instruction, frame, examples: examples.length ? examples : (rest ? [rest] : []) };
}

function listItems(example) {
  const parts = String(example).replace(/[.!?]+$/, "").split(/\s*,\s*|\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return [];
  if (parts.some((part) => wordsOf(part).length > 3)) return [];
  return parts;
}

// The word each example puts in the frame's gap, found by MATCHING the example
// against the frame rather than by guessing at word positions — so "The ball is
// on the ___." against "The ball is on the mat." yields "mat", and an example
// that is not that sentence at all yields nothing and is left out.
//
// Each fill keeps the example SENTENCE it came from, and that sentence is what
// the panel shows and the voice reads. Building one instead — frame with the
// word dropped in — is where a/an would go wrong: ten Grade 1 lessons are
// framed "This is a / an ___." precisely because the article is the thing being
// taught, and a machine substitution there says "This is a / an apple" or, if
// it picks a side, "This is a apple". The author already wrote the right
// sentence; this only has to find which word is the variable one.
//
// The alternation is why the frame is not matched literally: "a / an" becomes
// "(?:a|an)", so those ten lessons match their examples instead of falling back
// to cards. A frame with a second gap ("It is a / an ___ ___.") captures the
// first and matches the rest loosely, which is enough to name the tile.
export function frameFills(frame, examples) {
  if (!/_{2,}/.test(frame)) return [];
  let first = true;
  // The terminal stop is dropped from BOTH sides rather than normalised on one.
  // Rewriting the example's "?" to "." while the frame kept its own "?" is what
  // stopped "Can you ___?" from ever matching "Can you skip?" — a whole shape of
  // Grade 1 lesson (asking a friend a question) fell back to cards because of it.
  const endless = (text) => String(text).trim().replace(/[.!?]+$/, "");
  const source = endless(frame)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/([\w'’]+)\s*\/\s*([\w'’]+)/g, "(?:$1|$2)")
    .replace(/_{2,}/g, () => { const slot = first ? "(.+?)" : ".+?"; first = false; return slot; });
  let pattern;
  try { pattern = new RegExp(`^${source}$`, "i"); } catch { return []; }
  const fills = [];
  for (const example of examples) {
    const sentence = example.trim();
    const found = endless(sentence).match(pattern);
    const word = found && found[1] ? found[1].trim() : "";
    if (word && !fills.some((seen) => seen.word.toLowerCase() === word.toLowerCase())) fills.push({ word, sentence });
  }
  return fills;
}

// ------------------------------------------------------------------ the lab
//
// One instance per render of the grammar section. It owns the practice panel
// inside each slide and nothing else on the slide: the pattern, the picture,
// the rule, the Hear it buttons and the deck itself all stay exactly where
// renderGrammarCarousel puts them.
//
// The panel repaints ITSELF — `document.querySelector('[data-gl=…]').innerHTML`
// — rather than going through deck.redrawSlide. Two reasons, both learned from
// the deck's own notes: redrawSlide replaces the whole slide node, which would
// destroy the input the learner is typing in and lose the caret; and a slide
// redraw re-runs afterPaint over content that has not changed. The panel is the
// only thing that moves, so the panel is the only thing repainted.
export function createPatternLab({
  grade = 1,
  escapeHtml,
  icon,
  icons = () => {},
  toast = () => {},
  wordPicture = () => "",
  speak = null,
  soundOn = () => true,
  // Moves the DECK on to the next pattern. The lab does not own the carousel,
  // so this is handed in; without it the finish card's only way onward is the
  // arrow at the edge of the screen, which is not where the child is looking.
  goNext = null,
  practice,
  stateFor = () => ({}),
  saveState = () => {},
}) {
  ensureStyle();
  const esc = (text) => escapeHtml(String(text ?? ""));
  const chime = makeChimes(soundOn);
  const still = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Parsed once per lesson: the practice string never changes under us, and the
  // panel repaints on every tap.
  const parsedCache = new Map();
  // Where the learner is in a lesson's questions. Deliberately NOT persisted:
  // "which question am I on" is about this sitting, while "which ones did I get
  // right" is about the learner and is saved.
  const step = new Map();
  // How many times this question has been tried and missed, this sitting. It
  // decides when "Show me" appears and what the feedback line says — and it is
  // deliberately not saved: a child coming back tomorrow starts with a clean
  // run at a question, not with yesterday's misses counted against them.
  const misses = new Map();
  // Lessons whose fanfare has already played this sitting.
  const won = new Set();
  const missKey = (id, index) => `${id}:${index}`;
  const missed = (id, index) => misses.get(missKey(id, index)) || 0;

  const parse = (lesson) => {
    if (!parsedCache.has(lesson.grammarId)) {
      parsedCache.set(lesson.grammarId, grade === 1 ? parseGrade1Practice(lesson) : parseUpperPractice(lesson, practice));
    }
    return parsedCache.get(lesson.grammarId);
  };
  const saved = (id) => {
    const state = stateFor(id) || {};
    return { results: state.results && typeof state.results === "object" ? state.results : {}, answers: state.answers && typeof state.answers === "object" ? state.answers : {} };
  };
  // Recording a result also PINS the panel to that question. Without the pin,
  // `at` falls back to "the first question with no result yet" — which the
  // answer just given has changed — so the panel jumps to the next question and
  // the child never sees the tick, the praise, or the answer they pressed Show
  // me for. The step is cleared again only by a Next / Back / Skip press.
  const record = (id, index, result, answer) => {
    const state = saved(id);
    if (result) state.results[index] = result;
    if (answer !== undefined) state.answers[index] = answer;
    saveState(id, state);
    step.set(id, index);
  };

  // A stable shuffle. Tiles must not jump to a new order every time the panel
  // repaints — which is after every tap — so the order is a function of the
  // lesson and the question rather than of the moment.
  const shuffle = (list, seedText) => {
    let seed = 0;
    for (const character of String(seedText)) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const j = seed % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const PRAISE = ["Yes!", "That's it!", "Well done!", "Perfect!", "Brilliant!", "You got it!"];
  const praise = (index) => PRAISE[index % PRAISE.length];

  const matches = (item, typed) => {
    const given = normaliseAnswer(typed);
    if (!given) return false;
    return [item.answer, ...(item.alternatives || [])].some((option) => normaliseAnswer(option) === given);
  };

  // The prompt, with every ______ drawn as a blank. `filled` goes into the
  // first blank only — the inline questions have exactly one, and a question
  // with two is never inline (see parseUpperPractice).
  const promptHtml = (prompt, { filled = "", state = "" } = {}) => {
    let first = true;
    return esc(prompt).replace(/_{2,}/g, () => {
      const value = first && filled ? esc(filled) : "";
      const classes = `gl-blank${first && state ? ` is-${state}` : ""}${value ? " is-filled" : ""}`;
      first = false;
      return `<span class="${classes}">${value || "?"}</span>`;
    });
  };

  const pictureFor = (text) => {
    const word = String(text || "").trim().replace(/[.!?,;:"'’]/g, "");
    if (!word || /\s/.test(word)) return "";
    return wordPicture(word) || "";
  };

  // ------------------------------------------------------------ the markup
  function panelHtml(lesson) {
    const parsed = parse(lesson);
    if (grade === 1) return grade1Html(lesson, parsed);
    return upperHtml(lesson, parsed);
  }

  function upperHtml(lesson, parsed) {
    const id = lesson.grammarId;
    if (!parsed.items.length) return "";
    const state = saved(id);
    const questions = parsed.items.map((item, index) => ({ item, index })).filter((entry) => entry.item.kind !== "note");
    const at = Math.min(step.get(id) ?? firstUnfinished(parsed, state), parsed.items.length);
    const finished = questions.length > 0 && questions.every((entry) => state.results[entry.index]);
    const pips = questions.map((entry, position) => {
      const result = state.results[entry.index] || "";
      const here = entry.index === at;
      return `<span class="gl-pip${result ? ` is-${result}` : ""}${here ? " is-here" : ""}" title="Question ${position + 1}"></span>`;
    }).join("");

    const body = at >= parsed.items.length
      ? finishHtml(id, parsed, state, questions)
      : stepHtml(id, parsed, state, at, questions);

    return `<section class="gl${still() ? " gl-still" : ""}" data-gl="${esc(id)}">
      <div class="gl-top">
        <span class="gl-chip">${icon("pencil")} Your turn</span>
        <div class="gl-pips" aria-label="${questions.length} question${questions.length === 1 ? "" : "s"} in this practice">${pips}</div>
      </div>
      ${parsed.instruction ? `<p class="gl-say">${esc(parsed.instruction)}</p>` : ""}
      <div class="gl-stage">${body}</div>
    </section>`;
  }

  const firstUnfinished = (parsed, state) => {
    for (let index = 0; index < parsed.items.length; index += 1) {
      if (parsed.items[index].kind === "note") continue;
      if (!state.results[index]) return index;
    }
    return parsed.items.length;
  };

  function stepHtml(id, parsed, state, index, questions) {
    const item = parsed.items[index];
    const position = questions.findIndex((entry) => entry.index === index) + 1;
    const counter = item.kind === "note"
      ? `<span class="gl-count">${icon("info")} Read this first</span>`
      : `<span class="gl-count">Question ${position} of ${questions.length}</span>`;
    const nav = `<div class="gl-nav">
        ${index > 0 ? `<button class="gl-ghost" type="button" data-gl-step="${index - 1}">${icon("chevron-left")} Back</button>` : "<span></span>"}
        <button class="gl-ghost" type="button" data-gl-step="${index + 1}">Skip ${icon("chevron-right")}</button>
      </div>`;

    if (item.kind === "note") {
      return `<div class="gl-q gl-note-step">${counter}
        <p class="gl-sentence">${esc(item.text)}</p>
        <button class="gl-go" type="button" data-gl-step="${index + 1}">${icon("check")} Got it</button>
        ${nav}</div>`;
    }

    const result = state.results[index] || "";
    const typed = state.answers[index] || "";
    const attempts = missed(id, index);
    const done = result === "right" || result === "shown";
    const reveal = done ? item.answer : "";

    let control = "";
    if (item.kind === "choose") {
      const options = shuffle(item.options, `${id}:${index}`);
      control = `<div class="gl-tiles">${options.map((option) => {
        const isAnswer = normaliseAnswer(option) === normaliseAnswer(item.answer) || (item.alternatives || []).some((alternative) => normaliseAnswer(alternative) === normaliseAnswer(option));
        // The tile that was just tried and missed is marked as tried, so the
        // child can see WHICH one they chose. Without it the only signal is a
        // sentence, and a five-year-old reads the tiles, not the sentence.
        const tried = !done && !isAnswer && normaliseAnswer(option) === normaliseAnswer(typed);
        return `<button class="gl-tile${done && isAnswer ? " is-right" : ""}${tried ? " is-wrong" : ""}" type="button" data-gl-pick="${esc(option)}" data-gl-index="${index}" ${done ? "disabled" : ""}>${esc(option)}</button>`;
      }).join("")}</div>
      ${!done && attempts >= 2 ? `<div class="gl-buttons"><button class="gl-ghost" type="button" data-gl-show="${index}">${icon("eye")} Show me</button></div>` : ""}`;
    } else {
      const bank = lessonWords(parsed, index);
      control = `<div class="gl-answer">
          <input class="gl-input${item.whole === false ? "" : ""}" type="text" data-gl-input="${index}" value="${esc(typed)}" ${done ? "disabled" : ""}
            placeholder="${item.kind === "open" ? "Write your own answer" : "Write your answer"}" autocomplete="off" autocapitalize="sentences" spellcheck="false"
            aria-label="Your answer to question ${position}">
          ${item.hint ? `<span class="gl-hint">${icon("corner-down-right")} ${esc(item.hint)}</span>` : ""}
        </div>
        <div class="gl-buttons">
          ${done ? "" : `<button class="gl-go" type="button" data-gl-check="${index}">${icon("check")} ${item.kind === "open" ? "Save my answer" : item.kind === "write" ? "Check my answer" : "Check"}</button>`}
          ${!done && item.kind !== "open" && bank.length >= 2 ? `<button class="gl-ghost" type="button" data-gl-bank="${index}">${icon("lightbulb")} Show the words</button>` : ""}
          ${!done && attempts >= 2 && item.kind === "type" ? `<button class="gl-ghost" type="button" data-gl-show="${index}">${icon("eye")} Show me</button>` : ""}
        </div>
        ${bankOpen.has(`${id}:${index}`) && !done ? `<div class="gl-bank">${shuffle(bank, `${id}:bank`).map((word) => `<button class="gl-tile small" type="button" data-gl-fill="${esc(word)}" data-gl-index="${index}">${esc(word)}</button>`).join("")}</div>` : ""}`;
    }

    const feedback = feedbackHtml(item, result, reveal, index, attempts);
    // The model answer, for the questions nothing can mark. The author usually
    // wrote one — "here is one model example for each: I love reading because
    // it takes me to new places" — and until this was drawn, parseUpperPractice
    // was finding it and the panel was throwing it away, which left an open
    // question with a box and no way for a child working alone to know whether
    // what they wrote was the sort of thing being asked for.
    //
    // It is behind a press, and the press comes AFTER their own answer is saved:
    // a model sitting on screen while the box is empty is a sentence to copy.
    const model = item.kind === "open" && parsed.modelNote
      ? (modelOpen.has(missKey(id, index))
        // "Check yours against this", not "One good answer". What the author
        // left after the answers is sometimes model sentences ("here is one
        // model example for each: I love reading because…") and sometimes the
        // answers themselves in prose ("Part A answers are is going to open and
        // will carry"). Both are worth showing to a child who has already
        // answered; only the first is a model, so the label has to be the one
        // that is true of both.
        ? `<p class="gl-model">${icon("scale")} <span><strong>Check yours against this:</strong> ${esc(parsed.modelNote)}</span></p>`
        : (result ? `<div class="gl-buttons"><button class="gl-ghost" type="button" data-gl-model="${index}">${icon("eye")} Check yourself</button></div>` : ""))
      : "";
    return `<div class="gl-q">${counter}
      <p class="gl-sentence">${promptHtml(item.hint ? withoutHint(item.prompt) : item.prompt, { filled: item.inline ? (done ? item.answer : "") : "", state: item.inline && done ? (result === "right" ? "right" : "shown") : "" })}</p>
      ${item.kind === "open" && item.guide ? `<p class="gl-guide">${icon("shapes")} The shape to follow: <strong>${esc(item.guide)}</strong></p>` : ""}
      ${control}
      <p class="gl-feedback${result ? ` is-${result}` : ""}" role="status" aria-live="polite" aria-atomic="true">${feedback}</p>
      ${model}
      ${done || result === "done" ? `<button class="gl-go" type="button" data-gl-step="${index + 1}">${index + 1 >= parsed.items.length ? "See how I did" : "Next question"} ${icon("arrow-right")}</button>` : ""}
      ${nav}</div>`;
  }

  // Never the word "wrong", and never a promise the panel cannot keep: the
  // first miss says try again, and only the line shown BESIDE a Show me button
  // mentions one. The first version of this said "press Show me" after every
  // miss on a tile question, where no such button is ever drawn.
  function feedbackHtml(item, result, reveal, index, attempts) {
    if (result === "right") return `${icon("party-popper")} ${praise(index)}`;
    if (result === "shown") return `${icon("eye")} The answer is <strong>${esc(reveal)}</strong>. Say it once, then move on.`;
    if (result === "done") {
      if (item.kind === "write") return `${icon("scale")} Yours is saved. Compare it with <strong>${esc(item.answer)}</strong> — is yours saying the same thing?`;
      return `${icon("check")} Saved. This one is your own idea, so there is no single right answer.`;
    }
    if (attempts >= 2) return `${icon("eye")} Still not it. Press Show me and we will look at it together.`;
    if (attempts === 1) return `${icon("rotate-ccw")} Not quite — have another go.`;
    return "";
  }

  // The lesson's own answers, as a word bank. It is a SCAFFOLD the learner asks
  // for, never the default: the exercise is to produce the word, and a bank on
  // screen from the start turns every one of these into matching. Offered only
  // where the words are short enough to be tiles.
  const lessonWords = (parsed, index) => {
    const item = parsed.items[index];
    if (!item || item.kind === "open") return [];
    const list = [];
    for (const other of parsed.items) {
      if (other.kind === "note" || other.kind === "open") continue;
      const text = other.answer || "";
      if (!text || wordsOf(text).length > 2) return [];
      if (!list.some((seen) => normaliseAnswer(seen) === normaliseAnswer(text))) list.push(text);
    }
    return list.length >= 2 ? list : [];
  };
  const bankOpen = new Set();
  const modelOpen = new Set();

  function finishHtml(id, parsed, state, questions) {
    const marked = questions.filter((entry) => ["choose", "type"].includes(entry.item.kind));
    const right = marked.filter((entry) => state.results[entry.index] === "right").length;
    // The stars are the score and nothing else. A floor of one star was here
    // first, so a learner who got none right was shown a star for it — a small
    // lie, on the one panel that reports how they did. What a child who got
    // none right needs is the line under it, which says what to do next.
    const stars = marked.length ? Math.round((right / marked.length) * 3) : 3;
    const answered = questions.filter((entry) => state.results[entry.index]).length;
    return `<div class="gl-q gl-finish">
      <div class="gl-cheer" aria-hidden="true">${right === marked.length && marked.length ? "🌟" : "👏"}</div>
      <p class="gl-sentence">${marked.length ? `You got <strong>${right} of ${marked.length}</strong> right.` : "You worked through every question."}</p>
      ${marked.length ? `<div class="gl-stars" aria-label="${stars} out of 3 stars">${[0, 1, 2].map((position) => `<span class="${position < stars ? "on" : ""}">★</span>`).join("")}</div>` : ""}
      ${marked.length && right < marked.length ? `<p class="gl-feedback">${icon("lightbulb")} Read the pattern above once more, then press “Do it again”. “Show the words” helps if you are stuck.</p>` : ""}
      <p class="gl-note">${answered} of ${questions.length} questions answered. This practice is yours to repeat — it does not change your section tick.</p>
      ${parsed.modelNote ? (modelOpen.has(missKey(id, "end"))
        ? `<p class="gl-model">${icon("scale")} <span><strong>Check yours against this:</strong> ${esc(parsed.modelNote)}</span></p>`
        // The note is offered here as well as on the open questions, because a
        // lesson can carry one and have no open question to hang it on: Grade 4
        // Unit 1 ends "Now write your own sentence", which is an instruction
        // rather than an exercise, so the author's guidance about it had
        // nowhere to appear and was simply lost.
        : `<div class="gl-buttons"><button class="gl-ghost" type="button" data-gl-model="end">${icon("eye")} Check yourself</button></div>`) : ""}
      <div class="gl-buttons">
        ${goNext ? `<button class="gl-go" type="button" data-gl-next="1">${icon("arrow-right")} Next pattern</button>` : ""}
        <button class="gl-ghost" type="button" data-gl-step="0">${icon("rotate-ccw")} Do it again</button>
        <button class="gl-ghost" type="button" data-gl-reset="${esc(id)}">${icon("eraser")} Clear my answers</button>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------- Grade 1
  //
  // No key, no gaps, and a practice that is three worked examples of the rule's
  // own frame. So there is nothing to mark and marking is not what a five-year-
  // old needs here: the section's verb is SAY. The child taps a word, watches it
  // drop into the frame, hears the whole sentence, says it, and takes a star for
  // it. The star is the child's own claim — "I said it" — which is exactly what
  // it is labelled, and it is the only thing on this panel that is recorded.
  function grade1Html(lesson, parsed) {
    const id = lesson.grammarId;
    const state = saved(id);
    const chosen = state.answers.pick || "";
    const said = (key) => state.results[key] === "said";
    if (parsed.kind === "build") {
      const picked = parsed.fills.find((fill) => normaliseAnswer(fill.word) === normaliseAnswer(chosen));
      const stars = parsed.fills.map((fill) => (said(fill.word) ? "on" : "")).join("|");
      const doneCount = parsed.fills.filter((fill) => said(fill.word)).length;
      return `<section class="gl gl-g1${still() ? " gl-still" : ""}" data-gl="${esc(id)}">
        <div class="gl-top">
          <span class="gl-chip">${icon("hand")} Tap and say</span>
          <div class="gl-stars" aria-label="${doneCount} of ${parsed.fills.length} said">${stars.split("|").map((on) => `<span class="${on}">★</span>`).join("")}</div>
        </div>
        ${parsed.instruction ? `<p class="gl-say">${esc(parsed.instruction)}</p>` : ""}
        <p class="gl-frame">${picked ? `<span class="gl-built">${esc(picked.sentence)}</span>` : promptHtml(parsed.frame)}</p>
        <div class="gl-tiles">${parsed.fills.map((fill) => {
          const picture = pictureFor(fill.word);
          return `<button class="gl-tile big${picked && picked.word === fill.word ? " is-right" : ""}${said(fill.word) ? " is-said" : ""}" type="button" data-gl-build="${esc(fill.word)}" data-gl-lesson="${esc(id)}">
            ${picture ? `<span class="gl-pic" aria-hidden="true">${picture}</span>` : ""}<span>${esc(fill.word)}</span>${said(fill.word) ? `<span class="gl-tick" aria-hidden="true">★</span>` : ""}</button>`;
        }).join("")}</div>
        ${picked ? `<div class="gl-buttons">
            ${speak ? `<button class="gl-go" type="button" data-gl-speak="${esc(picked.sentence)}">${icon("volume-2")} Hear it</button>` : ""}
            <button class="gl-go gold" type="button" data-gl-said="${esc(picked.word)}" data-gl-lesson="${esc(id)}">${icon("star")} I said it</button>
          </div>` : `<p class="gl-feedback">${icon("hand")} Tap a word to put it in the sentence.</p>`}
        ${doneCount === parsed.fills.length && parsed.fills.length ? `<p class="gl-feedback is-right">${icon("party-popper")} You said all ${parsed.fills.length}! Try them again, or go to the next pattern.</p>` : ""}
      </section>`;
    }
    if (parsed.kind === "list") {
      const doneCount = parsed.items.filter((word) => said(word)).length;
      return `<section class="gl gl-g1${still() ? " gl-still" : ""}" data-gl="${esc(id)}">
        <div class="gl-top">
          <span class="gl-chip">${icon("hand")} Tap and say</span>
          <div class="gl-stars" aria-label="${doneCount} of ${parsed.items.length} said">${parsed.items.map((word) => `<span class="${said(word) ? "on" : ""}">★</span>`).join("")}</div>
        </div>
        ${parsed.instruction ? `<p class="gl-say">${esc(parsed.instruction)}</p>` : ""}
        <p class="gl-frame">${esc(parsed.frame)}</p>
        <div class="gl-tiles">${parsed.items.map((word) => {
          const picture = pictureFor(word);
          return `<button class="gl-tile big${said(word) ? " is-said" : ""}" type="button" data-gl-say-item="${esc(word)}" data-gl-lesson="${esc(id)}">
            ${picture ? `<span class="gl-pic" aria-hidden="true">${picture}</span>` : ""}<span>${esc(word)}</span>${said(word) ? `<span class="gl-tick" aria-hidden="true">★</span>` : ""}</button>`;
        }).join("")}</div>
        <p class="gl-feedback">${doneCount === parsed.items.length
          ? `${icon("party-popper")} You said them all! Well done.`
          : `${icon("hand")} Tap one, listen, then say it yourself.`}</p>
      </section>`;
    }
    const cards = parsed.examples;
    const doneCount = cards.filter((_, index) => said(String(index))).length;
    return `<section class="gl gl-g1${still() ? " gl-still" : ""}" data-gl="${esc(id)}">
      <div class="gl-top">
        <span class="gl-chip">${icon("mic")} Your turn to say it</span>
        <div class="gl-stars" aria-label="${doneCount} of ${cards.length} said">${cards.map((_, index) => `<span class="${said(String(index)) ? "on" : ""}">★</span>`).join("")}</div>
      </div>
      ${parsed.instruction ? `<p class="gl-say">${esc(parsed.instruction)}</p>` : ""}
      <div class="gl-cards">${cards.map((sentence, index) => `<div class="gl-card${said(String(index)) ? " is-said" : ""}">
        <p>${esc(sentence)}</p>
        <div class="gl-buttons">
          ${speak ? `<button class="gl-ghost" type="button" data-gl-speak="${esc(sentence)}">${icon("volume-2")} Hear it</button>` : ""}
          <button class="gl-go" type="button" data-gl-said="${index}" data-gl-lesson="${esc(id)}">${said(String(index)) ? icon("check") : icon("star")} I said it</button>
        </div>
      </div>`).join("")}</div>
      ${doneCount === cards.length && cards.length ? `<p class="gl-feedback is-right">${icon("party-popper")} You said them all! Well done.</p>` : ""}
    </section>`;
  }

  // --------------------------------------------------------------- the wiring
  //
  // One delegated click for the whole deck, and one delegated keydown for the
  // inputs. Both go through the deck's root, because the panel repaints itself
  // on every interaction and a listener bound to a button would be dead the
  // moment that button was replaced — which is the failure mode deck.js's own
  // "one delegated listener" note is about.
  function repaint(id, lesson) {
    const panel = document.querySelector(`[data-gl="${CSS.escape(id)}"]`);
    if (!panel) return;
    const replacement = document.createElement("div");
    replacement.innerHTML = panelHtml(lesson);
    const fresh = replacement.firstElementChild;
    if (!fresh) return;
    panel.replaceWith(fresh);
    icons();
    const input = fresh.querySelector("[data-gl-input]");
    if (input && document.activeElement !== input) input.focus({ preventScroll: true });
  }

  // Returns true when the event was the lab's, so the caller can stop.
  function handle(event, lessonOf) {
    const target = event.target.closest("[data-gl-step], [data-gl-pick], [data-gl-check], [data-gl-show], [data-gl-bank], [data-gl-fill], [data-gl-reset], [data-gl-build], [data-gl-said], [data-gl-say-item], [data-gl-speak], [data-gl-model], [data-gl-next]");
    if (!target) return false;
    const panel = target.closest("[data-gl]");
    if (!panel) return false;
    const id = panel.dataset.gl;
    const lesson = lessonOf(id);
    if (!lesson) return false;
    const parsed = parse(lesson);
    const data = target.dataset;

    if (data.glSpeak !== undefined) {
      if (!speak) return true;
      if (!soundOn()) { toast("Sound is muted. Use the sound button in the header to turn it on."); return true; }
      speak(data.glSpeak, target);
      return true;
    }
    if (data.glBuild !== undefined) {
      const state = saved(id);
      state.answers.pick = data.glBuild;
      saveState(id, state);
      chime.tap();
      repaint(id, lesson);
      // The sentence the child just built, read back to them — the AUTHOR's
      // sentence, never one assembled here. This is the tap they asked for, so
      // it is the one place the lab spends a runtime voice.
      if (speak && soundOn()) {
        const button = document.querySelector(`[data-gl="${CSS.escape(id)}"] [data-gl-speak]`);
        if (button) speak(button.dataset.glSpeak, button);
      }
      return true;
    }
    // One tap on a list tile is both halves: it is read aloud AND starred. A
    // separate "I said it" press per word would be two taps on each of three
    // tiles for a five-year-old, where the build lab has one thing on screen at
    // a time and can afford the second press.
    if (data.glSayItem !== undefined) {
      const state = saved(id);
      state.results[data.glSayItem] = "said";
      saveState(id, state);
      chime.right();
      repaint(id, lesson);
      if (speak && soundOn()) {
        const fresh = document.querySelector(`[data-gl="${CSS.escape(id)}"] [data-gl-say-item="${CSS.escape(data.glSayItem)}"]`);
        if (fresh) speak(data.glSayItem, fresh);
      }
      return true;
    }
    if (data.glSaid !== undefined) {
      const state = saved(id);
      state.results[data.glSaid] = "said";
      if (parsed.kind === "build") state.answers.pick = "";
      saveState(id, state);
      chime.right();
      repaint(id, lesson);
      return true;
    }
    if (data.glStep !== undefined) {
      const next = Math.max(0, Number(data.glStep));
      step.set(id, next);
      // The end-of-practice fanfare, once per lesson per sitting. Played from
      // the STEP handler rather than from finishHtml: the finish card repaints
      // whenever anything on it is pressed, and a render that makes a noise
      // makes it again every time.
      if (next >= parsed.items.length && !won.has(id)) { won.add(id); chime.win(); }
      repaint(id, lesson);
      return true;
    }
    if (data.glNext !== undefined) {
      goNext();
      return true;
    }
    if (data.glReset !== undefined) {
      saveState(id, { results: {}, answers: {} });
      step.set(id, 0);
      won.delete(id);
      for (const key of [...misses.keys()]) if (key.startsWith(`${id}:`)) misses.delete(key);
      repaint(id, lesson);
      return true;
    }
    if (data.glModel !== undefined) {
      // "end" is the finish card's own slot; anything else is a question index.
      modelOpen.add(missKey(id, data.glModel === "end" ? "end" : Number(data.glModel)));
      repaint(id, lesson);
      return true;
    }
    if (data.glBank !== undefined) {
      const key = `${id}:${data.glBank}`;
      if (bankOpen.has(key)) bankOpen.delete(key); else bankOpen.add(key);
      repaint(id, lesson);
      return true;
    }
    if (data.glFill !== undefined) {
      const input = panel.querySelector(`[data-gl-input="${data.glIndex}"]`);
      if (input) { input.value = data.glFill; input.focus({ preventScroll: true }); }
      return true;
    }
    if (data.glPick !== undefined) {
      const index = Number(data.glIndex);
      const item = parsed.items[index];
      if (!item) return true;
      if (matches(item, data.glPick)) {
        record(id, index, "right", data.glPick);
        chime.right();
      } else {
        misses.set(missKey(id, index), missed(id, index) + 1);
        record(id, index, "", data.glPick);
        chime.miss();
      }
      repaint(id, lesson);
      return true;
    }
    if (data.glCheck !== undefined) {
      const index = Number(data.glCheck);
      const item = parsed.items[index];
      const input = panel.querySelector(`[data-gl-input="${index}"]`);
      const typed = input ? input.value : "";
      if (!typed.trim()) { toast("Write your answer in the box first."); return true; }
      if (item.kind === "open") { record(id, index, "done", typed); chime.tap(); }
      else if (matches(item, typed)) { record(id, index, "right", typed); chime.right(); }
      else if (item.kind === "write") { record(id, index, "done", typed); chime.tap(); }
      else { misses.set(missKey(id, index), missed(id, index) + 1); record(id, index, "", typed); chime.miss(); }
      repaint(id, lesson);
      return true;
    }
    if (data.glShow !== undefined) {
      const index = Number(data.glShow);
      record(id, index, "shown");
      repaint(id, lesson);
      return true;
    }
    return false;
  }

  // Enter checks the answer, which is what a keyboard expects of a one-line
  // form and what stops the deck's own arrow handling from swallowing the key.
  function bindKeys(root, lessonOf) {
    root.addEventListener("keydown", (event) => {
      const input = event.target.closest("[data-gl-input]");
      if (!input || event.key !== "Enter") return;
      event.preventDefault();
      const panel = input.closest("[data-gl]");
      const button = panel?.querySelector(`[data-gl-check="${input.dataset.glInput}"]`);
      if (button) button.click();
    });
    // Typing is saved as it happens, so a learner who swipes to the next
    // pattern and back finds their sentence where they left it — the same
    // promise the activities deck's note boxes make.
    root.addEventListener("input", (event) => {
      const input = event.target.closest("[data-gl-input]");
      if (!input) return;
      const panel = input.closest("[data-gl]");
      if (!panel) return;
      const id = panel.dataset.gl;
      if (!lessonOf(id)) return;
      const state = saved(id);
      state.answers[input.dataset.glInput] = input.value;
      saveState(id, state);
    });
  }

  return { panelHtml, handle, bindKeys };
}

function ensureStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLE;
  document.head.appendChild(style);
}

// Every rule is scoped to `.gl`, which only this module ever writes, and the
// module is only ever constructed at Grades 1-4 — so no upper-stage page can
// match one of these even by accident. The panel sits inside .gc-inner, which
// is a white card on a coloured slide, so it paints itself as a warm tinted
// block rather than a second white one.
//
// Motion is decoration and never information: every state this file animates is
// also said in text, and prefers-reduced-motion (through .gl-still, so a child
// whose system setting says so gets the same lab standing still) turns the
// animation off without turning anything else off.
const STYLE = `
.gl { width: 100%; text-align: left; display: grid; gap: 12px; margin-top: 6px; padding: 16px 16px 18px; border-radius: 18px;
  background: linear-gradient(160deg, #fff6e8 0%, #fdeede 100%); border: 2px solid #f2d3ad; }
.gl-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.gl-chip { display: inline-flex; align-items: center; gap: 7px; font-weight: 700; font-size: 14px; letter-spacing: .3px; text-transform: uppercase;
  color: #8a4b12; background: #ffe6c6; border-radius: 999px; padding: 6px 13px; }
.gl-chip svg, .gl-chip i { width: 16px; height: 16px; }
.gl-pips { display: flex; gap: 6px; }
.gl-pip { width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 2px solid #e3bd90; transition: transform .2s, background .2s; }
.gl-pip.is-right { background: #17915f; border-color: #17915f; }
.gl-pip.is-shown { background: #e0a52c; border-color: #e0a52c; }
.gl-pip.is-done { background: #2a6cb0; border-color: #2a6cb0; }
.gl-pip.is-here { transform: scale(1.35); border-color: #8a4b12; }
.gl-say { margin: 0; font-size: 16px; line-height: 1.45; color: #6b3f14; font-weight: 600; }
.gl-stage { display: grid; }
.gl-q { display: grid; gap: 11px; justify-items: stretch; }
.gl-count { font-size: 13px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #a06a2c; display: inline-flex; align-items: center; gap: 6px; }
.gl-count svg, .gl-count i { width: 15px; height: 15px; }
.gl-sentence { margin: 0; font-size: 21px; line-height: 1.5; color: #17324d; font-weight: 600; }
.gl-frame { margin: 0; text-align: center; font-size: 30px; line-height: 1.35; color: #17324d; font-weight: 700; }
.gl-built { display: inline-block; animation: gl-pop .34s ease-out; color: #0e6b45; }
.gl-guide { margin: 0; font-size: 15px; color: #6b3f14; display: flex; align-items: center; gap: 7px; }
.gl-guide svg, .gl-guide i { width: 16px; height: 16px; flex: 0 0 auto; }

.gl-blank { display: inline-block; min-width: 76px; padding: 1px 12px; margin: 0 3px; border-radius: 9px; text-align: center;
  background: #fff; border: 2px dashed #d8ab74; color: #b0863f; font-weight: 700; }
.gl-blank.is-filled { border-style: solid; }
.gl-blank.is-right { background: #dff5e9; border-color: #17915f; color: #0e6b45; }
.gl-blank.is-shown { background: #fdf0d3; border-color: #e0a52c; color: #8a5b0d; }

.gl-tiles { display: flex; flex-wrap: wrap; gap: 10px; }
.gl-tile { font: inherit; font-size: 19px; font-weight: 700; color: #17324d; background: #fff; border: 2px solid #e3bd90; border-radius: 14px;
  padding: 12px 20px; cursor: pointer; box-shadow: 0 3px 0 #e3bd90; transition: transform .14s, box-shadow .14s, background .2s; }
.gl-tile:hover { transform: translateY(-2px); box-shadow: 0 5px 0 #e3bd90; }
.gl-tile:active { transform: translateY(2px); box-shadow: 0 1px 0 #e3bd90; }
.gl-tile[disabled] { cursor: default; opacity: .55; }
.gl-tile.is-right { background: #dff5e9; border-color: #17915f; box-shadow: 0 3px 0 #17915f; color: #0e6b45; opacity: 1; }
.gl-tile.is-wrong { background: #fdeaea; border-color: #c0503a; box-shadow: 0 3px 0 #c0503a; color: #8f3524; animation: gl-shake .32s ease-in-out; }
.gl-tile.small { font-size: 16px; padding: 8px 15px; }
.gl-tile.big { display: grid; justify-items: center; gap: 4px; min-width: 108px; padding: 14px 18px; font-size: 22px; position: relative; }
.gl-tile.is-said { border-color: #d8a52c; box-shadow: 0 3px 0 #d8a52c; }
.gl-tile .gl-pic { font-size: 34px; line-height: 1; }
.gl-tile .gl-pic svg, .gl-tile .gl-pic img { width: 46px; height: 46px; }
.gl-tick { position: absolute; top: -9px; right: -7px; font-size: 20px; color: #e0a52c; }
.gl-bank { display: flex; flex-wrap: wrap; gap: 8px; padding: 9px; border-radius: 12px; background: #fffaf1; border: 1px dashed #e3bd90; }

.gl-answer { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.gl-input { font: inherit; font-size: 19px; font-weight: 600; color: #17324d; background: #fff; border: 2px solid #e3bd90; border-radius: 12px;
  padding: 11px 14px; flex: 1 1 210px; min-width: 0; }
.gl-input:focus { outline: 3px solid #f0b354; outline-offset: 1px; border-color: #d8a52c; }
.gl-input[disabled] { background: #f7f1e7; }
.gl-hint { font-size: 15px; font-weight: 700; color: #8a4b12; background: #ffe6c6; border-radius: 999px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px; }
.gl-hint svg, .gl-hint i { width: 15px; height: 15px; }

.gl-buttons { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; }
.gl-go, .gl-ghost { font: inherit; font-size: 17px; font-weight: 700; border-radius: 999px; padding: 12px 21px; border: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px; transition: transform .14s, box-shadow .14s; }
.gl-go { background: #17915f; color: #fff; box-shadow: 0 4px 12px #17915f38; }
.gl-go.gold { background: #d8880f; box-shadow: 0 4px 12px #d8880f38; }
.gl-ghost { background: #fff; color: #8a4b12; border: 2px solid #e3bd90; }
.gl-go:hover, .gl-ghost:hover { transform: translateY(-2px); }
.gl-go:active, .gl-ghost:active { transform: translateY(0) scale(.97); }
.gl-go svg, .gl-go i, .gl-ghost svg, .gl-ghost i { width: 18px; height: 18px; }
.gl-nav { display: flex; justify-content: space-between; gap: 8px; margin-top: 2px; }
.gl-nav .gl-ghost { font-size: 15px; padding: 8px 15px; border-color: #ecd8bd; }

.gl-feedback { margin: 0; min-height: 24px; font-size: 17px; font-weight: 600; color: #8a4b12; display: flex; align-items: center; gap: 8px; }
.gl-feedback svg, .gl-feedback i { width: 19px; height: 19px; flex: 0 0 auto; }
.gl-feedback.is-right { color: #0e6b45; animation: gl-pop .34s ease-out; }
.gl-feedback.is-shown { color: #8a5b0d; }
.gl-feedback.is-done { color: #23558c; }

.gl-note-step .gl-sentence { font-size: 18px; font-weight: 600; color: #6b3f14; }
.gl-note { margin: 0; font-size: 14px; line-height: 1.5; color: #7a5a33; }
.gl-model { margin: 0; display: flex; gap: 9px; padding: 11px 13px; border-radius: 12px; background: #eef4fa; border: 1px solid #cfdff0;
  font-size: 16px; line-height: 1.5; color: #23558c; }
.gl-model svg, .gl-model i { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 2px; }
.gl-model strong { color: #17324d; }
.gl-finish { justify-items: center; text-align: center; }
.gl-cheer { font-size: 46px; line-height: 1; animation: gl-pop .5s ease-out; }
.gl-stars { display: flex; gap: 4px; font-size: 26px; color: #e0cdb0; line-height: 1; }
.gl-stars .on { color: #e8a51d; }
.gl-cards { display: grid; gap: 10px; }
.gl-card { display: grid; gap: 9px; padding: 13px 15px; border-radius: 14px; background: #fff; border: 2px solid #f0dcc0; }
.gl-card p { margin: 0; font-size: 20px; font-weight: 600; line-height: 1.4; color: #17324d; }
.gl-card.is-said { border-color: #17915f; background: #f2fbf6; }

@keyframes gl-pop { 0% { transform: scale(.86); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
@keyframes gl-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.gl-still *, .gl-still *::before, .gl-still *::after { animation: none !important; transition: none !important; }
@media (prefers-reduced-motion: reduce) {
  .gl *, .gl *::before, .gl *::after { animation: none !important; transition: none !important; }
}
@media (max-width: 620px) {
  .gl { padding: 13px 12px 15px; }
  .gl-sentence { font-size: 19px; }
  .gl-frame { font-size: 24px; }
  .gl-tile { font-size: 17px; padding: 11px 16px; }
}
`;

