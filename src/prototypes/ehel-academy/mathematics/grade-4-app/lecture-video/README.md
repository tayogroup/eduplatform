# The unit lecture film

`shape-and-measures.mp4` (poster `.jpg`, captions `.vtt`) does not exist yet —
building it is free up to the point of buying narration. Built by
[`tools/create-ehel-math-unit-lecture.js`](../../../../../../tools/create-ehel-math-unit-lecture.js)
from `shape-and-measures.json`, the storyboard beside it. Modelled on Science's
Bones and Muscles film (`science/grade-4-app/lecture-video/`), which is worth
reading first — this file only records where Maths had to depart from it and
why.

```bash
T=tools/create-ehel-math-unit-lecture.js
node $T --app src/prototypes/ehel-academy/mathematics/grade-4-app --slug shape-and-measures --dry        # characters + objective coverage, buys nothing
node $T --app ... --slug ... --preview                                                                   # a still per beat + both cards, buys nothing
node $T --app ... --slug ... --calibrate                                                                 # buys the 3 longest clips, reports the real speaking rate
node $T --app ... --slug ...                                                                             # narrate, render, mux
```

**State, 2026-09-18 (after the fix pass below):** storyboard at 13 scenes, 38
beats, 4,532 characters, all **10** of the lesson's objectives covered by a
teaching scene. **No ElevenLabs narration has ever been bought for this film.**
A render DOES exist beside this file — 5:14, made at 01:46 with `--draft`, the
free Windows SAPI voice — and it is now stale: it predates every fix below and
still says the two false sentences. It is a draft, not the film. Do not deploy
it, and note that `deploy.mjs` reads the working tree, so a Grade 4 Maths
deploy from a checkout holding it WOULD ship it: `app.config.json` already
lists all three files and the page already carries the player.

## Why this could not be "run the Science tool against a different app"

Science's tool has two properties this lesson does not:

- **`science.js` exports pure, DOM-free drawing functions** (`FIGURES.skeleton`,
  `armSvg`) that the tool slices out character-for-character and re-runs
  headless, so the film's skeleton and arm literally cannot drift from the
  lesson's own artwork — the render refuses if they ever disagree.
- **One focused topic**, six scenes.

`c-shape-slides.js` (Grade 4 Maths' whole-lesson build) has neither. Its
solids, angle wedge, symmetry lines and grids are small closures
(`paint1`, `d10_drawAngle`, `paint3`, `paint6`, …) that read module-level
mutable state and write `$("id").innerHTML` in the same breath — there is no
pure function to import. And the lesson teaches nine Cambridge 0096 4Gg codes
across eleven steps, not one story.

**Owner-equivalent decision taken here, 2026-09-18** (the user asked before
any spend; this is the scoping call made in that conversation, recorded the
way this repo records owner decisions): every shape in
`tools/lib/ehel-math-lecture-scenes.js` is **redrawn fresh** — matching the
lesson's own numbers, vocabulary and dark theme, but not lifted from its code
— and the film covers **all ten teaching steps** (skipping only the extension
items, the check, the reflection and the stickers screen, the same way a quiz
is never narrated). That is why this tool carries no art-extraction step and
no drift check: there is nothing to compare against. The cost is the one thing
Science's gate buys that this cannot — a redrawn solid could silently stop
matching the lesson's if the lesson's own art changes. Nothing currently
checks that; flagged, not built.

## Two scenes that looked right and were not, caught by preview stills before anything was bought

**Perimeter must not be drawn as a filled grid.** The narration explicitly
warns "the distance all the way round the outside, not the space inside," and
the first cut of the perimeter scene reused the area scene's filled-rectangle
renderer with different numbers — visually identical to the area scene one
chapter earlier, undermining the sentence it sits under. `gridScene()` now
takes a `border` field (a rect outline, gold, no fill) as well as `fillA`; the
perimeter scene uses `border`, area and compound use `fillA`/`fillB`.

**The irregular-shape outline and its whole/part colouring must come from the
SAME shape, or the lesson lies about its own picture.** The first cut hand-
placed nine "whole" and six "part" grid cells and drew an unrelated hand-drawn
blob path over them; several "part" cells sat entirely inside the outline and
two sat entirely outside it — exactly the confusion the scene exists to
teach a child to avoid. `blobCells()` now classifies every cell by the same
point-in-polygon method the lesson's own `newBlob()` uses (five probes per
cell), against one **fixed** set of polygon points rather than `newBlob`'s
`Math.random()` — fixed so a re-render draws the identical leaf every time,
which a storyboard beat's numbers ("nine whole squares... twelve part
squares") depend on staying true. It resolves to 9 whole and 12 part squares;
the narration was written to that, not to a rounder-sounding guess.

A third, smaller fault of the same shape: the net scene's SVG was wrapped in
an extra `<div>` carrying the fade opacity, which broke `.figure svg`'s
`height:100%` (the percentage resolves against that wrapper's own, undefined,
height) and rendered nothing at all. Fixed by putting the opacity directly on
the `.figure` element, the same way every other scene in this file does it.

None of these three would have been caught by `--dry` — it only counts
characters and objective codes. They were caught by looking at the actual
`--preview` stills before spending anything, which is the whole reason that
flag exists.

## The objective text IS checked against the framework

This section used to say that 0096 "is not published anywhere in this repo", so
the objective wording here was only "a citation of convenience" copied from the
Wehel-tutoring units. **That was stale when it was written.**
`src/curriculum/cambridge-mathematics-0096.json` entered the repo on 2026-09-07
(`519f4cfa83`), eleven days earlier. The belief came from
`mathematics/CLAUDE.md` :: "The Cambridge Mathematics framework, and the 0096
hole", which still says Stages 1-6 have no framework and was never updated when
the file landed.

All ten objective texts in `shape-and-measures.json` were compared with 0096 on
2026-09-18 and **all ten match it verbatim**. So the wording is verified, not
borrowed — though nothing gates it, so re-run that comparison if either side
changes.

## The lesson's own dark theme, read independently

Both films draw from the same underlying palette (`--ground:#0B1D2C`,
`--accent:#E9744F`, `--teal:#35BFB2`, …) because both subjects' lesson pages
carry the identical "Wehel design language" block, copied from Grade 1 Maths
into each subject's own stylesheet and marked as such in both places. This
film's CSS (`tools/lib/ehel-math-lecture-film.css`) reads the values from
`mathematics/grade-4-app/g4-lesson.css`'s forced-dark block
(`:root, :root:not([data-theme="light"]), :root[data-theme="dark"] { ... }` —
not the file's first, superseded `:root`), not from Science's film CSS, even
though the numbers end up identical.

## How the film reaches the page, and why it is a plain `<video>` and not a content-model field

Science's `LESSON["video"]` is a field in a Python content-model dict
(`content/lesson-1.py`) that `lesson-kit/_shell.py` writes into the built
page's `lecture` step, and `science.js :: lecture()` renders the player only
inside that step, with its own watched/progress tracking. **Grade 4 Maths has
no equivalent pipeline.** Its lessons are hand-assembled from
`shape-body.html` + `new-shape-body.html` (real, tracked sources) through
`compose-lessons.py` (produces the gitignored `c-shape-body.html`) through
`build-lessons.py` (produces `shape-and-measures.html`), and the committed
`shape-and-measures.html` additionally carries a further layer of
platform-wiring (self-hosted fonts, the back-to-hub link, learner-controls,
Wehel, launch-token wiring) that is **not** reproduced by running
`build-lessons.py` alone — confirmed the hard way: running it in isolation
during this work silently regenerated all eight Grade 4 lessons back to a
pre-wiring state, stripping real, deployed functionality. That run was not
committed; `git checkout --` restored all eight files before anything else
was touched.

So the film is wired in as a plain `<video controls playsinline preload
="metadata">` block with a `<track kind="captions">`, sitting above the deck,
never inside a step — no watched state, no "I heard it all" gating, just a
player. It was added in **two places that must be kept in sync by hand**:

- `c-shape-body.html` — the gitignored, disposable intermediate. Editing it
  directly was tried first and reverted (`python compose-lessons.py`
  regenerates it from the real sources, wiping a hand-edit silently); recorded
  here so the next session does not repeat it.
- The real tracked source, `shape-body.html`, was **deliberately left
  untouched**. It is the donor for TWO lessons (`compose-lessons.py ::
  SRC = {"shape": "shape", ...}` — both `shape` and `where` draw their shared
  header/`head` from this one file), so adding the video block there would
  also add a Shape-and-Measures video player to `where-things-are.html` the
  next time anyone runs the full compose → build → wire pipeline. Doing this
  properly needs `compose-lessons.py` taught to gate the block by lesson key,
  which is a real change to a shared tool and was out of scope for adding one
  film. Flagged, not done.
- `shape-and-measures.html` (the committed, deployable output) was hand-
  patched directly with the identical markup and CSS, so the live artifact
  and the source agree even though the intermediate build step cannot
  currently reproduce that agreement on its own. **A future full rebuild of
  this lesson (compose → build → wire) will silently drop the video block**
  until `shape-body.html`/`compose-lessons.py` are updated as above — check
  for the `<div class="lecture-film">` block after any such rebuild.

`app.config.json :: extraPages` lists the three film files so a deploy
carries them, mirroring Science's gate — but **Maths' `build-lessons.py` has
no equivalent refusal** for a lesson naming a film that is not on disk and
listed (Science's does, in `lesson-kit/build-lessons.py`). Nothing here
enforces that a future deploy actually carries all three files; check by hand
before deploying. `deploy.mjs :: ctype()` already knows `.mp4`/`.vtt`/`.jpg`
(added for Science, shared by every app under `lesson-app-tools/`), so no
deploy-tooling change was needed.

## What it covers — taught, not merely cited

The lesson claims **ten** objectives. `--dry` proves a code is NAMED by a scene
and nothing more, the same limit recorded for every citation gate in this repo,
so each row below says what the narration actually does:

| scene | objective | what is delivered |
| --- | --- | --- |
| The faces of a solid | 4Gg.05 | cube, square-based pyramid, cylinder — flat faces, edges, vertices, and the curved-surface exception |
| Fold it up: nets | 4Gg.06 | the cross net folding into a cube, **then six squares in a straight line that cannot** — a tube with no top and no bottom. Matching needs a net that does not match |
| Every line of symmetry | 4Gg.07 | square (4), triangle (1), parallelogram (0 — the shape that looks symmetrical and is not) |
| Reflect it in a mirror line | **4Gp.03** | each square goes straight across and lands the same distance away; the image is flipped, not slid; the mirror line as the shape's own edge; then a horizontal line |
| Acute, right or obtuse? | 4Gg.08 | classify all three; **estimate** one against a right angle; **compare** two, where the one with the longer lines is the smaller angle |
| Putting shapes together | 4Gg.01 | two right-angled triangles make a rectangle, a square only when the short sides match; six EQUILATERAL triangles make a regular hexagon; hexagons tessellate, circles do not |
| Area without counting | 4Gg.02, 4Gg.03 | count fifteen squares, then **derive** length × width from the rows: five in each, three rows, five times three |
| All the way round | 4Gg.02, 4Gg.03 | perimeter as a boundary; add the four sides; then **derive** the formula from two lengths and two widths |
| Two rectangles, one area | 4Gg.02 | an L split into two rectangles, the areas added |
| An odd shape on a grid | 4Gg.04 | whole squares, part squares counted as halves, and said to be an estimate |
| Reading between the marks | 4Gg.09 | a jug scale read with fractions: three quarters of a hundred is seventy-five |

One thing is deliberately left as it was: the angle scene labels its angles in
degrees (90°, 35°, 130°) and the narration says "exactly ninety degrees". The
lesson never teaches degrees — every "degree" in `shape-and-measures.html` is an
SSML `styledegree` attribute or a code comment — and no Stage 4 or 5 objective in
0096 mentions them. It is not wrong, so it was not changed in a fix pass, but it
teaches a unit the lesson does not. An owner's call.

## The fix pass, 2026-09-18

The first storyboard covered nine objectives, stated two false rules, and taught
three of its objectives only in part. Every fix was checked against the drawing
it describes before it was written into a sentence.

**4Gp.03 was never in the list to cover.** The storyboard gathered the lesson's
objectives as "nine Cambridge 0096 4Gg codes"; the lesson claims ten, and the
tenth sits in a different sub-strand — `4Gp`, position — so a search keyed on
the prefix walked past it. The earlier notes also skip "the reflection" as a
non-teaching screen, and in lesson furniture that word usually means the
think-about-your-learning step; either would drop a geometric reflection step.
New scene `reflect`, new renderer `sceneReflect`. Its shape is an **L**, because
on a symmetrical shape a reflection and a slide draw the same picture.

**Two false generalisations, spoken as rules.** "Two identical right-angled
triangles... make a square" — in general they make a rectangle. "Six triangles
fitted round a point make a regular hexagon" — only equilateral ones. **The
drawings were already right** (legs 130 and 130; six triangles on a radius of
78 at 60°), which is exactly why these read fine on screen: the child hears the
rule, not the drawing. Narration only; no picture changed.

**Three objectives taught in part.** 4Gg.03 asks for formulae to be DERIVED; the
old script asserted length × width after a count and had no perimeter formula
at all. 4Gg.08 is estimate, compare AND classify; it only classified. 4Gg.06 is
matching nets to solids, with one net and nothing to match against.

**How the geometry was checked, and the check's own bug.** `reflectCells` was
run as the real function, sliced out of the renderer, against every claim the
narration makes: same distance both sides, opposite sides, on the grid, and
that squares move by DIFFERENT amounts (a flip) rather than the same amount (a
slide). Then it was broken twice on purpose — an off-by-one and a slide — and
caught both (4 and 5 failing checks). The first attempt at those negative
controls reported both as MISSED: the harness passed a Windows path through
sed, which read the `\U` in it as "uppercase the rest", so the mutated run
crashed on ENOENT and `grep -c FAIL` counted zero failures in a crash. A catch
that fires on a crash is the failure this repo keeps recording. The rebuilt
harness counts a crash as BROKEN, never as missed.

**What this does to length, and it is not small.** 4,532 characters at the
13.96 a second measured for these voice settings is about **5:45** with the
cards — against 3:34 for Bones and Muscles, and a brief of "short, about three
minutes". The first storyboard was already about 4:20. Covering ten objectives
properly costs time, and cutting to three minutes would mean teaching some of
them only by citation again. The lesson's own title offers the obvious seam:
**Shape** (solids, nets, symmetry, reflection, angles, tessellation) and
**Measures** (area, perimeter, compound, irregular, scale), as two films of
about three minutes each. That is an owner's call, not taken here.

## Deploying it

Not done, and not requested. Once narrated and rendered, the three files
belong in `Ehel Primary/app/mathematics/grade-4-lessons/lecture-video/`
alongside the lesson, via the same `lesson-app-tools/deploy.mjs` path Science
uses — no deploy-tooling change needed, `extraPages` already lists them.
