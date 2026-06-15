# Phase 42: Admin Teacher Directory & Profile Finder

Phase 42 adds an admin page for finding teachers and opening their live-class performance profile without manually looking up user IDs.

## What Changed

- Added `/local/hubredirect/live_teacher_directory.php`.
- Directory shows:
  - teacher name, user ID, and email;
  - session count, distinct students, upcoming sessions;
  - QA reviewed count, QA coverage, average QA score, and pass rate;
  - QA issues and serious issues;
  - open coaching, improvement plans, leadership cases, and parent follow-ups;
  - last class and last QA review.
- Filters:
  - all teachers;
  - needs attention;
  - has open plan;
  - low QA score;
  - no recent QA;
  - open follow-up;
  - leadership case;
  - open coaching;
  - no class in 30 days.
- Search by name, email, or teacher user ID.
- Quick links to:
  - Teacher Profile;
  - Teacher Workspace;
  - QA Analytics;
  - Improvement Plans.
- CSV export for the filtered directory.

## Files

- `local/hubredirect/live_teacher_directory.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_teacher_profile.php`
- `local/hubredirect/live_quality_analytics.php`
- `local/hubredirect/live_improvement_plans.php`
- `local/prequran/sql/verify_live_teacher_directory.sql`

## Test

1. Open `/local/hubredirect/live_teacher_directory.php`.
2. Search for a teacher name, email, or user ID.
3. Try each filter, especially `Needs attention`, `Low QA score`, and `Has open plan`.
4. Click `Profile`, `Workspace`, `QA`, and `Plans`.
5. Export CSV and confirm it matches the visible filters.
6. Run `verify_live_teacher_directory.sql`.
