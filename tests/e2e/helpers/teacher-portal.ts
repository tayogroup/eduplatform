import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface TeacherPortalFixtureResult {
  mode?: string;
  teacherid: number;
  workspaceid: number;
  studentid: number;
  studentusername: string;
  studentemail: string;
  parentid?: number;
  parentusername?: string;
  parentemail?: string;
  assignmentid: number;
  sessionid: number;
  assessmentid: number;
}

export interface TeacherPortalArchiveResult {
  mode: 'archive';
  teacherid: number;
  studentid: number;
  sessionid: number;
  assessmentid: number;
  counts: Record<string, number>;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseFixtureJson(text: string): TeacherPortalFixtureResult {
  const payload = JSON.parse(text) as TeacherPortalFixtureResult;
  for (const key of ['teacherid', 'workspaceid', 'studentid', 'assignmentid', 'sessionid', 'assessmentid'] as const) {
    if (!Number.isFinite(Number(payload[key])) || Number(payload[key]) <= 0) {
      throw new Error(`Teacher portal fixture did not return a valid ${key}: ${text}`);
    }
  }
  return payload;
}

export class TeacherPortalFixturePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async create(options: {
    runId: string;
    teacherUserId: string;
  }): Promise<TeacherPortalFixtureResult> {
    const fixtureUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.sqaTeacherPortalFixture, {
      teacherid: options.teacherUserId,
    });
    const response = await this.page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' });
    const pageText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (response?.status() === 404 || /404|not found/i.test(pageText)) {
      throw new Error(
        [
          'Teacher portal fixture endpoint is not deployed on the target EduPlatform server.',
          `Missing URL: ${fixtureUrl}`,
          'Upload src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun teacher-phase3.',
        ].join('\n'),
      );
    }
    await expect(this.page.getByRole('heading', { name: /sqa teacher portal fixture/i }).first()).toBeVisible();

    await this.page.locator('input[name="workspaceid"]').fill(this.env.workspaceId);
    await this.page.locator('input[name="teacherid"]').fill(options.teacherUserId);
    await this.page.locator('input[name="runid"]').fill(options.runId);
    await this.page.locator('input[name="coursekey"]').fill(this.env.testCourseKey || 'pre_quraan');
    await this.page.locator('input[name="studentpassword"]').fill(this.env.studentPassword);
    await this.page.locator('input[name="teacherpassword"]').fill(this.env.teacherPassword);
    await this.page.getByRole('button', { name: /create teacher portal fixture/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqsqtf-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Teacher portal fixture failed: ${normalize((await error.textContent()) || '')}`);
    }

    await expect(this.page.locator('.pqsqtf-ok').first()).toContainText(/fixture ready/i);
    return parseFixtureJson((await this.page.locator('#pqsqtf-result').textContent()) || '{}');
  }

  async archive(options: {
    runId: string;
    teacherUserId: string;
    fixture: TeacherPortalFixtureResult;
  }): Promise<TeacherPortalArchiveResult> {
    const fixtureUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.sqaTeacherPortalFixture, {
      teacherid: options.teacherUserId,
      studentid: String(options.fixture.studentid),
      sessionid: String(options.fixture.sessionid),
      assessmentid: String(options.fixture.assessmentid),
      action: 'archive',
    });
    await this.page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /sqa teacher portal fixture/i }).first()).toBeVisible();

    const fixtureForm = this.page.locator('form:has(input[name="teacherid"])').first();
    await expect(fixtureForm).toBeVisible();
    await fixtureForm.locator('input[name="workspaceid"]').fill(this.env.workspaceId);
    await fixtureForm.locator('input[name="teacherid"]').fill(options.teacherUserId);
    await fixtureForm.locator('input[name="runid"]').fill(options.runId);
    await fixtureForm.locator('input[name="coursekey"]').fill(this.env.testCourseKey || 'pre_quraan');
    await fixtureForm.evaluate((form) => {
      let input = form.querySelector<HTMLInputElement>('input[name="action"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'action';
        form.appendChild(input);
      }
      input.value = 'archive';
    });
    await fixtureForm.getByRole('button', { name: /create teacher portal fixture/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqsqtf-error').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Teacher portal fixture archive failed: ${normalize((await error.textContent()) || '')}`);
    }

    await expect(this.page.locator('.pqsqtf-ok').first()).toContainText(/fixture ready/i);
    const archive = JSON.parse((await this.page.locator('#pqsqtf-result').textContent()) || '{}') as TeacherPortalArchiveResult;
    if (archive.mode !== 'archive') {
      throw new Error(
        [
          'Teacher portal fixture archive did not run on the target server.',
          `Received: ${JSON.stringify(archive)}`,
          'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun teacher-phase5.',
        ].join('\n'),
      );
    }
    return archive;
  }
}

export class TeacherPortalPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.teacherPortal), { waitUntil: 'domcontentloaded' });
  }

  async expectReady(fixture: TeacherPortalFixtureResult): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /teacher portal/i }).first();
    try {
      await expect(heading).toBeVisible();
    } catch (error) {
      const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
      const loginFormVisible = await this.page.locator('form').filter({
        has: this.page.getByLabel(/username|email/i),
      }).first().isVisible().catch(() => false);
      throw new Error(
        [
          loginFormVisible
            ? 'Teacher portal redirected to login after teacher authentication.'
            : 'Teacher portal did not become ready.',
          `URL: ${this.page.url()}`,
          `Expected session=${fixture.sessionid}, student=${fixture.studentid}, assessment=${fixture.assessmentid}.`,
          `Page: ${bodyText.slice(0, 500)}`,
          error instanceof Error ? error.message : String(error),
        ].join('\n'),
      );
    }
    await expect(this.page.locator('select[name="sessionid"]').first()).toHaveValue(String(fixture.sessionid));
    await expect(this.page.locator('select[name="studentid"]').first()).toHaveValue(String(fixture.studentid));
    await expect(this.page.locator('select[name="assessmentid"]').first()).toHaveValue(String(fixture.assessmentid));
    await expect(this.page.locator('body')).toContainText(fixture.studentemail);
  }

  async saveAttendance(runId: string, fixture: TeacherPortalFixtureResult): Promise<void> {
    const form = this.page.locator('form:has(input[name="action"][value="attendance"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="sessionid"]').selectOption(String(fixture.sessionid));
    await form.locator('select[name="studentid"]').selectOption(String(fixture.studentid));
    await form.locator('select[name="attendance_status"]').selectOption('present');
    await form.locator('input[name="participation_status"]').fill('engaged');
    await form.locator('textarea[name="notes"]').fill(`Automated SQA attendance note for ${runId}.`);
    await form.getByRole('button', { name: /save attendance/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqtp-notice').first()).toContainText(/attendance saved/i);
  }

  async saveNotesAndHomework(runId: string, fixture: TeacherPortalFixtureResult): Promise<void> {
    const form = this.page.locator('form:has(input[name="action"][value="note"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="sessionid"]').selectOption(String(fixture.sessionid));
    await form.locator('select[name="studentid"]').selectOption(String(fixture.studentid));
    await form.locator('textarea[name="strengths"]').fill(`Strong recitation focus for ${runId}.`);
    await form.locator('textarea[name="needs_practice"]').fill(`Needs practice on teacher portal SQA drill ${runId}.`);
    await form.locator('textarea[name="homework"]').fill(`Complete SQA teacher portal homework for ${runId}.`);
    await form.locator('textarea[name="parent_summary"]').fill(`Parent-visible SQA progress summary for ${runId}.`);
    await form.locator('textarea[name="private_note"]').fill(`Private SQA teacher note for ${runId}.`);
    await form.locator('input[name="homework_due_date"]').fill('2026-07-12');
    await form.getByRole('button', { name: /save notes/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqtp-notice').first()).toContainText(/notes, homework/i);
  }

  async saveGrade(runId: string, fixture: TeacherPortalFixtureResult, options: {
    scorePoints?: string;
    scorePercent?: string;
    letterGrade?: string;
    status?: 'draft' | 'reviewed' | 'published';
    feedback?: string;
  } = {}): Promise<void> {
    const form = this.page.locator('form:has(input[name="action"][value="grade"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="assessmentid"]').selectOption(String(fixture.assessmentid));
    await form.locator('select[name="studentid"]').selectOption(String(fixture.studentid));
    await form.locator('input[name="offeringid"]').fill('0');
    await form.locator('input[name="score_points"]').fill(options.scorePoints || options.scorePercent || '96');
    await form.locator('input[name="score_percent"]').fill(options.scorePercent || '96');
    await form.locator('input[name="letter_grade"]').fill(options.letterGrade || 'A');
    await form.locator('select[name="status"]').selectOption(options.status || 'published');
    await form.locator('textarea[name="teacher_feedback"]').fill(options.feedback || `Automated SQA teacher portal grade feedback for ${runId}.`);
    await form.getByRole('button', { name: /save grade/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqtp-notice').first()).toContainText(/assessment grade saved/i);
  }

  async saveProgress(runId: string, fixture: TeacherPortalFixtureResult, options: {
    currentLevel?: string;
    placementLevel?: string;
    advancementStatus?: string;
    recommendedCourseKey?: string;
    recommendationReason?: string;
    teacherComment?: string;
  } = {}): Promise<void> {
    const form = this.page.locator('form:has(input[name="action"][value="progress"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="studentid"]').selectOption(String(fixture.studentid));
    await form.locator('input[name="current_level"]').fill(options.currentLevel || 'Pre-quraan Course');
    await form.locator('input[name="placement_level"]').fill(options.placementLevel || 'Level 1');
    await form.locator('input[name="advancement_status"]').fill(options.advancementStatus || 'on_track');
    await form.locator('input[name="recommended_course_key"]').fill(options.recommendedCourseKey || this.env.testCourseKey || 'pre_quraan');
    await form.locator('input[name="recommendation_reason"]').fill(options.recommendationReason || `Automated SQA teacher portal recommendation for ${runId}.`);
    await form.locator('input[name="teacher_comment"]').fill(options.teacherComment || `Automated SQA teacher portal progress comment for ${runId}.`);
    await form.getByRole('button', { name: /save progress/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqtp-notice').first()).toContainText(/student progress updated/i);
  }
}
