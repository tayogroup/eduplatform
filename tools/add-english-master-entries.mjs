#!/usr/bin/env node
// Add master-dictionary entries for Core words that have none, for any grade.
//
// The word-alone clip a learner hears when tapping a vocabulary word comes from
// the `dictionary` category of generate-ehel-english-audio.js, which iterates
// master-dictionary.gradeN.json. A Core word missing from it has five sentence
// clips and no way to say ITSELF — and on a phonics or spelling card that is the
// clip that matters most. english.js draws the "Listen at 0.90x" control only
// where `master.audio.available` is true, so such a word shows no control at all.
//
// This supersedes add-grade1-master-entries.mjs, which did the same job for one
// grade. Two tools doing this would drift, and the drift would be invisible:
// each grade's dictionary would be built by different rules with nothing
// reporting the difference.
//
//   node tools/add-english-master-entries.mjs --grade 2           # report
//   node tools/add-english-master-entries.mjs --grade 2 --write   # apply
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
let GRADE = null, WRITE = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  if (argv[i] === "--write") { WRITE = true; continue; }
  console.error(`Unrecognised argument: ${argv[i]}`);
  console.error("Usage: add-english-master-entries.mjs --grade N [--write]");
  process.exit(2);
}
if (!Number.isInteger(GRADE) || GRADE < 1 || GRADE > 8) {
  console.error("--grade N is required (1-8)");
  process.exit(2);
}
const DATA = path.join(ROOT, `grade-${GRADE}`, "data");

// The parts of speech already in use, with the child-facing definitions the
// existing entries carry. Nothing new is invented here. Note `position` is a
// part of speech this course uses and a grammar book does not — it is what the
// existing entries give `under`, `on`, `up`, `down`, `here`, `there`, `near`.
const POS = {
  noun: "A naming word",
  verb: "Shows an action or a state.",
  adjective: "Describes a noun.",
  pronoun: "A small word that stands in for a naming word.",
  article: "A small word that goes before a naming word.",
  number: "Names a quantity or position in an order.",
  position: "Shows where one thing is compared with another.",
  preposition: "Shows where one thing is compared with another.",
  conjunction: "Joins two words, phrases or ideas together.",
  interjection: "A word that shows strong feeling, like surprise or joy.",
  adverb: "Describes how, when or where an action happens.",
  phrase: "A small group of words that works together.",
};

// Part of speech per grade. Closed-class words follow the precedent the grade's
// EXISTING entries already set rather than textbook grammar, so one file does
// not describe the same kind of word two ways.
const CLASS_BY_GRADE = {
  1: {
    article: "a an the",
    pronoun: "i you he she it we they me him us them who what which my your his her our their",
    adjective: "this that these those some all little big good bad happy sad hot cold fast slow clean dirty soft "
      + "hard loud quiet full empty wet dry kind funny beautiful small tall old young new long short thin thick "
      + "rich much quick tired excited worried calm angry afraid hungry thirsty grey black white red blue green "
      + "yellow orange pink purple brown fair",
    verb: "am is are was were be have has do does can will go come look see say said like want play make help "
      + "ask bring carry catch clap close count cut draw drink eat find give hear jump kick laugh "
      + "listen live open pick put read ride run sing sit sleep smile speak stand talk throw walk wash watch write "
      + "dig dip hop tell swim chat share smell taste touch ring should",
    position: "in above below behind beside between inside outside into out over up down near far",
    preposition: "at to from for of with",
    conjunction: "and but or because",
    adverb: "when where why how now today tomorrow first last before after very not",
    number: "zero one two three four five six seven eight nine ten",
    interjection: "hello goodbye sorry please welcome yes no",
    phrase: "thankyou",
  },
  // Grade 2 follows the supplied Core list's own ten categories, which already
  // sort the words by function — actions, describing words, people, objects —
  // and that is a better authority than anything derivable from the spelling.
  // Only the mixed categories (long vowels, function words, time/position,
  // feelings, story words) needed a per-word decision.
  2: {
    verb: "add agree arrive bake begin believe borrow break build buy call change choose climb collect compare "
      + "complete copy cover create cross decide describe discover drop explain finish follow happen hold imagine "
      + "improve include join know learn leave measure meet move notice order pack pass plan point practise pull "
      + "push remember return save search send solve study take teach think try understand visit wake wear win "
      + "work respect trust promise forgive invite protect retell predict discuss whisper recycle grow show use "
      + "sail wait stay need keep cook start turn burn hurt hope rhyme",
    adjective: "able alive alone amazing asleep awake brave broken busy careful clever cloudy correct dangerous "
      + "deep different difficult easy equal famous friendly gentle great healthy heavy helpful important "
      + "interesting lovely lucky noisy perfect poor pretty proud ready safe same shiny sick simple special "
      + "strange strong sweet warm weak wide wild wonderful wrong bored confused disappointed embarrassed glad "
      + "lonely nervous surprised thankful upset comfortable confident honest polite patient curious bright "
      + "high cool dark late",
    position: "across along among around behind below between through toward towards upon off middle centre "
      + "bottom front back side north south east west past",
    preposition: "about against during until",
    conjunction: "although because however therefore unless whether nor since",
    adverb: "also already almost apart always ever never often perhaps sometimes usually soon again next then "
      + "early yet once together",
    // Follows GRADE 2's own existing entries, which are the only real precedent
    // here: `every`, `many` and `little` are adjectives there, and `much` and
    // `either` are adverbs. Reading a finished card is what caught this — `per`
    // had been bucketed with the quantifiers and printed as "pronoun — a small
    // word that stands in for a naming word", which it plainly is not.
    adjective2: "both each every few fewer many more most other own",
    adverb2: "either neither only",
    pronoun: "whose",
    conjunction2: "as than if",
    preposition2: "per",
    number: "second",
    noun: "",
  },
  // Grade 3, same method as Grade 2: the supplied Core list's own ten categories
  // decide, and only the mixed ones needed a per-word call. Anything unlisted
  // falls through to noun, which is what categories 5, 6, 8 and 10 are almost
  // entirely made of.
  //
  // Five words sit in "Actions and academic processes" and are taught here as
  // NOUNS, so they are deliberately absent from the verb list: design ("A plan
  // or drawing"), experiment ("A test you do"), support ("Something that holds
  // another thing up"), test ("A set of questions") and value ("How much
  // something is worth"). The category says what the word is FOR; the authored
  // meaning says what this card teaches, and where they disagree the meaning
  // wins, because the meaning is what the child reads under the part of speech.
  3: {
    verb: "accept achieve act analyse apply arrange attend avoid become belong calculate check classify "
      + "communicate connect continue deliver depend develop divide edit encourage enter examine explore express "
      + "fix gather identify increase introduce investigate manage mark multiply observe organise perform prepare "
      + "present produce prove provide publish receive record reduce repeat replace report respond select separate "
      + "sort subtract suggest travel verify wonder cheer reach float pound shout enjoy annoy care dare wrap knock "
      + "fetch stretch splash scratch adapt breathe cause retell predict discuss whisper",
    adjective: "accurate active ancient attractive available average basic blank central certain common complex "
      + "crowded daily direct enormous exact excellent expensive extra final formal fresh general huge independent "
      + "local main modern natural necessary normal ordinary personal popular possible powerful private public rare "
      + "real recent regular serious similar single smooth social solid straight successful useful valuable wooden "
      + "worse worst better best annoyed anxious cheerful delighted determined eager frightened grateful guilty "
      + "jealous miserable peaceful pleased relaxed shy silly courageous generous loyal responsible selfish sensible "
      + "thoughtful unkind unfair steep round clear whole electric such another several various plenty less least "
      + "double third next possessive",
    position: "beneath beyond within throughout north south east west",
    preposition: "via except despite including minus plus",
    adverb: "afterwards beforehand meanwhile instead indeed finally firstly secondly later earlier otherwise "
      + "similarly especially possibly certainly probably definitely directly completely partly quite rather too "
      + "whenever wherever early soon again then",
    pronoun: "someone anyone everyone nobody somebody anybody everybody something anything everything nothing "
      + "myself yourself himself herself itself ourselves yourselves themselves whoever whatever",
    noun: "",
  },
  4: {
    // Derived from the AUTHORED meanings rather than from the supplied category
    // list. The card prints the meaning and the part of speech together, so the
    // meaning is the authority: `contrast`, `estimate`, `influence`, `research`,
    // `survey`, `draft` and `interview` all sit in the list's "actions" category
    // and are defined here as nouns, and labelling them verbs would contradict
    // the sentence printed directly above.
    adverb: "currently recently immediately quickly slowly quietly loudly suddenly happily sadly safely "
      + "generally mainly mostly additionally furthermore moreover consequently hence alternatively "
      + "eventually previously gradually rarely frequently nevertheless",
    position: "nearby opposite underneath alongside",
    preposition: "according regarding concerning considering excluding besides",
    conjunction: "whereas whilst",
    adjective: "international digital electronic online convenient efficient transparent renewable extinct "
      + "visible invisible frequent likely obvious approximate typical major minor greater lesser hopeful "
      + "hopeless beneficial harmful essential appropriate suitable proper practical reasonable specific "
      + "detailed effective capable aware casual delightful careless useless emotional positive negative "
      + "national equivalent awful creative critical cultural damaged familiar flexible fortunate "
      + "historical intelligent logical primary remarkable significant traditional urgent unusual "
      + "incorrect urban rural coastal annual monthly weekly horizontal vertical impossible abstract "
      + "figurative physical professional following",
    verb: "accomplish advise allow announce approach argue assess attempt combine complain concentrate "
      + "confirm consider construct contribute control convert cooperate demonstrate determine evaluate "
      + "exchange expand expect illustrate inspect interpret locate maintain memorise mention participate "
      + "persuade prevent recognise recommend relate revise scan summarise translate conclude justify "
      + "infer cite categorise compose proofread absorb dissolve reproduce survive download upload admire "
      + "apologise appreciate assist rewrite preview disappear",
    // Everything else falls through to noun - 237 words, each checked to be one.
  },
  // Grade 5 CANNOT use the supplied list's own categories the way Grades 2 and 3
  // did. Its topic groups are subject sets, not function sets: "Words: how a
  // story is built" holds `myth` and `plot` beside `permanent` and `precise`,
  // and "Words: finding out and explaining" is 31 verbs under a heading that
  // says nothing about verbs. So each word was placed from the AUTHORED meaning,
  // which is what the card prints directly above the part of speech - the Grade
  // 4 rule, applied to a grade where it is the only rule available.
  //
  // The two-way words were decided by reading that meaning, not by reasoning
  // about the word: `paraphrase` ("To put something into your own words") is a
  // verb, `recount` ("A retelling of events...") is a noun, `guarantee` ("A firm
  // promise...") is a noun, and `individual` ("Single and separate, rather than
  // part of a group") is an adjective. Every one of those four could honestly
  // have gone the other way, and the meaning settles it in one reading.
  5: {
    verb: "occur occupy correspond equip embarrass exaggerate criticise interfere interrupt accompany "
      + "assemble acknowledge administer advocate allocate anticipate assume clarify collaborate compile "
      + "comprehend conduct consult derive detect distinguish elaborate emphasise establish formulate "
      + "generate implement inquire integrate negotiate outline propose reflect regulate resolve retrieve "
      + "simulate specify synthesise transform validate paraphrase authenticate install",
    adjective: "conscious definite desperate solar electrical marvellous mischievous adequate ambitious "
      + "artificial automatic considerable consistent constructive contemporary controversial convincing "
      + "conventional crucial diverse domestic dramatic economical educational environmental exceptional "
      + "external fundamental gradual ideal immediate impressive inadequate internal foreign legal mental "
      + "mutual occasional overall particular permanent precise predictable principal realistic reliable "
      + "scientific severe temporary informal argumentative rhetorical cohesive chronological literal "
      + "theoretical unique universal unlikely valid vast vital sufficient thorough individual acute "
      + "obtuse parallel perpendicular aggressive apparent virtual wireless digestive immune toxic willing",
    adverb: "accordingly ultimately likewise altogether conversely nonetheless initially subsequently "
      + "namely particularly regardless thereby whereby anyhow anyway simultaneously ordinarily "
      + "incidentally sincerely comparatively notably wherein",
    conjunction: "albeit",
    number: "forty",
    // Everything else falls through to noun.
  },
  // Grade 6, same rule as Grade 5 and for the same reason: its supplied
  // categories sort by SUBJECT, not by function. "Actions and academic
  // processes" is mostly verbs but holds `challenge` and `critique`, which this
  // grade defines as nouns; "Describing and evaluating words" is mostly
  // adjectives but holds `alternative` and `potential`, defined here as nouns.
  // So each word is placed from the meaning authored for it, which is the line
  // printed directly above the part of speech on the card.
  //
  // Deriving this table from the meanings automatically was tried and abandoned.
  // A rule keyed on the opening "To " reads `kinetic`, `thermal`, `tectonic`,
  // `academic` and `ethical` as VERBS, because their meanings all begin "To do
  // with...", while it drops real verbs - characterise, acquire, enquire,
  // indicate, reconcile, represent - into the noun fall-through because theirs
  // happen to start otherwise. Wrong in both directions at once, which is worse
  // than no derivation: it produces a table that looks considered.
  6: {
    verb: "accommodate harass acquire adjust articulate characterise commence conceptualise contextualise "
      + "deduce devise differentiate enquire extrapolate generalise hypothesise imply incorporate indicate "
      + "manipulate monitor prioritise quantify reconcile refine reinforce represent scrutinise theorise "
      + "trace troubleshoot utilise annotate transfer intersect bisect export import manufacture",
    adjective: "amateur attached awkward disastrous equipped sincere descriptive grammatical persuasive "
      + "academic acceptable accessible adaptable adjacent advantageous authentic balanced coherent "
      + "compatible comprehensive concrete confidential contradictory credible decisive dependent dynamic "
      + "evident explicit extraordinary feasible fragile global impartial implicit inappropriate innovative "
      + "insufficient intensive intermediate persistent preliminary rigid substantial subtle superior "
      + "sustainable technical tremendous vulnerable kinetic thermal photosynthetic tectonic ascending "
      + "descending congruent improper triangular rotational mixed browser-based cloud-based operating "
      + "ethical emotive discursive subordinate modal",
    adverb: "admittedly arguably correspondingly evidently henceforth presumably relatively theoretically "
      + "thus undoubtedly thereafter therein",
    conjunction: "inasmuch insofar provided lest",
    preposition: "notwithstanding",
    pronoun: "whom whichever",
    // Everything else falls through to noun.
  },
  // Grade 7, written by hand from the authored meanings, for the reason recorded
  // under grade 6: deriving this table automatically reads `kinetic`, `thermal`
  // and `academic` as VERBS, because their meanings begin "To do with...", and
  // drops real verbs into the noun fall-through. Wrong in both directions, and
  // the output looks considered.
  //
  // This grade has more two-way words than any before it, and every one was
  // settled by reading the line the card prints above the part of speech:
  // `frame`, `weigh`, `rank`, `qualify` and `forecast` are VERBS here, though
  // frame and rank read naturally as nouns; `scatter` is a NOUN, though it is an
  // obvious verb, because this unit teaches the graph; and `audit`, `benchmark`,
  // `sanction`, `learning` and `intelligence` are nouns for the same reason.
  7: {
    verb: "correlate defend qualify refute substantiate delineate diagnose enumerate facilitate innovate "
      + "interrogate modify optimise replicate appraise deconstruct discern forecast frame probe rank "
      + "reconstruct reassess reinterpret rephrase weigh",
    adjective: "ambiguous analytical arbitrary autonomous biased compelling concise concurrent contextual "
      + "cumulative deliberate distinct dominant empirical flawed holistic hypothetical inevitable inherent "
      + "integral legitimate marginal plausible rational robust sophisticated subjective tentative "
      + "abiotic biotic cellular electromagnetic endocrine greenhouse organic periodic ecosystem-based "
      + "ecology-based algebraic Cartesian exponential linear quadratic random simultaneous statistical "
      + "interquartile bivariate geospatial open-source biometric coding-based data-driven networked "
      + "programmable cooperative civic-minded principled semantic satirical demographic conditional copular "
      + "finite subjunctive transitive intransitive imperative indicative interrogative exclamatory "
      + "coordinating subordinating correlative lexical syntactic",
    // Everything else falls through to noun.
  },
};
const CLASS = CLASS_BY_GRADE[GRADE];
if (!CLASS) {
  console.error(`No part-of-speech table for grade ${GRADE}.`);
  console.error("Add one to CLASS_BY_GRADE — a wrong default would label every word a noun,");
  console.error("and the part of speech is printed on the learner's word card.");
  process.exit(2);
}
// A part of speech may be listed more than once in a grade's table (a trailing
// digit distinguishes the entries); the digit is not part of the name.
const posOf = new Map();
for (const [key, list] of Object.entries(CLASS)) {
  const pos = key.replace(/\d+$/, "");
  if (!POS[pos]) { console.error(`Unknown part of speech in the grade ${GRADE} table: ${key}`); process.exit(2); }
  for (const w of list.split(/\s+/).filter(Boolean)) if (!posOf.has(w)) posOf.set(w, pos);
}

const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const masterFile = path.join(DATA, `master-dictionary.grade${GRADE}.json`);
const master = JSON.parse(fs.readFileSync(masterFile, "utf8"));
const have = new Set(master.entries.map((e) => e.lemma.toLowerCase()));

// The Core words, read from the units as built — the taught groups are the ones
// carrying a strand that is not "glossary".
const core = new Map();
for (let u = 1; u <= 10; u++) {
  const f = path.join(DATA, "units", `unit-${u}.json`);
  if (!fs.existsSync(f)) continue;
  const doc = JSON.parse(fs.readFileSync(f, "utf8"));
  const coreIds = new Set(doc.vocabularyGroups.filter((g) => g.strand && g.strand !== "glossary").map((g) => g.id));
  for (const l of doc.dictionaryLinks) {
    if (!coreIds.has(l.groupId)) continue;
    if (!core.has(l.masterWord)) core.set(l.masterWord, l);
  }
}

// `have` is keyed lower-case, so the Core word must be lowered to ask it. It was
// not, and Grade 3 is the first grade with a capitalised headword: `Africa` was
// never found in a set holding `africa`, so every run appended a THIRD, FOURTH,
// fifth Africa under the same dictionaryEntryId. Silent, because the duplicate
// is a valid entry and the id collision only shows as a count that will not
// settle — which is what a repeated run is for.
const missing = [...core.keys()].filter((w) => !have.has(String(w).toLowerCase()));
const unclassified = missing.filter((w) => !posOf.has(w));
const tally = {};
for (const w of missing) { const p = posOf.get(w) ?? "noun (fall-through)"; tally[p] = (tally[p] ?? 0) + 1; }

console.log(`Grade ${GRADE}: core words ${core.size} | already in the master dictionary ${core.size - missing.length}`);
console.log(`entries to add: ${missing.length}`);
console.log("  by part of speech:", JSON.stringify(tally));
if (unclassified.length) {
  console.log(`\n  ${unclassified.length} word(s) fall through to noun — read these before writing:`);
  console.log("   ", unclassified.join(" "));
}
if (!WRITE) { console.log("\nReport only — nothing written. Re-run with --write to apply."); process.exit(0); }

for (const w of missing) {
  const link = core.get(w);
  const pos = posOf.get(w) ?? "noun";
  const id = slug(w);
  const src = `./media/audio/grade-${GRADE}/dictionary/${id}.mp3`;
  master.entries.push({
    dictionaryEntryId: `ehel-en-g${GRADE}-${id}`,
    lemma: w,
    displayWord: link.displayWord && link.displayWord !== w ? link.displayWord : w,
    language: "en-GB",
    partOfSpeech: pos,
    partOfSpeechDefinition: POS[pos],
    gradeLevels: [`Grade ${GRADE}`],
    audio: {
      provider: "ElevenLabs",
      voiceId: "XfNU2rGpBa01ckF309OY",
      model: "eleven_multilingual_v2",
      normal: src, slow: src,
      slowPlaybackRate: 0.76,
      cueStart: 0, cueEnd: null,
      available: false,
      status: `Needs generating - added with the Grade ${GRADE} Core words`,
    },
  });
}
master.entries.sort((a, b) => a.lemma.localeCompare(b.lemma));
master.entryCount = master.entries.length;
fs.writeFileSync(masterFile, JSON.stringify(master, null, 2) + "\n");
console.log(`\nWrote master-dictionary.grade${GRADE}.json — ${master.entryCount} entries.`);
