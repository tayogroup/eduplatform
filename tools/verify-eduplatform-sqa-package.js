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
const phase11Runbook = readText('docs/eduplatform-sqa-phase-11-runbook.md');
const operatorChecklist = readText('docs/eduplatform-sqa-operator-checklist.md');

const expectedScripts = [
  'test:e2e:student-journey',
  'test:e2e:teacher-journey',
  'test:e2e:setup-public-course',
  'test:e2e:teacher-phase1',
  'test:e2e:teacher-phase2',
  'test:e2e:teacher-phase3',
  'test:e2e:teacher-phase4',
  'test:e2e:teacher-phase5',
  'test:e2e:teacher-controls',
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

for (const command of [
  'npm.cmd run test:e2e:phase10',
  'npm.cmd run test:e2e:phase11',
  'npm.cmd run test:e2e:phase12',
  'npm.cmd run test:e2e:teacher-phase5',
  'npx playwright show-report',
]) {
  expectIncludes('docs/eduplatform-sqa-phase-11-runbook.md', phase11Runbook, command);
  expectIncludes('docs/eduplatform-sqa-operator-checklist.md', operatorChecklist, command);
}

for (const phrase of [
  'Daily control check',
  'Weekly full journey',
  'Weekly teacher journey',
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

if (process.exitCode) {
  console.error('EduPlatform SQA package verification failed.');
} else {
  console.log('EduPlatform SQA package verification passed.');
}
