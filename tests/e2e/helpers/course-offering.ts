import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface PublicCourseOfferingResult {
  title: string;
  courseKey: string;
  offeringId?: string;
  finalUrl: string;
  statusText: string;
}

export interface CourseOfferingUpdateResult {
  title: string;
  offeringId: string;
  statusText: string;
  finalUrl: string;
}

export interface CourseOfferingReviewResult {
  requestId: string;
  statusText: string;
  finalUrl: string;
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function defaultTitle(env: EduPlatformEnv): string {
  const courseKey = env.testCourseKey || 'pre_quraan';
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  return `SQA Public ${courseKey} ${stamp}`;
}

export class CourseOfferingPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  private offeringForm() {
    return this.page.locator('form:has(input[name="action"][value="save_offering"])').first();
  }

  private offeringRow(title: string) {
    return this.page.locator('table.pqco-table tbody tr', { hasText: title }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseOfferings));
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /course offerings/i })).toBeVisible();
    await expect(this.offeringForm()).toBeVisible();
    await expect(this.offeringForm().locator('select[name="course_key"]')).toBeVisible();
  }

  async createPublicOffering(): Promise<PublicCourseOfferingResult> {
    await this.expectReady();

    const form = this.offeringForm();
    const courseKey = this.env.testCourseKey || 'pre_quraan';
    const title = this.env.publicCourseTitle || defaultTitle(this.env);
    const startDate = this.env.publicCourseStartDate || addDays(new Date(), 1);
    const endDate = this.env.publicCourseEndDate || addDays(new Date(), 120);

    await form.locator('select[name="course_key"]').selectOption(courseKey);
    await form.locator('select[name="course_link_mode"]').selectOption(this.env.publicCourseLinkMode);

    if (this.env.publicCourseLinkMode === 'existing') {
      if (!this.env.publicCourseMoodleCourseId) {
        throw new Error(
          'EDUPLATFORM_PUBLIC_COURSE_MOODLE_COURSE_ID is required when EDUPLATFORM_PUBLIC_COURSE_LINK_MODE=existing.',
        );
      }
      await form.locator('select[name="moodlecourseid"]').selectOption(this.env.publicCourseMoodleCourseId);
    }

    await form.locator('input[name="title"]').fill(title);
    await form
      .locator('textarea[name="summary"]')
      .fill(`Automated SQA public course offering for ${courseKey}.`);
    await form.locator('textarea[name="syllabus"]').fill('SQA setup offering for public intake journey testing.');
    await form.locator('textarea[name="prerequisites"]').fill('Created by EduPlatform E2E setup.');
    await form.locator('input[name="startdate"]').fill(startDate);
    await form.locator('input[name="enddate"]').fill(endDate);
    await form.locator('input[name="capacity"]').fill(this.env.publicCourseCapacity);
    await form.locator('select[name="status"]').selectOption('published');
    await form.locator('input[name="tuition_amount"]').fill(this.env.publicCourseTuitionAmount);
    await form.locator('input[name="pricing_currency"]').fill(this.env.publicCourseCurrency);
    await form.locator('input[name="registration_fee"]').fill('0.00');
    await form.locator('input[name="materials_fee"]').fill('0.00');
    await form.locator('select[name="tax_behavior"]').selectOption('not_configured');
    await form.locator('select[name="payment_required_timing"]').selectOption('workspace_policy');
    await form.locator('select[name="visibility"]').selectOption('institution_public');

    await form.getByRole('button', { name: /save offering/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqco-alert--bad');
    if (await error.isVisible()) {
      throw new Error(`Course offering creation failed: ${((await error.textContent()) || '').trim()}`);
    }

    await expect(this.page.locator('.pqco-alert--ok')).toBeVisible();
    const row = this.page.locator('table.pqco-table tbody tr', { hasText: title }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/published/i);
    await expect(row).toContainText(/institution_public/i);

    return {
      title,
      courseKey,
      offeringId: await this.offeringIdForTitle(title),
      finalUrl: this.page.url(),
      statusText: ((await row.textContent()) || '').trim(),
    };
  }

  async createOperationsOffering(options: {
    title: string;
    capacity: string;
    status: 'draft' | 'published' | 'closed' | 'archived';
    visibility: 'workspace' | 'institution_public';
    tuitionAmount: string;
  }): Promise<PublicCourseOfferingResult> {
    await this.expectReady();

    const form = this.offeringForm();
    const courseKey = this.env.testCourseKey || 'pre_quraan';
    const startDate = this.env.publicCourseStartDate || addDays(new Date(), 1);
    const endDate = this.env.publicCourseEndDate || addDays(new Date(), 120);

    await form.locator('select[name="course_key"]').selectOption(courseKey);
    await form.locator('select[name="course_link_mode"]').selectOption(this.env.publicCourseLinkMode);
    if (this.env.publicCourseLinkMode === 'existing' && this.env.publicCourseMoodleCourseId) {
      await form.locator('select[name="moodlecourseid"]').selectOption(this.env.publicCourseMoodleCourseId);
    }

    await form.locator('input[name="title"]').fill(options.title);
    await form.locator('textarea[name="summary"]').fill(`Automated SQA course offering operations for ${options.title}.`);
    await form.locator('textarea[name="syllabus"]').fill('SQA course offering operations syllabus.');
    await form.locator('textarea[name="prerequisites"]').fill('Created by EduPlatform admin operations automation.');
    await form.locator('input[name="startdate"]').fill(startDate);
    await form.locator('input[name="enddate"]').fill(endDate);
    await form.locator('input[name="capacity"]').fill(options.capacity);
    await form.locator('select[name="status"]').selectOption(options.status);
    await form.locator('input[name="tuition_amount"]').fill(options.tuitionAmount);
    await form.locator('input[name="pricing_currency"]').fill(this.env.publicCourseCurrency || 'USD');
    await form.locator('input[name="registration_fee"]').fill('0.00');
    await form.locator('input[name="materials_fee"]').fill('0.00');
    await form.locator('select[name="tax_behavior"]').selectOption('not_configured');
    await form.locator('select[name="payment_required_timing"]').selectOption('workspace_policy');
    await form.locator('select[name="visibility"]').selectOption(options.visibility);

    await form.getByRole('button', { name: /save offering/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoCourseOfferingError();

    const row = this.offeringRow(options.title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(options.status, 'i'));
    await expect(row).toContainText(new RegExp(options.visibility, 'i'));

    return {
      title: options.title,
      courseKey,
      offeringId: await this.offeringIdForTitle(options.title),
      finalUrl: this.page.url(),
      statusText: ((await row.textContent()) || '').replace(/\s+/g, ' ').trim(),
    };
  }

  async updateOffering(title: string, options: {
    capacity: string;
    status: 'draft' | 'published' | 'closed' | 'archived';
    visibility: 'workspace' | 'institution_public';
  }): Promise<CourseOfferingUpdateResult> {
    await this.goto();
    const offeringId = await this.offeringIdForTitle(title);
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseOfferings, { editid: offeringId }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /course offerings/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /edit offering/i })).toBeVisible();

    const form = this.offeringForm();
    await form.locator('input[name="capacity"]').fill(options.capacity);
    await form.locator('select[name="status"]').selectOption(options.status);
    await form.locator('select[name="visibility"]').selectOption(options.visibility);
    await form.getByRole('button', { name: /save offering/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoCourseOfferingError();

    const row = this.offeringRow(title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(`${options.capacity} open|${Number(options.capacity)} open`, 'i'));
    await expect(row).toContainText(new RegExp(options.status, 'i'));
    await expect(row).toContainText(new RegExp(options.visibility, 'i'));

    return {
      title,
      offeringId,
      statusText: ((await row.textContent()) || '').replace(/\s+/g, ' ').trim(),
      finalUrl: this.page.url(),
    };
  }

  async archiveOffering(title: string): Promise<CourseOfferingUpdateResult> {
    await this.goto();
    const offeringId = await this.offeringIdForTitle(title);
    const row = this.offeringRow(title);
    await expect(row).toBeVisible();
    const form = row.locator('form:has(input[name="action"][value="archive_offering"])').first();
    await expect(form).toBeVisible();
    await form.getByRole('button', { name: /archive/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoCourseOfferingError();
    await expect(this.page.locator('.pqco-alert--ok').first()).toContainText(/offering archived/i);

    const archivedRow = this.offeringRow(title);
    await expect(archivedRow).toBeVisible();
    await expect(archivedRow).toContainText(/archived/i);

    return {
      title,
      offeringId,
      statusText: ((await archivedRow.textContent()) || '').replace(/\s+/g, ' ').trim(),
      finalUrl: this.page.url(),
    };
  }

  async rejectEnrollmentRequest(options: {
    studentAccountId: string;
    studentUsername: string;
    offeringTitle: string;
    adminNote: string;
  }): Promise<CourseOfferingReviewResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseOfferings, {
      request_status: 'pending',
      request_student: options.studentUsername,
    }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /course offerings/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /enrollment requests/i })).toBeVisible();

    const row = this.page.locator('table.pqco-table tbody tr', {
      hasText: options.studentAccountId,
    }).filter({ hasText: options.offeringTitle }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/pending approval/i);
    const rowText = ((await row.textContent()) || '').replace(/\s+/g, ' ').trim();
    const form = row.locator('form:has(input[name="action"][value="review_request"])').first();
    const requestId = rowText.match(/Request #?(\d+)/i)?.[1]
      || await form.locator('input[name="requestid"]').inputValue();
    await form.locator('input[name="admin_notes"]').fill(options.adminNote);
    await form.getByRole('button', { name: /^reject$/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoCourseOfferingError();

    const notice = this.page.locator('.pqco-alert--ok').first();
    await expect(notice).toContainText(/rejected/i);

    return {
      requestId,
      statusText: ((await notice.textContent()) || '').replace(/\s+/g, ' ').trim(),
      finalUrl: this.page.url(),
    };
  }

  async expectEnrollmentRequestInQueue(options: {
    studentAccountId: string;
    studentUsername: string;
    offeringTitle: string;
    status: 'pending' | 'rejected' | 'approved' | 'enrolled';
  }): Promise<string> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseOfferings, {
      request_status: options.status,
      request_student: options.studentUsername,
    }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /enrollment requests/i })).toBeVisible();
    const row = this.page.locator('table.pqco-table tbody tr', {
      hasText: options.studentAccountId,
    }).filter({ hasText: options.offeringTitle }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(options.status === 'pending' ? 'pending approval' : options.status, 'i'));
    return ((await row.textContent()) || '').replace(/\s+/g, ' ').trim();
  }

  async expectCourseAudit(title: string, expectedActions: RegExp[]): Promise<string> {
    await this.goto();
    await expect(this.offeringRow(title)).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /course audit log/i })).toBeVisible();
    const bodyText = ((await this.page.locator('body').textContent()) || '').replace(/\s+/g, ' ').trim();
    for (const action of expectedActions) {
      expect(bodyText, `Course audit should contain ${action}`).toMatch(action);
    }
    return bodyText;
  }

  private async offeringIdForTitle(title: string): Promise<string> {
    const row = this.offeringRow(title);
    await expect(row).toBeVisible();
    const editHref = await row.getByRole('link', { name: /edit/i }).first().getAttribute('href');
    const editId = editHref ? new URL(editHref, this.env.baseUrl).searchParams.get('editid') : '';
    if (!editId) {
      throw new Error(`Could not determine offering ID for ${title}.`);
    }
    return editId;
  }

  private async expectNoCourseOfferingError(): Promise<void> {
    const error = this.page.locator('.pqco-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Course offering operation failed: ${((await error.textContent()) || '').replace(/\s+/g, ' ').trim()}`);
    }
  }
}
