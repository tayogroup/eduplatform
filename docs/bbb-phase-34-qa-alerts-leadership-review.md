# Phase 34: QA Alerts & Leadership Review Workflow

## Goal

Phase 34 adds a leadership review layer for repeated or serious QA concerns. It helps admins move from “we noticed a pattern” to “this is being reviewed, tracked, and cleared.”

## What Was Added

- Leadership review fields on live sessions:
  - `leadership_review_status`
  - `leadership_review_reason`
  - `leadership_review_notes`
  - `leadership_reviewby`
  - `leadership_reviewat`
  - `leadership_clearedby`
  - `leadership_clearedat`
- Leadership review controls on the existing session QA page.
- Audit rows:
  - `leadership_review_flagged`
  - `leadership_review_updated`
  - `leadership_review_cleared`
- Live Operations leadership review queue.
- QA Analytics teacher-level alert patterns:
  - serious issue
  - low score trend
  - repeated coaching
  - overdue coaching
- QA Analytics leadership-open metric and Needs Attention column.

## Files To Upload

- `local/hubredirect/live_quality.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_quality_analytics.php`
- SQL scripts for reference:
  - `local/prequran/sql/alter_live_session_leadership_review.sql`
  - `local/prequran/sql/verify_live_leadership_review.sql`

## Database Step

Run:

- `alter_live_session_leadership_review.sql`

If a column already exists, skip that duplicate statement and verify with:

- `verify_live_leadership_review.sql`

## Test Steps

1. Run the Phase 34 ALTER SQL.
2. Open a session QA page:
   - `/local/hubredirect/live_quality.php?sessionid=1`
3. Set `Leadership Status` to `Flagged` or `In review`.
4. Add a leadership reason and note.
5. Save.
6. Open Live Operations and confirm the session appears in `Leadership Review Queue`.
7. Open QA Analytics and confirm:
   - `leadership open` metric updates
   - teacher alert labels appear for repeated QA concerns
8. Set the leadership status to `Cleared` and save.
9. Confirm audit rows with `verify_live_leadership_review.sql`.

## Notes

The teacher-level alert labels in QA Analytics are calculated from recent QA data. The persistent leadership review status is stored at the session level so the team can track and clear specific review cases cleanly.
