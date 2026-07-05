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
import type { StudentCreationResult } from './helpers/admissions';
import { JourneyEvidence } from './helpers/evidence';
import { AdminInvoicesPage, InvoiceDetailPage } from './helpers/finance';
import { NotificationDeliveryAuditPage } from './helpers/notifications-delivery';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { CommunicationsCenterPage } from './helpers/support-communications';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, TeacherPortalPage, type TeacherPortalFixtureResult } from './helpers/teacher-portal';

const NOTIFICATIONS_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_INVOICE_LINE_AMOUNT',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withNotificationsEnv<T>(
  overrides: Partial<Record<(typeof NOTIFICATIONS_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of NOTIFICATIONS_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of NOTIFICATIONS_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function notificationsRunId(): string {
  return `notifications-delivery-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function notificationsEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'notifications-delivery',
    manifestTitle: 'EduPlatform Notifications Delivery Manifest',
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
      target: 'notifications-delivery-fixture',
      identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
      mode: env.cleanupMode,
      status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
      note: env.cleanupMode === 'delete'
        ? 'Delete cleanup is blocked; use archive mode for generated notification delivery records.'
        : 'Notification delivery fixture cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
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
    target: 'notifications-delivery-fixture',
    identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
    mode: env.cleanupMode,
    status: 'completed',
    note: `Archived notification delivery fixture records: ${JSON.stringify(archived.counts)}.`,
  });
}

test.describe('EduPlatform notifications delivery harness', () => {
  test('validates notification delivery configuration and routes', async ({}, testInfo) => {
    await withNotificationsEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEACHER_PASSWORD: process.env.EDUPLATFORM_TEACHER_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
      EDUPLATFORM_INVOICE_LINE_AMOUNT: '25.00',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = notificationsRunId();
      const evidence = notificationsEvidence(testInfo, runId);
      const auditUrl = buildEduPlatformUrl(env, HUB_ROUTES.notificationDeliveryAudit, {
        runid: runId,
        studentid: 123,
        parentid: 124,
        teacherid: 125,
        invoiceid: 126,
        sessionid: 127,
        assessmentid: 128,
      });

      evidence.recordStage('notifications-delivery-helper-smoke', 'passed', 'Generated notifications route, evidence, and env guards.');
      evidence.recordId('notificationDeliveryAuditUrl', auditUrl);
      const summaryPath = await evidence.writeSummary();

      expect(auditUrl).toContain('/local/hubredirect/notification_delivery_audit.php');
      expect(summaryPath).toContain('notifications-delivery-summary.json');
    });
  });

  test.describe('notifications delivery live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableNotificationsDelivery,
      'Set EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY=true to generate and verify message, announcement, invoice, attendance, grade, and low-score notification evidence.',
    );

    test('verifies message, announcement, invoice, attendance, grade, low-score, notification center, email, and log evidence', async ({ page }, testInfo) => {
      test.setTimeout(540_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = notificationsRunId();
      const evidence = notificationsEvidence(testInfo, runId);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentid || !fixture.parentusername || !fixture.parentemail) {
        throw new Error(
          [
            'Notifications delivery fixture requires a linked parent account.',
            `Fixture: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun notifications-phase1.',
          ].join('\n'),
        );
      }
      evidence.recordStage('notifications-phase-1-fixture-created', 'passed', JSON.stringify(fixture));
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUserId', String(fixture.parentid));
      evidence.recordId('parentUsername', fixture.parentusername);

      const communications = new CommunicationsCenterPage(page, env);
      const communicationsResult = await communications.createCaseMessageAnnouncementAndConsent({
        runId,
        studentUserId: String(fixture.studentid),
        parentUserId: String(fixture.parentid),
        teacherUserId: teacher.teacherUserId,
      });
      evidence.recordStage('notifications-phase-1-message-announcement-generated', 'passed', communicationsResult.subject);
      await evidence.screenshot(page, 'notifications-phase-1-communications-generated');

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceStudent: StudentCreationResult = {
        requestId: '',
        studentAccountId: '',
        studentUserId: String(fixture.studentid),
        studentUsername: fixture.studentusername,
        studentPassword: env.studentPassword,
        parentAccountId: '',
        parentUserId: String(fixture.parentid),
        parentUsername: fixture.parentusername,
        parentPassword: env.studentPassword,
        parentEmailStatus: '',
        enrollmentApprovalStatus: '',
        createdText: '',
        finalUrl: '',
      };
      const invoiceId = await invoices.createDraftForStudent(invoiceStudent);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      await invoiceDetail.goto(invoiceId);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `SQA Notification Delivery Invoice ${runId}`,
        amount: env.invoiceLineAmount || '25.00',
      });
      evidence.recordStage('notifications-phase-1-invoice-issued', 'passed', invoice.invoiceNumber);
      await evidence.screenshot(page, 'notifications-phase-1-invoice-issued');

      await logoutFromEduPlatform(page, env);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, teacherPortalUrl),
      });
      await expectLoggedInToEduPlatform(page, teacher.teacherUsername);
      const teacherPortal = new TeacherPortalPage(page, env);
      await teacherPortal.goto();
      await teacherPortal.expectReady(fixture);
      await teacherPortal.saveAttendance(runId, fixture);
      await teacherPortal.saveGrade(runId, fixture, {
        scorePoints: '62',
        scorePercent: '62',
        letterGrade: 'D',
        status: 'published',
        feedback: `Automated SQA low-score notification feedback for ${runId}.`,
      });
      await teacherPortal.saveProgress(runId, fixture, {
        advancementStatus: 'needs_support',
        teacherComment: `Automated SQA notification progress alert evidence for ${runId}.`,
      });
      evidence.recordStage('notifications-phase-1-teacher-events-generated', 'passed', `Session ${fixture.sessionid}, assessment ${fixture.assessmentid}.`);
      await evidence.screenshot(page, 'notifications-phase-1-teacher-events');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const audit = new NotificationDeliveryAuditPage(page, env);
      const auditResult = await audit.expectDeliveryEvidence({
        runId,
        studentId: fixture.studentid,
        parentId: fixture.parentid,
        teacherId: teacher.teacherUserId,
        invoiceId: invoice.invoiceId,
        sessionId: fixture.sessionid,
        assessmentId: fixture.assessmentid,
      });
      evidence.recordStage('notifications-phase-1-audit-evidence-passed', 'passed', auditResult.finalUrl);
      await evidence.screenshot(page, 'notifications-phase-1-audit-evidence');

      const csv = await audit.downloadCsv({
        runId,
        studentId: fixture.studentid,
        parentId: fixture.parentid,
        teacherId: teacher.teacherUserId,
        invoiceId: invoice.invoiceId,
        sessionId: fixture.sessionid,
        assessmentId: fixture.assessmentid,
      });
      evidence.recordStage('notifications-phase-1-export-downloaded', 'passed', csv.suggestedFilename);
      await evidence.attachJson('notifications-phase-1-delivery-result', {
        teacher,
        fixture,
        communicationsResult,
        invoice,
        auditResult,
        csv,
      });

      await archiveFixtureIfRequested({
        page,
        evidence,
        fixturePage,
        runId,
        teacher,
        fixture,
      });
      evidence.recordStage('notifications-phase-1-cleanup-evaluated', 'passed', env.cleanupMode);
      await evidence.writeSummary();

      expect(auditResult.pageText).toContain('parent-teacher message notification');
      expect(csv.suggestedFilename).toMatch(/notification-delivery-audit/i);
    });
  });

  test.describe('notifications delivery negative controls', () => {
    test('keeps notification delivery live actions disabled unless explicitly truthy', async () => {
      await withNotificationsEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableNotificationsDelivery).toBe(false);
      });

      await withNotificationsEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableNotificationsDelivery).toBe(true);
      });
    });
  });
});
