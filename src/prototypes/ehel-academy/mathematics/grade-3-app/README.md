# Grade 3 Mathematics — the standalone lesson build

Five self-contained lesson pages plus a hub, on the model of `../grade-1-app`:
each carries its own CSS, its own activity JS and its own copy of the voice
engine, and none of it goes through `shell/course-app.js`.

Unlike Grade 1 and Grade 2, these are **built from fragments** rather than
hand-edited. `src/` is the source; the five `.html` files beside this README are
generated from it and are also committed, because they are what deploys and a
deploy must not depend on a shell that can run bash.

```bash
src/build-all.sh                       # rebuild all five from the fragments
node checks/check-l1.mjs               # ... l2 l3 l4 l5, one per lesson
node checks/check-hub.mjs
node checks/check-a11y.mjs             # all six pages, both themes
node convince/check-convince.mjs       # the "How do you know?" step
node checks/check-audit.mjs            # needs fw.txt — see below
```

`src/build-all.sh` reproduces all five committed lessons **byte-identically**,
which is the only thing that makes `src/` genuine source rather than a copy that
has drifted. Re-check that after any change to a fragment.

## Status: built, gated, NOT wired to the platform, NOT deployed, NOT routed

| | grade-1-v2 | grade-2-app | here |
| --- | --- | --- | --- |
| deck, `finish()`, stickers | ✓ | ✓ | ✓ |
| voice engine (platform TTS + fallback) | ✓ | ✓ | ✓ |
| launch params read and carried across links | ✓ | ✓ | ✓ |
| Wehel | ✓ | ✓ | ✓ |
| design template + ink tokens | ✓ | ✓ | **partly — see below** |
| `course-shell.js` | ✓ | ✓ | **no** |
| the two header bars | ✓ | ✓ | **no** |
| Class chat / Hand up / Join class | ✓ | ✓ | **no** |
| deploy path | own `deploy.mjs` | shared | **none** |
| **on the CDN** | staged | no | **no** |
| **a learner can reach it** | — | no | **no** |

Verified against storage on 2026-09-07: `app/mathematics/` holds
`grade-1-preview`, `grade-1-v2`, `grade-2-lessons` and the eight shell grade
directories. There is **no** `grade-3-*` standalone path. Nothing here has ever
been uploaded, and no learner can reach any of it.

Routing, when it happens, is one Moodle setting —
`local_prequran/ehel_app_url_overrides`, read by `pqpg_ehel_app_base()`, host-locked
to `ehelacademy.b-cdn.net` — through the staged-script + cPanel Terminal loop, on
the model of `../grade-1-app/repoint-grade-1.php`. The course idnumber is
`ehel-math-g03`. The shell course at `app/mathematics/grade-3/` is untouched and
still serves Grade 3; this is an alternative to it, not a patch on it.

## Coverage: 53 of 53 Stage 3 objectives

Against Cambridge Primary Mathematics **0096** (2020). 45 were already covered
by the five lessons; 8 were gaps filled by this work — 3Nc.06, 3Ni.09, 3Nf.08,
3Gt.01, 3Gt.04, 3Gg.04, 3Gp.02, 3Ss.02. `checks/stage-3-coverage-audit.html` is
the write-up, published as an artifact for review.

**`checks/check-audit.mjs` reads the objective codes out of the framework rather
than from anything retyped, so a code the audit invents cannot pass.** It needs
`fw.txt` beside it:

```bash
pdftotext -layout <the 0096 framework PDF> checks/fw.txt
```

That file is deliberately **not committed**. It is a full-text extraction of
Cambridge's published PDF, and this repo holds structured extractions under
`src/curriculum/` but never a reproduction of a source document — the PDFs are
not in the repo either. Without it the checker exits **2** and says so: that is
"could not run", which is neither a pass nor a finding.

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

## The design template, and what is actually missing

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
palette block alone.

The real gap is further up the table: **`course-shell.js` and the two header
bars are absent**, so there is no Class chat, no Hand up and no Join class.
`../lesson-app-tools/wire-platform-controls.py` is what does that, and it has
not been run here. Note the ordering that file exists to enforce — launch params
BEFORE the controls, because `mountHandRaise` and `mountClassChat` mount nothing
without `launchToken` and `launchEndpoint`, so wiring the controls first makes
them look broken when they are only unreachable.

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
