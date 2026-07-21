# Ehel Academy — Pilot Content Review (AI-assisted)

**Reviewer:** Claude (AI-assisted review, acting in the educator-reviewer role)
**Date:** 2026-07-21
**Purpose:** Content sign-off for the 1 August 2026 pilot, ahead of the human curriculum reviewer's availability (~September 2026).
**Status of this review:** AI-assisted review complete. **Human educator sign-off still pending** — this document lets the human reviewer audit a reviewed corpus rather than a raw one. Do not treat as final curriculum accreditation.

Scope: Cambridge-aligned Ehel Academy prototypes — Science (0097/0893), Mathematics (0096/0862), English (0058/0861), Grades/Stages 1–8.

---

## 1. Science — home-experiment safety review

All **318 home experiments** (53 units × 6) were screened for hazards: fire/heat,
sharps, chemicals, mains electricity, choking/small parts, magnet ingestion,
sun/eye, glass, water depth, and plastic-bag/balloon suffocation.

- **81 experiments** contained a hazard keyword.
- **67** did not already carry an equivalent warning and received targeted,
  grade-appropriate safety guidance appended as a final **"Safety:"** step
  (generated in `tools/build-ehel-science-runtime.js` so it survives rebuilds).
- **14** already carried adequate warnings in the source text (e.g. the mould
  experiment's "do NOT open it again") and were correctly left unchanged.

Guidance is grade-gated — e.g. choking/small-parts warnings apply through Grade 4,
magnet-ingestion warnings through Grade 8. Sample outcomes:

| Hazard | Example unit | Guidance added |
|---|---|---|
| Magnet ingestion | g3u5 Magnetic or Not | "Magnets must never go in or near your mouth — swallowing magnets is a medical emergency." |
| Chemicals | g7u5 Acids and Alkalis | "Only test safe kitchen liquids… never touch or mix cleaning products like bleach, and never taste anything." |
| Electricity | g6u5 Conductors | "Use only a small 1.5 V battery. Never use plug sockets or mains electricity." |
| Sun/eye | g5u5 Sun Shadow | "Never look directly at the sun — it can damage your eyes." |
| Microbes | g7u7 Growing Mould | (source already sealed-bag safe; left unchanged) |

**Reviewer note for human sign-off:** the padded/template investigations (units
whose source lacked six experiments) should get the closest human read — the
source-derived experiments carry the workbook's own safety framing; the
generated ones now carry rule-based framing that a human should confirm.

### 1b. Science — concept titles and worked examples

- **78 concept cards across 14 units** previously carried the meaningless title
  "*Unit Title* — part N" (their source lessons have no per-concept headings, so
  the builder fell back). Concepts are now built from each unit's learning
  objectives (real teaching content), and all 14 units received **reviewer-authored
  concept titles** in curriculum order (e.g. Elements → What Is an Atom / Elements
  and Compounds / The Periodic Table / Groups and Their Properties / Metals and
  Non-Metals / Chemical Reactions). Course-wide: **0 generic titles, 0 thin
  explanations** remain (309 concepts).
- **11 units had junk worked examples** (prompt = unit title or dashes, solution =
  "Talk through your answer…"). Now: g5/g8 units draw authentic MCQ worked examples
  from their source practice (e.g. "Which part of a seed is the tiny baby plant? →
  embryo"); Grade 1 gets age-appropriate child-facing "Look around you, can you
  find an example of…" prompts. **0 junk / 0 parent-facing solutions** across all
  416 worked examples.
- Reference gaps closed earlier in validation: all Grade 1 units now carry
  authored misconceptions and connections; the Quick Reference page renders fully
  for every unit.

**Residual (verified acceptable):** 9 chemistry vocabulary entries with short
symbol meanings (Water | H₂O, Copper | Cu — correct), and 3 physics questions
whose stems necessarily name the answer term (law of reflection). Grade 1 concept
explanations remain parent/teacher-facing in tone (they are guide text) — flagged
for the human reviewer as a style item, not a correctness one.

---

## 2. Mathematics — question topic-fit and decimal coverage

Reviewed the topic classifier's assignment for all 133 units against unit
titles and concepts.

- **One genuine misfit:** the "Chance" unit (Grade 3) classified as *number*
  and was serving place-value questions instead of probability/data work.
  Cause: the classifier matched "probability" but not "chance". Added
  `chance | likel | certain | impossible | outcome` to the statistics rule (in
  both the generator and the visuals classifier, kept in sync). "Chance",
  "How Likely?" and "Pattern and Probability" units now serve data/statistics
  questions.
- **Decimal gap closed:** decimal/percentage units (Decimals, Percentages,
  Fractions-Decimals-Percentages) previously received only simple fraction-of
  questions. Added exact, integer-scaled templates — tenths addition
  (`0.6 + 0.4 = 1`, computed in tenths so never float-rounded),
  decimal↔fraction conversions (`0.25 = 1/4`), and percentage-of
  (`25% of 75 = 18.75`). All restricted to Stage 4+. Independently recomputed:
  381 decimal/percentage questions, 0 wrong.
- **Bug caught and fixed during review:** the new decimal-addition distractors
  could collide (`0.1 + 0.4` offering "0.4" twice), and `choiceMcq` — unlike
  `numericMcq` — did not de-duplicate options. Hardened `choiceMcq` to
  guarantee four distinct options; re-audit shows 0 broken questions across all
  1,596.

**Residual (verified acceptable):** 14 "placeholder" text flags are genuine
place-value vocabulary (the placeholder zero), not scaffolding. The standing
limitation remains that most maths questions are procedurally generated
(correct by construction, machine-verified) rather than drawn from the source
workbooks — the human reviewer should confirm topic *fit*, which this pass
checked at the classifier level.

## 3. English — cloze quality review

(pending — final review task.)

---

## 3. English — cloze quality review

(see section completed in the cloze-quality pass.)

---

## 4. Standing limitations carried into the pilot (not blockers, but disclosed)

- Progress (drafts, scores, XP) is stored per-device in the browser; no accounts
  or server-side save yet.
- Audio (ElevenLabs) and teacher-lecture video are pending for most units; the UI
  degrades gracefully to "pending" affordances.
- A portion of quiz content is procedurally generated (correct by construction,
  marked as auto-generated) and awaits human curriculum sign-off.
- Courses cover Stages 1–8; Cambridge Lower Secondary Stage 9 is not yet built.
- Public "Cambridge-aligned" wording pending confirmation of Cambridge school
  registration status.
