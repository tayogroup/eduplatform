import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, publicTeacherIntakeUrl } from './routes';
import type { TeacherJourneyData } from './teacher-data';

export interface TeacherApplicationResult {
  submitted: boolean;
  requestId: string;
  confirmationText: string;
  finalUrl: string;
}

export interface TeacherOnboardingResult {
  requestId: string;
  teacherAccountId: string;
  teacherUserId: string;
  teacherUsername: string;
  teacherPassword: string;
  profileId: string;
  availabilityRows: string;
  createdText: string;
  finalUrl: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function firstMatch(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() || '';
}

function parseTeacherUsername(createdText: string): string {
  const username =
    firstMatch(createdText, /Username:\s*(.*?)\s*Temporary password:/i) ||
    firstMatch(createdText, /Username:\s*([a-z0-9._@-]+)/i);
  return username.replace(/Temporary.*$/i, '').trim();
}

async function selectPreferredOrFirst(page: Page, selector: string, preferredValue = ''): Promise<string> {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();
  const options = await locator.locator('option').evaluateAll((items) =>
    items
      .map((item) => ({
        value: (item as HTMLOptionElement).value,
        label: (item.textContent || '').replace(/\s+/g, ' ').trim(),
      }))
      .filter((item) => item.value !== ''),
  );
  const selected = options.find((item) => item.value === preferredValue) || options[0];
  if (!selected) {
    throw new Error(`No selectable options found for ${selector}.`);
  }

  await locator.selectOption(selected.value);
  return selected.value;
}

async function checkPreferredOrFirst(page: Page, selector: string, preferredValue = ''): Promise<string> {
  const preferred = preferredValue ? page.locator(`${selector}[value="${preferredValue}"]`).first() : page.locator(selector).first();
  const fallback = page.locator(selector).first();
  const target = await preferred.count() > 0 ? preferred : fallback;
  await expect(target).toBeVisible();
  const value = (await target.getAttribute('value')) || '';
  await target.check();
  return value;
}

async function selectMultiplePreferredOrFirst(page: Page, selector: string, preferredValue = ''): Promise<string> {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();
  const values = await locator.locator('option').evaluateAll((items) =>
    items.map((item) => (item as HTMLOptionElement).value).filter((value) => value !== ''),
  );
  const selected = values.includes(preferredValue) ? preferredValue : values[0];
  if (!selected) {
    throw new Error(`No selectable options found for ${selector}.`);
  }
  await locator.selectOption([selected]);
  return selected;
}

export class PublicTeacherIntakePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(publicTeacherIntakeUrl(this.env), { waitUntil: 'commit', timeout: 60_000 });
  }

  private intakeForm() {
    return this.page.locator('form:has(input[name="teacher_name"])').first();
  }

  async expectReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /teacher\s*\/\s*tutor application|teacher application/i }).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.intakeForm()).toBeVisible();
    await expect(this.page.locator('input[name="teacher_name"]')).toBeVisible();
  }

  async submitMissingRequiredFields(): Promise<void> {
    await this.intakeForm().locator('button[type="submit"]').click();
    await expect(this.page.locator('.pqpti-alert--bad, .pqpti-error').first()).toBeVisible();
  }

  async submitValidApplication(data: TeacherJourneyData): Promise<TeacherApplicationResult> {
    await this.expectReady();

    await this.page.locator('input[name="teacher_name"]').fill(data.teacher.displayName);
    await this.page.locator('input[name="email"]').fill(data.teacher.email);
    await this.page.locator('input[name="phone"]').fill(data.teacher.phone);
    await this.page.locator('select[name="primary_language"]').selectOption(data.teacher.primaryLanguage);
    await this.page.locator('select[name="country"]').selectOption(data.teacher.country);
    await this.page.locator('select[name="city"]').selectOption(data.teacher.city);
    await this.page.locator('input[name="city_other"]').fill(data.teacher.cityOther);
    await selectPreferredOrFirst(this.page, 'select[name="timezone"]', data.teacher.timezone);
    await checkPreferredOrFirst(this.page, 'input[name="courses[]"]', this.env.testCourseKey || data.teacher.courseKey);
    await checkPreferredOrFirst(this.page, 'input[name="levels[]"]', data.teacher.level);
    await checkPreferredOrFirst(this.page, 'input[name="other_languages[]"]', 'Arabic');
    await this.page.locator('textarea[name="desired_services"]').fill(data.teacher.desiredServices);
    await this.page.locator('textarea[name="experience"]').fill(data.teacher.experience);
    await this.page.locator('textarea[name="education"]').fill(data.teacher.education);
    await this.page.locator('textarea[name="teaching_style"]').fill(data.teacher.teachingStyle);
    await this.page.locator('textarea[name="bio"]').fill(data.teacher.bio);
    await checkPreferredOrFirst(this.page, 'input[name="slots[]"]');
    await this.page.locator('textarea[name="notes"]').fill(data.teacher.notes);

    await this.page.waitForTimeout(4_200);
    await this.intakeForm().locator('button[type="submit"]').click();
    await expect(this.page.locator('.pqpti-alert--ok, .pqpti-alert--bad').first()).toBeVisible({ timeout: 60_000 });

    const validation = this.page.locator('.pqpti-alert--bad');
    if (await validation.isVisible().catch(() => false)) {
      throw new Error(`Teacher public intake submission was rejected: ${normalize((await validation.textContent()) || '')}`);
    }

    const confirmation = this.page.locator('.pqpti-alert--ok').first();
    const confirmationText = normalize((await confirmation.textContent()) || '');
    const requestId = firstMatch(confirmationText, /application\s*#?(\d+)/i) || firstMatch(this.page.url(), /requestid=(\d+)/i);

    return {
      submitted: true,
      requestId,
      confirmationText,
      finalUrl: this.page.url(),
    };
  }
}

export class TeacherApplicationQueuePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  private requestCard(data: TeacherJourneyData) {
    return this.page.locator('.pqtirq-card', { hasText: data.teacher.email }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.teacherIntakeRequests), { waitUntil: 'domcontentloaded' });
  }

  async approveAndOpenIntake(data: TeacherJourneyData, fallbackRequestId = ''): Promise<string> {
    await expect(this.page.getByRole('heading', { name: /teacher applications/i })).toBeVisible();
    const card = this.requestCard(data);
    await expect(card).toBeVisible();
    const cardText = normalize((await card.textContent()) || '');
    const requestId = firstMatch(cardText, /Application\s*#(\d+)/i) || firstMatch(cardText, /Request\s*#(\d+)/i) || fallbackRequestId;
    if (!requestId) {
      throw new Error(`Could not determine teacher application request ID for ${data.teacher.email}.`);
    }

    const form = card.locator('form').last();
    await form.locator('select[name="status"]').selectOption('approved');
    await form.locator('input[name="admin_notes"]').fill(`Automated SQA teacher approval for ${data.runId}`);
    await form.getByRole('button', { name: /save review/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/review saved/i).first()).toBeVisible();

    const refreshedCard = this.requestCard(data);
    await refreshedCard.getByRole('link', { name: /open teacher intake/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByRole('heading', { name: /teacher intake/i }).first()).toBeVisible();
    return requestId;
  }
}

export class TeacherIntakePage {
  constructor(private readonly page: Page) {}

  async expectPrefilled(data: TeacherJourneyData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /teacher intake/i }).first()).toBeVisible();
    await expect(this.page.locator('input[name="teacher_contact"]')).toHaveValue(data.teacher.email);
    await expect(this.page.locator('input[name="teacher_firstname"]')).toHaveValue(data.teacher.firstName);
  }

  private async ensureRequiredFields(data: TeacherJourneyData): Promise<void> {
    const fillIfEmpty = async (selector: string, value: string) => {
      const locator = this.page.locator(selector);
      if (await locator.isVisible().catch(() => false)) {
        const current = await locator.inputValue();
        if (!current) {
          await locator.fill(value);
        }
      }
    };

    await fillIfEmpty('input[name="teacher_firstname"]', data.teacher.firstName);
    await fillIfEmpty('input[name="teacher_lastname"]', data.teacher.lastName);
    await fillIfEmpty('input[name="teacher_display_name"]', data.teacher.displayName);
    await fillIfEmpty('input[name="teacher_username"]', data.teacher.username);
    await fillIfEmpty('input[name="teacher_contact"]', data.teacher.email);
    await fillIfEmpty('input[name="teacher_phone"]', data.teacher.phone);
    await this.page.locator('select[name="preferred_contact"]').selectOption('email');
    await this.page.locator('select[name="gender"]').selectOption('female');
    await this.page.locator('select[name="country"]').selectOption(data.teacher.country);
    await this.page.locator('select[name="city"]').selectOption(data.teacher.city);
    await fillIfEmpty('input[name="city_other"]', data.teacher.cityOther);
    await selectPreferredOrFirst(this.page, 'select[name="timezone"]', data.teacher.timezone);
    await this.page.locator('select[name="primary_language"]').selectOption(data.teacher.primaryLanguage);
    await selectMultiplePreferredOrFirst(this.page, 'select[name="courses_taught[]"]', data.teacher.courseKey);
    await selectMultiplePreferredOrFirst(this.page, 'select[name="levels_taught[]"]', data.teacher.level);
    await fillIfEmpty('input[name="max_students_per_class"]', '8');
    await fillIfEmpty('input[name="max_weekly_hours"]', '12');
    await this.page.locator('select[name="marketplace_status"]').selectOption('published');
    await this.page.locator('select[name="marketplace_visible"]').selectOption('1');
    await this.page.locator('select[name="vetting_status"]').selectOption('approved');
    await this.page.locator('textarea[name="vetting_summary"]').fill(`Approved by automated SQA teacher journey ${data.runId}.`);
    await this.page.locator('textarea[name="marketplace_bio"]').fill(data.teacher.bio);
    await this.page.locator('textarea[name="marketplace_skills"]').fill('Tajweed, pre-quraan, beginner learner support');
    await this.page.locator('textarea[name="marketplace_experience"]').fill(data.teacher.experience);
    await this.page.locator('textarea[name="marketplace_education"]').fill(data.teacher.education);
    await this.page.locator('textarea[name="marketplace_teaching_style"]').fill(data.teacher.teachingStyle);
    await this.page.locator('textarea[name="marketplace_courses"]').fill('Pre-Quraan');
    await selectPreferredOrFirst(this.page, 'select[name="session_count"]', '2');
    await checkPreferredOrFirst(this.page, 'input[name="slots[]"]');
    await this.page.locator('textarea[name="availability_summary"]').fill(`Automated SQA availability for ${data.runId}.`);
    await this.page.locator('select[name="bbb_trained"]').selectOption('1');
    await this.page.locator('select[name="safeguarding_trained"]').selectOption('1');
    await this.page.locator('select[name="recording_qa_ack"]').selectOption('1');
    await this.page.locator('select[name="status"]').selectOption('active');
    await this.page.locator('textarea[name="admin_notes"]').fill(`Automated SQA teacher onboarding for ${data.runId}.`);
  }

  async createTeacherFromPrefill(data: TeacherJourneyData, requestId: string): Promise<TeacherOnboardingResult> {
    await this.ensureRequiredFields(data);
    await this.page.getByRole('button', { name: /create teacher intake|update teacher intake/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const validation = this.page.locator('.pqti-alert--bad, .pqti-error').first();
    if (await validation.isVisible().catch(() => false)) {
      throw new Error(`Teacher intake validation failed: ${normalize((await validation.textContent()) || '')}`);
    }

    const panel = this.page.locator('section.pqti-panel', { hasText: /teacher account/i }).first();
    await expect(this.page.getByText(/teacher intake completed/i).first()).toBeVisible();
    await expect(panel).toBeVisible();
    const createdText = normalize((await panel.textContent()) || '');
    const teacherUsername = parseTeacherUsername(createdText);
    if (!teacherUsername || /temporary/i.test(teacherUsername)) {
      throw new Error(`Could not parse teacher username from created account panel: ${createdText}`);
    }

    return {
      requestId,
      teacherAccountId: firstMatch(createdText, /Teacher\s*ID\s*([A-Z0-9-]+?)(?=\s*Moodle user ID)/i),
      teacherUserId: firstMatch(createdText, /Moodle user ID:\s*(\d+)/i),
      teacherUsername,
      teacherPassword: firstMatch(createdText, /Temporary password:\s*(.*?)\s*Onboarding/i),
      profileId: firstMatch(createdText, /Profile ID\s*(\d+)/i),
      availabilityRows: firstMatch(createdText, /Availability rows created:\s*(\d+)/i),
      createdText,
      finalUrl: this.page.url(),
    };
  }
}

export class TeacherMarketplacePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectPublishedTeacher(data: TeacherJourneyData): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.teacherMarketplace, {
      q: data.teacher.displayName,
    }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /teacher marketplace/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(data.teacher.displayName);
    expect(bodyText).toContain('Academy reviewed');
  }
}
