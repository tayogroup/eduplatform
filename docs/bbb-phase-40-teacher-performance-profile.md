# Phase 40: Teacher Performance Profile

Phase 40 adds a focused admin profile for one teacher.

## What Changed

- Added `/local/hubredirect/live_teacher_profile.php?teacherid=36`.
- The profile shows:
  - session count and distinct students;
  - QA reviewed count and average QA score;
  - QA issues, open coaching, leadership cases, open improvement plans, overdue plans;
  - timeline of sessions, QA reviews, improvement plans, and key audit events;
  - recurring QA checklist concern patterns;
  - parent follow-up indicators;
  - session record table;
  - recent teacher-related audit history.
- CSV export is available for the teacher profile.

## Files

- `local/hubredirect/live_teacher_profile.php`
- `local/hubredirect/live_improvement_plans.php`
- `local/hubredirect/live_quality_analytics.php`
- `local/prequran/sql/verify_live_teacher_profile.sql`

## Test

1. Open `/local/hubredirect/live_teacher_profile.php?teacherid=36`.
2. Change the date range and reload.
3. Export CSV.
4. Confirm links to QA review and class review.
5. Run `verify_live_teacher_profile.sql` after replacing `36` with a real teacher user ID.
