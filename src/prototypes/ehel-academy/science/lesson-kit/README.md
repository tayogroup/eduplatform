# The Science lesson kit — one generator for every grade

The standalone Science builds (`../grade-1-app`, `../grade-2-app`, …) are
self-contained HTML pages in the design of the Grade 1 Mathematics and
English standalone builds, bypassing `shell/course-app.js`. Everything that
draws a page lives here; each grade directory holds only `app.config.json`
and `content/lesson-N.py`.

| | |
| --- | --- |
| `build-lessons.py --app <dir>` | writes `<slug>.html` per lesson from the content; refuses a bad objective code, a quiz with no single key, a sort into a missing bin |
| `build-hub.py --app <dir>` | writes the hub: cards with step counts and time estimates, the strands panel, the printable teachers-and-parents section |
| `check-coverage.py --app <dir>` | the curriculum gate on the BUILT pages: every objective of the stage reached, per-lesson floors, keys single |
| `_kit.py` | `step()`, `explain()`, `q()`, `opt()` — the vocabulary the content is written in |
| `lib/lesson.css` | the Mathematics design system, verbatim via English's copy |
| `lib/science.css` | this kit's own styles; no new hue |
| `lib/voice.js`, `lib/deck.js` | lifted verbatim from `english/grade-1-app/lib` (the deck **unwired** — see the Grade 1 README) |
| `lib/science.js` | the renderers, sims, figures, scenes and synthesiser |

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
| `experiment` | `experiment` | predict → try it (a sim) → what happened → did it match |
| `predictEach` | `predictEach` | predicts for every item before the sim acts on it |
| `record` | `recordTable` | fills a two-column table from what the sim did |
| `measure` | `measure` | lays hands / cubes along a thing and counts |
| `label` | `labelParts` | taps the named part of a figure (keyboard: Tab, Enter) |
| `tester` | `tester` | presses / bends / wets / scratches a material; badges appear |
| `ask` | `askQuestion` | picks a question about a picture, then how to find out |
| `questions` / `quiz` | `sequence` | the Mathematics build's own, with pictures |
| `order` (Stage 2) | `order` | taps things in the order they happen |
| `graph` (Stage 2) | `blockGraph` | stacks a block per unit in each column, then reads the pattern |
| `lookup` (Stage 2) | `lookup` | answers questions from a fact card that stays on screen |
| `build` (Stage 2) | `build` | assembles a model from parts, then does something with it |

Sims: `plantWater`, `plantLight`, `pushBall`, `floatSink`, `magnet`,
`soundFar`, `shapeChange`, `globeCatch`, `sunShade` (Stage 1); `circuit`,
`darkRoom`, `sunPath`, `newMaterial` (Stage 2). Figures: `plant`, `body`,
`mouth`, `circuit`. Scenes: `plant`, `ground`, `globe`, `sky`, `zoom`,
`habitat`, `extract`. The builder reads all of these out of `science.js` by
name, so a sim written into a content module that does not exist fails the
build rather than the page.

## Rules that cost something to learn

- **A sim never waits on `requestAnimationFrame`** — a hidden tab never
  paints, and a sim that did froze a step. Timers only.
- **A sim's hand-over disables its buttons** while it waits; a fast child
  can press a third action inside the beat and skip an item otherwise.
- **`show` is looked up by name** in every renderer, so the wrappers the
  pipeline puts around it (header percentage, progress reporting, resume) all
  run.
- **Never name a pipeline tool's filename** in anything that ends up in a
  page; each tool's filename is its idempotence marker.
- **Adding a grade** is a directory with `app.config.json` and `content/`,
  and the same pipeline (`../../mathematics/lesson-app-tools`) run in the
  same order. The Grade 1 rebuild through this kit came out byte-identical
  to its live pages apart from the generated-by comment, which is how the
  kit was proved safe to extract.
