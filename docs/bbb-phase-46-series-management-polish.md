# Phase 46: Series Management Polish & Edit Workflow

## Purpose

Phase 46 makes recurring live class series manageable after creation. Admins and assigned teachers can now update a series without manually editing SQL or recreating the schedule.

URL:

`/local/hubredirect/live_series.php`

## Added Workflow

- Edit series title, lesson ID, unit ID, class time, duration, teacher, and active student list.
- Apply edits to future sessions only.
- Preserve completed and cancelled session history.
- Cancel one future session inside a series.
- Cancel all future sessions in a series.
- Show clearer operational status:
  - `active`
  - `completed`
  - `partially cancelled`
  - `needs review`
  - `cancelled`

## Safety Behavior

- Non-admin teachers can only manage their own series.
- Teacher reassignment is admin-only.
- Future session participant lists are synced safely:
  - removed students are marked `removed`
  - new students are added as active participants
  - teacher participant rows are updated
- Historical attendance, notes, summaries, QA, and recordings remain untouched.

## Audit Actions

The workflow writes these audit actions:

- `series_updated`
- `series_session_updated`
- `series_single_session_cancelled`
- `series_cancelled`
- `session_cancelled`

## Upload Folders

Upload:

- `src/moodle/local_hubredirect/live_series.php`

Optional verification SQL:

- `src/moodle/local_prequran/sql/verify_live_series_management.sql`

## Test

1. Open `/local/hubredirect/live_series.php`.
2. Edit a recurring series title, lesson/unit, time, duration, or student IDs.
3. Save the series.
4. Confirm the success message shows future sessions updated.
5. Open `/local/hubredirect/live_sessions.php` and confirm future sessions reflect the changes.
6. Cancel one future session from the series page.
7. Run `verify_live_series_management.sql` in phpMyAdmin.
8. Confirm audit rows include `series_updated`, `series_session_updated`, and `series_single_session_cancelled` where applicable.

