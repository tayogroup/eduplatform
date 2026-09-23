# The halving-joint film: what was done, and what is left

Updated 2026-09-23, after the second pass. The list this file used to hold —
five reworked scenes (A), eight missing actions (B) and five missing
explanations (C) — is **done in full**. What follows is the record of it and
the short list of what genuinely remains.

The film as first shipped (`a501162d`, 10 scenes, 3:01) showed **results, not
work**: 3 of 10 scenes moved anything, 4 drew a tool and all 4 held it still,
and the scene called "Which side of the line" contained no saw. It is now
**11 scenes, 30 beats, 3:52**.

---

## A. Tools that work (done)

| # | item | what it does |
| --- | --- | --- |
| 1 | show the cut | a tenon saw strokes down, the kerf deepens under it, dust gathers at the mouth; the right way and the wrong way are both cut on screen |
| 2 | marking tools travel | the square seats on the face edge before a knife runs down its blade; the gauge is pushed along the wood with the line appearing behind its pin |
| 3 | pare in strokes | four alternating strokes, a shaving lifting from each, the waste stepping down |
| 4 | zoom for the millimetre | a 6× close-up of the kerf beside the line |
| 5 | motion fills the beat | `beatU`, `stroke` and `progress` tie movement to the spoken sentence instead of a half-second ease |

## B. Actions the narration named and the film did not show (done, no narration cost)

| # | item | where |
| --- | --- | --- |
| 6 | **planing** | faces — a bench plane runs the board for as long as "planed straight, planed square" lasts |
| 7 | offer up the other member | shoulder — it comes down, rests on the work, is ticked off, lifts away leaving the width |
| 8 | mark the face marks | faces — a knife makes the ƒ and the edge mark instead of them fading in |
| 9 | the square proving a right angle | tools — a piece of timber is offered to it and the 90° is marked |
| 10 | the mallet | fit — it swings, strikes, and the joint stays open |
| 11 | a tape across the diagonals | fit — and across a **frame**, which is the object you actually check |
| 12 | the waste falling away | saw — cut free, then gone |
| 13 | the notch being cut | joint — sawn to half thickness and lifted out |

## C. What the lesson teaches and the film never said (done — 6 clips, 829 characters)

| # | item | now |
| --- | --- | --- |
| 14 | **safety** | its own scene, `Before you cut`: cramping, eye protection, sharp versus blunt |
| 15 | starting the cut | low angle, thumb above the teeth, backward strokes to cut a groove |
| 16 | checking the far face | its own picture — near face and far face, one blade, leaning |
| 17 | rip saw vs tenon saw | a teeth comparison that crossfades over the three tools |
| 18 | sharpness | drawn as teeth, sharp against rounded, because that is what the difference is |

---

## What the verification caught, and nothing else would have

Both were invisible to reading the diff, and one was invisible to `--sample`.

- **`SHX is not defined`.** The section-A rework dropped `var SHX = BX + 330;`
  and three scenes referenced it. `--dry` passed — it never draws — and the
  film had not been swept since. The render would have stopped at 72 s.
- **The falling waste left the stage.** 84 px outside the 1168 × 440 box,
  between cues, which is exactly where `--sample` cannot look. `--sweep` draws
  every frame the render will draw and found it in 5 s.
- **The saw in "starting the cut" was rotated about its handle**, putting its
  teeth 130 px left of the line and halfway down the board. Only a sampled
  frame shows that; no check can.
- **The joint was two members STACKED**, so the assembled lap was two
  thicknesses and the green "the two faces finish flush" lines were ruled
  across a joint twice as thick as either member — the opposite of what a
  halving joint is. It had been drawn that way since the first render. Both
  members now sit in one band (`lapPair`), each with its half taken out, and
  the cut-away fades into a seam as they close.

The order that made this cheap is the tool's own: `--dry` → `--narrate` →
`--sweep` → `--sample` → render. Words first, because rendering before them
means rendering twice.

---

## What is left

- **Nobody who has cut a joint has read any of this.** 62 criteria across the
  two standards files, and the film's trade content, are unreviewed by a
  carpenter. This is the standing caveat on the whole prototype.
- **The Foundation module has no film.** *Preparing Timber to Size* is the
  obvious second one, and the plane, the gauge and the square are now drawn.
- **Hands and figures are still not worth drawing.** Adult trade films show
  the tool and the work. The one exception made here is the thumb at the start
  of a cut, because the narration names it and a trade manual draws it.
