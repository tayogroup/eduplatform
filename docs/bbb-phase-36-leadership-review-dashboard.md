# Phase 36: Leadership Review Dashboard & Case Management

## Goal

Phase 36 gives leadership and admins one clean workspace to manage QA leadership review cases created manually or automatically.

## What Was Added

- Dedicated admin page:
  - `local/hubredirect/live_leadership.php`
- Case filters:
  - date range
  - teacher ID
  - status
  - reason text
- Case management:
  - update status to `flagged`, `in_review`, or `cleared`
  - update leadership reason
  - update leadership notes
  - open the related QA page
  - open the class review page
- Dashboard metrics:
  - open cases
  - flagged
  - in review
  - cleared
  - serious QA
  - overdue coaching
- Recent leadership audit table.
- CSV export for leadership cases.
- Navigation links from:
  - Live Operations
  - QA Analytics
  - Session QA page
- Verification SQL:
  - `local/prequran/sql/verify_live_leadership_dashboard.sql`

## Files To Upload

- `local/hubredirect/live_leadership.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_quality_analytics.php`
- `local/hubredirect/live_quality.php`
- Optional verification reference:
  - `local/prequran/sql/verify_live_leadership_dashboard.sql`

## Database Changes

No new columns are required beyond Phase 34.

## Test Steps

1. Confirm Phase 34 columns exist.
2. Upload the PHP files.
3. Open:
   - `/local/hubredirect/live_leadership.php`
4. Filter by `Open cases`.
5. Open a case and change status to `In review`.
6. Add or update leadership notes.
7. Save.
8. Change the case to `Cleared` and save.
9. Run `verify_live_leadership_dashboard.sql` in phpMyAdmin.

Expected audit actions:

- `leadership_review_updated`
- `leadership_review_cleared`

If no leadership cases exist yet, run the Phase 35 scheduled task or manually flag a case from the QA page.
