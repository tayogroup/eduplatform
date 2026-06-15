# Phase 15 - Live Session Completion Workflow

This phase closes the operational loop after a live class.

## Added behavior

- Teachers/admins can complete a session from `live_review.php`.
- Completion is only accepted when every active student has:
  - an attendance record
  - parent-visible public feedback with content
- If completion is attempted too early, the session moves to `needs_review` and an audit row is written.
- Teachers/admins can reschedule a session.
- Teachers/admins can cancel a session with a reason.
- Lifecycle audit rows are written for:
  - `session_completed`
  - `session_completion_blocked`
  - `session_cancelled`
  - `session_rescheduled`

## Updated pages

- `live_review.php`
  - Completion checklist
  - Complete session workflow
  - Reschedule action
  - Cancel action
- `live_teacher.php`
  - Needs Attention now means completion gaps, not just missing saved review
- `live_ops.php`
  - Admin dashboard now highlights completion gaps across teachers

## Test checklist

1. Open `/local/hubredirect/live_review.php?sessionid=1`.
2. Try to complete before all attendance and parent summaries are ready.
3. Confirm the page says completion is blocked and the session becomes `needs_review`.
4. Fill attendance and parent-visible summary for every student.
5. Check `Mark session completed` and save.
6. Confirm session status becomes `completed`.
7. Run `verify_live_completion.sql`.
8. Confirm `session_completed` appears in audit.

## Safety notes

- Private teacher notes are not part of completion readiness.
- Parents still see only parent-visible summaries and approved recordings.
- Cancellation and rescheduling are audited.
