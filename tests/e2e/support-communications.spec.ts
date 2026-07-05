import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import {
  adminCredentials,
  consumerLoginUrl,
  loginToEduPlatform,
  logoutFromEduPlatform,
} from './helpers/auth';
import { IntakeReviewPage, StudentIntakePage, type StudentCreationResult } from './helpers/admissions';
import { JourneyEvidence } from './helpers/evidence';
import { PublicIntakePage } from './helpers/intake';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildStudentJourneyData, type StudentJourneyData } from './helpers/student-data';
import {
  CommunicationsCenterPage,
  SupportOperationsPage,
} from './helpers/support-communications';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';

const SUPPORT_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_OFFERING_ID',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withSupportEnv<T>(
  overrides: Partial<Record<(typeof SUPPORT_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of SUPPORT_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of SUPPORT_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function supportRunId(): string {
  return `support-comms-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function supportEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'support-communications',
    manifestTitle: 'EduPlatform Support And Communications Manifest',
  });
}

async function createStudentParentFixture(page: Page, data: StudentJourneyData): Promise<StudentCreationResult> {
  const env = getEduPlatformEnv({ allowPartial: true });
  const publicIntake = new PublicIntakePage(page, env);
  await publicIntake.goto();
  await publicIntake.expectReady();
  await publicIntake.expectPublicCourseAvailable();
  await publicIntake.submitValidRequest(data);

  await loginToEduPlatform(page, env, adminCredentials(env));
  const queue = new IntakeReviewPage(page, env);
  await queue.goto();
  const requestId = await queue.loadRequestIntoStudentIntake(data);

  const studentIntake = new StudentIntakePage(page);
  await studentIntake.expectPrefilled(data);
  const parentUsernameInput = page.locator('input[name="parent_username"]');
  if (await parentUsernameInput.isVisible().catch(() => false)) {
    await parentUsernameInput.fill(data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase());
  }
  return studentIntake.createStudentFromPrefill(requestId);
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

test.describe('EduPlatform support communications harness', () => {
  test('validates support communications configuration and routes', async ({}, testInfo) => {
    await withSupportEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '3',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'huda-school',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = supportRunId();
      const evidence = supportEvidence(testInfo, runId);
      const communicationsUrl = buildEduPlatformUrl(env, HUB_ROUTES.communicationsCenter);
      const supportReportsUrl = buildEduPlatformUrl(env, HUB_ROUTES.supportReports);
      const supportAuditUrl = buildEduPlatformUrl(env, HUB_ROUTES.supportAudit);

      evidence.recordStage('support-comms-helper-smoke', 'passed', 'Generated support routes, evidence, and env guards.');
      evidence.recordId('workspaceId', env.workspaceId);
      evidence.recordId('communicationsCenterUrl', communicationsUrl);
      evidence.recordId('supportReportsUrl', supportReportsUrl);
      evidence.recordId('supportAuditUrl', supportAuditUrl);
      const summaryPath = await evidence.writeSummary();

      expect(communicationsUrl).toContain('/local/hubredirect/communications_center.php');
      expect(supportReportsUrl).toContain('/local/hubredirect/support_reports.php');
      expect(supportAuditUrl).toContain('/local/hubredirect/support_audit.php');
      expect(summaryPath).toContain('support-communications-summary.json');
    });
  });

  test.describe('support communications live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableSupportCommunications,
      'Set EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS=true to create parent/teacher communication records and verify support evidence.',
    );

    test('verifies parent-teacher messages, announcements, support cases, notifications, and follow-up evidence', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = supportRunId();
      const data = buildStudentJourneyData(runId);
      const evidence = supportEvidence(testInfo, runId);

      const student = await createStudentParentFixture(page, data);
      evidence.recordStage('support-phase-1-student-parent-created', 'passed', `Student ${student.studentUserId}, parent ${student.parentUserId}.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('parentUserId', student.parentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('parentAccountId', student.parentAccountId);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('support-phase-1-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);
      evidence.recordId('teacherProfileId', teacher.profileId);

      const communications = new CommunicationsCenterPage(page, env);
      const commsResult = await communications.createCaseMessageAnnouncementAndConsent({
        runId,
        studentUserId: student.studentUserId,
        parentUserId: student.parentUserId,
        teacherUserId: teacher.teacherUserId,
      });
      evidence.recordStage('support-phase-2-communications-records-created', 'passed', commsResult.subject);
      evidence.recordStage(
        'support-phase-2-consent-evidence',
        commsResult.consentStatus === 'saved' ? 'passed' : 'skipped',
        commsResult.consentNote,
      );
      evidence.recordId('supportCaseTitle', commsResult.caseTitle);
      evidence.recordId('announcementTitle', commsResult.campaignTitle);
      await evidence.screenshot(page, 'support-phase-2-communications-center');

      await logoutFromEduPlatform(page, env);
      const communicationsUrl = buildEduPlatformUrl(env, HUB_ROUTES.communicationsCenter);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: teacher.teacherPassword || env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, communicationsUrl),
      });
      const teacherCommsText = await communications.expectTeacherCanSeeThread(commsResult.subject);
      evidence.recordStage('support-phase-3-teacher-thread-visible', 'passed', commsResult.subject);
      await evidence.attachJson('support-phase-3-teacher-thread', {
        subject: commsResult.subject,
        visible: teacherCommsText.includes(commsResult.subject),
      });

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const supportOps = new SupportOperationsPage(page, env);
      const inbox = await supportOps.expectSupportInbox();
      evidence.recordStage('support-phase-4-support-inbox-verified', 'passed', inbox.finalUrl);

      const reports = await supportOps.expectSupportReports(commsResult.subject);
      evidence.recordStage('support-phase-4-support-reports-verified', 'passed', reports.finalUrl);

      const reportsCsv = await supportOps.downloadSupportReportsCsv(commsResult.subject);
      evidence.recordStage('support-phase-4-support-report-export-downloaded', 'passed', reportsCsv.suggestedFilename);

      const audit = await supportOps.expectSupportAudit();
      evidence.recordStage('support-phase-4-support-audit-verified', 'passed', audit.finalUrl);

      const notifications = await supportOps.expectNotificationDiagnostics();
      evidence.recordStage('support-phase-5-notification-diagnostics-verified', 'passed', notifications.finalUrl);
      await evidence.screenshot(page, 'support-phase-5-notification-diagnostics');

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('support-phase-6-logout', 'passed');
      await evidence.attachJson('support-communications-result', {
        student,
        teacher,
        commsResult,
        inbox,
        reports,
        reportsCsv,
        audit,
        notifications,
      });
      const summaryPath = await evidence.writeSummary();

      expect(summaryPath).toContain('support-communications-summary.json');
      expect(commsResult.subject).toContain(runId);
      expect(reportsCsv.suggestedFilename).toMatch(/support-tickets.*\.csv/i);
    });
  });

  test.describe('support communications negative controls', () => {
    test('keeps support communications live actions disabled unless explicitly truthy', async () => {
      await withSupportEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS: 'off',
      }, async () => {
        const env = getEduPlatformEnv();
        expect(env.enableSupportCommunications).toBe(false);
      });
    });
  });
});
