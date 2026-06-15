# Phase 45: Guided Recurring Class Series Wizard

## Purpose

This phase adds an admin-facing guided wizard for creating recurring BigBlueButton live class series without manually filling the full live-session form.

URL:

`/local/hubredirect/live_series_wizard.php`

## Workflow

1. Choose a teacher.
2. Enter student Moodle user IDs.
3. Set the series title, target lesson ID, and target unit ID.
4. Set the first date, time, duration, recurrence pattern, session count, optional end date, and selected weekdays.
5. Confirm recording policy.
6. Preview all generated session dates and conflicts before creating the series.

The final submit reuses the existing recurring-session creation path in:

`/local/hubredirect/live_sessions.php`

## Safety Behavior

- Only site administrators can use the guided recurring series wizard.
- BBB secrets remain server-side.
- The wizard previews schedule conflicts before creation.
- If conflicts exist, the admin must explicitly choose conflict override and provide an override reason.
- Creation from the wizard writes `series_created_from_wizard` to the live audit table.

## Upload Folders

Upload:

- `src/moodle/local_hubredirect/live_series_wizard.php`
- `src/moodle/local_hubredirect/live_sessions.php`
- `src/moodle/local_hubredirect/live_ops.php`
- `src/moodle/local_hubredirect/live_series.php`
- `src/moodle/local_hubredirect/live_capacity.php`

Optional verification SQL:

- `src/moodle/local_prequran/sql/verify_live_series_wizard.sql`

## Test

1. Open `/local/hubredirect/live_series_wizard.php` as a site admin.
2. Select a teacher.
3. Enter one or more student user IDs.
4. Enter a lesson and unit.
5. Choose a weekly or selected-weekday recurrence.
6. Preview the generated classes.
7. Create the recurring series.
8. Open `/local/hubredirect/live_series.php` and confirm the new series appears.
9. Open `/local/hubredirect/live_sessions.php` and confirm the generated sessions appear.
10. Run `verify_live_series_wizard.sql` in phpMyAdmin and confirm `series_created_from_wizard` appears in audit rows.

