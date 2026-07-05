import { expect, test, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { DataLifecycleCleanupPage } from './helpers/data-lifecycle-cleanup';
import { JourneyEvidence } from './helpers/evidence';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';

const DATA_LIFECYCLE_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withDataLifecycleEnv<T>(
  overrides: Partial<Record<(typeof DATA_LIFECYCLE_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of DATA_LIFECYCLE_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of DATA_LIFECYCLE_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function dataLifecycleRunId(): string {
  return `data-lifecycle-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dataLifecycleEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'data-lifecycle-cleanup',
    manifestTitle: 'EduPlatform Data Lifecycle Cleanup Manifest',
  });
}

test.describe('EduPlatform data lifecycle cleanup harness', () => {
  test('validates data lifecycle cleanup configuration and routes', async ({}, testInfo) => {
    await withDataLifecycleEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = dataLifecycleRunId();
      const evidence = dataLifecycleEvidence(testInfo, runId);
      const lifecycleUrl = buildEduPlatformUrl(env, HUB_ROUTES.dataLifecycleCleanup, {
        runid: runId,
        cleanupmode: 'archive',
      });

      evidence.recordStage('data-lifecycle-cleanup-helper-smoke', 'passed', 'Generated lifecycle cleanup route, evidence, and env guards.');
      evidence.recordId('dataLifecycleCleanupUrl', lifecycleUrl);
      const summaryPath = await evidence.writeSummary();

      expect(lifecycleUrl).toContain('/local/hubredirect/data_lifecycle_cleanup.php');
      expect(summaryPath).toContain('data-lifecycle-cleanup-summary.json');
    });
  });

  test.describe('cleanup data lifecycle live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableDataLifecycleCleanup,
      'Set EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP=true to archive generated records and verify audit/report retention.',
    );

    test('archives generated users, invoices, offerings, and materials while preserving audit evidence', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = dataLifecycleRunId();
      const evidence = dataLifecycleEvidence(testInfo, runId);
      const lifecycle = new DataLifecycleCleanupPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await lifecycle.createArchiveAndVerify({
        runId,
        cleanupMode: env.cleanupMode === 'delete' ? 'delete' : 'archive',
        courseKey: env.testCourseKey || 'pre_quraan',
        password: env.studentPassword,
      });

      evidence.recordStage('lifecycle-phase-1-archive-verified', 'passed', lifecycleUrlSummary(result));
      evidence.recordId('studentUserId', String(result.fixture.student.id));
      evidence.recordId('teacherUserId', String(result.fixture.teacher.id));
      evidence.recordId('parentUserId', String(result.fixture.parent.id));
      evidence.recordId('invoiceId', String(result.fixture.invoiceid));
      evidence.recordId('offeringId', String(result.fixture.offeringid));
      evidence.recordId('materialId', String(result.fixture.materialid));
      evidence.recordCleanupAction({
        target: 'data-lifecycle-generated-records',
        identifier: runId,
        mode: env.cleanupMode,
        status: 'completed',
        note: 'Generated student, teacher, parent, invoice, offering, material, and assignment records were archived and audit rows retained.',
      });
      await evidence.screenshot(page, 'lifecycle-phase-1-cleanup-evidence');
      await evidence.attachJson('lifecycle-phase-1-result', result);
      await evidence.writeSummary();

      expect(result.mode).toBe('archive');
    });
  });

  test.describe('data lifecycle cleanup negative controls', () => {
    test('keeps lifecycle cleanup live actions disabled unless explicitly truthy', async () => {
      await withDataLifecycleEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableDataLifecycleCleanup).toBe(false);
      });

      await withDataLifecycleEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableDataLifecycleCleanup).toBe(true);
      });
    });
  });
});

function lifecycleUrlSummary(result: { fixture: { invoiceid: number; offeringid: number; materialid: number }; archived: Record<string, number> }): string {
  return `invoice=${result.fixture.invoiceid}; offering=${result.fixture.offeringid}; material=${result.fixture.materialid}; audit=${JSON.stringify(result.archived)}`;
}
