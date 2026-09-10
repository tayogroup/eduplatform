# Grade 1 Global Perspectives — the standalone lesson build

A Grade 1 Global Perspectives course in the design of the Grade 1 Mathematics,
English, Science and Computing standalone builds
(`../../mathematics/grade-1-app/g1v2`, `../../english/grade-1-app`,
`../../science/grade-1-app`, `../../computing/grade-1-app`): self-contained
HTML pages, one per lesson, each carrying its own CSS, its own activity JS and
its own copy of the voice engine, bypassing `shell/course-app.js` entirely.
The improved prompt it was built from is [PROMPT.md](PROMPT.md).

**The content is Cambridge Primary Global Perspectives 0838, Stage 1 — all 18
learning objectives — and it is NOT the Word-pack course under
`global-perspectives/grade-1/data`.** That course is built from the school's
Teacher & Parent Guide, Activity Sheet and Mini-Project by
`build:global-perspectives`. These lessons are authored against the framework
file directly. Nothing under `global-perspectives/grade-1/` is read or written
by this build.

| | |
| --- | --- |
| `content/lesson-N.py` | the authored lessons: every step names its 0838 codes |
| `app.config.json` | grade, stage, floors, hub skills, lessons — what `../lesson-kit` and `../../mathematics/lesson-app-tools` read |
| `<slug>.html`, `g1-index.html` | **GENERATED.** Do not hand-edit |
| `../lesson-kit/` | **the generator, this subject's own** (see its README for why it is a copy of the Computing kit's shape and not the Computing kit): `build-lessons.py`, `build-hub.py`, `check-coverage.py`, `_rules.py`, `_kit.py`, `_shell.py`, and `lib/` |

The framework file is `src/curriculum/cambridge-global-perspectives-0838.json`,
extracted from the published PDF by
`tools/extract-cambridge-global-perspectives-framework.py`. Cambridge prints
no objective codes for this subject; the codes (`1Rq.01`, `1Ap.01`, `1Cc.01`…)
are the extractor's, stable because they derive from the sub-strand, and every
page's grown-up panel says so.

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # every lesson in app.config.json; refuses on a bad code or relationship
python $K/build-lessons.py --app . 3    # just lesson 3
python $K/build-hub.py --app .          # after the lessons

T=../../mathematics/lesson-app-tools
python $T/wire-navigation.py        --app .
python $T/wire-platform-controls.py --app .
python $T/preload-platform.py       --app .
python $T/wire-progress.py          --app .
python $T/add-header-bars.py        --app .
python $T/check-lessons.py          --app .    # the shared gate
python $K/check-coverage.py         --app .    # the curriculum gate
node   $T/deploy.mjs                --app .    # plan only; --upload is an owner decision
```

`build-lessons.py` writes each page from scratch, so re-running it throws the
pipeline's wiring away and the pipeline has to be re-run. Deliberate — same
rule as English, Science and Computing.

## What a lesson is

Eight lessons, one skill cluster each, every one anchored on a topic a
five-year-old can talk about; 14 to 17 steps each plus the sticker shelf
(6 to 9 of the lesson's own, plus the eight of the unit shell, which here
includes a look-back):

| lesson | topic | steps | objectives | the machine the child drives |
| --- | --- | --- | --- | --- |
| 1 Ask Away | pets | 16 | 4 | builds six questions from a word and an ending; reads the vet's room and the park |
| 2 Find Out | getting to school, playtime | 17 | 5 | asks six classmates, records into a pictogram, reads it, charts it; twice |
| 3 What We Know | keeping healthy | 15 | 4 | puts what is ABOUT the topic on the board; answers what was asked |
| 4 What Happens Next | water, looking after things | 15 | 4 | predicts what happens to them and sees it; tries actions on four problems |
| 5 Which One Helps? | the food we eat | 15 | 4 | picks the source about the topic and the reason; states three opinions with reasons |
| 6 Better Together | the class garden, the class mural | 16 | 6 | shares by arithmetic, responds kindly, watches the garden grow; then says who did what |
| 7 Talk and Listen | my family | 15 | 5 | hears three talks line by line and asks about them; answers four classmates; builds five questions |
| 8 Look Back | the course | 14 | 4 | names the six skills; looks back over every lesson; says what it knows now |

Twenty-one step kinds, one renderer each in `lib/gp.js` — the kit README has
the table. The Global-Perspectives-shaped ones are the machines where the
skill is done on people and sources rather than told:

- **The question builder** reads back whatever the child asks. A valid
  question aimed at the wrong thing ("Where does the cat sleep?" when the card
  wanted WHEN) is answered as a good question about something else, because
  it IS a question, and that is the skill.
- **The survey** makes nobody answer until they are asked. Press Ask, hear
  the classmate, record what THEY said, and one more picture appears in the
  row. The pictogram questions that follow are keyed by arithmetic the builder
  re-computes from those answers, so a survey edited after its questions were
  keyed fails the build, not the child.
- **Relevance is a tag, never a flag.** An answer, a follow-up question, a
  thing known and a reason for an opinion each carry `about`; the right one is
  the one whose tag matches the topic, and a wrong pick says what it WAS
  about ("That is true, but it is about bedtime"). The builder refuses a round
  where the tags do not make exactly one right answer.
- **The team steps grow a garden and a mural** one stage per round played
  well. A share is arithmetic: you have four, Sami has none, you each need
  two; give two and you both plant; give none and Sami is stuck; give four
  and you are. Every choice and every friend's action is logged, and the
  reflection step that follows asks which of these YOU did and what each
  friend did — from the child's own record, not an authored claim. If the
  team step was skipped (a dot tapped straight to the reflection), the
  builder's fallback record stands in.
- **Opinions are never marked.** Any stance is accepted and read back; only
  the reason has to be about the topic.
- **Every lesson ends with a look-back** drawn from its own about lines and
  step titles (1Fv.01, 1Fl.01), and Lesson 8 authors one over the whole
  course, with every lesson's about lines as the "I learned…" cards.

## Coverage, and how it is held

Every step declares `objectives`. `build-lessons.py` refuses a code 0838 does
not publish for Stage 1 and, on a full build, refuses to finish if any of the
18 is reached by no step. `check-coverage.py` then asks the BUILT pages
(`data-objectives` on every slide, and the `LESSON` JSON inside them) the same
question, plus what only shipped bytes can answer: every quiz key single, no
repeated option, every sort and organiser bin present, a per-lesson objective
floor that may rise and not fall — and **64 relationships re-computed from the
shipped data rather than trusted**, through the same `_rules.py` the builder
used: two pictograms against the survey answers they came from and their nine
keys; six question rounds against the endings that allow them; two picture
questions against the spots in the picture; two know boards; thirteen
relevant-answer rounds and three follow-up-question rounds by tag; four issues
with an action that fixes them and one that does not; four source rounds with
exactly one relevant source; three opinion rounds with reasons on and off the
topic; four share rounds with exactly one share that lets both finish; and
every look-back's "not learned" lines against the lesson's own about lines.

Mutation-tested seventeen ways on 2026-09-10, each restored byte-identical
and verified against a snapshot taken before the first mutation, with the gate
refusing to start on a red tree: a lesson losing an objective it shares with
another lesson (so only the floor can catch it), an unpublished code, a quiz
with no key, a sort into a missing bin, a survey answer edited after its
pictogram was keyed, a pictogram key that disagrees with its rows, two answers
about the question, a follow-up question nobody could ask, an issue no given
action fixes, a share round where no option lets both finish, two sources
about the topic, a question the ending does not allow, a look-back that lists
a learned line as not learned, a know board with every card on the topic, an
opinion round with every reason on the topic, a contribution record with
nothing the child did, and a lesson under its floor. All seventeen caught,
seventeen DISTINCT failure lines (a suite whose failures all read the same is
a suite doing no work), and the gate passes again on restore.

What the gates do NOT establish: that the teaching is right, well pitched, or
free of error. The quiz keys and the consequence predictions were authored,
not computed. Nothing here has had a human reading.

## Things that will bite

- **`lib/deck.js` is stored UNWIRED, and that is load-bearing.** The shared
  progress step patches `finish()` and `show()` by matching their exact text
  and only matches the unwired shape. Do not add the hooks by hand.
- **Do not name a pipeline tool's filename anywhere that ends up in a page.**
  Each tool's filename is its own idempotence marker.
- **Every renderer draws at load**, because the deck paints all its slides
  and hides them. `window.__ehelPainting` silences the draw pass; a step that
  speaks on arrival does it through `ONSHOW` (the demo, the lecture, the
  survey).
- **Nothing waits on `requestAnimationFrame`**, for the reason the Science
  README records: a hidden tab never paints. The talk's lines, the garden's
  growth and the survey's beats are all timers.
- **Two team steps on one page keep two logs**, keyed by step index
  (`window.__gpTeamLogs`), and the builder writes each reflection step's
  `teamStep`. The first version kept one global log and the mural's empty one
  overwrote the garden's at load.
- **The know board takes its index from the button, not the card.** The
  original cards carry no `k`; the shuffled copies do. The first version
  pushed `undefined` and the step never finished — found by driving, not by
  reading.
- **Tags are exact strings.** `"food"` and `"Food"` are different topics.
- **The five platform modules 404 in local dev** — `learner-controls.js`,
  `wehel.js`, `course-shell.js`, `seb-session.js`, `progress-client.js` — as
  in every sibling build. The lesson works without them; class controls, Wehel
  and progress reporting do not. Those five 404s are the only console errors a
  healthy page shows.
- **Sound needs a gesture.** The synthesiser creates its AudioContext on the
  first tap.
- **Nothing routes a learner here.** Deploying (`deploy.mjs --upload`) would
  make the build reachable by URL and by nobody's course; Grade 1 routing is
  the `local_prequran/ehel_app_url_overrides` Moodle setting
  (`lesson-app-tools/repoint-grade.php` would need a Global Perspectives row).
  Not done, on purpose.

## Progress: `l01`..`l08`, and why not `u01`

Written under `l01`..`l08` beneath the shell's own course key `ehel-gp-g01`.
THE UNIT PROBLEM (see `wire-progress.py`) applies exactly as in Science and
Computing: these eight lessons are organised by skill against the framework
directly, while the shell serves four topic units built from the Word packs
(families, gardens, jobs, water), so emitting `u01` would write "What can
families teach us? completed" into the gradebook on the strength of a lesson
about asking questions. If the school ever maps these lessons onto units, the
mapping is one function in `wire-progress.py` and a curriculum decision.

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 18/18 objectives reached.
- `check-lessons.py` and `check-coverage.py`: exit 0, 64 relationships
  re-computed. `validate:frameworks`: both Global Perspectives framework files
  pass with every other framework file.
- Every one of the 34 inline classic scripts parses under `node --check`.
- In the browser (Playwright Chromium against `tools/serve-src-preview.js`,
  eight parallel contexts), every step of every lesson was driven to
  completion by a script that plays each kind the way a child would (the
  classmate's own answer, the word and ending the card asks for, the bin the
  item belongs in, the share that lets both finish, the reason on the topic):
  all eight lessons ended at 100% on the header with every dot ticked and
  "Every sticker!" on the shelf, 119 to 171 seconds each. The only console
  errors were the five platform-module 404s. At 375px no step of any lesson
  overflowed horizontally.
- **That driving found one defect reading did not** (the know board's
  `undefined` index, above), fixed before the final run.
- Reading level, measured on all learner-facing text: 7.5 to 10.6 words per
  sentence; Flesch-Kincaid grade 1.7 to 4.0. Every line is read aloud by the
  voice engine, so the level is a ceiling, not a gate. No US spellings.

## What was deliberately not done

Deploying; routing a learner; recorded narration; reusing the Word-pack
course's text; anything at Stage 2; a real class survey (the classmates are
drawn — the home projects send the child to do a real one with their family);
a human reading of the content.
