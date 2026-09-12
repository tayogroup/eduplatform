# Archived: the earlier Intensive English Level 2 (B1 to B1+)

These twenty authored units were Level 2 from 2026-08-01 to 2026-09-12: an
adult course claiming **B1 in Units 1-10 and B1+ in Units 11-20**, compressed
from the school English Grades 5-8 and aligned to Cambridge 0058 / 0861. It was
organised by *what English can do* — Telling My Story, Saying It Precisely,
Experience and Change, The Passive Voice, Making an Argument.

They were replaced on 2026-09-12 when Level 2 was rebuilt on **Cambridge
Primary English as a Second Language 0057, Stages 4-6, A1 to A2**, to follow the
Level 1 rebuilt on Stages 1-3 the day before.

**The gap they left is the reason the rebuild happened.** Level 1 now exits at a
secure A1, and this course opened at B1. Nothing taught A1 to B1, so a learner
who finished Level 1 met a course two CEFR levels above them on the first
screen. The new Level 2 closes that: it opens where Level 1 ends and exits at a
secure A2.

They are kept, not deleted, for three reasons:

- **They are the record of what learners were taught until the new course
  ships**, and they were reviewed and signed off.
- **They are material for Level 3** (Lower Secondary Stages 7-9, A2 to B1),
  which is the level their B1 half now genuinely belongs to.
- **They are a known-good reference for field shapes** in the authored JSON.

Two things to know before reusing anything here:

- **Their marks do not reconcile.** The rubrics award 32 marks while a unit
  assignment is worth 25 or 30, and no unit reconciles them. The rebuilt course
  derives marks from the rubric criteria instead — 4 per criterion — so a unit
  carried across needs its assignment re-derived rather than copied.
- **They predate the spoken-form rule.** A narrated text with a blank needs
  `passageSpeech` / `instructionsSpeech`; these units have none, so any reading
  or speaking task taken from here has to gain one before it is narrated.

The builder does not read this folder. `tools/build-intensive-units.js` reads
`../authored/` only.
