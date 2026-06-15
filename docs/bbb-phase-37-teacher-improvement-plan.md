# Phase 37: Teacher Improvement Plan Workflow

Phase 37 adds a formal improvement plan loop on top of QA and leadership review.

## What Changed

- Admins can assign improvement plans from the Leadership Review Command Center.
- Plans include goals, action steps, priority, due date, mentor ID, and completion notes.
- Teachers can acknowledge assigned plans from the Teacher Live-Class Workspace.
- Admin operations now tracks active and overdue improvement plans.
- Audit rows are written for assignment, update, acknowledgement, completion, and reopening.

## Files

- `local/hubredirect/live_leadership.php`
- `local/hubredirect/live_teacher.php`
- `local/hubredirect/live_ops.php`
- `local/prequran/sql/alter_live_session_improvement_plan.sql`
- `local/prequran/sql/verify_live_improvement_plan.sql`

## Install

Run `alter_live_session_improvement_plan.sql` once in phpMyAdmin, replacing `mdlgx_` if your Moodle prefix is different.

## Test

1. Open `/local/hubredirect/live_leadership.php`.
2. Open a flagged or in-review leadership case.
3. Set an improvement plan status to `Assigned`.
4. Add goals, actions, due date, priority, and optional mentor user ID.
5. Save the case.
6. Log in as the assigned teacher and open `/local/hubredirect/live_teacher.php`.
7. Confirm the plan appears under `Improvement Plans`.
8. Click `Acknowledge plan`.
9. Run `verify_live_improvement_plan.sql` and confirm:
   - `improvement_plan_*` columns exist.
   - indexes exist.
   - the session appears in the open plan query.
   - audit rows include `improvement_plan_assigned` and `improvement_plan_acknowledged`.
