# Grade 4 English: the Stage 4 objectives the units did not claim, and how they were closed

Measured 2026-09-11, while building the Grade 4 standalone lesson app
(`english/grade-4-app`), against Cambridge Primary English 0058, Stage 4.
Claims are read from the ten unit JSONs' outcomes, as for Grades 1 and 3
(`docs/english-g1-objective-gaps.md`, `docs/english-g3-objective-gaps.md`).

| strand | before | after | of |
| --- | --- | --- | --- |
| Reading (4R) | 40 | 46 | 46 |
| Writing (4W) | 37 | 44 | 44 |
| Speaking and listening (4SL) | 15 | 16 | 16 |
| **Stage 4** | **92** | **106** | **106** |

Zero invalid codes; the strict curriculum validator passes all 160 English
units.

## What was missing

Every learner-facing section of all ten units was searched. None of the
fourteen was taught as a lesson - what the search found was a word in passing
or a metadata field. The nearest was a simile offered as an extension prompt in
three writing tasks (Units 2, 4 and 8).

## How each was closed

`tools/author-english-g4-stage4-gaps.py` (same shape as Grade 1's
`author-english-g1-narrative-and.py`) added the teaching first and the claim
second, in sections the app already renders, each item answerable from the
unit's own text. Story questions are placed FIRST among their reading's
questions so the app's six-question step reaches them.

| code | objective (abridged) | what now teaches it | unit, outcome |
| --- | --- | --- | --- |
| 4Ra.04 | how fiction reflects its time or setting | story questions: what details say about when and where | 8 lo05, 9 lo08 |
| 4Ri.10 | predict what happens next | story questions that stop at the clue | 2 lo09, 5 lo06 |
| 4Ri.13 | skim for the overall sense | "Skim ‘A Look at the Stars’: what is it about?" | 8 lo01 |
| 4Ri.17 | a story's viewpoint | "Who is telling …?" first person (Nora) and third (Mombasa) | 7 lo08, 9 lo08 |
| 4Rs.03 | ideas organised in paragraphs | "Which paragraph …?" on two information texts | 2 lo05, 4 lo03 |
| 4Rw.02 | stressed and unstressed syllables | grammar rule: Stressed Syllables | 1 lo03 |
| 4SLp.03 | speech, gesture and movement in drama | speaking task: Act the Scene (queen and lion) | 7 lo02 |
| 4Wc.04 | describe settings and characters | writing task: Picture the Attic | 8 lo05 |
| 4Wc.05 | alternative endings | writing task: A Different Ending for The Spiral Cave | 5 lo07 |
| 4Wc.06 | a viewpoint through a character's opinions | writing task: Noah's Diary | 9 lo08 |
| 4Wc.07 | an original playscript | writing task: A Playscript - The Queen and the Lion | 7 lo02 |
| 4Wv.05 | similes and alliteration | grammar rule: Similes and Alliteration | 2 lo01 |
| 4Ww.05 | there / their / they're | grammar rule: There, Their and They're | 9 lo01 |
| 4Ww.06 | common letter strings, different sounds | grammar rule: One Spelling, Many Sounds: -ough | 2 lo01 |

Nine story questions, four grammar rules, four writing tasks, one speaking
task, eighteen answer-key rows.

## Where a learner meets it in the lesson app

Authoring the items was half the job; the other half was a page that shows
them. In `english/grade-4-app`:

- **Grammar rules**: the "How English works" step shows every rule, so all
  four are there.
- **Story questions**: all 9 are on the "What happened in the story?" step.
  Unit 9's setting question was missed at first - the step takes one question
  per reading in turn and stops at six, Unit 9 has five readings, and the
  sixth slot went to reading one. The spare slot now goes to the reading with
  the most questions, which is the Mombasa story.
- **Writing and speaking tasks**: the app used to show only the first writing
  task (as one tile sentence) and six model lines from the speaking tasks -
  10 of 64 and 20 of 61 in this grade, and none of the five authored here.
  Two steps now carry every task in full: "Write it yourself" and "Talk it
  through" (`"taskSteps": true` in the app's config). Checked in the browser
  on Unit 7: the playscript and Act the Scene are on their cards, marked as
  not yet checked by a teacher.

## What this is not

**Authored, not reviewed.** Every new item carries "Needs curriculum review";
the thirteen outcomes whose mapping widened carry a re-review flag. The
grammar, writing and speaking items have no recording yet (their audio
descriptors say so), so the app speaks their text; record them with the
generator once a reviewer approves the wording.

Three sentences in the first draft were wrong against the texts and were
corrected before anything was written: a prediction question that stopped the
story before its own clue, "a quick call at the office" read as a phone call,
and a stress example claiming a noun "RE-port" (it is re-PORT; the rule now
uses RE-cord / re-CORD).
