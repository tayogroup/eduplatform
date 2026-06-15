# Phase 19 - Teacher Availability and Conflict Prevention

This phase prevents bad schedules before sessions are created.

## Added behavior

- One-time sessions and recurring series are checked before insert.
- Teacher overlaps are blocked.
- Student overlaps are blocked.
- BBB participant capacity is checked.
- Teacher availability windows are enforced when configured.
- Site admins can override conflicts only with a reason.

## Audit rows

- `schedule_conflict_blocked`
- `schedule_conflict_override`
- `availability_updated`

## Database

Run:

```sql
src/moodle/local_prequran/sql/create_live_availability.sql
```

Then verify:

```sql
src/moodle/local_prequran/sql/verify_live_conflicts.sql
```

## Pages

- `/local/hubredirect/live_sessions.php`
  - conflict checks before creating sessions
  - admin override fields
- `/local/hubredirect/live_availability.php`
  - teacher/admin weekly availability windows

## Notes

If no availability rows exist for a teacher, only overlap and capacity checks apply. Once availability windows exist, sessions outside those windows are blocked unless an admin override is used.
