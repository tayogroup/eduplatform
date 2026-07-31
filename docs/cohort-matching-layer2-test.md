# Layer 2 test plan — cross-timezone cohorts on Ehel K-12

Manual click-through that proves the Moodle wiring around the matching engine.
The engine itself is covered by automated tests; run those first, they take
seconds and rule out the algorithm entirely:

```bash
php tools/test-availabilitylib.php      # 26 checks, unit level
php tools/test-cohort-scenario.php      # 35 checks, full pipeline
```

Layer 2 only answers what those cannot: **do the forms save what you tick, does
the proposal screen render it, and does Approve create real groups and
sessions?**

Environment: `https://k-12.ehelacademy.org/local/hubredirect/…?consumer=ehel-k12&workspaceid=23`,
logged in as an admin. Server docroot is `/home/ehelacad/quraantest.academy`.

Everything created here is disposable — see **Teardown** at the end. Prefix
every test account with `QA-` so it is unmistakable and easy to find later.

---

## Expected outcome (decide this before you start)

Ten students split into two cohorts by time zone, each matched to the teacher
whose shift can actually reach them, one student left unplaced with a stated
reason:

| | Students | Teacher | Shift | Session slots (UTC) |
|---|---|---|---|---|
| Cohort 1 | QA-S01..S05 (Nairobi) | QA Teacher A | Shift 1 | Mon/Tue/Wed 13:00 |
| Cohort 2 | QA-S06..S09 (New York) | QA Teacher B | Shift 2 | Mon/Tue/Wed 21:00 |
| Unplaced | QA-S10 | — | — | "no availability recorded" |

Each teacher shows ~15h of overlap with their cohort. Anything else is a
finding — record what you saw and stop rather than adjusting to fit.

---

## Step 1 — Two teachers

Teacher intake → create each, then set availability and shift.

**QA Teacher A**
- Time zone: `Africa/Nairobi`
- Availability grid: **Mon–Fri, 10:00 – 19:00**
- Teaching shift: **Shift 1 (10:00–20:00 EAT)**
- Expect after save: ~45h/week effective

**QA Teacher B**
- Time zone: `America/New_York`
- Availability grid: **Mon–Fri, 17:00 – 20:00**
- Teaching shift: **Shift 2 (20:00–06:00 EAT)**
- Expect after save: ~15h/week effective

> A New York teacher working 17:00–20:00 local is 21:00–00:00 UTC, which sits
> inside Shift 2. This matters: a *Nairobi* teacher on Shift 2 would need hours
> **after midnight** (00:00–03:00 EAT) to reach New York evenings — 20:00–24:00
> EAT gives zero overlap. Confirmed by `tools/test-cohort-scenario.php`.

**Check:** reopen each teacher's profile. The grid and the shift must come back
exactly as entered. If the grid is empty on reload, stop — availability is not
persisting and nothing downstream can work.

## Step 2 — Ten students

Student Intake → create ten, ticking the weekly grid on each. The grids are
identical within each group, so this is faster than it looks.

| Accounts | Time zone | Grid to tick |
|---|---|---|
| QA-S01 … QA-S05 | `Africa/Nairobi` | Mon–Fri **16:00 – 19:00** |
| QA-S06 … QA-S09 | `America/New_York` | Mon–Fri **17:00 – 20:00** |
| QA-S10 | any | **tick nothing** — deliberately blank |

**Check:** reopen QA-S01 in Student Intake — the grid must come back ticked.
This is the fix made this session (admin-created students previously stored no
structured availability at all), so it is the single most important assertion
in Layer 2. Optional SQL confirmation:

```sql
SELECT userid, availability_json
FROM mdlgx_local_prequran_student_profile
WHERE availability_json <> '' ORDER BY id DESC LIMIT 12;
```

## Step 3 — One offering

Course Offerings → Create Offering on any real K-12 course:

- **Live sessions per week:** `3`
- **Session length (minutes):** `60`
- Seats: `20`, status **published**, with a start date and an end date

Then file enrolment requests for all ten QA students against this offering.

**Check:** the two session fields save and reload. If they are missing from the
form, `course_offerings.php` did not deploy.

## Step 4 — Cohort proposals (the main event)

Live Grouping → **Cohort Proposals** → select the offering.

Compare against the table at the top of this document. Specifically:

- [ ] Exactly **two** cohorts proposed
- [ ] Cohort membership is region-pure — no Nairobi student in the NY cohort
- [ ] Cohort 1 recommends **QA Teacher A**, cohort 2 recommends **QA Teacher B**
- [ ] Each shows roughly **15h** overlap and three slots on **distinct days**
- [ ] **QA-S10** appears under *Not placed* with "no availability recorded"

Wrong teacher on a cohort, or a mixed cohort, is a real finding. Both cohorts
empty usually means the enrolment requests did not attach to the offering.

## Step 5 — Approve

Approve **cohort 1**. Then verify what was created:

- [ ] A class group exists, linked to the offering (not a loose group)
- [ ] Its members are exactly QA-S01…S05
- [ ] Live sessions were created across the offering's date range
- [ ] Session times are sane in the teacher's local clock
- [ ] Teacher and all five students appear as participants

```sql
SELECT id, name, offeringid, teacherid FROM mdlgx_local_prequran_class_group
ORDER BY id DESC LIMIT 5;

SELECT COUNT(*) AS sessions, MIN(FROM_UNIXTIME(scheduled_start)) AS first,
       MAX(FROM_UNIXTIME(scheduled_start)) AS last
FROM mdlgx_local_prequran_live_session WHERE teacherid = <QA Teacher A id>;
```

Then approve **cohort 2** and repeat for QA Teacher B.

## Step 6 — The guards

These prove the conflict logic added this session actually fires.

- [ ] **Re-run proposals** for the same offering → the nine placed students must
      NOT reappear. Only QA-S10 remains listed.
- [ ] **Double-booking:** manually create a session for QA Teacher A that
      overlaps one of their cohort sessions → must be blocked or require an
      override reason.
- [ ] **Shift enforcement:** manually create a session for QA Teacher B at
      09:00 EAT (outside Shift 2) → must flag an availability conflict. This is
      the timezone-correct check that replaced a broken server-local comparison,
      so it is worth doing explicitly.
- [ ] **Join window** unchanged: open one session and confirm the join button
      behaves as before (regression check on untouched code).

## Step 7 — Regression sweep

Quick loads, watching for errors rather than doing full journeys:

- [ ] Parent dashboard shows a linked child's enrolled courses
- [ ] Catalog does not offer enrolment for an already-enrolled course
- [ ] Syllabus course list shows K-12 courses only (no Pre-Quraan leakage)
- [ ] Course Inventory counts courses for this institution
- [ ] Workspace Requests queue renders
- [ ] How To → *Cross-Timezone Cohorts & Live Scheduling* opens

---

## Teardown

Reverse order: delete the generated live sessions, then the class groups, then
the enrolment requests, then the offering, then the ten students and two
teachers. The `QA-` prefix makes each set easy to identify. Confirm no `QA-`
accounts remain before finishing.

## Recording results

For each failure capture: the page, the exact error text, and what you expected
versus what appeared. A blank page or `Call to undefined function` almost always
means a file in the batch did not reach `/home/ehelacad/quraantest.academy` —
note which page and the missing dependency can be identified from the name.
