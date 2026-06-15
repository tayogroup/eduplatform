# Phase 22: Student Self-Study Monitoring Integration

This phase adds a teacher/admin-only live lesson monitor for BBB review sessions.

## What Was Added

- `/local/hubredirect/live_monitor.php`
  - Shows each active student in a live session.
  - Displays latest online lesson progress from `local_prequran_lessonprog`.
  - Displays self-study focus data from `local_prequran_focusagg` when available.
  - Displays speak-practice recording counts from `local_prequran_speakrec` when available.
  - Links teachers to the same lesson focus and to student speak recordings.
  - Writes `lesson_monitor_opened` audit rows.

- Teacher/admin entry points:
  - `/local/hubredirect/live_teacher.php`
  - `/local/hubredirect/live_sessions.php`
  - `/local/hubredirect/live_review.php`

- Verification SQL:
  - `local/prequran/sql/verify_live_monitor.sql`

## Safety Model

This is not silent screen spying. The monitor uses platform-owned learning telemetry: lesson progress, focus aggregation, and speak-practice metadata. For live help, the student can still share screen inside BBB, or the teacher can open the same lesson context and guide them verbally.

Parents do not get this teacher monitor page. Parents continue to see parent-safe summaries, schedules, trust information, and approved recordings through the parent pages.

## How To Test

1. Log in as the assigned teacher or site admin.
2. Open `/local/hubredirect/live_teacher.php`.
3. Click `Lesson monitor` on a live session.
4. Confirm the page shows:
   - session lesson/unit focus,
   - active students,
   - latest lesson progress,
   - focus/self-study data if installed,
   - speak-practice counts if installed.
5. Click `Open lesson` to open the related unit.
6. Click `Speak recordings` to review that student's pronunciation recordings.
7. Run `verify_live_monitor.sql` in phpMyAdmin and confirm `lesson_monitor_opened` appears after opening the monitor page.

## Operational Notes

- Teachers should use this during class as a coaching aid, not as a disciplinary surveillance tool.
- If a student is stuck, the teacher can ask them to share their screen in BBB or guide them to the correct unit.
- Admins can use the audit row to confirm monitor access during quality review.
