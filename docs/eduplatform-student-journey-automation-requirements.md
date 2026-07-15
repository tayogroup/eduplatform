# EduPlatform Student Journey Automation Requirements

Purpose: define the requirements for automated SQA tooling that verifies the full EduPlatform learner lifecycle from public intake through student creation, course enrollment, invoicing, class completion, transcript issue, and payment.

This document is written for the renamed EduPlatform workspace. The current Moodle plugin paths still use `local_prequran` names internally, so the automation requirements refer to the existing Moodle service names where they are already present.

## Goals

- Provide one repeatable automated student-journey script that can be run against a controlled local, integration, or staging EduPlatform environment.
- Validate the real cross-module workflow, not only isolated screens: public intake, workspace routing, student profile creation, course offering enrollment, Moodle enrollment, invoice creation, payment recording, transcript preview/issue, and finance hold behavior.
- Capture enough evidence for SQA sign-off: created record IDs, final statuses, screenshots, traces, API responses, and failure diagnostics.
- Keep test data unique, labeled, and safe to clean up or archive.
- Establish a reusable testing foundation for future admissions, enrollment, finance, transcript, communications, and dashboard regression tests.

## First Automation Tool

The first tool should be an end-to-end student journey test named:

`student-journey.spec.ts`

Recommended command:

`npm run test:e2e:student-journey`

Recommended tags:

`@e2e @student-journey @public-intake @enrollment @finance @transcript`

Recommended technology:

- Playwright for browser journey automation.
- Moodle web-service/API helpers for reliable setup, admin actions, and state verification.
- SQL verification helpers only for non-production environments.
- HTML, JSON, screenshot, video, and Playwright trace reports.

## System Under Test

The script must exercise the EduPlatform workflow across these existing or planned surfaces:

- Public institution intake form.
- Workspace admin intake/admissions review.
- Course catalog at `local/hubredirect/course_catalog_browse.php`.
- Course offerings admin page at `local/hubredirect/course_offerings.php`.
- Student dashboard and course access.
- Finance invoice and payment workflows.
- Transcript preview and official transcript services.

Relevant existing web-service functions include:

- `local_prequran_transcript_preview`
- `local_prequran_transcript_issue_official`
- `local_prequran_transcript_document`
- `local_prequran_transcript_verify`
- `local_prequran_transcript_manage`
- `local_prequran_finance_invoice_action`
- `local_prequran_finance_summary`
- `local_prequran_finance_hardening_status`

If public intake, admissions approval, enrollment approval, invoice creation from enrollment, or class completion do not yet expose stable web-service functions, the first automation version may drive those steps through the admin UI and record the gap as an API-hardening requirement.

## Required Configuration

The test runner must read configuration from environment variables and fail fast when required values are missing.

Required:

- `EDUPLATFORM_BASE_URL`
- `EDUPLATFORM_WORKSPACE_ID`
- `EDUPLATFORM_CONSUMER`
- `EDUPLATFORM_ADMIN_USERNAME`
- `EDUPLATFORM_ADMIN_PASSWORD`
- `EDUPLATFORM_STUDENT_PASSWORD`
- `EDUPLATFORM_TEST_COURSE_KEY` or `EDUPLATFORM_TEST_OFFERING_ID`

Recommended:

- `EDUPLATFORM_PARENT_USERNAME`
- `EDUPLATFORM_PARENT_PASSWORD`
- `EDUPLATFORM_FINANCE_USERNAME`
- `EDUPLATFORM_FINANCE_PASSWORD`
- `EDUPLATFORM_WS_TOKEN`
- `EDUPLATFORM_DB_DSN`
- `EDUPLATFORM_PAYMENT_MODE=manual|hosted-sandbox`
- `EDUPLATFORM_CLEANUP_MODE=archive|delete|none`
- `EDUPLATFORM_TRACE=on-first-retry|on`

The script must refuse to run against production unless `EDUPLATFORM_ALLOW_PRODUCTION_E2E=true` is explicitly set.

## Test Data Requirements

Each run must create a unique applicant/student identity using a deterministic run ID:

`sqa-journey-YYYYMMDD-HHMMSS-random`

Required generated data:

- Student first name, last name, email, phone, date of birth or age band when required.
- Parent/guardian name, email, phone, relationship, and consent fields.
- Public intake course/offering selection.
- Student password or activation flow data.
- Billing account and payer details.
- Invoice payment reference.
- Transcript issue reason.

The script must persist a run artifact containing:

- Run ID.
- Environment and base URL.
- Workspace ID and consumer key.
- Intake request ID.
- Moodle user ID/student ID.
- Course offering ID.
- Enrollment request ID.
- Moodle course ID.
- Invoice ID and invoice number.
- Payment ID and receipt number.
- Transcript document ID and verification result.
- Cleanup status.

## Primary Journey Requirements

### 1. Public Intake

The script must:

- Open the workspace-scoped public intake form.
- Confirm only published institution-portal course offerings are available.
- Submit a valid public intake request with unique applicant and guardian details.
- Assert that the confirmation state is shown.
- Verify the intake request exists in the correct consumer/workspace.
- Verify required fields reject missing or invalid input.

Expected outcome:

- Intake request status is `submitted`, `pending_review`, or the current EduPlatform equivalent.
- Intake record is linked to the selected course/offering context.
- No cross-workspace course options are displayed.

### 2. Applicant Approval And Student Creation

The script must:

- Log in as an authorized workspace admin or admissions user.
- Open the intake/admissions review queue.
- Locate the run-specific intake request.
- Approve or convert the applicant into a student.
- Verify a Moodle user/student profile is created or linked.
- Verify student profile fields preserve intake data, course type, special-needs flag when present, workspace, and guardian relationship.

Expected outcome:

- Student has a stable Moodle user ID or platform student ID.
- Student belongs only to the expected workspace/consumer scope.
- Student can authenticate or be accessed by the linked parent/guardian according to policy.

### 3. Course Enrollment

The script must:

- Browse the Course Catalog as the student or linked parent.
- Select the intended published course offering.
- Submit an enrollment request for the new student.
- Assert duplicate active requests for the same student/offering are blocked or clearly reported.
- Log in as workspace admin.
- Approve the enrollment request.
- Verify the request transitions to approved or enrolled.
- Verify the student's course access is updated.
- Verify Moodle manual enrollment succeeds when the course has a valid manual enrollment instance.

Expected outcome:

- Enrollment request references the correct student, workspace, offering, and Moodle course.
- Seat count decreases only after approval/enrollment.
- Student dashboard shows the course.
- Enrollment state is reflected in transcript preview as active, approved pending sync, enrolled, or in progress.

### 4. Invoice Generation

The script must:

- Create an invoice from the enrollment request through the supported UI or service.
- Verify invoice source references: student, billing account, offering ID, enrollment request ID, Moodle course ID, workspace, consumer, and currency.
- Issue/send the invoice if the workflow requires it before payment.
- Verify invoice totals are reproducible from stored lines.
- Confirm student/parent billing view shows only the new student's invoice.

Expected outcome:

- Invoice status is `draft`, `sent`, or equivalent before payment.
- Invoice has a stable invoice number after issue.
- Direct access to another workspace/student invoice is denied.

### 5. Class Completion

The script must:

- Complete the class through the lowest-risk supported mechanism for the environment.
- Prefer a test-only API/helper for marking completion, grades, attendance, or local unit progress.
- Use UI steps only when required to prove the student-facing class flow.
- Verify the course line transitions to completed, passed, or the configured equivalent.

Expected outcome:

- Student has completed academic evidence sufficient for transcript preview.
- Completion source is visible in transcript warnings or course history.
- No private teacher/admin notes leak into student-facing views.

### 6. Transcript Preview And Official Issue

The script must:

- Call or drive `local_prequran_transcript_preview` for the new student.
- Verify the enrolled/completed course appears with correct title, dates, status, workspace, and grade/outcome policy.
- Attempt official issue while any configured transcript hold is active, if the test environment enables holds.
- Resolve the hold or ensure no blocking hold exists.
- Issue an official transcript using `local_prequran_transcript_issue_official`.
- Fetch the document URL using `local_prequran_transcript_document`.
- Verify the document ID through `local_prequran_transcript_verify`.

Expected outcome:

- Official transcript creates a locked document ID.
- Verification reports valid.
- Transcript uses the correct consumer/institution branding and domain.
- Direct URL guessing cannot expose another student's transcript.

### 7. Course Fee Payment

The script must:

- Pay the course fee through the configured test-safe payment mode.
- For `manual` mode, use `local_prequran_finance_invoice_action` with `action=record_payment`.
- For `hosted-sandbox` mode, create a hosted payment session, complete provider sandbox payment, and process webhook or callback.
- Use an idempotency key derived from the run ID.
- Verify duplicate payment attempts or duplicate webhook submissions do not double-credit the invoice.

Expected outcome:

- Payment record is created with correct amount, currency, method, reference, workspace, and consumer.
- Invoice status becomes `paid` or `partially_paid` according to amount.
- Receipt is generated or visible.
- Finance audit records the payment action.

### 8. Final State Verification

The script must verify the final journey state in one summarized assertion block:

- Intake request is approved/converted.
- Student exists and belongs to the expected workspace.
- Enrollment request is approved/enrolled.
- Student has course access.
- Invoice exists and references the enrollment.
- Payment exists and is allocated to the invoice.
- Invoice balance is zero for full-payment scenarios.
- Course is completed.
- Transcript preview includes the course.
- Official transcript document is issued and verifiable.
- Student/parent sees only their own billing and transcript records.
- Admin exception reports do not show duplicate active invoices, orphaned payments, paid-but-not-enrolled, or enrolled-but-unpaid for the run student.

## Negative And Security Tests

The first journey script must include targeted negative checks, even if they are brief:

- Public intake cannot submit without required guardian/contact fields.
- Student/parent cannot request enrollment for an unrelated student.
- Duplicate enrollment request for the same active student/offering is blocked or flagged.
- Non-finance user cannot record payment.
- Student cannot view another student's invoice.
- Student cannot view another student's transcript.
- Cross-workspace invoice, transcript, and enrollment IDs are rejected.
- Duplicate payment idempotency key does not create a second payment allocation.

## Evidence And Reporting Requirements

Every run must produce:

- Playwright HTML report.
- JSON run summary.
- Screenshot for each major milestone.
- Trace/video on failure and first retry.
- API request/response summaries with secrets redacted.
- Final record-ID table.
- Failure classification: environment, auth, public intake, admissions, enrollment, finance, transcript, security, or cleanup.

The report must never print raw passwords, payment secrets, web-service tokens, or full payment processor secrets.

## Cleanup Requirements

The default cleanup mode should be `archive` rather than destructive delete.

Cleanup must:

- Mark or tag test records with the run ID.
- Cancel pending enrollment requests if the test fails before approval.
- Void unpaid draft invoices when safe.
- Avoid deleting paid invoices, payments, receipts, issued transcripts, or audit records.
- Produce cleanup status in the JSON summary.

For local-only environments, a stronger cleanup mode may delete generated users and records when the database supports safe fixture rollback.

## Architecture Requirements

The automation code should be organized as:

- `tests/e2e/student-journey.spec.ts`
- `tests/e2e/helpers/auth.ts`
- `tests/e2e/helpers/moodle-ws.ts`
- `tests/e2e/helpers/student-data.ts`
- `tests/e2e/helpers/intake.ts`
- `tests/e2e/helpers/enrollment.ts`
- `tests/e2e/helpers/finance.ts`
- `tests/e2e/helpers/transcript.ts`
- `tests/e2e/helpers/evidence.ts`
- `playwright.config.ts`

The helpers must provide clear boundaries:

- UI actions for user-visible flows.
- API actions for controlled setup, admin transitions, and verification.
- Database checks only for non-production diagnostics.
- Evidence collection independent from test assertions.

## Acceptance Criteria For First Delivery

The first automation delivery is accepted when:

1. `npm run test:e2e:student-journey` runs the full journey against a configured non-production EduPlatform environment.
2. The script creates unique test data and records all important IDs.
3. Public intake, student creation, enrollment, invoice, payment, class completion, and transcript assertions all execute.
4. The test can run repeatedly without duplicate-data failures.
5. The test produces an HTML report and JSON summary.
6. Secrets are redacted from logs.
7. The script refuses accidental production execution unless explicitly allowed.
8. Failures identify the broken journey stage.
9. The run leaves financial and academic audit records intact.
10. The documented negative tests are included or explicitly marked as blocked by missing product capability.

## Follow-On Automation Backlog

After the first script is stable, add:

- Admissions-only regression suite.
- Course offering and seat-capacity suite.
- Finance invoice/payment/receipt suite.
- Transcript hold, revoke, reissue, and verification suite.
- Cross-workspace security suite.
- Parent/guardian access suite.
- API idempotency and webhook suite.
- Production-safe read-only smoke suite.

## Open Implementation Questions

- What is the canonical public intake URL for each workspace?
- Which admin role should the automation use for intake approval?
- Is applicant-to-student conversion fully UI-driven today, or is there a service/helper available?
- What is the preferred class-completion mechanism for SQA: Moodle completion, local unit progress, teacher/admin completion, or direct test fixture?
- Should the first payment path be manual payment recording or hosted payment sandbox?
- Which environments have stable seeded course offerings suitable for journey tests?
- Should issued transcript documents remain as permanent SQA audit artifacts or be revoked at cleanup time?
