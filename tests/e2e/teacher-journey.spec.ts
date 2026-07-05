import { expect, test, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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
import { buildEduPlatformUrl, HUB_ROUTES, publicTeacherIntakeUrl } from './helpers/routes';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  TeacherMarketplacePage,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, TeacherPortalPage } from './helpers/teacher-portal';

const TEACHER_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_TEACHER_INTAKE_SUBMIT',
  'EDUPLATFORM_ENABLE_TEACHER_ONBOARDING',
  'EDUPLATFORM_ENABLE_FULL_TEACHER_JOURNEY',
  'EDUPLATFORM_ENABLE_TEACHER_PORTAL_OPS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withTeacherEduPlatformEnv<T>(
  overrides: Partial<Record<(typeof TEACHER_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of TEACHER_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of TEACHER_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function teacherEvidence(testInfo: TestInfo, runId: string) {
  const env = getEduPlatformEnv({ allowPartial: true });
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(env), {
    artifactPrefix: 'teacher-journey',
    manifestTitle: 'EduPlatform Teacher Journey Manifest',
  });
}

test.describe('EduPlatform teacher journey harness', () => {
  test('validates teacher E2E configuration and routes', async ({}, testInfo) => {
    const env = getEduPlatformEnv({ allowPartial: true });
    assertEduPlatformEnv(env);
    const data = buildTeacherJourneyData();
    const evidence = teacherEvidence(testInfo, data.runId);
    const publicUrl = publicTeacherIntakeUrl(env);
    const onboardingUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherIntake);
    const portalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);

    await testInfo.attach('eduplatform-teacher-e2e-env', {
      body: JSON.stringify(redactedEduPlatformEnv(env), null, 2),
      contentType: 'application/json',
    });
    await evidence.attachJson('generated-teacher-data', {
      runId: data.runId,
      teacherEmail: data.teacher.email,
      teacherDisplayName: data.teacher.displayName,
    });
    evidence.recordStage('teacher-phase-0-helper-smoke', 'passed', 'Generated teacher data, routes, evidence, and env guards.');
    evidence.recordId('workspaceId', env.workspaceId);
    evidence.recordId('testCourseKey', env.testCourseKey);
    const summaryPath = await evidence.writeSummary();

    expect(publicUrl).toContain('/local/hubredirect/public_teacher_intake.php');
    expect(onboardingUrl).toContain('/local/hubredirect/teacher_intake.php');
    expect(portalUrl).toContain('/local/hubredirect/teacher_portal.php');
    expect(data.runId).toMatch(/^sqa-teacher-\d{8}-\d{6}-[a-z0-9]{6}$/);
    expect(summaryPath).toContain('teacher-journey-summary.json');
  });

  test.describe('teacher public intake live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableTeacherIntakeSubmit,
      'Set EDUPLATFORM_ENABLE_TEACHER_INTAKE_SUBMIT=true to create a real teacher application.',
    );

    test('submits a public teacher application when explicitly enabled', async ({ page }, testInfo) => {
      const env = getEduPlatformEnv();
      const data = buildTeacherJourneyData();
      const evidence = teacherEvidence(testInfo, data.runId);
      const publicTeacherIntake = new PublicTeacherIntakePage(page, env);

      await publicTeacherIntake.goto();
      await publicTeacherIntake.expectReady();
      evidence.recordStage('teacher-phase-1-public-form-ready', 'passed', publicTeacherIntakeUrl(env));

      const result = await publicTeacherIntake.submitValidApplication(data);
      evidence.recordStage('teacher-phase-1-public-application-submitted', 'passed', result.confirmationText);
      evidence.recordId('teacherApplicationRequestId', result.requestId);
      evidence.recordId('teacherEmail', data.teacher.email);
      await evidence.screenshot(page, 'teacher-public-application-submitted');
      await evidence.writeSummary();

      expect(result.submitted).toBe(true);
      expect(result.finalUrl).toContain('submitted=1');
      expect(result.requestId).not.toEqual('');
    });
  });

  test.describe('full teacher onboarding live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableFullTeacherJourney,
      'Set EDUPLATFORM_ENABLE_FULL_TEACHER_JOURNEY=true to submit, approve, create, and publish a real teacher.',
    );

    test('submits, approves, creates, and publishes a teacher profile', async ({ page }, testInfo) => {
      test.setTimeout(90_000);

      const env = getEduPlatformEnv();
      const data = buildTeacherJourneyData();
      const evidence = teacherEvidence(testInfo, data.runId);
      const publicTeacherIntake = new PublicTeacherIntakePage(page, env);

      await publicTeacherIntake.goto();
      await publicTeacherIntake.expectReady();
      const application = await publicTeacherIntake.submitValidApplication(data);
      evidence.recordStage('teacher-phase-1-public-application-submitted', 'passed', application.confirmationText);
      evidence.recordId('teacherApplicationRequestId', application.requestId);
      await evidence.screenshot(page, 'teacher-public-application-submitted');

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('teacher-phase-2-admin-login', 'passed', env.adminUsername);

      const queue = new TeacherApplicationQueuePage(page, env);
      await queue.goto();
      const requestId = await queue.approveAndOpenIntake(data, application.requestId);
      evidence.recordStage('teacher-phase-3-application-approved', 'passed', `Teacher application ${requestId} approved.`);

      const teacherIntake = new TeacherIntakePage(page);
      await teacherIntake.expectPrefilled(data);
      const created = await teacherIntake.createTeacherFromPrefill(data, requestId);
      evidence.recordStage('teacher-phase-4-teacher-created', 'passed', created.createdText);
      evidence.recordId('teacherUserId', created.teacherUserId);
      evidence.recordId('teacherUsername', created.teacherUsername);
      evidence.recordId('teacherAccountId', created.teacherAccountId);
      evidence.recordId('teacherProfileId', created.profileId);
      await evidence.screenshot(page, 'teacher-onboarding-created');

      const marketplace = new TeacherMarketplacePage(page, env);
      await marketplace.expectPublishedTeacher(data);
      evidence.recordStage('teacher-phase-5-marketplace-visible', 'passed', data.teacher.displayName);
      await evidence.screenshot(page, 'teacher-marketplace-visible');

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('teacher-phase-6-admin-logout', 'passed');
      await evidence.writeSummary();

      expect(created.teacherUserId).not.toEqual('');
      expect(created.profileId).not.toEqual('');
    });
  });

  test.describe('teacher portal classroom operations live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableTeacherPortalOps,
      'Set EDUPLATFORM_ENABLE_TEACHER_PORTAL_OPS=true to create a teacher portal fixture and exercise classroom operations.',
    );

    test('creates a teacher portal fixture and saves attendance, homework, grade, and progress', async ({ page }, testInfo) => {
      test.setTimeout(120_000);

      const env = getEduPlatformEnv();
      const data = buildTeacherJourneyData();
      const evidence = teacherEvidence(testInfo, data.runId);
      const publicTeacherIntake = new PublicTeacherIntakePage(page, env);

      await publicTeacherIntake.goto();
      await publicTeacherIntake.expectReady();
      const application = await publicTeacherIntake.submitValidApplication(data);
      evidence.recordStage('teacher-phase-1-public-application-submitted', 'passed', application.confirmationText);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('teacher-phase-2-admin-login', 'passed', env.adminUsername);

      const queue = new TeacherApplicationQueuePage(page, env);
      await queue.goto();
      const requestId = await queue.approveAndOpenIntake(data, application.requestId);
      evidence.recordStage('teacher-phase-3-application-approved', 'passed', `Teacher application ${requestId} approved.`);

      const teacherIntake = new TeacherIntakePage(page);
      await teacherIntake.expectPrefilled(data);
      const created = await teacherIntake.createTeacherFromPrefill(data, requestId);
      evidence.recordStage('teacher-phase-4-teacher-created', 'passed', created.createdText);
      evidence.recordId('teacherUserId', created.teacherUserId);
      evidence.recordId('teacherUsername', created.teacherUsername);
      evidence.recordId('teacherProfileId', created.profileId);

      const fixturePage = new TeacherPortalFixturePage(page, env);
      const fixture = await fixturePage.create({
        runId: data.runId,
        teacherUserId: created.teacherUserId,
      });
      evidence.recordStage('teacher-phase-7-portal-fixture-created', 'passed', JSON.stringify(fixture));
      evidence.recordId('teacherPortalStudentId', fixture.studentid);
      evidence.recordId('teacherPortalSessionId', fixture.sessionid);
      evidence.recordId('teacherPortalAssessmentId', fixture.assessmentid);
      await evidence.screenshot(page, 'teacher-portal-fixture-created');

      await logoutFromEduPlatform(page, env);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      await loginToEduPlatform(page, env, {
        username: created.teacherUsername,
        password: env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, teacherPortalUrl),
      });
      await expectLoggedInToEduPlatform(page, created.teacherUsername);
      evidence.recordStage('teacher-phase-8-teacher-login', 'passed', created.teacherUsername);

      const teacherPortal = new TeacherPortalPage(page, env);
      await teacherPortal.goto();
      await teacherPortal.expectReady(fixture);
      evidence.recordStage('teacher-phase-9-portal-ready', 'passed', fixture.studentemail);
      await evidence.screenshot(page, 'teacher-portal-ready');

      await teacherPortal.saveAttendance(data.runId, fixture);
      evidence.recordStage('teacher-phase-10-attendance-saved', 'passed', String(fixture.sessionid));
      await teacherPortal.saveNotesAndHomework(data.runId, fixture);
      evidence.recordStage('teacher-phase-11-notes-homework-saved', 'passed', String(fixture.studentid));
      await teacherPortal.saveGrade(data.runId, fixture);
      evidence.recordStage('teacher-phase-12-grade-saved', 'passed', String(fixture.assessmentid));
      await teacherPortal.saveProgress(data.runId, fixture);
      evidence.recordStage('teacher-phase-13-progress-saved', 'passed', String(fixture.studentid));
      await evidence.screenshot(page, 'teacher-portal-progress-saved');

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('teacher-phase-14-teacher-logout', 'passed');
      await evidence.writeSummary();

      expect(fixture.studentid).toBeGreaterThan(0);
      expect(fixture.sessionid).toBeGreaterThan(0);
      expect(fixture.assessmentid).toBeGreaterThan(0);
    });
  });

  test.describe('teacher reporting and cleanup readiness', () => {
    test('writes teacher manifest, verdict, failed-stage, and cleanup disposition artifacts', async ({}, testInfo) => {
      const env = getEduPlatformEnv({ allowPartial: true });
      const data = buildTeacherJourneyData();
      const evidence = teacherEvidence(testInfo, data.runId);

      evidence.recordStage('teacher-phase-15-reporting-started', 'passed', 'Teacher reporting manifest smoke started.');
      evidence.recordId('teacherUserId', 'teacher-phase4-teacher-smoke');
      evidence.recordId('teacherProfileId', 'teacher-profile-phase4-smoke');
      evidence.recordId('teacherPortalSessionId', 'teacher-session-phase4-smoke');
      evidence.recordCleanupAction({
        target: 'teacher-account',
        identifier: 'teacher-phase4-teacher-smoke',
        mode: env.cleanupMode,
        status: env.cleanupMode === 'none' ? 'skipped' : 'planned',
        note: 'Teacher reporting smoke verifies cleanup disposition is captured without changing live data.',
      });
      evidence.recordCleanupAction({
        target: 'teacher-portal-evidence',
        identifier: 'teacher-session-phase4-smoke',
        mode: env.cleanupMode,
        status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
        note: 'Classroom operation evidence is retained for audit review.',
      });
      evidence.recordStage('teacher-phase-15-reporting-completed', 'passed', 'Teacher reporting manifest smoke completed.');

      const summaryPath = await evidence.writeSummary();
      const manifestPath = summaryPath.replace(/teacher-journey-summary\.json$/, 'teacher-journey-manifest.md');
      const summary = JSON.parse(await readFile(summaryPath, 'utf8')) as {
        verdict?: string;
        records?: Record<string, unknown>;
        cleanup?: { status?: string; actions?: unknown[] };
        artifacts?: string[];
      };
      const manifest = await readFile(manifestPath, 'utf8');

      expect(summary.verdict).toBe('passed');
      expect(summary.records?.teacherUserId).toBe('teacher-phase4-teacher-smoke');
      expect(summary.cleanup?.actions?.length).toBeGreaterThanOrEqual(2);
      expect(summary.artifacts?.some((artifact) => artifact.endsWith('teacher-journey-summary.json'))).toBe(true);
      expect(manifest).toContain('# EduPlatform Teacher Journey Manifest');
      expect(manifest).toContain('Verdict: passed');
      expect(manifest).toContain('teacher-account teacher-phase4-teacher-smoke');
      expect(manifest).toContain('teacher-portal-evidence teacher-session-phase4-smoke');
    });
  });

  test.describe('teacher negative controls', () => {
    test('keeps teacher live action flags disabled unless explicitly truthy', async () => {
      await withTeacherEduPlatformEnv({
        EDUPLATFORM_BASE_URL: 'http://localhost:8080',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_TEACHER_INTAKE_SUBMIT: 'false',
        EDUPLATFORM_ENABLE_TEACHER_ONBOARDING: '',
        EDUPLATFORM_ENABLE_FULL_TEACHER_JOURNEY: '0',
        EDUPLATFORM_ENABLE_TEACHER_PORTAL_OPS: 'off',
      }, async () => {
        const env = getEduPlatformEnv();
        expect(env.enableTeacherIntakeSubmit).toBe(false);
        expect(env.enableTeacherOnboarding).toBe(false);
        expect(env.enableFullTeacherJourney).toBe(false);
        expect(env.enableTeacherPortalOps).toBe(false);
      });
    });
  });
});
