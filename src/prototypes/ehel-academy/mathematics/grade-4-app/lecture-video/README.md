# The unit lecture film

The film is `shape-and-measures.5a6a619a.mp4`, with poster
`shape-and-measures.29644ff7.jpg` and captions `shape-and-measures.vtt`. The
film and poster are named by their contents; see "New names for a new render".
Built by
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

**State, 2026-09-18, end of day:** storyboard at 13 scenes, 38 beats, 4,532
characters, all **10** of the lesson's objectives covered by a teaching
scene. **The film is narrated, rendered and live.**

- **11:39:** another session bought the 38 clips.
- **12:17:** it committed a 5:53 film, wired as described below
  (`a4964756fb`).
- **12:19:** it deployed the film (storage timestamp 09:19 UTC).

That first render read as a slideshow, so the animation pass (below)
re-rendered it the same evening from the SAME clips, with nothing re-bought.
The new render ships under new, content-named files, because this CDN never
lets a re-render reach learners under its old name.

Earlier the same day, a 5:14 `--draft` render (the free Windows SAPI voice)
was wired into the page before the fix pass. It was pulled before anything
was committed or deployed, and it is parked on the machine that made it, in
`.cache/ehel-lecture-draft-renders/maths-g4-shape-and-measures/`.

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
chapter earlier, undermining the sentence it sits under. The perimeter
scene now draws the storyboard's `border` field as an outline and never fills
it; area and compound use `fillA`/`fillB`. Since the animation pass each of
the three has its own renderer (`sceneArea`, `scenePerimeter`,
`sceneCompound`), and the shared `gridScene()` is gone.

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

**The wiring is in place.** It was pulled once, because it pointed at a stale
`--draft` render. Once the film was really narrated, `a4964756fb` put it back
exactly as below. Since the animation pass, the film and its poster go by
content-named files; see "New names for a new render". There are three edits:

- **`shape-extra.css`**: the `.lecture-film` rules below. `build-lessons.py`
  inlines `<css>-extra.css` into the page's `<style>`, so this is the real source
  of the CSS half, and that half DOES survive a rebuild. It is shared, like
  `shape-body.html` below: `LESSONS` gives both `shape` and `where` the `shape`
  CSS, so the rules also reach `where-things-are.html`. They do nothing there,
  because that page has no `.lecture-film`. The first account, below, never
  mentioned this file.
- **`shape-and-measures.html`**: the same rules, plus the block below. The block
  goes directly after the hero `</header>`, above the deck.
- **`app.config.json :: extraPages`**: add the film, its captions and its poster after
  `lesson-search.json`, by their current names: `shape-and-measures.5a6a619a.mp4`,
  `shape-and-measures.vtt` and `shape-and-measures.29644ff7.jpg`.

```html
<div class="lecture-film">
  <video controls playsinline preload="metadata" poster="lecture-video/shape-and-measures.29644ff7.jpg" src="lecture-video/shape-and-measures.5a6a619a.mp4">
    <track kind="captions" srclang="en" label="English" src="lecture-video/shape-and-measures.vtt">
  </video>
  <p class="lec-note">Watch the lesson, then go through it a part at a time below.</p>
</div>
```

```css
.lecture-film { margin: 0 0 16px; }
.lecture-film video { width: 100%; display: block; border-radius: 20px; background: #000;
  box-shadow: var(--shadow); aspect-ratio: 16 / 9; }
.lecture-film .lec-note { margin: 8px 2px 0; font-size: 13px; color: var(--muted); }
```

**Watch for this before re-wiring: `--draft` writes the same three filenames as
a real render.** Once the wiring is back, a free draft run puts a robot-voiced
film straight into what a deploy sends. Wire only after the real render, and
play the file before deploying it.

So the film was first wired in as a plain `<video controls playsinline preload
="metadata">` block with a `<track kind="captions">`, sitting above the deck,
never inside a step — no watched state, no "I heard it all" gating, just a
player. That first account follows. Its traps still apply, and it is where the
places that must be kept in sync by hand are explained:

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
- `shape-and-measures.html` (the tracked, deployable output) was hand-
  patched directly with the identical markup and CSS. That patch was never
  committed and never deployed, and it has been removed (see above). **A future full rebuild of
  this lesson (compose → build → wire) will silently drop the video block**
  until `shape-body.html`/`compose-lessons.py` are updated as above — check
  for the `<div class="lecture-film">` block after any such rebuild.

`app.config.json :: extraPages` must list the three film files so a deploy
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

## The animation pass, 2026-09-18

The owner watched the first render and asked for more animation, like Bones
and Muscles. That render changed a scene's picture at each beat boundary and
then held it still while the voice went on, for up to fourteen seconds. Every
scene now moves while it is being described:

| scene | what moves |
| --- | --- |
| solids | the solid sways in three-quarter view, and its faces, edges and corners light as they are COUNTED, with the count running in the panel; the pyramid tips up to show its base; the cylinder tips over to show its bottom circle |
| nets | the cube opens out flat and closes again, hinge by hinge; the six squares are numbered and fold up with the numbers on; the strip rolls into a tube, then stands on end to show "no top" and "no bottom" |
| symmetry | the shape folds along each line and lands on itself, in green; the parallelogram is folded twice and fails twice, in red |
| reflection | every square crosses the line at the same speed, so the near squares land first: a flip, not a slide. Brackets show "the same distance", arrows show the foot turned round, and in the edge case both halves flap like wings |
| angles | the arm turns; a dashed right angle and a dashed straight line are the yardsticks; the estimate shows ½ and no number; angle A's arms stretch while its turn stays the same |
| tessellation | the second triangle slides in along the long side; six triangles swing in round a point; the hexagon spreads into a floor; the circles are re-packed and their gaps light up |
| area | the squares are counted 1 to 15; the rows light in turn; the length and width brackets are drawn as they are said |
| perimeter | a walker goes round the edge; the fence goes in a metre at a time as each side is said, with the sum running; the short way turns a length and a width over onto the other two sides |
| compound | the L is split along a cut, each part is measured, and the parts are put back together |
| irregular | the leaf draws itself onto the grid; the whole squares are counted, then the part squares, each marked ½ |
| scale | the scale is built mark by mark; the water rises; three quarter-steps are counted out, 25, 50, 75 |
| recap | each card lights as its topic is named |

**Timed to the words, not the beat.** Bones and Muscles lights a bone when its
beat starts. That is too coarse here, because "Six faces … Twelve edges, and
eight vertices" is one clip. So each beat may name phrases in `art.at`, and
the renderer's `cue()` places each one in time by where it falls in the
sentence. Characters are spoken at a near-steady rate, and punctuation adds a
pause. The renderer checks every phrase against its beat's narration when it
loads, so rewording a line stops the render with the beat named, instead of
quietly mistiming the picture. A cue map is `art`, which the clip cache does
not hash, so adding one costs nothing.

**Four things were wrong in the live film, not just static:**
- The 130° obtuse arm ran off the left edge of its own picture. Only a stub of
  the angle the beat is about was ever on screen.
- The square's ⟋ diagonal sat 5px off the true diagonal. Nothing showed it
  until the square had to fold along it and land on itself.
- The recap lit all eight cards in its first half-second and then held them
  for eighteen.
- The estimate beat printed "45°" beside "about half a right angle", which
  makes estimating look like reading a number. It now shows ½ against a
  dashed right angle, and no number. The other angles keep their degree
  labels: whether the film shows degrees at all is still an owner's call (see
  above).

**Checked by looking, at every cue, before rendering.** `--preview` takes one
still per beat, and one still cannot show motion. So a sampler took 205
frames, one at each cue, into a contact sheet per scene. The sheets caught
six faults, all fixed before the render:
- **The solid's turntable came round face-on during "Twelve edges".** It now
  sways within a three-quarter view.
- **The triangle's fold outlasted its 3.7-second beat.**
- **A "no gaps" glow behind the hexagons lit the empty corners too**, which
  read as gaps. The tile edges light instead.
- **The grids were too small to read the counting numbers.**
- **The perimeter's "then double it" swung through the middle of the
  garden.** The length-and-width pair turned about the centre, so it crossed
  the inside and poked out past the edge. It is now drawn again along the
  other two sides.
- **The compound shape's total crowded the small square.**

A render that has STARTED will not pick up a fix: the tool inlines the
renderer into its page when it begins. One render was stopped and restarted
for the last two faults.

**It cost nothing.** The narration did not change, so all 38 clips came from
the cache. The render also ran with a deliberately invalid ElevenLabs key, so
a clip that somehow was not cached would have stopped it with a 401 rather
than bought it.

### New names for a new render

The first render is live at `lecture-video/shape-and-measures.mp4`. Bunny
serves that stable path from Perma-Cache, and re-uploading it in place does
not reach learners: different edge nodes keep different old copies
(`tools/version-lecture-video.js` records the English case that proved it).
So the new film and its poster are named by their contents,
`shape-and-measures.<first 8 hex of sha1>.mp4` and `.jpg`, and the page and
`extraPages` point at those. A path nothing has ever asked for cannot be
stale. The old files stay on storage for any cached page that still asks for
them. **Every future re-render needs the same treatment.** The tool writes the
fixed name, so rename the output before wiring it.

## Deploying it

The files live in `Ehel Primary/app/mathematics/grade-4-lessons/lecture-video/`
beside the lesson. They go up through `lesson-app-tools/deploy.mjs`, the same
path Science uses, and only if `extraPages` lists them. The first render went
out on 2026-09-18 at 12:19.

**`deploy.mjs` uploads media before any page, and that order is
load-bearing.** A page that goes live pointing at a film storage does not hold
yet lets a learner's request cache a 404 for that path, for up to a year (see
`version-lecture-video.js --salt`), and a content-named film is always such a
path at first.

The tool did NOT do this until the animation pass. Its `data()` counted only
`.js` and `.json` as things to send ahead of the pages, and `extraPages` sits
last in the plan. So the first render's deploy put the page live and then
sent the 17MB film after it. Whether anyone opened the page in that window is
not known. Never upload a page by hand ahead of its film, and before
`--upload`, read the plan: it is the working tree that ships.
