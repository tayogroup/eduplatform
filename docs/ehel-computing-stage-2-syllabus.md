# Stage 2 Computing — course syllabus

Narrative copy for the syllabus authoring form at
`local/hubredirect/syllabus.php`, for the Ehel Academy **Stage 2 Computing**
course (Grade 2; this subject labels its years *Stage*). Every figure is read
from `src/prototypes/ehel-academy/computing/grade-2/data/`.

**Paste the narrative sections only.** The schedule half is assembled live at
render time by `pqsyl_generated()`; the unit spine in the appendix is for
checking it against, not for pasting.

Fields map 1:1 to the form. `{{...}}` marks what only the school can supply.

## Read this before publishing

1. **Curriculum review is outstanding.** The package records a self-teaching
   content pass as complete, but all 11 units still read
   `Imported - curriculum review required`.
2. **No lecture video exists.** All 11 units report `Video pending`.
3. **The narration is not in the repository.** 1252 clips are needed for
   this stage and 1252 are present on this machine — but
   `computing/media/audio/tts/` is **gitignored, with zero clips tracked**.
   Science and Global Perspectives commit theirs; Computing does not. A fresh
   checkout has no Computing audio at all, so whether a learner hears anything
   depends on the machine a deploy is run from. Confirm the clips reached the
   CDN before telling families the narration exists.
4. **This stage was built from **teacher and parent guides**, rewritten into learner-facing prose by the builder.** Stages 1–4 work this way; Stages 5–8 come from student books. The rewriting is gated by `check:computing`, which fails on adult-addressed text, but it is a transformation rather than a transcription and the outstanding curriculum review is the place to confirm it reads correctly.

---

## Overview

Stage 2 Computing keeps the job titles and raises what each one demands — a game developer now thinks about rules, a data analyst about what a chart is claiming. It follows **Cambridge Primary Computing 0672, Stage 2**.

Eleven units run through game development, data analysis, computers around us, animation, devices that talk to each other, design, data science, art, and connected and safe sharing.

Across the year: **11 units**, **73 learning outcomes**,
**55 concepts**, **18 code examples**, **88 hands-on activities**,
**67 practice questions**, **67 fluency questions**, **52 debugging
cases**, **35 e-safety notes**, **132 games** and **11 unit projects** — one
per unit. Each unit ends in a challenge at a **80% pass mark**.

**Two things here exist in no other Ehel subject.** Every unit carries a
**debugging section** — a symptom, its cause and its fix, 52 of them across the
year — which teaches that finding the fault is part of the work rather than a
sign of failure. And every unit carries **e-safety notes**, 35 across the year,
written into the teaching rather than bolted on as a policy.

**This is a self-paced course, not a taught one.** There are no live sessions, no
assignments to hand in and no marks. Each unit ends in its own project, with a
brief and success criteria the learner can check their own work against.

## Teacher introduction

> {{Teacher name}} supports Stage 2 Computing at {{school name}}. {{One or two
> sentences. Say who checks the unit projects, and who a learner asks when code
> does not work — the course teaches debugging, but a stuck learner still needs
> a person.}}

## Contact

- **Teacher or mentor:** {{name}} — {{email}}
- **Best times to reach me:** {{e.g. Sunday–Thursday, 09:00–15:00}}
- **Reply within:** {{e.g. one school day}}
- **Progress is reviewed:** {{e.g. fortnightly, at a scheduled check-in}}
- **For anything urgent:** {{school office contact}}

---

## Course policies

### Prerequisites

Stage 2 assumes Stage 1. There is no foundation unit inside this course.

Before Unit 1 a learner sits the **Stage 2 Computing Placement Exam**: 25 questions, 25 marks, about 20 minutes. Attempts are unlimited and it is never a fail.

Sections:

- **Computers around us** (9 questions)
- **Following and giving instructions** (8 questions)
- **Data and staying safe** (8 questions)

The report gives one of four results — ready, ready with a little review, a
critical section below its threshold, or *let's build strong roots first*, which
recommends **Stage 1 Computing**.

The check can be retaken at any point in the year.

### Materials and equipment

- **A computer the learner can actually use** — not a phone. This is the one
  Ehel subject where the device is the subject.
- **The tools each unit names.** 7 toolkit entries across the year point at
  specific software, most with a link. Check what each unit needs before it
  starts, and check the school's own device policy allows it.
- Materials for the hands-on activities — 88 of them across the year, many
  deliberately unplugged.
- Sound, for the narration.
- An internet connection.

> **Worth settling early:** {{which of the named tools the school provides,
> which a family is expected to install, and what a learner does if a tool is
> blocked or unavailable}}.

### Attendance

**This course has no live sessions.** What replaces attendance is a rhythm the
school sets: {{how often a learner is expected to work, and how progress is
checked}}.

### Homework

There is no homework to submit. In every unit a learner works through the
concepts (each ending in a *check yourself*), the explorations, methods and
worked examples, the practice and fluency questions, the debugging cases, the
e-safety notes, the hands-on activities and the games — and builds **the unit
project**, which has a brief and its own success criteria.

The project is the piece worth protecting. It is the only thing in the course
that produces something a learner can show.

### Assessment and grading

**There are no marks in this course.** What exists instead:

- **The unit challenge**, pass mark 80% — 11 across the year, 12 questions each.
- **Games**, mastery score 3.
- **Self-assessment** — 73 *I can…* statements across the year, no marks.
- **11 unit projects**, each with success criteria written into the brief.

> **A decision for the school.** The projects are the real evidence this course
> produces and nothing in the data says who looks at them or what happens next:
> {{who reviews a unit project, against what, and what a family is told}}.

### Behaviour and participation

- **Debug before you ask.** Every unit lists the faults it expects, with causes
  and fixes. Working the list is the skill.
- **Read the e-safety notes properly.** 35 across the year, inside the
  teaching rather than in a policy nobody reads.
- **Build the project.** A unit read but not built has not been done.
- **Follow the school's rules for the machine** — what may be installed, what may
  be shared, and what to do about anything upsetting found online.

### Support and communication

**If a learner is struggling**, the placement check can be retaken at any time. Stage 1 Computing remains available for a learner who needs the ground under this one.

**Extra help available:**

- {{The teacher or mentor named above.}}
- Each unit's debugging section, reference rules, terms, vocabulary, common
  mistakes and connections.
- Narration on the explanations — **subject to the caveat above that these clips
  are not in the repository**.

**How the school will contact you:** {{when — no marks and no deadlines means
contact must be scheduled rather than triggered}}.

**If you have a concern**, contact {{name}} first, then
{{school administrator role/name}} after {{n}} school days.

---

## Appendix — unit spine (for checking, not for pasting)

| Unit | Title | Outcomes | Concepts | Code examples | Activities | E-safety |
|---|---|---|---|---|---|---|
| 1 | Be a Game Developer | 5 | 5 | 4 | 8 | 3 |
| 2 | Be a Data Analyst | 7 | 5 | 0 | 8 | 3 |
| 3 | Computers All Around Us | 6 | 5 | 0 | 8 | 3 |
| 4 | Be an Animator | 6 | 5 | 3 | 8 | 3 |
| 5 | Devices That Talk to Each Other | 5 | 5 | 1 | 8 | 4 |
| 6 | Be a Designer | 8 | 5 | 6 | 8 | 3 |
| 7 | Be a Data Scientist | 8 | 5 | 1 | 8 | 3 |
| 8 | Be an Artist | 7 | 5 | 1 | 8 | 3 |
| 9 | Connected and Sharing Safely | 5 | 5 | 0 | 8 | 4 |
| 10 | Be a Storyteller | 8 | 5 | 2 | 8 | 3 |
| 11 | Computers and Robots | 8 | 5 | 0 | 8 | 3 |
| | **Total** | **73** | **55** | **18** | **88** | **35** |

Varying between units: concepts (5), outcomes (5–8),
code examples (0–6), activities (8), e-safety notes
(3–4), debugging cases (1–6), practice (5–8)
and challenge questions (12). A rendered syllabus showing any of these
as flat across every unit is reading from the wrong source.

Framework: Cambridge Primary Computing 0672, Stage 2.
Source audience: teacher-guide.
Narration: 1252/1252 clips present locally, 0 tracked in git.

Source: `course-manifest.json` and `units/unit-*.json` under
`src/prototypes/ehel-academy/computing/grade-2/data/`.

## Before submitting for approval

1. **Decide whether to publish yet** — curriculum review outstanding, no video,
   and narration that is not in the repository.
2. Settle the tools, the rhythm and who reviews the projects.
3. Fill every remaining `{{...}}`, confirm term dates on the school's academic
   terms, save as **draft**, and submit for approval.
