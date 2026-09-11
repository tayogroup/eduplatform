# The Art & Design lesson kit — one generator for every grade

The standalone Art & Design builds (`../grade-1-app`, …) are self-contained
HTML pages in the design of the Grade 1 Mathematics, English, Science,
Computing and Global Perspectives standalone builds, bypassing
`shell/course-app.js`. Everything that draws a page lives here; each grade
directory holds only `app.config.json` and `content/lesson-N.py`.

**It is the Global Perspectives kit's shape, as a separate copy, on purpose.**
`../../global-perspectives/lesson-kit`, `../../computing/lesson-kit` and
`../../science/lesson-kit` are each live or about to be for their own grades.
Teaching any of them a second subject would have put an Art & Design change on
the path to a live page of another subject. The three design files are copied
verbatim (same sha1 as the other kits' on 2026-09-10: `lesson.css`
`232e43fc…`, `voice.js` `7921e8b4…`, `deck.js` `de9591d0…`); everything else
here is this subject's own. If the Mathematics engine changes, re-copy
`voice.js` and `deck.js` here as in every other build; nothing will notice on
its own.

| | |
| --- | --- |
| `build-lessons.py --app <dir>` | writes `<slug>.html` per lesson from the content; refuses a bad objective code, a quiz with no single key, a sort into a missing bin, and every relationship in `_rules.py` that the content gets wrong; refuses to build at all if `lib/art.js`'s colour and texture tables have drifted from `_rules.py`'s |
| `build-hub.py --app <dir>` | writes the hub: cards with step counts and time estimates, the four-strands panel, the printable teachers-and-parents section with the make-it-for-real version of every activity and the answer keys — saying so where a step has no key because the child's own drawing, feeling or idea IS the answer |
| `build-check.py --app <dir>` | writes the STARTING CHECK, `starting-check.html`, from the grade's placement file (`../data/placement/grade-N.json`, the shape `shell/placement.js` reads); refuses a key that is not an option, a picture list the wrong length, counts that disagree, or a review link to a lesson the grade does not have under that title. Not a lesson: named in `extraPages` (so `deploy.mjs` uploads it) and `startingCheck` (so the hub links it) |
| `check-coverage.py --app <dir>` | the curriculum gate on the BUILT pages: every objective of the stage reached, per-lesson floors, keys single, every relationship RE-COMPUTED from the shipped data, and the page's own tables equal to `_rules.py`'s; and, since 2026-09-11, the five validation fixes (below) |
| `check-marks.mjs <page>…` | called by `check-coverage.py`: draws every mark the keyboard route can ask for through the SHIPPED page's own judge, at three heights, and fails if one is judged wrong or a rival shape passes it |
| `drive-lessons.mjs --app <dir>` | plays every step of every lesson in Chromium the way a child would — real strokes on the canvas at desktop width, the keyboard route at `--width 375` (or `--keyboard`) — and reports which did not end at 100% with every sticker; `--width 375` adds an overflow check. A full run then checks Stop for today, prints every make-at-home sheet to PDF, and answers the starting check all right and all wrong |
| `_rules.py` | the relationships the kit computes rather than trusts, imported by the builder AND the gate so they cannot disagree |
| `_kit.py` | `step()`, `explain()`, `q()`, `opt()`, `pot()`, `swatch()`, `material()`, `change()`, `work()`, `comment()`, `spot()`, and `part()`, `word()`, `home()` — the vocabulary the content is written in |
| `_shell.py` | the unit shell: the steps drawn AROUND every lesson (overview, lecture, words, journal, games, home, world, resources), and the games derived from the lesson's own content; used by both builders so the hub and the page agree |
| `lib/lesson.css` | the Mathematics design system, verbatim via the Global Perspectives kit's copy |
| `lib/art.css` | this kit's own styles; no new hue — the only colour on a page that is not a token is a paint pot's, a swatch's or a tile's, drawn through `--c` or inside an SVG |
| `lib/voice.js`, `lib/deck.js` | lifted verbatim (the deck **unwired** — see the Grade 1 README) |
| `lib/art.js` | the renderers, the drawn artworks, the stroke judge, the synthesiser, and the page's copy of the colour and texture tables |

Grade-specific facts live in the app's `app.config.json`: `grade`, `gradeLabel`,
`stage`, `courseKey`, `objectiveFloors` (recorded at the measured value, may
rise and not fall), `hubStrands`, the lesson list. The stage decides which
codes the builder accepts and which the gate demands.

## The framework, and what is odd about it

`src/curriculum/cambridge-art-and-design-0067.json`, extracted from the
published PDF by `tools/extract-cambridge-art-and-design-framework.py`. Two
things are unlike every other framework file, and both matter here:

- **Cambridge prints the ten codes with no stage digit** — `E.01`, `M.02`,
  `TWA.03` — because the same ten objectives run from Stage 1 to Stage 6. The
  repo resolves a code by its leading digit, so the file publishes `1E.01` …
  `1TWA.03` under every stage, `recurring: true`, and a page's grown-up panel
  says the digit is Ehel's. `validate-curriculum-framework.mjs` was widened
  (the filename glob, and `TWA` in `CODE_RE`) to read it.
- **What differs by stage is the progression text**, one paragraph per
  objective per stage pair, stored on every objective as `progression`. That
  text — not the objective — is what a Stage 1 lesson is pitched against, and
  it is concrete: "Let us try mixing red and blue. What happened?", "Why
  wouldn't those two items join together?", "add collage to a painting to show
  texture", "textures of paint by adding rice, flour, sugar, water".

## What is computed rather than trusted

Art & Design at Stage 1 is about materials, colours and marks, so what
`_rules.py` can compute is what those things DO. Every one of them is checked
by the builder before a page is written and re-checked by the gate on the
shipped bytes:

| rule | what it decides | objective |
| --- | --- | --- |
| `mix` | what two paints make (a table of the secondaries, a tint for white, a shade for black; a mix the table has no answer for is refused) | 1E.02, 1M.01, 1R.02 |
| `tone_order` | the order of swatches from light to dark, from the colours' own lightness; a tie is refused | 1E.01, 1E.03 |
| `pattern_period`, `pattern_next`, `is_repeating` | the repeat of a pattern, what continues it, and whether a row the child built IS one (a unit of 2–3 tiles, repeated in full) | 1E.01, 1TWA.01 |
| `fits` | which materials have the property a purpose needs (some must, some must not) | 1M.02, 1TWA.02 |
| `compare` | whether a feature is in both works or only one (a card in neither is refused; both kinds must be present) | 1R.02 |
| `comment_fits` | whether a kind comment names something in the work (exactly one per round) | 1R.01 |
| `refinements` | which change has the effect a problem needs (some must, some must not) | 1TWA.03 |
| `paint_texture` | what rice, flour, sugar, water, sand or glue does to paint | 1TWA.02 |
| `journal_fallback` | the record of what a lesson makes, for a journal opened without its steps played | 1R.01, 1TWA.03 |

**The page carries the same tables** (`HEX`, `MIX`, `TINT`, `SHADE`, `TEXTURE`
in `lib/art.js`) so the mixer and the paint blob can draw the answer. The
builder reads them out of the JS by regex and refuses to build if they differ
from `_rules.py`'s; the gate reads them out of each shipped page and fails the
same way. One table, held equal in three places by two checks.

**The stroke judge is the one thing computed on the page alone.** `CHECKS`
in `lib/art.js` judges a real pointer stroke by its geometry — length,
straightness (chord over length), total turning, sharp corners, and reversals
(the bend changing sign after at least 20° the other way — a smooth wave
bends by a degree or two per sample, so a per-sample threshold counted no
crests at all, found by the driver). The builder reads the check names out of
the JS and refuses a round that names one it does not have; nothing
re-computes a child's stroke, because there is no stroke until a child draws.

Three fields are DERIVED by the builder rather than authored: a `tone` step's
items from its swatches' lightness; a lesson journal's fallback from the
lesson's own making steps; a course-scope journal's fallback (Lesson 8) from
every lesson's. The per-lesson journal is drawn by `_shell.py`; a lesson that
authors its own gets no second.

## Step kinds

| kind | renderer | what the child does |
| --- | --- | --- |
| `demo` | `demo` | presses Next through drawn frames that change state |
| `explore` / `context` | `tapCards` | taps cards to hear each (an emoji, or one of the kit's drawn artworks via `scene`); a question can follow |
| `sort` | `sortBins` | one thing at a time into two to four bins, a reason for every verdict |
| `order` | `order` | taps things in the order they happen |
| `tone` | `order` | the same, over swatches whose order the builder computed from their lightness (1E.01) |
| `source` | `pictureSource` | finds the things in a drawn artwork and hears what the artist did; then a question keyed by a spot in the picture (1E.01) |
| `mix` | `colourMixer` | predicts, then taps two pots; the bowl swirls to the computed mix; a last free round mixes any two and writes the result to the journal (1E.02, 1M.01, 1R.02) |
| `marks` | `markMaker` | draws on a canvas with a real pointer and a chosen tool; each round asks for a KIND of mark and the page judges the stroke; a last free drawing is stuck in the journal (1E.03, 1M.01). Or, by keyboard or switch: **Choose the mark** opens three drawn marks, and the right one is drawn onto the paper and judged by the same check; the free round has stamp buttons |
| `pattern` | `patternMaker` | taps the tile that comes next, then builds a row that counts only if it repeats (1E.01, 1TWA.01) |
| `choose` | `chooseFor` | picks the material whose property the purpose needs; a wrong pick says what the material IS like (1M.02) |
| `experiment` | `paintExperiment` | predicts, adds rice / flour / sugar / water / sand / glue, sees the paint change, names what it is like, hears whether it matched (1TWA.02) |
| `compare` | `sameDifferent` | sorts cards into "both have it" / "only one has it" by set arithmetic on two works' features; then which they like more, never marked (1R.02) |
| `comment` | `kindComment` | picks the kind comment that names something actually in a friend's work (1R.01) |
| `refine` | `refineIt` | tries a change on a piece with a problem and sees what it did; the fix redraws the piece (1TWA.03) |
| `journal` | `myJournal` | orders what they made from the page's own log, picks one, and says what they would change — never marked (1R.01, 1TWA.03). Then **a good place to stop**: Stop for today (back to the hub, the next step kept) or Keep going |
| `questions` / `quiz` | `sequence` | the Mathematics build's own, with pictures |
| `overview` … `resources` (shell) | as in Global Perspectives | the unit shell; `home` adds **Print it for home**, one A4 sheet per lesson |
| `readiness` (starting-check.html only) | `readinessCheck` | twelve picture questions in three sections, banded by `shell/placement.js`'s own rule, review lessons linked; the result is kept on the device and shown on the hub, and reported to nobody |

Scenes (`SCENES` in `lib/art.js`, read by name at build time): art from
different times and cultures drawn IN THE MANNER of traditional and ancient
work — `cave`, `basket`, `cloth`, `mask`, `tiles`, `dots` — never a copy of a
named living artist; and children's paintings `sunpainting`, `seapainting`,
`flowers`, `night`, plus three with a state a refinement changes: `portrait`
(`flat` → `wool`), `housepainting` (`runny` → `fixed`), `claypot` (`cracked` →
`smooth`). Tools (`TOOLS`): pencil, brush, sponge, chalk, finger, crayon.
Mark checks (`CHECKS`): straight, wavy, zigzag, long, short, round, dots,
thick, thin. Sounds (`BANK`): the Global Perspectives bank plus `dab`,
`swish`, `squelch`, `stir`, `rustle`.

## Recorded narration and the lecture video

Since 2026-09-11 every lesson is heard in a RECORDED voice, and every lecture
is a captioned video. Four tools, run in this order after the pages build:

```bash
K=../lesson-kit
node $K/drive-lessons.mjs --app . --trace t.json      # every sentence the pages speak, Explain pressed on every step
node $K/narrate.mjs       --app . --trace t.json --dry   # characters: ElevenLabs bills per character
node $K/narrate.mjs       --app . --trace t.json         # record what is missing (never re-buys a clip)
node $K/build-lectures.mjs --app .                    # one captioned mp4 per lesson, from those clips
python $K/build-lessons.py --app . && …pipeline…      # the lecture step picks the video up
node $K/check-narration.mjs --app . --trace t.json    # the gate
node $K/deploy-media.mjs  --app . --upload            # media BEFORE the pages
```

- **One wrapper, no fork of voice.js.** Every spoken line goes through
  `VOICE.speak` or `VOICE.follow`, so `lib/art.js` wraps those two and nothing
  else. A line is split into sentences; each is looked up as
  `media/tts/<cyrb53(sentence)>.mp3` in `media/tts/index.json`. If EVERY
  sentence has a clip the clips play in order; if any is missing the whole line
  goes to the engine as before — a sentence is never read by two voices.
- **The same speaker either way.** Clips are ElevenLabs `XfNU2rGpBa01ckF309OY`,
  the voice `quiz_tts.php` speaks at runtime, so a line composed at runtime
  (a score, a child's own choice) and a recorded one sound like one person.
  Offline, with no launch token, an unrecorded line falls to the browser voice.
- **The text rules are defined once.** `speechText`, `sentencesOf` and
  `cyrb53` sit between `NARRATION-TEXT` markers in `lib/art.js`; `narrate.mjs`,
  `build-lectures.mjs` and `check-narration.mjs` lift them out of the file.
  The gate holds `cyrb53` equal to `tools/lib/ehel-narration-hash.js`.
- **What is recorded is measured, not guessed.** The driver's `--trace` records
  every sentence the pages actually spoke in a full run with Explain pressed on
  every step; `narrate.mjs` adds the sentences a correct run never reaches
  (every `why`, `say`, `fact`, `done` in the data, and complete-sentence
  literals in the scripts). `scripts.json` keeps hash → words for a human to
  listen against. Capitals are sent lower-case ("what it IS like") so an
  emphasis word is read, not spelled; the clip keeps the page's hash.
- **The video IS the recording.** `build-lectures.mjs` holds each part's slide
  (the lesson's palette, the part's picture, title and words) for exactly as
  long as that part's recorded sentences last, joined with the page's own gap;
  captions are one WebVTT cue per sentence, timed from the clips. It records
  nothing — a missing sentence stops it and names the line.
- **Media before pages, indexes last.** `deploy-media.mjs` uploads every clip,
  video, caption and poster, reads them back from storage, and only then the
  two `index.json` files — a page asks only for what its index lists, so it
  can never request a path that is not there (an edge-cached 404 cannot be
  purged with the key in `.env`). It never fetches through the edge.
- **Chromium cannot play the videos, and that is not a defect.** Playwright's
  Chromium ships without H.264/AAC; the driver presses *I watched it*. Playback
  is checked in Microsoft Edge (`chromium.launch({ channel: "msedge" })`),
  which is what learners' Chrome, Edge and Safari have.

## Rules that cost something to learn

- **Nothing waits on `requestAnimationFrame`** — a hidden tab never paints,
  and a sim that did froze a step in the Science kit. Timers only. The bowl's
  swirl and the pattern tile's pop are CSS animations, which need no frame.
- **A hand-over disables its buttons** while it waits; a fast child can press
  a third pot inside the beat otherwise.
- **`show` is looked up by name** in every renderer, so the wrappers the
  pipeline puts around it (header percentage, progress reporting, resume) all
  run.
- **Never name a pipeline tool's filename** in anything that ends up in a
  page; each tool's filename is its idempotence marker.
- **The canvas is never replaced mid-stroke.** An earlier version rebuilt
  the SVG from `outerHTML` on every pointer move, which dropped the pointer
  capture, so a stroke ending near the edge was never judged. The live stroke
  is one `<path>` whose `d` is updated in place; the SVG is redrawn only
  between strokes (`draw()` then `wire()`).
- **A reversal is an accumulated bend, not a per-sample one.** The first judge
  required a sample to turn more than 8° at the flip, and a smooth wave never
  does, so no wave was ever wavy. Found by the driver on the first run, not by
  reading the code.
- **The journal is one log per page** (`window.__artJournal`), because a
  lesson is one page and every making step on it feeds the same journal. A
  course-scope journal ignores the live log on purpose and reads the builder's
  record of every lesson.
- **Colour is content, not a token.** A pot, a swatch, a tile and the bowl
  take their colour from the step's data through `--c` or an SVG fill. Nothing
  in `art.css` names a hue the design system does not already have.
- **A kit change moves every page's bytes**, because each page embeds
  `art.js`. So the safety proof for a kit change is not a byte-identical
  rebuild of the live grade: it is that grade rebuilt through the new kit and
  driven to 100% again (`drive-lessons.mjs`) before the new grade is.
- **The keyboard route is judged by the check a finger meets.** `markPts()`
  draws each mark and `strokeFeatures()`/`CHECKS` judge it, so tightening a
  check can make the keyboard route impossible — `check-marks.mjs` is what
  says so. Writing it found two things no stroke by hand had: a big zigzag
  passed as a **circle** (the round check now refuses more than two sharp
  turns), and every dot before the sixth set `missed`, so the **dots round
  could never score** (a dot on the way to six is now progress, not a miss).
- **Chalk is a coloured chalk.** It was `#F7F1E3` on `#FFFDF6` paper — a
  contrast of about 1.07 — so chalk marks were drawn and could not be seen.
- **Never add a step to fix a lesson's length.** Progress names steps by
  POSITION (`step-01`…), so a new step moves every step after it, the quiz's
  gradebook key included, under records already written. The stop card is
  drawn inside the journal step for exactly that reason.
- **The voice's reaction banks are wanted in full.** They are SSML, which the
  literal scan skips, and a run speaks one at random, so a trace keeps some and
  loses the rest; `narrate.mjs --prune` would have deleted "Hmm." and "Let us
  think it through again." until every bank line was added to what is wanted.
- **A page reads `media/tts/index.<sha10>.json`, never `index.json`.** The
  edge does not refresh a path when storage is overwritten, and it caches each
  compressed variant separately. After the 2026-09-11 re-upload a plain
  request read back the new index while the zstd copy a browser receives was
  still the morning's, so every newly recorded line went to the live voice.
  `narrate.mjs` writes the content-named copy beside `index.json`, the
  builders point every page at it (and refuse if it is missing or differs),
  `deploy-media.mjs` ships it with the indexes last, and `check-narration.mjs`
  fails a page that names any other. To see what a browser gets, ask with
  `Accept-Encoding: gzip, deflate, br, zstd` — a bare `curl` asks for a
  different cache entry.
- **A page with one slide gets a hidden last slide.** The deck paints its
  sticker shelf on the last slide, so the starting check, alone, said "Every
  sticker! You finished the whole lesson." at load. Heard live, not caught by
  a gate; now checked by loading the page and reading its narration log.
- **`build-lectures.mjs --only <slug>`** rebuilds one lesson's video and keeps
  the other entries of `media/lecture/index.json` untouched, so one lecture's
  wording change does not rename and re-upload the other seven.
- **Adding a grade** is a directory with `app.config.json` and `content/`, and
  the same pipeline (`../../mathematics/lesson-app-tools`) run in the same
  order as the Grade 1 README shows. Stage 2 uses the same ten codes with a
  `2` in front; the progression text is the same as Stage 1's, so a Stage 2
  build is pitched by the content, not by the framework.
