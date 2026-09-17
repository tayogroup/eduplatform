// The thirteen section intros of the Intensive English shell course, in ONE
// place, because two places is how this course has broken three times.
//
// Each entry is the {kicker, title, description, status} that intensive-english.js
// passes to pageHeader(). The page renders them; the narration pipeline reads
// them to know which clips to buy. Those two used to be the same strings written
// twice — once here as literals at thirteen call sites, and once in whatever
// tool needed to know what the page says — and this file exists so that the
// second copy is a read rather than a retyping.
//
// THE FAILURE THIS IS BUILT AGAINST, three times on 2026-09-17 alone:
//   * build-lessons.py prepended a word's exampleSentence to the list the page
//     plays while the narration lib excluded it, so the first sentence on every
//     word card was a clip nobody had bought — 1,691 of them, each falling
//     through to quiz_tts.php, which bills ElevenLabs per play;
//   * add-header-bars.py honoured `brandLine` while add-lesson-search.py had
//     "Primary " hard-coded, so sixty lesson pages were right and three hubs
//     were wrong;
//   * a single REVIEW constant stamped one real sign-off onto sixty units with
//     three different histories.
// Every one of them was two descriptions of a single fact, each correct about
// itself, with no gate between them. A narrated string is exactly that kind of
// fact: the page shows it and the generator must buy it, and the two cannot be
// allowed to disagree.
//
// NO DOM, NO IMPORTS, ON PURPOSE. The browser loads this as an ES module, and
// tools/lib/ehel-intensive-narration.js — which is CommonJS — evaluates it
// through node to compose the same strings. That is the pattern
// intensive-english/lesson-kit/build-lessons.py already uses for
// word-pictures.js, and it only works while this file touches nothing but its
// arguments.

// Every field the intros interpolate, named once. `intensive-english.js` fills
// it from `course`; the narration lib fills it from the built unit JSON. They
// are different shapes holding the same facts, which is why the context is
// stated rather than either shape being passed straight in.
export function introContext({
  levelLabel = "",
  levelEntryCount = 0,
  unitNo = 0,
  unitTitle = "",
  unitOverview = "",
  wordCount = 0,
  activityCount = 0,
  quizCount = 0,
} = {}) {
  return { levelLabel, levelEntryCount, unitNo, unitTitle, unitOverview, wordCount, activityCount, quizCount };
}

// The overview's description is the first two sentences of the unit overview.
// Kept here rather than at the call site because the SPLIT is part of the
// string: narrate three sentences and the clip stops matching the page.
const firstTwoSentences = (text) => String(text || "").split(". ").slice(0, 2).join(". ");

export function sectionIntros(context = {}) {
  const c = introContext(context);
  return {
    tutor: {
      kicker: "Your AI English tutor",
      title: "Wehel Tutor",
      description: "Talk with Wehel Tutor in simple English. Ask about words, patterns, or practise a real conversation — by text or voice.",
      status: "Wehel Tutor · Ehel Academy AI",
    },
    overview: {
      kicker: `${c.levelLabel} · Unit ${c.unitNo}`,
      title: c.unitTitle,
      description: firstTwoSentences(c.unitOverview),
    },
    lecture: {
      kicker: "Begin here",
      title: "The lesson",
      description: "Read it and listen to it. This explains all six — everything else in the unit practises what is here.",
    },
    dictionary: {
      kicker: "Words",
      title: "Word list",
      description: `${c.wordCount} words for this unit, grouped by the sound or the job they do.`,
      status: `${c.levelEntryCount} entries in this level`,
    },
    reading: {
      kicker: "Reading",
      title: "Texts",
      description: "Read each one aloud, not silently. One of them is a real document you will have to fill in.",
    },
    comprehension: {
      kicker: "Comprehension",
      title: "Questions",
      description: "Write your answer first, then check the reviewed answer.",
    },
    speaking: {
      kicker: "Speaking",
      title: "Say it out loud",
      description: "Record yourself and listen back. Hearing your own voice is the fastest correction there is.",
    },
    writing: {
      kicker: "Writing",
      title: "Write it down",
      description: "Your draft saves on this device as you type.",
    },
    activities: {
      kicker: "Practice",
      title: "Practice",
      description: `${c.activityCount} things to do, most of them out loud.`,
    },
    quiz: {
      kicker: "Quiz",
      title: "Check what you know",
      description: `${c.quizCount} questions. You can try again.`,
    },
    answers: {
      kicker: "Answers",
      title: "Every answer, explained",
      description: "Nothing here is hidden from you. Try the exercise first — then open the section and check, and read why.",
    },
    reflect: {
      kicker: "My progress",
      title: "What can you do now?",
      description: "Answer honestly. Nobody else sees this — it is here so you can see what has moved and what has not.",
    },
    teacher: {
      kicker: "Teacher view",
      title: `Unit ${c.unitNo} teaching resources`,
      description: "Delivery, evidence and framework alignment.",
      status: "AI-assisted — sign-off pending",
    },
  };
}

// What a Listen button on a section header speaks, and therefore what the
// generator must buy: the same `${title}. ${description}` pageHeader has always
// composed. Stated here so the page and the pipeline cannot drift apart — the
// UI speaks introNarration(intro) and the lib buys introNarration(intro), one
// expression, two callers.
export const introNarration = (intro) => {
  const title = String(intro.title || "").trim();
  // A title that already ends a sentence does not take a second terminator.
  // "What can you do now?" is the only one here that does, and pageHeader's own
  // `${title}. ${description}` would have made it "now?." — which was harmless
  // while nothing read the string and is a new, audible artifact the moment one
  // does. This is not a departure from what the page composed; it is the first
  // time anyone hears it, so it is the first time it has had to be right.
  const joiner = /[.?!]$/.test(title) ? " " : ". ";
  return `${title}${joiner}${intro.description}`;
};

// Every narratable intro for one unit. The lib maps this over 60 units and
// de-duplicates by hash; most of these strings are identical across the whole
// course, which is why 60 units need only about a hundred clips.
export function introTextsForUnit(context) {
  return Object.values(sectionIntros(context)).map(introNarration);
}
