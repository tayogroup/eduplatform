import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import { GradebookAssessmentPage } from './helpers/completion';
import { IntakeReviewPage, StudentIntakePage } from './helpers/admissions';
import { CourseCatalogPage, CourseOfferingAdminPage } from './helpers/course-enrollment';
import { JourneyEvidence } from './helpers/evidence';
import { AdminInvoicesPage, InvoiceDetailPage, StudentBillingPage } from './helpers/finance';
import { PublicIntakePage } from './helpers/intake';
import { MoodleWsClient, redactObject } from './helpers/moodle-ws';
import { buildEduPlatformUrl, HUB_ROUTES, publicIntakeUrl } from './helpers/routes';
import { buildStudentJourneyData } from './helpers/student-data';
import {
  downloadOfficialTranscript,
  TranscriptPolicyPage,
  TranscriptUiPage,
  verificationCodeFromIssuedUrl,
} from './helpers/transcript';

const E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEST_OFFERING_ID',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT',
  'EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE',
  'EDUPLATFORM_ENABLE_COURSE_ENROLLMENT',
  'EDUPLATFORM_ENABLE_INVOICE_CREATE',
  'EDUPLATFORM_ENABLE_CLASS_COMPLETION',
  'EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE',
  'EDUPLATFORM_ENABLE_PAYMENT_RECEIPT',
  'EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withEduPlatformEnv<T>(
  overrides: Partial<Record<(typeof E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test.describe('EduPlatform student journey harness', () => {
  test('validates E2E configuration and production guard', async ({ request }, testInfo) => {
    const env = getEduPlatformEnv({ allowPartial: true });

    assertEduPlatformEnv(env);
    const data = buildStudentJourneyData();
    const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));
    const wsClient = new MoodleWsClient(request, env);
    const publicUrl = publicIntakeUrl(env);
    const transcriptUrl = buildEduPlatformUrl(env, HUB_ROUTES.courseTranscript, {
      studentid: 123,
    });

    await testInfo.attach('eduplatform-e2e-env', {
      body: JSON.stringify(redactedEduPlatformEnv(env), null, 2),
      contentType: 'application/json',
    });
    await evidence.attachJson('generated-student-data', {
      runId: data.runId,
      studentEmail: data.student.email,
      guardianEmail: data.guardian.email,
      paymentReference: data.finance.paymentReference,
    });
    evidence.recordStage('phase-2-helper-smoke', 'passed', 'Generated test data, routes, evidence, and redaction helpers.');
    evidence.recordId('workspaceId', env.workspaceId);
    evidence.recordId('testOfferingId', env.testOfferingId || env.testCourseKey);
    const summaryPath = await evidence.writeSummary();

    expect(env.baseUrl).toMatch(/^https?:\/\//);
    expect(env.workspaceId).not.toEqual('');
    expect(env.consumer).not.toEqual('');
    expect(env.testOfferingId || env.testCourseKey).not.toEqual('');
    expect(data.runId).toMatch(/^sqa-journey-\d{8}-\d{6}-[a-z0-9]{6}$/);
    expect(publicUrl).toContain('/local/hubredirect/public_intake.php');
    expect(transcriptUrl).toContain('studentid=123');
    expect(summaryPath).toContain('student-journey-summary.json');
    expect(redactObject({ wstoken: 'secret', nested: { password: 'secret' } })).toEqual({
      wstoken: '[redacted]',
      nested: { password: '[redacted]' },
    });
    expect(wsClient.redactedCall({ wsfunction: 'local_prequran_transcript_preview' })).toMatchObject({
      wsfunction: 'local_prequran_transcript_preview',
      wstoken: env.wsToken ? '[redacted]' : '',
    });
  });

  test.describe('public intake live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enablePublicIntakeSubmit,
      'Set EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT=true to create a real public intake request in non-production.',
    );

    test('submits public intake request when explicitly enabled', async ({ page }, testInfo) => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));
      const intake = new PublicIntakePage(page, env);

      await intake.goto();
      await intake.expectReady();
      const selectedCourseValue = await intake.expectPublicCourseAvailable();
      evidence.recordStage('public-intake-ready', 'passed', `Public intake form loaded with course ${selectedCourseValue}.`);
      await evidence.screenshot(page, 'public-intake-ready');

      const result = await intake.submitValidRequest(data);
      evidence.recordStage('public-intake-submitted', 'passed', result.confirmationText);
      evidence.recordId('publicIntakeSubmitted', true);
      evidence.recordId('publicIntakeCourseValue', result.selectedCourseValue);
      await evidence.screenshot(page, 'public-intake-submitted');
      await evidence.writeSummary();

      expect(result.submitted).toBe(true);
      expect(result.finalUrl).toContain('submitted=1');
      expect(result.confirmationText).toMatch(/received|submitted|review/i);
    });
  });

  test.describe('admissions approval and student creation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAdmissionsStudentCreate,
      'Set EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE=true to create a real public intake request and convert it into a student account.',
    );

    test('loads public intake into student intake and creates student account', async ({ page }, testInfo) => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      const selectedCourseValue = await intake.expectPublicCourseAvailable();
      evidence.recordStage('phase-4-public-intake-ready', 'passed', `Public intake form loaded with course ${selectedCourseValue}.`);
      await evidence.attachJson('phase-4-generated-student-data', {
        runId: data.runId,
        studentDisplayName: data.student.displayName,
        studentEmail: data.student.email,
        guardianDisplayName: data.guardian.displayName,
        guardianEmail: data.guardian.email,
      });

      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-4-public-intake-submitted', 'passed', intakeResult.confirmationText);
      evidence.recordId('publicIntakeCourseValue', intakeResult.selectedCourseValue);
      await evidence.screenshot(page, 'phase-4-public-intake-submitted');

      await loginToEduPlatform(page, env, adminCredentials(env));

      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);
      evidence.recordStage('phase-4-intake-loaded', 'passed', `Public intake request #${requestId} loaded into student intake.`);
      evidence.recordId('publicIntakeRequestId', requestId);
      await evidence.screenshot(page, 'phase-4-student-intake-prefilled');

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const created = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-4-student-created', 'passed', created.createdText);
      evidence.recordId('studentUserId', created.studentUserId);
      evidence.recordId('studentAccountId', created.studentAccountId);
      evidence.recordId('studentUsername', created.studentUsername);
      evidence.recordId('parentUserId', created.parentUserId);
      evidence.recordId('parentAccountId', created.parentAccountId);
      evidence.recordId('enrollmentApprovalStatus', created.enrollmentApprovalStatus);
      await evidence.attachJson('phase-4-student-creation-result', created);
      await evidence.screenshot(page, 'phase-4-student-created');
      await evidence.writeSummary();

      expect(created.requestId).toBe(requestId);
      expect(created.studentUserId).toMatch(/^\d+$/);
      expect(created.studentUsername).not.toEqual('');
      expect(created.finalUrl).toContain('created=1');
    });
  });

  test.describe('course enrollment live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableCourseEnrollment,
      'Set EDUPLATFORM_ENABLE_COURSE_ENROLLMENT=true to create a real student, request course enrollment, and approve/sync it.',
    );

    test('requests and approves enrollment into the selected course offering', async ({ page }, testInfo) => {
      test.setTimeout(180_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      await intake.expectPublicCourseAvailable();
      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-5-public-intake-submitted', 'passed', intakeResult.confirmationText);
      evidence.recordId('publicIntakeCourseValue', intakeResult.selectedCourseValue);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-5-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);
      await evidence.screenshot(page, 'phase-5-student-created');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-5-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);
      evidence.recordId('enrollmentOfferingTitle', enrollmentRequest.offeringTitle);
      await evidence.screenshot(page, 'phase-5-enrollment-requested');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-5-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);
      evidence.recordId('enrollmentApprovalStatus', approval.statusText);
      await evidence.attachJson('phase-5-enrollment-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        enrollmentRequest,
        approval,
      });
      await evidence.screenshot(page, 'phase-5-enrollment-approved');
      await evidence.writeSummary();

      expect(enrollmentRequest.requestStatusText).toMatch(/pending approval/i);
      expect(approval.statusText).toMatch(/enrollment approved|moodle enrollment/i);
    });
  });

  test.describe('invoice creation live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableInvoiceCreate,
      'Set EDUPLATFORM_ENABLE_INVOICE_CREATE=true to create a real student/enrollment and issue a real invoice.',
    );

    test('creates and issues a tuition invoice for the enrolled student', async ({ page }, testInfo) => {
      test.setTimeout(240_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      await intake.expectPublicCourseAvailable();
      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-6-public-intake-submitted', 'passed', intakeResult.confirmationText);
      evidence.recordId('publicIntakeCourseValue', intakeResult.selectedCourseValue);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-6-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-6-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-6-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      evidence.recordStage('phase-6-invoice-draft-created', 'passed', `Draft invoice #${invoiceId} created.`);
      evidence.recordId('invoiceId', invoiceId);

      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA tuition for ${data.runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('phase-6-invoice-issued', 'passed', `${invoice.invoiceNumber} ${invoice.statusText}`.trim());
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);
      evidence.recordId('invoiceTotal', invoice.totalText);
      evidence.recordId('invoiceBalance', invoice.balanceText);
      await evidence.screenshot(page, 'phase-6-invoice-issued');

      const billing = new StudentBillingPage(page, env);
      await billing.gotoForStudent(student);
      const billingVisibility = await billing.expectInvoiceVisible(invoice);
      evidence.recordStage('phase-6-admin-billing-visible', 'passed', `Invoice ${invoice.invoiceNumber} visible on student billing.`);
      await evidence.attachJson('phase-6-invoice-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        enrollmentRequest,
        approval,
        invoice,
        billingVisibility,
      });
      await evidence.screenshot(page, 'phase-6-admin-billing-visible');
      await evidence.writeSummary();

      expect(invoice.invoiceId).toBe(invoiceId);
      expect(invoice.invoiceNumber).not.toEqual('');
      expect(invoice.statusText).toMatch(/issued|sent|paid|partially paid/i);
      expect(billingVisibility.invoiceText).toContain(invoice.invoiceNumber);
    });
  });

  test.describe('class completion live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableClassCompletion,
      'Set EDUPLATFORM_ENABLE_CLASS_COMPLETION=true to create a real student/enrollment/invoice and publish a course grade.',
    );

    test('publishes a completion grade for the enrolled student', async ({ page }, testInfo) => {
      test.setTimeout(270_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      await intake.expectPublicCourseAvailable();
      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-7-public-intake-submitted', 'passed', intakeResult.confirmationText);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-7-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-7-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);
      evidence.recordId('enrollmentOfferingTitle', enrollmentRequest.offeringTitle);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-7-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA tuition for ${data.runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('phase-7-invoice-issued', 'passed', `${invoice.invoiceNumber} ${invoice.statusText}`.trim());
      evidence.recordId('invoiceId', invoiceId);
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);

      const gradebook = new GradebookAssessmentPage(page, env);
      await gradebook.goto();
      const completion = await gradebook.createAssessmentGradeAndPublish({
        student,
        studentEmail: data.student.email,
        offeringTitle: enrollmentRequest.offeringTitle,
        runId: data.runId,
      });
      evidence.recordStage('phase-7-class-completion-grade-published', 'passed', completion.publishNotice);
      evidence.recordId('completionAssessmentTitle', completion.assessmentTitle);
      evidence.recordId('completionScorePercent', completion.scorePercent);
      evidence.recordId('completionOffering', completion.selectedOfferingLabel);
      await evidence.attachJson('phase-7-completion-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        enrollmentRequest,
        approval,
        invoice,
        completion,
      });
      await evidence.screenshot(page, 'phase-7-class-completion-grade-published');
      await evidence.writeSummary();

      expect(completion.publishNotice).toMatch(/course grade published/i);
      expect(completion.courseGradeText).toContain(data.student.email);
      expect(completion.courseGradeText).toContain(`${completion.scorePercent}%`);
    });
  });

  test.describe('transcript issue live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableTranscriptIssue,
      'Set EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE=true to create a completed journey and issue/verify a real official transcript.',
    );

    test('previews, issues, downloads, and verifies an official transcript', async ({ page }, testInfo) => {
      test.setTimeout(330_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      await intake.expectPublicCourseAvailable();
      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-8-public-intake-submitted', 'passed', intakeResult.confirmationText);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-8-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-8-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-8-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA tuition for ${data.runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('phase-8-invoice-issued', 'passed', `${invoice.invoiceNumber} ${invoice.statusText}`.trim());
      evidence.recordId('invoiceId', invoiceId);
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);

      const gradebook = new GradebookAssessmentPage(page, env);
      await gradebook.goto();
      const completion = await gradebook.createAssessmentGradeAndPublish({
        student,
        studentEmail: data.student.email,
        offeringTitle: enrollmentRequest.offeringTitle,
        runId: data.runId,
      });
      evidence.recordStage('phase-8-class-completion-grade-published', 'passed', completion.publishNotice);
      evidence.recordId('completionScorePercent', completion.scorePercent);
      await evidence.screenshot(page, 'phase-8-class-completion-grade-published');

      const transcriptPolicy = new TranscriptPolicyPage(page, env);
      await transcriptPolicy.goto();
      const policyText = await transcriptPolicy.saveWorkspaceDefaults();
      evidence.recordStage('phase-8-transcript-policy-ready', 'passed', policyText);

      const transcript = new TranscriptUiPage(page, env);
      const preview = await transcript.preview(student, enrollmentRequest.offeringTitle, completion.scorePercent);
      evidence.recordStage('phase-8-transcript-preview-resolved', 'passed', preview.targetLineText);
      evidence.recordId('transcriptLineCount', preview.payload.summary?.line_count || 0);
      evidence.recordId('transcriptWarningCount', preview.payload.summary?.warning_count || 0);

      const issued = await transcript.issueOfficial(student, data.finance.transcriptReason);
      const verificationCode = verificationCodeFromIssuedUrl(issued.url);
      if (!issued.ok || !issued.documentid || !verificationCode) {
        throw new Error(`Official transcript issue did not return a document and verification code: ${JSON.stringify(issued)}`);
      }
      evidence.recordStage('phase-8-official-transcript-issued', 'passed', `${issued.documentid} ${issued.status}`.trim());
      evidence.recordId('officialTranscriptDocumentId', issued.documentid);
      evidence.recordId('officialTranscriptStatus', issued.status);

      const document = await transcript.document(issued.documentid);
      const download = await downloadOfficialTranscript(page, env, document.url);
      evidence.recordStage('phase-8-official-transcript-downloaded', 'passed', `${download.status} ${download.byteLength} bytes ${download.contentType}`.trim());

      const verification = await transcript.verify(issued.url, issued.documentid);
      evidence.recordStage('phase-8-official-transcript-verified', 'passed', verification.statusText);
      await evidence.attachJson('phase-8-transcript-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        enrollmentRequest,
        approval,
        invoice,
        completion,
        preview: {
          summary: preview.payload.summary,
          warningCodes: preview.warningCodes,
          targetLineText: preview.targetLineText,
        },
        issued,
        document,
        download,
        verification,
      });
      await evidence.writeSummary();

      expect(preview.payload.summary?.line_count || 0).toBeGreaterThan(0);
      expect(preview.targetLineText).toContain(completion.scorePercent);
      expect(issued.status).toMatch(/issued|stale|reissued/i);
      expect(document.status).toMatch(/issued|stale|reissued/i);
      expect(download.status).toBe(200);
      expect(download.byteLength).toBeGreaterThan(100);
      expect(verification.ok).toBe(true);
    });
  });

  test.describe('payment receipt live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enablePaymentReceipt,
      'Set EDUPLATFORM_ENABLE_PAYMENT_RECEIPT=true to create a real invoice, record payment, and verify receipt plus paid status.',
    );

    test('records a manual payment and verifies receipt plus paid invoice state', async ({ page }, testInfo) => {
      test.setTimeout(240_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      await intake.expectPublicCourseAvailable();
      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-9-public-intake-submitted', 'passed', intakeResult.confirmationText);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-9-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-9-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-9-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA tuition for ${data.runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('phase-9-invoice-issued', 'passed', `${invoice.invoiceNumber} ${invoice.statusText}`.trim());
      evidence.recordId('invoiceId', invoiceId);
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);
      evidence.recordId('invoiceBalanceBeforePayment', invoice.balanceText);

      const payment = await invoiceDetail.recordManualPayment({
        amount: invoice.balanceText || env.invoiceLineAmount,
        reference: data.finance.paymentReference,
        notes: `Automated SQA manual payment for ${data.runId}.`,
        method: 'cash',
      });
      evidence.recordStage('phase-9-payment-recorded', 'passed', `${payment.receiptNumber} ${payment.amountText}`.trim());
      evidence.recordId('paymentId', payment.paymentId);
      evidence.recordId('receiptNumber', payment.receiptNumber);
      await evidence.screenshot(page, 'phase-9-payment-receipt');

      await invoiceDetail.goto(invoiceId);
      const paidInvoice = await invoiceDetail.expectPaid(invoice, payment);
      evidence.recordStage('phase-9-invoice-paid', 'passed', `Invoice ${invoice.invoiceNumber} paid with balance ${paidInvoice.balanceText}.`);
      evidence.recordId('invoiceBalanceAfterPayment', paidInvoice.balanceText);

      const billing = new StudentBillingPage(page, env);
      await billing.gotoForStudent(student);
      const paidBilling = await billing.expectInvoicePaid(invoice);
      evidence.recordStage('phase-9-student-billing-paid', 'passed', `Invoice ${invoice.invoiceNumber} paid on student billing.`);

      await evidence.attachJson('phase-9-payment-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        enrollmentRequest,
        approval,
        invoice,
        payment,
        paidInvoice,
        paidBilling,
      });
      await evidence.screenshot(page, 'phase-9-student-billing-paid');
      await evidence.writeSummary();

      expect(payment.receiptNumber).not.toEqual('');
      expect(payment.receiptText).toContain(data.finance.paymentReference);
      expect(paidInvoice.statusText).toMatch(/paid/i);
      expect(paidInvoice.balanceText).toMatch(/^0(?:\.00)?$/);
      expect(paidBilling.invoiceText).toContain(invoice.invoiceNumber);
    });
  });

  test.describe('full student journey live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableFullStudentJourney,
      'Set EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY=true to run the full intake-to-transcript-to-payment golden path.',
    );

    test('runs the full golden path from public intake through transcript and paid receipt', async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      const intake = new PublicIntakePage(page, env);
      await intake.goto();
      await intake.expectReady();
      const selectedCourseValue = await intake.expectPublicCourseAvailable();
      evidence.recordStage('phase-10-public-intake-ready', 'passed', `Public intake form loaded with course ${selectedCourseValue}.`);

      const intakeResult = await intake.submitValidRequest(data);
      evidence.recordStage('phase-10-public-intake-submitted', 'passed', intakeResult.confirmationText);
      evidence.recordId('publicIntakeCourseValue', intakeResult.selectedCourseValue);

      await loginToEduPlatform(page, env, adminCredentials(env));
      const intakeReview = new IntakeReviewPage(page, env);
      await intakeReview.goto();
      const requestId = await intakeReview.loadRequestIntoStudentIntake(data);
      evidence.recordId('publicIntakeRequestId', requestId);

      const studentIntake = new StudentIntakePage(page);
      await studentIntake.expectPrefilled(data);
      const student = await studentIntake.createStudentFromPrefill(requestId);
      evidence.recordStage('phase-10-student-created', 'passed', `Student ${student.studentUserId} created.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentAccountId', student.studentAccountId);
      evidence.recordId('studentUsername', student.studentUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword,
      });

      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollment(student);
      evidence.recordStage('phase-10-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);
      evidence.recordId('enrollmentOfferingTitle', enrollmentRequest.offeringTitle);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const offerings = new CourseOfferingAdminPage(page, env);
      await offerings.gotoPendingForStudent(student);
      const approval = await offerings.approveEnrollment(student);
      evidence.recordStage('phase-10-enrollment-approved', 'passed', approval.statusText);
      evidence.recordId('enrollmentRequestId', approval.requestId);

      const invoices = new AdminInvoicesPage(page, env);
      await invoices.goto();
      const invoiceId = await invoices.createDraftForStudent(student);
      const invoiceDetail = new InvoiceDetailPage(page, env);
      const invoice = await invoiceDetail.addLineAndIssue({
        description: `Automated SQA tuition for ${data.runId}`,
        amount: env.invoiceLineAmount,
        enrollmentRequestId: approval.requestId,
      });
      evidence.recordStage('phase-10-invoice-issued', 'passed', `${invoice.invoiceNumber} ${invoice.statusText}`.trim());
      evidence.recordId('invoiceId', invoiceId);
      evidence.recordId('invoiceNumber', invoice.invoiceNumber);
      evidence.recordId('invoiceBalanceBeforePayment', invoice.balanceText);

      const gradebook = new GradebookAssessmentPage(page, env);
      await gradebook.goto();
      const completion = await gradebook.createAssessmentGradeAndPublish({
        student,
        studentEmail: data.student.email,
        offeringTitle: enrollmentRequest.offeringTitle,
        runId: data.runId,
      });
      evidence.recordStage('phase-10-class-completion-grade-published', 'passed', completion.publishNotice);
      evidence.recordId('completionAssessmentTitle', completion.assessmentTitle);
      evidence.recordId('completionScorePercent', completion.scorePercent);
      evidence.recordId('completionOffering', completion.selectedOfferingLabel);
      await evidence.screenshot(page, 'phase-10-class-completion-grade-published');

      const transcriptPolicy = new TranscriptPolicyPage(page, env);
      await transcriptPolicy.goto();
      const policyText = await transcriptPolicy.saveWorkspaceDefaults();
      evidence.recordStage('phase-10-transcript-policy-ready', 'passed', policyText);

      const transcript = new TranscriptUiPage(page, env);
      const preview = await transcript.preview(student, enrollmentRequest.offeringTitle, completion.scorePercent);
      evidence.recordStage('phase-10-transcript-preview-resolved', 'passed', preview.targetLineText);
      evidence.recordId('transcriptLineCount', preview.payload.summary?.line_count || 0);
      evidence.recordId('transcriptWarningCount', preview.payload.summary?.warning_count || 0);

      const issued = await transcript.issueOfficial(student, data.finance.transcriptReason);
      const verificationCode = verificationCodeFromIssuedUrl(issued.url);
      if (!issued.ok || !issued.documentid || !verificationCode) {
        throw new Error(`Official transcript issue did not return a document and verification code: ${JSON.stringify(issued)}`);
      }
      evidence.recordStage('phase-10-official-transcript-issued', 'passed', `${issued.documentid} ${issued.status}`.trim());
      evidence.recordId('officialTranscriptDocumentId', issued.documentid);
      evidence.recordId('officialTranscriptStatus', issued.status);

      const document = await transcript.document(issued.documentid);
      const download = await downloadOfficialTranscript(page, env, document.url);
      evidence.recordStage('phase-10-official-transcript-downloaded', 'passed', `${download.status} ${download.byteLength} bytes ${download.contentType}`.trim());

      const verification = await transcript.verify(issued.url, issued.documentid);
      evidence.recordStage('phase-10-official-transcript-verified', 'passed', verification.statusText);

      await invoiceDetail.goto(invoiceId);
      const payment = await invoiceDetail.recordManualPayment({
        amount: invoice.balanceText || env.invoiceLineAmount,
        reference: data.finance.paymentReference,
        notes: `Automated SQA full journey payment for ${data.runId}.`,
        method: 'cash',
      });
      evidence.recordStage('phase-10-payment-recorded', 'passed', `${payment.receiptNumber} ${payment.amountText}`.trim());
      evidence.recordId('paymentId', payment.paymentId);
      evidence.recordId('receiptNumber', payment.receiptNumber);
      await evidence.screenshot(page, 'phase-10-payment-receipt');

      await invoiceDetail.goto(invoiceId);
      const paidInvoice = await invoiceDetail.expectPaid(invoice, payment);
      evidence.recordStage('phase-10-invoice-paid', 'passed', `Invoice ${invoice.invoiceNumber} paid with balance ${paidInvoice.balanceText}.`);
      evidence.recordId('invoiceBalanceAfterPayment', paidInvoice.balanceText);

      const billing = new StudentBillingPage(page, env);
      await billing.gotoForStudent(student);
      const paidBilling = await billing.expectInvoicePaid(invoice);
      evidence.recordStage('phase-10-student-billing-paid', 'passed', `Invoice ${invoice.invoiceNumber} paid on student billing.`);

      const cleanupStatus = env.cleanupMode === 'none' ? 'skipped' : 'planned';
      evidence.recordCleanupAction({
        target: 'student-account',
        identifier: student.studentUserId,
        mode: env.cleanupMode,
        status: cleanupStatus,
        note: env.cleanupMode === 'none'
          ? 'Cleanup disabled for this run.'
          : 'Generated SQA student should be archived or tagged after evidence review.',
      });
      evidence.recordCleanupAction({
        target: 'enrollment-request',
        identifier: approval.requestId,
        mode: env.cleanupMode,
        status: cleanupStatus,
        note: env.cleanupMode === 'none'
          ? 'Cleanup disabled for this run.'
          : 'Approved enrollment should remain auditable; archive/tag only.',
      });
      evidence.recordCleanupAction({
        target: 'paid-invoice',
        identifier: invoiceId,
        mode: env.cleanupMode,
        status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
        note: 'Paid invoices, payments, receipts, and finance audit records must be retained.',
      });
      evidence.recordCleanupAction({
        target: 'official-transcript',
        identifier: issued.documentid,
        mode: env.cleanupMode,
        status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
        note: 'Issued transcript documents must remain available for verification/audit.',
      });

      await evidence.attachJson('phase-10-full-student-journey-result', {
        studentUserId: student.studentUserId,
        studentAccountId: student.studentAccountId,
        studentUsername: student.studentUsername,
        intakeResult,
        enrollmentRequest,
        approval,
        invoice,
        completion,
        preview: {
          summary: preview.payload.summary,
          warningCodes: preview.warningCodes,
          targetLineText: preview.targetLineText,
        },
        issued,
        document,
        download,
        verification,
        payment,
        paidInvoice,
        paidBilling,
      });
      await evidence.screenshot(page, 'phase-10-student-billing-paid');
      await evidence.writeSummary();

      expect(intakeResult.submitted).toBe(true);
      expect(enrollmentRequest.requestStatusText).toMatch(/pending|requested|submitted/i);
      expect(approval.statusText).toMatch(/approved|active|enrolled|synced/i);
      expect(completion.publishNotice).toMatch(/course grade published/i);
      expect(preview.payload.summary?.line_count || 0).toBeGreaterThan(0);
      expect(preview.targetLineText).toContain(completion.scorePercent);
      expect(issued.status).toMatch(/issued|stale|reissued/i);
      expect(document.status).toMatch(/issued|stale|reissued/i);
      expect(download.status).toBe(200);
      expect(download.byteLength).toBeGreaterThan(100);
      expect(verification.ok).toBe(true);
      expect(payment.receiptNumber).not.toEqual('');
      expect(payment.receiptText).toContain(data.finance.paymentReference);
      expect(paidInvoice.statusText).toMatch(/paid/i);
      expect(paidInvoice.balanceText).toMatch(/^0(?:\.00)?$/);
      expect(paidBilling.invoiceText).toContain(invoice.invoiceNumber);
    });
  });

  test.describe('reporting and cleanup readiness', () => {
    test('writes final manifest, verdict, failed-stage, and cleanup disposition artifacts', async ({}, testInfo) => {
      const env = getEduPlatformEnv({ allowPartial: true });
      const data = buildStudentJourneyData();
      const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

      evidence.recordStage('phase-11-reporting-started', 'passed', 'Reporting manifest smoke started.');
      evidence.recordId('studentUserId', 'phase11-student-smoke');
      evidence.recordId('invoiceNumber', 'INV-PHASE11-SMOKE');
      evidence.recordId('officialTranscriptDocumentId', 'TR-PHASE11-SMOKE');
      evidence.recordCleanupAction({
        target: 'student-account',
        identifier: 'phase11-student-smoke',
        mode: env.cleanupMode,
        status: env.cleanupMode === 'none' ? 'skipped' : 'planned',
        note: 'Phase 11 smoke verifies cleanup disposition is captured without changing live data.',
      });
      evidence.recordCleanupAction({
        target: 'paid-invoice',
        identifier: 'INV-PHASE11-SMOKE',
        mode: env.cleanupMode,
        status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
        note: 'Finance audit records are retained in cleanup reporting.',
      });
      evidence.recordStage('phase-11-reporting-completed', 'passed', 'Reporting manifest smoke completed.');

      const summaryPath = await evidence.writeSummary();
      const manifestPath = summaryPath.replace(/student-journey-summary\.json$/, 'student-journey-manifest.md');
      const summary = JSON.parse(await readFile(summaryPath, 'utf8')) as {
        verdict?: string;
        records?: Record<string, unknown>;
        cleanup?: { status?: string; actions?: unknown[] };
        artifacts?: string[];
      };
      const manifest = await readFile(manifestPath, 'utf8');

      expect(summary.verdict).toBe('passed');
      expect(summary.records?.studentUserId).toBe('phase11-student-smoke');
      expect(summary.cleanup?.actions?.length).toBeGreaterThanOrEqual(2);
      expect(summary.artifacts?.some((artifact) => artifact.endsWith('student-journey-summary.json'))).toBe(true);
      expect(manifest).toContain('# EduPlatform Student Journey Manifest');
      expect(manifest).toContain('Verdict: passed');
      expect(manifest).toContain('student-account phase11-student-smoke');
      expect(manifest).toContain('paid-invoice INV-PHASE11-SMOKE');
    });
  });

  test.describe('negative controls', () => {
    test('blocks incomplete E2E configuration before live actions can run', async () => {
      await withEduPlatformEnv({}, () => {
        expect(() => assertEduPlatformEnv(getEduPlatformEnv({ allowPartial: true }))).toThrow(/configuration is incomplete/i);
      });
    });

    test('blocks production-like URLs unless the explicit production override is set', async () => {
      await withEduPlatformEnv({
        EDUPLATFORM_BASE_URL: 'https://eduplatform.com',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'Huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'dummy',
        EDUPLATFORM_STUDENT_PASSWORD: 'dummy',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ALLOW_PRODUCTION_E2E: 'false',
      }, () => {
        expect(() => assertEduPlatformEnv(getEduPlatformEnv({ allowPartial: true }))).toThrow(/Refusing to run EduPlatform E2E tests against production-like URL/i);
      });
    });

    test('keeps live action flags disabled unless they are explicitly truthy', async () => {
      await withEduPlatformEnv({
        EDUPLATFORM_BASE_URL: 'http://127.0.0.1',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'Huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'dummy',
        EDUPLATFORM_STUDENT_PASSWORD: 'dummy',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT: 'false',
        EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE: '',
        EDUPLATFORM_ENABLE_COURSE_ENROLLMENT: '0',
        EDUPLATFORM_ENABLE_INVOICE_CREATE: 'no',
        EDUPLATFORM_ENABLE_CLASS_COMPLETION: 'off',
        EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE: 'false',
        EDUPLATFORM_ENABLE_PAYMENT_RECEIPT: '',
        EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY: 'false',
      }, () => {
        const env = getEduPlatformEnv({ allowPartial: true });

        expect(env.enablePublicIntakeSubmit).toBe(false);
        expect(env.enableAdmissionsStudentCreate).toBe(false);
        expect(env.enableCourseEnrollment).toBe(false);
        expect(env.enableInvoiceCreate).toBe(false);
        expect(env.enableClassCompletion).toBe(false);
        expect(env.enableTranscriptIssue).toBe(false);
        expect(env.enablePaymentReceipt).toBe(false);
        expect(env.enableFullStudentJourney).toBe(false);
      });
    });

    test('reports destructive cleanup as blocked for paid invoices and issued transcripts', async ({}, testInfo) => {
      await withEduPlatformEnv({
        EDUPLATFORM_BASE_URL: 'http://127.0.0.1',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'Huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'dummy',
        EDUPLATFORM_STUDENT_PASSWORD: 'dummy',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_CLEANUP_MODE: 'delete',
      }, async () => {
        const env = getEduPlatformEnv({ allowPartial: true });
        const evidence = new JourneyEvidence(testInfo, 'sqa-journey-phase12-negative-controls', redactedEduPlatformEnv(env));

        evidence.recordStage('phase-12-cleanup-control-started', 'passed', 'Cleanup control verifies audit retention guardrails.');
        evidence.recordCleanupAction({
          target: 'paid-invoice',
          identifier: 'INV-PHASE12-CONTROL',
          mode: env.cleanupMode,
          status: 'blocked',
          note: 'Paid invoices must not be deleted by automated cleanup.',
        });
        evidence.recordCleanupAction({
          target: 'official-transcript',
          identifier: 'TR-PHASE12-CONTROL',
          mode: env.cleanupMode,
          status: 'blocked',
          note: 'Issued transcripts must not be deleted by automated cleanup.',
        });
        evidence.recordStage('phase-12-cleanup-control-completed', 'passed', 'Cleanup control completed.');

        const summaryPath = await evidence.writeSummary();
        const manifestPath = summaryPath.replace(/student-journey-summary\.json$/, 'student-journey-manifest.md');
        const summary = JSON.parse(await readFile(summaryPath, 'utf8')) as {
          cleanup?: { mode?: string; status?: string; actions?: Array<{ status?: string }> };
        };
        const manifest = await readFile(manifestPath, 'utf8');

        expect(summary.cleanup?.mode).toBe('delete');
        expect(summary.cleanup?.status).toBe('blocked');
        expect(summary.cleanup?.actions?.every((action) => action.status === 'blocked')).toBe(true);
        expect(manifest).toContain('BLOCKED paid-invoice INV-PHASE12-CONTROL [delete]');
        expect(manifest).toContain('BLOCKED official-transcript TR-PHASE12-CONTROL [delete]');
      });
    });
  });
});
