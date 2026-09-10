# Grade 3 Science — the standalone lesson build

The third grade built on `../lesson-kit`, started on 2026-09-10 the day the
Grade 2 build shipped. Read the [Grade 1 README](../grade-1-app/README.md) for
what a standalone build is, what will bite, and the progress namespace; the
[kit README](../lesson-kit/README.md) for the step kinds, the sims and the unit
shell. This file records only what Grade 3 adds.

**The content is Cambridge Primary Science 0097, Stage 3 — all 51 learning
objectives — and, as with the earlier grades, NOT the 0846 course under
`science/grade-3/data`.** Stage 3 is where science stops being a set of
things to notice and becomes a set of things to DO: the five types of enquiry
are named, measurements go into standard units, results go into bar charts,
and an experiment ends with a conclusion. It also opens five topics the
earlier stages never touched: organs, food chains, states of matter and
mixtures, forcemeters and friction, and the Moon.

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

Every lesson carries its own 7 to 9 steps inside the seven-step unit shell
(overview, lecture, words, games, home, world, resources), so a page is 14 to
16 steps plus the sticker shelf.

| lesson | own steps | objectives | what is new here |
| --- | --- | --- | --- |
| 1 Living, Once Alive, Never Alive | 9 | 6 | a three-way sort; the five enquiry types, taught and then sorted |
| 2 Flowering Plants | 7 | 6 | the `plantWarm` sim; the first experiment that ends in a **conclusion** |
| 3 Animal Groups | 7 | 5 | six bins; the `insect` figure; the first **diagram** step (labels placed, not found) |
| 4 Growing Up | 8 | 4 | two life cycles in order; diagram versus physical model |
| 5 Inside Your Body | 7 | 6 | the `organs` figure, labelled and then diagrammed; the bottle-and-balloon lung model |
| 6 Food Chains | 7 | 6 | the `foodChain` build sim: build it, take the grass away |
| 7 Solids, Liquids and Gases | 7 | 8 | the `states` sim; the tester on a liquid and on sand; **centimetres**, and why they beat hand spans |
| 8 Mixtures | 7 | 11 | the `separate` sim (sieve, magnet, filter, taste); the safe-or-risky sort |
| 9 Gravity and Friction | 8 | 11 | the `forcemeter` and `friction` sims; table → **bar chart** → pattern |
| 10 Light and Shadows | 8 | 9 | `lightThrough` (predict each), `shadowSize`; transparent / translucent / opaque |
| 11 Magnets | 7 | 8 | the `magnetPoles` sim: attract, flip, repel; the Stage 1 `magnet` sim again on metals that are not magnetic |
| 12 Rocks and Fossils | 7 | 6 | the `fossil` scene; a fact card on fossil hunting |
| 13 The Moon | 7 | 8 | the `moonPhases` sim; the `earthMoon` build sim: turn a month, spin a day |

97 steps of the lessons' own, 188 with the shell; 91 science words.

**Two kit changes carry the Stage 3 skills that no earlier kind could:**

- `experiment` gained an optional fifth phase, **Conclude** (3TWSa.03): after
  "did it match?", one more question — what does this tell us about the
  question we asked? Six of the eight experiments use it.
- `graph` gained `bar: True` (3TWSa.04): the same tap-to-build mechanic, but
  the blocks fuse into bars against a numbered axis, and the button counts in
  the unit. The pattern question stays, because a chart nobody reads is a
  picture.
- `diagram` is a new kind (3TWSm.03): the reverse of `label`. The parts are
  there; the child carries each label to its part. Same figures, same
  keyboard path.

## Verification on 2026-09-10

- Builder: 13 pages, 0 refusals, 51 of 51 objectives reached; both gates
  green; every inline script parses.
- Objective floors recorded at the measured values in `app.config.json`.
- No Emoji-14 glyphs on any built page (three slipped into the content and
  were replaced before the first build).
- Every one of the 13 lessons driven to 100% in the browser, all 188 steps.
  Two sims needed a hand rather than the generic driver, and both were
  driver limits, not sim faults: `magnetPoles` needs the Flip button pressed
  between the two approaches, and `shadowSize` needs the toy moved all the
  way to the wall as well as all the way to the torch.
- No horizontal overflow at 375px on any step of Gravity and Friction (the
  bar chart), Animal Groups (the insect diagram) or The Moon (the build sim).

Not done: a teacher's read, a screen-reader session, the school's own devices,
watching children use it — the same open rows as the Grade 1 validation.
