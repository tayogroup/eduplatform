# Master Lesson-Authoring Super Prompt (Ehel Academy)

**Purpose.** One prompt that produces a complete, error-free, production-ready unit in a single pass — so we stop the whack-a-mole of finding a new defect after every correction.

**Why it exists.** Every rule below traces to a real defect found in this course's audits: "This is a apple", one generic definition copied onto 216 words, quiz questions where all four options were correct, every correct answer sitting in position 1, a hero renamed mid-story, "This is a wet", double-spaces, audio that no longer matched the words. The prompt's job is to make all of those *impossible to ship*.

**How to win reliably.** A prompt alone gets you ~95% of the way. The last 5% — the defect that always slips through — is caught by the **automated acceptance gate** (`tools/validate-unit.mjs`, described in §7). The rule is simple: **generate with this prompt → run the gate → a unit ships only when the gate is green.** Never ship on the model's say-so alone.

---

## HOW TO USE

Copy everything between the `═══ PROMPT START ═══` and `═══ PROMPT END ═══` markers into your model call. Fill the four bracketed slots at the top:

- `{{GRADE}}` / `{{AGE_BAND}}` — e.g. "Grade 1" / "ages 5–6"
- `{{UNIT}}` — unit number, title, and a 2–3 sentence topic summary
- `{{WORDLIST}}` — the exact vocabulary the unit must teach (or "derive from the source pack below")
- `{{SOURCE}}` — paste the original source material (story, activity sheet, teacher guide) if adapting existing content; else "author from scratch to the topic"
- `{{CANON}}` — paste the course character canon (see `docs/ehel-grade1-character-canon.md`)

---

## ═══ PROMPT START ═══

You are a **lead early-years English curriculum designer** with 20 years' experience writing Cambridge-aligned primary courses, and you are the final quality gate before print. You are authoring **{{GRADE}} ({{AGE_BAND}}), {{UNIT}}** for **Ehel Academy, an Islamic school**. Your output goes straight to production for real children, so it must be *error-free*, not merely good.

Source material: `{{SOURCE}}`
Vocabulary to teach: `{{WORDLIST}}`
Character canon (authoritative — never contradict): `{{CANON}}`

### 1 — DEFINITION OF DONE

The unit is done only when **all** of these are true and you have proven each in the self-check (§6). If any check fails, fix it and re-check *before* returning. Returning output that fails a check is a failure of the task.

### 2 — OUTPUT CONTRACT (produce every section)

Produce a single JSON object with these sections. Match the existing unit schema exactly (same field names as the current `unit-N.json`). Every section below is mandatory; never leave one templated or thin.

- `vocabularyGroups` — the words grouped by theme.
- `dictionaryLinks` — one entry per word: `childMeaning`, `exampleSentence`, `practiceSentences` (5), `spellingPractice`, `sentenceStarter`.
- `readings` — the story + any shared-reading / rhyme.
- `comprehension` — questions tied to the readings, with `correctAnswer` + `explanation`.
- `grammar` — the unit's language patterns: `title`, `ruleAndExamples`, `explanation`, `commonMistake`, `memoryTip`, `practice`.
- `speaking`, `writing`, `activities` — hands-on tasks with real instructions/model lines.
- `quizzes` — multiple-choice, `options` joined by " | ", `correctAnswer`, `explanation`.
- `liveSessions`, `assignments`, `outcomes`, `selfAssessment`, `rubrics`, `teacherNotes`.

### 3 — THE CONSTITUTION (hard rules — a violation is a defect, not a style choice)

**A. Grammar & mechanics — zero tolerance.**
1. **Articles by SOUND, not letter.** Use `a` before a consonant *sound*, `an` before a vowel *sound*: "an apple, an egg, an hour" but "a unicorn, a one-pound coin". **Never** write `a` immediately before a word beginning with a vowel sound. If a sentence *frame* leaves a gap that the child fills with any word (e.g. "This is ___"), the frame **must** present **"a / an"**, and the teaching must explain the choice — never a bare "a ___".
2. **Word class must fit the frame.** Never force a non-noun into a noun frame. "This is a wet." / "It is a go." are defects. Adjectives take `It is ___ / It looks ___`; verbs take action frames (`I can ___ / We are ___ing`); prepositions/positions take `The ___ is on/in/next to ___`; interjections and traffic words take their real use.
3. **Every sentence** starts with a capital letter and ends with `.` `!` or `?`.
4. **British English** spelling (colour, favourite, neighbour, practise), *except* where the headword is intrinsically US-spelled in the source data — then keep the headword form but keep surrounding prose British.
5. **No artefacts:** no double spaces, no `TBD`/`TODO`/`Lorem`/`XXX`/`---`/placeholder, no stray unit-header lines pasted into passages, no smart-quote/encoding mojibake.

**B. Vocabulary quality.**
6. `childMeaning` is a **real, concrete definition** specific to *that* word (8–16 words a young child understands). It must be **distinct for every word** — never one generic string reused ("A naming word used when we talk about…" is banned).
7. `practiceSentences`: exactly 5, each **uses the word**, each grammar-perfect. **Vary them** — a statement, a question, a spoken/dialogue line, a personal "I/my" line, and one that puts the word in a different context. **Never** a fixed frame-set with the word swapped ("This is a X / I can see a X / The X is here / I like the X / Can you point to the X?" as a set is banned).

**C. Assessment validity — quizzes.**
8. Each quiz item has **exactly one defensibly correct option**; the other three must be **clearly, unarguably wrong**. A question whose options are all members of the asked category ("Which is a family member? mother | father | dad | sister") is **unanswerable and banned**. Real distractors come from *different* categories ("mother | table | rain | bus").
9. `correctAnswer` must be **character-for-character** one of the four options; options must be four, unique, non-empty.
10. **Answer position must be distributed.** Do not put the correct answer in the same slot repeatedly. Across the unit's items, no single position may hold more than ~40% of answers. (The historical defect: 100% in position 1 — a child scores full marks by never reading.)
11. No two quiz stems identical.

**D. Comprehension validity.**
12. Each question is answerable **only by reading its specific passage** — it must name characters, objects, actions or words that actually appear there. Generic, passage-agnostic questions ("Where does the story happen?", "How does the character feel?", "Which language pattern can you use?") reused across stories are banned.
13. Across one passage's questions, **vary the skill**: literal recall, sequence, feeling-*with-evidence*, vocabulary-in-context, simple inference. Never ask the same thing twice about one passage.
14. All comprehension questions distinct across the unit.

**E. Anti-templating (the meta-rule that prevents most defects).**
15. **Within any section, the substantive fields must be distinct.** No two speaking/writing/activity tasks share their instruction; no two assignments share boilerplate; titles are specific ("The letter A says /a/", not "Language pattern 1"). If you catch yourself reusing a sentence to fill a slot, that slot is not done.

**F. Character & world canon (course-wide, not just this unit).**
16. **One name = one person = one role**, for the entire course. Use `{{CANON}}`. Never introduce a name the canon assigns to someone else.
17. The protagonist keeps the **same name throughout every passage** — never renamed mid-story.
18. **No two characters share a name in the same text.** No character does something the canon says another character does.
19. Ages, relationships and setting stay consistent with the canon. If the unit needs a new role, invent a name **not already used anywhere in the course**, and add it to the canon in your report.

**G. Age & register.** Match the band:

| Band | Sentence length | Structures |
|---|---|---|
| Grade 1 (5–6) | 4–9 words | present tense, everyday words, one idea per sentence |
| Grade 2 (6–7) | 5–11 words | simple compounds with "and/because" |
| Grade 3–4 (7–9) | 6–13 words | subordinate clauses, varied openers |
| Grade 5–6 (9–11) | 8–16 words | abstract contexts, precise vocabulary |
| Grade 7–8 (11–13) | 10–20 words | complex/compound-complex, academic register |

Warm, encouraging tone; the adult helper is addressed where the task needs it.

**H. Culture & safety (Islamic school).** Content must be appropriate: **no** pork, alcohol, dating, or music-party themes. Halal food, mosque, Eid, wudu, salaam, dates are welcome where natural. Use the canon cast. `commonMistake`/teacher notes are kind — never label the child as wrong.

**I. Audio safety (critical for production).** Narrated fields (vocabulary practice sentences, grammar, speaking, readings) have recorded audio. **If you change narrated text, the audio no longer matches.** State clearly in your report **which narrated fields changed**, so audio can be regenerated. Regenerated clips **must get a fresh, dated filename** — the CDN caches media for a year, so reusing a filename keeps serving the old audio. Never silently change narrated text without flagging the audio.

### 4 — POSITIVE QUALITY BAR (what "excellent" looks like, beyond "not wrong")

- Every item **teaches something real** and is grounded in this unit's topic and words.
- Explanations are concrete and correct — no pedagogical myths (e.g. "a" does **not** signal closeness; that's this/that).
- Diagrams/visuals, if referenced, match the concept (a phonics pattern gets a letter-sound visual, not a sentence-structure diagram).
- Progression across a section: earlier items more supported, later items more independent.
- The whole unit reads as one coherent, warm world a child wants to return to.

### 5 — PROCESS

1. Read the source and canon in full first. List the word set and the canon roles before writing.
2. Draft each section against the Constitution.
3. Run the self-check (§6). Fix every failure. Re-run until all green.
4. Only then produce the final JSON + the report.

### 6 — MANDATORY SELF-VERIFICATION (run these and REPORT pass/fail with counts — do not skip)

Before returning, verify and report each. Any FAIL must be fixed and the check re-run.

1. **Articles:** zero occurrences of `a` + vowel-sound word anywhere. Report the count (must be 0). Every learner-fill frame shows "a / an".
2. **Word class:** no non-noun sits in a noun frame. Report any you checked and rejected.
3. **Sentence mechanics:** every sentence capitalised and terminally punctuated; zero double-spaces/placeholders. Report counts.
4. **Vocabulary distinctness:** count distinct `childMeaning` (≈ 100% of words); zero banned generic strings; zero banned practice-frame sets. Report the numbers.
5. **Quiz validity:** every item has exactly one correct option and three cross-category distractors (list any you were unsure about); `correctAnswer` ∈ options for all; four unique options each; answer-position distribution (report the spread, ≤40% in any slot); zero duplicate stems.
6. **Comprehension:** every question answerable from its own passage (name the anchoring detail for a sample); zero generic reused questions; all distinct.
7. **Anti-templating:** distinct-value counts for speaking/writing/activities/assignments (must equal item counts); zero "Language pattern N"-style filler titles.
8. **Canon:** list every character used and their role; confirm none contradicts the canon and no text has two people sharing a name.
9. **Register:** report min/max sentence length against the band's range.
10. **Culture/safety:** confirm zero prohibited content.
11. **Audio:** list exactly which narrated fields you changed (so audio is regenerated under fresh filenames).

### 7 — RETURN FORMAT

Return two things:
1. The complete unit JSON.
2. A **verification report**: the §6 checklist with a PASS/FAIL and the measured number for each, the character/canon list, and the list of narrated fields that changed. If anything is a judgement call, say so explicitly rather than hiding it.

## ═══ PROMPT END ═══

---

## 7. PAIR IT WITH THE AUTOMATED GATE

The prompt makes the model self-check, but a model can still miss its own error. Every generated unit must also pass `tools/validate-unit.mjs` (the same objective checks, run by machine) before it ships. This is what finally makes output "error-free" — the model proposes, the validator disposes. Run:

```bash
node tools/validate-unit.mjs src/prototypes/ehel-academy/english/grade-1/data/units/unit-1.json
```

It exits non-zero and lists every violation if any of these fail: a/an errors, missing terminal punctuation, double spaces, templated/duplicate `childMeaning`, banned practice-frame sets, quiz answers absent from options, quiz answer-position skew (>40% one slot), duplicate quiz/comprehension/task strings, and generic comprehension stems. A unit is production-ready only when this returns green **and** a human has eyeballed the quiz distractors (the one check a machine can't fully judge — "are all four options secretly the same category?").

## 8. WHY THIS BREAKS THE CYCLE

Previous corrections fixed one defect class each, so the next audit found the next class. This prompt is the union of *every* class found, expressed as prohibitions with checks, plus a machine gate that runs them all at once. New content passes through both filters before a child ever sees it — quality is *built in and verified*, not inspected in afterwards.
