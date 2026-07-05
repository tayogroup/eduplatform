import { expect, test, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { CrossRoleGoldenPathPage } from './helpers/cross-role-golden-path';
import { JourneyEvidence } from './helpers/evidence';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';

const CROSS_ROLE_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_INVOICE_LINE_AMOUNT',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withCrossRoleEnv<T>(
  overrides: Partial<Record<(typeof CROSS_ROLE_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of CROSS_ROLE_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of CROSS_ROLE_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function crossRoleRunId(): string {
  return `cross-role-golden-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function crossRoleEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'cross-role-golden-path',
    manifestTitle: 'EduPlatform Full Cross-Role Golden Path Manifest',
  });
}

test.describe('EduPlatform cross-role golden path harness', () => {
  test('validates cross-role golden path configuration and routes', async ({}, testInfo) => {
    await withCrossRoleEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
      EDUPLATFORM_INVOICE_LINE_AMOUNT: process.env.EDUPLATFORM_INVOICE_LINE_AMOUNT || '25.00',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = crossRoleRunId();
      const evidence = crossRoleEvidence(testInfo, runId);
      const crossRoleUrl = buildEduPlatformUrl(env, HUB_ROUTES.crossRoleGoldenPath, {
        runid: runId,
        action: 'create_verify',
      });

      evidence.recordStage('cross-role-golden-path-helper-smoke', 'passed', 'Generated cross-role golden path route, evidence, and env guards.');
      evidence.recordId('crossRoleGoldenPathUrl', crossRoleUrl);
      const summaryPath = await evidence.writeSummary();

      expect(crossRoleUrl).toContain('/local/hubredirect/cross_role_golden_path.php');
      expect(summaryPath).toContain('cross-role-golden-path-summary.json');
    });
  });

  test.describe('full cross-role golden path live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableCrossRoleGoldenPath,
      'Set EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH=true to create and verify the full cross-role golden path.',
    );

    test('verifies admin, student, parent, teacher, finance, academic, support, security, compliance, and cleanup evidence', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = crossRoleRunId();
      const evidence = crossRoleEvidence(testInfo, runId);
      const crossRole = new CrossRoleGoldenPathPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await crossRole.createAndVerify({
        runId,
        courseKey: env.testCourseKey || 'pre_quraan',
        invoiceAmount: env.invoiceLineAmount || '25.00',
        cleanupMode: env.cleanupMode,
      });

      evidence.recordStage('cross-role-phase-1-golden-path-verified', 'passed', result.checkpoints.map((row) => `${row.category}:${row.status}`).join('; '));
      evidence.recordId('studentUserId', String(result.fixture.student.id));
      evidence.recordId('parentUserId', String(result.fixture.parent.id));
      evidence.recordId('teacherUserId', String(result.fixture.teacher.id));
      evidence.recordId('invoiceId', String(result.fixture.invoiceid));
      evidence.recordId('offeringId', String(result.fixture.offeringid));
      evidence.recordId('sessionId', String(result.fixture.sessionid));
      evidence.recordId('assessmentId', String(result.fixture.assessmentid));
      evidence.recordCleanupAction({
        target: 'cross-role-golden-path-generated-records',
        identifier: runId,
        mode: env.cleanupMode,
        status: env.cleanupMode === 'delete' ? 'blocked' : 'recorded',
        note: env.cleanupMode === 'delete'
          ? 'Delete cleanup is blocked for audit-retained cross-role golden path records.'
          : 'Generated cross-role records are tagged for archive cleanup and audit retention.',
      });
      await evidence.screenshot(page, 'cross-role-phase-1-golden-path-evidence');
      await evidence.attachJson('cross-role-phase-1-result', result);
      await evidence.writeSummary();

      expect(result.audit.live + result.audit.course + result.audit.finance).toBeGreaterThan(0);
    });
  });

  test.describe('cross-role golden path negative controls', () => {
    test('keeps cross-role golden path live actions disabled unless explicitly truthy', async () => {
      await withCrossRoleEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableCrossRoleGoldenPath).toBe(false);
      });

      await withCrossRoleEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableCrossRoleGoldenPath).toBe(true);
      });
    });
  });
});
