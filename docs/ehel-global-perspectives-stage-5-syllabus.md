# Stage 5 Global Perspectives — course syllabus

Narrative copy for the syllabus authoring form at
`local/hubredirect/syllabus.php`, for the Ehel Academy **Stage 5 Global
Perspectives** course (Grade 5; this subject labels its years *Stage*). Every
figure is read from
`src/prototypes/ehel-academy/global-perspectives/grade-5/data/`.

**Paste the narrative sections only.** The schedule half is assembled live at
render time by `pqsyl_generated()`; the unit spine in the appendix is for
checking it against, not for pasting.

Fields map 1:1 to the form. `{{...}}` marks what only the school can supply.

## Restored 2026-09-17 — read this before publishing

**Held 2026-08-09, restored 2026-09-17.** Stage 5 taught two of the subject's
six skills from 2026-08-09 (Research and Analysis were built; Evaluation,
Reflection, Collaboration and Communication were confirmed by the school on
2026-08-11 as never authored — a re-export the same day returned the same two
units byte for byte, so it was never a rebuild waiting to happen). The four
missing units have now been hand-authored directly against Cambridge's own
Stage 5 objectives — see `global-perspectives/CLAUDE.md` and
`global-perspectives/data/authored-units/grade-5/` — matching the structure and
depth of the extracted self-study units. Stage 5 now teaches all six skills at
100% Cambridge objective coverage, confirmed by `check:global-perspectives`.

**What has been done to restore it:**

1. Units 3–6 written (not found — see the reasoning above).
2. `build:global-perspectives` and `check:global-perspectives` both pass clean;
   content and audio are deployed and verified in step
   (`check-ehel-deploy-sync.mjs`).
3. The `"5"` entry deleted from `knownGaps`
   (`inputs/ehel-global-perspectives-source/source-manifest.json`) and from
   `withdrawn-courses.json`, and the `WITHDRAWN_STAGES` entry deleted from
   `shell/subjects/global-perspectives.js` — the app now serves the stage on
   every route.
4. This block replaced, and the unit spine below re-checked against the
   rebuilt six-unit course (2026-09-17 figures).

**Still outstanding before this can go in front of families — this is a
content and app restoration, not a publication decision:**

- **Curriculum review of the four new units.** They carry
  `"reviewStatus": "Hand-authored - curriculum review required"` in their own
  data, same as every other unit in this course reads *"Built from source
  packs — curriculum review pending"*. Nobody at the school has read them yet.
- **Catalog and Moodle.** `catalog.json`'s `ehel-gp-g05` entry needs
  regenerating (`generate-ehel-catalog.js`, then `generate-ehel-cohorts.js`),
  and Moodle course 71's `visible`/`visibleold` flags need restoring — see
  `withdrawn-courses.json` and `source-manifest.json` for exactly what was
  flipped and needs flipping back. Whether that has happened by the time you
  read this is a separate question from whether the content exists; check
  both.
- **The later placement exams' remediation links.** Stages 6, 7 and 8 were
  repointed at Stage 4 while Stage 5 was withdrawn (a build gate refuses a
  route into a withdrawn stage). Whether they have been repointed back to
  Stage 5 is tracked separately — check the placement exam JSON under each
  stage's `grade-N/data/placement-exam.json` rather than assuming it followed
  automatically from this restoration.

**No learner was affected by the original withdrawal or needs to be by this
restoration: the course had zero enrolments throughout.**

---

## Overview

Stage 5 Global Perspectives teaches the same six skills as every other
self-study stage, one per unit. It follows **Cambridge Primary Global
Perspectives 0838, Stage 5**.

Across the year: **6 units**, one per skill — **105 explainers**,
**37 big ideas**, **32 models**, **66 toolkit entries**, **134 practice
items**, **51 activities**, **35 reflections**, **55 self-assessment
statements** and **31 challenge questions**.

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
| 1 | Research | 4 | 17 | 22 | 6 |
| 2 | Analysis | 4 | 15 | 22 | 6 |
| 3 | Evaluation | 10 | 18 | 23 | 6 |
| 4 | Reflection | 13 | 18 | 22 | 7 |
| 5 | Collaboration | 8 | 18 | 22 | 3 |
| 6 | Communication | 6 | 19 | 23 | 3 |
| | **Total** | **45** | **105** | **134** | **31** |

Varying between units: explainers (15–19), practice (22–23),
outcomes (4–13, higher on the four newly-authored units, which carry richer
Support/Extension-style goal ladders than units 1–2) and self-assessment
(7–12).

Framework: Cambridge Primary Global Perspectives 0838, Stage 5.
Pack shape: self-study. Units 1–2 extracted from the school's Word source
pack; units 3–6 hand-authored 2026-09-17 (see the restoration note above).
Narration: 471/471 clips present for this stage (some of the 238 clips
generated for this restoration were shared Stage 1–3 pages, not Stage 5's own).

Source: `course-manifest.json` and `units/unit-*.json` under
`src/prototypes/ehel-academy/global-perspectives/grade-5/data/`.

## Before submitting for approval

**Do not submit this for approval until the outstanding items above are
settled** — particularly curriculum review of units 3–6, which nobody at the
school has read yet. When they are:

1. Confirm the rebuilt course teaches all six skills — the coverage gate
   already says so (`check:global-perspectives`, 100%).
2. Settle who reads what a learner produces, and set the rhythm.
3. Do not present the objective codes as Cambridge's own.
4. Fill every remaining `{{...}}`, confirm term dates, save as **draft**, and
   submit for approval.
