# Phase 27: Follow-Up Notifications & Escalation Rules

This phase adds operational accountability to live-class follow-ups.

## What It Does

- Reuses the existing `live_session_reminders` scheduled task.
- Sends a parent reminder when an unresolved follow-up has been open for 2 days and no parent reply is detected.
- Sends a teacher reminder when a follow-up remains unresolved for 2 days.
- Escalates to admins when:
  - status is `admin_support_requested`, or
  - the follow-up remains unresolved for 3 days.
- Adds Live Operations metrics for overdue follow-ups.
- Adds audit rows:
  - `followup_parent_reminder_sent`
  - `followup_teacher_reminder_sent`
  - `followup_escalated_admin`

## Schedule

No new Moodle scheduled task is required. The existing task runs every 15 minutes:

```text
\local_prequran\task\live_session_reminders
```

## Test

1. Create a parent-visible follow-up.
2. Link it to a message thread using `Reply to follow-up` or `Message parent`.
3. For quick testing, temporarily set `followup_contactedat` to more than 2 days ago:

```sql
UPDATE mdlgx_local_prequran_live_note
SET followup_contactedat = UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 3 DAY))
WHERE sessionid = 1
  AND studentid = 50;
```

4. Run the scheduled task manually from Moodle:

```text
Site administration -> Server -> Tasks -> Scheduled tasks
```

5. Run:

```sql
src/moodle/local_prequran/sql/verify_live_followup_escalations.sql
```

## Safety Notes

- Reminder text is generic and does not include private teacher notes.
- Parent replies are detected through the existing `parent_teacher` communication thread.
- Admin escalations are audit-backed to avoid repeated escalation rows.
