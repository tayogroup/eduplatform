import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface SupportCommunicationsResult {
  subject: string;
  caseTitle: string;
  campaignTitle: string;
  templateKey: string;
  consentStatus: 'saved' | 'blocked';
  consentNote: string;
  finalUrl: string;
}

export interface SupportReportResult {
  finalUrl: string;
  pageText: string;
}

export interface SupportDownloadResult {
  suggestedFilename: string;
  url: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function selectIfOptionExists(page: Page, selector: string, value: string): Promise<void> {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();
  const values = await locator.locator('option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  if (!values.includes(value)) {
    throw new Error(`Option ${value} was not available for ${selector}. Available: ${values.join(', ')}`);
  }
  await locator.selectOption(value);
}

export class CommunicationsCenterPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.communicationsCenter), { waitUntil: 'domcontentloaded' });
  }

  async expectReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /communications center/i }).first()).toBeVisible();
    await expect(this.page.locator('form:has(input[name="action"][value="send_message"])').first()).toBeVisible();
    await expect(this.page.locator('form:has(input[name="action"][value="save_case"])').first()).toBeVisible();
    await expect(this.page.locator('form:has(input[name="action"][value="save_campaign"])').first()).toBeVisible();
  }

  async expectTeacherReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /communications center/i }).first()).toBeVisible();
    await expect(this.page.locator('table.pqcom-table').first()).toBeVisible();
  }

  async createCaseMessageAnnouncementAndConsent(options: {
    runId: string;
    studentUserId: string;
    parentUserId: string;
    teacherUserId: string;
  }): Promise<SupportCommunicationsResult> {
    await this.goto();
    await this.expectReady();

    const caseTitle = `SQA Support Case ${options.runId}`;
    const caseSummary = `Automated SQA support follow-up case for ${options.runId}.`;
    const caseForm = this.page.locator('form:has(input[name="action"][value="save_case"])').first();
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="save_case"]) select[name="studentid"]', options.studentUserId);
    await caseForm.locator('input[name="title"]').fill(caseTitle);
    await caseForm.locator('input[name="case_type"]').fill('followup');
    await caseForm.locator('input[name="priority"]').fill('normal');
    await caseForm.locator('input[name="status"]').fill('open');
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="save_case"]) select[name="ownerid"]', options.teacherUserId);
    await caseForm.locator('textarea[name="summary"]').fill(caseSummary);
    await caseForm.getByRole('button', { name: /save case/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/case opened/i).first()).toBeVisible();
    await expect(this.page.locator('table.pqcom-table', { hasText: caseTitle }).first()).toBeVisible();

    const subject = `SQA Parent Teacher Message ${options.runId}`;
    const body = `Automated SQA parent-teacher follow-up evidence for ${options.runId}.`;
    const messageForm = this.page.locator('form:has(input[name="action"][value="send_message"])').first();
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="send_message"]) select[name="studentid"]', options.studentUserId);
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="send_message"]) select[name="parentid"]', options.parentUserId);
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="send_message"]) select[name="teacherid"]', options.teacherUserId);
    const caseOptionValue = await messageForm.locator('select[name="caseid"] option', { hasText: caseTitle }).first().getAttribute('value');
    if (caseOptionValue) {
      await messageForm.locator('select[name="caseid"]').selectOption(caseOptionValue);
    }
    await messageForm.locator('select[name="thread_type"]').selectOption('parent_teacher');
    await messageForm.locator('input[name="subject"]').fill(subject);
    await messageForm.locator('textarea[name="body"]').fill(body);
    await messageForm.getByRole('button', { name: /send message/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/message thread #\d+ created/i).first()).toBeVisible();
    await expect(this.page.locator('table.pqcom-table', { hasText: subject }).first()).toBeVisible();
    await expect(this.page.locator('table.pqcom-table', { hasText: body }).first()).toBeVisible();

    const templateKey = `sqa_${options.runId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`.slice(0, 80);
    const templateTitle = `SQA Follow-up Template ${options.runId}`;
    const templateForm = this.page.locator('form:has(input[name="action"][value="save_template"])').first();
    await templateForm.locator('input[name="templatekey"]').fill(templateKey);
    await templateForm.locator('input[name="title"]').fill(templateTitle);
    await templateForm.locator('input[name="subject"]').fill(`SQA announcement ${options.runId}`);
    await templateForm.locator('input[name="status"]').fill('active');
    await templateForm.locator('select[name="channel"]').selectOption('email');
    await templateForm.locator('textarea[name="body"]').fill(`Automated SQA announcement template for ${options.runId}.`);
    await templateForm.getByRole('button', { name: /save template/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/communication template saved/i).first()).toBeVisible();

    const campaignTitle = `SQA Announcement ${options.runId}`;
    const campaignForm = this.page.locator('form:has(input[name="action"][value="save_campaign"])').first();
    await campaignForm.locator('input[name="title"]').fill(campaignTitle);
    const templateValue = await campaignForm.locator('select[name="templateid"] option', { hasText: templateTitle }).first().getAttribute('value');
    if (templateValue) {
      await campaignForm.locator('select[name="templateid"]').selectOption(templateValue);
    }
    await campaignForm.locator('select[name="channel"]').selectOption('email');
    await campaignForm.locator('select[name="audience"]').selectOption('parents');
    await campaignForm.locator('input[name="status"]').fill('queued');
    await campaignForm.locator('textarea[name="messagebody"]').fill(`Automated SQA parent announcement for ${options.runId}.`);
    await campaignForm.getByRole('button', { name: /queue campaign/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/campaign queued with/i).first()).toBeVisible();
    await expect(this.page.locator('table.pqcom-table', { hasText: campaignTitle }).first()).toBeVisible();

    const consentForm = this.page.locator('form:has(input[name="action"][value="save_consent"])').first();
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="save_consent"]) select[name="studentid"]', options.studentUserId);
    await selectIfOptionExists(this.page, 'form:has(input[name="action"][value="save_consent"]) select[name="guardianid"]', options.parentUserId);
    await consentForm.locator('select[name="channel"]').selectOption('email');
    await consentForm.locator('input[name="consented"]').check();
    await consentForm.locator('input[name="source"]').fill('sqa');
    await consentForm.locator('textarea[name="notes"]').fill(`Automated SQA consent evidence for ${options.runId}.`);
    await consentForm.getByRole('button', { name: /save consent/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    let consentStatus: SupportCommunicationsResult['consentStatus'] = 'saved';
    let consentNote = 'Communication consent saved.';
    const consentError = this.page.locator('.pqcom-error').first();
    if (await consentError.isVisible().catch(() => false)) {
      consentStatus = 'blocked';
      consentNote = `Consent save blocked by live schema: ${normalize((await consentError.textContent()) || '')}`;
    } else {
      await expect(this.page.getByText(/communication consent saved/i).first()).toBeVisible();
      await expect(this.page.locator('table.pqcom-table', { hasText: 'consented' }).first()).toBeVisible();
    }

    return {
      subject,
      caseTitle,
      campaignTitle,
      templateKey,
      consentStatus,
      consentNote,
      finalUrl: this.page.url(),
    };
  }

  async expectTeacherCanSeeThread(subject: string): Promise<string> {
    await this.goto();
    await this.expectTeacherReady();
    await expect(this.page.locator('table.pqcom-table', { hasText: subject }).first()).toBeVisible();
    return normalize((await this.page.locator('body').textContent()) || '');
  }
}

export class SupportOperationsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectSupportInbox(): Promise<SupportReportResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.support), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /support/i }).first()).toBeVisible();
    await expect(this.page.getByRole('button', { name: /open support/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /new request/i })).toBeVisible();
    const pageText = normalize((await this.page.locator('body').textContent()) || '');
    return { finalUrl: this.page.url(), pageText };
  }

  async expectSupportReports(query: string): Promise<SupportReportResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.supportReports, {
      q: query,
      status: 'all',
      category: 'all',
    }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /support reports/i }).first()).toBeVisible();
    const pageText = normalize((await this.page.locator('body').textContent()) || '');
    expect(pageText).toContain('Open tickets');
    expect(pageText).toContain('Quality Review Queue');
    return { finalUrl: this.page.url(), pageText };
  }

  async downloadSupportReportsCsv(query: string): Promise<SupportDownloadResult> {
    await this.expectSupportReports(query);
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    return {
      suggestedFilename: download.suggestedFilename(),
      url: this.page.url(),
    };
  }

  async expectSupportAudit(): Promise<SupportReportResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.supportAudit), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /support audit review/i }).first()).toBeVisible();
    const pageText = normalize((await this.page.locator('body').textContent()) || '');
    expect(pageText).toContain('Pilot Gates');
    expect(pageText).toContain('Recent Support Audit');
    return { finalUrl: this.page.url(), pageText };
  }

  async expectNotificationDiagnostics(): Promise<SupportReportResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.notificationDiagnostics), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /notification branding diagnostics/i }).first()).toBeVisible();
    const pageText = normalize((await this.page.locator('body').textContent()) || '');
    expect(pageText).toContain('Live reminders');
    expect(pageText).toContain('Follow-up notices');
    return { finalUrl: this.page.url(), pageText };
  }
}
