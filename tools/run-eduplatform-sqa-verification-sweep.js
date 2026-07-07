const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const npmExecPath = process.env.npm_execpath || '';

const routeSmokeSpecs = [
  'tests/e2e/teacher-journey.spec.ts',
  'tests/e2e/parent-journey.spec.ts',
  'tests/e2e/admin-operations.spec.ts',
  'tests/e2e/support-communications.spec.ts',
  'tests/e2e/academic-quality.spec.ts',
  'tests/e2e/security-access.spec.ts',
  'tests/e2e/notifications-delivery.spec.ts',
  'tests/e2e/data-export-compliance.spec.ts',
  'tests/e2e/data-lifecycle-cleanup.spec.ts',
  'tests/e2e/failure-workflow-controls.spec.ts',
  'tests/e2e/cross-role-golden-path.spec.ts',
  'tests/e2e/performance-reliability.spec.ts',
  'tests/e2e/accessibility-responsive.spec.ts',
  'tests/e2e/live-bbb.spec.ts',
];

const negativeControlScripts = [
  'test:e2e:phase12',
  'test:e2e:teacher-controls',
  'test:e2e:parent-controls',
  'test:e2e:admin-controls',
  'test:e2e:support-controls',
  'test:e2e:academic-controls',
  'test:e2e:security-controls',
  'test:e2e:notifications-controls',
  'test:e2e:compliance-controls',
  'test:e2e:lifecycle-controls',
  'test:e2e:failure-controls',
  'test:e2e:cross-role-controls',
  'test:e2e:performance-controls',
  'test:e2e:accessibility-controls',
  'test:e2e:bbb-controls',
];

function safeEnv() {
  const env = {
    ...process.env,
    EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
    EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
    EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
    EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
    EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
    EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
    EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || 'Mock@001!',
    EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    EDUPLATFORM_CLEANUP_MODE: process.env.EDUPLATFORM_CLEANUP_MODE || 'archive',
  };

  for (const key of Object.keys(env)) {
    if (key.startsWith('EDUPLATFORM_ENABLE_')) {
      env[key] = 'false';
    }
  }

  return env;
}

function npmRunArgs(script) {
  if (npmExecPath) {
    return {
      command: process.execPath,
      args: [npmExecPath, 'run', script],
    };
  }
  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', script],
  };
}

function playwrightArgs(args) {
  const cliPath = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
  return {
    command: process.execPath,
    args: [cliPath, ...args],
  };
}

function runStep(step, env) {
  const startedAt = new Date().toISOString();
  console.log(`\n=== ${step.label} ===`);
  const result = spawnSync(step.command, step.args, {
    cwd: root,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to launch ${step.label}: ${result.error.message}`);
  }

  return {
    label: step.label,
    command: [step.command, ...step.args].join(' '),
    startedAt,
    finishedAt: new Date().toISOString(),
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    signal: result.signal,
    error: result.error ? result.error.message : undefined,
  };
}

function writeSummary(summary) {
  const outDir = path.join(root, 'test-results', 'sqa-verification-sweep');
  fs.mkdirSync(outDir, { recursive: true });
  const filepath = path.join(outDir, `eduplatform-sqa-verification-sweep-${summary.runId}.json`);
  fs.writeFileSync(filepath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\nSQA verification sweep summary: ${filepath}`);
}

function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const env = safeEnv();
  const steps = [
    { label: 'SQA package verifier', ...npmRunArgs('test:e2e:phase13') },
    {
      label: 'SQA route smoke',
      ...playwrightArgs(['test', ...routeSmokeSpecs, '-g', 'validates .*routes']),
    },
    ...negativeControlScripts.map((script) => ({
      label: `${script} negative/control guard`,
      ...npmRunArgs(script),
    })),
  ];

  const summary = {
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    status: 'passed',
    steps: [],
  };

  for (const step of steps) {
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
