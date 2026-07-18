# Safe Assessment & Exam Tools for EduPlatform — Research and Integration Plan

**Date:** 2026-07-18
**Scope:** Assessment/exam tooling for the shared Moodle installation (DB `ehelacad_quraantest`, prefix `mdlgx_`) serving edufortomorrow.com (independent-teacher marketplace), uniso.site (Somali University portal), and quraantest.academy (children's Quraan Academy).
**Constraint honoured:** research only — no code was modified.

---

## 1. Starting position: the platform is already an exam engine

EduPlatform runs on Moodle (custom plugins declare `$plugin->requires = 2022041900`, i.e. Moodle 4.0+; production version is recorded as TBD in docs). That means a large amount of "safe exam" capability is already installed and licence-free:

- **Quiz engine + question bank** — 15+ core question types, question versioning, categories/subcategories, random question selection from categories, per-question and per-quiz shuffling.
- **Question behaviours** — deferred feedback (exam mode), interactive with multiple tries (practice mode), immediate feedback, CBM.
- **Quiz access rules (core, no plugin needed):** time limit + open/close windows, quiz password, **"Require network address"** (IP/subnet restriction), delays between attempts, **"Browser security: full-screen pop-up with some JavaScript security"**, and — since Moodle 3.9 — a **built-in Safe Exam Browser access rule** ("Require the use of Safe Exam Browser") with Config-Key and Browser-Exam-Key verification. The old `quizaccess_seb` contributed plugin is only needed on Moodle ≤3.8 — not here ([MoodleDocs: Safe Exam Browser](https://docs.moodle.org/501/en/Safe_Exam_Browser), [Moodle + SEB announcement](https://moodle.com/news/moodle-and-safe-exam-browser/)).
- **Gradebook**, quiz statistics/item-analysis reports, per-user overrides (extra time — important for accessibility and for young children).
- **H5P in core** (content bank + `mod_h5pactivity`, since 3.9) for interactive practice content.
- **BigBlueButton activity (`mod_bigbluebuttonbn`) in core since 4.0** — relevant because the platform already operates its own BBB at live.quraantest.academy.

**Implication:** for most needs the cost is configuration + UI integration work in `local_hubredirect`, not licence spend.

> Note: Moodle 4.5 is the current LTS and carries meaningful question-bank/quiz improvements (drag-and-drop question bank management, selective regrade); Moodle 5.x further reworks question banks ([Moodle 4.5 release notes](https://moodledev.io/general/releases/4.5), [Moodle 5.0 release notes](https://moodledev.io/general/releases/5.0)). Confirming and, if needed, upgrading the production version to 4.5 LTS is a prerequisite for the plugin versions recommended below.

---

## 2. Comparison table of viable options

| Option | Category | Licence | Cost | Moodle compat | Fit for EduPlatform |
|---|---|---|---|---|---|
| **Moodle Quiz + access rules (core)** | Native assessment | GPL (already deployed) | Free | n/a | Foundation for every audience |
| **Safe Exam Browser (SEB)** 3.10.1 Win / macOS / iOS | Lockdown browser | Mozilla Public License, freeware | Free | Built into Moodle ≥3.9 quiz settings | Institution formal exams (uniso.site); too heavy for children at home |
| **SEB Server** (optional) | SEB central config + live monitoring | Open source | Free (self-hosted ops cost) | Via SEB Server Moodle plugin | Only if uniso runs large supervised cohorts; defer |
| **Respondus LockDown Browser** | Lockdown browser | Commercial | ~$2,795/yr up to 2,000 FTE (HE tiers to $5,045/yr at 15k); separate K-12 pricing; Monitor (AI video) extra | LMS integration | Not recommended: cost duplicates free SEB; Respondus use was found GDPR-non-compliant by the Italian DPA (Bocconi case) |
| **`quizaccess_proctoring`** (Brain Station 23) | Webcam-snapshot proctoring | GPL, free (Pro face-matching API paid) | Free core | Latest release (Nov 2025) supports Moodle 4.3–5.0 | Optional for **adult** institution exams only; do not enable for minors |
| **`quizaccess_quizproctoring`** (ProctorLink) / **`quizaccess_quilgo`** / AutoProctor | Commercial AI proctoring via plugin | Commercial | Quilgo: concurrency-seat pricing (quote); ProctorLink/AutoProctor: per-use | 4.x plugins available | Not recommended for this platform's audiences |
| **Proctorio / Honorlock** | Commercial AI proctoring | Commercial | Proctorio ~$5/student/exam; Honorlock flat-rate per session (quote) | LTI/extension | Avoid — cost + severe privacy/safeguarding concerns, especially minors |
| **BBB live invigilation** (existing live.quraantest.academy) | Human proctoring | Open source (already run) | Marginal server load only | Core `mod_bigbluebuttonbn` + existing `local_hubredirect` live-session stack | **Best proctoring fit**: human, consent-gated, reuses existing audit/consent machinery |
| **H5P (core content bank)** | Interactive authoring | Core Moodle; H5P content types MIT | Free (self-hosted; h5p.com SaaS not needed) | Core ≥3.9 | Children's practice checks, formative content |
| **`qtype_stack`** (STACK) | Math CAS assessment | GPL | Free; needs Maxima (goemaxima Docker recommended) | Tested Moodle 4.0–4.5 | uniso.site STEM courses |
| **Wiris MathType + Wiris Quizzes** | Math authoring/assessment | Commercial | ~$0.60–$1.00 per student/yr, minimum 250 students | Moodle plugins available | Only if STACK authoring proves too steep; otherwise skip |
| **`quizaccess_wifiresilience`** | Connectivity resilience | GPL | Free | Older plugin — verify against production Moodle before install | High value for Somali connectivity conditions (deferred-feedback exams survive dropouts); pilot carefully |
| **Turnitin (`plagiarism_turnitin`)** | Plagiarism/AI-writing detection | Plugin GPL; service commercial | Institutional quote | Actively maintained | uniso.site essays/theses only |
| **Compilatio (`plagiarism_compilatio`)** | Plagiarism + AI detection | Plugin GPL; service commercial | Institutional quote (often cheaper than Turnitin in EU) | Maintained | Alternative to Turnitin; get both quotes |
| **Originality-style pay-per-use checkers** | Plagiarism | Commercial | ~$0.01/100 words | No first-party Moodle plugin | Fallback for occasional teacher use |

---

## 3. Recommendations by audience

### 3.1 uniso.site — institution formal exams (adults)
1. **Moodle Quiz in "exam configuration"**: deferred feedback, hard time limit, open/close window, quiz password, random questions drawn from vetted question-bank categories, one question per page + sequential navigation, shuffle within questions.
2. **Safe Exam Browser via the built-in quiz access rule** for high-stakes exams, using uploaded SEB config + Browser Exam Key. Free, open source, the de-facto Moodle standard. Start with "Yes – Configure manually" templates; move to uploaded config files per exam series.
3. **Proctoring = human invigilation over the existing BBB**, not AI: an invigilator-attended BBB room (webcams on, mics muted) scheduled alongside the quiz window, run through the same live-session machinery as classes. For on-campus computer labs, SEB + physical invigilation and the IP-restriction rule (campus subnet) is simpler and stronger than any remote proctoring.
4. Optional, adults only, with explicit notice/consent: `quizaccess_proctoring` webcam snapshots as a lightweight identity check. Treat it as an identity aid, not cheating detection.
5. **Plagiarism**: pilot Turnitin *and* Compilatio quotes for essay-based courses; enable the plagiarism plugin only in uniso course categories.
6. **STACK** for mathematics/engineering: algebraically-equivalent answer checking, randomized variants per student — a stronger integrity tool for math than any lockdown browser.

### 3.2 edufortomorrow.com — teacher-assigned quizzes (mixed ages)
1. Keep the existing homework flow (`teacher_homework.php`) as the assignment wrapper and let teachers attach **Moodle quizzes with a "standard quiz" template**: time limit, shuffling, question pools, interactive-with-multiple-tries or deferred feedback per teacher choice.
2. **No lockdown browser, no proctoring.** Marketplace stakes don't justify the friction, and many students are minors on family devices where SEB installation is unrealistic.
3. Integrity comes from design: per-student randomization from pools, time windows, item analysis in the quiz report page to spot compromised questions.
4. H5P for engaging formative work teachers can drop into homework.

### 3.3 quraantest.academy — children's practice checks (minors, managed accounts)
1. **Practice-first, surveillance-never**: H5P activities and Moodle quizzes in interactive/multiple-tries behaviour, generous or no time limits, unlimited attempts, immediate feedback. The existing `quiz_stt.php` / `quiz_tts.php` speech pages are the right child-friendly direction — extend, don't replace.
2. Where verification matters (e.g. Quraan recitation checks), the right "proctor" is the **teacher in a live BBB session** the child is already attending, under the existing `recording_consent_required` / parent-trust regime — never automated webcam capture.
3. Progress surfaces to parents via the existing parent-trust pages, following `live_parent_trust.php` visibility rules.

---

## 4. Phased integration plan

### Phase 0 — Prerequisites (no new code)
- Confirm production Moodle version (docs list it as TBD). Target **Moodle 4.5 LTS**; verify `local_hubredirect`/`local_prequran` against it in staging first.
- Inventory question banks; create per-tenant category trees (e.g. `UNISO/…`, `EFT/<workspace>/…`, `QT/…`) so random-question pools and sharing boundaries follow tenant lines — critical because one install serves all consumer domains.
- Define three site-blessed quiz presets (documented, later enforced in code): **Formal Exam**, **Standard Quiz**, **Practice Check** (settings per §3).

### Phase 1 — Moodle-core enablement (config only)
- Turn on quiz completion/grade push to gradebook consistently; set default per-tenant grade categories.
- Enable content bank + H5P for teachers; seed child-appropriate H5P templates (flashcards, drag-drop, dictation) for quraantest.
- For uniso pilots: exercise the built-in SEB access rule end-to-end on one low-stakes exam (Windows + macOS + iOS SEB 3.10.1; note 3.10.2 was retracted as faulty — pin 3.10.1 in student instructions).
- Configure "Require network address" for any lab-based exams.

### Phase 2 — Contributed plugins (staging → production)
Install order, with exact components:
1. **`qtype_stack`** (latest release; tested against Moodle 4.0–4.5) + Maxima via **goemaxima Docker** matched to the STACK version (Linux server requirement — matches the existing hosting). Scope: uniso STEM.
2. **`plagiarism_turnitin`** *or* **`plagiarism_compilatio`** (decision after quotes; both actively maintained for 4.x). Enable only for uniso assignment/workshop modules.
3. **`quizaccess_wifiresilience`** — pilot on staging first; it is an older plugin, so verify compatibility with the production Moodle version before any production install. If viable, it materially de-risks exams over unstable Somali connectivity (local-storage answer caching + resync).
4. *(Optional, adults only)* **`quizaccess_proctoring`** by Brain Station 23, latest version (Nov 2025 release supports Moodle 4.3–5.0; earlier line covers 4.0–4.5 — pick per production version). Free/GPL; do **not** purchase the Pro face-matching API (biometric processing, see §5). Restrict availability to uniso adult courses via capability config.
5. **No purchase** of Respondus, Proctorio, Honorlock, Quilgo, ProctorLink, or Wiris at this stage (Wiris only reconsidered if STACK authoring adoption fails; budget ~$0.60–1.00/student/yr, 250-student minimum).

### Phase 3 — `local_hubredirect` integration (build)
Follow existing patterns; every new exam event goes through the `pql_audit()`-style audit trail into `mdlgx_local_prequran_live_audit` (or a sibling `*_exam_audit` table mirroring its schema).

1. **Exam surfaces in dashboards** — add an "Assessments" card to `dashboard.php` / `workspace_dashboard.php` / `student_workplace.php` listing upcoming quizzes (query `mdlgx_quiz` + overrides for the user's enrolments), styled in the existing blue design system.
2. **Homework ↔ quiz linkage** — extend `homeworklib.php` so a homework item can reference a `cmid` of a quiz; `teacher_homework.php` gains a "attach quiz" selector (reusing the existing course/material selector patterns); `student_homework.php` deep-links into the attempt.
3. **Quiz report consolidation** — extend `quiz_report.php` (which already does role resolution via `pqqr_role()` and managed-student detection via `pqqr_is_managed_student()`) to include Moodle quiz attempts alongside Pre-Quraan quiz data, with the same teacher/parent visibility rules.
4. **Exam wizard for uniso** — a `live_create_wizard.php`-style flow that creates a quiz from the Formal Exam preset, optionally schedules a paired **BBB invigilation room** (reuse the `live_sessions.php` creation path with a `session_type = 'invigilation'` flag), and enforces the consent decision logic already implemented (`local_prequran_live_recording_consent_decision()`, audit action patterns like `recording_disabled_missing_consent`).
5. **Preset enforcement** — server-side check (event observer on `\mod_quiz\event\course_module_*` or a wizard-only creation path) so children's-tenant quizzes cannot be saved with SEB/proctoring/one-attempt-hard-deadline settings.
6. **Parent visibility** — surface practice-check results into the parent-trust views following `live_parent_trust.php` conventions (only "available/visible" statuses, managed-student gating).

### Phase 4 — Hardening & review
- Item-analysis routine per term (quiz statistics report) to retire leaked questions; rotate question pools.
- SEB config-key rotation per exam period for uniso.
- Data-retention job for any proctoring artefacts (snapshots auto-purged ≤30 days post-appeal window), mirrored on the existing `live_parent_trust_retention.php` / `live_parent_trust_purge_evidence.php` patterns.
- Annual DPIA-style review of any monitoring feature, logged in compliance docs alongside `compliance_governance.php` workflows.

---

## 5. Safeguarding guidance for assessing minors (explicit)

**Do not deploy for children:**
- **AI/automated proctoring** (Proctorio, Honorlock, ProctorLink AI, Respondus Monitor, quizaccess_proctoring Pro face matching). Automated behaviour/gaze analysis is profiling of children; regulators have already acted — the Italian DPA found Respondus use at Bocconi University violated the GDPR, and that was with *adult* students. For minors, GDPR Art. 8 (children's data), COPPA (<13, parental consent for data collection), and the UK/EU children's-code principles make biometric-style monitoring effectively indefensible for a practice-quiz use case. False-positive flags also cause disproportionate distress to children.
- **Webcam snapshot capture in the home** (even the free quizaccess_proctoring). It captures imagery of a child's bedroom/home and potentially other family members; storage of child images creates a safeguarding liability the platform does not need.
- **Lockdown browsers on family devices.** SEB requires installation and kiosk-locks a machine — inappropriate on shared family hardware and frightening for young users; a locked screen also blocks a parent from assisting a young child.
- **Recording invigilation sessions by default.** If a live check happens in BBB, recording stays behind the existing consent decision (`recording_consent_required`, parent-trust consent), exactly as live classes do today.

**Do instead:**
- Design out the need for surveillance: low-stakes, repeatable, randomized practice checks; mastery over gatekeeping.
- Where identity/verification genuinely matters, use a **known teacher in a live, consent-gated BBB session** — a human the child already knows, in a room the platform already audits (`mdlgx_local_prequran_live_audit`).
- Keep parents in the loop through the existing parent-trust surfaces; collect the minimum data (scores and attempt metadata, no media).
- Any future monitoring feature aimed at under-18s gets a documented DPIA, parental consent capture, retention limits, and an audit-trail entry per activation — the platform's existing consent/audit architecture is the template.

For **adults** (uniso), lightweight monitoring is acceptable with transparency: announce it in the exam description, show what is collected, retain artefacts briefly, and prefer human invigilation over automated flagging.

---

## 6. Cost summary (annual, indicative)

| Path | Cost |
|---|---|
| Recommended baseline (core Quiz, SEB, H5P, STACK, BBB invigilation, wifiresilience) | **$0 licence cost** (ops/dev time only) |
| Plagiarism service for uniso (Turnitin or Compilatio) | Institutional quote; budget placeholder $1–3 per enrolled uniso student/yr; pay-per-use fallback ~$0.01/100 words |
| Wiris (only if STACK fails adoption) | ~$0.60–1.00/student/yr, 250-student minimum (~$150–250/yr floor) |
| Rejected: Respondus LDB | $2,795+/yr — duplicated by free SEB |
| Rejected: Commercial AI proctoring | ~$5/student/exam (Proctorio-class) — cost + safeguarding risk |

---

## Sources

- [MoodleDocs — Safe Exam Browser](https://docs.moodle.org/501/en/Safe_Exam_Browser) · [SEB downloads](https://safeexambrowser.org/download_en.html) · [SEB about/licence](https://safeexambrowser.org/about_overview_en.html) · [SEB Server (GitHub)](https://github.com/SafeExamBrowser/seb-server) · [Moodle ↔ SEB announcement](https://moodle.com/news/moodle-and-safe-exam-browser/) · [quizaccess_seb (legacy, ≤3.8)](https://moodle.org/plugins/quizaccess_seb)
- [quizaccess_proctoring plugin](https://moodle.org/plugins/quizaccess_proctoring) · [versions](https://moodle.org/plugins/quizaccess_proctoring/versions) · [GitHub](https://github.com/eLearning-BS23/moodle-quizaccess_proctoring) · [Proctoring Pro](https://elearning23.com/moodle-proctoring-pro-details/)
- [ProctorLink (quizaccess_quizproctoring)](https://moodle.org/plugins/quizaccess_quizproctoring) · [Quilgo plugin](https://moodle.org/plugins/quizaccess_quilgo) · [Quilgo pricing](https://quilgo.com/pricing) · [AutoProctor](https://moodle.org/plugins/quizaccess_autoproctor) · [Proctoring tools price comparison](https://blog.autoproctor.co/top-10-proctoring-tools-ranked-compare-features-and-pricing/)
- [Respondus LockDown Browser HE pricing](https://web.respondus.com/he/lockdownbrowser/pricing/) · [K-12 pricing](https://web.respondus.com/k12/lockdownbrowser/pricing/)
- Proctoring privacy: [Digital Freedom Fund — automated proctoring threats (incl. Italian DPA/Bocconi ruling)](https://digitalfreedomfund.org/blog/automated-proctoring-software-a-threat-to-students-privacy-and-it-security/) · [GDPR/US-law landscape of proctoring](https://www.datenschutz-notizen.de/the-landscape-of-online-proctoring-and-the-intersection-of-gdpr-and-us-laws-5450527/) · [Open Praxis systematic review of proctoring systems](https://openpraxis.org/articles/10.55982/openpraxis.17.3.836)
- [qtype_stack plugin](https://moodle.org/plugins/qtype_stack) · [STACK installation docs (Maxima/goemaxima)](https://docs.stack-assessment.org/en/Installation/)
- [Wiris pricing](https://www.wiris.com/en/pricing/) · [Wiris for Moodle](https://www.wiris.com/en/solutions/education/moodle/) · [MoodleDocs — WIRIS](https://docs.moodle.org/502/en/WIRIS)
- [plagiarism_turnitin](https://moodle.org/plugins/plagiarism_turnitin) · [plagiarism_compilatio](https://moodle.org/plugins/plagiarism_compilatio) · [Moodle forum — lower-cost plagiarism options](https://moodle.org/mod/forum/discuss.php?d=452546)
- [Moodle 4.5 release notes](https://moodledev.io/general/releases/4.5) · [Moodle 5.0 release notes](https://moodledev.io/general/releases/5.0) · [MoodleDocs — H5P](https://docs.moodle.org/502/en/H5P) · [Quiz access rules directory](https://moodle.org/plugins/browse.php?list=category&id=41)
