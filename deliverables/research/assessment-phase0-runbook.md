# Assessment Plan — Phase 0/1 Runbook (executable steps)

**Date started:** 2026-07-19 · **Owner:** platform admin
**Source plan:** `safe-assessment-exam-tools.md` §4 (Phases 0–1)
**Fact from code:** `local_prequran/version.php` requires ≥ Moodle 4.0 (2022041900), so production is 4.0+.

---

## Step 0.1 — Confirm the exact Moodle version  ⬅ DO THIS FIRST

Run in phpMyAdmin (ehelacad_quraantest):

```sql
SELECT name, value FROM mdlgx_config WHERE name IN ('release', 'version', 'branch');
```

Interpretation:
- **4.5.x** → proceed as planned; every recommended plugin fits.
- **4.1–4.4** → still fine for Phase 0/1 and SEB (built in since 3.9). Note it for Phase 2: pick the `quizaccess_proctoring` line matching the branch, and plan the 4.5 LTS upgrade before end of support.
- **4.0** → works, but schedule the upgrade sooner; 4.0 is out of support.

Paste the `release` value back into this file next to: **Production release = ____**

## Step 0.2 — Per-tenant question bank trees

One Moodle serves all tenants, so question categories must encode tenant boundaries. Create **course-category-level** question categories (shareable within the tenant, invisible across):

1. Site administration → Courses → Manage courses and categories — confirm each tenant's courses sit under their own course category (Somali University courses under one category, etc.). If they don't, create categories `UNISO`, `EFT`, `QT` and move courses in (safe, reversible).
2. For each tenant category: open any course in it → Question bank → Categories → add, at the **category context**:
   - `UNISO / Year 1 / <course shortname>` (one child per course: su-eng101, su-math101, su-ict101, su-arb101, su-econ101)
   - `EFT / Shared practice`
   - `QT / Practice checks`
3. Rule to teachers: **questions go in the tenant tree, never "Default for …"** — random-question pools and future sharing follow these lines.

## Step 0.3 — The three quiz presets (documented; enforced in code at Phase 3)

### Preset A — Formal Exam (uniso adults only)
| Setting | Value |
|---|---|
| Timing | open/close window ± 15 min; time limit set; "open attempts submitted automatically" |
| Grade | category: Exams; attempts allowed: **1** |
| Layout | New page every question; navigation **Sequential** |
| Question behaviour | Deferred feedback; **shuffle within questions: Yes** |
| Review options | During/immediately/later-while-open: **nothing except "Attempts"**; after close: marks + overall feedback |
| Extra restrictions | **Require Safe Exam Browser: "Yes – Configure manually"** (Phase 1 pilot) · quiz password set · "Require network address" only for lab sittings |
| Question source | random questions drawn from the course's UNISO pool |
| Invigilation | paired BBB room (Phase 3 wizard; manual scheduling until then) |

### Preset B — Standard Quiz (EFT teacher-assigned, mixed ages)
| Setting | Value |
|---|---|
| Timing | open window ~1 week; optional generous time limit |
| Attempts | 2–3; grading method: highest |
| Layout/behaviour | shuffle questions + within questions; **Interactive with multiple tries** or deferred, teacher's choice |
| Review | immediate feedback after attempt; no lockdown, **no proctoring ever** |
| Question source | teacher's own pool under EFT tree |

### Preset C — Practice Check (quraantest children)
| Setting | Value |
|---|---|
| Attempts | **Unlimited**; grading: highest; no time limit, or a soft one |
| Behaviour | **Interactive with multiple tries** with hints; immediate feedback |
| Review | everything visible; positive feedback text |
| Restrictions | **none** — no SEB, no passwords, no proctoring, no webcam anything (see plan §5) |
| Verification | only a known teacher in a consent-gated BBB session |

## Phase 1 — Core enablement (config only)

1. **Completion + gradebook:** Site administration → Advanced features → confirm `enablecompletion` on. Per tenant course: completion tracking on; quiz activities get "receive a grade" conditions. Create grade categories `Exams` / `Quizzes` / `Practice` in each Year-1 course.
2. **H5P / content bank:** confirm `mod_h5pactivity` enabled (core since 3.9). Seed the QT tenant's content bank with 3 templates: Flashcards (letters), Drag-and-drop (words→pictures), Dictation (uses existing audio assets). Teachers copy from content bank into lessons.
3. **SEB pilot (uniso, one low-stakes exam):**
   1. Create quiz "SEB pilot — Academic English I practice exam" in su-eng101 from Preset A but worth 0%.
   2. Extra restrictions → Require Safe Exam Browser → **Yes – Configure manually**; enable "Show Exit Safe Exam Browser button" with a quit password; download config for students is automatic from the quiz page.
   3. Student instructions (publish on uniso): install **SEB 3.10.1** exactly (3.10.2 was retracted as faulty) — Windows/macOS installers from safeexambrowser.org; iPads use the built-in iOS SEB.
   4. Run 3–5 volunteer students + one invigilating teacher in a normal BBB room (existing live-session flow) — this rehearses the Phase 3 pairing manually.
   5. Log outcomes (join failures, platform mix, connectivity drops) at the bottom of this file — this decides whether `quizaccess_wifiresilience` (Phase 2 item 3) is prioritized.
4. **Lab exams only:** note lab IP ranges now; "Require network address" goes into Preset A per sitting.

## Verification checklist (end of Phase 1)
- [ ] Production release recorded in Step 0.1
- [ ] Tenant question categories exist; ≥ 5 questions in one UNISO course pool
- [ ] Three presets saved as admin documentation and linked from teacher onboarding
- [ ] SEB pilot exam completed by ≥ 3 students; outcomes logged below
- [ ] H5P templates in QT content bank; one child completed one as a practice check
- [ ] Decision recorded: proceed to Phase 2 plugin installs (staging first)

## Pilot log
| Date | Student platform | Result | Notes |
|---|---|---|---|
|  |  |  |  |
