import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';
import type { StudentCreationResult } from './admissions';

export interface EnrollmentRequestResult {
  offeringTitle: string;
  requestStatusText: string;
  finalUrl: string;
}

export interface EnrollmentApprovalResult {
  requestId: string;
  statusText: string;
  finalUrl: string;
}

function firstMatch(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() || '';
}

export class CourseCatalogPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseCatalog, {
      course: this.env.testCourseKey || 'pre_quraan',
      available_only: 1,
    }), { waitUntil: 'domcontentloaded' });
  }

  async requestEnrollment(student: StudentCreationResult): Promise<EnrollmentRequestResult> {
    await expect(this.page.getByRole('heading', { name: /course catalog/i })).toBeVisible();

    const card = this.page.locator('article.pqcb-card', { hasText: this.env.testCourseKey || 'pre_quraan' }).first();
    await expect(card).toBeVisible();

    const button = card.getByRole('button', { name: /request enrollment/i });
    await expect(button).toBeEnabled();

    const studentSelect = card.locator('select[name="studentid"]');
    if (await studentSelect.isVisible()) {
      await studentSelect.selectOption(student.studentUserId);
    }

    await card.locator('input[name="request_notes"]').fill(`Automated SQA enrollment request for student ${student.studentUserId}.`);
    await button.click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(this.page.locator('.pqcb-alert--ok')).toContainText(/enrollment request sent/i);
    const statusPanel = this.page.locator('section[aria-label="Enrollment request status"]').first();
    await expect(statusPanel).toBeVisible();
    await expect(statusPanel).toContainText(student.studentAccountId);

    return {
      offeringTitle: (((await card.locator('h2').first().textContent()) || '').trim()),
      requestStatusText: (((await statusPanel.textContent()) || '').replace(/\s+/g, ' ').trim()),
      finalUrl: this.page.url(),
    };
  }
}

export class CourseOfferingAdminPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoPendingForStudent(student: StudentCreationResult): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseOfferings, {
      request_status: 'pending',
      request_student: student.studentUsername,
    }), { waitUntil: 'domcontentloaded' });
  }

  async approveEnrollment(student: StudentCreationResult): Promise<EnrollmentApprovalResult> {
    await expect(this.page.getByRole('heading', { name: /course offerings/i })).toBeVisible();

    const row = this.page.locator('table.pqco-table tbody tr', { hasText: student.studentAccountId }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/pending approval/i);

    const rowText = ((await row.textContent()) || '').replace(/\s+/g, ' ').trim();
    const form = row.locator('form', { hasText: /approve/i }).first();
    const requestId = firstMatch(rowText, /Request #?(\d+)/i)
      || await form.locator('input[name="requestid"]').inputValue();

    await form.locator('input[name="admin_notes"]').fill(`Automated SQA enrollment approval for student ${student.studentUserId}.`);
    await form.getByRole('button', { name: /^approve$/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const notice = this.page.locator('.pqco-alert--ok');
    await expect(notice).toContainText(/enrollment approved|moodle enrollment/i);

    const statusText = ((await notice.textContent()) || '').trim();
    return {
      requestId,
      statusText,
      finalUrl: this.page.url(),
    };
  }
}
