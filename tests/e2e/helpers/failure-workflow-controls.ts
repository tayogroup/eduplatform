import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface FailureWorkflowControlsParams {
  runId: string;
  courseKey: string;
  invoiceAmount: string;
  partialAmount: string;
}

export interface FailureWorkflowControlsResult {
  runid: string;
  token: string;
  fixture: {
    student: { id: number; username: string; email: string };
    intakeid: number;
    invoiceid: number;
    offeringid: number;
    enrollmentrequestid: number;
  };
  controls: Array<{ category: string; status: string; evidence: string }>;
  audit: Record<string, number>;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function routeParams(params: FailureWorkflowControlsParams): RouteParams {
  return {
    runid: params.runId,
    coursekey: params.courseKey,
    invoiceamount: params.invoiceAmount,
    partialamount: params.partialAmount,
    action: 'create_verify',
  };
}

export class FailureWorkflowControlsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: FailureWorkflowControlsParams): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.failureWorkflowControls, routeParams(params)), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Failure workflow controls endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/failure_workflow_controls.php to local/hubredirect/failure_workflow_controls.php, then rerun failure-phase1.',
        ].join('\n'),
      );
    }
    const error = this.page.locator('.pqfwc-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Failure workflow controls failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByRole('heading', { name: /failure workflow controls/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqfwc-table').first()).toBeVisible();
  }

  async createAndVerify(params: FailureWorkflowControlsParams): Promise<FailureWorkflowControlsResult> {
    await this.goto(params);
    await this.expectReady();
    for (const category of [
      'reject admissions path',
      'payment failure/partial payment',
      'transcript blocked when incomplete',
      'enrollment blocked when capacity full',
      'missing required fields validation',
      'audit evidence retained',
    ]) {
      const row = this.page.locator('table.pqfwc-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }
    const result = JSON.parse((await this.page.locator('#pqfwc-result').textContent()) || '{}') as FailureWorkflowControlsResult;
    expect(result.runid).toBe(params.runId);
    expect(result.fixture.student.username).toContain('failure.student');
    expect(result.fixture.invoiceid).toBeGreaterThan(0);
    expect(result.fixture.offeringid).toBeGreaterThan(0);
    return result;
  }
}
