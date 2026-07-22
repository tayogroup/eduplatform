# Ehel Academy Pilot — Sign-off Pack (P0.4 · P0.5 · P0.7)

**2026-07-22 · for the 1 Aug pilot.** The three human sign-offs that remain
before launch, packaged so each is a focused ~30–60 min review, plus the pilot
access plan. P0.6 (privacy & consent) is the separate parent-facing draft:
[pilot-privacy-consent.md](pilot-privacy-consent.md).

---

## P0.4 — Home-experiment safety sign-off (Science)

**What you are signing:** that the ~318 hands-on Science activities ("Experiments"
section, Stages 1–8) are safe for children to attempt at home, possibly
unsupervised.

**What's already done:** an AI-assisted safety review padded every activity with
appended safety guidance (adult-help flags, heat/sharp/chemical cautions,
substitutions). That review is advisory — a human owner must sign.

**Recommended 60-minute protocol:**
1. **Full read of the high-risk buckets** (not a sample): anything involving
   heat/flame, cutting tools, glass, chemicals/cleaning products, water
   immersion, small parts (choking, Stages 1–2), or going outdoors/unattended.
   Find them: search the science unit JSONs for the activity `materials` +
   `steps` fields (`src/prototypes/ehel-academy/science/grade-N/data/units/`),
   or review in-app via each unit's Experiments section.
2. **Spot-check 2 activities per grade** from the remaining low-risk pool
   (16 spot checks).
3. **For each reviewed item ask:** Is adult supervision flagged where needed?
   Are materials household-safe (no lab chemicals)? Is the safety line
   age-appropriate for that Stage? Is there a safe substitution where the
   material could be risky?
4. **Fix path:** edits go in the unit JSON → `node tools/upload-content-to-bunny.js`
   → live in ≤5 min. Flag anything you're unsure of and we pull or rewrite the
   activity before launch (removal is a 2-minute content edit).

**Sign-off:** ☐ I have reviewed the high-risk buckets in full and sampled the
rest; activities are safe for home use as presented, with the in-app guidance.
— Name / date: ______________

---

## P0.5 — Cambridge wording (legal/registration check)

**What you are signing:** the public claims the product makes about Cambridge.

**What the product currently says:** "Aligned to Cambridge Primary Mathematics
0096 — Stage N" (approval banners), "Cambridge-aligned {Subject} (code)" in
catalog summaries, framework codes 0058/0096/0097 (Primary) and 0861/0862/0893
(Lower Secondary), and "Stage" terminology throughout.

**Recommended posture (verify with counsel / Cambridge's trademark guidance):**
- **Keep**: descriptive alignment claims — "aligned to the Cambridge Primary
  Science (0097) curriculum framework" states a factual pedagogical mapping.
- **Avoid**: anything implying endorsement, partnership, certification or exam
  preparation: "Cambridge-certified", "official Cambridge", Cambridge logos or
  crest, "prepares for Cambridge Checkpoint" (unless separately true and
  cleared).
- **Add** one disclaimer line to the site footer and course overview pages:
  *"Ehel Academy is an independent programme aligned to Cambridge International
  curriculum frameworks. It is not affiliated with, endorsed by, or certified by
  Cambridge University Press & Assessment."*
- **Check** whether registration as a Cambridge International School is intended
  later; if so keep wording conservative now so nothing has to be retracted.

**Sign-off:** ☐ Wording reviewed (with counsel if required); disclaimer added.
— Name / date: ______________

---

## P0.7 — Pilot access plan

**What you are signing:** how the cohort gets in, and that the pilot's known
limitation is disclosed.

**Access (no accounts needed for the static pilot):**
- Preferred entry (once DNS is live): `https://app.ehelacademy.org/Ehel%20Primary/app/{subject}/grade-N/index.html`
- Working today: `https://ehelacademy.b-cdn.net/Ehel%20Primary/app/{subject}/grade-N/index.html`
  with `{subject}` ∈ `english | mathematics | science`, `grade-1 … grade-8`.
- Give each learner their three subject links for their grade (or one link to a
  simple links page per grade, which we can generate on request).

**Known limitation to disclose (include in the welcome message):** progress is
saved **on the device/browser** used. Same device + same browser each time;
clearing browser data clears progress; progress does not follow the learner
across devices. (The account-backed sync ships after the pilot — the
infrastructure is already built.)

**Recommended welcome message ingredients:** the three links, the one-device
note, "no login needed", sound-on recommendation for narration, and the
support/WhatsApp contact for problems.

**Sign-off:** ☐ Access plan confirmed; device limitation disclosed to
parents/learners. — Name / date: ______________
