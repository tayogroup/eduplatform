# Grade 3 Science — the standalone lesson build

The third grade built on `../lesson-kit`, started on 2026-09-10 the day the
Grade 2 build shipped. Read the [Grade 1 README](../grade-1-app/README.md) for
what a standalone build is, what will bite, and the progress namespace; the
[kit README](../lesson-kit/README.md) for the step kinds, the sims and the unit
shell. This file records only what Grade 3 adds.

**The content is Cambridge Primary Science 0097, Stage 3 — all 51 learning
objectives — and, as with the earlier grades, NOT the six-unit course under
`science/grade-3/data`.** That course declared the 2018 framework (0846) until
2026-09-17 and now declares 0097 too, so the two are no longer built to different
frameworks — but its six units are one per content sub-strand of the 2018
framework, so it reaches 30 of these 51 objectives, and progress still goes under
`l01..lNN` rather than `u01..u06` because six units and these lessons are different
partitions of 0097. Stage 3 is where science stops being a set of
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

## The Cambridge Stage 3 depth pass (2026-09-16)

The same pass Grades 1 and 2 had, against the Stage 3 pack: Learner's Book 3,
Teacher's Resource 3, Workbook 3, and the Teacher's Guide 3 — **which has no
text layer at all** (153 pages of page images, 3.8 KB of extractable text), so
nothing could be read from it. The other three extracted cleanly and the
Teacher's Resource is the misconceptions source in any case.

Nothing moved a step: **187 steps, and all thirteen sequences byte-identical to
the shipped pages**, because progress is stored by position.

**This grade had TWO defects waiting, found during the Grade 2 pass and written
down then.** Grade 3 authors a `conclude` question on all eight of its
experiments, and the old renderer ignored every one — `lib/science.js` computes
the phase list now, so waking them made two things visible for the first time:
lesson 9 has two experiments and both asked the bare "What happened?", and its
first `conclude` asked "What does a forcemeter measure?", word for word the
lesson's own practice question. Both are fixed, and the other five experiments'
observation questions are now named after the thing the child watched rather
than using the harness's generic prompt.

**Cambridge's misconceptions are a fixture and a gate.**
`../data/cambridge-stage3-misconceptions.json` holds 43, one per row of the
"Common misconceptions" table in each of the 25 topics. There is no second
source — Stage 3 ships no Ready to Go Lessons — so unlike Stage 2 there are no
`rtg-NN` ids. Its `_excluded` block records the three rows that are NOT in it:
Cambridge defers the filter-paper-and-particles one itself ("particles… not
introduced in the curriculum until Stage 4"), and two are the same row printed
twice.

| | before | after |
| --- | --- | --- |
| misconceptions answered and gated | 0 | 43 / 43 |
| questions | 253 | 368 |
| word cards | 91 | 130 |
| self-check claims | 0 | 94 |
| unscored tier items | 0 | 52 |
| `plan` phases | 0 | 8 |
| `conclude` phases RENDERED | 0 (8 authored, all dead) | 8 |
| table and chart read-offs | 0 | 12 |
| learner words / words per sentence | 36,741 / 10.97 | 49,363 / **10.83** |

Reading demand fell while the volume grew by a third: the highest
Flesch-Kincaid went from 5.02 to 4.90, on Growing Up both times.

**Three words the objectives are written in, that the lessons did not say.**
`cold-blooded` (3Bs.02 is "the distinguishing features of different groups of
animals", and Cambridge defines amphibian and reptile with it) had 0 uses;
`waxing` and `waning` had 0 each in the lesson that teaches the Moon's phases.
All three are now used where the idea is taught and carded. `insoluble`
(3Cp.04), `impression` (3ESp.02) and `spherical` (3ESs.03) were each said once
and never defined, so they get a card and needed no new use.

**The 39 new word cards were measured, not guessed**: the Learner's Book 3
glossary has 115 entries, 69 had no card here, and 35 of those are words the
lessons already say. Lessons 6 and 7 get two cards each and lesson 13 gets
five, because that is what the measurement gave.

**A gate hole, found by a mutation that survived.** A `record` step's read-off
list was never validated, though a `graph` step's was: `read` was added to
`recordTable` in the Grade 1 pass and to `blockGraph` in the Grade 2 pass, and
only the second one got its four lines of validation. Eighteen read-off items
across three live grades had never had their keys or explanations checked by
anything. `build-lessons.py` checks both now, and all three grades pass it — so
the eighteen were in fact sound, which is luck rather than process.

**The 368 keys were read by a person, and 17 things changed.** No key named the
wrong option. Twelve of the seventeen were **extension items I had written that
restated something the lesson already asks** — see the validation appendix, it
is the most useful thing this pass learned about its own authoring.

**Verified in the browser** on the built pages, served on a port other than
4287: all six experiment phases in order, `1 Predict, 2 How to find out,
3 Try it, 4 What happened?, 5 Did it match?, 6 Conclude`, with the conclude
answered; the support bank firing on a wrong answer with its eyebrow on its own
line; nine self-check rows on Gravity and Friction pointing at five different
steps. Zero JS errors, and the only failed requests are the five platform
sidecars that exist only on the deployed tier.

**Serve these pages on any port EXCEPT 4287.** `lib/voice.js` treats
`localhost:4287` as the dev twin and posts every narration line to
`/api/elevenlabs-tts`, which bills per character. On any other port with no
`?pwsEndpoint`/`?pwsToken` the endpoint resolves to `""` and nothing is
requested — which the network log confirms. `npm run preview:src` is the 4287
one.
