import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface DataLifecycleCleanupParams {
  runId: string;
  cleanupMode: 'archive' | 'delete' | 'none';
  courseKey: string;
  password: string;
}

export interface DataLifecycleCleanupResult {
  mode: string;
  runid: string;
  fixture: {
    student: { id: number; username: string; email: string };
    teacher: { id: number; username: string; email: string };
    parent: { id: number; username: string; email: string };
    invoiceid: number;
    offeringid: number;
    materialid: number;
    assignmentid: number;
  };
  active_after: Record<string, number>;
  archived: Record<string, number>;
  counts: Record<string, number>;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function lifecycleParams(params: DataLifecycleCleanupParams): RouteParams {
  return {
    runid: params.runId,
    cleanupmode: params.cleanupMode,
    coursekey: params.courseKey,
    password: params.password,
    action: 'create_archive_verify',
  };
}

export class DataLifecycleCleanupPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: DataLifecycleCleanupParams): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.dataLifecycleCleanup, lifecycleParams(params)), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Data lifecycle cleanup endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/data_lifecycle_cleanup.php to local/hubredirect/data_lifecycle_cleanup.php, then rerun lifecycle-phase1.',
        ].join('\n'),
      );
    }
    const error = this.page.locator('.pqdlc-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Data lifecycle cleanup failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByRole('heading', { name: /data lifecycle cleanup/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqdlc-table').first()).toBeVisible();
  }

  async createArchiveAndVerify(params: DataLifecycleCleanupParams): Promise<DataLifecycleCleanupResult> {
    await this.goto(params);
    await this.expectReady();
    for (const category of [
      'generated people lifecycle',
      'invoice lifecycle',
      'course offering lifecycle',
      'materials lifecycle',
      'active queues hidden',
      'audit reporting retained',
      'delete policy',
    ]) {
      const row = this.page.locator('table.pqdlc-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }
    const result = JSON.parse((await this.page.locator('#pqdlc-result').textContent()) || '{}') as DataLifecycleCleanupResult;
    expect(result.mode).toBe('archive');
    expect(result.fixture.student.username).toContain('lifecycle.student');
    expect(Object.values(result.active_after).reduce((sum, value) => sum + Number(value || 0), 0)).toBe(0);
    expect(Number(result.archived.retained_live_audit || 0) + Number(result.archived.retained_course_audit || 0) + Number(result.archived.retained_finance_audit || 0)).toBeGreaterThan(0);
    return result;
  }
}
