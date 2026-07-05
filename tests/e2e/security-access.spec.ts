import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import {
  adminCredentials,
  consumerLoginUrl,
  expectLoggedInToEduPlatform,
  loginToEduPlatform,
  logoutFromEduPlatform,
} from './helpers/auth';
import { JourneyEvidence } from './helpers/evidence';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { SecurityAccessProbe } from './helpers/security-access';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, type TeacherPortalFixtureResult } from './helpers/teacher-portal';

const SECURITY_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withSecurityEnv<T>(
  overrides: Partial<Record<(typeof SECURITY_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of SECURITY_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of SECURITY_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function securityRunId(): string {
  return `security-access-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function securityEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'security-access',
    manifestTitle: 'EduPlatform Security Access Manifest',
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
  label: string;
}): Promise<void> {
  const env = getEduPlatformEnv({ allowPartial: true });
  if (env.cleanupMode !== 'archive') {
    options.evidence.recordCleanupAction({
      target: `security-access-${options.label}`,
      identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
      mode: env.cleanupMode,
      status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
      note: env.cleanupMode === 'delete'
        ? 'Delete cleanup is blocked; use archive mode for generated access-control records.'
        : 'Security access fixture cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
    });
    return;
  }

  await loginToEduPlatform(options.page, env, adminCredentials(env));
  const archived = await options.fixturePage.archive({
    runId: options.runId,
    teacherUserId: options.teacher.teacherUserId,
    fixture: options.fixture,
  });
  options.evidence.recordCleanupAction({
    target: `security-access-${options.label}`,
    identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
    mode: env.cleanupMode,
    status: 'completed',
    note: `Archived access-control fixture records: ${JSON.stringify(archived.counts)}.`,
  });
  await logoutFromEduPlatform(options.page, env);
}

test.describe('EduPlatform security access harness', () => {
  test('validates security access configuration and routes', async ({}, testInfo) => {
    await withSecurityEnv({
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
      const runId = securityRunId();
      const evidence = securityEvidence(testInfo, runId);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      const intakeRequestsUrl = buildEduPlatformUrl(env, HUB_ROUTES.intakeRequests);
      const parentWorkspaceUrl = buildEduPlatformUrl(env, HUB_ROUTES.parentWorkspace, { childid: 123 });

      evidence.recordStage('security-access-helper-smoke', 'passed', 'Generated security routes, evidence, and env guards.');
      evidence.recordId('teacherPortalUrl', teacherPortalUrl);
      evidence.recordId('intakeRequestsUrl', intakeRequestsUrl);
      evidence.recordId('parentWorkspaceUrl', parentWorkspaceUrl);
      const summaryPath = await evidence.writeSummary();

      expect(teacherPortalUrl).toContain('/local/hubredirect/teacher_portal.php');
      expect(intakeRequestsUrl).toContain('/local/hubredirect/intake_requests.php');
      expect(parentWorkspaceUrl).toContain('/local/hubredirect/workspace_parent.php');
      expect(summaryPath).toContain('security-access-summary.json');
    });
  });

  test.describe('role boundary and direct URL access control live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableSecurityAccessControl,
      'Set EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL=true to verify role boundaries, direct URL denial, and login redirects.',
    );

    test('verifies student, parent, teacher, direct URL, and session access boundaries', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = securityRunId();
      const evidence = securityEvidence(testInfo, runId);
      const fixturePage = new TeacherPortalFixturePage(page, env);
      const probe = new SecurityAccessProbe(page, env);

      const teacherA = await createTeacherFixture(page, `${runId}-a`);
      const fixtureA = await fixturePage.create({ runId: `${runId}-a`, teacherUserId: teacherA.teacherUserId });
      const teacherB = await createTeacherFixture(page, `${runId}-b`);
      const fixtureB = await fixturePage.create({ runId: `${runId}-b`, teacherUserId: teacherB.teacherUserId });
      if (!fixtureA.parentid || !fixtureA.parentusername || !fixtureB.parentid || !fixtureB.parentusername) {
        throw new Error(
          [
            'Security access fixture requires linked parent accounts for both generated students.',
            `Fixture A: ${JSON.stringify(fixtureA)}`,
            `Fixture B: ${JSON.stringify(fixtureB)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun security-phase1.',
          ].join('\n'),
        );
      }

      evidence.recordStage('security-phase-1-fixtures-created', 'passed', `Teacher/student pairs ${teacherA.teacherUserId}/${fixtureA.studentid} and ${teacherB.teacherUserId}/${fixtureB.studentid}.`);
      evidence.recordId('teacherAUserId', teacherA.teacherUserId);
      evidence.recordId('teacherAUsername', teacherA.teacherUsername);
      evidence.recordId('studentAUserId', String(fixtureA.studentid));
      evidence.recordId('studentAUsername', fixtureA.studentusername);
      evidence.recordId('parentAUserId', String(fixtureA.parentid));
      evidence.recordId('parentAUsername', fixtureA.parentusername);
      evidence.recordId('teacherBUserId', teacherB.teacherUserId);
      evidence.recordId('teacherBUsername', teacherB.teacherUsername);
      evidence.recordId('studentBUserId', String(fixtureB.studentid));
      evidence.recordId('studentBUsername', fixtureB.studentusername);
      await evidence.screenshot(page, 'security-phase-1-fixtures-created');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixtureA.studentusername,
        password: env.studentPassword,
      });
      await probe.goto(HUB_ROUTES.teacherPortal);
      const studentTeacherPortalDenied = await probe.expectBlocked('student-direct-teacher-portal-denied');
      await probe.goto(HUB_ROUTES.intakeRequests);
      const studentAdminQueueDenied = await probe.expectBlocked('student-direct-admin-intake-queue-denied');
      evidence.recordStage('security-phase-1-student-boundaries', 'passed', `${studentTeacherPortalDenied.outcome}; ${studentAdminQueueDenied.outcome}`);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixtureA.parentusername,
        password: env.studentPassword,
      });
      const parentLinked = await probe.expectParentCanSeeLinkedChild({
        childUserId: String(fixtureA.studentid),
        childEmail: fixtureA.studentemail,
        childUsername: fixtureA.studentusername,
      });
      await probe.goto(HUB_ROUTES.parentWorkspace, { childid: String(fixtureB.studentid) });
      const parentUnlinkedDenied = await probe.expectBlocked('parent-direct-unlinked-child-denied');
      evidence.recordStage('security-phase-1-parent-boundaries', 'passed', `${parentLinked.outcome}; ${parentUnlinkedDenied.outcome}`);
      await evidence.screenshot(page, 'security-phase-1-parent-boundary');

      await logoutFromEduPlatform(page, env);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      await loginToEduPlatform(page, env, {
        username: teacherA.teacherUsername,
        password: env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, teacherPortalUrl),
      });
      await expectLoggedInToEduPlatform(page, teacherA.teacherUsername);
      const teacherRoster = await probe.expectTeacherPortalAllowsOnlyAssignedStudent({
        assignedStudentEmail: fixtureA.studentemail,
        unassignedStudentEmail: fixtureB.studentemail,
      });
      await probe.goto(HUB_ROUTES.workspaceStudent, { studentid: String(fixtureB.studentid) });
      const teacherUnassignedDenied = await probe.expectBlocked('teacher-direct-unassigned-student-profile-denied');
      await probe.goto(HUB_ROUTES.intakeRequests);
      const teacherAdminQueueDenied = await probe.expectBlocked('teacher-direct-admin-intake-queue-denied');
      evidence.recordStage('security-phase-1-teacher-boundaries', 'passed', `${teacherRoster.outcome}; ${teacherUnassignedDenied.outcome}; ${teacherAdminQueueDenied.outcome}`);
      await evidence.screenshot(page, 'security-phase-1-teacher-boundary');

      await logoutFromEduPlatform(page, env);
      await probe.goto(HUB_ROUTES.workspaceStudent, { studentid: String(fixtureA.studentid) });
      const anonymousStudentProfileDenied = await probe.expectBlocked('logged-out-student-profile-redirects-to-login');
      evidence.recordStage('security-phase-1-session-redirect', 'passed', anonymousStudentProfileDenied.outcome);

      await archiveFixtureIfRequested({
        page,
        evidence,
        fixturePage,
        runId: `${runId}-a`,
        teacher: teacherA,
        fixture: fixtureA,
        label: 'fixture-a',
      });
      await archiveFixtureIfRequested({
        page,
        evidence,
        fixturePage,
        runId: `${runId}-b`,
        teacher: teacherB,
        fixture: fixtureB,
        label: 'fixture-b',
      });

      evidence.recordStage('security-phase-1-cleanup-evaluated', 'passed', env.cleanupMode);
      await evidence.attachJson('security-phase-1-access-control-result', {
        teacherA,
        fixtureA,
        teacherB,
        fixtureB,
        studentTeacherPortalDenied,
        studentAdminQueueDenied,
        parentLinked,
        parentUnlinkedDenied,
        teacherRoster,
        teacherUnassignedDenied,
        teacherAdminQueueDenied,
        anonymousStudentProfileDenied,
      });
      await evidence.writeSummary();

      expect(studentTeacherPortalDenied.outcome).toMatch(/blocked|login/);
      expect(studentAdminQueueDenied.outcome).toMatch(/blocked|login/);
      expect(parentUnlinkedDenied.outcome).toMatch(/blocked|login/);
      expect(teacherUnassignedDenied.outcome).toMatch(/blocked|login/);
      expect(anonymousStudentProfileDenied.outcome).toBe('login');
    });
  });

  test.describe('security access negative controls', () => {
    test('keeps access-control live actions disabled unless explicitly truthy', async () => {
      await withSecurityEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableSecurityAccessControl).toBe(false);
      });

      await withSecurityEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableSecurityAccessControl).toBe(true);
      });
    });
  });
});
