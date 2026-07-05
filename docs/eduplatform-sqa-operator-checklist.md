# EduPlatform SQA Operator Checklist

Use this checklist when running the automated student journey harness locally, from a scheduled runner, or as part of a release verification window.

## Daily control check

Run the non-live controls first. These do not create students, invoices, transcripts, or payments.

```powershell
npm.cmd run test:e2e:phase11
npm.cmd run test:e2e:phase12
npm.cmd run test:e2e:phase13
```

Expected result:

- Phase 11 passes and writes JSON/Markdown reporting artifacts.
- Phase 12 passes and confirms guardrails.
- Phase 13 passes and confirms scripts, docs, env flags, and spec groups are packaged.

## Weekly full journey

Run the full live golden path only in the approved EduPlatform SQA workspace.

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
- class grade published,
- official transcript issued/downloaded/verified,
- manual payment recorded,
- invoice and student billing verified as paid.

## Weekly teacher journey

Before running teacher portal or full teacher checks, keep the live server copy of this fixture file in sync:

```text
src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php
```

Target Moodle path:

```text
local/hubredirect/sqa_teacher_portal_fixture.php
```

Run the full teacher golden path only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:teacher-phase5
```

Expected result:

- public teacher application submitted,
- teacher approved, created, and published to marketplace,
- classroom fixture created,
- teacher saves attendance, notes/homework, grade, and progress,
- generated teacher accounts and portal fixture records are archived in cleanup mode `archive`.

## Public course setup

Run this only when the public intake form has no selectable SQA course or capacity has run out.

```powershell
$env:EDUPLATFORM_ENABLE_PUBLIC_COURSE_CREATE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_PUBLIC_COURSE_LINK_MODE="create_new"
$env:EDUPLATFORM_PUBLIC_COURSE_CAPACITY="50"
$env:EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT="25.00"
$env:EDUPLATFORM_PUBLIC_COURSE_CURRENCY="USD"
npm.cmd run test:e2e:setup-public-course
```

## Evidence review

Open the Playwright report after every failed live run and after each weekly full journey.

```powershell
npx playwright show-report test-results\playwright-report
```

Review:

- `student-journey-summary` JSON,
- `student-journey-manifest` Markdown,
- `teacher-journey-summary` JSON for teacher runs,
- `teacher-journey-manifest` Markdown for teacher runs,
- screenshots attached to the failed or final stage,
- video/error context when a run fails.

## Failure triage

Use this order:

1. Check whether Phase 12 still passes.
2. Check whether a public SQA course is selectable; rerun public course setup if needed.
3. Open the Playwright report and identify the first failed stage in `student-journey-manifest`.
4. If the failure is in transcript or payment, do not delete generated invoices, receipts, payments, or issued transcripts.
5. Re-run only the affected phase first, then rerun Phase 10 once the phase passes.

Common phase commands:

```powershell
npm.cmd run test:e2e:phase7
npm.cmd run test:e2e:phase8
npm.cmd run test:e2e:phase9
npm.cmd run test:e2e:phase10
npm.cmd run test:e2e:phase11
npm.cmd run test:e2e:phase12
npm.cmd run test:e2e:teacher-phase3
npm.cmd run test:e2e:teacher-phase4
npm.cmd run test:e2e:teacher-phase5
```

## Scheduled runner notes

For CI or Windows Task Scheduler:

- Store EduPlatform credentials as secrets or machine-level protected variables.
- Keep `EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY=true` only in the approved SQA runner.
- Upload or retain `test-results` after every run.
- Use `EDUPLATFORM_CLEANUP_MODE=archive` by default.
- Treat paid invoices, payments, receipts, and issued transcripts as retained audit artifacts.
- Keep `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live Moodle server before teacher portal checks.
