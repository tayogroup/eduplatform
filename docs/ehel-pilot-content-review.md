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

---

## 2. Mathematics — question topic-fit and decimal coverage

(see section completed in the topic-fit pass — generated questions checked
against unit topic; decimal units supplemented.)

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
