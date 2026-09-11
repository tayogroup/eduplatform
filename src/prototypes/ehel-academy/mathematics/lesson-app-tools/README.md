# Standalone lesson-build tools

One set of tools for every standalone lesson build — pages that carry their own
CSS, activity JS and voice engine and do **not** go through
`shell/course-app.js`. Currently that is all four Mathematics builds:
`../grade-1-app/g1v2` and `../grade-2-app`, live and routed; `../grade-3-app`
and `../grade-4-app`, on the zone and routed to by nobody (read on the server
2026-09-11 - check the override map before believing any of these; routing
them is `repoint-grade.php --grade 3,4`, after the server has the lesson map
described under "What these tools do NOT do").
Grades 1 and 2 are hand-maintained, so the tools are run over them by hand;
Grades 3 and 4 are generated, so their `build-all.sh` runs every tool below
itself, and a rebuild re-applies all of it.

Each build describes itself in `app.config.json` beside its lessons; no tool
here hardcodes a directory or a lesson list. That is the whole reason these
exist: the Grade 1 originals were correct and grade-agnostic in every respect
except two lines each — `os.path.join(SP, "g1v2")` and a literal list of seven
filenames — and those two lines were enough to make them single-use.

```bash
cd ../grade-2-app

python ../lesson-app-tools/wire-navigation.py         # hub links, a way back, launch params
python ../lesson-app-tools/wire-platform-controls.py  # Class chat, Hand up, Join class, Wehel
python ../lesson-app-tools/preload-platform.py        # modulepreload + preconnect
python ../lesson-app-tools/wire-progress.py           # report to the school
python ../lesson-app-tools/add-header-bars.py         # the two bars, and the controls into bar 2
python ../lesson-app-tools/add-page-doctype-lang.py *.html              # a doctype, and lang="en-GB"
python ../lesson-app-tools/wire-accessibility.py --app . --write        # feedback announced, skip link, main, 24 px dot cells
python ../lesson-app-tools/self-host-fonts.py --app . --write           # fonts from app/shared/fonts, not Google
python ../lesson-app-tools/wire-quiet-notice.py --app . --write         # "Can't hear it?" when nothing can speak
python ../lesson-app-tools/add-reasoning-step.py --app . --write       # "How do you know?" after the check (reasoning_banks.py)
python ../lesson-app-tools/add-explanations.py --app . --write         # every slide's Explain words (explanations.txt)
python ../lesson-app-tools/add-warmup.py --app . --write               # a warm-up at the head of every lesson (warmUp)
python ../lesson-app-tools/build-grownup-section.py --app . --write     # the hub's teachers-and-parents section
python ../lesson-app-tools/check-lessons.py           # the gate
node   ../lesson-app-tools/deploy.mjs --app .         # plan; --upload writes

# a page wired before a change to the wiring tool reached it - that tool skips
# a page it has already wired, so these carry one piece across, read OUT of it
python ../lesson-app-tools/apply-focus-mode.py *.html        # seb-session.js: focus mode and the session bar
python ../lesson-app-tools/apply-wehel-panel-theme.py *.html # the tutor panel's colours
python ../lesson-app-tools/apply-wehel-prompts.py *.html     # the tutor's canned prompts
```

**Run them in that order.** Each is idempotent and each refuses rather than
half-working, but the order is not cosmetic:

- `wire-platform-controls.py` refuses outright until navigation is wired.
  `mountHandRaise` and `mountClassChat` open with a guard on `launchToken` and
  `launchEndpoint`, so on a page that drops the launch parameters they mount
  **nothing** — no error, no console warning, just absence. Grade 1 shipped
  that and it was reported as "Class chat and Hand up are not displaying
  consistently"; the inconsistency was navigational, not intermittent.
- `preload-platform.py` refuses on a page with no imports, because preloading
  three modules nothing imports is a download nobody uses.
- `wire-quiet-notice.py` refuses every lesson until `wire-accessibility.py` has
  run: the notice goes straight before `<div class="deck" id="deck" role="main">`,
  and the `role="main"` is what the accessibility tool adds. Found by running
  them over Grade 2 in the other order (2026-09-11).
- `build-grownup-section.py` reads the BUILT lessons - their steps, their check,
  its pass mark - so it runs after everything that builds or rebuilds them, and
  on Grade 4 after `build-hub.py`, which rebuilds the hub from Grade 2's and
  would wipe the section.
- `add-reasoning-step.py` before `add-explanations.py`: the step adds a slide,
  and `add-explanations.py` fails if any slide has no explanation at all (the
  reasoning slide carries its own, shared with Grade 3's). Both before
  `build-grownup-section.py`, which counts the new slide into the lesson's time.

## The teaching the 2026-09-11 validation asked for, and where each lives

The reports scored Grades 2 and 4 lowest on the teaching itself: no authored
explanation on any slide (Grade 1 had 9,327 words of them, Grade 3 6,309),
no warm-up, and no step that asks a child WHY. Three tools close those, each
reading its words from a file beside the build, so the words are content and
the tools stay grade-agnostic:

| tool | its words | what it adds |
| --- | --- | --- |
| `add-explanations.py` | `explanations.txt` | the Explain button's four moves - name, show, warn, hand - per slide, keyed by file and heading; written as SSML so no tag is typed |
| `add-warmup.py` | each lesson's `warmUp` in `app.config.json` | Grade 1's warm-up box at the top of step 1; not a step, so no index moves |
| `add-reasoning-step.py` | `reasoning_banks.py` | Grade 3's "How do you know?" step between the check and the shelf |

Grade 2 has all three (run once; its pages are hand-edited), Grade 4 all three
(its `build-all.sh` runs them after every build), Grade 3 the warm-up (it had
the other two). Grade 3 and 4's thin lessons also grew judged second steps -
`grade-3-app/src/add-second-steps.py` and Grade 4's `new-frac/new-stats/
new-shape` slides - and `add-local-names.py` put named local children (and a
night on Mount Kenya, for the numbers below zero) where the lessons already
described a situation.

## Emoji a school tablet can draw

`_emoji.py` is the line: nothing past **Emoji 5.0** (2017), which is where the
older Android tablets' fonts stop - past it a glyph is an empty box. It reads
all four spellings (the character, a JS surrogate pair, a `\u{...}` escape and
an HTML reference) because a scan of the characters alone missed every escaped
one. `replace-new-emoji-all-grades.py` swapped every one in the four builds on
2026-09-11 - 27 different glyphs, counted on the committed files before it ran. A build that sets `"emojiBaseline": "5.0"` and
`"uniqueStickers": true` in its `app.config.json` has `check-lessons.py` hold
it to both - no late glyph on any page, and no two stickers on one shelf with
the same face. They are opt-in so a build that also runs this gate (English's
standalone builds do) meets them the day it chooses to, not the day Maths did.

## `app.config.json`

```json
{ "grade": 2, "gradeLabel": "Grade 2",
  "subject": "mathematics", "subjectLabel": "Mathematics",
  "fromParam": "g2", "backLabel": "Grade 2 Maths",
  "hub": "g2-index.html",
  "remote": "Ehel Primary/app/mathematics/grade-2-lessons",
  "lessons": [ { "file": "…html", "title": "…" } ] }
```

**Order in `lessons` IS the unit number** — unit N is `lessons[N-1]` — so a
lesson's index is not a second fact that can drift from the one in the hub.
`_app.py` refuses to load a config naming a file that is not there, because
otherwise a tool reports "all 9 wired" having quietly done eight.

## The gate, and the three bugs mutation-testing found IN IT

`check-lessons.py` asserts what this pipeline guarantees, and every assertion
is something that has actually been wrong in one of these builds. It was
mutation-tested ten ways. **Two mutations survived**, and both were bugs in the
gate rather than in the builds:

- Deleting `import { escapeHtml } from "./course-shell.js"` left it green,
  because it tested for the substring `"./course-shell.js"` and the
  `<link rel="modulepreload" href="./course-shell.js">` added by the previous
  step contains it. A true fact about the wrong property. It tests
  `from "./x.js"` now.
- Deleting the `finish()` hook left every progress assertion satisfied,
  because the gate checked that the progress client was PRESENT and not that
  anything called it. A perfect function nothing invokes protects nobody. It
  asserts both call sites now.

A third bug needed no mutation to find — pointing the gate at the LIVE Grade 1
build reported 22 findings against a build that has every one of those
properties. It was matching the marker comments **its own tools write**, so it
was a gate on authorship, not on behaviour. Grade 1 carries the same
properties under different marker names, put there by `grade-1-app`'s own
tools. It now matches the behaviour both toolchains emit — the carrier's
`q.delete("from")` plus a `setAttribute("href"`, and the back link's
`href = "index.html"`.

Worth stating plainly, because a gate that only recognises its own output
passes every build it made and fails every build it did not, which is
indistinguishable from working right up until you point it at something
else.

## What these tools do NOT do

- **Invent a design.** `add-header-bars.py` ports the header Grade 1 already
  ships — brand, lesson progress, lesson picker, voice toggle, back, Menu,
  lesson name, Full screen — so the two builds look like one product. It was
  added on 2026-09-07 after a side-by-side screenshot showed Grade 2 with no
  bars at all and its class controls floating in the hero. What none of these
  tools do is decide what a NEW header should contain.
- **Route a learner anywhere.** The launch override
  (`local_prequran/ehel_app_url_overrides`, read by `pqpg_ehel_app_base()`) is
  a Moodle setting reached through the staged-script + cPanel loop. Uploading
  a build makes it reachable by URL and by nobody's course.
- **Map lessons onto the course's units.** `wire-progress.py` DOES report
  now — that limitation is closed — but under its own `l01`..`lNN` namespace,
  because these builds are organised by strand and the shell courses are
  fifteen term-ordered units. Read THE UNIT PROBLEM in that tool before
  changing it: emitting `u01` would claim curriculum coverage nobody measured.
  What the platform does with `lNN` is decided on the SERVER (owner,
  2026-09-11): `local_hubredirect/standalone_lessons.json`, generated from
  every build's `app.config.json` by `tools/build-standalone-lesson-map.mjs`
  and held byte-equal to them by `npm run check:php`, lets the family portal
  and the boards count a routed course's lessons as its units - "Lesson 3:
  Fair Shares", 3 of 9. **Regenerate it whenever a build gains or loses a
  lesson**, and install it before routing a grade.

## Grade 1 is half-migrated, on purpose

`../grade-1-app/g1v2/app.config.json` exists, so `wire-progress.py` and
`check-lessons.py` run against the live build and it is gated by the same
tool as Grade 2. Its own five tools still sit in `../grade-1-app` and still
own what they built — navigation, controls, preload, the composed lessons
themselves. Two of them (`compose-lessons.py`, `build-hub.py`) are genuinely
Grade-1-specific rather than merely hardcoded.

Re-running the shared navigation and control tools over `g1v2` would rewrite
markup that is live and working, to no visible end. The half that was worth
sharing was the half that added something new.

Note `grade-1-app/deploy.mjs` and this one both write
`app/mathematics/grade-1-v2`. They must ship the same file set: when
`progress-client.js` was added here it was added there in the same commit.

## The two anchors that had to be tightened, and why they are worth reading

Both were caught by a tool REFUSING rather than by anything going wrong, which
is the behaviour to preserve when adding a step here.

- `add-header-bars.py` inserts its JS inside the lesson's own IIFE. The Grade 1
  original took the FIRST `<script>`, which was the lesson there because the
  header went on before anything else. Here `preload-platform.py` has already
  put a script in the head, so "the first script" is the preconnect snippet and
  the JS would have landed outside the closure with `slides`, `done`, `show`
  and `paintDots` all out of scope. Anchored on content instead.
- The first content anchor was the `slides` declaration — and
  `wire-progress.py`'s module reads the slides too, so it matched two scripts
  and the tool refused with "found 2 scripts declaring slides, want 1". The
  anchor is `const done = new Array(...)`, which only the lesson has.

The general shape: a build pipeline whose later steps add `<script>` tags makes
every earlier step's "find the script" assumption weaker, and the failure mode
is silent scope loss rather than an error.
