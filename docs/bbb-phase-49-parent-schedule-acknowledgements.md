# Phase 49: Parent Schedule Acknowledgement & Read Receipts

## Purpose

Phase 49 closes the parent-trust loop for recurring class changes:

admin changes schedule -> parent is notified -> parent views change -> parent acknowledges -> academy can see the receipt.

## Database

Run:

`src/moodle/local_prequran/sql/phase49_live_acknowledgements.sql`

This creates:

`local_prequran_live_ack`

## Parent Experience

Page:

`/local/hubredirect/live_series_schedule.php?childid=STUDENT_ID`

Parents see an **Acknowledge schedule change** button when:

- the class is part of a recurring series
- that series has change history
- the parent is linked to the student
- the parent has not acknowledged the latest change yet

Once acknowledged, the page shows the acknowledgement timestamp.

## Staff Experience

Page:

`/local/hubredirect/live_series.php`

Staff can see acknowledgement counts per series and send acknowledgement reminders when parents have not acknowledged the latest change.

## Audit Actions

- `series_schedule_acknowledged`
- `series_ack_reminder_sent`
- `series_ack_reminder_skipped`

## Upload Folders

Upload:

- `src/moodle/local_hubredirect/live_series_schedule.php`
- `src/moodle/local_hubredirect/live_series.php`

SQL:

- `src/moodle/local_prequran/sql/phase49_live_acknowledgements.sql`
- `src/moodle/local_prequran/sql/verify_live_parent_acknowledgements.sql`

## Test

1. Run `phase49_live_acknowledgements.sql`.
2. Create or edit a recurring series so it has change history.
3. Log in as a linked parent.
4. Open `/local/hubredirect/live_series_schedule.php?childid=STUDENT_ID`.
5. Click **Acknowledge schedule change**.
6. Open `/local/hubredirect/live_series.php` as admin/teacher and confirm the acknowledgement count updates.
7. Run `verify_live_parent_acknowledgements.sql`.

