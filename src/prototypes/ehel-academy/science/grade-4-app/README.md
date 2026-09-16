# Grade 4 Science — the standalone lesson build

The fourth grade built on `../lesson-kit`, started on 2026-09-10 the day Grade
3 shipped. Read the [Grade 1 README](../grade-1-app/README.md) for what a
standalone build is, what will bite, and the progress namespace; the
[kit README](../lesson-kit/README.md) for the step kinds, the sims and the unit
shell. This file records only what Grade 4 adds.

**The content is Cambridge Primary Science 0097, Stage 4 — all 63 learning
objectives — and, as with the earlier grades, NOT the 0846 course under
`science/grade-4/data`.** Stage 4 is the last of the deck grades and the one
where the framework starts asking for explanations rather than
observations: the particle model, energy transfer, ray diagrams, the layers
of the Earth, the spinning Earth. Its working-scientifically strand adds
keys, variables, repeated measurements and dot plots, which are the whole of
Lesson 13.

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # 13 lessons; refuses on a bad code or key
python $K/build-hub.py --app .

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

## The thirteen lessons

Every lesson carries its own 6 to 8 steps inside the seven-step unit shell,
so a page is 13 to 15 steps plus the sticker shelf.

| lesson | own steps | objectives | what is new here |
| --- | --- | --- | --- |
| 1 Bones and Muscles | 7 | 8 | the `skeleton` figure, labelled then diagrammed; the `muscles` sim: a pair taking turns |
| 2 Backbone or Not? | 6 | 5 | the first **key** step: six minibeasts identified one yes-or-no at a time |
| 3 Staying Healthy | 7 | 6 | medicines, vaccines and movement; the evidence-or-opinion sort |
| 4 Energy for Life | 7 | 5 | herbivore, carnivore, omnivore, predator, prey; the food chain as a model of a relationship |
| 5 Habitats and Survival | 7 | 7 | four habitats; surviving outside one; the good and bad of local technology |
| 6 Particles | 7 | 9 | the `particles` sim: heat until the rows break; material, substance, particle; what the model leaves out |
| 7 Changes and Reactions | 7 | 10 | the `reaction` sim beside a plain mix; physical versus chemical; risk plans |
| 8 Energy Everywhere | 7 | 10 | the `energyDrop` sim: bounce by bounce into sound and heat; table to bar chart |
| 9 Light and Seeing | 8 | 9 | the `rayMirror` sim; how a book is seen; the `ray` figure diagrammed; Ibn al-Haytham |
| 10 Circuits and Switches | 8 | 10 | the `seriesCircuit` sim: brighter, dimmer, off; the `conductor` test on eight materials |
| 11 Inside the Earth | 8 | 7 | the `earthLayers` figure; the `volcano` and `quake` scenes; the apple as a model to scale |
| 12 The Solar System | 7 | 9 | the `dayNight` sim; eight planets in order; the football-and-peppercorn scale model |
| 13 The Paper Spinner | 8 | 12 | one whole fair test: variables, kit, three drops with the `spinner` sim, a **dot plot**, a conclusion |

95 steps of the lessons' own, 186 with the shell; 91 science words.

**Two kit changes carry the Stage 4 skills that no earlier kind could:**

- `key` is a new kind (4TWSc.02): a branching key of yes-or-no questions.
  The child answers each question about the creature shown; a wrong answer
  is caught at once with the creature's own fact, because a key you can
  follow wrongly to a confident name teaches nothing. The builder walks
  every item's facts through the key at build time and refuses one that
  does not land on its answer.
- `graph` gained `dot: True` (4TWSa.04): a dot plot, one dot per repeated
  measurement above its value. A column may hold zero dots, because a value
  nobody measured is exactly what the plot shows.

## Verification on 2026-09-10

- Builder: 13 pages, 0 refusals, 63 of 63 objectives reached; both gates
  green; every inline script parses.
- Objective floors recorded at the measured values in `app.config.json`.
- No Emoji-14 glyphs on any built page.
- Every one of the 13 lessons driven to 100% in the browser, all 186 steps,
  the key, the dot plot and all nine new sims included. No sim needed a hand
  this time; the driver was taught the mirror's book button up front.
- No horizontal overflow at 375px on any step of Backbone or Not? (the key),
  The Paper Spinner (the dot plot) or Circuits and Switches (the series
  circuit and the conductor test).

Not done: a teacher's read, a screen-reader session, the school's own devices,
watching children use it — the same open rows as the Grade 1 validation.

## The Cambridge Stage 4 depth pass (2026-09-17)

The pass Grades 1–3 had, completing Science Grades 1–4. Nothing moved a step:
**188 steps, and all thirteen sequences byte-identical to the shipped pages**,
because progress is stored by position.

**The source material took two attempts to get right, and that is worth
recording.** A first set of Stage 4 books was the **Hodder** series (Amery &
Feasey) — no "Common misconceptions" tables anywhere, no "Look what I can do!"
blocks, its Success criteria OCR-truncated mid-sentence, and its Learner's Book
and Workbook image-only with no text layer at all. On that material this pass
could not have been done. The book that made it possible is
`Science 4 Teacher resources.pdf` — **Cambridge Primary Science Teacher's
Resource 4, Baxter & Dilley**, the same CUP series as Stages 1–3, with the
three-column tables in the same shape.

**26 of the book's 28 topics carry a table**; 6.4 Switches and 6.5 Changing the
number of components carry none, which is Cambridge's own choice, not an
extraction failure.

**THIS GRADE ALREADY ANSWERED TEN OF THE 29, and the build proved it.** Grades
1–3 were authored before their fixtures existed, so nearly every row needed a
new question. Here the builder's game guard refused the first attempt outright:
lesson 1's quiz already asks *"Can a muscle push a bone?"* with the key *"no,
muscles can only pull"*, which **is** Cambridge's 1.3-m1. So the overlap was
measured first — every fixture row against every stem **and key** in its target
lesson — and each row judged by reading the match rather than trusting the
number. 19 got a new question; 10 are **cited on the step that already answers
them**. The fixture asks "is this answered?", never "did you add a question?".

**Two taught misconceptions, both found by that reading** — the serious kind,
where the error sits in the material rather than merely going unanswered:

- **Lesson 4.** Cambridge 2.4 is that a food-chain arrow reads as "eats"
  instead of as the flow of energy. The lesson's prose pairs them properly, but
  its **quiz key** was *"who eats whom in grass, rabbit and fox"* with energy
  omitted — and the key is the one place a child is tested. Reworded.
- **Lesson 11.** *"What gives a volcano its cone shape?"* presupposes that
  volcanoes **are** cones, which is Cambridge 4.2 word for word. Reworded to
  ask about a cone-shaped one, with the Hawaiian counterexample added.

| | before | after |
| --- | --- | --- |
| misconceptions answered and gated | 0 | 29 / 29 |
| questions | 274 | 365 |
| word cards | 91 | 105 |
| self-check claims | 0 | 95 |
| unscored tier items | 0 | 52 |
| `plan` phases | 0 | 8 |
| `conclude` phases RENDERED | 0 (8 authored, all dead) | 8 |
| table and chart read-offs | 0 | 12 |
| learner words / words per sentence | 37,412 / 10.74 | 44,776 / 10.95 |

Highest Flesch-Kincaid fell from 5.62 to 5.49 (Energy Everywhere both times)
while the volume grew by a fifth.

**Two deliverables have a weaker basis here than in Grades 1–3, stated rather
than glossed.** No Stage 4 book supplied carries a glossary or a self-check
list, so the 95 self-check claims are written from the **0097 Stage 4 objective
statements** rather than from Cambridge's own wording, and the vocabulary pass
is 14 cards rather than Grade 3's 39 — the candidate list came from those same
statements, which are prose, so the measurement is noisy (its top hits were
"show", "because", "answer"). Against that weaker net Grade 4's existing 91
cards proved good already, and lessons 2, 7 and 13 had no gap at all. The 14
are words an objective is **literally written in** that the lesson never
defined: `producer`, `consumer` and `food chain` (4Be.03), `solid` and `liquid`
(4Cm.01), `lamp` (said 100 times, never defined) and `series circuit`
(4Pe.03), `volcano` (4ESp.02, in a lesson about volcanoes), and one each for
bones, joints, disease, straight lines and orbits.

**Verified**: both gates green; 63 of 63 Stage 4 objectives; 29 of 29
misconceptions; 188 steps, 0 moved; four floors raised to their measured
values, none lowered; five mutations, five distinct failure lines, all thirteen
modules verified back byte-identical. In a browser on the built pages, served
on a port other than 4287: all eight experiments compute six phases, the
support bank fires on a wrong answer with its eyebrow on its own line and
"EXTRA HELP – NOT MARKED" beneath, and the self-check rows resolve to four
different steps. Zero paid TTS calls; the only failed requests are the five
platform sidecars that exist solely on the deployed tier.

**Serve these pages on any port EXCEPT 4287.** `lib/voice.js` treats
`localhost:4287` as the dev twin and posts every narration line to
`/api/elevenlabs-tts`, which bills per character.
