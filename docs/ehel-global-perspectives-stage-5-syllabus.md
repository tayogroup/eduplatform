# Stage 5 Global Perspectives — course syllabus (HELD)

Narrative copy for the syllabus authoring form at
`local/hubredirect/syllabus.php`, for the Ehel Academy **Stage 5 Global
Perspectives** course (Grade 5; this subject labels its years *Stage*). Every
figure is read from
`src/prototypes/ehel-academy/global-perspectives/grade-5/data/`.

**Paste the narrative sections only.** The schedule half is assembled live at
render time by `pqsyl_generated()`; the unit spine in the appendix is for
checking it against, not for pasting.

Fields map 1:1 to the form. `{{...}}` marks what only the school can supply.

## HELD — do not publish this syllabus

**Decision taken 2026-08-09: Stage 5 Global Perspectives is held until the full
content is located.** This draft is not for approval, not for families, and not
for the catalogue. It is kept so that the work is ready the day the missing
units arrive.

Stage 5 teaches **2 of the subject's six skills**. Present: Research and
Analysis. **Missing entirely: Evaluation, Reflection, Collaboration,
Communication.**

**A re-export will not fix it.** That was the standing assumption and it has been
tested: a fresh Google Drive export taken on 2026-08-09
(`Year 5-20260809T155926Z-1-001.zip`) is the right subject, confirmed by pack
shape, and contains Unit 1 and Unit 2 only — all eight files byte-for-byte
identical to the copies already in the repository. The export is not dropping
anything; the folder it exports from holds two units. Either the four units live
somewhere else in Drive, or they were never authored.

### What lifting the hold requires

1. Units 3–6 located or written.
2. `npm run extract:global-perspectives-content && npm run build:global-perspectives && npm run check:global-perspectives`.
3. The `"5"` entry deleted from `knownGaps` in
   `inputs/ehel-global-perspectives-source/source-manifest.json`, which puts the
   stage back under the coverage gate rather than on its allowed list.
4. This block replaced, and the unit spine below re-checked against the rebuilt
   course.

### The course is withdrawn as well as held

Settled 2026-08-09. The hold covers publication of this syllabus; the course
itself has been withdrawn at every layer it was reachable from:

- **The app** refuses it on every route — overview, placement and the teaching
  sections — and the stage picker shows it disabled. A bookmark or a remediation
  link out of Stage 6 draws a withdrawal notice, not the course.
- **The catalogue** no longer lists `ehel-gp-g05`, and Moodle's
  `catalog_source_url` was repointed at a content-addressed URL so the change
  reached the sync rather than sitting behind a 30-day CDN cache.
- **Moodle course 71** is hidden — `visible = 0`, `visibleold = 0`.

**No learner was affected: the course had zero enrolments.** Nobody had work in
it, so there was nothing to migrate and nobody to notify. Had anyone been
enrolled, that would have been a different decision.

It is hidden rather than deleted, so the `ehel-gp-g05` idnumber survives and the
sync reattaches to the same course — with its history — the day Stage 5 returns.

**The later placement exams no longer route here.** Stages 6, 7 and 8 each named
Stage 5 units as the place to go and rebuild, which after the withdrawal meant
sending the lowest-scoring learner to a withdrawal notice. All of them now point
at Stage 4, which teaches the same six skills one per unit. A build gate fails
on any placement exam that routes into a withdrawn stage, so this cannot come
back quietly.

Everything below describes what actually exists, and remains accurate for the
two units that are built.

---

## Read this before publishing

- **Curriculum review is outstanding.** The package reads *"Built from source
  packs — curriculum review pending"*.
- **The narration is complete and committed**: all 235 clips this stage calls
  for are present, verified against the claim map.
- **Cambridge does not print objective codes for this subject.** Neither Global
  Perspectives framework numbers its objectives — the published pages are bare
  bullets under strand headings — so the codes this course shows against each
  unit (`5Rq.01` and the like) are **assigned by Ehel's extractor, not by
  Cambridge**. That is recorded in the framework file itself. Do not present them
  to a family as Cambridge references.

---

## Overview

Stage 5 Global Perspectives teaches the same six skills as Stage 4 — in principle. It follows **Cambridge Primary Global Perspectives 0838, Stage 5**.

**In practice this course holds two of them.** Research and Analysis are built and complete; Evaluation, Reflection, Collaboration and Communication are absent. That is why the stage is held — see the top of this syllabus.

Across the year: **2 units**, one per skill — **32 explainers**,
**16 big ideas**, **22 models**, **19 toolkit entries**, **44 practice
items**, **14 activities**, **10 reflections** and **24 challenge questions**
at a **80% pass mark**.

**This is a self-study course.** There is no grown-up guide; the explainers are
written to the learner. Each unit is one skill end to end, so a learner does not
meet Research in passing — they spend a whole unit on it.

**There are no live sessions, no assignments to hand in and no marks.**

## Teacher introduction

> {{Teacher name}} supports Stage 5 Global Perspectives at {{school name}}.
> {{One or two sentences. Say who reads the reflections and the challenge responses, since this subject assesses judgement rather than recall.}}

## Contact

- **Teacher or mentor:** {{name}} — {{email}}
- **Best times to reach me:** {{e.g. Sunday–Thursday, 09:00–15:00}}
- **Reply within:** {{e.g. one school day}}
- **Progress is reviewed:** {{e.g. fortnightly, at a scheduled check-in}}
- **For anything urgent:** {{school office contact}}

---

## Course policies

### Prerequisites

Stage 5 assumes Stages 1 to 4, though the skills spiral rather than stack — a learner joining here meets Research from the beginning of this stage's treatment of it.

Before Unit 1 a learner sits the **Stage 5 Global Perspectives Placement Exam**: 32 questions, 32 marks, about 30 minutes. Attempts are unlimited and it is never a fail.

Sections:

- **Stage 4 skills** (19 questions)
- **Stage 3 skills** (7 questions)
- **Foundations (Stages 1–2)** (6 questions)

The lowest band recommends **Stage 4 Global Perspectives**.
The check can be retaken at any point in the year.

### Materials and equipment

- Somewhere to keep notes, sources and drafts across a whole unit.
- A device that can display the course, with **sound** — the narration is
  complete and is part of the teaching.
- An internet connection, for the research the units ask for.
- Access to people to ask: this subject's Collaboration and Communication work needs someone to collaborate with and talk to.

### Attendance

**This course has no live sessions.** What replaces attendance is a rhythm the
school sets: {{how often a learner is expected to work, and how progress is
checked}}.

### Homework

There is no homework to submit.

Each unit works through the explainers, big ideas and models, uses the toolkit and the checklists, completes the practice, does the activities, writes the reflections, and finishes on a written challenge.

### Assessment and grading

**There are no marks in this course.**

- **The unit challenge** — 24 questions across the year, 12 per unit, pass mark 80%. Responses are written, not multiple choice.
- **Self-assessment** — 15 statements across the year, no marks.
- **Reflections** — 10 across the year, which in this subject are the work rather than a postscript to it.

> **A decision for the school.** A written challenge needs a reader. Nothing in
> the course data says who marks these or against what:
> {{who reads the challenge responses and the reflections, and what a family is
> told}}.

### Behaviour and participation

- **Ask before you answer.** This subject is about how a view is formed, not
  which view is held.
- **Disagree properly.** Evaluation and Communication both assess whether a learner can represent a view they do not hold.
- **Use the toolkit.** It exists so a learner is never stuck at the start of a task.
- **Say where things came from.** Research is a graded skill here from Stage 4
  onward.

### Support and communication

**Extra help available:**

- {{The teacher or mentor named above.}}
- The toolkit and checklists in every unit.
- **Narration on the teaching** — 235 recorded clips for this stage, all present.
- Each unit's vocabulary and common mistakes.

**How the school will contact you:** {{when — no marks and no deadlines means
contact must be scheduled rather than triggered}}.

**If you have a concern**, contact {{name}} first, then
{{school administrator role/name}} after {{n}} school days.

---

## Appendix — unit spine (for checking, not for pasting)

| Unit | Skill | Outcomes | Explainers | Practice | Challenge |
|---|---|---|---|---|---|
| 1 | Research | 4 | 17 | 22 | 12 |
| 2 | Analysis | 4 | 15 | 22 | 12 |
| | **Total** | **8** | **32** | **44** | **24** |

Varying between units: explainers (15–17), practice (22),
outcomes (4) and self-assessment (7–8).

Framework: Cambridge Primary Global Perspectives 0838, Stage 5.
Pack shape: self-study. Narration: 235/235 clips present.

Source: `course-manifest.json` and `units/unit-*.json` under
`src/prototypes/ehel-academy/global-perspectives/grade-5/data/`.

## Before submitting for approval

**Do not submit this for approval while the hold stands.** When it is lifted, work
through the list below.

1. Confirm the rebuilt course teaches all six skills — the coverage gate will say
   so once the  entry is deleted.
2. Settle who reads what a learner produces, and set the rhythm.
3. Do not present the objective codes as Cambridge's own.
4. Fill every remaining `{{...}}`, confirm term dates, save as **draft**, and
   submit for approval.
