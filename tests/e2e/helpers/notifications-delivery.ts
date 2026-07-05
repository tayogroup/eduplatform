import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';

export interface NotificationDeliveryAuditParams {
  runId: string;
  studentId: string | number;
  parentId: string | number;
  teacherId: string | number;
  invoiceId: string | number;
  sessionId: string | number;
  assessmentId: string | number;
}

export interface NotificationDeliveryAuditResult {
  finalUrl: string;
  pageText: string;
}

export interface NotificationDeliveryDownloadResult {
  suggestedFilename: string;
  url: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function routeParams(params: NotificationDeliveryAuditParams): RouteParams {
  return {
    runid: params.runId,
    studentid: params.studentId,
    parentid: params.parentId,
    teacherid: params.teacherId,
    invoiceid: params.invoiceId,
    sessionid: params.sessionId,
    assessmentid: params.assessmentId,
  };
}

export class NotificationDeliveryAuditPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: NotificationDeliveryAuditParams): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.notificationDeliveryAudit, routeParams(params)), {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Notification delivery audit endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/notification_delivery_audit.php to local/hubredirect/notification_delivery_audit.php, then rerun notifications-phase1.',
        ].join('\n'),
      );
    }
    await expect(this.page.getByRole('heading', { name: /notification delivery audit/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqnda-table').first()).toBeVisible();
    expect(bodyText).toMatch(/notification-center|email-delivery|log evidence/i);
  }

  async expectDeliveryEvidence(params: NotificationDeliveryAuditParams): Promise<NotificationDeliveryAuditResult> {
    await this.goto(params);
    await this.expectReady();

    for (const category of [
      'parent-teacher message notification',
      'announcement notification',
      'email delivery log evidence',
      'invoice notification',
      'invoice notification audit',
      'attendance notification',
      'grade notification',
      'low-score alert notification',
    ]) {
      const row = this.page.locator('table.pqnda-table tbody tr', { hasText: category }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    return {
      finalUrl: this.page.url(),
      pageText: normalize((await this.page.locator('body').textContent()) || ''),
    };
  }

  async downloadCsv(params: NotificationDeliveryAuditParams): Promise<NotificationDeliveryDownloadResult> {
    await this.goto(params);
    await this.expectReady();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/notification-delivery-audit.*\.csv/i);
    return {
      suggestedFilename,
      url: download.url(),
    };
  }
}
