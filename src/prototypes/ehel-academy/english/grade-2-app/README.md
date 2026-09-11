# Grade 2 English — the standalone lesson build

The same build as `../grade-1-app/`, pointed at `english/grade-2/data` by the
`app.config.json` beside this file. **There is no builder here on purpose**:
`../grade-1-app/build-lessons.py` and `build-hub.py` take `--app <dir>` and
read the grade, the labels, the course key and the strand-to-step mapping
(`strandRoles`) out of the target's config. `../grade-1-app/README.md`
explains the pages; this directory holds only the config and what it
generates.

| | |
| --- | --- |
| `app.config.json` | the grade, `ehel-eng-g02`, `?from=eng2`, `strandRoles`, the ten units in order |
| `<slug>.html`, `g2-index.html` | **GENERATED.** Do not hand-edit |

## Build

```bash
cd ../grade-1-app
python build-lessons.py --app ../grade-2-app
python build-hub.py     --app ../grade-2-app

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app ../grade-2-app
python $T/wire-platform-controls.py --app ../grade-2-app
python $T/preload-platform.py       --app ../grade-2-app
python $T/wire-progress.py          --app ../grade-2-app
python $T/add-header-bars.py        --app ../grade-2-app
python $T/check-lessons.py          --app ../grade-2-app
node   $T/deploy.mjs                --app ../grade-2-app    # plan; --upload writes
```

## What differs from Grade 1, all of it read from the content

- **Strands.** Grade 2's Core words are `spelling` / `topic` / `joining` /
  `topic` (two topic groups per unit). `strandRoles` maps spelling → the
  sounds step, joining → the everyday-words step, and each topic group → its
  own "Meet the words" step, split into equal parts above 14 words ("Words:
  food, drink and nature (1 of 2)"). The floor for a sounds or everyday-words
  step is three words (one heard, two wrong), so Unit 10's three spelling
  words draw the step. Two topic groups are tiny by authoring — Unit 2's
  second holds one word (child), Unit 4's first two (air, fire) — and draw
  a one- or two-word step rather than being folded under another title.
- **No Video lesson.** `lecture-media.json` carries `lectureVersion` only;
  the shell course shows "Video pending" for Grade 2 too. Built only where a
  video exists.
- **Let us talk and Fluency Practice read `ruleAndExamples`.** Grade 2's
  grammar `practice` is a worksheet ("Write he or she in each gap. 1. ...
  Check yourself: 1. He 2. She") under a label ("He and She: Choose the
  Pronoun"), so the Grade 1 parse yields nothing. Both steps instead take the
  sentences the rule itself holds up ("He likes football."), pooled by
  `conceptId` because Grade 2 authors each pattern as a pair of items (a
  round per item would offer the pair's other example as a second right
  answer). One parse, `tools/author-ehel-english-g1-fluency.py ::
  rule_sentences / concept_pools`, imported by the builder. The fluency
  arrays it wrote into `english/grade-2/data/units/*.json` on 2026-09-11 are
  stamped "Needs curriculum review", like Grade 1's. Known weakness of the
  distractors, for the reviewer: a sentence from a neighbouring pattern can
  also show the pattern asked for ("There is a bed in the bedroom." beside
  "Prepositions of Place").
- **The unit story step reads five texts** (Reading, Reading, Listening,
  Listening, Story — 13,695 words across the grade) where Grade 1 reads
  three, every one already narrated.

Not yet done for this grade, and not this build's to do: a launch-override
row for `ehel-eng-g02` (see `../grade-1-app/repoint-grade-1.php`), and the
`learningTime` estimate `../grade-1-app/estimate-learning-time.py` writes
into Grade 1's unit JSONs.
