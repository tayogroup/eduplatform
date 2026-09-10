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
| `_rules.py` | the things the kit computes rather than trusts — Robo's Bee-Bot rules, the table arithmetic, the repeat expansion (`REPEATS`, `expand_program`; the builder refuses to run if `computing.js` disagrees about what `repeat2`/`3`/`4` mean), the race sums, and at Stage 3 the machine rules (`rule_output`), the numbered walk (`walk_end`), the 1 = a code (`code_word`, `decode_code`), the row filter (`filter_rows`), tidy-program equivalence (`same_effect`), the repeated run (`repeat_run`) and the spreadsheet state (`sheet_cells`) — each mirrored name for name in `computing.js`; imported by the builder AND the gate so they cannot disagree |
| `_kit.py` | `step()`, `explain()`, `q()`, `opt()`, `s()`, `choice()`, and `part()`, `word()`, `home()` — the vocabulary the content is written in |
| `_shell.py` | the unit shell: the seven steps drawn AROUND every lesson (overview, lecture, words, games, home, world, resources), and the games derived from the lesson's own content; used by both builders so the hub and the page agree |
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
| `robot` | `robotGrid` | builds a program of forward / backwards / left / right and presses Go; `predict` levels ask where Robo stops first (1CT.03, 1P.03) |
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
| `device` | `deviceProgram` | builds a program for Bitsy - a `when` hat block naming the input, then outputs - and presses that input on the board (3P.06, 3P.10, 3CS.05) |
| `views` | `dataViews` | opens the same counts as a table, a bar chart and a pictogram, then answers questions keyed by `table_answer` (3MD.02) |
| `sheet` | `spreadsheet` | finds cells by name, puts values in, formats a column or cell as text, number, date or currency (3MD.04, 3MD.05) |
| `filter` | `dataFilter` | builds a filter from chips - field, is / is more than / is less than, value - and counts the rows it selects; `filter_rows` decides (3MD.06) |
| `cipher` | `cipher` | decodes numbers into letters and writes words as numbers with the 1 = a code; `code_word` decides (3DC.04, 3DC.05) |
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
blocks (`device`): the hats `whenA`, `whenShake`, `whenClap` and the outputs
`heart`, `smile`, `light`, `dark`, `beep`, `motor`, `bell` (`DEVICE_BLOCKS`).
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
  rules. Each time, the earlier grades were rebuilt on the extended kit and
  their `LESSON` data came out identical, page for page - that rebuild is
  the proof a kit change is safe, and it is not optional.
- **`blockBtn`'s third argument is the extra class.** It used to be passed
  as a second `class="…"` inside the attribute string, which the parser
  ignores, so the running block was never highlighted at Stages 1 and 2
  either. Pass `"now"` as the third argument.
