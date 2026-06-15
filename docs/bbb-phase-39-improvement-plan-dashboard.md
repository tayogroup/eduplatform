# Phase 39: Teacher Improvement Plan Dashboard & History

Phase 39 adds a dedicated admin view for teacher improvement plans.

## What Changed

- Added `/local/hubredirect/live_improvement_plans.php`.
- Admins can filter by date range, teacher, mentor, status, priority, and overdue status.
- The page shows:
  - open, assigned, in-progress, overdue, completed, due-soon, alert, and teacher metrics;
  - improvement plan history cards;
  - teacher-level improvement history;
  - recent improvement-plan audit rows.
- CSV export is available for leadership meetings.
- Navigation links were added from Operations, Leadership, and QA Analytics.

## Files

- `local/hubredirect/live_improvement_plans.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_leadership.php`
- `local/hubredirect/live_quality_analytics.php`
- `local/prequran/sql/verify_live_improvement_plan_dashboard.sql`

## Test

1. Open `/local/hubredirect/live_improvement_plans.php` as a site admin.
2. Confirm metrics load.
3. Filter by teacher ID and status.
4. Test `Overdue only`.
5. Export CSV.
6. Use the links to open Leadership case, QA review, Class review, and Teacher workspace.
7. Run `verify_live_improvement_plan_dashboard.sql` and confirm rows match the dashboard.
