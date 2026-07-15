import { expect, test, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { JourneyEvidence } from './helpers/evidence';
import {
  InstitutionAcademicIsolationPage,
  InstitutionCommunicationsIsolationPage,
  InstitutionMobilityLifecyclePage,
  InstitutionOperationsIsolationPage,
  InstitutionReadinessRollupPage,
  InstitutionReportingBrandingPage,
  InstitutionSchoolFunctionalTestPage,
  InstitutionSecurityMatrixPage,
} from './helpers/institution-governance';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';

const INSTITUTION_GOVERNANCE_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS',
  'EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING',
  'EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE',
  'EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX',
  'EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION',
  'EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withInstitutionGovernanceEnv<T>(
  overrides: Partial<Record<(typeof INSTITUTION_GOVERNANCE_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of INSTITUTION_GOVERNANCE_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of INSTITUTION_GOVERNANCE_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function institutionGovernanceRunId(): string {
  return `institution-school-models-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function institutionGovernanceEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'institution-governance',
    manifestTitle: 'EduPlatform Institution School Models Manifest',
  });
}

test.describe('EduPlatform institution governance harness', () => {
  test('validates institution school model configuration and routes', async ({}, testInfo) => {
    await withInstitutionGovernanceEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '1',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'quraan-academy',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId();
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const functionalTestUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionSchoolFunctionalTest);
      const operationsIsolationUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionOperationsIsolation);
      const reportingBrandingUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionReportingBranding);
      const mobilityLifecycleUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionMobilityLifecycle);
      const securityMatrixUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionSecurityMatrix);
      const communicationsIsolationUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionCommunicationsIsolation);
      const academicIsolationUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionAcademicIsolation);
      const readinessRollupUrl = buildEduPlatformUrl(env, HUB_ROUTES.institutionReadinessRollup);
      const workspacesUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaces);

      evidence.recordStage('institution-school-models-helper-smoke', 'passed', 'Generated institution school model routes, evidence, and env guards.');
      evidence.recordId('institutionSchoolFunctionalTestUrl', functionalTestUrl);
      evidence.recordId('institutionOperationsIsolationUrl', operationsIsolationUrl);
      evidence.recordId('institutionReportingBrandingUrl', reportingBrandingUrl);
      evidence.recordId('institutionMobilityLifecycleUrl', mobilityLifecycleUrl);
      evidence.recordId('institutionSecurityMatrixUrl', securityMatrixUrl);
      evidence.recordId('institutionCommunicationsIsolationUrl', communicationsIsolationUrl);
      evidence.recordId('institutionAcademicIsolationUrl', academicIsolationUrl);
      evidence.recordId('institutionReadinessRollupUrl', readinessRollupUrl);
      evidence.recordId('workspacesUrl', workspacesUrl);
      const summaryPath = await evidence.writeSummary();

      expect(functionalTestUrl).toContain('/local/hubredirect/institution_school_functional_test.php');
      expect(operationsIsolationUrl).toContain('/local/hubredirect/institution_operations_isolation.php');
      expect(reportingBrandingUrl).toContain('/local/hubredirect/institution_reporting_branding.php');
      expect(mobilityLifecycleUrl).toContain('/local/hubredirect/institution_mobility_lifecycle.php');
      expect(securityMatrixUrl).toContain('/local/hubredirect/institution_security_matrix.php');
      expect(communicationsIsolationUrl).toContain('/local/hubredirect/institution_communications_isolation.php');
      expect(academicIsolationUrl).toContain('/local/hubredirect/institution_academic_isolation.php');
      expect(readinessRollupUrl).toContain('/local/hubredirect/institution_readiness_rollup.php');
      expect(workspacesUrl).toContain('/local/hubredirect/workspaces.php');
      expect(summaryPath).toContain('institution-governance-summary.json');
    });
  });

  test.describe('institution school models live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionSchoolModels,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS=true to verify owned-school and franchise-school access models.',
    );

    test('verifies wholly owned branch operations and independent franchise governance boundaries', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId();
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const schoolModels = new InstitutionSchoolFunctionalTestPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await schoolModels.runAndVerify();
      evidence.recordStage('institution-phase-1-school-models-verified', 'passed', result.checks.join('; '));
      evidence.recordId('fixtureWorkspaceCount', result.workspaces.length);
      evidence.recordId('fixtureUserCount', result.users.length);
      evidence.recordId('functionalTestUrl', result.finalUrl);
      for (const workspace of result.workspaces) {
        evidence.recordId(`workspace:${workspace.label}`, workspace.workspaceId);
      }
      await evidence.screenshot(page, 'institution-phase-1-functional-test');

      await schoolModels.expectOperatingModelDashboardVisible();
      evidence.recordStage('institution-phase-1-operating-model-dashboard', 'passed', page.url());
      await evidence.screenshot(page, 'institution-phase-1-operating-model-dashboard');
      evidence.recordCleanupAction({
        target: 'institution-school-sqa-fixtures',
        identifier: 'huda.sqa / huda.branchb.sqa / huda.franchise.sqa',
        mode: env.cleanupMode,
        status: 'planned',
        note: 'Cleanup is intentionally manual via src/moodle/local_prequran/sql/cleanup_institution_school_sqa_fixtures.sql after review.',
      });
      await evidence.attachJson('institution-phase-1-result', result);
      await evidence.writeSummary();

      expect(result.checks.length).toBeGreaterThan(20);
      expect(result.workspaces.some((workspace) => /branch b/i.test(workspace.label))).toBe(true);
      expect(result.workspaces.some((workspace) => /franchise/i.test(workspace.label))).toBe(true);
    });
  });

  test.describe('institution admissions enrollment finance isolation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionOperationsIsolation,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION=true to verify owned-branch admissions/finance rollups and franchise separation.',
    );

    test('verifies branch admissions isolation, franchise-owned admissions, owned revenue rollup, separated franchise finance, and parent billing scoping', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-operations');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const operations = new InstitutionOperationsIsolationPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await operations.runAndVerify({
        runId,
        courseKey: env.testCourseKey || 'pre_quraan',
        invoiceAmount: env.invoiceLineAmount || '25.00',
      });

      evidence.recordStage('institution-phase-2-admissions-isolation-verified', 'passed', `owned=${result.admissions.owned_rollup_count}; franchise=${result.admissions.franchise_count}`);
      evidence.recordStage('institution-phase-2-finance-separation-verified', 'passed', `owned=${result.finance.owned_revenue}; franchise=${result.finance.franchise_revenue}`);
      evidence.recordStage('institution-phase-2-parent-billing-scoped', 'passed', JSON.stringify(result.parent_visibility));
      evidence.recordId('functionalTestUrl', result.finalUrl);
      evidence.recordId('ownedBranchAWorkspaceId', String(result.workspaces.branch_a));
      evidence.recordId('ownedBranchBWorkspaceId', String(result.workspaces.branch_b));
      evidence.recordId('franchiseWorkspaceId', String(result.workspaces.franchise));
      await evidence.screenshot(page, 'institution-phase-2-operations-isolation');
      await evidence.attachJson('institution-phase-2-result', result);
      await evidence.writeSummary();

      expect(result.workspaces.branch_a).toBeGreaterThan(0);
      expect(result.workspaces.branch_b).toBeGreaterThan(0);
      expect(result.workspaces.franchise).toBeGreaterThan(0);
      expect(result.checks.every((check) => check.pass)).toBe(true);
    });
  });

  test.describe('institution reporting rollups and branding portal isolation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionReportingBranding,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING=true to verify institution rollup reporting, exports, branding, and portal isolation.',
    );

    test('verifies owned-school report aggregation, franchise governance-only reporting, export school identifiers, and branded portal isolation', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-reporting');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const reporting = new InstitutionReportingBrandingPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await reporting.runAndVerify({
        runId,
        invoiceAmount: env.invoiceLineAmount || '25.00',
      });

      evidence.recordStage('institution-phase-3-owned-report-rollup-verified', 'passed', `owned=${result.owned_operational_total}; franchise=${result.franchise_governance_total}`);
      evidence.recordStage('institution-phase-3-export-identifiers-verified', 'passed', `csv=${result.csvText.length}; pdf=${result.pdfText.length}`);
      evidence.recordStage('institution-phase-3-branding-portal-isolation-verified', 'passed', result.blockedUrl);
      evidence.recordId('functionalTestUrl', result.finalUrl);
      for (const row of result.rows) {
        evidence.recordId(`school:${row.school_key}:workspace`, String(row.workspaceid));
        evidence.recordId(`school:${row.school_key}:domain`, row.domain);
      }
      await evidence.screenshot(page, 'institution-phase-3-cross-school-portal-blocked');
      await evidence.attachJson('institution-phase-3-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
      expect(result.rows.some((row) => row.school_key === 'franchise' && row.report_bucket === 'governance_network')).toBe(true);
      expect(result.rows.filter((row) => row.report_bucket === 'owned_operational')).toHaveLength(2);
    });
  });

  test.describe('institution staff mobility and data lifecycle live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionMobilityLifecycle,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE=true to verify staff mobility, school transfer permissions, and archive lifecycle controls.',
    );

    test('verifies branch transfer permissions, transfer audit, archive isolation, active queue hiding, and retained institution audit', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-mobility');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const mobility = new InstitutionMobilityLifecyclePage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await mobility.runAndVerify({ runId });

      evidence.recordStage('institution-phase-4-staff-mobility-verified', 'passed', `teacher=${result.users.teacher?.username}; student=${result.users.student?.username}`);
      evidence.recordStage('institution-phase-4-transfer-audit-verified', 'passed', `audit=${result.lifecycle.audit_rows}`);
      evidence.recordStage('institution-phase-4-archive-lifecycle-verified', 'passed', `active=${result.lifecycle.active_workspace_queue_count}; archived=${result.lifecycle.archived_workspace_queue_count}`);
      evidence.recordId('functionalTestUrl', result.finalUrl);
      evidence.recordId('ownedBranchAWorkspaceId', String(result.workspaces.branch_a));
      evidence.recordId('ownedBranchBWorkspaceId', String(result.workspaces.branch_b));
      evidence.recordId('archivedFranchiseWorkspaceId', String(result.workspaces.franchise));
      await evidence.screenshot(page, 'institution-phase-4-mobility-lifecycle');
      await evidence.attachJson('institution-phase-4-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
      expect(result.mobility.teacher_initial_branch_b_access).toBe(false);
      expect(result.mobility.teacher_explicit_branch_b_access).toBe(true);
      expect(Number(result.lifecycle.archived_workspace_queue_count)).toBe(1);
    });
  });

  test.describe('institution security cross-school access matrix live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionSecurityMatrix,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX=true to verify institution cross-school role and direct URL boundaries.',
    );

    test('verifies student, parent, teacher, school admin, franchise admin, direct URL, and session workspace boundaries', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-security');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const security = new InstitutionSecurityMatrixPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await security.runAndVerify({ runId });

      evidence.recordStage('institution-phase-5-role-boundaries-verified', 'passed', JSON.stringify(result.security));
      evidence.recordStage('institution-phase-5-direct-url-boundaries-verified', 'passed', result.checks.map((check) => check.name).join('; '));
      evidence.recordId('functionalTestUrl', result.finalUrl);
      for (const [key, value] of Object.entries(result.workspaces)) {
        evidence.recordId(`workspace:${key}`, String(value));
      }
      await evidence.screenshot(page, 'institution-phase-5-security-matrix');
      await evidence.attachJson('institution-phase-5-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
    });
  });

  test.describe('institution communications notifications isolation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionCommunicationsIsolation,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION=true to verify school-scoped communications and notification evidence.',
    );

    test('verifies announcements, parent-teacher messages, support cases, notifications, follow-ups, and audit stay school scoped', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-communications');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const communications = new InstitutionCommunicationsIsolationPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await communications.runAndVerify({ runId });

      evidence.recordStage('institution-phase-6-communications-scoping-verified', 'passed', JSON.stringify(result.communications));
      evidence.recordStage('institution-phase-6-notification-audit-verified', 'passed', result.checks.map((check) => check.name).join('; '));
      evidence.recordId('functionalTestUrl', result.finalUrl);
      for (const [key, value] of Object.entries(result.workspaces)) {
        evidence.recordId(`workspace:${key}`, String(value));
      }
      await evidence.screenshot(page, 'institution-phase-6-communications-isolation');
      await evidence.attachJson('institution-phase-6-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
    });
  });

  test.describe('institution academic course isolation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionAcademicIsolation,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION=true to verify school-scoped courses, lessons, grades, attendance, and transcripts.',
    );

    test('verifies course offerings, resources, gradebook, attendance, transcript, and institution academic rollup boundaries', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-academic');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const academic = new InstitutionAcademicIsolationPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await academic.runAndVerify({
        runId,
        courseKey: env.testCourseKey || 'pre_quraan',
      });

      evidence.recordStage('institution-phase-7-course-isolation-verified', 'passed', JSON.stringify(result.academic));
      evidence.recordStage('institution-phase-7-academic-rollup-boundaries-verified', 'passed', result.checks.map((check) => check.name).join('; '));
      evidence.recordId('functionalTestUrl', result.finalUrl);
      for (const [key, value] of Object.entries(result.workspaces)) {
        evidence.recordId(`workspace:${key}`, String(value));
      }
      await evidence.screenshot(page, 'institution-phase-7-academic-isolation');
      await evidence.attachJson('institution-phase-7-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
    });
  });

  test.describe('institution final readiness rollup live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInstitutionReadinessRollup,
      'Set EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP=true to verify final institution school readiness rollup evidence.',
    );

    test('verifies phases 1-7 evidence, stale fixture hygiene, final CSV export, and readiness audit', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = institutionGovernanceRunId().replace('institution-school-models', 'institution-readiness');
      const evidence = institutionGovernanceEvidence(testInfo, runId);
      const readiness = new InstitutionReadinessRollupPage(page, env);

      await logoutFromEduPlatform(page, env).catch(() => undefined);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const result = await readiness.runAndVerify({ runId });

      evidence.recordStage('institution-phase-8-rollup-readiness-verified', 'passed', JSON.stringify(result.phases));
      evidence.recordStage('institution-phase-8-export-evidence-verified', 'passed', `csv=${result.csvText.length}`);
      evidence.recordId('functionalTestUrl', result.finalUrl);
      await evidence.screenshot(page, 'institution-phase-8-readiness-rollup');
      await evidence.attachJson('institution-phase-8-result', result);
      await evidence.writeSummary();

      expect(result.checks.every((check) => check.pass)).toBe(true);
      expect(result.csvText).toContain(runId);
    });
  });

  test.describe('institution governance negative controls', () => {
    test('keeps institution school model live actions disabled unless explicitly truthy', async () => {
      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableInstitutionSchoolModels).toBe(false);
      });

      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableInstitutionSchoolModels).toBe(true);
      });

      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableInstitutionOperationsIsolation).toBe(true);
      });

      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableInstitutionReportingBranding).toBe(true);
      });

      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE: 'true',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableInstitutionMobilityLifecycle).toBe(true);
      });

      await withInstitutionGovernanceEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '1',
        EDUPLATFORM_CONSUMER: 'quraan-academy',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX: 'true',
        EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION: 'true',
        EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION: 'true',
        EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP: 'true',
      }, async () => {
        const env = getEduPlatformEnv({ allowPartial: true });
        expect(env.enableInstitutionSecurityMatrix).toBe(true);
        expect(env.enableInstitutionCommunicationsIsolation).toBe(true);
        expect(env.enableInstitutionAcademicIsolation).toBe(true);
        expect(env.enableInstitutionReadinessRollup).toBe(true);
      });
    });
  });
});
