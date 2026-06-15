# Phase 23: Live Session Lesson Targeting & Teacher Prep Pack

This phase makes each live review class point to a specific Pre-Quran lesson and unit, then gives the teacher a short preparation snapshot before class.

## What Was Added

- New sessions now require:
  - `lessonid`
  - `unitid`

- Lesson target display was added to:
  - live session creation/list page
  - teacher workspace
  - live monitor
  - attendance/review page
  - parent/student schedule page
  - admin reports

- Teacher workspace now shows a Prep Pack for today's classes:
  - students ready for stretch review,
  - students needing guided practice,
  - latest progress percentage,
  - steps completed,
  - latest focus area,
  - target speak-recording count,
  - suggested teacher action.

- Admin reports now include a `missing targets` metric.

- Verification SQL:
  - `local/prequran/sql/verify_live_targets.sql`

## How To Test

1. Open `/local/hubredirect/live_sessions.php`.
2. Try creating a live session without `lessonid` or `unitid`; it should block creation.
3. Create a session with:
   - `lessonid = alphabet`
   - `unitid = alphabet_listen`
4. Open `/local/hubredirect/live_teacher.php`.
5. Confirm the class card shows:
   - Target lesson/unit,
   - Prep Pack,
   - each student's progress and suggested action.
6. Open `/local/hubredirect/live_monitor.php?sessionid=SESSION_ID`.
7. Confirm the Session Lesson Focus shows the planned target.
8. Run `verify_live_targets.sql`.

## Operational Notes

Older sessions may still show `not set` because they were created before this phase. The verification SQL identifies those sessions. New sessions should always have a target.
