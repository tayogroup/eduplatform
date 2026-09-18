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
| `inputs/ehel-english-intensive-source/program/lessons/letters/lesson-NN.json` | A Letters & Sounds lesson in the `ehel-intensive-literacy/1` format. All twelve are WRITTEN by `make_letters.py`: do not edit them by hand. |
| `make_letters.py` | Writes the Letters & Sounds lessons. Lessons 2–5 and 7–11 are copied from Phonics units (`MAP`); lessons 1, 6 and 12 are written by hand in the script (`hand_1`, `hand_6`, `hand_12`). |
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

## Letters & Sounds

A literacy lesson is Start (What this lesson is about, the Unit lecture), then **Hear it**, **See & write it**, **Read it** and **Check**, then What I can do now. Each step reads ONE block of the lesson file:

- The default steps are `LIT_STEPS` in `build_program.py` (sounds, find the sound, trace the letters, copy words, blend, read words, tricky words, a short text, read aloud, dictation). A default step whose block is empty is left out.
- A lesson may list its own `steps` instead, as `[group, title, renderer, block path]`. Lessons 1, 6 and 12 do. The renderers are `P.note`, `P.hearSounds`, `P.findSound`, `P.countSounds`, `P.seeLetters`, `P.copyWords`, `P.blend`, `P.readWords`, `P.tricky`, `P.reader`, `P.readAloud` and `P.dictation` in `lib/program.js`.
- A block is a list, or `{title, lead, items}` when a lesson needs its own wording.

Its toolbox has four tools: Sound chart (every sound up to this lesson), Words, Unit lecture and Lesson plan.

Three things that are not obvious:

- **A sound button never plays a clip.** A clip for "r" or "sh" is named by those letters alone, and other levels recorded the same name as a letter NAME. Sounds are said through the device voice from measured respellings (`sss`, `kuh`), the same table as `tools/lib/ehel-phonics-speech.js`.
- **The lectures were corrected, so their recordings no longer play.** Every Phonics lecture said "This is Unit N" and some sent the learner to "Book B" or "the Intro level". `make_letters.py :: LECTURE_EDITS` corrects them line by line and refuses any line that still names an old unit, book or level. A clip is named by its exact text, so a corrected lecture is read by the device voice until it is narrated again. The short readers are unchanged and still play their recordings.
- **Only clips that exist are requested.** The builder lists them (`LESSON.clips`, by the same cyrb53 name the page computes). On the CDN, a 404 on a media path is cached for a year and cannot be purged, so asking for a clip that is not there would block it from ever being added under its name.

## The platform

Each level is its own Moodle course (owner, 2026-09-18: new course keys, and the live course left as it is for its learners):

| Level | Course key | Media folder | Wehel level |
| --- | --- | --- | --- |
| Letters & Sounds | `ehel-intensive-eng-l10` | `g10` | -1 |
| Starter | `ehel-intensive-eng-l11` | `g11` | 0 |
| Level 1 | `ehel-intensive-eng-l12` | `g12` | 1 |
| Level 2 | `ehel-intensive-eng-l13` | `g13` | 2 |
| Level 3 | `ehel-intensive-eng-l14` | `g14` | 3 |
| Level 4 | `ehel-intensive-eng-l15` | `g15` | 4 |

- **Why these keys:** Moodle launches only keys shaped `ehel-<slug>-lNN` (`progress_gatewaylib.php`). Any other shape would need the PHP changed and deployed first.
- **Units:** they are the lesson numbers, u01–u12. The Letters & Sounds bridges are u13 and u14.
- **Wiring:** the build writes `app.config.json` into every level folder and then runs the shared pipeline (`../../../mathematics/lesson-app-tools`): wire-navigation, wire-platform-controls, preload-platform, wire-progress. **Every build rewires**, because a page built and not wired silently loses its launch parameters, progress, class controls and Wehel.
- **Tools that are not run,** and why:
  - add-header-bars and add-lesson-search need the lesson kit's layout.
  - The others are the ones the live Intensive build skips too.
- **Four details the wiring needs:**
  - The level page's Continue link uses `?step=N`, not `#step-N`. The carry script appends the launch parameters after everything in a link, and a fragment would swallow them.
  - Links made at run time carry the parameters themselves (`program.js :: withParams`).
  - The summary slide is ticked without `finish()`, because the progress wiring counts every `finish()` and completes a lesson at all steps but one.
  - Launched from Moodle, a level page hides its level tabs and course-home link. Each level is its own course, and the gateway refuses another course's progress.

## Voice

- **What gets narrated:** the build writes `narration/<level>.json`, every clip its pages can play. The narrator is `tools/generate-ehel-intensive-programme-audio.js`.
- **The narrator is dry by default.** Without `--pay` it sends and bills nothing, and an unknown option (even `--help`) stops it. Emit the scripts with `--emit-scripts` and read them before paying.
- **Voices:** as in the live course, words and example sentences are Alice and everything else is the standard voice. In a conversation the speakers alternate between the two, and each line is its own clip, named by its text and its voice.
- **Playback:** a whole lecture or conversation plays its clips in order, but only when every clip exists. Otherwise the device voice takes the whole thing, so no conversation changes voice halfway.
- **Letters & Sounds:** sent through the Phonics speech table (`tools/lib/ehel-phonics-speech.js`), unit by unit, so letters are voiced as sounds. Bridge A has a hand-written spoken form.
- **Clip lookup:** only clips that exist are requested (`LESSON.clips`).
  - Local builds use `media/audio/tts`.
  - Deployed pages use `media/intensive-english/g10–g15`, claimed in `tools/lib/ehel-intensive-narration.js`. That same claim is what the uploader, the audio check and the prune tools read. **Upload the media BEFORE the pages:** a page asks only for clips it lists, and on the CDN a 404 on a media path is cached for a year.

## Status (2026-09-18)

- **Built, all 72 lessons:**
  - Letters & Sounds: 12 lessons, plus Bridge A and B
  - Starter: 10 lessons
  - Levels 1–4: 12 lessons each
  - Level 5 is an outline only; the owner made it optional and later.
- **How they were written:** agents wrote them from one brief (`author_brief.md`, kept with the session's scratch files), the pilot and a source pack per lesson.
- **How they were checked:** every lesson passes `--check`. It also passes an audit: the reconciled word plan, the level's length bands, item counts, UK spelling and typed-answer length. The audit was mutation-tested and caught 13 of 13 planted faults.
- **Review:**
  - A reviewer read every question in each level: two right answers, wrong keys, contradictions, level, register. Its fixes are separate commits.
  - Starter 2 and 9, Level 1 Lessons 3 and 11, and Level 3 Lesson 1 were also read through by the session that built the kit.
- **Browser:** every page loads and finishes its set-up.
- **Pictures:** audited per level (see Pictures above).
- **Not done:**
  - narration, including re-recording the Letters & Sounds lectures (their text was corrected)
  - the shared platform wiring (launch parameters, progress to Moodle, class controls, Wehel)
  - new course keys, mapping old unit ids to new lesson ids, the catalogue
  - the Section 5 books, which the owner will supply
  - deploy and routing
- The live course is untouched.
