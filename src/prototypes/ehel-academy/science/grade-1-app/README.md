# Grade 1 Science — the standalone lesson build

A Grade 1 Science course in the design of the Grade 1 Mathematics and English
standalone builds (`../../mathematics/grade-1-app/g1v2`, `../../english/grade-1-app`):
self-contained HTML pages, one per lesson, each carrying its own CSS, its own
activity JS and its own copy of the voice engine, bypassing
`shell/course-app.js` entirely. The improved prompt it was built from is
[PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Science 0097, Stage 1 — all 35 learning
objectives — and it is NOT the 0846 course under `science/grade-1/data`.**
That course declares 0846, and its explorations read "follow the investigation
plan in your experiments book". These lessons carry the experiment on the page.
Nothing under `science/grade-1/` is read or written by this build.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0097 codes |
| `content/_kit.py` | `step()`, `explain()`, `q()`, `opt()` — the authoring vocabulary |
| `lib/lesson.css` | the Mathematics design system, verbatim via English's copy |
| `lib/science.css` | this build's own styles; no new hue |
| `lib/voice.js`, `lib/deck.js` | lifted verbatim from `english/grade-1-app/lib` (deck **unwired**, see below) |
| `lib/science.js` | the renderers, the sims, the figures, the scenes, the synthesiser |
| `build-lessons.py` | writes `<slug>.html` per lesson; refuses bad content |
| `build-hub.py` | writes `g1-index.html`, the eight cards |
| `check-coverage.py` | the curriculum gate on the BUILT pages |
| `app.config.json` | what `../../mathematics/lesson-app-tools` reads |
| `<slug>.html`, `g1-index.html` | **GENERATED.** Do not hand-edit |

The framework file is `src/curriculum/cambridge-science-0097.json`, extracted
from the published PDF by
`tools/extract-cambridge-science-framework.py --code 0097` (a mode added for
this build) and accepted by `npm run validate:frameworks`. The 0846 file stays
because `science/grade-*/data` still declares it.

## Build

```bash
python build-lessons.py            # every lesson in app.config.json; refuses on a bad code or key
python build-lessons.py 3          # just lesson 3
python build-hub.py                # after the lessons

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app .
python $T/wire-platform-controls.py --app .
python $T/preload-platform.py       --app .
python $T/wire-progress.py          --app .
python $T/add-header-bars.py        --app .
python $T/check-lessons.py          --app .    # the shared gate
python check-coverage.py                       # the curriculum gate
node   $T/deploy.mjs                --app .    # plan only; --upload is an owner decision
```

`build-lessons.py` writes each page from scratch, so re-running it throws the
pipeline's wiring away and the pipeline has to be re-run. Deliberate — same
rule as English.

## What a lesson is

Eight lessons, organised by the framework's sub-strands (not by the six 0846
units), 8 to 12 steps each plus the sticker shelf:

| lesson | steps | objectives |
| --- | --- | --- |
| 1 Alive or Never Alive | 10 | 10 |
| 2 Parts of a Plant | 11 | 10 |
| 3 My Body and My Senses | 12 | 8 |
| 4 What Is It Made Of? | 10 | 12 |
| 5 Pushes, Pulls and Floating | 9 | 11 |
| 6 Sounds Near and Far | 8 | 12 |
| 7 Electricity and Magnets | 9 | 9 |
| 8 Our Earth, Our Sun | 11 | 12 |

Eleven step kinds, one renderer each in `lib/science.js`:

| kind | what the child does | typical objectives |
| --- | --- | --- |
| `demo` | presses Next through a drawn scene that changes state (a seed over 30 days, digging down, sunrise) | content |
| `explore` / `context` | taps cards to hear each one; `context` ends on a question | content, SIC.01-04 |
| `sort` | one thing at a time into two to six bins, a reason for every verdict | TWSc.01 |
| `experiment` | **predict → try it → what happened → did it match**, on a real state machine | TWSp.02, TWSc.04, TWSa.01 |
| `predictEach` | predicts for every item before dropping it in the tank / bringing the magnet | TWSp.02, TWSa.01 |
| `record` | fills a two-column table from what the sim actually did | TWSc.05 |
| `measure` | lays down hands / cubes along a thing and counts them | TWSc.03 |
| `label` | taps the named part of a drawn plant or child | Bs.01, Bs.03 |
| `tester` | presses / bends / looks at / wets a material; badges appear | Cp.01, Cp.02 |
| `ask` | picks a question about a picture, then how to find out | TWSp.01 |
| `questions` / `quiz` | the Mathematics build's `sequence()`, with pictures | content |

Nine sims (`SIMS`): two pots with and without water, with and without light;
a ball pushed gently and hard along a track marked in steps; a tank things
float or sink in; a magnet that things jump to or ignore; a bell and a child
who steps away from it (the gain really falls); clay, an elastic band and a
stone squashed, bent, twisted and stretched; a globe caught ten times; two
cups of water in sun and shade with thermometers. Two figures with tappable
parts, five scenes, a 22-source synthesiser.

**The experiment step is the point of the build, and its fourth phase is the
part that is easy to get wrong.** "Did it match?" is a Yes/No the child answers
about their own prediction, which the page recorded in phase one. So a wrong
prediction honestly reported is RIGHT, and is told so ("scientists learn most
when they are surprised"), while a wrong prediction reported as a match is
corrected by quoting the prediction back. Verified in the browser both ways.
That is 1TWSa.01 as behaviour rather than as a label.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0097 does
not publish for Stage 1 and, on a full build, refuses to finish if any of the
35 is reached by no step. `check-coverage.py` then asks the BUILT pages
(`data-objectives` on every slide, and the `LESSON` JSON inside them) the same
question, plus what only shipped bytes can answer: every quiz key single, no
repeated option, every experiment key single, every sort bin present, and a
per-lesson objective floor that may rise and not fall.

Mutation-tested five ways on 2026-09-10, each restored byte-identical: the only
`1Cp.01` step losing its code (caught by the floor), a code 0097 does not
publish, a quiz item with no correct option, a sort item into a bin that is not
there — all caught. A fifth mutation, removing `1ESs.01` from one step, SURVIVED
and correctly so: the lesson's quiz still names it, so nothing was lost. The
mutation was wrong, not the gate — the cheaper thing to be wrong about, and
worth recording rather than counting as a catch.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys were authored, not computed, and nothing here has
had a human reading. Mathematics computes 23 of its 75 keys; here there is no
arithmetic to compute, so every key is a claim.

## Things that will bite

- **`lib/deck.js` is stored UNWIRED, and that is load-bearing.** The shared
  progress step patches `finish()` and `show()` by matching their exact text
  and only matches the unwired shape. Do not add the hooks by hand; the gate
  asserts the call sites, and a second copy would report every step twice.
- **Do not name a pipeline tool's filename anywhere that ends up in a page.**
  Each tool's filename is its own idempotence marker; a comment mentioning it
  makes the tool skip a page it has never touched. English shipped a page
  reporting nothing that way.
- **Every renderer draws at load**, because the deck paints all its slides and
  hides them. `window.__ehelPainting` silences the draw pass; a demo's first
  frame is spoken through `ONSHOW` when the child arrives, never on draw. A new
  renderer that speaks on draw needs the same guard.
- **`experiment()` waits for the sim's promise.** A sim that never resolves
  leaves the step at "Try it" for ever. Every sim clears its own controls and
  resolves when its state machine ends; a new sim must too.
- **The sims' buttons live inside `#stageNctl` and re-render.** A press inside a
  hand-over used to schedule a second hand-over in the shape-change sim and skip
  a material (found by driving it programmatically at 260ms per press, which a
  fast child can do). Buttons are dead while a hand-over waits.
- **A sim must never wait on `requestAnimationFrame` to make progress.** The
  float/sink and magnet drops used to start their transition inside a paint
  callback, and a hidden tab never paints, so the drop never resolved and the
  step froze (found because the auto-driver ran them in background tabs; a
  child switching apps mid-drop would have met the same freeze). They start on
  a 40ms timer now, and there is no `requestAnimationFrame(` in `science.js`.
- **A control that is not a `.choice` needs its own match.** The predict-each
  step's "Drop it in" button is a `.big`, and the click handler looked for
  `.choice` alone, so the button did nothing after a prediction. Three bugs in
  this list were found by driving the steps and none by reading them.
- **The five platform modules 404 in local dev** — `learner-controls.js`,
  `wehel.js`, `course-shell.js`, `seb-session.js`, `progress-client.js` — as in
  Mathematics and English. The lesson works without them; class controls, Wehel
  and progress reporting do not. Those five 404s are the only console errors a
  healthy page shows.
- **Sound needs a gesture.** The synthesiser creates its AudioContext on the
  first tap. A synthetic click from a script may leave it suspended; a child's
  tap does not.
- **Nothing routes a learner here.** Deploying (`deploy.mjs --upload`) would
  make the build reachable by URL and by nobody's course; Grade 1 routing is the
  `local_prequran/ehel_app_url_overrides` Moodle setting. Not done, on purpose.

## Resume on reopen (2026-09-10)

A reopened lesson used to draw an empty dot rail and step 1 while the record
said otherwise: `wire-progress.py` read the document back only as a baseline
for the attempted/knownWords maps. It now installs `window.__ehelRestore`
inside the deck's own scope (where `done`, `paintDots` and `show` live) and
calls it once hydrate lands, with the stored `sectionsDone` and `resume`. Ticks
are restored, the header percentage follows, and the page opens at the resume
step - unless the learner has already moved off an untouched step 1, because
hydrate is asynchronous and a child who tapped Next is not to be yanked back.
Measured both ways: reopen lands on "Step 3 of 10" with two ticks; a Next
tapped before the record arrives stays where the child put it. The shared gate
asserts the hook and its call site. Pages wired before the hook existed are
upgraded in place by re-running `wire-progress.py --app .`, so the Mathematics
and English builds get it without a rebuild.

## Progress: `l01`..`l08`, and why not `u01`

Written under `l01`..`l08` beneath the shell's own course key `ehel-sci-g01`.
THE UNIT PROBLEM (see `wire-progress.py`) is sharper here than in Mathematics:
these eight lessons are not merely a different grouping of the shell's six
units, they are built to a different framework. Emitting `u01` would write
"0846 unit 1, Being Alive, completed" into the gradebook on the strength of a
0097 lesson. If the school ever adopts 0097 for the shell course, the mapping is
one function in `wire-progress.py` and a curriculum decision.

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 35/35 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0. `validate:frameworks`:
  all nine framework files pass, the new 0097 one included.
- Every inline classic script parses under `node --check`.
- In the browser (`tools/serve-src-preview.js`, port 4287), every one of the
  eight lessons was driven to completion step by step by a script that plays
  each kind the way a child would (the right bin, the named part, the correct
  key, the sim's own buttons), and the dot rail and the header progress bar
  read 100% at the end of each. Lesson 1 was also walked by hand along the
  wrong-prediction path and the wrong-table-entry path, to the sticker shelf.
- That driving found three defects the gates cannot see and reading did not:
  the shape-change hand-over race, the predict-each Try button that did
  nothing, and the two drops that waited on a paint callback. All three are
  fixed and recorded under "Things that will bite". Nothing here has had a
  human reading, and the content's reading level and the quiz keys are
  claims, not measurements.
