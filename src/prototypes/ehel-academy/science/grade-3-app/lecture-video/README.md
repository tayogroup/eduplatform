# The unit lecture films: Science Grade 3, all thirteen lessons

Thirteen films, one in each lesson's **Unit lecture** step, above the parts the
voice reads. Part of the owner's request on 2026-09-19 for Grades 2, 3 and 4
together ("do the same for science grades 2, 3 and 4 all in parallel"), after
the eight Grade 1 films. A film is not a new step, so no step moves and a
learner's saved record still lines up with the dots.

| lesson | film | measured | beats | characters |
| --- | --- | --- | --- | --- |
| 1 Living, Once Alive, Never Alive | `living-once-alive-never-alive` | 2:54 | 31 | 2,103 |
| 2 Flowering Plants | `flowering-plants` | 2:34 | 35 | 2,013 |
| 3 Animal Groups | `animal-groups` | 2:46 | 36 | 2,099 |
| 4 Growing Up | `growing-up` | 2:56 | 34 | 2,184 |
| 5 Inside Your Body | `inside-your-body` | 2:43 | 36 | 2,120 |
| 6 Food Chains | `food-chains` | 2:55 | 33 | 2,187 |
| 7 Solids, Liquids and Gases | `solids-liquids-and-gases` | 2:41 | 35 | 2,059 |
| 8 Mixtures | `mixtures` | 2:45 | 35 | 2,095 |
| 9 Gravity and Friction | `gravity-and-friction` | 2:41 | 32 | 2,050 |
| 10 Light and Shadows | `light-and-shadows` | 2:42 | 35 | 2,070 |
| 11 Magnets | `magnets` | 2:43 | 35 | 2,086 |
| 12 Rocks and Fossils | `rocks-and-fossils` | 2:40 | 36 | 2,005 |
| 13 The Moon | `the-moon` | 2:31 | 32 | 2,001 |

Each film is `<slug>.json` here (the storyboard: its lines, its chapters, its
Cambridge codes and its cues) and its pictures in
`tools/lib/film-scenes/science-g3/<slug>*.js`. The rendered files are named by
content (`<slug>.<sha1 8>.mp4`, `.vtt`, `.jpg`), wired by `LESSON["video"]` in
`content/lesson-N.py` and listed in `app.config.json :: extraPages`.

The narration was bought on 2026-09-24 under the owner's blanket approval for
Grades 2-4: 445 lines, 27,017 characters, against fingerprint `190c8a8095`,
which was re-measured at the moment of purchase rather than reused from the
earlier reading. 444 clips; 55 characters cost nothing because earlier films had
already bought those lines. The clips are cached in `.cache/ehel-lecture-audio/`,
keyed by voice, settings and text, so a picture change re-renders for nothing.

## How the thirteen were made at once

One agent per film, all at once, through `.claude/workflows/ehel-lecture-films.js`
and `tools/run-ehel-lecture-films.js`. Three stages, and the middle one is what
makes the set worth having:

- **draft** - one agent reads its lesson and the brief, writes the storyboard
  and the pictures, and looks at its own frames;
- **review** - a SECOND agent that changes nothing and must quote the lesson or
  the code for every note it makes;
- **revise** - the first agent applies the notes, re-checking each rather than
  trusting it.

The reviewers ran on a smaller model than the writers, and their notes still
carried line numbers, measured coordinates and framework lookups. Seven of the
thirteen films passed review with no notes at all; the other six had one note
each, and every one was real.

**What the reviews caught**, nearly all of them the same shape - a picture that
contradicts the sentence under it:

- a gold ring round the lesson's wooden block that cut through the lesson's own
  word "solid" printed above it;
- the film's red gravity arrow landing on the forcemeter's own printed caption
  "gravity pulls down", hiding two letters for two whole beats;
- the eye chapter claiming Cambridge 3Ps.02, which is about shadows. Stage 3's
  whole Ps sub-strand was looked up: there is no objective about vision, so the
  chapter now claims none, and 3Ps.02 stays where it is actually taught;
- the "Out of the rocks" table showing the finished glass BEFORE the sand it is
  made from, because the sentence says "Glass is melted sand" and the film wired
  that first word to the result - while row 1 of the same table, on screen at
  the same time, correctly read ore, heated, spoon;
- a dashed ring marking where the front legs will grow landing on the tadpole's
  EYE.

The drafters also fixed four to eight faults each in their own work before any
reviewer saw the film. The one worth repeating: a "wide and flat" arrow drawn
across the two leaf tips, in a drawing where the FLOWER sits between the leaves
- so the arrow measured the flower while the line said the leaves are wide.

## What was checked

- **Both sweeps clean.** `--sweep` draws every frame the render will draw:
  71,664 frames on the estimated timeline, and 63,902 again on the MEASURED one
  after narration, nothing outside the 1168 x 440 box, no frame throwing. The
  second sweep is the one that matters - a chapter can look right in estimated
  stills and flick past on real clip lengths.
- **Every rendered film audited as an artefact**, not by filename: h264
  1280x720 with AAC audio, captions carrying one cue per beat (36 beats, 36
  cues), and a real 1280x720 poster of 60-82 KB.
- **Objective coverage**: every film covers every code its storyboard claims,
  and `--dry` reports none missing.
- **Dead cues: twenty**, left deliberately. See below.

## The twenty dead cues, and why they are still here

A beat names phrases in `art.at` - "when the voice says this, do that" - and a
scene reads one with `sc()` or `cue()`. Twenty keys in this grade are declared
and read by nothing, so nothing happens when those words are said.

**No check in the pipeline can see it.** `--dry` counts characters. `--sweep`
draws every frame and finds none wrong, because none IS wrong. And `--sample`
shoots a frame at the dead cue's own moment, so the contact sheet looks
complete - the frame simply does not differ from the one before it. That is why
thirteen agents looking at their own sheets never noticed, and why it surfaced
only when one reviewer diffed two stills and saw that the brightening between
them was the ordinary beat fade.

`node tools/check-ehel-film-cues.js 3` lists them. They are left because no
frame is wrong and no child sees anything broken: the cost is a word that gains
no picture. The rule is in the brief now, so films written after this one check
themselves - Grade 4 has zero across 1,127 declared cues.

## Faults this film work found in the LESSONS

Twenty-five across Grades 2-4, none of them fixed, listed with their line
numbers in [`../../LESSON-FAULTS-FROM-FILMS.md`](../../LESSON-FAULTS-FROM-FILMS.md).
Four are Grade 3's own, and each is worth knowing before reading a film that
works around it:

- the `blood` word card says blood "carries air", against four places in the
  same lesson that carefully say oxygen, or "the goodness from the air";
- the state tester's "Tip the block over" button rotates a square 90 degrees
  about its own centre - the identity transform - so the child presses it,
  hears the thud and sees nothing move;
- "rough carpet" is pictured with the yarn glyph, which draws as a ball of blue
  wool, seven times in the friction lesson;
- steam is pictured with the hot-springs glyph, which draws as flames.

The films draw their own steam and their own block, and quote the lesson's yarn
wherever they are showing the lesson's own table and chart - so the child meets
the film's picture and the lesson's two steps later, until the lessons change.

## Remaking a film

```bash
R=tools/run-ehel-lecture-films.js
A=src/prototypes/ehel-academy/science/grade-3-app
node $R --app $A --dry                      # characters, objectives, the fingerprint; buys nothing
node $R --app $A --sweep                    # every frame of every film; buys nothing
node $R --app $A --render --approved <fp>   # re-render; narration already bought is not re-bought
node tools/check-ehel-film-cues.js 3        # declared cues that no picture reads
```

A re-render is never byte-identical - Chromium's text antialiasing drifts over a
long run - so it always gets a new content-hashed name, and the lesson and
`app.config.json` must both be re-pointed at it. `build-lessons.py` refuses a
lesson naming a film that is not in `extraPages`, which is the gate that catches
a half-done re-point.
