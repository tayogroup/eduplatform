import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { publicIntakeUrl } from './routes';
import type { StudentJourneyData } from './student-data';

export interface PublicIntakeSubmissionResult {
  submitted: boolean;
  selectedCourseValue: string;
  confirmationText: string;
  finalUrl: string;
}

async function selectByPreferredOrFirst(page: Page, selector: string, preferredValue = ''): Promise<string> {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();

  const values = await locator.locator('option').evaluateAll((options) =>
    options
      .map((option) => ({
        value: (option as HTMLOptionElement).value,
        label: (option.textContent || '').trim(),
      }))
      .filter((option) => option.value !== ''),
  );

  const selected = values.find((option) => option.value === preferredValue) || values[0];
  if (!selected) {
    throw new Error(`No selectable options found for ${selector}.`);
  }

  await locator.selectOption(selected.value);
  return selected.value;
}

async function checkFirstAvailableSlot(page: Page): Promise<string> {
  const slot = page.locator('input[name="slots[]"]').first();
  await expect(slot).toBeVisible();
  const value = (await slot.getAttribute('value')) || '';
  await slot.check();
  return value;
}

export class PublicIntakePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(publicIntakeUrl(this.env), { waitUntil: 'commit', timeout: 60_000 });
  }

  private intakeForm() {
    return this.page.locator('form:has(select[name="course_type"])');
  }

  private async pageSnapshot(): Promise<{ title: string; bodyText: string }> {
    const title = await this.page.title().catch(() => '');
    const bodyText = ((await this.page.locator('body').textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

    return { title, bodyText };
  }

  async expectReady(): Promise<void> {
    let lastError: unknown;
    let lastSnapshot = { title: '', bodyText: '' };

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await expect(this.page.getByRole('heading', { name: /request enrollment/i })).toBeVisible({ timeout: 25_000 });
        await expect(this.intakeForm()).toBeVisible({ timeout: 25_000 });
        await expect(this.page.locator('select[name="course_type"]')).toBeVisible({ timeout: 25_000 });
        return;
      } catch (error) {
        lastError = error;
        lastSnapshot = await this.pageSnapshot();

        if (attempt < 3 && lastSnapshot.title === '' && lastSnapshot.bodyText === '') {
          await this.goto();
          continue;
        }

        break;
      }
    }

    throw new Error(
      [
        'Public intake page did not become ready.',
        `URL: ${this.page.url()}`,
        `Title: ${lastSnapshot.title || '(empty)'}`,
        `Body: ${lastSnapshot.bodyText.slice(0, 500) || '(empty)'}`,
        lastError instanceof Error ? lastError.message : String(lastError),
      ].join('\n'),
    );
  }

  async expectPublicCourseAvailable(): Promise<string> {
    const preferred = this.env.testCourseKey || '';
    try {
      return await selectByPreferredOrFirst(this.page, 'select[name="course_type"]', preferred);
    } catch (error) {
      throw new Error(
        [
          'No public course is selectable on the EduPlatform public intake form.',
          `Expected course key: ${preferred || '(any published institution-public course)'}.`,
          'Publish a course offering for this workspace with status=published and visibility=institution_public, then rerun the test.',
          error instanceof Error ? error.message : String(error),
        ].join(' '),
      );
    }
  }

  async submitMissingRequiredFields(): Promise<void> {
    await this.intakeForm().locator('button[type="submit"]').click();
    await expect(this.page.locator('.pqpir-alert--bad')).toContainText(/please fix/i);
    await expect(this.page.locator('.pqpir-alert--bad')).toContainText(/student first name/i);
  }

  async submitValidRequest(data: StudentJourneyData): Promise<PublicIntakeSubmissionResult> {
    await this.expectReady();

    const selectedCourseValue = await this.expectPublicCourseAvailable();

    await this.page.locator('input[name="parent_name"]').fill(data.guardian.displayName);
    await this.page.locator('input[name="parent_email"]').fill(data.guardian.email);
    await this.page.locator('input[name="parent_phone"]').fill(data.guardian.phone);
    await this.page.locator('input[name="student_firstname"]').fill(data.student.firstName);
    await this.page.locator('input[name="student_middle_name"]').fill(data.student.middleName);
    await this.page.locator('input[name="student_lastname"]').fill(data.student.lastName);
    await this.page.locator('input[name="student_display_name"]').fill(data.student.displayName);
    await this.page.locator('select[name="student_access_type"]').selectOption('managed');
    await this.page.locator('input[name="student_email"]').fill(data.student.email);
    await this.page.locator('input[name="age_years"]').fill('12');
    await this.page.locator('select[name="gender"]').selectOption('male');
    await this.page.locator('select[name="special_needs"]').selectOption('no');
    await this.page.locator('select[name="course_type"]').selectOption(selectedCourseValue);
    await this.page.locator('select[name="country"]').selectOption('Other');
    await this.page.locator('select[name="city"]').selectOption('Other');
    await this.page.locator('input[name="city_other"]').fill('SQA Test City');
    await selectByPreferredOrFirst(this.page, 'select[name="timezone"]', 'Africa/Nairobi');
    await this.page.locator('select[name="primary_language"]').selectOption('English');
    await this.page.locator('select[name="preferred_teaching_language"]').selectOption('English');
    await this.page.locator('select[name="current_level"]').selectOption('level_1');
    await this.page.locator('select[name="learning_base"]').selectOption('new learner');
    await this.page.locator('select[name="session_count"]').selectOption('2');
    await checkFirstAvailableSlot(this.page);
    await this.page.locator('textarea[name="parent_preferences"]').fill(`Automated SQA public intake for ${data.runId}`);
    await this.page.locator('input[name="live_class_consent"]').check();
    await this.page.locator('input[name="recording_consent"]').check();
    await this.page.locator('textarea[name="consent_notes"]').fill(`SQA consent note for ${data.runId}`);

    await this.page.waitForTimeout(4_200);
    await this.intakeForm().locator('button[type="submit"]').click();
    await expect(this.page.locator('.pqpir-alert--ok, .pqpir-alert--bad').first()).toBeVisible({ timeout: 60_000 });

    const validation = this.page.locator('.pqpir-alert--bad');
    if (await validation.isVisible().catch(() => false)) {
      const validationText = ((await validation.textContent()) || '').replace(/\s+/g, ' ').trim();
      throw new Error(`Public intake submission was rejected: ${validationText}`);
    }

    const confirmation = this.page.locator('.pqpir-alert--ok');
    await expect(confirmation).toBeVisible();
    const confirmationText = (await confirmation.textContent())?.trim() || '';

    return {
      submitted: true,
      selectedCourseValue,
      confirmationText,
      finalUrl: this.page.url(),
    };
  }
}
