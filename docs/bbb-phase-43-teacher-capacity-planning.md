# Phase 43: Admin Teacher Assignment & Capacity Planning

Phase 43 adds a capacity-planning view so admins can assign teachers using availability, current load, conflicts, and quality workload.

## What Changed

- Added `/local/hubredirect/live_capacity.php`.
- Capacity page shows:
  - teacher weekly available hours;
  - assigned live-session hours;
  - capacity percentage;
  - weekly session and student counts;
  - QA issues, open coaching, leadership cases, improvement plans, and parent follow-ups;
  - proposed class slot availability;
  - schedule conflicts;
  - fit score and recommendation label.
- Filters:
  - all teachers;
  - recommended;
  - available for proposed slot;
  - overloaded;
  - open quality work.
- CSV export for capacity planning.
- Added navigation links from:
  - Live Operations;
  - Live Sessions;
  - Teacher Directory.
- The Schedule action from capacity planning opens `live_sessions.php` with the teacher ID prefilled.

## Files

- `local/hubredirect/live_capacity.php`
- `local/hubredirect/live_sessions.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_teacher_directory.php`
- `local/prequran/sql/verify_live_capacity.sql`

## Test

1. Open `/local/hubredirect/live_capacity.php`.
2. Choose a week and calculate capacity.
3. Enter a proposed class date/time, duration, and student count.
4. Try filters: `Recommended`, `Available for slot`, `Overloaded`, and `Open quality work`.
5. Click `Schedule` for a teacher and confirm the teacher ID is prefilled on the live session create form.
6. Export CSV.
7. Run `verify_live_capacity.sql`.
