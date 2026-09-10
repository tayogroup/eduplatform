# Grade 4 Global Perspectives — the standalone lesson build

The fourth grade on `../lesson-kit`, in the design of the Grade 1 standalone
builds of every subject: self-contained HTML pages, one per lesson, bypassing
`shell/course-app.js`. This directory holds only `app.config.json`,
`content/lesson-N.py` and the generated pages; everything that draws a page is
the kit's. The improved prompt is [PROMPT.md](PROMPT.md); the Grade 1 README
(`../grade-1-app/README.md`) records the shape of a lesson and the pipeline,
the Grade 2 and Grade 3 READMEs what changed at each stage, and none of that
is repeated here.

**The content is Cambridge Primary Global Perspectives 0838, Stage 4 — all 18
learning objectives.** Cambridge publishes ONE set of objectives for Stages 3
to 4, so these are the Stage 3 objectives under `4…` codes. That is the whole
point of this grade: **no new machines**. The kit did not grow. What is
different from Grade 3 is the topics and the depth of each one. Two lines of
the kit moved: `_shell.py` now names the real stage in the look-back's
explanation (Grade 3 rebuilds byte-identical through that), and the ruler
display's caption takes an optional `tool` name, because a screenshot showed
the rain gauge captioned "Measured with a ruler" (that one moves every page's
bytes, so Grades 1 to 3 were rebuilt and re-driven).

## Build

Exactly the Grade 1 recipe, from this directory:

```bash
K=../lesson-kit; T=../../mathematics/lesson-app-tools
python $K/build-lessons.py --app . && python $K/build-hub.py --app .
python $T/wire-navigation.py --app . && python $T/wire-platform-controls.py --app . && python $T/preload-platform.py --app . && python $T/wire-progress.py --app . && python $T/add-header-bars.py --app .
python $T/check-lessons.py --app . && python $K/check-coverage.py --app .
node $T/deploy.mjs --app .            # plan only; --upload is an owner decision
```

## What a lesson is at Grade 4

Same 18 objectives as Grade 3, so the same eight skill clusters; the step up
is in what each one asks. Questions must OPEN a stage of a journey rather
than merely be answerable. The child CHOOSES whether to observe, ask or
measure. A conclusion goes exactly as far as the data and NO FURTHER. Views
come from WHERE EACH PERSON STANDS. A consequence in a SHARED SPACE reaches
twenty people. A leaflet's author WANTS SOMETHING.

| lesson | topic | steps | objectives | the Grade 4 depth |
| --- | --- | --- | --- | --- |
| 1 Where Food Comes From | the journey of bread and bananas | 16 | 4 | questions that open a STAGE of a journey; locating answers in a text about a banana's voyage and in a market |
| 2 Waste Watchers | litter, cartons, the rain gauge | 17 | 4 | CHOOSING observe, ask or measure; deciding what counts before counting; millimetres; recording waste by where it should go |
| 3 Sleep and Screens | a sleep survey, library loans | 16 | 4 | conclusions that go exactly as far as the data; "too far" as a bin of its own; a Venn diagram of indoors, outdoors, both |
| 4 The Old Field | a supermarket on the field | 16 | 5 | four views from where four people stand; a company leaflet that wants your support; a letter with evidence; opinions with two reasons |
| 5 Shared Spaces | the queue, the library, the hall, the street | 15 | 4 | a small cause reaching twenty people; causes in and outside your control; actions for a neighbour, a caretaker, a librarian |
| 6 The Class Museum | the museum display; the bee garden | 15 | 6 | allocating by skill (reading old handwriting, model-making, a clear voice); ideas when stuck; strengths and limitations from the child's own play |
| 7 Energy Talks | lights, heating, the printer | 16 | 5 | a talk with start, middle and end; responding with an IDEA as well as a question; own questions about a classmate's talk |
| 8 Look Back | the course | 14 | 4 | how an idea changed; which KIND of activity helped; presenting one's own learning |

## Coverage, and how it is held

As in every grade: every step declares its codes, the builder refuses a code
Stage 4 does not publish, and `check-coverage.py` asks the built pages, with
**70 relationships re-computed** from the shipped data. Mutation-tested
twenty-nine ways on 2026-09-10 — the Stage 3 relationships on the Grade 4
pages, with the Grade 4 files, codes and data: an observation counting a kind
the scene does not hold, a scene edited after its chart was keyed, a gauge
difference keyed against the wrong day, a "which is more" key with its rows
swapped, a total that does not add up, a Venn item in a missing bin, a
viewpoint question and a cause question with no key, a structured talk
missing its end slot, an allocate round where a job fits two people, a
strengths step with one limitation, a look-back with one changed pair, a
look-back carrying Stage 3's codes. All twenty-nine caught, twenty-nine
distinct failure lines, pages restored byte-identical.

## Things that will bite

Everything in the Grade 1, 2 and 3 READMEs, plus:

- **Stage 4 is Stage 3's codes.** `4Rq.01` and `3Rq.01` are the same
  sentence in the framework. A step that names a `3…` code on a Grade 4 page
  is refused by the builder and failed by the gate, and that is the ONLY
  thing the stage number changes in the kit. Do not add machines "for Stage
  4"; author depth instead.
- **The "too far" bin is content, not a kit feature.** Lesson 3's sort has
  bins "proved by the data" and "goes too far"; the kit only knows bins. The
  teaching that a conclusion stops where the data stops lives in the items
  and their `why` lines.
- **A company can be an author.** Lesson 4's leaflet is signed by a company,
  and the "who wrote it" round keys the same line as the "what the author
  wants" round. Two rounds may share a line; the gate checks each line index
  exists, not that they differ.
- **The reading level is the highest of the four grades**, as intended: 9.3
  to 11.2 words per sentence and Flesch-Kincaid 4.2 to 5.6. Lesson 4 is the
  ceiling, because a leaflet and a letter are written as adults write them.
  Every line is read aloud. No US spellings ("store" appears only in the
  company's own voice, as a supermarket calls itself).

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 18/18 Stage 4 objectives; floors
  recorded at the measured 4, 4, 4, 5, 4, 6, 5, 4.
- `check-lessons.py`, `check-coverage.py`: exit 0; 50 inline scripts parse.
- Grades 1, 2 and 3 rebuilt through the `tool` caption change and re-driven:
  twenty-four lessons at 100%, no page errors, no overflow.
- Browser (Playwright Chromium, eight parallel contexts): every step of all
  eight lessons driven to completion — the bottles counted with the leaves
  left alone, the gauge difference read, the four museum jobs given to the
  four right people, the talk built start-middle-end, the idea that changed —
  all eight at 100% with every dot and "Every sticker!"; only the five
  platform 404s in the console; no overflow at 375px.
- Screenshots of the new content mid-play looked at by eye.

## What was deliberately not done

Deploying; routing; recorded narration; Stage 5 (withdrawn from the shell
course, and the standalone builds stop at the deck's own boundary of Stage
4); a human reading of the content.
