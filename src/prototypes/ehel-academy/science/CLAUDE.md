<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### Science answer keys and Cambridge mapping are gated

Two checks inside `check:science`, both added after the Computing course shipped
three keys bound to the wrong option with every gate passing them.

**`check-science-answer-keys.mjs`** compares each quiz key with the answer key
printed in its own booklet. Science is far more exposed than Computing here:
598 of its 636 questions come from the booklet, where Computing generates 580
of 768 from the unit's own content and only 188 can disagree with anything.
Ground truth is a committed fixture (`science/data/booklet-answer-keys.json`),
not the content model — `outputs/` is gitignored, so a gate reading the model
finds nothing on a fresh clone and passes having compared nothing. Where the
model IS present the keys are re-derived and the fixture must still match.

```bash
node tools/check-science-answer-keys.mjs --write-fixture   # after extract:science-content
```

**Coverage is recorded and may not fall.** 480 of 636 questions are covered;
the fixture stores that as `minimumCovered` and the gate fails if it drops. A
parser that stops recognising one pack's key layout otherwise takes a whole
unit out of the comparison while the gate still prints ✓ — which is exactly how
156 questions can sit unchecked behind a green tick. Coverage is a number that
only goes up.

The 156 uncovered are 13 units, all-or-nothing per unit, and 6 of them are
**Stage 1, which ships no Practice booklet at all** (Activities, Experiments and
Lesson only — and no Reference, so no glossary either). Those have no booklet
key to check against and never will.

The packs write keys five ways — a 3-column table, a whole section packed into
one cell, and three paragraph forms — and one gives the key run the **same
section name as the questions**. Two traps worth keeping:

- **Splitting keys from questions by section name does not work.** The key
  sections are "Section A Answers" (no "Key" in the name) while the QUESTION
  section is "Section A: Choose the Right Answer" — matching on "answer" swaps
  the two. Position works, but only anchored to a question first: one pack
  titles its whole document "Practice Questions and Answer Keys", so an
  unanchored boundary lands at block 1 and swallows the unit.
- **A letter regex must require its bracket.** Allowing a bare `[a-e]` ate the
  first character of every answer starting with one — "clear glass" became
  "lear glass" and read as a mismatch against a correct key.

**`check-science-cambridge-objectives.mjs`** checks the mapping nothing was
checking. Beyond "the code exists in this stage", it compares the objective
**text** stored beside each code against the framework: a code stays valid
while the text beside it goes stale, and the text is what a teacher reads. It
also prints per-stage coverage, so a stage mapped to a fraction of its
objectives is visible rather than passing as "all codes valid" — Stage 8
currently references 26 of 70, Stage 4 18 of 34.

### Reviewed Science scripts

Narration scripts are reviewed in a workbook, not in the repo: `export-ehel-science-scripts.py` flattens every learner-facing line into one sheet per grade, and the reviewed file comes back from OneDrive. Those corrections cannot be hand-applied to `science/grade-*/data/` (generated), so they live in `science/data/script-review.json` and the builder lays them over every rebuild:

```bash
python tools/apply-ehel-science-script-review.py --workbook <reviewed.xlsx>   # --dry to preview
npm run build:science && npm run check:science
```

The apply step **merges** into the existing override file. It finds edits by diffing the workbook against the content on disk, which already carries any earlier review — so a re-run adds newly resolved rows instead of shrinking the file to just those. It also proves its parser on every row against the real JSON before trusting it on an edit, and refuses to apply half of an answer/options pair. Rows it reports as skipped need a human; they are not silently dropped.

### Science narration audio

`generate-ehel-science-audio.js` pre-renders each Listen button to `media/audio/tts/<cyrb53(text)>.mp3`. The hash is over the button's exact text, so the generator's strings must match `science/shared/course-ui.js` character for character — otherwise the app requests a file that was never written, silently falls back to the paid runtime endpoint, and the clip is money spent on a file nobody serves. `check:science` gates this via `check-ehel-audio-coverage.mjs`, which fails when a Listen button appears that no generator category reproduces, when a template drifts, or when the two copies of `cyrb53` diverge. Run the generator with `--dry` first; it reports characters, and ElevenLabs bills per character.

**`tools/lib/ehel-<subject>-narration.js` is the one definition** of what a course narrates and what each clip is called (`ehel-science-narration.js`, `ehel-math-narration.js`, `ehel-global-perspectives-narration.js`; the hash itself lives in `ehel-narration-hash.js`). Three tools must agree exactly and used to hold drifting copies — the generator (what to buy), `upload-media-to-bunny.js` (where each clip belongs in the deploy tree) and `prune-ehel-course-audio.mjs` (what nothing can reach). Change narrated text there, never in a copy.

Mathematics works the same way and is gated by `check:math`. The two courses share a UI, so they share the button shapes; Mathematics simply has no vocabulary word-cards.


### Unit lecture films: the artwork is the lesson's, and a gate holds it there

```bash
T=tools/create-ehel-science-unit-lecture.js
node $T --app src/prototypes/ehel-academy/science/grade-4-app --slug bones-and-muscles --dry        # characters + objective coverage, buys nothing
node $T --app ... --slug ... --preview                                                              # a still per beat + both cards, buys nothing
node $T --app ... --slug ... --calibrate                                                            # buys the 3 longest clips, reports the real speaking rate
node $T --app ... --slug ...                                                                        # narrate, render, mux
```

The `lecture` step used to print "There is no video for this lesson yet." on
its own face. Where a lesson names a film in `LESSON["video"]` it now draws a
player above the parts, and where one does not, every line of `lecture()`
behaves as it did — `film &&` guards every addition rather than the old path
being rewritten around it. The first film is Grade 4 Lesson 1, Bones and
Muscles; its storyboard, its README and the built file are in
`grade-4-app/lecture-video/`.

**The skeleton and the arm are sliced out of `lesson-kit/lib/science.js` at
render time**, not copied into the renderer, so the child watches the same
drawing they tap two steps later. `armSvg()` knows only three poses and a film
needs the motion between them, so the tool adds `armSvgAt(b, tr)` from the same
constants — and compares its three endpoints with `armSvg()`'s own output
**character for character**, refusing the render on a mismatch. That check is
the whole safety of the arrangement: redraw the lesson's arm without
re-deriving the tween and the build stops rather than shipping a film of an arm
that is no longer in the lesson. It is also why the film **reframes** two
clipping faults in that artwork instead of fixing them — `armSvg`'s tendon
label runs past its own viewBox and the bent arm's hand rotates to about y −55,
both clipped in the lesson too. The viewBox and the drawing's own background
rect grow together, so the picture is identical with more page beside it.

**It wears the lesson's DARK theme, and that is not a taste decision.** Every
colour is a token from `lesson-kit/lib/lesson.css` — its dark half, which is
what the lesson page actually renders in. The first cut used the light half and
inside the page it read as a lit rectangle punched into a dark lesson. It suits
the artwork too: the bones are `#E9E4D6` with no backdrop of their own, so on
light they were cream on white and needed a plate bolted behind them. The ARM
keeps a light card and has to — its labels are baked in at `#1B1B1B` and the
drawing may not be edited.

Three things the dark stage made visible that the light one hid, all now fixed:
the Cambridge codes floated bottom-right and in the pair scene four of them
landed **across the Conclusion card**; the kicker repeated "Grade 4 Science"
which the top bar says two lines above; and the skeleton stacked the lesson's
green `.found` outlines until, by the seventh bone, seven crude bounding boxes
sat over the figure and read as debug boxes. Already-named bones are marked by
BRIGHTNESS now, and only the bone being named wears the gold pointer.

**A silent title card opens it and a silent end card closes it** (`OPEN_HOLD`
3.6s, `END_HOLD` 5.0s). Silent is deliberate: a beat is defined as one
narration clip, so a card is not a beat, and narrating furniture would re-open
a paid script. They are timeline segments at the two ends with matching silence
on the audio track, and `frame()` hands off to them before it looks for a beat
at all. **`--preview` could not see them** — it shoots one still per beat — so
it now shoots each card by name as well; that is worth knowing before trusting
a preview sweep of anything that is not a beat.

**The film points with a LINE, not with a character (owner, 2026-09-17).**
Asked whether an animated cartoon teacher should float to the action and point
at it; both were mocked up as stills on the same frame and compared before
deciding. The character was a second focal point carrying no information, its
gesture did not actually land on the bone, and five of the eight scenes leave
nowhere for it to stand — the arm scenes and the three card scenes are full
width. It also does not exist: the platform has no mascot art and Wehel's
"Virtual teacher" is a persona toggle with no face, so inventing one makes it
the platform's teacher across 24 builds by default. Parked for Grades 1-2.

`drawLeader` draws the curve instead, list entry to bone, ending at the near
edge of the bone's own gold marker. **It is the one thing in the renderer that
MEASURES** — the bone is inside an SVG viewBox, the list entry is HTML in normal
flow, and there is no shared geometry to compute a line from. Still
deterministic, so a frame is still reproducible.

**The animation is timed from the voice, not the other way round.** Every beat
is narrated first, ffprobed, and the timeline is built from the measured
lengths, so a bone lights up as it is named however long that clip turned out
to be. Clips are cached by a hash of (voice, model, text) under
`.cache/ehel-lecture-audio/`, so a visual change re-renders for nothing and only
edited narration is re-bought — the three-card health rework and the whole
layout pass cost nothing.

**Cut the script before buying it.** `--calibrate` exists because the alternative
is trimming against a guessed rate and re-buying at full price when the guess is
wrong. Measured 2026-09-17, this voice and these settings: **15.92 characters a
second**, against a 14.2 guess that had put the same script at 3:34 instead of
2:55.

Two things the tool cannot check, and one it now can:

- `build-lessons.py` refuses a lesson naming a film that is not **both** on disk
  and in `app.config.json :: extraPages` — a named-but-unshipped film is a
  broken player on a lesson page and the page cannot tell a child why. Verified
  by watching it refuse.
- `deploy.mjs :: ctype()` learned `.mp4`, `.vtt`, `.jpg` and `.png`. A video
  served as `text/html` does not play; the browser refuses it before the element
  is ever asked to. Every other build is unaffected — the default is still
  `text/html`, because every file this tool had ever shipped was a page.
- **`--dry`'s objective listing proves a code is NAMED by a scene and no more**,
  exactly as the root CLAUDE.md records for every other citation gate here. What
  each scene actually delivers is written out in the film's own README, and
  writing it out is what found the real gap: 4Bp.04 is "the importance of
  movement in maintaining human HEALTH" and the scene only ever said muscles and
  bones. It says heart now.
