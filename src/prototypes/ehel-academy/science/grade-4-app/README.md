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
