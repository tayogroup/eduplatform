# The unit lecture films: Science Grade 2, all ten lessons

Ten films, one in each lesson's **Unit lecture** step, above the parts the voice
reads. Part of the owner's request on 2026-09-19 for Grades 2, 3 and 4 together
("do the same for science grades 2, 3 and 4 all in parallel"), after the eight
Grade 1 films. A film is not a new step, so no step moves and a learner's saved
record still lines up with the dots.

Written up after the fact: Grade 2 shipped on 2026-09-23 (commit `6f13aba28c`)
without this file, which Grades 1 and 4 both have. Nothing here is new work -
it is the account that should have gone with the commit.

| lesson | film | measured |
| --- | --- | --- |
| 1 Animals and Their Coverings | `animals-and-their-coverings` | 2:27 |
| 2 Teeth and Staying Healthy | `teeth-and-staying-healthy` | 2:32 |
| 3 Habitats | `habitats` | 2:39 |
| 4 Natural or Made? | `natural-or-made` | 2:39 |
| 5 Changing Materials | `changing-materials` | 2:23 |
| 6 Forces Change Things | `forces-change-things` | 2:37 |
| 7 Light and Dark | `light-and-dark` | 2:22 |
| 8 Electricity and Circuits | `electricity-and-circuits` | 2:43 |
| 9 Rocks and the Earth | `rocks-and-the-earth` | 2:28 |
| 10 The Sun Across the Sky | `the-sun-across-the-sky` | 2:32 |

Each film is `<slug>.json` here (the storyboard) and its pictures in
`tools/lib/film-scenes/science-g2/<slug>*.js`. The rendered files are named by
content (`<slug>.<sha1 8>.mp4`, `.vtt`, `.jpg`), wired by `LESSON["video"]` in
`content/lesson-N.py` and listed in `app.config.json :: extraPages`. 19,240
characters of narration, bought once against the fingerprint of every line
(`e0e8c1d964`).

## How the ten were checked, which is the part worth keeping

Each film was written by its own agent, then **reviewed by a second agent that
changed nothing** and had to quote the lesson or the code for every note, then
revised by the first. That found 47 faults in the pictures, and the ones that
mattered were the film contradicting its own words:

- the cat drawn with no claws beside a clawed dog, on "a cat has claws it can
  pull in, and a dog does not";
- a red cross drawn across an ill child's face, in a film where a red cross has
  meant "not this" (the face dims and sinks now, and rises with the grown-up:
  cross the hiding, never the child);
- germs under a magnifying glass on "They are too small to see";
- the only drawn PULL an arrow pointing into the ball, which is a push;
- a bracket labelled "long again" measuring 214 px where the morning's "long"
  measured 395;
- a recap card titled Waterproof, showing glass, saying "wool is absorbent";
- a pointer ringing the top wire while the bottom one appeared.

**The revising agents did not take the notes on trust either.** Three of the
review's suggested fixes were measured and found wrong - one would have put a
ring 18 px outside the frame, one would have landed an arrow on the hens it was
meant to clear, one would have drawn the water across the penguin - and each was
fixed a different way, in the scene's own coordinates. One review claim (a thumb
touching neither hand nor forearm) was wrong on the geometry and right on the
verdict: the fault was draw order.

## The lesson kit's quarry drawing was fixed here

It is a lesson fault, not a film one: `SCENES.extract` stood its worker and its
lorry 40 units above the terraces they are drawn on, in the lesson as well as in
the film. A text baseline is the ground line, so they sit at y 120 and y 180 now.
Grade 2 Lesson 9 is the only lesson that draws it.

## What was checked

Rebuilt with the committed shared tools and the working-copy index builder.
`check-lessons` and `check-coverage` pass: 44 of 44 Stage 2 objectives reached,
51 of 51 misconceptions answered, 157 indexed steps. Every frame of every film
was swept on the MEASURED timeline - 45,686 frames, nothing outside the
1168 x 440 box, no throws - and a film was played in a built page to see that it
reaches the browser as `video/mp4` with its captions and poster.

## Known, and left

**Eight dead cues.** A beat names phrases in `art.at`; a scene reads one with
`sc()` or `cue()`. Eight keys in this grade are declared and read by nothing, so
nothing happens when those words are said. Found after Grade 2 shipped, by the
check that came out of Grade 4's review
(`node tools/check-ehel-film-cues.js 2`). No frame is wrong and no child sees
anything broken - the cost is a word that gains no picture - so they are left
rather than re-rendering ten live films. Grade 3's README has the full account
of why nothing in the pipeline can see this.

**Lesson faults found and not fixed**: eight of the twenty-five in
[`../../LESSON-FAULTS-FROM-FILMS.md`](../../LESSON-FAULTS-FROM-FILMS.md) are
Grade 2's, including two adjacent Habitats questions that teach opposite rules
about whether an animal's sleeping place alone is its habitat, and a support
question that describes the molars with the word the lesson has trained as the
incisors'.
