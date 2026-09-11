# Grade 4 Mathematics — the standalone lesson build

**Eight** self-contained HTML lessons for Stage 4, built on the same pattern as
`../grade-1-app`: each page carries its own CSS, its own activity JS and its own
copy of the voice engine, with no dependency on `shell/course-app.js`.

## Status: deployed, NOT routed — Grade 4 learners get the shell course

**This heading said "LIVE — ... Grade 4 learners are routed here" until
2026-09-11, and the routing half was wrong.** The build IS on the zone, at
`Ehel Primary/app/mathematics/grade-4-lessons`. But
`local_prequran/ehel_app_url_overrides`, read on the server on 2026-09-11 with
`../lesson-app-tools/repoint-grade.php` in report mode, has NO `ehel-math-g04`
entry — Grade 1 and Grade 2 are there, Grade 3 and Grade 4 are not — so a Grade 4
learner is sent to the shell course and nobody opens these pages. A deploy here
reaches no child until that setting changes, and changing it is an owner
decision (it carries the unit problem below).

Before that, this file said "**None of this is deployed**" until 2026-09-09,
when it was already deployed.

That claim could not be checked from this repo — routing lives in a Moodle
setting — so it was an assumption written down as a status, which is exactly how
`../grade-2-app/README.md` came to say the same wrong thing about Grade 2. The
only thing that answers it is the setting, via
`../lesson-app-tools/repoint-grade.php --grade 4` through the cPanel loop.

The count was stale too: this opened describing five lessons and a donor, and
the build has been eight since 2026-09-08. The table below was rewritten for the
eight on 2026-09-11; `app.config.json` is still the one description that is
authoritative, and its `lessons` order IS the unit number.

The three pages the five-lesson era left on storage (`four-digits-strong.html`,
`numbers-and-behaviour.html`, `shape-space-place.html`) were DELETED on
2026-09-11 with the owner's go-ahead, after checking nothing on the zone linked
them: 17 objects in `grade-4-lessons/` became 14. All three are in git at
0a837e193 if they are ever wanted.

Routing this grade is `../lesson-app-tools/repoint-grade.php --grade 4` - AFTER
the server has `local_hubredirect/standalone_lessons.json` and the portal code
that reads it, or a routed learner's percentage is counted against the shell
course's eighteen units instead of these eight lessons (see THE UNIT PROBLEM in
`../lesson-app-tools/wire-progress.py`).

## 2026-09-11 (later): the teaching the report asked for

The same report scored the teaching itself: "no worked examples or authored
explanations, no reasoning step and no warm-up", "the least content time of the
four", "several objectives share one step (4Gg.02 and 4Gg.03 in 'Area without
counting')", "no named people or local settings". All of it is now in the build:

| what | where |
| --- | --- |
| an authored explanation on every slide - 102 of 102, the four moves Grades 1 and 3 use | `explanations.txt`, written into the pages by `../lesson-app-tools/add-explanations.py` (build-all.sh; it fails the build if a slide has none) |
| a "How do you know?" step in every lesson, after the check: a true claim, three reasons, one that works | `reasoning_banks.py`, `../lesson-app-tools/add-reasoning-step.py` |
| a warm-up at the head of every lesson | each lesson's `warmUp` in `app.config.json`, `../lesson-app-tools/add-warmup.py` |
| six new judged steps, each with a check question: fractions of amounts as word problems and putting three fractions in order (Parts of a Whole, 7 steps to 9); choosing the right chart and maybe / likely / certain (Asking, Sorting and Chance, 7 to 9); perimeter all the way round and the area of an L shape (Shape and Measures, 8 to 10 - 4Gg.02 and 4Gg.03 no longer share one exploration) | `new-frac-*`, `new-stats-*`, `new-shape-*`, ordered by `STRUCTURE` in `compose-lessons.py` |
| named children in the new steps and in the timetable, sharing and route questions, and the numbers below zero set on a night on Mount Kenya | `../lesson-app-tools/add-local-names.py` |
| no emoji past Emoji 5.0, and no two stickers alike on a shelf - gated | `../lesson-app-tools/replace-new-emoji-all-grades.py`; `emojiBaseline` and `uniqueStickers` in `app.config.json` |

Verified in a browser from a local server: every generated answer of the six new
steps agrees with an answer computed independently from the question on the
screen (60 rounds), each new step and each reasoning step reports its
completion, all eight warm-ups answer, and all eight checks still gate - Try
again below the mark, completion at it - with their new questions.

## 2026-09-11: the validation, and what changed because of it

All of it in the SOURCES, so `build-all.sh` carries it into every rebuild — the
built pages are regenerated and must never be edited by hand:

| what | where |
| --- | --- |
| a failed check shows how many are needed and **Try again** (it used to stop at "That is all of them.") | `fix-validation.py`: one `retryCheck` in `shell.js`; each source's check block calls it; `compose-lessons.py` rescales the number in the call with the pass mark, so the two cannot disagree |
| no decimals (Stage 5): the "Decimal" readout is gone from the hundred square | `frac-slides.js`, `frac-extra.css` |
| no "isosceles" or "equilateral" (5Gg.01): the shapes are described by their sides | `shape-slides.js` |
| no "even chance" or "as likely as each other" (5Sp.01): Stage 4's own "maybe" | `stats-slides.js` |
| 4Gg.08 declared, where "Acute, right or obtuse?" is taught — **46 of 46** | `g4-lesson.js` |
| doctype and `lang`, feedback announced, skip link, main landmark, 24 px dot cells, fonts from our CDN, the "Can't hear it?" notice, focus mode | the shared tools, now run by `build-all.sh` |
| "For teachers and parents" on the hub, minutes on every card and a total, and cards that say Start like every other grade's | `../lesson-app-tools/build-grownup-section.py`, `build-hub.py`, at-home text in `app.config.json` |
| the hub's notes sit under the card grid, not inside it; Grade 2's section and notes cannot leak in | `build-hub.py` |
| `compose-lessons.py` is the first build step and its sixteen outputs are gitignored — a fresh clone could not build before | `build-all.sh`, `.gitignore` |
| every generator writes LF | `compose-lessons.py`, `build-lessons.py`, `build-hub.py` |

Verified in a browser: all eight checks answered all wrong (Try again, lesson not
completed) and then all right (completed), every step of every lesson visited
with no page error and no unnamed control, focus mode mounting only when asked,
and two consecutive builds byte-identical. **Not deployed**, and not routed.

## What is where

| | |
| --- | --- |
| `app.config.json` | the one description of this build — every tool in `../lesson-app-tools` reads it. **Order in `lessons` IS the unit number**. Also each lesson's `warmUp` and at-home line |
| `g4-index.html` | the lesson picker, built by `build-hub.py` on Grade 2's design. Deployed as `index.html` |
| the eight `*.html` lessons (`big-numbers-below-zero.html` ... `asking-sorting-chance.html`) | GENERATED — never edit them; the next build overwrites the edit |
| `{num,frac,time,shape,stats}-{body.html,slides.js,extra.css}` | the five source lessons — body markup, slide JS, per-lesson CSS |
| `new-{bignum,patterns,calc,time,where,frac,stats,shape}-{body.html,slides.js}` | slides written for this build rather than cut from a source |
| `g4-lesson-body.html`, `g4-lesson.js` | *Four Digits Strong*, the donor: five of its slides are composed into the strand lessons; it has had no page of its own since 2026-09-08. `shell.js` is its framework half |
| `shell.js` | the shared framework: deck navigation, narration client, `finish`, `lines`, `nline`, `ask`, `pick3`, `retryCheck` |
| `g4-lesson.css` | the shared stylesheet every lesson embeds |
| `explanations.txt`, `reasoning_banks.py` | the Explain words for every slide, and the "How do you know?" claims |
| `compose-lessons.py` | STRUCTURE: which slides, in which order, make each lesson; the donor and new slides' stickers and check questions. Writes `c-*-body.html` / `c-*-slides.js`, gitignored intermediates |
| `build-lessons.py`, `build-hub.py`, `build-all.sh` | the pages, the hub, and the whole build including the wiring and page tools and the gates |

`build-all.sh` rebuilds everything and is **byte-identical** from run to run;
check that after any refactor of `shell.js` or `compose-lessons.py`, the way the
ebook kit extraction was proved safe.

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
# build AND wire, in one step - see the warning below for why they are one
bash build-all.sh

# the pieces it runs, if you need them singly
python compose-lessons.py   # c-*-body.html and c-*-slides.js - build-all.sh's first step, gitignored
python build-lessons.py     # assembles the eight lessons; replaced the six per-lesson builders
python build-hub.py         # g4-index.html, on Grade 2's design

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

> **A REBUILD DISCARDS THE WIRING — which is why `build-all.sh` exists now.**
> The wiring tools edit the built HTML in place, so a bare `build-lessons.py`
> throws all of it away. Re-measured 2026-09-09 in an isolated copy:
> `learner-controls` 3 → 0, `progress-client` 1 → 0, `eh-bar1` 3 → 0 and the
> launch parameters 6 → 2, with `check-lessons.py` reporting **128 findings**.
>
> This matters the moment Grade 4 is routed: the same rebuild would put pages
> in front of children with no Class chat, no Raise hand, no Wehel and nothing
> reaching the live group board — and the symptom is ABSENCE, so it shows up
> as a quiet board rather than an error. (This said "Grade 4 is routed now";
> it is not — see the status above.)
>
> `build-all.sh` builds and then wires, the way Grade 3's has since it was
> written, and ends on both gates. Verified in a copy: after the bare rebuild
> above it restores 5 / 1 / 3 / 6, all eight lessons carry every marker, 49
> inline scripts parse and both gates pass. `check-lessons.py` is still the
> backstop if somebody bypasses it.

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
