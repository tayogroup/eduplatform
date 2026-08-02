// Teacher-voice → learner-voice conversion, shared by the subject builders.
//
// WHY THIS IS A LIBRARY
// ---------------------
// Several Ehel subjects ship their early stages as adult-led packs: Computing
// Stages 1-4 as Teacher Guides, Global Perspectives Years 1-3 as "Teacher &
// Parent Guide" documents. All of them teach through the adult —
//
//     "Hold up a phone and ask brightly: 'What is this?'"
//
// — and all of the courses are self-teaching, so shown verbatim on a learner's
// screen that sentence teaches nothing and, worse, waits for an adult who is
// not there. The conversion below was built and hardened for Computing. Global
// Perspectives needs exactly the same treatment, and CLAUDE.md's standing rule
// for this repo is that a definition used by two tools lives in one place
// rather than as two copies that drift.
//
// Three things are recovered from an adult-addressed sentence, in priority
// order:
//   1. quoted speech — the guide's own child-facing words, which are exactly
//      the explanation the learner needs;
//   2. declarative prose — stories and statements that already address anyone;
//   3. directives, rewritten to the second person, but only when steps 1 and 2
//      leave too little to teach from.
//
// SUBJECT VOCABULARY
// ------------------
// The grammar is general; the word lists are not. "debug", "sprite" and
// "algorithm" are learner verbs in Computing and meaningless in Global
// Perspectives, which instead needs "research", "reflect" and "collaborate".
// So a subject passes its own vocabulary to createLearnerVoice() and gets a
// converter bound to it. The shared defaults cover the words every subject
// uses.

const DEFAULT_SOURCE_MARKER = /\[(?:TIP|FREE|AI|CT|!|\?|x|\*|>|Star|Note|Warning|Key|Safety|Fact|Look|Robot|Check|Info)\]\s*/gi;

// Verbs that read as the learner doing something. Used to decide when a
// third-person "they" can only mean the learner.
const BASE_LEARNER_VERBS = [
  "learn", "learns", "will learn", "need", "needs", "only need", "meet", "meets", "will meet",
  "know", "knows", "already know", "understand", "understands", "discover", "discovers",
  "practise", "practises", "practice", "practices", "write", "writes", "draw", "draws",
  "circle", "circles", "colour", "colours", "color", "colors", "match", "matches",
  "tick", "ticks", "cut", "cuts", "stick", "sticks", "say", "says", "tell", "tells",
  "explain", "explains", "describe", "describes", "sort", "sorts", "count", "counts",
  "build", "builds", "make", "makes", "test", "tests", "choose", "chooses",
  "pick", "picks", "find", "finds", "are ready", "are able", "are experts",
  "love", "loves", "enjoy", "enjoys",
];

const BASE_INSTRUCTION_VERBS = [
  "ask", "asks", "asking", "tell", "tells", "telling", "let", "lets", "letting",
  "help", "helps", "helping", "show", "shows", "showing", "encourage", "encourages",
  "encouraging", "remind", "reminds", "reminding", "give", "gives", "giving",
  "watch", "watches", "watching", "support", "supports", "praise", "praises",
  "guide", "guides", "prompt", "prompts", "invite", "invites", "allow", "allows",
];

// Deliberately no wider than the list Computing shipped with: adding a noun
// here silently changes what an already-gated subject produces. New words go in
// the calling subject's options, not in this default.
const BASE_LEARNER_POSSESSIONS = [
  "work", "answers?", "names?", "projects?", "books?", "sheets?", "partners?",
  "own words", "ideas?", "drawings?", "pictures?", "lists?", "stories", "story",
  "designs?", "charts?", "graphs?", "fingers?", "hands?",
];

// Explicit rather than a de-inflection rule: "presses"→"press" and
// "practises"→"practise" need opposite treatment of the trailing "es", and a
// generic rule turns "focuses" into "focu".
const BASE_THIRD_PERSON = {
  is: "are", has: "have", was: "were", does: "do", goes: "go", says: "say",
  learns: "learn", needs: "need", meets: "meet", knows: "know", understands: "understand",
  discovers: "discover", practises: "practise", practices: "practice", writes: "write",
  draws: "draw", circles: "circle", colours: "colour", colors: "color",
  matches: "match", ticks: "tick", cuts: "cut", sticks: "stick", tells: "tell",
  explains: "explain", describes: "describe", sorts: "sort", counts: "count",
  builds: "build", makes: "make", tests: "test", chooses: "choose", picks: "pick",
  finds: "find", loves: "love", enjoys: "enjoy", adds: "add", sees: "see",
  wants: "want", gets: "get", points: "point", looks: "look", uses: "use",
  moves: "move", plays: "play", opens: "open", starts: "start", finishes: "finish",
  checks: "check", reads: "read", takes: "take", puts: "put",
};

const DIRECTIVE_START = /^(hold|show|ask|tell|let|point|walk|say|play|read|print|give|encourage|praise|remind|model|demonstrate|repeat|finish|invite|prompt|help|sit|gather|hand|put|write|draw|use|take|bring|choose|pick|call|go around|circulate|watch|listen|make sure|allow|support|celebrate|display|collect|distribute|explain|start|begin|end|do|keep|try|set up|prepare|check|split|pair|group|count|line|stick|cut|open|close|click|press|save|stop|swap|move|place|expect|note|be ready|aim to|plan to|then ask|then tell|then let|then show|then play|then say)\b/i;

const ADULT_SUBJECT = /\b(the child(?:ren)?|children|your child|the class|the pupils?|the learners?|the group|each child|every child|the children's)\b/i;

// Prose that briefs whoever is sitting with the child. Some of it names an
// adult outright; the rest gives itself away by talking *about* the learner in
// the third person ("Children this age are experts already") or by managing the
// lesson ("Keep everything short and playful"). None of it is learner content.
const ADULT_ADDRESSED = /\b(teacher|parent|grown-?up|adult|classroom)\b|\byou (?:read|say|explain|model|demonstrate|ask|show|prompt|guide|scaffold)\b|\bat this age\b|\bpre-?readers?\b|\bone per child\b|\bprint one\b|\bthe answer key is for you\b|\bchildren (?:this age|are|have|will|learn|love|find|need|get|can)\b|\bthis age\b|\bsix-?year-?old|five-?year-?old|seven-?year-?old|eight-?year-?old|nine-?year-?old|ten-?year-?old\b|\bkeep (?:everything|it|the lesson|each session)\b|\bdo one task at a time\b|\bthis (?:unit|lesson) is (?:teacher|adult)-?led\b|\bwe start from what they know\b|\btheir own children'?s? names\b|\bage \d\b/i;

// Classroom props and staging. A rewritten sentence that still mentions them is
// describing a room the learner is not sitting in.
const CLASSROOM = /\b(on the board|the big sheet|the cards|picture cards|flash ?cards|the class|classroom|whiteboard|circle time|on the carpet|photocopy|their own|one at a time to each|hand out|go round the|little hands|lots of help|together first|do it together)\b/i;

// Text that came through the converter still carrying stage directions. Used to
// reject a candidate rather than show a learner an instruction addressed to
// someone who is not in the room.
const DIRECTIVE_RESIDUE = /\b(aloud|read each|read both|read every|finish by|point out|show a real|hold up|one per child|go around|walk around the room|call out|during the (?:lesson|session)|before the child|to the class)\b/i;

// Words after "you" that end in "s" but are not third-person verbs, so
// de-inflecting them would produce "you alway" or "you focu".
const KEEP_S = /(?:ss|us|is|as|os)$/i;
const NOT_A_VERB = new Set([
  "always", "sometimes", "perhaps", "unless", "various", "yourselves", "ourselves",
  "themselves", "yours", "theirs", "others", "everyones", "afterwards", "towards",
  "upwards", "downwards", "backwards", "forwards", "sideways", "anyways",
]);

const capitalise = (value = "") => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/**
 * Build a learner-voice converter bound to one subject's vocabulary.
 *
 * @param {object} options
 * @param {RegExp} [options.sourceMarker]   bracketed typesetter tags to strip
 * @param {string[]} [options.learnerVerbs]        extra verbs the learner performs
 * @param {string[]} [options.instructionVerbs]    extra verbs aimed at the adult
 * @param {string[]} [options.learnerPossessions]  extra nouns the learner owns
 * @param {Record<string,string>} [options.thirdPerson] extra third-person → base forms
 * @param {RegExp} [options.classroom]     extra staging vocabulary (replaces default)
 */
function createLearnerVoice(options = {}) {
  const sourceMarker = options.sourceMarker || DEFAULT_SOURCE_MARKER;
  const classroom = options.classroom || CLASSROOM;
  const thirdPerson = { ...BASE_THIRD_PERSON, ...(options.thirdPerson || {}) };
  const learnerVerb = [...BASE_LEARNER_VERBS, ...(options.learnerVerbs || [])].join("|");
  const instructionVerb = [...BASE_INSTRUCTION_VERBS, ...(options.instructionVerbs || [])].join("|");
  const learnerPossession = [...BASE_LEARNER_POSSESSIONS, ...(options.learnerPossessions || [])].join("|");

  const tidy = (value = "") => String(value)
    .replace(/�/g, "–")
    .replace(sourceMarker, "")
    .replace(/\s+/g, " ")
    .trim();

  function splitSentences(text) {
    return String(text || "")
      .split(/(?<=[.!?])\s+(?=[A-Z“"'0-9])/)
      .map(tidy)
      .filter(Boolean);
  }

  // Speech in these guides regularly runs across a sentence boundary, and
  // splitting into sentences first tore those quotes in half, leaving fragments
  // like "Let them answer, then say:." on the learner's screen. So quoted spans
  // are lifted out before any splitting happens and the surrounding frame is
  // evaluated on its own.
  function extractQuotes(text) {
    const quotes = [];
    const frame = String(text || "").replace(/[“"]([^“”"]{3,600})[”"]/g, (whole, inner) => {
      quotes.push(tidy(inner));
      return " ⟪Q⟫ ";
    });
    return { frame, quotes };
  }

  function deInflect(verb) {
    const lower = verb.toLowerCase();
    const irregular = { is: "are", has: "have", was: "were", does: "do", goes: "go", "isn't": "aren't", "hasn't": "haven't", "doesn't": "don't" };
    if (irregular[lower]) return irregular[lower];
    if (thirdPerson[lower]) return thirdPerson[lower];
    if (lower.length > 3 && lower.endsWith("s") && !KEEP_S.test(lower) && !NOT_A_VERB.has(lower)) {
      if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
      if (lower.endsWith("hes") || lower.endsWith("oes")) return lower.slice(0, -2);
      return lower.slice(0, -1);
    }
    return null;
  }

  // "the child" → "you", "their" → "your", and so on. Applied only to sentences
  // that survive the directive filter, so it never invents learner prose out of
  // a line that was pure classroom management.
  function toSecondPerson(value = "") {
    const swapped = String(value)
      // "Can they tell you which is big" — the "you" there is the adult, so the
      // pronoun swap below would turn it into "Can you tell you which is big".
      .replace(/\btell(?:s|ing)? you\b/gi, "say")
      .replace(/\bshow(?:s|ing)? you\b/gi, "point it out")
      .replace(/\bLet\s+(?:the|your|each|every)?\s*(?:child(?:ren)?|them|class|pupils?|learners?)\s+/gi, "You can ")
      .replace(/\b(?:ask|encourage|invite|get|help|remind)(?:ing|s)?\s+(?:the|your|each|every)?\s*(?:child(?:ren)?|them|class|pupils?|learners?)\s+to\s+/gi, "try to ")
      .replace(/\b(?:your|the|each|every)\s+child(?:ren)?\b/gi, "you")
      .replace(/\bthe (?:children|class|group)\b/gi, "you")
      .replace(/\bchildren\b/gi, "you")
      .replace(/\bthe (?:learners?|pupils?)\b/gi, "you")
      // The swap leaves a third-person verb behind ("you circles", "you is").
      .replace(/\byou\s+([a-z]+)\b/gi, (whole, verb) => {
        const base = deInflect(verb);
        return base ? `you ${base}` : whole;
      })
      .replace(/\byou's\b/gi, "your")
      .replace(/\s+/g, " ")
      .trim();
    return repairAgreement(swapped);
  }

  // In the adult-led guides "they/them/their" usually means the child being
  // taught, and left alone those pronouns produce prose that talks about the
  // learner instead of to them. But the same pronouns also refer to ordinary
  // objects in the very same paragraph ("The steps only work if they are in the
  // right order"), where the swap produces nonsense. So the swap fires only in
  // the grammatical positions where the referent can only be the learner.
  function swapLearnerPronouns(value = "") {
    return String(value)
      .replace(/\btell(?:s|ing)? you\b/gi, "say")
      .replace(/\bshow(?:s|ing)? you\b/gi, "point it out")
      .replace(/\b(?:Do|Can|Will|Should|Could)\s+they\b/gi, "Can you")
      // "let them finish" is an instruction to the adult, not an object pronoun.
      .replace(/\blet\s+(?:the|your|each|every)?\s*(?:child(?:ren)?|them|class|pupils?|learners?)\s+/gi, "you can ")
      .replace(new RegExp(`\\bthey\\s+(?=(?:${learnerVerb})\\b)`, "gi"), "you ")
      .replace(new RegExp(`\\b(${instructionVerb})\\s+them\\b`, "gi"), "$1 you")
      .replace(new RegExp(`\\btheir\\s+(?=(?:${learnerPossession})\\b)`, "gi"), "your ")
      .replace(/\byou\s+([a-z]+)\b/gi, (whole, verb) => {
        const base = thirdPerson[verb.toLowerCase()];
        return base ? `you ${base}` : whole;
      })
      // Every swap above inserts lowercase, so a pronoun that opened a sentence
      // leaves the sentence starting mid-word ("… boxes. you write 1, 2, 3, 4").
      .replace(/(^|[.!?]\s+)(you|your)\b/g, (whole, lead, word) => `${lead}${capitalise(word)}`);
  }

  // Cleanups that apply to anything the converter produces: punctuation left
  // behind by a removed quote, and the sentence-case artefacts of splicing a
  // rewritten clause into the middle of a sentence.
  function polish(value = "") {
    return tidy(String(value))
      .replace(/\s*([:;,])\s*\./g, ".")
      .replace(/\.{2,}/g, ".")
      .replace(/\s+([.,!?])/g, "$1")
      .replace(/\b(and|then|or|but|so)\s+(You can|Try to)\b/g, (whole, joiner, clause) => `${joiner} ${clause.toLowerCase()}`)
      .replace(/^\s*(and|then|or|but|so)\s+/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function learnerVoice(text, { allowRewrite = true, guide = false } = {}) {
    const source = guide ? swapLearnerPronouns(tidy(text)) : tidy(text);
    if (!source) return "";
    const { frame, quotes } = extractQuotes(source);
    const kept = [];
    const rewritten = [];
    let quoteCursor = 0;
    for (const line of splitSentences(frame)) {
      const marks = (line.match(/⟪Q⟫/g) || []).length;
      const spoken = quotes.slice(quoteCursor, quoteCursor + marks);
      quoteCursor += marks;
      // The frame with its quotes removed: what the adult was told to *do*.
      const bare = tidy(line.replace(/⟪Q⟫/g, "").replace(/\s*[:,;]\s*$/, "").replace(/\s{2,}/g, " "));
      const isDirective = DIRECTIVE_START.test(bare) || ADULT_SUBJECT.test(bare);
      const isAdultOnly = ADULT_ADDRESSED.test(bare);
      if (marks) {
        // Speech the guide puts in the adult's mouth is written for the child,
        // so it is the explanation. When the frame around it is itself
        // learner-safe the quote is spliced back where it stood.
        if (!isDirective && !isAdultOnly && bare.length > 20 && !classroom.test(bare)) {
          let index = 0;
          const merged = tidy(line.replace(/⟪Q⟫/g, () => `“${spoken[index++] || ""}”`));
          if (merged.length > 20) kept.push(/[.!?”]$/.test(merged) ? merged : `${merged}.`);
          continue;
        }
        for (const quote of spoken) if (quote.length > 10) kept.push(/[.!?]$/.test(quote) ? quote : `${quote}.`);
        continue;
      }
      if (!bare) continue;
      // Classroom staging ("On the board, draw four dots…") reads as ordinary
      // declarative prose, so the directive test misses it. It is still an
      // instruction to somebody who is not in the room.
      if (classroom.test(bare)) continue;
      if (!isDirective && !isAdultOnly) {
        kept.push(bare);
        continue;
      }
      if (isAdultOnly) continue; // classroom management, never learner content
      const swapped = toSecondPerson(bare);
      if (swapped && swapped.length > 20
        && !ADULT_SUBJECT.test(swapped) && !ADULT_ADDRESSED.test(swapped)
        && !DIRECTIVE_RESIDUE.test(swapped) && !classroom.test(swapped)) {
        rewritten.push(capitalise(/[.!?]$/.test(swapped) ? swapped : `${swapped}.`));
      }
    }
    let out = kept.join(" ");
    if (allowRewrite && out.length < 260 && rewritten.length) out = [out, ...rewritten].filter(Boolean).join(" ");
    return polish(out);
  }

  return {
    // The merged third-person → base-form map. Exposed because a builder may
    // need to de-inflect outside the converter (Computing does, when it
    // rewrites a session title).
    thirdPerson,
    tidy,
    capitalise,
    polish,
    splitSentences,
    extractQuotes,
    toSecondPerson,
    swapLearnerPronouns,
    learnerVoice,
    patterns: { DIRECTIVE_START, ADULT_SUBJECT, ADULT_ADDRESSED, CLASSROOM: classroom, DIRECTIVE_RESIDUE },
  };
}

// CommonJS: the subject builders are CJS (`require`), and the .mjs checkers can
// still `import { ADULT_ADDRESSED } from "../lib/ehel-learner-voice.js"` because
// Node detects named exports off a plain object literal assignment.
// The noun swap replaces the subject but leaves the auxiliary in front of it
// agreeing with the old one: "Does your child follow the steps?" became "Does
// you follow the steps?". De-inflecting the verb behind "you" never reached it,
// because the broken word sits ahead of the pronoun.
//
// Exported on its own because reviewed text needs it too. A reviewer correcting
// narration wording is not asked to repair the converter's grammar, and six
// reviewed strings duly came back still reading "Does you plan before
// building?". This is mechanical agreement, not rewriting — it changes none of
// the reviewer's own words.
function repairAgreement(value = "") {
  const AUXILIARIES = {
    does: "do", is: "are", was: "were", has: "have",
    "doesn't": "don't", "isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't",
  };
  return String(value)
    .replace(/\b(does|is|was|has|doesn't|isn't|wasn't|hasn't)(\s+you\b)/gi, (whole, auxiliary, rest) => {
      const base = AUXILIARIES[auxiliary.toLowerCase()];
      if (!base) return whole;
      const capitalised = auxiliary[0] === auxiliary[0].toUpperCase();
      return `${capitalised ? base[0].toUpperCase() + base.slice(1) : base}${rest}`;
    })
    // "How many children came by car?" needs the partitive once the noun goes:
    // "How many you came" is not a sentence a six-year-old can read.
    .replace(/\bhow many you\b/gi, (whole) => (whole[0] === "H" ? "How many of you" : "how many of you"))
    .replace(/\bmeans more you\b/gi, "means more");
}

module.exports = {
  createLearnerVoice,
  repairAgreement,
  DIRECTIVE_START,
  ADULT_SUBJECT,
  ADULT_ADDRESSED,
  CLASSROOM,
  DIRECTIVE_RESIDUE,
  DEFAULT_SOURCE_MARKER,
  capitalise,
};
