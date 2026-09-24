# The unit lecture films: Science Grade 4, lessons 2 to 13

Twelve films, one in each lesson's **Unit lecture** step, above the parts the
voice reads. The last of the owner's 2026-09-19 request for Grades 2, 3 and 4
together ("do the same for science grades 2, 3 and 4 all in parallel"). A film
is not a new step, so no step moves and a learner's saved record still lines up
with the dots.

**Lesson 1, Bones and Muscles, is not one of these.** It has its own film, made
earlier with its own tool, and it is not remade - its files here
(`bones-and-muscles.*`) and its own `README.md` beside this one are untouched.

| lesson | film | measured | beats | characters |
| --- | --- | --- | --- | --- |
| 2 Backbone or Not? | `backbone-or-not` | 2:53 | 35 | 2,131 |
| 3 Staying Healthy | `staying-healthy` | 2:41 | 34 | 2,054 |
| 4 Energy for Life | `energy-for-life` | 3:03 | 35 | 2,305 |
| 5 Habitats and Survival | `habitats-and-survival` | 2:50 | 33 | 2,193 |
| 6 Particles | `particles` | 2:52 | 33 | 2,261 |
| 7 Changes and Reactions | `changes-and-reactions` | 2:54 | 34 | 2,206 |
| 8 Energy Everywhere | `energy-everywhere` | 2:53 | 34 | 2,214 |
| 9 Light and Seeing | `light-and-seeing` | 2:51 | 35 | 2,260 |
| 10 Circuits and Switches | `circuits-and-switches` | 2:53 | 35 | 2,183 |
| 11 Inside the Earth | `inside-the-earth` | 2:53 | 35 | 2,241 |
| 12 The Solar System | `the-solar-system` | 3:05 | 35 | 2,314 |
| 13 The Paper Spinner | `the-paper-spinner` | 3:03 | 33 | 2,345 |

Each film is `<slug>.json` here and its pictures in
`tools/lib/film-scenes/science-g4/<slug>*.js`. The rendered files are named by
content (`<slug>.<sha1 8>.mp4`, `.vtt`, `.jpg`), wired by `LESSON["video"]` in
`content/lesson-N.py` and listed in `app.config.json :: extraPages`.

The narration was bought on 2026-09-24 under the owner's blanket approval for
Grades 2-4: 411 lines, 26,707 characters, against fingerprint `992efc11cb`,
re-measured at the moment of purchase rather than reused.

## Length was decided by measurement, not by trimming

The estimates ran 3:02 to 3:22, above the brief's band, and nothing was cut.
Grade 3's thirteen films had just been bought, so the overshoot was a measured
figure rather than a guess: **4.9% to 14.2% long, median 10.8%**, eleven of the
thirteen between 8% and 14%. That predicted 2:41 to 3:02 here. The films came in
at **2:41 to 3:05** - the longest exactly at the band's top rather than over it.

Trimming twelve finished, reviewed films against a soft guideline would have
cost more than it bought. The rule worth keeping: buy one grade, measure it, and
let that decide the next.

## How the twelve were made

One agent per film, all at once, through `.claude/workflows/ehel-lecture-films.js`
and `tools/run-ehel-lecture-films.js`: **draft**, then **review** by a second
agent that changes nothing and must quote the lesson or the code for every note,
then **revise** by the first, which re-checks each note rather than applying it.

Four of the twelve passed review with no notes. The notes on the others were
mostly a picture contradicting its own sentence - and two were a kind the
earlier grades had not turned up:

**The film inventing content the lesson does not have.** The Paper Spinner drew
a hand-span demonstration - two people getting "7 spans" and "5 spans" of the
same height, beside two tape measures both reading "150 cm" - and none of it is
in the lesson. Whole-lesson searches: `span` appears three times with no figures
attached, and `150` appears once, in an unrelated extension question about
laying a 50 cm ruler down three times. The film had taken a number from a
different question and built a worked example around it. Cut. Changes and
Reactions had the milder version - "It is liquid water now, **and it flows**",
true, and a claim the lesson never makes (`flow` appears nowhere in it) - also
cut. A child being taught a worked example that a parent cannot find in the
lesson is worse than a drawing fault.

After that fix, The Paper Spinner's reviser checked every other figure the film
shows against `lesson-13.py`: the six drop times (2.1, 2.3, 2.0 and 2.8, 3.0,
2.7), the "about 2.1 s" summaries and the dot-plot ticks all match word for
word. Nothing else was invented.

**A comment asserting something false about the lesson.** Two of Backbone or
Not's scene files justified using the kit's skeleton and insect drawings by
saying the child "taps them two steps later". Lesson 2 has no figure, sim or
scene step at all - nothing in it is ever tapped. The drawings were the right
choice and were kept; the reason was rewritten, because the next person to read
that comment would have believed it.

Others worth keeping: the sea food chain naming "tiny floating plants", "a small
fish" and "a bigger fish" while drawing all four at one size; two pills drawn at
the same point with unsynchronised fades, unreadable for 0.4 s; the opening beat
of Habitats and Survival lighting the two habitats and doing nothing at all for
the camel and the polar bear the lesson is about.

**The revisers rejected their own first attempts twice, after looking at
frames.** Backbone or Not copied a sibling chapter's gold flash and found in
matched stills it was barely visible - the same gold as the panel border - and
used orange instead. Habitats found its first fix had spliced marks into the
wrong `</svg>`: a plain string replace hit the one belonging to the kit's
woodlouse drawing nested inside the card. Neither would have shown in any check.

## What was checked

- **Both sweeps clean**: 69,859 frames on the estimated timeline and again on
  the MEASURED one after narration - nothing outside the 1168 x 440 box, no
  frame throwing.
- **Zero dead cues across 1,127 declared** (`node tools/check-ehel-film-cues.js 4`).
  Grade 4 is the first set written after that check existed, and the rule is in
  its brief; Grades 1, 2 and 3 carry 6, 8 and 20, left deliberately.
- **Objective coverage**: every film covers every code it claims. The Paper
  Spinner's 12 of 12 is legitimate and was checked twice - it is the one lesson
  that is entirely Thinking and Working Scientifically, and all twelve codes are
  carried by a step and a can-do in `lesson-13.py`.
- `renderer.skin: "brown"` on all twelve, as the owner asked for new films.
  Bones and Muscles is untouched.

## Faults found in the LESSONS

Seven of the twenty-seven in
[`../../LESSON-FAULTS-FROM-FILMS.md`](../../LESSON-FAULTS-FROM-FILMS.md) are
Grade 4's, and **the four in Staying Healthy's support banks are the group worth
acting on first** - they are about teaching rather than drawing. The questions
written for the children who need most help test a symptom the lesson never
teaches ("fever" appears nowhere else in the file), answer Yes six times out of
seven, and spend half of one four-question bank restating the step's own core
question.
