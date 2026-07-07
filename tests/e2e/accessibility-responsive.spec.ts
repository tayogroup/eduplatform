import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import {
  AccessibilityResponsivePage,
  type AccessibilityResponsiveResult,
} from './helpers/accessibility-responsive';
import { JourneyEvidence } from './helpers/evidence';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, type TeacherPortalFixtureResult } from './helpers/teacher-portal';

const ACCESSIBILITY_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withAccessibilityEnv<T>(
  overrides: Partial<Record<(typeof ACCESSIBILITY_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of ACCESSIBILITY_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of ACCESSIBILITY_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function accessibilityRunId(): string {
  return `accessibility-responsive-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function accessibilityEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'accessibility-responsive',
    manifestTitle: 'EduPlatform Accessibility Responsive Manifest',
  });
}

async function createTeacherFixture(page: Page, runId: string): Promise<TeacherOnboardingResult> {
  const env = getEduPlatformEnv({ allowPartial: true });
  const teacherData = buildTeacherJourneyData(`${runId}-teacher`);
  const publicTeacherIntake = new PublicTeacherIntakePage(page, env);

  await logoutFromEduPlatform(page, env).catch(() => undefined);
  await publicTeacherIntake.goto();
  await publicTeacherIntake.expectReady();
  const application = await publicTeacherIntake.submitValidApplication(teacherData);

  await loginToEduPlatform(page, env, adminCredentials(env));
  const queue = new TeacherApplicationQueuePage(page, env);
  await queue.goto();
  const requestId = await queue.approveAndOpenIntake(teacherData, application.requestId);

  const teacherIntake = new TeacherIntakePage(page);
  await teacherIntake.expectPrefilled(teacherData);
  return teacherIntake.createTeacherFromPrefill(teacherData, requestId);
}

async function archiveFixtureIfRequested(options: {
  page: Page;
  evidence: JourneyEvidence;
  fixturePage: TeacherPortalFixturePage;
  runId: string;
  teacher: TeacherOnboardingResult;
  fixture: TeacherPortalFixtureResult;
}): Promise<void> {
  const env = getEduPlatformEnv({ allowPartial: true });
  if (env.cleanupMode !== 'archive') {
    options.evidence.recordCleanupAction({
      target: 'accessibility-responsive-fixture',
      identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
      mode: env.cleanupMode,
      status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
      note: env.cleanupMode === 'delete'
        ? 'Delete cleanup is blocked; use archive mode for generated accessibility records.'
        : 'Accessibility fixture cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
    });
    return;
  }

  await logoutFromEduPlatform(options.page, env).catch(() => undefined);
  await loginToEduPlatform(options.page, env, adminCredentials(env));
  const archived = await options.fixturePage.archive({
    runId: options.runId,
    teacherUserId: options.teacher.teacherUserId,
    fixture: options.fixture,
  });
  options.evidence.recordCleanupAction({
    target: 'accessibility-responsive-fixture',
    identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
    mode: env.cleanupMode,
    status: 'completed',
    note: `Archived accessibility fixture records: ${JSON.stringify(archived.counts)}.`,
  });
  await logoutFromEduPlatform(options.page, env);
}

test.describe('EduPlatform accessibility responsive harness', () => {
  test('validates accessibility responsive configuration and routes', async ({}, testInfo) => {
    await withAccessibilityEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = accessibilityRunId();
      const evidence = accessibilityEvidence(testInfo, runId);
      const adminUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaceDashboard);
      const studentUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaceStudent, { studentid: 123 });
      const parentUrl = buildEduPlatformUrl(env, HUB_ROUTES.parentWorkspace, { childid: 123 });
      const teacherUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);

      evidence.recordStage('accessibility-responsive-helper-smoke', 'passed', 'Generated role routes, evidence, and env guards.');
      evidence.recordId('adminUrl', adminUrl);
      evidence.recordId('studentUrl', studentUrl);
      evidence.recordId('parentUrl', parentUrl);
      evidence.recordId('teacherUrl', teacherUrl);
      const summaryPath = await evidence.writeSummary();

      expect(adminUrl).toContain('/local/hubredirect/workspace_dashboard.php');
      expect(studentUrl).toContain('/local/hubredirect/workspace_student.php');
      expect(parentUrl).toContain('/local/hubredirect/workspace_parent.php');
      expect(teacherUrl).toContain('/local/hubredirect/teacher_portal.php');
      expect(summaryPath).toContain('accessibility-responsive-summary.json');
    });
  });

  test.describe('accessibility responsive smoke live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAccessibilityResponsiveSmoke,
      'Set EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE=true to run mobile viewport and keyboard/label checks across role pages.',
    );

    test('verifies admin, student, parent, and teacher portals at mobile widths with keyboard and label checks', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = accessibilityRunId();
      const evidence = accessibilityEvidence(testInfo, runId);
      const checker = new AccessibilityResponsivePage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);
      const results: AccessibilityResponsiveResult[] = [];

      const teacher = await createTeacherFixture(page, runId);
      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentid || !fixture.parentusername) {
        throw new Error(
          [
            'Accessibility responsive fixture requires a linked parent account.',
            `Fixture: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun accessibility-phase1.',
          ].join('\n'),
        );
      }
      evidence.recordStage('accessibility-phase-1-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentid}`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUserId', String(fixture.parentid));
      evidence.recordId('parentUsername', fixture.parentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      results.push(...await checker.checkTarget({
        label: 'admin workspace dashboard',
        route: HUB_ROUTES.workspaceDashboard,
        expectedText: /course offerings|student intake|workspace/i,
      }));
      evidence.recordStage('accessibility-phase-1-admin-mobile', 'passed', 'Admin workspace dashboard passed mobile, label, and keyboard checks.');
      await evidence.screenshot(page, 'accessibility-phase-1-admin-mobile');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      results.push(...await checker.checkTarget({
        label: 'student workspace',
        route: HUB_ROUTES.workspaceStudent,
        params: { studentid: String(fixture.studentid) },
        expectedText: /student details|assigned materials|attendance/i,
      }));
      evidence.recordStage('accessibility-phase-1-student-mobile', 'passed', 'Student workspace passed mobile, label, and keyboard checks.');
      await evidence.screenshot(page, 'accessibility-phase-1-student-mobile');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      results.push(...await checker.checkTarget({
        label: 'parent workspace',
        route: HUB_ROUTES.parentWorkspace,
        params: { childid: String(fixture.studentid) },
        expectedText: /parent workspace|child|student/i,
      }));
      evidence.recordStage('accessibility-phase-1-parent-mobile', 'passed', 'Parent workspace passed mobile, label, and keyboard checks.');
      await evidence.screenshot(page, 'accessibility-phase-1-parent-mobile');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      results.push(...await checker.checkTarget({
        label: 'teacher portal',
        route: HUB_ROUTES.teacherPortal,
        expectedText: /teacher portal|attendance|student/i,
      }));
      evidence.recordStage('accessibility-phase-1-teacher-mobile', 'passed', 'Teacher portal passed mobile, label, and keyboard checks.');
      await evidence.screenshot(page, 'accessibility-phase-1-teacher-mobile');

      await evidence.attachJson('accessibility-phase-1-results', results);
      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();

      expect(results).toHaveLength(8);
    });
  });

  test.describe('accessibility responsive negative controls', () => {
    test('keeps accessibility responsive live actions disabled unless explicitly truthy', async () => {
      await withAccessibilityEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableAccessibilityResponsiveSmoke).toBe(false);
      });

      await withAccessibilityEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableAccessibilityResponsiveSmoke).toBe(true);
      });
    });
  });
});
