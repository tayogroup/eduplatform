import { expect, test, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { JourneyEvidence } from './helpers/evidence';
import {
  PerformanceReliabilityPage,
  type PerformanceReliabilityParams,
} from './helpers/performance-reliability';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';

const PERFORMANCE_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE',
  'EDUPLATFORM_PERFORMANCE_LOAD_THRESHOLD_MS',
  'EDUPLATFORM_PERFORMANCE_EXPORT_THRESHOLD_MS',
  'EDUPLATFORM_PERFORMANCE_ENDPOINT_THRESHOLD_MS',
] as const;

async function withPerformanceEnv<T>(
  overrides: Partial<Record<(typeof PERFORMANCE_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of PERFORMANCE_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of PERFORMANCE_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function performanceRunId(): string {
  return `performance-reliability-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function performanceEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'performance-reliability',
    manifestTitle: 'EduPlatform Performance Reliability Manifest',
  });
}

function numberEnv(key: string, fallback: number): number {
  const raw = (process.env[key] || '').trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function performanceParams(runId: string): PerformanceReliabilityParams {
  return {
    runId,
    dashboardThresholdMs: numberEnv('EDUPLATFORM_PERFORMANCE_LOAD_THRESHOLD_MS', 12_000),
    exportThresholdMs: numberEnv('EDUPLATFORM_PERFORMANCE_EXPORT_THRESHOLD_MS', 15_000),
    endpointThresholdMs: numberEnv('EDUPLATFORM_PERFORMANCE_ENDPOINT_THRESHOLD_MS', 2_500),
  };
}

test.describe('EduPlatform performance reliability harness', () => {
  test('validates performance reliability configuration and routes', async ({}, testInfo) => {
    await withPerformanceEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = performanceRunId();
      const evidence = performanceEvidence(testInfo, runId);
      const smokeUrl = buildEduPlatformUrl(env, HUB_ROUTES.performanceReliabilitySmoke, {
        runid: runId,
        action: 'measure',
      });

      evidence.recordStage('performance-reliability-helper-smoke', 'passed', 'Generated performance/reliability route, evidence, and env guards.');
      evidence.recordId('performanceReliabilitySmokeUrl', smokeUrl);
      const summaryPath = await evidence.writeSummary();

      expect(smokeUrl).toContain('/local/hubredirect/performance_reliability_smoke.php');
      expect(summaryPath).toContain('performance-reliability-summary.json');
    });
  });

  test.describe('performance reliability smoke live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enablePerformanceReliabilitySmoke,
      'Set EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE=true to run dashboard, export, session, and endpoint timing checks.',
    );

    test('verifies dashboard load time, report export time, repeated session stability, and slow endpoint detection', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = performanceRunId();
      const params = performanceParams(runId);
      const evidence = performanceEvidence(testInfo, runId);
      const smoke = new PerformanceReliabilityPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('performance-phase-1-login', 'passed', env.adminUsername);

      const dashboard = await smoke.timedGoto('workspace-dashboard', HUB_ROUTES.workspaceDashboard, /course offerings|student intake|workspace/i);
      expect(dashboard.durationMs).toBeLessThanOrEqual(params.dashboardThresholdMs);
      evidence.recordStage('performance-phase-1-dashboard-load-time', 'passed', `${dashboard.durationMs}ms`);

      const sessionResults = await smoke.expectSessionStable(3, params.dashboardThresholdMs);
      evidence.recordStage('performance-phase-1-repeated-login-session-stability', 'passed', sessionResults.map((item) => `${item.name}=${item.durationMs}ms`).join('; '));

      const diagnostics = await smoke.measureDiagnostics(params);
      evidence.recordStage('performance-phase-1-slow-endpoint-detection', 'passed', `${diagnostics.checks.length} checks`);
      await evidence.screenshot(page, 'performance-phase-1-diagnostics');

      const csv = await smoke.exportEvidenceCsv(params);
      const csvPath = testInfo.outputPath(csv.suggestedFilename);
      await writeFile(csvPath, csv.csvText, 'utf8');
      await testInfo.attach('performance-phase-1-report-export-csv', {
        path: csvPath,
        contentType: 'text/csv',
      });
      evidence.recordStage('performance-phase-1-report-export-time', 'passed', `${csv.durationMs}ms; ${csv.suggestedFilename}`);
      evidence.recordId('dashboardLoadMs', dashboard.durationMs);
      evidence.recordId('reportExportMs', csv.durationMs);
      evidence.recordId('endpointThresholdMs', params.endpointThresholdMs);
      await evidence.attachJson('performance-phase-1-diagnostics', diagnostics);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('performance-phase-1-logout', 'passed');
      await evidence.writeSummary();
    });
  });

  test.describe('performance reliability negative controls', () => {
    test('keeps performance reliability live actions disabled unless explicitly truthy', async () => {
      await withPerformanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enablePerformanceReliabilitySmoke).toBe(false);
      });

      await withPerformanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enablePerformanceReliabilitySmoke).toBe(true);
      });
    });
  });
});
