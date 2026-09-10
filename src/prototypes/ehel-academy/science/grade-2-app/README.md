# Grade 2 Science — the standalone lesson build

The second grade built on `../lesson-kit` (the Grade 1 generator, moved into
one kit for every grade when this build started on 2026-09-10). Read the
[Grade 1 README](../grade-1-app/README.md) for what a standalone build is,
what will bite, and the progress namespace; read the
[kit README](../lesson-kit/README.md) for the step kinds and sims. This file
records only what Grade 2 adds.

**The content is Cambridge Primary Science 0097, Stage 2 — all 44 learning
objectives — and, as with Grade 1, NOT the 0846 course under
`science/grade-2/data`.** Stage 2 brings two sub-strands Stage 1 had none of:
*Models and representations* (a model shows an idea clearly; make and use one;
a diagram is not a picture) and *Ecosystems* (habitats). It also adds three
skills to Thinking and Working Scientifically: using a secondary source, spotting
patterns in results, and presenting them as block graphs.

## Build

```bash
K=../lesson-kit
python $K/build-lessons.py --app .      # 10 lessons; refuses on a bad code or key
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

## The ten lessons

| lesson | steps | objectives | what is new here |
| --- | --- | --- | --- |
| 1 Animals and Their Coverings | 17 | 7 | put-in-order (egg to hen), diagram versus picture |
| 2 Teeth and Staying Healthy | 16 | 8 | the `mouth` figure, the first fact-card lookup |
| 3 Habitats | 15 | 9 | habitat scenes, the first block graph with a pattern question |
| 4 Natural or Made? | 14 | 8 | the tester with a hold-it-to-the-light test |
| 5 Changing Materials | 15 | 8 | the `newMaterial` sim: an egg that cooks and will not un-cook |
| 6 Forces Change Things | 16 | 10 | push table → block graph → increasing pattern |
| 7 Light and Dark | 15 | 9 | the `darkRoom` sim: curtains, lamp, total darkness |
| 8 Electricity and Circuits | 15 | 10 | the `circuit` figure, then **build** the circuit and break it |
| 9 Rocks and the Earth | 16 | 11 | rocks in the tester, quarry / mine / riverbed scenes |
| 10 The Sun Across the Sky | 16 | 11 | the `sunPath` sim, shadows measured, recorded, graphed |

155 steps in all (83 of the lessons' own plus the seven-step unit shell on each, see below), about 400 minutes by the hub's estimate.

**Four new step kinds carry the new objectives, and each was added because
no Stage 1 kind could honestly claim the code:**

- `order` — 2Bp.03 (young animals change in an order) and 2ESs.01 (the Sun's
  day): tap what comes first; a wrong tap says which end it belongs at.
- `graph` — 2TWSa.03 and 2TWSa.02: the values come from the step before (a
  count, a table), the child stacks a block per unit until each column is
  right, then answers ONE question about the pattern. A graph a child did not
  build would be a picture; a graph with no pattern question would be a
  picture with blocks.
- `lookup` — 2TWSc.05: the fact card stays on screen while the questions are
  asked, and every answer is in it, so the skill practised is reading for an
  answer.
- `build` — 2TWSm.02 and 2Pe.03 in one shape: parts tapped into a sim that
  knows when the model is complete, then something to DO with it (take a wire
  out, put it back). The circuit is a model of a torch, and the lesson says so.

## Verification on 2026-09-10

- Builder: 10 pages, 0 refusals, 44 of 44 objectives reached; both gates green;
  every inline script parses.
- Reading level on the learner-facing text: 8.3 to 10.1 words per sentence,
  Flesch-Kincaid grade 3.7 to 5.6 (highest on Natural or Made?, where
  "manufactured" and "properties" are the framework's own words). Every line
  is read aloud. British English; no US spellings found.
- Two Emoji-14 glyphs (a jar, a tyre) found by the same scan that caught them
  in Grade 1, and replaced before the first deploy.
- Every lesson driven to completion in the browser by the auto-driver,
  extended for the four new kinds.
- Every step of Lessons 1, 3, 8 and 10 (the block graphs, the fact cards, the
  put-in-order row, the circuit) laid out at 375px with no horizontal overflow.

Not done: a teacher's read, a screen-reader session, the school's own devices,
watching children use it — the same open rows as the Grade 1 validation.

## The unit shell (2026-09-10)

Owner, 2026-09-10: every lesson now carries the furniture the English Grade 1
build carries around a unit. `lesson-kit/_shell.py` draws seven steps around
the lesson's own, in this order:

    overview  lecture  words  <the lesson's own steps>  games  home  quiz  world  resources

| step | what it is | where the content comes from |
| --- | --- | --- |
| What this lesson is about | the outcomes in the child's words, with counts | `LESSON["about"]` |
| Unit lecture | the lesson told in five parts by the voice, one picture each; says on its face that there is no video | `LESSON["lecture"]` |
| Science words | word, picture, meaning and sample uses; tap each, then "which word means…?" | `LESSON["words"]` |
| Games | a quick quiz, a sort race, word pairs and a spelling game, DERIVED from the lesson; two earn the sticker | nothing new: the questions, the sorts and the words |
| Things to do at home | three real projects: what you need, what to do, what to look for | `LESSON["home"]` |
| Science world | a placeholder that says so and ticks itself | none yet |
| Student resources | a drawer: the words, the grade's word finder, the home projects, the objectives for a grown-up, the strands, the hub | assembled by the builder |

The hub counts the same steps the page draws (it expands each lesson through
the same function), and its grown-ups section lists the home projects beside
the experiments. Every shell step except the placeholder and the drawer carries
the lesson's own objective codes, so the coverage floors did not move.

Added on 2026-09-10 and verified the same day: 70 science words; both gates
green; the seven shell steps driven to completion in the browser on Lesson 8;
no horizontal overflow at 375px on any step of Lesson 3, in the game overlay,
or in the word finder.
