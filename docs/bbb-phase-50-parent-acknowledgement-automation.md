# Phase 50: Parent Acknowledgement Reminder Automation

This phase automates follow-up for parent schedule acknowledgements after recurring live class series changes.

## What Changed

- The existing Moodle scheduled task `\local_prequran\task\live_session_reminders` now also checks parent schedule acknowledgement receipts.
- If a parent has not acknowledged a parent-visible series schedule change after 24 hours, the task sends an automatic reminder.
- If the acknowledgement is still missing after 3 days, the task notifies administrators.
- The automation uses the Phase 49 table `local_prequran_live_ack`.

## Audit Actions

The automation writes these audit rows:

- `series_ack_auto_reminder_sent`
- `series_ack_auto_reminder_skipped`
- `series_ack_escalated_admin`

Moodle notification delivery still writes the existing notification audit rows:

- `notification_sent`
- `notification_failed`
- `notification_skipped`

## Files To Upload

- `local/prequran/classes/task/live_session_reminders.php`
- `local/prequran/sql/verify_live_parent_acknowledgement_automation.sql`

## Test Steps

1. Confirm Phase 49 SQL has already been run and `mdlgx_local_prequran_live_ack` exists.
2. Make a parent-visible recurring series change from `/local/hubredirect/live_series.php`.
3. Confirm the parent can see the acknowledgement button on `/local/hubredirect/live_series_schedule.php?childid=STUDENT_ID`.
4. For testing, you may temporarily set an old audit `timecreated` value for the series change or wait 24 hours.
5. Run Moodle cron or wait for the scheduled task.
6. Run `verify_live_parent_acknowledgement_automation.sql`.

Expected result:

- Pending parent receipts are tracked in `local_prequran_live_ack`.
- Reminder audit rows appear after the reminder window.
- Admin escalation audit rows appear after the escalation window if still unacknowledged.

