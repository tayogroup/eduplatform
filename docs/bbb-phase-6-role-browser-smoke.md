# Phase 6 - Role-Based Browser Smoke Evidence

Use this checklist on quraantest after the candidate plugin files are deployed and Moodle upgrade is complete. Capture screenshots that do not expose BBB secrets, private teacher notes, session join tokens, cookies, or unrelated child-sensitive data.

## Admin Smoke

- Open `/local/hubredirect/live_diagnostics.php`.
- Open `/local/hubredirect/live_grouping.php` and create or select the pilot group.
- Open `/local/hubredirect/live_sessions.php` or `/local/hubredirect/live_create_wizard.php` and create the pilot live session.
- Open `/local/hubredirect/live_ops.php` and confirm the session appears in the expected queue.
- Open `/local/hubredirect/live_recordings_admin.php`.
- Run manual BBB recording sync if the pilot session was recorded.
- Review, publish, hide, or archive the recording according to the pilot scenario.

Screenshot evidence:

- Diagnostics PASS page.
- Group/session creation or selected pilot session.
- Operations dashboard.
- Recording review page after sync or retention action.

## Teacher Smoke

- Log in as the pilot teacher.
- Open `/local/hubredirect/live_teacher.php`.
- Start the pilot class from the teacher workspace or live sessions page.
- Open `/local/hubredirect/live_monitor.php?sessionid=<pilot_session_id>`.
- After class, open `/local/hubredirect/live_review.php?sessionid=<pilot_session_id>`.
- Save attendance and notes.
- Mark the session complete only after required attendance and parent-visible feedback are present.

Screenshot evidence:

- Teacher workspace showing the session.
- BBB join/start action or post-start live state.
- Lesson monitor for the pilot session.
- Review page after attendance/notes save.
- Completed state or `awaiting_review` state if completion is intentionally blocked.

## Student Smoke

- Log in as the pilot student.
- Open `/local/hubredirect/live_sessions.php`.
- Confirm the assigned pilot session is visible.
- Before the join window, confirm joining is blocked if testing early.
- Inside the join window, join the BBB session.
- Confirm no unrelated student sessions are visible.

Screenshot evidence:

- Student session list.
- Blocked early-join message, if tested.
- Successful in-window join flow or attendance evidence.
- Student list showing only assigned sessions.

## Parent Smoke

- Log in as the linked pilot parent.
- Open `/local/hubredirect/live_schedule.php`, `/local/hubredirect/live_summaries.php`, or `/local/hubredirect/live_parent_trust.php` for the pilot child.
- Confirm schedule and parent-visible summary are visible after teacher review.
- Confirm private teacher notes are not displayed.
- Open `/local/hubredirect/live_recordings.php` and confirm only reviewed, visible, non-expired recordings appear.
- If the pilot includes a follow-up or schedule acknowledgement, submit the parent response or acknowledgement.

Screenshot evidence:

- Parent schedule or trust hub.
- Parent summary without private notes.
- Live recordings page showing only approved recordings or an empty state.
- Follow-up response or acknowledgement confirmation, if included.

## SQL Evidence

After browser testing, run:

```sql
src/moodle/local_prequran/sql/verify_phase_6_role_browser_smoke.sql
```

Expected:

- Role smoke evidence matrix is `PASS` or `NOT_APPLICABLE`.
- Privacy/access blockers are all zero.
- Latest session audit rows include create/start/join/review/recording actions matching the pilot scenario.

## Known-Issue Rule

If any role smoke step cannot be completed, record it in the launch runbook known-issues table with severity, owner, workaround, and launch decision before moving to Phase 7.
