# What the Mathematics films found

Two passes over the 31 Grade 1-4 unit lecture films: the review at ship time
(2026-09-24) and a timing pass on the narrated timeline (2026-09-25).

**Unlike Science and Computing, this subject's passes found almost nothing wrong
with the LESSONS.** Science has 27 recorded lesson faults and Computing has a
dozen; Mathematics has none worth a row. Every fault below is in a FILM, and
every one is fixed. That is a real result about the lessons, not a gap in the
looking — the same reviewers, briefed the same way, filled pages about the other
two subjects.

## The one fault the timing pass found, and it was two faults

`where-things-are`, Grade 4, the `cardinal` chapter's last beat, under the words
**"Four turns make a full turn"**.

**1. A 360 degree SVG arc draws nothing.** `wtaArc` builds one elliptical arc
from `a0` to `a1`. At a full turn the start and end points coincide and the path
is degenerate, so the gold circle **vanished at the instant it completed**. It
was never once seen closed — the only thing that beat exists to show. It now
stops a degree short, which reads as closed and renders.

**2. The sweep outlived its beat.** 1.6 s from a cue at 31.822 s finishes at
33.422 s; the chapter cuts at 33.074 s. The circle was 78% round when it went.
Now 0.95 s, closing at 32.772 s and holding the finished circle for 0.30 s.

**Each fault hid the other.** Shortening the span alone would have made the
circle vanish sooner; fixing the arc alone would have left it completing after
the cut. What exposed them was a measurement that made no sense: **the vanish
point MOVED when the span changed**, and a scene cut cannot do that.

Also fixed: `patterns-and-squares`' `MK.qmark`, drawn at `yy - sz * 1.05`, put
its top 5 px above the frame in the large-calculation beat. Floored at its own
radius.

## What the ship-time review found — all film faults, all fixed

The characteristic Mathematics fault is **a claim that does not hold up**:

- **Which Way From Here** narrated a route (2 up, 1 right) that FAILS the
  lesson's own first map, which needs 2 up and 2 right — and that map is index 0
  and never shuffled, so it is always the one a child meets. It also used a leg
  of 3 squares, which the lesson's generator (`rnd(1,2)`) can never produce.
- **Measure It** taught SUBTRACTION for measuring from a non-zero mark, with a
  written 9 − 2 = 7, where the lesson teaches COUNTING ON every time — including
  in the recap, the line the child carries away.
- **What Comes Next** told the child a pattern "does not take turns" and crossed
  the phrase out, while the lesson uses "take turns" correctly in the warm-up the
  child has just done and in two quiz items.
- **Fair Shares** opened on a mango the lesson never mentions; its own hook is a
  sandwich.
- **Counting to Twenty** said "nobody left over" over the ODD example, with one
  counter ringed as the leftover.
- **Five Cambridge codes cited in full and half delivered**: "estimate AND
  divide", "adding AND SUBTRACTING", "linear AND NON-LINEAR", "both clockwise AND
  ANTICLOCKWISE", "2D AND 3D". Each was closed by adding the missing half FROM
  THE LESSON, never by inventing content to satisfy a code.

None of those is visible to a coverage count, a sweep or a cue check.

## Two things the tools get wrong

**`--sweep` does not honour a nested `<svg>`'s clip.** It reports
`telling-the-time` as 3 px out at 151.6 s. That is a **false positive**: the
element is a nested `<svg>` with `overflow: hidden`, placed at 774,40 sized
380x325, viewBox 404x346. The sweep compares its INNER bbox to the outer frame
without applying the 0.94 viewBox scale. Mapped properly it sits at x 774.9 to
1153.1, y 40.9 to 364.5 — comfortably inside. Do not chase it.

**`--sweep` prints only its first twelve overflows.** A thirteenth is visible
only as a trailing "and N more". Two fixes attempted during this work drew
outside the frame and were invisible in its output for exactly that reason; the
count going from "and 1 more" to "and 2 more" was the only tell.

## Two corrections to how a timing pass should be run

Both were made by reviewers against the source, correcting the brief they were
given:

- **A missing `end` frame is usually the DEDUP RULE, not the twelve-frame cap.**
  `sample()` drops a candidate frame within 0.4 s of the one before it, so the
  end frame is absorbed into the last cue frame. Scenes well under the cap still
  lose it.
- **A margin measured against "the next scene mounts" is 0.5 s optimistic.**
  `GAP_SCENE` is 0.5 and `beatAt()` switches at `beat.end`, so a scene-final beat
  is a hard cut at `beat.end`. Within a scene it is softer: `into()` begins the
  crossfade exactly at the previous beat's end over 0.5 s, so an animation
  finishing slightly late is merely fading, not cut. One film has an animation
  finishing 0.086 s past its beat end for that reason and is correct.

And a third, from three separate reviewers: **a grid thumbnail is not evidence.**
Each nearly filed a fault from a downscaled contact sheet — a badge that looked
absent, cards that looked unlit — and each was right only after opening the full
frame.

## Tightest true margins in the subject

Measured against the hard cut, after the fix above:

| film | chapter | margin |
| --- | --- | --- |
| `sides-and-corners` | fold | 0.19 s |
| `shapes-and-symmetry` | title | 0.32 s |
| `patterns-and-squares` | squares | 0.57 s |

`shapes-and-symmetry`'s title chapter is the thinnest cushion in the subject and
the one to re-measure if its narration or animation is ever touched.

## Not faults, recorded so nobody re-finds them

- **`shape-and-measures` cannot be sampled or swept.** Its storyboard names no
  renderer; it was made with the older tool. The owner has said twice not to
  touch it. Skip it rather than treating the refusal as a failure.
- **Two superseded films remain on storage** — `shape-and-measures.mp4`
  (unhashed) and the pre-2026-09-25 renders of the two films fixed above.
  Nothing references them. They stay: Bunny caches a 404 on a path the key in
  `.env` cannot purge, so removing a file any cached page still requests leaves a
  permanent hole.
- **`squares-and-steps.html` is live on the CDN and reachable by nothing.** It is
  `split-into-lessons.py`'s INPUT — the original one-page 28-step unit that was
  split into Grade 5's six lessons — and `app.config.json` says it is
  "deliberately not listed here, so it is not shipped". The current route
  (`deploy.mjs`) indeed cannot ship it; an older whole-tree upload did. The
  config's claim is true about the tool and false about the world.
- **Grade 5 has no films by design.** Its own opener says so: *"no video and no
  voice exist on this build, so this is a short static walkthrough in named parts
  rather than Grade 4's narrated click-through."* Adding films there is a
  decision, not a gap to close.
