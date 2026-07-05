import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';
import type { StudentJourneyData } from './student-data';

export interface StudentCreationResult {
  requestId: string;
  studentAccountId: string;
  studentUserId: string;
  studentUsername: string;
  studentPassword: string;
  parentAccountId: string;
  parentUserId: string;
  parentPassword: string;
  parentEmailStatus: string;
  enrollmentApprovalStatus: string;
  createdText: string;
  finalUrl: string;
}

function firstMatch(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() || '';
}

export class IntakeReviewPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  private requestCard(data: StudentJourneyData) {
    return this.page.locator('article.pqir-card', { hasText: data.student.displayName }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.intakeRequests), { waitUntil: 'domcontentloaded' });
  }

  async loadRequestIntoStudentIntake(data: StudentJourneyData): Promise<string> {
    await expect(this.page.getByRole('heading', { name: /public intake requests/i })).toBeVisible();

    const card = this.requestCard(data);
    await expect(card).toBeVisible();
    await expect(card).toContainText(data.guardian.email);

    const cardText = (await card.textContent()) || '';
    const requestId = firstMatch(cardText, /Request #(\d+)/i);
    if (!requestId) {
      throw new Error(`Could not determine public intake request ID for ${data.student.displayName}.`);
    }

    const form = card.locator('form').last();
    await form.locator('input[name="admin_notes"]').fill(`Automated SQA Phase 4 transfer for ${data.runId}`);
    await form.getByRole('button', { name: /load into intake/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(this.page.getByText(new RegExp(`Public intake request #${requestId} loaded`, 'i'))).toBeVisible();
    await expect(this.page.locator('input[name="requestid"]')).toHaveValue(requestId);
    return requestId;
  }
}

export class StudentIntakePage {
  constructor(private readonly page: Page) {}

  async expectPrefilled(data: StudentJourneyData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /student intake/i })).toBeVisible();
    await expect(this.page.locator('input[name="student_firstname"]')).toHaveValue(data.student.firstName);
    await expect(this.page.locator('input[name="student_email"]')).toHaveValue(data.student.email);
    await expect(this.page.locator('input[name="parent_email"]')).toHaveValue(data.guardian.email);
  }

  private async ensureRequiredTransferFields(): Promise<void> {
    const city = this.page.locator('select[name="city"]');
    if (await city.isVisible()) {
      const cityValue = await city.inputValue();
      if (!cityValue) {
        await city.selectOption('Other');
      }
    }

    const cityOther = this.page.locator('input[name="city_other"]');
    if (await cityOther.isVisible()) {
      const cityOtherValue = await cityOther.inputValue();
      if (!cityOtherValue) {
        await cityOther.fill('SQA Test City');
      }
    }

    const slots = this.page.locator('input[name="slots[]"]');
    const checkedSlots = await slots.evaluateAll((items) =>
      items.filter((item) => (item as HTMLInputElement).checked).length,
    );
    if (checkedSlots === 0) {
      await expect(slots.first()).toBeVisible();
      await slots.first().check();
    }
  }

  async createStudentFromPrefill(requestId: string): Promise<StudentCreationResult> {
    await this.ensureRequiredTransferFields();
    await this.page.getByRole('button', { name: /create student intake/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const validationError = this.page.getByText(/please fix the highlighted fields below/i);
    if (await validationError.isVisible()) {
      throw new Error(`Student intake validation failed: ${((await this.page.locator('.pqsi-alert--bad, .pqsi-error').first().textContent()) || '').trim()}`);
    }

    const panel = this.page.locator('section.pqsi-panel', { hasText: /created accounts/i }).first();
    await expect(panel).toBeVisible();
    await expect(this.page.getByText(/student intake completed/i)).toBeVisible();

    const createdText = ((await panel.textContent()) || '').replace(/\s+/g, ' ').trim();
    const studentAccountId = firstMatch(createdText, /Student\s*ID\s*([A-Z0-9-]+?)(?=\s*Moodle user ID)/i);
    const studentUserId = firstMatch(createdText, /Student.*?Moodle user ID:\s*(\d+)/i);
    const studentUsername =
      firstMatch(createdText, /Username:\s*(.*?)\s*Temporary password:/i) ||
      firstMatch(createdText, /Username:\s*([^\s]+)/i);
    const studentPassword = firstMatch(createdText, /Student.*?Temporary password:\s*(.*?)\s*Parent\/guardian/i);
    const parentBlock = firstMatch(createdText, /Parent\/guardian\s*(.*?)\s*Referrer/i);
    const parentAccountId = firstMatch(parentBlock, /ID\s*([A-Z0-9-]+?)(?=\s*Moodle user ID)/i);
    const parentUserId = firstMatch(parentBlock, /Moodle user ID:\s*(\d+)/i);
    const parentPassword = firstMatch(parentBlock, /Temporary password:\s*(.*?)\s*Email:/i);
    const parentEmailStatus = firstMatch(parentBlock, /Email:\s*([^ ]+(?: [^ ]+){0,3})/i);
    const enrollmentApprovalStatus = firstMatch(createdText, /Parent approval status:\s*([a-z_]+)/i);

    return {
      requestId,
      studentAccountId,
      studentUserId,
      studentUsername,
      studentPassword,
      parentAccountId,
      parentUserId,
      parentPassword,
      parentEmailStatus,
      enrollmentApprovalStatus,
      createdText,
      finalUrl: this.page.url(),
    };
  }
}
