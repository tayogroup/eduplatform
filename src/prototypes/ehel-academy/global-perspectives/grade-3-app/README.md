# Grade 3 Global Perspectives — the standalone lesson build

The third grade on `../lesson-kit`, in the design of the Grade 1 standalone
builds of every subject: self-contained HTML pages, one per lesson, bypassing
`shell/course-app.js`. This directory holds only `app.config.json`,
`content/lesson-N.py` and the generated pages; everything that draws a page is
the kit's. The improved prompt is [PROMPT.md](PROMPT.md); the Grade 1 README
(`../grade-1-app/README.md`) records the shape of a lesson and the pipeline,
the Grade 2 README (`../grade-2-app/README.md`) what changed at Stage 2, and
neither is repeated here.

**The content is Cambridge Primary Global Perspectives 0838, Stage 3 — all 18
learning objectives** (the set Cambridge publishes for Stages 3 to 4),
authored against the framework file directly, not the Word-pack course under
`global-perspectives/grade-3/data`.

## Build

Exactly the Grade 1 recipe, from this directory:

```bash
K=../lesson-kit; T=../../mathematics/lesson-app-tools
python $K/build-lessons.py --app . && python $K/build-hub.py --app .
python $T/wire-navigation.py --app . && python $T/wire-platform-controls.py --app . && python $T/preload-platform.py --app . && python $T/wire-progress.py --app . && python $T/add-header-bars.py --app .
python $T/check-lessons.py --app . && python $K/check-coverage.py --app .
node $T/deploy.mjs --app .            # plan only; --upload is an owner decision
```

## What a lesson is at Stage 3

Stage 3 is where the child's own work replaces the given one: OWN questions,
observing and measuring rather than only asking, conclusions the data proves,
the author's viewpoint in a source, causes as well as consequences, actions for
OTHER people's problems, a team that gives out its own jobs, an honest look at
strengths AND limitations, a talk with a structure, and a look-back that asks
how an idea changed and which KIND of activity helped.

| lesson | topic | steps | objectives | what is new at Stage 3 |
| --- | --- | --- | --- | --- |
| 1 Our Own Questions | where our water comes from | 16 | 4 | constructing OWN questions to understand a topic; locating answers in a text and a picture |
| 2 Observe and Measure | what passes the school gate; the bean plants | 17 | 4 | OBSERVING and counting; a questionnaire; MEASURING with a ruler; recording by how it was found |
| 3 What the Data Says | our snacks | 16 | 4 | conclusions the data PROVES (more, total, difference); a conclusion vs a guess; a Venn diagram |
| 4 People Think Differently | dogs in the park | 16 | 5 | the same facts, different views; an author's VIEWPOINT in a poster and a letter; an opinion about somebody ELSE's view, with two reasons |
| 5 Causes and Actions | the classroom, the new girl, the playground | 15 | 4 | WHY you did it (the cause) before what it did to others; actions for OTHER people's problems |
| 6 Team Roles | the fair sign; the recycling garden | 15 | 6 | the team ALLOCATES its jobs by skill; ideas when stuck; strengths AND limitations read from the child's own play; what working together made possible |
| 7 Present It | saving water at school; our park | 16 | 5 | a talk with a START, MIDDLE and END; responding to a talk with an IDEA as well as a question; own questions to understand a talk |
| 8 Look Back | the course | 14 | 4 | how an idea CHANGED (before, after); which KIND of activity helped; presenting one's own learning |

The kit gained ten additive machines for this (the kit README has them all):
observing and counting a scene, charts read off an observation, the ruler
display with a unit, more/total/difference questions, the Venn organiser, a
closing viewpoint question on a text, a cause question before a prediction,
allocate rounds for the team, the strengths-and-limitations step read from
the team log, the structured talk board, and the "changed" look-back — which
the shell draws for EVERY Stage 3+ lesson and REFUSES unless the lesson
authors its own before-and-after pairs, because there is no honest way to
derive how a child's idea changed from a list of about lines.

## Coverage, and how it is held

As in Grades 1 and 2: every step declares its codes, the builder refuses a
code Stage 3 does not publish, and `check-coverage.py` asks the built pages,
with **68 relationships re-computed** from the shipped data. Mutation-tested
twenty-nine ways on 2026-09-10 — the Grade 2 set plus the Stage 3
relationships: an observation counting a kind the scene does not hold, a
scene edited after its chart was keyed, a ruler difference keyed against the
wrong plant, a "which is more" key with its rows swapped, a total that does
not add up, a Venn item sorted into a missing bin, a viewpoint question with
no key, a cause question with no key, a structured talk missing its end slot,
an allocate round where a job fits two people, a strengths step with one
limitation, a look-back asking how ideas changed with one pair, a look-back
carrying Stage 2's codes. All twenty-nine caught, twenty-nine distinct
failure lines, pages restored byte-identical, and run again after the last
kit change.

**Grades 1 and 2 were rebuilt through the changed kit and driven again** —
twice, because a defect seen in a screenshot (the structured talk's feedback
saying "I know that today I am going to tell you…") moved one line of the
kit after the first drive. Every step of all sixteen earlier lessons still
ends at 100%, no page errors, no overflow.

## Things that will bite

Everything in the Grade 1 and Grade 2 READMEs, plus:

- **Every Stage 3 lesson must author `LESSON["lookback"]["changed"]`**, two or
  more `{before, after}` pairs, or the shell refuses to build it. The
  course look-back in Lesson 8 authors its own `changed`, `not` and
  `becauses` inline in the step.
- **Skill strings are read aloud as "good at X".** An allocate round's
  `needs` and a member's `skills` are matched as strings AND spoken ("Sami,
  who is good at carrying heavy things"), so write them as things one is good
  at, not adjectives — "tall" produced "who is good at tall" and was found
  in a screenshot, not by any gate.
- **The strengths step reads the team log.** With the driver playing every
  round right it has no limitations to find, so the page asks what could
  still be better; a child who missed a round is asked to find it. Both paths
  end the step. The `then` question is 3Ft.01.
- **A structured talk card's `part` must name a slot**, and a topic card in
  the wrong slot is refused by the page with the slot's hint, not counted as
  off-topic. Distractor cards carry no `part`.
- **`pictogram_answer` for `difference` is absolute**, so swapping `a` and `b`
  does not change the key; a mutation that means to break it must point `b`
  at a third row.
- **The reading level is higher.** 9.0 to 10.5 words per sentence and
  Flesch-Kincaid 4.3 to 5.6, against 6.9 to 12.4 and 2.6 to 5.3 at Grade 2.
  Lesson 8 is the ceiling because its six-skills recap names every skill in
  one breath. Every line is read aloud; no US spellings.

## Verification on 2026-09-10

- `build-lessons.py`: 8 pages, 0 refusals, 18/18 Stage 3 objectives; floors
  recorded at the measured 4, 4, 4, 5, 4, 6, 5, 4.
- `check-lessons.py`, `check-coverage.py`: exit 0 for Grades 1, 2 and 3; 50
  inline scripts parse.
- Browser (Playwright Chromium, eight parallel contexts): every step of all
  eight lessons driven to completion — the cars counted at the gate, the
  difference read off the ruler, the four jobs given to the four right
  people, the talk built start-middle-end, the idea that changed — all eight
  at 100% with every dot and "Every sticker!", 126 to 184 seconds each; only
  the five platform 404s in the console; no overflow at 375px. Grades 1 and 2
  re-driven on the same kit: sixteen at 100%.

## What was deliberately not done

Deploying; routing; redeploying Grades 1 and 2 on the new kit (their live
pages are the verified earlier bytes, and re-releasing them is an owner
decision); recorded narration; Stage 4; a human reading of the content.
