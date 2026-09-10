# The Computing lesson kit — one generator for every grade

The standalone Computing builds (`../grade-1-app`, …) are self-contained HTML
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
| `build-lessons.py --app <dir>` | writes `<slug>.html` per lesson from the content; refuses a bad objective code, a quiz with no single key, a sort into a missing bin, a Robo solution that misses, a table key the rows disagree with, a debug fix that does not make the expected program |
| `build-hub.py --app <dir>` | writes the hub: cards with step counts and time estimates, the strands panel, the printable teachers-and-parents section with the unplugged version of every activity and the answer keys |
| `check-coverage.py --app <dir>` | the curriculum gate on the BUILT pages: every objective of the stage reached, per-lesson floors, keys single, and Robo's routes / table answers / fixes RE-COMPUTED from the shipped data |
| `_rules.py` | the two things the kit computes rather than trusts — Robo's Bee-Bot rules and the table arithmetic — imported by the builder AND the gate so they cannot disagree |
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
| `order` | `order` | taps things in the order they happen; with a `scene`, watches it paint |
| `follow` | `followSteps` | taps the step the lit algorithm names next; the scene paints in the order tapped (1CT.01) |
| `bugs` | `bugHunt` | finds the one wrong step, chooses the fix (or, on a `swap` round, the page moves the too-early step), watches the fixed algorithm run (1CT.02) |
| `remix` | `remix` | changes or adds a step to make a named outcome; the scene redraws (1CT.07) |
| `robot` | `robotGrid` | builds a program of forward / backwards / left / right and presses Go; `predict` levels ask where Robo stops first (1CT.03, 1P.03) |
| `program` | `blockProgram` | rebuilds an algorithm as blocks and runs it; `given` rounds predict before Run (1P.02, 1P.03, 1P.05) |
| `debug` | `debugProgram` | runs a buggy program, taps the bug, picks the fix, runs again (1P.04–07) |
| `form` | `dataForm` | records six people's answers on a form; the table fills itself (1MD.03) |
| `table` | `dataTable` | answers questions from a table that stays on screen; keys computed (1MD.04) |
| `sorter` | `sortMachine` | presses a way of sorting and watches the machine group everything (1MD.02) |
| `ask` | `askDevice` | picks the app that answers each kind of question (1MD.01) |
| `network` | `networkBuild` | connects devices to a router, wired or wireless, then sends things across (1DC.01, 1DC.03) |
| `offline` | `offlineTest` | switches the internet off, predicts which apps still work, tries each (1DC.04) |
| `io` | `inputOutput` | taps inputs and outputs and watches information go in or come out, then three questions (1CS.03, 1CS.04) |
| `apps` | `appScreen` | opens six different programs on one tablet, each of which does a small real thing (1CS.02) |
| `questions` / `quiz` | `sequence` | the Mathematics build's own, with pictures |
| `overview` … `resources` (shell) | as in Science | the unit shell |

Scenes: `dress`, `sandwich`, `teeth`, `handwash`, `tower`, `plant`, `catfeed`
(each drawn from the list of step ids done so far, IN ORDER — later ids paint
over earlier ones, which is how shoes-before-socks draws socks on the outside)
and `internet` (numeric states). Blocks: `right`, `left`, `jump`, `spin`,
`say`, `grow`, `shrink`, `hide`, `home`, `wait`. Mini-apps: `paint`, `game`,
`write`, `video`, `call`, `search`. The builder reads all of these out of
`computing.js` by name, so a scene or block written into a content module that
does not exist fails the build rather than the page.

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
- **Adding a grade** is a directory with `app.config.json` and `content/`,
  and the same pipeline (`../../mathematics/lesson-app-tools`) run in the
  same order as the Grade 1 README shows.
