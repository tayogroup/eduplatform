# Grade 4 English — the standalone lesson build

The same build as `../grade-1-app/`, `../grade-2-app/` and `../grade-3-app/`,
pointed at `english/grade-4/data` by the `app.config.json` beside this file.
There is no builder here: `../grade-1-app/build-lessons.py` and
`build-hub.py` take `--app <dir>`. This directory holds the config and what it
generates.

## Build

```bash
cd ../grade-1-app
python build-lessons.py --app ../grade-4-app
python build-hub.py     --app ../grade-4-app

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app ../grade-4-app
python $T/wire-platform-controls.py --app ../grade-4-app
python $T/preload-platform.py       --app ../grade-4-app
python $T/wire-progress.py          --app ../grade-4-app
python $T/add-header-bars.py        --app ../grade-4-app
python $T/check-lessons.py          --app ../grade-4-app
node   $T/deploy.mjs                --app ../grade-4-app    # plan; --upload writes
```

## What was carried in from Grades 1, 2 and 3 (2026-09-11)

Everything the Grade 3 build fixed in the shared builder applies here without
a change (see `../grade-3-app/README.md`): the hub's header bar read from the
shared tool, generated hub maps, learning-time on the cards, story-question
options that never repeat a neighbour's answer, small topic groups folded,
worksheets refused as spoken examples, resume, contrast, crest, year bar,
focus chip, doctype and `lang`.

One rule added while building Grade 4: **story-question options may be 110
characters at Grades 3-4** (70 at Grades 1-2). Grade 4 answers in full
sentences — median 71 characters — so at 70 Units 4 and 10 built no
story-question step at all and Unit 7 had three. Six in every unit now, and
Grade 3 gained the same (its Units 4, 9 and 10 went from three to six).

**Content written for Grade 4** (`english/grade-4/data/units/*.json`), by the
same tools with `--grade 4`:

- **Fluency Practice**, 15 per unit, "Needs curriculum review".
- **Learning time**, reading at 100 words a minute, taught words only; about
  84 self-paced minutes a unit, shown on the hub as "about N min".
- **Spelling prompts** on all 350 core links, in the grade's own form
  ("Say, tap and trace: …", 836 of its 1,044 glossary links). **Tutor prompts
  NOT filled**: Grade 4's glossary carries two templates (the commoner covers
  835 of 1,044) and the tool refuses to choose between them — a person picks,
  or writes them. Same position as Grade 2.
- **Speech marks** curly in 306 strings.

**Lectures:** Unit 1's was re-rendered (its script says "-ing", which the
voice read as a syllable; ~2,400 characters) and Units 2–9 redrawn from their
existing recordings so the words slide shows all six words.

## Closed after the first build (2026-09-11)

- **Cambridge coverage 92 → 106 of 106.** The fourteen unclaimed objectives
  were not taught anywhere, so the teaching was authored first and claimed
  second (`tools/author-english-g4-stage4-gaps.py`): nine story questions, four
  grammar rules (stressed syllables; similes and alliteration; -ough; there /
  their / they're), four writing tasks (a different ending, a playscript, a
  setting and a character, a character's diary) and one drama task. All
  "Needs curriculum review". See `docs/english-g4-objective-gaps.md`.
- **Unit banners.** Every Grade 4 unit borrowed a Grade 1 or 2 illustration
  (two of them twice). Each now has its own, composed from the Grade 4
  picture-book kit with the cast and story device of that unit
  (`tools/create-grade4-unit-banners.js` → `english/assets/g4-unit-NN-*.png`).
  The shell course shows them as the unit banner and reading cover; the
  lectures were redrawn over them (from the recorded audio, no narration
  bought) and their posters re-drawn from slide 1.
- **Every writing and speaking task is on a page.** "Write a sentence" and
  "Say it out loud" reached 10 of 64 writing tasks and 20 of 61 speaking
  tasks, and none of the tasks written for the missing objectives. This app
  sets `"taskSteps": true`, which adds **Write it yourself** (after Write a
  sentence) and **Talk it through** (after Let us talk): all 64 and all 61,
  each with its model and checklist behind buttons, nothing marked. A task
  still waiting for curriculum review says so on its card.
- **All nine story questions are on the page.** Unit 9's setting question was
  the one the story step missed (five readings, six slots, and the sixth went
  to reading one). The spare slot now goes to the reading with the most
  questions - see `../grade-1-app/README.md`.
- **Tutor prompts filled** on all 350 core links, in the one template the
  grade's glossary uses (835 links). The tool read "835 of 1,044" as two
  templates; the other 209 are prompts written for one word each, not a rival
  template, and it now measures agreement among templated links only.

## Still open

- **Recordings** for the new grammar, writing and speaking items, once
  reviewed.
- **No human curriculum review.**
