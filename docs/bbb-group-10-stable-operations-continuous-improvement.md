# BBB Group 10: Stable Operations & Continuous Improvement

This group defines how Quraan Academy runs live review sessions as a stable ongoing program after controlled launch.

## Implemented

- Added stable operations checklist.
- Added weekly, monthly, and quarterly governance cadence.
- Added KPI definitions for operations, quality, parent trust, recordings, and support.
- Added teacher quality calibration process.
- Added parent trust review process.
- Added recording retention and review cadence.
- Added support trend review.
- Added capacity planning model.
- Added continuous improvement backlog process.
- Added monthly health SQL: `src/moodle/local_prequran/sql/verify_group_10_stable_operations.sql`.

## Stable Operations Goal

Stable operations means live sessions can run repeatedly without special launch supervision while still protecting:

- Child safety.
- Parent trust.
- Teacher quality.
- Recording privacy.
- Operational reliability.
- Support responsiveness.
- Long-term scalability.

## Stable Operations Checklist

Quraan Academy is in stable operations when:

1. Daily monitoring has an assigned owner.
2. Weekly operations review is scheduled.
3. Monthly leadership review is scheduled.
4. Quarterly privacy/compliance review is scheduled.
5. Teachers complete attendance and parent summaries consistently.
6. Recordings are reviewed before parent visibility.
7. Parent support issues are tracked by category.
8. QA reviews are sampled consistently.
9. Coaching and improvement plans are current.
10. Retention and purge readiness are reviewed.
11. Capacity planning uses real teacher and student load data.
12. Known issues have owners and review dates.

## Governance Cadence

Weekly operations review:

- Today's and next 7 days of sessions.
- BBB errors.
- Attendance completion.
- Parent summary completion.
- Recording review queue.
- Follow-up queue.
- Parent support issues.
- Teacher capacity.

Monthly leadership review:

- Total sessions.
- Completion and cancellation trends.
- Active teachers.
- Students served.
- Average class size.
- QA score trends.
- Coaching and improvement-plan trends.
- Parent trust/support trends.
- Recording review and retention trends.
- Capacity needs for the next month.

Quarterly privacy and compliance review:

- Parent access and support access logs.
- Recording retention and purge evidence.
- Consent policy review.
- Data minimization review.
- Private-note exposure checks.
- Incident history and closure evidence.
- Policy updates if needed.

## KPI Definitions

Operations:

- Scheduled sessions.
- Completed sessions.
- Cancelled sessions.
- Rescheduled sessions.
- BBB error rate.
- Student attendance completion rate.
- Teacher post-class completion rate.

Quality:

- Average QA score.
- Percent of sessions reviewed.
- Open coaching items.
- Open improvement plans.
- Repeat coaching triggers by teacher.

Parent trust:

- Parent-visible summaries completed.
- Parent acknowledgement completion.
- Parent follow-up response rate.
- Parent support issue volume.
- Parent privacy/support access audit count.

Recordings:

- Recordings created.
- Recordings reviewed.
- Recordings published to parents.
- Recordings pending review.
- Recordings expiring soon.
- Purge/recovery evidence reviewed.

Capacity:

- Active teachers.
- Sessions per teacher.
- Live hours per teacher.
- Students per session.
- Students served per week/month.
- Recording reviewer workload.
- Support workload.

## Teacher Quality Calibration

Run monthly:

1. Select a sample of reviewed sessions.
2. Compare QA score patterns across teachers.
3. Identify common strengths.
4. Identify common training needs.
5. Review parent summaries for tone and usefulness.
6. Review whether homework is specific and actionable.
7. Update teacher training guidance.
8. Assign coaching only when needed.

Calibration should protect consistency. It should not become punitive by default.

## Parent Trust Review

Run monthly:

1. Review parent-visible summaries.
2. Review parent follow-up cases.
3. Review parent support access audits.
4. Confirm private teacher notes remain hidden.
5. Confirm recordings remain hidden until reviewed.
6. Confirm support responses use safe wording.
7. Confirm parent acknowledgement gaps are followed up.
8. Update parent communication if repeated confusion appears.

## Recording Retention Review

Run monthly:

1. Review recordings pending admin review.
2. Review recordings visible to parents.
3. Review recordings expiring in the next 30 days.
4. Confirm retention policy setting.
5. Confirm purge approval workflow for expired data.
6. Confirm evidence snapshots and recovery logs are accessible only to approved admins.

## Support Trend Review

Group issues into:

- Join/access.
- Schedule/timezone.
- Parent account linking.
- Teacher feedback visibility.
- Recording visibility.
- Reminder/notification.
- Homework/follow-up.
- Privacy/safety.

For repeated issues:

1. Decide whether the fix is product, training, support wording, or configuration.
2. Assign owner.
3. Set target date.
4. Add it to the continuous improvement backlog.

## Capacity Planning

Review before adding teachers or increasing class volume:

1. Teacher live hours per week.
2. Teacher review completion time.
3. Average students per class.
4. Parent support issues per 10 sessions.
5. Recording review backlog.
6. QA review backlog.
7. BBB provider capacity.
8. Admin operations capacity.

Add capacity in this order:

1. Teacher training capacity.
2. Parent support capacity.
3. Recording/QA review capacity.
4. BBB provider capacity.
5. Admin operations capacity.

## Continuous Improvement Backlog

Use this format:

```text
Backlog ID:
Source: QA / parent support / teacher feedback / admin ops / compliance
Category:
Problem:
Evidence:
Affected roles:
Risk:
Proposed improvement:
Owner:
Priority:
Target release:
Validation plan:
Status:
```

Prioritize:

1. Safety and privacy.
2. Class reliability.
3. Parent trust.
4. Teacher efficiency.
5. Admin efficiency.
6. Visual/UI polish.

## Monthly Review Template

```text
Month:
Sessions scheduled:
Sessions completed:
Sessions cancelled/rescheduled:
Active teachers:
Students served:
Average students per class:
BBB errors:
Attendance completion rate:
Parent summary completion rate:
Recordings pending review:
Recordings published:
Average QA score:
Open coaching items:
Open improvement plans:
Parent support issues:
Privacy/support access audit findings:
Retention/purge items:
Capacity concerns:
Top 3 improvement backlog items:
Decision: stable / watch / intervention needed
Owner:
Notes:
```

## Stable Operations Exit Criteria

If any of these occur, move back into controlled-launch posture:

- Child privacy concern.
- BBB reliability regression.
- Recording review backlog grows beyond SLA.
- Teacher post-class completion drops.
- Parent support volume spikes.
- QA scores trend downward.
- Improvement plans are overdue.
- Retention or purge workflow becomes unclear.

Stable operations is not a permanent label. It is a condition that must be maintained.

## Operator Handbook

For the final documentation index and role-based operator guide, use:

```text
docs/bbb-group-11-final-documentation-index-operator-handbook.md
```
