import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface TimedNavigation {
  name: string;
  url: string;
  durationMs: number;
}

export interface PerformanceReliabilityResult {
  runid: string;
  thresholds: {
    dashboard_ms: number;
    export_ms: number;
    endpoint_ms: number;
  };
  checks: Array<{
    name: string;
    status: 'PASS' | 'CHECK' | 'FAIL';
    duration_ms: number;
    threshold_ms: number;
    evidence: string;
  }>;
}

export interface PerformanceReliabilityParams {
  runId: string;
  dashboardThresholdMs: number;
  exportThresholdMs: number;
  endpointThresholdMs: number;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function paramsFor(options: PerformanceReliabilityParams, extra: RouteParams = {}): RouteParams {
  return {
    runid: options.runId,
    dashboard_ms: options.dashboardThresholdMs,
    export_ms: options.exportThresholdMs,
    endpoint_ms: options.endpointThresholdMs,
    action: 'measure',
    ...extra,
  };
}

export class PerformanceReliabilityPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async timedGoto(name: string, route: string, expectedText: RegExp, params: RouteParams = {}): Promise<TimedNavigation> {
    const url = buildEduPlatformUrl(this.env, route, params);
    const started = Date.now();
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(this.page.locator('body')).toBeVisible();
    const durationMs = Date.now() - started;
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (this.hasLoginOrAccessBlock(bodyText)) {
      throw new Error(
        [
          `Performance/reliability smoke could not access ${name}.`,
          `URL: ${this.page.url()}`,
          `Body: ${bodyText.slice(0, 500)}`,
        ].join('\n'),
      );
    }
    expect(bodyText, `${name} should include ${expectedText}`).toMatch(expectedText);
    return { name, url: this.page.url(), durationMs };
  }

  async expectSessionStable(repetitions: number, thresholdMs: number): Promise<TimedNavigation[]> {
    const results: TimedNavigation[] = [];
    for (let index = 0; index < repetitions; index += 1) {
      const result = await this.timedGoto(`workspace-dashboard-session-${index + 1}`, HUB_ROUTES.workspaceDashboard, /course offerings|student intake|workspace/i);
      expect(result.durationMs, `${result.name} should load within ${thresholdMs}ms`).toBeLessThanOrEqual(thresholdMs);
      results.push(result);
    }
    return results;
  }

  async measureDiagnostics(options: PerformanceReliabilityParams): Promise<PerformanceReliabilityResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.performanceReliabilitySmoke, paramsFor(options)), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await this.expectReady();

    for (const category of [
      'dashboard load time',
      'report export time',
      'repeated login/session stability',
      'slow endpoint detection',
    ]) {
      const row = this.page.locator('table.pqprs-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqprs-result').textContent()) || '{}') as PerformanceReliabilityResult;
    expect(result.runid).toBe(options.runId);
    expect(result.checks.every((check) => check.status === 'PASS')).toBe(true);
    return result;
  }

  async exportEvidenceCsv(options: PerformanceReliabilityParams): Promise<{ durationMs: number; suggestedFilename: string; csvText: string }> {
    const exportUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.performanceReliabilitySmoke, paramsFor(options, { export: 'csv' }));
    const started = Date.now();
    const response = await this.page.context().request.get(exportUrl, { timeout: 60_000 });
    const durationMs = Date.now() - started;
    expect(response.ok(), `CSV export should return HTTP 2xx. Received ${response.status()}`).toBe(true);
    const contentDisposition = response.headers()['content-disposition'] || '';
    const contentType = response.headers()['content-type'] || '';
    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    const suggestedFilename = filenameMatch?.[1] || `performance-reliability-${options.runId}.csv`;
    expect(suggestedFilename).toMatch(/performance-reliability.*\.csv/i);
    expect(contentType).toMatch(/text\/csv|application\/octet-stream/i);
    const csvText = await response.text();
    expect(csvText).toContain('dashboard load time');
    expect(csvText).toContain('slow endpoint detection');
    expect(durationMs, `CSV export should finish within ${options.exportThresholdMs}ms`).toBeLessThanOrEqual(options.exportThresholdMs);
    return { durationMs, suggestedFilename, csvText };
  }

  private async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Performance/reliability smoke endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/performance_reliability_smoke.php to local/hubredirect/performance_reliability_smoke.php, then rerun performance-phase1.',
        ].join('\n'),
      );
    }
    const error = this.page.locator('.pqprs-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Performance/reliability smoke failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByRole('heading', { name: /performance reliability smoke/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqprs-table').first()).toBeVisible();
  }

  private hasLoginOrAccessBlock(bodyText: string): boolean {
    return /invalid login|access denied|permission denied|not authorized|do not have permission|session expired/i.test(bodyText);
  }
}
