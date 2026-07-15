# Live Chat And Help Desk Requirements

Purpose: define the product and system requirements for a school-safe live chat and help desk system that can be implemented after the current communications foundation is stable.

The feature should combine LiveChat-style real-time support with a HelpDesk-style ticket lifecycle. It must serve students, parents, teachers, and support staff without becoming an unrestricted messaging network. Moodle communications remain the system of record for school-owned conversation history, permissions, audit, and parent-visible student support.

Reference model: LiveChat organizes the product around chat tools, messaging channels, chat archives, chat history, transcripts, routing rules, chat assignment, team management, reports, security, APIs, and a linked HelpDesk ticketing product. This requirement adapts those patterns for Quran Academy / PreQuran education workflows.

## Goals

- Give students, parents, teachers, and help desk staff a fast way to get help inside the app.
- Support three primary conversation paths: student to help desk, student to teacher, and parent to teacher.
- Let an agent or teacher convert any qualifying chat into a tracked ticket with full chat history attached.
- Keep replies synchronized so the conversation history and ticket timeline show the same support story.
- Preserve child safety, parent visibility, admin auditability, and workspace boundaries.
- Improve support operations with assignment, priority, category, SLA, status, reports, canned replies, and searchable history.
- Keep the first release practical by extending the existing communications model rather than introducing a separate unsupported inbox.

## Non-Goals For First Release

- Student-to-student chat.
- Unsupervised parent-to-student chat.
- Public visitor sales chat.
- Open social media inbox aggregation.
- Voice, video, screen sharing, and file attachments unless later approved by safeguarding and storage policy.
- AI auto-resolution that sends messages without human review.
- Full replacement of Moodle notifications, WhatsApp urgent alerts, or existing parent-teacher messaging.

## User Roles

- Student: learner account requesting help with lessons, login, technical access, schedule, or teacher clarification.
- Parent/Guardian: linked adult account communicating about a child.
- Teacher: assigned instructor for cohorts, classes, or individual learners.
- Help Desk Agent: support staff handling technical, account, scheduling, payment, or general platform issues.
- Help Desk Supervisor: agent with queue management, reassignment, SLA override, reporting, and quality review access.
- Admin: workspace or platform administrator with audit, configuration, and escalation authority.

## Conversation Types

### Student To Help Desk

Use for account access, technical problems, navigation help, lesson playback issues, recording upload issues, scheduling questions, and general support.

Requirements:

- Student can start a help desk chat from approved app surfaces.
- Chat must be linked to the student id, workspace, current page/context, and optionally unit, lesson, session, or error context.
- Parent visibility is on by default for student-created support conversations.
- Free text can be disabled by age, workspace, or consent policy.
- Younger students should receive guided topic choices before free text.
- Help desk agents can respond, assign, convert to ticket, transfer to teacher, or escalate to supervisor/admin.
- Agents cannot expose private internal notes to the student or parent.

### Student To Teacher

Use for lesson-specific questions, homework clarification, recitation review, feedback follow-up, or class/session questions.

Requirements:

- Student can message only assigned teachers for the relevant class/cohort/session.
- Parent visibility is on by default unless the workspace has a documented exception.
- Teacher availability controls should determine whether the student sees live chat, asynchronous message, or help request form.
- Teacher can convert the chat to a ticket when the issue needs tracking, escalation, SLA, or cross-team help.
- Teacher can transfer or escalate technical/account issues to help desk while keeping the student and parent conversation history intact.
- Admins can audit student-teacher conversations.

### Parent To Teacher

Use for child progress, attendance, schedule, homework, teacher feedback, class readiness, or parent follow-up.

Requirements:

- Parent can start a teacher chat only for linked children.
- Conversation must be child-contextual; every parent-teacher chat must have a student id.
- Parent can see teacher replies and ticket-linked replies that are marked parent-visible.
- Teacher can convert parent chat to a ticket for operations, academic follow-up, attendance, safeguarding, payment, or scheduling.
- Parent-to-teacher chat should integrate with the existing parent-teacher communication thread requirements.

## Chat Entry Points

The system should provide contextual chat entry points:

- App header/help button.
- Lesson page help button.
- Recording/review page help button.
- Live session join/error screen.
- Parent dashboard child support button.
- Teacher workspace student support button.
- Admin/help desk inbox.

Each entry point should pass context:

- `workspaceid`
- `consumerid`
- `studentid` when applicable
- `parentid` when applicable
- `teacherid` when directly addressed
- `cohortid` or class/session id when applicable
- current URL or app route
- unit/lesson/step id when applicable
- client device/browser metadata
- error code or failed action when applicable

## Chat Widget Requirements

The chat widget should feel lightweight and familiar:

- Collapsed launcher with unread badge.
- Expanded conversation view with message history.
- Clear participant identity: Help Desk, Teacher, Parent, or Student.
- Online/offline/away state.
- Typing indicator.
- Delivery/read state where appropriate.
- Topic/category selector before first message when configured.
- Canned reply support for agents and teachers.
- Rich system events such as `Assigned to Amina`, `Converted to ticket #1234`, or `Resolved`.
- Accessible keyboard navigation and screen-reader labels.
- Responsive layout for mobile and desktop.

The widget must avoid exposing internal fields such as SLA policy, private notes, supervisor comments, or hidden queue names to students and parents.

## Agent Inbox Requirements

Agents and teachers need an operational inbox modeled after modern live chat tools:

- Queue list for live, unassigned, assigned, waiting, escalated, and recently resolved chats.
- Left column: conversations and tickets with unread, status, priority, SLA, assignee, and last-message preview.
- Center column: active conversation timeline.
- Right column: student/parent/profile context, course/session context, ticket details, previous chats, and internal notes.
- Filters by assignment, status, category, priority, SLA breach risk, workspace, cohort, teacher, and channel.
- Search across conversation text, ticket id, student name/idnumber, parent name, teacher, category, and tags.
- Collision detection when multiple agents view or reply to the same conversation.
- Transfer chat to another agent, teacher, group, or queue.
- Supervisor can monitor queues and reassign work.

## Convert Chat To Ticket

When an agent or teacher clicks `Convert to Ticket`, the system creates a ticket from the chat.

Required behavior:

1. Entire chat history is attached to the ticket timeline.
2. Original conversation remains available in conversation history.
3. Ticket receives required fields: priority, category, assignee, SLA, and status.
4. Ticket is linked to the same student, parent, teacher, workspace, cohort, and source conversation.
5. A system event appears in both the chat and ticket timeline.
6. If the chat already has a ticket, the UI should show the linked ticket instead of creating a duplicate unless the user chooses `Create separate ticket`.
7. Conversion must preserve permissions: students and parents see only public messages and public status updates.
8. Internal notes before or after conversion must never appear in the student/parent conversation.

Minimum fields at conversion:

- `sourceconversationid`
- `studentid` when student-related
- `requesterid`
- `requesterrole`
- `subject`
- `description`
- `category`
- `priority`
- `assigneeid` or `assignmentgroupid`
- `sla_policy_id`
- `status`
- `visibility`
- `workspaceid`
- `timecreated`

Recommended conversion defaults:

- Status: `open` for new unassigned work, `assigned` when an assignee is selected.
- Priority: inferred from category and keywords, but editable before save.
- Category: prefilled from chat topic or selected by agent.
- SLA: derived from workspace, category, priority, role, and business-hours policy.
- Assignee: current agent by default for help desk chats; current teacher by default for teacher chats.

## Ticket Lifecycle

Supported statuses:

- `open`: ticket exists and needs triage or first response.
- `assigned`: ticket has a responsible person or group.
- `waiting_for_user`: progress is blocked until student, parent, teacher, or requester responds.
- `in_progress`: assignee is actively working on the issue.
- `resolved`: assignee believes the issue is solved and awaits closure window or confirmation.
- `closed`: support work is complete; ticket is locked from normal replies except reopen flow.

Required transitions:

- `open` to `assigned`
- `open` to `in_progress`
- `assigned` to `in_progress`
- `assigned` to `waiting_for_user`
- `in_progress` to `waiting_for_user`
- `waiting_for_user` to `in_progress` when requester replies
- `in_progress` to `resolved`
- `waiting_for_user` to `resolved` when a no-response policy allows closure
- `resolved` to `closed`
- `resolved` to `in_progress` when requester replies or agent reopens
- `closed` to `open` only through a controlled reopen action

Status rules:

- Every status change must be audited with actor, timestamp, old status, new status, and reason when required.
- `resolved` should not equal `closed`; closure can be automatic after a workspace-configured waiting period.
- `waiting_for_user` pauses or changes SLA timers only if the SLA policy allows it.
- `closed` tickets remain searchable and linked to the conversation history.

## Continue Conversation

Replies from either side must appear both in the ticket and in the conversation history.

Requirements:

- A student, parent, teacher, or agent reply in the conversation appends a public message to the linked ticket timeline.
- An agent or teacher public reply in the ticket appends the same message to the conversation history.
- Internal notes appear only in the ticket timeline for authorized staff.
- Status changes can generate public conversation events only when configured and safe.
- If a user replies to a `resolved` ticket, the ticket reopens to `in_progress` or `open` based on assignment policy.
- If a user replies to a `closed` ticket, the system should either create a follow-up ticket or reopen the original based on workspace policy.
- The timeline must avoid duplicate messages when sync retries occur.

## Ticket Categories

Recommended first-release categories:

- `technical_access`: login, password, app loading, device, browser, joining class.
- `lesson_help`: lesson content, alphabet unit, quiz, practice issue.
- `recording_review`: recording submission, playback, teacher review.
- `schedule_attendance`: class time, absence, make-up, recurring series.
- `teacher_feedback`: teacher clarification, homework, progress follow-up.
- `parent_follow_up`: parent question or response needed.
- `payment_billing`: tuition, invoice, payment access, finance hold.
- `safeguarding_concern`: child safety, inappropriate contact, urgent welfare concern.
- `account_profile`: name, guardian link, student profile, workspace access.
- `bug_report`: suspected platform defect.
- `other`: uncategorized support.

Category rules:

- `safeguarding_concern` must have restricted visibility, supervisor notification, and stronger audit.
- `payment_billing` visibility should be limited to parent/guardian and authorized staff, not students.
- `lesson_help` and `recording_review` should default to assigned teacher or teacher group.
- `technical_access` should default to help desk.

## Priority And SLA

Supported priorities:

- `urgent`: safety, live class blocked, account compromise, or same-day critical issue.
- `high`: class participation affected soon, parent response needed, repeated failure.
- `normal`: standard support issue.
- `low`: informational, enhancement, non-blocking question.

SLA requirements:

- First response target.
- Next response target.
- Resolution target.
- Business-hours calendar by workspace.
- Pause rules for `waiting_for_user`.
- Breach warning threshold.
- Breach event and escalation path.
- SLA override reason and audit.

Suggested default SLA targets:

- Urgent: first response 15 minutes during support hours, resolution/update 4 hours.
- High: first response 2 business hours, resolution/update 1 business day.
- Normal: first response 1 business day, resolution/update 3 business days.
- Low: first response 2 business days, resolution/update 5 business days.

## Assignment And Routing

Routing should support:

- Assignment to individual agent/teacher.
- Assignment to group or queue.
- Skills/category-based routing.
- Workspace/cohort/teacher ownership routing.
- Availability-based routing for live chat.
- Manual transfer with reason.
- Supervisor reassignment.
- Auto-assignment limit per agent to prevent overload.

Default routing:

- Student help desk chat: help desk queue.
- Student teacher chat: assigned teacher or teacher group.
- Parent teacher chat: assigned teacher or parent-teacher queue.
- Technical categories: help desk queue.
- Lesson/recording categories: teacher queue.
- Billing categories: finance/admin queue.
- Safeguarding categories: supervisor/admin restricted queue.

## Notifications

Notification channels should align with existing communication policy:

- In-app unread badges.
- Moodle notification.
- Email only if already permitted by workspace policy.
- WhatsApp only through the urgent parent alert workflow and template approval.

Notification requirements:

- Use safe notification bodies such as `New support reply` rather than full student details.
- Notify assignee when assigned or mentioned.
- Notify requester when a public reply is posted.
- Notify parent/guardian for student-created support where parent visibility is enabled.
- Notify supervisor on urgent, breached, or safeguarding tickets.
- Suppress duplicate notifications during rapid back-and-forth live chat.

## Permissions And Visibility

Backend rules must enforce:

- Students can access only their own chats and tickets.
- Parents can access only chats and tickets for linked children.
- Teachers can access student/parent chats only for students they teach or are assigned to.
- Help desk agents can access support chats/tickets in their workspace and allowed categories.
- Finance tickets are not visible to students by default.
- Safeguarding tickets are restricted to authorized roles only.
- Platform admins can support all workspaces but views must clearly label workspace and consumer.
- Direct URL access by guessed conversation id, ticket id, student id, or attachment id must fail outside permission scope.

Visibility levels:

- `public`: visible to requester and allowed participants.
- `parent_visible`: visible to linked parent/guardian and staff.
- `student_visible`: visible to student and staff; parent visibility may still apply by policy.
- `staff_only`: internal staff message/note.
- `restricted`: supervisor/admin-only category such as safeguarding.

## Safety And Moderation

Requirements:

- No student-to-student messaging.
- Student free text can be limited by age, consent, workspace, and feature flag.
- Student messages should be filtered for phone numbers, emails, social handles, URLs, and unsafe content.
- Allow users to report a message or ticket.
- Allow staff to hide a message from public view without hard-deleting it.
- Preserve immutable audit for message creation, edit/hide, report, assignment, status change, conversion, escalation, and export.
- Include admin review workflow for flagged content.
- Do not allow normal users to permanently delete chats, tickets, or messages.
- Attachments stay disabled until malware scanning, file retention, access control, and moderation rules are ready.

## Data Retention And Audit

The system should keep:

- Conversation record.
- Ticket record.
- Message timeline.
- Conversion event.
- Assignment history.
- Status history.
- SLA events.
- Internal notes.
- Notification attempts.
- Read receipts where needed.
- Audit log with actor, action, target, timestamp, IP/device when available, and details.

Retention policy should be configurable by workspace, but child-related support records should not be purged without admin policy and audit. Export and deletion workflows must respect legal, safeguarding, and institutional recordkeeping requirements.

## Reporting And Dashboards

Required reports:

- Open tickets by status, priority, category, assignee, and workspace.
- SLA at-risk and breached tickets.
- First response time.
- Resolution time.
- Reopen rate.
- Ticket volume by category and entry point.
- Live chat volume by hour/day.
- Agent workload and active chat count.
- Teacher support workload.
- Parent/student satisfaction rating after resolution.
- Conversion rate from chat to ticket.
- Common issues by lesson/unit/session/page.

Dashboards:

- Help desk queue dashboard.
- Teacher support dashboard.
- Supervisor SLA and escalation dashboard.
- Admin cross-workspace support dashboard.

## Configuration

Workspace/admin configuration should include:

- Enable/disable live chat.
- Enable/disable student-to-help-desk chat.
- Enable/disable student-to-teacher chat.
- Enable/disable parent-to-teacher chat.
- Student free-text policy.
- Parent visibility policy.
- Business hours and holidays.
- Agent/teacher availability schedule.
- Categories and routing rules.
- Priority rules.
- SLA policies.
- Canned responses.
- Satisfaction survey toggle.
- Retention policy.
- Restricted categories and roles.

## Data Model Requirements

The implementation can extend the existing `local_prequran_comm_*` tables or add related help desk tables. Requirements are expressed conceptually here; exact Moodle XMLDB table names can be finalized during implementation planning.

### Conversation

Purpose: real-time/asynchronous chat container.

Fields:

- `id`
- `type`: `student_helpdesk`, `student_teacher`, `parent_teacher`
- `workspaceid`
- `consumerid`
- `studentid`
- `requesterid`
- `requesterrole`
- `teacherid`
- `cohortid`
- `status`: `active`, `waiting`, `resolved`, `closed`, `admin_review`
- `linkedticketid`
- `lastmessageat`
- `timecreated`
- `timemodified`

### Conversation Message

Purpose: immutable chat message or system event.

Fields:

- `id`
- `conversationid`
- `ticketid`
- `senderid`
- `senderrole`
- `messagekind`: `text`, `template`, `system`, `status_event`
- `body`
- `visibility`
- `status`: `visible`, `hidden`, `flagged`, `removed_by_admin`
- `moderationflags`
- `timecreated`
- `timemodified`

### Ticket

Purpose: tracked support work item.

Fields:

- `id`
- `ticketnumber`
- `sourceconversationid`
- `workspaceid`
- `consumerid`
- `studentid`
- `requesterid`
- `requesterrole`
- `subject`
- `description`
- `category`
- `priority`
- `status`
- `assigneeid`
- `assignmentgroupid`
- `sla_policy_id`
- `sla_first_response_due`
- `sla_next_response_due`
- `sla_resolution_due`
- `resolvedat`
- `closedat`
- `timecreated`
- `timemodified`

### Ticket Event

Purpose: append-only ticket timeline.

Fields:

- `id`
- `ticketid`
- `conversationid`
- `messageid`
- `actorid`
- `eventtype`: `created`, `converted`, `message`, `internal_note`, `assigned`, `status_changed`, `priority_changed`, `category_changed`, `sla_warning`, `sla_breached`, `resolved`, `closed`, `reopened`
- `visibility`
- `oldvalue`
- `newvalue`
- `body`
- `timecreated`

### SLA Policy

Purpose: workspace-configured response and resolution rules.

Fields:

- `id`
- `workspaceid`
- `name`
- `category`
- `priority`
- `business_hours_calendar_id`
- `first_response_minutes`
- `next_response_minutes`
- `resolution_minutes`
- `pause_on_waiting_for_user`
- `breach_warning_minutes`
- `escalationgroupid`
- `enabled`

## Web Service Requirements

Read functions:

- `local_prequran_support_list_conversations`
- `local_prequran_support_get_conversation`
- `local_prequran_support_list_tickets`
- `local_prequran_support_get_ticket`
- `local_prequran_support_get_queue_summary`
- `local_prequran_support_get_agent_dashboard`
- `local_prequran_support_search_history`

Write functions:

- `local_prequran_support_start_conversation`
- `local_prequran_support_send_message`
- `local_prequran_support_mark_read`
- `local_prequran_support_assign_conversation`
- `local_prequran_support_convert_to_ticket`
- `local_prequran_support_update_ticket`
- `local_prequran_support_add_internal_note`
- `local_prequran_support_change_ticket_status`
- `local_prequran_support_reopen_ticket`
- `local_prequran_support_close_ticket`
- `local_prequran_support_report_message`

Each write function must validate workspace, role, relationship to student, participant permissions, visibility, and category restrictions server-side.

## UI Requirements By Role

### Student

- Open support from contextual help entry points.
- Choose topic/category when configured.
- Send allowed message types.
- See replies, status, and safe system events.
- Continue conversation after conversion to ticket.
- See parent-visible indication when applicable.

### Parent

- Start parent-teacher chat for linked child.
- View child-related support conversations when parent visibility applies.
- Reply to public ticket conversations.
- See safe ticket status such as `Open`, `Waiting for your reply`, `In progress`, `Resolved`, `Closed`.
- Confirm resolution or request follow-up.

### Teacher

- View assigned student/parent chats.
- Reply with canned responses.
- Convert chat to ticket.
- Assign or escalate to help desk/admin.
- Add internal note.
- See relevant student lesson/session context.
- Track unresolved support follow-ups.

### Help Desk Agent

- Work live chat queue.
- Convert chats to tickets.
- Assign, categorize, prioritize, and update status.
- Add internal notes.
- Use canned responses and search prior tickets.
- See SLA timers and breach warnings.
- Continue conversation from ticket timeline.

### Supervisor/Admin

- Configure categories, priorities, routing, and SLA.
- Monitor queues.
- Reassign tickets.
- Review audit and reported messages.
- Access restricted dashboards based on role.
- Export reports.

## Acceptance Criteria

- A student can start a help desk chat and receive replies in the same conversation.
- A student can start a teacher chat only with an assigned teacher.
- A parent can start a teacher chat only for a linked child.
- An agent can convert a chat to a ticket with full chat history attached.
- Conversion requires priority, category, assignee or group, SLA, and status.
- The linked ticket and original conversation both show the conversion event.
- A public ticket reply appears in the conversation history.
- A conversation reply appears in the ticket timeline.
- Internal notes do not appear to students or parents.
- Ticket statuses support `open`, `assigned`, `waiting_for_user`, `in_progress`, `resolved`, and `closed`.
- Replies to `resolved` tickets reopen the ticket according to policy.
- Permission checks block direct access to unrelated student, parent, teacher, workspace, or restricted tickets.
- SLA due times are calculated from priority, category, and workspace business hours.
- Reports show open volume, SLA risk, first response time, resolution time, and conversion rate.
- Audit records exist for conversion, replies, assignments, status changes, priority changes, category changes, reports, and moderation actions.

## Phase Recommendation

### Phase 1: Safe Foundation

- Asynchronous chat for student-help-desk, student-teacher, and parent-teacher.
- Conversation history, permissions, parent visibility, audit, and notifications.
- Agent/teacher inbox with assignment and basic filters.

### Phase 2: Ticket Conversion

- Convert chat to ticket.
- Ticket lifecycle.
- Public reply synchronization.
- Internal notes.
- Priority, category, assignee, SLA, and status.

### Phase 3: Operations

- Routing rules.
- SLA breach escalation.
- Canned responses.
- Supervisor dashboard.
- Reports and export.

### Phase 4: Live Chat Polish

- Real-time typing/presence.
- Availability schedule.
- Chat limits.
- Satisfaction rating.
- Advanced search and history.

### Phase 5: Optional Enhancements

- Knowledge base suggestions.
- AI draft responses for staff review.
- Attachments with scanning and retention controls.
- Approved external channels such as email or WhatsApp handoff.
