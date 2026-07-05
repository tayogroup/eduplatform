import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface DataExportComplianceParams {
  runId: string;
  studentId: string | number;
  parentId: string | number;
  teacherId: string | number;
  sessionId: string | number;
  assessmentId: string | number;
}

export interface DataExportComplianceResult {
  finalUrl: string;
  pageText: string;
}

export interface DataExportDownloadResult {
  suggestedFilename: string;
  url: string;
  byteLength: number;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function routeParams(params: DataExportComplianceParams): RouteParams {
  return {
    runid: params.runId,
    studentid: params.studentId,
    parentid: params.parentId,
    teacherid: params.teacherId,
    sessionid: params.sessionId,
    assessmentid: params.assessmentId,
  };
}

export class DataExportCompliancePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: DataExportComplianceParams): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.dataExportCompliance, routeParams(params)), {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Data export compliance endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/data_export_compliance.php to local/hubredirect/data_export_compliance.php, then rerun compliance-phase1.',
        ].join('\n'),
      );
    }
    await expect(this.page.getByRole('heading', { name: /data export compliance/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqdxc-table').first()).toBeVisible();
    expect(bodyText).toMatch(/student record export/i);
    expect(bodyText).toMatch(/guardian visibility|parent\/guardian data visibility/i);
  }

  async expectComplianceEvidence(params: DataExportComplianceParams): Promise<DataExportComplianceResult> {
    await this.goto(params);
    await this.expectReady();

    for (const category of [
      'student record export',
      'parent/guardian data visibility',
      'audit log completeness',
    ]) {
      const row = this.page.locator('table.pqdxc-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    return {
      finalUrl: this.page.url(),
      pageText: normalize((await this.page.locator('body').textContent()) || ''),
    };
  }

  async downloadCsv(params: DataExportComplianceParams): Promise<DataExportDownloadResult> {
    await this.goto(params);
    await this.expectReady();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/data-export-compliance.*\.csv/i);
    const path = await download.path();
    if (!path) {
      throw new Error(`CSV download did not expose a local path: ${suggestedFilename}`);
    }
    const content = await readFile(path, 'utf8');
    expect(content).toContain('student record export');
    expect(content).toContain('audit log completeness');
    return {
      suggestedFilename,
      url: download.url(),
      byteLength: Buffer.byteLength(content),
    };
  }

  async downloadPdf(params: DataExportComplianceParams): Promise<DataExportDownloadResult> {
    await this.goto(params);
    await this.expectReady();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export pdf/i }).click(),
    ]);
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/data-export-compliance.*\.pdf/i);
    const path = await download.path();
    if (!path) {
      throw new Error(`PDF download did not expose a local path: ${suggestedFilename}`);
    }
    const content = await readFile(path);
    expect(content.subarray(0, 4).toString('utf8')).toBe('%PDF');
    expect(content.byteLength).toBeGreaterThan(500);
    return {
      suggestedFilename,
      url: download.url(),
      byteLength: content.byteLength,
    };
  }
}
