# Ehel K-12 Controlled Testing Guide

How to stand up a disposable batch of test students/teachers for Ehel K-12
School, exercise the platform end-to-end (accounts, dashboards, grouping,
role-portal domains), and fully tear it down afterward without touching any
real data.

This process is safe by construction: every account created is tagged with
the `ehelk12-qa-` username prefix, and both scripts refuse to touch anything
that doesn't match it. Nothing here can create, modify, or delete a real
account.

---

## 0. Prerequisites

- SSH/terminal access to the server (cPanel → **Terminal**, or an SSH
  client). This is different from phpMyAdmin — these are PHP scripts run
  via the command line, not raw SQL.
- Confirm you're targeting the right Moodle install before running anything.
  This server hosts multiple Moodle installs side by side; the one that
  matches Ehel Academy's live database is `ehelacad_quraantest`:

  ```bash
  grep dbname /home/ehelacad/quraantest.academy/config.php
  # $CFG->dbname   = 'ehelacad_quraantest';   <- this is the right one
  ```

- Any code changes (including the two scripts this guide uses) must already
  be deployed to that server directory. This repo is not git-cloned on the
  server, so deployment happens through whatever manual/upload process is
  already in use outside of this guide -- confirm with whoever manages that
  before assuming a new script is present.

---

## 1. Create the QA test accounts

```bash
cd /home/ehelacad/quraantest.academy
php local/prequran/cli/create_ehel_k12_qa_accounts.php --dry-run
```

Review the output -- it should list 30 students (`ehelk12-qa-student01`
through `student30`) and 3 teachers (`ehelk12-qa-teacher01` through
`teacher03`) as "would create," scoped to workspace #23 (Ehel K-12 School).
If that looks right:

```bash
php local/prequran/cli/create_ehel_k12_qa_accounts.php
```

This creates, per account: the Moodle login (via Moodle's own
`user_create_user()` -- correct password hashing, not raw SQL), an active
`local_prequran_workspace_member` row (so the account has a real
student/teacher role in workspace 23), and a `local_prequran_student_profile`
/ `local_prequran_teacher_profile` row (so dashboards render properly).

The script prints every created `userid` and the shared password
(`EhelK12Qa#2026` by default) at the end -- save that output, you'll need
the userids for cleanup later if you ever need to target a subset directly.

Options:

| Flag | Purpose |
|---|---|
| `--dry-run` | Report only, change nothing |
| `--password=` | Override the default account password |
| `--students=` | How many test students to create (default 30) |
| `--teachers=` | How many test teachers to create (default 3) |

Re-running the script is safe -- existing accounts are left alone (their
workspace-membership and profile rows are just re-confirmed as active, not
duplicated).

### Known landmine: `course_type` defaults to "Pre-Quraan"

`local_prequran_student_profile.course_type` has a database-level default of
`'pre_quraan'` (a leftover from before this platform supported non-Quran
curricula). Any student profile insert that doesn't explicitly set this
field will silently show a "Pre-Quraan" course card on that student's
dashboard, unrelated to any real enrollment.

The create script already sets `course_type = ''` explicitly, so accounts
created with the *current* version of the script won't hit this. If you're
troubleshooting a batch created before that fix, or a real student profile
was inserted by some other path without setting `course_type`, correct it
directly:

```sql
UPDATE mdlgx_local_prequran_student_profile
SET course_type = '', timemodified = UNIX_TIMESTAMP()
WHERE userid BETWEEN <first_new_userid> AND <last_new_userid>;

-- confirm:
SELECT userid, student_display_name, course_type
FROM mdlgx_local_prequran_student_profile
WHERE userid BETWEEN <first_new_userid> AND <last_new_userid>;
```

Use the userid range the create script printed for your batch. This is a
platform-wide schema quirk, not specific to test accounts -- worth keeping in
mind if this pattern (course showing up with no real enrollment) ever
surfaces for a real student.

---

## 2. Set teachers up before touching students

This isn't just a convention -- the platform's own "Student grouping" tool
(`live_grouping.php`, linked from the workspace dashboard) is built to match
a student's intake criteria **against an existing pool of teacher
profiles**: it ranks teachers by timezone, language, placement level,
availability, and capacity (`max_students_per_class`, `max_weekly_hours`).
If no teacher profiles exist yet for the workspace, the tool has nothing to
recommend -- the UI will show "No active teacher profiles found."

Practical order:

1. Teacher accounts + profiles exist first (already true after step 1 --
   the 3 QA teachers were created with active profiles).
2. Student accounts + profiles come in next (also already true).
3. Use the grouping tool to match/assign students to teachers -- this is
   what actually creates the `local_prequran_teacher_student` link; it's
   derived from the match, not from enrollment order.

---

## 3. Verify the platform end-to-end

Log in as a few of the test accounts and confirm:

- **Student** (`ehelk12-qa-student01` / `EhelK12Qa#2026`) lands on
  `dashboard.php` via `role_redirect.php`, with no course card unless you've
  since matched/enrolled them into one.
- **Teacher** (`ehelk12-qa-teacher01` / same password) lands on
  `teacher_workspace.php`.
- **Student grouping** (`live_grouping.php`, reachable from the workspace
  dashboard as a manager/admin) shows all 3 QA teachers as ranked options
  when you pull up one of the QA students for placement.
- **Role-portal subdomains will *not* redirect yet** -- K-12's
  `students.`/`teachers.`/`parents.`/`admins.`/`finance.k-12.ehelacademy.org`
  rows exist but are `status = 'pending'` until DNS + AutoSSL are actually
  set up for them (see `docs/eduplatform-admin-runbook.md`, "Add Role-Portal
  Subdomains For A School"). Logging in should keep you on
  `k-12.ehelacademy.org` until that's done -- that's expected, not a bug.
  Re-test with these same accounts once those subdomains go active.
- If you want to exercise the **finance** role too, note none of the 33
  QA accounts got it by default (only `student`/`teacher`) -- create a
  `local_prequran_workspace_member` row with `workspace_role = 'finance'`
  for one of the test teacher accounts if you need to test that path.

---

## 4. Tear everything down when you're done

```bash
php local/prequran/cli/delete_ehel_k12_qa_accounts.php
```

This defaults to a dry run (the opposite of most other scripts in this
repo, deliberately, because its blast radius is larger) -- it reports every
table and row count it *would* delete: workspace membership, profiles,
course enrolments, grades, invoices/payments, communications, consent,
live-session/attendance, referrals, everything keyed by these specific
userids. Review the counts, then:

```bash
php local/prequran/cli/delete_ehel_k12_qa_accounts.php --dry-run=0
```

It deletes plugin-table rows first, then the Moodle accounts last (via
`delete_user()`, never raw SQL against `mdl_user`). It only ever touches
rows where a QA account is the *subject* of the row (`studentid`/
`teacherid`/etc.), never rows where a QA account merely acted as
creator/approver on something else -- so it can't reach into real data even
if a QA account touched something during testing.

---

## Quick reference

| Task | Command |
|---|---|
| Confirm the right Moodle install | `grep dbname /home/ehelacad/quraantest.academy/config.php` |
| Preview account creation | `php local/prequran/cli/create_ehel_k12_qa_accounts.php --dry-run` |
| Create accounts | `php local/prequran/cli/create_ehel_k12_qa_accounts.php` |
| Preview full teardown | `php local/prequran/cli/delete_ehel_k12_qa_accounts.php` |
| Actually tear down | `php local/prequran/cli/delete_ehel_k12_qa_accounts.php --dry-run=0` |

Scripts live in `src/moodle/local_prequran/cli/`. Both require the same
deployment step as any other code change before they'll run on the server.
