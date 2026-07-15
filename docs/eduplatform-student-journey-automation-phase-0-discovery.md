# EduPlatform Student Journey Automation Phase 0 Discovery

Purpose: record the environment readiness decisions, discovered product surfaces, test-user needs, and implementation gaps for the first automated SQA student journey.

Primary plan: `docs/eduplatform-student-journey-automation-implementation-steps.md`.

Status: complete for repository discovery. Environment-specific credentials and seeded test IDs still need to be supplied before Phase 1 can run executable Playwright tests.

## Phase 0 Outcome

The repository contains the core surfaces needed for the first student-journey automation:

- Public intake exists.
- Intake review exists.
- Admissions conversion helpers exist.
- Course catalog and course offering enrollment approval exist.
- Invoice creation from enrollment request exists.
- Invoice issue, send, payment, and receipt workflows exist.
- Student and parent billing pages exist.
- Transcript preview, official issue, document, and verification services exist.
- QA-oriented unit step completion helpers exist, but the exact SQA class-completion strategy still needs environment agreement.

The first automation should therefore proceed as a mixed UI/API journey:

- Use browser UI for public intake, student/parent catalog request, admin review pages, and billing/transcript visibility checks.
- Use Moodle web services where already stable for transcript and finance actions.
- Use UI fallback for admissions conversion, enrollment approval, and invoice-from-enrollment until stable dedicated SQA APIs are added.
- Use a non-production completion helper or explicit Moodle/local progress fixture for class completion.

## Environment Decision Record

Required variables for Phase 1 remain:

- `EDUPLATFORM_BASE_URL`
- `EDUPLATFORM_WORKSPACE_ID`
- `EDUPLATFORM_CONSUMER`
- `EDUPLATFORM_ADMIN_USERNAME`
- `EDUPLATFORM_ADMIN_PASSWORD`
- `EDUPLATFORM_STUDENT_PASSWORD`
- `EDUPLATFORM_TEST_OFFERING_ID` or `EDUPLATFORM_TEST_COURSE_KEY`

Recommended variables:

- `EDUPLATFORM_FINANCE_USERNAME`
- `EDUPLATFORM_FINANCE_PASSWORD`
- `EDUPLATFORM_WS_TOKEN`
- `EDUPLATFORM_PAYMENT_MODE=manual`
- `EDUPLATFORM_CLEANUP_MODE=archive`
- `EDUPLATFORM_COMPLETION_MODE=skip-step|unit-state|moodle-completion|sql-fixture`

Recommended first-run environment:

- Use integration or staging, not production.
- Use manual payment mode first.
- Use archive cleanup first.
- Use a single published institution-public course offering with enabled Moodle manual enrollment.
- Use one workspace with transcript policy and finance policy already configured.

Production guard:

- Executable tests must refuse production-like URLs unless `EDUPLATFORM_ALLOW_PRODUCTION_E2E=true` is explicitly set.

## Discovered Routes

Public and prospective-student surfaces:

- `local/hubredirect/public_intake.php`
- `local/hubredirect/consumer_landing.php`

Admissions and intake review:

- `local/hubredirect/intake_requests.php`
- `local/hubredirect/admissions.php`
- `local/hubredirect/student_intake.php`

Course catalog and enrollment:

- `local/hubredirect/course_catalog_browse.php`
- `local/hubredirect/course_offerings.php`
- `local/hubredirect/enrollment_approval.php`
- `local/hubredirect/course_student_history.php`
- `local/hubredirect/course_sync_report.php`

Finance:

- `local/hubredirect/invoices.php`
- `local/hubredirect/invoice_detail.php`
- `local/hubredirect/invoice_view.php`
- `local/hubredirect/student_billing.php`
- `local/hubredirect/parent_billing.php`
- `local/hubredirect/payment_start.php`
- `local/hubredirect/payment_receipt.php`
- `local/hubredirect/payment_webhook.php`
- `local/hubredirect/finance_audit.php`
- `local/hubredirect/finance_policy.php`
- `local/hubredirect/finance_operations.php`

Transcript:

- `local/hubredirect/course_transcript.php`
- `local/hubredirect/course_transcript_official.php`
- `local/hubredirect/course_transcript_export.php`
- `local/hubredirect/transcript_verify.php`
- `local/hubredirect/transcript_policy.php`
- `local/hubredirect/transcript_readiness.php`
- `local/hubredirect/transcript_controls.php`

Workspace/admin navigation:

- `local/hubredirect/workspace_dashboard.php`
- `local/hubredirect/workspace_student.php`
- `local/hubredirect/workspace_parent.php`
- `local/hubredirect/admin_workflow.php`

## Discovered Services

Registered Moodle services in `src/moodle/local_prequran/db/services.php`:

- `local_prequran_transcript_preview`
- `local_prequran_transcript_issue_official`
- `local_prequran_transcript_document`
- `local_prequran_transcript_verify`
- `local_prequran_transcript_manage`
- `local_prequran_finance_summary`
- `local_prequran_finance_invoice_action`
- `local_prequran_finance_hardening_status`

Useful existing QA/progress services:

- `local_prequran_set_unit_state`
- `local_prequran_skip_step`
- `local_prequran_reset_step`
- `local_prequran_save_quiz_event`

Service use decision:

- Use transcript services directly in Phase 8 automation.
- Use `local_prequran_finance_invoice_action` for manual payment in Phase 9.
- Use `local_prequran_skip_step` or `local_prequran_set_unit_state` only after confirming the course under test maps to local unit progress in the transcript resolver.

## Public Intake Discovery

File: `src/moodle/local_hubredirect/public_intake.php`.

Findings:

- The page uses `pqh_requested_consumer_context()` to resolve consumer/workspace context.
- The public form preserves `consumer` and `workspaceid` in hidden inputs.
- Workspace public course options are loaded from `local_prequran_course_offering`.
- Public course options require:
  - matching `workspaceid`,
  - `status = published`,
  - `visibility = institution_public`.
- Submission stores `consumerid` and `workspaceid` on `local_prequran_intake_request` when columns exist.
- Successful submission redirects to the same route with `submitted=1`.

Automation implication:

- Phase 3 can submit public intake by browser UI.
- Intake request ID is not obviously returned in the public success redirect, so the script should discover it by admin search, API helper, or non-production SQL diagnostic.

## Admissions And Student Creation Discovery

Files:

- `src/moodle/local_hubredirect/intake_requests.php`
- `src/moodle/local_hubredirect/admissions.php`
- `src/moodle/local_hubredirect/admissionslib.php`
- `src/moodle/local_hubredirect/student_intake.php`

Findings:

- `admissionslib.php` defines admissions decisions including `converted`.
- `pqadm_convert_application()` can convert an accepted application to a student.
- Conversion creates or links the student user, workspace membership, student profile, billing account, and course enrollment request when an offering is present.
- `student_intake.php` can create Moodle users and returns visible temporary password details after creation.
- Public intake queue can link to student intake and record transfer details.

Automation implication:

- Phase 4 can start with UI-driven intake review and conversion.
- If UI selectors are brittle, a test-only helper that wraps `pqadm_set_decision()` and `pqadm_convert_application()` should be added later.
- The first script should record whether the student was created through admissions conversion or student intake transfer.

Open environment need:

- Confirm which path is the canonical production workflow for public intake conversion:
  - public intake queue to student intake,
  - admissions pipeline accepted then converted,
  - or both.

## Course Enrollment Discovery

Files:

- `src/moodle/local_hubredirect/course_catalog_browse.php`
- `src/moodle/local_hubredirect/course_offerings.php`
- `src/moodle/local_hubredirect/course_offeringlib.php`

Findings:

- Course catalog browse route exists for student/parent enrollment requests.
- Course offerings admin page lists and reviews enrollment requests.
- `pqcoa_review_enrollment_request()` approves or rejects pending requests.
- Approval attempts Moodle manual enrollment with `pqco_enrol_student_in_moodle_course()`.
- Approved requests become `enrolled` when Moodle enrollment succeeds.
- Retry Moodle sync exists for approved requests whose Moodle enrollment did not complete.
- Duplicate and capacity behavior is managed through course offering helpers.

Automation implication:

- Phase 5 can use UI for student/parent request and admin approval.
- The seeded offering should have manual enrollment enabled to avoid approved-pending-sync unless that state is intentionally under test.

## Finance Discovery

Files:

- `src/moodle/local_hubredirect/course_offerings.php`
- `src/moodle/local_hubredirect/finance_lib.php`
- `src/moodle/local_hubredirect/invoice_detail.php`
- `src/moodle/local_hubredirect/student_billing.php`
- `src/moodle/local_hubredirect/parent_billing.php`
- `src/moodle/local_prequran/externallib_v4.php`

Findings:

- Course offerings page has `create_invoice_from_request` action.
- `pqfin_create_invoice_from_enrollment_request()` creates draft invoices from enrollment requests.
- Duplicate active invoice creation for the same request is blocked.
- `pqfin_issue_invoice()` issues draft invoices and assigns invoice number.
- `pqfin_mark_invoice_sent()` marks issued invoices as sent.
- `local_prequran_finance_invoice_action` supports `record_payment`, `create_payment_session`, and `revoke_invoice_links`.
- `finance_invoice_action` has idempotency guard support.
- Student and parent billing dashboards exist.

Automation implication:

- Phase 6 can create invoice through UI first.
- Phase 9 should use manual payment through `local_prequran_finance_invoice_action` first.
- Hosted payment should remain a later variant unless sandbox provider configuration is confirmed.

## Transcript Discovery

Files:

- `src/moodle/local_hubredirect/course_transcript.php`
- `src/moodle/local_hubredirect/course_transcript_official.php`
- `src/moodle/local_hubredirect/course_transcript_export.php`
- `src/moodle/local_hubredirect/course_transcriptlib.php`
- `src/moodle/local_prequran/externallib_v4.php`

Findings:

- Unofficial transcript UI exists.
- Official draft/issue UI exists.
- Export and public verification routes exist.
- Transcript web services are registered and implemented:
  - preview,
  - issue official,
  - document URL,
  - verify,
  - manage holds/reissue/revoke.
- Transcript policy settings exist.
- Transcript issue can be blocked if tables/policy/holds are not ready.

Automation implication:

- Phase 8 can use web services for stable preview/issue/document/verify flow.
- UI checks should still validate the student/parent/admin transcript pages render the expected state.

## Class Completion Discovery

Findings:

- Local unit progress services support setting unit state and marking steps complete for QA.
- `local_prequran_skip_step` explicitly marks one step complete and recalculates lesson rollup.
- Moodle gradebook/completion may also feed transcript policy depending on workspace settings.
- Workspace material assignment completion exists, but it is not necessarily the transcript source for course completion.

Decision for first automation:

- Default proposed mode: `EDUPLATFORM_COMPLETION_MODE=skip-step` when the test course maps to local unit progress.
- Fallback proposed mode: `EDUPLATFORM_COMPLETION_MODE=moodle-completion` if the test course is configured with Moodle completion criteria.
- Last-resort non-production mode: `EDUPLATFORM_COMPLETION_MODE=sql-fixture`, guarded by environment checks and run-ID tagging.

Open environment need:

- Confirm which completion source the target workspace transcript policy uses.
- Confirm test lesson/unit/step IDs if using `skip-step`.

## Test User And Role Matrix

Required users:

| Role | Purpose | Required for Milestone 1 | Notes |
| --- | --- | --- | --- |
| Public visitor | Submit public intake | Yes | No login. |
| Workspace admin/admissions user | Review intake and create/convert student | Yes | Must manage workspace intake/admissions. |
| Student | Browse catalog, request enrollment, view course/billing/transcript | Yes | May be created during test. |
| Parent/guardian | Linked-child enrollment/billing/transcript checks | Recommended | Can be created during intake or pre-seeded. |
| Finance admin | Issue invoice and record payment | Yes | May be same as workspace admin if permissions allow. |
| Registrar/admin | Issue official transcript | Yes | May be same as workspace admin if permissions allow. |
| Cross-workspace student/admin | Negative access checks | Later | Required for full security suite, not Milestone 1 happy path. |

Credential decision:

- Use one high-permission non-production workspace admin for Milestone 1 if that user can perform admissions, finance, and transcript actions.
- Split into separate admissions, finance, and registrar users in later regression suites to verify role boundaries.

## First Test Offering Requirements

The seeded offering for Milestone 1 must satisfy:

- Belongs to `EDUPLATFORM_WORKSPACE_ID`.
- Visible to public intake with `visibility = institution_public`.
- Visible in course catalog to student/parent.
- `status = published`.
- Has not ended.
- Has capacity available or unlimited capacity.
- Has pricing metadata with tuition amount and currency.
- Has a linked Moodle course ID.
- Moodle course has enabled manual enrollment.
- Transcript policy can resolve the offering into a transcript line.
- Completion can be driven by the chosen `EDUPLATFORM_COMPLETION_MODE`.

Preferred seed naming:

- Course title includes `SQA Journey`.
- Course key includes `sqa-journey`.
- Offering metadata or admin notes identify it as non-production SQA fixture.

## Known Blockers And Gaps

| Gap | Impact | Workaround | Recommended follow-up |
| --- | --- | --- | --- |
| Environment base URL, workspace ID, consumer slug, and credentials are not stored in repo. | Phase 1 cannot run executable tests yet. | Supply through local env or CI secrets. | Add `.env.e2e.example` with required names. |
| Public intake success redirect does not obviously expose request ID. | Automation needs a reliable way to continue from public intake to admin review. | Search intake queue by unique run email/name; use non-production SQL if needed. | Add safe admin/API lookup by run ID/email. |
| Canonical public-intake-to-student workflow needs confirmation. | Automation path may choose admissions pipeline or student intake transfer incorrectly. | Start with UI path confirmed by current operators. | Document canonical operations workflow in admin runbook. |
| Dedicated applicant conversion web service is not registered. | UI selectors may be brittle for admissions conversion. | Use UI first. | Add test-safe internal helper/API for non-production journey automation. |
| Dedicated enrollment approval web service is not registered. | UI selectors may be brittle for course approval. | Use course offerings UI. | Add internal service for request review with permission checks. |
| Dedicated invoice-from-enrollment web service is not registered. | Invoice creation initially depends on admin UI. | Use course offerings UI action. | Add service wrapping `pqfin_create_invoice_from_enrollment_request()`. |
| Class-completion strategy is environment-specific. | Transcript issue may fail if completion is not recognized. | Use configured `EDUPLATFORM_COMPLETION_MODE`. | Add a stable SQA completion helper tied to transcript policy. |
| Hosted payment sandbox is not confirmed. | Online payment cannot be first path. | Use manual payment mode. | Add hosted sandbox suite after provider config is stable. |
| Cross-workspace negative fixture not confirmed. | Some security tests may be blocked in Milestone 1. | Mark blocked with reason. | Seed a second workspace/test student for security suite. |

## Phase 1 Readiness Checklist

Before implementing Phase 1, confirm:

- `EDUPLATFORM_BASE_URL` points to local, integration, or staging.
- `EDUPLATFORM_WORKSPACE_ID` is known.
- `EDUPLATFORM_CONSUMER` is known.
- Workspace admin credentials are available.
- Finance/admin credentials are available or same admin has finance permissions.
- Web-service token is available if using Moodle services.
- One SQA offering is published, institution-public, priced, and linked to Moodle course.
- Moodle manual enrollment is enabled for the linked course.
- Transcript policy is configured for the workspace.
- Manual payment is enabled for the finance role.
- Completion mode and required IDs are known.

## Recommended First Phase 1 Configuration

Use this as the first `.env` shape for local execution:

```text
EDUPLATFORM_BASE_URL=https://example-staging.eduplatform.test
EDUPLATFORM_WORKSPACE_ID=123
EDUPLATFORM_CONSUMER=example-consumer
EDUPLATFORM_ADMIN_USERNAME=sqa.admin@example.test
EDUPLATFORM_ADMIN_PASSWORD=replace-me
EDUPLATFORM_STUDENT_PASSWORD=ReplaceMe123!
EDUPLATFORM_TEST_OFFERING_ID=456
EDUPLATFORM_PAYMENT_MODE=manual
EDUPLATFORM_CLEANUP_MODE=archive
EDUPLATFORM_COMPLETION_MODE=skip-step
EDUPLATFORM_WS_TOKEN=replace-me
```

Optional completion variables when using step completion:

```text
EDUPLATFORM_TEST_COHORT_ID=0
EDUPLATFORM_TEST_LESSON_ID=alphabet
EDUPLATFORM_TEST_UNIT_ID=alphabet
EDUPLATFORM_TEST_STEP_ID=lecture
```

## Phase 0 Exit Criteria Result

- Environment variable list: complete.
- Route and service inventory: complete.
- Test role matrix: complete.
- First offering requirements: complete.
- Known blocker list: complete.
- Remaining external input: non-production URL, workspace/consumer IDs, credentials, test offering ID, and completion mode.
