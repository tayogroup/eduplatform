# The prompt this build was made from (improved)

The request arrived as one line, after Grades 1 to 3 had gone live:

> Grade 4 Global Perspectives on the same kit.

Below is the version that states what that line assumes and the checks that
decide whether it was done. It is the Grade 3 prompt
(`../grade-3-app/PROMPT.md`) with the one fact that changes everything
stated first.

---

## Build a Grade 4 Global Perspectives standalone lesson course on the shared kit

### The fact that shapes this grade

Cambridge publishes ONE set of Global Perspectives objectives for Stages 3
to 4. Grade 4 is therefore the same 18 objectives as Grade 3, under `4…`
codes. **"On the same kit" here means the kit does not grow.** Every Stage 3
machine already exists; a Grade 4 lesson is authored with the same step
kinds and the difference is in the topics and the depth. Any temptation to
add a Stage 4 machine is a sign the depth has not been found yet.

### What to build

A fourth grade directory, `global-perspectives/grade-4-app/`, holding only
`app.config.json` and `content/lesson-N.py`, built by the SAME
`global-perspectives/lesson-kit/` as Grades 1 to 3, with `stage: 4` in the
config so the builder accepts `4…` codes and refuses `3…` ones.

### The content: 0838 Stage 4, all 18, one step deeper than Grade 3

- Research: questions that OPEN A STAGE of something (a food journey), not
  merely questions the child cannot answer (4Rq.01); locating one sentence
  among six that are all on-topic (4Ri.01); CHOOSING observe, ask or measure
  by what the question needs, and deciding what counts before counting
  (4Rc.01); recording in the chart that fits, including a Venn diagram
  (4Rf.01).
- Analysis: views that come from WHERE EACH PERSON STANDS, so four people
  with the same facts differ (4Ap.01); conclusions that go EXACTLY AS FAR AS
  THE DATA, with "too far" a category of its own (4Ad.01); a small cause in a
  SHARED SPACE reaching twenty people (4Ac.01); actions for a neighbour, a
  caretaker, a librarian (4As.01).
- Evaluation: a source whose author is a COMPANY that wants your support
  (4Es.01); an opinion of somebody else's view with two reasons about the
  topic (4Ea.01).
- Reflection, Collaboration, Communication: as at Stage 3, on new topics — a
  class museum, a bee garden, energy talks, a course look-back (4Fc, 4Ft,
  4Fv, 4Fl, 4Cc, 4Ct, 4Mi, 4Ml).
- Eight lessons, each on a topic an eight-to-nine-year-old can investigate:
  where food comes from; waste and the rain gauge; sleep and library loans;
  the old field; shared spaces; the class museum; energy talks; the look-back.

### Definition of done

1. `build-lessons.py` builds 8 pages, 0 refusals, 18/18 at Stage 4; floors
   recorded at the measured values.
2. `check-lessons.py` and `check-coverage.py` exit 0.
3. Every inline classic script parses under `node --check`.
4. Any kit change, however small, is proved safe by rebuilding Grade 3
   through it: byte-identical, or re-driven to 100%.
5. The gate is mutation-tested on Grade 4 with the full Stage 3 list
   translated to Grade 4's files, codes and data, each restored
   byte-identical.
6. Every step of all eight Grade 4 lessons is driven to completion in a
   browser; no console error but the five platform 404s; no overflow at
   375px.
7. Screenshots of the new content mid-play are LOOKED AT.
8. A README beside the build.

### Out of scope

Deploying, routing, recorded narration, Stage 5, a human reading of the
content.
