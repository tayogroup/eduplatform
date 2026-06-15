# Group 3: Final Admin/User Navigation & UX Cleanup

This group makes the live-class system easier to operate without jumping between SQL checks and scattered pages.

## Implemented

- Expanded the Live Admin Menu with common operational workflows.
- Cleaned admin menu destinations so generic menu links point to safe list/queue pages.
- Kept context-required pages behind their natural row actions:
  - `live_review.php` from Teacher Workspace or Operations session rows.
  - `live_monitor.php` from Teacher Workspace or Live Sessions class rows.
  - `live_quality.php` from Operations QA queue.
  - `live_followup_message.php` from Follow-Up Command Center.
  - `live_parent_trust_purge_evidence.php` from Retention purge history.
- Replaced placeholder dashboard links for admin, teacher, and student roles with real routes.
- Added an admin dashboard panel for creation, operations, capacity, recordings, QA, and follow-ups.
- Added verification SQL: `local/prequran/sql/verify_group_3_navigation_ux.sql`.

## Manual QA Checklist

1. Open `/local/hubredirect/dashboard.php` as admin.
2. Confirm quick cards open real pages, not `#` placeholders.
3. Open `/local/hubredirect/live_admin.php`.
4. Click each Live Admin Menu group link and confirm generic links do not require missing parameters.
5. As teacher, confirm dashboard quick actions open Teacher Workspace, Live Sessions, Follow-Ups, and Schedule.
6. As student, confirm dashboard quick actions open Lessons, Live Schedule, Class Series, Live Calendar, Live Sessions, Teacher Feedback, and Trust Center.
7. As parent, confirm selected-child quick actions still open Parent Live Hub, summaries, recordings, trust, calendar, and messages.

## Notes

Some pages intentionally require context. They should not be used as top-level menu links unless a `sessionid`, `studentid`, `teacherid`, or purge evidence `id` is supplied.
