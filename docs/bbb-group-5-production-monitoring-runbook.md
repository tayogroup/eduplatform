# BBB Group 5: Production Monitoring, Support Runbook, and Launch Handoff

This group turns the live-class system into an operational service that can be monitored, supported, paused, and handed off cleanly.

## Implemented

- Added daily and weekly monitoring checklists.
- Added incident runbooks for BBB, scheduling, recordings, reminders, parent access, and privacy concerns.
- Added parent, teacher, and admin support response templates.
- Added launch go/no-go criteria.
- Added emergency pause and rollback guidance.
- Added ownership matrix for live operations.
- Added consolidated monitoring SQL: `src/moodle/local_prequran/sql/verify_group_5_monitoring_runbook.sql`.

## Daily Monitoring

Run this every live-class day before the first class:

1. Open `/local/hubredirect/live_diagnostics.php`.
2. Confirm BBB settings and live tables pass.
3. Open `/local/hubredirect/live_ops.php`.
4. Check today's sessions, BBB errors, recording review queue, notification issues, and follow-up queue.
5. Open `/local/hubredirect/live_teacher.php` as a teacher test account or use admin preview where available.
6. Confirm teachers can see today's classes.
7. Open `/local/hubredirect/live_followups.php`.
8. Confirm urgent parent follow-ups are owned.
9. Open `/local/hubredirect/live_recordings_admin.php`.
10. Confirm recordings waiting for review are not older than the agreed SLA.
11. Open `/local/hubredirect/live_quality_analytics.php`.
12. Check low QA scores, coaching items, leadership alerts, and improvement plans.
13. Run the Group 5 SQL monitoring script.

Daily pass criteria:

- No unexpected BBB errors.
- No class scheduled without teacher and student participants.
- No completed class missing attendance.
- No completed class missing parent-visible summary.
- No unapproved parent-visible recording.
- No failed notification spike.
- No overdue follow-up or QA item without owner.

## Weekly Monitoring

Run this once per week:

1. Review teacher capacity and assignments.
2. Review recurring series changes and parent acknowledgements.
3. Review recording retention and purge readiness.
4. Review parent trust support access logs.
5. Review QA trends by teacher.
6. Review open leadership cases and improvement plans.
7. Export the relevant review packs for leadership.
8. Confirm old support cases are resolved or escalated.

Weekly pass criteria:

- Parent acknowledgement reminders are not accumulating.
- Recording review queue is controlled.
- Support preview/access reasons are complete.
- Purge evidence exports are audited.
- Teacher coaching and improvement plans have due dates and current status.

## Incident Runbook

### BBB Checksum Error

Symptoms:

- Teacher or student cannot start/join.
- Error mentions checksum or security check.

Steps:

1. Open Moodle PreQuran settings.
2. Re-enter the BBB shared secret from the hosted BBB provider.
3. Check for leading/trailing spaces.
4. Confirm the BBB base URL is the API URL, not the dashboard URL.
5. Open `/local/hubredirect/live_diagnostics.php`.
6. Retry with a new test session.

Escalate to BBB provider if the secret is confirmed but checksum still fails.

### BBB Invalid XML Or Not Found

Symptoms:

- Error mentions invalid XML.
- Response preview shows HTML, CSS, login page, or `Not Found`.

Steps:

1. Confirm BBB base URL ends at the BigBlueButton API path.
2. Open the API endpoint directly and confirm XML success.
3. Avoid provider dashboard URLs.
4. Save settings and purge Moodle caches.
5. Retry session creation.

### Student Outside Join Window

Symptoms:

- Student sees `This live session is outside the student join window`.

Steps:

1. Check session scheduled start and end.
2. Check Moodle server timezone and user timezone.
3. Confirm join-window settings are 10 minutes before and 15 minutes after unless intentionally changed.
4. For testing, create a fresh session inside the current window.
5. Do not disable join-window protection globally for production.

### Recording Missing Or Delayed

Symptoms:

- BBB class completed but recording does not appear in admin review.

Steps:

1. Confirm recording was enabled and consent policy allowed recording.
2. Wait for BBB processing.
3. Pull recordings again from the admin recording page.
4. Confirm the BBB provider plan includes recording and sufficient retention.
5. Confirm `bbb_meeting_id` matches the session.

Do not tell parents a recording is available until admin review publishes it.

### Parent Cannot See Summary

Symptoms:

- Parent says no feedback appears after class.

Steps:

1. Confirm parent is linked to the student.
2. Confirm teacher saved a note.
3. Confirm `visible_to_parent = 1`.
4. Confirm the parent is viewing the correct child.
5. Confirm the parent account is not a duplicate/unlinked account.

Private teacher notes must never be copied into parent support responses.

### Parent Cannot See Recording

Symptoms:

- Parent sees summary but not playback.

Steps:

1. Confirm recording exists.
2. Confirm status is `available`.
3. Confirm admin reviewed and published it.
4. Confirm `visible_to_parent = 1`.
5. Confirm it has not expired.

### Reminder Or Notification Did Not Send

Symptoms:

- Parent or teacher did not receive reminder.

Steps:

1. Confirm Moodle cron is running.
2. Confirm `\local_prequran\task\live_session_reminders` is enabled.
3. Check live audit rows for reminder or notification actions.
4. Check Moodle messaging preferences.
5. Confirm session time matched the reminder window.
6. Check for `notification_failed` or `notification_skipped`.

### Privacy Or Child-Safety Concern

Symptoms:

- Wrong parent sees student information.
- Private note appears in parent view.
- Recording or summary is visible before review.

Steps:

1. Pause affected parent visibility immediately.
2. Capture session ID, student ID, parent ID, route, and time.
3. Preserve audit rows.
4. Notify the privacy owner.
5. Review guardian links.
6. Review page access checks.
7. Do not delete evidence until leadership approves retention action.

This is a severity-one incident.

## Emergency Pause

Use this when a live-class feature needs to stop without taking the whole Moodle site down.

Recommended pause order:

1. Disable creating new live sessions through staff process.
2. Pause parent recording publication.
3. Pause parent summary publication if privacy is affected.
4. Disable or hide live-class navigation links if needed.
5. Disable reminder cron only if automated notifications are causing harm.
6. Keep audit tables and evidence intact.

Do not delete sessions, notes, recordings, or audit rows during an incident unless leadership approves a documented retention action.

## Launch Go/No-Go

Go when:

- Group 4 smoke test passes.
- Group 5 daily monitoring SQL shows no launch-blocking issues.
- BBB provider recording and retention behavior is confirmed.
- Teachers have completed live-class training.
- Parent support scripts are ready.
- Admin can pause parent visibility and recording publication.
- Cron reminders are verified.
- Privacy owner approves launch.

No-go when:

- BBB meeting creation or joining is unreliable.
- Parent access cannot be confidently limited to linked children.
- Recordings publish without admin review.
- Notifications send to wrong users.
- Support team does not know how to triage common failures.
- There is no current database backup.

## Ownership Matrix

Live operations owner:

- Monitors daily dashboard.
- Confirms class creation, teacher assignments, and student grouping.

Teacher lead:

- Confirms teachers attend, start classes, complete attendance, and publish parent-safe summaries.

Parent support owner:

- Handles parent access, schedule, summary, recording, and follow-up questions.

BBB technical owner:

- Owns BBB base URL, shared secret, provider support, recordings, and meeting failures.

Moodle technical owner:

- Owns plugin deployment, cron, permissions, database backup, and upgrade recovery.

Privacy/safety owner:

- Owns child-safety incidents, recording consent, support access review, purge approval, and evidence retention.

Leadership owner:

- Owns go/no-go decision, severe incident review, coaching escalation, and improvement-plan closure.

## Support Templates

Parent: class join issue

```text
Thank you for letting us know. We are checking the live-session schedule and join window for your child. Please keep your child signed in to the correct Quraan Academy account, and we will confirm the next safe join step shortly.
```

Parent: feedback not visible

```text
Thank you for your patience. Teacher feedback becomes visible after the teacher saves the parent summary for the class. We are checking the class record and guardian link now.
```

Parent: recording not visible

```text
Recordings are reviewed before they are shared with parents. We are checking whether this class recording has finished processing and passed admin review.
```

Teacher: attendance not complete

```text
Please open the class review page, mark attendance for each active student, complete the parent-safe summary, and then save the review. The class should be marked complete only after those items are ready.
```

Admin: BBB issue

```text
Please check Live Diagnostics first, then confirm the session ID, BBB meeting ID, scheduled time, teacher account, and exact error. Do not change the BBB shared secret unless the provider value has been verified.
```

Privacy concern

```text
Thank you for reporting this. We are treating it as a privacy review. We will preserve the audit history, restrict visibility where needed, and have the privacy owner review the case before any further action.
```

## Handoff Checklist

Before handing live operations to the team:

1. Share Group 4 smoke-test checklist.
2. Share Group 5 monitoring runbook.
3. Share the SQL verification scripts.
4. Confirm each owner in the ownership matrix.
5. Confirm support team knows the templates.
6. Confirm scheduled-task access.
7. Confirm database backup process.
8. Confirm BBB provider support contact.
9. Confirm escalation channel for privacy concerns.
10. Confirm first-week launch review meeting.

## Final Deployment Pack

For release packaging and production deployment handoff, use:

```text
docs/bbb-group-6-release-packaging-deployment-handoff.md
src/moodle/local_prequran/sql/verify_group_6_deployment_handoff.sql
```
