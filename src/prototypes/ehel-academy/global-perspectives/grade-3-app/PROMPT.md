# The prompt this build was made from (improved)

The request arrived as one line, after Grades 1 and 2 had gone live:

> Build Grade 3 Global Perspectives on the same kit

Below is the version that states what that line assumes and the checks that
decide whether it was done. It is the Grade 2 prompt
(`../grade-2-app/PROMPT.md`) with the Stage-3-shaped parts stated, and it is
written so that Grade 4 can be asked for the same way — noting that Cambridge
publishes ONE set of objectives for Stages 3 to 4, so a Grade 4 build on this
kit is the same 18 codes under `4…`, and the difference must come from the
topics and the depth, not from new machines.

---

## Build a Grade 3 Global Perspectives standalone lesson course on the shared kit

### What to build

A third grade directory, `global-perspectives/grade-3-app/`, holding only
`app.config.json` and `content/lesson-N.py`, built by the SAME
`global-perspectives/lesson-kit/` as Grades 1 and 2. Nothing in the kit is
grade-specific; the stage in the config decides which codes the builder
accepts, which look-back the shell draws, and what the gate demands.

**"On the same kit" means the kit may grow, and every growth is additive.**
Stage 3 asks for things Stages 1 and 2 did not, so the kit gains machines for
them, and the proof that a kit change is safe is Grades 1 AND 2 rebuilt
through the new kit and driven to 100% again in the browser, every step of
every lesson, before Grade 3's own drive — and again after any later kit
change, however small.

### The content: Cambridge Primary Global Perspectives 0838, Stage 3, all of it

- Stage 3 has **18** objectives, one per sub-strand. Author to what is NEW
  at Stage 3: the child's OWN questions to understand a topic (3Rq.01);
  locating answers inside a source (3Ri.01); investigating by interview,
  questionnaire, OBSERVATION and MEASUREMENT (3Rc.01); selecting, organising
  and recording in charts and diagrams (3Rf.01); people thinking different
  things (3Ap.01); conclusions from graphical or numerical data (3Ad.01);
  CAUSES of personal actions and consequences on others (3Ac.01); actions
  for an issue affecting OTHERS (3As.01); a source's author has a viewpoint
  (3Es.01); an opinion about ANOTHER person's viewpoint, with reasons
  (3Ea.01); strengths AND limitations of one's own contribution (3Fc.01);
  how working together improved the outcome (3Ft.01); what was learned and
  how ideas CHANGED (3Fv.01); which TYPES of activity support learning
  (3Fl.01); the team ALLOCATES tasks (3Cc.01); a member brings ideas and
  works positively (3Ct.01); presenting with an appropriate STRUCTURE
  (3Mi.01); responding with relevant IDEAS and questions (3Ml.01).
- Eight lessons by skill cluster, each on a topic a seven-to-eight-year-old
  can investigate: where our water comes from; what passes the school gate
  and how tall the bean plants grew; our snacks; dogs in the park; the
  classroom and the new girl; the fair sign and the recycling garden; saving
  water at school; and the course look-back.
- Every step names its codes; the builder refuses a code Stage 3 does not
  publish; the gate on the BUILT pages fails if any of the 18 is unreached
  or any lesson falls below its recorded floor.

### The machines Stage 3 adds to the kit

- **Observe and count** (`observe`): a scene of glyphs; tap every one of a
  kind; the count is recorded as you go.
- **Charts from observation** (`pictogram` with `fromObserve`), the **ruler**
  display with a `unit`, and **more / total / difference** questions, all
  computed by `_rules.pictogram_answer`.
- **The Venn organiser** (`organiser` with `venn: true`).
- **A viewpoint question on a text** (`text` with `then`).
- **A cause before the prediction** (`consequence` rounds with `cause`).
- **Allocate rounds** (`team` rounds of kind `allocate`): jobs, members with
  skills; each job fits exactly one member (`_rules.allocations`).
- **Strengths and limitations** (`strengths`): read from the team step's
  log of what the child did and which rounds took two goes; then what
  working together made possible.
- **The structured talk** (`know` with `mode: "structured"` and `slots`):
  start, middle, end, in order; a topic card in the wrong part is refused.
- **The changed look-back** (`lookback` with `mode: "changed"`, drawn by the
  shell for every Stage 3+ lesson): what I learned, how one idea changed
  (before, then after), which KIND of activity helped and why. The lesson
  MUST author its `changed` pairs; the shell refuses to derive them.

### Definition of done

1. `build-lessons.py` builds 8 pages, 0 refusals, 18/18 at Stage 3; floors
   recorded at the measured values.
2. `check-lessons.py` and `check-coverage.py` exit 0 for Grade 3 AND for the
   rebuilt Grades 1 and 2.
3. Every inline classic script parses under `node --check`.
4. The gate is mutation-tested on Grade 3, including the Stage 3
   relationships (an observation counting a kind the scene lacks, a chart
   keyed before its scene was edited, a ruler difference against the wrong
   row, a more key with rows swapped, a total that does not add up, a Venn
   item in a missing bin, a viewpoint or cause question with no key, a
   structured talk missing a slot, an allocate round where a job fits two
   people, a strengths step short of limitations, a changed look-back with
   one pair, a look-back carrying Stage 2's codes), each restored
   byte-identical, and re-run after the last kit change.
5. Every step of all eight Grade 3 lessons AND all sixteen rebuilt Grade 1
   and 2 lessons is driven to completion in a browser; no console error but
   the five platform 404s; no overflow at 375px.
6. Screenshots of the new machines mid-play are LOOKED AT: a gate cannot see
   "who is good at tall".
7. A README beside the build; the kit README updated with the new modes.

### Out of scope

Deploying, routing, redeploying Grades 1 and 2 on the new kit, recorded
narration, Stage 4, a human reading of the content.
