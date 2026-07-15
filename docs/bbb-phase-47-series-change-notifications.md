# Phase 47: Series Change Notifications & Parent/Teacher Communication

## Purpose

Phase 47 makes recurring series edits visible to affected teachers and parents. Series edits, session cancellations, and future-series cancellations now trigger Moodle notifications using the existing Quraan Academy live-session notification provider.

## Updated Page

`/local/hubredirect/live_series.php`

## Notification Events

Teacher notifications:

- `series_teacher_updated`
- `series_teacher_reassigned`
- `series_teacher_assigned`
- `series_teacher_session_cancelled`
- `series_teacher_cancelled`

Parent notifications:

- `series_parent_schedule_updated`
- `series_parent_student_added`
- `series_parent_student_removed`
- `series_parent_session_cancelled`
- `series_parent_cancelled`

## Communication History

Each series card now shows recent communication audit rows:

- `notification_sent`
- `notification_failed`
- `notification_skipped`
- `series_change_notifications_processed`
- `series_cancel_notifications_processed`
- `series_single_cancel_notice`

This gives admin/teacher staff a quick operational view without opening phpMyAdmin.

## Safety Notes

- Parent wording is schedule-focused and child-safe.
- Private teacher notes are not included in notifications.
- Parent recipients are resolved through the existing guardian/communication mapping helper.
- Notification success, failure, and skipped states are audited.

## Upload Folders

Upload:

- `src/moodle/local_hubredirect/live_series.php`

Optional verification SQL:

- `src/moodle/local_prequran/sql/verify_live_series_notifications.sql`

## Test

1. Open `/local/hubredirect/live_series.php`.
2. Change a series time or duration and save.
3. Confirm the page reports notifications processed.
4. Confirm recent communication appears on the series card.
5. Cancel one future session and confirm notifications are processed.
6. Run `verify_live_series_notifications.sql` in phpMyAdmin.
7. Confirm audit rows show `notification_sent`, `notification_skipped`, or `notification_failed`.
