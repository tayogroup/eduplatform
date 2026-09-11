# English Grades 1-4: the content review of 2026-09-11, and what it changed

Four reviewers read every learner-facing item in English Grades 1-4 — the
readings, comprehension, quizzes, fluency practice, grammar practice keys,
writing and speaking tasks, activities and answer keys — and checked each answer
against its text, each key against its options, and the English itself. They
returned 172 findings. Every finding was then checked against the file before
anything was changed, and the quoted evidence matched in every case.

The changes are one tool, `tools/repair-english-g1-4-review-20260911.py`, and
it is the review surface: each edit asserts the old text, so an edit whose
target has moved is refused rather than guessed, and a re-run reports every
edit as already applied.

```bash
python tools/repair-english-g1-4-review-20260911.py           # dry run
python tools/repair-english-g1-4-review-20260911.py --write
```

| grade | edits |
| --- | --- |
| 1 | 71 |
| 2 | 57 |
| 3 | 63 |
| 4 | 51 |

## What was wrong, by kind

- **Practice questions with two right answers.** A distractor that shows the
  same pattern as the answer ("Which sentence is in the present continuous?"
  with two present-continuous options), a synonym of the answer (`toward`
  beside `towards`), or a list-comma quiz whose key used the Oxford comma the
  course does not teach. Usually the distractor was replaced; where the key
  itself was the odd one out, the key changed.
- **Questions that gave their own answer away.** Grade 1 fluency asked "Which
  word means: This word means a boy or a man." Grade 1's repair tool
  (`repair-english-g1-fluency-giveaways.py`) had fixed one form of this
  already; these were a second form it did not look for.
- **Keys that do not fit the sentence.** Grammar "Check yourself" keys that
  capitalise a word going into the middle of a sentence (`1. Is helping`).
- **Explanations that point at a line the text does not have.** "The last
  sentence says…", "the first two sentences give…", "the four middle
  sentences…" — mostly where a reading was lengthened after its questions were
  written. Each now quotes what the text actually says.
- **Facts.** Tanzania has regions, not counties (Grade 3 Unit 4 now takes place
  near Mount Kenya, in Nyeri County); frost does not lie on a warm coast on a
  22-degree day (Grade 3 Unit 7 moves it to the cold mountain viewpoint); a sea
  turtle cannot pull its head into its shell; a STOP sign has eight sides; the
  moon is not a "pale dot" to the naked eye (Grade 4 Unit 8).
- **Story continuity.** Grade 1's Adam is Amal's big brother in Units 3, 4, 5, 8
  and 9, and was a boy she had never met in Units 1 and 7. Unit 1's new friend
  is now Leo (her classmate in the Grade 1 books already), and Unit 7's boy on
  the bicycle is her brother. Grade 1 Unit 3's story was told as "Amal did throw
  the ball"; it is in the simple past now.
- **Writing frames that did not fit their task.** A Grade 1 tracing task whose
  example read "It is ___." The example now shows the task being done.
- **Word-list titles that described another list.** "Words: places in the
  city" over *confused, disappointed, embarrassed, patient*. Eight titles
  changed, in the unit and in `core-words.json` together. Lists whose words fit
  their title loosely were left alone.
- **A US word in a UK course.** Grade 3 Unit 3's story glossary taught
  *vacation* beside *holiday*; the link, its grade-dictionary entry and the
  manifest's word count went together.

## What followed from the changes

Changing the text is the smallest part. Each of these is a place the same words
live, and each was done:

- **Picture books.** Six of the changed readings are also told as picture
  books in `ebookCatalog` (`shell/subjects/english.js`): Grade 1 Units 1, 3 and
  7, Grade 2 Unit 10 and Grade 4 Unit 8. Their page text was changed to match,
  and the Unit 1 book's three pages with the new friend were redrawn with Leo
  (`create-amal-ebook-illustrations.js`). The Grade 1 Unit 1 banner is drawn
  from that book's cover and was re-rendered. `STORY.txt` beside each book is
  generated (`write-english-ebook-docs.mjs`).
- **Book narration.** Grade 1 books play a pre-recorded clip per page, and the
  generator skips any page whose clip exists, so the seven changed pages were
  moved aside and re-recorded (454 characters). That path is served
  `max-age=300`, so the same filenames reach learners within five minutes.
- **Unit narration.** 35 recorded clips narrate text this review changed. The
  staleness check (`check-english-audio-staleness.py --grades 1 2 3 4`) found
  66 more whose text had been edited by earlier commits without a new
  recording: 35 vocabulary sentences, 19 activities, 12 overview panels. All 101 were re-recorded
  (43,184 characters) under a new filename, `audioRevision: "rv"`, because a
  clip that keeps its name keeps its URL, and the edge and every browser that
  played it keep the old recording. The speaking category did not honour
  `audioRevision` until this change. One changed activity (Grade 4 Unit 4,
  `act09`) was never recorded and stays held.
- **Grade 1 lectures.** The opening slide of all nine Grade 1 lectures still
  spoke the overview from before the Grade 1 readability repair; they were
  re-rendered (16,930 characters) and re-versioned.
- **Derived files.** The game packs (`build-ehel-english-games.js 1 2 3 4`;
  a changed answer reshuffles that unit's rounds), the learning-time estimates
  (three units moved by a minute or two) and the English topic index were
  regenerated.

## What this is not

It is not a curriculum sign-off. A reviewer who is a teacher of the stage still
has to read the units; this review checked that answers, keys and facts agree
with the text and with the world, which is necessary and not sufficient. The
other open items are unchanged by it: a real signed launch token in a real
Moodle launch, learning times observed rather than estimated, physical-device
testing, the items still held for review recordings, and the owner's decision
on the core-word rebalance (250 to 425 words).
