# Carpentry prototype — what I need from you, and what I'll do with it

**Purpose:** a demonstration build for the client, modelled on the Science
Grade 4 standalone lesson app
([bones-and-muscles](https://ehelacademy.b-cdn.net/Ehel%20Primary/app/science/grade-4-v2/bones-and-muscles.html?from=sci4)).

**Decided 2026-09-23:** one lesson built to full depth plus a module hub; UK /
East African carpentry terminology; all artwork drawn in code (interactive
SVG), no photographs. Learners are at grade 8–11 level.

**Modules:** Carpentry Foundation, and Carpentry Tools & Joints. The deep
lesson comes from Tools & Joints.

---

## What to send

Send it in whatever form you already have — Word, PDF, spreadsheet, scans.
**Do not reformat it for me.** I would rather read the real document than a
tidied summary, because the details that get tidied away are usually the ones
that make a lesson feel like it was written by someone who knows the trade.

### 1. The module outline

For each of the two modules: the lessons, in teaching order, with titles. If
the curriculum is organised by competency rather than by lesson, send it that
way and say so — I'll map it.

### 2. Per lesson, the outcomes

"By the end of this lesson the learner can …" — three to six of them, each
something the learner *does*, not something they know about. The kit prints
these at the top of every lesson and the coverage gate checks each one is
actually reached by a step, so they carry real weight.

### 3. The tool list and the joint list — exact names

**This is the single most important item**, because every one of these becomes
a drawing, and the drawings are what the demo is.

- **Tools:** each tool taught, by its proper name, with its parts named as you
  want them labelled (e.g. tenon saw → blade, back, teeth, handle, heel, toe).
- **Joints:** each joint taught, by name (butt, lap, housing, mortise and
  tenon, dovetail, mitre …), and for each one: what it's used for, and how it
  is marked out and cut, in order.

If the client's syllabus names ten joints but the prototype only needs three,
say which three are the showcase.

### 4. The mistakes apprentices actually make

The kit has a slot in every step for a misconception and its correction, and
it is what makes these pages feel expert rather than generic. Science uses
"children think bones are dead — bones are alive, they grow and they mend."
The carpentry equivalents — sawing on the wrong side of the line, measuring
from a damaged end, planing against the grain, over-tight tenons — are worth
more to this demo than another paragraph of description.

### 5. Assessment

Questions with their answers, and for wrong answers, *why* they're wrong — the
kit shows the reason, it doesn't just mark. If you'd rather I draft these from
the content and you correct them, say so; that's often faster.

### 6. What is workshop-only

Which competencies cannot be assessed on a screen at all, and must be signed
off by an assessor with the learner at a bench. The demo should be honest
about the boundary rather than implying the app certifies everything.

### 7. Safety

Whatever safety content the syllabus requires, and where it sits. Carpentry
safety is not an add-on and the demo will look wrong without it. I'll add a
`safety` step kind to the kit for this — Science has no equivalent.

### 8. Anything you already have

Existing diagrams, drawings, photographs, past worksheets. Even if we're
drawing in code, an existing diagram tells me what the client expects a joint
to look like. Say what you own or are licensed to use.

---

## What I'll do while waiting

None of this depends on the content, so it can happen in parallel:

1. **Fork the Science lesson kit** into a carpentry kit. The builder, hub,
   coverage gate, lesson search, print sheets and the two-sitting structure all
   transfer unchanged. Two things are hard-coded and get parameterised: the
   framework file (`cambridge-science-0097.json`) and the subject strings
   ("Science words", "Science at home", "Science world").
2. **Re-voice the furniture** for grade 8–11: workshop tasks rather than
   "things to do at home", apprentice errors rather than "children think",
   and the sticker/emoji layer toned down.
3. **Start `carpentry.js`**, the drawing library. `science.js` separates
   cleanly into step machinery, then drawings, then sims, so the machinery
   comes across and the drawings are written fresh.

## Scale, so the estimate is honest

Across four grades and about forty lessons, Science needed **9 bespoke
labelled figures** and **33 interactive sims**. A two-module carpentry
prototype with one deep lesson needs far less than that — roughly **6–10
drawings** (the tools, a joint that comes apart, grain direction, marking out)
and **4–8 sims**. The drawings are the bulk of the work and the entire reason
the demo lands.
