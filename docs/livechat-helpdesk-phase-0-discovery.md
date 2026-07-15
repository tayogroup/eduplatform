# Live Chat And Help Desk Phase 0 Discovery

Purpose: complete Phase 0 of `docs/livechat-helpdesk-implementation-plan.md` by recording the current communications foundation, policy decisions, permission model, queue/category defaults, and risk register before implementation begins.

Status: complete.

## Current Foundation Inventory

The existing platform already has a Moodle-backed communication foundation that should remain the source of truth for school-owned support conversations.

### Communication Tables

Defined through the `local_prequran` install/upgrade lifecycle:

- `local_prequran_comm_thread`: conversation container with type, workspace, cohort, student, optional case id, creator, status, subject, and last-message timestamp.
- `local_prequran_comm_participant`: explicit participant allow-list with role, reply permission, read marker, and mute flag.
- `local_prequran_comm_message`: immutable visible/hidden/flaggable message record linked to a thread and student.
- `local_prequran_comm_audit`: append-only communication audit records.
- `local_prequran_comm_template`: reusable communication template storage.
- `local_prequran_comm_campaign`: outbound announcement/campaign storage.
- `local_prequran_comm_delivery`: delivery attempt records.
- `local_prequran_comm_consent`: student/guardian communication consent and relationship source.
- `local_prequran_comm_case`: early case-like record with workspace, student, case type, priority, status, owner, opener, closer, and summary.

Key implication: the support/ticket implementation should link to or extend the existing communication records. It should not create a separate chat history that can drift away from Moodle communication history.

### Existing Communication Services

Registered web services already include:

- `local_prequran_comm_list_threads`
- `local_prequran_comm_get_thread`
- `local_prequran_comm_create_announcement`
- `local_prequran_comm_create_parent_thread`
- `local_prequran_comm_send_parent_alert`
- `local_prequran_comm_send_message`

These services currently cover announcements, parent-teacher messages, urgent parent alerts, and participant-based replies. They do not yet cover help desk queues, support tickets, SLA, assignment groups, internal notes, or public reply synchronization between tickets and conversations.

### Existing Permission Helpers

The current communications implementation has useful permission primitives:

- Site admins are treated as communication admins.
- Cohort membership can be checked for legacy cohort scope.
- Guardian relationships are resolved from `local_prequran_comm_consent` and `local_prequran_live_consent`.
- Teacher-student relationships are resolved from:
  - `local_prequran_teacher_student`
  - class group membership through `local_prequran_group_member` and `local_prequran_class_group`
  - live session teacher/participant relationships
- Student access can be validated for the student themself, linked guardian, assigned teacher, or admin.
- Thread read/reply permissions are based on thread participants and `canreply`.

Key implication: Phase 1 should factor these checks into support-specific helpers instead of duplicating ad hoc access logic in each endpoint.

### Existing UI

Current UI surfaces:

- `src/shared/js/shared-communications-panel.js` supports announcements and parent-teacher messages.
- `src/moodle/local_hubredirect/communications.php` provides a standalone communications host and direct fallback thread view.
- The shared panel calls `local_prequran_comm_list_threads`, `local_prequran_comm_get_thread`, and `local_prequran_comm_send_message`.

Current UI gaps:

- No help desk queue view.
- No student-help-desk entry point.
- No student-teacher support request flow.
- No convert-to-ticket UI.
- No ticket detail/timeline UI.
- No internal notes UI.
- No SLA/routing/supervisor dashboard.

Key implication: new support UI should be introduced after support APIs and role checks exist. The existing communications panel can be reused conceptually, but it should not be expanded into full support/ticket behavior until the backend model is ready.

### Existing Notifications And External Delivery

Current notification foundation:

- `local_prequran_notify_parent_ids_for_student()` resolves parent ids from communication consent, live consent, and existing parent participants.
- Moodle notification audit uses `local_prequran_live_audit`.
- Urgent parent WhatsApp alerts are optional and template-based.
- Urgent alerts first create a communication thread/message, then attempt Moodle/WhatsApp delivery.

Key implication: support notifications should use safe notification bodies and should keep Moodle communication records as the source of truth. WhatsApp should remain limited to approved urgent parent alert workflows until a separate support-channel policy is approved.

### Existing Support-Like Audit

Parent Trust tooling already records support-like events in live audit:

- `parent_trust_support_case_logged`
- `parent_trust_support_case_resolved`
- support reason metadata such as parent support request, scheduling issue, recording summary question, technical support, safety/privacy review, and other.

Key implication: help desk tickets should have their own support/ticket event timeline, but reporting should acknowledge existing parent-trust support events during migration or cross-reporting.

## Data Model Decision

Decision: use the existing `local_prequran_comm_*` tables as the conversation source of truth and add support-specific tables in Phase 1 for help desk/ticket operations.

Recommended approach:

- Keep `local_prequran_comm_thread` as the user-visible conversation container.
- Add new thread types:
  - `student_helpdesk`
  - `student_teacher`
  - keep existing `parent_teacher`
- Keep `local_prequran_comm_participant` as the explicit read/reply allow-list.
- Keep `local_prequran_comm_message` as the public conversation message store.
- Keep `local_prequran_comm_audit` for conversation audit.
- Add support/ticket tables for:
  - ticket record
  - ticket timeline/event record
  - ticket-message bridge if needed
  - support queues/assignment groups
  - SLA policies
  - canned responses
  - support settings/policies
- Link each ticket to `sourceconversationid` / communication thread id.
- Keep internal notes in the ticket timeline only, not in `local_prequran_comm_message`, unless visibility is explicitly staff-only and enforced server-side.

Rationale:

- Prevents duplicate chat histories.
- Reuses existing parent/guardian and teacher/student permissions.
- Preserves existing parent-teacher message continuity.
- Allows ticket-specific fields without overloading communication threads.
- Makes conversion to ticket an auditable linking event rather than a migration of messages.

## Policy Defaults

First implementation should ship with conservative workspace defaults.

### Feature Toggles

- Live chat master toggle: disabled by default for existing workspaces.
- Asynchronous support conversation: enabled only when workspace admin enables support.
- Student-to-help-desk: enabled for pilot workspaces.
- Student-to-teacher: disabled until assigned-teacher checks pass in pilot.
- Parent-to-teacher: use existing parent-teacher communication foundation; ticket conversion disabled until Phase 4.
- Real-time typing/presence: disabled until Phase 7.
- Attachments: disabled.
- AI auto replies: disabled.
- External channel ingestion: disabled.

### Student Free Text

- Parent visibility is on by default for student-created support.
- Free text can be enabled for older/approved students by workspace policy.
- Topic-only guided messages are the default for younger students or unknown policy.
- URLs, emails, phone numbers, social handles, and unsafe content should be blocked or flagged.

### Parent Visibility

- Student-help-desk conversations are parent-visible by default.
- Student-teacher conversations are parent-visible by default.
- Parent-to-teacher conversations are visible to linked parent/guardian and authorized staff.
- Finance ticket details should not be visible to students by default.
- Safeguarding tickets should be restricted and must not expose sensitive internal notes to students or parents.

### Business Hours And SLA Defaults

Initial defaults:

- Business hours: workspace-configurable; default Monday-Friday local workspace hours when no explicit policy exists.
- Urgent: first response 15 minutes during support hours; update/resolution target 4 hours.
- High: first response 2 business hours; update/resolution target 1 business day.
- Normal: first response 1 business day; update/resolution target 3 business days.
- Low: first response 2 business days; update/resolution target 5 business days.
- `waiting_for_user` pauses SLA only if the workspace policy explicitly allows it.

### Notifications

- In-app unread indicators and Moodle notifications are the first supported channels.
- Notification bodies must be safe, for example `New support reply`.
- Parent notifications are enabled for parent-visible student support.
- WhatsApp remains limited to urgent parent alerts using approved templates.
- Email remains policy-dependent and should not include sensitive message bodies by default.

## First-Launch Queues

Create these logical queues or assignment groups in Phase 1/5:

- Help Desk: technical access, account/profile, bug report, general support.
- Teacher Support: lesson help, recording review, homework, teacher feedback.
- Finance/Admin: payment, billing, invoice, finance hold, parent account billing access.
- Safeguarding Restricted: child safety, inappropriate contact, urgent welfare concern, privacy/safety review.

Routing defaults:

- `technical_access` -> Help Desk.
- `account_profile` -> Help Desk.
- `bug_report` -> Help Desk.
- `lesson_help` -> Teacher Support.
- `recording_review` -> Teacher Support.
- `teacher_feedback` -> Teacher Support.
- `schedule_attendance` -> Teacher Support or Help Desk based on workspace policy.
- `payment_billing` -> Finance/Admin.
- `safeguarding_concern` -> Safeguarding Restricted.
- `other` -> Help Desk.

## First-Launch Categories

Use these canonical categories:

- `technical_access`
- `lesson_help`
- `recording_review`
- `schedule_attendance`
- `teacher_feedback`
- `parent_follow_up`
- `payment_billing`
- `safeguarding_concern`
- `account_profile`
- `bug_report`
- `other`

Category restrictions:

- `safeguarding_concern` requires restricted role/capability, supervisor notification, and stronger audit.
- `payment_billing` is parent/guardian and finance/admin visible by default, not student visible.
- `lesson_help`, `recording_review`, and `teacher_feedback` require assigned-teacher or authorized teacher-group access.

## Capability And Role Matrix

Recommended Moodle capabilities for Phase 1:

- `local/prequran:supportusechat`: start/read own allowed support conversations.
- `local/prequran:supportreply`: reply as staff in allowed support conversations.
- `local/prequran:supportviewqueue`: view assigned support queue.
- `local/prequran:supportconvert`: convert conversation to ticket.
- `local/prequran:supportassignticket`: assign or transfer ticket.
- `local/prequran:supportupdateticket`: change ticket category, priority, status, and assignee within allowed scope.
- `local/prequran:supportinternalnote`: view/add staff-only internal notes.
- `local/prequran:supportmanagesla`: configure SLA policies and routing.
- `local/prequran:supportviewrestricted`: view restricted safeguarding/privacy tickets.
- `local/prequran:supportreports`: view/export support reports.
- `local/prequran:supportaudit`: review support audit events.

Role mapping:

- Student:
  - Own allowed conversations only.
  - No staff queue, ticket assignment, internal notes, or restricted access.
- Parent/Guardian:
  - Linked-child parent-visible conversations and public ticket replies.
  - No internal notes, student-hidden finance internals, or restricted staff-only records.
- Teacher:
  - Assigned student/parent conversations.
  - Teacher Support queue when assigned.
  - Convert to ticket only for assigned scope.
  - Internal notes only if workspace grants teacher staff-note capability.
- Help Desk Agent:
  - Help Desk queue inside allowed workspace.
  - Reply, convert, update status/category/priority, add internal notes if granted.
  - No restricted safeguarding unless separately granted.
- Finance/Admin Agent:
  - Finance/Admin queue inside allowed workspace.
  - Billing tickets for linked parent/guardian and authorized finance staff.
  - Student visibility disabled by default.
- Supervisor:
  - Queue monitoring, reassignment, SLA override, reports, quality review.
  - Restricted access only with explicit restricted capability.
- Workspace Admin:
  - Configure workspace support settings and view workspace reports.
  - Restricted access only with explicit restricted capability.
- Platform Admin:
  - Cross-workspace support by need, with workspace/consumer labels always visible.

## Scenario Walkthroughs

### Student To Help Desk

- Student opens support from lesson or app help.
- Conversation type is `student_helpdesk`.
- Student is requester and student context.
- Parent visibility is enabled by default.
- Help Desk queue receives the conversation.
- Agent replies or converts to ticket.
- Ticket category likely `technical_access`, `bug_report`, `account_profile`, or `other`.

### Student To Teacher

- Student opens teacher help from lesson/recording/session.
- Backend verifies assigned teacher relationship.
- Conversation type is `student_teacher`.
- Parent visibility is enabled by default.
- Teacher or teacher queue receives it.
- Teacher can reply, transfer to Help Desk, or convert to ticket later.

### Parent To Teacher

- Parent opens child support from parent dashboard.
- Backend verifies guardian relationship.
- Conversation uses existing `parent_teacher` type.
- Teacher or parent-teacher queue receives it.
- Conversion to ticket adds ticket lifecycle while preserving existing thread history.

### Finance Issue

- Parent or staff raises billing/payment issue.
- Category is `payment_billing`.
- Student visibility is disabled by default.
- Finance/Admin queue receives it.
- Public replies go to authorized parent/guardian and staff only.

### Safeguarding Issue

- Staff or parent raises safety/privacy concern.
- Category is `safeguarding_concern`.
- Ticket is routed to Safeguarding Restricted queue.
- Only roles with restricted capability can access full detail.
- Public conversation events should be minimal and safe.

## Risk Register

| Risk | Impact | Likelihood | Mitigation | Phase Owner |
| --- | --- | --- | --- | --- |
| Cross-workspace conversation or ticket leakage | High | Medium | Central support permission helpers; direct-ID negative tests; workspace labels in admin views | Phase 1 |
| Student sees finance or restricted staff information | High | Medium | Visibility levels; category restrictions; student-hidden finance default; restricted capability checks | Phase 1/4 |
| Parent visibility not applied to student-created support | High | Medium | Parent-visible default in policy; guardian resolver tests; acceptance tests for student-created chats | Phase 2/3 |
| Internal notes appear in conversation history | High | Medium | Store internal notes only in ticket timeline; never sync staff-only notes to `comm_message` | Phase 4 |
| Duplicate tickets from one chat | Medium | Medium | `linkedticketid` or source conversation link; duplicate conversion guard | Phase 4 |
| Ticket reply and conversation reply drift apart | Medium | Medium | Idempotent sync/bridge records; shared message/timeline event identifiers | Phase 4 |
| SLA due dates calculated incorrectly | Medium | Medium | Explicit business-hours policy; test urgent/high/normal/low around off-hours | Phase 5 |
| Teacher can access unassigned student support | High | Medium | Reuse teacher-student resolver; negative tests for unrelated students | Phase 1/2 |
| Parent can access unrelated child support | High | Low/Medium | Guardian consent resolver; participant allow-list; direct-ID tests | Phase 1/2 |
| Support notifications expose sensitive message body | Medium/High | Medium | Safe notification templates; no message body by default; restricted category notification rules | Phase 2/5 |
| Existing communications UI becomes overloaded | Medium | Medium | Add support-specific APIs/UI in phases; do not force ticketing into current panel prematurely | Phase 3/4 |
| Existing `comm_case` table is too small for ticketing | Medium | High | Use it only as legacy/reference or migrate deliberately; add dedicated support ticket tables | Phase 1 |
| Safeguarding workflow lacks strong audit | High | Medium | Restricted queue, stronger audit events, supervisor notification, export/review controls | Phase 5/8 |
| Attachments introduce malware or privacy leakage | High | Medium | Attachments disabled until separate scanning/retention/access review | Phase 9 |
| WhatsApp support expands beyond approved templates | Medium/High | Medium | Keep WhatsApp limited to urgent parent alerts until separate channel policy exists | Phase 0/9 |

## Phase 0 Decisions

- Use Moodle communication records as the source of truth for conversation history.
- Add support/ticket-specific tables rather than overloading `local_prequran_comm_case`.
- Keep student-created support parent-visible by default.
- Keep attachments, AI auto replies, external channel ingestion, and real-time polish out of the first implementation.
- Use feature flags/workspace settings so pilot workspaces can enable support without global exposure.
- Implement asynchronous support before live chat presence/typing.
- Use explicit Moodle capabilities for support agent, supervisor, restricted, reporting, and SLA management privileges.
- Treat `safeguarding_concern` and `payment_billing` as restricted/special categories from the first schema phase.

## Phase 0 Exit Criteria

- Current communication tables, services, UI, notifications, and permission helpers have been inventoried.
- Data model direction is documented.
- First-launch policy defaults are documented.
- Queue/category defaults are documented.
- Capability/role matrix is documented.
- Scenario walkthroughs are documented.
- Risk register is documented.

Phase 0 is complete when this document is accepted as the baseline for Phase 1 implementation.
