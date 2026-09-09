# Evaluation prompt — Ehel Mathematics, Grades 1 to 4

Paste everything between the rulers into a fresh session with this repo open.
Notes on how to use it, and the measured control figures the evaluator's own
numbers must reproduce, are at the foot of this file below the second ruler.

---

## Your task

Evaluate and compare the Ehel Academy Mathematics courses for **Grades 1, 2, 3
and 4**. Produce one report that lets a reader see, per area and per grade, how
good each is, how they differ, and what is wrong. The comparison across the four
grades is the point — a per-grade write-up that cannot be read across is a
failure of the task.

You are reviewing curriculum and product, not code style. Where you find a
defect, name it, cite the file and the line or slide, and say what a learner
experiences. Do not fix anything. Do not deploy anything. Do not commit
anything.

## What exists — read this before searching, and verify each claim

`src/prototypes/ehel-academy/mathematics/` holds **two separate courses per
grade**, and confusing them invalidates the whole exercise.

| | the standalone lesson build | the shell course |
| --- | --- | --- |
| where | `grade-N-app/` | `grade-N/data/units/*.json` |
| what | self-contained HTML lessons, own CSS + activity JS + voice engine, no `shell/course-app.js` | the generated 15-18 unit course served by the shared shell |
| Grade 1 | 7 lessons in `grade-1-app/g1v2/` | 15 units |
| Grade 2 | 9 lessons | 15 units |
| Grade 3 | 8 lessons, generated from `grade-3-app/src/` | 18 units |
| Grade 4 | 8 lessons | 18 units |

Each standalone build describes itself in `grade-N-app/app.config.json`. **Order
in its `lessons` array IS the teaching order and IS the unit number** (unit N is
`lessons[N-1]`). Grade 1 is the exception with no such config — its lesson list
is in `grade-1-app/README.md` and its pages are in `g1v2/`.

Shared tooling is `lesson-app-tools/` (`check-lessons.py` is the gate every
build passes; `deploy.mjs --app .` is the deploy path). Grade 1 has its own
older copies of the same tools in `grade-1-app/`.

The framework is **`src/curriculum/cambridge-mathematics-0096.json`** — Cambridge
Primary Mathematics 0096 (2020), extracted by the repo's own
`tools/extract-cambridge-mathematics-framework.py`. It holds 36 / 48 / 53 / 46
content objectives for Stages 1-4 under three strands (Number, Geometry and
Measure, Statistics and Probability) and ten sub-strands. It does **not** hold
the Thinking and Working Mathematically objectives — see area A.

### Facts you must establish rather than assume

Every one of these is currently asserted somewhere in the repo and is either
unverified or contradicted by another file. Treat each as a question:

- **Which build does a learner in each grade actually receive today?** Routing
  is one Moodle setting, `local_prequran/ehel_app_url_overrides`, read by
  `pqpg_ehel_app_base()` in `local_prequran/progress_gatewaylib.php`. You cannot
  read that setting from this repo. State what the repo claims, per grade, and
  mark it unverified. `grade-1-app/README.md` says Grade 1 points at
  `grade-1-v2`; the other three READMEs say NOT deployed and NOT routed.
- **`lesson-app-tools/README.md` and `grade-2-app/README.md` disagree** about
  whether Grade 2 has been uploaded. One is stale. Say which, or say you could
  not tell.
- **`grade-4-app/README.md` describes five lessons plus a donor and a six-card
  hub; `app.config.json` lists eight lessons and all eight files exist.** The
  README is stale relative to a later split. Measure the build, do not read it.
- Coverage claims of 36/36 (G1), 53/53 (G3) and 46/46 (G4) exist in READMEs and
  audit HTML. They are claims. Reproduce or refute each.

**A README is a hypothesis about the build. The build is the fact.** Several of
these READMEs were accurate when written and describe a state that has since
moved.

## Ground rules

These are not style preferences. Each one exists because a check in this repo
was green while doing no work.

1. **Measure, then write.** Every score cites a number you produced and a
   command that produces it again. "Grade 3 feels thinner" is not a finding;
   "Grade 3 carries 88 slides against 53 objectives, 1.66 per objective, the
   lowest of the four" is.
2. **A count of a marker is a claim about presence, never about correctness.**
   A page that imports `learner-controls.js` may still mount nothing. A slide
   that mentions "half" may not teach halves.
3. **"Could not run" is its own outcome and is neither a pass nor a finding.**
   `grade-3-app/checks/check-audit.mjs` exits 2 without `fw.txt` beside it (a
   `pdftotext -layout` extraction of the 0096 PDF, deliberately uncommitted).
   Report a tool you could not run as not run. Never let a skipped check appear
   as a tick.
4. **Report what you could not verify as prominently as what you could.** The
   Grade 1 build has 75 check questions of which 52 have no computable answer;
   that is 52 wrong keys that could reach a child in silence, and it belongs in
   the report, not in a footnote.
5. **Do not build an automatic coverage scorer.** It was tried for Stage 4 and
   failed its control — it passed both objectives that were genuinely missing,
   and tightening it produced 7 false alarms to find 1 real gap. The reason is
   structural: a lesson legitimately teaches an idea in child-facing words that
   share no vocabulary with Cambridge's phrasing. `grade-4-app/README.md`
   documents this. Use hand-written discriminating patterns per objective and
   check every quoted match by eye, as `audit-deployed-course.py` does.
6. **Say which of the two courses each finding is about**, in every finding.
7. When two of your own numbers disagree, do not average them or pick one.
   Report both and say which measurement you trust and why.

## The areas

Score each area, for each grade, **0-4**: 0 absent, 1 present but seriously
deficient, 2 workable with named defects, 3 good, 4 strong with nothing material
outstanding. Every score carries a one-line justification citing a measurement,
and a confidence — **measured / partly measured / judgement**. A score of 4 with
confidence "judgement" is not permitted; if you cannot measure it, the ceiling
is 3.

### A. Cambridge 0096 framework compliance

- **Coverage.** For each grade, which of its stage's objectives are taught, by
  which lesson and which slide. Cite the slide for each. Distinguish *covered*
  (taught, with a learner activity) from *mentioned* (the words appear) from
  *absent*. Mentioned is not covered, and this distinction is the whole area.
- **Correctness of the mapping.** Where a build claims an objective, does the
  slide actually teach that objective, or a neighbouring one? Stage 4's audit
  found commutativity being offered as associativity. Look for that shape.
- **Stage-boundary discipline.** Does any grade teach content above its stage?
  The Stage 1 boundaries that bite: fractions are halves only, numbers 0-20,
  ordinals to tenth, time is hour and half hour, doubles to double 10, counting
  back in ones and tens only, measurement is direct/non-standard, no
  multiplication or division. Derive the equivalent list for Stages 2-4 from the
  framework file before looking. `grade-1-app/review-stage-boundary.py` exists
  for this and is uncommitted with a high false-positive rate — read it for the
  probe list, do not trust its output.
- **Under-reach.** The mirror question, and nobody has asked it: does a grade
  teach materially *below* its stage, repeating what the grade below already
  did?
- **Thinking and Working Mathematically.** 0096 carries 8 TWM objectives per
  stage and the framework file in this repo does not hold them. Grade 4's README
  rules them out of scope because they describe how a learner works rather than
  what they know, and cannot be evidenced by locating content. Take a position
  per grade, state it, and say what would be needed to evidence it. Do not
  silently drop them.

### B. Quality and accuracy

- **Answer keys.** Every check question whose answer can be computed, computed
  independently. `grade-1-app/check-answer-keys.py` does this for Grade 1 (23 of
  75) and carries four rules that each exist because they called a correct key
  wrong: the expression must account for every number in the question, a bare
  `/` is never an operator, estimation questions are excluded, algebra is
  excluded. Grades 2, 3 and 4 have no equivalent — Grade 3 has per-lesson
  `checks/check-l*.mjs` and Grade 4 has `check-judging.py`, which are not the
  same thing. Report per grade: computable and correct, computable and wrong,
  and **not computable** as its own number.
- **Mathematical correctness of the teaching itself** — the worked examples, the
  explanations, the diagrams. Read them.
- **Distractor quality.** A wrong option that is arbitrary teaches nothing; one
  that embodies the common error teaches a lot. Sample and judge.
- **Feedback on a wrong answer.** Does the learner get told why, or only that?

### C. Interactivity and ease of use

- **Interaction inventory per grade**: how many slides let the learner commit to
  an answer and be told "not quite", versus how many only display. Grade 4 found
  22 of its 37 teaching slides had no such moment — sliders and variant chips
  change the display but never disagree. Run that same count on all four.
- **Navigation**: the dot rail, `finish(i)`, the sticker shelf, the hub, the way
  back. Note that `finish()` counts and `class="slide"` counts do not match in
  several lessons; establish which is authoritative before drawing a conclusion
  from either.
- **Accessibility**: contrast in both themes, keyboard reachability, focus
  states, screen-reader labelling. `grade-3-app/checks/check-a11y.mjs` covers
  nine pages in both themes and is the model; the other builds have no
  equivalent.
- **Mobile**: 375px width, no horizontal overflow, tap targets.
- **Age fit of the interaction itself.** A drag that a six-year-old cannot
  complete on a trackpad is a defect even when it works.

### D. Content strength and quality

- **Depth per objective**, per grade: slides per objective, and the spread. An
  objective met once in one slide is covered and not taught. Report the
  distribution, not only the mean — one objective with six slides and five with
  one is not the same course as six with two.
- **Balance**: exposition, worked example, guided practice, independent
  practice, reasoning. Count them.
- **Real contexts** and whether they suit East African learners at Raeburn
  Nanyuki rather than being generic.
- **Reasoning and justification.** Grade 3 has a "How do you know?" step with
  its own checker (`grade-3-app/convince/`). Do the others ask a learner to
  explain anything?
- **Differentiation**: is there anything for a learner who is ahead, or stuck?
- **Whether the lesson boundaries make sense.** Grade 3 was five lessons with
  two 17-step portmanteaus and was split into eight for a stated reason — the
  lesson is the progress unit, so an over-broad lesson makes the live group
  board report a position 17 steps wide, holds the unit gate shut too long, and
  makes tutoring search land on the wrong name. Apply that test to all four.

### E. Content design and style

- **Consistency across the four grades**, which only this comparison can see.
  These builds were made by different toolchains at different times: Grade 1 has
  a two-bar header, Grades 2-4 have a hero; Grade 3 is generated from fragments,
  Grade 4 from body + slides + shell. A learner moving Grade 1 to Grade 4 meets
  all of it. Say what drifts and whether it matters.
- **Visual and typographic quality**, per grade, and whether it matures with the
  age it serves — a Grade 4 page styled for a five-year-old is a defect.
- **Language level**: sentence length and vocabulary against the grade. Measure
  it; do not eyeball it.
- **Tone**, and whether the page speaks to the child or about them.
- **Look at rendered pages.** Serve the tree over HTTP and open them. Several
  defects in this repo's history — two suns in one sky, white-on-white controls,
  a shadow that read as a stick — passed every gate and were visible only on
  screen.

### F. Estimated learning time

Report **per grade, per unit and per day**, and show the method.

- Derive a per-slide time band **from the content**: narration duration or word
  count, number of interactions, number of questions. Do not assume a flat
  minutes-per-slide; state the band and how you got it.
- Give per-lesson totals, a per-grade total, and the spread across lessons
  within a grade — an 18-slide lesson beside a 6-slide lesson is a scheduling
  fact a teacher needs.
- Convert to a school year on the real calendar: **Raeburn Nanyuki 2026-27, 25
  August - 4 December 2026, 5 January - 25 March 2027, 20 April - 2 July 2027**.
  That is 74 / 58 / 54 weekdays = 186 raw, about **175 teaching days / 35 weeks**
  after half-terms and public holidays. The half-term deduction is unconfirmed;
  carry the range 171-186 rather than hiding it.
- The daily learning period is **20 minutes in the app** beside 30 minutes of
  live teacher. State, per grade, how many weeks of the 35 the build fills at 20
  minutes a day, and what happens for the rest of the year.
- Note that the Wehel tutor allowance is spent **inside** the app block, not on
  top of it: 10 min/day at Grades 1-2, 15 at Grades 3-4
  (`WEHEL_DAILY_BANDS` in `shell/wehel.js`). Say what that leaves for lesson
  content.
- Do the same for the shell course of each grade, since it is the alternative,
  and put the two side by side.

### G. Progression and continuity, Grades 1 to 4

The area only a four-grade comparison can answer, and nothing in the repo covers
it.

- Does each grade build on the one below, in vocabulary, notation and method?
- Is anything taught twice across grades in a way that wastes time, or dropped
  between them so a grade assumes what was never taught?
- Do the strands run continuously? Trace two or three sub-strands (`Np`, `Nf`,
  `Gt` are good candidates) across all four grades and say what a learner
  experiences.
- Does the same idea keep the same name and the same picture between grades?

### H. Reachability — what a learner actually gets

An evaluation of a build nobody can open is a different thing from an evaluation
of one serving children, and the report must not blur them. Per grade: is the
standalone build on the CDN, is it routed, and if not, which course is serving
that grade today. Mark every routing claim as unverified unless you have
evidence from outside this repo.

### I. Platform integration

Per grade: progress reporting to the live group board (`section.completed`,
`unit.completed`, `progress.summary`, and whether position is flushed rather
than left to the 20-second idle timer), Wehel, Class chat, Hand up, Join class.

Note the known design decision: these builds report progress under their own
unit namespace (`l01`..`lNN`) beneath the real course key, because the lessons
are not the shell course's units. That means the **gradebook does not see them**.
Say what that costs per grade, and whether the mapping decision has been made.

Note also the known trap: `mountHandRaise` and `mountClassChat` return early
without `launchToken` and `launchEndpoint`, so a page that drops the launch
parameters mounts nothing, silently. Check every in-app link carries them.

### J. What the existing gates actually establish

For each grade, list the checks that exist, what each one proves, and what it
cannot see. Then say, per grade, how much of your own confidence rests on a gate
you have watched fail.

This repo's own history is the argument: a gate that matched the marker comments
its own tools write was a gate on authorship, not behaviour; a substring test
for `"./course-shell.js"` was satisfied by a `<link rel="modulepreload">` while
the import itself was gone; a coverage table keyed on a name that never appeared
in the files printed a tick over 37 unexamined placements.

### K. Risk register

Close with a ranked list of what would hurt a real learner first, each with the
grade, the evidence, and whether it is a content decision, a build defect or an
open business question. Separate **defects** from **decisions nobody has made**.

## Output

1. **One comparison table**: areas A-K down the side, Grades 1-4 across, scores
   in the cells. This is the artefact the reader looks at first.
2. **A second table of the hard numbers**: lessons, slides, objectives, slides
   per objective, check questions, computable keys, interactive slides, hours of
   content, weeks of the year filled.
3. **Per-area sections**, each covering all four grades together so they can be
   read across — not four grade sections each covering all areas.
4. **The risk register.**
5. **A "what I could not establish" section**, listing every tool you could not
   run, every claim you could not verify, and every number you are carrying from
   a README rather than from a measurement.

Cite files as `path:line` and slides as `lesson.html #slide-id`. Keep prose
tight; the reader is the owner of this curriculum and knows the product.

---

## Notes for whoever runs this

**Control figures.** These were measured on 2026-09-09 against the working tree.
If the evaluator's reproduction disagrees, their method is wrong — or the tree
has moved, which is itself worth knowing.

| | G1 | G2 | G3 | G4 |
| --- | --- | --- | --- | --- |
| standalone lessons | 7 | 9 | 8 | 8 |
| slides (`class="slide"`) | 85 | 122 | 88 | 88 |
| 0096 objectives for the stage | 36 | 48 | 53 | 46 |
| slides per objective | 2.36 | 2.54 | **1.66** | 1.91 |
| shell course units | 15 | 15 | 18 | 18 |
| shell course array items | 1,345 | 1,407 | 1,693 | 1,697 |

Grade 3 having the thinnest coverage per objective while serving the stage with
the *most* objectives is the first thing the evaluation should confirm or
explain.

**Scope.** The prompt deliberately does not ask for fixes. Coverage gaps,
answer-key errors and stage over-reach each need a different owner, and mixing
the finding with the repair is how the Grade 4 coverage scorer got built and
thrown away.

**Cost.** Areas A and B are the expensive ones — hand-checking 183 objectives
and several hundred check questions across four grades. If the budget is one
pass rather than four, run A, B and F first; G is the one that pays for the
comparison being done at all.

**Running it per grade instead.** Split only along grades, never along areas. An
evaluator given one grade cannot answer G, cannot see the design drift in E, and
will score C and D against a scale they invented, which is the failure this
prompt is shaped to prevent.
