const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`OK ${message}`);
}

function expectIncludes(label, text, needle) {
  if (!text.includes(needle)) {
    fail(`${label} is missing ${needle}`);
    return;
  }
  pass(`${label} contains ${needle}`);
}

const packageJson = JSON.parse(readText('package.json'));
const scripts = packageJson.scripts || {};
const envExample = readText('.env.e2e.example');
const studentJourneySpec = readText('tests/e2e/student-journey.spec.ts');
const teacherJourneySpec = readText('tests/e2e/teacher-journey.spec.ts');
const parentJourneySpec = readText('tests/e2e/parent-journey.spec.ts');
const adminOperationsSpec = readText('tests/e2e/admin-operations.spec.ts');
const supportCommunicationsSpec = readText('tests/e2e/support-communications.spec.ts');
const academicQualitySpec = readText('tests/e2e/academic-quality.spec.ts');
const securityAccessSpec = readText('tests/e2e/security-access.spec.ts');
const notificationsDeliverySpec = readText('tests/e2e/notifications-delivery.spec.ts');
const dataExportComplianceSpec = readText('tests/e2e/data-export-compliance.spec.ts');
const dataLifecycleCleanupSpec = readText('tests/e2e/data-lifecycle-cleanup.spec.ts');
const failureWorkflowControlsSpec = readText('tests/e2e/failure-workflow-controls.spec.ts');
const institutionGovernanceSpec = readText('tests/e2e/institution-governance.spec.ts');
const crossRoleGoldenPathSpec = readText('tests/e2e/cross-role-golden-path.spec.ts');
const performanceReliabilitySpec = readText('tests/e2e/performance-reliability.spec.ts');
const accessibilityResponsiveSpec = readText('tests/e2e/accessibility-responsive.spec.ts');
const liveBbbSpec = readText('tests/e2e/live-bbb.spec.ts');
const envHelper = readText('tests/e2e/helpers/env.ts');
const routesHelper = readText('tests/e2e/helpers/routes.ts');
const liveBbbHelper = readText('tests/e2e/helpers/live-bbb.ts');
const livePilotReadinessEndpoint = readText('src/moodle/local_hubredirect/live_pilot_readiness.php');
const sqaVerificationSweep = readText('tools/run-eduplatform-sqa-verification-sweep.js');
const sqaScheduleRunner = readText('tools/run-eduplatform-sqa-schedule.js');
const phase11Runbook = readText('docs/eduplatform-sqa-phase-11-runbook.md');
const operatorChecklist = readText('docs/eduplatform-sqa-operator-checklist.md');

const expectedScripts = [
  'test:e2e:student-journey',
  'test:e2e:teacher-journey',
  'test:e2e:parent-journey',
  'test:e2e:admin-operations',
  'test:e2e:support-communications',
  'test:e2e:academic-quality',
  'test:e2e:security-access',
  'test:e2e:notifications-delivery',
  'test:e2e:data-export-compliance',
  'test:e2e:data-lifecycle-cleanup',
  'test:e2e:failure-workflow-controls',
  'test:e2e:institution-governance',
  'test:e2e:cross-role-golden-path',
  'test:e2e:performance-reliability',
  'test:e2e:accessibility-responsive',
  'test:e2e:live-bbb',
  'test:e2e:setup-public-course',
  'test:e2e:teacher-phase1',
  'test:e2e:teacher-phase2',
  'test:e2e:teacher-phase3',
  'test:e2e:teacher-phase4',
  'test:e2e:teacher-phase5',
  'test:e2e:teacher-controls',
  'test:e2e:parent-phase1',
  'test:e2e:parent-phase2',
  'test:e2e:parent-controls',
  'test:e2e:admin-phase1',
  'test:e2e:admin-phase2',
  'test:e2e:admin-phase3',
  'test:e2e:admin-phase4',
  'test:e2e:admin-phase5',
  'test:e2e:admin-controls',
  'test:e2e:support-phase1',
  'test:e2e:support-controls',
  'test:e2e:academic-phase1',
  'test:e2e:academic-phase2',
  'test:e2e:academic-phase3',
  'test:e2e:academic-phase4',
  'test:e2e:academic-phase5',
  'test:e2e:academic-controls',
  'test:e2e:security-phase1',
  'test:e2e:security-controls',
  'test:e2e:notifications-phase1',
  'test:e2e:notifications-controls',
  'test:e2e:compliance-phase1',
  'test:e2e:compliance-controls',
  'test:e2e:lifecycle-phase1',
  'test:e2e:lifecycle-controls',
  'test:e2e:failure-phase1',
  'test:e2e:failure-controls',
  'test:e2e:institution-phase1',
  'test:e2e:institution-phase2',
  'test:e2e:institution-phase3',
  'test:e2e:institution-phase4',
  'test:e2e:institution-phase5',
  'test:e2e:institution-phase6',
  'test:e2e:institution-phase7',
  'test:e2e:institution-phase8',
  'test:e2e:institution-controls',
  'test:e2e:cross-role-phase1',
  'test:e2e:cross-role-controls',
  'test:e2e:performance-phase1',
  'test:e2e:performance-controls',
  'test:e2e:accessibility-phase1',
  'test:e2e:accessibility-controls',
  'test:e2e:bbb-phase1',
  'test:e2e:bbb-phase2',
  'test:e2e:bbb-phase3',
  'test:e2e:bbb-phase4',
  'test:e2e:bbb-phase5',
  'test:e2e:bbb-phase6',
  'test:e2e:bbb-phase7',
  'test:e2e:bbb-phase8',
  'test:e2e:bbb-phase9',
  'test:e2e:bbb-phase10',
  'test:e2e:bbb-phase11',
  'test:e2e:bbb-phase12',
  'test:e2e:bbb-phase13',
  'test:e2e:bbb-controls',
  'test:e2e:sqa-sweep',
  'test:e2e:schedule:daily',
  'test:e2e:schedule:weekly',
  'test:e2e:schedule:validate',
  'test:e2e:deployment-drift',
  'test:e2e:evidence-bundle',
  'test:e2e:phase4',
  'test:e2e:phase5',
  'test:e2e:phase6',
  'test:e2e:phase7',
  'test:e2e:phase8',
  'test:e2e:phase9',
  'test:e2e:phase10',
  'test:e2e:phase11',
  'test:e2e:phase12',
  'test:e2e:phase13',
  'test:e2e:report',
];

for (const scriptName of expectedScripts) {
  if (!scripts[scriptName]) {
    fail(`package.json scripts.${scriptName} is missing`);
  } else {
    pass(`package.json scripts.${scriptName} exists`);
  }
}

const expectedEnvFlags = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ENABLE_PUBLIC_COURSE_CREATE',
  'EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT',
  'EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE',
  'EDUPLATFORM_ENABLE_COURSE_ENROLLMENT',
  'EDUPLATFORM_ENABLE_INVOICE_CREATE',
  'EDUPLATFORM_ENABLE_CLASS_COMPLETION',
  'EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE',
  'EDUPLATFORM_ENABLE_PAYMENT_RECEIPT',
  'EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY',
  'EDUPLATFORM_ENABLE_TEACHER_INTAKE_SUBMIT',
  'EDUPLATFORM_ENABLE_TEACHER_ONBOARDING',
  'EDUPLATFORM_ENABLE_FULL_TEACHER_JOURNEY',
  'EDUPLATFORM_ENABLE_TEACHER_PORTAL_OPS',
  'EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH',
  'EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY',
  'EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE',
  'EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS',
  'EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS',
  'EDUPLATFORM_ENABLE_FINANCE_OPERATIONS',
  'EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS',
  'EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS',
  'EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE',
  'EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY',
  'EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT',
  'EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS',
  'EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL',
  'EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY',
  'EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE',
  'EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP',
  'EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS',
  'EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS',
  'EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING',
  'EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE',
  'EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX',
  'EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP',
  'EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH',
  'EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE',
  'EDUPLATFORM_PERFORMANCE_LOAD_THRESHOLD_MS',
  'EDUPLATFORM_PERFORMANCE_EXPORT_THRESHOLD_MS',
  'EDUPLATFORM_PERFORMANCE_ENDPOINT_THRESHOLD_MS',
  'EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT',
  'EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP',
  'EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING',
  'EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS',
  'EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN',
  'EDUPLATFORM_HUBREDIRECT_DRIFT_PROBE_URL',
  'EDUPLATFORM_HUBREDIRECT_DRIFT_INCLUDE',
  'EDUPLATFORM_HUBREDIRECT_DRIFT_REQUIRE_PROBE',
  'EDUPLATFORM_EVIDENCE_BUNDLE_LABEL',
  'EDUPLATFORM_SQA_ALLOW_LIVE_WEEKLY',
  'EDUPLATFORM_SQA_WEEKLY_PHASES',
  'EDUPLATFORM_CLEANUP_MODE',
];

for (const envFlag of expectedEnvFlags) {
  expectIncludes('.env.e2e.example', envExample, envFlag);
}

const expectedSpecGroups = [
  'public intake live action',
  'admissions approval and student creation live action',
  'course enrollment live action',
  'invoice creation live action',
  'class completion live action',
  'transcript issue live action',
  'payment receipt live action',
  'full student journey live action',
  'reporting and cleanup readiness',
  'negative controls',
];

for (const groupName of expectedSpecGroups) {
  expectIncludes('student-journey.spec.ts', studentJourneySpec, groupName);
}

for (const groupName of [
  'teacher public intake live action',
  'full teacher onboarding live action',
  'teacher portal classroom operations live action',
  'teacher reporting and cleanup readiness',
  'full teacher golden path live action',
  'teacher negative controls',
]) {
  expectIncludes('teacher-journey.spec.ts', teacherJourneySpec, groupName);
}

for (const groupName of [
  'parent portal visibility live action',
  'parent payment visibility live action',
  'parent negative controls',
]) {
  expectIncludes('parent-journey.spec.ts', parentJourneySpec, groupName);
}

for (const groupName of [
  'workspace admin dashboard smoke live action',
  'admissions operations live action',
  'course offering operations live action',
  'finance operations live action',
  'reporting and audit operations live action',
  'admin operations negative controls',
]) {
  expectIncludes('admin-operations.spec.ts', adminOperationsSpec, groupName);
}

for (const groupName of [
  'support communications live action',
  'support communications negative controls',
]) {
  expectIncludes('support-communications.spec.ts', supportCommunicationsSpec, groupName);
}

for (const groupName of [
  'course content visibility live action',
  'assignment resource lifecycle live action',
  'gradebook consistency live action',
  'attendance and progress audit live action',
  'academic quality controls live action',
  'academic quality negative controls',
]) {
  expectIncludes('academic-quality.spec.ts', academicQualitySpec, groupName);
}

for (const groupName of [
  'role boundary and direct URL access control live action',
  'security access negative controls',
]) {
  expectIncludes('security-access.spec.ts', securityAccessSpec, groupName);
}

for (const groupName of [
  'notifications delivery live action',
  'notifications delivery negative controls',
]) {
  expectIncludes('notifications-delivery.spec.ts', notificationsDeliverySpec, groupName);
}

for (const groupName of [
  'data export compliance live action',
  'data export compliance negative controls',
]) {
  expectIncludes('data-export-compliance.spec.ts', dataExportComplianceSpec, groupName);
}

for (const groupName of [
  'cleanup data lifecycle live action',
  'data lifecycle cleanup negative controls',
]) {
  expectIncludes('data-lifecycle-cleanup.spec.ts', dataLifecycleCleanupSpec, groupName);
}

for (const groupName of [
  'failure workflow controls live action',
  'failure workflow controls negative controls',
]) {
  expectIncludes('failure-workflow-controls.spec.ts', failureWorkflowControlsSpec, groupName);
}

for (const groupName of [
  'institution school models live action',
  'institution admissions enrollment finance isolation live action',
  'institution reporting rollups and branding portal isolation live action',
  'institution staff mobility and data lifecycle live action',
  'institution security cross-school access matrix live action',
  'institution communications notifications isolation live action',
  'institution academic course isolation live action',
  'institution final readiness rollup live action',
  'institution governance negative controls',
]) {
  expectIncludes('institution-governance.spec.ts', institutionGovernanceSpec, groupName);
}

for (const groupName of [
  'full cross-role golden path live action',
  'cross-role golden path negative controls',
]) {
  expectIncludes('cross-role-golden-path.spec.ts', crossRoleGoldenPathSpec, groupName);
}

for (const groupName of [
  'performance reliability smoke live action',
  'performance reliability negative controls',
]) {
  expectIncludes('performance-reliability.spec.ts', performanceReliabilitySpec, groupName);
}

for (const groupName of [
  'accessibility responsive smoke live action',
  'accessibility responsive negative controls',
]) {
  expectIncludes('accessibility-responsive.spec.ts', accessibilityResponsiveSpec, groupName);
}

for (const groupName of [
  'live BBB operations smoke live action',
  'live BBB meeting lifecycle live action',
  'live BBB post-class evidence live action',
  'live BBB student and parent visibility live action',
  'live BBB trust and retention audit live action',
  'live BBB instructional readiness live action',
  'live BBB quality and leadership analytics live action',
  'live BBB scheduling capacity and calendar live action',
  'live BBB operational resilience live action',
  'live BBB backup and DR readiness live action',
  'live BBB retention controls live action',
  'live BBB consent availability and grouping live action',
  'live BBB rollup pilot readiness live action',
  'live BBB negative controls',
]) {
  expectIncludes('live-bbb.spec.ts', liveBbbSpec, groupName);
}

for (const command of [
  'npm.cmd run test:e2e:phase10',
  'npm.cmd run test:e2e:phase11',
  'npm.cmd run test:e2e:phase12',
  'npm.cmd run test:e2e:teacher-phase5',
  'npm.cmd run test:e2e:parent-phase1',
  'npm.cmd run test:e2e:parent-phase2',
  'npm.cmd run test:e2e:admin-phase1',
  'npm.cmd run test:e2e:admin-phase2',
  'npm.cmd run test:e2e:admin-phase3',
  'npm.cmd run test:e2e:admin-phase4',
  'npm.cmd run test:e2e:admin-phase5',
  'npm.cmd run test:e2e:support-phase1',
  'npm.cmd run test:e2e:academic-phase1',
  'npm.cmd run test:e2e:academic-phase2',
  'npm.cmd run test:e2e:academic-phase3',
  'npm.cmd run test:e2e:academic-phase4',
  'npm.cmd run test:e2e:academic-phase5',
  'npm.cmd run test:e2e:security-phase1',
  'npm.cmd run test:e2e:notifications-phase1',
  'npm.cmd run test:e2e:compliance-phase1',
  'npm.cmd run test:e2e:lifecycle-phase1',
  'npm.cmd run test:e2e:failure-phase1',
  'npm.cmd run test:e2e:institution-phase1',
  'npm.cmd run test:e2e:institution-phase2',
  'npm.cmd run test:e2e:institution-phase3',
  'npm.cmd run test:e2e:institution-phase4',
  'npm.cmd run test:e2e:institution-phase5',
  'npm.cmd run test:e2e:institution-phase6',
  'npm.cmd run test:e2e:institution-phase7',
  'npm.cmd run test:e2e:institution-phase8',
  'npm.cmd run test:e2e:cross-role-phase1',
  'npm.cmd run test:e2e:performance-phase1',
  'npm.cmd run test:e2e:accessibility-phase1',
  'npm.cmd run test:e2e:bbb-phase1',
  'npm.cmd run test:e2e:bbb-phase2',
  'npm.cmd run test:e2e:bbb-phase3',
  'npm.cmd run test:e2e:bbb-phase4',
  'npm.cmd run test:e2e:bbb-phase5',
  'npm.cmd run test:e2e:bbb-phase6',
  'npm.cmd run test:e2e:bbb-phase7',
  'npm.cmd run test:e2e:bbb-phase8',
  'npm.cmd run test:e2e:bbb-phase9',
  'npm.cmd run test:e2e:bbb-phase10',
  'npm.cmd run test:e2e:bbb-phase11',
  'npm.cmd run test:e2e:bbb-phase12',
  'npm.cmd run test:e2e:bbb-phase13',
  'npm.cmd run test:e2e:sqa-sweep',
  'npm.cmd run test:e2e:deployment-drift',
  'npm.cmd run test:e2e:evidence-bundle',
  'npm.cmd run test:e2e:schedule:daily',
  'npm.cmd run test:e2e:schedule:weekly',
  'npm.cmd run test:e2e:schedule:validate',
  'npx playwright show-report',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, command);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, command);
}

for (const phrase of [
  'dailyPlan',
  'weeklyPlan',
  'test:e2e:bbb-phase13',
  'test:e2e:institution-phase1',
  'test:e2e:institution-phase2',
  'test:e2e:institution-phase3',
  'test:e2e:institution-phase4',
  'test:e2e:institution-phase5',
  'test:e2e:institution-phase6',
  'test:e2e:institution-phase7',
  'test:e2e:institution-phase8',
  'EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS',
  'EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS',
  'EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING',
  'EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE',
  'EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX',
  'EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP',
  'validateScheduleConfig',
  'Weekly live step',
  'Daily safe step',
]) {
  expectIncludes('tools/run-eduplatform-sqa-schedule.js', sqaScheduleRunner, phrase);
}

for (const phrase of [
  '--probe-only',
  'EDUPLATFORM_HUBREDIRECT_DRIFT_REQUIRE_PROBE',
  'Probe did not return JSON',
]) {
  expectIncludes('tools/verify-hubredirect-deployment-drift.js', readText('tools/verify-hubredirect-deployment-drift.js'), phrase);
}

for (const phrase of [
  'Daily control check',
  'Weekly full journey',
  'Weekly teacher journey',
  'Weekly parent journey',
  'Weekly admin operations',
  'Scheduled runner notes',
  'Public course setup',
  'Failure triage',
  'Evidence review',
]) {
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'sqa_teacher_portal_fixture.php',
  'EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH',
  'teacher accounts',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY',
  'EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY',
  'parent accounts',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE',
  'EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS',
  'EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS',
  'EDUPLATFORM_ENABLE_FINANCE_OPERATIONS',
  'EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS',
  'admin-operations-summary',
  'workspace dashboard',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS',
  'support-communications-summary',
  'parent-teacher messages',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE',
  'EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY',
  'EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT',
  'EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS',
  'academic-quality-summary',
  'course content visibility',
  'assignment/resource lifecycle',
  'gradebook consistency',
  'attendance and progress audit',
  'academic quality controls',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL',
  'security-access-summary',
  'Role boundary checks',
  'Direct URL permission checks',
  'Session expiry/login redirect',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY',
  'notifications-delivery-summary',
  'parent-teacher messages',
  'notification center',
  'email delivery',
  'low-score alerts',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE',
  'data-export-compliance-summary',
  'student record export',
  'parent/guardian data visibility',
  'audit log completeness',
  'CSV/PDF download integrity',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP',
  'data-lifecycle-cleanup-summary',
  'generated students, teachers, and parents',
  'active queues',
  'audit/reporting',
  'delete mode is reported as blocked',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS',
  'failure-workflow-controls-summary',
  'Reject admissions path',
  'Payment failure/partial payment',
  'Transcript blocked when incomplete',
  'Enrollment blocked when capacity full',
  'Missing required fields validation',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS',
  'EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING',
  'EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE',
  'EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX',
  'EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP',
  'institution-governance-summary',
  'Wholly Owned Schools',
  'Franchise Schools',
  'institution_school_functional_test.php',
  'institution_operations_isolation.php',
  'institution_reporting_branding.php',
  'institution_mobility_lifecycle.php',
  'institution_security_matrix.php',
  'institution_communications_isolation.php',
  'institution_academic_isolation.php',
  'institution_readiness_rollup.php',
  'Institution Reporting Rollups',
  'School Branding / Domain / Portal Isolation',
  'Staff Mobility / Transfer Controls',
  'Institution Data Lifecycle',
  'Institution Security / Cross-School Access Matrix',
  'Institution Communications / Notifications Isolation',
  'Institution Academic / Course Isolation',
  'Institution Final Rollup / Readiness',
  'CSV/PDF exports preserve school identifiers',
  'branded portal isolation',
  'owned_branch',
  'franchise_member',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH',
  'cross-role-golden-path-summary',
  'Full Cross-Role Golden Path',
  'admin operations readiness',
  'student journey evidence',
  'parent visibility evidence',
  'teacher classroom evidence',
  'finance receipt evidence',
  'academic progress evidence',
  'support communications evidence',
  'security boundary evidence',
  'compliance export readiness',
  'audit and cleanup readiness',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE',
  'performance-reliability-summary',
  'Dashboard load time',
  'report export time',
  'repeated login/session stability',
  'slow endpoint detection',
  'performance_reliability_smoke.php',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE',
  'accessibility-responsive-summary',
  'mobile widths',
  'visible form controls have labels',
  'keyboard Tab navigation',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT',
  'EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP',
  'EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING',
  'EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS',
  'live-bbb-summary',
  'Live BBB Operations Smoke',
  'Live BBB Meeting Lifecycle',
  'Live BBB Post-Class Evidence',
  'Live BBB Student and Parent Visibility',
  'Live BBB Trust and Retention Audit',
  'Live BBB Instructional Readiness',
  'Live BBB Quality And Leadership Analytics',
  'Live BBB Scheduling Capacity And Calendar',
  'Live BBB Operational Resilience',
  'Live BBB Backup And DR Readiness',
  'Live BBB Retention Controls',
  'Live BBB Consent Availability And Grouping',
  'Live BBB Rollup / Pilot Readiness',
  'BBB configuration',
  'recording review',
  'live session diagnostics',
  'follow-up command center',
  'parent live hub',
  'compliance review pack',
  'retention readiness',
  'Quraan Materials',
  'Virtual Tutor',
  'Practice Coach',
  'QA analytics',
  'Teacher Improvement Plans',
  'Live Lesson Monitor',
  'Live Class Series',
  'Teacher Assignment & Capacity Planning',
  'Teacher Directory',
  'Live Class Calendar',
  'active schedule hiding',
  'Backup/DR readiness',
  'guarded purge execution is blocked',
  'teacher availability',
  'student grouping consent',
  'live_pilot_readiness.php',
  'stale active SQA sessions',
  'final BBB readiness evidence',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'deployment_drift_probe.php',
  'EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN',
  'stale cPanel uploads',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'Full SQA Verification Sweep',
  'test-results/sqa-verification-sweep',
  'package verifier',
  'route smoke',
  'negative controls',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

for (const phrase of [
  'institutionSchoolFunctionalTest',
  '/local/hubredirect/institution_school_functional_test.php',
  'institutionOperationsIsolation',
  '/local/hubredirect/institution_operations_isolation.php',
  'institutionReportingBranding',
  '/local/hubredirect/institution_reporting_branding.php',
  'institutionMobilityLifecycle',
  '/local/hubredirect/institution_mobility_lifecycle.php',
  'institutionSecurityMatrix',
  '/local/hubredirect/institution_security_matrix.php',
  'institutionCommunicationsIsolation',
  '/local/hubredirect/institution_communications_isolation.php',
  'institutionAcademicIsolation',
  '/local/hubredirect/institution_academic_isolation.php',
  'institutionReadinessRollup',
  '/local/hubredirect/institution_readiness_rollup.php',
  'workspaces',
  '/local/hubredirect/workspaces.php',
]) {
  expectIncludes('tests/e2e/helpers/routes.ts', routesHelper, phrase);
  expectIncludes('tests/e2e/institution-governance.spec.ts', institutionGovernanceSpec, phrase);
}

for (const phrase of [
  'enableInstitutionSchoolModels',
  'EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS',
  'enableInstitutionOperationsIsolation',
  'EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION',
  'enableInstitutionReportingBranding',
  'EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING',
  'enableInstitutionMobilityLifecycle',
  'EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE',
  'enableInstitutionSecurityMatrix',
  'EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX',
  'enableInstitutionCommunicationsIsolation',
  'EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION',
  'enableInstitutionAcademicIsolation',
  'EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION',
  'enableInstitutionReadinessRollup',
  'EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP',
]) {
  expectIncludes('tests/e2e/helpers/env.ts', envHelper, phrase);
}

for (const phrase of [
  'owned_branch_institution_admin_can_manage',
  'franchise_admin_has_governance_not_operations',
  'franchise_not_linked_to_owned_group',
  'branch_a_admissions_do_not_leak_to_branch_b',
  'institution_admin_owned_pipeline_rollup_excludes_franchise',
  'parent_billing_visibility_child_school_scoped',
  'institution_owned_school_reports_aggregate_owned_branches',
  'franchise_excluded_from_operational_totals',
  'csv_pdf_exports_preserve_school_identifiers',
  'direct_url_cross_school_portal_blocked',
  'teacher_branch_a_cannot_access_branch_b_without_assignment',
  'teacher_explicit_branch_b_assignment_grants_access',
  'student_transfer_updates_workspace_membership',
  'archived_school_retained_in_institution_audit',
  'student_branch_a_direct_url_branch_b_blocked',
  'institution_admin_owned_rollup_not_franchise_operations',
  'communications_isolation_audit_recorded',
  'institution_owned_announcement_rollup_excludes_franchise',
  'branch_a_course_offering_scoped',
  'institution_owned_academic_rollup_excludes_franchise',
  'institution_phase_7_academic_isolation_evidence',
  'final_institution_readiness_export_available',
]) {
  expectIncludes('tests/e2e/helpers/institution-governance.ts', readText('tests/e2e/helpers/institution-governance.ts'), phrase);
}

for (const phrase of [
  'livePilotReadiness',
  '/local/hubredirect/live_pilot_readiness.php',
]) {
  expectIncludes('tests/e2e/helpers/routes.ts', routesHelper, phrase);
  expectIncludes('tests/e2e/live-bbb.spec.ts', liveBbbSpec, phrase);
}

for (const phrase of [
  'enableLiveBbbPilotReadiness',
  'EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS',
]) {
  expectIncludes('tests/e2e/helpers/env.ts', envHelper, phrase);
}

for (const phrase of [
  'verifyPilotReadinessRollup',
  'LiveBbbPilotReadinessResult',
  'final BBB readiness export',
]) {
  expectIncludes('tests/e2e/helpers/live-bbb.ts', liveBbbHelper, phrase);
}

for (const phrase of [
  'Live BBB Pilot Readiness',
  'Phase 1-12 evidence rollup',
  'No stale active SQA sessions',
]) {
  expectIncludes('src/moodle/local_hubredirect/live_pilot_readiness.php', livePilotReadinessEndpoint, phrase);
}

for (const phrase of [
  'SQA package verifier',
  'SQA route smoke',
  'negativeControlScripts',
  'test-results',
  'sqa-verification-sweep',
]) {
  expectIncludes('tools/run-eduplatform-sqa-verification-sweep.js', sqaVerificationSweep, phrase);
}

for (const phrase of [
  'Evidence Bundle Finalizer',
  'test-results/sqa-evidence-bundles',
  'EDUPLATFORM_EVIDENCE_BUNDLE_LABEL',
  'downloaded CSV/PDF evidence',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, phrase);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, phrase);
}

if (process.exitCode) {
  console.error('EduPlatform SQA package verification failed.');
} else {
  console.log('EduPlatform SQA package verification passed.');
}
