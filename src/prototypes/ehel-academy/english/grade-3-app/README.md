# Grade 3 English — the standalone lesson build

The same build as `../grade-1-app/` and `../grade-2-app/`, pointed at
`english/grade-3/data` by the `app.config.json` beside this file. There is no
builder here: `../grade-1-app/build-lessons.py` and `build-hub.py` take
`--app <dir>`. This directory holds the config and what it generates.

## Build

```bash
cd ../grade-1-app
python build-lessons.py --app ../grade-3-app
python build-hub.py     --app ../grade-3-app

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app ../grade-3-app
python $T/wire-platform-controls.py --app ../grade-3-app
python $T/preload-platform.py       --app ../grade-3-app
python $T/wire-progress.py          --app ../grade-3-app
python $T/add-header-bars.py        --app ../grade-3-app
python $T/check-lessons.py          --app ../grade-3-app
node   $T/deploy.mjs                --app ../grade-3-app    # plan; --upload writes
```

## What was carried in from Grades 1 and 2 (2026-09-11)

Built with the Grade 1 validation report (27 areas, 11 September) and the
Grade 2 build's own findings in hand. Each line is what the build does about
one of them.

**Inherited through the shared pipeline, verified on these pages:** doctype
and `lang="en-GB"`; resume on reopen (the restore guard reads real input);
the progress label at `--ink`; the real crest; the year bar; the focus chip.

**Content written for Grade 3** (`english/grade-3/data/units/*.json`):

- **Fluency Practice**, 15 per unit, by `tools/author-ehel-english-g1-fluency.py
  --grade 3`, stamped "Needs curriculum review" like Grades 1 and 2. Grammar
  questions take the sentences the rule QUOTES as its examples, pick the one
  that shows the pattern's key word ("Using because…" answers with the
  sentence that has *because*), and never offer a wrong option that also shows
  it. A word question whose meaning names its own answer is asked as a gap
  ("Which word fills the gap: ___ means…") instead of giving it away.
- **Learning time**, `learningTime` per unit, by `estimate-learning-time.py
  --grade 3`: reading at 90 words a minute and taught words only (the story
  glossary is looked up, not walked). About 83 self-paced minutes a unit,
  provisional; shown on the hub cards as "about N min".
- **Spelling and tutor prompts** on all 323 core links, by
  `tools/fill-english-core-word-prompts.py --grade 3`, in the forms the grade's
  own files already use (the bare "c - h - o - i - c - e" of its authored core
  words; the tutor template of its glossary links).
- **Speech marks** curly in 277 strings, by
  `tools/repair-english-g1-straight-quotes.py --grade 3`. Recordings
  untouched; the staleness checker folds quote glyphs.

**Builder rules that apply to every grade:**

- Story questions without authored wrong options (all of Grade 3's) draw them
  from answers NOT shown in the step first, never the neighbouring question's
  answer, rotated by position: zero neighbours sharing an option set. The
  longest answer offered as an option is 110 characters at Grades 3-4 (70 at
  Grades 1-2): Grade 3 answers in full sentences, and at 70 Units 4, 9 and 10
  had three questions each. Six now, in every unit (2026-09-11, with Grade 4).
- A topic group under four words joins its neighbour; one over fourteen is
  split. Grade 3 authors five one-word topic groups.
- The hub's header bar is read from `add-header-bars.py`'s own CSS, not a
  copy (Grade 1 validation, area 14).

**Lectures:** the nine Grade 3 lessons were redrawn from their existing
recordings (`tools/realign-ehel-lecture-video.py`, no narration bought) so
the words slide shows all six words it narrates.

## Closed after the first build (2026-09-11)

- **Cambridge coverage 83 → 102 of 102.** The nineteen objectives were taught
  nowhere, so the teaching was authored first and claimed second
  (`tools/author-english-g3-stage3-gaps.py`): four story questions, seven
  rules, three writing tasks and three speaking tasks, every quoted line
  checked against the unit's texts. All "Needs curriculum review". See
  `docs/english-g3-objective-gaps.md`.
- **Unit banners.** Every Grade 3 unit borrowed another grade's picture. Each
  now has its own, composed from the Grade 3 picture-book kit
  (`tools/create-grade3-unit-banners.js` → `english/assets/g3-unit-NN-*.png`),
  and the nine lectures were redrawn over them from their recorded audio.
- **Every writing and speaking task is on a page** ("taskSteps", two steps:
  Write it yourself, Talk it through). Before, the app reached 10 of 60
  writing and 22 of 60 speaking tasks.

## Still open

- **Recordings** for the new rules and tasks, once a reviewer approves them;
  the app speaks their text until then.
- **No human curriculum review** of any of the above.
