# BBB Phase 11: Scheduled Reminders and Follow-ups

This phase adds a Moodle scheduled task:

- class: `local_prequran\task\live_session_reminders`
- file: `src/moodle/local_prequran/classes/task/live_session_reminders.php`
- schedule: every 15 minutes

## Automated Events

- 24-hour live class reminders for teacher, student account, and linked parents
- 1-hour live class reminders for teacher, student account, and linked parents
- teacher follow-up after class if attendance or notes are incomplete
- admin follow-up if no post-session review has been saved after 24 hours

## Duplicate Prevention

The task writes action rows into `local_prequran_live_audit`:

- `live_reminder_24h_sent`
- `live_reminder_1h_sent`
- `live_followup_teacher_sent`
- `live_followup_admin_sent`

Those rows prevent repeat reminders for the same session and recipient.

## Verification

After deploying:

1. Upload `db/tasks.php`.
2. Upload `classes/task/live_session_reminders.php`.
3. Upload the updated `notificationlib.php`, language file, and version file.
4. Visit Moodle Site administration -> Notifications.
5. Purge caches.
6. Run Moodle cron.

Then run:

```sql
source src/moodle/local_prequran/sql/verify_live_reminders.sql
```
