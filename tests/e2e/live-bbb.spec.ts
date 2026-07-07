import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { JourneyEvidence } from './helpers/evidence';
import { LiveBbbOperationsPage } from './helpers/live-bbb';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, type TeacherPortalFixtureResult } from './helpers/teacher-portal';

const LIVE_BBB_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT',
  'EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP',
  'EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY',
  'EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE',
  'EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS',
  'EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING',
  'EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withLiveBbbEnv<T>(
  overrides: Partial<Record<(typeof LIVE_BBB_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of LIVE_BBB_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of LIVE_BBB_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function liveBbbRunId(): string {
  return `live-bbb-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function liveBbbEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'live-bbb',
    manifestTitle: 'EduPlatform Live BBB Operations Manifest',
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
      target: 'live-bbb-lifecycle-fixture',
      identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
      mode: env.cleanupMode,
      status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
      note: env.cleanupMode === 'delete'
        ? 'Delete cleanup is blocked; use archive mode for generated live BBB lifecycle records.'
        : 'Live BBB lifecycle fixture cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
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
    target: 'live-bbb-lifecycle-fixture',
    identifier: `${options.teacher.teacherUserId}/${options.fixture.studentid}`,
    mode: env.cleanupMode,
    status: 'completed',
    note: `Archived live BBB lifecycle fixture records: ${JSON.stringify(archived.counts)}.`,
  });
  await logoutFromEduPlatform(options.page, env);
}

test.describe('EduPlatform live BBB harness', () => {
  test('validates live BBB operations configuration and routes', async ({}, testInfo) => {
    await withLiveBbbEnv({
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
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const urls = {
        liveOps: buildEduPlatformUrl(env, HUB_ROUTES.liveOps),
        liveAvailability: buildEduPlatformUrl(env, HUB_ROUTES.liveAvailability, { teacherid: 123 }),
        liveSessions: buildEduPlatformUrl(env, HUB_ROUTES.liveSessions),
        liveCreateWizard: buildEduPlatformUrl(env, HUB_ROUTES.liveCreateWizard),
        liveDiagnostics: buildEduPlatformUrl(env, HUB_ROUTES.liveDiagnostics),
        liveRecordingsAdmin: buildEduPlatformUrl(env, HUB_ROUTES.liveRecordingsAdmin),
        liveSummaries: buildEduPlatformUrl(env, HUB_ROUTES.liveSummaries, { childid: 123 }),
        liveParentTrust: buildEduPlatformUrl(env, HUB_ROUTES.liveParentTrust, { childid: 123 }),
        liveParentTrustAudit: buildEduPlatformUrl(env, HUB_ROUTES.liveParentTrustAudit, { studentid: 123 }),
        liveParentTrustReviewPack: buildEduPlatformUrl(env, HUB_ROUTES.liveParentTrustReviewPack, { studentid: 123 }),
        liveParentTrustRetention: buildEduPlatformUrl(env, HUB_ROUTES.liveParentTrustRetention),
        liveParentTrustPurgeEvidence: buildEduPlatformUrl(env, HUB_ROUTES.liveParentTrustPurgeEvidence, { id: 123 }),
        liveParentLinks: buildEduPlatformUrl(env, HUB_ROUTES.liveParentLinks),
        liveGrouping: buildEduPlatformUrl(env, HUB_ROUTES.liveGrouping),
        liveSessionGuide: buildEduPlatformUrl(env, HUB_ROUTES.liveSessionGuide),
        liveSessionMaterials: buildEduPlatformUrl(env, HUB_ROUTES.liveSessionMaterials, { sessionid: 123 }),
        livePracticeCoach: buildEduPlatformUrl(env, HUB_ROUTES.livePracticeCoach, { sessionid: 123 }),
        liveVirtualTutor: buildEduPlatformUrl(env, HUB_ROUTES.liveVirtualTutor, { sessionid: 123, studentid: 456 }),
        liveQuality: buildEduPlatformUrl(env, HUB_ROUTES.liveQuality, { sessionid: 123 }),
        liveQualityAnalytics: buildEduPlatformUrl(env, HUB_ROUTES.liveQualityAnalytics),
        liveLeadership: buildEduPlatformUrl(env, HUB_ROUTES.liveLeadership),
        liveImprovementPlans: buildEduPlatformUrl(env, HUB_ROUTES.liveImprovementPlans),
        liveMonitor: buildEduPlatformUrl(env, HUB_ROUTES.liveMonitor, { sessionid: 123 }),
        liveReports: buildEduPlatformUrl(env, HUB_ROUTES.liveReports),
        liveSeries: buildEduPlatformUrl(env, HUB_ROUTES.liveSeries),
        liveSeriesSchedule: buildEduPlatformUrl(env, HUB_ROUTES.liveSeriesSchedule),
        liveSchedule: buildEduPlatformUrl(env, HUB_ROUTES.liveSchedule, { studentid: 456 }),
        liveCalendar: buildEduPlatformUrl(env, HUB_ROUTES.liveCalendar, { studentid: 456 }),
        liveCapacity: buildEduPlatformUrl(env, HUB_ROUTES.liveCapacity),
        liveTeacherDirectory: buildEduPlatformUrl(env, HUB_ROUTES.liveTeacherDirectory),
        liveTeacherProfile: buildEduPlatformUrl(env, HUB_ROUTES.liveTeacherProfile, { teacherid: 123 }),
        livePilotReadiness: buildEduPlatformUrl(env, HUB_ROUTES.livePilotReadiness),
        backupDrChecks: buildEduPlatformUrl(env, HUB_ROUTES.backupDrChecks),
      };

      evidence.recordStage('live-bbb-helper-smoke', 'passed', 'Generated Live BBB routes, evidence, and env guards.');
      await evidence.attachJson('live-bbb-route-map', urls);
      const summaryPath = await evidence.writeSummary();

      expect(urls.liveOps).toContain('/local/hubredirect/live_ops.php');
      expect(urls.liveAvailability).toContain('/local/hubredirect/live_availability.php');
      expect(urls.liveSessions).toContain('/local/hubredirect/live_sessions.php');
      expect(urls.liveDiagnostics).toContain('/local/hubredirect/live_diagnostics.php');
      expect(urls.liveSummaries).toContain('/local/hubredirect/live_summaries.php');
      expect(urls.liveParentTrust).toContain('/local/hubredirect/live_parent_trust.php');
      expect(urls.liveParentTrustAudit).toContain('/local/hubredirect/live_parent_trust_audit.php');
      expect(urls.liveParentTrustReviewPack).toContain('/local/hubredirect/live_parent_trust_review_pack.php');
      expect(urls.liveParentTrustRetention).toContain('/local/hubredirect/live_parent_trust_retention.php');
      expect(urls.liveParentTrustPurgeEvidence).toContain('/local/hubredirect/live_parent_trust_purge_evidence.php');
      expect(urls.liveParentLinks).toContain('/local/hubredirect/live_parent_links.php');
      expect(urls.liveGrouping).toContain('/local/hubredirect/live_grouping.php');
      expect(urls.liveSessionGuide).toContain('/local/hubredirect/live_session_guide.php');
      expect(urls.liveSessionMaterials).toContain('/local/hubredirect/live_session_materials.php');
      expect(urls.livePracticeCoach).toContain('/local/hubredirect/live_practice_coach.php');
      expect(urls.liveVirtualTutor).toContain('/local/hubredirect/live_virtual_tutor.php');
      expect(urls.liveQuality).toContain('/local/hubredirect/live_quality.php');
      expect(urls.liveQualityAnalytics).toContain('/local/hubredirect/live_quality_analytics.php');
      expect(urls.liveLeadership).toContain('/local/hubredirect/live_leadership.php');
      expect(urls.liveImprovementPlans).toContain('/local/hubredirect/live_improvement_plans.php');
      expect(urls.liveMonitor).toContain('/local/hubredirect/live_monitor.php');
      expect(urls.liveReports).toContain('/local/hubredirect/live_reports.php');
      expect(urls.liveSeries).toContain('/local/hubredirect/live_series.php');
      expect(urls.liveSeriesSchedule).toContain('/local/hubredirect/live_series_schedule.php');
      expect(urls.liveSchedule).toContain('/local/hubredirect/live_schedule.php');
      expect(urls.liveCalendar).toContain('/local/hubredirect/live_calendar.php');
      expect(urls.liveCapacity).toContain('/local/hubredirect/live_capacity.php');
      expect(urls.liveTeacherDirectory).toContain('/local/hubredirect/live_teacher_directory.php');
      expect(urls.liveTeacherProfile).toContain('/local/hubredirect/live_teacher_profile.php');
      expect(urls.livePilotReadiness).toContain('/local/hubredirect/live_pilot_readiness.php');
      expect(urls.backupDrChecks).toContain('/local/hubredirect/backup_dr_checks.php');
      expect(summaryPath).toContain('live-bbb-summary.json');
    });
  });

  test.describe('live BBB operations smoke live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationsSmoke,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE=true to run BBB operations readiness checks.',
    );

    test('verifies live operations, session scheduling, diagnostics, recording review, and wizard readiness', async ({ page }, testInfo) => {
      test.setTimeout(150_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('bbb-phase-1-login', 'passed', env.adminUsername);

      const results = await bbb.runSmoke();
      evidence.recordStage('bbb-phase-1-live-operations-dashboard', 'passed', results.operations.url);
      evidence.recordStage('bbb-phase-1-live-sessions', 'passed', results.sessions.url);
      evidence.recordStage('bbb-phase-1-create-wizard-readiness', 'passed', results.createWizard.url);
      evidence.recordStage('bbb-phase-1-live-session-diagnostics', 'passed', results.diagnostics.url);
      evidence.recordStage('bbb-phase-1-recording-review', 'passed', results.recordings.url);
      await evidence.screenshot(page, 'bbb-phase-1-recording-review');
      await evidence.attachJson('bbb-phase-1-results', results);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('bbb-phase-1-logout', 'passed');
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB meeting lifecycle live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbMeetingLifecycle,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE=true to schedule and start a provider-backed BBB session.',
    );

    test('schedules a BBB class, starts the teacher bridge, and verifies diagnostics evidence', async ({ page }, testInfo) => {
      test.setTimeout(300_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-2-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      evidence.recordStage('bbb-phase-2-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
      });
      evidence.recordStage('bbb-phase-2-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionTitle', session.title);
      evidence.recordId('liveBbbStartUrl', session.startUrl);
      await evidence.screenshot(page, 'bbb-phase-2-session-scheduled');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-2-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-2-start-bridge', bridge);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const diagnostics = await bbb.expectDiagnosticsForSession(session.title);
      evidence.recordStage('bbb-phase-2-diagnostics-created', 'passed', diagnostics.url);
      await evidence.screenshot(page, 'bbb-phase-2-diagnostics-created');
      const recordings = await bbb.expectRecordingReview();
      evidence.recordStage('bbb-phase-2-recording-review-ready', 'passed', recordings.url);

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB post-class evidence live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPostClassEvidence,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE=true to verify BBB attendance, notes, follow-up, recording, and diagnostics evidence.',
    );

    test('records post-class attendance, notes, follow-up, recording review, and diagnostics evidence', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-3-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      evidence.recordStage('bbb-phase-3-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Post Class ${runId}`,
      });
      evidence.recordStage('bbb-phase-3-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionId', session.sessionId);
      evidence.recordId('liveBbbSessionTitle', session.title);
      evidence.recordId('liveBbbStartUrl', session.startUrl);
      evidence.recordId('liveBbbReviewUrl', session.reviewUrl);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-3-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-3-start-bridge', bridge);

      const review = await bbb.savePostClassReview(session);
      evidence.recordStage('bbb-phase-3-post-class-review-saved', 'passed', review.url);
      await evidence.screenshot(page, 'bbb-phase-3-post-class-review-saved');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const followups = await bbb.expectFollowupEvidence(session);
      evidence.recordStage('bbb-phase-3-followup-command-center', 'passed', followups.url);
      await evidence.screenshot(page, 'bbb-phase-3-followup-command-center');
      const recordings = await bbb.expectRecordingReviewForSession(session);
      evidence.recordStage('bbb-phase-3-recording-review-session-evidence', 'passed', recordings.url);
      const diagnostics = await bbb.expectDiagnosticsForSession(session.title);
      evidence.recordStage('bbb-phase-3-diagnostics-audit-evidence', 'passed', diagnostics.url);
      await evidence.screenshot(page, 'bbb-phase-3-diagnostics-audit-evidence');

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB student and parent visibility live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbStudentParentVisibility,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY=true to verify BBB student schedule and parent summary visibility.',
    );

    test('verifies student schedule visibility, parent live hub, parent summaries, follow-up response, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(390_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-4-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentusername) {
        throw new Error(
          [
            'Live BBB phase 4 requires a linked parent account from the teacher portal fixture.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun bbb-phase4.',
          ].join('\n'),
        );
      }
      evidence.recordStage('bbb-phase-4-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentusername}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUsername', fixture.parentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Family View ${runId}`,
      });
      evidence.recordStage('bbb-phase-4-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionId', session.sessionId);
      evidence.recordId('liveBbbSessionTitle', session.title);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-4-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-4-start-bridge', bridge);

      const review = await bbb.savePostClassReview(session);
      evidence.recordStage('bbb-phase-4-post-class-review-saved', 'passed', review.url);
      await evidence.screenshot(page, 'bbb-phase-4-post-class-review-saved');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      const studentSchedule = await bbb.expectStudentScheduleVisible(session);
      evidence.recordStage('bbb-phase-4-student-live-schedule-visible', 'passed', studentSchedule.url);
      await evidence.screenshot(page, 'bbb-phase-4-student-live-schedule-visible');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      const parentHub = await bbb.expectParentLiveHubVisible(session);
      evidence.recordStage('bbb-phase-4-parent-live-hub-visible', 'passed', parentHub.url);
      await evidence.screenshot(page, 'bbb-phase-4-parent-live-hub-visible');
      const parentSummary = await bbb.expectParentSummaryAndRespond(session);
      evidence.recordStage('bbb-phase-4-parent-summary-response-saved', 'passed', parentSummary.url);
      await evidence.screenshot(page, 'bbb-phase-4-parent-summary-response-saved');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const followups = await bbb.expectFollowupEvidence(session);
      evidence.recordStage('bbb-phase-4-admin-followup-parent-response-visible', 'passed', followups.url);
      await evidence.screenshot(page, 'bbb-phase-4-admin-followup-parent-response-visible');
      await evidence.attachJson('bbb-phase-4-family-visibility-results', {
        session,
        studentSchedule,
        parentHub,
        parentSummary,
        followups,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB trust and retention audit live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbTrustRetentionAudit,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT=true to verify BBB parent trust audit, review pack export, and retention readiness.',
    );

    test('verifies parent trust audit trail, review pack CSV, retention readiness, recording review, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-5-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentusername) {
        throw new Error(
          [
            'Live BBB phase 5 requires a linked parent account from the teacher portal fixture.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun bbb-phase5.',
          ].join('\n'),
        );
      }
      evidence.recordStage('bbb-phase-5-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentusername}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUsername', fixture.parentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Trust Audit ${runId}`,
      });
      evidence.recordStage('bbb-phase-5-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionId', session.sessionId);
      evidence.recordId('liveBbbSessionTitle', session.title);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-5-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-5-start-bridge', bridge);

      const review = await bbb.savePostClassReview(session);
      evidence.recordStage('bbb-phase-5-post-class-review-saved', 'passed', review.url);
      await evidence.screenshot(page, 'bbb-phase-5-post-class-review-saved');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const supportCase = await bbb.saveParentTrustSupportCase(session);
      evidence.recordStage('bbb-phase-5-parent-trust-support-case-saved', 'passed', supportCase.url);
      await evidence.screenshot(page, 'bbb-phase-5-parent-trust-support-case-saved');

      const audit = await bbb.expectParentTrustAuditForSession(session);
      evidence.recordStage('bbb-phase-5-parent-trust-audit-visible', 'passed', audit.url);
      await evidence.screenshot(page, 'bbb-phase-5-parent-trust-audit-visible');

      const reviewPack = await bbb.expectParentTrustReviewPackDownload(session);
      evidence.recordStage('bbb-phase-5-parent-trust-review-pack-csv', 'passed', reviewPack.csvUrl);
      await evidence.attachJson('bbb-phase-5-parent-trust-review-pack-csv', reviewPack);

      const retention = await bbb.expectParentTrustRetentionReadiness();
      evidence.recordStage('bbb-phase-5-parent-trust-retention-readiness', 'passed', retention.url);
      await evidence.screenshot(page, 'bbb-phase-5-parent-trust-retention-readiness');

      const recordings = await bbb.expectRecordingReviewForSession(session);
      evidence.recordStage('bbb-phase-5-recording-review-secret-hygiene', 'passed', recordings.url);
      const diagnostics = await bbb.expectDiagnosticsForSession(session.title);
      evidence.recordStage('bbb-phase-5-diagnostics-audit-evidence', 'passed', diagnostics.url);
      await evidence.attachJson('bbb-phase-5-trust-retention-results', {
        session,
        supportCase,
        audit,
        reviewPack,
        retention,
        recordings,
        diagnostics,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB instructional readiness live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbInstructionalReadiness,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS=true to verify BBB live-session guide, materials, Virtual Tutor, and Practice Coach readiness.',
    );

    test('verifies live guide, Quraan materials, Virtual Tutor, Practice Coach, diagnostics, and learner-facing secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-6-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      evidence.recordStage('bbb-phase-6-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const guide = await bbb.expectLiveSessionGuideReady();
      evidence.recordStage('bbb-phase-6-live-session-guide-ready', 'passed', guide.url);
      await evidence.screenshot(page, 'bbb-phase-6-live-session-guide-ready');

      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Instruction ${runId}`,
      });
      evidence.recordStage('bbb-phase-6-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionId', session.sessionId);
      evidence.recordId('liveBbbSessionTitle', session.title);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-6-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-6-start-bridge', bridge);

      const materials = await bbb.expectSessionMaterialsReady(session);
      evidence.recordStage('bbb-phase-6-session-materials-ready', 'passed', materials.url);
      await evidence.screenshot(page, 'bbb-phase-6-session-materials-ready');

      const practiceCoach = await bbb.expectPracticeCoachReportReady(session);
      evidence.recordStage('bbb-phase-6-practice-coach-report-ready', 'passed', practiceCoach.url);
      await evidence.screenshot(page, 'bbb-phase-6-practice-coach-report-ready');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      const virtualTutor = await bbb.expectVirtualTutorReady(session);
      evidence.recordStage('bbb-phase-6-virtual-tutor-ready', 'passed', virtualTutor.url);
      await evidence.screenshot(page, 'bbb-phase-6-virtual-tutor-ready');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const diagnostics = await bbb.expectDiagnosticsForSession(session.title);
      evidence.recordStage('bbb-phase-6-diagnostics-audit-evidence', 'passed', diagnostics.url);
      await evidence.attachJson('bbb-phase-6-instructional-readiness-results', {
        session,
        guide,
        bridge,
        materials,
        practiceCoach,
        virtualTutor,
        diagnostics,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB quality and leadership analytics live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbQualityLeadership,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP=true to verify BBB QA review, leadership analytics, improvement plans, reports, and monitor evidence.',
    );

    test('verifies QA review, leadership case, improvement plan, analytics, reports, monitor evidence, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-7-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      evidence.recordStage('bbb-phase-7-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const session = await bbb.createScheduledSession({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Quality ${runId}`,
      });
      evidence.recordStage('bbb-phase-7-session-scheduled', 'passed', session.title);
      evidence.recordId('liveBbbSessionId', session.sessionId);
      evidence.recordId('liveBbbSessionTitle', session.title);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword || teacher.teacherPassword,
      });
      const bridge = await bbb.startSessionBridge(session.title);
      evidence.recordStage('bbb-phase-7-teacher-start-bridge', 'passed', bridge.bridgeUrl);
      await evidence.attachJson('bbb-phase-7-start-bridge', bridge);
      const review = await bbb.savePostClassReview(session);
      evidence.recordStage('bbb-phase-7-post-class-review-saved', 'passed', review.url);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const quality = await bbb.saveQualityReviewForLeadership(session);
      evidence.recordStage('bbb-phase-7-quality-review-flagged', 'passed', quality.url);
      await evidence.screenshot(page, 'bbb-phase-7-quality-review-flagged');

      const leadership = await bbb.assignLeadershipImprovementPlan(session, quality.expectedReason);
      evidence.recordStage('bbb-phase-7-leadership-improvement-plan-assigned', 'passed', leadership.url);
      await evidence.screenshot(page, 'bbb-phase-7-leadership-improvement-plan-assigned');

      const analytics = await bbb.expectQualityAnalyticsForSession(session);
      evidence.recordStage('bbb-phase-7-quality-analytics-visible', 'passed', analytics.url);
      await evidence.screenshot(page, 'bbb-phase-7-quality-analytics-visible');

      const plans = await bbb.expectImprovementPlansForSession(session);
      evidence.recordStage('bbb-phase-7-improvement-plan-visible', 'passed', plans.url);
      await evidence.screenshot(page, 'bbb-phase-7-improvement-plan-visible');

      const reports = await bbb.expectLiveReportsQualityEvidence(session);
      evidence.recordStage('bbb-phase-7-live-reports-quality-evidence', 'passed', reports.url);
      const monitor = await bbb.expectLiveMonitorForSession(session);
      evidence.recordStage('bbb-phase-7-live-monitor-evidence', 'passed', monitor.url);

      const diagnostics = await bbb.expectDiagnosticsForSession(session.title);
      evidence.recordStage('bbb-phase-7-diagnostics-audit-evidence', 'passed', diagnostics.url);
      await evidence.attachJson('bbb-phase-7-quality-leadership-results', {
        session,
        bridge,
        review,
        quality,
        leadership,
        analytics,
        plans,
        reports,
        monitor,
        diagnostics,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB scheduling capacity and calendar live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbSchedulingCapacity,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY=true to verify recurring series scheduling, capacity planning, teacher profile, learner calendar, and secret hygiene.',
    );

    test('verifies recurring series creation, capacity planning, teacher directory, learner calendars, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-8-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentusername) {
        throw new Error(
          [
            'Teacher portal fixture did not return a linked parent account.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun bbb-phase8.',
          ].join('\n'),
        );
      }
      evidence.recordStage('bbb-phase-8-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentusername}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUsername', fixture.parentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const series = await bbb.createRecurringSeries({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Series ${runId}`,
      });
      evidence.recordStage('bbb-phase-8-recurring-series-created', 'passed', `${series.title} #${series.seriesId}`);
      evidence.recordId('liveBbbSeriesId', series.seriesId);
      evidence.recordId('liveBbbSessionId', series.sessionId);
      evidence.recordId('liveBbbSessionTitle', series.title);
      await evidence.screenshot(page, 'bbb-phase-8-recurring-series-created');

      const seriesDashboard = await bbb.expectSeriesDashboardForSeries(series);
      evidence.recordStage('bbb-phase-8-series-dashboard-visible', 'passed', seriesDashboard.url);
      const capacity = await bbb.expectCapacityPlanningForSeries(series);
      evidence.recordStage('bbb-phase-8-capacity-planning-csv', 'passed', capacity.csvUrl);
      const teacherProfile = await bbb.expectTeacherDirectoryAndProfileForSeries(series);
      evidence.recordStage('bbb-phase-8-teacher-directory-visible', 'passed', teacherProfile.directory.url);
      evidence.recordStage('bbb-phase-8-teacher-profile-visible', 'passed', teacherProfile.profile.url);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      const studentSchedule = await bbb.expectSeriesScheduleVisible(series);
      evidence.recordStage('bbb-phase-8-student-series-schedule-visible', 'passed', studentSchedule.url);
      await evidence.screenshot(page, 'bbb-phase-8-student-series-schedule-visible');
      const studentCalendar = await bbb.expectLiveCalendarVisible(series);
      evidence.recordStage('bbb-phase-8-student-calendar-visible', 'passed', studentCalendar.url);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      const parentSchedule = await bbb.expectSeriesScheduleVisible(series);
      evidence.recordStage('bbb-phase-8-parent-series-schedule-visible', 'passed', parentSchedule.url);
      const parentCalendar = await bbb.expectLiveCalendarVisible(series);
      evidence.recordStage('bbb-phase-8-parent-calendar-visible', 'passed', parentCalendar.url);
      await evidence.screenshot(page, 'bbb-phase-8-parent-calendar-visible');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const diagnostics = await bbb.expectDiagnosticsForScheduledSession(series.title);
      evidence.recordStage('bbb-phase-8-diagnostics-audit-evidence', 'passed', diagnostics.url);
      await evidence.attachJson('bbb-phase-8-scheduling-capacity-results', {
        series,
        seriesDashboard,
        capacity,
        teacherProfile,
        studentSchedule,
        studentCalendar,
        parentSchedule,
        parentCalendar,
        diagnostics,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB operational resilience live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationalResilience,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE=true to verify cancellation lifecycle, active schedule hiding, direct URL blocking, audit evidence, and secret hygiene.',
    );

    test('verifies cancellation lifecycle, direct URL blocks, schedule hiding, audit evidence, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-9-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentusername) {
        throw new Error(
          [
            'Teacher portal fixture did not return a linked parent account.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun bbb-phase9.',
          ].join('\n'),
        );
      }
      evidence.recordStage('bbb-phase-9-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentusername}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUsername', fixture.parentusername);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const series = await bbb.createRecurringSeries({
        runId,
        teacherUserId: teacher.teacherUserId,
        studentUserId: String(fixture.studentid),
        title: `SQA BBB Resilience ${runId}`,
      });
      evidence.recordStage('bbb-phase-9-recurring-series-created', 'passed', `${series.title} #${series.seriesId}`);
      evidence.recordId('liveBbbSeriesId', series.seriesId);
      evidence.recordId('liveBbbSessionId', series.sessionId);
      evidence.recordId('liveBbbSessionTitle', series.title);
      await evidence.screenshot(page, 'bbb-phase-9-recurring-series-created');

      const singleCancellation = await bbb.cancelOneSessionInSeries(series, `SQA BBB single-session cancellation ${runId}`);
      evidence.recordStage('bbb-phase-9-single-session-cancelled', 'passed', singleCancellation.url);
      await evidence.screenshot(page, 'bbb-phase-9-single-session-cancelled');

      const seriesCancellation = await bbb.cancelFutureSessionsInSeries(series, `SQA BBB series cancellation ${runId}`);
      evidence.recordStage('bbb-phase-9-series-cancelled', 'passed', seriesCancellation.url);
      await evidence.screenshot(page, 'bbb-phase-9-series-cancelled');

      const blockedJoin = await bbb.expectCancelledJoinBlocked(series);
      evidence.recordStage('bbb-phase-9-cancelled-direct-join-blocked', 'passed', blockedJoin.url);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      const studentSchedule = await bbb.expectCancelledSeriesHiddenFromActiveSchedule(series);
      evidence.recordStage('bbb-phase-9-student-active-schedule-hidden', 'passed', studentSchedule.url);
      await evidence.screenshot(page, 'bbb-phase-9-student-active-schedule-hidden');

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      const parentSchedule = await bbb.expectCancelledSeriesHiddenFromActiveSchedule(series);
      evidence.recordStage('bbb-phase-9-parent-active-schedule-hidden', 'passed', parentSchedule.url);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const audit = await bbb.expectCancellationAuditForSeries(series);
      evidence.recordStage('bbb-phase-9-cancellation-audit-evidence', 'passed', audit.url);
      await evidence.attachJson('bbb-phase-9-operational-resilience-results', {
        series,
        singleCancellation,
        seriesCancellation,
        blockedJoin,
        studentSchedule,
        parentSchedule,
        audit,
      });

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB backup and DR readiness live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbBackupDrReadiness,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS=true to record backup/DR readiness evidence and verify live BBB health reporting.',
    );

    test('records backup DR readiness, diagnostics, reports, and secret hygiene evidence', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('bbb-phase-10-login', 'passed', env.adminUsername);

      const readiness = await bbb.verifyBackupDrReadiness(runId);
      evidence.recordStage('bbb-phase-10-backup-dr-readiness-recorded', 'passed', readiness.backupDr.url);
      await evidence.screenshot(page, 'bbb-phase-10-live-reports-readiness');
      evidence.recordStage('bbb-phase-10-diagnostics-health-evidence', 'passed', readiness.diagnostics.url);
      evidence.recordStage('bbb-phase-10-live-reports-readiness', 'passed', readiness.reports.url);
      await evidence.attachJson('bbb-phase-10-backup-dr-readiness-results', readiness);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      evidence.recordStage('bbb-phase-10-logout', 'passed');
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB retention controls live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbRetentionControls,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS=true to verify retention workflow, blocked purge, recovery evidence, and secret hygiene.',
    );

    test('verifies retention review workflow, guarded purge block, recovery evidence, and secret hygiene', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('bbb-phase-11-login', 'passed', env.adminUsername);

      const controls = await bbb.exerciseParentTrustRetentionControls(runId);
      evidence.recordStage('bbb-phase-11-retention-review-requested', 'passed', controls.requested.url);
      evidence.recordStage('bbb-phase-11-retention-review-rejected', 'passed', controls.rejected.url);
      evidence.recordStage('bbb-phase-11-guarded-purge-blocked', 'passed', controls.blockedPurge.url);
      evidence.recordStage('bbb-phase-11-purge-evidence-visible', 'passed', controls.evidence.url);
      await evidence.screenshot(page, 'bbb-phase-11-purge-evidence-visible');
      await evidence.attachJson('bbb-phase-11-retention-controls-results', controls);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      evidence.recordStage('bbb-phase-11-logout', 'passed');
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB consent availability and grouping live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbConsentGrouping,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING=true to verify consent, availability, grouping, parent-link export, and secret hygiene.',
    );

    test('verifies teacher availability, student grouping consent, parent links, CSV evidence, and cleanup readiness', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);
      const fixturePage = new TeacherPortalFixturePage(page, env);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('bbb-phase-12-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixture = await fixturePage.create({ runId, teacherUserId: teacher.teacherUserId });
      if (!fixture.parentid || !fixture.parentusername) {
        throw new Error(
          [
            'Teacher portal fixture did not return a linked parent account.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun bbb-phase12.',
          ].join('\n'),
        );
      }
      evidence.recordStage('bbb-phase-12-fixture-created', 'passed', `${teacher.teacherUserId}/${fixture.studentid}/${fixture.parentusername}`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('parentUserId', String(fixture.parentid));
      evidence.recordId('parentUsername', fixture.parentusername);

      const controls = await bbb.exerciseConsentAvailabilityAndGrouping({
        runId,
        teacherUserId: teacher.teacherUserId,
        fixture,
      });
      evidence.recordStage('bbb-phase-12-teacher-availability-saved', 'passed', controls.availability.url);
      await evidence.screenshot(page, 'bbb-phase-12-parent-link-export');
      evidence.recordStage('bbb-phase-12-student-grouping-consent', 'passed', controls.grouping.url);
      evidence.recordStage('bbb-phase-12-parent-links-export', 'passed', controls.parentLinks.csvUrl);
      await evidence.attachJson('bbb-phase-12-consent-grouping-results', controls);

      await archiveFixtureIfRequested({ page, evidence, fixturePage, runId, teacher, fixture });
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB rollup pilot readiness live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPilotReadiness,
      'Set EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS=true to verify BBB phase 1-12 evidence, stale generated-data cleanup, and final readiness export.',
    );

    test('verifies phase evidence in reports and diagnostics, no stale SQA leftovers, and final readiness CSV export', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = liveBbbRunId();
      const evidence = liveBbbEvidence(testInfo, runId);
      const bbb = new LiveBbbOperationsPage(page, env);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('bbb-phase-13-login', 'passed', env.adminUsername);

      const readiness = await bbb.verifyPilotReadinessRollup();
      evidence.recordStage('bbb-phase-13-pilot-readiness-rollup', 'passed', readiness.rollup.url);
      await evidence.screenshot(page, 'bbb-phase-13-live-reports-readiness');
      evidence.recordStage('bbb-phase-13-diagnostics-evidence', 'passed', readiness.diagnostics.url);
      evidence.recordStage('bbb-phase-13-reports-evidence', 'passed', readiness.reports.url);
      evidence.recordStage('bbb-phase-13-final-readiness-csv', 'passed', readiness.readinessCsv.csvUrl);
      await evidence.attachJson('bbb-phase-13-pilot-readiness-results', readiness);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      evidence.recordStage('bbb-phase-13-logout', 'passed');
      await evidence.writeSummary();
    });
  });

  test.describe('live BBB negative controls', () => {
    test('keeps BBB live action flags disabled unless explicitly truthy', async () => {
      await withLiveBbbEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING: 'false',
        EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationsSmoke).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbMeetingLifecycle).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPostClassEvidence).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbStudentParentVisibility).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbTrustRetentionAudit).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbInstructionalReadiness).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbQualityLeadership).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbSchedulingCapacity).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationalResilience).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbBackupDrReadiness).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbRetentionControls).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbConsentGrouping).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPilotReadiness).toBe(false);
      });

      await withLiveBbbEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEACHER_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING: 'true',
        EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationsSmoke).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbMeetingLifecycle).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPostClassEvidence).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbStudentParentVisibility).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbTrustRetentionAudit).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbInstructionalReadiness).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbQualityLeadership).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbSchedulingCapacity).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbOperationalResilience).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbBackupDrReadiness).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbRetentionControls).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbConsentGrouping).toBe(true);
        expect(getEduPlatformEnv({ allowPartial: true }).enableLiveBbbPilotReadiness).toBe(true);
      });
    });
  });
});
