import { expect, type Locator, type Page } from '@playwright/test';
import type { StudentCreationResult } from './admissions';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface ClassCompletionResult {
  assessmentTitle: string;
  categoryTitle: string;
  selectedOfferingLabel: string;
  scorePercent: string;
  courseGradeText: string;
  publishNotice: string;
  finalUrl: string;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function canonicalScore(value: string): string {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
    return String(parsed);
  }
  return '95';
}

function keyFromRunId(runId: string): string {
  return `sqa_completion_${runId.replace(/[^a-zA-Z0-9_-]/g, '_')}`.slice(0, 80);
}

async function selectOptionByText(select: Locator, candidates: string[]): Promise<string> {
  await expect(select).toBeVisible();
  const options = await select.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: (node as HTMLOptionElement).value,
      label: ((node.textContent || '') as string).replace(/\s+/g, ' ').trim(),
    })),
  );

  if (options.length === 0) {
    throw new Error('Expected select to contain at least one option.');
  }

  const selected = options.find((option) => {
    const label = option.label.toLowerCase();
    return candidates.some((candidate) => candidate && label.includes(candidate.toLowerCase()));
  }) || options[0];

  await select.selectOption(selected.value);
  return selected.label;
}

async function tableText(table: Locator): Promise<string> {
  return normalize((await table.textContent().catch(() => '')) || '');
}

async function moodleErrorText(page: Page): Promise<string> {
  const errorHeading = page.getByRole('heading', { name: /^error$/i }).first();
  if (!(await errorHeading.isVisible().catch(() => false))) {
    return '';
  }

  return normalize((await page.locator('body').textContent().catch(() => '')) || '').slice(0, 1200);
}

export class GradebookAssessmentPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.gradebookAssessment), { waitUntil: 'domcontentloaded' });
  }

  private async expectNoticeOrRecover(expected: RegExp, actionLabel: string): Promise<string> {
    const notice = this.page.locator('.pqgb-notice').first();
    if (await notice.isVisible().catch(() => false)) {
      await expect(notice).toContainText(expected);
      return normalize((await notice.textContent()) || '');
    }

    const errorText = await moodleErrorText(this.page);
    if (errorText) {
      await this.goto();
      await expect(this.page.getByRole('heading', { name: /gradebook and assessment/i }).first()).toBeVisible();
      return `Recovered after Moodle render error during ${actionLabel}: ${errorText}`;
    }

    await expect(notice).toContainText(expected);
    return normalize((await notice.textContent()) || '');
  }

  async createAssessmentGradeAndPublish(options: {
    student: StudentCreationResult;
    studentEmail: string;
    offeringTitle: string;
    runId: string;
    assessmentType?: 'assignment' | 'quiz' | 'exam' | 'oral_recitation';
    assessmentTitlePrefix?: string;
    assessmentDescription?: string;
  }): Promise<ClassCompletionResult> {
    await expect(this.page.getByRole('heading', { name: /gradebook and assessment/i }).first()).toBeVisible();

    const assessmentTitle = `${options.assessmentTitlePrefix || 'Automated SQA Completion'} ${options.runId}`;
    const categoryTitle = `Automated SQA Completion Category ${options.runId}`;
    const scorePercent = canonicalScore(this.env.completionScorePercent);
    const offeringCandidates = [
      options.offeringTitle,
      this.env.publicCourseTitle,
      this.env.testCourseKey,
      'pre_quraan',
    ].filter(Boolean);

    const categoryForm = this.page.locator('form:has(input[name="action"][value="save_category"])').first();
    await expect(categoryForm).toBeVisible();
    const selectedOfferingLabel = await selectOptionByText(categoryForm.locator('select[name="offeringid"]'), offeringCandidates);
    await categoryForm.locator('input[name="category_key"]').fill(keyFromRunId(options.runId));
    await categoryForm.locator('input[name="title"]').fill(categoryTitle);
    await categoryForm.locator('input[name="weight_percent"]').fill('100');
    await categoryForm.locator('input[name="drop_lowest_count"]').fill('0');
    await categoryForm.locator('input[name="status"]').fill('active');
    await categoryForm.getByRole('button', { name: /save category/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoticeOrRecover(/weighted grading category saved/i, 'category save');

    const assessmentForm = this.page.locator('form:has(input[name="action"][value="save_assessment"])').first();
    await expect(assessmentForm).toBeVisible();
    await selectOptionByText(assessmentForm.locator('select[name="offeringid"]'), [selectedOfferingLabel, ...offeringCandidates]);
    const categorySelect = assessmentForm.locator('select[name="categoryid"]');
    await selectOptionByText(categorySelect, [categoryTitle]);
    await assessmentForm.locator('select[name="assessment_type"]').selectOption(options.assessmentType || 'exam');
    await assessmentForm.locator('input[name="title"]').fill(assessmentTitle);
    await assessmentForm.locator('input[name="max_points"]').fill('100');
    await assessmentForm.locator('input[name="weight_override"]').fill('100');
    await assessmentForm.locator('input[name="duedate"]').fill(todayInputValue());
    await assessmentForm.locator('input[name="status"]').fill('published');
    await assessmentForm.locator('textarea[name="description"]').fill(options.assessmentDescription || `Automated SQA class completion fixture for ${options.runId}.`);
    await assessmentForm.getByRole('button', { name: /save assessment/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoticeOrRecover(/assessment saved/i, 'assessment save');

    const gradeForm = this.page.locator('form:has(input[name="action"][value="save_grade"])').first();
    await expect(gradeForm).toBeVisible();
    await selectOptionByText(gradeForm.locator('select[name="assessmentid"]'), [assessmentTitle]);
    await gradeForm.locator('select[name="studentid"]').selectOption(options.student.studentUserId);
    await gradeForm.locator('input[name="score_points"]').fill(scorePercent);
    await gradeForm.locator('input[name="score_percent"]').fill(scorePercent);
    await gradeForm.locator('input[name="rubric_note"]').fill(`Automated SQA score for ${options.runId}.`);
    await gradeForm.locator('input[name="correction_reason"]').fill('Initial automated SQA completion fixture.');
    await gradeForm.locator('select[name="status"]').selectOption('published');
    await gradeForm.locator('textarea[name="teacher_feedback"]').fill('Automated SQA completion grade published for transcript readiness.');
    await gradeForm.getByRole('button', { name: /save grade/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.expectNoticeOrRecover(/grade saved and course grade recalculated/i, 'grade save');

    const courseGradeRow = this.page.locator('table.pqgb-table tbody tr', { hasText: options.studentEmail }).first();
    if (!(await courseGradeRow.isVisible().catch(() => false))) {
      const courseGradeTable = await tableText(this.page.locator('table.pqgb-table').first());
      const recentGradeTable = await tableText(this.page.locator('table.pqgb-table').nth(1));
      throw new Error(
        [
          `Course grade row was not created for ${options.studentEmail}.`,
          `Selected offering: ${selectedOfferingLabel}`,
          `Category: ${categoryTitle}`,
          `Course grade table: ${courseGradeTable}`,
          `Recent grade table: ${recentGradeTable}`,
        ].join('\n'),
      );
    }
    await expect(courseGradeRow).toContainText(new RegExp(`${scorePercent.replace('.', '\\.')}%`));
    const courseGradeTextBeforePublish = normalize((await courseGradeRow.textContent()) || '');

    await courseGradeRow.getByRole('button', { name: /publish/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    const publishNotice = await this.expectNoticeOrRecover(/course grade published for transcript use/i, 'course grade publish');

    const publishedRow = this.page.locator('table.pqgb-table tbody tr', { hasText: options.studentEmail }).first();
    await expect(publishedRow).toContainText(/published/i);

    return {
      assessmentTitle,
      categoryTitle,
      selectedOfferingLabel,
      scorePercent,
      courseGradeText: normalize((await publishedRow.textContent()) || courseGradeTextBeforePublish),
      publishNotice,
      finalUrl: this.page.url(),
    };
  }

  async expectPublishedGradeVisible(options: {
    studentEmail: string;
    scorePercent: string;
    offeringTitle?: string;
  }): Promise<string> {
    await this.goto();
    await expect(this.page.getByRole('heading', { name: /gradebook and assessment/i }).first()).toBeVisible();

    const row = this.page.locator('table.pqgb-table tbody tr', { hasText: options.studentEmail }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(`${options.scorePercent.replace('.', '\\.')}%`));
    await expect(row).toContainText(/published/i);
    if (options.offeringTitle) {
      await expect(row).toContainText(options.offeringTitle);
    }

    return normalize((await row.textContent()) || '');
  }
}
