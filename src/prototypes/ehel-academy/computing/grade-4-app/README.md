# Grade 4 Computing — the standalone lesson build

The fourth and last Computing course on `../lesson-kit`, in the design of the
Grade 1, 2 and 3 builds beside it (all three live and routed since
2026-09-10): one self-contained HTML page per lesson plus a hub, each page
carrying its own CSS, its own activity JS and its own copy of the voice
engine, bypassing `shell/course-app.js`. The prompt it was built from is
[PROMPT.md](PROMPT.md). Stage 4 is the last stage the deck design serves
(`BOTH_DESIGNS_MAX_STAGE` is 4 in `shell/subjects/computing.js`), so this
kit stops here.

**The content is Cambridge Primary Computing 0059, Stage 4 — all 39 learning
objectives — and it is NOT the Word-pack course under `computing/grade-4/data`.**
Nothing under `computing/grade-4/` is read or written by this build. The
framework file is `src/curriculum/cambridge-computing-0059.json`, the same one
the earlier grades are authored against.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0059 codes |
| `app.config.json` | grade 4, stage 4, floors, hub strands, the fourteen lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g4-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | the generator, shared with Grades 1 to 3 and extended for this stage — see its README for the step-kind table |

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

Stage 4 asks for things Stage 3 has no renderer for, so the kit grew by
eleven step kinds: `loopalgo`, `compare`, `subroutine`, `branch`,
`loopbuild`, `comment`, `inputprog`, `plan`, `parttest`, `datasort`,
`tableparts`. Three existing kinds grew: `robot` predict levels may carry a
`loop` (drawn as a repeat chip, unrolled by `expand_loop`); `device` gained
the temperature and light hats, a `wait` output, `repeat2`/`3`/`4` and
`forever` loops with a Stop button and a five-cycle cap; `cipher` gained the
`caesar` and `pigpen` modes. `_rules.py` gained eight computed rules
(`expand_loop`, `flatten_algo` with `FOREVER_CYCLES` = 2, `sub_expand`,
`branch_run`, `best_algo`, `sort_rows`, `caesar_shift`, `pigpen_index`), each
mirrored name for name in `computing.js`; the builder reads the device hats
and loops off their `cat` rather than from a list.

**Every growth was proved against Grades 1, 2 and 3 before Grade 4 was
built on it:** all three rebuilt on the extended kit, pipeline and both gates
green, and the `LESSON` data block of all thirty-two pages byte-identical to
the committed ones (the pages differ from HEAD only by the inlined kit). Then
every step of every Grade 1, 2 and 3 lesson was driven again in the browser
on the final kit — see Verification. Their rebuilt pages are committed with
this build; **their live pages are one kit behind the tree until the owner
asks for a redeploy**, exactly as after the Stage 3 extension.

One thing broke in the kit on the first Grade 4 build and was fixed there:
the hub's answer key for a Robo predict level read `lv["program"]`, and a
Stage 4 level has `before`/`loop`/`after` instead. `keys_for` in
`build-hub.py` now prints `repeat N times (...)` and the square the unrolled
program ends on. Grades 1 to 3 have no looped level, so their hubs did not
move.

## What a lesson is

Fourteen lessons, organised by the framework's five strands, 13 to 15 steps
each including the seven of the unit shell:

| lesson | steps | objectives | the machine the child drives |
| --- | --- | --- | --- |
| 1 Loops in Algorithms | 14 | 3 | follows a repeat loop with a counter and a forever loop until Stop; fixes the one wrong step INSIDE a loop and watches every turn come right; why a loop is concise; count-controlled or forever |
| 2 Predict and Compare | 13 | 3 | predicts where a looped program leaves Robo, then presses Go; folds four pancakes into one repeat; picks the best of three routes to school for four different purposes |
| 3 Sub-routines | 14 | 3 | sorts a school morning into WASH, DRESS, BREAKFAST, BAG; orders the main algorithm's calls; follows a call into its sub-routine and back out; why one copy, many calls |
| 4 Inputs Decide Outputs | 13 | 3 | picks an input and follows only the branch it takes, then the other; builds a repeat from a pool and sets its count; inside the loop or outside it |
| 5 Programs with Loops | 15 | 4 | builds programs from algorithms that say "4 times"; folds long programs into repeats and runs them to prove the same output; matches comments to blocks; judges a good comment |
| 6 Inputs, Outputs and Parts | 14 | 3 | builds a script for A and a different one for B and presses both; plans three objects' inputs and outputs; runs a program part by part and fixes the part that fails |
| 7 Bitsy Loops | 14 | 3 | programs Bitsy from its heat and light sensors; a counted loop and a forever loop with Stop on the board; control systems: sense, decide, act |
| 8 Data and Information | 15 | 3 | paper against digital databases; records eight children on a form; forms' advantages and disadvantages; data against information |
| 9 Databases | 14 | 4 | taps records, fields and data; a data type for every field; sorts by height, age and pet ascending and descending; answers four questions with filters |
| 10 Clients, Servers and the Web | 15 | 3 | wires the school server, laptop, tablet, phone and printer and watches a client ask and the server serve; the web against the internet; wi-fi against ethernet |
| 11 When Networks Fail | 14 | 2 | what a failure breaks; switches the router off and tries seven apps; network failure or another fault; where encryption is used and what needs it |
| 12 Caesar and Pigpen | 14 | 2 | shifts the alphabet to write and read five Caesar messages; reads and writes four in Pigpen shapes; why the key is everything and 25 shifts is a weak lock |
| 13 Software, Sensors and Files | 15 | 4 | application against systems software; nine devices that record data or communicate information, sensors and a data logger among them; files from kilobytes to gigabytes, in order |
| 14 Computer Scientists and Service Robots | 14 | 3 | computer scientists in six industries; robots that deliver, drive and help in hospitals; a delivery robot as a control system |

The Stage 4 machines, each of which only does what it is told:

- **Loop algorithms (4CT.01, 4CT.02):** the child taps the next step round a
  drawn loop with a counter; a forever loop goes round twice and then wants
  Stop (`FOREVER_CYCLES`); a fix round's wrong step is inside the loop, named
  as `[block, index]`, and the fixed loop is watched running.
- **Predict and compare (4CT.04, 4CT.05):** a Robo level with a `loop` is
  unrolled by `expand_loop` on both sides; a compare round with a `check` is
  keyed by `best_algo`, and the two other purposes are authored.
- **Sub-routine, branch, loop build (4CT.08–10):** `sub_expand` decides the
  order of taps through a call; `branch_run` decides which steps run for
  which input and refuses two arms that agree; `expand_loop` checks the loop
  the child built against the task.
- **Comments, inputs, plans, parts (4P.01, 4P.05–07):** one comment per
  block; a script per input tab, and two inputs may not run the same script;
  a plan is two questions per object; a part with a bug must be fixed to its
  own `expect`, and every part must pass alone before the whole program
  does.
- **Bitsy (4P.08, 4P.09, 4CS.01):** the hats `whenHot` and `whenDark`; a
  repeat repeats the next output; `forever` repeats everything after it, five
  cycles on screen, ended by the Stop button; a loop block is never last.
- **Databases (4MD.04–07):** `sort_rows` keys who is first or last and
  refuses a tie at the checked end; `filter_rows` counts; `tableparts`
  demands a record, a field and a data task.
- **Ciphers (4DC.06):** `caesar_shift` decides every Caesar round and
  `pigpen_index` every Pigpen one; the shifted alphabet and the grid key are
  on screen.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0059 does
not publish for Stage 4 and, on a full build, refuses to finish if any of the
39 is reached by no step. `check-coverage.py` asks the BUILT pages the same
question, plus what only shipped bytes can answer: every key single, every
sort bin present, a per-lesson objective floor that may rise and not fall
(`objectiveFloors`, recorded at the measured 3/3/3/3/4/3/3/3/4/3/2/2/4/3) —
and **41 keys re-computed** from the shipped data rather than trusted: the
looped Robo levels, the compare checks, the loop-algorithm walks, the built
loops, the part fixes, the sorts, the filter counts and the ciphers.

Mutation-tested twenty ways on 2026-09-10, each restored byte-identical and
verified against a snapshot taken before the first mutation: a lesson losing
an objective entirely (`4DC.06`, which only Lesson 12 reaches), an
unpublished code, a lesson under its floor while the lost code is still
reached elsewhere (`4CS.01` off Lesson 7), a looped Robo level keyed to the
wrong square, a compare purpose keyed against its facts, a loop-algorithm fix
with no key, a loop algorithm too short when followed, a sub-routine that
expands too short, a branch whose arms agree, a loop built from a step the
pool lacks, comments that miss a block, two inputs with one script, a plan
with no key, a part whose fix does not make its expect, a device forever
block last, a sort keyed wrong, a table part the table lacks, a filter count
keyed wrong, a Caesar answer that disagrees with its shift, and a Pigpen
answer that is not its own letters. All twenty caught, each with a different
finding, and the gate passes again on restore.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys were authored, not computed. Nothing here has had
a human reading.

## Things that will bite

Everything in the Grade 1, 2 and 3 READMEs still applies. New at Stage 4:

- **Eight more rules live twice.** `expand_loop`, `flatten_algo`,
  `sub_expand`, `branch_run`, `best_algo`, `sort_rows`, `caesar_shift` and
  `pigpen_index` are mirrored by hand between `_rules.py` and `computing.js`,
  and `FOREVER_CYCLES` with them. A change to one without the other makes
  the page and the gate disagree. Change them together, and re-drive.
- **A `loopalgo` fix names its wrong step as `[block, index]`.** `index` is
  the position inside that block's body, or -1 for a step outside any loop;
  a loop block itself cannot be the wrong step. A fix round needs a `why`
  for the bug and a `why` for the fix, and the round must still be at least
  four steps when followed.
- **A forever loop in a followed algorithm goes round exactly twice.** The
  page then offers Stop as the next step; the driver presses it. Author the
  body so two turns read naturally.
- **`compare` keys only what it can compute.** `fewest_steps` counts the
  steps and `fastest` reads `facts.minutes`; a tie makes `best_algo` answer
  `None` and the builder refuses. A purpose without a `check` (dry, cheap)
  is authored and trusted, and its `why` should say why.
- **`branch` inputs are exactly two, and the first is the yes.** `branch_run`
  sends `inputs[0]` down `yes` and the other down `no`. Both must run at
  least one step, so a round needs `before`, `after` or a non-empty arm for
  each.
- **`loopbuild` pools need a decoy.** The builder refuses a pool no bigger
  than the loop body, so every round carries a once-only step the child must
  leave out.
- **`inputprog` scripts are compared by their expansion.** Two inputs whose
  programs expand to the same thing are refused, so `repeat2 jump` and
  `jump jump` are one script, not two.
- **`parttest` parts keep their length.** A bug is a wrong block, never a
  missing one, so `program` and `expect` are the same length and differ at
  exactly `bug`. A part with no bug carries no `bug` key.
- **`datasort` refuses a tie at the checked end.** Sorting by age ascending
  with two youngest children has no single first, so pick fields and values
  that make the asked end unique. Text fields sort alphabetically; give
  numeric ones `numeric: true` or 10 sorts before 9.
- **`device` loops:** `repeat3` repeats the ONE output after it; `forever`
  repeats everything after it; a loop block last, two forevers, or a repeat
  followed by another loop are refused. The Stop button appears only while a
  forever loop runs, and the run is capped at five cycles if nobody presses
  it.
- **Caesar rounds are lowercase letters only**, and the builder checks the
  authored `answer` against `caesar_shift` in both directions. A Pigpen
  round's `answer` is its own text, because the child types letters and the
  key is the grid.

## Progress: `l01`..`l14`, and why not `u01`

Written under `l01`..`l14` beneath the shell's course key `ehel-comp-g04`.
THE UNIT PROBLEM (see `wire-progress.py`) applies exactly as in the earlier
grades: fourteen lessons by strand against a framework the shell's Word-pack
course does not declare.

## Verification on 2026-09-10

- `build-lessons.py`: 14 pages, 0 refusals, 39/39 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 41 keys re-computed.
- Every one of the 86 inline classic scripts parses under `node --check`.
- In the browser (Playwright Chromium against `tools/serve-src-preview.js`,
  eight parallel contexts), every step of every lesson was driven to
  completion by a script that plays each kind the way a child would: all
  fourteen Grade 4 lessons ended at 100% on the header with every dot
  ticked and "Every sticker!" on the shelf, 116 to 172 seconds each, first
  time, with no step needing a second attempt and no kit change needed
  after the drive. The only console errors were the five platform-module
  404s. At 375px no step of any lesson overflowed horizontally. Lesson 12
  was driven again after its one text edit and ended the same way.
- All eight Grade 1 lessons, all ten Grade 2 lessons and all fourteen
  Grade 3 lessons, rebuilt on this kit, were driven again the same way and
  likewise ended at 100% with every dot ticked (118 to 234, 116 to 254 and
  133 to 188 seconds), no console error beyond the five expected 404s, and
  no step overflowing at 375px. Together with the identical `LESSON`
  blocks that is the proof the Stage 4 extension moved nothing at Stages
  1 to 3.
- Reading level, measured on all learner-facing text including the spoken
  explainers: 9.1 to 10.9 words per sentence; Flesch-Kincaid grade 3.2 to
  5.0 for twelve lessons and 6.3 to 6.7 for Software, Sensors and Files and
  Computer Scientists and Service Robots, where *application*, *operating
  system*, *gigabyte*, *industry* and *encryption* are the topic's own words.
  Every line is read aloud, so the level is a ceiling, not a gate. No US
  spellings; no quiz stem repeated anywhere; the one learner-facing sentence
  over thirty words was split.

## Deployed 2026-09-10

Uploaded on the owner's instruction to
`https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-4-v2/` —
all 20 files (fourteen lessons, the hub, the five platform modules) PUT 201,
storage read-back byte-identical, every edge path fresh. Booted from the CDN
in real Chromium: the hub draws its fourteen cards and four lessons draw
their dot rails, with 0 console errors and 0 failed requests, and four of the
new Stage 4 renderers were driven to a tick on the shipped bytes — a loop
algorithm followed round its repeat and forever loops (30 taps), a branch
taken both ways, a table sorted four ways, and five Caesar messages written
and read. Live bytes are byte-identical to HEAD and carry the Stage 4 kit
markers.

**Grades 1, 2 and 3 were redeployed the same day** on this kit (14, 16 and 20
files, all verified on storage, all edge fresh, all three live bundles booted
clean with a real step driven to a tick in each), so live equals HEAD for all
four grades and all four run the same kit.

## Routing

`repoint-grade.php` gained the Grade 4 row in 4185533e6 —
`ehel-comp-g04` → `…/computing/grade-4-v2/index.html`; the script's computing
table had rows 1 to 3 only. The staged script goes on the quraanacademy zone
under `Ehel Primary/qa/` with a fresh filename, the operator curls it into
`/home/ehelacad/quraantest.academy` and runs report mode before `--apply`,
and both copies are deleted afterwards.

**Read the override map on every run.** It has dropped keys before — Computing
Grades 1 and 2 vanished from it between two applies on 2026-09-10, because
another hand writes that setting from a stale copy. The repoint script only
ever adds, so a missing key means somebody else removed it, and a read-back
proves the map for that moment only.
