# The unit lecture film

`bones-and-muscles.mp4` — about three minutes, 1280×720, narrated in the
platform voice — plus its captions (`.vtt`) and its poster (`.jpg`). Built by
[`tools/create-ehel-science-unit-lecture.js`](../../../../../../tools/create-ehel-science-unit-lecture.js)
from `bones-and-muscles.json`, the storyboard beside it.

```bash
T=tools/create-ehel-science-unit-lecture.js
node $T --app src/prototypes/ehel-academy/science/grade-4-app --slug bones-and-muscles --dry        # characters + objective coverage, buys nothing
node $T --app ... --slug ... --preview                                                              # one still per beat, buys nothing
node $T --app ... --slug ... --calibrate                                                            # buys the 3 longest clips, reports the real speaking rate
node $T --app ... --slug ...                                                                        # narrate, render, mux
```

Then rebuild the page, because the film reaches a learner only through it:

```bash
python ../lesson-kit/build-lessons.py --app . 1   # and the rest of the pipeline in the app README
```

## Three things worth knowing before changing it

**The artwork is the lesson's, not a copy of it.** The skeleton and the arm are
sliced out of `lesson-kit/lib/science.js` at render time, so the child watches
the same drawing they tap two steps later. `armSvg()` only knows three poses
and a film needs the motion between them, so the tool adds `armSvgAt(b, tr)`,
which interpolates the *same constants*; its three endpoints are compared with
`armSvg()`'s own output character for character and **the render refuses on a
mismatch**. That check is the whole safety of the arrangement — redraw the
lesson's arm without re-deriving the tween and the build stops instead of
shipping a film of an arm that is no longer in the lesson.

Two things the film reframes and does not fix, because fixing them would edit
the lesson's artwork and the gate above would then refuse the render:
`armSvg`'s "tendons join muscle to bone" runs past its own viewBox, and at the
full bend the hand rotates to about y −55, outside it as well. Both are clipped
in the lesson too. The film widens the frame (viewBox *and* the drawing's own
background rect, together) so the picture is identical with more page beside
it. −62 is measured, not guessed.

**The animation is timed from the voice.** Every beat is narrated first,
ffprobed, and the timeline is built from the measured lengths — so a bone
lights up as it is named however long that clip turned out to be, and nothing
has to be re-timed by hand when a line is reworded. Clips are cached by a hash
of (voice, model, text) under `.cache/ehel-lecture-audio/`, so a visual change
re-renders for nothing and only edited narration is re-bought.

**Cut the script before buying it, not after.** `--dry` reports the character
count, `--calibrate` buys the three longest clips and reports what the voice
actually does with them, and `--preview` renders one still per beat from that
rate. Measured on 2026-09-17 with this voice and these settings: **15.92
characters a second**. A script trimmed against a guessed rate is re-bought at
full price when the guess is wrong.

## What it covers

All eight of Lesson 1's Cambridge 0097 Stage 4 objectives, and `--dry` prints
the mapping. **That listing proves a code is named by a scene and nothing
more** — the same limit `CLAUDE.md` records for every other citation gate in
this repo. What each scene actually teaches:

| scene | objective | what is delivered |
| --- | --- | --- |
| The bones to know | 4Bs.01 | all seven named, each lit on the skeleton with its own distinguishing fact |
| What a skeleton is for | 4Bs.03 | protect, support, shape, move — plus "bones are alive", the misconception the lesson's own step answers |
| Muscles pull | 4Bs.02 | joined by a tendon; contract = shorter and fatter; **can only pull** |
| So they work in pairs | 4Bs.02, 4TWSp.03, 4TWSa.01, 4TWSa.03 | the pair taking turns, on a loop; question → prediction → result → conclusion built one card at a time |
| Why moving matters | 4Bp.04 | muscles, bones **and the heart** — the objective says human health, not skeleton health |
| People who use this | 4SIC.04 | four jobs, each with what they use it for |

The question card in the pair scene is there for a specific reason: 4TWSa.03 is
not "make a conclusion" but "make a conclusion from results **and relate it to
the scientific question being investigated**", and the question was being asked
in the narration and then leaving the screen before its answer arrived.

## Deploying it

The three files are listed in `app.config.json :: extraPages`, so
`lesson-app-tools/deploy.mjs` carries them into
`Ehel Primary/app/science/grade-4-v2/lecture-video/`. `build-lessons.py`
refuses a lesson that names a film which is not **both** on disk and in that
list — a named-but-unshipped film is a broken player on the lesson page, and
the page cannot tell a child why.

`deploy.mjs :: ctype()` learned `.mp4`, `.vtt`, `.jpg` and `.png` for this. A
video served as `text/html` does not play; the browser refuses it before the
element is ever asked to.
