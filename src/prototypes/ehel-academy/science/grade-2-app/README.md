# Grade 2 Science — the standalone lesson build

The second grade built on `../lesson-kit` (the Grade 1 generator, moved into
one kit for every grade when this build started on 2026-09-10). Read the
[Grade 1 README](../grade-1-app/README.md) for what a standalone build is,
what will bite, and the progress namespace; read the
[kit README](../lesson-kit/README.md) for the step kinds and sims. This file
records only what Grade 2 adds.

**The content is Cambridge Primary Science 0097, Stage 2 — all 44 learning
objectives — and, as with Grade 1, NOT the six-unit course under
`science/grade-2/data`.** That course declared the 2018 framework (0846) until
2026-09-17 and now declares 0097 too, so the two are no longer built to different
frameworks — but its six units are one per content sub-strand of the 2018
framework, so it reaches 29 of these 44 objectives, and progress still goes under
`l01..lNN` rather than `u01..u06` because six units and these lessons are different
partitions of 0097. Stage 2 brings two sub-strands Stage 1 had none of:
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
| 9 Rocks and the Earth | 17 | 11 | rocks in the tester, quarry / mine / riverbed scenes |
| 10 The Sun Across the Sky | 17 | 12 | the `sunPath` sim, shadows measured, recorded, graphed |

157 steps in all (87 of the lessons' own plus the seven-step unit shell on each,
see below), about 410 minutes by the hub's estimate. Lessons 3 and 10 gained an
objective in the 2026-09-16 depth pass and lessons 9 and 10 a practice step in
the 2026-09-11 fix pass; `objectiveFloors` in `app.config.json` records the
measured count after each build and may rise, never fall.

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

## The Cambridge Stage 2 depth pass (2026-09-16)

The same pass Grade 1 had on the same day, against the four Stage 2 books
(Learner's Book 2, Teacher's Resource 2, Ready to Go Lessons Stage 2, Teacher's
Guide Stage 2). Nothing here moved a step: **157 steps, and all ten sequences
byte-identical to the shipped pages**, because progress is stored by position.
Everything was added INSIDE an existing step, or onto the sticker shelf, which
is not a step.

**Cambridge's misconceptions are now a fixture and a gate.**
`../data/cambridge-stage2-misconceptions.json` holds 51 of them - 37 from the
Teacher's Resource, keyed `<topic>-m<N>`, and 14 more from Ready to Go, keyed
`rtg-NN`. A step names the ones it answers in `mis=[...]`, `check-coverage.py`
refuses a citation the fixture does not hold or that it assigns to another
lesson, and coverage may not fall below `minimumCovered`. The file also carries
an `_excluded` block: five Ready to Go entries that duplicate a Teacher's
Resource row (folded into it, with the id that absorbed them) and two Cambridge
DEFERS to a later stage - "a still object has no forces" to Stage 5 and "we see
because of what our eyes do" to later stages. Writing down what was left out is
the half of the record that stops the next pass re-finding it.

**Cambridge's five-move enquiry, where the shape allowed it.** Stage 2's
experiments had predict / try / what happened / did it match; Cambridge's method
is question → predict → **plan** → observe → **conclude**. Five experiments
gained a `plan` ("which way is fair?") and five a `conclude`, and `lib/science.js`
now COMPUTES the phase list from whether those keys are present, so a step
without them behaves exactly as before.

**Data that gets read rather than just filled in.** 2TWSa.02 and 2TWSa.03 are
about finding a pattern and INTERPRETING a table or graph, and one question per
table was thin for that. Eight steps gained a `read` list - five record tables
and three block graphs - asked with the table or the graph still on screen.
`blockGraph` learned the same `read` phase `recordTable` already had.

**The self-check, the tiers, and the words.**

- 74 "Look what I can do!" claims on the sticker shelf, Cambridge's own closing
  block, one per topic-sized idea. Each names an objective THIS lesson's own
  steps carry and the builder resolves it to the step that teaches it - it
  refuses a code no step carries, which is what stops the Grade 1 bug where
  every claim resolved to step 0 (`_shell.expand` gives the shell steps the
  whole lesson's codes, so the search has to run over `lesson["steps"]`).
- 40 differentiation items, from Ready to Go's own Support and Extension pairs:
  a two-option `support` bank that NARROWS the task after a wrong answer, and an
  `extension` bank that WIDENS it after a clean finish. Neither is scored and
  both say so on screen.
- 101 science words, up from 70. The 31 were measured, not guessed: the
  Learner's Book glossary has 160 entries, 125 had no card here, and 77 of those
  are words the lessons already say. The cards are the ones each lesson uses most
  and never defines, plus three Cambridge CONTRAST partners we taught only one
  half of - `absorbent` against waterproof, `smooth` against rough, and `shiny`,
  defined here against dull.

**Three pieces of taught language corrected**, each against Cambridge's own
instruction: `absorbent` now names the opposite of waterproof in Lesson 4's
property list and lecture (the lesson already answered TR 3.4-m1's "waterproof
is on or off" in a question, but had no word for the other half); Lesson 8 says
**lamp** where it said "bulb" four times, keeping one use named as the everyday
word, because Ready to Go says use "lamp" from the start and the lesson's own
quiz item teaches exactly that.

**The 292 keys were read by a person, and 17 things were changed.** No key named
the wrong option. What the read found: two pieces of wrong science (one key
taught that inherited features never land in between, and backed it with a claim
about height that is the reverse of the truth; another said toasting changes
bread all the way through); four read-off questions that asked about rows their
table does not have; three items that repeated something the same lesson already
asked; two distractors that were not actually wrong; and six pieces of loose
wording. `../lesson-kit/build-review-pack.py` writes `review-pack.html` - every
question, judgement items first - and is not in the deploy set.

**Verified in the browser on 2026-09-16**, on the built pages served from
localhost:

- The support bank fires on a wrong answer and the extension bank after a clean
  finish; both label themselves "not marked"; the graph read-off asks
  "Reading the graph: 1 of 2" and "2 of 2" with the graph still on screen.
- Every self-check row routes to the step that teaches its code - "I can say
  how a diagram is different from a picture" opens step 10, *Diagram, or
  picture?* - and the eight rows of Lesson 1 point at seven different steps.
- One real defect that no gate could see, found by answering a question wrongly:
  the tier label ran into the question ("One step at a timeWhich animal has
  feathers?"). `qbook` is English's class, which came over with `deck.js` and is
  styled in English's stylesheet and never in Science's. It shipped that way in
  Grade 1 earlier the same day; `lib/science.css` now defines it and both grades
  were rebuilt.
- The only failed requests are the five platform sidecars
  (`learner-controls.js`, `wehel.js`, `course-shell.js`, `seb-session.js`,
  `progress-client.js`), which exist only on the deployed tier. Zero JS errors.

**Serve these pages on any port EXCEPT 4287.** `lib/voice.js` treats
`localhost:4287` as the dev twin and posts every narration line to
`/api/elevenlabs-tts`, which bills per character; on any other port with no
`?pwsEndpoint`/`?pwsToken` the endpoint resolves to "" and the module reports
itself unavailable, so nothing is requested - which is what the network log
above confirms. `npm run preview:src` is the 4287 one.
