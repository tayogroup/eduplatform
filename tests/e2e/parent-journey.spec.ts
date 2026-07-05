import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { IntakeReviewPage, StudentIntakePage, type StudentCreationResult } from './helpers/admissions';
import { CourseCatalogPage, CourseOfferingAdminPage, type EnrollmentApprovalResult, type EnrollmentRequestResult } from './helpers/course-enrollment';
import { JourneyEvidence } from './helpers/evidence';
import { AdminInvoicesPage, InvoiceDetailPage, type InvoiceResult, type PaymentReceiptResult } from './helpers/finance';
import { PublicIntakePage } from './helpers/intake';
import { ParentBillingPage, ParentWorkspacePage, StudentParentPortalPage } from './helpers/parent-portal';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildStudentJourneyData, type StudentJourneyData } from './helpers/student-data';

const PARENT_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_OFFERING_ID',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY',
  'EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withParentEnv<T>(
  overrides: Partial<Record<(typeof PARENT_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of PARENT_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of PARENT_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function parentEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'parent-journey',
    manifestTitle: 'EduPlatform Parent Journey Manifest',
  });
}

async function createParentStudentInvoiceFixture(page: Page, options: {
  data: StudentJourneyData;
  invoiceAmount: string;
}): Promise<{
  student: StudentCreationResult;
  enrollmentRequest: EnrollmentRequestResult;
  approval: EnrollmentApprovalResult;
  invoice: InvoiceResult;
  invoiceId: string;
}> {
  const env = getEduPlatformEnv({ allowPartial: true });
  const intake = new PublicIntakePage(page, env);
  await intake.goto();
  await intake.expectReady();
  await intake.expectPublicCourseAvailable();
  await intake.submitValidRequest(options.data);

  await loginToEduPlatform(page, env, adminCredentials(env));
  const intakeReview = new IntakeReviewPage(page, env);
  await intakeReview.goto();
  const requestId = await intakeReview.loadRequestIntoStudentIntake(options.data);

  const studentIntake = new StudentIntakePage(page);
  await studentIntake.expectPrefilled(options.data);
  const parentUsername = options.data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase();
  const parentUsernameInput = page.locator('input[name="parent_username"]');
  if (await parentUsernameInput.isVisible().catch(() => false)) {
    await parentUsernameInput.fill(parentUsername);
  }
  const student = await studentIntake.createStudentFromPrefill(requestId);
  student.parentUsername = student.parentUsername || parentUsername;

  await logoutFromEduPlatform(page, env);
  await loginToEduPlatform(page, env, {
    username: student.studentUsername,
    password: student.studentPassword,
  });

  const catalog = new CourseCatalogPage(page, env);
  await catalog.goto();
  const enrollmentRequest = await catalog.requestEnrollment(student);

  await logoutFromEduPlatform(page, env);
  await loginToEduPlatform(page, env, adminCredentials(env));
  const offerings = new CourseOfferingAdminPage(page, env);
  await offerings.gotoPendingForStudent(student);
  const approval = await offerings.approveEnrollment(student);

  const invoices = new AdminInvoicesPage(page, env);
  await invoices.goto();
  const invoiceId = await invoices.createDraftForStudent(student);
  const invoiceDetail = new InvoiceDetailPage(page, env);
  const invoice = await invoiceDetail.addLineAndIssue({
    description: `Automated SQA parent-visible tuition for ${options.data.runId}`,
    amount: options.invoiceAmount,
    enrollmentRequestId: approval.requestId,
  });

  return {
    student,
    enrollmentRequest,
    approval,
    invoice,
    invoiceId,
  };
}

async function loginAsParent(page: Page, student: StudentCreationResult, fallbackUsername: string): Promise<void> {
  const env = getEduPlatformEnv({ allowPartial: true });
  await loginToEduPlatform(page, env, {
    username: student.parentUsername || fallbackUsername,
    password: student.parentPassword || env.studentPassword,
  });
}

test.describe('EduPlatform parent journey harness', () => {
  test('validates parent E2E configuration and routes', async ({}, testInfo) => {
    const env = getEduPlatformEnv({ allowPartial: true });
    assertEduPlatformEnv(env);

    const data = buildStudentJourneyData();
    const evidence = parentEvidence(testInfo, data.runId);
    const parentWorkspaceUrl = buildEduPlatformUrl(env, HUB_ROUTES.parentWorkspace, { childid: 123 });
    const parentBillingUrl = buildEduPlatformUrl(env, HUB_ROUTES.parentBilling, { childid: 123 });

    evidence.recordStage('parent-helper-smoke', 'passed', 'Generated parent journey data, routes, evidence, and redacted env.');
    evidence.recordId('workspaceId', env.workspaceId);
    evidence.recordId('testOfferingId', env.testOfferingId || env.testCourseKey);
    const summaryPath = await evidence.writeSummary();

    expect(parentWorkspaceUrl).toContain('/local/hubredirect/workspace_parent.php');
    expect(parentBillingUrl).toContain('/local/hubredirect/parent_billing.php');
    expect(data.guardian.relationship).toBe('parent');
    expect(summaryPath).toContain('parent-journey-summary.json');
  });

  test.describe('parent portal visibility live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableParentPortalVisibility,
      'Set EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY=true to create a real parent/student fixture and verify parent portal visibility.',
    );

    test('creates a parent account and verifies linked child, invoice, and parent portal access', async ({ page }, testInfo) => {
      test.setTimeout(270_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = parentEvidence(testInfo, data.runId);
      const fixture = await createParentStudentInvoiceFixture(page, {
        data,
        invoiceAmount: env.invoiceLineAmount,
      });
      evidence.recordStage('parent-phase-1-fixture-created', 'passed', `Parent ${fixture.student.parentUserId} linked to student ${fixture.student.studentUserId}.`);
      evidence.recordId('studentUserId', fixture.student.studentUserId);
      evidence.recordId('studentAccountId', fixture.student.studentAccountId);
      evidence.recordId('parentUserId', fixture.student.parentUserId);
      evidence.recordId('parentAccountId', fixture.student.parentAccountId);
      evidence.recordId('invoiceId', fixture.invoiceId);
      evidence.recordId('invoiceNumber', fixture.invoice.invoiceNumber);

      await logoutFromEduPlatform(page, env);
      await loginAsParent(page, fixture.student, data.guardian.email);
      evidence.recordStage('parent-phase-1-parent-login', 'passed', fixture.student.parentUsername || fixture.student.parentUserId);

      const parentWorkspace = new ParentWorkspacePage(page, env);
      await parentWorkspace.gotoForChild(fixture.student);
      const workspace = await parentWorkspace.expectChildVisible(
        fixture.student,
        `${data.student.firstName} ${data.student.lastName}`,
      );
      evidence.recordStage('parent-phase-1-workspace-visible', 'passed', workspace.finalUrl);
      await evidence.screenshot(page, 'parent-phase-1-workspace-visible');

      const parentBilling = new ParentBillingPage(page, env);
      await parentBilling.gotoForChild(fixture.student);
      const billing = await parentBilling.expectInvoiceVisible(fixture.invoice);
      evidence.recordStage(
        'parent-phase-1-billing-visible',
        billing.visible ? 'passed' : 'skipped',
        billing.visible
          ? `Invoice ${fixture.invoice.invoiceNumber} visible to parent.`
          : billing.note,
      );

      const studentParentPortal = new StudentParentPortalPage(page, env);
      await studentParentPortal.gotoForChild(fixture.student);
      const portal = await studentParentPortal.expectFinanceVisible(fixture.invoice);
      evidence.recordStage('parent-phase-1-student-parent-portal-visible', 'passed', portal.finalUrl);
      await evidence.screenshot(page, 'parent-phase-1-student-parent-portal-visible');

      await evidence.attachJson('parent-phase-1-result', {
        fixture,
        workspace,
        billing,
        portal,
      });
      await evidence.writeSummary();

      expect(fixture.student.parentUserId).toMatch(/^\d+$/);
      expect(portal.portalText).toContain(fixture.invoice.invoiceNumber);
    });
  });

  test.describe('parent payment visibility live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableParentPaymentVisibility,
      'Set EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY=true to create a real parent/student invoice, record payment, and verify parent-visible paid evidence.',
    );

    test('verifies parent-visible paid invoice and receipt evidence after manual payment', async ({ page }, testInfo) => {
      test.setTimeout(300_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = parentEvidence(testInfo, data.runId);
      const fixture = await createParentStudentInvoiceFixture(page, {
        data,
        invoiceAmount: env.invoiceLineAmount,
      });
      evidence.recordStage('parent-phase-2-fixture-created', 'passed', `Invoice ${fixture.invoice.invoiceNumber} issued for parent-linked student.`);
      evidence.recordId('studentUserId', fixture.student.studentUserId);
      evidence.recordId('parentUserId', fixture.student.parentUserId);
      evidence.recordId('invoiceId', fixture.invoiceId);
      evidence.recordId('invoiceNumber', fixture.invoice.invoiceNumber);

      const invoiceDetail = new InvoiceDetailPage(page, env);
      const payment: PaymentReceiptResult = await invoiceDetail.recordManualPayment({
        amount: fixture.invoice.balanceText || env.invoiceLineAmount,
        reference: data.finance.paymentReference,
        notes: `Automated SQA parent journey payment for ${data.runId}.`,
        method: 'cash',
      });
      evidence.recordStage('parent-phase-2-payment-recorded', 'passed', `${payment.receiptNumber} ${payment.amountText}`.trim());
      evidence.recordId('paymentId', payment.paymentId);
      evidence.recordId('receiptNumber', payment.receiptNumber);
      await evidence.screenshot(page, 'parent-phase-2-payment-receipt');

      await logoutFromEduPlatform(page, env);
      await loginAsParent(page, fixture.student, data.guardian.email);

      const parentBilling = new ParentBillingPage(page, env);
      await parentBilling.gotoForChild(fixture.student);
      const parentPaidBilling = await parentBilling.expectPaidInvoiceVisible(fixture.invoice, payment);
      evidence.recordStage(
        'parent-phase-2-parent-billing-paid',
        parentPaidBilling.visible ? 'passed' : 'skipped',
        parentPaidBilling.visible
          ? `Invoice ${fixture.invoice.invoiceNumber} is paid on parent billing.`
          : parentPaidBilling.note,
      );
      await evidence.screenshot(page, 'parent-phase-2-parent-billing-paid');

      const studentParentPortal = new StudentParentPortalPage(page, env);
      await studentParentPortal.gotoForChild(fixture.student);
      const parentPortal = await studentParentPortal.expectFinanceVisible(fixture.invoice, payment);
      evidence.recordStage('parent-phase-2-parent-portal-receipt-visible', 'passed', `Receipt ${payment.receiptNumber} visible in parent portal.`);

      await evidence.attachJson('parent-phase-2-result', {
        fixture,
        payment,
        parentPaidBilling,
        parentPortal,
      });
      await evidence.writeSummary();

      expect(payment.receiptNumber).not.toEqual('');
      expect(parentPortal.portalText).toContain(payment.receiptNumber);
    });
  });

  test.describe('parent negative controls', () => {
    test('keeps parent live action flags disabled unless explicitly truthy', async () => {
      await withParentEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY: '',
        EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY: 'off',
      }, async () => {
        const env = getEduPlatformEnv();
        expect(env.enableParentPortalVisibility).toBe(false);
        expect(env.enableParentPaymentVisibility).toBe(false);
      });
    });
  });
});
