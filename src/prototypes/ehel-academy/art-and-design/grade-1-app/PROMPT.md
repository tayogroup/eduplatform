# The prompt this build was made from (improved)

The request arrived as one sentence, with the framework PDF attached:

> Build a new Curriculum Framework Cambridge Primary Art & Design 0067,
> modeling the design/style/UI after english/grade-1-v2, with interactive
> content, interactions with kids, visual examples, and experimentation, and
> demonstration, strength, and quality after the new math, and science. Build
> the content using the Curriculum Framework Cambridge Primary Art & Design
> 0067. Create an improved prompt.

Below is the version that states what that sentence assumes, what it leaves
open, and the checks that decide whether it was done. It is the Global
Perspectives build's prompt (`global-perspectives/grade-1-app/PROMPT.md`) with
the Art-and-Design-shaped parts stated, and it is written so it can be reused
for Stage 2 by changing the named things.

---

## Build Cambridge Primary Art & Design 0067 for Ehel Academy: the framework file, a lesson kit, and the Stage 1 course

### What to build

Three things, in this order, because each is what the next one reads:

1. **The framework file** `src/curriculum/cambridge-art-and-design-0067.json`,
   extracted from the published PDF by a new
   `tools/extract-cambridge-art-and-design-framework.py`, in the shape every
   other `src/curriculum/cambridge-*.json` has, so `npm run
   validate:frameworks` reads it. Art & Design is unlike every framework
   already there in two ways the extractor and the validator must both state:
   - **Cambridge prints codes, but no stage in them.** The ten objectives are
     `E.01`–`E.03`, `M.01`–`M.02`, `R.01`–`R.02`, `TWA.01`–`TWA.03`, and the
     PDF says in so many words that "the same set of learning objectives is
     used through all of the primary and lower secondary stages". The repo's
     convention is `<stage><strand>.<nn>`, so the file publishes `1E.01` …
     `1TWA.03` under every stage 1–6, `recurring: true`, each `sharedWith` the
     other five, and `codeScheme` records that the stage digit is Ehel's and
     the rest is Cambridge's. The strand IS the sub-strand, as in Computing
     0059.
   - **What differs by stage is the progression text**, one paragraph per
     objective per stage PAIR ("Stages 1 and 2", "3 and 4", "5 and 6"), and
     that is the only thing an author has to write a Stage 1 lesson from. Store
     it on every objective as `progression`, so the file carries what the
     content is pitched against rather than only the wording that never
     changes.
   - `validate-curriculum-framework.mjs` must be widened in two places — the
     filename glob (`art-and-design`) and `CODE_RE` (`TWA`) — and must still
     pass every other framework file.

2. **A lesson kit** at `src/prototypes/ehel-academy/art-and-design/lesson-kit/`,
   the Global Perspectives kit's shape as a separate copy, on purpose: copy
   `lesson.css`, `voice.js` and `deck.js` verbatim (same sha1 as the four
   sibling kits'), and give the subject its own `art.js`, `art.css`,
   `_rules.py`, `_kit.py`, `_shell.py`, `build-lessons.py`, `build-hub.py`,
   `check-coverage.py` and README. Do not teach `global-perspectives/lesson-kit`
   a second subject: a Global Perspectives grade is live on it, and a change
   here must not be able to reach a live page of another subject.

3. **The Stage 1 course** at `art-and-design/grade-1-app/`: `app.config.json`
   and `content/lesson-N.py` in the kit's vocabulary, built into one
   self-contained HTML page per lesson plus a hub, then wired by the shared
   pipeline in `mathematics/lesson-app-tools/` and gated by its
   `check-lessons.py`.

**Design, style and UI: the English Grade 1 build's, which is the Mathematics
build's.** The dark Wehel palette, the deck, the dot rail, the gold action
colour, the voice bar, the two header bars from the shared tool, the sticker
shelf. Subject styles go in `art.css` and introduce no hue: gold is the
action, teal is the voice and the taught thing, coral is the thing being
pointed at, plum is a second series, good/bad are the only verdicts. The one
place colour is CONTENT — the paint pots, the mixed colour, the tone ladder,
the swatches of a pattern — draws it inside an SVG or a swatch element, never
as a new token.

**Interaction strength and quality: the Mathematics, Science, Computing and
Global Perspectives builds'.** Every step is a machine the child drives, not
a page they read — and in this subject the machine is the ART done for real
on the screen: two paint pots are tapped and the mixed colour appears,
computed, not authored; marks are made on a canvas with a real pointer and the
page can tell a wavy line from a straight one and dots from a stroke; swatches
are put in order from light to dark and the order is computed from the
colours' own lightness; a pattern is continued and then invented, and the page
checks that an invented pattern repeats; a material is chosen for a purpose
because its PROPERTY is what the purpose needs; two artworks are compared and
"the same" and "different" are computed from what each one contains; a kind
comment about a friend's work has to name something that is actually in the
work; a painting with a problem is refined by the change whose effect is what
it needs; and the journal at the end of every lesson is read from the child's
OWN record of what they made a few minutes earlier. Where the child's own
feeling or idea is the answer, the page marks nothing and reads it back.
Each step has the four-move authored explainer behind Explain and a `data-say`
line spoken on arrival. Sound is synthesised; nothing is recorded.

### The content: Cambridge Primary Art & Design 0067, Stage 1, all of it

- Stage 1 has **10** objectives across four strands: Experiencing (3), Making
  (2), Reflecting (2), Thinking and Working Artistically (3). Every step names
  the codes it exercises, the builder refuses a code the framework does not
  publish for the stage, and a gate on the BUILT pages fails if any of the ten
  is reached by no step.
- Pitch every lesson against the **Stages 1 and 2 progression text**, which is
  concrete: formal elements met and discussed (texture, line, tone, colour,
  pattern, shape); media explored spontaneously — water-based paints and
  brushes, chalks, clay, scissors and glue; joining and connecting in model
  making demonstrated; gathering as sorting and ordering by a formal element;
  recording as mark making and a visual journal; simple choices from a prepared
  selection to represent an object or a feeling; textures of paint made by
  adding rice, flour, sugar or water; "Let us try mixing red and blue. What
  happened?"; "Why wouldn't those two items join together?"; similarities and
  differences between works with a reason; collage added to a painting to show
  texture; comparisons of quality between children's work AVOIDED.
- Organise by **formal element and process, each anchored on things a
  five-year-old can touch** — eight lessons: marks and lines; colour and
  mixing; texture and the feel of materials; shape and pattern; joining and
  making a model; looking at art from different times and cultures; an idea
  made into a picture from a stimulus; and a gallery that looks back over the
  course. "Art from different times and cultures" is drawn in the kit as
  scenes IN THE MANNER of traditional and ancient art (a cave painting, a
  woven basket, a patterned cloth, a carved mask, a tiled wall, a dot
  painting) — never a copy of a named living artist's work.
- Language: British English, five-to-six-year-old reading level, the learner
  addressed as "you", one idea per sentence. Every wrong pick says what the
  child's choice WAS (what colour that made, what that material is like),
  never just "no". Home projects are make-and-look-shaped (mix real paint,
  make a rubbing, sort the pebbles, look at a cloth), because Stage 1 Art is a
  hands-on-with-a-grown-up subject and the screen cannot replace the paint.

### The shapes that are the point

- **Colour mixer (E.02, M.01, R.02):** two pots tapped, a prediction asked,
  the mix shown; the result is `mix(a, b)` in `_rules.py`, mirrored in
  `art.js`, and the builder refuses a round keyed to a colour the mix does
  not make.
- **Mark maker (E.03, M.01):** a canvas the child draws on with a pointer,
  with tools that change the mark (pencil, brush, sponge, chalk, finger); a
  round asks for a KIND of mark — long, short, wavy, zigzag, dots, thick,
  thin — and the page judges the stroke by its own geometry. The checks are
  named in `art.js` and the builder refuses a round that names one it does
  not have. Marks are written to the page's journal.
- **Tone ladder (E.01, E.03):** swatches ordered light to dark; the right
  order is computed from lightness, never authored.
- **Pattern maker (E.01, TWA.01):** continue a pattern, then make your own;
  the page accepts an invented pattern only if it repeats.
- **Choose for a purpose (M.02, TWA.02):** materials carry properties; the
  purpose names one; the fit is computed, like Global Perspectives'
  `solutions`.
- **Same and different (R.02):** two works with feature tags; the child sorts
  cards into "the same" and "different" and the answer is the set arithmetic.
- **Kind comment (R.01):** comments carry an `about`; a comment fits a work
  when its `about` is one of the work's features — the language of art, used
  about something that is there.
- **Refine it (TWA.03, R.02):** a piece with a problem; changes carry an
  effect; the one whose effect the problem needs fixes it, and the picture
  updates.
- **Paint experiment (TWA.02, E.02):** predict, add rice / flour / sugar /
  water, see the texture, say whether it matched — the Science kit's
  experiment shape, with the outcome table in `_rules.py`.
- **My journal (R.01, TWA.03), drawn by `_shell.py` at the end of every
  lesson's own steps:** what the child made this lesson, from the page's own
  log (with the builder's fallback if the steps were skipped), the order they
  made them in, and what they would change next time — the last never marked.

### Wiring and progress

- `app.config.json` describes the build for the shared tools;
  `progressUnitPrefix` is `l` (THE UNIT PROBLEM in `wire-progress.py`);
  `courseKey` is `ehel-art-g01`. **No such course exists yet** in
  `catalog.json` or on the Moodle box — Art & Design is a new subject for the
  platform, not a new grade of an existing one — so say so in the README:
  progress written under that key reaches nobody until a course carries it.
- Run, in order: `build-lessons.py`, `build-hub.py`, then `wire-navigation`,
  `wire-platform-controls`, `preload-platform`, `wire-progress`,
  `add-header-bars`, `check-lessons`, then the kit's own `check-coverage.py`.
- Do NOT deploy. `deploy.mjs --app .` plans; `--upload` is an owner decision,
  and routing needs a course and a `repoint-grade.php` row that do not exist.

### Definition of done

1. `validate:frameworks` exits 0 with the new file among the rest, and the
   file publishes 10 objectives under each of stages 1–6 with progression
   text on every one.
2. `build-lessons.py` builds 8 pages with 0 refusals and reports 10/10.
3. `check-lessons.py` and `check-coverage.py` exit 0.
4. Every inline classic script parses under `node --check`.
5. The gate is mutation-tested and each of these must fail it, with the pages
   restored byte-identical afterwards and verified against a snapshot taken
   before the first mutation: a lesson losing an objective, an unpublished
   code, a quiz with no key, a sort into a missing bin, a mix keyed to a
   colour the pots do not make, a tone ladder whose authored order disagrees
   with lightness, a pattern round whose answer does not continue the
   pattern, a purpose no material fits or every material fits, a comparison
   whose "same" card is in only one work, a kind comment about nothing in
   the work, a problem no change fixes, a paint experiment keyed to the wrong
   texture, a mark round naming a check the page does not have, a journal
   fallback with nothing made, a lesson under its floor.
6. Each lesson is opened in a browser from a static server and every step is
   driven to completion, marks drawn with a real pointer; the dot rail, the
   header progress and the sticker shelf agree. The only console errors are
   the five platform modules that 404 in local dev by design. No step
   overflows at 375px.
7. A README beside the build says what it is, what is generated, what will
   bite, and what was deliberately not done; the kit's README says what is
   computed rather than trusted.

### What is deliberately out of scope

Deploying; routing a learner; creating the Moodle course or the catalogue
entry; recorded narration (the voice engine speaks); anything at Stage 2+;
saving a child's drawing anywhere (the journal lives in the page); a human
reading of the content.

---

### Why the original sentence needed this

- "Build a new Curriculum Framework" is two things here, because unlike the
  four subjects before it Art & Design had NO framework file in the repo: the
  extraction is part of the job, and its two oddities (stageless codes,
  progression by stage pair) have to be decided before a single lesson can
  name a code.
- "modeling the design after english/grade-1-v2" and "quality after the new
  math and science" are one instruction, because the builds share one design
  and differ only in what the child drives. Art has no arithmetic and no
  programs; it has MATERIALS and their properties, COLOURS and what they
  make, MARKS and their shapes — so the machines are those relationships,
  computed, and the gate re-computes them from the shipped bytes.
- "experimentation, and demonstration" in this subject is exactly what the
  framework's own Stage 1–2 text asks for — mix red and blue and see, add
  rice to paint and see, try to join two things and see why they will not —
  so it is stated as objectives with codes, which is what lets a gate say
  whether it was done.
- The one thing a screen cannot do is be paint. Every lesson therefore sends
  the child to real materials at home, and the README says so rather than
  pretending the canvas is a brush.
