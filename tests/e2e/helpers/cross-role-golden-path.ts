import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface CrossRoleGoldenPathParams {
  runId: string;
  courseKey: string;
  invoiceAmount: string;
  cleanupMode: 'archive' | 'delete' | 'none';
}

export interface CrossRoleGoldenPathResult {
  runid: string;
  fixture: {
    student: { id: number; username: string; email: string };
    parent: { id: number; username: string; email: string };
    teacher: { id: number; username: string; email: string };
    invoiceid: number;
    offeringid: number;
    sessionid: number;
    assessmentid: number;
    threadid: number;
  };
  checkpoints: Array<{ category: string; status: string; evidence: string }>;
  audit: Record<string, number>;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function routeParams(params: CrossRoleGoldenPathParams): RouteParams {
  return {
    runid: params.runId,
    coursekey: params.courseKey,
    invoiceamount: params.invoiceAmount,
    cleanupmode: params.cleanupMode,
    action: 'create_verify',
  };
}

export class CrossRoleGoldenPathPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: CrossRoleGoldenPathParams): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.crossRoleGoldenPath, routeParams(params)), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Cross-role golden path endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/cross_role_golden_path.php to local/hubredirect/cross_role_golden_path.php, then rerun cross-role-phase1.',
        ].join('\n'),
      );
    }
    const error = this.page.locator('.pqcrgp-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Cross-role golden path failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByRole('heading', { name: /full cross-role golden path/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqcrgp-table').first()).toBeVisible();
  }

  async createAndVerify(params: CrossRoleGoldenPathParams): Promise<CrossRoleGoldenPathResult> {
    await this.goto(params);
    await this.expectReady();
    for (const category of [
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
      const row = this.page.locator('table.pqcrgp-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      const rowText = normalize((await row.textContent()) || '');
      if (category === 'compliance export readiness' && /live_audit=/i.test(rowText)) {
        throw new Error(
          [
            'Cross-role golden path endpoint is stale on the target EduPlatform server.',
            `Received legacy compliance evidence: ${rowText}`,
            'Upload the current src/moodle/local_hubredirect/cross_role_golden_path.php to local/hubredirect/cross_role_golden_path.php, then rerun cross-role-phase1.',
          ].join('\n'),
        );
      }
      await expect(row).toContainText(/PASS/i);
    }
    const result = JSON.parse((await this.page.locator('#pqcrgp-result').textContent()) || '{}') as CrossRoleGoldenPathResult;
    expect(result.runid).toBe(params.runId);
    expect(result.fixture.student.username).toContain('crossrole.student');
    expect(result.fixture.parent.username).toContain('crossrole.parent');
    expect(result.fixture.teacher.username).toContain('crossrole.teacher');
    expect(result.checkpoints.every((row) => row.status === 'PASS')).toBe(true);
    return result;
  }
}
