# Grade 1 Computing — the standalone lesson build

A Grade 1 Computing course in the design of the Grade 1 Mathematics, English
and Science standalone builds (`../../mathematics/grade-1-app/g1v2`,
`../../english/grade-1-app`, `../../science/grade-1-app`): self-contained HTML
pages, one per lesson, each carrying its own CSS, its own activity JS and its
own copy of the voice engine, bypassing `shell/course-app.js` entirely. The
improved prompt it was built from is [PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Computing 0059, Stage 1 — all 28 learning
objectives — and it is NOT the Word-pack course under `computing/grade-1/data`.**
That course is built from the school's teacher guides by `build:computing` and
declares a different framework code in its manifest. These lessons are authored
against the 0059 framework file directly. Nothing under `computing/grade-1/` is
read or written by this build.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0059 codes |
| `app.config.json` | grade, stage, floors, hub strands, lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g1-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | **the generator, this subject's own** (see its README for why it is a copy of the Science kit's shape and not the Science kit): `build-lessons.py`, `build-hub.py`, `check-coverage.py`, `_rules.py`, `_kit.py`, `_shell.py`, and `lib/` |

The framework file is `src/curriculum/cambridge-computing-0059.json`, extracted
from the published PDF by `tools/extract-cambridge-computing-framework.py` (new
for this build) and accepted by `npm run validate:frameworks`, which learned the
file, the code shape (`1CT.05`, `1P.01` — no sub-strands) and a strand check
that is real for it (see the comment at `strandKey` in the validator).

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # every lesson in app.config.json; refuses on a bad code or key
python $K/build-lessons.py --app . 3    # just lesson 3
python $K/build-hub.py --app .          # after the lessons

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app .
python $T/wire-platform-controls.py --app .
python $T/preload-platform.py       --app .
python $T/wire-progress.py          --app .
python $T/add-header-bars.py        --app .
python $T/check-lessons.py          --app .    # the shared gate
python $K/check-coverage.py         --app .    # the curriculum gate
node   $T/deploy.mjs                --app .    # plan only; --upload is an owner decision
```

`build-lessons.py` writes each page from scratch, so re-running it throws the
pipeline's wiring away and the pipeline has to be re-run. Deliberate — same
rule as English and Science.

## What a lesson is

Eight lessons, organised by the framework's five strands, 14 to 17 steps each
plus the sticker shelf (7 to 9 of the lesson's own, plus the seven of the unit
shell):

| lesson | steps | objectives | the machine the child drives |
| --- | --- | --- | --- |
| 1 What Is an Algorithm? | 16 | 5 | follows two algorithms step by step; orders a seed and a tower |
| 2 Order Matters | 15 | 5 | shoes before socks; finds and fixes bugs; changes the sandwich |
| 3 Forward, Back, Left, Right | 14 | 4 | drives Robo across a grid; predicts where a program stops |
| 4 Algorithm to Program | 14 | 6 | rebuilds algorithms as blocks and runs them; predicts a given program |
| 5 Bugs and Debugging | 15 | 6 | runs buggy programs, finds the block, fixes it, runs again |
| 6 Data Detectives | 16 | 4 | asks the right app; fills a form; records a week of weather; reads the table; the sorting machine |
| 7 Networks and the Internet | 16 | 4 | wires and un-wires a network; sends things across it; spots what is joined to the internet; switches it off |
| 8 Computers Everywhere | 17 | 6 | six programs on one tablet; picks the program for a job; inputs and outputs; hidden computers; robots |

Eighteen step kinds, one renderer each in `lib/computing.js` — the kit README
has the table. The computing-shaped ones are the machines that only do what
they are told:

- **Robo** keeps Bee-Bot rules: forward and backwards move one square the way
  Robo faces, the turns spin on the spot, a wall or the edge is a bump and the
  program stops. The child builds a program of chips and presses Go. A
  `predict` level gives the program and asks where Robo stops before it runs.
- **The block program** runs exactly the blocks placed and then reads back what
  the program DID against what the algorithm ASKED. A wrong program is not
  marked; it is edited and run again. That is 1P.05 as behaviour.
- **Debugging** runs the buggy program FIRST, so the child watches it go wrong
  before hunting for the block, then chooses the fix and runs again.
- **The everyday-algorithm scenes** paint from the list of step ids in the
  order they were done, so shoes-before-socks really does draw socks on the
  outside, and the top slice before the jam puts the jam on top. 1CT.06 is
  something the child sees rather than is told.
- **The form** records what six people SAID, and the table fills from what was
  submitted; the questions asked of it are keyed by arithmetic that the
  builder and the gate both re-compute (`_rules.py`).

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0059 does
not publish for Stage 1 and, on a full build, refuses to finish if any of the
28 is reached by no step. `check-coverage.py` then asks the BUILT pages
(`data-objectives` on every slide, and the `LESSON` JSON inside them) the same
question, plus what only shipped bytes can answer: every quiz key single, no
repeated option, every sort bin present, every bug and fix single, a
per-lesson objective floor that may rise and not fall — and 16 keys
re-computed from the shipped data rather than trusted: each of Robo's four
authored solutions really reaches the flower, each of the three predict
programs really stops on the authored square, the five table keys agree with
the rows, and each of the four debug fixes really makes the expected program.

Mutation-tested nine ways on 2026-09-10, each restored byte-identical and
verified against a snapshot taken before the first mutation: a lesson losing
an objective entirely, an unpublished code, a quiz with no key, a sort into a
missing bin, a Robo solution one instruction short, a predict answer that
disagrees with its program, a table key that disagrees with the rows, a debug
fix that does not make the expected program, and a lesson under its floor
while the lost code is still reached by another lesson (`1P.03` off every
slide of Lesson 3; Lessons 4 and 5 keep it), so that only the floor can catch
it. All nine caught, and the gate passes again on restore.

**One mutation survived as first written, and the mutation was what was
wrong.** The floor test began as "strip the codes off one content slide of
Lesson 3", and the gate stayed green — correctly: the unit shell's steps carry
the whole lesson's codes, so removing a code from ONE content step never moves
the per-lesson set (Science recorded the same shape). A real loss takes the
code off every slide of the lesson, which is what the first and ninth
mutations now do. A mutation that survives is a claim about the gate and about
the mutation, and the mutation is the cheaper thing to be wrong about.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys were authored, not computed; only Robo's routes,
the table answers and the fixes are computed. Nothing here has had a human
reading.

## Things that will bite

- **`lib/deck.js` is stored UNWIRED, and that is load-bearing.** The shared
  progress step patches `finish()` and `show()` by matching their exact text
  and only matches the unwired shape. Do not add the hooks by hand.
- **Do not name a pipeline tool's filename anywhere that ends up in a page.**
  Each tool's filename is its own idempotence marker.
- **Every renderer draws at load**, because the deck paints all its slides and
  hides them. `window.__ehelPainting` silences the draw pass; a step that
  speaks on arrival does it through `ONSHOW`. `dataForm` is the one new
  renderer that needed it (the first person's line is spoken on arrival, after
  the slide's own instruction).
- **Nothing waits on `requestAnimationFrame`**, for the reason the Science
  README records: a hidden tab never paints. Robo's steps, the sprite's moves
  and the network's hops are all timers, and the buttons are dead while a run
  is in flight.
- **A `swap` bug round moves the too-early step down ONE place.** A step two
  places early cannot be fixed that way; author it as a wrong step with a
  replacement. The builder refuses a swap round with no step after it.
- **The touchscreen is the one device that is both an input and an output**,
  and the content says so in the sort and the quiz. The `io` step keys it as
  an input because tapping is what the step demonstrates; do not "fix" the
  quiz to match.
- **The five platform modules 404 in local dev** — `learner-controls.js`,
  `wehel.js`, `course-shell.js`, `seb-session.js`, `progress-client.js` — as in
  Mathematics, English and Science. The lesson works without them; class
  controls, Wehel and progress reporting do not. Those five 404s are the only
  console errors a healthy page shows.
- **Sound needs a gesture.** The synthesiser creates its AudioContext on the
  first tap. A synthetic click from a script may leave it suspended; a child's
  tap does not.
- **It is deployed, and nothing routes a learner to it.** Uploaded on
  2026-09-10 (owner's instruction) to
  `https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-1-v2/`
  — all 14 files verified on storage by read-back, all 14 hashed again off
  the edge against the plan, and the live hub and two lessons booted in real
  Chromium with the five platform modules resolving (0 console errors, 0
  failed requests; the toast demo ticked and Robo's level 1 was solved on the
  live page). **Routed the same day**: the operator ran the staged
  `lesson-app-tools/repoint-grade.php --subject computing --grade 1 --apply`
  from the docroot, and it read back clean with all 7 overrides intact, so
  `ehel-comp-g01` now launches here (`local_prequran/ehel_app_url_overrides`).
  That is the script's own read-back, not a learner launch observed from this
  machine. Rollback is the pre-run map the script printed, pasted into Site
  admin > Local plugins > Ehel app URL overrides, or removing the
  `ehel-comp-g01` key to return to `app/computing/index.html`.
  **Redeployed later the same day, on the owner's instruction, after the kit
  was extended for Grade 2**: the eight pages were rebuilt on the extended
  kit with their `LESSON` data byte-identical (only the inlined kit changed),
  re-driven to 100% in the browser, then uploaded again — 14 files PUT,
  storage read-back and edge hashes clean, and the live hub and two lessons
  booted in real Chromium with 0 console errors and 0 failed requests (the
  toast demo ticked, Robo's level 1 was solved). Live is the committed tree.
  **And again after the kit was extended for Grade 3** (owner's instruction,
  the same day): rebuilt with `LESSON` data byte-identical, re-driven to
  100%, uploaded — 14 files PUT, storage read-back and edge hashes clean
  (the first run's read-back timed out on the storage endpoint after one
  file, so the upload was run again and verified in full) — and booted live
  with 0 errors, the toast demo ticked and Robo's level 1 solved. The one
  visible change is that the block being run is now highlighted.

## Progress: `l01`..`l08`, and why not `u01`

Written under `l01`..`l08` beneath the shell's own course key `ehel-comp-g01`.
THE UNIT PROBLEM (see `wire-progress.py`) applies exactly as in Science: these
eight lessons are organised by strand against a different framework from the
eleven-unit Word-pack course the shell serves, so emitting `u01` would write
"Computers Are Everywhere completed" into the gradebook on the strength of a
lesson about algorithms. If the school ever adopts 0059 for the shell course,
the mapping is one function in `wire-progress.py` and a curriculum decision.

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 28/28 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 16 keys re-computed.
  `validate:frameworks`: all ten framework files pass, the new 0059 one
  included, and its strand check was proved live by mislabelling one
  objective (caught, restored).
- Every one of the 50 inline classic scripts parses under `node --check`.
- In the browser (Playwright Chromium against `tools/serve-src-preview.js`,
  eight parallel contexts), every step of every lesson was driven to
  completion by a script that plays each kind the way a child would (the
  right bin, the step the algorithm names, Robo's own arrows and Go, the
  block palette and Run, the bug block and its fix, the form and Submit): all
  eight lessons ended at 100% on the header with every dot ticked and "Every
  sticker!" on the shelf, 113 to 223 seconds each. The only console errors
  were the five platform-module 404s. At 375px no step of any lesson
  overflowed horizontally. Keyboard: the 20 predict-level squares and the
  six network devices are tabbable buttons with names; every icon button and
  every `role="img"` SVG on a page carries a label.
- **That driving found two defects reading did not**, both fixed before the
  final run: a grid square with the flower, a wall or Robo drawn on it could
  not be tapped, because the emoji `<text>` sat over the `<rect>` and took the
  tap — and level 1 of "Where will Robo stop?" asks for exactly the flower's
  square (`pointer-events: none` on the overlays; then proved with a real
  click, not a synthetic one); and "Ask a computer the right way" painted its
  result 600ms after the tap from an index that had already moved on, which
  showed the next card for a moment and threw a `TypeError` after the last
  question.
- Reading level, measured on all learner-facing text including the spoken
  explainers: 7.5 to 9.2 words per sentence; Flesch-Kincaid grade 2.0 to 3.9
  for six lessons and 5.4 to 5.5 for Networks and Computers Everywhere, where
  *internet*, *communication* and *information* are long words the topic
  cannot avoid (the same shape as Science's electricity lesson). Every line is
  read aloud by the voice engine, so the level is a ceiling, not a gate. No
  US spellings; no quiz stem repeated across lessons.

## What was deliberately not done

Recorded narration; reusing the Word-pack
course's text; anything at Stage 2; a Scratch Jr embed (the framework
recommends the real tool for on-screen programming from Stage 1, and a
self-contained page cannot carry it — the block program here is the shape of
that work, not a replacement for it); a human reading of the content.

## Redeployed 2026-09-10 on the Stage 4 kit

Rebuilt on the kit the Grade 4 build extended, re-driven in the browser to
100% on every lesson, and redeployed on the owner's instruction alongside the
Grade 4 deploy: 14 files PUT 201, all verified on storage by read-back, every
edge path fresh, and the live bundle booted from the CDN in real Chromium with
0 console errors, 0 failed requests and a real step driven to a tick. Live
bytes are byte-identical to HEAD and carry the Stage 4 kit markers.

## Validated 2026-09-11

Against the owner's 27-area framework (OneDrive: `computing-grades validation.docx`);
the full report is [VALIDATION.md](VALIDATION.md), and the Word copy sits beside the
other validation reports as `computing-grade-1-v2 validation report.docx`. Average
4.3 / 5 after the remaining fixes (4.1 in the first version).

**The "100% in the browser" above was true of the page and false of the school's
record.** The lesson overview and the Computing world placeholder ticked themselves
while the deck painted, before the progress module existed, so a lesson finished to
100% was stored as 14 of 16 steps and never recorded complete, a reopened lesson
always opened at step 1, and a fresh lesson opened at 13% - measured on the live
bundle. Every earlier drive missed it because the local server does not serve the
progress module. Fixed in the kit (`ONLEAVE` beside `ONSHOW`, see the kit README),
verified on a local copy of the deployed layout, and committed with eight content
corrections, three contrast fixes and three emoji replacements as `04a1ff89f`.
**Deployed 2026-09-11** with the remaining fixes below; see the last section.

**The remaining fixes** (`ac37c2a2f`, the same day): three activities for the objectives
that rested on one teaching step (lesson 6 records a week of weather on a form,
lesson 7 sorts what is joined to the internet, lesson 8 picks the program for a
job); a "Last time" recap on lessons 2 to 8 and an unmarked two-question warm-up
on all eight, both carried by the overview; controls at least 44 px tall and a
13 px minimum text size; a network map tall enough for its labels; and a Sort
race question that read as broken English. The three new activities shift the
step positions after them in lessons 6 to 8, so a record made there before the
redeploy reads one step out. The browser driver is committed as
`../lesson-kit/drive-lessons.mjs`, and its `--record` mode is what checks the
school's record. Deployed 2026-09-11.

## Redeployed 2026-09-11 with the validation fixes

On the owner's instruction, carrying both validation commits (`04a1ff89f`,
`ac37c2a2f`): 14 files uploaded, all verified on storage, every page
byte-identical to HEAD, every edge path fresh. Every lesson was then played to
the end on the live pages in Chromium: 0 console errors, every step stored and
the lesson recorded complete, nothing ticked on a fresh open, and a reload after
moving to step 4 opens step 4. Before, the same live pages stored 14 of 16
steps and reopened at step 1. The check reads the browser's own store; a real
launch writes the same events to the school's server and was not observed from
here. Grades 2 to 4 were redeployed with it.
