# Phase 32: Automated QA & Coaching Reminders

## Goal

Phase 32 makes the existing Moodle scheduled task watch the live-class QA workflow automatically, so admins do not have to manually check every completed session or overdue coaching item.

## What Was Added

- Automated admin reminders for completed sessions that still need QA review.
- Automated teacher reminders for active QA coaching assignments.
- Automated admin escalation for overdue QA coaching.
- Session-level audit rows when coaching becomes overdue.
- A Live Operations metric for QA/coaching reminder activity in the last 7 days.
- A verification SQL script for phpMyAdmin checks.

## Files To Upload

- `local/prequran/classes/task/live_session_reminders.php`
- `local/hubredirect/live_ops.php`
- Optional verification script reference:
  - `local/prequran/sql/verify_live_quality_reminders.sql`

## Cron Task

No new scheduled task is required. Phase 32 uses the existing task:

- `\local_prequran\task\live_session_reminders`
- Moodle label: `Live session reminders and follow-ups`

This task already runs every 15 minutes if Phase 11 is installed.

## Reminder Rules

QA review reminders:

- Session is not cancelled.
- Session ended between 1 and 14 days ago.
- `qa_status = 'not_reviewed'` or `qa_reviewedat = 0`.
- Each admin receives at most one `quality_review_reminder_sent` audit row per session.

Teacher coaching reminders:

- `qa_coaching_status` is `assigned` or `acknowledged`.
- Teacher is reminded when coaching is assigned, due within 1 day, or overdue.
- Each teacher receives at most one `quality_coaching_teacher_reminder_sent` audit row per session.

Admin escalation:

- Coaching has a due date in the past.
- A session-level `quality_coaching_overdue` audit row is written once.
- Each admin receives at most one `quality_coaching_admin_escalated` audit row per session.

## Testing

1. Upload the updated files.
2. In Moodle, go to `Site administration > Server > Scheduled tasks`.
3. Run `Live session reminders and follow-ups`.
4. Open Live Operations and confirm `QA reminders 7d` changes if reminders were sent.
5. In phpMyAdmin, run `verify_live_quality_reminders.sql`.

Expected audit actions:

- `quality_review_reminder_sent`
- `quality_coaching_teacher_reminder_sent`
- `quality_coaching_admin_escalated`
- `quality_coaching_overdue`

If there are no old unreviewed sessions or overdue coaching assignments, the verification queries may correctly return zero rows.
