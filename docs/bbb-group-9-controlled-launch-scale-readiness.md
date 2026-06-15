# BBB Group 9: Controlled Launch Operations & Scale Readiness

This group defines how to operate the first scaled launch after pilots pass: 2 to 3 teachers first, then 10 teachers when the system and team are ready.

## Implemented

- Added controlled launch schedule.
- Added daily launch command routine.
- Added teacher capacity and class-size monitoring rules.
- Added parent support surge process.
- Added BBB provider capacity watch items.
- Added recording review workload plan.
- Added QA sampling plan.
- Added first two-week metrics.
- Added pause, hold, and expand criteria.
- Added end-of-week launch review template.
- Added scale readiness SQL: `src/moodle/local_prequran/sql/verify_group_9_scale_readiness.sql`.

## Controlled Launch Schedule

Recommended rollout:

1. Day 1 to 2: 2 teachers, 1 class each, up to 5 students per class.
2. Day 3 to 5: 2 to 3 teachers, up to 9 students per class.
3. Week 2: 5 teachers, normal class size, daily monitoring.
4. Week 3: 10 teachers only if Week 2 passes scale criteria.

Do not jump directly from pilot to 10 teachers. The system is ready for scale only when operations are also ready.

## Daily Launch Command Routine

Run this every live-class day during controlled launch.

Morning check:

1. Open `/local/hubredirect/live_diagnostics.php`.
2. Run `verify_group_5_monitoring_runbook.sql`.
3. Run `verify_group_9_scale_readiness.sql`.
4. Confirm today's sessions and teachers.
5. Confirm no oversized classes.
6. Confirm BBB errors are clear.
7. Confirm parent support owner is available.
8. Confirm recording reviewer is available.
9. Confirm QA reviewer is assigned.

One hour before first class:

1. Confirm teacher attendance.
2. Confirm reminders were sent or skipped for a known reason.
3. Confirm sessions appear in teacher workspace.
4. Confirm parent schedule is visible for test parent account.

During live classes:

1. Watch support channel.
2. Watch BBB incident reports.
3. Log join-window or access issues immediately.
4. Escalate child-safety/privacy issues immediately.

After classes:

1. Confirm attendance is saved.
2. Confirm parent summaries are saved.
3. Confirm follow-ups are assigned.
4. Sync recordings after BBB processing.
5. Keep recordings private until admin review.
6. Complete QA sample.
7. Record daily launch notes.

## Teacher Capacity Rules

Start conservative:

- First scaled week: no more than 2 live hours per teacher per day.
- Full controlled launch: no more than 5 live hours per teacher per day unless leadership approves.
- Default class size: 9 students.
- Hard warning: more than 9 students.
- Hard cap target: 12 participants including teacher/admin/helper unless intentionally configured otherwise.

Watch for:

- Teacher has back-to-back sessions without a break.
- Teacher has incomplete reviews from previous classes.
- Teacher has open coaching or improvement plan items.
- Teacher has repeated low QA scores.

## Parent Support Surge Process

If parent support volume rises:

1. Identify the top issue type: join, schedule, summary, recording, reminder, or account link.
2. Use Group 5 templates for first response.
3. Create one owner for each issue type.
4. Escalate privacy concerns immediately.
5. Publish a simple parent-facing clarification if many parents ask the same question.
6. Review support issues at end of day.

Support surge triggers:

- More than 3 parent issues in one day for the same workflow.
- More than 1 parent reports wrong student or wrong data.
- More than 2 reminder failures.
- Any parent cannot access a class they are correctly linked to.

## BBB Provider Capacity Watch

Monitor:

- Simultaneous meetings.
- Total participants online.
- Recording processing delay.
- Recording retention limits.
- Audio/video quality reports.
- Provider dashboard errors.
- BBB API failures.

Pause expansion if:

- Teachers cannot reliably start meetings.
- Students repeatedly cannot join.
- Recording processing is delayed beyond parent expectations.
- BBB provider reports capacity or regional issues.

## Recording Review Workload

For every recorded class:

1. Confirm recording appears after processing.
2. Review before parent visibility.
3. Publish only safe recordings.
4. Leave rejected/unreviewed recordings hidden from parents.
5. Watch expiry dates and retention policy.

Recommended staffing:

- 1 reviewer can safely handle a small number of pilot recordings per day.
- Add reviewer capacity before moving to 10 teachers.
- Same-day review is ideal for parent trust.

## QA Sampling Plan

During controlled launch:

- Review 100% of pilot and first-week classes.
- Review at least 50% of classes during the first week with multiple teachers.
- Review at least 25% of classes once operations stabilize.
- Always review classes with parent complaints, technical issues, low attendance, or new teachers.

QA should check:

- Teacher readiness.
- Student engagement.
- Arabic/pre-Quran review quality.
- Safety and tone.
- Use of BBB controls.
- Attendance accuracy.
- Parent summary quality.

## First Two-Week Metrics

Track daily:

- Scheduled sessions.
- Completed sessions.
- Cancelled/rescheduled sessions.
- Active teachers.
- Students served.
- Average students per class.
- BBB errors.
- Attendance completion rate.
- Parent summary completion rate.
- Recording review queue.
- Parent support issues.
- Follow-up queue.
- QA scores.
- Open coaching items.
- Open leadership/improvement plan items.

## Pause, Hold, Expand Criteria

Pause immediately if:

- Any child privacy exposure occurs.
- Parent sees another child's information.
- Private teacher note is exposed.
- Recording becomes visible without review.
- BBB cannot create or join meetings broadly.

Hold expansion if:

- Parent support volume is too high for the team.
- Teachers are not completing reviews.
- Recording review backlog grows.
- QA finds repeated quality problems.
- Reminders or schedule acknowledgements are unreliable.

Expand when:

- No Severity 1 issues.
- Severity 2 issues are closed or safely worked around.
- Daily monitoring is clean.
- Teachers complete attendance and parent summaries on time.
- Parent support volume is manageable.
- Recording review queue is current.
- QA scores are acceptable.

## End-Of-Week Review Template

```text
Week:
Teachers active:
Sessions scheduled:
Sessions completed:
Sessions cancelled/rescheduled:
Students served:
Average students per session:
BBB errors:
Parent support issues:
Attendance completion rate:
Parent summary completion rate:
Recordings pending review:
Average QA score:
Open follow-ups:
Open coaching items:
Severity 1 issues:
Severity 2 issues:
Known issues accepted:
Decision: expand / hold / pause
Decision owner:
Notes:
```

## Scale Decision

Before moving to 10 teachers:

1. Run Group 4 smoke test for the current production setup.
2. Run Group 5 monitoring.
3. Run Group 8 rollout readiness.
4. Run Group 9 scale readiness.
5. Review the last week of support issues.
6. Review QA scores and coaching items.
7. Confirm recording review capacity.
8. Confirm BBB provider capacity.
9. Confirm support coverage.
10. Leadership approves expansion.

## Stable Operations Pack

After controlled launch becomes routine, use:

```text
docs/bbb-group-10-stable-operations-continuous-improvement.md
src/moodle/local_prequran/sql/verify_group_10_stable_operations.sql
```
