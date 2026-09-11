# Grade 2 Computing — the standalone lesson build

The second Computing course on `../lesson-kit`, in the design of the Grade 1
build beside it (`../grade-1-app`, live and routed since 2026-09-10): one
self-contained HTML page per lesson plus a hub, each page carrying its own
CSS, its own activity JS and its own copy of the voice engine, bypassing
`shell/course-app.js`. The prompt it was built from is [PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Computing 0059, Stage 2 — all 31 learning
objectives — and it is NOT the Word-pack course under `computing/grade-2/data`.**
Nothing under `computing/grade-2/` is read or written by this build. The
framework file is `src/curriculum/cambridge-computing-0059.json`, the same one
Grade 1 is authored against.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0059 codes |
| `app.config.json` | grade 2, stage 2, floors, hub strands, the ten lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g2-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | the generator, shared with Grade 1 and extended for this stage — see its README for the step-kind table |

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

Stage 2 asks for things Stage 1 has no renderer for, so the kit grew: five
step kinds (`precise`, `chart`, `survey`, `label`, `race`), the `repeat2`/`3`/`4`
control blocks, `extras` on `order`, several sprites and a named `object` on
`program`, more than one bug and a `partner` on `debug`, two scenes (`tea`,
`bed`), two drawings (`house`, `boat`) and two figures (`laptop`, `tablet`).
`_rules.py` gained the repeat expansion and the race sums, and the builder
refuses to run if the JS and the Python disagree about what a repeat means.

**Every growth was proved against Grade 1 before Grade 2 was built on it, and
again after the last fix:** `../grade-1-app` rebuilt on the extended kit,
pipeline and both gates green, and the `LESSON` data block of all eight pages
byte-identical to the committed ones (the pages differ from HEAD only by the
inlined kit). Then every step of every Grade 1 lesson was driven again in the
browser — see Verification. Grade 1's rebuilt pages are committed with this
build and were redeployed on the owner's instruction the same day, so its
live pages are this kit too.

## What a lesson is

Ten lessons, organised by the framework's five strands, 13 to 18 steps each
including the seven of the unit shell:

| lesson | steps | objectives | the machine the child drives |
| --- | --- | --- | --- |
| 1 Precise Instructions | 16 | 4 | draws a house and a boat from the one instruction precise enough; makes tea and goes to bed in the right order; leaves out the steps a task does not need |
| 2 Bugs and Predictions | 14 | 4 | predicts what an algorithm will do before it runs; finds the swapped step (water before the cup makes a puddle); sorts precise from vague |
| 3 Programs and Repeats | 14 | 4 | rebuilds algorithms as blocks; `repeat3 jump` against `jump jump jump`; tests as it goes |
| 4 Objects and Plans | 13 | 4 | plans the program for the cat and then the dog on one stage; plan, build, test in order |
| 5 Debugging Together | 13 | 3 | a program with TWO bugs; asks a partner for the hint; runs again after every fix |
| 6 Bee-Bot Journeys | 13 | 3 | drives Robo across a 5×5 grid to a destination; predicts where a program stops |
| 7 Collecting Data | 14 | 4 | designs a survey for a purpose — which ways of collecting would work?; sorts statistical questions from the rest |
| 8 Presenting Data | 14 | 3 | builds two block graphs column by column; reads a table; every key computed |
| 9 Connected Devices | 16 | 5 | wires a home network and sends a photo to the printer; wired against wireless; reads the network's own signs; shares and keeps private |
| 10 Hardware, Software and Robots | 18 | 6 | taps the parts of a laptop and a tablet by name; inputs and outputs; races the computer at sums; the device for the place; story robots against working ones |

The computing-shaped machines only do what they are told, as in Grade 1, and
the Stage 2 ones add:

- **Precise drawing (2CT.06):** each round offers one instruction precise
  enough to draw the next part of the house or the boat; every other option
  draws exactly what it says — a blob, a roof in the corner, a window in the
  grass — so a vague instruction is something the child sees, not is told.
- **Repeats (2P.02, 2P.03, 2P.06):** a repeat block repeats the NEXT block;
  the page and the gate compare EXPANDED programs, so `repeat3 jump` and
  `jump jump jump` are the same program, except in a `mustRepeat` round,
  where the point is to use the block.
- **Objects (2P.04):** two sprites on the stage; a round names the object its
  program is for, and only that one moves.
- **Two bugs and a partner (2P.05, 2P.07):** the program is run first and
  watched going wrong; after the first fix it is run AGAIN and goes wrong
  differently; the partner's Ask button gives a hint that points at the block
  still wrong.
- **Data (2MD.02–06):** the survey's ways are tried and some are seen not to
  work (shouting out, guessing); the block graph is built by tapping a
  column's block once per count; the chart and table questions are keyed by
  arithmetic the builder and the gate both re-compute.
- **Hardware (2CS.01–04):** the laptop's and tablet's parts are tapped by name
  and each says what it does; the race is a stopwatch against the computer's
  time, and the question after it is what the computer cannot do.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0059 does
not publish for Stage 2 and, on a full build, refuses to finish if any of the
31 is reached by no step. `check-coverage.py` asks the BUILT pages the same
question, plus what only shipped bytes can answer: every quiz key single, no
repeated option, every sort bin present, every fix single, a per-lesson
objective floor that may rise and not fall (`objectiveFloors`, recorded at the
measured 4/4/4/4/3/3/4/3/5/6) — and 22 keys re-computed from the shipped
data rather than trusted: Robo's routes and predict answers, the table keys,
every fix of every debug round (both fixes of the two-bug one), the five race
sums, and the two chart keys against their own columns.

Mutation-tested eleven ways on 2026-09-10, each restored byte-identical and
verified against a snapshot taken before the first mutation: a lesson losing
an objective entirely (`2DC.03`, which only Lesson 9 reaches), an unpublished
code, a race keyed to the wrong sum, a chart keyed against its columns, a
`mustRepeat` round whose expected program has no repeat, the second fix of the
two-bug round wrong, a label part named twice, a precise round with two keys,
a survey question with no key, a lesson under its floor while the lost code is
still reached elsewhere (`2P.06` off every slide of Lesson 3), and a table key
that disagrees with the rows. All eleven caught, and the gate passes again on
restore.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys were authored, not computed. Nothing here has had
a human reading.

## Things that will bite

Everything in the Grade 1 README's list still applies (the unwired `deck.js`,
the pipeline filenames as markers, drawing at load, no
`requestAnimationFrame`, `swap` rounds, the touchscreen keyed as an input, the
five platform-module 404s in local dev, sound needing a gesture). New at
Stage 2:

- **A repeat repeats the NEXT block, `n` times, in both languages.**
  `expand_program` (`_rules.py`) and `expandProgram` (`computing.js`) are one
  rule twice; the builder reads the JS table and refuses if they differ. A
  repeat as the last block, or a repeat before a repeat, expands to nothing
  and is refused as a round's `expect`.
- **A two-bug round comes back to "find" holding the lock**, which the
  browser drive found: the lock taken when a bug is tapped and again when its
  fix is chosen was never released before the re-run, so the second bug could
  not be tapped and the round could not end. `finished()` releases it. Grade
  1's single-bug rounds never reached that path (a fixed round ends and
  `start()` resets everything).
- **A figure's `.outline` is the tap target, and it must stay
  `fill: transparent`, not `none`.** A speaker is six dots and the volume
  control is two bars with a gap; with `fill: none` a tap between them lands
  on the laptop body and does nothing — which is exactly where Playwright
  aims (the centre of the group) and where a finger lands. Small parts are
  drawn AFTER the big part they sit on so their ring wins where the two
  overlap (the tablet's camera moved below the screen for that reason).
- **The `label` figures are named in `FIGURES` by part id, and the content's
  part ids must be a subset of them.** The builder reads the ids out of the
  markup, so a part the drawing lacks fails the build, not the page.
- **The chart's `check` is the table check** (`most`/`least`/`count`/`any`
  over `columns`); a tie is refused. The party chart is keyed Banana and the
  school chart Walk because the columns say so.

## Progress: `l01`..`l10`, and why not `u01`

Written under `l01`..`l10` beneath the shell's course key `ehel-comp-g02`.
THE UNIT PROBLEM (see `wire-progress.py`) applies exactly as in Grade 1: ten
lessons by strand against a framework the shell's Word-pack course does not
declare, so emitting `u01` would put a unit completion in the gradebook on
the strength of a lesson that is not that unit.

## Verification on 2026-09-10

- `build-lessons.py`: 10 pages, 0 refusals, 31/31 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 22 keys re-computed.
  `validate:frameworks` still passes with the 0059 file.
- Every one of the 112 inline classic scripts across both grades parses under
  `node --check`.
- In the browser (Playwright Chromium against `tools/serve-src-preview.js`,
  eight parallel contexts), every step of every lesson was driven to
  completion by a script that plays each kind the way a child would, both
  grades, on the final kit: all ten Grade 2 lessons ended at 100% on the
  header with every dot ticked and "Every sticker!" on the shelf, 111 to 248
  seconds each; all eight Grade 1 lessons likewise, 115 to 229 seconds. The
  only console errors were the five platform-module 404s. At 375px no step of either grade overflowed
  horizontally.
- **The first drive found two defects reading did not**, both in Stage 2's
  own renderers and both fixed before the final run: the two-bug debug round
  could not have its second bug tapped (the lock, above), and the laptop's
  speaker and the tablet's volume buttons could not be hit at their centre
  (the outline as tap target, above; proved by a raw mouse click at the
  part's centre before and after). A third note — "did not tick" on Lesson
  2's bedtime bug hunt — was the driver looking back one animation too
  early: the lesson ended at 14/14 with every sticker.
- Reading level, measured on all learner-facing text including the spoken
  explainers: 9.2 to 12.2 words per sentence; Flesch-Kincaid grade 2.9 to
  4.9 for nine lessons and 5.6 for Connected Devices, where *network*,
  *wireless*, *available* and *information* are the topic's own words (the
  same shape as Grade 1's Networks lesson). Every line is read aloud, so the
  level is a ceiling, not a gate. No US spellings; no quiz stem repeated
  across lessons, and the one stem repeated three times inside Lesson 1's
  quiz was reworded.

## Deployed and routed 2026-09-10

Uploaded on the owner's instruction to
`https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-2-v2/` —
all 16 files (ten lessons, the hub, the five platform modules) PUT 201,
verified on storage by read-back, and fresh off the edge against the plan's
hashes. Then the live hub and two lessons were booted in real Chromium from
the CDN with the five platform modules resolving: 0 console errors, 0 failed
requests, and the two Stage 2 defects the local drive found were proved fixed
on the shipped bytes — all four rounds of Lesson 5's debug step (both two-bug
rounds included) driven to a tick, and all six parts of the laptop tapped,
the speaker first.

**Routed the same day.** The Grade 2 row (`2 => ['ehel-comp-g02',
…/grade-2-v2/index.html]`) was added to `lesson-app-tools/repoint-grade.php`'s
computing targets (`30cfbf9f1`), the script staged on the quraanacademy zone
under a fresh name and verified by storage read-back and edge hash, and the
operator ran it from the docroot with `--subject computing --grade 2 --apply`:
it read back clean with all 8 overrides intact, so `ehel-comp-g02` now
launches here (`local_prequran/ehel_app_url_overrides`). That is the script's
own read-back, not a learner launch observed from this machine. The zone copy
was deleted afterwards. Rollback is the pre-run map the report run printed,
pasted into Site admin > Local plugins > Ehel app URL overrides, or removing
the `ehel-comp-g02` key to return the course to `app/computing/index.html`.

Grade 1's rebuilt pages were redeployed the same day on the owner's
instruction (14 files, storage read-back and edge hashes clean), so both
grades' live pages are the committed tree on the same kit.

**Redeployed again after the kit was extended for Grade 3** (owner's
instruction, the same day): rebuilt with `LESSON` data byte-identical,
re-driven to 100%, uploaded — 16 files PUT, storage read-back and edge
hashes clean — and booted live from the CDN with 0 errors: all four debug
rounds of Lesson 5 and all six laptop parts of Lesson 10 driven to a tick on
the shipped bytes. The one visible change is that the block being run is
now highlighted (`blockBtn` took its `now` class as a second `class`
attribute before, which the parser ignores).

## What was deliberately not done

Recorded narration; reusing the Word-pack course's text; anything at Stage 3;
a Scratch Jr embed (the framework recommends the real tool for on-screen
programming, and a self-contained page cannot carry it — the block program
here, with its repeats and objects, is the shape of that work, not a
replacement for it); a human reading of the content.

## Redeployed 2026-09-10 on the Stage 4 kit

Rebuilt on the kit the Grade 4 build extended, re-driven in the browser to
100% on every lesson, and redeployed on the owner's instruction alongside the
Grade 4 deploy: 16 files PUT 201, all verified on storage by read-back, every
edge path fresh, and the live bundle booted from the CDN in real Chromium with
0 console errors, 0 failed requests and a real step driven to a tick. Live
bytes are byte-identical to HEAD and carry the Stage 4 kit markers.

## Redeployed 2026-09-11 with the validation fixes

On the owner's instruction, with Grade 1: the kit's progress fix from the Grade 1
validation (`04a1ff89f`), and the 44 px controls, the taller network map and the
reworded Sort race (`ac37c2a2f`). 16 files uploaded, all verified on storage,
every page byte-identical to HEAD, every edge path fresh. Lesson 1 was then
played to the end on the live pages in Chromium: 0 console errors, every step
stored and the lesson recorded complete, nothing ticked on a fresh open, and a
reload after moving to step 4 opens step 4.

## Validated 2026-09-11

Against the owner's 27-area framework (OneDrive: `computing-grades validation.docx`);
the full report is [VALIDATION.md](VALIDATION.md), and the Word copy sits beside the
other validation reports as `computing-grade-2-v2 validation report.docx`. Average
4.1 / 5.

Reading every learner-facing line found eight kinds of error, the widest spread
being that data on a computer "does not get lost" or "cannot be spilt on", and
that telling jokes marks a robot as fictional when the course's own smart speakers
tell jokes. A home project had a grown-up pour hot water with no cup. Measuring
the built pages found six sort labels the voice read with the word "slash", three
emoji that need 2020 or 2021 devices, and five parts of the laptop and tablet
drawings that were 17 to 23 px tap targets on a phone. All fixed in `7cc8338cf`,
not deployed. The progress fix from the Grade 1 validation was checked on all ten
live lessons: every step stored, the lesson recorded complete, and a reopened
lesson opening where it was left.

Left as required changes: a second activity for the four objectives that rest on
one (2CS.03, 2CS.04, 2CS.05, 2MD.03, which also needs a second way of collecting
data with a device), a recap and a warm-up per lesson, new tasks where Grade 1's
toast and sandwich return almost word for word, and the human checks.
