# Grade 5 English — the standalone lesson build

The same build as `../grade-1-app/` to `../grade-4-app/`, pointed at
`english/grade-5/data` by the `app.config.json` beside this file. There is no
builder here: `../grade-1-app/build-lessons.py` and `build-hub.py` take
`--app <dir>`. This directory holds the config and what it generates.

**It is an exception to a standing rule, decided by the owner on 2026-09-11.**
`CLAUDE.md` keeps Grades 5-8 on their page design — a learner of that age scans
a page rather than being walked through it one step at a time — and this app
is exactly the step-by-step walk-through. The owner chose it for Grade 5 anyway,
for this standalone app only. The Grade 5 shell course is unchanged, and
nothing here writes to `english/grade-5/data`.

## Build

```bash
cd ../grade-1-app
python build-lessons.py --app ../grade-5-app
python build-hub.py     --app ../grade-5-app

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app ../grade-5-app
python $T/wire-platform-controls.py --app ../grade-5-app
python $T/preload-platform.py       --app ../grade-5-app
python $T/wire-progress.py          --app ../grade-5-app
python $T/add-header-bars.py        --app ../grade-5-app
python $T/check-lessons.py          --app ../grade-5-app
node   $T/deploy.mjs                --app ../grade-5-app    # plan; --upload writes
```

## How Grade 5 differs, and why

Measured on the built pages before anything was switched off. Every switch is
off by default in the builder, and Grade 4 rebuilt byte-identical after each
change.

- **No picture books.** The shelf stops at Grade 4 (owner, 2026-08-20), so
  "Reading books" and its questions do not appear. "The unit story" carries
  the unit's own readings, the serialised stories included (five per unit,
  four in Unit 6).
- **Joining words are taught in "Meet the words"** (`strandRoles.joining:
  "topic"`). Grade 5's joining groups are two or three academic connectives —
  *accordingly, ultimately*; *albeit, regardless* — too few for the
  everyday-words step's minimum of three, and not sight words, which is what
  that step's wording says they are. In "Meet the words" each gets its meaning
  and three example sentences.
- **"Let us talk" and the grammar half of Fluency Practice are authored**,
  in `grammar-practice.json` (`grammarPractice`): one talk round and one
  question for each of the unit's six grammar items, 60 of each. The parse the
  other grades use cannot read Grade 5's rules, which set wrong beside right
  ("X" becomes "Y", *Wrong: ... Correct: ...*, a draft to repair) - it offered
  "I am afraid from the dark." and "Everyone are excited about the fair." as the
  sentence to say, in six of the nine units that had rounds. Each authored
  round's wrong options are that unit's own taught mistakes, or real English
  that does not answer the situation; never a second right answer. The builder
  validates the file and refuses a malformed item. Stamped "Needs curriculum
  review", and the steps say so on the page.
- **The rest of Fluency Practice is the unit's word-meaning review**
  (`fluencyAtBuild: "words"`): nine questions per unit from the fluency
  author's word review, after the six grammar questions. Both halves are built
  into the page and never written to the unit JSON - the shell course draws a
  gated Fluency section for any unit that has one.
- **"Write a sentence" is off** (`sentenceTiles: false`). It rebuilds the first
  writing task's model as word tiles, and Grade 5's models are whole stories,
  scripts and planning notes, so the tiles were a paragraph with its labels
  in. "Write it yourself" carries every writing task in full.
- **"Say it out loud" reads double-quoted complete sentences only** (a builder
  rule from Grade 5 up). The Grades 1-4 pattern treats a single quote as a
  quotation mark; at Grade 5 it is an apostrophe, and the lines were cut
  mid-word. Units 3, 7, 9 and 10 quote no model lines, so their lines come
  from `sayit-lines.json` (`sayitLines`): Units 3, 7 and 9 take the model lines
  their own tasks already print (unquoted, or in single quotes), and Unit 10's
  six are written there, one per capstone task. Each names its speaking task,
  and the builder refuses a line that is not a complete sentence. No clip: the
  task recordings narrate whole tasks, so the page speaks the line itself.
- **The spoken step explanations are reworded for a ten-year-old**
  (`stepVoice`, `step-voice.json`). The builder's own lines were written for
  Grade 1 - "A word is a picture you can say", "It is there because almost
  every child slips on that exact thing", "colour it, draw it, act it out" - and
  nine steps take Grade 5 wording instead. Same four-part shape, same steps.
- **"See an example" shows the worked answer** (`writeExample`). Grade 5's
  `modelText` often describes a good answer ("Three lines that keep the five,
  seven, five pattern exactly ...") where every task's `completedExample` is
  the answer itself, so the app shows the completed example. The shell course
  already draws both.

## State at the build (2026-09-11)

- Ten lessons and the hub build; `check-lessons.py` passes. 22-24 steps per
  unit; Unit 10 has no lecture, as in every grade.
- Every one of the 1,748 audio files the pages reference exists. The staleness
  check finds 7 Grade 5 vocabulary clips older than their text (story-glossary
  words such as *anxiety*, *unique*); none is played by this app, only by the
  shell course. The 1,018 word-meaning clips marked "Not yet generated" are
  likewise shell-only.
- Cambridge Stage 5 (0058): the units claim 87 of 92 objectives; unclaimed are
  5SLp.04, 5Ww.03, 5Ww.06, 5Ww.07 and 5Ww.08.
- Not deployed and not routed. `repoint-grade.php` has no English Grade 5
  target yet.
