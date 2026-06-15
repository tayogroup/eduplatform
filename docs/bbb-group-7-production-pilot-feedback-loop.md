# BBB Group 7: Production Pilot Execution & Feedback Loop

This group defines how to run the first real live-class pilot, observe it safely, collect feedback, and decide whether to expand, adjust, or pause.

## Implemented

- Added first-pilot planning checklist.
- Added live observation checklist for admin/support.
- Added teacher, parent, and student feedback templates.
- Added issue log format and severity model.
- Added post-pilot review process.
- Added rollout decision criteria.
- Added pilot evidence SQL: `src/moodle/local_prequran/sql/verify_group_7_pilot_feedback.sql`.

## Pilot Goal

The first production pilot should prove that Quraan Academy can safely run a small live review session using BBB while Moodle owns:

- Scheduling.
- Role-based access.
- Attendance.
- Teacher notes.
- Parent-visible summaries.
- Recording review.
- Parent trust features.
- Operational monitoring.

The goal is not to maximize class size. The goal is to prove safety, quality, reliability, and parent trust.

## Pilot Scope

Recommended first pilot:

```text
Teachers: 1
Students: 1 to 3
Parents: 1 linked parent per student
Duration: 30 to 60 minutes
Recording: enabled only if guardian consent exists
Admin observer: yes
Support owner: available during and after class
QA reviewer: same day
```

Avoid testing the first pilot with 9 students. Move to the full class size only after the small pilot passes.

## Pre-Pilot Checklist

Complete these at least one day before the pilot:

1. Group 6 deployment is complete.
2. Group 4 smoke test passed.
3. Group 5 monitoring check passed.
4. BBB provider account is active.
5. Teacher can log in.
6. Student accounts can log in.
7. Parent accounts are linked to the correct students.
8. Recording consent is confirmed where needed.
9. The class is created through the guided session wizard.
10. The class appears for admin, teacher, student, and parent views.
11. The teacher knows how to start BBB, use whiteboard, mute controls, chat, and end class.
12. Support owner knows the incident runbook.
13. Admin observer knows what to capture.
14. Parent communication is sent before class.

## Pilot Day Checklist

Before class:

1. Open `/local/hubredirect/live_diagnostics.php`.
2. Run `verify_group_5_monitoring_runbook.sql`.
3. Confirm there are no open BBB errors.
4. Confirm the pilot class is inside the join window.
5. Confirm teacher sees the class in `/local/hubredirect/live_teacher.php`.
6. Confirm student sees the class in schedule/live sessions.
7. Confirm parent sees the class schedule.

During class:

1. Teacher starts class.
2. Admin confirms BBB opens as moderator.
3. Student joins inside the join window.
4. Admin confirms student joins as viewer.
5. Teacher tests audio, chat, whiteboard, and lesson review flow.
6. Admin observes whether students need help joining.
7. Support logs any parent/student contact.
8. Admin records major timing issues or user confusion.

After class:

1. Teacher saves attendance.
2. Teacher saves strengths, needs practice, homework, and parent summary.
3. Teacher marks summary parent-visible only when safe.
4. Teacher marks the class completed.
5. Parent confirms summary visibility.
6. Admin syncs recording after BBB processing.
7. Admin reviews and publishes recording only if appropriate.
8. QA reviewer completes same-day quality review.
9. Run `verify_group_7_pilot_feedback.sql`.

## Live Observation Checklist

Observer should record:

```text
Session ID:
Teacher ID:
Student IDs:
Parent IDs:
Scheduled start:
Actual teacher start:
First student join:
Audio issue? yes/no
Camera issue? yes/no
Whiteboard issue? yes/no
Chat issue? yes/no
Student needed support? yes/no
Parent needed support? yes/no
Recording expected? yes/no
Recording synced? yes/no
Attendance saved? yes/no
Parent summary visible? yes/no
Private notes hidden? yes/no
QA completed? yes/no
Overall result: PASS / PASS WITH FIXES / HOLD
```

## Feedback Templates

Teacher feedback:

```text
Class date:
Did the class start smoothly?
Were students able to join?
Was BBB easy to use?
Was the whiteboard useful for Arabic/pre-Quran review?
Was attendance and notes easy to complete?
What slowed you down?
What should be improved before more classes?
Would you run another class with this setup?
```

Parent feedback:

```text
Child name:
Was the class schedule clear?
Was joining the class easy for your child?
Did you receive the right reminders?
Could you see the teacher feedback after class?
Did the summary feel useful and trustworthy?
Did you have any privacy or safety concern?
What would make this better for your family?
```

Student feedback, parent-assisted if needed:

```text
Was it easy to join?
Could you hear the teacher?
Could you see the board?
Did you enjoy the review?
Was anything confusing?
```

Admin/support feedback:

```text
How many issues were reported?
Which issue repeated?
Which page caused confusion?
Did role access behave correctly?
Did reminders work?
Did recording review work?
Was any privacy concern raised?
What must be fixed before the next pilot?
```

## Issue Severity

Severity 1: launch blocker

- Parent sees another child's information.
- Private teacher note is visible to parent/student.
- Recording is visible without review.
- Student joins an unrelated class.
- BBB cannot create or join meetings.

Severity 2: serious pilot issue

- Reminder fails for multiple users.
- Teacher cannot complete attendance or notes.
- Parent cannot see summary after correct setup.
- Recording sync fails after BBB processing.
- QA or follow-up queue cannot be operated.

Severity 3: workflow friction

- Confusing label.
- Extra clicks.
- Teacher needs clearer instructions.
- Parent needs clearer schedule wording.

Severity 4: minor polish

- Styling issue.
- Text alignment.
- Non-blocking display issue.

## Issue Log Format

Use this format for every pilot issue:

```text
Issue ID:
Severity:
Reported by:
Role:
Session ID:
Student ID:
Teacher ID:
Parent ID:
URL:
Time:
Expected:
Actual:
Screenshot/evidence:
Audit row:
Owner:
Status:
Decision: fix now / fix before rollout / monitor / no action
```

## Post-Pilot Review Meeting

Hold the review within 24 hours.

Agenda:

1. Confirm whether the class ran.
2. Confirm whether students joined successfully.
3. Confirm whether parents saw only safe information.
4. Confirm whether attendance and summaries were completed.
5. Confirm whether recording review behaved correctly.
6. Review support contacts.
7. Review teacher feedback.
8. Review parent feedback.
9. Review QA score and coaching notes if any.
10. Decide next action.

## Decision Criteria

Go to next pilot when:

- No Severity 1 issue occurred.
- All Severity 2 issues are fixed or have a safe workaround.
- Parent access is correct.
- Teacher can complete review without admin intervention.
- Recording is not parent-visible until reviewed.
- Support team can explain common issues.

Hold when:

- Any Severity 1 issue occurred.
- BBB reliability is uncertain.
- Parent data visibility is uncertain.
- Teacher cannot complete post-class workflow.
- Support team cannot resolve common pilot issues.

Adjust and repeat pilot when:

- Core safety passed but workflow friction is high.
- Teacher or parent confusion is significant.
- Recording timing or notification timing needs expectation setting.

## Rollout Plan After Pilot

Suggested rollout:

1. Pilot 1: 1 teacher, 1 to 3 students.
2. Pilot 2: 1 teacher, 5 students.
3. Pilot 3: 1 teacher, 9 students.
4. Soft launch: 2 to 3 teachers.
5. Controlled launch: 10 teachers with daily monitoring.

Do not move to the next step unless the previous step passes the decision criteria.

## Pilot Findings Fix Pack

After each pilot, use:

```text
docs/bbb-group-8-pilot-fix-pack-rollout-readiness.md
src/moodle/local_prequran/sql/verify_group_8_rollout_readiness.sql
```
