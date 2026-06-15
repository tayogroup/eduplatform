# Communications Implementation Plan

This plan adds safe communications for teachers, parents, and students without turning the Qur'aan app into an open chat network. The first release should focus on announcements and teacher-parent messaging; student messaging can be added later as supervised, parent-visible help requests.

## Product Scope

### Phase 1: Announcements

Use one-way announcements for class reminders, lesson notices, due dates, schedule changes, and general school communication.

Rules:

- Admins and teachers can send announcements.
- Announcements can target a cohort/class, one student family, or all families in a cohort.
- Parents and students can read only announcements targeted to them.
- Replies are disabled in the announcement thread. If replies are needed, the UI opens a private teacher-parent thread.

### Phase 2: Teacher-Parent Messaging

Use private threads linked to one student.

Rules:

- A thread has one student context.
- Teachers can message parents/guardians for students in their cohort.
- Parents/guardians can message assigned teachers only for their linked child.
- Students do not see parent-teacher threads.
- Admins can audit school-owned threads.
- Messages cannot be hard-deleted by normal users.

### Phase 3: Student Help Requests

Use structured, supervised messages instead of open chat.

Rules:

- Students can send a small set of help-request types to their assigned teacher.
- Examples: `I need help`, `I practiced today`, `Please review my recording`, `I do not understand this lesson`.
- Parent/guardian visibility is on by default.
- Free text is optional and should be disabled for younger students.
- Students cannot message other students.

## Privacy And Safety Requirements

Build these as backend rules, not only UI choices:

- No student-to-student private messaging.
- No direct parent-to-student messaging except a parent viewing or supporting their own child account.
- Student-created messages are parent-visible by default.
- All student communication is linked to a teacher, cohort, and student id.
- Do not expose email addresses, phone numbers, or personal contact details in app UI.
- Filter or block URLs, email addresses, phone numbers, and social handles in student free text.
- Include `report`, `hide`, and `admin_review` workflows.
- Store audit events for message creation, edits, reports, status changes, and moderation actions.
- Use short notification text such as `New message from your teacher`, not message bodies or student details.
- Keep attachments disabled until moderation and storage rules are ready.

## Moodle Data Model

Create these Moodle tables under the `local_prequran` plugin. Use Moodle XMLDB for production install/upgrade, and keep optional SQL helpers in `src/moodle/local_prequran/sql/` for manual deployments.

### `local_prequran_comm_thread`

Purpose: one conversation or announcement container.

Fields:

- `id`
- `type`: `announcement`, `parent_teacher`, `student_help`
- `cohortid`
- `studentid`: nullable for cohort-wide announcements
- `createdby`
- `status`: `active`, `archived`, `locked`, `admin_review`
- `subject`
- `lastmessageat`
- `timecreated`
- `timemodified`

Indexes:

- `(cohortid, type, status)`
- `(studentid, type, status)`
- `(lastmessageat)`

### `local_prequran_comm_participant`

Purpose: explicit allow-list for who can read/write a thread.

Fields:

- `id`
- `threadid`
- `userid`
- `role`: `teacher`, `parent`, `student`, `admin`
- `canreply`
- `lastreadmessageid`
- `muted`
- `timecreated`
- `timemodified`

Indexes:

- unique `(threadid, userid)`
- `(userid, threadid)`

### `local_prequran_comm_message`

Purpose: immutable message record.

Fields:

- `id`
- `threadid`
- `senderid`
- `studentid`
- `messagekind`: `text`, `template`, `system`
- `body`
- `templatekey`
- `status`: `visible`, `hidden`, `flagged`, `removed_by_admin`
- `moderationflags`
- `timecreated`
- `timemodified`

Indexes:

- `(threadid, timecreated)`
- `(studentid, timecreated)`
- `(status, timecreated)`

### `local_prequran_comm_audit`

Purpose: append-only safety log.

Fields:

- `id`
- `threadid`
- `messageid`
- `actorid`
- `action`: `created`, `reported`, `hidden`, `restored`, `locked`, `read`
- `details`
- `timecreated`

Indexes:

- `(threadid, timecreated)`
- `(messageid, timecreated)`
- `(actorid, timecreated)`

### `local_prequran_comm_consent`

Purpose: record guardian consent and student messaging policy.

Fields:

- `id`
- `studentid`
- `guardianid`
- `student_messaging_enabled`
- `free_text_enabled`
- `parent_visible`
- `consent_source`
- `timecreated`
- `timemodified`

Indexes:

- unique `(studentid, guardianid)`
- `(guardianid)`

## Permission Model

Add helper methods to `externallib_v4.php`:

- `pq_comm_is_admin($userid)`
- `pq_comm_is_teacher_for_cohort($userid, $cohortid)`
- `pq_comm_is_student_in_cohort($studentid, $cohortid)`
- `pq_comm_get_guardian_ids($studentid)`
- `pq_comm_is_guardian_for_student($guardianid, $studentid)`
- `pq_comm_can_read_thread($userid, $threadid)`
- `pq_comm_can_reply_thread($userid, $threadid)`
- `pq_comm_validate_student_message($studentid, $body)`

Minimum rules:

- Admin can read and moderate all communication.
- Teacher can create/read/reply in threads for cohorts they belong to.
- Parent can read/reply only in threads where they are an explicit participant for their child.
- Student can read/reply only in `student_help` threads where they are the student participant and consent allows it.
- Participant rows must be checked before returning messages.

Guardian linking should use the existing Moodle source of truth if available. If the current parent relationship only exists in the hub redirect payload, move that relationship into Moodle storage before enabling parent messaging.

## Web Service Functions

Register these in `src/moodle/local_prequran/services.php`.

### Read

- `local_prequran_comm_list_threads`
  - Input: `cohortid`, `studentid`, `type`, `limit`, `before`
  - Output: thread summaries with unread counts.

- `local_prequran_comm_get_thread`
  - Input: `threadid`, `limit`, `before`
  - Output: thread metadata, participants, messages.

- `local_prequran_comm_get_consent`
  - Input: `studentid`
  - Output: consent and messaging policy.

### Write

- `local_prequran_comm_create_announcement`
  - Input: `cohortid`, optional `studentid`, `subject`, `body`
  - Permission: admin or cohort teacher.

- `local_prequran_comm_create_parent_thread`
  - Input: `cohortid`, `studentid`, `subject`, initial `body`
  - Permission: admin, cohort teacher, or guardian for that student.

- `local_prequran_comm_create_student_help`
  - Input: `cohortid`, `studentid`, `templatekey`, optional `body`
  - Permission: student for self, only if consent allows.

- `local_prequran_comm_send_message`
  - Input: `threadid`, `body`, optional `templatekey`
  - Permission: participant with `canreply = 1`.

- `local_prequran_comm_mark_read`
  - Input: `threadid`, `messageid`
  - Permission: participant.

- `local_prequran_comm_report_message`
  - Input: `messageid`, `reason`
  - Permission: participant.

- `local_prequran_comm_moderate_message`
  - Input: `messageid`, `status`, `note`
  - Permission: admin or configured moderator.

- `local_prequran_comm_set_consent`
  - Input: `studentid`, `guardianid`, policy fields
  - Permission: admin, or guardian for own child where allowed by school policy.

## Frontend Implementation

Add a small communication client to the static app shell:

- `src/shared/js/shared-communications-api.js`
- `src/shared/js/shared-communications-panel.js`
- `src/shared/css/communications.css`

Initial UI:

- Header icon showing unread count.
- Inbox panel with tabs: `Announcements`, `Messages`, `Help`.
- Thread detail view.
- Reply composer for parent/teacher threads.
- Student help request buttons for student mode.
- Report button on each message.

Do not show communication controls until the Moodle launch payload provides enough context:

- `userid`
- `role` or role hints
- `cohortid`
- `studentid` when relevant
- Moodle web-service token

If context is missing, hide the panel rather than guessing.

## Moderation Controls

Start with deterministic filters:

- Block likely phone numbers.
- Block email addresses.
- Block URLs.
- Block common social handles.
- Limit message body length.
- Rate-limit student sends.

Recommended first limits:

- Student help request: 5 per hour.
- Parent/teacher messages: 60 per hour.
- Announcement creation: 20 per day per teacher.
- Message length: 1,000 characters for adults, 200 characters for students.

Flagged student messages should either be rejected with a gentle error or saved as `flagged` and hidden until reviewed. For younger students, prefer templates only.

## Deployment Steps

1. Create XMLDB install/upgrade definitions for the five communication tables.
2. Add Moodle capabilities for communication read/write/moderate actions.
3. Add backend permission helpers.
4. Add `list_threads` and `get_thread`.
5. Add announcement creation and display.
6. Add teacher-parent threads.
7. Add read receipts and unread counts.
8. Add report/moderation workflow.
9. Add consent/policy controls.
10. Add student help request flow.
11. Add browser/UI tests for role-based visibility.
12. Add backend tests for permission enforcement.

## Acceptance Criteria

Phase 1 is ready when:

- A teacher can send an announcement to a cohort.
- Parents/students in that cohort can read the announcement.
- Users outside the cohort cannot read it, even by direct API call.
- Notifications do not include message bodies.
- Admin can audit created announcement events.

Phase 2 is ready when:

- A teacher can create a parent thread for a student in their cohort.
- The linked parent can reply.
- The student cannot see the thread.
- A different parent cannot access the thread by guessing the thread id.
- Admin can hide/report/review messages.

Phase 3 is ready when:

- A student can send only approved help requests.
- Parent visibility is enabled.
- Free text follows consent and age policy.
- Student-to-student messaging is impossible at the database/API layer.

## Recommendation

Implement Phase 1 and Phase 2 before building student-facing messaging. This gives the app useful communication quickly while keeping the child-safety surface small and auditable.

For urgent child-related parent contact, use the WhatsApp alert extension in `docs/parent-whatsapp-urgent-alerts.md`. That path keeps the in-app communication thread as the official record and uses WhatsApp only as an optional rapid delivery channel.
