import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface PublicCourseOfferingResult {
  title: string;
  courseKey: string;
  finalUrl: string;
  statusText: string;
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
      finalUrl: this.page.url(),
      statusText: ((await row.textContent()) || '').trim(),
    };
  }
}
