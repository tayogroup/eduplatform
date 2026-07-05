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
import { AcademicParentWorkspacePage } from './helpers/academic-content';
import { DataExportCompliancePage } from './helpers/data-export-compliance';
import { JourneyEvidence } from './helpers/evidence';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, TeacherPortalPage, type TeacherPortalFixtureResult } from './helpers/teacher-portal';

const DATA_EXPORT_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withDataExportEnv<T>(
  overrides: Partial<Record<(typeof DATA_EXPORT_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of DATA_EXPORT_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of DATA_EXPORT_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function dataExportRunId(): string {
  return `data-export-compliance-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dataExportEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'data-export-compliance',
    manifestTitle: 'EduPlatform Data Export Compliance Manifest',
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
      target: 'data-export-compliance-fixture',
      identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
      mode: env.cleanupMode,
      status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
      note: env.cleanupMode === 'delete'
        ? 'Delete cleanup is blocked; use archive mode for generated compliance export records.'
        : 'Data export compliance fixture cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
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
    target: 'data-export-compliance-fixture',
    identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
    mode: env.cleanupMode,
    status: 'completed',
    note: `Archived compliance export fixture records: ${JSON.stringify(archived.counts)}.`,
  });
}

test.describe('EduPlatform data export compliance harness', () => {
  test('validates data export compliance configuration and routes', async ({}, testInfo) => {
    await withDataExportEnv({
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
      const runId = dataExportRunId();
      const evidence = dataExportEvidence(testInfo, runId);
      const complianceUrl = buildEduPlatformUrl(env, HUB_ROUTES.dataExportCompliance, {
        runid: runId,
        studentid: 123,
        parentid: 124,
        teacherid: 125,
        sessionid: 126,
        assessmentid: 127,
      });

      evidence.recordStage('data-export-compliance-helper-smoke', 'passed', 'Generated compliance export route, evidence, and env guards.');
      evidence.recordId('dataExportComplianceUrl', complianceUrl);
      const summaryPath = await evidence.writeSummary();

      expect(complianceUrl).toContain('/local/hubredirect/data_export_compliance.php');
      expect(summaryPath).toContain('data-export-compliance-summary.json');
    });
  });

  test.describe('data export compliance live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableDataExportCompliance,
      'Set EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE=true to verify student export, guardian visibility, audit completeness, and CSV/PDF integrity.',
    );

    test('verifies student export, guardian visibility, audit completeness, and CSV/PDF download integrity', async ({ page }, testInfo) => {
      test.setTimeout(480_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = dataExportRunId();
      const evidence = dataExportEvidence(testInfo, runId);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentid || !fixture.parentusername || !fixture.parentemail) {
        throw new Error(
          [
            'Data export compliance fixture requires a linked parent account.',
            `Fixture: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun compliance-phase1.',
          ].join('\n'),
        );
      }

      evidence.recordStage('compliance-phase-1-fixture-created', 'passed', JSON.stringify(fixture));
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUserId', String(fixture.parentid));
      evidence.recordId('parentUsername', fixture.parentusername);
      await evidence.screenshot(page, 'compliance-phase-1-fixture-created');

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
      await teacherPortal.saveNotesAndHomework(runId, fixture);
      await teacherPortal.saveGrade(runId, fixture, {
        scorePoints: '88',
        scorePercent: '88',
        letterGrade: 'B',
        status: 'published',
        feedback: `Automated SQA compliance grade feedback for ${runId}.`,
      });
      await teacherPortal.saveProgress(runId, fixture, {
        advancementStatus: 'on_track',
        teacherComment: `Automated SQA compliance progress evidence for ${runId}.`,
      });
      evidence.recordStage('compliance-phase-1-audit-events-generated', 'passed', `Session ${fixture.sessionid}, assessment ${fixture.assessmentid}.`);
      await evidence.screenshot(page, 'compliance-phase-1-audit-events-generated');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      const parentWorkspace = new AcademicParentWorkspacePage(page, env);
      const parentVisibility = await parentWorkspace.expectAttendanceAndProgressVisible({
        childUserId: String(fixture.studentid),
        runId,
      });
      evidence.recordStage('compliance-phase-1-parent-visibility-verified', 'passed', parentVisibility.finalUrl);
      await evidence.screenshot(page, 'compliance-phase-1-parent-visibility');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const compliance = new DataExportCompliancePage(page, env);
      const complianceResult = await compliance.expectComplianceEvidence({
        runId,
        studentId: fixture.studentid,
        parentId: fixture.parentid,
        teacherId: teacher.teacherUserId,
        sessionId: fixture.sessionid,
        assessmentId: fixture.assessmentid,
      });
      evidence.recordStage('compliance-phase-1-export-evidence-passed', 'passed', complianceResult.finalUrl);
      await evidence.screenshot(page, 'compliance-phase-1-export-evidence');

      const csv = await compliance.downloadCsv({
        runId,
        studentId: fixture.studentid,
        parentId: fixture.parentid,
        teacherId: teacher.teacherUserId,
        sessionId: fixture.sessionid,
        assessmentId: fixture.assessmentid,
      });
      evidence.recordStage('compliance-phase-1-csv-downloaded', 'passed', `${csv.suggestedFilename} ${csv.byteLength} bytes`);

      const pdf = await compliance.downloadPdf({
        runId,
        studentId: fixture.studentid,
        parentId: fixture.parentid,
        teacherId: teacher.teacherUserId,
        sessionId: fixture.sessionid,
        assessmentId: fixture.assessmentid,
      });
      evidence.recordStage('compliance-phase-1-pdf-downloaded', 'passed', `${pdf.suggestedFilename} ${pdf.byteLength} bytes`);

      await evidence.attachJson('compliance-phase-1-data-export-result', {
        teacher,
        fixture,
        parentVisibility,
        complianceResult,
        csv,
        pdf,
      });

      await archiveFixtureIfRequested({
        page,
        evidence,
        fixturePage,
        runId,
        teacher,
        fixture,
      });
      evidence.recordStage('compliance-phase-1-cleanup-evaluated', 'passed', env.cleanupMode);
      await evidence.writeSummary();

      expect(complianceResult.pageText).toContain('student record export');
      expect(csv.byteLength).toBeGreaterThan(50);
      expect(pdf.byteLength).toBeGreaterThan(500);
    });
  });

  test.describe('data export compliance negative controls', () => {
    test('keeps data export compliance live actions disabled unless explicitly truthy', async () => {
      await withDataExportEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableDataExportCompliance).toBe(false);
      });

      await withDataExportEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableDataExportCompliance).toBe(true);
      });
    });
  });
});
