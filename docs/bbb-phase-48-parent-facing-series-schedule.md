# Phase 48: Parent-Facing Series Schedule & Change History

## Purpose

Phase 48 gives parents and students a clean recurring-class view after schedule changes and notifications are introduced.

URL:

`/local/hubredirect/live_series_schedule.php`

## Features

- Shows recurring live classes grouped by series.
- Shows upcoming and recent sessions within each series.
- Includes cancelled session indicators.
- Shows teacher, lesson ID, unit ID, and class time.
- Shows parent-safe change history without raw audit details.
- Shows class join button during the valid join window.
- Links to parent-visible summaries and approved recordings.
- Supports parent, managed-student, teacher, and admin access using the same child-access rules as the live schedule.

## Parent Safety

The page hides:

- private teacher notes
- raw audit JSON
- admin-only QA details
- internal notification failure payloads

Change history is translated into simple labels such as:

- Schedule updated
- One class cancelled
- Future classes cancelled
- Family notification processed

## Updated Navigation

Added links from:

- `/local/hubredirect/live_schedule.php`
- `/local/hubredirect/dashboard.php`

## Upload Folders

Upload:

- `src/moodle/local_hubredirect/live_series_schedule.php`
- `src/moodle/local_hubredirect/live_schedule.php`
- `src/moodle/local_hubredirect/dashboard.php`

Optional verification SQL:

- `src/moodle/local_prequran/sql/verify_live_parent_series_schedule.sql`

## Test

1. Log in as a parent with a linked student.
2. Open `/local/hubredirect/live_series_schedule.php?childid=STUDENT_ID`.
3. Confirm recurring classes are grouped by series.
4. Confirm cancelled sessions show as cancelled.
5. Confirm private teacher notes are not visible.
6. Confirm parent-visible summaries and recordings link only when available.
7. Run `verify_live_parent_series_schedule.sql` in phpMyAdmin to compare the rows.

