import { expect, test, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { JourneyEvidence } from './helpers/evidence';
import { FailureWorkflowControlsPage } from './helpers/failure-workflow-controls';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';

const FAILURE_WORKFLOW_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_INVOICE_LINE_AMOUNT',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withFailureWorkflowEnv<T>(
  overrides: Partial<Record<(typeof FAILURE_WORKFLOW_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of FAILURE_WORKFLOW_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of FAILURE_WORKFLOW_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function failureRunId(): string {
  return `failure-controls-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function failureEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'failure-workflow-controls',
    manifestTitle: 'EduPlatform Failure Workflow Controls Manifest',
  });
}

test.describe('EduPlatform failure workflow controls harness', () => {
  test('validates failure workflow controls configuration and routes', async ({}, testInfo) => {
    await withFailureWorkflowEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
      EDUPLATFORM_INVOICE_LINE_AMOUNT: process.env.EDUPLATFORM_INVOICE_LINE_AMOUNT || '25.00',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = failureRunId();
      const evidence = failureEvidence(testInfo, runId);
      const failureUrl = buildEduPlatformUrl(env, HUB_ROUTES.failureWorkflowControls, {
        runid: runId,
        action: 'create_verify',
      });

      evidence.recordStage('failure-workflow-controls-helper-smoke', 'passed', 'Generated negative workflow route, evidence, and env guards.');
      evidence.recordId('failureWorkflowControlsUrl', failureUrl);
      const summaryPath = await evidence.writeSummary();

      expect(failureUrl).toContain('/local/hubredirect/failure_workflow_controls.php');
      expect(summaryPath).toContain('failure-workflow-controls-summary.json');
    });
  });

  test.describe('failure workflow controls live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableFailureWorkflowControls,
      'Set EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS=true to create and verify negative workflow evidence.',
    );

    test('verifies rejected admissions, partial payment, incomplete transcript block, capacity block, and required field validation', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = failureRunId();
      const evidence = failureEvidence(testInfo, runId);
      const controls = new FailureWorkflowControlsPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await controls.createAndVerify({
        runId,
        courseKey: env.testCourseKey || 'pre_quraan',
        invoiceAmount: env.invoiceLineAmount || '25.00',
        partialAmount: '10.00',
      });

      evidence.recordStage('failure-phase-1-negative-workflows-verified', 'passed', result.controls.map((row) => `${row.category}:${row.status}`).join('; '));
      evidence.recordId('studentUserId', String(result.fixture.student.id));
      evidence.recordId('intakeRequestId', String(result.fixture.intakeid));
      evidence.recordId('invoiceId', String(result.fixture.invoiceid));
      evidence.recordId('offeringId', String(result.fixture.offeringid));
      evidence.recordId('enrollmentRequestId', String(result.fixture.enrollmentrequestid));
      evidence.recordCleanupAction({
        target: 'failure-workflow-generated-records',
        identifier: runId,
        mode: env.cleanupMode,
        status: 'recorded',
        note: 'Negative workflow records are archived or blocked by status and retained for audit/reporting evidence.',
      });
      await evidence.screenshot(page, 'failure-phase-1-controls-evidence');
      await evidence.attachJson('failure-phase-1-result', result);
      await evidence.writeSummary();

      expect(result.controls.every((row) => row.status === 'PASS')).toBe(true);
    });
  });

  test.describe('failure workflow controls negative controls', () => {
    test('keeps failure workflow live actions disabled unless explicitly truthy', async () => {
      await withFailureWorkflowEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableFailureWorkflowControls).toBe(false);
      });

      await withFailureWorkflowEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableFailureWorkflowControls).toBe(true);
      });
    });
  });
});
