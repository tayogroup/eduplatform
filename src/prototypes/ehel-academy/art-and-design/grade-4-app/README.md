# Grade 4 Art & Design — the standalone lesson build

The fourth grade of the Art & Design course, built on the same generator as
Grades 1 to 3 (`../lesson-kit`) and in the same design: self-contained HTML
pages, one per lesson, each carrying its own CSS, activity JS and voice
engine. Read [`../grade-1-app/README.md`](../grade-1-app/README.md) first;
everything it says about the kit, the pipeline, recorded narration, the videos
and what bites holds here unchanged. This file records only what is Grade 4's
own.

**The content is Cambridge Primary Art & Design 0067, Stage 4 — all 10
learning objectives.** The catalogue's `ehel-art-g04` is generated from this
build's lesson list (`tools/generate-ehel-catalog.js`, the ART family reads
every `grade-N-app/app.config.json`), and progress is written under
`u01`..`u08`, for the reason Grade 1's README gives.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0067 codes |
| `app.config.json` | grade, stage, floors, hub strands, lessons, the starting check |
| `<slug>.html`, `g4-index.html`, `starting-check.html` | **GENERATED.** Do not hand-edit |
| `../data/placement/grade-4.json` | the starting check's questions, over Grade 3's content |

## The Stage 3 / Stage 4 line

Cambridge writes ONE progression text for Stages 3 and 4 together, word for
word the same — so unlike the step from Stage 2 to Stage 3, the framework
offers Grade 4 no new guidance at all, and the step up has to come from
content, the way Grade 2's did from Grade 1. It comes from the parts of that
shared text Grade 3 did not use:

1. **A print that becomes a collaborative textile** (4TWA.01: "an individual
   print that will then form part of a collaborative textile work") — Lesson 3,
   where the tile is printed in two colours that have to register, and is then
   sewn into a class cloth.
2. **Parts under stress need thicker card** (4M.02's own example, word for
   word) — Lesson 5, which asks where the force goes before it asks what to
   build with.
3. **A photographic diary of a build**, read back before the next one (4M.02:
   "use this to revise construction techniques for model making in a later
   project") — Lesson 5's closing step.
4. **Layers added to a painting by adding pen marks on top** (4TWA.01's own
   example of an original development) — Lesson 6.
5. **Comparisons across times and cultures, by media and by subject** (4E.01)
   — Lesson 7, which puts ONE subject, a person, in two materials from two
   places.
6. **Group work, and praise with guidance** (4TWA.03; 4R.01 "offer praise and
   guidance with confidence") — Lesson 8, a show hung by the whole class.
7. **An outcome reached several ways, with reasons** (4M.01) — Lesson 4 sorts
   pinched, coiled and slab-built pots, and Lesson 2 mixes rather than hunts
   for a tube.
8. **Measuring rather than looking** — Lesson 1 compares sizes with a pencil,
   puts the vanishing point on the horizon at eye level, and Lesson 7 measures
   a face.

## What a lesson is

| lesson | about | steps | objectives | the machine the child drives |
| --- | --- | --- | --- | --- |
| 1 Drawing What I See | perspective, proportion | 15 | 7 | watches one lamp shrink; reads a street for its vanishing point; sorts near from far; draws guide lines, a horizon and a dark near edge; orders a drawing |
| 2 Mixing to Match | matching a colour | 15 | 7 | mixes four real colours; orders a tone ladder; reads seven mixes for what was added; chooses the paint for four jobs; fixes three colours that are nearly right |
| 3 Print It Twice | two-colour printing | 16 | 7 | watches a two-colour print; reads a block-printed cloth; builds a repeat; chooses ink and surface; orders block to class cloth; mends three prints |
| 4 Coils and Slabs | building a vessel | 16 | 8 | watches a coil pot built; orders the building; sorts pinched, coiled and slab; chooses a surface finish; fixes three failed pots; reads a black-figure jar |
| 5 Build It Strong | structures, stress | 16 | 7 | watches card fail and hold; reads an armature; sorts what holds up; chooses a material per part; mends three models; orders a photo diary |
| 6 Layers on Top | mixed media | 16 | 6 | watches wash then pen; reads a layered picture; sorts under from on top; makes four pen marks over dry paint; chooses the missing layer; rescues three pictures |
| 7 Pictures of People | portraits across cultures | 15 | 6 | reads a cast head and a painted wall figure; compares them; names cast, painted and carved; fixes three faces by measuring |
| 8 Our Exhibition | curating, group critique | 16 | 6 | packs a show; reads a gallery wall; orders the getting-ready; keeps a theme; gives praise AND guidance; fixes three problems; looks back over the year |

Every lesson also carries the furniture Grades 1 to 3 validated: the keyboard
and switch route through the canvas, a good place to stop at the end of the
journal, a printable make-at-home sheet, two WHY questions in every quiz, and
grown-up notes naming the tradition or the work behind every picture drawn in
the manner of one.

## New in the kit for Grade 4

- **Eight pictures** in `lib/art.js :: SCENES`, every one our own drawing:
  `street` (one-point perspective), `blockprint` (the manner of Rajasthani hand
  block printing), `amphora` (the manner of ancient Greek BLACK-figure
  pottery), `armature`, `mixedmedia`, `bronzehead` (the manner of the brass
  heads of Benin City), `profile` (the manner of ancient Egyptian wall
  painting) and `gallery`. The four traditions carry grown-up notes in
  `build-hub.py :: TRADITIONS`.
- **A pen tool** (`TOOLS.pen`, width 3, so the `thin` check passes for it as it
  does for the pencil and `thick` cannot).
- Two narration tools now read `.html` pages only: `extraPages` stopped being
  all HTML when another session's lesson search added `lesson-search.json` to
  it, and both tools were parsing every entry for a LESSON block.

## Content review, 2026-09-12

An independent review of all eight lessons, the starting check and the new
grown-up notes, before recording. Every must-fix and should-fix is applied.
**Five of the eight new pictures did not show what the text beside them
said**, and two of those were not cosmetic:

- the jar was drawn in RED-figure (figures in clay colour on a black ground)
  while the lesson names black-figure four times and asks a quiz question
  about "the black figures" — redrawn, with the difference recorded in the
  code and in the grown-up note;
- the street stood every building on the horizon line, so the one picture the
  whole perspective lesson is read from had no recession in it at all —
  redrawn so bases step up the page, with detail on the near house that the
  far one does not have.

Also: the vanishing point is now taught where it belongs, on the horizon at
the learner's own eye level; the Benin heads are memorial heads rather than
portraits, which is the word specialists correct; the gallery hangs its work
at a visitor's eye height rather than two heights up; the Egyptian figure has
the nose and chin its hotspot asks a child to look at; "shade" is bridged
across its two meanings (Grade 3's dark side, Grade 2's colour-with-black);
"complementary" is back in the vocabulary; and Lesson 8 no longer hands three
heritage traditions to named classmates as their own work.

## Recorded narration and the lecture videos

Recorded the same way as Grades 1 to 3, in the same voice.

## Verification

`check-lessons.py`, `check-coverage.py` (10/10 objectives, 78 relationships
re-computed, every mark judged) and `check-narration.mjs --trace` exit 0.
Driven in Chromium at 1100px (real strokes) and 375px (the keyboard route):
all eight lessons end at 100% with every sticker, no console errors and no
horizontal overflow; Stop for today keeps the next step; all eight
make-at-home sheets print on two A4 pages; the starting check bands
all-right as ready and all-wrong as not ready, with eight review links into
Grade 3.

## Going live

Not done. See [GO-LIVE.md](GO-LIVE.md) for the three steps.
