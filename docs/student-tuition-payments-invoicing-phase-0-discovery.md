# Student Tuition Payments And Invoicing Phase 0 Discovery

Purpose: complete Phase 0 for tuition payments and invoicing by documenting the current enrollment data inputs, first-launch finance policy decisions, role/capability assumptions, currency/provider assumptions, warning catalog, and risk register before schema or UI implementation starts.

Related documents:

- Requirements: `docs/student-tuition-payments-invoicing-requirements.md`
- Implementation plan: `docs/student-tuition-payments-invoicing-implementation-plan.md`
- Enrollment workflow: `docs/course-offerings-workflow-qna.md`
- Transcript requirements: `docs/course-transcript-requirements.md`
- Multi-consumer routing: `docs/edufortomorrow-multibrand-implementation-plan.md`

## Phase 0 Status

Status: complete for planning and build readiness.

This phase is documentation and discovery only. It does not add finance schema, payment gateway code, invoice pages, or enrollment gating. It establishes the operating decisions that later phases must implement.

## Current Source Inventory

### Consumer And Domain Context

Existing source tables:

- `local_prequran_consumer`
  - `slug`
  - `name`
  - `consumer_type`
  - `status`
  - `primaryworkspaceid`
  - `owneruserid`
  - `supportemail`
  - `logourl`
  - `themejson`
  - `copyjson`
  - `defaultpublicpath`
  - `defaultdashboardpath`
  - `emailfromname`
  - `emailreplyto`
- `local_prequran_consumer_domain`
  - `consumerid`
  - `workspaceid`
  - `domain`
  - `domain_type`
  - `isprimary`
  - `sslstatus`
  - `verificationstatus`
  - `verifiedat`
  - `status`

Relevant helpers and routes:

- `src/moodle/local_hubredirect/accesslib.php`
  - resolves current/requested consumer context.
  - resolves current workspace.
  - checks consumer context allows workspace.
  - checks user belongs to consumer/workspace context.
- Seeded contexts include:
  - `eduplatform`
  - `quraan-academy`
  - `edu-for-tomorrow`

Finance implication:

- Every billing account, invoice, payment, receipt, refund, credit, hold, notification, export, and provider configuration must store `consumerid` and `workspaceid`.
- Domain-aware hosted invoice and payment links must use the resolved consumer/workspace context. No EduForTomorrow or institution finance link should fall back to a quraantest URL.

### Workspace And Membership Context

Existing source tables:

- `local_prequran_workspace`
  - `name`
  - `slug`
  - `workspace_type`
  - `ownerid`
  - `status`
  - `plan_code`
  - `student_limit`
  - `teacher_limit`
  - `session_limit`
  - `storage_limit_mb`
  - `settingsjson`
- `local_prequran_workspace_member`
  - `workspaceid`
  - `userid`
  - `workspace_role`
  - `status`
  - `notes`
  - `createdby`

Current workspace roles observed in access helpers:

- `owner`
- `admin`
- `coordinator`
- `teacher`
- `assistant_teacher`
- `student`
- parent access is resolved through linked child relationships and workspace membership checks.

Finance implication:

- Phase 1 should introduce finance-specific permission checks instead of treating every workspace admin action as finance authority forever.
- Until a dedicated finance capability exists, first-launch finance-admin behavior can map conservatively to workspace owner/admin plus platform admin only.

### Course Offering Source

Existing source table:

- `local_prequran_course_offering`
  - `id`
  - `consumerid`
  - `workspaceid`
  - `moodlecourseid`
  - `course_key`
  - `title`
  - `summary`
  - `syllabus`
  - `prerequisites`
  - `startdate`
  - `enddate`
  - `capacity`
  - `visibility`
  - `approval_mode`
  - `status`
  - `createdby`
  - `timecreated`
  - `timemodified`

Current status/visibility behavior:

- Offering statuses include `draft`, `published`, `closed`, and `archived`.
- Learner-visible statuses are currently `published` and `closed`.
- Enrollment requests can be accepted only when the offering is `published` and the offering end date has not passed.
- Open seats are calculated from approved/enrolled requests, not pending requests.

Finance gaps:

- No tuition amount.
- No currency.
- No registration/materials fee.
- No installment eligibility.
- No scholarship/sponsor eligibility.
- No refund policy.
- No payment-required timing.
- No tax/fee behavior.

Finance implication:

- Phase 4 should extend course offerings with pricing metadata, but Phase 0 policy says invoice existence should not consume seats.
- If an invoice is created for a pending request, the enrollment request remains the source of truth for seat reservation until a later policy explicitly changes this.

### Enrollment Request Source

Existing source table:

- `local_prequran_course_enrol_req`
  - `id`
  - `offeringid`
  - `consumerid`
  - `workspaceid`
  - `studentid`
  - `requesterid`
  - `requester_role`
  - `status`
  - `request_notes`
  - `admin_notes`
  - `approvedby`
  - `approvedat`
  - `moodleenrolledat`
  - `droppedby`
  - `droppedat`
  - `timecreated`
  - `timemodified`

Current request statuses:

- `pending`
- `approved`
- `enrolled`
- `drop_requested`
- `dropped`
- `rejected`
- `cancelled`

Current request behavior:

- Students and parents can request enrollment from `course_catalog_browse.php`.
- Students and parents can cancel only pending requests.
- Students and parents can request drops only for active enrolled requests.
- Workspace admins approve or reject pending requests from `course_offerings.php`.
- Approval checks offering status, end date, and open seats.
- Approval attempts Moodle manual enrollment.
- If Moodle enrollment succeeds, status becomes `enrolled` and `moodleenrolledat` is set.
- If Moodle enrollment fails, status remains `approved` and requires follow-up/retry.
- Duplicate active requests for the same offering/student are blocked by both code and a unique key.

Finance gaps:

- No invoice ID.
- No payment-required flag.
- No finance approval override.
- No deposit/full-payment status.
- No sponsor or scholarship link.
- No paid-but-not-approved exception marker.

Finance implication:

- Enrollment request is the right source object for invoice-from-enrollment in Phase 4.
- Finance state must be added through finance tables and summarized into approval UI; it should not overload `status`.

### Course Audit Source

Existing source table:

- `local_prequran_course_audit`
  - `consumerid`
  - `workspaceid`
  - `offeringid`
  - `requestid`
  - `studentid`
  - `actorid`
  - `action`
  - `targettype`
  - `targetid`
  - `details`
  - `timecreated`

Current audit usage:

- Enrollment requested.
- Enrollment cancelled.
- Enrollment approved/rejected.
- Moodle enrollment completed.
- Moodle sync failed.
- Drop requested/reviewed.
- Transcript hold created/resolved.

Finance implication:

- Finance should get its own immutable audit table in later phases because finance events require before/after values, payment references, reversal reasons, and stronger retention.
- Course audit can still receive summary events for enrollment-facing finance actions such as invoice created from enrollment, finance hold added, or paid-but-not-enrolled flagged.

### Transcript Hold Source

Existing transcript hold model:

- `local_prequran_transcript_hold`
  - `consumerid`
  - `workspaceid`
  - `studentid`
  - `holdtype`
  - `status`
  - `reason`
  - `createdby`
  - `resolvedby`
  - `resolvedat`
  - `resolutionnote`
  - timestamps

Current behavior:

- Active holds can block official transcript issue.
- Holds are managed by workspace admins.
- Holds are audited through course audit events.

Finance implication:

- Finance holds should not be stored only as transcript holds.
- Later finance hold records should be able to project into transcript/certificate/enrollment release checks according to workspace policy.
- First launch should use finance holds as warnings and official transcript/certificate release controls, not automatic course lockout.

### Student And Parent Source

Existing source tables and routes:

- `local_prequran_student_profile`
  - includes `userid`, parent contact fields, course type, enrollment approval fields, status, and workspace-related fields.
- linked child/guardian behavior is used by `pqco_workspace_students_for_user()` in `course_offeringlib.php`.
- `course_catalog_browse.php` resolves requestable students for the current user/workspace.

Finance implication:

- Phase 1 billing account resolver should reuse existing parent/student linkage for family billing accounts.
- Parent billing visibility must be scoped to linked children inside the current workspace.
- Student self-pay can be enabled per policy, but parent/guardian billing is the safer first default for child learners.

### Referral And Commission Source

Existing source tables:

- `local_prequran_referrer`
- `local_prequran_referral`
  - `referrerid`
  - `studentid`
  - `datereferred`
  - `referral_status`
  - `dateexpires`
  - `commission_amount`
  - `commission_rate`
  - `commission_currency`
  - `approvedat`
  - `approvedby`
  - `payment_status`
  - `paidat`
  - `payment_reference`
  - `notes`

Current behavior:

- Referral commission and payment status are manually tracked.
- Payment statuses include `unpaid`, `approved`, `paid`, and `held` in the admin UI.

Finance implication:

- Referral payout tracking is not student tuition payment.
- Later finance reports should preserve enough source references to calculate commissions, but referral payout execution remains out of scope.
- Existing referral payment fields should not be reused for tuition invoices.

### Marketplace Source

Current source areas:

- teacher marketplace admin/listing/request routes under `local_hubredirect`.
- teacher intake request data includes `consumerid` and `workspaceid`.
- marketplace visibility and request flows are consumer-aware per the multi-consumer plan.

Finance implication:

- EduForTomorrow invoices should preserve marketplace source references for later teacher payout/reporting.
- Teacher payout execution remains out of scope until tuition invoicing, refunds, and write-offs are stable.

## Policy Decision Log

| Area | Decision | Rationale | Later Review |
|---|---|---|---|
| Finance source of truth | Add dedicated finance tables in later phases. Do not overload enrollment request status with payment state. | Enrollment state and finance state have different lifecycles and audit needs. | Phase 1-3 schema design |
| Seat reservation | Pending invoices do not consume seats in first launch. Seats continue to be consumed by approved/enrolled requests. | Matches existing enrollment behavior and prevents unpaid invoices from blocking capacity. | Phase 4 pricing integration |
| Enrollment gating | First launch shows finance status to admins but does not automatically block approval. | Prevents accidental access lockout while payment workflows are new. | Phase 8 finance holds |
| Moodle access lockout | Automatic course suspension for non-payment is disabled for first launch. | Payment disputes, scholarship delays, and support cases need human review. | After pilot and refund/dispute workflow |
| Transcript holds | Finance holds may block official transcript issue only when workspace policy enables it. | Aligns with transcript requirements and avoids hiding academic history. | Phase 8 |
| Certificate holds | Certificate release can be blocked by finance policy later, but default is warning-only until certificate workflow is explicit. | Avoids silent credential blocking. | Certificate implementation |
| Billing visibility | Parent/guardian billing view disabled until parent/student billing pages pass negative tests. Admin-only finance can launch first. | Privacy risk is high for family finance records. | Phase 5 |
| Student billing visibility | Disabled by default for minors; workspace policy can enable for adult learners. | Child billing records are usually parent-facing. | Phase 5 |
| Sponsor visibility | Sponsor sees only assigned sponsor invoices, never family account detail. | Protects family financial privacy. | Phase 5 and 13 |
| Invoice corrections | Issued invoices are corrected by credit notes, refunds, reversals, voids, or write-offs, not by editing issued lines. | Preserves auditability. | Phase 7 |
| Payment provider | Manual/admin-recorded payments come before hosted payments. Provider fields are designed early, gateway comes later. | Reduces dependency and webhook risk. | Phase 11 |
| Online payment | Hosted payment buttons remain hidden until provider config, policy, webhooks, and token scope are verified. | Prevents unsafe partial payment launch. | Phase 11 |
| Currency | One invoice has one currency. Mixed-currency invoice lines are blocked. Cross-currency payment allocation is out of scope for first launch. | Simplifies reconciliation and prevents incorrect balances. | Phase 2/3 |
| Default currency | Workspace finance policy must define a default currency. If absent, use a conservative platform default only as a warning state. | Makes currency explicit before issue. | Phase 2 |
| Tax/VAT | Store tax fields/placeholders, but no automated tax calculation in first launch. | Tax rules vary by entity and jurisdiction. | Future finance/legal review |
| Refunds | Refund records reference original payment and invoice allocation. Refund execution through provider comes only after gateway integration. | Maintains traceability. | Phase 7/11 |
| Scholarship | Scholarship/discount must appear as explicit lines or credits, not silent total changes. | Parents/admins need understandable billing history. | Phase 13 |
| Teacher payout | Preserve source references; do not execute payouts in tuition launch. | Payouts depend on refund, write-off, commission, and provider maturity. | Future payout plan |

## Payment Recipient Decisions

| Context | First-launch payment recipient decision | Notes |
|---|---|---|
| Quran Academy | Quran Academy is the visible merchant/issuer unless platform finance config says otherwise. | Uses Quran Academy branding, support email, and domain-aware links. |
| EduForTomorrow marketplace | EduForTomorrow is the visible merchant/issuer for marketplace-origin invoices unless a later teacher/institution merchant model is explicitly enabled. | Preserve teacher and marketplace request references for future payout/reporting. |
| Institution workspace | Institution is the visible issuer when institution branding/domain is active; provider account ownership must be configured before hosted payments. | Manual invoicing can launch before provider account split is finalized. |
| Solo teacher workspace | Out of scope for first launch. Treat as EduForTomorrow-managed until a separate legal/payment model is approved. | Requires payout and tax review. |
| Sponsor-funded invoice | The issuing consumer/workspace remains the invoice issuer; sponsor is payer/billing account. | Sponsor should see assigned invoice only. |

## Currency And Provider Assumptions

First-launch currency assumptions:

- Store all money as decimal strings or integer minor units consistently in later schema; avoid floating point.
- One invoice currency only.
- One payment currency only.
- Payment allocation requires payment currency to match invoice currency.
- Cross-currency conversion, FX gain/loss, and multi-currency balances are out of scope.
- Default currency is a workspace finance policy setting.
- Commission currency from referral records is not automatically the tuition invoice currency.

Provider assumptions:

- Manual payments launch first.
- Gateway/provider integration is behind a feature flag.
- Provider config can be platform-level, consumer-level, or workspace-level, but only one active provider config should be selected for a hosted payment session.
- Webhooks must be idempotent and signature-verified.
- Raw card, CVV, or bank credential storage is prohibited.
- Provider transaction IDs are stored on payment records and never trusted without webhook/provider verification.

## Role And Capability Matrix

| Role | First-launch finance access | Current mapping | Future capability need |
|---|---|---|---|
| Student | View own billing only if workspace policy enables student billing visibility. No admin actions. | Workspace `student`; authenticated user owns student ID. | `local/prequran:viewownbilling` if Moodle capabilities are added. |
| Parent/guardian | View/pay linked-child invoices only when billing view is enabled. | Existing linked-child resolver plus workspace membership. | `local/prequran:viewchildbilling`. |
| Sponsor payer | View/pay assigned sponsor invoices only. | New billing account role needed. | Dedicated sponsor billing token/user mapping. |
| Teacher | No balance or payment details by default. May see limited access-status warning later. | Workspace `teacher` or `assistant_teacher`. | Separate limited finance-status permission if needed. |
| Workspace academic admin | See finance status on enrollment/transcript/certificate decisions, no payment editing by default. | Workspace `admin`, `owner`, possibly `coordinator`. | Split academic from finance permissions. |
| Workspace finance admin | Create/send invoices, record payments, allocate payments, manage credits/refunds/holds inside workspace. | First launch can map to workspace `owner`/`admin`. | `local/prequran:manageworkspacefinance`. |
| Consumer finance admin | View/manage finance across workspaces under one consumer. | Consumer admin model is still emerging. | `local/prequran:manageconsumerfinance`. |
| Platform finance admin | Support all consumers with clear labels. | Site admin/platform operations. | `local/prequran:manageplatformfinance`. |

Decision:

- Phase 1 can start with workspace owner/admin and platform admin checks, but the design must keep room for dedicated finance capabilities before parent-facing or payment-provider launch.

## Initial Finance Warning Catalog

These warning codes should guide later UI, reports, and tests.

| Code | Severity | Trigger | First recommended action |
|---|---|---|---|
| `finance_policy_missing` | Medium | Workspace has no explicit finance policy. | Use safe defaults and prompt admin to configure policy. |
| `billing_account_missing` | Medium | Student/enrollment has no billing account. | Create/link billing account before invoice issue. |
| `billing_account_cross_workspace` | High | Billing account workspace does not match student/enrollment workspace. | Block action and investigate data mapping. |
| `offering_price_missing` | Medium | Invoice-from-enrollment requested but offering has no price metadata. | Allow manual invoice line or configure offering price. |
| `currency_missing` | High | Invoice or offering has no currency after policy resolution. | Block invoice issue. |
| `currency_mismatch` | High | Payment, invoice, offering, or commission currency conflict. | Block allocation or require explicit admin correction. |
| `duplicate_active_invoice` | High | More than one active invoice references same enrollment request. | Block duplicate issue or require admin review. |
| `invoice_draft_not_sent` | Low | Draft invoice exists but has not been issued/sent. | Show admin action. |
| `invoice_sent_unpaid` | Medium | Issued invoice has no allocated payment. | Show on approval screen; do not block by default. |
| `invoice_partially_paid` | Medium | Balance remains after payment allocation. | Follow workspace policy for approval/holds. |
| `invoice_overpaid` | High | Allocated payments exceed invoice total. | Require credit/refund/reallocation review. |
| `invoice_past_due` | Medium | Due date passed with balance. | Show aging and hold candidate. |
| `paid_not_approved` | High | Payment exists but enrollment request is still pending/rejected/cancelled. | Admin resolution queue. |
| `approved_unpaid` | Medium | Enrollment approved/enrolled but invoice unpaid. | Warning only unless policy requires payment. |
| `paid_not_enrolled` | High | Payment exists but Moodle enrollment did not complete. | Admin resolution queue. |
| `enrolled_no_invoice` | Medium | Enrollment exists for priced offering without invoice. | Create invoice or record scholarship/admin override. |
| `scholarship_missing_approval` | Medium | Scholarship/discount line exists without approval source. | Require admin review. |
| `sponsor_invoice_unassigned` | High | Sponsor invoice lacks sponsor billing account. | Block sponsor link/payment. |
| `provider_event_unmatched` | High | Gateway event does not match known invoice/payment session. | Hold for manual reconciliation. |
| `provider_duplicate_event` | High | Webhook replay/duplicate detected. | Ignore duplicate after logging. |
| `payment_reference_duplicate` | Medium | Manual payment reference duplicates another payment in same workspace/currency. | Warn and require confirmation. |
| `finance_hold_active` | Medium/High | Active finance hold exists. | Apply only configured release controls. |
| `wrong_domain_link` | High | Generated finance link domain does not match consumer/workspace context. | Block send and fix domain resolver. |

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner Phase |
|---|---:|---:|---|---|
| Cross-consumer invoice or payment data leakage | Medium | High | Store consumer/workspace on every finance row; use central permission helpers; add negative tests. | All phases |
| Wrong-domain invoice or payment links | Medium | High | Generate links from consumer/domain context; block hard-coded quraantest links outside Quran Academy contexts. | Phase 5, 10, 11 |
| Duplicate payment allocation | Medium | High | Use idempotency keys, transaction unique checks, and allocation recalculation from immutable rows. | Phase 6, 11 |
| Manual payment entry error | High | Medium | Reversal workflow, reason-required audit, duplicate reference warning. | Phase 6, 7 |
| Invoice issued with wrong amount | Medium | High | Draft preview, policy-derived defaults, issued invoice correction via credit notes only. | Phase 3, 7 |
| Enrollment blocked incorrectly for non-payment | Medium | High | No automatic approval or course lockout in first launch; warning-first policy. | Phase 4, 8 |
| Paid student not enrolled due to Moodle sync failure | Medium | High | Paid-not-enrolled exception report and admin alert. | Phase 4, 9 |
| Student enrolled without required invoice | Medium | Medium | Enrolled-no-invoice warning and dashboard exception. | Phase 4, 9 |
| Refund or credit erases historical evidence | Low | High | Never delete payments/invoices; record refunds/credits as separate linked rows. | Phase 7 |
| Provider webhook spoofing | Medium | High | Signature verification, replay protection, provider event audit. | Phase 11 |
| Provider webhook duplicate creates double credit | Medium | High | Idempotent event handling and unique provider transaction references. | Phase 11 |
| Scholarship accounting unclear | Medium | Medium | Explicit scholarship/discount line types and approval references. | Phase 13 |
| Sponsor sees unrelated family data | Medium | High | Sponsor billing account scope; assigned invoices only; negative tests. | Phase 5, 13 |
| Teacher sees payer financial details | Medium | High | Teacher views exclude balances by default. | Phase 5 onward |
| Mixed currency balance corruption | Medium | High | One invoice/payment currency; block cross-currency allocation. | Phase 2, 3, 6 |
| Tax/VAT misrepresentation | Medium | High | Tax calculation out of scope; store placeholders only until legal/accounting review. | Future |
| Finance audit too shallow | Medium | Medium | Add dedicated finance audit table with before/after JSON and reason. | Phase 7 |
| Parent/student billing view privacy issue | Medium | High | Launch admin-only first; parent/student views behind feature flag and negative tests. | Phase 5 |
| Payout calculations ignore refunds/write-offs | Medium | Medium | Preserve invoice source refs and net collectible reports; payout execution out of scope. | Phase 13 |
| Custom-domain SSL/domain inactive for invoice links | Medium | High | Use only verified active domains for finance links; fallback must be explicit and branded. | Phase 5, 10 |
| Existing referral payment fields confused with tuition payments | Medium | Medium | Keep referral payouts separate from tuition ledger; document mapping clearly. | Phase 13 |

## Build Readiness Checklist

- Current course offering fields are mapped.
- Current enrollment request lifecycle is mapped.
- Current consumer/domain/workspace context is mapped.
- Current transcript hold behavior is mapped.
- Current referral commission/payment fields are distinguished from tuition payments.
- First-launch currency assumptions are documented.
- First-launch provider assumptions are documented.
- Role/capability matrix is documented.
- Warning catalog is documented.
- Risk register is documented.

## Phase 0 Verification Notes

Manual code/documentation review covered:

- `src/moodle/local_prequran/db/upgradelib.php`
- `src/moodle/local_hubredirect/accesslib.php`
- `src/moodle/local_hubredirect/course_offeringlib.php`
- `src/moodle/local_hubredirect/course_offerings.php`
- `src/moodle/local_hubredirect/course_catalog_browse.php`
- `src/moodle/local_hubredirect/course_transcriptlib.php`
- `src/moodle/local_hubredirect/referrers.php`
- `docs/course-offerings-workflow-qna.md`
- `docs/course-transcript-requirements.md`
- `docs/edufortomorrow-multibrand-implementation-plan.md`

No runtime tests were required for this phase because it is a discovery deliverable. Later phases should add SQL and browser smoke tests as soon as schema or UI appears.

## Open Questions For Later Phases

- Which payment provider will be used first, and will it be configured at platform, consumer, or workspace level?
- Which default currency should each pilot workspace use?
- Should institution workspaces use their own legal merchant identity before hosted payments launch?
- Should parent billing accounts be created from existing guardian links only, or also from student profile parent email fields?
- Should finance admin become a distinct workspace role before parent-facing billing pages launch?
- What is the certificate release workflow that finance holds should integrate with?
- Should refunds be recorded manually first even when original payment was manual/offline?
- What receipt/invoice numbering format should each consumer/workspace use?
- What retention policy applies to invoices and payment records for each consumer?
- Which scholarship approval workflow should be used before Phase 13?
