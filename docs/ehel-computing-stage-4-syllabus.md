# Stage 4 Computing — course syllabus

Narrative copy for the syllabus authoring form at
`local/hubredirect/syllabus.php`, for the Ehel Academy **Stage 4 Computing**
course (Grade 4; this subject labels its years *Stage*). Every figure is read
from `src/prototypes/ehel-academy/computing/grade-4/data/`.

**Paste the narrative sections only.** The schedule half is assembled live at
render time by `pqsyl_generated()`; the unit spine in the appendix is for
checking it against, not for pasting.

Fields map 1:1 to the form. `{{...}}` marks what only the school can supply.

## Read this before publishing

1. **Curriculum review is outstanding.** The package records a self-teaching
   content pass as complete, but all 12 units still read
   `Imported - curriculum review required`.
2. **No lecture video exists.** All 12 units report `Video pending`.
3. **The narration is not in the repository.** 1514 clips are needed for
   this stage and 1514 are present on this machine — but
   `computing/media/audio/tts/` is **gitignored, with zero clips tracked**.
   Science and Global Perspectives commit theirs; Computing does not. A fresh
   checkout has no Computing audio at all, so whether a learner hears anything
   depends on the machine a deploy is run from. Confirm the clips reached the
   CDN before telling families the narration exists.
4. **This stage was built from **teacher and parent guides**, rewritten into learner-facing prose by the builder.** Stages 1–4 work this way; Stages 5–8 come from student books. The rewriting is gated by `check:computing`, which fails on adult-addressed text, but it is a transformation rather than a transcription and the outstanding curriculum review is the place to confirm it reads correctly.

---

## Overview

Stage 4 Computing is the last and largest of the job-title years, and the one where the roles get serious: *Be a Computer Scientist*, *Be a Code Cracker*, *Be an Innovator*. It follows **Cambridge Primary Computing 0672, Stage 4**.

Twelve units, ninety-nine learning outcomes — more than any other stage — and forty code examples, the most in the primary years.

Across the year: **12 units**, **99 learning outcomes**,
**60 concepts**, **40 code examples**, **96 hands-on activities**,
**73 practice questions**, **73 fluency questions**, **70 debugging
cases**, **39 e-safety notes**, **144 games** and **12 unit projects** — one
per unit. Each unit ends in a challenge at a **80% pass mark**.

**Two things here exist in no other Ehel subject.** Every unit carries a
**debugging section** — a symptom, its cause and its fix, 70 of them across the
year — which teaches that finding the fault is part of the work rather than a
sign of failure. And every unit carries **e-safety notes**, 39 across the year,
written into the teaching rather than bolted on as a policy.

**This is a self-paced course, not a taught one.** There are no live sessions, no
assignments to hand in and no marks. Each unit ends in its own project, with a
brief and success criteria the learner can check their own work against.

## Teacher introduction

> {{Teacher name}} supports Stage 4 Computing at {{school name}}. {{One or two
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

Stage 4 assumes Stages 1 to 3. There is no foundation unit inside this course.

Before Unit 1 a learner sits the **Stage 4 Computing Placement Exam**: 30 questions, 30 marks, about 30 minutes. Attempts are unlimited and it is never a fail.

Sections:

- **Stage 3 skills** (18 questions)
- **Stage 2 skills** (7 questions)
- **Foundations (Stages 1–2)** (5 questions)

The report gives one of four results — ready, ready with a little review, a
critical section below its threshold, or *let's build strong roots first*, which
recommends **Stage 3 Computing**.

The check can be retaken at any point in the year.

### Materials and equipment

- **A computer the learner can actually use** — not a phone. This is the one
  Ehel subject where the device is the subject.
- **The tools each unit names.** 16 toolkit entries across the year point at
  specific software, most with a link. Check what each unit needs before it
  starts, and check the school's own device policy allows it.
- Materials for the hands-on activities — 96 of them across the year, many
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

- **The unit challenge**, pass mark 80% — 12 across the year, 12 questions each.
- **Games**, mastery score 3.
- **Self-assessment** — 99 *I can…* statements across the year, no marks.
- **12 unit projects**, each with success criteria written into the brief.

> **A decision for the school.** The projects are the real evidence this course
> produces and nothing in the data says who looks at them or what happens next:
> {{who reviews a unit project, against what, and what a family is told}}.

### Behaviour and participation

- **Debug before you ask.** Every unit lists the faults it expects, with causes
  and fixes. Working the list is the skill.
- **Read the e-safety notes properly.** 39 across the year, inside the
  teaching rather than in a policy nobody reads.
- **Build the project.** A unit read but not built has not been done.
- **Follow the school's rules for the machine** — what may be installed, what may
  be shared, and what to do about anything upsetting found online.

### Support and communication

**If a learner is struggling**, the placement check can be retaken at any time. Stage 3 Computing remains available for a learner who needs the ground under this one.

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
| 1 | Be an Animator | 7 | 5 | 10 | 8 | 3 |
| 2 | Be a Data Controller | 7 | 5 | 0 | 8 | 4 |
| 3 | Be a Network Designer | 9 | 5 | 0 | 8 | 4 |
| 4 | Be a Storyteller | 7 | 5 | 8 | 8 | 3 |
| 5 | Be a Computer Scientist | 6 | 5 | 1 | 8 | 3 |
| 6 | Be a Musician | 9 | 5 | 5 | 8 | 3 |
| 7 | Be a Data Boss | 10 | 5 | 0 | 8 | 3 |
| 8 | Be an Innovator | 9 | 5 | 3 | 8 | 3 |
| 9 | Be a Code Cracker | 9 | 5 | 0 | 8 | 4 |
| 10 | Be a Game Developer | 7 | 5 | 9 | 8 | 3 |
| 11 | Be a Robot Controller | 10 | 5 | 2 | 8 | 3 |
| 12 | Be an Artist | 9 | 5 | 2 | 8 | 3 |
| | **Total** | **99** | **60** | **40** | **96** | **39** |

Varying between units: concepts (5), outcomes (6–10),
code examples (0–10), activities (8), e-safety notes
(3–4), debugging cases (4–6), practice (6–7)
and challenge questions (12). A rendered syllabus showing any of these
as flat across every unit is reading from the wrong source.

Framework: Cambridge Primary Computing 0672, Stage 4.
Source audience: teacher-guide.
Narration: 1514/1514 clips present locally, 0 tracked in git.

Source: `course-manifest.json` and `units/unit-*.json` under
`src/prototypes/ehel-academy/computing/grade-4/data/`.

## Before submitting for approval

1. **Decide whether to publish yet** — curriculum review outstanding, no video,
   and narration that is not in the repository.
2. Settle the tools, the rhythm and who reviews the projects.
3. Fill every remaining `{{...}}`, confirm term dates on the school's academic
   terms, save as **draft**, and submit for approval.
