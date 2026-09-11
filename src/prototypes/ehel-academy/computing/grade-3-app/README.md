# Grade 3 Computing — the standalone lesson build

The third Computing course on `../lesson-kit`, in the design of the Grade 1
and Grade 2 builds beside it (both live and routed since 2026-09-10): one
self-contained HTML page per lesson plus a hub, each page carrying its own
CSS, its own activity JS and its own copy of the voice engine, bypassing
`shell/course-app.js`. The prompt it was built from is [PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Computing 0059, Stage 3 — all 36 learning
objectives — and it is NOT the Word-pack course under `computing/grade-3/data`.**
Nothing under `computing/grade-3/` is read or written by this build. The
framework file is `src/curriculum/cambridge-computing-0059.json`, the same one
the earlier grades are authored against.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0059 codes |
| `app.config.json` | grade 3, stage 3, floors, hub strands, the fourteen lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g3-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | the generator, shared with Grades 1 and 2 and extended for this stage — see its README for the step-kind table |

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # every lesson; refuses on a bad code or key
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
pipeline's wiring away and the pipeline has to be re-run.

## "On the same kit": what that cost, and how it was kept safe

Stage 3 asks for things Stage 2 has no renderer for, so the kit grew by
twelve step kinds: `trim`, `loopspot`, `whatif`, `inout`, `tidy`, `parallel`,
`tweak`, `device`, `views`, `sheet`, `filter`, `cipher`; the `program` kind
gained a displaced `start` and `mustReset`; the sprite stage gained a start
state and a ground mark; Bitsy's `DEVICE_BLOCKS` and the cell `FORMATS` were
added and are read out of the JS by the builder like every other table.
`_rules.py` gained seven computed rules (`rule_output`, `walk_end`,
`code_word`/`decode_code`, `filter_rows`, `same_effect`, `repeat_run`,
`sheet_cells`), each mirrored name for name in `computing.js`.

**Every growth was proved against Grades 1 and 2 before Grade 3 was built on
it, and again after the last change:** both rebuilt on the extended kit,
pipeline and both gates green, and the `LESSON` data block of all eighteen
pages byte-identical to the committed ones (the pages differ from HEAD only by
the inlined kit). Then every step of every Grade 1 and Grade 2 lesson was
driven again in the browser — see Verification. Their rebuilt pages are
committed with this build and were redeployed on the owner's instruction
the same day (14 and 16 files, storage read-back and edge hashes clean, live
boots with 0 errors), so all three grades' live pages are this kit.

One pre-existing defect was fixed in passing, because the new renderers
needed the same code: `blockBtn` used to receive the running block's `now`
class as a second `class=""` attribute, which the HTML parser ignores, so the
block being run was never highlighted at Stages 1 and 2 either. It takes the
extra class as a third argument now, and the highlight works in all three
grades.

## What a lesson is

Fourteen lessons, organised by the framework's five strands, 13 to 16 steps
each including the seven of the unit shell:

| lesson | steps | objectives | the machine the child drives |
| --- | --- | --- | --- |
| 1 Follow, Edit, Correct | 15 | 2 | follows hand-washing exactly; says why each step is where it is; corrects the seed algorithm; edits the tower |
| 2 Concise Algorithms | 15 | 3 | cuts the wasteful steps out of tea and dressing and watches the short algorithm still work; taps the run that repeats and sees it fold into "repeat 3 times" |
| 3 Think It Through | 15 | 3 | orders cereal by logic; predicts four changes to a sandwich and three to bedtime before they happen; sorts "getting ready" into sections |
| 4 Input Machines | 13 | 3 | builds doubling, add-3, times-4, letter-counting and halving machines from their steps, feeds them, works out an untried output |
| 5 Tidy Programs | 14 | 4 | deletes unused waits and folds runs into repeats, then runs to prove the same behaviour; puts a go-home block first on a displaced cat; changes the number in a block to hit the flower; debugs |
| 6 Many Things at Once | 15 | 4 | builds a script for the cat AND the dog and runs both at once; adds a static tree with look blocks only; partners; mistakes |
| 7 Press, Shake, Clap | 14 | 4 | programs Bitsy — a when block, then outputs — and presses the input on the board; motor and bell as machines a program controls |
| 8 Mistakes Make Programs Better | 13 | 3 | the run-look-think-fix-run habit; two-bug rounds with a partner's hint; a rule from every mistake |
| 9 Data Problems | 14 | 3 | spots the problems data can solve; records discrete data on a form; opens the same counts as table, bar chart and pictogram |
| 10 Spreadsheets | 13 | 4 | finds cells by letter and number, enters values, formats columns as currency, date and number; builds filters from chips and counts the rows |
| 11 Networks Around Us | 14 | 3 | wires a school network to its switch and uses its services; sorts networked hardware; weighs advantages against disadvantages |
| 12 Secret Codes | 14 | 2 | why ciphers; writes and decodes messages with the 1 = a strip |
| 13 Systems, Inputs and Files | 16 | 4 | follows a key press through hardware and software; sorts roles; manual and automatic inputs; the five file types |
| 14 Machines, Things and Robots | 15 | 3 | which machines a program controls; the Internet of Things; the car line, and why robots do those steps |

The Stage 3 machines, each of which only does what it is told:

- **Trim and loopspot (3CT.02, 3CT.03):** a wasteful step is cut and the
  scene runs the shorter algorithm to prove the task still gets done; a
  repeated run is tapped and folded into one `repeat N times`.
- **What-if (3CT.05):** a change is proposed, the prediction is made, and
  only then is the change applied and painted — including the scenes that
  draw silly outcomes (jam on the outside, reading in the dark).
- **Input machines (3CT.07, 3CT.08):** the steps are ordered, the inputs fed,
  and the last output has to be worked out; `rule_output` keys it.
- **Tidy, reset, tweak (3P.01, 3P.02, 3P.05):** a shorter program must run
  to the same behaviour (`same_effect`); a displaced cat needs `home` first;
  a number chip inside a move block is changed until `walk_end` lands on the
  flower.
- **Parallel (3P.03, 3P.04):** every object's script runs in the same beat;
  a static object has no move block in its palette.
- **Bitsy (3P.06, 3P.10, 3CS.05):** a `when` hat names the input; pressing
  a different input on the board does nothing, by design.
- **Views, sheet, filter (3MD.02–06):** three views of one table with keys
  computed by `table_answer`; cells named letter-then-number and formatted
  for their purpose; a filter whose count is computed by `filter_rows`.
- **Cipher (3DC.04, 3DC.05):** `code_word` and `decode_code` decide every
  tap against the on-screen strip.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0059 does
not publish for Stage 3 and, on a full build, refuses to finish if any of the
36 is reached by no step. `check-coverage.py` asks the BUILT pages the same
question, plus what only shipped bytes can answer: every key single, every
sort bin present, a per-lesson objective floor that may rise and not fall
(`objectiveFloors`, recorded at the measured 2/3/3/3/4/4/4/3/3/4/3/2/4/3) —
and **39 keys re-computed** from the shipped data rather than trusted: every
debug fix, the machine outputs, the tweak targets, the tidy equivalences, the
trims, the repeated runs, the view keys, the spreadsheet finds, the filter
counts and the ciphers.

Mutation-tested fourteen ways on 2026-09-10, each restored byte-identical and
verified against a snapshot taken before the first mutation: a lesson losing
an objective entirely (`3DC.04`, which only Lesson 12 reaches), an
unpublished code, a machine keyed to the wrong output, a tweak whose numbers
miss the target, a cipher answer that disagrees with the code, a filter count
keyed wrong, a tidy program that does something different, a trim whose
expect is not what is left, a repeated run that does not repeat, a view keyed
against its columns, a spreadsheet find with two answers, a device program
with no when block first, a lesson under its floor while the lost code is
still reached elsewhere (`3P.09` off every slide of Lesson 5), and a what-if
with no key. All fourteen caught, and the gate passes again on restore.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys were authored, not computed. Nothing here has had
a human reading.

## Things that will bite

Everything in the Grade 1 and Grade 2 READMEs still applies. New at Stage 3:

- **Seven rules live twice, and the builder only checks one of them by
  reading the JS.** `REPEATS` is compared against the JS table and `FORMATS`
  against the JS constant; the other Stage 3 rules (`rule_output`,
  `walk_end`, the code, the filter, `same_effect`, `repeat_run`) are
  mirrored by hand. A change to one without the other makes the page and the
  gate disagree — the gate would pass a key the page marks wrong. Change
  them together, and re-drive.
- **A `tidy` round's `expect` is a claim about LENGTH as well as behaviour.**
  The page accepts any program that does the same thing in no more blocks
  than `expect`; the builder refuses an `expect` that is not shorter than
  `program` or that keeps a `wait`. The driver reaches it by deleting every
  `wait` and folding every run of 2–4, so author rounds that resolve that
  way or the drive will report "can be fewer".
- **A `tweak` target must be within −3..3 squares** (the stage's width), and
  the given numbers must NOT already hit it, or there is nothing to change.
- **A `parallel` static object's palette has no move blocks**, and the
  builder refuses an expected script for a static object that moves. The
  parallel runner steps every script in the same beat and waits 720 ms for a
  script that has finished, so a round's length is its longest script.
- **`device` programs are compared exactly, in order, hat first.** The
  builder refuses a hat anywhere but first. Pressing the wrong input on the
  board is a designed no-op with a message, not an error.
- **A `sheet` find task is checked against the state AFTER the tasks before
  it** (`sheet_cells`), so an `enter` task can create the value a later
  `find` looks for, and a find with two matching cells is refused.
- **`filter` ops `gt`/`lt` need a `numeric` field**, and every row must carry
  every field with a value from the field's list — the chips are built from
  those lists.
- **Scenes still paint from step ids in order**, so a `trim` or `whatif` on
  `tea`, `bed`, `dress` or `sandwich` gets the silly outcomes for free, and a
  step id no scene knows paints nothing, silently. Give a wasteful step an
  id the scene does not draw (`sing`, `wave`) and it disappears from the
  picture when it is cut, which is the point.

## Progress: `l01`..`l14`, and why not `u01`

Written under `l01`..`l14` beneath the shell's course key `ehel-comp-g03`.
THE UNIT PROBLEM (see `wire-progress.py`) applies exactly as in the earlier
grades: fourteen lessons by strand against a framework the shell's Word-pack
course does not declare.

## Verification on 2026-09-10

- `build-lessons.py`: 14 pages, 0 refusals, 36/36 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 39 keys re-computed.
- Every one of the 86 inline classic scripts parses under `node --check`
  (and the 112 of Grades 1 and 2, rebuilt on this kit).
- In the browser (Playwright Chromium against `tools/serve-src-preview.js`,
  eight parallel contexts), every step of every lesson was driven to
  completion by a script that plays each kind the way a child would: all
  fourteen Grade 3 lessons ended at 100% on the header with every dot
  ticked and "Every sticker!" on the shelf, 131 to 186 seconds each, first
  time, with no step needing a second attempt. All eight Grade 1 lessons and
  all ten Grade 2 lessons, rebuilt on this kit, were driven again the same
  way and likewise ended at 100% (115 to 229 and 111 to 249 seconds). The
  only console errors were the five platform-module 404s. At 375px no step of any lesson
  overflowed horizontally.
- Reading level, measured on all learner-facing text including the spoken
  explainers: 8.8 to 12.2 words per sentence; Flesch-Kincaid grade 3.4 to
  4.9 for eleven lessons and 5.6 to 6.1 for Networks, Systems and Machines,
  where *automatic*, *manufacturing*, *thermostat* and *operating system*
  are the topic's own words. Every line is read aloud, so the level is a
  ceiling, not a gate. No US spellings; no quiz stem repeated anywhere.

## Deployed and routed 2026-09-10

Uploaded on the owner's instruction to
`https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-3-v2/` —
all 20 files (fourteen lessons, the hub, the five platform modules) PUT 201,
verified on storage by read-back, and fresh off the edge against the plan's
hashes; the tree matched HEAD (`f22b12bd7`) for the build and the kit before
the upload. Then the live hub and three lessons were booted in real Chromium
from the CDN with the five platform modules resolving: 0 console errors, 0
failed requests, and three of the new renderers driven to a tick on the
shipped bytes — all three tidy rounds of Lesson 5, both parallel rounds with
the static tree in Lesson 6, and all four cipher messages in Lesson 12.

**Routed the same day.** The Grade 3 row (`3 => ['ehel-comp-g03',
…/grade-3-v2/index.html]`) was added to `lesson-app-tools/repoint-grade.php`'s
computing targets (`9e2f5994b`), the script staged on the quraanacademy zone
under a fresh name and verified by storage read-back and edge hash, and the
operator ran it from the docroot with `--subject computing --grade 3 --apply`:
it read back clean with all 9 overrides intact, so `ehel-comp-g03` now
launches here (`local_prequran/ehel_app_url_overrides`). That is the script's
own read-back, not a learner launch observed from this machine. The zone copy
was deleted afterwards. Rollback is the pre-run map the report run printed,
pasted into Site admin > Local plugins > Ehel app URL overrides, or removing
the `ehel-comp-g03` key to return the course to `app/computing/index.html`.

**The same read-back showed the map WITHOUT `ehel-comp-g01` and
`ehel-comp-g02`**, both of which had been applied and read back clean
earlier the same day (7 and 8 overrides intact at the time). Another hand
edits this setting — the map had also lost `ehel-gp-g01` and never showed
`ehel-math-g03`/`g04` — so a routing proved by its read-back is proved for
that moment only. Read the map before assuming what it holds; the report
run of `repoint-grade.php` prints it without writing anything. The two
computing keys were restored within the hour by a second operator run of
the same script (`--subject computing --grade 1,2 --apply`, 11 overrides
intact on read-back), so all three Computing grades route to their
standalone builds — as of that read-back.

## What was deliberately not done

Recorded narration; reusing the Word-pack course's text; anything at Stage 4;
a Scratch embed (the framework recommends the real tool, and a self-contained
page cannot carry it — the block program here, with its parallel scripts,
resets and numbered blocks, is the shape of that work, not a replacement for
it); a real spreadsheet application (the grid here has the parts the
objectives name — lettered columns, numbered rows, entry, formats — and no
formulas); a human reading of the content.

## Redeployed 2026-09-10 on the Stage 4 kit

Rebuilt on the kit the Grade 4 build extended, re-driven in the browser to
100% on every lesson, and redeployed on the owner's instruction alongside the
Grade 4 deploy: 20 files PUT 201, all verified on storage by read-back, every
edge path fresh, and the live bundle booted from the CDN in real Chromium with
0 console errors, 0 failed requests and a real step driven to a tick. Live
bytes are byte-identical to HEAD and carry the Stage 4 kit markers.

## Redeployed 2026-09-11 with the validation fixes

On the owner's instruction, with Grade 1: the kit's progress fix from the Grade 1
validation (`04a1ff89f`), and the 44 px controls, the taller network map and the
reworded Sort race (`ac37c2a2f`). 20 files uploaded, all verified on storage,
every page byte-identical to HEAD, every edge path fresh. Lesson 1 was then
played to the end on the live pages in Chromium: 0 console errors, every step
stored and the lesson recorded complete, nothing ticked on a fresh open, and a
reload after moving to step 4 opens step 4.

## Validated 2026-09-11

Against the owner's 27-area framework (OneDrive: `computing-grades validation.docx`);
the full report is [VALIDATION.md](VALIDATION.md), and the Word copy sits beside the
other validation reports as `computing-grade-3-v2 validation report.docx`. Average
4.1 / 5.

Before anything changed, all fourteen lessons were played to the end on the live
pages with the stored record: every step stored, every lesson recorded complete,
nothing ticked on a fresh open, and a reload after moving to step 4 opens step 4.

Reading every learner-facing line found eleven kinds of error. The ones a child
would carry away: toast before butter "because butter melts on hot toast" (a reason
that does not explain the order, in a quiz key too), a cereal step, "Boil the
milk", marked as one nobody needs, a doorbell counted among machines with a
computer inside when lesson 14 teaches that an old doorbell has none, a laptop's
network cable called "a cable to the wall socket", which reads as the charger, an
objective code ("3MD.03") in a child's feedback, and "Count the feet" as the way to
order size-1 shoes. Four home projects changed for safety: a child changing the
inputs of a kettle and a toaster with no grown-up named, a grown-up following the
child's toast algorithm "silly mistakes and all", and a recipe to change and a hunt
along the street, neither naming a grown-up.

Measuring the built pages found what the earlier reviews had not measured: the
Stage 3 machines. 64 controls were under 44 px on a phone (the cipher keys, the
spreadsheet's column letters and choice chips, the number chips inside blocks) and
two label styles were 11 and 12 px; eight pictures needed 2020 or 2021 devices, in
20 places, and the kit drew "Shake it" with a 2022 face. The controls, the labels
and the shake face are fixed in the shared kit, so Grade 4's pages change too; the
kit README records the size rule for Stage 3 controls and an Emoji 12.0 (2019)
ceiling for pictures. All in `282c40c60`, committed and **not deployed**: the live
Grade 3 pages carry the errors above until Grade 3 is redeployed. Nothing added a
step or moved one, so records already made stay true.

Left open, all content work or human checks: categorical data is named by 3MD.02
and 3MD.03 but never recorded or charted (the lessons use one discrete data set,
how many pets); no lesson has a recap or a warm-up (Grades 1 and 2 have both);
seven activities repeat Grades 1 and 2 almost word for word (handwashing, planting a
seed, getting dressed, the jam sandwich twice, a debug goal; tea, bedtime); a
teacher's read of the content and the 144 keys; a listen to the cipher lesson's
letter names ("a is 1"); a screen-reader walk-through; children watched; and the
owner's decisions on score-gated completion and the Computing world placeholder.
