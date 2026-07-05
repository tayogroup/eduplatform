import { expect, test, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import {
  ADMIN_SMOKE_TARGETS,
  AdminAuditDiagnosticsPage,
  AdminOperationsSmokePage,
  ReportingAuditOperationsPage,
  type AdminSmokeResult,
} from './helpers/admin-operations';
import { IntakeReviewPage, StudentIntakePage } from './helpers/admissions';
import { CourseCatalogPage, CourseOfferingAdminPage } from './helpers/course-enrollment';
import { CourseOfferingPage } from './helpers/course-offering';
import { JourneyEvidence } from './helpers/evidence';
import {
  AdminInvoicesPage,
  FinanceOperationsPage,
  FinancePolicyPage,
  InvoiceDetailPage,
  PaymentGatewaySettingsPage,
} from './helpers/finance';
import { PublicIntakePage } from './helpers/intake';
import { ParentBillingPage, StudentParentPortalPage } from './helpers/parent-portal';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildStudentJourneyData } from './helpers/student-data';

const ADMIN_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_OFFERING_ID',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE',
  'EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS',
  'EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS',
  'EDUPLATFORM_ENABLE_FINANCE_OPERATIONS',
  'EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withAdminEnv<T>(
  overrides: Partial<Record<(typeof ADMIN_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of ADMIN_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of ADMIN_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function adminEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'admin-operations',
    manifestTitle: 'EduPlatform Admin Operations Manifest',
  });
}

function adminRunId(): string {
  return `admin-ops-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}`;
}

test.describe('EduPlatform admin operations harness', () => {
  test('validates admin operations configuration and dashboard routes', async ({}, testInfo) => {
    const env = getEduPlatformEnv({ allowPartial: true });
    assertEduPlatformEnv(env);

    const runId = adminRunId();
    const evidence = adminEvidence(testInfo, runId);
    const workspaceDashboardUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaceDashboard);
    const workspacePeopleUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspacePeople);

    evidence.recordStage('admin-operations-helper-smoke', 'passed', 'Generated admin operations routes, evidence, and env guards.');
    evidence.recordId('workspaceId', env.workspaceId);
    evidence.recordId('workspaceDashboardUrl', workspaceDashboardUrl);
    evidence.recordId('workspacePeopleUrl', workspacePeopleUrl);
    const summaryPath = await evidence.writeSummary();

    expect(workspaceDashboardUrl).toContain('/local/hubredirect/workspace_dashboard.php');
    expect(workspacePeopleUrl).toContain('/local/hubredirect/workspace_people.php');
    expect(summaryPath).toContain('admin-operations-summary.json');
  });

  test.describe('workspace admin dashboard smoke live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAdminDashboardSmoke,
      'Set EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE=true to run the read-only admin/workspace dashboard smoke.',
    );

    test('verifies admin dashboard, workspace dashboard, and operations module navigation', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = adminRunId();
      const evidence = adminEvidence(testInfo, runId);
      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('admin-phase-1-login', 'passed', env.adminUsername);

      const smoke = new AdminOperationsSmokePage(page, env);
      await smoke.expectWorkspaceDashboardLinks();
      evidence.recordStage('admin-phase-1-workspace-dashboard-links', 'passed', buildEduPlatformUrl(env, HUB_ROUTES.workspaceDashboard));
      await evidence.screenshot(page, 'admin-phase-1-workspace-dashboard');

      const results: AdminSmokeResult[] = [];
      for (const target of ADMIN_SMOKE_TARGETS) {
        const result = await smoke.gotoAndExpect(target);
        results.push(result);
        evidence.recordStage(`admin-phase-1-${target.name}`, 'passed', result.finalUrl);
      }
      await evidence.attachJson('admin-phase-1-smoke-results', results);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('admin-phase-1-logout', 'passed');
      const summaryPath = await evidence.writeSummary();

      expect(results.map((result) => result.name)).toContain('workspace-dashboard');
      expect(summaryPath).toContain('admin-operations-summary.json');
    });
  });

  test.describe('admissions operations live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAdmissionsOperations,
      'Set EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS=true to submit intake requests, reject one, and approve/load another.',
    );

    test('views intake queue, searches and filters requests, rejects one, approves another, and verifies audit/status changes', async ({ page }, testInfo) => {
      test.setTimeout(240_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = adminRunId();
      const approveData = buildStudentJourneyData(`${runId}-approve`);
      const rejectData = buildStudentJourneyData(`${runId}-reject`);
      const rejectNote = `Automated SQA admissions rejection for ${runId}`;
      const approveNote = `Automated SQA admissions approval/load for ${runId}`;
      const evidence = adminEvidence(testInfo, runId);

      const publicIntake = new PublicIntakePage(page, env);
      await publicIntake.goto();
      await publicIntake.expectReady();
      await publicIntake.submitValidRequest(rejectData);
      evidence.recordStage('admin-phase-2-reject-intake-submitted', 'passed', rejectData.student.email);

      await page.context().clearCookies();
      await publicIntake.goto();
      await publicIntake.expectReady();
      await publicIntake.submitValidRequest(approveData);
      evidence.recordStage('admin-phase-2-approve-intake-submitted', 'passed', approveData.student.email);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('admin-phase-2-admin-login', 'passed', env.adminUsername);

      const queue = new IntakeReviewPage(page, env);
      await queue.goto();
      await queue.expectReady();
      await evidence.screenshot(page, 'admin-phase-2-intake-queue');

      const rejectRequestId = await queue.requestIdFor(rejectData);
      const approveRequestId = await queue.requestIdFor(approveData);
      evidence.recordId('rejectedIntakeRequestId', rejectRequestId);
      evidence.recordId('approvedIntakeRequestId', approveRequestId);
      evidence.recordStage('admin-phase-2-queue-visible', 'passed', `Requests ${rejectRequestId} and ${approveRequestId} visible.`);

      const searchMatches = await queue.searchRequests(rejectData.guardian.email);
      expect(searchMatches.some((text) => text.includes(rejectData.student.displayName))).toBe(true);
      evidence.recordStage('admin-phase-2-search-request', 'passed', rejectData.guardian.email);

      const newMatches = await queue.filterRequestsByStatus(/^new$/i);
      expect(newMatches.some((text) => text.includes(rejectData.student.displayName))).toBe(true);
      expect(newMatches.some((text) => text.includes(approveData.student.displayName))).toBe(true);
      evidence.recordStage('admin-phase-2-filter-new-requests', 'passed', `${newMatches.length} new request(s) visible.`);

      const rejection = await queue.saveReviewStatus(rejectData, {
        status: 'rejected',
        adminNotes: rejectNote,
      });
      expect(rejection.statusText).toMatch(/rejected/i);
      evidence.recordStage('admin-phase-2-request-rejected', 'passed', `Request ${rejection.requestId} rejected.`);

      const rejectedCardText = await queue.expectRequestStatus(rejectData, /rejected/i, rejectNote);
      const rejectedMatches = await queue.filterRequestsByStatus(/^rejected$/i);
      expect(rejectedMatches.some((text) => text.includes(rejectData.student.displayName))).toBe(true);
      evidence.recordStage('admin-phase-2-rejected-status-verified', 'passed', rejectedCardText.slice(0, 240));

      await queue.goto();
      await queue.expectReady();
      await queue.loadRequestIntoStudentIntake(approveData, approveNote);
      await expect(page.getByRole('heading', { name: /student intake/i })).toBeVisible();
      evidence.recordStage('admin-phase-2-request-approved-loaded', 'passed', `Request ${approveRequestId} loaded into student intake.`);
      await evidence.screenshot(page, 'admin-phase-2-student-intake-prefill');

      await queue.expectRequestStatus(approveData, /reviewing/i, approveNote);
      const reviewingMatches = await queue.filterRequestsByStatus(/^reviewing$/i);
      expect(reviewingMatches.some((text) => text.includes(approveData.student.displayName))).toBe(true);
      evidence.recordStage('admin-phase-2-reviewing-status-verified', 'passed', `Request ${approveRequestId} is reviewing.`);

      const audit = new AdminAuditDiagnosticsPage(page, env);
      await audit.expectRecentAuditForRequest(rejectRequestId, [/public_intake_review_saved/i]);
      await audit.expectRecentAuditForRequest(approveRequestId, [/public_intake_loaded_for_transfer/i]);
      evidence.recordStage('admin-phase-2-audit-verified', 'passed', `Audit found for requests ${rejectRequestId} and ${approveRequestId}.`);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('admin-phase-2-logout', 'passed');
      await evidence.attachJson('admin-phase-2-admissions-result', {
        rejectRequestId,
        approveRequestId,
        rejectEmail: rejectData.student.email,
        approveEmail: approveData.student.email,
      });
      const summaryPath = await evidence.writeSummary();

      expect(summaryPath).toContain('admin-operations-summary.json');
    });
  });

  test.describe('course offering operations live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableCourseOfferingOperations,
      'Set EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS=true to create, update, publish, review queue, and archive a course offering.',
    );

    test('creates, updates, publishes, archives offerings, changes capacity and visibility, and reviews enrollment queue', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = adminRunId();
      const evidence = adminEvidence(testInfo, runId);
      const courseOps = new CourseOfferingPage(page, env);
      const offeringTitle = `SQA Ops ${env.testCourseKey || 'pre_quraan'} ${runId}`;
      const enrollmentNote = `Automated SQA course offering queue rejection for ${runId}`;

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('admin-phase-3-admin-login', 'passed', env.adminUsername);

      await courseOps.goto();
      const created = await courseOps.createOperationsOffering({
        title: offeringTitle,
        capacity: '4',
        status: 'draft',
        visibility: 'workspace',
        tuitionAmount: env.invoiceLineAmount || env.publicCourseTuitionAmount || '25.00',
      });
      evidence.recordStage('admin-phase-3-offering-created-draft', 'passed', created.statusText);
      evidence.recordId('courseOfferingId', created.offeringId || '');
      evidence.recordId('courseOfferingTitle', offeringTitle);

      const published = await courseOps.updateOffering(offeringTitle, {
        capacity: '8',
        status: 'published',
        visibility: 'institution_public',
      });
      evidence.recordStage('admin-phase-3-offering-updated-published', 'passed', published.statusText);
      await evidence.screenshot(page, 'admin-phase-3-offering-published');

      await courseOps.expectCourseAudit(offeringTitle, [/offering created/i, /offering updated/i]);
      evidence.recordStage('admin-phase-3-offering-audit-verified', 'passed', offeringTitle);

      await logoutFromEduPlatform(page, env);

      const studentData = buildStudentJourneyData(`${runId}-course-offering`);
      const publicIntake = new PublicIntakePage(page, env);
      await publicIntake.goto();
      await publicIntake.expectReady();
      await publicIntake.submitValidRequest(studentData);
      evidence.recordStage('admin-phase-3-public-intake-submitted', 'passed', studentData.student.email);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const queue = new IntakeReviewPage(page, env);
      await queue.goto();
      const requestId = await queue.loadRequestIntoStudentIntake(studentData);
      evidence.recordStage('admin-phase-3-intake-loaded', 'passed', `Public intake request ${requestId}.`);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(studentData);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('admin-phase-3-student-created', 'passed', student.createdText);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });
      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollment = await catalog.requestEnrollmentForOffering(student, offeringTitle);
      evidence.recordStage('admin-phase-3-enrollment-request-created', 'passed', enrollment.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const pendingQueueText = await courseOps.expectEnrollmentRequestInQueue({
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        offeringTitle,
        status: 'pending',
      });
      evidence.recordStage('admin-phase-3-enrollment-queue-pending', 'passed', pendingQueueText.slice(0, 240));

      const rejection = await courseOps.rejectEnrollmentRequest({
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        offeringTitle,
        adminNote: enrollmentNote,
      });
      evidence.recordStage('admin-phase-3-enrollment-request-rejected', 'passed', rejection.statusText);
      evidence.recordId('courseEnrollmentRequestId', rejection.requestId);

      const rejectedQueueText = await courseOps.expectEnrollmentRequestInQueue({
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        offeringTitle,
        status: 'rejected',
      });
      expect(rejectedQueueText).toContain(enrollmentNote);
      evidence.recordStage('admin-phase-3-enrollment-queue-rejected', 'passed', rejectedQueueText.slice(0, 240));

      const archived = await courseOps.archiveOffering(offeringTitle);
      evidence.recordStage('admin-phase-3-offering-archived', 'passed', archived.statusText);
      await courseOps.expectCourseAudit(offeringTitle, [/offering created/i, /offering updated/i, /enrollment rejected/i, /offering archived/i]);
      evidence.recordStage('admin-phase-3-final-audit-verified', 'passed', offeringTitle);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('admin-phase-3-logout', 'passed');
      await evidence.attachJson('admin-phase-3-course-offering-result', {
        created,
        published,
        enrollment,
        rejection,
        archived,
      });
      const summaryPath = await evidence.writeSummary();

      expect(summaryPath).toContain('admin-operations-summary.json');
    });
  });

  test.describe('finance operations live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableFinanceOperations,
      'Set EDUPLATFORM_ENABLE_FINANCE_OPERATIONS=true to create an invoice fixture, review finance dashboards/policies, record payment, and validate parent billing visibility.',
    );

    test('verifies invoice dashboard, payment policy, manual payment receipt review, and parent billing visibility policy', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = adminRunId();
      const data = buildStudentJourneyData(`${runId}-finance`);
      const evidence = adminEvidence(testInfo, runId);
      const paymentReference = `SQA-FIN-${runId}`;

      const publicIntake = new PublicIntakePage(page, env);
      await publicIntake.goto();
      await publicIntake.expectReady();
      await publicIntake.expectPublicCourseAvailable();
      await publicIntake.submitValidRequest(data);
      evidence.recordStage('admin-phase-4-public-intake-submitted', 'passed', data.student.email);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('admin-phase-4-admin-login', 'passed', env.adminUsername);

      const financeOps = new FinanceOperationsPage(page, env);
      await financeOps.goto();
      await financeOps.expectReady();
      evidence.recordStage('admin-phase-4-finance-dashboard-ready', 'passed', buildEduPlatformUrl(env, HUB_ROUTES.financeOperations));

      const financePolicy = new FinancePolicyPage(page, env);
      await financePolicy.goto();
      const policy = await financePolicy.expectReady();
      evidence.recordStage('admin-phase-4-finance-policy-ready', 'passed', policy.finalUrl);

      const paymentSettings = new PaymentGatewaySettingsPage(page, env);
      await paymentSettings.goto();
      const settings = await paymentSettings.expectReady();
      evidence.recordStage('admin-phase-4-payment-settings-ready', 'passed', settings.finalUrl);

      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data, `Automated SQA finance operations approval for ${runId}`);
      evidence.recordStage('admin-phase-4-intake-loaded', 'passed', `Public intake request ${requestId}.`);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const parentUsername = data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase();
      const parentUsernameInput = page.locator('input[name="parent_username"]');
      if (await parentUsernameInput.isVisible().catch(() => false)) {
        await parentUsernameInput.fill(parentUsername);
      }
      const student = await studentIntake.createStudentFromPrefill(requestId);
      student.parentUsername = student.parentUsername || parentUsername;
      evidence.recordStage('admin-phase-4-student-created', 'passed', student.createdText);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('parentUserId', student.parentUserId);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });
      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollment = await catalog.requestEnrollment(student);
      evidence.recordStage('admin-phase-4-enrollment-request-created', 'passed', enrollment.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('admin-phase-4-enrollment-approved', 'passed', approval.statusText);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA finance operations tuition for ${runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('admin-phase-4-invoice-issued', 'passed', invoice.invoiceNumber);
      evidence.recordId('invoiceId', invoiceId);
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);

      const dashboard = await financeOps.expectInvoiceDashboard(invoice);
      evidence.recordStage('admin-phase-4-invoice-dashboard-verified', 'passed', dashboard.finalUrl);
      await evidence.screenshot(page, 'admin-phase-4-invoice-dashboard');

      await invoiceDetail.goto(invoice.invoiceId || invoiceId);
      const payment = await invoiceDetail.recordManualPayment({
        amount: invoice.balanceText || env.invoiceLineAmount,
        reference: paymentReference,
        notes: `Automated SQA finance operations payment for ${runId}.`,
        method: 'cash',
      });
      evidence.recordStage('admin-phase-4-manual-payment-recorded', 'passed', `${payment.receiptNumber} ${payment.amountText}`.trim());
      evidence.recordId('paymentId', payment.paymentId);
      evidence.recordId('receiptNumber', payment.receiptNumber);
      await evidence.screenshot(page, 'admin-phase-4-payment-receipt');

      await invoiceDetail.goto(invoice.invoiceId || invoiceId);
      const paidInvoice = await invoiceDetail.expectPaid(invoice, payment);
      evidence.recordStage('admin-phase-4-paid-invoice-verified', 'passed', paidInvoice.balanceText);

      const paymentReport = await financeOps.expectPaymentReport(payment);
      evidence.recordStage('admin-phase-4-payment-report-verified', 'passed', paymentReport.finalUrl);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.parentUsername || data.guardian.email,
        password: student.parentPassword || env.studentPassword,
      });
      evidence.recordStage('admin-phase-4-parent-login', 'passed', student.parentUsername || data.guardian.email);

      const parentBilling = new ParentBillingPage(page, env);
      await parentBilling.gotoForChild(student);
      const parentPaidBilling = await parentBilling.expectPaidInvoiceVisible(invoice, payment);
      evidence.recordStage(
        'admin-phase-4-parent-billing-policy-validated',
        parentPaidBilling.visible ? 'passed' : 'skipped',
        parentPaidBilling.visible
          ? `Invoice ${invoice.invoiceNumber} is paid on parent billing.`
          : parentPaidBilling.note,
      );

      const parentPortal = new StudentParentPortalPage(page, env);
      await parentPortal.gotoForChild(student);
      const portalFinance = await parentPortal.expectFinanceVisible(invoice, payment);
      evidence.recordStage('admin-phase-4-parent-portal-finance-visible', 'passed', portalFinance.finalUrl);
      await evidence.screenshot(page, 'admin-phase-4-parent-portal-finance-visible');

      await evidence.attachJson('admin-phase-4-finance-result', {
        student,
        enrollment,
        approval,
        invoice,
        payment,
        paidInvoice,
        dashboard,
        paymentReport,
        parentPaidBilling,
        portalFinance,
      });
      const summaryPath = await evidence.writeSummary();

      expect(summaryPath).toContain('admin-operations-summary.json');
    });
  });

  test.describe('reporting and audit operations live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableReportingAuditOperations,
      'Set EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS=true to verify managed reports, finance audit, transcript audit/readiness, and CSV evidence exports.',
    );

    test('verifies managed reports, finance audit, transcript audit, and evidence CSV downloads', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = adminRunId();
      const evidence = adminEvidence(testInfo, runId);

      await loginToEduPlatform(page, env, adminCredentials(env));
      evidence.recordStage('admin-phase-5-admin-login', 'passed', env.adminUsername);

      const reporting = new ReportingAuditOperationsPage(page, env);
      const managedReports = await reporting.expectManagedReports();
      evidence.recordStage('admin-phase-5-managed-reports-verified', 'passed', managedReports.map((result) => result.name).join(', '));
      await evidence.screenshot(page, 'admin-phase-5-student-course-history');

      const financeAudit = await reporting.expectFinanceAudit();
      evidence.recordStage('admin-phase-5-finance-audit-verified', 'passed', financeAudit.finalUrl);

      const transcriptAudit = await reporting.expectTranscriptAudit();
      evidence.recordStage('admin-phase-5-transcript-audit-verified', 'passed', transcriptAudit.map((result) => result.name).join(', '));
      await evidence.screenshot(page, 'admin-phase-5-transcript-policy');

      const transcriptExport = await reporting.downloadTranscriptReadinessCsv();
      evidence.recordStage('admin-phase-5-transcript-readiness-export-downloaded', 'passed', transcriptExport.suggestedFilename);

      const governanceExport = await reporting.downloadGovernanceAuditCsv();
      evidence.recordStage('admin-phase-5-governance-audit-export-downloaded', 'passed', governanceExport.suggestedFilename);

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('admin-phase-5-logout', 'passed');
      await evidence.attachJson('admin-phase-5-reporting-audit-result', {
        managedReports,
        financeAudit,
        transcriptAudit,
        transcriptExport,
        governanceExport,
      });
      const summaryPath = await evidence.writeSummary();

      expect(summaryPath).toContain('admin-operations-summary.json');
    });
  });

  test.describe('admin operations negative controls', () => {
    test('keeps admin dashboard live smoke disabled unless explicitly truthy', async () => {
      await withAdminEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE: 'off',
        EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS: '',
        EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS: 'no',
        EDUPLATFORM_ENABLE_FINANCE_OPERATIONS: 'false',
        EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS: '0',
      }, async () => {
        const env = getEduPlatformEnv();
        expect(env.enableAdminDashboardSmoke).toBe(false);
        expect(env.enableAdmissionsOperations).toBe(false);
        expect(env.enableCourseOfferingOperations).toBe(false);
        expect(env.enableFinanceOperations).toBe(false);
        expect(env.enableReportingAuditOperations).toBe(false);
      });
    });
  });
});
