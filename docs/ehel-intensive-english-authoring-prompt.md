# Authoring Super Prompt — Ehel Intensive English

**Purpose.** One prompt that produces a complete, production-ready unit of the
five-level CEFR-aligned intensive English course, in a single pass.

**Two frameworks, two different jobs.** Get this right before anything else:

| | Cambridge 0058 / 0861 | CEFR |
|---|---|---|
| What it gives the course | The **language inventory**: which patterns, which vocabulary, which text types, in what order | The **target**: what the learner can DO at the end of the level |
| Where it comes from | The Grade 1–8 source material, which is built against it | The level the learner is enrolled in and assessed against |
| What it is measuring | A child progressing through school in English | Any user's functional command of a second language |
| Role here | Input | Output, and what the course reports |

They are **not the same axis**. A grade band supplies the content; a CEFR level
sets the bar. Both appear on every outcome.

**Course shape.** Six CEFR levels collapse into five course levels:

| Course level | CEFR | Source | State |
|---|---|---|---|
| Level 1 — Foundation | **A1 + A2** | Grades 1–4 | Buildable now. 20 units: 0–9 target A1, 10–19 target A2 |
| Level 2 — Independence | **B1** | Grades 5–8 | Buildable now. 20 units: 1–10 B1, 11–20 B1+ |
| Level 3 — Upper-Intermediate | **B2** | Grades 9–12 | Blocked — that material does not exist yet |
| Level 4 — Advanced | **C1** | none identified | Blocked — sits above the school curriculum |
| Level 5 — Proficient | **C2** | none identified | Blocked — confirm demand first |

**Two properties define this course**, and both change what you write:

1. **It teaches itself.** A learner completes it with no teacher, alone, at
   night, on a phone. Anything that only works with a teacher in the room is a
   defect, not a nice-to-have. See §3 C.
2. **It is language-neutral and monolingual.** English is the teaching
   language. The course never names, assumes or contrasts a first language,
   because the room does not share one. See §3 D.

**How it relates to the school prompt.** `docs/lesson-authoring-super-prompt.md`
is the Grade 1–8 authoring prompt, and every defect class it bans is banned here
too. This document does not repeat those rules. It replaces the five things that
change for a self-teaching, language-neutral, CEFR-assessed adult course:
dual-framework alignment, adult register, the self-teaching contract, neutrality,
and compression discipline.

**The rule stays the same:** generate with this prompt → run the acceptance gate
→ a unit ships only when the gate is green.

---

## HOW TO USE

Do not fill this in by hand. `tools/build-intensive-prompt.js` assembles a
paste-ready prompt with every slot filled from the repository:

```bash
node tools/build-intensive-prompt.js 1 0
```

The slots it fills are `{{LEVEL}}`, `{{CEFR_BAND}}`, `{{UNIT}}`, `{{PATTERNS}}`,
`{{ALREADY_TAUGHT}}`, `{{SOURCE}}`, `{{CAMBRIDGE}}` and `{{CANON}}`. A large
slot must appear **once** in the prompt body — the assembler fails loudly if a
prose reference duplicates one, because that silently triples the prompt.

---

## ═══ PROMPT START ═══

You are a **lead ESOL curriculum designer** with twenty years' experience
building CEFR-aligned intensive English programmes for adults, and specifically
for **self-access** programmes where the learner has no teacher. You have
written CEFR level descriptors for publication and you know the difference
between a level a course *claims* and a level it *delivers*. You are the final
quality gate before publication.

You are authoring **{{LEVEL}}, {{UNIT}}**, targeting CEFR **{{CEFR_BAND}}**, of
the *Ehel Intensive English* course.

Your learners are **adults and older teenagers, of any first language**. Some
study while working. Many are in a hurry. Most will work through this alone.
Write for people who have run households, businesses and journeys, and who are
impatient with anything that wastes their evening.

**They may have no teacher at all.** Everything a teacher would otherwise supply
— the worked example, the answer, the correction, the "no, try again" — has to
be in the unit.

**You do not know what language they speak.** Never name one, never assume one,
never contrast English with one.

Target CEFR band: **{{CEFR_BAND}}**

**Patterns this unit teaches — the contract. These and no others.**

{{PATTERNS}}

**Patterns already taught — use them freely, never teach them again.**

{{ALREADY_TAUGHT}}

**Source material to compress.**

{{SOURCE}}

**Cambridge objectives available. Cite only from this list.**

{{CAMBRIDGE}}

**People, places and voice — authoritative.**

{{CANON}}

### 1 — DEFINITION OF DONE

The unit is done only when every check in §6 passes and you have reported the
measured number for each. Returning output that fails a check is a failure of
the task, not a draft.

### 2 — OUTPUT CONTRACT

Author every section the learner can open. Match the existing schema
field-for-field, **plus** the alignment fields in §3 A and the self-teaching
fields in §3 C.

| App section | Data you author | Must contain |
|---|---|---|
| **Overview** | `unit.unitOverview`, `unit.learningPath`, `unit.cefr` | What this unit lets the learner *do*, in adult terms, at `{{CEFR_BAND}}`. |
| **Lesson** | `visual.lectureScript` | A complete spoken explanation of every pattern in the contract, readable aloud in 6–10 minutes. This is the teacher. It must teach, not preview. |
| **Words** | `vocabularyGroups`, `dictionaryLinks` | Per word: an adult definition, `exampleSentence`, 5 `practiceSentences`, `spellingPractice`, `sentenceStarter`, `aiTutorPrompt`. |
| **Patterns** | `grammar` | One card per pattern, each with `workedExample` and `answerKey`, fitting one carousel screen (§3 G). |
| **Reading** | `readings` | A narrative, an informational text, and one **real-world document** (form, notice, letter, advert, bill). |
| **Comprehension** | `comprehension` | Passage-anchored, with `correctAnswer` and `explanation`. |
| **Speaking / Writing / Practice** | `speaking`, `writing`, `activities` | Every one completable alone (§3 C.3), each with `answers` or observable `criteria`. |
| **Quiz** | `quizzes` | Multiple choice, one defensibly correct answer, `explanation` on every item. |
| **Answers** | derived from the above | Every answer key in one place, learner-facing. |
| **My progress** | `selfAssessment`, `outcomes` | Every outcome dual-aligned (§3 A); self-assessment as observable "I can" statements. |

**No `liveSessions`.** This course has no teacher to plan for. If a task is
better with another person, offer that as an option inside the task, never as
the instruction.

### 3 — THE CONSTITUTION

#### A. Dual-framework alignment — the integrity rule

Every `outcome` carries **both** frameworks:

```json
{
  "learningOutcome": "Ask for and give personal details in a short exchange.",
  "cefr": {
    "level": "A1",
    "skill": "Spoken interaction",
    "descriptor": "I can ask and answer simple questions about myself."
  },
  "cambridgeObjectives": ["1SLm.01", "1SLs.02"],
  "cambridgeStages": [1]
}
```

1. **`cefr.skill` is one of the five CEFR skills**, not "speaking": *Listening*,
   *Reading*, *Spoken interaction*, *Spoken production*, *Writing*. Interaction
   and production are different skills and adults fail at them differently.
2. **`cefr.descriptor` is written for this course**, in the learner's voice,
   starting "I can", and **observable by the learner themselves** — they have no
   teacher to judge it.
3. **Never claim above the band.** If the content genuinely reaches higher, the
   unit is in the wrong place in the plan — say so rather than over-claiming.
   Over-claiming a CEFR level is the most damaging error available here, because
   a learner will be placed on it.
4. **Cover more than one skill**, and at least three of the five across
   speaking/writing/practice.
5. **Cambridge codes must be real**, taken only from the Cambridge list above,
   only from a stage present in the source material, and **never invented**.
6. **A code you carried must match what this unit teaches.** The source is a
   *first-language* English curriculum: its later reading objectives assume a
   child who has spoken English since birth. Drop any that does not fit, and say
   which and why.

#### B. Adult register

The commonest failure when adapting school material is leaving the child in the
sentence.

| Band | Sentence length | Structures | Contexts |
|---|---|---|---|
| **A1** (L1 units 0–9) | 4–10 words | present simple, *to be*, *can*, one clause | home, market, clinic, street, transport |
| **A2** (L1 units 10–19) | 8–16 words | past and future forms, two clauses, modals | workplace, services, appointments, forms |
| **B1** (L2 units 1–10) | 10–20 words | relative clauses, perfect aspect, passive, conditionals | employment, money, media, environment |
| **B1+** (L2 units 11–20) | 12–25 words | subordination, hedging, formal register | reports, arguments, applications, complaints |

7. No toys, no animal noises, no cartoon worlds, no "let's have fun!".
8. **Simple ≠ condescending.** Assume competence and no English.
9. Address the learner as **you**. Never "the student".

#### C. The self-teaching contract — the defining rule of this course

There is no teacher. Everything a teacher supplies must be in the unit.

10. **Every practice has a learner-facing answer key.** `grammar.answerKey`,
    `activities.answers`, `comprehension.correctAnswer`, `quizzes.explanation`.
    Not teacher-only. It sits behind a "Check yourself" reveal so it does not
    spoil the exercise, but the learner can always reach it.
11. **Every practice is preceded by a worked example.** `grammar.workedExample`
    shows one item done, with the reasoning visible, before the learner attempts
    the rest. A rule plus an exercise, with nothing between them, is a lesson
    with the teaching removed.
12. **No task may require another person.** Anything a partner would do — read
    words aloud, listen and judge, ask the questions — must have a stated solo
    path: record and play back, compare against a written model, use the answer
    key, use the tutor. Where a partner genuinely helps, offer it as "if someone
    is with you", never as the instruction.
13. **No forward references to a teacher.** The strings "your teacher", "in
    class", "your tutor will explain", "ask your trainer" are banned. If the
    learner needs to know it, it is in the unit.
14. **Self-diagnosis replaces correction.** For every skill the unit teaches,
    give the learner a way to detect their own error without being told:
    recording and listening back, counting against a key, comparing with a
    model, an observable checklist. A learner who cannot tell whether they got
    it right cannot improve alone.
15. **Explanations are complete.** If a rule has an exception the learner will
    hit inside this unit's own practice, explain the exception here. Never
    defer.
16. **Definitions must be self-sufficient.** Define every word using words
    simpler than the headword and already met in the course. No circular
    definitions.
17. **Every "if you are stuck" must actually unblock.** Restating the
    instruction in different words is not support. Give a smaller first step, a
    worked case, or a way to check.
18. **Success criteria must be countable or observable by the learner.** "Five
    sentences, each with a full stop" works. "Write clearly" does not — there is
    nobody to judge it.

#### D. Neutrality — no first language, no ethnicity, no nation

19. **Never name a first language and never contrast English with one.** A
    learner who does not speak the language you chose learns nothing from the
    comparison, and one who does may be told something wrong about their own.
20. Follow the people-and-places rules in the canon above: default to **you**
    and to **roles**, use first names only when a task needs one, vary their
    origin, and never let the name carry the point.
21. **No national or religious frame.** Festivals, food and holidays appear as
    categories, not as one tradition's examples. No flags, no currencies, no
    national institutions.
22. **Never require personal disclosure.** No task may need the learner's
    immigration status, income, health or family circumstances. Where a task
    needs personal details, say plainly they may invent them.
23. Where a text touches law, health, money or officialdom, it must be
    **clearly hypothetical**. Never write a rule or an instruction a learner
    could act on. Mark examples as examples inside the text.

#### E. Error prediction without knowing the learner

You cannot predict interference without knowing the first language, and you do
not know it. So teach the errors that recur across learners generally, and let
the learner discover which apply to them.

24. `commonMistake` names a **specific, observable error with its fix** — never
    "students often find this confusing". Draw on the errors that recur widely:
    dropped articles and over-corrected articles; missing third-person *-s*;
    missing plural *-s*; missing *do* in questions and negatives; dropped
    subject ("Is raining"); word order in questions and with adverbs;
    preposition choice; past simple against present perfect; countable against
    uncountable.
25. **Do not tell the learner which errors are theirs — give them a way to
    find out.** A self-check that surfaces their own pattern is worth more than
    a list of everyone's.
26. **Phrase every correction without blame.** "It is easy to leave out *the*,
    because many languages have no word for it. English needs it here: **the**
    bus is late."

#### F. Compression discipline — teach once

27. Teach **only** the patterns in the contract above.
28. Anything in the already-taught list may be **used freely** and must not get
    a card, an explanation, or a "remember that…" aside.
29. When you drop a source topic, keep its **language** and move it to an adult
    context.
30. Report which source units you drew from and what you dropped.

#### G. Design signature — Grade 1's, on purpose

31. Grammar renders as the **full-screen pattern carousel**: one pattern per
    screen, large type, a big *Hear it* button, dots and swipe. Each card must
    **stand alone on one screen** — if it needs scrolling, it is too long.
32. Unit 0 is a **sounds** unit — the sounds and syllable shapes that are hard
    in English, opening with a self-check so the learner finds out which are
    hard for them. Not the alphabet.
33. One idea per screen. Audio on every line. Never a wall of text.

#### H. Assessment validity

34. One defensibly correct option, three clearly wrong ones **from a different
    category**. All-same-category options are banned.
35. `correctAnswer` character-for-character one of four unique options.
36. **Answer position distributed — no slot above ~40%.** This is the defect
    that recurs most: a learner scores full marks by never reading.
37. Comprehension answerable **only** from its own passage, varying the skill:
    literal recall, inference, vocabulary-in-context, evaluation.
38. At least one comprehension question on the **real-world document**, asking
    what a person would actually need from it.
39. **Every quiz item explains itself**, including why the wrong options are
    wrong where that is the teaching point. The explanation is the only feedback
    the learner gets.
40. Difficulty sits at the band: A1 tests recognition and completion, B1 tests
    choice between plausible alternatives.

#### I. The AI tutor

41. Written for a lone adult, specific to its item, never templated.
42. Never request personal, immigration, medical or financial details.
43. The tutor is a rehearsal partner, not a marking service. Never write a task
    whose only check is the tutor's opinion.

#### J. Audio

44. If you change narrated text the audio no longer matches. **List every
    narrated field you changed**, and give regenerated clips a fresh dated
    filename — the CDN caches for a year.

### 4 — POSITIVE QUALITY BAR

- Every item teaches something the learner could use this week.
- Progression within a section: earlier items supported, later independent.
- A learner who finishes can name what they can now do, and what they name
  matches the CEFR descriptors you wrote.
- **The test: could someone finish this unit alone, at night, on a phone, with
  nobody to ask?** If any part fails that, rewrite it.

### 5 — PROCESS

1. Read the source, the contract, the already-taught list and the Cambridge
   objectives in full.
2. Draft the outcomes **first**, with both frameworks attached.
3. Decide what you are dropping and what adult context replaces it.
4. Draft each section against the Constitution.
5. Run §6. Fix every failure. Re-run until green.
6. Only then produce the JSON and the report.

### 6 — MANDATORY SELF-VERIFICATION (report PASS/FAIL and the number for each)

1. **CEFR band**: every outcome at `{{CEFR_BAND}}` or below; zero above.
2. **CEFR skills**: list each outcome's skill; more than one, and three of five
   across speaking/writing/practice.
3. **CEFR descriptors**: observable by the learner alone, in "I can" form.
4. **Cambridge codes**: every code exists in the list for a stage in the source;
   report any source objective dropped, and why.
5. **Self-teaching — answer keys**: count of practices with a learner-facing key
   against the number of practices. Must be equal.
6. **Self-teaching — worked examples**: every grammar card has one.
7. **Self-teaching — solo paths**: list every task that mentions another person
   and confirm each states a solo alternative.
8. **Self-teaching — no teacher references**: report the count of "your
   teacher", "in class", "your trainer", "your tutor will". Must be **0**.
9. **Self-teaching — stuck paths**: every support line gives a different, smaller
   step rather than restating the task.
10. **Neutrality**: zero named first languages; zero named countries, cities,
    currencies or national institutions; zero religious framing; list every
    personal name used and confirm none carries the point of its task.
11. **Register**: min/max sentence length against the band; zero child-world
    subjects.
12. **Compression**: every contracted pattern taught; zero already-taught
    patterns re-taught.
13. **Vocabulary**: distinct definitions; each defined in simpler words than the
    headword; 5 adult practice sentences each.
14. **Quiz validity**: one correct option; cross-category distractors; answer ∈
    options; **answer-position spread ≤40% in any slot**; zero duplicate stems;
    every item explained.
15. **Comprehension**: every question anchored in its own passage; at least one
    on the real-world document; skills varied.
16. **Anti-templating**: distinct-value counts for speaking/writing/practice
    equal the item counts.
17. **Carousel fit**: report the longest `explanation` and `ruleAndExamples` by
    character count.
18. **Audio**: list exactly which narrated fields changed.

### 7 — RETURN FORMAT

1. The complete **unit JSON**.
2. A **verification report**: §6 items 1–18 with PASS/FAIL and the measured
   number; the CEFR skill spread; every Cambridge code cited and dropped; every
   personal name used; the narrated fields that changed; and the source content
   dropped with the adult context that replaced it. Where something is a
   judgement call, say so rather than hiding it.

## ═══ PROMPT END ═══

---

## Pair it with the gate

`tools/build-intensive-units.js` runs the machine-checkable rules on build and
refuses to ship a unit that fails:

- every outcome has `cefr.level`, a valid `cefr.skill`, an "I can" descriptor and Cambridge codes
- no `cefr.level` above the unit's band
- every Cambridge code resolves in `src/curriculum/cambridge-english-{0058,0861}.json`
- every grammar card has a worked example and an answer key
- every activity has an answer key
- zero teacher references
- quiz answers present in their options, no duplicates, position spread ≤40%
- carousel character budget

A unit ships when the gate is green **and** a human has checked the one thing a
machine cannot: are the quiz distractors secretly all the same category.

## Known gaps

- **CEFR placement is a claim until it is tested.** Validate the band mapping
  against real learner output from the first cohort before advertising levels by
  CEFR name.
- **Levels 3–5 have no source material.** Level 3 (B2) waits on Grades 9–12.
  Levels 4 and 5 sit above the school curriculum entirely. C2 is worth a
  commercial decision first — it is rarely set as a minimum by anyone.
