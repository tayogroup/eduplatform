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
| `app.config.json` | the one description of this build — every tool in `../lesson-app-tools` reads it. **Order in `lessons` IS the unit number** |
| `g4-index.html` | the lesson picker, built by `build-hub.py` on Grade 2's design. Deployed as `index.html` |
| `four-digits-strong.html` | the donor lesson, reassembled by `build-donor-lesson.py`. Without it the build teaches 35 of the 46 objectives; with it, 46 |
| `telling-the-time.html`, `asking-sorting-chance.html`, `parts-of-a-whole.html`, `shape-space-place.html`, `numbers-and-behaviour.html` | the five written lessons, 37 teaching slides between them |
| `{time,stats,frac,shape,num}-{body.html,slides.js,extra.css}` | their sources — the body markup, the slide JS, and the per-lesson CSS |
| `shell.js` | the shared framework: deck navigation, narration client, `finish`, `lines`, `nline`, `ask`, `pick3` |
| `g4-lesson.css` | the shared stylesheet every lesson embeds |
| `g4-lesson-body.html`, `g4-lesson.js` | *Four Digits Strong*, the donor lesson these were derived from. `shell.js` is its framework half, split at `/* ---- 1: thousands ---- */` |

`build-<b>-lesson.py` assembles `<b>-body.html` + `shell.js` + `<b>-slides.js` +
`g4-lesson.css` + `<b>-extra.css` into the finished page. All five rebuild
**byte-identical** from the sources here; do that after any refactor of
`shell.js`, the way the ebook kit extraction was proved safe.

## check-judging.py moved, because it was reading half the build

It lived here and carried its own file list:

```python
LES=[("time-slides.js","Telling the Time",4), ("stats-slides.js", ...), ... ]
```

Five `*-slides.js` SOURCES with a hardcoded teaching count each, written when
this build was five lessons. By 2026-09-09 it was eight, and the gate reported
**"teaching slides: 37"** against 72, named two lessons that no longer ship
(*Shape, Space and Place*, *Numbers and How They Behave*), and printed
`slides that can never disagree with the child: 0` over the half it could not
see. Green because it did no work.

It is now `../lesson-app-tools/check-judging.py`, which reads
`app.config.json` like every other tool in that directory, reads the BUILT
pages rather than the sources — a source that is not assembled into a page is
not a lesson — and maps JS to slides by the element ids it touches rather than
by the `/* ---- N: title ---- */` markers, which are activity counters and have
already drifted in these files.

It reports **72 teaching slides, 71 judging**. The one that does not is
*Numbers to 10,000*, a place-value builder with no right answer, recorded in
`app.config.json :: explorationSteps` along with Grade 2's ten and Grade 3's
seven. **An exemption that stops firing fails the gate** — if a listed step
starts judging, or names a step that is gone, it says so rather than becoming a
permanent amnesty. Mutation-tested four ways: an unrecorded display-only slide,
a stale exemption, a judging step losing its wrong branch, and a slide parser
that matches nothing (which refuses rather than passing). All four caught, green
again on restore.

## The tools

```bash
# build
python build-time-lesson.py     # and stats / frac / shape / num

# check
python ../lesson-app-tools/check-judging.py   # every teaching slide can disagree
python ../lesson-app-tools/check-lessons.py   # the shared structural gate
python audit-deployed-course.py    # the DEPLOYED 18-unit course vs Cambridge 0096 Stage 4
python build-course-audit.py       # renders that audit as course-audit.html
python build-stage4-audit.py       # renders these five lessons' audit as stage4-audit.html
```

The objectives come from **`src/curriculum/cambridge-mathematics-0096.json`** —
288 of them across Stages 1–6, extracted from Cambridge's 2020 PDF by the repo's
own `tools/extract-cambridge-mathematics-framework.py` and validated by
`validate:frameworks`. That file did not exist before 2026-09-07; the repo
carried only `cambridge-mathematics-0862.json` (Stages 7–9), which is why
CLAUDE.md records Stages 1–6 as unmappable.

A hand-extracted `stage4.json` used to sit here and has been deleted. Keep it
deleted: the repo's extractor produced *better* text than the hand copy — the
hand copy's 4Gt.04 had swallowed the following section heading, which is the
exact failure CLAUDE.md documents for framework extraction. Both extractions
agreed on all 46 Stage 4 codes, which is the only reason the hand copy could be
retired with confidence.

### Automatic coverage scoring was tried, and it does not work

Do not rebuild it. The idea was to score every objective against the units by its
own most distinctive words, so all six stages could be checked without
hand-written patterns. It was built, calibrated and **failed its control**:

- Run against the content from *before* the two Stage 4 gaps were fixed, it
  scored 4Ni.03 at 0.75 and 4Ni.01 at 1.00 — it passed both objectives that were
  genuinely missing, because their other words appear elsewhere in the course.
- Tightened until it did catch 4Ni.03, it flagged **7 false alarms** on
  known-good Stage 4 content to find **1** real gap.

The reason is not tuning. It matches *vocabulary*, and a lesson legitimately
teaches an idea in child-facing words: the course covers 4Ss.03 with "what is the
same about the books, and what is different", which shares no distinctive word
with "identifying similarities and variations". Shipping it would have added a
gate that is green over real gaps and noisy over good content — worse than none,
because a check that reports false failures gets routed around, and then so does
the rest of the gate.

What does work is a hand-written discriminating pattern per objective, which is
what `audit-deployed-course.py` carries for Stage 4. Extending to another stage
means authoring its patterns and checking each quoted match by eye.

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
same 46 objectives. It opened at **44 covered, 1 partial, 1 not covered**; both
gaps were closed on 2026-09-07 by `tools/repair-ehel-math-stage4-objectives.mjs`
and it now reads **46 / 0 / 0**. The two findings were:

- **4Ni.03** the associative property of multiplication is absent. The course
  teaches *commutativity* (7 × 9 = 9 × 7, U5) well, which is a different
  property; regrouping three factors to simplify appears nowhere in 1.05M
  characters.
- **4Ni.01** partial. Six-digit place value and negative numbers are taught
  thoroughly; writing a whole number **in words** is not. The only number words
  in the course are fractions.

Both were authored into the units in place, for the reason
`repair-ehel-math-truncation.mjs` gives: the generated units carry hand-authored
work that `build:math` would discard. **The content tier has not been
re-uploaded, so neither fix has reached a learner yet.**

## The platform layer, and the order it must be built in

This build is wired by the shared toolchain in `../lesson-app-tools`, which reads
`app.config.json` and hardcodes nothing. Run it **in this order** — each step is
idempotent and each refuses rather than half-working, but the order is not
cosmetic (the toolchain README explains why):

```bash
python build-donor-lesson.py                          # and build-{time,stats,frac,shape,num}-lesson.py
python build-hub.py                                   # g4-index.html, 6 cards
python ../lesson-app-tools/wire-navigation.py         # hub links, a way back, launch params
python ../lesson-app-tools/wire-platform-controls.py  # Class chat, Hand up, Join class, Wehel
python ../lesson-app-tools/preload-platform.py        # modulepreload + preconnect
python ../lesson-app-tools/wire-progress.py           # report to the school
python ../lesson-app-tools/add-header-bars.py         # the two bars, controls into bar 2
python ../lesson-app-tools/check-lessons.py           # the gate
node   ../lesson-app-tools/deploy.mjs --app .         # plan; --upload writes
```

> **A REBUILD DISCARDS THE WIRING.** The wiring tools edit the built HTML in
> place, so re-running any `build-*-lesson.py` throws all of it away —
> measured: `progress-client` 1 → 0 and `learner-controls` 3 → 0 in one rebuild.
> This is the same hazard `build:math` carries and it has no `--force` guard, so
> the rule is the order above: **build first, wire after, always the whole
> chain.** `check-lessons.py` does catch it (it reports "does not carry the
> launch parameters", "no way back", "no class controls", "no Wehel"), which is
> the only thing standing between a rebuild and a silently unwired release.

The four modules the pages import — `learner-controls.js`, `wehel.js`,
`course-shell.js`, `progress-client.js` — are **not** in this directory and must
not be added to it. `deploy.mjs` copies them from `shell/` and `shared/` with
imports flattened to `./x.js`, exactly as `grade-2-app` does. To exercise the
pages locally, stage them with `deploy.mjs`'s own flatten and delete them after;
a hand-written flatten is easy to get wrong (mine produced `from "./"`, and the
module then resolved to the directory listing).

Measured against the Grade 1 lessons that are live (`../grade-1-app/g1v2`), this
build now matches: `learner-controls` 3, `mountWehelChat` 2,
`mountLearnerControls` 2, `modulepreload` 3, `progress-client` 1.

## Progress reporting

Every lesson reports to the school through `shared/progress-client.js`, the same
write path all six shell subjects use. Verified end to end in a browser:
completing steps writes `ehel-progress:ehel-math-g04:<student>` with
`sectionsDone`, `resume` and `xp`, and `resumeLabel` rides beside the id so a
teacher's board shows the words on the child's own screen rather than `step-03`.

Units are `l01`..`l06` in `app.config.json` order, **not** `u01`..`u18`. Read THE
UNIT PROBLEM in `wire-progress.py` before changing that: these six are organised
by strand and the shell course is eighteen term-ordered units, so emitting `uNN`
would claim curriculum coverage nobody measured.

Without a launch endpoint the backend is `local` — everything still reduces into
`localStorage` so resume works, and nothing is sent. Opening a lesson as a file
costs nothing and reports nothing.

**A note on how this section came to exist.** It was planned as the big piece of
work, on the strength of `../grade-1-app/README.md` saying the standalone path
"records no progress … the open question for both builds". That was stale: Grade 1
had already been wired, and `lesson-app-tools/` had already generalised the whole
thing. The actual work was running an existing toolchain against a config that
did not exist yet. Read the code before sizing the job.

## What is missing before this can ship

**The routing question, and it is a decision rather than a task.** Grade 1 is
sent to its standalone build by `pqpg_ehel_app_base()` reading
`local_prequran/ehel_app_url_overrides`. Nothing here routes anybody: uploading
makes this reachable by URL and by nobody's course.

Doing for Grade 4 what was done for Grade 1 would put these six lessons in front
of learners instead of the 18-unit shell course. Both now cover all 46 Stage 4
objectives, so the trade is no longer about curriculum — it is that the shell
course carries the gradebook, the study plan and the placement exam, and this
path carries none of those even though it does now report progress.

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
