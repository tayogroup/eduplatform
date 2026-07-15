# Student Tuition Payments And Invoicing Requirements

Purpose: define the requirements for student tuition payments and invoicing that can be implemented after the course enrollment, EduForTomorrow, and institution workspace routing foundations are stable.

This is not only a checkout page. Tuition and invoicing must become a controlled student finance ledger that connects course enrollment, family billing, payment collection, scholarships, refunds, commissions, transcript holds, and consumer/workspace branding without leaking data across EduForTomorrow, Quran Academy, or institution workspaces.

## Goals

- Let parents, students, and sponsors understand what is due, what has been paid, and what remains outstanding.
- Let workspace admins create, review, adjust, send, collect, refund, and reconcile tuition invoices for students in their workspace.
- Support EduForTomorrow, Quran Academy, and institution-branded invoices, receipts, payment links, and finance notices.
- Connect invoice status to course enrollment access, live-session access, transcript finance holds, teacher payouts, and scholarship reporting when enabled.
- Preserve an audit trail for every charge, discount, payment, refund, write-off, hold, and invoice communication.
- Keep the first implementation practical: begin with invoice records, ledger entries, manual/admin payment recording, and payment-provider-ready fields before adding automatic payment gateways.

## Scope

In scope:

- Student and parent billing dashboard.
- Workspace admin finance dashboard.
- Invoice creation from course enrollment requests, course offerings, subscriptions, one-time fees, or manual charges.
- Tuition plans, discounts, scholarships, sponsorships, and payment schedules.
- Manual payment recording and payment-provider integration requirements.
- Receipts, credit notes, refunds, voids, write-offs, and balance aging.
- Domain-aware invoice and payment links for EduForTomorrow, Quran Academy, and institutions.
- Finance holds that can optionally block official transcript issue or future enrollment approval.
- Audit logging, reconciliation exports, and finance reporting.

Out of scope for the first implementation:

- Full general ledger accounting.
- Payroll, tax filing, or statutory accounting automation.
- Bank feed reconciliation.
- Complex multi-entity tax/VAT handling beyond storing tax fields and invoice metadata.
- Direct teacher payout execution, except for preserving data needed to calculate future payouts.
- Government financial aid compliance unless separately approved.

## Core Concepts

- Billing account: the family, adult learner, sponsor, or institution responsible for payment.
- Student finance profile: student-level billing preferences, payer links, scholarship eligibility, and finance hold status.
- Invoice: a dated request for payment with one or more charge lines.
- Invoice line: tuition, registration fee, materials fee, live-session package, exam/certificate fee, adjustment, discount, tax, or other item.
- Payment: money received through a gateway, cash, bank transfer, mobile money, check, sponsorship transfer, or admin adjustment.
- Receipt: confirmation that a payment was accepted and allocated.
- Credit note: official reversal or reduction of an invoice amount.
- Refund: money returned to a payer after a payment was received.
- Ledger entry: immutable finance event that changes the balance or documents a finance action.
- Payment plan: scheduled installments for one invoice, course, student, family, or workspace policy.

## Roles And Permissions

- Students can view invoices and payments tied to their own account when workspace policy allows student billing visibility.
- Parents/guardians can view and pay invoices only for linked children or family billing accounts.
- Sponsors can view and pay only invoices explicitly assigned to their sponsor billing account.
- Teachers should not see student balances by default. A workspace may allow teachers to see limited access-status flags, never full payment details.
- Workspace finance admins can create, send, adjust, void, refund, write off, and reconcile invoices for students in their workspace.
- Workspace academic admins can see payment/access status only when needed for enrollment approval, course access, or transcript holds.
- Consumer admins can view finance records for workspaces under their consumer.
- Platform admins can support all consumers, but global finance views must clearly label consumer, workspace, currency, and payment provider.
- Direct URL access by guessed invoice ID, student ID, payer ID, payment ID, receipt ID, or export path must fail outside the user's permitted scope.

## Billing Account Requirements

The system should support:

- One payer paying for one student.
- One payer paying for multiple linked students.
- Multiple payers sharing responsibility for one student, with explicit allocation rules.
- Sponsor-paid invoices for scholarship students.
- Institution-paid bulk invoices for partner cohorts.
- Adult students paying for themselves.

Required billing account fields:

- Consumer ID and workspace ID.
- Account type: parent, student, sponsor, institution, internal, or other.
- Primary payer user ID when a Moodle account exists.
- Payer display name.
- Billing email and optional phone.
- Billing address fields when required by policy.
- Preferred currency.
- Preferred payment method.
- Billing status: active, paused, blocked, archived.
- Consent/authorization marker for charging stored payment methods when future gateways support it.

## Course Enrollment Integration

Tuition must fit the existing course offering and enrollment lifecycle:

- Course offerings should support pricing metadata: tuition amount, currency, registration fee, materials fee, installment options, scholarship eligibility, tax behavior, refund policy, and payment-required timing.
- Enrollment requests should record whether payment is required before approval, before Moodle enrollment, before first live session, or after admin review.
- Pending enrollment should be able to create a draft invoice or quote without consuming a seat unless the workspace policy reserves seats for invoiced-but-unpaid requests.
- Approval should check finance policy before creating Moodle enrollment:
  - no payment required,
  - invoice created but payment pending,
  - deposit paid,
  - first installment paid,
  - full balance paid,
  - admin override granted,
  - scholarship/sponsor approved.
- If Moodle enrollment succeeds before payment is complete, the system must clearly label the access policy and any future suspension rules.
- If payment succeeds but enrollment approval fails, the invoice/payment must remain traceable and require admin resolution, not disappear into an orphaned state.

Recommended first policy:

- Allow admins to approve enrollment manually while seeing invoice status.
- Support a workspace setting for "payment required before approval" later.
- Do not automatically suspend student course access in the first implementation without admin review.

## Invoice Lifecycle

Suggested invoice statuses:

- `draft`: created but not sent.
- `quoted`: shared as an estimate, not yet payable.
- `sent`: issued to payer and payable.
- `partially_paid`: at least one payment allocated but balance remains.
- `paid`: fully paid.
- `overpaid`: payments exceed invoice total and require credit/refund handling.
- `past_due`: due date has passed and balance remains.
- `void`: cancelled before payment or reversed administratively.
- `written_off`: balance closed as uncollectible or forgiven.
- `refunded`: fully refunded after payment.
- `disputed`: payer or admin has opened a payment dispute.

Invoice requirements:

- Invoice numbers must be unique within consumer/workspace and stable after issue.
- Draft invoices can be edited; issued invoices should be corrected through credit notes or adjustment lines.
- Every invoice must store consumer ID, workspace ID, billing account ID, student ID when applicable, currency, issue date, due date, status, created by, and source workflow.
- Invoice lines must preserve source references such as course offering ID, enrollment request ID, live-session series ID, scholarship ID, or manual admin action.
- Invoices must show subtotal, discounts, taxes/fees when enabled, total, amount paid, amount credited, and balance due.
- Invoice PDFs and hosted invoice pages must use the issuing consumer or institution domain and branding.

## Tuition Pricing And Payment Plans

The system should support:

- One-time course tuition.
- Registration/application fees.
- Materials or curriculum fees.
- Monthly subscription tuition.
- Per-session or live-series fees.
- Installment plans by fixed dates or relative to course start date.
- Family discounts.
- Sibling discounts.
- Early-payment discounts.
- Late fees when enabled by policy.
- Scholarship, bursary, sponsorship, staff discount, and hardship aid adjustments.
- Manual admin discounts with required reason.

Payment plan requirements:

- Store the original plan terms even if the course price changes later.
- Generate scheduled invoice lines or child invoices for installments.
- Show next due amount, next due date, remaining balance, and missed installments.
- Allow admin-approved rescheduling without changing historical ledger entries.
- Prevent duplicate installment generation through idempotent scheduled tasks.

## Payment Collection

The first implementation may support manual/admin-recorded payments while preparing for payment providers.

Payment method types:

- Card or online gateway.
- Bank transfer.
- Cash.
- Check.
- Mobile money.
- Sponsor transfer.
- Internal scholarship allocation.
- Admin adjustment or write-off.

Payment requirements:

- Every payment must store consumer ID, workspace ID, billing account ID, payer, amount, currency, method, received date, status, reference, processor transaction ID when available, recorded by, and allocation.
- Payment allocation must support one payment covering one invoice, multiple invoices, or a family account balance.
- Payments should not be deleted. Incorrect payments must be reversed, refunded, voided, or adjusted with an audit reason.
- Gateway webhooks must be idempotent and must verify provider signatures.
- Payment links must be tokenized, scoped, and expire or be revocable.
- The payment page must never expose invoices outside the token's consumer/workspace/billing account.

Payment statuses:

- `pending`
- `authorized`
- `succeeded`
- `failed`
- `cancelled`
- `refunded`
- `partially_refunded`
- `disputed`
- `reversed`

## Receipts, Credits, Refunds, And Voids

- Successful payments should generate receipts with a stable receipt number.
- Receipts should show payer, payment method label, transaction reference, invoice allocation, amount, currency, date, and issuer branding.
- Credit notes should reduce invoice balance without pretending a payment was received.
- Refunds must reference the original payment and invoice allocation.
- Voiding an invoice must require a reason and must be blocked or require a credit workflow if payments are already allocated.
- Write-offs must require elevated permission and should remain visible in admin finance reports.

## Student And Parent Experience

Students and parents should be able to:

- View open invoices, due dates, amount due, paid amount, and balance.
- Open a hosted invoice page using the correct consumer or institution domain.
- Pay an invoice or installment when online payment is enabled.
- Download invoices and receipts.
- See scholarship, discount, sponsor, or credit allocations in plain language.
- See upcoming payment-plan dates.
- Request help or dispute a charge.
- See whether a finance hold affects official transcript requests, new course enrollment, certificates, or live-session access.

Parent-facing copy should be direct and careful. Avoid accounting jargon where simple labels work: "Amount due", "Paid", "Balance", "Due date", "Receipt", and "Payment plan".

## Admin Experience

Workspace finance admins should be able to:

- Open a student, family, sponsor, course, or workspace finance page.
- Create invoices manually or from enrollment requests.
- Preview and send invoices.
- Record manual payments.
- Allocate payments to invoices.
- Apply discounts, scholarships, credits, refunds, voids, and write-offs.
- Resend invoice and receipt links.
- Add or remove finance holds.
- Review overdue balances and aging.
- Export invoice, payment, balance, and scholarship reports.
- Reconcile gateway payments against provider references.
- See warnings for orphaned payments, duplicate invoices, currency mismatches, failed gateway webhooks, and paid-but-not-enrolled cases.

The admin dashboard should separate academic enrollment state from finance state while showing the relationship clearly.

## Finance Holds And Academic Controls

Finance holds should be configurable by workspace:

- Hold official transcript issue.
- Hold certificate issue.
- Hold new enrollment approval.
- Hold live-session booking.
- Hold course access after admin review.
- Inform admin only, with no automatic block.

Finance hold requirements:

- Holds must have type, reason, scope, created by, created at, status, and resolution note.
- Automatic holds should be policy-driven, for example invoice more than N days overdue or balance above a threshold.
- Manual holds should require permission and reason.
- Holds should never hide unofficial academic history unless the workspace policy explicitly says so.
- Transcript finance holds should connect to the hold model in `docs/course-transcript-requirements.md`.

Recommended first policy:

- Use finance holds as warnings and transcript/certificate release controls first.
- Avoid automatic course lockout until payment, refund, and dispute workflows are proven.

## EduForTomorrow, Consumer, And Domain Routing

Tuition pages, invoice links, receipts, and payment notifications must use the active consumer/domain/workspace context:

- EduForTomorrow invoices show EduForTomorrow branding, support contact, and payment domain.
- Quran Academy invoices show Quran Academy branding, support contact, and payment domain.
- Institution invoices show institution name, logo, workspace, support contact, and verified custom domain when active.
- Invoice, receipt, and payment links must not use hard-coded quraantest URLs for EduForTomorrow or institution flows.
- Payment-provider account configuration must be scoped by platform, consumer, or workspace according to the financial operating model.
- A payer with students in multiple workspaces must see clear workspace labels and must not receive a combined invoice unless intentionally generated.

No finance page should combine balances across consumers by default. Cross-consumer combined billing should be a separate platform-admin action with explicit labels and warnings.

## Scholarships, Sponsorships, And Discounts

The system should distinguish:

- Discount: price reduction granted by policy or admin action.
- Scholarship/bursary: financial aid covering part or all of tuition.
- Sponsorship: third party responsible for payment.
- Write-off: balance closed after invoicing due to policy or collection decision.

Requirements:

- Scholarship and sponsor approvals should be recorded before invoice issue when possible.
- Sponsor-funded invoices should be payable by sponsor users without exposing unrelated family data.
- Scholarship reports should show awarded amount, used amount, remaining commitment, student, workspace, course, and funding source.
- Discounts and scholarships must appear as clear invoice lines or credits rather than silently changing totals.
- Admin-entered discounts should require reason and permission.

## Teacher Marketplace And Future Payout Considerations

EduForTomorrow may later need teacher payout and commission support. The tuition model should preserve enough data for that without implementing payouts first:

- Course offering, teacher, marketplace request, and enrollment source references should be retained on invoice lines.
- Revenue share, commission, referral, and teacher payout eligibility fields should be policy-ready.
- Refunds, discounts, and write-offs must be visible to future payout calculations.
- Teacher-facing views should not expose payer financial details unless explicitly authorized.

## Notifications

Required notifications:

- Invoice issued.
- Payment received.
- Payment failed.
- Payment due soon.
- Payment overdue.
- Receipt available.
- Refund processed.
- Credit note issued.
- Payment-plan installment due.
- Finance hold added or resolved.
- Admin alert for paid-but-enrollment-not-approved.
- Admin alert for enrollment-approved-but-invoice-unpaid when policy requires payment.

Notification requirements:

- Use consumer/institution sender name, support address, logo, and domain-aware links.
- Avoid exposing sensitive payment details in email body.
- Respect communication preferences and guardian relationships.
- Log notification delivery attempts and failures.

## Reporting And Reconciliation

Required reports:

- Open invoices.
- Aging by invoice and billing account.
- Payments received by date, method, provider, consumer, workspace, and currency.
- Outstanding balances by student, family, course, and workspace.
- Discounts, scholarships, sponsorships, credits, refunds, and write-offs.
- Paid-but-not-enrolled and enrolled-but-unpaid exceptions.
- Gateway webhook failures and duplicate transaction attempts.
- Finance holds and hold resolution history.

Exports should include stable internal IDs for reconciliation, but user-facing PDFs should avoid exposing internal database IDs unless required.

## Privacy, Security, And Compliance

- Treat billing records as sensitive student/family financial records.
- Do not store raw card numbers, CVV, or bank credentials.
- Use payment providers for card/token storage.
- Protect hosted invoice and payment pages with tokenized links and server-side scope checks.
- Log every finance view, export, invoice issue, payment recording, adjustment, refund, void, write-off, and hold action.
- Redact sensitive payment references in debug logs.
- Store invoice PDFs and receipts outside public web roots or serve them through permission checks.
- Support retention policies by consumer/workspace.
- Ensure payment disputes and refunds preserve historical evidence.

## Suggested Data Model

Add finance-specific tables after confirming course enrollment and consumer/workspace routing behavior.

Suggested tables:

- `local_prequran_billing_account`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `accounttype`
  - `primaryuserid`
  - `displayname`
  - `billingemail`
  - `billingphone`
  - `currency`
  - `status`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_student_finance`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `studentid`
  - `billingaccountid`
  - `financepolicyjson`
  - `holdstatus`
  - `status`
  - `timecreated`
  - `timemodified`

- `local_prequran_invoice`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `billingaccountid`
  - `studentid`
  - `invoicenumber`
  - `status`
  - `currency`
  - `issuedat`
  - `duedate`
  - `subtotal`
  - `discounttotal`
  - `taxtotal`
  - `total`
  - `amountpaid`
  - `amountcredited`
  - `balancedue`
  - `sourceworkflow`
  - `createdby`
  - `sentat`
  - `voidedby`
  - `voidedat`
  - `voidreason`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_invoice_line`
  - `id`
  - `invoiceid`
  - `consumerid`
  - `workspaceid`
  - `studentid`
  - `linetype`
  - `description`
  - `quantity`
  - `unitamount`
  - `discountamount`
  - `taxamount`
  - `totalamount`
  - `offeringid`
  - `enrolrequestid`
  - `moodlecourseid`
  - `teacherid`
  - `sourceid`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_payment`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `billingaccountid`
  - `payeruserid`
  - `status`
  - `method`
  - `currency`
  - `amount`
  - `receivedat`
  - `provider`
  - `providertransactionid`
  - `reference`
  - `recordedby`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_payment_alloc`
  - `id`
  - `paymentid`
  - `invoiceid`
  - `amount`
  - `allocatedby`
  - `timecreated`
  - `timemodified`

- `local_prequran_credit_note`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `invoiceid`
  - `creditnumber`
  - `status`
  - `amount`
  - `reason`
  - `createdby`
  - `issuedat`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_refund`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `paymentid`
  - `invoiceid`
  - `status`
  - `amount`
  - `reason`
  - `providerrefundid`
  - `createdby`
  - `processedat`
  - `metadatajson`
  - `timecreated`
  - `timemodified`

- `local_prequran_finance_hold`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `studentid`
  - `billingaccountid`
  - `holdtype`
  - `status`
  - `reason`
  - `createdby`
  - `resolvedby`
  - `resolvedat`
  - `resolutionnote`
  - `timecreated`
  - `timemodified`

- `local_prequran_finance_audit`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `userid`
  - `objecttype`
  - `objectid`
  - `action`
  - `beforejson`
  - `afterjson`
  - `reason`
  - `ipaddress`
  - `useragent`
  - `timecreated`

## API And Service Requirements

Future service methods should support:

- Resolve student/family billing dashboard.
- Create invoice draft from enrollment request.
- Issue/send invoice.
- Record manual payment.
- Start hosted payment session.
- Receive and verify payment-provider webhook.
- Allocate payment to invoice.
- Generate receipt.
- Create credit note.
- Create refund.
- Void invoice.
- Write off invoice balance.
- Manage finance holds.
- Export finance reports.

Every service must enforce consumer, workspace, billing account, student, guardian, sponsor, finance admin, and platform-admin permissions server-side.

## Acceptance Criteria

1. A parent sees only invoices for linked children in the correct consumer/workspace.
2. A student sees only their own billing records when student billing visibility is enabled.
3. A workspace finance admin can create, issue, send, and record payment for an invoice.
4. Invoice issue creates a stable invoice number and immutable issued-line history.
5. Payments can be allocated to invoices and update balance due.
6. Receipts use the correct consumer or institution branding.
7. EduForTomorrow payment links do not point to quraantest.
8. Institution invoices use institution branding and verified institution domains.
9. Direct URL guessing cannot reveal another student's invoice, payment, receipt, or hosted payment page.
10. Paid-but-not-enrolled and enrolled-but-unpaid exceptions appear in admin reports.
11. Finance holds can block official transcript issue when the workspace enables that policy.
12. Refunds, credits, voids, and write-offs are audited and do not delete original records.
13. Gateway webhook handling is idempotent and rejects invalid signatures.
14. Finance exports include consumer/workspace labels and stable reconciliation IDs.

## Implementation Phases

The detailed build sequence is maintained in `docs/student-tuition-payments-invoicing-implementation-plan.md`.

Recommended high-level sequence:

1. Discovery, finance policy decisions, and payment-provider selection.
2. Billing account and student finance profile model.
3. Invoice and invoice-line model with manual draft/issue/send flow.
4. Admin finance dashboard and student/parent billing dashboard.
5. Manual payment recording, allocation, receipts, and balance updates.
6. Enrollment integration: invoice-from-request, payment-status warnings, and admin approval checks.
7. Credits, refunds, voids, write-offs, and finance audit reports.
8. Finance holds and transcript/certificate release integration.
9. Hosted payment links and gateway webhook integration.
10. Payment plans, scheduled installment invoices, reminders, and aging reports.
11. Scholarships, sponsorships, and future payout-ready marketplace references.
12. Pilot rollout for EduForTomorrow and one institution workspace before broad launch.

## Test Matrix

Required tests:

- EduForTomorrow parent cannot view Quran Academy invoices.
- Institution parent cannot view another institution student's invoices.
- Sponsor can pay assigned invoice without seeing unrelated family records.
- Workspace admin cannot manage another workspace's finance records.
- Invoice created from enrollment request references the correct offering and student.
- Payment succeeds but enrollment approval fails, and the exception appears for admin resolution.
- Enrollment approval with unpaid invoice follows workspace finance policy.
- Invoice PDF, hosted payment page, receipt, and email links use correct consumer/domain branding.
- Duplicate payment-provider webhook does not double-credit an invoice.
- Refund does not erase the original payment or receipt record.
- Finance hold blocks official transcript issue only when policy enables it.
- Finance reports label consumer, workspace, currency, payment method, and provider references.
