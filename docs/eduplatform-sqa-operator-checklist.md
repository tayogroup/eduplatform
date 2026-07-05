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

## Weekly parent journey

Run the parent journey only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:parent-phase1
```

For the paid parent evidence path:

```powershell
$env:EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:parent-phase2
```

Expected result:

- linked parent/student accounts are created through admissions,
- parent accounts are validated through a real login,
- parent logs in successfully,
- parent workspace shows the linked student,
- parent billing and student-parent portal show the invoice,
- phase 2 shows paid invoice and receipt evidence.

## Weekly admin operations

Run the read-only admin/workspace dashboard smoke only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase1
```

Expected result:

- admin logs in successfully,
- workspace dashboard shows core operations links,
- admin can load people, course offerings, invoices, and intake queues,
- `admin-operations-summary` JSON and `admin-operations-manifest` Markdown are attached to the Playwright report.

For Admissions Operations:

```powershell
$env:EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase2
```

Expected result:

- public intake queue is visible,
- generated requests can be found by search and grouped by status,
- one request is rejected and one is approved/loaded to Student Intake,
- status changes and audit evidence are attached to the admin operations report.

For Course Offering Operations:

```powershell
$env:EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase3
```

Expected result:

- a course offering is created, updated, published, and archived,
- capacity and visibility changes are verified,
- a generated enrollment request appears in the queue,
- admin rejects the request and audit evidence is verified.

For Finance Operations:

```powershell
$env:EDUPLATFORM_ENABLE_FINANCE_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase4
```

Expected result:

- finance dashboard and payment policy pages load,
- generated student invoice is issued,
- manual payment produces receipt evidence,
- invoice status becomes paid with zero balance,
- parent billing visibility policy exposes the paid invoice and receipt.

For Reporting/Audit Operations:

```powershell
$env:EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase5
```

Expected result:

- managed reports load for seat utilization, Moodle sync, and student course history,
- finance audit loads with audit filters,
- transcript readiness and policy pages load,
- transcript readiness CSV and governance audit CSV download successfully.

## Weekly support communications

Run Support/Communications only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:support-phase1
```

Expected result:

- student/parent and teacher fixtures are created through the normal intake paths,
- Communications Center creates parent-teacher messages, a support follow-up case, consent, template, announcement, and delivery log evidence,
- teacher login confirms the parent-teacher message thread is visible,
- Support Inbox, Support Reports, Support Audit Review, and Notification Branding Diagnostics load,
- Support Reports CSV downloads successfully,
- `support-communications-summary` JSON and `support-communications-manifest` Markdown are attached to the Playwright report.

## Weekly academic quality

Run Course Content Visibility only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_PUBLIC_COURSE_LINK_MODE="create_new"
$env:EDUPLATFORM_PUBLIC_COURSE_CAPACITY="20"
$env:EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT="0.00"
$env:EDUPLATFORM_PUBLIC_COURSE_CURRENCY="USD"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase1
```

Expected result:

- admin creates or selects a published academic course offering,
- generated student and teacher accounts are created through intake,
- student-visible, teacher-only, and archived/unpublished materials are created,
- the generated student sees only the assigned student material,
- the generated teacher sees the appropriate workspace material and not archived content,
- generated materials and offering are archived when `EDUPLATFORM_CLEANUP_MODE=archive`,
- `academic-quality-summary` JSON and `academic-quality-manifest` Markdown are attached to the Playwright report.

Run Assignment/Resource Lifecycle only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_PUBLIC_COURSE_LINK_MODE="create_new"
$env:EDUPLATFORM_PUBLIC_COURSE_CAPACITY="20"
$env:EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT="0.00"
$env:EDUPLATFORM_PUBLIC_COURSE_CURRENCY="USD"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase2
```

Expected assignment/resource lifecycle result:

- admin publishes and assigns a student-visible resource,
- the generated student completes the resource,
- teacher view confirms the completed assignment evidence,
- academic/admin review marks the assignment reviewed,
- parent workspace and admin materials evidence both show reviewed status,
- generated resource and offering are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

Run Gradebook Consistency only in the approved EduPlatform SQA workspace.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_COMPLETION_SCORE_PERCENT="95"
$env:EDUPLATFORM_PUBLIC_COURSE_LINK_MODE="create_new"
$env:EDUPLATFORM_PUBLIC_COURSE_CAPACITY="20"
$env:EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT="0.00"
$env:EDUPLATFORM_PUBLIC_COURSE_CURRENCY="USD"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase3
```

Expected gradebook consistency result:

- admin publishes an assignment grade for the generated student,
- teacher view confirms the published grade,
- student and parent portal views show the allowed published grade/progress,
- admin transcript preview reflects the same final score,
- generated offering is archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

Run Attendance And Progress Audit only in the approved EduPlatform SQA workspace. Keep `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase4
```

Expected attendance and progress audit result:

- teacher records attendance, notes/homework, and progress,
- admin attendance operations and workspace reports show audit evidence,
- generated student sees allowed attendance/progress evidence,
- generated parent sees parent-visible attendance, homework, and progress evidence,
- generated teacher/student/parent fixture accounts are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

Run Academic Quality Controls only in the approved EduPlatform SQA workspace. Keep `src/moodle/local_hubredirect/academic_quality_controls.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase5
```

Expected academic quality controls result:

- admin quality controls show missing grade detection for the generated student,
- admin quality controls show incomplete attendance detection for the generated session,
- teacher records a low score and needs-support progress alert,
- admin quality controls show low-score/progress alert evidence,
- academic quality controls CSV downloads successfully,
- generated teacher/student/parent fixture accounts are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

## Security access control

Run this only in the approved SQA workspace. It creates two teacher/student/parent fixture sets to verify role boundaries and direct URL denial.

```powershell
$env:EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:security-phase1
```

Expected security access result:

- Role boundary checks prove students cannot access teacher/admin pages,
- Role boundary checks prove parents only see linked children,
- Role boundary checks prove teachers only see assigned classes/students,
- Direct URL permission checks block wrong-role access to protected admin, parent, teacher, and student routes,
- Session expiry/login redirect sends logged-out protected URLs to login,
- `security-access-summary` and `security-access-manifest` are attached,
- generated teacher/student/parent fixture accounts are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

## Notifications delivery

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/notification_delivery_audit.php` and `src/moodle/local_hubredirect/teacher_portal.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:notifications-phase1
```

Expected notifications delivery result:

- parent-teacher messages and announcements generate communications evidence,
- invoices generate finance notification delivery and audit evidence,
- attendance, grades, and low-score alerts generate parent notification audit evidence,
- notification center, email delivery, and log evidence are visible in the audit page,
- `notifications-delivery-summary` and `notifications-delivery-manifest` are attached,
- notification delivery CSV downloads successfully,
- generated teacher/student/parent fixture accounts are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

## Data export compliance

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/data_export_compliance.php` and `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:compliance-phase1
```

Expected data export compliance result:

- student record export evidence confirms generated student identity and workspace membership,
- parent/guardian data visibility confirms the linked guardian can view the generated child record,
- audit log completeness confirms generated attendance, grade, and live audit evidence,
- CSV/PDF download integrity verifies both export files contain compliance evidence,
- `data-export-compliance-summary` and `data-export-compliance-manifest` are attached,
- generated teacher/student/parent fixture accounts are archived when `EDUPLATFORM_CLEANUP_MODE=archive`.

## Cleanup data lifecycle

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/data_lifecycle_cleanup.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:lifecycle-phase1
```

Expected cleanup/data lifecycle result:

- generated students, teachers, and parents are suspended and workspace memberships are archived,
- generated invoices, course offerings, workspace materials, and material assignments are archived or made inactive,
- archived records disappear from active queues and parent-visible links are disabled,
- audit/reporting evidence remains available in live, course, and finance audit tables,
- delete mode is reported as blocked for audit-retained generated records,
- `data-lifecycle-cleanup-summary` and `data-lifecycle-cleanup-manifest` are attached.

## Failure negative workflow controls

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/failure_workflow_controls.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:failure-phase1
```

Expected failure/negative workflow controls result:

- Reject admissions path evidence is retained,
- Payment failure/partial payment evidence keeps a non-zero invoice balance,
- Transcript blocked when incomplete evidence confirms no issued transcript or final grade exists,
- Enrollment blocked when capacity full evidence is retained in course audit,
- Missing required fields validation evidence is recorded,
- `failure-workflow-controls-summary` and `failure-workflow-controls-manifest` are attached.

## Full Cross-Role Golden Path

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/cross_role_golden_path.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:cross-role-phase1
```

Expected full cross-role golden path result:

- admin operations readiness, student journey evidence, parent visibility evidence, teacher classroom evidence, finance receipt evidence, academic progress evidence, support communications evidence, security boundary evidence, compliance export readiness, and audit and cleanup readiness checkpoints all pass,
- paid invoice and published academic evidence are linked to the generated student,
- parent/guardian and teacher assignments are retained,
- audit rows are retained in live, course, and finance audit tables,
- `cross-role-golden-path-summary` and `cross-role-golden-path-manifest` are attached.

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
- `parent-journey-summary` JSON for parent runs,
- `parent-journey-manifest` Markdown for parent runs,
- `admin-operations-summary` JSON for admin operations smoke,
- `admin-operations-manifest` Markdown for admin operations smoke,
- `support-communications-summary` JSON for support/communications runs,
- `support-communications-manifest` Markdown for support/communications runs,
- `academic-quality-summary` JSON for course content visibility runs,
- `academic-quality-manifest` Markdown for course content visibility runs,
- `notifications-delivery-summary` JSON for notification delivery runs,
- `notifications-delivery-manifest` Markdown for notification delivery runs,
- `data-export-compliance-summary` JSON for data export compliance runs,
- `data-export-compliance-manifest` Markdown for data export compliance runs,
- `data-lifecycle-cleanup-summary` JSON for cleanup/data lifecycle runs,
- `data-lifecycle-cleanup-manifest` Markdown for cleanup/data lifecycle runs,
- `failure-workflow-controls-summary` JSON for failure/negative workflow controls runs,
- `failure-workflow-controls-manifest` Markdown for failure/negative workflow controls runs,
- `cross-role-golden-path-summary` JSON for full cross-role golden path runs,
- `cross-role-golden-path-manifest` Markdown for full cross-role golden path runs,
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
npm.cmd run test:e2e:parent-phase1
npm.cmd run test:e2e:parent-phase2
npm.cmd run test:e2e:parent-controls
npm.cmd run test:e2e:admin-phase1
npm.cmd run test:e2e:admin-phase2
npm.cmd run test:e2e:admin-phase3
npm.cmd run test:e2e:admin-phase4
npm.cmd run test:e2e:admin-phase5
npm.cmd run test:e2e:admin-controls
npm.cmd run test:e2e:support-phase1
npm.cmd run test:e2e:support-controls
npm.cmd run test:e2e:academic-phase1
npm.cmd run test:e2e:academic-phase2
npm.cmd run test:e2e:academic-phase3
npm.cmd run test:e2e:academic-phase4
npm.cmd run test:e2e:academic-phase5
npm.cmd run test:e2e:academic-controls
npm.cmd run test:e2e:security-phase1
npm.cmd run test:e2e:security-controls
npm.cmd run test:e2e:notifications-phase1
npm.cmd run test:e2e:notifications-controls
npm.cmd run test:e2e:compliance-phase1
npm.cmd run test:e2e:compliance-controls
npm.cmd run test:e2e:lifecycle-phase1
npm.cmd run test:e2e:lifecycle-controls
npm.cmd run test:e2e:failure-phase1
npm.cmd run test:e2e:failure-controls
npm.cmd run test:e2e:cross-role-phase1
npm.cmd run test:e2e:cross-role-controls
```

## Scheduled runner notes

For CI or Windows Task Scheduler:

- Store EduPlatform credentials as secrets or machine-level protected variables.
- Keep `EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY=true` only in the approved SQA runner.
- Upload or retain `test-results` after every run.
- Use `EDUPLATFORM_CLEANUP_MODE=archive` by default.
- Treat paid invoices, payments, receipts, and issued transcripts as retained audit artifacts.
- Keep `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live Moodle server before teacher portal checks.
