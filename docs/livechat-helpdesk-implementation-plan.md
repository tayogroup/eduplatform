# Live Chat And Help Desk Implementation Plan

Purpose: implement the live chat and help desk requirements in controlled phases after the current communications, parent visibility, workspace routing, and Moodle permission foundations are stable.

Primary requirements: `docs/livechat-helpdesk-requirements.md`.

## Guiding Principles

- Extend the existing Moodle communication source of truth instead of creating an isolated support inbox.
- Build permission, audit, and parent visibility rules before exposing broad chat surfaces.
- Start with asynchronous chat and ticket tracking before adding real-time presence polish.
- Keep student-created support parent-visible by default.
- Keep internal notes, restricted categories, finance details, and safeguarding workflows hidden from students unless explicitly allowed.
- Treat ticket conversion as an auditable event that links the original conversation and ticket timeline permanently.
- Prefer conservative defaults: attachments disabled, student free text controlled, automatic AI replies disabled, and external channels deferred.
- Ship every phase behind workspace settings and role/capability checks.

## Phase 0: Discovery, Policy Decisions, And Risk Register

Goal: confirm the operational support model before schema or UI work begins.

Status: complete. See `docs/livechat-helpdesk-phase-0-discovery.md`.

Tasks:

- Inventory current communications implementation:
  - `local_prequran_comm_thread`
  - `local_prequran_comm_participant`
  - `local_prequran_comm_message`
  - `local_prequran_comm_audit`
  - existing parent-teacher and urgent parent alert flows
  - `src/shared/js/shared-communications-panel.js`
  - Moodle notification helpers
- Map current student, parent, teacher, help desk, supervisor, workspace admin, consumer admin, and platform admin permission helpers.
- Decide whether first implementation extends `local_prequran_comm_*` tables directly or adds `local_prequran_support_*` tables linked to communication records.
- Define workspace policy defaults:
  - live chat enabled
  - student-to-help-desk enabled
  - student-to-teacher enabled
  - parent-to-teacher enabled
  - student free-text policy
  - parent visibility policy
  - business hours
  - default SLA targets
  - restricted categories
- Define first-launch queues:
  - help desk
  - teacher support
  - finance/admin
  - safeguarding restricted
- Define capability names and role mapping for:
  - use support chat
  - reply as staff
  - convert chat to ticket
  - assign ticket
  - view internal notes
  - manage SLA/routing settings
  - view restricted tickets
  - export reports
- Create a risk register for student privacy, cross-workspace leakage, wrong parent visibility, internal-note exposure, duplicate tickets, SLA miscalculation, and unsafe external notifications.

Deliverables:

- Data model decision note.
- Role/capability matrix.
- Workspace policy defaults.
- Queue/category/routing defaults.
- Initial support risk register.

Exit criteria:

- No implementation begins with ambiguous ownership of conversations, tickets, parent visibility, or restricted categories.
- The first release can be feature-flagged per workspace.
- Permission rules are documented for every role and conversation type.

Verification:

- Manual review of one student-help-desk, one student-teacher, one parent-teacher, one finance, and one safeguarding scenario.
- Negative access walkthrough using guessed conversation and ticket IDs across workspaces.

## Phase 1: Support Schema, Capabilities, And Settings

Goal: create the storage and configuration foundation without user-facing chat changes.

Status: complete. Phase 1 added support capabilities, conservative global settings, support/ticket schema tables, communication link fields, helper functions, and `src/moodle/local_prequran/sql/verify_support_phase1.sql`.

Tasks:

- Add Moodle capabilities for support chat, ticket, supervisor, and restricted-category access.
- Add install/upgrade schema for support records, either as new tables or guarded extensions:
  - support conversation
  - support message or conversation-message bridge
  - support ticket
  - ticket event timeline
  - SLA policy
  - assignment group or queue
  - canned response
  - support audit
- Add indexes for workspace, student, requester, assignee, status, priority, category, SLA due dates, and last message time.
- Add workspace support settings:
  - feature toggles
  - allowed conversation types
  - student free-text policy
  - parent visibility default
  - category list
  - priority list
  - default routing
  - business hours
  - SLA defaults
  - retention policy placeholder
- Add helper library for:
  - resolving effective support policy
  - checking conversation access
  - checking ticket access
  - validating visibility
  - writing audit events
  - resolving parent/guardian links
  - resolving assigned teacher
  - resolving default queue
- Add SQL verification scripts for schema and policy defaults.

Deliverables:

- Support schema in Moodle install/upgrade lifecycle.
- Support settings page.
- Support capability definitions.
- Permission and policy helper library.
- Read-only schema verification SQL.

Exit criteria:

- Existing workspaces receive safe disabled or conservative defaults.
- Permission helpers block cross-workspace and unrelated student access.
- Support policy can be resolved for a workspace without UI errors.

Verification:

- Run Moodle upgrade/install checks in a test environment.
- Verify default settings for Quran Academy, EduForTomorrow, and one institution workspace.
- Negative tests for student, parent, teacher, and unrelated admin direct access.

## Phase 2: Asynchronous Conversation Foundation

Goal: support safe conversation creation and replies before ticket conversion exists.

Status: complete. Phase 2 added asynchronous support web services for starting, listing, opening, replying to, and marking support conversations read, backed by the existing communication thread/message/participant tables and support audit.

Tasks:

- Implement web services:
  - `local_prequran_support_start_conversation`
  - `local_prequran_support_send_message`
  - `local_prequran_support_mark_read`
  - `local_prequran_support_list_conversations`
  - `local_prequran_support_get_conversation`
- Support conversation types:
  - `student_helpdesk`
  - `student_teacher`
  - `parent_teacher`
- Store context metadata:
  - workspace
  - consumer
  - student
  - requester
  - parent/guardian when applicable
  - teacher when applicable
  - cohort/session/unit/lesson/route
  - device/browser/error metadata when available
- Enforce backend rules:
  - student can create only own support chats
  - parent can create only for linked child
  - student-to-teacher requires assigned teacher relationship
  - parent visibility is on by default for student-created support
  - no student-to-student chat path exists
- Add moderation checks for student free text:
  - block or flag URLs, emails, phone numbers, social handles, and unsafe content
  - support guided topic-only messages when free text is disabled
- Add conversation system events for create, assignment, transfer, and read markers where useful.
- Add safe notifications for new public replies.
- Add audit events for conversation create, message create, read, hide, report, and permission-denied attempts where practical.

Deliverables:

- Conversation web services.
- Server-side conversation permission checks.
- Message storage and audit.
- Basic safe notifications.
- Moderation/free-text guard.

Exit criteria:

- Student-help-desk, student-teacher, and parent-teacher conversations can be created and replied to.
- Students, parents, and teachers see only allowed conversations.
- Internal or restricted data is not returned by conversation APIs.

Verification:

- API smoke tests for all three conversation types.
- Negative direct-ID tests across student, parent, teacher, and workspace boundaries.
- Free-text policy tests for allowed, blocked, and topic-only messages.

## Phase 3: Basic User Chat Surfaces

Goal: expose the asynchronous conversation foundation in app UI with minimal operational complexity.

Status: complete. Phase 3 added a shared support panel, app/lesson help entry points, a Moodle-hosted support inbox page, and dashboard links for student, parent, teacher, and admin support access. The surface reuses the Phase 2 asynchronous conversation APIs and keeps ticket-only fields out of user chat views.

Tasks:

- Add contextual support entry points:
  - app header/help button
  - lesson page help button
  - recording/review help button
  - live session join/error help button
  - parent dashboard child support button
  - teacher workspace support button
- Add a lightweight chat panel:
  - conversation list
  - message timeline
  - compose box or guided topic selector
  - unread badge
  - participant labels
  - safe status/system events
  - parent-visible indicator where applicable
- Add teacher conversation inbox:
  - assigned student/parent chats
  - unread and last-message preview
  - basic filters by student, cohort, and type
- Add help desk conversation inbox:
  - unassigned/assigned/live conversation list
  - reply surface
  - basic assignment to current agent or queue
- Add responsive behavior for mobile and desktop.
- Add accessibility labels and keyboard-friendly message composition.

Deliverables:

- Student/parent chat panel.
- Teacher conversation inbox.
- Help desk conversation inbox.
- Context-aware entry points.

Exit criteria:

- Users can start and continue conversations from real app surfaces.
- Teachers and agents can reply without using admin/debug pages.
- UI does not expose SLA, private notes, restricted categories, or internal queue metadata to student/parent views.

Verification:

- Browser smoke tests for student, parent, teacher, agent, and admin roles.
- Mobile-width smoke test for launcher, message timeline, and compose controls.
- Manual parent visibility check for a student-created conversation.

## Phase 4: Ticket Schema Workflow And Conversion

Goal: let agents and teachers convert conversations into tracked tickets with lifecycle, assignment, and synchronized public replies.

Status: complete. Phase 4 added staff-facing ticket conversion and lifecycle web services, duplicate-safe conversation-to-ticket linking, ticket timeline events, synchronized public replies through linked conversation messages, staff-only internal note events, a capability-gated Convert to Ticket action on the support page, and `src/moodle/local_prequran/sql/verify_support_phase4.sql`. Dedicated status/reopen/close/internal-note endpoints were folded into `local_prequran_support_update_ticket` for this phase.

Tasks:

- Implement ticket web services:
  - `local_prequran_support_convert_to_ticket`
  - `local_prequran_support_list_tickets`
  - `local_prequran_support_get_ticket`
  - `local_prequran_support_update_ticket`
  - `local_prequran_support_change_ticket_status`
  - `local_prequran_support_add_internal_note`
  - `local_prequran_support_reopen_ticket`
  - `local_prequran_support_close_ticket`
- Add conversion UI:
  - Convert to Ticket action
  - required fields: priority, category, assignee/group, SLA, status
  - default values from conversation type, category, and current actor
  - duplicate detection when conversation already has linked ticket
- On conversion:
  - create ticket
  - attach complete public chat history to ticket timeline
  - link conversation to ticket
  - write conversion event to both timelines
  - preserve participant visibility
  - write audit event
- Implement ticket statuses:
  - open
  - assigned
  - waiting_for_user
  - in_progress
  - resolved
  - closed
- Implement public reply synchronization:
  - conversation public reply appears in ticket timeline
  - ticket public reply appears in conversation history
  - internal notes remain ticket-only and staff-only
  - resolved ticket reopens on requester reply according to policy
- Add ticket timeline UI for agents, teachers, and supervisors.

Deliverables:

- Ticket web services.
- Convert to Ticket UI.
- Ticket lifecycle.
- Public reply synchronization.
- Internal notes.
- Ticket timeline.

Exit criteria:

- A chat can be converted into a ticket with full history attached.
- Ticket lifecycle status changes are validated and audited.
- Public replies stay synchronized between ticket and conversation history.
- Internal notes never appear in student or parent views.

Verification:

- Convert each conversation type to a ticket.
- Confirm history attachment and conversion event in both places.
- Reply from conversation and confirm ticket timeline updates.
- Reply from ticket and confirm conversation history updates.
- Add internal note and confirm student/parent cannot see it.
- Negative tests for duplicate conversion and unauthorized status changes.

## Phase 5: SLA, Routing, Canned Replies, And Supervisor Operations

Goal: make the help desk operationally useful for daily queue management.

Status: complete. Phase 5 added default support queues, SLA policies, canned responses, queue/routing APIs, SLA refresh, canned-response management and send APIs, supervisor summary counts, and a scheduled `support_sla_monitor` task that writes SLA warning/breach/escalation events. See `src/moodle/local_prequran/sql/verify_support_phase5.sql`.

Tasks:

- Implement SLA calculation:
  - first response due
  - next response due
  - resolution due
  - business hours
  - waiting-for-user pause behavior
  - breach warning and breach events
- Add scheduled task for SLA warning/breach scanning.
- Add routing rules:
  - category-based queue
  - workspace/cohort/teacher routing
  - restricted category routing
  - manual transfer with reason
  - supervisor reassignment
- Add assignment groups/queues:
  - help desk
  - teacher support
  - finance/admin
  - safeguarding restricted
- Add canned responses:
  - category scoped
  - workspace scoped
  - staff-only management
  - variables for safe names and links
- Add supervisor dashboard:
  - open queues
  - at-risk SLA
  - breached tickets
  - unassigned tickets
  - restricted queue visibility for authorized users
- Add notifications for assignment, mention, SLA warning, SLA breach, and restricted escalation.

Deliverables:

- SLA engine and scheduled task.
- Routing/assignment rules.
- Canned response management.
- Supervisor dashboard.
- Operational notifications.

Exit criteria:

- New tickets receive a valid SLA due time.
- Tickets route to a sensible default queue.
- Supervisors can see and reassign at-risk work.
- Restricted tickets are visible only to authorized roles.

Verification:

- SLA tests across urgent, high, normal, and low priorities.
- Business-hours tests around weekends/holidays if configured.
- Routing tests for technical, lesson, billing, and safeguarding categories.
- Restricted-category negative access tests.

## Phase 6: Reports, Search, And Quality Review

Goal: give admins and supervisors visibility into support volume, performance, and recurring issues.

Status: complete. Phase 6 added ticket/message/user search, aggregate support reports, CSV export, requester satisfaction rating, quality review queue/review events, a Moodle `support_reports.php` page, and `src/moodle/local_prequran/sql/verify_support_phase6.sql`.

Tasks:

- Implement search:
  - conversation text
  - ticket number
  - student name/idnumber
  - parent name
  - teacher
  - category
  - status
  - assignee
  - workspace
- Add reports:
  - open tickets by status, priority, category, assignee, and workspace
  - SLA at-risk and breached tickets
  - first response time
  - resolution time
  - reopen rate
  - chat-to-ticket conversion rate
  - volume by entry point
  - teacher support workload
  - help desk agent workload
  - common issues by lesson/unit/session/page
- Add CSV export for authorized supervisors/admins.
- Add optional satisfaction rating after resolution.
- Add quality review view for sampled tickets and reported messages.

Deliverables:

- Support search page or panel.
- Supervisor/admin reports.
- CSV export.
- Satisfaction rating.
- Quality review queue.

Exit criteria:

- Supervisors can identify workload, SLA risk, and recurring issue categories.
- Exports respect workspace and restricted-category permissions.
- Search does not leak unrelated workspace or student data.

Verification:

- Report smoke tests with seeded tickets across categories/statuses.
- CSV export permission tests.
- Search negative tests across workspace and restricted category boundaries.

## Phase 7: Live Chat Real-Time Polish

Goal: add real-time behavior after the asynchronous and ticketing foundations are stable.

Status: complete. Phase 7 added a Moodle-compatible `local_prequran_support_live_poll` endpoint, near-real-time active conversation polling, unread refresh, live availability state, short-lived viewing/typing indicators, agent load metadata, graceful client fallback to Phase 2 endpoints, and `src/moodle/local_prequran/sql/verify_support_phase7.sql`.

Tasks:

- Decide transport strategy:
  - short polling first if simplest
  - Moodle-compatible polling endpoint
  - optional WebSocket/service worker enhancement later
- Add near-real-time updates:
  - new message polling
  - unread count refresh
  - active conversation refresh
  - assignment/status update refresh
- Add staff availability:
  - online
  - away
  - offline
  - business-hours status
  - fallback to asynchronous message
- Add typing indicators if transport supports it safely.
- Add collision indicators when another staff member is viewing or replying.
- Add queue limits to prevent one agent receiving too many simultaneous live chats.
- Add notification suppression during active live back-and-forth.

Deliverables:

- Real-time or near-real-time message refresh.
- Availability status.
- Typing/collision indicators where feasible.
- Chat load limits.

Exit criteria:

- Live chat feels responsive without requiring manual refresh.
- Offline/away states route users to asynchronous support.
- Real-time features do not bypass permission checks or leak hidden messages.

Verification:

- Multi-browser test with student and agent.
- Multi-agent collision test.
- Offline/away routing test.
- Polling load review on a test environment.

## Phase 8: Safety Hardening, Audit Review, And Pilot Launch

Goal: prove the feature is safe enough for a controlled production pilot.

Status: complete. Phase 8 added support audit/pilot readiness web services, a Moodle `support_audit.php` review page, auditable CSV report exports, pilot runbook and smoke checklist documents, workspace-scope rollout/rollback guidance, and `src/moodle/local_prequran/sql/verify_support_phase8.sql`.

Tasks:

- Review audit coverage for:
  - conversation create
  - message create
  - conversion
  - assignment
  - status change
  - priority/category change
  - internal note
  - moderation action
  - report
  - export
  - restricted-ticket access
- Add admin audit viewer or extend existing audit views.
- Add retention and purge policy hooks, with destructive purge disabled unless explicitly approved later.
- Add pilot feature flags by workspace and role.
- Add support runbook:
  - queue ownership
  - SLA expectations
  - restricted ticket handling
  - parent visibility rules
  - student free-text rules
  - escalation path
- Add smoke test checklist for release.
- Add rollback plan:
  - disable entry points
  - preserve existing records
  - stop real-time polling
  - keep admin read-only access
- Run pilot with selected workspace/cohort before wider rollout.

Deliverables:

- Audit coverage review.
- Admin audit/review view.
- Pilot runbook.
- Smoke test checklist.
- Rollback plan.
- Workspace pilot configuration.

Exit criteria:

- Feature can be enabled for one pilot workspace without exposing it globally.
- Admins can review support records and audit events.
- Rollback disables user entry points without deleting support history.

Verification:

- End-to-end pilot scenario:
  - student starts help desk chat
  - agent replies
  - agent converts to ticket
  - agent assigns and sets SLA
  - student replies
  - ticket moves through in progress, resolved, closed
  - parent-visible history is confirmed
- Negative pilot tests for unrelated parent, unrelated teacher, and unrelated workspace admin.
- Supervisor review of one reported message and one restricted ticket.

## Phase 9: Optional Enhancements

Goal: add advanced features only after the core support workflow is stable.

Candidate enhancements:

- Knowledge base suggestions before chat start.
- AI draft replies for staff approval only.
- Attachment support with malware scanning, file permissions, retention, and moderation.
- Email reply ingestion.
- WhatsApp handoff through approved template workflows.
- Advanced automation rules.
- Customer satisfaction trend reports.
- Support macros with guarded variable replacement.
- Public status page integration for widespread incidents.

Exit criteria:

- Each enhancement has a separate requirement and safety review.
- No optional enhancement weakens student safety, parent visibility, audit, or workspace isolation.

## Release Gates

Before production rollout beyond pilot:

- Schema install/upgrade verified on clean and existing Moodle sites.
- All new web services registered and permission-checked.
- Feature flags default to off or conservative behavior for existing workspaces.
- Student/parent/teacher/agent/admin browser smoke tests pass.
- Direct URL and guessed-ID negative tests pass.
- Internal notes verified hidden from student and parent views.
- Restricted category tests pass.
- SLA calculations verified for configured business hours.
- Notifications use safe message bodies.
- Audit events exist for all critical actions.
- Rollback plan tested in staging.

## Suggested Implementation Order

1. Phase 0 discovery and policy decisions.
2. Phase 1 schema, capabilities, and settings.
3. Phase 2 asynchronous conversation APIs.
4. Phase 3 user and staff conversation UI.
5. Phase 4 ticket conversion and lifecycle.
6. Phase 5 SLA, routing, and supervisor operations.
7. Phase 6 reports and search.
8. Phase 7 real-time polish.
9. Phase 8 pilot launch hardening.
10. Phase 9 optional enhancements only after pilot feedback.
