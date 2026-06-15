# Phase 33: QA Analytics & Teacher Performance Trends

## Goal

Phase 33 turns the live-class QA and coaching records into a leadership view for teacher development and quality monitoring.

## What Was Added

- Dedicated admin page:
  - `local/hubredirect/live_quality_analytics.php`
- Teacher QA performance table:
  - sessions
  - reviewed sessions
  - average QA score
  - pass rate
  - QA issues
  - open/completed/overdue coaching
- Monthly QA trend table.
- Common checklist concern analysis.
- Needs-attention list for low scores, serious issues, and overdue coaching.
- CSV export for teacher QA trends.
- Navigation links from:
  - `live_ops.php`
  - `live_reports.php`
- Verification SQL:
  - `local/prequran/sql/verify_live_quality_analytics.sql`

## Files To Upload

- `local/hubredirect/live_quality_analytics.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_reports.php`
- Optional verification reference:
  - `local/prequran/sql/verify_live_quality_analytics.sql`

## Database Changes

No new database columns are required. This phase depends on Phase 30 and Phase 31 columns:

- `qa_status`
- `qa_score`
- `qa_checklist`
- `qa_reviewedat`
- `qa_coaching_status`
- `qa_coaching_due_date`

## Test Steps

1. Upload the PHP files.
2. Open:
   - `/local/hubredirect/live_quality_analytics.php`
3. Confirm the page loads as an admin.
4. Try filtering by date and teacher ID.
5. Click `Export teacher trends CSV`.
6. Run `verify_live_quality_analytics.sql` in phpMyAdmin.

If there are not many reviewed QA sessions yet, the page may show low or empty trend data. That is expected until more QA reviews are completed.
