# BBB Group 4: Production Smoke Tests & Operational QA Pack

This group turns the finished live-class features into a repeatable production smoke test and operational QA pack.

## Implemented

- Added one end-to-end live-class smoke checklist for admin, teacher, student, and parent roles.
- Added BBB-specific troubleshooting checks for API URL, checksum, join windows, and recordings.
- Added cron and notification verification expectations.
- Added role access checks for parent privacy, teacher assignment scope, and student join access.
- Added consolidated SQL verification: `src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql`.
- Linked the live-class smoke pack from the existing production smoke test.

Use this pack before launching live review classes, after any Moodle plugin upgrade, and after changing BigBlueButton provider settings.

## Required Test Accounts

Prepare four real Moodle accounts:

1. Admin or manager with access to live operations, recordings, QA, retention, and support tools.
2. Teacher assigned to at least one live session.
3. Student enrolled in the live session.
4. Parent or guardian linked to that student.

The parent account must be linked through the same guardian relationship used by the live-session parent pages. Do not test parent access using an admin account.

## Core URLs

Use these Moodle routes during the smoke test:

```text
/local/hubredirect/dashboard.php
/local/hubredirect/live_admin.php
/local/hubredirect/live_ops.php
/local/hubredirect/live_create_wizard.php
/local/hubredirect/live_series_wizard.php
/local/hubredirect/live_sessions.php
/local/hubredirect/live_teacher.php
/local/hubredirect/live_schedule.php
/local/hubredirect/live_calendar.php
/local/hubredirect/live_summaries.php
/local/hubredirect/live_recordings.php
/local/hubredirect/live_parent_trust.php
/local/hubredirect/live_followups.php
/local/hubredirect/live_recordings_admin.php
/local/hubredirect/live_quality_analytics.php
/local/hubredirect/live_diagnostics.php
```

## Preflight Checks

Run these before creating a test session:

1. Open `live_diagnostics.php`.
2. Confirm BBB base URL is configured.
3. Confirm BBB shared secret is configured.
4. Confirm all live-session tables show `PASS`.
5. Confirm default join windows are set to 10 minutes before and 15 minutes after.
6. Confirm default max participants is 12 or 15.
7. Confirm recording policy is consent-aware.
8. Confirm the Moodle scheduled task `\local_prequran\task\live_session_reminders` is enabled.

Also run:

```text
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
```

The first run may show empty operational rows if no new test session exists yet. That is acceptable before the live-class test.

## End-To-End Smoke Test

1. Log in as admin.
2. Create a one-hour live review class using the guided session wizard.
3. Assign one teacher and one test student.
4. Keep the session inside the current join window for the test.
5. Confirm the session appears on `live_sessions.php`, `live_ops.php`, and `live_teacher.php`.
6. Log in as the teacher.
7. Open the teacher workspace.
8. Click `Start class`.
9. Confirm BBB opens as moderator.
10. Test microphone join, camera button, public chat, whiteboard drawing, presenter controls, and leave meeting.
11. Log in as the student.
12. Open the student schedule or live sessions page.
13. Click `Join class`.
14. Confirm BBB opens as viewer/student.
15. Return to Moodle as the teacher.
16. Open attendance and notes.
17. Mark attendance, participation, strengths, needs practice, homework, and parent summary.
18. Confirm private teacher notes are saved but are not parent-visible.
19. Mark the parent summary visible.
20. Mark the class completed only after attendance and parent-visible feedback are ready.
21. Log in as the parent.
22. Open the parent schedule, summaries, and trust dashboard.
23. Confirm the parent sees schedule details, attendance summary, strengths, needs practice, homework, and parent summary.
24. Confirm the parent cannot see private teacher notes.
25. If follow-up is requested, submit a parent response and confirm the command center reflects it.
26. After BBB processing completes, sync recordings from the admin recording page.
27. Confirm the recording enters admin review before parent visibility.
28. Publish only an approved recording to parents.
29. Confirm the parent can see the approved recording and cannot see unapproved recordings.
30. Complete an admin QA review, including score and checklist.
31. If the QA result requires coaching, create and close a coaching follow-up.
32. If leadership or improvement-plan status is triggered, confirm it appears in the relevant dashboard.

## Role Access Matrix

Admin:

- Can create, edit, cancel, reschedule, review, publish, export, purge, and inspect audit history.
- Can access diagnostics, operational dashboards, command centers, QA dashboards, and support preview tools.

Teacher:

- Can see assigned classes and assigned students.
- Can start BBB sessions as moderator.
- Can save attendance, post-class notes, homework, follow-up requests, and completion status.
- Must not see unrelated teachers' private class work.

Student:

- Can see and join only assigned live sessions.
- Can join only inside the configured student join window.
- Must not access teacher/admin review pages.

Parent:

- Can see only linked children.
- Can see parent-visible summaries, approved recordings, schedule acknowledgements, homework, and trust-dashboard data.
- Must never see private teacher notes, unapproved recordings, or other students' data.

## BBB Quality Checks

Pass criteria:

1. BBB API health URL returns XML success.
2. Moodle can create a meeting with checksum accepted.
3. Teacher join opens moderator view.
4. Student join opens viewer view.
5. Meeting title matches the Quraan Academy session.
6. Whiteboard works for Arabic/pre-Quran review use.
7. Public chat and mute controls work.
8. Recording starts only when policy and consent allow it.
9. Recording metadata can be synced after BBB processing.
10. Parent playback is blocked until admin review publishes it.

Common failures:

- Checksum error: the shared secret is wrong, has whitespace, or does not match the hosted BBB account.
- Invalid XML or HTML response: the base URL points to a web page instead of the BBB API endpoint.
- Not Found response: the provider URL path is wrong.
- Student outside join window: session time, Moodle timezone, or join-window settings need review.
- Recording missing: BBB processing may still be pending, recording was disabled, or provider retention settings block it.

## Cron And Notification Checks

From Moodle scheduled tasks, confirm this task exists and is enabled:

```text
\local_prequran\task\live_session_reminders
```

Expected audit actions can include:

```text
live_reminder_24h_sent
live_reminder_1h_sent
live_followup_teacher_sent
live_followup_admin_sent
followup_parent_reminder_sent
followup_teacher_reminder_sent
followup_escalated_admin
qa_review_reminder_sent
qa_coaching_reminder_sent
leadership_alert_sent
improvement_plan_teacher_reminder_sent
series_ack_parent_reminder_sent
notification_sent
notification_failed
notification_skipped
```

An empty audit result is acceptable only before a matching test window exists. For production readiness, create at least one future session that should receive a reminder and verify the audit row after cron runs.

## SQL Verification

Run this script in phpMyAdmin or the Moodle database console:

```text
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
```

Use it after each smoke run to confirm:

- Core tables exist.
- Sessions, participants, attendance, notes, recordings, and audit rows line up.
- Parent-visible data exists without exposing private teacher notes.
- BBB errors are clear.
- Recording review queue is visible.
- Follow-up, QA, leadership, and improvement-plan queues are visible.
- Reminder and notification audit rows are present when expected.

## Launch Pass Criteria

The live-class workflow is ready for production when:

1. Diagnostics pass.
2. Guided session creation succeeds.
3. Teacher can start BBB.
4. Student can join BBB inside the join window.
5. Attendance is recorded.
6. Teacher notes and parent summaries save correctly.
7. Parent sees only safe, intended information.
8. Recording sync and admin review work.
9. Cron reminders and follow-ups produce expected audit records.
10. Admin operations dashboard shows no unresolved BBB errors.
11. QA review and coaching workflow work for at least one completed session.
12. SQL smoke script shows no unexpected missing data or leakage risk.

## Triage Notes

If a test fails, record:

- Moodle user role.
- URL used.
- Session ID.
- Student ID.
- Teacher ID.
- Exact error message.
- Time and timezone.
- Related audit row if present.
- BBB meeting ID if the issue reached BBB.

Use `live_diagnostics.php` first, then the consolidated SQL smoke script, then the specific phase verification script for the failing area.

## Next Operational Pack

After this smoke test passes, use:

```text
docs/bbb-group-5-production-monitoring-runbook.md
src/moodle/local_prequran/sql/verify_group_5_monitoring_runbook.sql
```
