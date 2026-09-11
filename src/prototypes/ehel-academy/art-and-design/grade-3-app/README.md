# Grade 3 Art & Design — the standalone lesson build

The third grade of the Art & Design course, built on the same generator as
Grades 1 and 2 (`../lesson-kit`) and in the same design: self-contained HTML
pages, one per lesson, each carrying its own CSS, activity JS and voice
engine. Read [`../grade-1-app/README.md`](../grade-1-app/README.md) first;
everything it says about the kit, the pipeline, recorded narration, the videos
and what bites holds here unchanged. This file records only what is Grade 3's
own.

**The content is Cambridge Primary Art & Design 0067, Stage 3 — all 10
learning objectives.** The catalogue's `ehel-art-g03` is generated from this
build's lesson list (`tools/generate-ehel-catalog.js`, the ART family reads
every `grade-N-app/app.config.json`), and progress is written under
`u01`..`u08`, for the reason Grade 1's README gives.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0067 codes |
| `app.config.json` | grade, stage, floors, hub strands, lessons, the starting check |
| `<slug>.html`, `g3-index.html`, `starting-check.html` | **GENERATED.** Do not hand-edit |
| `../data/placement/grade-3.json` | the starting check's questions, over Grade 2's content |

## The Stage 2 / Stage 3 line

Unlike the step from Stage 1 to Stage 2, Cambridge draws this one. The ten
objectives are still word for word the same, but Stage 3 is the first stage
with progression text of its own (written for Stages 3 and 4 together), and
most of Grade 3 comes straight out of its examples:

1. **A visual journal** (3E.03: "record the patterns found on the surfaces of
   different buildings and then developing this in a print design") — Lesson 1
   gathers patterns from a building and takes one from sketch to print.
2. **Graded pencils and charcoal for tone** (3E.02: "a range of graphite
   pencils of various hardness … charcoal could be used to capture tone") —
   Lesson 2, with a charcoal tool added to the kit for it.
3. **Changing a colour scheme or a scale** (3R.01: "simple alterations …
   such as changing a colour scheme or the scale of a component") — Lesson 3's
   refinements, and Lesson 8's.
4. **Clay taught further** (3E.02: "if learners were previously introduced to
   simple ways to manipulate clay, they would now be taught" more) — Lesson 4,
   a relief, after Grade 2's pinch pot and joins.
5. **One textile, three ways** (3TWA.02: "a simple textile design could be
   produced through weaving, sewing or by fusing materials together") —
   Lesson 5.
6. **A mural for an audience** (3TWA.01: "a mural design to enhance a wall")
   with mock-ups and peer review (3M.02) — Lesson 6.
7. **Named artists, and borrowing a technique** (3E.01: "discuss, trial or
   document the materials, techniques and processes that an artist has used,
   before applying these observations to their own work"; 3R.01: "the use of a
   technique or skill from the work of another") — Lesson 7.
8. **Success criteria and portfolios** (3R.02: "self-assessment against
   success criteria"; 3M.02: "visual journals and portfolios") — Lesson 8,
   where feedback grows from Grade 2's kind word into praise AND a next step.

## What a lesson is

| lesson | about | steps | objectives | the machine the child drives |
| --- | --- | --- | --- | --- |
| 1 My Sketchbook | visual journal, recording | 16 | 7 | reads a building's patterns; chooses how to record five things; sorts shapes by line; continues brick, arch, point and window patterns; orders sketch to print |
| 2 Light and Shade | tone, graded pencils, charcoal | 16 | 7 | watches H and B pencils; orders five tones light to dark; chooses the pencil for five jobs; reads a lit apple; sorts light, shade and cast shadow; draws pale and dark lines in pencil and charcoal |
| 3 The Colour Wheel | colour wheel, complementary colours | 15 | 7 | reads the wheel; mixes side by side and across it (opposites make brown, computed); sorts warm, cool and complementary schemes; chooses a scheme for four jobs; changes three schemes |
| 4 Clay Relief | relief, clay tools | 15 | 8 | watches a relief being made; sorts raised from pressed in; chooses the clay tool; fixes three reliefs; reads a Han dynasty picture brick |
| 5 Stitch, Weave or Fuse | textiles three ways | 16 | 10 | taps the three ways; orders running stitch; continues stitch patterns; chooses the process for four jobs; sorts woven, stitched and felted; reads a kantha cloth |
| 6 Murals and Messages | murals, audience, mock-ups | 15 | 6 | taps six murals and their jobs; orders the planning of a mural; chooses the picture for four messages; changes three mock-ups for their audience and place; reads a Ndebele-style house wall |
| 7 Learning from Artists | van Gogh, Hokusai, borrowing a technique | 15 | 7 | reads a swirling night sky and a great wave; connects them by what they share; borrows a swirl, a wave, dots and a far line; says whose idea each technique was |
| 8 My Portfolio | portfolio, goals, feedback | 14 | 5 | packs a portfolio; checks seven pieces against their goals; picks praise-and-a-next-step for four friends; changes one thing in three pieces; looks back over every lesson's journal |

Every lesson also carries the furniture Grades 1 and 2 validated: the keyboard
and switch route through the canvas, a good place to stop at the end of the
journal, a printable make-at-home sheet, two WHY questions in every quiz, and
grown-up notes naming the tradition or the artist behind every picture drawn
in the manner of one.

## New in the kit for Grade 3

- **Eight pictures** in `lib/art.js :: SCENES`: `buildings` (a street front's
  patterns), `stilllife` (an apple lit from one side), `colourwheel`,
  `relief` (a clay brick, the manner of Han dynasty picture bricks), `kantha`
  (running stitch, the manner of kantha from Bengal), `ndebele` (a house wall,
  the manner of Ndebele house painting, South Africa), `swirlnight` (the
  manner of Vincent van Gogh's The Starry Night, 1889) and `greatwave` (the
  manner of Katsushika Hokusai's Under the Wave off Kanagawa, around 1831).
  Every one is our own drawing, not a copy; the five that stand for a
  tradition or a named work carry grown-up notes in
  `build-hub.py :: TRADITIONS`. Both named artists are long dead and their
  works are in the public domain; the kit still draws its own pictures in
  their manner, as it does for every tradition.
- **A charcoal tool** (`TOOLS.charcoal`, width 12, so it clears the `thick`
  check the way the brush does).
- **Complementary mixes**: red+green, blue+orange and yellow+purple make
  brown, in `_rules.py :: MIX` and `lib/art.js :: MIX` together (the builder
  refuses to build if the two tables differ).

Grades 1 and 2 are rebuilt through the new kit and pass all three gates; the
new scenes, tool and mixes change nothing either of them teaches.

## Recorded narration and the lecture videos

Recorded the same way as Grades 1 and 2, in the same voice.

| | |
| --- | --- |
| clips | 2,181 sentences in `media/tts/`; before recording, every Grade 1 and 2 clip was copied in, 431 of them matched a Grade 3 sentence, and the 3,803 that did not were pruned afterwards (`narrate.mjs --prune --trace`) |
| cost | 70,193 characters sent (the `--dry` count exactly), no failures |
| lecture videos | 8, 42–62 s each, 15–24 WebVTT captions each, poster per lesson |

## Content review, 2026-09-11

An independent review of all eight lessons, the starting check and the new
grown-up notes, before recording. All six must-fix and all should-fix findings
are applied, among them: a clay join done on dried clay (a new piece is joined
while soft), the pencil grades (the number beside B darkens, beside H pales),
boats described with rowers the picture does not draw, a compare card a child
could rightly contest ("a mountain" is now "a snowy mountain"), joke wrong
options beside real cultures replaced with plausible ones, and the three
traditions credited where Lesson 8's classmates' work borrows them.

## Verification, 2026-09-11

`check-lessons.py`, `check-coverage.py` (10/10 objectives, 80 relationships
re-computed, every mark judged) and `check-narration.mjs --trace` exit 0 on
the final build. Driven in Chromium at 1100px (real strokes) and 375px (the
keyboard route): all eight lessons end at 100% with every sticker, no console
errors and no horizontal overflow; 1,725 of 1,733 spoken lines heard from
recordings (99.5%; floor 99); Stop for today keeps the next step; all eight
make-at-home sheets print on two A4 pages; the starting check bands all-right
as ready and all-wrong as not ready, with eight review links into Grade 2.

## Going live

Not done. See [GO-LIVE.md](GO-LIVE.md) for the three steps.
