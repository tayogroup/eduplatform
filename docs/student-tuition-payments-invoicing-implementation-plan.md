# Student Tuition Payments And Invoicing Implementation Plan

Purpose: implement student tuition payments and invoicing in controlled phases after the course enrollment, EduForTomorrow, and institution workspace routing foundations are stable.

Primary requirements: `docs/student-tuition-payments-invoicing-requirements.md`.

## Guiding Principles

- Build an auditable finance ledger before adding automatic online payment collection.
- Keep academic enrollment status and finance status separate, but visible together where admins make enrollment decisions.
- Start with manual/admin-recorded payments and provider-ready fields before relying on gateway webhooks.
- Enforce consumer, workspace, billing account, student, guardian, sponsor, and finance-admin permissions server-side.
- Use domain-aware invoice, receipt, payment, and notification links from the first user-facing phase.
- Never delete financial history. Correct mistakes through voids, credits, reversals, refunds, or write-offs.
- Prefer warnings and admin review over automatic course lockout until payment, refund, dispute, and support workflows are proven.

## Phase 0: Discovery, Policy Decisions, And Risk Register

Goal: define the finance operating model before schema and UI work begins.

Status: complete. See `docs/student-tuition-payments-invoicing-phase-0-discovery.md`.

Tasks:

- Inventory current course offering and enrollment fields that affect tuition:
  - `local_prequran_course_offering`
  - `local_prequran_course_enrol_req`
  - course catalog and approval pages
  - student course history
  - transcript hold workflow
  - referral and marketplace request records
- Confirm who is the legal payment recipient for each context:
  - Quran Academy
  - EduForTomorrow
  - institution workspace
  - solo teacher workspace later
- Decide first-launch currency rules:
  - workspace default currency
  - whether mixed-currency invoices are blocked
  - whether cross-currency payments are out of scope
- Define finance roles and map them to Moodle capabilities:
  - workspace finance admin
  - workspace academic admin
  - consumer finance admin
  - platform finance admin
  - sponsor payer
- Define conservative default finance policies:
  - invoice issue timing
  - payment required before approval
  - deposit or installment rules
  - late fee availability
  - transcript finance hold behavior
  - certificate release behavior
  - automatic access restriction disabled for first launch
- Select likely payment-provider direction but do not depend on it for early phases.
- Create a finance risk register covering data leakage, duplicate payments, wrong-domain payment links, refund errors, payment/provider mismatch, accidental access lockout, and unclear scholarship accounting.

Deliverables:

- Finance policy decision log.
- Capability/role matrix.
- Currency and payment-provider assumptions.
- Initial finance warning catalog.
- Risk register.

Exit criteria:

- No implementation begins with ambiguous payer, consumer, workspace, or role ownership.
- First-launch policies are documented and can be represented in settings later.
- Finance hold behavior is aligned with transcript requirements.

Verification:

- Manual walkthrough of one Quran Academy student, one EduForTomorrow parent/student, one institution student, and one sponsor-paid scenario.
- Review of current enrollment states that can create finance exceptions.

## Phase 1: Billing Accounts And Student Finance Profiles

Goal: create the payer and student finance foundation without invoices yet.

Status: complete. Phase 1 added the billing account and student finance profile schema through the Moodle install/upgrade lifecycle, helper functions in `src/moodle/local_hubredirect/finance_lib.php`, an admin diagnostic/profile page at `src/moodle/local_hubredirect/student_finance.php`, a Finance link from Student Course History, and the verification SQL helper `src/moodle/local_prequran/sql/verify_student_finance_phase1.sql`.

Tasks:

- Add billing account schema through Moodle install/upgrade lifecycle:
  - `local_prequran_billing_account`
  - `local_prequran_student_finance`
- Store consumer ID, workspace ID, billing account type, primary user ID, billing contact details, currency, status, and metadata.
- Add helper functions to:
  - resolve or create a family billing account from parent/student relationships
  - resolve a sponsor billing account
  - link a student to one billing account
  - validate that a billing account belongs to the active consumer/workspace
- Add admin-only billing account diagnostic page or section.
- Add read-only student finance profile panel on student course/admin pages.
- Add audit events for finance profile create/update/link actions.

Deliverables:

- Billing account table.
- Student finance profile table.
- Billing account resolver helpers.
- Admin diagnostic/read-only profile panel.

Exit criteria:

- A student can be linked to a billing account inside one consumer/workspace.
- Parent and sponsor billing accounts are distinguishable.
- Cross-workspace billing account access is blocked server-side.

Verification:

- Create/link billing accounts for parent-paid, student-paid, and sponsor-paid cases.
- Negative tests with guessed billing account IDs from another workspace.

## Phase 2: Finance Policy Settings

Goal: make workspace finance behavior explicit before invoices affect enrollment.

Status: complete. Phase 2 added dedicated workspace finance policy storage, a conservative admin settings page, an effective policy resolver, default-policy warnings, and a verification query. The policy resolver is now the single source for billing defaults such as currency, invoice terms, deposit expectations, visibility, finance holds, transcript/certificate hold behavior, and disabled-by-default late fees or access lockout.

Tasks:

- Add finance policy storage, either as a dedicated table or guarded JSON in workspace settings:
  - default currency
  - invoice numbering prefix
  - invoice due terms
  - payment-required timing
  - deposit/first-installment requirement
  - student billing visibility
  - sponsor billing visibility
  - finance hold thresholds
  - transcript/certificate hold behavior
  - late fee disabled by default
  - automatic access lockout disabled by default
- Add workspace admin policy page with conservative defaults.
- Validate policy values before saving.
- Add helper to resolve effective finance policy for consumer/workspace.
- Add warnings when default policy is being used.

Deliverables:

- Finance policy schema/settings.
- Workspace finance policy page.
- Effective policy resolver.

Exit criteria:

- Enrollment and invoice workflows can query one authoritative finance policy.
- Non-finance admins cannot change finance policy unless explicitly permitted.
- Existing workspaces receive safe defaults.

Verification:

- Change policy and confirm resolver output changes.
- Confirm unrelated workspace admin cannot edit another workspace policy.

## Phase 3: Invoice And Invoice Line Foundation

Goal: create stable invoice records and invoice-line records with manual draft/issue flow.

Status: complete. Phase 3 added invoice and invoice-line storage, draft invoice creation, line add/edit/void handling, reproducible total recalculation, issue-time invoice numbering, sent markers, void handling for unpaid invoices, admin list/detail pages, and verification SQL. Issued invoices are intentionally immutable in this phase; correction workflows are deferred to later credit/refund phases.

Tasks:

- Add invoice schema through Moodle install/upgrade lifecycle:
  - `local_prequran_invoice`
  - `local_prequran_invoice_line`
- Add invoice-number generator scoped by consumer/workspace.
- Add invoice helper functions for:
  - create draft invoice
  - add/edit draft invoice lines
  - calculate subtotal, discount total, tax total, total, paid amount, credited amount, and balance due
  - issue invoice
  - void draft or unpaid issued invoice
- Store source references on lines:
  - course offering ID
  - enrollment request ID
  - Moodle course ID
  - teacher ID
  - live-session series ID later
  - scholarship/sponsor source later
- Add admin invoice list and invoice detail pages.
- Add audit events for create, edit, issue, send marker, and void.

Deliverables:

- Invoice and invoice-line tables.
- Invoice number generator.
- Admin invoice list/detail UI.
- Draft and issue workflow.

Exit criteria:

- Admin can create a draft invoice for a student billing account.
- Issued invoices get stable invoice numbers.
- Issued invoice totals are reproducible from stored lines.
- Direct URL access to invoices outside scope fails.

Verification:

- Create draft, edit lines, issue invoice, and confirm totals.
- Attempt to edit issued invoice lines and confirm correction workflow is required later.
- Negative tests with guessed invoice IDs.

## Phase 4: Enrollment Pricing Integration

Goal: connect course offerings and enrollment requests to invoice creation without blocking enrollment automatically.

Status: complete. Phase 4 added course offering pricing metadata, admin pricing controls, policy-gated catalog pricing display, invoice creation from enrollment requests, enrollment-request finance status panels, and exception warnings for missing invoices, unpaid approved/enrolled records, paid-not-approved records, duplicate active invoices, and currency mismatches. Enrollment approval remains manual and is not blocked by invoice existence or payment state.

Tasks:

- Extend course offering settings with pricing metadata:
  - tuition amount
  - currency
  - registration fee
  - materials fee
  - installment eligibility
  - scholarship eligibility
  - tax/fee behavior placeholder
  - refund policy label
  - payment-required timing
- Show pricing in admin course offering management.
- Show parent/student-safe pricing in course catalog where policy allows it.
- Add "Create invoice from enrollment request" action for workspace finance/admin users.
- Add invoice status summary on enrollment approval page:
  - no invoice
  - draft
  - sent
  - partially paid
  - paid
  - overdue
  - scholarship/sponsor covered
  - disputed
- Add warnings for:
  - paid but not approved/enrolled
  - approved/enrolled but invoice unpaid
  - currency mismatch
  - duplicate active invoice for same enrollment request
- Keep enrollment approval manual in this phase.

Deliverables:

- Course offering pricing fields.
- Invoice-from-enrollment action.
- Enrollment approval finance status panel.
- Finance exception warnings.

Exit criteria:

- Enrollment requests can generate draft invoices with correct source references.
- Admins can see finance status before approving enrollment.
- Seat counting remains governed by enrollment approval rules, not invoice existence.

Verification:

- Create invoice from pending enrollment and confirm offering/request references.
- Pay status not yet available still shows clear draft/sent/unpaid states.
- Confirm duplicate invoice creation is blocked or flagged.

## Phase 5: Student, Parent, And Sponsor Billing Views

Goal: let payers view issued invoices and balances before online payment is enabled.

Status: complete. Phase 5 added student, parent, and sponsor billing dashboards; a login-protected hosted invoice page with printable HTML; payer-visible invoice access rules; receipt/payment placeholders; support-contact labels; and invoice view/print audit events. Online payment buttons remain intentionally absent.

Tasks:

- Add student billing dashboard when student billing visibility is enabled.
- Add parent billing dashboard for linked children.
- Add sponsor invoice view for assigned sponsor invoices.
- Add hosted invoice page protected by login or scoped token.
- Add invoice PDF or printable HTML view using consumer/institution branding.
- Add receipt placeholder area for later payment phase.
- Add clear labels for amount due, paid, balance, due date, student, workspace, and support contact.
- Add audit logging for invoice views and downloads.

Deliverables:

- Parent billing dashboard.
- Student billing dashboard.
- Sponsor invoice view.
- Hosted invoice page.
- Branded invoice print/download view.

Exit criteria:

- Parent sees only linked-child invoices.
- Sponsor sees only assigned sponsor invoices.
- EduForTomorrow and institution invoice pages use correct branding and domains.
- No online payment button appears until payment collection is enabled.

Verification:

- Browser smoke tests across Quran Academy, EduForTomorrow, and one institution workspace.
- Direct URL and token negative tests.

## Phase 6: Manual Payments, Allocation, And Receipts

Goal: support admin-recorded payments and invoice balance updates without payment gateways.

Status: complete. Phase 6 added manual payment and allocation tables, admin payment recording from invoice detail, receipt number generation, printable receipt pages, hosted invoice receipt display, allocation-driven invoice paid/balance recalculation, and payment reversal with audit logging. The first UI supports the common one-payment-to-one-invoice workflow; the schema supports broader allocation workflows later.

Tasks:

- Add payment and allocation schema:
  - `local_prequran_payment`
  - `local_prequran_payment_alloc`
- Add manual payment recording UI for workspace finance admins.
- Support methods:
  - cash
  - bank transfer
  - check
  - mobile money
  - sponsor transfer
  - internal scholarship allocation
  - admin adjustment
- Add allocation workflow for one payment to one or multiple invoices.
- Recalculate invoice paid amount and balance from allocations.
- Add receipt number generation and receipt view/download.
- Add reversal workflow for incorrectly recorded manual payments.
- Add audit events for record, allocate, unallocate/reverse, and receipt download.

Deliverables:

- Payment and payment allocation tables.
- Manual payment recording page.
- Payment allocation UI.
- Receipt view/download.
- Balance update helpers.

Exit criteria:

- Admin can record payment and allocate it to an invoice.
- Invoice status updates to partially paid, paid, or overpaid based on balance.
- Incorrect payments are reversed, not deleted.
- Receipts use correct consumer/workspace branding.

Verification:

- Record partial, full, overpayment, and multi-invoice payment cases.
- Reverse a payment and confirm invoice balance is restored.
- Confirm non-finance users cannot record payments.

## Phase 7: Credits, Voids, Refunds, Write-Offs, And Audit Reports

Goal: support controlled finance corrections and lifecycle operations.

Status: complete. Phase 7 added credit note, refund, and finance audit schemas; correction helpers for credits, write-offs, refunds, and disputes; allocation-aware invoice recalculation with credits; correction workflows on invoice detail; and a workspace finance audit report filtered by student, billing account, invoice, payment, admin, action, and date. Existing course audit logging remains in place, and finance events now dual-write to the dedicated finance audit table when the schema is available.

Tasks:

- Add credit note and refund schema:
  - `local_prequran_credit_note`
  - `local_prequran_refund`
- Add credit note creation with required reason.
- Add refund record workflow tied to original payment and invoice allocation.
- Add issued-invoice void restrictions.
- Add write-off workflow with elevated permission.
- Add dispute marker for invoices/payments.
- Add finance audit table if not already implemented:
  - `local_prequran_finance_audit`
- Add audit report filtered by student, billing account, invoice, payment, admin, action, date, consumer, and workspace.

Deliverables:

- Credit note workflow.
- Refund record workflow.
- Write-off workflow.
- Dispute marker.
- Finance audit report.

Exit criteria:

- Issued invoice corrections do not mutate original financial history silently.
- Refunds and credits update balances without erasing original payments.
- Write-offs require elevated permission and reason.
- Finance audit report can reconstruct major invoice/payment events.

Verification:

- Issue credit note and confirm balance changes.
- Record refund and confirm original payment remains visible.
- Attempt void after payment allocation and confirm policy blocks or redirects to credit/refund workflow.

## Phase 8: Finance Holds And Academic Release Controls

Goal: integrate finance status with transcript, certificate, and enrollment controls through explicit policy.

Tasks:

- Add finance hold schema:
  - `local_prequran_finance_hold`
- Add hold management UI on student finance profile.
- Add automatic hold candidate detection:
  - overdue beyond threshold
  - balance above threshold
  - disputed high-value invoice
  - manual admin flag
- Keep automatic detection as suggested/queued holds until policy enables automatic activation.
- Connect finance hold checks to:
  - official transcript issue
  - certificate issue
  - new enrollment approval warning
  - live-session booking warning
- Add resolution notes and audit events.
- Show parent/student-safe hold explanation where policy allows.

Deliverables:

- Finance hold table.
- Hold management UI.
- Hold resolver.
- Transcript/certificate/enrollment warning integration.

Exit criteria:

- Finance holds block official transcript issue only when workspace policy enables it.
- Holds never hide unofficial academic history by default.
- Admins can see and resolve hold reasons.

Verification:

- Add hold, attempt official transcript issue, resolve hold, and issue transcript.
- Confirm hold warning appears on enrollment approval without automatic course lockout.

## Phase 9: Reporting, Reconciliation, And Admin Operations Dashboard

Goal: give finance admins reliable operational views before online payment volume increases.

Tasks:

- Add finance dashboard cards:
  - open invoices
  - overdue invoices
  - payments received
  - outstanding balance
  - paid-but-not-enrolled exceptions
  - enrolled-but-unpaid exceptions
  - finance holds
- Add reports:
  - invoice aging
  - payments by method/provider/date
  - balances by student/family/course/workspace
  - discounts and scholarships
  - refunds, credits, voids, and write-offs
  - finance holds
  - enrollment/finance exceptions
- Add CSV exports with stable reconciliation IDs.
- Add domain and consumer/workspace labels to global reports.
- Add scheduled task to refresh overdue status and exception counts.

Deliverables:

- Workspace finance dashboard.
- Finance report pages.
- CSV exports.
- Overdue/exception scheduled task.

Exit criteria:

- Workspace finance admins can run daily billing operations without database access.
- Platform admins can view cross-consumer reports with clear labels.
- Reports avoid exposing unnecessary PII.

Verification:

- Seed invoices across statuses and confirm dashboard counts.
- Export reports and verify IDs, labels, and totals.

## Phase 10: Notifications And Secure Links

Goal: send invoice and payment communications using consumer-aware templates and protected links.

Tasks:

- Add message templates for:
  - invoice issued
  - payment received
  - payment failed placeholder
  - payment due soon
  - payment overdue
  - receipt available
  - refund processed
  - credit note issued
  - finance hold added/resolved
  - admin exception alerts
- Add secure token model for invoice and receipt links, or reuse an existing signed-link helper.
- Add resend controls for admins.
- Add notification preference checks where available.
- Log delivery attempts and failures.
- Ensure all links are domain-aware and never hard-code quraantest for EduForTomorrow/institution flows.

Deliverables:

- Finance message provider/templates.
- Secure invoice/receipt link generation.
- Admin resend controls.
- Delivery logging.

Exit criteria:

- Issued invoices and receipts can be sent with correct branding and scoped links.
- Expired or revoked tokens do not expose invoice data.
- Admin exception alerts reach configured finance/admin recipients.

Verification:

- Send invoice/receipt notices in Quran Academy, EduForTomorrow, and institution contexts.
- Open expired/revoked token and confirm safe failure.

## Phase 11: Hosted Payment Links And Gateway Webhooks

Goal: add online payment collection after manual finance operations are proven.

Tasks:

- Finalize provider configuration model:
  - platform-level provider account
  - consumer-level provider account
  - workspace-level provider account
  - test/live mode
- Add hosted payment session creation service.
- Add payment button to hosted invoice page only when policy/provider config is valid.
- Store provider session IDs and transaction IDs.
- Add webhook endpoint with:
  - provider signature verification
  - idempotency keys
  - replay protection
  - event audit logging
  - safe failure handling
- Map provider events to payment statuses:
  - pending
  - authorized
  - succeeded
  - failed
  - cancelled
  - refunded
  - partially refunded
  - disputed
  - reversed
- Add admin webhook failure queue.
- Keep manual reconciliation controls available.

Deliverables:

- Provider configuration storage.
- Hosted payment session flow.
- Webhook endpoint.
- Provider event audit/failure queue.
- Online payment enablement flag.

Exit criteria:

- Online payment creates exactly one payment record per successful provider transaction.
- Duplicate webhooks do not double-credit invoices.
- Invalid webhook signatures are rejected.
- Payment success/failure updates invoice status and notifications.

Verification:

- Provider sandbox/test payments for success, failure, duplicate webhook, refund, and dispute events.
- Direct webhook negative tests with bad signatures.

## Phase 12: Payment Plans And Scheduled Installments

Goal: support installment tuition while preserving clear balances and scheduled obligations.

Tasks:

- Add payment plan schema or invoice metadata:
  - plan type
  - start date
  - installment count
  - installment amounts
  - due dates
  - reschedule history
  - original terms snapshot
- Add admin payment-plan setup on invoice/course enrollment.
- Add scheduled task to generate installment invoices or installment lines idempotently.
- Add parent/student view of upcoming installments.
- Add due-soon and overdue reminders.
- Add reschedule workflow with reason and audit.
- Add missed-installment warnings and optional hold candidate creation.

Deliverables:

- Payment plan model.
- Installment generation task.
- Payment plan UI.
- Reminder integration.

Exit criteria:

- Installments are generated once, even if the scheduled task reruns.
- Parents can see next due amount/date and remaining balance.
- Admin-approved rescheduling does not rewrite historical paid installments.

Verification:

- Generate installments, rerun scheduled task, and confirm no duplicates.
- Reschedule future installment and confirm audit trail.

## Phase 13: Scholarships, Sponsorships, And Marketplace Payout Readiness

Goal: support financial aid and preserve data needed for future EduForTomorrow teacher payouts.

Tasks:

- Add scholarship/sponsorship records or structured metadata:
  - funding source
  - awarded amount
  - used amount
  - remaining amount
  - student
  - course/offering
  - workspace
  - approval status
- Add sponsor-paid invoice workflow.
- Add scholarship/discount line types and reports.
- Add marketplace source references to invoice lines:
  - teacher
  - marketplace request
  - referral source
  - commission eligibility
  - revenue share policy snapshot
- Add report showing gross tuition, discounts, scholarships, refunds, write-offs, and net collectible amount by teacher/course/source.
- Keep payout execution out of scope.

Deliverables:

- Scholarship/sponsor workflow.
- Sponsor invoice view/payment support.
- Marketplace payout-ready references.
- Aid and source reporting.

Exit criteria:

- Sponsor can pay assigned invoices without unrelated family data.
- Scholarship amounts are visible as explicit lines or credits.
- Future payout calculations have stable source references.

Verification:

- Sponsor-paid invoice flow.
- Scholarship-covered enrollment flow.
- Refund/write-off cases preserve source references.

## Phase 14: APIs, Hardening, And Scale Controls

Goal: expose finance operations safely to internal services and stabilize production behavior.

Tasks:

- Add service methods only after page workflows are stable:
  - resolve billing dashboard
  - create invoice draft
  - issue/send invoice
  - record manual payment
  - create hosted payment session
  - receive provider webhook
  - allocate payment
  - create receipt
  - create credit/refund
  - manage finance holds
  - export reports
- Add rate limiting or abuse controls for hosted invoice/payment routes where available.
- Add concurrency guards for invoice issue, payment allocation, and webhook handling.
- Add structured logging with payment-reference redaction.
- Add repair scripts/reports for:
  - duplicate invoice numbers
  - unallocated payments
  - overpaid invoices
  - missing billing accounts
  - provider event mismatch
- Add backup/restore considerations for finance tables and generated documents.

Deliverables:

- Finance service methods.
- Concurrency/idempotency safeguards.
- Repair and consistency reports.
- Production logging/redaction rules.

Exit criteria:

- Services cannot read/write cross-consumer or cross-workspace finance data.
- Concurrent payment/webhook events do not corrupt balances.
- Operators can identify and repair common consistency issues.

Verification:

- Direct REST negative tests with guessed IDs.
- Concurrent webhook/allocation simulation in test environment.
- Finance consistency SQL checks.

## Phase 15: Pilot, Rollout, And Operational Handoff

Goal: launch tuition and invoicing gradually without destabilizing enrollment or transcript flows.

Tasks:

- Pilot manual invoicing in one internal Quran Academy workspace.
- Pilot EduForTomorrow with limited parent/student and admin users.
- Pilot one institution workspace under the platform fallback domain.
- Pilot one verified institution custom domain after domain routing is stable.
- Run end-to-end cases:
  - invoice from enrollment
  - manual payment and receipt
  - partial payment
  - credit note
  - refund record
  - finance hold
  - transcript hold release
  - online payment sandbox if enabled
- Write admin runbook:
  - configure finance policy
  - create invoice from enrollment
  - issue/send invoice
  - record payment
  - allocate payment
  - issue receipt
  - process credit/refund/write-off
  - manage holds
  - reconcile reports
  - troubleshoot provider failures
- Add launch checklist and rollback steps.

Deliverables:

- Pilot sign-off checklist.
- Finance admin runbook.
- Troubleshooting guide.
- Final launch checklist.

Exit criteria:

- Finance admins can operate daily invoice/payment workflows without developer intervention.
- Negative tests pass across Quran Academy, EduForTomorrow, and institution contexts.
- Rollback and disablement steps are documented.

Verification:

- End-to-end pilot smoke in every enabled context.
- Regression check that course catalog, enrollment approval, dashboard access, transcripts, and domain-aware links still work.

## Rollback And Feature Flags

Recommended flags:

- `finance_billing_accounts_enabled`
- `finance_policy_enabled`
- `finance_invoices_enabled`
- `finance_parent_student_views_enabled`
- `finance_manual_payments_enabled`
- `finance_holds_enabled`
- `finance_notifications_enabled`
- `finance_hosted_payments_enabled`
- `finance_payment_plans_enabled`
- `finance_scholarships_enabled`

Rollback approach:

- Disable hosted payments first if provider or webhook issues appear.
- Keep invoice/payment records intact; never delete financial history as rollback.
- Disable parent/student billing views if privacy or scope issues appear, while retaining admin-only access.
- Disable automatic reminders if links or copy are incorrect.
- Disable finance holds before disabling invoices if academic access is being blocked unexpectedly.
- Use credits/reversals/refunds for incorrect issued invoices or payments.
- Preserve all audit records and generated document references.

## Cross-Phase Test Requirements

Every phase should include these checks when relevant:

- Parent cannot view invoices for an unlinked child.
- Student cannot view another student's invoices or payments.
- Sponsor cannot view unrelated family/student records.
- Teacher cannot view student balances by default.
- Workspace admin cannot manage another workspace's finance records.
- Consumer admin cannot manage another consumer unless platform-admin permissions allow it.
- EduForTomorrow user cannot view Quran Academy finance data.
- Institution user cannot view another institution's finance data.
- Invoice, receipt, payment, and notification links use the correct consumer/domain.
- Direct URL guessing fails for invoice, payment, receipt, billing account, and hold IDs.
- Payment allocation updates balances without deleting original records.
- Refunds, credits, voids, write-offs, and reversals are audited.
- Duplicate webhook or duplicate form submission does not double-charge or double-credit.
- Finance holds affect transcripts, certificates, or enrollment only according to workspace policy.
