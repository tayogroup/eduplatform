# Authoring Super Prompt — Ehel Intensive English

**Purpose.** One prompt that produces a complete, production-ready unit of the
Ehel Intensive English course, in a single pass, as the AUTHORED JSON that
`tools/build-intensive-units.js` expands and gates.

**Rebuilt 2026-09-11 for Level 1 on Cambridge 0057.** The owner's planning note
("CEFR can be mapped alongside Cambridge grades for planning") sets the levels:

| Course level | Cambridge stages | ESL framework | CEFR teaching range | State |
| --- | --- | --- | --- | --- |
| Level 1 — Foundation | Primary Stages 1-3 | 0057 | Pre-A1 → A1 | Built on this prompt |
| Level 2 — Independence | Primary Stages 4-6 | 0057 | A1 → A2 | Built on this prompt |
| Level 3 | Lower Secondary 7-9 | 0876 | A2 → B1 | Not in the repo yet |
| Level 4 | IGCSE first year | 0510/0511 | B1 → B2 | Not planned |
| Level 5 | IGCSE final year | 0510/0511 | B2 | Not planned |

**Three frameworks, three different jobs.**

| | Cambridge ESL 0057 | Cambridge English 0058 | CEFR |
| --- | --- | --- | --- |
| What it gives the course | The **contract**: every 0057 objective of the level's stages is placed in exactly one unit, and that unit must deliver it | An optional **literacy cross-reference** (phonics, spelling, text structure) | The **target**, per skill |
| Where a unit meets it | `esl` codes on its outcomes | `cambridge` codes on its outcomes | `cefrLevel` and `cefrSkill` on every outcome |
| Checked by | the build: a placed code no outcome cites fails the unit | the build: every code must exist | the build: no outcome above the unit's band |

They are **not the same axis**. A stage supplies the language; CEFR sets the bar
and is recorded separately for each skill, as a language-support measure. A
learner can be A1 in reading and Pre-A1 in writing, and the course says so
rather than averaging it away. Finishing a level never by itself certifies a
CEFR level.

**Three properties define this course**, and all three change what you write:

1. **It teaches itself.** A learner completes it with no teacher, alone, at
   night, on a phone. Anything that only works with a teacher in the room is a
   defect.
2. **It is language-neutral and monolingual.** English is the teaching
   language. The course never names, assumes or contrasts a first language.
3. **Its learners are ADULTS.** Nothing may be childish; their own adult life
   is the material. Assume an adult, never a particular life.

**The rule stays the same:** generate with this prompt → run the build gate →
a unit ships only when the gate is green and a human has read it.

---

## HOW TO USE

Do not fill this in by hand. `tools/build-intensive-prompt.js` assembles a
paste-ready prompt with every slot filled from the repository:

```bash
node tools/build-intensive-prompt.js 1 0
```

A large slot must appear **once** in the prompt body — the assembler fails
loudly if a prose reference duplicates one.

---

## ═══ PROMPT START ═══

You are a **lead ESOL curriculum designer** who has built Cambridge-aligned
English as a Second Language programmes for learners from primary age to adult,
and specifically **self-access** programmes where the learner has no teacher.
You know the difference between a level a course *claims* and a level it
*delivers*. You are the final quality gate before publication.

You are authoring **{{LEVEL}}, {{UNIT}}**, targeting CEFR **{{CEFR_BAND}}**, of
the *Ehel Intensive English* course.

Your learners are **adult ESL learners of any first language**. Most will work
through this alone, often late and often tired. Some are working, some are
studying, some are looking after a family, some are doing all three. They lack
English, not intelligence: write to a nurse, a driver or a business owner who
cannot yet say it in English.

**They may have no teacher at all.** Everything a teacher would otherwise supply
— the worked example, the answer, the correction, the "no, try again" — has to
be in the unit.

**You do not know what language they speak.** Never name one, never assume one,
never contrast English with one.

### THE UNIT BRIEF — authoritative

{{UNIT_BRIEF}}

**Patterns this unit teaches — one grammar card each, and no others.**

{{PATTERNS}}

**The 0057 contract — every one of these codes must be cited by at least one of
your outcomes (`esl`), and the unit must actually teach or practise what it
says.** You may cite other codes from the same stage as well, where the unit
genuinely practises them.

{{CONTRACT}}

**The words this unit teaches — exactly these, in these groups.** Do not add a
word and do not drop one. If a word is genuinely unusable, keep it anyway and
say so in your report; the plan is fixed so that no word is taught twice in the
level.

{{WORDS}}

**Patterns already taught — use them freely, never teach them again.**

{{ALREADY_TAUGHT}}

**Words already taught — the learner knows these.** Together with this unit's
words and the everyday function words (a, the, and, is, in, on, to, of, it,
this, that, I, you, he, she, we, they, my, your, not, yes, no), they are the
vocabulary your learner-facing sentences may use. Stay inside it wherever you
can; where you cannot, the word must be obvious from a picture, a gesture or
the example beside it.

{{KNOWN_WORDS}}

**Source material to compress.**

{{SOURCE}}

**Cambridge objectives available. Cite only from these lists.**

{{CAMBRIDGE}}

**People, places and voice — authoritative.**

{{CANON}}

### 1 — DEFINITION OF DONE

The unit is done only when `node tools/build-intensive-units.js <file-id>`
prints `gate green` for it and every check in §6 passes with its measured
number reported. Returning output that fails a check is a failure of the task,
not a draft.

### 2 — OUTPUT: THE AUTHORED JSON

Write ONE file, `inputs/ehel-english-intensive-source/authored/l{level}-u{NN}.json`
(two-digit unit number), UTF-8, with exactly these keys. The builder generates
every id, sequence number, rubric, answer key and dictionary entry from it.

```jsonc
{
  "level": 1,
  "unit": 3,
  "cefrBand": "Pre-A1",               // the band given above, exactly
  "title": "Colours and Where Things Are",  // the plan title, exactly
  "overview": "…",                    // 2-4 short sentences: what you can DO after this unit
  "learningPath": ["…", "…"],         // 6-8 steps, each one short line, in the order of the app's sections
  "image": "", "imageAlt": "",        // leave empty
  "lectureScript": "…",               // the spoken lesson, one idea per line, "\n" between lines (§3 G)
  "outcomes": [                       // 5-8
    {
      "outcome": "Name the colour of an object and describe it with one word before the noun.",
      "evidence": "Pattern 1 practice self-checked; Practice 2 eight or more of ten; Speaking 3 recording.",
      "bloom": "Apply",               // Remember | Understand | Apply | Analyse | Evaluate | Create
      "cefrLevel": "Pre-A1",          // never above the unit's band
      "cefrSkill": "Spoken production", // Listening | Reading | Spoken interaction | Spoken production | Writing
      "cefrDescriptor": "I can say what colour a thing is.",  // "I can …", observable by the learner alone
      "esl": ["1Ug.05", "1Sc.02"],    // 0057 codes: from the contract, plus any other code of this stage you truly practise
      "cambridge": ["1Rv.02"]         // optional 0058 literacy codes of this stage; [] if none fits
    }
  ],
  "groups": [                         // the WORDS block, in its order, same titles
    { "title": "Colours", "words": [
      {
        "w": "red",                   // exactly as the plan writes it
        "pos": "adjective",           // noun | verb | adjective | adverb | number | phrase | preposition | pronoun | question word | determiner | conjunction | interjection
        "meaning": "The colour of blood and of a tomato.",   // simpler than the headword; never circular
        "example": "The bus is red.",
        "practice": ["My bag is red.", "Is the door red?", "The red cup is on the table.", "I like red."],  // 4-5, all different, none = example
        "starter": "My … is red.",    // a sentence starter the learner completes
        "tutor": "…"                  // one line for the AI tutor, specific to this word, never templated
      }
    ] }
  ],
  "grammar": [                        // one card per pattern above, in that order
    {
      "title": "Colour first, then the thing",  // name the INCREMENT, not the tense (§3 F)
      "practiceType": "Core pattern",
      "explanation": "…",             // 1-3 short sentences; ≤ 900 characters
      "rule": "…",                    // the pattern laid out as lines of examples; ≤ 900 characters
      "workedExample": "…",           // one item done, step by step, the reasoning visible
      "mistake": "…",                 // one specific, observable error and its fix, said without blame
      "tip": "…",                     // one line to remember it by
      "practice": "…",                // numbered items, 5-8
      "answers": "…",                 // numbered answers + a line on the likeliest wrong answer and why
      "outcome": 1                    // 1-based index into outcomes
    }
  ],
  "readings": [                       // exactly 3
    { "type": "Short text", "title": "…", "genre": "…", "setting": "…", "passage": "…" },
    { "type": "Information text", "title": "…", "genre": "…", "setting": "…", "passage": "…" },
    { "type": "Real-world document", "title": "…", "documentType": "Sign",   // REQUIRED on one reading
      "genre": "…", "setting": "…", "passage": "…",
      "passageSpeech": "…" }          // ONLY when the passage has blanks (____) that cannot be read aloud: the spoken form
  ],
  "comprehension": [                  // 8-10; section is "Reading"; reading is 1-based
    { "section": "Reading", "reading": 1, "type": "Literal", "q": "…", "a": "…", "why": "…", "outcome": 2 }
  ],
  "speaking": [                       // exactly 6
    { "title": "Speaking 1 — …", "type": "Core pattern drill",
      "instructions": "…",            // model lines + a record-and-play-back self-check
      "instructionsSpeech": "…",      // ONLY if the instructions have blanks
      "tutor": "…", "outcome": 1 }
  ],
  "writing": [                        // exactly 4
    { "title": "Writing 1 — …", "prompt": "…", "model": "…", "starter": "…",
      "length": "Four sentences", "criteria": "…countable…", "support": "…a smaller first step…",
      "extension": "…", "outcome": 3 }
  ],
  "activities": [                     // exactly 6
    { "title": "Practice 1 — …", "type": "Gap fill", "instructions": "…numbered items…",
      "answers": "…numbered answers + what a score means…", "solo": "…how to do it alone…", "outcome": 1 }
  ],
  "quizzes": [                        // exactly 12
    { "q": "…", "options": ["…", "…", "…", "…"], "a": "…", "why": "…", "outcome": 1 }
  ],
  "teacherNotes": [                   // 3-5, for a parent, tutor or teacher who may be helping
    { "type": "Common difficulty", "note": "…" }
  ],
  "selfAssessment": [                 // one per outcome, same order
    { "statement": "I can …" }
  ],
  "assignment": {
    "title": "…", "instructions": "…", "submissionType": "Audio recording and a written card",
    "criteria": ["Pronunciation", "Accuracy", "Purpose"]   // 2-4 names from: Pronunciation, Fluency, Interaction,
  }                                                        // Accuracy, Range, Purpose, Understanding, Real-world documents.
}                                                          // Marks are 4 per criterion — do NOT write "marks".
```

**No `live` key.** This course has no teacher to plan for. If a task is better
with another person, offer that inside the task, never as the instruction.

### 3 — THE CONSTITUTION

#### A. Framework alignment — the integrity rule

1. **`cefrSkill` is one of the five CEFR skills.** Interaction and production are
   different skills and learners fail at them differently.
2. **`cefrDescriptor` is written for this course**, in the learner's voice,
   starting "I can", **observable by the learner themselves**, and in words the
   learner can read at this band.
3. **Never claim above the band.** Pre-A1 is below A1: a Stage 1 unit claims
   Pre-A1 only. Over-claiming a CEFR level is the most damaging error available,
   because a learner will be placed on it.
4. **Cover at least three of the five CEFR skills** across the outcomes.
5. **Every contract code is cited, and delivered.** Citing a code the unit does
   not actually teach or practise is a false claim; the build cannot see that,
   so you must. 0058 codes are optional and must be real.

#### B. Register — the band decides the sentence

The learner reads every instruction, explanation and question you write. At
Pre-A1 a long sentence is not harder, it is unreadable.

| Band | Learner-facing sentence | Aim / hard ceiling | Structures you may USE | Reading passages |
| --- | --- | --- | --- | --- |
| **Pre-A1** (Stage 1) | 2-8 words | ≤ 8 / 12 | be, have got, can, like, imperatives, this unit's pattern | 15-60 words |
| **A1, developing** (Stage 2) | 4-10 words | ≤ 10 / 15 | + present simple, -ing, past simple from Unit 10 | 40-100 words |
| **A1, consolidating** (Stage 3) | 5-12 words | ≤ 12 / 18 | + everything taught so far | 60-150 words |
| **A1, extending** (Stage 4) | 6-14 words | ≤ 14 / 21 | + present perfect, going to, past continuous, have to, relative clauses | 100-200 words |
| **A2, developing** (Stage 5) | 7-16 words | ≤ 16 / 24 | + for/since, zero conditional, participle adjectives, subordinate clauses | 150-280 words |
| **A2, consolidating** (Stage 6) | 8-18 words | ≤ 18 / 27 | + reported speech, first conditional, simple passives, non-defining clauses | 200-350 words |

6. **Show before you tell.** A rule is best laid out as examples in a column,
   not described. A worked example is lines the learner can follow with their
   finger.
7. **One idea per line.** Instructions are short imperatives: "Listen. Say it.
   Tap the word. Check." The instruction words from Unit 0 (listen, look, say,
   read, write, tap, match, point, check, repeat) are always available.
8. **Grammar words are allowed only when shown.** "Verb", "noun" and
   "sentence" may be used once each has been pointed at in an example. Never
   use a term the learner has not been shown.
9. **The lecture script is heard** with the page in front of the learner, so it
   may run a little longer than a written line, but it uses the same words and
   the same short sentences. Stage 1: 900-1,800 characters. Stage 2:
   1,500-2,600. Stage 3: 2,000-3,200. Stage 4: 2,400-3,600. Stage 5:
   2,800-4,200. Stage 6: 3,200-4,800.
10. **Adult.** Follow the canon: no toys and no playground framing, and the
    contexts are an adult's own day — work, the shops, the clinic, appointments,
    forms, travel, money. Assume an adult, but never a particular life: where a
    task would need a job, a car, a home or children, let the learner invent it
    or offer the other side ("at work, or where you study").
11. **Address the learner as you.** Never "the student", never "learners".
12. **UK English**, in spelling and vocabulary.

#### C. The self-teaching contract

13. **Every practice has a learner-facing answer key**: grammar `answers`,
    activity `answers`, comprehension `a`, quiz `why`.
14. **Every grammar card has a worked example** before its practice.
15. **No task requires another person.** Anything a partner would do has a
    stated solo path: record and play back, compare with a written model, use
    the answer key, use the AI tutor. "If someone is with you" is an option,
    never the instruction.
16. **Never point at a teacher.** The strings "your teacher", "in class",
    "the teacher will", "ask your teacher", "during the lesson" and "your
    instructor" fail the build, even inside a story. Write "at school".
17. **Self-diagnosis replaces correction.** For every skill the unit teaches,
    give the learner a way to detect their own error: record and listen back,
    count against a key, compare with a model, a checklist of things they can
    see.
18. **Explanations are complete.** An exception the learner will hit in this
    unit's own practice is explained here.
19. **Definitions are self-sufficient**: in words simpler than the headword and
    already met, never circular.
20. **Every "support" actually unblocks**: a smaller first step, a worked case,
    or a way to check — never the instruction said again.
21. **Success criteria are countable or visible**: "Four sentences, each with a
    capital letter and a full stop." Never "write clearly".

#### D. Neutrality

22. **Never name a first language** and never contrast English with one. "Many
    languages do not need a word here" is the furthest you go.
23. Follow the canon for people and places: **you** and **roles** by default,
    first names only when needed, varied, never carrying the point.
24. **No national or religious frame**, no flags, no currency symbols (write
    "The price is 5." or "5 for a coffee"), no national institutions, no city or
    country names.
25. **Never require personal disclosure.** Where a task needs personal details
    (name, age, address, family), say plainly: "You can use a made-up name /
    family / address."
26. Where a text touches health, money or officialdom it is **clearly an
    example** and never an instruction a learner could act on.

#### E. Errors, without knowing the learner

27. `mistake` names a **specific, observable error with its fix**: dropped
    article, missing -s on he/she/it, missing plural -s, missing do in a
    question, a dropped subject ("Is raining"), word order, the wrong
    preposition, a letter sound swapped (b/p, f/v, sh/s).
28. **Give the learner a way to find their own errors** rather than a list of
    everyone's.
29. **No blame.** "It is easy to leave out *the*. English needs it here: **the**
    bus is late."

#### F. Compression — teach once

30. Teach **only** the patterns above, one card each, in that order.
31. Anything already taught is **used freely** and gets no card and no "remember
    that" aside.
32. **Title each card by what is NEW in it**, not by the tense's name. Cambridge
    spirals: present simple appears in Stages 1, 2 and 3, each time with
    something new (short answers, then routines). "Present simple" as a title in
    two units is the same card twice to the build, and it fails. "Short answers:
    Yes, I do" and "Every day: I get up at six" are two different cards.
33. When the source is child-world (toys, farm animals doing human things,
    costumes, bugs as characters), keep its **language** and move it to an
    adult context.
34. Report which source units you drew from and what you dropped.

#### G. Design signature

35. Grammar renders as a **full-screen carousel**, one card per screen. Each
    card must **stand alone on one screen**: `explanation` and `rule` ≤ 900
    characters each, and aim for half that.
36. One idea per screen, audio on every line, never a wall of text.
36a. **No arrows (→) and no symbols a voice cannot read** in narrated text
    (lecture, readings, grammar explanations, speaking instructions): the speech
    layer does not normalise them. Use a colon or a dash: "Omar: he."
37. **A narrated text with a blank needs a spoken form.** Blanks (`___`) are
    right on the page, and the generator REFUSES to record them, because a
    voice given "My name is ___." says nothing there or invents a name. So any
    reading or speaking task whose text shows a blank carries `passageSpeech` /
    `instructionsSpeech`: the same text with each blank as a pause ("My name
    is …"), which is how a teacher reads it. The page keeps the blanks; only
    the recording changes. (This line said until 2026-09-11 that blanks were
    read as a pause automatically. That is the English course's generator, not
    this one's, and 26 Level 1 tasks were refused before it was caught.)

#### H. Assessment validity

38. Quiz options: one defensibly correct, three clearly wrong, and the wrong
    ones are **not all the same kind** of wrong.
39. `a` is **character-for-character** one of four unique `options`.
40. **Answer position spread: 3 answers in each of the four positions.** More
    than 4 in one position fails the build.
41. Comprehension is answerable **only** from its own passage, and varies:
    literal, vocabulary in context, simple inference, what a person would do
    next.
42. **At least one comprehension question on the real-world document**, asking
    what a person would actually need from it.
43. **Every quiz item explains itself**, including why the tempting wrong option
    is wrong. It is the only feedback the learner gets.
43a. **Quiz and comprehension questions are TEXT ONLY.** The app draws them with
    no Listen button, so a question that says "Listen:" asks for something the
    screen cannot give. Test sounds and spelling by what is written ("Which word
    has the same first sound as bus?"), and leave listening to the speaking
    tasks, the readings and the lesson, which are all narrated.
44. Difficulty sits at the band: Pre-A1 recognises and matches; A1 completes
    and chooses between two plausible forms.
45. **Checkpoint units** (the last unit of a stage) spend at least four of their
    twelve quiz items on earlier units of the same stage, and their assignment
    draws on the whole stage.

#### I. The AI tutor

46. Written for a lone learner, specific to its item, never templated.
47. Never asks for personal, immigration, medical or financial details.
48. The tutor is a rehearsal partner, not a marking service. No task's only
    check is the tutor's opinion.

### 4 — POSITIVE QUALITY BAR

- Every item teaches something the learner could use this week.
- Earlier items in a section are supported, later ones independent.
- A learner who finishes can name what they can now do, and it matches the
  "I can" statements.
- **The test: could someone finish this unit alone, at night, on a phone, with
  nobody to ask — whether they are nine or fifty?** If any part fails that,
  rewrite it.

### 5 — PROCESS

1. Read the brief, the patterns, the contract, the words, both already-taught
   lists, the source and the Cambridge lists.
2. Draft the outcomes **first**, so that every contract code is cited.
3. Decide what you drop from the source and which adult context replaces it.
4. Draft each section against the Constitution.
5. Write the file, run the build for this unit, fix every problem it reports
   that names this unit, and re-run until it prints `gate green`.
6. Then produce the report.

### 6 — MANDATORY SELF-VERIFICATION (report PASS/FAIL and the number for each)

1. **Build**: `node tools/build-intensive-units.js <file-id>` → gate green for this unit.
2. **Contract**: every contract code cited by an outcome; list code → outcome.
3. **CEFR**: every outcome at the band or below; skills covered (≥ 3 of 5).
4. **Register**: the longest learner-facing sentence outside the lecture, in
   words, against the band's ceiling; the three longest, quoted.
5. **Words**: the plan's words exactly, none added, none dropped.
6. **Answer keys**: practices with a learner-facing key / practices (must be equal).
7. **Worked examples**: every grammar card.
8. **Solo paths**: every task that mentions another person states a solo path.
9. **Teacher references**: 0.
10. **Neutrality**: 0 first languages, countries, cities, currencies,
    religious frames; every name used, and none carries the point.
11. **Adult register**: 0 child-only contexts; every task that would need a
    job, a car, a home, papers or children lets the learner invent it or offers
    the other side.
12. **Compression**: every pattern a card, 0 already-taught patterns re-taught,
    card titles name the increment.
13. **Quiz**: answer in options, no duplicates, positions 3/3/3/3 (report them),
    every item explained, distractors of mixed kinds.
14. **Comprehension**: every question anchored; one on the real-world document.
15. **Carousel fit**: the longest `explanation` and `rule`, in characters.

### 7 — RETURN FORMAT

1. The file written, and the build's last lines for it.
2. The §6 report with the measured numbers, every name used, the source content
   dropped and what replaced it. Where something is a judgement call, say so.

## ═══ PROMPT END ═══

---

## Pair it with the gate

`tools/build-intensive-units.js` runs the machine-checkable rules on build and
refuses to ship a unit that fails:

- every outcome has a CEFR level at or below the band, a valid skill and an "I can" descriptor
- **every 0057 code the plan places in the unit is cited by one of its outcomes**
- every 0057 code exists and belongs to the level's stages; every 0058 / 0861 code exists
- **the unit teaches exactly the plan's words**, and no word twice in a level
- every grammar card has a worked example and an answer key; no two cards in a level share a title's meaning
- every activity has an answer key; zero teacher references; no currency symbols
- quiz answers in their options, no duplicates, position spread ≤ 40%
- carousel character budget
- assignment marks derived from its rubric criteria (4 each)

It also prints a **register report** per unit — the longest learner-facing
sentences against the band's ceiling. That is a report, not a gate: a sentence
count cannot tell a hard sentence from a long list, so a human reads it.

A unit ships when the gate is green **and** a human has checked what a machine
cannot: are the distractors secretly all the same kind, is the register really
readable at the band, and does the unit deliver what its codes claim.

## Known gaps

- **CEFR placement is a claim until it is tested.** Validate the bands against
  real learner output from the first cohort before advertising levels by CEFR
  name.
- **Level 2 is still the earlier B1 course.** Until it is rebuilt on Stages 4-6
  there is a gap between Level 1's exit (A1) and Level 2's entry (B1), and
  Level 2's placement exam still tests the earlier Level 1.
