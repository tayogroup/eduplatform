# Grade 4 Mathematics — the standalone lesson build

Five self-contained HTML lessons for Stage 4, built on the same pattern as
`../grade-1-app`: each page carries its own CSS, its own activity JS and its own
copy of the voice engine, with no dependency on `shell/course-app.js`.

**None of this is deployed.** Until this commit none of it was in git either —
it lived in a session scratchpad under `AppData/Local/Temp`, with no CDN copy
and no second copy anywhere. That is the same failure `../grade-1-app/README.md`
records ("the CDN was the only copy"), one step worse.

## What is where

| | |
| --- | --- |
| `telling-the-time.html`, `asking-sorting-chance.html`, `parts-of-a-whole.html`, `shape-space-place.html`, `numbers-and-behaviour.html` | the five built lessons, 37 teaching slides between them |
| `{time,stats,frac,shape,num}-{body.html,slides.js,extra.css}` | their sources — the body markup, the slide JS, and the per-lesson CSS |
| `shell.js` | the shared framework: deck navigation, narration client, `finish`, `lines`, `nline`, `ask`, `pick3` |
| `g4-lesson.css` | the shared stylesheet every lesson embeds |
| `g4-lesson-body.html`, `g4-lesson.js` | *Four Digits Strong*, the donor lesson these were derived from. `shell.js` is its framework half, split at `/* ---- 1: thousands ---- */` |

`build-<b>-lesson.py` assembles `<b>-body.html` + `shell.js` + `<b>-slides.js` +
`g4-lesson.css` + `<b>-extra.css` into the finished page. All five rebuild
**byte-identical** from the sources here; do that after any refactor of
`shell.js`, the way the ebook kit extraction was proved safe.

## The tools

```bash
# build
python build-time-lesson.py     # and stats / frac / shape / num

# check
python check-judging.py            # every teaching slide can disagree with the learner
python audit-deployed-course.py    # the DEPLOYED 18-unit course vs Cambridge 0096 Stage 4
python build-course-audit.py       # renders that audit as course-audit.html
python build-stage4-audit.py       # renders these five lessons' audit as stage4-audit.html
```

`stage4.json` holds the 46 Stage 4 content objectives extracted from Cambridge's
0096 (2020) PDF. **The repo has no 0096 framework file** — `src/curriculum/`
carries only `cambridge-mathematics-0862.json` (Stages 7–9), and CLAUDE.md
records that Stages 1–6 therefore go unmapped. This is the first Stage 4
objective set in the tree, and it is why the audits here are possible at all.

## Where this stands

**Curriculum.** All 46 Stage 4 objectives are covered by the five lessons plus
the donor; `stage4-audit.html` cites the slide for each. The 8 Thinking and
Working Mathematically objectives are out of scope — they describe how a learner
works, not what they know, and cannot be evidenced by locating content.

**Quality.** 22 of the 37 teaching slides originally had no moment where a
learner commits to an answer and can be told "not quite" — sliders and variant
chips change the display but never disagree. Each now ends with a `ask()` panel:
a question, three choices, feedback that can come back wrong, and a fresh item.
815 generated questions were verified by recomputing every answer independently.

**The deployed course is a separate thing and scores better than you might
expect.** `audit-deployed-course.py` checks the 18-unit shell course under
`../grade-4/data/units` — what Grade 4 learners actually receive — against the
same 46 objectives: **44 covered, 1 partial, 1 not covered**. The two findings:

- **4Ni.03** the associative property of multiplication is absent. The course
  teaches *commutativity* (7 × 9 = 9 × 7, U5) well, which is a different
  property; regrouping three factors to simplify appears nowhere in 1.05M
  characters.
- **4Ni.01** partial. Six-digit place value and negative numbers are taught
  thoroughly; writing a whole number **in words** is not. The only number words
  in the course are fractions.

Those belong to the content pipeline, not to this directory.

## What is missing before this can ship

Measured against the Grade 1 lessons that are live (`../grade-1-app/g1v2`):

| | live Grade 1 | here |
| --- | --- | --- |
| `learner-controls` | 3 | **0** |
| `mountWehelChat` | 2 | **0** |
| `mountLearnerControls` | 2 | **0** |
| `top-actions` | 2 | **0** |
| `modulepreload` | 3 | **0** |

So a learner opening one of these pages today gets **no Wehel tutor, no Class
chat, no Hand up and no Join class**. Grade 1 adds them with
`add-platform-controls.py`, `keep-launch-params.py` and `preload-platform.py`;
those need adapting, not rewriting. There is also no hub index — Grade 1 has
`build-hub.py` and `g1-index.html`.

**And the routing question is not settled.** Grade 1 is sent to its standalone
build by `pqpg_ehel_app_base()` reading `local_prequran/ehel_app_url_overrides`.
Doing the same for Grade 4 would trade an 18-unit course scoring 44/46 that
**records progress** for five lessons scoring 46/46 that **record none** — the
standalone path has no gradebook, no group-board position, no study plan. That
is a decision, not an oversight.

## Things that will bite

- **The shell's `fmt()` is `toLocaleString("en-GB")` and applies no typographic
  minus, and there is no `minus` helper in `shell.js`.** A lesson showing
  negatives must define its own; `num-slides.js` does, with a comment saying so.
  Getting this wrong threw at load, which killed the quiz wiring, the stickers
  and `show(0,false)` further down the same scope — one slide rendered blank and
  the rest of the lesson silently lost its setup.
- **`node --check` is blind to this code.** It parses these files as CommonJS and
  exits 0 on real errors; copy the `<script>` body to a `.mjs` and check that.
  And syntax passing is not the lesson running — a throw at load leaves a page
  that looks fine. Assert that the *last* thing the slide code does actually
  happened.
- **`.line` is only styled under `.working`.** A container named anything else
  renders the working panel unstyled, which shipped twice before it was noticed.
- **Only some state classes exist.** Feedback is `.fb.good` / `.fb.bad`; a chosen
  button is `.choice.right` / `.choice.wrong`. `.fb.oops` and `.choice.good` are
  styled nowhere, so a wrong answer rendered in ordinary black text against a
  green right answer — 39 occurrences, all fixed, all invisible to every check
  that existed.
- **`finish(i)` takes the slide's 0-based index**, and `done[i]` drives the dot
  rail and the sticker shelf. Reordering a slide means renumbering every
  `finish()` in its block.
- **All slide code shares one scope.** A duplicate `const` name anywhere breaks
  the entire script; `ONES`/`TENS` collided with shell declarations and became
  `WORD_ONES`/`WORD_TENS`.
- **The browser pane can report `innerWidth: 0`** when it is collapsed, and every
  layout measurement taken then is worthless. Two overflow sweeps in one session
  produced pages of false findings that way. Check the viewport before believing
  a geometry result.
