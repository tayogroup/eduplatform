# Grade 2 Art & Design — the standalone lesson build

The second grade of the Art & Design course, built on the same generator as
Grade 1 (`../lesson-kit`) and in the same design: self-contained HTML pages,
one per lesson, each carrying its own CSS, activity JS and voice engine. Read
[`../grade-1-app/README.md`](../grade-1-app/README.md) first; everything it
says about the kit, the pipeline, recorded narration, the videos and what
bites holds here unchanged. This file records only what is Grade 2's own.

**The content is Cambridge Primary Art & Design 0067, Stage 2 — all 10
learning objectives.** The catalogue's `ehel-art-g02` is generated from this
build's lesson list (`tools/generate-ehel-catalog.js`, the ART family reads
every `grade-N-app/app.config.json`), and progress is written under
`u01`..`u08`, for the reason Grade 1's README gives.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0067 codes |
| `app.config.json` | grade, stage, floors, hub strands, lessons, the starting check |
| `<slug>.html`, `g2-index.html`, `starting-check.html` | **GENERATED.** Do not hand-edit |
| `../data/placement/grade-2.json` | the starting check's questions, over Grade 1's content |

## The Stage 1 / Stage 2 line

Grade 1's validation (report v1.2) asked for this before Stage 2 was written,
because Cambridge does not draw it: the ten Stage 2 objectives are word for
word the Stage 1 ten, and so is the progression text, which is written for
Stages 1 and 2 together. So the step up comes from content, and it is this.

1. **New processes the progression text names that Grade 1 did not use:**
   print, weaving, sculpture in the round, collage built from pieces, and
   technologies (a camera, a drawing app, a magnifying glass, a sound
   recorder).
2. **From telling to looking.** Grade 1 drew a kind of line when asked; Grade
   2 draws what is really in front of it (a leaf's vein, a pebble's roundness),
   and records movement as marks.
3. **From "what" to "why".** Grade 1 fixed a model by trying changes; Grade 2
   asks why it failed first ("Why wouldn't those two items join together?" is
   the progression text's own question), and sorts pairs by whether they will
   join.
4. **Choices on purpose.** Collage pieces chosen by colour (the progression
   text's own example), tints and shades chosen for a feeling, tearing or
   cutting chosen for the edge, a tool chosen for the job.
5. **Connecting, not only comparing.** Grade 1 compared two children's
   pictures; Grade 2 connects two artists' works from different places by the
   idea they share, and groups a year of work by how it was made.
6. **Longer patterns and darker colours:** a four-print repeat, shades as well
   as tints, a five-step ladder that runs into the darks.

Anything a lesson asks that Grade 1 already taught is revision on purpose (the
starting check, the quizzes), and is phrased as such.

## What a lesson is

| lesson | about | steps | objectives | the machine the child drives |
| --- | --- | --- | --- | --- |
| 1 Printing Patterns | print, repeat | 16 | 9 | watches paint-press-lift; sorts eight things by what they print; picks the printer for four pictures; continues printed patterns up to a four-print repeat and prints one; reads a stamped cloth |
| 2 Colours and Feelings | tint, shade, mood | 16 | 9 | mixes two tints, two shades and a green; orders five blues; groups seven pictures as happy, calm or stormy; chooses colours for four feelings; compares a day and a night painting |
| 3 Weave It | weaving | 16 | 9 | watches over-and-under; orders a paper weave; chooses what to weave with for four jobs; finds why three weaves fail and fixes each; reads a loom |
| 4 Clay and Sculpture | sculpture, joins | 16 | 7 | watches score and slip; sorts six pairs by whether they join, and why; makes three sculptures stand; chooses what to build from; reads a clay head from long ago |
| 5 Nature's Art | observation, texture, tone | 15 | 6 | sorts eight found things by feel; orders five autumn leaves by tone; draws a vein, a leaf edge, a pebble, a ladybird's dots and a stick from life; reads a leaf closely |
| 6 Cut, Tear and Stick | collage | 16 | 10 | watches tear-cut-overlap-stick; chooses five collage pieces by colour; decides tear or cut for six edges; adds texture, layers and shine to three collages; reads a folded paper cut |
| 7 Look, Snap and Move | cameras, apps, movement | 16 | 7 | chooses the tool for five jobs; orders taking a photo; sorts close-up from far away; turns five movements into marks; watches a flip book |
| 8 Our Art Corner | curating, connecting | 15 | 5 | groups a year of work by process; connects a printed cloth and a tiled wall; praises four artists truly; readies three pieces together; looks back over every lesson's journal |

Every lesson also carries Grade 1's validated furniture: the keyboard and
switch route through the canvas, a good place to stop at the end of the
journal, a printable make-at-home sheet, two WHY questions in every quiz (the
builder now refuses a quiz without them), and grown-up notes naming the
tradition behind every picture drawn in the manner of one.

## New in the kit for Grade 2

- **Five pictures** in `lib/art.js :: SCENES`, each in the manner of a
  tradition and copying no real work: `adinkra` (stamped cloth, Ghana), `loom`
  (a card loom, warp and weft), `terracotta` (a clay head, the manner of Nok,
  Nigeria), `leaf` (a leaf to draw from life), `papercut` (a folded paper cut,
  the manner of Chinese jianzhi). Four carry grown-up notes in
  `build-hub.py :: TRADITIONS`.
- **A starting check that reaches back a grade.** Grade 2's check tests Grade
  1's content, so its review lessons are Grade 1's: `build-check.py` resolves
  them from `../grade-1-app/app.config.json` and links `../grade-1-v2/<file>`
  (the sibling on the CDN), the gate and the driver accept the sibling link.
- **A quiz must carry two WHY questions**, enforced by the builder for every
  grade.

Grade 1 was rebuilt through the new kit and passes all three gates; its live
pages are one kit version behind until it is next deployed, with no change a
learner can see except the new scenes it does not use.

## Recorded narration and the lecture videos

Recorded the same way as Grade 1's, in the same voice (see its README).

| | |
| --- | --- |
| clips | 2,346 sentences in `media/tts/`, 446 of them copied from Grade 1 (identical sentences, identical voice: nothing bought twice) |
| cost | 77,583 characters sent, no failures |
| heard from recordings | 1,759 of 1,767 spoken lines in a full run with Explain pressed on every step (99.5%; gate floor 99%) |
| lecture videos | 8, 49–55 s each, captioned, poster per lesson |

## Verification, 2026-09-11

`check-lessons.py`, `check-coverage.py` and `check-narration.mjs` exit 0 on the
final build. Driven in Chromium at 1100px (real strokes) and 375px (the
keyboard route): all eight lessons end at 100% with every sticker, no console
errors and no horizontal overflow; Stop for today keeps the next step; all
eight make-at-home sheets print on two A4 pages; the starting check bands
all-right as ready and all-wrong as not ready, with six review links. One
desktop run, three lessons at a time, logged an AudioContext device error in
Colours and Feelings (twice across runs); the same lesson driven alone is
clean, and the page makes one AudioContext, so it is the headless audio
device under load, not the page.

## Going live

Not done. This build is gated, not deployed and not routed; see
[GO-LIVE.md](GO-LIVE.md) for the three steps.
