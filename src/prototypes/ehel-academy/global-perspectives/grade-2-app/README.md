# Grade 2 Global Perspectives — the standalone lesson build

The second grade on `../lesson-kit`, in the design of the Grade 1 standalone
builds of every subject: self-contained HTML pages, one per lesson, bypassing
`shell/course-app.js`. This directory holds only `app.config.json`,
`content/lesson-N.py` and the generated pages; everything that draws a page is
the kit's. The improved prompt is [PROMPT.md](PROMPT.md); the Grade 1 README
(`../grade-1-app/README.md`) records the shape of a lesson and the pipeline,
and is not repeated here.

**The content is Cambridge Primary Global Perspectives 0838, Stage 2 — all 18
learning objectives** — authored against the framework file directly, not the
Word-pack course under `global-perspectives/grade-2/data`.

## Build

Exactly the Grade 1 recipe, from this directory:

```bash
K=../lesson-kit; T=../../mathematics/lesson-app-tools
python $K/build-lessons.py --app . && python $K/build-hub.py --app .
python $T/wire-navigation.py --app . && python $T/wire-platform-controls.py --app . && python $T/preload-platform.py --app . && python $T/wire-progress.py --app . && python $T/add-header-bars.py --app .
python $T/check-lessons.py --app . && python $K/check-coverage.py --app .
node $T/deploy.mjs --app .            # plan only; --upload is an owner decision
```

## What a lesson is at Stage 2

Every Stage 2 objective is one step ON from its Stage 1 twin, and the lessons
are written to the step rather than to the topic:

| lesson | topic | steps | objectives | what is new at Stage 2 |
| --- | --- | --- | --- | --- |
| 1 Sharp Questions | the crowded playground | 16 | 4 | FOCUSED questions about a problem; LOCATING the part of a picture, and the sentence of a text, that answers |
| 2 Interview and Record | playtime | 17 | 5 | interviews that find information AND opinions; the same findings as pictures, BARS and a TABLE; information vs opinion recorded on a chart |
| 3 Who Knows What | our town | 15 | 4 | different people know different things: who would know?; a TALK about the town |
| 4 Me and Others | our classroom | 15 | 4 | consequences on OTHERS; a personal action for a problem of MY OWN |
| 5 Sources and Reasons | sharing our planet | 15 | 4 | SUGGEST every relevant source; an opinion with TWO reasons |
| 6 Our Team's Ideas | the vegetable patch, the assembly backdrop | 16 | 6 | carry out a TASK for the team; IDEAS when the team is stuck; whose idea was whose |
| 7 Talk It Through | a new pupil | 16 | 5 | RELEVANT questions after listening; a talk for somebody new; focused questions for him |
| 8 Look Back | the course | 14 | 4 | which activity HELPED me learn, not which I liked; a talk about finding out |

The kit gained seven additive machines for this (the kit README has them all):
locate rounds on a picture, a text source, bar and table displays of a
pictogram, multi-source rounds, two reasons for an opinion, idea and task
rounds for the team with the "whose idea" reflection, the talk board, and the
helped look-back — which the shell draws for EVERY Stage 2+ lesson from the
lesson's own about lines and steps.

## Coverage, and how it is held

As in Grade 1: every step declares its codes, the builder refuses a code
Stage 2 does not publish, and `check-coverage.py` asks the built pages, with
**60 relationships re-computed** from the shipped data. Mutation-tested
twenty ways on 2026-09-10 — the Grade 1 set plus the Stage 2 relationships: a
locate round pointing off the picture, a text question past the last line, a
multi-source round with one relevant source, an opinion round short of the
reasons it asks for, an idea round with no good idea, a task with duplicate
step ids, a look-back carrying Stage 1's codes on a Stage 2 page. All twenty
caught, twenty distinct failure lines, pages restored byte-identical.

**Grade 1 was rebuilt through the changed kit and driven again** before Grade
2 was driven: every step of all eight Grade 1 lessons still ends at 100%, no
page errors, no overflow. That, not a byte comparison, is the proof a kit
change is safe here, because every page embeds the kit's JS and the bytes
move on any change.

## Things that will bite

Everything in the Grade 1 README, plus:

- **The shell's look-back changes shape at Stage 2.** `stage >= 2` in
  `app.config.json` makes `_shell.py` ask which part HELPED (2Fl.01) rather
  than which was liked (1Fl.01), and carry `2Fv.01 2Fl.01`. A lesson that
  authors its own course look-back must set `mode: "helped"` itself.
- **Multi-source rounds need two or more relevant sources AND one that is
  not.** A `multi` round with one relevant source is refused, and so is a
  plain round with two.
- **An idea round and a work round are the same shape** (`opts` with one
  `good`) and differ only in what the page asks ("What do you suggest?") and
  the log's icon. A `contrib` step with `what: "idea"` words its questions as
  ideas; leave it unset where the log mixes jobs and ideas.
- **A task round's steps are tapped in order; the builder only checks the
  ids are distinct.** The order is the authored one, so author it as a child
  would do it.
- **`reasonsNeeded` on an opinion step applies to every round of it**, and
  the builder requires at least that many reasons about the topic per round.

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 18/18 Stage 2 objectives.
- `check-lessons.py`, `check-coverage.py`: exit 0; 34 inline scripts parse.
- Browser (Playwright Chromium, eight parallel contexts): every step of all
  eight lessons driven to completion — the exact sentence, the every-relevant
  source, the two reasons, the task's steps in order, the idea that gets the
  team unstuck — all eight at 100% with every dot and "Every sticker!", 121 to
  180 seconds each; only the five platform 404s in the console; no overflow at
  375px. Grade 1 re-driven on the same kit: eight at 100%.
- Reading level: 6.9 to 12.4 words per sentence, Flesch-Kincaid 2.6 to 5.3.
  Lesson 5 is the ceiling, because a source's own description ("a book about
  recycling tells you where paper, glass and tins go") is one long sentence
  by nature. Every line is read aloud. No US spellings.

## What was deliberately not done

Deploying; routing; redeploying Grade 1 on the new kit (its live pages are the
verified pre-change bytes, and re-releasing them is an owner decision);
recorded narration; Stage 3; a human reading of the content.
