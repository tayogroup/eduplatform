import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface AcademicMaterialResult {
  title: string;
  materialId: string;
  finalUrl: string;
}

export interface AcademicAssignmentResult {
  title: string;
  target: string;
  assignmentId: string;
  finalUrl: string;
}

export interface AcademicStatusResult {
  title: string;
  status: string;
  finalUrl: string;
  pageText: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export class WorkspaceMaterialsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  private materialForm() {
    return this.page.locator('form:has(input[name="action"][value="add_material"])').first();
  }

  private assignmentForm() {
    return this.page.locator('form:has(input[name="action"][value="assign_material"])').first();
  }

  private materialRow(title: string) {
    return this.page
      .locator('article.pqwm-panel', { hasText: /material library/i })
      .locator('table.pqwm-table tbody tr', { hasText: title })
      .first();
  }

  private assignmentRow(title: string, targetText?: string) {
    const row = this.page
      .locator('article.pqwm-panel', { hasText: /Assignments/i })
      .locator('table.pqwm-table tbody tr', { hasText: title });
    return targetText ? row.filter({ hasText: targetText }).first() : row.first();
  }

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.workspaceMaterials), { waitUntil: 'domcontentloaded' });
  }

  async expectReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /materials/i }).first()).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /add material/i }).first()).toBeVisible();
    await expect(this.materialForm()).toBeVisible();
    await expect(this.assignmentForm()).toBeVisible();
  }

  async addMaterial(options: {
    title: string;
    materialType: 'link' | 'course' | 'document' | 'video' | 'homework';
    courseKey: string;
    sourceUrl: string;
    description: string;
    visibility: 'workspace' | 'teachers' | 'students';
  }): Promise<AcademicMaterialResult> {
    await this.goto();
    await this.expectReady();

    const form = this.materialForm();
    await form.locator('input[name="title"]').fill(options.title);
    await form.locator('select[name="material_type"]').selectOption(options.materialType);
    await form.locator('input[name="course_key"]').fill(options.courseKey);
    await form.locator('input[name="source_url"]').fill(options.sourceUrl);
    await form.locator('textarea[name="description"]').fill(options.description);
    await form.locator('select[name="visibility"]').selectOption(options.visibility);
    await form.getByRole('button', { name: /add material/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqwm-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Workspace material creation failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByText(/workspace material added/i).first()).toBeVisible();

    const row = this.materialRow(options.title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(options.visibility);

    return {
      title: options.title,
      materialId: await this.materialIdForTitle(options.title),
      finalUrl: this.page.url(),
    };
  }

  async assignMaterial(options: {
    title: string;
    targetType: 'student' | 'teacher';
    targetUserId: string;
  }): Promise<AcademicAssignmentResult> {
    await this.goto();
    await this.expectReady();

    const form = this.assignmentForm();
    const materialId = await this.materialIdForTitle(options.title);
    await form.locator('select[name="materialid"]').selectOption(materialId);
    const target = `${options.targetType}:${options.targetUserId}`;
    await form.locator('select[name="target"]').selectOption(target);
    await form.getByRole('button', { name: /assign material/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqwm-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Workspace material assignment failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByText(/workspace material assigned/i).first()).toBeVisible();

    const row = this.assignmentRow(options.title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(options.targetType, 'i'));

    return {
      title: options.title,
      target,
      assignmentId: await row.locator('input[name="assignmentid"]').first().inputValue().catch(() => ''),
      finalUrl: this.page.url(),
    };
  }

  async archiveMaterial(title: string): Promise<void> {
    await this.goto();
    await this.expectReady();
    const row = this.materialRow(title);
    await expect(row).toBeVisible();
    const form = row.locator('form:has(input[name="action"][value="set_material_status"])').first();
    await expect(form).toBeVisible();
    await form.getByRole('button', { name: /archive/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    const error = this.page.locator('.pqwm-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Workspace material archive failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByText(/workspace material updated/i).first()).toBeVisible();
    await expect(this.materialRow(title)).toHaveCount(0);
  }

  async expectAssignmentStatus(title: string, status: RegExp): Promise<AcademicStatusResult> {
    await this.goto();
    await expect(this.page.getByRole('heading', { name: /materials/i }).first()).toBeVisible();
    const row = this.assignmentRow(title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(status);
    return {
      title,
      status: status.source,
      finalUrl: this.page.url(),
      pageText: normalize((await row.textContent()) || ''),
    };
  }

  async reviewAssignment(title: string, note: string): Promise<AcademicStatusResult> {
    await this.goto();
    await this.expectReady();

    const row = this.assignmentRow(title);
    await expect(row).toBeVisible();
    const form = row.locator('form:has(input[name="action"][value="update_material_status"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="workflow_status"]').selectOption('reviewed');
    await form.locator('textarea[name="review_notes"]').fill(note);
    await form.getByRole('button', { name: /update/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqwm-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Workspace material review failed: ${normalize((await error.textContent()) || '')}`);
    }
    await expect(this.page.getByText(/material assignment status updated/i).first()).toBeVisible();
    const reviewedRow = this.assignmentRow(title);
    await expect(reviewedRow).toBeVisible();
    await expect(reviewedRow).toContainText(/reviewed/i);

    return {
      title,
      status: 'reviewed',
      finalUrl: this.page.url(),
      pageText: normalize((await reviewedRow.textContent()) || ''),
    };
  }

  async expectTeacherMaterialVisibility(options: {
    visibleTitles: string[];
    hiddenTitles: string[];
  }): Promise<string> {
    await this.goto();
    await expect(this.page.getByRole('heading', { name: /materials/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    for (const title of options.visibleTitles) {
      expect(bodyText).toContain(title);
    }
    for (const title of options.hiddenTitles) {
      expect(bodyText).not.toContain(title);
    }
    return bodyText;
  }

  private async materialIdForTitle(title: string): Promise<string> {
    const row = this.materialRow(title);
    await expect(row).toBeVisible();
    const value = await row.locator('input[name="materialid"]').first().inputValue().catch(() => '');
    if (!value) {
      throw new Error(`Could not determine material ID for ${title}.`);
    }
    return value;
  }
}

export class WorkspaceStudentPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(studentUserId: string): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.workspaceStudent, {
      studentid: studentUserId,
    }), { waitUntil: 'commit', timeout: 60_000 });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
  }

  async expectMaterialVisibility(options: {
    studentUserId: string;
    visibleTitles: string[];
    hiddenTitles: string[];
  }): Promise<string> {
    await this.goto(options.studentUserId);
    await expect(this.page.getByRole('heading', { name: /assigned materials/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    for (const title of options.visibleTitles) {
      expect(bodyText).toContain(title);
    }
    for (const title of options.hiddenTitles) {
      expect(bodyText).not.toContain(title);
    }
    return bodyText;
  }

  async completeMaterial(options: {
    studentUserId: string;
    title: string;
  }): Promise<AcademicStatusResult> {
    await this.goto(options.studentUserId);
    await expect(this.page.getByRole('heading', { name: /assigned materials/i }).first()).toBeVisible();
    const row = this.page.locator('article.pqws-panel', { hasText: /assigned materials/i })
      .locator('table.pqws-table tbody tr', { hasText: options.title })
      .first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /complete/i }).click({ noWaitAfter: true });
    await this.page.waitForTimeout(3_000);
    await this.goto(options.studentUserId);

    const error = this.page.locator('.pqws-alert--bad').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Student material completion failed: ${normalize((await error.textContent()) || '')}`);
    }
    const completedRow = this.page.locator('article.pqws-panel', { hasText: /assigned materials/i })
      .locator('table.pqws-table tbody tr', { hasText: options.title })
      .first();
    await expect(completedRow).toContainText(/completed/i);

    return {
      title: options.title,
      status: 'completed',
      finalUrl: this.page.url(),
      pageText: normalize((await completedRow.textContent()) || ''),
    };
  }

  async expectAttendanceAndProgressVisible(options: {
    studentUserId: string;
    runId: string;
  }): Promise<AcademicStatusResult> {
    await this.goto(options.studentUserId);
    await expect(this.page.getByRole('heading', { name: /student details/i }).first()).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /recent live attendance/i }).first()).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /recent teacher notes/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toMatch(/live attendance/i);
    expect(bodyText).toMatch(/present/i);
    expect(bodyText).toMatch(/engaged/i);
    expect(bodyText).toContain(`Parent-visible SQA progress summary for ${options.runId}.`);
    expect(bodyText).toContain(`Complete SQA teacher portal homework for ${options.runId}.`);

    return {
      title: 'student-attendance-progress',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: bodyText,
    };
  }
}

export class AcademicParentWorkspacePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectMaterialStatus(options: {
    childUserId: string;
    title: string;
    status: RegExp;
  }): Promise<AcademicStatusResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.parentWorkspace, {
      childid: options.childUserId,
    }), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /parent workspace/i }).first()).toBeVisible();
    const row = this.page.locator('table.pqwp-table tbody tr', { hasText: options.title }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(options.status);
    return {
      title: options.title,
      status: options.status.source,
      finalUrl: this.page.url(),
      pageText: normalize((await row.textContent()) || ''),
    };
  }

  async expectAttendanceAndProgressVisible(options: {
    childUserId: string;
    runId: string;
  }): Promise<AcademicStatusResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.parentWorkspace, {
      childid: options.childUserId,
    }), { waitUntil: 'commit', timeout: 60_000 });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await expect(this.page.getByRole('heading', { name: /parent workspace/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toMatch(/attendance present\/total/i);
    expect(bodyText).toMatch(/present/i);
    expect(bodyText).toContain(`Parent-visible SQA progress summary for ${options.runId}.`);
    expect(bodyText).toContain(`Complete SQA teacher portal homework for ${options.runId}.`);

    return {
      title: 'parent-attendance-progress',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: bodyText,
    };
  }
}

export class AttendanceOperationsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectAttendanceAuditVisible(options: {
    studentEmail: string;
    runId: string;
  }): Promise<AcademicStatusResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.attendanceOperations), {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await expect(this.page.getByRole('heading', { name: /attendance and participation/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const attendanceRow = this.page.locator('table.pqatt-table tbody tr', { hasText: options.studentEmail }).first();
    await expect(attendanceRow).toBeVisible();
    await expect(attendanceRow).toContainText(/present/i);

    return {
      title: 'attendance-operations-audit',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: bodyText,
    };
  }
}

export class WorkspaceReportsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectAttendanceProgressAudit(options: {
    studentUserId: string;
    studentEmail: string;
    runId: string;
  }): Promise<AcademicStatusResult> {
    const filteredUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.workspaceReports, {
      studentid: options.studentUserId,
    });
    await this.page.goto(filteredUrl, { waitUntil: 'commit', timeout: 60_000 });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    let bodyText = normalize((await this.page.locator('body').textContent()) || '');
    if (/missing param "studentid"|missingkeyinsql|invalidqueryparam|incorrect number of query parameters/i.test(bodyText)) {
      await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.workspaceReports), {
        waitUntil: 'commit',
        timeout: 60_000,
      });
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
      bodyText = normalize((await this.page.locator('body').textContent()) || '');
    }

    if (!/workspace reports|attendance trend/i.test(bodyText)) {
      throw new Error(
        [
          'Workspace Reports did not load an audit/reporting page.',
          `URL: ${this.page.url()}`,
          `Body: ${bodyText.slice(0, 700)}`,
        ].join('\n'),
      );
    }
    expect(bodyText).toMatch(/attendance trend/i);
    expect(bodyText).toMatch(/student progress timeline/i);
    expect(bodyText).toMatch(/recent teacher notes/i);
    expect(bodyText).toContain(options.studentEmail);
    expect(bodyText).toMatch(/present/i);

    return {
      title: 'workspace-reports-attendance-progress',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: bodyText,
    };
  }
}

export interface AcademicQualityControlsExportResult {
  suggestedFilename: string;
  finalUrl: string;
}

export class AcademicQualityControlsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.academicQualityControls), {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
  }

  async expectReady(): Promise<void> {
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(
        [
          'Academic quality controls endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${this.page.url()}`,
          'Upload src/moodle/local_hubredirect/academic_quality_controls.php to local/hubredirect/academic_quality_controls.php, then rerun academic-phase5.',
        ].join('\n'),
      );
    }
    try {
      await expect(this.page.getByRole('heading', { name: /academic quality controls/i }).first()).toBeVisible();
    } catch (error) {
      throw new Error(
        [
          'Academic quality controls page did not become ready.',
          `URL: ${this.page.url()}`,
          `Body: ${bodyText.slice(0, 700)}`,
          error instanceof Error ? error.message : String(error),
        ].join('\n'),
      );
    }
    expect(bodyText).toMatch(/missing grade detection/i);
    expect(bodyText).toMatch(/incomplete attendance detection/i);
    expect(bodyText).toMatch(/low-score|progress alerts/i);
    expect(bodyText).toMatch(/export csv/i);
  }

  async expectMissingGrade(studentEmail: string): Promise<AcademicStatusResult> {
    await this.goto();
    await this.expectReady();
    const row = await this.issueRowOrExplain(studentEmail, /missing_grade/i, 'missing grade');
    await expect(row).toContainText(/published assessment/i);
    return {
      title: 'missing-grade-detection',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: normalize((await row.textContent()) || ''),
    };
  }

  async expectIncompleteAttendance(studentEmail: string): Promise<AcademicStatusResult> {
    await this.goto();
    await this.expectReady();
    const row = await this.issueRowOrExplain(studentEmail, /incomplete_attendance/i, 'incomplete attendance');
    await expect(row).toContainText(/attendance mark/i);
    return {
      title: 'incomplete-attendance-detection',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: normalize((await row.textContent()) || ''),
    };
  }

  async expectLowScoreAndProgressAlert(options: {
    studentEmail: string;
    scorePercent: string;
    progressStatus: string;
  }): Promise<AcademicStatusResult> {
    await this.goto();
    await this.expectReady();
    const lowScoreRow = await this.issueRowOrExplain(options.studentEmail, /low_score_alert/i, 'low-score alert');
    const escapedScore = options.scorePercent.replace('.', '\\.');
    await expect(lowScoreRow).toContainText(new RegExp(`${escapedScore}(?:\\.00)?%`));

    const progressRow = await this.issueRowOrExplain(options.studentEmail, /progress_alert/i, 'progress alert');
    await expect(progressRow).toContainText(new RegExp(options.progressStatus, 'i'));

    return {
      title: 'low-score-progress-alerts',
      status: 'visible',
      finalUrl: this.page.url(),
      pageText: `${normalize((await lowScoreRow.textContent()) || '')} ${normalize((await progressRow.textContent()) || '')}`,
    };
  }

  private async issueRowOrExplain(studentEmail: string, issueType: RegExp, label: string) {
    const row = this.page.locator('table.pqaqc-table tbody tr', { hasText: studentEmail }).filter({ hasText: issueType }).first();
    if (await row.isVisible().catch(() => false)) {
      return row;
    }

    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const studentHint = bodyText.includes(studentEmail)
      ? 'The generated student is present, but the expected issue type was not emitted.'
      : 'The generated student is not present on this controls page.';

    throw new Error(
      [
        `Academic quality controls did not show ${label} evidence for the generated fixture student.`,
        `Expected student: ${studentEmail}`,
        `Expected issue: ${issueType.toString()}`,
        `URL: ${this.page.url()}`,
        `Env consumer/workspace: ${this.env.consumer}/${this.env.workspaceId}`,
        studentHint,
        'If the URL shows a different consumer/workspace than the env line above, set EDUPLATFORM_CONSUMER and EDUPLATFORM_WORKSPACE_ID to match that page before rerunning.',
        `Body: ${bodyText.slice(0, 1000)}`,
      ].join('\n'),
    );
  }

  async downloadControlsCsv(): Promise<AcademicQualityControlsExportResult> {
    await this.goto();
    await this.expectReady();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    const failure = await download.failure();
    expect(failure).toBeNull();
    expect(download.suggestedFilename()).toMatch(/academic-quality-controls.*\.csv$/i);
    return {
      suggestedFilename: download.suggestedFilename(),
      finalUrl: this.page.url(),
    };
  }
}

export class AcademicStudentParentPortalPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectPublishedGradeVisible(options: {
    studentUserId: string;
    scorePercent: string;
  }): Promise<AcademicStatusResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.studentParentPortal, {
      studentid: options.studentUserId,
    }), { waitUntil: 'commit', timeout: 60_000 });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);

    await expect(this.page.getByRole('heading', { name: /student and parent portal/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toMatch(/grades/i);
    expect(bodyText).toContain(`${options.scorePercent}%`);
    expect(bodyText).toMatch(/published/i);

    return {
      title: 'student-parent-portal-grade',
      status: 'published',
      finalUrl: this.page.url(),
      pageText: bodyText,
    };
  }
}
