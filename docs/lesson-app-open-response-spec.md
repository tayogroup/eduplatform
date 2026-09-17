# The open-response step: a spec

**Status:** proposed, not built. Written 2026-09-17 out of the Cambridge Stage 1
and Stage 2 depth passes on the maths lesson apps.

**What it is for:** the standalone lesson apps (Grades 1–4, `*/grade-N-app/`)
can ask a child only to *choose*. Every question in every one of them is a tap.
That closes off one Cambridge TWM characteristic completely and one of
Cambridge's commonest extension moves.

---

## 1. Why: what Cambridge asks for that a tap cannot carry

Cambridge Primary Mathematics 0096 defines the eight TWM characteristics in the
Stage 2 Teacher's Guide. Seven of them are satisfiable by choosing. One is not:

> **Conjecturing** — Forming mathematical questions or ideas.

*Forming*, not selecting. The maths builds claim 7 of 8 at both stages and
deliberately leave conjecturing unclaimed, and the hub says so in those words.
That is honest, and it is the only TWM gap in the subject.

Counted in the Stage 2 books, the tasks that need it take three shapes:

| shape | Learner's Book | Teacher's Guide | what the child produces |
| --- | --- | --- | --- |
| "What do you notice?" | 14 | 18 | an idea about a pattern in front of them |
| "Make up…" / "a similar problem of your own" | 5 | 18 | a new question |
| "Predict which…" then check | — | — | a commitment made before the answer is known |

These are different acts and the spec treats them differently. Only the first
two are genuinely open. The third is a commitment, and a tap can carry it.

---

## 2. What already exists — read this before designing anything

**An earlier version of this analysis claimed the platform had no free-text
input anywhere. That was wrong, and the error mattered: it turned a port into
an invention.** The grep behind it covered `mathematics/`, `science/` and
`english/` standalone apps and was generalised to the whole platform. Global
Perspectives has had the whole pattern in production the entire time.

### 2.1 The deck already has a writing box

`shell/subjects/global-perspectives.js`:

- `renderQuizDeck()` (~line 690) and `renderReflectDeck()` (~line 482) each
  render a `<textarea rows="4" data-quiz="…">` **inside a `gc-slide`**, with the
  stored answer restored as its value.
- Each is followed by `<details class="gc-practice"><summary>Compare with a
  model answer</summary>` — the child writes first, then reveals a model answer
  and judges their own against it.

So open response *in a deck slide, at Stages 1–4*, is shipped, live and old.
It is not a new interaction and it does not need inventing or piloting.

### 2.2 The progress store already carries free text

`shared/progress-client.js :: applyEvent`:

- `draft.saved` → `unit.drafts[section] = {text, blobRef, words, at}`. A text
  field with a place to put it already reduces, locally and server-side.
- `progress.summary` → `unit.attempted = {section: {answered, total}}`. The
  comment on it is the design rule this spec inherits:

  > Global Perspectives is the only sender: its 315 questions are all
  > self-marked text, so it has no score to report and sends how much was
  > WRITTEN instead. **Deliberately not a score and never a pass flag.**

- `attemptedCounts()` (~line 1137) counts answered against the **current**
  question ids, never against the size of the stored map, so a removed question
  cannot inflate the count for ever.

### 2.3 What is actually missing

Only the step-runner form. The standalone apps have their own slide and runner
machinery (`secondStep()`, `tieredStep()`, `finish(i)`) which knows nothing
about an answer that cannot be marked. Measured: **0 `<textarea>` and 0
`type="text"`** across `mathematics/grade-*-app`, `science/grade-*-app`,
`english/grade-*-app` — and also 0 in `global-perspectives/grade-1-app` and
`grade-2-app`, which is the point: GP's own standalone builds never got it
either. It lives only in the shell course.

**So the work is a port, not a design.** Budget it as one.

---

## 3. The primitive

### 3.1 The contract

An **open-response step** is a step that:

1. **Cannot be marked.** No key, no right answer, no score. It never contributes
   to the check, the pass mark, or XP.
2. **Cannot block.** Next is always enabled, including on an empty box. A child
   who cannot yet write a sentence must not be trapped on a slide. This is not a
   graceful degradation — it is the primary case at Stage 1.
3. **Is captured.** What is typed is stored per learner and readable by an
   adult, or the step is theatre.
4. **Answers itself.** After the child has written (or skipped), a disclosure
   reveals a model answer — Cambridge's own wording where it exists — so a child
   working alone still finds out what a good answer looks like. This is the
   mechanism that replaces marking; copy it from GP exactly.

### 3.2 Shape

```
openStep({
  id:      "l03-notice-1",      // stable, unique within the lesson
  ask:     "What do you notice about the numbers in the last column?",
  hint:    "Look at the ones digit each time.",   // optional
  model:   "They all end in 0. Every one of them is a whole number of tens.",
  twm:     "conjecturing",      // stamps data-twm on the section
})
```

Rendered as a normal slide carrying `data-say` and `data-explain` like every
other step, plus `data-open="<id>"` so tooling can find it.

### 3.3 Storage

Reuse `draft.saved`. Do **not** invent an event.

- `section` = the step id above.
- `text` = what was typed, trimmed, capped (GP's server clamps; match it).
- Report `attempted` alongside, `{answered, total}` per lesson, counted against
  the current ids exactly as `attemptedCounts()` does.
- Never send a score and never set a pass flag for these. The family portal and
  parent board already read `attempted` as "how much was written"; a score here
  would be read as achievement and would be a lie.

---

## 4. "Make up a problem of your own" — the cheaper half

Cambridge's commonest extension move is *"Ask them to make up a similar problem
of their own."* The maths builds do not attempt it and say so.

It does **not** need free text, and free text is the worse answer for it. A
problem assembled from parts is a real problem the child authored *and* one the
app can solve:

```
buildStep({
  id:     "l03-makeone",
  frame:  "{name} has {a} {things}. They {verb} {b} more. How many now?",
  slots:  { name: [...], a: 2..40, things: [...], verb: [...], b: 2..40 },
  check:  (s) => s.a + s.b,          // the app knows the answer it just made
})
```

The child taps to fill the slots, reads their own problem back, and then solves
it — and because the generator knows the numbers, the answer *is* checkable.
This closes the extension gap without asking a six-year-old to type, and it is
independent of §3: ship it first if only one gets built.

---

## 5. Integration constraints in this codebase

Each of these has cost a defect in the maths passes. None is optional.

- **Progress is recorded by step POSITION.** Inserting a step before the check
  reopens the lesson for every learner who had finished it. Append open-response
  steps at the end of a lesson's teaching run, or accept and announce the
  reopen.
- **The answer-key gate must skip these explicitly, not by accident.**
  `lesson-app-tools/check-answer-keys.py` must recognise `data-open` and exclude
  it, and its per-file counts must not move when open steps are added. A gate
  that silently ignores a new shape is this repo's most repeated failure.
- **The review pack must harvest them WITH A FLOOR.** `build-review-pack.py` has
  now been blind to three shapes in succession (reasoning triples, the `w:`
  field, the recall bank), each time reporting a clean run. Open-response steps
  have no key, so they must appear in the pack marked *unverifiable* — and the
  builder must refuse if the count of them drops to zero.
- **`data-twm="conjecturing"` is what moves the hub from 7 of 8 to 8 of 8.** The
  TWM index is derived from the stamps, not hand-kept, so the stamp *is* the
  claim. Stamp only steps that genuinely ask the child to form a question or an
  idea. A "predict then check" tap step is **specialising**, not conjecturing;
  stamping it would make the other seven worth less.
- **Narration and captions.** Every step needs `data-say`, and `data-explain` if
  it is to answer Explain. The attribute is single-quoted, so no apostrophes,
  and captions are shown on screen, so no apostrophe-stripped spellings either.
  See `grade-2-app/add-explain-scripts.py` for the audit that enforces both.
- **The lesson search index** is built from slides; re-run
  `lesson-app-tools/build-lesson-search.py` after adding steps or the new
  content is unfindable.
- **The deck is the only design at Grades 1–4** and open-response must not drag
  the grid back. GP's grid half is not the model here; its *deck* renderer is.

---

## 6. Risks, stated rather than designed around

- **A Stage 1 child may not be able to write a sentence.** Ages 5–6. This is the
  real risk and §3.1 rule 2 exists because of it: the step must be skippable and
  the model answer must be reachable without writing. If usage shows empty boxes
  everywhere at Stage 1, that is a finding, not a failure — and `attempted`
  already measures it, which is why it must be reported from day one.
- **Voice is the obvious next step and is out of scope here.** An Azure speech
  path already exists for English Grade 1 pronunciation. Reusing it for spoken
  conjecturing is plausible and is deliberately not specified: it costs money
  per utterance and needs its own budget decision.
- **Nobody reads the drafts today.** `unit.drafts` reduces and stores, but no
  teacher surface renders it. Capturing text nobody ever opens is worse than not
  capturing it, because it looks like the gap is closed. **Shipping §3 without a
  surface that shows an adult what was written is not shipping it.**

---

## 7. What not to do

- Do not mark an open response, by string comparison, similarity, or a model.
  The moment it is scored it stops being conjecturing and becomes a quiz the
  child cannot win.
- Do not gate `finish()` on it.
- Do not claim conjecturing anywhere — hub, README, comparison page — until a
  `data-twm="conjecturing"` stamp sits on a step a learner can actually reach.
- Do not build this maths-first as a one-off. The runner is shared kit; put it
  in `lesson-app-tools/` so Science, English and Computing inherit it.

---

## 8. Recommended order

1. §4, the problem builder — no new storage, no new risk, closes the extension
   gap, and is checkable by construction.
2. The teacher-facing surface for `unit.drafts` (§6, third bullet).
3. §3, the open-response step, once there is somewhere for the writing to go.
