# BBB Group 8: Pilot Findings Fix Pack & Rollout Readiness

This group defines how to convert pilot findings into approved fixes, regression checks, accepted known issues, and a controlled rollout decision.

## Implemented

- Added pilot issue triage workflow.
- Added severity-based fix approval rules.
- Added regression checklist after fixes.
- Added parent and teacher post-pilot communication templates.
- Added known-issues register format.
- Added rollout readiness decision form.
- Added next-cohort rollout gates for 5 students, 9 students, and multiple teachers.
- Added rollout readiness SQL: `src/moodle/local_prequran/sql/verify_group_8_rollout_readiness.sql`.

## Purpose

The pilot should not automatically become a launch. Group 8 creates the discipline between "pilot completed" and "scale safely."

Use this group after each pilot round:

1. Pilot 1: 1 teacher, 1 to 3 students.
2. Pilot 2: 1 teacher, 5 students.
3. Pilot 3: 1 teacher, 9 students.
4. Soft launch: 2 to 3 teachers.
5. Controlled launch: 10 teachers.

## Pilot Issue Triage Workflow

Within 24 hours of the pilot:

1. Collect teacher feedback.
2. Collect parent feedback.
3. Collect student feedback where appropriate.
4. Review admin/support observation notes.
5. Run Group 7 pilot SQL.
6. Run Group 8 rollout readiness SQL.
7. Convert every finding into an issue log entry.
8. Assign severity.
9. Assign owner.
10. Decide whether the issue blocks rollout.
11. Decide whether it requires code, configuration, training, support wording, or no action.
12. Record the final decision.

## Fix Approval Rules

Severity 1:

- Must block rollout.
- Requires immediate owner assignment.
- Requires privacy/safety or technical leadership review.
- Requires regression testing before any new pilot.
- Cannot be accepted as a known issue for launch.

Severity 2:

- Blocks broader rollout unless a safe workaround exists.
- Requires owner and target date.
- Requires regression testing for the affected workflow.
- Can be accepted only for another small pilot, not for full launch, if risk is low and workaround is clear.

Severity 3:

- Does not block launch by default.
- Should be grouped into a polish or training update.
- Requires owner if it affects teacher or parent trust.

Severity 4:

- Track as backlog.
- Fix when bundled with related UI or docs work.

## Regression Checklist After Fixes

After any pilot fix, rerun only the checks that match the changed area, then rerun the rollout gate.

Access or privacy fix:

1. Run `verify_group_1_access_security.sql`.
2. Test parent account with linked child.
3. Test unrelated parent account.
4. Confirm private notes stay hidden.
5. Confirm denied access creates audit rows.

Schema or upgrade fix:

1. Run Moodle plugin upgrade.
2. Purge caches.
3. Run `verify_live_schema_readiness.sql`.
4. Run `verify_group_6_deployment_handoff.sql`.

Navigation or UX fix:

1. Run `verify_group_3_navigation_ux.sql`.
2. Test admin, teacher, parent, and student dashboards.
3. Confirm context-required pages are reached from row actions.

BBB/session flow fix:

1. Run `verify_group_4_production_smoke.sql`.
2. Create a test session.
3. Start as teacher.
4. Join as student.
5. Confirm attendance and audit rows.

Monitoring or support fix:

1. Run `verify_group_5_monitoring_runbook.sql`.
2. Confirm live ops, follow-up, recordings, and QA queues.
3. Confirm support templates still match actual behavior.

Pilot readiness fix:

1. Run `verify_group_7_pilot_feedback.sql`.
2. Run `verify_group_8_rollout_readiness.sql`.
3. Confirm blocker counts are acceptable.

## Known-Issues Register

Use this format for issues accepted into a pilot or rollout:

```text
Known issue ID:
Severity:
Description:
Affected roles:
Affected route/page:
Risk:
Workaround:
Owner:
Target fix date:
Accepted for: next pilot / soft launch / controlled launch
Accepted by:
Review date:
```

Accepted known issues must not include:

- Any child privacy exposure.
- Any private teacher note exposure.
- Any unreviewed recording visible to parents.
- Any ability for a student to join the wrong class.
- Any BBB failure that prevents normal class start/join.

## Post-Pilot Communication

Teacher update:

```text
Thank you for helping run the live-class pilot. We reviewed the class flow, attendance, parent summaries, recording review, and feedback. Before the next class, we will share any workflow changes or fixes that affect teachers.
```

Parent update:

```text
Thank you for joining the Quraan Academy live-class pilot. We are reviewing the experience carefully, including class access, teacher feedback, and parent trust features. We will use your feedback before expanding the program.
```

Internal support update:

```text
The pilot has completed. Please log any parent or teacher issues using the pilot issue format, include session ID and role, and flag privacy or child-safety concerns immediately.
```

Hold message:

```text
We are taking extra time to improve the live-class experience before expanding it. Existing lesson access is not affected. We will communicate the next live-session schedule after the review is complete.
```

## Rollout Readiness Decision Form

```text
Pilot round:
Date:
Teacher:
Student count:
Parent accounts tested:
BBB start/join passed:
Attendance passed:
Parent summaries passed:
Recording review passed:
Parent trust pages passed:
Cron/reminders passed:
QA review completed:
Severity 1 issues:
Open Severity 2 issues:
Accepted known issues:
Required fixes completed:
Regression checks completed:
Decision: GO / REPEAT PILOT / HOLD
Decision owner:
Notes:
```

## Next-Cohort Gates

Move from 1 to 3 students to 5 students only when:

- No Severity 1 issues.
- No open Severity 2 issues without workaround.
- Teacher can complete review alone.
- Parents can see summaries correctly.
- Support can answer common questions.

Move from 5 students to 9 students only when:

- BBB remains stable.
- Teacher can manage class controls and review flow.
- Attendance and parent summaries are complete for every student.
- Recording review is reliable.
- Parent feedback is acceptable.

Move from 9 students to multiple teachers only when:

- Admin dashboard monitoring is routine.
- Teacher training is repeatable.
- Support runbook is understood.
- QA and coaching queue is current.
- Parent acknowledgement and trust flows are working.

Move from multiple teachers to controlled launch only when:

- Daily monitoring is owned.
- Weekly leadership review is scheduled.
- Known issues are low risk.
- Rollback and emergency pause owners are confirmed.

## Controlled Launch Operations

After rollout readiness is approved, use:

```text
docs/bbb-group-9-controlled-launch-scale-readiness.md
src/moodle/local_prequran/sql/verify_group_9_scale_readiness.sql
```
