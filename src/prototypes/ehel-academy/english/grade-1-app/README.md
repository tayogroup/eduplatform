# Grade 1 English — the standalone lesson build

A **second** presentation of English Grade 1, in the design of the Grade 1
Mathematics standalone build (`../../mathematics/grade-1-app/g1v2`, live at
`app/mathematics/grade-1-v2`). Self-contained HTML pages, one per unit, each
carrying its own CSS, its own activity JS and its own copy of the voice engine,
bypassing `shell/course-app.js` entirely.

**The course a learner uses today is untouched.** Nothing under
`english/grade-1/` is written, and `shell/subjects/english.js` is not edited.
This build only ever READS the course, at build time.

| | |
| --- | --- |
| `lib/` | the parts every lesson page is made of — see below |
| `build-lessons.py` | writes `<slug>.html` per unit from `english/grade-1/data` |
| `build-hub.py` | writes `g1-index.html`, the ten cards |
| `app.config.json` | what `../../mathematics/lesson-app-tools` reads |
| `<slug>.html`, `g1-index.html` | **GENERATED.** Do not hand-edit |

## Build

```bash
python build-lessons.py            # every unit named in app.config.json
python build-lessons.py 1          # just unit 1
python build-hub.py                # the hub, after the lessons

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app .    # hub links, a way back, launch params
python $T/wire-platform-controls.py --app .    # Class chat, Hand up, Join class, Wehel
python $T/preload-platform.py       --app .    # modulepreload + preconnect
python $T/wire-progress.py          --app .    # report to the school
python $T/add-header-bars.py        --app .    # the two bars, controls into bar 2
python $T/check-lessons.py          --app .    # the gate
node   $T/deploy.mjs                --app .    # plan; --upload writes
```

**`build-lessons.py` runs FIRST and writes each page from scratch**, so
re-running it throws away everything the pipeline added and the pipeline has to
be re-run. That is deliberate: a generator that preserved another tool's edits
would be a patcher, and this repo has a record of what patchers derived from
other patchers cost.

## What the pages are made of

| file | what it is |
| --- | --- |
| `lib/lesson.css` | the Mathematics build's design system verbatim — the same tokens, deck, gold action colour and voice bar — then this build's own English activity styles |
| `lib/voice.js` | the voice engine, **lifted verbatim**: SSML authored for `en-GB-SoniaNeural`, walked into Web Speech, with the platform TTS path and the reaction banks |
| `lib/deck.js` | the deck, lifted verbatim **with the two progress hooks removed** |
| `lib/english.js` | this build's own: eight activity renderers and the clip player |

`voice.js` and `deck.js` are copies of a live file rather than imports because
these pages have no build step of their own on the CDN — everything they need
is in the page. If the Mathematics build's engine changes, re-extract them;
nothing here will notice on its own.

### `deck.js` is stored UNWIRED, and that is load-bearing

The shared progress step patches `finish()` and `show()` by matching their exact
text, and only matches the unwired shape. `lib/deck.js` therefore carries
neither hook, and the pipeline puts both back. Do not add them by hand — the
gate asserts the call sites, and a second copy would report every step twice.

**Do not name a pipeline tool's FILENAME anywhere that ends up in a generated
page.** Each tool's own filename is the marker it tests for idempotence, so a
comment mentioning it makes the tool skip a page it has never touched. That
happened here: a comment in `lib/deck.js` explaining the paragraph above
contained the progress tool's filename, the tool printed `skip … already
reports`, and the page would have shipped reporting nothing — silently, because
the only symptom is a teacher's board showing a learner who has done nothing.
Caught by the gate, which asserts `createProgressClient` is present.

## What is a step

One lesson is one unit, and the slides are built from what that unit actually
has. Unit 1 gets ten steps plus the sticker shelf:

| step | from | doing |
| --- | --- | --- |
| Phonics | the unit's `phonics` core-word group | hear the word, tap the word |
| New words | the `topic` group + the master dictionary | one card at a time: picture, word, meaning, Hear it |
| Word and picture | any taught word with a picture | the picture is the question |
| Everyday words | the `sight` group | hear it and tap it |
| The story | `readings[type=Story]` + its recording | paged, Listen once, read along |
| Story questions | `comprehension` (`Oral response` only) | multiple choice |
| Say it out loud | `speaking` + the open comprehension lines | listen to the model, tick when said |
| How English works | `grammar` | the pattern, the common mistake, the memory tip |
| Write a sentence | `writing[0].modelText` | build it by tapping word tiles |
| Show what you know | `quizzes` | the unit's own checkpoint, 10 questions |

**A step is only built where its content exists.** Units 4, 7, 9 and 10 have no
`sight` group and units 7 and 9 no `topic` group, so those pages have fewer
steps. An empty step is worse than an absent one — it can never be completed,
and the progress report, the dot rail and the sticker shelf would all be
counting something nobody can finish.

**The check questions come from the unit's own quiz**, which authors real
options and a real key. Comprehension does not: it stores a question and one
answer, so the distractors are other comprehension answers from the same unit —
a wrong tap lands on something the child is also learning. Only the factual
`Oral response` items are used. The `Point, act or say` items have no single
answer to be right about and go to the speaking step instead of being turned
into a multiple choice they are not.

## Things that will bite

- **The content is INLINED at build time.** These pages ship to
  `app/english/grade-1-v2/` and the course content ships to
  `content/english/g01/`; a runtime fetch would tie one tier to another.
  Rebuild after a content change. The gate cannot see staleness and does not
  claim to.
- **Every renderer draws at load**, because the deck paints all its slides and
  hides them with CSS. An unguarded auto-play therefore fires every step's
  first recording the moment the page opens — measured, three at once, sharing
  one `<audio>`. `playHere()` and `ONSHOW` in `lib/english.js` are the fix;
  a new step that plays a clip on draw needs both.
- **`AUDIO_RELEASE` is read out of `shell/subjects/english.js` at build time**,
  not written down here. English names its clips for their content, so a
  re-recorded clip keeps its URL, and that stamp is the only thing that reaches
  a child who already heard the broken one. A second copy would go stale the
  first time the shell bumped and nothing would say so.
- **The four platform modules 404 in local dev.** `learner-controls.js`,
  `wehel.js`, `course-shell.js` and `progress-client.js` are imported as
  `./x.js` and only exist beside the pages once `deploy.mjs` puts them there —
  same as the Mathematics build. The lesson itself works without them; the
  class controls, Wehel and progress reporting do not. To exercise progress
  locally, copy those four in with their imports flattened to `./x.js`, test,
  and delete them again.
- **Nothing routes a learner here.** Grade 1 Maths is reached through
  `local_prequran/ehel_app_url_overrides`, a Moodle setting behind the
  staged-script and cPanel loop. Uploading this build makes it reachable by URL
  and by nobody's course.

## Progress: `l01`, and why not `u01`

Written under `l01`..`l10` beneath the course's own key `ehel-eng-g01`, the same
namespace decision the Maths builds make — so the live group board works
(timestamps, position, `resumeLabel`, done-counts) without claiming curriculum
coverage nobody measured.

**English is the first build where `u01` would be arguable**, and that is worth
stating rather than leaving to be rediscovered. The Maths lessons are organised
by strand and their course has fifteen term-ordered units, so the two cannot be
mapped. Here one lesson IS one unit: same number, same title, same content. But
a unit of the shell course is complete when its **sections** are — Overview,
Video lesson, Core words, Reading, Comprehension, Grammar, Speaking, Writing,
Activities, Games, Quiz, Stories — and this page covers six of them. Emitting
`u01` would put `unit.completed` for a unit whose video lesson, games and story
shelf the child has not opened, into the same document the shell reads back.

So it stays `l`. Changing it is one line in `app.config.json` and a curriculum
decision, not a wiring one.

Verified locally on 2026-09-07 with `?studentid=1293` and no launch endpoint
(so the client's `local` backend): finishing step 1 wrote
`ehel-progress:ehel-eng-g01:1293` →
`l01 { sectionsDone: ["step-01"], resume: "step-01", xp: 1 }`.
