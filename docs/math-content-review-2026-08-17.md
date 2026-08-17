# Mathematics course — proofreading review (2026-08-17)

Scope: every learner-facing string in `src/prototypes/ehel-academy/mathematics/grade-1..8/data/**` — 133 units, 8 placement exams, 8 grade capstones, 8 course manifests, ~4.06M characters of teaching text. Method: sixteen reviewers each read a assigned slice blind (two per grade), quoting every finding verbatim against its JSON path; a consolidation pass mechanically verified all 1,522 surviving quotes against the source files (0 broken), then classified the systemic patterns and applied fixes in two layers — a general per-field tool for corrections a reader had already written out by hand, and a small set of mechanical rules for defects repeated identically across dozens of units. `npm run check:math` passes clean on the result.

## What's fixed and live

**889 individually-verified corrections**, each a `{file, path, old, new}` edit checked against its own field before writing (`tools/repair-ehel-math-proofread-20260817.mjs`, edits in the sibling `-edits.json`). These cover wrong maths inside worked examples and reasoning prompts, grammar and spelling, adult-voice text sitting in learner fields, and shifted answer/practice keys — one field at a time, never propagated to other fields sharing the same text (see "A bug found and fixed" below for why).

**Eight systemic rules**, applied mechanically wherever their pattern matched (`tools/repair-ehel-math-systemic-20260817.mjs`), because the same defect repeated near-identically across the whole course:

| Rule | Instances | What it was |
|---|---|---|
| `spelling` | 1,920 | US spelling in a UK-English course — "Math Words & Symbols" (the templated vocabulary hint, narrated), "analog" → "analogue", "color(ed)" → "colour(ed)", "Organizing" → "Organising" |
| `means-capital` | 1,747 | The glossary-question template read `"${term} means ${meaning}."`, and every meaning starts with a capital, so the learner heard "Digit means A single symbol from 0 to 9." Lowercased the glued-on sentence, except genuine abbreviations (`IQR means Q3 − Q1`) |
| `game-description` | 1,596 | Game subtitles were `"Practise ${term.toLowerCase()} through four short challenges."`, both ungrammatical for most terms ("Practise integer…") and wrong wherever the term needs its capitals ("gcf", "venn diagram", "3d shape"). Rebuilt from `game.skill`, which the builder never lower-cased |
| `practice-title` | 252 | The last 3–4 worked examples per unit were titled "Practice 9/10/11/12" instead of a real title. Derived a title from the prompt; where the prompt was a bare multi-part stem ("Solve:", "Convert:") too short to stand alone, labelled it "{verb}: several parts" rather than reusing the prompt verbatim as its own title (the app's content gate rejects that pairing) |
| `outcomes` / `self-assessment` | 133 units | The source's "Required Materials" heading (and, in some units, whole intro paragraphs — "This unit is written for self-paced learning…", "Keep a pencil and paper beside you…") had been imported as learning outcomes, and then templated into "I can Required Materials (all low-cost / household)" self-assessment lines. Materials lines moved into the unit overview as "What you will need: …"; intro prose moved there too; `selfAssessment` rebuilt from the real outcomes in first person |
| `key-rule` | 45 + 3 + 37 | A reference card's heading was only recognised by the builder when it ended in the word "Rule", so 58 other cards were titled "Key rule N" with the real heading glued onto the body ("Our Coins and Notes 1 sh, 5 sh…"). Every one was read by hand and its title looked up from a table, sliced off the body without retyping it (so a transcription slip can't alter the content) — a general regex split was tried first and rejected, because it truncates a heading right before a trailing number or parenthetical ("Multiplying by 10 and" / "100 × 10: …") |
| `minus` | 45–52 | A hyphen or em dash standing where "−" belongs between two numbers, converted only where a "=" follows within a short window with nothing but digits/operators between — narrow on purpose after an early version mangled "by 3/4 — 8 × 3/4 should give back 6" (a punctuation dash, not arithmetic) into `4 − 8` |
| `markdown` | 239 | Literal `*emphasis*` asterisks from the source pack, un-rendered by the app's escaped output |

**Six wrong quiz keys fixed directly**, each re-derived and verified:
- Two capstone quizzes (Grade 3, and its matching Unit 1 assessment question) asked for an *estimate* by rounding to the nearest 10, explained the estimate correctly (600), then keyed the exact sum (599) — which wasn't even offered as an option. Rekeyed to 600 with matching options.
- Four capstone-quiz fraction questions (Grades 6 ×2, 7, 8) were auto-generated with whole-number distractor sets against a fraction answer the explanation itself states correctly (e.g. "4 × 3/5 = 2 2/5", keyed **12**, options 11/14/12/13). Replaced each option set with fraction-shaped distractors matching the stated answer.
- Two Grade 2 vocabulary questions ("What does 'Pattern'/'Symmetry' mean?") carried a distractor that is *itself* the glossary's own definition of a different term the same quiz also tests ("The same unit comes again and again" = the course's own definition of "Repeating pattern"). Replaced only in the exact rounds carrying that pairing — the same phrase is the *correct* answer to other questions in the same game set.

Every quiz/game/placement answer in the course was mechanically re-checked against its own options after every change (`answer` must be a listed option, no duplicate options) — 0 problems.

## A bug found and fixed, before it shipped

The per-string tool originally propagated a fix to every other string in the same file holding an identical value, on the theory that the course copies an item's answer into practice/fluency/explorations/workedExamples/errorFeedback on purpose (true, and documented elsewhere in this repo for Science). It isn't true for *prompts*: Mathematics also reuses short generic text ("Work out 8 × 7.", "Find all the factors of 30.") as one-off filler across **unrelated** worked examples. A Grade 4 Unit 5 run chained three separate, individually-correct edits through that coincidence and left a live, scored quiz question reading "Find the HCF of 24 and 36…" keyed to an explanation about 8 × 7. Caught by re-running `check:math` after every apply step, not before — the whole mathematics tree was reverted to `HEAD` and every edit reapplied with propagation removed. Every genuine duplicate-answer case this review found (e.g. Grade 2 Unit 11's three-quarter-turn answer, wrong in three separate copies) was already listed as three separate per-string edits by the reviewers, so nothing was lost by requiring that going forward.

## Verification

```
npm run check:math
```
passes clean: content, answer keys (109 machine-checkable, all agree), Cambridge mapping, answer grading, progress integrity, audio-template coverage. A standalone options/duplicate-answer sweep across every assessment, game round, and placement question also reports 0 problems.

## What's still open — 391 findings, by design

Not silently dropped: every finding the readers could not propose a mechanical fix for is preserved in the review data, exactly like the English review's baseline file. The largest classes:

- **~55 fields where the source pack's own table or list was dropped during extraction** (`concepts[].explanation`/`.example`, mostly Grades 5–8), leaving a sentence that ends on a colon with nothing after it ("Here is a calendar for March 2023 to practise on:", "The formula is:") or two orphaned table cells with no headings. The raw source blocks were checked (`outputs/math-content/math-content-model.json`) and the missing content is recoverable in most of these — 58 of 63 such fields could be located verbatim in the model during this review. That reconstruction is table-shape-specific (a 2-column glossary, a multi-row properties table, a numbered list all need different handling) and wasn't attempted here; it is the single highest-value follow-up.
- **~110 fields carrying adult-voice "common mistake" bullets or teacher planning notes pasted into a learner's `concepts[].example`** ("Slow them down; move each counted object aside", "Show them exactly what to practise next"), concentrated in Grade 1.
- **~30 places where a worked example's heading, prompt, and "Solution:" label leaked into the *previous* item's own solution or method steps** (a content-blending artefact at extraction), so the next item duplicates its predecessor.
- **A handful of genuine content contradictions needing one decision each** rather than a mechanical fix: Grade 1 Unit 10 disagrees with itself on whether a cone can stack (three items say yes, one says no); Grade 2 Unit 4's tally questions use "IIII" for both 4 and 5 because the crossed-fifth mark has no glyph in plain text (also Grade 4 Unit 10); Grade 1's capstone quiz is pitched well above Stage 1 (rounding, degrees, thirds, equivalent fractions, in a course whose Unit 1 teaches counting to 10).
- **7 reference cards with no recoverable body** (`Turns at a Glance`, `Three-quarter turn`, `Lines of Symmetry to Remember`, `Lines of symmetry`, `Scalene triangle`, `Times-Table Quick Facts`, `Pattern to remember`) — orphaned table cells with nothing to split a heading from. Left titled "Key rule N" rather than guessed at.

Full findings, verified quotes, paths, and per-item severity: `docs/math-content-review-2026-08-17-findings.json` (1,522 rows; `fix: null` marks the 391 still open).

## Audio

Mathematics narration is hash-named (editing text mints a new filename, so a CDN-cached clip is never stranded — unlike English, which needed `AUDIO_RELEASE` query-busting for exactly this reason). Re-rendering is **not done yet** — it costs real money and needs a decision on scope first:

```
node tools/generate-ehel-math-audio.js --dry
```
reports the full required set (17,729 clips). Diffed against what's on disk: **1,242 new clips need generating (~694,000 characters)**, and **1,243 old clips are now orphaned (762 MB)** — not committed to git for this subject, so once superseded they're gone for good (by design; nothing here is a mistake to recover from).
