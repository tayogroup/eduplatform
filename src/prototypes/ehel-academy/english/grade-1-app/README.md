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
```

**One builder, every grade.** The two builders read the GRADE they are
building out of the target app's `app.config.json` — `--app <dir>`, default
this directory. `../grade-2-app/` holds only its config and its generated
pages; it is built with

```bash
python build-lessons.py --app ../grade-2-app
python build-hub.py     --app ../grade-2-app
# then the same pipeline below, with --app ../grade-2-app
```

The config names the grade (so `english/grade-N/data`, the grade's dictionary
and media prefix follow), the labels, the course key, and `strandRoles`: which
of that grade's Core-words strands feeds which step. Grade 1 is phonics →
sounds, topic → new words, sight → everyday words; Grade 2 is spelling →
sounds, both topic groups merged → new words, joining → everyday words. A
strand mapped onto a role another strand holds is MERGED, not overwritten.
`lib/` is shared, so a fix to the deck or the voice reaches every grade on its
next build — the Maths builds copied a stylesheet per grade and the copies
drifted.

Grade 2's Video lesson step exists since 2026-09-11, when its unit lessons
were rendered (see `../grade-2-app/README.md`). Two steps read Grade 2's grammar differently because its shape
differs: **Let us talk** and **Fluency Practice** draw on `ruleAndExamples`
(the rule's own held-up sentences, pooled by `conceptId` because Grade 2
authors each pattern as a pair of items) where Grade 1's come from the
`practice` line — one parse, in `tools/author-ehel-english-g1-fluency.py`,
which the builder imports. A "Meet the words" step is one topic group, split
into equal parts above `WORDS_PER_STEP` (14, Grade 1's largest); a group under
`WORDS_MIN_STEP` (4) joins its neighbour, titles joined.

Rules added while building Grade 3 (2026-09-11), each answering a finding of
the Grade 1 validation or the Grade 2 build, and each leaving Grade 1's ten
lesson pages byte-identical:

- **Story questions without authored wrong options** draw them from answers
  not shown in the step, never a neighbouring question's answer, rotated by
  position. Grade 2's live pages had 19 neighbouring questions on one option
  set and 39 wrong options that were a neighbour's answer; rebuilt, 0 and 0.
- **The hub's header bar is the shared tool's CSS**, read out of
  `add-header-bars.py` with `ast` (that tool runs on import), plus the hub's
  own additions. The copy it replaces is how the hub missed the 10 September
  contrast fix.
- **Hub cards show the unit's learning-time estimate** ("about N min") where
  the unit carries one.

```bash

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
| `lib/english.js` | this build's own: activity renderers and the clip player |
| `lib/books.js` | the picture-book shelf and reader; the tap-sound tables ported from the shell (see below) |

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
has. Unit 1 gets thirteen steps plus the sticker shelf:

| step | from | doing |
| --- | --- | --- |
| Phonics | the unit's `phonics` core-word group | hear the word, tap the word |
| New words | the `topic` group + `dictionaryLinks` | one card at a time: picture, word, meaning, up to 3 example sentences, Hear it |
| Word and picture | any taught word with a picture | the picture is the question |
| Everyday words | the `sight` group | hear it and tap it |
| The story | `readings[type=Story]` + its recording | paged, Listen once, read along |
| Story questions | `comprehension` (the factual items — see below) | multiple choice |
| Say it out loud | `speaking` + the open comprehension lines | listen to the model, tick when said |
| How English works | `grammar` | the pattern, the common mistake, the memory tip |
| Write a sentence | `writing[0]` | build it by tapping word tiles |
| Show what you know | `quizzes` | the unit's own checkpoint, 10 questions |
| Meaning Match | `data/games/unit-N.json`, game id `meaning-match` | multiple choice, the unit's own game |
| Memory Pairs | `data/games/unit-N.json`, game id `memory-pairs` | tap two tiles to reveal, connect word to meaning |
| Picture books | `ebookCatalog` in `shell/subjects/english.js` | a shelf, then a real page-by-page reader |

**A step is only built where its content exists.** Units 4, 7, 9 and 10 have no
`sight` group and units 7 and 9 no `topic` group (unit 7's New Words step
falls back to the phonics list, titled "Meet the words" so it doesn't read as
the Phonics step duplicated), so those pages have fewer steps. An empty step
is worse than an absent one — it can never be completed, and the progress
report, the dot rail and the sticker shelf would all be counting something
nobody can finish.

**The check questions come from the unit's own quiz**, which authors real
options and a real key. Comprehension does not: it stores a question and one
answer, so the distractors are other comprehension answers from the same unit —
a wrong tap lands on something the child is also learning. `is_factual()`
picks which comprehension items have one — a single, non-templated answer
under 70 characters — rather than trusting the `questionType` label, because
unit 10's factual items are typed differently from units 1–9's ("Oral, point
or choose" vs "Oral response") and a label match silently dropped all twelve.
Classifying by the ANSWER's shape instead recovers unit 10 and agrees with the
label test everywhere it applied. The non-factual items (open answers like
"This is a chair. (any object named correctly)", or talk-line templates like
"My name is ___.") go to Say it out loud instead of being turned into a
multiple choice they are not.

### Definitions and example sentences

The unit's own `dictionaryLinks` (not just the master dictionary) carry a
child-facing `childMeaning` and up to 5 `practiceSentences`, each with its own
recorded audio, index-paired. New Words shows the first 3 — the same
`SENTENCES_SHOWN` rule `shell/subjects/english.js` uses for a course learner
(a tutoring learner sees 5; this build only serves course learners). THE
FIRST N, never a sample: `sentenceAudio[i]` is sentence `i`, so slicing from
anywhere else plays the wrong recording. A "Another sentence" button cycles
through them without re-triggering the word's own audio — that pairing lives
in `wordWalk()`'s `draw()`, not its `paint()`, which repaints for both a new
word and a cycled sentence.

### Picture books

The shelf shows the unit's WHOLE shelf (`unitEbooks()`'s own filter,
`grades.includes(1) && (!units || units.includes(unitNo))`, matched exactly —
seven books for Unit 1, not a hardcoded "one signature book"). Nothing is
copied: this build ships to `app/english/grade-1-v2/`, one directory below
`app/english/`, the same level `../ebooks/` already lives at — the assets the
shell's own reader fetches from `./ebooks/`. The reader fetches each page's
SVG at read time from that existing, already-deployed path; it resolves in
local dev too, because `english/grade-1-app/` sits beside `english/ebooks/`
on disk in exactly the same shape.

`ebookCatalog` is a plain `const` in `shell/subjects/english.js`, not
exported, in a file full of top-level `document`/`location` references that
make a straight ES-module import unsafe (unlike `word_pictures()`'s import of
`word-pictures.js`, which has none). `ebook_catalog()` in build-lessons.py
instead finds the declaration, balances brackets to its matching close, and
evaluates that slice alone through node — the same "read the real bytes, not
a regex over them" rule as `word_pictures()`, applied to a shape a plain
import cannot reach.

**Book narration is NOT ported.** The shell's reader calls a paid runtime TTS
endpoint (`aiVoiceUrl`) per page, which this standalone page has no business
calling on its own; a page's Listen button instead reads its text through
this build's own `VOICE.say()` — the same engine every Explain button already
uses. **Tap-sound resolution IS ported, verbatim** (`TAP_VOICE_GROUPS`,
`TAP_SOUND_MOOD_TYPES`, `TAP_SOUND_ALIASES` in `lib/books.js`, copied from
`shell/subjects/english.js`), because it's forty lines of pure data and a tap
that resolves to the wrong clip — or to nothing — is a worse experience than
porting it. A page's own story-sound cue (`page.sound`) plays on arrival, the
same as the shell's `playStorySound`.

### Games

Two of the unit's twelve games, not all twelve. Both ids (`meaning-match`,
`memory-pairs`) are present in every one of the 10 units' packs — checked
directly, not assumed. Meaning Match reuses `sequence()` unchanged, because a
`choice`-type round (`{prompt, choices, answer, explanation}`) is the same
shape `sequence()` already consumes. Memory Pairs is new: the pack's own
description is "Reveal tiles and connect each word with its meaning", so
tiles start face-down and a tap reveals the text underneath, not a
plain always-visible tap-to-select grid. The other ten mechanics in each pack
(spelling, sentence-building, speaking, sequencing) are real gaps this build
leaves open, not an oversight — two faithful games are worth more than twelve
half-built ones.

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
- **The Picture books step depends on a SIBLING directory this deploy does
  not ship.** Every other asset this build touches is either embedded at
  build time or in the shared `MODULES` list `deploy.mjs` uploads. Book pages
  are neither: the reader fetches `../ebooks/<id>/page-NN.svg` and
  `../ebooks/tap-sounds/<key>.mp3` from `app/english/ebooks/`, which exists
  today only because the shell's own app deploy put it there. If that path
  is ever moved or that content is ever pruned without checking who else
  reads it, this build's book reader breaks silently — a page that fails to
  fetch shows "This page could not be loaded" rather than crashing, so the
  failure is quiet rather than loud. Confirmed live via a HEAD request
  before this was written, not assumed.

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
Activities, Games, Quiz, Stories — and this page now covers eight of them
(Core words, Reading, Comprehension, Grammar, Writing, Quiz, Games, Stories).
Overview, the Video lesson and Activities are still not built. Emitting `u01`
would put `unit.completed` for a unit whose video lesson and activities the
child has not opened, into the same document the shell reads back.

So it stays `l`. Changing it is one line in `app.config.json` and a curriculum
decision, not a wiring one.

Verified locally on 2026-09-07 with `?studentid=1293` and no launch endpoint
(so the client's `local` backend): finishing step 1 wrote
`ehel-progress:ehel-eng-g01:1293` →
`l01 { sectionsDone: ["step-01"], resume: "step-01", xp: 1 }`.
