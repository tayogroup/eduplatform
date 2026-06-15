# Phase 38: Automated Improvement Plan Reminders & Escalations

Phase 38 keeps teacher improvement plans moving after leadership assigns them.

## What Changed

- The existing live-session scheduled task now checks active improvement plans.
- Teachers receive reminders when:
  - a plan is assigned but not acknowledged after 24 hours;
  - a plan is due within 24 hours.
- Overdue plans are recorded with a session-level audit row.
- Admins receive escalation notifications when a plan is overdue.
- Operations dashboard now counts improvement plan alerts from the last 7 days.

## Audit Actions

- `improvement_plan_teacher_reminder_sent`
- `improvement_plan_due_soon_sent`
- `improvement_plan_overdue`
- `improvement_plan_admin_escalated`

## Files

- `local/prequran/classes/task/live_session_reminders.php`
- `local/hubredirect/live_ops.php`
- `local/prequran/sql/verify_live_improvement_plan_reminders.sql`

## Test

1. Ensure Phase 37 SQL has already been run.
2. Assign an improvement plan from `/local/hubredirect/live_leadership.php`.
3. For reminder testing, set `improvement_plan_assignedat` to more than 24 hours ago and keep `improvement_plan_ackat = 0`.
4. For due-soon testing, set `improvement_plan_due_date` within the next 24 hours.
5. For overdue testing, set `improvement_plan_due_date` in the past.
6. Run Moodle cron or run the scheduled task `\local_prequran\task\live_session_reminders`.
7. Run `verify_live_improvement_plan_reminders.sql`.
8. Confirm audit rows and the Operations dashboard `plan alerts 7d` metric.
