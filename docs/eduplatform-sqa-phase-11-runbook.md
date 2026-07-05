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

## Parent Journey Commands

Run local parent guard checks:

```powershell
npm.cmd run test:e2e:parent-controls
npm.cmd run test:e2e:phase13
```

Run the parent portal visibility path only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:parent-phase1
```

Run the parent payment visibility path:

```powershell
$env:EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:parent-phase2
```

Expected parent result:

- public student intake creates linked student and parent accounts,
- student requests enrollment and admin approves it,
- tuition invoice is issued,
- parent can log in and see linked child, billing, and student-parent portal finance evidence,
- phase 2 records a manual payment and verifies paid invoice plus receipt visibility from the parent side.

## Admin Operations Commands

Run local admin guard checks:

```powershell
npm.cmd run test:e2e:admin-controls
npm.cmd run test:e2e:phase13
```

Run the read-only admin/workspace dashboard smoke only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase1
```

Expected admin operations result:

- admin login succeeds,
- workspace dashboard loads and exposes the core operations links,
- master dashboard, workspace people, course offerings, invoices, and intake request pages load,
- smoke evidence is attached as `admin-operations-summary` and `admin-operations-manifest`.

Run Admissions Operations only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase2
```

Expected admissions operations result:

- two public intake requests are submitted for the run,
- admin queue search finds the generated request,
- status filter confirms `New`, `Rejected`, and `Reviewing` queue states,
- one request is rejected with admin notes,
- one request is approved/loaded into Student Intake,
- Recent Audit shows review and transfer audit events for the generated request IDs.

Run Course Offering Operations only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase3
```

Expected course offering operations result:

- a unique draft workspace offering is created,
- capacity, status, and visibility are updated to a published institution-public offering,
- a generated student submits an enrollment request against that exact offering,
- admin filters/reviews the enrollment request queue,
- admin rejects the generated enrollment request,
- the offering is archived,
- course audit log shows create, update, enrollment rejection, and archive events.

Run Finance Operations only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_FINANCE_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase4
```

Expected finance operations result:

- finance operations dashboard, finance policy, and payment gateway settings load for the workspace,
- a generated student is approved, enrolled, invoiced, and issued a tuition invoice,
- invoice aging/dashboard report shows the issued invoice,
- manual payment creates receipt evidence and marks the invoice paid with zero balance,
- payments report shows the receipt/reference,
- parent billing and student-parent portal expose the paid invoice and receipt according to billing visibility policy.

Run Reporting/Audit Operations only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:admin-phase5
```

Expected reporting/audit operations result:

- managed course reports load: seat utilization, Moodle sync, and student course history,
- finance audit page loads and exposes invoice/payment/receipt audit filters,
- transcript readiness and transcript policy pages load as the transcript audit/readiness surfaces,
- transcript readiness CSV downloads successfully,
- compliance/governance audit CSV downloads successfully,
- evidence summary records downloaded filenames and report URLs.

## Support/Communications Commands

Run local support guard checks:

```powershell
npm.cmd run test:e2e:support-controls
npm.cmd run test:e2e:phase13
```

Run Support/Communications only in the approved EduPlatform SQA workspace:

```powershell
$env:EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:support-phase1
```

Expected Support/Communications result:

- public student intake creates linked student and parent accounts,
- public teacher application creates a teacher account/profile,
- Communications Center creates parent-teacher messages, a support follow-up case, consent, template, announcement campaign, and delivery log evidence,
- teacher can log in and see the generated parent-teacher thread,
- Support Inbox, Support Reports, Support Audit Review, and Notification Branding Diagnostics load,
- support report CSV downloads successfully,
- evidence summary is attached as `support-communications-summary` and `support-communications-manifest`.

## Academic Quality Commands

Run local academic quality guard checks:

```powershell
npm.cmd run test:e2e:academic-controls
npm.cmd run test:e2e:phase13
```

Run Course Content Visibility only in the approved EduPlatform SQA workspace:

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

Expected course content visibility result:

- admin creates a unique published academic course offering,
- public intake and teacher intake create generated student and teacher accounts,
- admin creates a student-visible material, teacher-only restricted material, and archived/unpublished draft material,
- admin assigns the student-visible material to the generated student and teacher-only material to the generated teacher,
- generated student sees the assigned course material but not teacher-only or archived content,
- generated teacher sees the expected workspace materials and not archived content,
- archive cleanup records generated materials and offering disposition,
- evidence summary is attached as `academic-quality-summary` and `academic-quality-manifest`.

Run Assignment/Resource Lifecycle only in the approved EduPlatform SQA workspace:

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

- admin creates a unique published academic course offering,
- public intake and teacher intake create generated student and teacher accounts,
- admin publishes a student-visible resource assignment,
- generated student marks the assigned resource completed,
- generated teacher can see the completed assignment evidence,
- academic/admin review marks the resource assignment reviewed,
- parent workspace and admin workspace materials both show reviewed status,
- archive cleanup records generated resource and offering disposition,
- evidence summary is attached as `academic-quality-summary` and `academic-quality-manifest`.

Run Gradebook Consistency only in the approved EduPlatform SQA workspace:

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

- admin creates a unique published academic course offering,
- public intake and teacher intake create generated student and teacher accounts,
- admin creates and publishes an assignment grade with the configured completion score,
- generated teacher sees the published grade in Gradebook And Assessment,
- generated student and linked parent see the allowed published grade in Student And Parent Portal,
- admin transcript preview reflects the same final score,
- archive cleanup records generated offering disposition,
- evidence summary is attached as `academic-quality-summary` and `academic-quality-manifest`.

Run Attendance And Progress Audit only in the approved EduPlatform SQA workspace. Keep the live server copy of `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized before this phase because it creates the linked parent account used by the parent visibility check.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase4
```

Expected attendance and progress audit result:

- public teacher intake creates a generated teacher account,
- SQA teacher portal fixture creates a linked student and parent account,
- generated teacher records attendance, notes/homework, and progress,
- admin verifies attendance operations and workspace reports audit evidence,
- generated student sees allowed attendance and progress evidence,
- generated parent sees allowed attendance, homework, and parent-visible progress evidence,
- archive cleanup suspends generated teacher/student/parent accounts and archives fixture links,
- evidence summary is attached as `academic-quality-summary` and `academic-quality-manifest`.

Run Academic Quality Controls only in the approved EduPlatform SQA workspace. Keep the live server copy of `src/moodle/local_hubredirect/academic_quality_controls.php` synchronized before this phase because the test verifies that dashboard and its CSV export.

```powershell
$env:EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:academic-phase5
```

Expected academic quality controls result:

- public teacher intake creates a generated teacher account,
- SQA teacher portal fixture creates a linked student/session/assessment,
- admin verifies missing grade detection before a grade is recorded,
- admin verifies incomplete attendance detection before attendance is recorded,
- generated teacher publishes a low score and marks progress as needing support,
- admin verifies low-score and progress alert evidence,
- academic quality controls CSV downloads successfully,
- archive cleanup suspends generated teacher/student/parent accounts and archives fixture links,
- evidence summary is attached as `academic-quality-summary` and `academic-quality-manifest`.

Run Security / Access Control only in the approved EduPlatform SQA workspace. This phase creates two independent teacher/student/parent fixture sets so it can verify positive access for linked records and negative access for unlinked records.

```powershell
$env:EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:security-phase1
```

Expected security access result:

- Role boundary checks verify a student cannot access teacher portal or admin intake queue pages,
- Role boundary checks verify a parent can see only their linked child and is blocked from an unlinked child,
- Role boundary checks verify a teacher sees only assigned classes/students and is blocked from an unassigned student profile,
- Direct URL permission checks verify protected admin, teacher, parent, and student routes cannot be reached by the wrong role,
- Session expiry/login redirect verifies a logged-out protected student profile URL redirects to login,
- archive cleanup suspends generated teacher/student/parent accounts and archives fixture links,
- evidence summary is attached as `security-access-summary` and `security-access-manifest`.

Run Notifications Delivery only in the approved EduPlatform SQA workspace. Keep the live server copies of `src/moodle/local_hubredirect/notification_delivery_audit.php` and `src/moodle/local_hubredirect/teacher_portal.php` synchronized before this phase because the test verifies generated notification audit rows.

```powershell
$env:EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:notifications-phase1
```

Expected notifications delivery result:

- generated communications records verify parent-teacher messages and announcements,
- issued invoice verifies finance notification delivery and audit logs,
- teacher portal attendance and published grade actions generate parent notifications,
- low-score alerts evidence is generated for a published score below 70,
- notification center, email delivery, and log evidence are visible in the notification delivery audit page,
- notification delivery CSV downloads successfully,
- archive cleanup suspends generated teacher/student/parent accounts and archives fixture links,
- evidence summary is attached as `notifications-delivery-summary` and `notifications-delivery-manifest`.

Run Data Export / Compliance only in the approved EduPlatform SQA workspace. Keep the live server copies of `src/moodle/local_hubredirect/data_export_compliance.php` and `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized before this phase because the test validates exported student, guardian, and audit evidence from generated fixture records.

```powershell
$env:EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:compliance-phase1
```

Expected data export compliance result:

- student record export evidence confirms the generated student user, workspace membership, and available student profile data,
- parent/guardian data visibility confirms the linked guardian can view the generated child record,
- audit log completeness confirms generated attendance, grade, and live audit evidence is present,
- CSV/PDF download integrity verifies both export formats download with expected compliance evidence,
- archive cleanup suspends generated teacher/student/parent accounts and archives fixture links,
- evidence summary is attached as `data-export-compliance-summary` and `data-export-compliance-manifest`.

Run Cleanup / Data Lifecycle only in the approved EduPlatform SQA workspace. Keep the live server copy of `src/moodle/local_hubredirect/data_lifecycle_cleanup.php` synchronized before this phase because it creates a scoped SQA fixture, archives it, and verifies queue/audit lifecycle state.

```powershell
$env:EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:lifecycle-phase1
```

Expected cleanup/data lifecycle result:

- generated students, teachers, and parents are suspended and their workspace memberships are archived,
- generated invoices, course offerings, workspace materials, and material assignments are archived or made inactive,
- archived records disappear from active queues and parent-visible links are disabled,
- audit/reporting evidence remains in live, course, and finance audit tables,
- delete mode is reported as blocked for audit-retained generated records,
- evidence summary is attached as `data-lifecycle-cleanup-summary` and `data-lifecycle-cleanup-manifest`.

Run Failure / Negative Workflow Controls only in the approved EduPlatform SQA workspace. Keep the live server copy of `src/moodle/local_hubredirect/failure_workflow_controls.php` synchronized before this phase because it creates controlled blocked records and verifies retained audit evidence.

```powershell
$env:EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:failure-phase1
```

Expected failure/negative workflow controls result:

- Reject admissions path evidence shows a rejected intake request or retained audit row,
- Payment failure/partial payment evidence shows a partially paid invoice with remaining balance plus finance audit evidence,
- Transcript blocked when incomplete evidence confirms no issued transcript or final grade exists for the incomplete generated student,
- Enrollment blocked when capacity full evidence shows a capacity-blocked/rejected enrollment request with course audit evidence,
- Missing required fields validation evidence confirms required intake fields are blocked before persistence,
- evidence summary is attached as `failure-workflow-controls-summary` and `failure-workflow-controls-manifest`.

Run Full Cross-Role Golden Path only in the approved EduPlatform SQA workspace. Keep the live server copy of `src/moodle/local_hubredirect/cross_role_golden_path.php` synchronized before this phase because it creates one scoped student/parent/teacher/admin evidence set and verifies the integrated role surfaces.

```powershell
$env:EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:cross-role-phase1
```

Expected full cross-role golden path result:

- admin operations readiness confirms generated users are linked to the workspace,
- student journey evidence confirms a generated student and course offering exist,
- parent visibility evidence confirms parent/guardian links are retained,
- teacher classroom evidence confirms teacher assignment and attendance/progress evidence,
- finance receipt evidence confirms a paid zero-balance invoice plus finance audit,
- academic progress evidence confirms a published grade and course audit,
- support communications evidence confirms parent-teacher message thread evidence,
- security boundary evidence confirms role-boundary audit evidence is retained,
- compliance export readiness confirms student, parent, teacher, and audit identifiers are available for export checks,
- audit and cleanup readiness confirms retained live/course/finance audit evidence,
- evidence summary is attached as `cross-role-golden-path-summary` and `cross-role-golden-path-manifest`.

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
