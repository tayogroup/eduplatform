# Phase 35: Admin Automation for Leadership Alerts

## Goal

Phase 35 makes the system automatically create leadership review cases when QA patterns cross risk thresholds.

## What Was Added

The existing scheduled task now detects and flags:

- Any session marked `serious_issue`.
- Any overdue QA coaching assignment.
- Teachers with average QA score below 75% across at least 2 reviewed sessions in the last 90 days.
- Teachers with at least 2 `needs_coaching` reviews in the last 90 days.

When triggered, the task:

- Sets `leadership_review_status = flagged`.
- Fills `leadership_review_reason`.
- Writes an audit row:
  - `leadership_review_auto_flagged`
- Notifies admins.
- Writes admin notification audit rows:
  - `leadership_review_admin_notified`
- Writes `leadership_review_auto_skipped` if a teacher pattern exists but no unflagged session is available.

## Files To Upload

- `local/prequran/classes/task/live_session_reminders.php`
- Optional verification reference:
  - `local/prequran/sql/verify_live_leadership_automation.sql`

## Database Changes

No new columns are required beyond Phase 34.

Required Phase 34 columns:

- `leadership_review_status`
- `leadership_review_reason`
- `leadership_review_notes`
- `leadership_reviewby`
- `leadership_reviewat`
- `leadership_clearedby`
- `leadership_clearedat`

## Test Steps

1. Confirm Phase 34 SQL is installed.
2. Upload `live_session_reminders.php`.
3. In Moodle, go to:
   - `Site administration > Server > Scheduled tasks`
4. Run:
   - `Live session reminders and follow-ups`
5. Open:
   - `/local/hubredirect/live_ops.php`
6. Confirm the Leadership Review Queue updates if qualifying QA risks exist.
7. Run:
   - `verify_live_leadership_automation.sql`

## Expected Audit Actions

- `leadership_review_auto_flagged`
- `leadership_review_auto_skipped`
- `leadership_review_admin_notified`
- `notification_sent`
- `notification_failed`
- `notification_skipped`

If no QA risks exist yet, the automation may correctly produce no new rows.
