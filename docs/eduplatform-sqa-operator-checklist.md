# EduPlatform SQA Operator Checklist

Use this checklist when running the automated student journey harness locally, from a scheduled runner, or as part of a release verification window.

## Daily control check

Run the non-live controls first. These do not create students, invoices, transcripts, or payments.

```powershell
npm.cmd run test:e2e:phase11
npm.cmd run test:e2e:phase12
npm.cmd run test:e2e:phase13
```

For CI or Windows Task Scheduler, use the single scheduled smoke runner:

```powershell
npm.cmd run test:e2e:schedule:daily
```

For a full package, route smoke, and negative-control verification sweep:

```powershell
npm.cmd run test:e2e:sqa-sweep
```

Before live phases, check for stale cPanel uploads:

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN="same-token-as-live"
npm.cmd run test:e2e:deployment-drift
```

For exact checksums, deploy `local/hubredirect/deployment_drift_probe.php`. The normal package script is probe-only and fails if the live server does not return a JSON checksum manifest. On cPanel, configure the live token with `EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN`, `$CFG->eduplatform_deployment_drift_token`, or a private `local/hubredirect/.deployment_drift_token` file, then set the same token locally before running the command.

Expected result:

- Phase 11 passes and writes JSON/Markdown reporting artifacts.
- Phase 12 passes and confirms guardrails.
- Phase 13 passes and confirms scripts, docs, env flags, and spec groups are packaged.
- The full SQA verification sweep confirms package verifier, route smoke, negative controls, docs, env flags, scripts, and endpoint registrations.
- The scheduled smoke summary is written under `test-results\sqa-schedule`.
- The sweep summary is written under `test-results\sqa-verification-sweep`.
- The deployment drift verifier reports matching live checksums from `local/hubredirect/deployment_drift_probe.php` with no fallback.

## Full SQA Verification Sweep

Run this after implementing or deploying a new SQA surface:

```powershell
npm.cmd run test:e2e:sqa-sweep
```

Expected result:

- package verifier passes,
- route smoke passes for registered route helpers,
- negative controls pass with live flags disabled,
- `test-results/sqa-verification-sweep` contains a JSON summary.

## Evidence Bundle Finalizer

After the run window, create a timestamped evidence bundle. Use `EDUPLATFORM_EVIDENCE_BUNDLE_LABEL` to customize the package name:

```powershell
npm.cmd run test:e2e:evidence-bundle
```

Expected result:

- `test-results/sqa-evidence-bundles/<bundle-id>` contains the Playwright report, artifacts, manifests, screenshots, downloaded CSV/PDF evidence, and run summaries.
- On Windows, a sibling `<bundle-id>.zip` is created when `Compress-Archive` is available.

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

## Institution School Models

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_school_functional_test.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:institution-phase1
```

Expected institution school model result:

- Wholly Owned Schools fixtures create a second owned branch linked with `owned_branch`, operations scope, and inherited sensitive access,
- institution admin can manage both wholly owned branches,
- school admins, teachers, parents, and students remain scoped to their own school workspace,
- Franchise Schools fixtures create an independently run school linked with `franchise_member`,
- franchise access remains governance-only and does not inherit operations or sensitive access,
- `institution-governance-summary` and `institution-governance-manifest` are attached,
- generated Huda/Branch/Franchise SQA records can be reviewed and cleaned with `src/moodle/local_prequran/sql/cleanup_institution_school_sqa_fixtures.sql`.

## Institution Admissions / Enrollment And Finance Isolation

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_operations_isolation.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:institution-phase2
```

Expected institution operations isolation result:

- Branch A and Branch B admissions stay in their own school pipelines,
- institution admin owned-branch rollup includes owned branches and excludes franchise admissions,
- franchise admissions stay franchise-owned,
- owned-branch invoices and payments roll up separately from franchise revenue,
- parent billing visibility remains scoped to the linked child school,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Reporting Rollups And Branding / Portal Isolation

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_reporting_branding.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_INVOICE_LINE_AMOUNT="25.00"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:institution-phase3
```

Expected institution reporting and branding result:

- Institution Reporting Rollups aggregate owned schools in operational totals,
- franchise schools appear in governance/network reporting only,
- CSV/PDF exports preserve school identifiers, workspace IDs, relationship type, reporting bucket, and portal domains,
- School Branding / Domain / Portal Isolation confirms each branch/franchise name, logo, workspace, and portal link is distinct,
- branded portal isolation evidence confirms each portal remains school-scoped,
- direct URL probes cannot cross into another school branded portal,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Staff Mobility / Transfer Controls And Data Lifecycle

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_mobility_lifecycle.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:institution-phase4
```

Expected institution mobility and lifecycle result:

- Staff Mobility / Transfer Controls confirm a Branch A teacher cannot access Branch B until explicitly assigned,
- explicit Branch B assignment grants access and transfer removes stale Branch A permissions,
- moving a student between schools updates workspace membership and teacher/student links,
- teacher and student transfer audit rows are retained,
- Institution Data Lifecycle archives one franchise fixture without affecting other schools,
- archived school disappears from active queues but remains in institution audit,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Security / Cross-School Access Matrix

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_security_matrix.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX="true"
npm.cmd run test:e2e:institution-phase5
```

Expected institution security result:

- student, parent, teacher, branch admin, and franchise admin role boundaries are PASS,
- direct URL permission checks are blocked across schools,
- institution admin can roll up owned branches but not franchise operations,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Communications / Notifications Isolation

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_communications_isolation.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION="true"
npm.cmd run test:e2e:institution-phase6
```

Expected institution communications result:

- branch and franchise announcements stay school-scoped,
- parent-teacher messages, support cases, notifications, and follow-up evidence do not cross schools,
- notification audit evidence preserves workspace identifiers,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Academic / Course Isolation

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/institution_academic_isolation.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION="true"
npm.cmd run test:e2e:institution-phase7
```

Expected institution academic result:

- course offerings, lesson resources, gradebook, attendance, and transcript evidence stay school-scoped,
- owned-school academic rollups exclude franchise operational totals,
- franchise academic evidence remains governance/network reporting only,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

## Institution Final Rollup / Readiness

Run this after institution phases 1-7 and after all cPanel uploads are synchronized. Keep `src/moodle/local_hubredirect/institution_readiness_rollup.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP="true"
npm.cmd run test:e2e:institution-phase8
```

Expected institution readiness result:

- phase 1-7 institution endpoint evidence appears ready,
- stale active archived institution fixture checks pass,
- final institution readiness CSV export is downloaded,
- `institution-governance-summary` and `institution-governance-manifest` are attached.

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

## Performance / Reliability Smoke

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/performance_reliability_smoke.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE="true"
$env:EDUPLATFORM_PERFORMANCE_LOAD_THRESHOLD_MS="12000"
$env:EDUPLATFORM_PERFORMANCE_EXPORT_THRESHOLD_MS="15000"
$env:EDUPLATFORM_PERFORMANCE_ENDPOINT_THRESHOLD_MS="2500"
npm.cmd run test:e2e:performance-phase1
```

Expected performance/reliability smoke result:

- Dashboard load time passes within the configured threshold,
- report export time is proven by downloading the CSV diagnostics export,
- repeated login/session stability keeps the admin session active across repeated dashboard loads,
- slow endpoint detection passes for the read-only diagnostic queries,
- `performance-reliability-summary` and `performance-reliability-manifest` are attached.

## Accessibility / Responsive Smoke

Run this only in the approved SQA workspace. Keep `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live server first.

```powershell
$env:EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:accessibility-phase1
```

Expected accessibility/responsive smoke result:

- Admin, student, parent, and teacher portal pages pass at mobile widths,
- visible form controls have labels,
- links and buttons have accessible names,
- each role page supports basic keyboard Tab navigation,
- `accessibility-responsive-summary` and `accessibility-responsive-manifest` are attached.

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
- `performance-reliability-summary` JSON for performance/reliability smoke runs,
- `performance-reliability-manifest` Markdown for performance/reliability smoke runs,
- `accessibility-responsive-summary` JSON for accessibility/responsive smoke runs,
- `accessibility-responsive-manifest` Markdown for accessibility/responsive smoke runs,
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
npm.cmd run test:e2e:institution-phase1
npm.cmd run test:e2e:institution-phase2
npm.cmd run test:e2e:institution-phase3
npm.cmd run test:e2e:institution-phase4
npm.cmd run test:e2e:institution-phase5
npm.cmd run test:e2e:institution-phase6
npm.cmd run test:e2e:institution-phase7
npm.cmd run test:e2e:institution-phase8
npm.cmd run test:e2e:institution-controls
npm.cmd run test:e2e:cross-role-phase1
npm.cmd run test:e2e:cross-role-controls
npm.cmd run test:e2e:performance-phase1
npm.cmd run test:e2e:performance-controls
npm.cmd run test:e2e:accessibility-phase1
npm.cmd run test:e2e:accessibility-controls
npm.cmd run test:e2e:bbb-phase1
npm.cmd run test:e2e:bbb-phase2
npm.cmd run test:e2e:bbb-phase3
npm.cmd run test:e2e:bbb-phase4
npm.cmd run test:e2e:bbb-phase5
npm.cmd run test:e2e:bbb-phase6
npm.cmd run test:e2e:bbb-controls
```

## Scheduled runner notes

For CI or Windows Task Scheduler:

- Store EduPlatform credentials as secrets or machine-level protected variables.
- Validate schedule wiring with `npm.cmd run test:e2e:schedule:validate` before enabling a new scheduled job or changing `EDUPLATFORM_SQA_WEEKLY_PHASES`.
- Run daily non-live controls with `npm.cmd run test:e2e:schedule:daily`.
- Run weekly selected live phases with `EDUPLATFORM_SQA_ALLOW_LIVE_WEEKLY=true` and `npm.cmd run test:e2e:schedule:weekly`.
- Set `EDUPLATFORM_SQA_WEEKLY_PHASES` to a comma-separated script list such as `test:e2e:cross-role-phase1,test:e2e:lifecycle-phase1` when the runner should execute only selected weekly phases.
- Leave `test:e2e:bbb-phase13` in the default weekly set unless BBB pilot readiness is being validated through a separate approved run.
- Keep `EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY=true` only in the approved SQA runner.
- Upload or retain `test-results` after every run.
- Use `EDUPLATFORM_CLEANUP_MODE=archive` by default.
- Treat paid invoices, payments, receipts, and issued transcripts as retained audit artifacts.
- Keep `src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php` synchronized to the live Moodle server before teacher portal checks.
- Keep `src/moodle/local_hubredirect/performance_reliability_smoke.php` synchronized to the live Moodle server before performance/reliability checks.

## Live BBB Operations Smoke

Use this smoke before a BBB pilot or after uploading live-session hubredirect files. It verifies operations readiness and does not create, join, or record a real meeting.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase1
```

Expected Live BBB Operations Smoke result:

- Live Operations Dashboard, Live Sessions, create wizard, live session diagnostics, and recording review pages load for the admin account.
- BBB configuration surfaces are visible in diagnostics without exposing secrets.
- The run records `live-bbb-summary` and `live-bbb-manifest` evidence.

## Live BBB Meeting Lifecycle

Run this only in an approved live BBB provider test window. It creates a generated teacher/student fixture, schedules one class, starts the teacher bridge, and checks diagnostics evidence.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase2
```

Expected Live BBB Meeting Lifecycle result:

- The teacher Start Class URL returns the Moodle BBB launch bridge.
- live session diagnostics shows BBB-created status and recent audit evidence.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Post-Class Evidence

Run this only in an approved live BBB provider test window after Phase 2 is stable. It creates a generated teacher/student fixture, schedules a recording-enabled class, starts the teacher bridge, saves post-class attendance/notes/follow-up, and checks admin evidence.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase3
```

Expected Live BBB Post-Class Evidence result:

- Teacher post-class attendance, participation, homework, parent summary, and follow-up request are saved.
- Admin follow-up command center shows generated BBB follow-up evidence.
- Recording review shows session-level recording policy/readiness evidence.
- Live diagnostics shows BBB-created and recent audit evidence.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Student and Parent Visibility

Run this only in an approved live BBB provider test window after Phase 3 is stable. It creates a generated teacher/student/parent fixture, schedules and starts a BBB class, saves parent-visible post-class feedback, verifies the student live schedule, verifies the parent live hub and summaries, saves a parent follow-up response, and checks family-facing pages for BBB secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase4
```

Expected Live BBB Student and Parent Visibility result:

- Student schedule shows the generated BBB class.
- Parent live hub shows upcoming/feedback evidence for the linked child.
- Parent summaries show parent-visible teacher feedback and hide private teacher notes.
- Parent follow-up response is saved and reflected in admin follow-up evidence.
- Family-facing BBB pages do not expose shared secrets, checksums, or meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Trust and Retention Audit

Run this only in an approved live BBB provider test window after Phase 4 is stable. It saves a parent-trust support reason/case, verifies admin audit evidence, downloads the compliance review pack CSV, checks retention readiness, and confirms admin/family review surfaces do not leak BBB secrets or private teacher notes.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase5
```

Expected Live BBB Trust and Retention Audit result:

- Parent-trust support reason and case note are saved for the generated student.
- Admin parent-trust support audit shows the generated case and access reason.
- Compliance review pack CSV downloads and contains the audit row.
- Retention readiness page shows purge/export governance signals.
- Recording and trust audit surfaces hide BBB shared secrets, checksums, meeting passwords, and private teacher notes.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Instructional Readiness

Run this only in an approved live BBB provider test window after Phase 5 is stable. It checks the live-session guide, Quraan Materials, Practice Coach report, Virtual Tutor, diagnostics, and learner-facing secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase6
```

Expected Live BBB Instructional Readiness result:

- Live-session guide loads with the walkthrough video.
- Teacher starts the BBB bridge for the generated class.
- Quraan Materials shows agenda/material readiness for the session.
- Practice Coach report loads for the generated session/student.
- Student Virtual Tutor opens for the generated live session.
- Learner-facing guide and tutor surfaces hide BBB shared secrets, checksums, and meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Quality And Leadership Analytics

Run this only in an approved live BBB provider test window after Phase 6 is stable. It checks QA review, leadership case handling, improvement-plan assignment, analytics, reports, monitor evidence, diagnostics, and secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase7
```

Expected Live BBB Quality And Leadership Analytics result:

- Teacher starts the BBB bridge and saves post-class attendance/summary evidence.
- Admin saves QA review and coaching/leadership signals.
- Leadership command center assigns an improvement plan for the generated class.
- QA analytics, Teacher Improvement Plans, Live Reports, Live Lesson Monitor, and diagnostics reflect the quality signal.
- Leadership, analytics, reports, and monitor surfaces hide BBB shared secrets, checksums, and meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Scheduling Capacity And Calendar

Run this only in an approved live BBB provider test window after Phase 7 is stable. It checks recurring series creation, capacity planning export, teacher directory/profile visibility, student and parent calendars, diagnostics, and secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase8
```

Expected Live BBB Scheduling Capacity And Calendar result:

- Admin creates a two-session recurring live class series.
- Live Class Series dashboard, Teacher Assignment & Capacity Planning CSV, Teacher Directory, and teacher profile reflect the generated series.
- Student and parent recurring schedule and Live Class Calendar pages show the generated class.
- Schedule, calendar, capacity, directory, and profile surfaces hide BBB shared secrets, checksums, and meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Operational Resilience

Run this only in an approved live BBB provider test window after Phase 8 is stable. It checks single-session cancellation, full series cancellation, active schedule hiding, direct join blocking, diagnostics audit evidence, and secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase9
```

Expected Live BBB Operational Resilience result:

- Admin creates a two-session recurring live class series.
- Admin cancels one generated session and then cancels the remaining future series with audit reasons.
- Cancelled session direct join URL is blocked.
- Active schedule hiding is verified for cancelled student and parent live schedules.
- Student and parent active schedule pages no longer show the cancelled series.
- Diagnostics audit evidence shows single-session and full-series cancellation events.
- Schedule, cancellation, direct URL, and audit surfaces hide BBB shared secrets, checksums, and meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

## Live BBB Backup And DR Readiness

Run this only after Phase 9 is stable. It records Backup/DR readiness evidence, verifies live diagnostics and reports readiness, and checks operational secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
npm.cmd run test:e2e:bbb-phase10
```

Expected Live BBB Backup And DR Readiness result:

- Admin records a Backup/DR readiness evidence check.
- Backup/DR readiness remains available as backup DR readiness operational evidence.
- Backup And DR Checks shows current findings, backup scope, and check history.
- Live Session Diagnostics shows configuration, table health, recent sessions, and recent audit.
- Live Reports shows session summary, teacher workload, and risk/trust audit evidence.
- Backup/DR, diagnostics, and reports surfaces hide BBB shared secrets, checksums, and meeting passwords.

## Live BBB Retention Controls

Run this only after Phase 10 is stable. It checks parent-trust retention review workflow, blocked guarded purge behavior, recovery evidence, and secret hygiene without deleting live evidence.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
npm.cmd run test:e2e:bbb-phase11
```

Expected Live BBB Retention Controls result:

- Admin requests and rejects parent-trust purge review with audit notes.
- Guarded purge execution is blocked when confirmation requirements are incomplete.
- `guarded purge execution is blocked` is retained as a checklist signal for the package verifier.
- Guarded purge block evidence remains available for recovery review.
- Blocked purge evidence opens from the retention workflow table.
- Retention, purge, and evidence surfaces hide BBB shared secrets, checksums, and meeting passwords.

## Live BBB Consent Availability And Grouping

Run this only after Phase 11 is stable. It checks teacher availability, student grouping consent, parent-link refresh/export, cleanup readiness, and secret hygiene.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
$env:EDUPLATFORM_TEACHER_PASSWORD="Mock@001!"
$env:EDUPLATFORM_CLEANUP_MODE="archive"
npm.cmd run test:e2e:bbb-phase12
```

Expected Live BBB Consent Availability And Grouping result:

- Teacher availability calendar saves recurring availability.
- Student Grouping shows live and recording consent for the generated student.
- Student Parent Links refreshes linked guardian consent and exports CSV evidence.
- Availability, grouping, parent-link, and CSV surfaces hide BBB shared secrets, checksums, and meeting passwords.
- The generated fixture is archived afterward when cleanup mode is `archive`.

### Live BBB Phase 13: Rollup / Pilot Readiness

Run this after Phase 12 passes and after generated fixture cleanup has completed. It checks reports, diagnostics, final rollup evidence, stale active SQA leftovers, and final CSV export readiness.

Keep `src/moodle/local_hubredirect/live_pilot_readiness.php` synchronized to `local/hubredirect/live_pilot_readiness.php` before running this phase. The page is the final BBB readiness evidence surface and checks for stale active SQA sessions.

```powershell
$env:EDUPLATFORM_BASE_URL="https://quraantest.academy"
$env:EDUPLATFORM_CONSUMER="quraan-academy"
$env:EDUPLATFORM_WORKSPACE_ID="1"
$env:EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS="true"
$env:EDUPLATFORM_TEST_COURSE_KEY="pre_quraan"
npm.cmd run test:e2e:bbb-phase13
```

Expected Live BBB Rollup / Pilot Readiness result:

- Phase evidence rollup rows all show PASS.
- Live Reports and Live Diagnostics expose accumulated session/audit evidence.
- Stale active generated SQA sessions, users, and parent links are zero.
- Final BBB readiness CSV downloads and hides BBB shared secrets, checksums, and meeting passwords.
