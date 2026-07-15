# EduPlatform Student Journey Automation Implementation Steps

Purpose: define the build sequence for the first automated SQA tool that tests the complete EduPlatform student journey from public intake through enrollment, invoicing, class completion, transcript issue, and payment.

Primary requirements: `docs/eduplatform-student-journey-automation-requirements.md`.

## Guiding Principles

- Start with one reliable end-to-end journey before expanding into many suites.
- Use UI automation for user-visible promises and API/helpers for repeatable setup, admin transitions, and verification.
- Prefer non-production environments with seeded, known-good workspace/course data.
- Capture evidence at every stage so failures are diagnosable by admissions, academic, finance, or transcript owners.
- Keep generated financial and academic audit history intact; cleanup should archive or label records instead of deleting paid/issued artifacts.
- Treat missing stable APIs as implementation gaps and record them explicitly.

## Phase 0: Discovery And Environment Readiness

Goal: confirm the target environment, routes, users, and data needed for the first journey.

Status: complete for repository discovery. See `docs/eduplatform-student-journey-automation-phase-0-discovery.md`. Environment-specific credentials, workspace/consumer IDs, one seeded SQA course offering, and the chosen class-completion mode still need to be supplied before executable Playwright work begins.

Tasks:

- Confirm the canonical base URL for local, integration, and staging EduPlatform.
- Confirm public intake URL format for a workspace, expected route likely `local/hubredirect/public_intake.php`.
- Confirm the workspace and consumer values to use for the first test run.
- Identify one stable published course offering suitable for automated tests.
- Confirm the admin/admissions/finance roles and credentials available in non-production.
- Confirm whether applicant-to-student conversion is UI-only or has a reusable backend helper.
- Confirm the class-completion mechanism for SQA:
  - Moodle completion,
  - local unit progress,
  - teacher/admin completion,
  - or direct non-production fixture helper.
- Confirm first payment mode:
  - manual admin-recorded payment,
  - or hosted payment sandbox.
- Confirm transcript official issue is enabled in the target workspace.

Deliverables:

- Environment decision record.
- Test user and role matrix.
- First test offering ID/course key.
- Known blockers list.

Exit criteria:

- The team can fill every required `EDUPLATFORM_*` environment variable.
- The target environment is confirmed as non-production or explicitly allowed.
- There is one known course offering that public intake and enrollment can use.

## Phase 1: Test Harness Foundation

Goal: add a Playwright-based test harness that can run one empty/smoke test safely.

Status: implemented. The root harness now includes Playwright configuration, npm scripts, environment validation, production guard, generated-artifact ignores, `.env.e2e.example`, and a smoke test that validates configuration without touching live EduPlatform data.

Tasks:

- Add Playwright dependencies and config.
- Add npm scripts:
  - `test:e2e`
  - `test:e2e:student-journey`
  - `test:e2e:headed`
  - `test:e2e:report`
- Add `playwright.config.ts` with:
  - base URL from `EDUPLATFORM_BASE_URL`,
  - HTML and JSON reporting,
  - screenshots on failure,
  - trace on first retry,
  - video on failure,
  - conservative timeout defaults.
- Add environment validation that fails fast with a readable missing-variable list.
- Add production guard that blocks execution unless `EDUPLATFORM_ALLOW_PRODUCTION_E2E=true`.
- Add artifact output folders under a generated test-output path.

Deliverables:

- `playwright.config.ts`
- `tests/e2e/student-journey.spec.ts`
- `tests/e2e/helpers/env.ts`
- package scripts.

Exit criteria:

- `npm run test:e2e:student-journey` runs a smoke test and produces a report.
- Missing environment variables fail before browser launch.
- Production-like URLs are blocked by default.

Verification:

- Run with missing env and confirm fast failure.
- Run against a harmless local/staging URL and confirm report generation.

## Phase 2: Shared Helpers And Evidence Model

Goal: create reusable helpers before automating the full journey.

Status: implemented. The harness now includes run/test-data generation, shared route builders, login scaffolding, a Moodle web-service client with redaction, and an evidence writer that attaches redacted JSON plus a run summary artifact.

Tasks:

- Add run ID generator:
  - format `sqa-journey-YYYYMMDD-HHMMSS-random`.
- Add generated student/guardian data builder.
- Add login helper for Moodle/EduPlatform users.
- Add Moodle web-service helper for `server.php` calls, token handling, and response redaction.
- Add route helper for common pages:
  - public intake,
  - admissions/intake requests,
  - course catalog,
  - course offerings,
  - invoice detail/view,
  - student/parent billing,
  - course transcript.
- Add evidence helper that records:
  - screenshots,
  - current URL,
  - record IDs,
  - stage status,
  - redacted API request/response metadata.
- Add final JSON summary writer.

Deliverables:

- `tests/e2e/helpers/student-data.ts`
- `tests/e2e/helpers/auth.ts`
- `tests/e2e/helpers/moodle-ws.ts`
- `tests/e2e/helpers/routes.ts`
- `tests/e2e/helpers/evidence.ts`

Exit criteria:

- Helpers can generate one unique test identity and write one JSON summary.
- API helper redacts tokens, passwords, and payment references in logs.

Verification:

- Unit-style helper smoke inside Playwright test.
- Manually inspect JSON artifact for redaction.

## Phase 3: Public Intake Automation

Goal: automate the first real user-facing step: submitting a public intake request.

Status: implemented as a gated live-action test. `PublicIntakePage` can load the workspace public intake route, verify course availability, submit a valid generated intake request, capture evidence, and leave default smoke runs safe unless `EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT=true` is set.

Tasks:

- Navigate to the workspace public intake page.
- Assert the page resolves under the expected consumer/workspace context.
- Confirm the test course offering appears when it should.
- Confirm an unrelated/closed/full offering does not appear when suitable fixture data exists.
- Submit generated student and guardian details.
- Capture confirmation screenshot and final URL.
- Extract or discover intake request ID:
  - from confirmation page if shown,
  - from admin UI search,
  - from API/helper,
  - or from non-production SQL diagnostic.
- Add validation negative check for missing required guardian/contact fields.

Deliverables:

- `tests/e2e/helpers/intake.ts`
- Public intake stage in `student-journey.spec.ts`.

Exit criteria:

- The script creates one uniquely identifiable intake request.
- The run summary records intake request ID or records a blocked-ID-discovery gap.

Verification:

- Run public intake stage twice; both runs create unique records without collision.

## Phase 4: Admissions Approval And Student Creation

Goal: convert the intake request into a real student account/profile.

Status: implemented as a gated live-action transfer test. The Phase 4 test creates a fresh public intake request, logs in as the configured admin, finds the run-specific public intake request, loads it into the `student_intake.php` flow, submits the prefilled student intake form, and records created student/parent account evidence. It remains disabled unless `EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE=true` is set.

Tasks:

- Log in as workspace admin/admissions user.
- Open intake/admissions review page.
- Search for the run-specific intake record.
- Approve or convert the applicant into a student.
- Capture created Moodle user/student ID.
- Verify the student profile contains:
  - name,
  - email/contact,
  - guardian relationship,
  - course type/offering context,
  - workspace,
  - consumer.
- Establish a student login path:
  - known password from test config,
  - activation/reset helper,
  - or admin-set password in non-production.

Deliverables:

- `tests/e2e/helpers/admissions.ts`
- Admissions approval stage.

Exit criteria:

- The run summary records student user ID.
- Student can log in or can be acted on through a verified parent/admin path.

Verification:

- Attempt to find the student from another workspace context and confirm access is denied or not visible.

## Phase 5: Course Enrollment Automation

Goal: request and approve enrollment into the selected course offering.

Status: implemented as a gated live-action enrollment test. The Phase 5 test creates a fresh applicant/student, logs in as the generated student, requests enrollment from the public course catalog, switches back to the configured admin, approves the pending request from course offerings, and records request/approval evidence. It remains disabled unless `EDUPLATFORM_ENABLE_COURSE_ENROLLMENT=true` is set.

Tasks:

- Log in as student or linked parent.
- Open `local/hubredirect/course_catalog_browse.php`.
- Confirm the selected course offering is visible.
- Submit enrollment request.
- Capture enrollment request ID.
- Attempt duplicate request and verify blocked/flagged behavior.
- Log in as workspace admin.
- Open `local/hubredirect/course_offerings.php` or enrollment approval page.
- Approve the enrollment request.
- Verify status becomes approved/enrolled.
- Verify Moodle enrollment when manual enrollment is configured.
- Verify student dashboard shows course access.

Deliverables:

- `tests/e2e/helpers/course-enrollment.ts`
- Course enrollment stage in `tests/e2e/student-journey.spec.ts`.
- `test:e2e:phase5` npm script.

Exit criteria:

- Run summary records offering ID, enrollment request ID, and Moodle course ID.
- Seat count changes only after approval/enrollment.

Verification:

- Negative check: parent/student cannot request enrollment for unrelated student.

## Phase 6: Invoice Creation And Billing Visibility

Goal: validate finance linkage from enrollment request to invoice.

Status: implemented as a gated live-action invoice test. The Phase 6 test creates a fresh applicant/student, completes enrollment approval, creates a draft tuition invoice from the admin invoice UI, adds an invoice line, issues the invoice, and verifies the issued invoice appears on the admin-accessible student billing page. It remains disabled unless `EDUPLATFORM_ENABLE_INVOICE_CREATE=true` is set.

Tasks:

- Use the supported admin UI or helper to create an invoice from the enrollment request.
- Issue/send invoice if required before payment.
- Capture invoice ID and invoice number.
- Verify invoice references:
  - student,
  - billing account,
  - offering ID,
  - enrollment request ID,
  - Moodle course ID,
  - workspace,
  - consumer,
  - currency.
- Open student or parent billing dashboard.
- Confirm only the run student's invoice is visible.
- Attempt direct access to a known unrelated invoice ID when safe fixture data exists.

Deliverables:

- `tests/e2e/helpers/finance.ts`
- Invoice creation and billing visibility stage in `tests/e2e/student-journey.spec.ts`.
- `test:e2e:phase6` npm script.

Exit criteria:

- Run summary records invoice ID, invoice number, status, amount, and currency.
- Invoice totals match stored line totals.

Verification:

- Non-finance user cannot create or modify the invoice.

## Phase 7: Class Completion Fixture

Goal: put the enrolled course into a transcript-eligible completed state.

Status: implemented as a gated live-action grade/completion fixture. The Phase 7 test creates a fresh applicant/student, completes enrollment approval and invoice issue, opens the gradebook assessment UI, creates a published completion assessment, enters a published score, and publishes the calculated course grade for transcript use. It remains disabled unless `EDUPLATFORM_ENABLE_CLASS_COMPLETION=true` is set. If a target workspace transcript policy requires explicit Moodle/local completion evidence beyond a published course grade, add that completion write path as the next hardening step.

Tasks:

- Implement the agreed SQA completion mechanism.
- If using UI:
  - open the course,
  - complete required student activity,
  - verify progress/completion.
- If using API/helper:
  - mark completion with test-only reason and run ID,
  - set grade/outcome according to transcript policy.
- If using SQL fixture:
  - restrict to non-production,
  - label all fixture writes with run ID,
  - verify through the application after write.
- Capture completion evidence and final course status.

Deliverables:

- `tests/e2e/helpers/completion.ts`
- Completion stage in `tests/e2e/student-journey.spec.ts`.
- `test:e2e:phase7` npm script.

Exit criteria:

- Transcript preview can resolve the course as completed/passed or a configured equivalent.
- Completion evidence is visible through an application page or service.

Verification:

- Official transcript preview shows no blocker for missing completion evidence unless the policy intentionally requires more data.

## Phase 8: Transcript Preview, Issue, Download, And Verify

Goal: validate unofficial and official transcript behavior for the run student.

Status: implemented as a gated live-action transcript issue test. The Phase 8 test creates a fresh student journey through class-completion grade publishing, saves the workspace transcript policy, resolves the unofficial transcript preview through the admin UI, issues an official transcript snapshot through the admin UI, opens the authenticated document export URL, downloads the official PDF, and verifies the issued document with the signed verification URL. It remains disabled unless `EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE=true` is set.

Tasks:

- Call `local_prequran_transcript_preview` for the run student.
- Verify transcript line values:
  - course title,
  - workspace,
  - status,
  - dates,
  - grade/outcome display,
  - warnings.
- If finance/transcript holds are enabled, verify hold-block behavior and resolution path.
- Issue official transcript with `local_prequran_transcript_issue_official`.
- Capture document ID.
- Fetch document URL with `local_prequran_transcript_document`.
- Verify document with `local_prequran_transcript_verify`.
- Capture screenshot or response evidence.
- Attempt cross-student transcript access when safe fixture data exists.

Deliverables:

- `tests/e2e/helpers/transcript.ts`
- Transcript stage.
- `test:e2e:phase8` npm script.

Exit criteria:

- Run summary records official transcript document ID and verification result.
- Official transcript verification returns valid.

Verification:

- Student cannot access another student's transcript or document.

## Phase 9: Payment And Receipt Verification

Goal: pay the invoice through a test-safe path and verify finance state.

Status: implemented as a gated live-action manual payment test. The Phase 9 test creates a fresh applicant/student, completes enrollment approval, creates and issues a tuition invoice, records a manual payment for the invoice balance, verifies the receipt page, reopens invoice detail to confirm paid status and zero balance, and verifies the paid invoice on the student billing dashboard. It remains disabled unless `EDUPLATFORM_ENABLE_PAYMENT_RECEIPT=true` is set.

Tasks:

- For manual payment:
  - call `local_prequran_finance_invoice_action` with `action=record_payment`,
  - use amount equal to invoice balance,
  - use method/reference containing run ID,
  - pass idempotency key derived from run ID.
- For hosted sandbox payment:
  - create hosted session,
  - complete provider sandbox payment,
  - process callback/webhook,
  - verify idempotency.
- Capture payment ID and receipt number/link.
- Verify invoice status becomes paid.
- Verify balance due is zero for full-payment scenario.
- Re-submit duplicate idempotency key and confirm no second allocation.
- Verify student/parent billing view reflects paid status.

Deliverables:

- Payment subhelper in `tests/e2e/helpers/finance.ts`.
- Payment stage.
- `test:e2e:phase9` npm script.

Exit criteria:

- Run summary records payment ID, receipt number if available, and paid invoice status.
- Duplicate payment idempotency check passes.

Verification:

- Non-finance user cannot record payment.

## Phase 10: Final Journey Assertions And Cleanup

Goal: produce one clear end-state verdict and safe cleanup/archiving.

Tasks:

- Assert final state:
  - intake approved/converted,
  - student exists,
  - enrollment approved/enrolled,
  - course access exists,
  - invoice exists,
  - payment allocated,
  - invoice paid,
  - class completed,
  - transcript preview includes course,
  - official transcript issued and verified.
- Classify any failure stage.
- Write final JSON summary.
- Archive or label generated test records.
- Cancel pending enrollment if the run failed before approval.
- Void unpaid draft invoices when safe.
- Do not delete paid invoices, payments, receipts, issued transcripts, or audit records.

Deliverables:

- Final assertion block in `student-journey.spec.ts`.
- Cleanup helper.
- Final JSON artifact.

Exit criteria:

- A failed run still leaves enough evidence to diagnose the stage and records involved.
- Cleanup behavior is safe for finance and transcript audit rules.

Verification:

- Force a mid-journey failure in non-production and confirm summary/cleanup behavior.

## Phase 11: CI And Scheduled SQA Operation

Goal: make the script usable by the SQA process, not only by a developer locally.

Tasks:

- Add documented command examples for local, integration, and staging runs.
- Add CI workflow or operator runbook for scheduled execution.
- Store reports as artifacts.
- Add notification or summary output for pass/fail and failed stage.
- Add retry policy for transient navigation/network failures.
- Add a production-safe smoke variant that is read-only and does not create records.

Deliverables:

- CI/runbook instructions.
- Artifact retention settings.
- Optional smoke-only test tag.

Exit criteria:

- SQA can run the journey on demand without editing code.
- Reports are retained and easy to compare across runs.

Verification:

- Run from a clean terminal session with only documented environment variables.

## Phase 12: Expansion Backlog

Goal: split stable helper coverage into focused regression suites.

Tasks:

- Add admissions-only tests.
- Add course offering and capacity tests.
- Add enrollment approval and Moodle sync tests.
- Add invoice/payment/receipt tests.
- Add finance hold and transcript release tests.
- Add transcript revoke/reissue/verification tests.
- Add parent/guardian access tests.
- Add cross-workspace security tests.
- Add hosted payment webhook idempotency tests.

Deliverables:

- Focused `tests/e2e/*.spec.ts` files by domain.
- Shared helper documentation.

Exit criteria:

- The original student journey remains a high-level smoke/regression path.
- Domain suites cover deeper edge cases without making the journey script brittle.

## Dependency And Gap Register

The first implementation should explicitly track these gaps if encountered:

- Stable public intake request ID not exposed after submission.
- No API/helper for applicant-to-student conversion.
- No stable test-only class completion helper.
- Invoice-from-enrollment only available through UI.
- Manual payment API unavailable to the selected test role.
- Transcript issue blocked by missing policy/branding/hold setup.
- No seeded cross-workspace fixture for negative access tests.
- Hosted payment sandbox not configured.
- Generated records cannot be safely archived or tagged.

Each gap should include:

- affected phase,
- current workaround,
- recommended product/API improvement,
- owner,
- priority,
- target environment.

## First Milestone Definition

Milestone 1 is complete when the script can run this happy path in a non-production environment:

1. Submit public intake.
2. Approve applicant into student.
3. Request course enrollment.
4. Approve enrollment.
5. Create and issue invoice.
6. Mark class complete through agreed test-safe path.
7. Preview and issue official transcript.
8. Record full manual payment.
9. Verify invoice paid, transcript valid, and final student state correct.
10. Produce report and JSON summary with all record IDs.

Negative checks may be marked as blocked in Milestone 1 only when the needed fixture or API does not yet exist; they must remain in the backlog with a clear owner.
