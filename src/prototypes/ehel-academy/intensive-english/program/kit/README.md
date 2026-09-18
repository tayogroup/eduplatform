# The Intensive English program kit

This kit builds the restructured Intensive English course. The owner decided the design on 2026-09-18. It is set out in two artifacts:

- **Intensive English Course Map**, the plan: https://claude.ai/artifact/9HEyyLHjqL9ukuL9KDZY1w
- **Intensive English Blueprint**, the review and decisions: https://claude.ai/artifact/GjXMGeex3GqLPcAwY3fWqk

It is separate from the live course. Nothing here reads or writes `level-N/` or `level-N-app/`.

```bash
cd src/prototypes/ehel-academy/intensive-english/program/kit
python build_program.py --check    # check every authored lesson; writes nothing
python build_program.py            # check, then build ../app
```

## The shape

- **Hierarchy:** Level → Part → Lesson → Section → Step. The old course called lessons "units". The owner asked for "Lesson" at level level.
- **Levels:**
  - Letters & Sounds is a literacy strand for non-readers.
  - Starter (Pre-A1) and Levels 1–3 (A1, A2, B1) take 9 months.
  - Level 4 (Advanced, B2) takes 2 more months.
  - Level 5 (Business Communication) is optional and later.
- **Pace:** 2 hours a day, 5 days a week. A live class of about 30 minutes is inside the 2 hours.
- **Every lesson:**
  - **What this lesson is about**, then the **Unit lecture**.
  - Section 1 Listen & speak.
  - Section 2 Grammar in use.
  - Section 3 Read & write.
  - Section 4 Real-life task. The task is done in the live class, or with Wehel.
  - Section 5 Reading & comprehension. The book is a placeholder until the owner supplies the books.
  - Review & check.
- **The lesson menu** is a path grouped by section, plus a toolbox: Word list, Phrasebook, Grammar notes, Unit lecture, Transcripts, Answers, My work, Library, Wehel tutor, Lesson plan.

## Files

| File | What it is |
| --- | --- |
| `inputs/ehel-english-intensive-source/program/program-plan.json` | The plan: levels, parts, lessons, can-dos, schedule, and the sources each section reuses (`L1 12` means current Level 1 Unit 12; `Lg 7` means legacy Level 1 Unit 7). |
| `inputs/ehel-english-intensive-source/program/lessons/<level>/lesson-NN.json` | One authored lesson in the `ehel-intensive-lesson/1` format. `level-1/lesson-08.json` is the pilot and the reference for the format. |
| `lib/program.js`, `lib/program.css` | The step renderers, the lesson menu and the toolbox. |
| `../../lesson-kit/lib/{lesson.css,intensive.css,voice.js,deck.js}` | Reused unchanged. The shared platform tools patch `deck.js`'s `show()` by its exact text, so `program.js` wraps `show` and `finish` instead of editing them. |
| `../app/` | Generated. Do not hand-edit. It holds `index.html` (course home), one folder per level with its `index.html`, and the lesson pages. |

## Rules the check enforces

These are shape and limit rules only. Cambridge objective codes no longer shape lessons.

- **Unit lecture:** exactly one chapter for each of the five sections.
- **Grammar:** 1 or 2 points per lesson, each rule 5 lines or fewer, and at least 6 practice items.
- **Words:** 6–16 in Section 1 and 4–12 in Section 3. Every word needs `w`, `pos`, `meaning` and `example`.
- **Questions:** every question has its answer among its options, or an answer plus two wrong options.
- **Section 5:** a `placeholder` until the book arrives, then `text` plus `questions`.

## Voice

No narration has been recorded for the program yet. Every line goes to the device voice through `voice.js`, and `program.js :: clipFor()` returns nothing. That means no paid TTS calls, so the page can be driven on any local port.

`voice.js` only uses the paid endpoint on port 4287 or when the page has a `pwsEndpoint` launch parameter. Conversations play as one SSML utterance, with a pause and a pitch change between speakers.

## Status (2026-09-18)

- **Built:** Level 1 · Lesson 8 · Health and the doctor, as the pilot. It was driven in the browser at desktop and phone size: the menu, section jumps, questions, the toolbox, saved progress, and Continue on the level page.
- **Every other lesson:** listed on its level home as "in preparation".
- **Not done:**
  - authoring the other lessons
  - the Letters & Sounds renderers (Hear it · See & write it · Read it · Check)
  - narration
  - the shared platform wiring (launch parameters, progress to Moodle, class controls, Wehel)
  - new course keys, mapping old unit ids to new lesson ids, the catalogue
  - deploy and routing
- The live course is untouched.
