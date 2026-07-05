# EduPlatform SQA Phase 11 Runbook

Phase 11 makes the student journey harness usable as an operator-run or scheduled SQA check. It does not delete production-like records. It records cleanup disposition so generated records can be reviewed, archived, or retained according to finance and transcript audit rules.

## Local Reporting Smoke

```powershell
npm.cmd run test:e2e:phase11
npm.cmd run test:e2e:phase12
npm.cmd run test:e2e:phase13
```

Expected result:

- one passing reporting-readiness test,
- four passing negative/control tests,
- one passing package verification,
- `student-journey-summary.json` attached to the Playwright report,
- `student-journey-manifest.md` attached to the Playwright report,
- cleanup disposition recorded for generated accounts and audit-retained records.

## Full Golden Path

```powershell
$env:EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY="true"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_COMPLETION_SCORE_PERCENT="95"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:phase10
```

Expected result:

- public intake submitted,
- student account created,
- enrollment requested and approved,
- invoice issued,
- grade published,
- official transcript issued/downloaded/verified,
- manual payment recorded,
- invoice and student billing verified as paid,
- manifest lists all important IDs and cleanup decisions.

## Teacher Journey Commands

Keep this fixture endpoint deployed before running teacher portal or full teacher checks:

```text
src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php
```

Copy it to the live Moodle path:

```text
local/hubredirect/sqa_teacher_portal_fixture.php
```

Run local teacher reporting and guard checks:

```powershell
npm.cmd run test:e2e:teacher-phase4
npm.cmd run test:e2e:teacher-controls
npm.cmd run test:e2e:phase13
```

Run the full teacher golden path only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:teacher-phase5
```

Expected teacher result:

- public teacher application submitted,
- application approved and teacher intake opened,
- teacher Moodle account/profile created and marketplace-visible,
- portal classroom fixture created,
- teacher logs in and saves attendance, notes/homework, grade, and progress,
- generated teacher/student accounts and portal fixture records are archived when cleanup mode is `archive`,
- manifest lists teacher IDs, fixture IDs, stages, screenshots, and cleanup decisions.

## Cleanup Policy

Use `EDUPLATFORM_CLEANUP_MODE=archive` by default.

- Generated student/enrollment records should be archived or tagged after evidence review.
- Generated teacher accounts, teacher profiles, workspace memberships, teacher-student assignments, SQA sessions, participants, and SQA assessments are archived by `sqa_teacher_portal_fixture.php` when teacher cleanup runs in archive mode.
- Paid invoices, payments, receipts, finance audit records, and issued transcripts must be retained.
- `delete` mode is reported as blocked for paid/issued audit artifacts and teacher portal evidence; use archive mode for generated teacher records.
- `none` mode records that cleanup is skipped.

## Report Review

After a run, open:

```powershell
npx playwright show-report test-results\playwright-report
```

Review the attached artifacts:

- `student-journey-summary`: machine-readable JSON for CI and audits.
- `student-journey-manifest`: human-readable run record with verdict, IDs, stages, cleanup actions, and artifact paths.

## Operator Checklist

Use the concise operator checklist for daily, weekly, and failure-triage commands:

```text
docs/eduplatform-sqa-operator-checklist.md
```
