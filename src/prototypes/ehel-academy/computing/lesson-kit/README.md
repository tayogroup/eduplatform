# The Computing lesson kit — one generator for every grade

The standalone Computing builds (`../grade-1-app`, `../grade-2-app`, `../grade-3-app`) are self-contained HTML
pages in the design of the Grade 1 Mathematics, English and Science standalone
builds, bypassing `shell/course-app.js`. Everything that draws a page lives
here; each grade directory holds only `app.config.json` and
`content/lesson-N.py`.

**It is the Science kit's shape, as a separate copy, on purpose.**
`../../science/lesson-kit` is live for two grades and being extended for a
third by another session; its safety proof was a byte-identical rebuild of its
own pages. Teaching it a second subject would have put a computing change on
the path to a live science page. The three design files are copied verbatim
(same sha1 as the Science kit's on 2026-09-10); everything else here is this
subject's own. If the Mathematics engine changes, re-copy `voice.js` and
`deck.js` here as in every other build; nothing will notice on its own.

| | |
| --- | --- |
| `build-lessons.py --app <dir>` | writes `<slug>.html` per lesson from the content; refuses a bad objective code, a quiz with no single key, a sort into a missing bin, a Robo solution that misses, a table key the rows disagree with, a debug fix that does not make the expected program (every fix of a multi-bug round), a race keyed to the wrong sum, a chart keyed against its own columns, a `mustRepeat` round whose expected program has no repeat, a precise option no drawing has, a label part no figure has, and a survey where every way works |
| `build-hub.py --app <dir>` | writes the hub: cards with step counts and time estimates, the strands panel, the printable teachers-and-parents section with the unplugged version of every activity and the answer keys |
| `check-coverage.py --app <dir>` | the curriculum gate on the BUILT pages: every objective of the stage reached, per-lesson floors, keys single, and Robo's routes / table answers / fixes / race sums / chart keys RE-COMPUTED from the shipped data |
| `_rules.py` | the things the kit computes rather than trusts — Robo's Bee-Bot rules, the table arithmetic, the repeat expansion (`REPEATS`, `expand_program`; the builder refuses to run if `computing.js` disagrees about what `repeat2`/`3`/`4` mean), the race sums, and at Stage 3 the machine rules (`rule_output`), the numbered walk (`walk_end`), the 1 = a code (`code_word`, `decode_code`), the row filter (`filter_rows`), tidy-program equivalence (`same_effect`), the repeated run (`repeat_run`) and the spreadsheet state (`sheet_cells`), and at Stage 4 the loop unroll (`expand_loop`), the loop-algorithm walk (`flatten_algo`, forever loops go round `FOREVER_CYCLES` = 2 then stop), the sub-routine walk (`sub_expand`), the branch (`branch_run`), the best algorithm for a purpose (`best_algo`), the sort (`sort_rows`), the Caesar shift (`caesar_shift`) and the Pigpen grid (`pigpen_index`) — each mirrored name for name in `computing.js`; imported by the builder AND the gate so they cannot disagree |
| `_kit.py` | `step()`, `explain()`, `q()`, `opt()`, `s()`, `choice()`, and `part()`, `word()`, `home()` — the vocabulary the content is written in |
| `_shell.py` | the unit shell: the seven steps drawn AROUND every lesson (overview, lecture, words, games, home, world, resources), and the games derived from the lesson's own content; used by both builders so the hub and the page agree. A lesson's optional `LESSON["recap"]` (one line from the lesson before) and `LESSON["warmup"]` (1 to 3 `q()` items) ride on the overview |
| `drive-lessons.mjs --app <dir>` | plays every step of every lesson to the end in Chromium from the page's own data and sweeps every step at 375 px; exit 0 only when every lesson ends at 100% with no errors. `--record` does the same on a copy of the DEPLOYED layout at the depth it is served from (`app/computing/<dir>/` under the config's `remote`: the hub as `index.html`, the five platform modules beside the pages, imports flattened, as `deploy.mjs` writes them, and the header crest at `app/shared/`) and then requires every step in the stored record, `completed` set, nothing ticked on a fresh open, and a reload after moving to step 4 to open step 4. `--only N` for one lesson |
| `lib/lesson.css` | the Mathematics design system, verbatim via the Science kit's copy |
| `lib/computing.css` | this kit's own styles; no new hue |
| `lib/voice.js`, `lib/deck.js` | lifted verbatim (the deck **unwired** — see the Grade 1 README) |
| `lib/computing.js` | the renderers, scenes, blocks, the sprite stage, the mini-apps and the synthesiser |

Grade-specific facts live in the app's `app.config.json`: `grade`, `gradeLabel`,
`stage`, `courseKey`, `objectiveFloors` (recorded at the measured value, may
rise and not fall), `hubStrands`, the lesson list. The stage decides which
codes the builder accepts and which the gate demands.

## Step kinds

| kind | renderer | what the child does |
| --- | --- | --- |
| `demo` | `demo` | presses Next through a drawn scene that changes state |
| `explore` / `context` | `tapCards` | taps cards to hear each; `context` ends on a question |
| `sort` | `sortBins` | one thing at a time into two to six bins, a reason for every verdict |
| `order` | `order` | taps things in the order they happen; with a `scene`, watches it paint; `extras` are steps the task does NOT need, and tapping one is answered with its `why` (2CT.04) |
| `follow` | `followSteps` | taps the step the lit algorithm names next; the scene paints in the order tapped (1CT.01) |
| `bugs` | `bugHunt` | finds the one wrong step, chooses the fix (or, on a `swap` round, the page moves the too-early step), watches the fixed algorithm run (1CT.02) |
| `remix` | `remix` | changes or adds a step to make a named outcome; the scene redraws (1CT.07) |
| `robot` | `robotGrid` | builds a program of forward / backwards / left / right and presses Go; `predict` levels ask where Robo stops first (1CT.03, 1P.03); at Stage 4 a predict level may carry a `loop` (`before`, `loop: {times, body}`, `after`) drawn as a repeat chip and unrolled by `expand_loop` (4CT.05) |
| `program` | `blockProgram` | rebuilds an algorithm as blocks and runs it; `given` rounds predict before Run (1P.02, 1P.03, 1P.05); at Stage 2 the palette carries `repeat2`/`3`/`4` (a repeat repeats the NEXT block), a `mustRepeat` round refuses a program with no repeat block, and a round with `sprites` + `object` plans one object of several (2P.02–04, 2P.06); at Stage 3 a round with `start` leaves the sprite where a previous program put it and `mustReset` requires a `home` block first (3P.02) |
| `debug` | `debugProgram` | runs a buggy program, taps the bug, picks the fix, runs again (1P.04–07); a round with `bugs` (a list) and `fixes` keyed by bug has more than one bug, and a `partner` adds an Ask button whose hint points at the block still wrong (2P.05, 2P.07) |
| `form` | `dataForm` | records six people's answers on a form; the table fills itself (1MD.03) |
| `table` | `dataTable` | answers questions from a table that stays on screen; keys computed (1MD.04) |
| `sorter` | `sortMachine` | presses a way of sorting and watches the machine group everything (1MD.02) |
| `ask` | `askDevice` | picks the app that answers each kind of question (1MD.01) |
| `network` | `networkBuild` | connects devices to a router, wired or wireless, then sends things across (1DC.01, 1DC.03) |
| `offline` | `offlineTest` | switches the internet off, predicts which apps still work, tries each (1DC.04) |
| `io` | `inputOutput` | taps inputs and outputs and watches information go in or come out, then three questions (1CS.03, 1CS.04) |
| `apps` | `appScreen` | opens six different programs on one tablet, each of which does a small real thing (1CS.02) |
| `precise` | `preciseDraw` | gives the one instruction precise enough to draw the next part of a house or a boat; a vague or wrong one draws the silly thing it actually says (2CT.06) |
| `chart` | `blockGraph` | builds a block graph column by column from the counts, then answers a question keyed by the columns (2MD.02) |
| `survey` | `surveyDesign` | chooses, for a stated purpose, which ways of collecting the data would work and which would not, collects it from the people, then answers (2MD.03) |
| `label` | `labelParts` | taps the named part on a drawn laptop or tablet (`FIGURES`), hearing what each does (2CS.01, 2CS.02) |
| `race` | `race` | races the computer at sums against a stopwatch, then says what the computer cannot do (2CS.04) |
| `trim` | `trimSteps` | taps the wasteful steps out of an algorithm (done twice, undone, or for another task), then watches the concise one still do the job (3CT.02) |
| `loopspot` | `loopSpot` | taps the run of steps that repeats inside an everyday task; the page folds every repeat into one `repeat N times` (3CT.03) |
| `whatif` | `whatIf` | predicts what one change to an algorithm will do - swap, remove, insert, replace - then watches the changed algorithm paint the scene (3CT.05) |
| `inout` | `inOut` | orders the steps of a machine, feeds it inputs, reads the outputs, then works out an untried one; keys computed by `rule_output` (3CT.07, 3CT.08) |
| `tidy` | `tidyProgram` | deletes unused blocks and folds runs into a repeat, then runs to prove the program still does the same thing in fewer blocks; `same_effect` decides (3P.01) |
| `parallel` | `parallelProgram` | builds a script per object and runs them all at once; a `static` object has look blocks only (3P.03, 3P.04) |
| `tweak` | `tweakProgram` | changes the number inside a move block until the cat stops on the flower; `walk_end` decides (3P.05) |
| `device` | `deviceProgram` | builds a program for Bitsy - a `when` hat block naming the input, then outputs - and presses that input on the board (3P.06, 3P.10, 3CS.05); at Stage 4 the hats include the temperature and light sensors (`whenHot`, `whenDark`), the palette carries `wait`, `repeat2`/`3`/`4` (repeats the NEXT output) and `forever` (repeats everything after it, capped at five cycles on screen, ended by a Stop button), and a loop block is refused last (4P.08, 4P.09) |
| `views` | `dataViews` | opens the same counts as a table, a bar chart and a pictogram, then answers questions keyed by `table_answer` (3MD.02) |
| `sheet` | `spreadsheet` | finds cells by name, puts values in, formats a column or cell as text, number, date or currency (3MD.04, 3MD.05) |
| `filter` | `dataFilter` | builds a filter from chips - field, is / is more than / is less than, value - and counts the rows it selects; `filter_rows` decides (3MD.06) |
| `cipher` | `cipher` | decodes numbers into letters and writes words as numbers with the 1 = a code; `code_word` decides (3DC.04, 3DC.05); a round with `mode: "caesar"` and a `shift` of 1-25 shows the shifted alphabet and `caesar_shift` decides, and `mode: "pigpen"` shows the grid key, draws each symbol with `pigpenSvg` and `pigpen_index` decides (4DC.06) |
| `loopalgo` | `loopAlgo` | follows an algorithm whose blocks include `{kind: "repeat", times, body}` and `{kind: "forever", body}`: taps the next step round the loop with a counter, presses Stop after a forever loop has gone round; a `fix` round has one wrong step INSIDE a loop (`wrong: [block, index]`, index -1 for a flat step) and a choice of fix; `flatten_algo` decides (4CT.01, 4CT.02) |
| `compare` | `compareAlgos` | reads two or more algorithms for one task, each with steps and `facts` (`minutes`, a note), and taps the one that best suits each stated purpose; a round with `check: {kind: "fewest_steps"}` or `"fastest"` is keyed by `best_algo` (4CT.04) |
| `subroutine` | `subRoutine` | follows a main algorithm that calls named sub-routines (`{kind: "call", sub}`): taps the call, then every step of the sub-routine, then carries on after the call; `sub_expand` decides (4CT.08) |
| `branch` | `branchAlgo` | picks one of two inputs and follows only the branch it takes (`before`, `yes`, `no`, `after`), then the other input; both inputs must run and the arms must differ; `branch_run` decides (4CT.09) |
| `loopbuild` | `loopBuild` | builds an algorithm with a repeat: taps steps from a pool into the loop body, sets the count with a number chip, runs it; the pool must hold a step the loop does not use; `expand_loop` decides (4CT.10) |
| `comment` | `commentBlocks` | matches one comment to each block of a program, then answers why comments help (4P.01) |
| `inputprog` | `inputProgram` | builds a different script for each input (tabs), then presses each input and watches only its script run; two inputs may not produce the same output (4P.05) |
| `plan` | `planObjects` | plans each object of a program by answering what its input is and what its output is (4P.06) |
| `parttest` | `partTest` | runs a program part by part, finds the part that fails, taps the wrong block in it, picks the fix, runs the part again; at least one part per round has a bug and the fix must make the part's `expect` (4P.07) |
| `datasort` | `dataSort` | picks a field and a direction (ascending / descending, alphabetical for text) and sorts the table, then answers who is first or last; `sort_rows` decides and a tie at the checked end is refused (4MD.04) |
| `tableparts` | `tableParts` | taps a whole record (row), a whole field (column) or one piece of data (cell) as asked; every task kind must appear (4MD.07) |
| `questions` / `quiz` | `sequence` | the Mathematics build's own, with pictures |
| `overview` … `resources` (shell) | as in Science | the unit shell |

Scenes: `dress`, `sandwich`, `teeth`, `handwash`, `tower`, `plant`, `catfeed`,
`tea`, `bed` (each drawn from the list of step ids done so far, IN ORDER —
later ids paint over earlier ones, which is how shoes-before-socks draws socks
on the outside, water-before-cup draws a puddle, and lights-before-story draws
reading in the dark) and `internet` (numeric states). Blocks: `right`, `left`,
`jump`, `spin`, `say`, `grow`, `shrink`, `hide`, `home`, `wait`, and the
control blocks `repeat2`, `repeat3`, `repeat4`. Drawings (`precise`): `house`,
`boat`, each with its silly wrong parts. Figures (`label`): `laptop`, `tablet`.
Mini-apps: `paint`, `game`, `write`, `video`, `call`, `search`. Bitsy's
blocks (`device`): the hats `whenA`, `whenShake`, `whenClap`, `whenHot`, `whenDark`,
the outputs `heart`, `smile`, `light`, `dark`, `beep`, `motor`, `bell`, `wait`, and
the loops `repeat2`, `repeat3`, `repeat4`, `forever` (`DEVICE_BLOCKS`; the builder
reads the hats and the loops off their `cat`). Cipher modes: `number`, `caesar`
(a `shift`), `pigpen` (the grid, drawn by `pigpenSvg`).
Cell formats (`sheet`): `text`, `number`, `date`, `currency` (`FORMATS`, held
equal between the JS and the builder). The builder reads all of these out of
`computing.js` by name, so a scene, block, drawing, figure, device block or
format written into a content module that does not exist fails the build
rather than the page.

## Rules that cost something to learn

- **Nothing waits on `requestAnimationFrame`** — a hidden tab never paints,
  and a sim that did froze a step in the Science kit. Timers only; there is no
  `requestAnimationFrame(` in `computing.js`.
- **A hand-over disables its buttons** while it waits; a fast child can press
  a third action inside the beat and skip an item otherwise. Robo's arrows,
  the palette and Run are all dead while a program runs.
- **`show` is looked up by name** in every renderer, so the wrappers the
  pipeline puts around it (header percentage, progress reporting, resume) all
  run.
- **Never name a pipeline tool's filename** in anything that ends up in a
  page; each tool's filename is its idempotence marker.
- **A `swap` bug round has no fix options and needs a step after it.** The
  page moves the too-early step down one; a step two places early cannot be
  fixed by one swap, so author it as a wrong step with a replacement instead.
- **Table questions are keyed by `check`, not by claim.** `{"kind": "most"}`,
  `{"kind": "least"}`, `{"kind": "count", "row": "Apple"}`,
  `{"kind": "any", "row": "Orange"}`. A tie has no single answer and is
  refused; a keyed option whose text differs from the computed answer is
  refused. Write the option text exactly as the row label or the number.
- **A repeat repeats the NEXT block, `n` times, and both languages must
  agree.** `expand_program` in `_rules.py` and `expandProgram` in
  `computing.js` are the same function twice; the builder reads the JS
  `REPEAT` table and refuses to run if it differs from `REPEATS`. The gate
  compares the EXPANDED programs, so `repeat3 jump` and `jump jump jump` are
  the same program, and a `mustRepeat` round is the one place where they are
  not accepted as equal.
- **Adding a grade** is a directory with `app.config.json` and `content/`,
  and the same pipeline (`../../mathematics/lesson-app-tools`) run in the
  same order as the Grade 1 README shows. Grade 2 was added that way on
  2026-09-10, and adding it extended the kit (five step kinds, two scenes,
  the repeat blocks, two drawings, two figures); Grade 3 the same day added
  twelve more kinds, Bitsy's blocks, the cell formats and seven computed
  rules; Grade 4, still the same day, added eleven more kinds, Bitsy's
  sensors and loops, the Caesar and Pigpen modes, Robo's loops and eight
  computed rules. Each time, the earlier grades were rebuilt on the extended kit and
  their `LESSON` data came out identical, page for page - that rebuild is
  the proof a kit change is safe, and it is not optional.
- **A loop block on Bitsy is never last, and a repeat is followed by an
  output.** `repeat3` repeats the ONE output after it; `forever` repeats
  everything after it, and on screen it is capped at five cycles and ended by
  the Stop button, so a child is never left watching a light flash with no
  way out. The builder refuses a loop block last, two `forever`s, or a repeat
  followed by another loop; the gate re-checks the shipped rounds.
- **A forever loop in a followed algorithm goes round twice, then Stop.**
  `FOREVER_CYCLES` is 2 in `_rules.py` and `computing.js` alike: the child
  taps the body twice and then the Stop step, which is how an indefinite loop
  can be followed to an end and still be indefinite. A `fix` round names its
  wrong step as `[block, index]`; `index` is -1 for a step outside any loop.
- **The hub's answer key describes a looped Robo level as written.**
  `keys_for` in `build-hub.py` used to read `lv["program"]`; a Stage 4 predict
  level has `before`/`loop`/`after` instead, and the first Grade 4 hub build
  fell over on it. It now prints `repeat N times (...)` and the square the
  unrolled program ends on.
- **A shell step must not finish itself while the deck paints.** Every
  renderer draws at page load, before the reporting module exists, so a
  `finish()` at draw time ticks a step that nothing can report: the Grade 1
  validation of 2026-09-11 found the overview and Computing world steps
  finishing that way, so every lesson opened at 13%, the stored record
  never held step 1 or the world step (16 of 16 on screen was 14 of 16 in
  the record and `unit.completed` never fired), and the resume hook, which
  reads a finished step 1 as "already started", never took a reopened
  lesson back to where it was left. `ONLEAVE[i]` beside `ONSHOW[i]` runs
  before the deck moves off step i: the overview ticks when the learner
  leaves it (its arrival IS page load, so arrival is no cure), and
  Computing world ticks on arrival. Anything else that must tick without a
  tap goes through one of those two, never through a bare `finish()`.
- **The plain drive cannot see the school's record; `--record` can.** The
  source tree has no platform modules (they 404 by design), so a drive there
  proves the dots tick and nothing about what reaches the school. Run
  `drive-lessons.mjs --record` after any change to the deck, the shell or a
  step that finishes without a tap. It is how the shell-tick defect above was
  proved fixed, and it would have caught it on the first day.
- **The recap and the warm-up live on the overview, never as new steps.** A
  new step shifts every stored section id after it, so a learner's saved
  record would tick the wrong dots. The warm-up is never marked: a wrong
  guess is told the answer kindly, not shown red, and what is reported is
  participation (`reportAttempt`, "warm-up questions"), never a score, because
  a mark before the lesson would read as a mark on it. The builder refuses a
  warm-up of more than 3 questions or without single keys and reasons; the
  gate re-checks them on the built page. A new TEACHING step does shift the
  ids, and sometimes an objective needs one: three were added to Grade 1
  lessons 6 to 8 on 2026-09-11, and four to Grade 2 lessons 7 and 10 the
  same day. A record made on those lessons before the redeploy reads a step
  or more out from the inserted steps on. Say so with the release.
- **A game's question is the step's own question.** The Sort race asked
  `Where does <label> go?`, which is broken English whenever a label is not
  a thing ("Where does how many children chose apple? go?", answered "Yes, it
  is in the table"). It now shows the item in quotes and asks the sort step's
  `ask`, which was written for those items and those bins. A template that
  wraps authored text must read correctly for every label it can be given.
- **Controls are 44 px tall; labels at least 13 px.** The blocks, the wifi
  toggle and the home cards' buttons measured 40 to 43 px at phone width and
  two label styles 11 to 11.5 px (validation, 2026-09-11). The network map's
  labels are 13 units and the drawing is as tall as its lowest label needs,
  which on a phone draws them at 12 px. The parts of the laptop and tablet
  drawings are the exception to 44 px and are held to the 24 px minimum
  instead: five of them measured 17 to 23 px (Grade 2 validation,
  2026-09-11), and 44 is not reachable without redrawing, because the
  speaker, the port and the touchpad sit too close together. The Stage 3
  machines missed the rule until the Grade 3 validation (2026-09-11): the
  cipher keys were 38 by 40, the sheet's column letters 41 by 35, the
  number chips inside a block 40 by 30 and the choice chips 43 tall; the
  code strip's numbers were 11 px and the machine's INPUT and OUTPUT 12 px.
  A number chip is 44 px inside a 44 px block by pulling its margins in, so
  the block does not grow. A new control class gets `min-height: 44px` the
  day it is written.
- **Pictures are Emoji 12.0 (2019) or older.** A tablet that has not had a
  system update since then draws a newer one as an empty box, and an empty
  box beside "shake it" teaches nothing. The kit's shake input was 🫨
  (Emoji 15.0, 2022) and Grade 3 carried eight 2020-21 pictures (a lift, a
  mirror, a bucket, a toothbrush, a pot plant, a slide, a wheel, bubble
  tea); those were replaced on 2026-09-11, and Grade 4's five (the same
  lift, bubble tea, bucket, toothbrush and pot plant) in its own validation
  the same day. Check a new picture's Emoji version before using it.
- **The teachers' page picks a step's unplugged version by what the step
  teaches, not only by its kind.** `build-hub.py` chose the "Do it
  unplugged" line from the step kind alone, so Grade 4's Caesar step
  printed the 1 = a code and its Pigpen step printed nothing (one line per
  kind per lesson). A cipher step now gets its own cipher's line, keyed by
  kind and mode (`unplugged()`); Grade 3's number-code steps have no mode
  and keep theirs. A new kind whose rounds teach different things needs the
  same treatment the day it is written.
- **`blockBtn`'s third argument is the extra class.** It used to be passed
  as a second `class="…"` inside the attribute string, which the parser
  ignores, so the running block was never highlighted at Stages 1 and 2
  either. Pass `"now"` as the third argument.
