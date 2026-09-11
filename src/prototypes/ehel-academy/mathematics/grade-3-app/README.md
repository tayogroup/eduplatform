# Grade 3 Mathematics — the standalone lesson build

Eight self-contained lesson pages plus a hub, on the model of `../grade-1-app`:
each carries its own CSS, its own activity JS and its own copy of the voice
engine, and none of it goes through `shell/course-app.js`.

Unlike Grade 1 and Grade 2, these are **built from fragments** rather than
hand-edited. `src/` is the source; the eight lesson `.html` files beside this README are
generated from it and are also committed, because they are what deploys and a
deploy must not depend on a shell that can run bash.

```bash
src/build-all.sh                              # rebuild all eight AND re-wire them
python ../lesson-app-tools/check-lessons.py   # the shared gate
node checks/check-runtime.mjs                 # all eight over HTTP — see below
node checks/check-l1.mjs                      # ... l2 l3 l4 l8, per-step maths
node checks/check-hub.mjs
node checks/check-a11y.mjs                    # all nine pages, both themes
node convince/check-convince.mjs              # the "How do you know?" step
node checks/check-audit.mjs                   # codes from src/curriculum — see below
```

`check-runtime.mjs` needs the tree served over HTTP and the platform modules
staged beside the lessons, because an ES module import cannot work from a
`file://` page whatever is on disk:

```bash
node checks/stage-local-modules.mjs           # gitignored copies, for testing only
# then serve src/ (tools/serve-src-preview.js, port 4287)
```

`src/build-all.sh` reproduces all eight committed lessons and the hub **byte-identically**,
which is the only thing that makes `src/` genuine source rather than a copy that
has drifted. Re-check that after any change to a fragment.

**The platform wiring is part of that build**, and that is deliberate. Every
tool in `../lesson-app-tools` patches a BUILT lesson in place, and these lessons
are generated — so wiring applied by hand after a build is silently discarded by
the next one. That is the trap CLAUDE.md records for Mathematics, where ~20
repair tools edit built units in place and a rebuild overwrote 125 of them. So
`build-all.sh` runs the wiring tools itself: a rebuild re-applies the
wiring instead of losing it, the tools stay the one shared definition of what
wiring is (the same five that wire Grade 2, then the page tools and the hub's
grown-up section since 2026-09-11), and build+wire is still byte-for-byte
reproducible. All of them are idempotent — verified, a second run of the set changes
no byte.

## 2026-09-11: the validation, and what changed because of it

In the fragments under `src/` (`src/fix-validation.py`) and the build chain, so
`src/build-all.sh` carries all of it:

- **A failed check has somewhere to go.** Below its pass mark (4 of 6, 5 of 7,
  7 of 10 - unchanged) a check used to say "Finished! 3 out of 7." and stop. It
  now says how many are needed and offers **Try again**, which restarts it with
  fresh questions. One `retryCheck` in `src/_shell.js`, beside `say()` - not a
  copy per lesson, because `check-judging.py` reads a window around each step
  and a copy beside the step before the check made "Try it and see" look as if
  it marked answers.
- **Two Stage 4 wordings are gone.** Measure It named angles *acute* and
  *obtuse* (4Gg.08); 3Gg.10 is comparing with a right angle, so it says smaller,
  the same or bigger. Ask, Count and Chart said *unlikely*, *impossible*, *most
  likely* and "How likely is ...?" (4Sp.01) beside Stage 3's will, might and will
  not (3Sp.01); it says it in those words, and so does its hub card.
- **The page tools run in the chain**: doctype and `lang`, feedback announced,
  skip link and main landmark, 24 px dot cells on a phone, fonts from our CDN,
  the "Can't hear it?" notice - and focus mode, which the rebuild picked up.
- **"For teachers and parents" on the hub** — objectives, steps, the check and
  its pass mark (its questions are generated, so there is no fixed key to print,
  and the page says so), one thing to try at home; minutes on every card.
- The hub note said "these five lessons"; it says eight and all 53 objectives.
- `checks/check-hub.mjs` expected 5 cards and `checks/_platform-modules.mjs`
  knew four platform modules - both stale since the split and focus mode. Fixed,
  and every checker here passes.

The report's claim that this build "drills the 7 times table" was wrong: TABLES
is 1-6, 8, 9 and 10, exactly as 3Ni.07 lists them.

## Eight lessons, not five (2026-09-07)

The build shipped as five, and two of them were portmanteaus: *Up to a Thousand*
carried 17 teaching steps across four Cambridge strands and *Sides, Sizes and
Seconds* carried 17 across three — 31 of the 53 objectives between them — while
the other three carried 8 to 11 steps and one strand each. Grade 2 gives younger
children 9 lessons averaging ~12 steps; Grade 3 was giving older children 5, with
two at 17.

That is not only untidy. **The lesson is the progress unit**, so a teacher reading
the live group board saw "in Up to a Thousand" for a child who might be at place
value or at giving change, 17 steps apart; the unit gate made a child finish all
17 before reaching money; and a tutoring search for "giving change" landed on a
lesson named after place value.

| unit | lesson | steps | strand |
| --- | --- | --- | --- |
| 1 | Up to a Thousand | 11 | number and place value |
| 2 | Adding, Taking Away and Money | 6 | calculation, money |
| 3 | Rows and Rules | 11 | times, sharing, patterns |
| 4 | Equal Parts | 9 | fractions |
| 5 | Shapes and Symmetry | 8 | geometry |
| 6 | Measure It | 5 | measurement |
| 7 | Time and Direction | 4 | time, position |
| 8 | Ask, Count and Chart | 10 | statistics, chance |

**Not one teaching step was rewritten.** The split falls on seams that already
existed — the `/* ---- N: name ---- objective */` markers and the matching slide
sections — so every step keeps its markup, narration, element ids and activity
code. What changed is which file a step lives in, the `finish()` index it
reports, and which check questions and stickers travel with it. `src/split-lessons.py`
did it and is kept for provenance.

**Element ids are deliberately NOT renumbered.** Unit 2 keeps `fb12`..`fb17`
rather than becoming `fb1`..`fb6`: they only have to be unique within one page,
and renumbering would mean rewriting the slides and the content in step, which
buys a whole class of silent mismatch for cosmetics.

**The Convincing claims moved rather than being rewritten**, and that doubled as
a check on the seams: a claim with nowhere to go would mean a cut in the wrong
place, and none was. 17 were newly authored to bring every bank back to six.

**11 check questions were authored, and one gap predates the split**: the old
lesson 1 had no check question on column addition or column subtraction, its two
hardest steps.

## Status: built, wired, gated, ON THE CDN, NOT routed

| | grade-1-v2 | grade-2-app | here |
| --- | --- | --- | --- |
| deck, `finish()`, stickers | ✓ | ✓ | ✓ |
| voice engine (platform TTS + fallback) | ✓ | ✓ | ✓ |
| launch params read and carried across links | ✓ | ✓ | ✓ |
| design template + ink tokens | ✓ | ✓ | ✓ |
| `course-shell.js` | ✓ | ✓ | ✓ |
| Class chat / Hand up / Join class | ✓ | ✓ | ✓ |
| Wehel | ✓ | ✓ | ✓ |
| progress reported to the group board | ✓ | ✓ | ✓ |
| `check-lessons.py` (the shared gate) | ✓ | ✓ | ✓ |
| the two header bars | ✓ | ✓ | ✓ |
| deploy path | own `deploy.mjs` | shared | shared |
| **on the CDN** | ✓ | ✓ | ✓ `grade-3-lessons`, since 2026-09-09 |
| **a learner can reach it** | ✓ routed | ✓ routed | **no** — Grade 3 is routed to the shell course |

The header is the one deliberate difference, and it is the wiring tool's own
decision rather than a gap: Grade 1 has a two-bar header from its own build,
this build and Grade 2 have a hero, and `wire-platform-controls.py` says porting
that header "would be a design change nobody asked for — a container is all the
contract requires". The controls sit in a `.hero-right` wrapper the tool adds.

**This section said "NOT deployed" until 2026-09-11, and it had been wrong for two
days.** It was measured on 2026-09-07 — storage then held no `grade-3-*` path —
and the build was uploaded to `Ehel Primary/app/mathematics/grade-3-lessons` on
2026-09-09 without the sentence moving. The 2026-09-11 validation found it there.
What IS still true is the part that matters to a child: the Moodle override map,
read on the server on 2026-09-11, has no `ehel-math-g03` entry, so Grade 3
learners are sent to the shell course and **no learner reaches this build**. A
deploy here is a deploy to a path nobody opens until that setting changes. (The
table above said Grade 2 was not on the CDN and not routed; it has been both
since 2026-09-09. And the header row said "hero": `build-all.sh` has run
`add-header-bars.py` since the day it was found missing.)

Routing, when it happens, is one Moodle setting —
`local_prequran/ehel_app_url_overrides`, read by `pqpg_ehel_app_base()`, host-locked
to `ehelacademy.b-cdn.net` — through the staged-script + cPanel Terminal loop, on
run by `../lesson-app-tools/repoint-grade.php --grade 3`. The course idnumber is
`ehel-math-g03`. The shell course at `app/mathematics/grade-3/` is untouched and
still serves Grade 3; this is an alternative to it, not a patch on it.

## Coverage: 53 of 53 Stage 3 objectives

Against Cambridge Primary Mathematics **0096** (2020). 45 were already covered
by the five lessons; 8 were gaps filled by this work — 3Nc.06, 3Ni.09, 3Nf.08,
3Gt.01, 3Gt.04, 3Gg.04, 3Gp.02, 3Ss.02. `checks/stage-3-coverage-audit.html` is
the write-up, published as an artifact for review.

**`checks/check-audit.mjs` reads the objective codes out of the framework rather
than from anything retyped, so a code the audit invents cannot pass.** Since
2026-09-11 it reads them from the committed extraction,
`src/curriculum/cambridge-mathematics-0096.json` — the file every other
Mathematics gate reads — so it runs on a fresh clone. It used to need `fw.txt`,
a `pdftotext -layout` dump of Cambridge's PDF that is deliberately **not
committed** (this repo holds structured extractions, never a reproduction of a
source document), and so it exited **2** — "could not run" — everywhere but one
machine; the validation found it that way. If `checks/fw.txt` is present it is
still read, and the two must agree or the checker exits 2.

## Thinking and Working Mathematically

Six of the eight characteristics are genuinely present. Two are not, and both
are recorded as they are rather than rounded up:

- **Convincing is approximated.** Every lesson ends with a *How do you know?*
  step: a true claim and three reasons for it, of which one does the work and
  the other two are either the misconception the lesson teaches against or
  something perfectly true that explains nothing. A tap deck cannot ask a child
  to *produce* a justification, so this asks them to recognise one. Recognising
  a good reason is a weaker act than giving one, and calling it coverage would
  report something nobody measured.
- **Conjecturing is still thin**, deliberately. Closing it needs the learner to
  form a question rather than pick one, and every device this deck has would
  again be a picker — the same substitution with less of the characteristic
  surviving it.

## The design template: only half of it applied here

`../grade-1-app/align-g1v2-to-template.py` brought Grade 1 onto the Grade 2
template: re-solved `--accent`, the `--teal-ink` / `--plum-ink` / `--gold-ink`
tokens, and a list of chip selectors whose text stops being hardcoded white.

**Only the token half applies here, and that was measured rather than assumed.**
That script's own header warns that "colouring text for a background it does not
sit on is how the first pass of this change broke two things it had not
measured", and Grade 3 draws different components. Measured across all 79 slides
of all five lessons in both themes (`checks/probe-chips.mjs`):

- Of Grade 1's eight chip selectors, Grade 3 has three, and two of those
  (`.card .pos`, `.machine .box.mystery`) draw no visible text anywhere.
- The one that does — `.chiprow button.on` — **already paints `rgb(6, 35, 31)`,
  which is `#06231F`, exactly `--teal-ink`**, written as a literal. It reads
  7.29:1.

So Grade 3 needs none of the chip rules. What it takes from the template is the
palette block alone, and that is what landed.

The wiring that used to be missing here is now done, by the shared tools, from
inside `build-all.sh`. The ordering those tools enforce is worth knowing before
touching it: launch params BEFORE the controls, because `mountHandRaise` and
`mountClassChat` mount nothing without `launchToken` and `launchEndpoint`, so
wiring the controls first makes them look broken when they are only unreachable.

## The Convincing step is in `convince/`, and half of it has not landed

`convince/banks.py` carries **two** banks. `G3` is applied and verified here.
`G1` is not applied to `../grade-1-app` and must not be assumed to be: the step
was built and verified against copies downloaded from the CDN, and the repo
copies are ahead of those by the template-alignment block, so the patch would
need re-applying to the repo files and its intactness checker re-pointing at
them. That is another lane's call.

`convince/check-convince.mjs` therefore checks Grade 3's five always, looks for
the step on Grade 1's five, and prints **NOT CHECKED** when it is absent — an
unlanded half is never counted as a pass.

## What the wiring is NOT known to do

`check-lessons.py` proves the lessons are WIRED — the modules are imported and
preloaded, `.top-actions` exists, the mount calls are there with the right unit
number, and the launch parameters survive every in-app link. It does not prove
the controls RENDER, and nothing here can.

Hand up and Class chat mount only when the server answers `watched` — this
learner is in an active class group with a teacher on it — and Wehel needs a
launch token. From a `file://` page with no token there is nothing to see, by
design: the same rule that stops a tutoring learner working alone at night being
offered a button that reaches nobody. So the accessibility sweep's 0 findings
covers the pages as a child working alone sees them, not the controls in their
mounted state.

Proving those takes a real launch against the platform, which needs the build on
the CDN and the route pointed at it — i.e. it cannot be done before deploy, only
after.

The local checkers cannot even load those modules. An ES module import is
impossible from a `file://` page whatever is on disk — Chrome allows module
fetches only over chrome, chrome-untrusted, data, http and https — so all four
fail to load in every run here. Rather than leave four expected errors as noise
in which a real one could hide, `checks/_platform-modules.mjs` filters them and
then asserts that **all four were blocked for exactly that reason**: if one stops
appearing, its import has been dropped from the page and nothing else would say
so. Mutation-tested by removing the `wehel.js` import from a lesson.

One gap in the shared gate, noted rather than fixed because it is another
build's tool too: `check-lessons.py` lists three modules in `MODULES`
(`learner-controls.js`, `wehel.js`, `course-shell.js`) when the wiring imports
**four**. `progress-client.js` is imported by `wire-progress.py`'s block and IS
carried by `deploy.mjs`, so nothing is broken — but the gate's "a page importing
a module the deploy does not carry" check does not cover it, and that failure
mode is a 404 on a module specifier which takes the whole script with it.

## What the split left owed

**Units 5, 6 and 7 have no bespoke maths checker.** The old lesson-4 checker is
the only thing that recomputed the geometry, unit-conversion and time-interval
maths independently of what the page claims — the kind of assertion that has
caught real defects here. It could not be split automatically: it uses a
different section-comment style from the others and two of its `go()` calls take
a variable rather than a literal (the whole-deck loop, and the UNITS table), so
an automatic split would have dropped its measure assertions or retargeted them
at the wrong slides without saying so.

It is kept, not deleted, under `checks/superseded/` with a README saying plainly
that it does not run. Until it is ported by hand those three units are covered by
`checks/check-runtime.mjs`, which walks every slide, exercises the check step and
catches runtime errors — but answers with the page's own `dataset.right`, so it
does **not** verify the maths. That gap is real.

Units 1, 2, 3, 4 and 8 keep their per-step maths checkers
(`checks/check-l1..l4,l8.mjs`), ported by index remap.

## Measured, not assumed

- **Contrast**: `checks/check-a11y.mjs` reports **0 findings** across all six
  pages, compositing every translucent layer down to the first opaque one, so a
  `rgba(255,255,255,.07)` panel is not treated as a white background.
- **No 375px overflow** on any lesson or the hub.
- **Keyboard**: tabbed for real rather than inferred from the DOM — no tab stop
  lands on a hidden slide.
- **The Convincing step exercises 30 distinct claims** across the five lessons,
  each verified in both outcomes, with the score line and the sticker checked.

## One instrument bug worth keeping

The Convincing step was inserted immediately before each sticker shelf — the one
position that moves no existing index, since every `finish(i)` refers to a slide
before it. But `show()` paints the shelf only while it is the active slide:

```js
paintDots(); if (cur === slides.length - 1) paintStickers();
```

The five lesson checkers still navigated to the *old* last index, so they landed
on the new step, the shelf never painted, and they read 0 earned stickers —
which looks exactly like "the learner earned nothing" and was in fact "nobody
opened the shelf". The sticker *counts* in those same files had already been
updated, which is why precisely one assertion failed per lesson. They now derive
the index from the DOM, so the next inserted step cannot repeat it.
