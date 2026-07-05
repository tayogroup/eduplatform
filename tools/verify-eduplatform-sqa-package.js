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
const crossRoleGoldenPathSpec = readText('tests/e2e/cross-role-golden-path.spec.ts');
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
  'test:e2e:cross-role-golden-path',
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
  'test:e2e:cross-role-phase1',
  'test:e2e:cross-role-controls',
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
  'EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH',
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
  'full cross-role golden path live action',
  'cross-role golden path negative controls',
]) {
  expectIncludes('cross-role-golden-path.spec.ts', crossRoleGoldenPathSpec, groupName);
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
  'npm.cmd run test:e2e:cross-role-phase1',
  'npx playwright show-report',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, command);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, command);
}

for (const phrase of [
  'Daily control check',
  'Weekly full journey',
  'Weekly teacher journey',
  'Weekly parent journey',
  'Weekly admin operations',
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

if (process.exitCode) {
  console.error('EduPlatform SQA package verification failed.');
} else {
  console.log('EduPlatform SQA package verification passed.');
}
