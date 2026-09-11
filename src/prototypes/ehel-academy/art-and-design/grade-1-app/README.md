# Grade 1 Art & Design — the standalone lesson build

A Grade 1 Art & Design course in the design of the Grade 1 Mathematics,
English, Science, Computing and Global Perspectives standalone builds
(`../../mathematics/grade-1-app/g1v2`, `../../english/grade-1-app`,
`../../science/grade-1-app`, `../../computing/grade-1-app`,
`../../global-perspectives/grade-1-app`): self-contained HTML pages, one per
lesson, each carrying its own CSS, its own activity JS and its own copy of the
voice engine, bypassing `shell/course-app.js` entirely. The improved prompt it
was built from is [PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Art & Design 0067, Stage 1 — all 10
learning objectives, pitched at the framework's own Stages 1–2 progression
text.** Art & Design is a NEW subject for the platform, with no Word-pack
course beside this: the catalogue's `ehel-art-g01` is generated from this
build's own lesson list, and since 2026-09-10 it is Moodle course
`EHEL-ART-G01` (id 83), routed here by `ehel_app_url_overrides` (see
[GO-LIVE.md](GO-LIVE.md)).

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0067 codes |
| `app.config.json` | grade, stage, floors, hub strands, lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g1-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | **the generator, this subject's own** (see its README for why it is a copy of the Global Perspectives kit's shape and not that kit): `build-lessons.py`, `build-hub.py`, `check-coverage.py`, `drive-lessons.mjs`, `_rules.py`, `_kit.py`, `_shell.py`, and `lib/` |

The framework file is `src/curriculum/cambridge-art-and-design-0067.json`,
extracted from the published PDF by
`tools/extract-cambridge-art-and-design-framework.py`. Cambridge prints the ten
codes with no stage digit (`E.01` … `TWA.03`, the same ten from Stage 1 to
Stage 6); the leading digit in every page's codes (`1E.01`) is the extractor's,
and every page's grown-up panel says so. `validate-curriculum-framework.mjs`
was widened (filename glob, `TWA` in `CODE_RE`) to read it, and passes with all
eleven framework files.

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # every lesson in app.config.json; refuses on a bad code or relationship
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
node   $K/drive-lessons.mjs         --app .    # every step of every lesson, in Chromium; add --width 375

# recorded narration and the lecture videos (see the kit README)
node   $K/drive-lessons.mjs  --app . --trace t.json   # what the pages actually say
node   $K/narrate.mjs        --app . --trace t.json --dry   # characters first: ElevenLabs bills per character
node   $K/narrate.mjs        --app . --trace t.json         # record only what is missing
node   $K/build-lectures.mjs --app .                  # then rebuild the pages so the lecture step picks it up
node   $K/check-narration.mjs --app . --trace t.json  # the narration gate
node   $K/deploy-media.mjs   --app . --upload         # MEDIA FIRST
node   $T/deploy.mjs                --app .    # then the pages; plan only without --upload
```

`build-lessons.py` writes each page from scratch, so re-running it throws the
pipeline's wiring away and the pipeline has to be re-run. Deliberate — same
rule as every sibling build.

## What a lesson is

Eight lessons, one formal element or process each, every one anchored on
things a five-year-old can touch; 15 to 17 steps each plus the sticker shelf
(6 to 9 of the lesson's own, plus the eight of the unit shell, which here
includes a journal):

| lesson | about | steps | objectives | the machine the child drives |
| --- | --- | --- | --- | --- |
| 1 Marks and Lines | line, the tools | 15 | 6 | draws five kinds of mark with five tools on a real canvas; sorts lines; reads a cave wall |
| 2 Colour Magic | colour, tone | 15 | 7 | predicts and mixes five pairs of pots, then any two; orders five tones by lightness; sorts warm from cool; reads a cloth |
| 3 Feel the Texture | texture, materials | 15 | 7 | sorts by feel; watches a rubbing; puts rice, flour, sugar and water in the paint; chooses the material for four purposes |
| 4 Shapes and Patterns | shape, pattern | 15 | 6 | sorts by shape; continues three patterns and invents one that must repeat; reads a tiled wall; draws a circle, a zigzag and dots |
| 5 Make It Stick | joining, model making | 15 | 6 | chooses the join for four jobs; mends three models by changing the right thing; orders a pinch pot |
| 6 Looking at Art | art from other times and cultures | 17 | 6 | reads a mask and a dot painting; sorts six cards into both / only one; says a kind, true word about four friends' pictures; orders the night's tones; makes the artists' marks |
| 7 My Picture, My Idea | ideas, media for a feeling | 16 | 7 | chooses the paint for five feelings; adds wool, dries the sky, shows the wind; draws the wind; tries sand and glue in the paint; celebrates three ideas |
| 8 Our Gallery | reflecting, the whole year | 15 | 6 | sorts a gallery by colour; compares two pictures; praises art from far away; readies three pieces for a show; looks back over every lesson's journal |

Nineteen step kinds, one renderer each in `lib/art.js` — the kit README has
the table. The Art-and-Design-shaped ones are the machines where the art is
done on the screen rather than told:

- **The mixer** asks for a prediction, then the child taps the two pots and
  the bowl swirls to the colour the kit's own table gives (red and blue make
  purple; white tints, black shades). A wrong prediction is not marked wrong:
  "You said orange. Look: red and blue made purple!" — seeing it is the lesson,
  which is Cambridge's own example verbatim. The last round is free, and what
  it makes goes in the journal.
- **The canvas** takes a real pointer. Each round wants a KIND of mark — straight,
  wavy, zigzag, dots, long, a circle — and the page judges the stroke by its
  geometry, then says what to try ("A wavy line goes up and down, gently, like
  the sea"). The tool changes the mark: a pencil is thin and grey, a brush wide
  and red, a sponge dabs, chalk is dusty. The free drawing at the end is stuck
  in the journal as a thumbnail.
- **Materials have properties and purposes need one.** Sandpaper is rough, so
  it fits a tree trunk; foil is shiny, so it fits a fish; a wrong pick says what
  the material IS like. The same rule gives the join for a job in Lesson 5 and
  the paint for a feeling in Lesson 7.
- **Refining is trying a change and seeing what it did.** The wheels fall off
  the box car: paint them red and they still fall off; glue them and they stay.
  The pot's crack closes when wet fingers smooth it; the flat hair goes fluffy
  when wool is stuck on, and the picture redraws.
- **Comparing and praising are set arithmetic on what a picture contains.** A
  card goes in "both have it" or "only one has it" by the two works' features; a
  kind comment counts only if it names something that is in the friend's
  picture ("I love your boat" is kind, and there is no boat).
- **Every lesson ends with a journal** that reads the page's own record of what
  the child made — the mix, the marks, the pattern, the material, the fix —
  asks which they made first, and what they would change next time. The last is
  never marked. Lesson 8's journal reads every lesson's record.

## Recorded narration and the lecture videos

Every lesson is heard in a recorded voice, and every lecture is a captioned
video (2026-09-11, fixing the validation report's multimedia finding).

| | |
| --- | --- |
| clips | 2,214 sentences, `media/tts/<cyrb53>.mp3`, ElevenLabs `XfNU2rGpBa01ckF309OY` (the platform's own runtime voice) |
| cost | 73,030 characters sent in three runs (71,276 + 1,665 top-up + 88) |
| heard from recordings | 1,725 of 1,725 spoken lines in a full run with Explain pressed on every step (100%; gate floor 99%) |
| lecture videos | 8, 55–63 s each, 897–1,020 KB, 21–29 WebVTT captions each, poster per lesson |

The lecture step is now the video, with the part-by-part lesson kept
underneath as its transcript ("Read it part by part instead"). A line the
page composes that has no recording (a score, a wrong-path sentence nobody
traced) goes to the voice engine whole, which on the platform is the same
speaker. `media/tts/scripts.json` holds the words of every clip, for a person
listening back.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0067 does
not publish for Stage 1 and, on a full build, refuses to finish if any of the
10 is reached by no step. It also reads `lib/art.js` and refuses to build if
the page's colour and texture tables have drifted from `_rules.py`'s.
`check-coverage.py` then asks the BUILT pages (`data-objectives` on every
slide, and the `LESSON` JSON inside them) the same question, plus what only
shipped bytes can answer: every quiz key single, every sort bin present, a
per-lesson objective floor that may rise and not fall, the page's own tables
equal to the rules' — and **78 relationships re-computed from the shipped data
rather than trusted**, through the same `_rules.py` the builder used: five
mixes against what the pots make, two tone ladders against their swatches'
lightness, three pattern rounds against their own repeat, thirteen purposes
against the materials that fit, seven paint experiments against the texture
table, two comparisons, ten kind-comment rounds, nine refinements, fourteen
mark rounds against the checks and tools the page carries, five sources against
their spots, and all eight journals' records.

Mutation-tested twenty-two ways on 2026-09-10, each restored byte-identical and
verified against a snapshot taken before the first mutation, with the harness
refusing to start on a red tree: a lesson losing a shared objective from every
slide (so only the floor can catch it), an unpublished code, a quiz with no key,
a sort into a missing bin, a mix keyed to a colour the pots do not make, a tone
ladder reversed, a pattern round whose sequence does not repeat, a purpose every
material fits, a purpose none fits, a comparison card in neither picture, a
comparison with no "both" card, a kind comment about nothing in the work, two
kind comments about it, a piece no change fixes, an experiment keyed to the
wrong texture, a mark round naming a check the page lacks, a mark round using a
tool the step does not offer, a journal with nothing made, a page whose MIX
table drifted from the rules, a scene the page does not draw, a lesson under its
floor, and a source question naming no spot. All twenty-two caught, twenty
distinct failure lines (the two comment mutations share one, as do the two mark
mutations), and the gate passes again on restore. One mutation had to be
rewritten before it meant anything: removing a code from ONE slide survived,
correctly, because the shell steps carry every code of the lesson and the
lesson's set did not shrink — the mutation was wrong, not the gate.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys, the sort verdicts and the explainers were
authored, not computed. Nothing here has had a human reading.

## Things that will bite

- **`lib/deck.js` is stored UNWIRED, and that is load-bearing.** The shared
  progress step patches `finish()` and `show()` by matching their exact text
  and only matches the unwired shape. Do not add the hooks by hand.
- **Do not name a pipeline tool's filename anywhere that ends up in a page.**
  Each tool's filename is its own idempotence marker.
- **Every renderer draws at load**, because the deck paints all its slides
  and hides them. `window.__ehelPainting` silences the draw pass; a step that
  speaks on arrival does it through `ONSHOW`.
- **Nothing waits on `requestAnimationFrame`**; the swirl and the tile pop are
  CSS animations.
- **The canvas is never rebuilt mid-stroke.** The first version replaced the
  SVG from `outerHTML` on every pointer move, which dropped the pointer capture
  and let a stroke end unjudged. The live stroke is one `<path>` updated in
  place. Found by the driver, not by reading.
- **A reversal is an accumulated bend.** The first stroke judge counted a crest
  only when a single sample turned more than 8°, and a smooth wave never does,
  so no wavy line was ever wavy. Also found by the driver, on its first run.
- **Media before pages.** `deploy-media.mjs` then `deploy.mjs`: a page asks
  only for clips its index lists, and the index goes up last, after every clip
  has read back identical from storage. Reversing the order is how a page
  requests a path that does not exist yet, and that 404 is edge-cached.
- **Wording changes re-record.** A clip is named for its exact sentence, so
  editing a line leaves the old clip orphaned and the new one unrecorded until
  `narrate.mjs` runs; `check-narration.mjs` fails on both. Prune orphans with
  `--prune` only alongside `--trace` and the templates, or a clip reachable
  only by a button the run never pressed goes with them (it happened: eight
  lecture titles).
- **Playwright's Chromium cannot play the videos** (no H.264/AAC), so the
  driver presses *I watched it* and ignores the aborted request; playback is
  checked in Edge.
- **Two spots on one picture must not overlap** (34px glyphs, so keep centres
  60px apart): the mask's carved lines and its dots did, and a real click could
  not land on one of them.
- **The five platform modules 404 in local dev** — `learner-controls.js`,
  `wehel.js`, `course-shell.js`, `seb-session.js`, `progress-client.js` — as
  in every sibling build. The lesson works without them; class controls, Wehel
  and progress reporting do not. Those five 404s are the only console errors a
  healthy page shows.
- **Sound needs a gesture.** The synthesiser creates its AudioContext on the
  first tap.
- **Routing has FOUR parts, not three, and the fourth is in the plugin.**
  `pqpg_ehel_app_base()` only recognises a course key whose slug is in
  `pqpg_ehel_subject_map()` (`progress_gatewaylib.php`), and the launch door,
  SEB and the gateway all ask it. So beside the catalogue entry, the course
  and the `repoint-grade.php` row, the `art` slug has to be on the box, or
  `ehel-art-g01` is not an EHEL course at all. `check-tutoring-anchor.php`
  pins the subject count and the per-subject stage counts; both moved with
  this. See [GO-LIVE.md](GO-LIVE.md).

## Progress: `u01`..`u08`, and why

Written under `u01`..`u08` beneath `ehel-art-g01`. THE UNIT PROBLEM (see
`wire-progress.py`) does not arise here: the catalogue's `ehel-art-g01` is
generated FROM this build's lesson list (`tools/generate-ehel-catalog.js`, the
`ART` family), so the eight grade items ARE the eight lessons and a finished
lesson is a finished unit. Every sibling build writes `lNN` because its shell
course has a different unit list; this subject has no shell course.

## Going live

The app is uploaded and verified (`deploy.mjs --upload`, 2026-09-10) and the
catalogue carries the course, but a learner reaches it only after the Moodle
side is done — the launch door has to learn the `art` slug, the sync task has
to create the course, and the override has to route it. The exact steps, with
the staged files and their hashes, are in [GO-LIVE.md](GO-LIVE.md).

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 10/10 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 78 relationships
  re-computed. `validate:frameworks`: the new framework file passes with every
  other one.
- Every one of the 50 inline scripts (classic and module) parses under
  `node --check`.
- In the browser (`drive-lessons.mjs`, Playwright Chromium against
  `tools/serve-src-preview.js`, four contexts at a time), every step of every
  lesson was driven to completion by a player that plays each kind the way a
  child would — the colour the pots make, real mouse strokes on the canvas, the
  bin the item belongs in, the material that fits, the change that fixes, the
  comment that is about the picture, the journal in the order things were
  made: all eight lessons ended at 100% on the header with every dot ticked and
  "Every sticker!" on the shelf, 134 to 185 seconds each, at 1100px and again at
  375px. The only console errors were the five platform-module 404s. At 375px
  no step of any lesson overflowed horizontally.
- **That driving found three defects reading did not**: the wave that was never
  wavy, the canvas rebuilt mid-stroke, and the two overlapping mask spots — all
  fixed before the final run. It also found two defects in the driver itself
  (a pair tile's text is its "?" back plus its face; a `has` locator must be
  page-rooted), which is why a driver failure is a claim about the driver
  first.
- Reading level, measured on all learner-facing text: 8.0 to 10.4 words per
  sentence; Flesch-Kincaid grade 2.1 to 3.8 (Lesson 8, which sums the year, is
  the highest). Every line is read aloud by the voice engine, so the level is a
  ceiling, not a gate. No US spellings.
- Narration and video, 2026-09-11: every lesson driven again at 1100px and
  375px, still 100% with every sticker and no overflow; 1,725 of 1,725 spoken
  lines played from recordings; the lecture videos played with captions in
  Microsoft Edge 152, locally and live from the CDN. `check-narration.mjs`
  mutation-tested thirteen ways (a missing, unlisted or truncated clip; words
  that hash elsewhere or are absent; another voice; an empty index; a drifted
  `cyrb53`; a caption file that is not WebVTT; a missing video; an unrecorded
  lecture sentence; coverage under the floor; a trace with no floor) — thirteen
  caught, thirteen distinct lines, every file restored byte-identical.
- Deployed: 2,240 media files (78.7 MB) read back identical from storage, then
  the 9 pages, then booted live.

## What was deliberately not done

The Moodle-side steps (they need the box: see GO-LIVE.md); anything at Stage
2; saving
a child's drawing anywhere (the journal lives in the page and is gone on
reload, which the journal's own wording allows for); a human reading of the
content.
