const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const npmExecPath = process.env.npm_execpath || '';
const mode = (process.argv[2] || 'daily').toLowerCase();

const dailyPlan = [
  { script: 'test:e2e:phase11', label: 'student reporting and cleanup readiness' },
  { script: 'test:e2e:phase12', label: 'student negative controls' },
  { script: 'test:e2e:teacher-controls', label: 'teacher negative controls' },
  { script: 'test:e2e:parent-controls', label: 'parent negative controls' },
  { script: 'test:e2e:admin-controls', label: 'admin negative controls' },
  { script: 'test:e2e:support-controls', label: 'support negative controls' },
  { script: 'test:e2e:academic-controls', label: 'academic negative controls' },
  { script: 'test:e2e:security-controls', label: 'security negative controls' },
  { script: 'test:e2e:notifications-controls', label: 'notifications negative controls' },
  { script: 'test:e2e:compliance-controls', label: 'data export compliance negative controls' },
  { script: 'test:e2e:lifecycle-controls', label: 'data lifecycle negative controls' },
  { script: 'test:e2e:failure-controls', label: 'failure workflow negative controls' },
  { script: 'test:e2e:cross-role-controls', label: 'cross-role negative controls' },
  { script: 'test:e2e:performance-controls', label: 'performance reliability negative controls' },
  { script: 'test:e2e:accessibility-controls', label: 'accessibility responsive negative controls' },
  { script: 'test:e2e:bbb-controls', label: 'live BBB negative controls' },
  { script: 'test:e2e:phase13', label: 'SQA package verifier' },
];

const weeklyPlan = [
  { script: 'test:e2e:phase10', label: 'student full journey', flags: { EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY: 'true' } },
  { script: 'test:e2e:teacher-phase5', label: 'teacher golden path', flags: { EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH: 'true' } },
  { script: 'test:e2e:parent-phase2', label: 'parent paid billing visibility', flags: { EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY: 'true' } },
  { script: 'test:e2e:admin-phase5', label: 'admin reporting and audit operations', flags: { EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS: 'true' } },
  { script: 'test:e2e:support-phase1', label: 'support communications', flags: { EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS: 'true' } },
  { script: 'test:e2e:academic-phase5', label: 'academic quality controls', flags: { EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS: 'true' } },
  { script: 'test:e2e:security-phase1', label: 'security access control', flags: { EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL: 'true' } },
  { script: 'test:e2e:notifications-phase1', label: 'notifications delivery', flags: { EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY: 'true' } },
  { script: 'test:e2e:compliance-phase1', label: 'data export compliance', flags: { EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE: 'true' } },
  { script: 'test:e2e:lifecycle-phase1', label: 'data lifecycle cleanup', flags: { EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP: 'true' } },
  { script: 'test:e2e:failure-phase1', label: 'failure workflow controls', flags: { EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS: 'true' } },
  { script: 'test:e2e:cross-role-phase1', label: 'full cross-role golden path', flags: { EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH: 'true' } },
  { script: 'test:e2e:performance-phase1', label: 'performance reliability smoke', flags: { EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE: 'true' } },
  { script: 'test:e2e:accessibility-phase1', label: 'accessibility responsive smoke', flags: { EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE: 'true' } },
  { script: 'test:e2e:bbb-phase1', label: 'live BBB operations smoke', flags: { EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE: 'true' } },
];

function selectedWeeklyPlan() {
  const raw = process.env.EDUPLATFORM_SQA_WEEKLY_PHASES || '';
  const requested = raw.split(',').map((value) => value.trim()).filter(Boolean);
  if (!requested.length) {
    return weeklyPlan;
  }

  const known = new Map(weeklyPlan.map((item) => [item.script, item]));
  const selected = [];
  for (const script of requested) {
    const item = known.get(script);
    if (!item) {
      throw new Error(`Unknown weekly SQA phase "${script}". Known phases: ${weeklyPlan.map((phase) => phase.script).join(', ')}`);
    }
    selected.push(item);
  }
  return selected;
}

function ensureWeeklyLiveAllowed() {
  if (process.env.EDUPLATFORM_SQA_ALLOW_LIVE_WEEKLY !== 'true') {
    throw new Error('Weekly live SQA runner is blocked. Set EDUPLATFORM_SQA_ALLOW_LIVE_WEEKLY=true only in the approved SQA workspace.');
  }
}

function ensureRequiredEnv() {
  const required = ['EDUPLATFORM_BASE_URL', 'EDUPLATFORM_CONSUMER', 'EDUPLATFORM_WORKSPACE_ID', 'EDUPLATFORM_ADMIN_USERNAME', 'EDUPLATFORM_ADMIN_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required SQA environment variables: ${missing.join(', ')}`);
  }
}

function runStep(step, env) {
  const startedAt = new Date().toISOString();
  console.log(`\n=== ${step.script}: ${step.label} ===`);
  const command = npmExecPath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = npmExecPath ? [npmExecPath, 'run', step.script] : ['run', step.script];
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`Failed to launch ${step.script}: ${result.error.message}`);
  }
  return {
    script: step.script,
    label: step.label,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    signal: result.signal,
    error: result.error ? result.error.message : undefined,
  };
}

function writeSummary(summary) {
  const outDir = path.join(root, 'test-results', 'sqa-schedule');
  fs.mkdirSync(outDir, { recursive: true });
  const filename = `eduplatform-sqa-${summary.mode}-${summary.runId}.json`;
  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\nSQA schedule summary: ${filepath}`);
}

function main() {
  const plan = mode === 'daily' ? dailyPlan : mode === 'weekly' ? selectedWeeklyPlan() : null;
  if (!plan) {
    throw new Error('Usage: node tools/run-eduplatform-sqa-schedule.js <daily|weekly>');
  }

  if (mode === 'weekly') {
    ensureWeeklyLiveAllowed();
    ensureRequiredEnv();
  }

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const summary = {
    mode,
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    status: 'passed',
    steps: [],
  };

  for (const step of plan) {
    const env = {
      ...process.env,
      EDUPLATFORM_CLEANUP_MODE: process.env.EDUPLATFORM_CLEANUP_MODE || 'archive',
      EDUPLATFORM_INVOICE_LINE_AMOUNT: process.env.EDUPLATFORM_INVOICE_LINE_AMOUNT || '25.00',
      EDUPLATFORM_COMPLETION_SCORE_PERCENT: process.env.EDUPLATFORM_COMPLETION_SCORE_PERCENT || '95',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
      EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || '',
      ...(step.flags || {}),
    };
    const result = runStep(step, env);
    summary.steps.push(result);
    if (result.status !== 'passed') {
      summary.status = 'failed';
      break;
    }
  }

  summary.finishedAt = new Date().toISOString();
  writeSummary(summary);
  if (summary.status !== 'passed') {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
