# Phase 20 - Parent and Student Calendar

This phase adds a family-friendly calendar view for live classes.

## Added page

- `/local/hubredirect/live_calendar.php`

The page uses the same parent/student/teacher access rules as the live schedule page.

## Features

- Month calendar view.
- Class list for the current month.
- Join status:
  - join now
  - teacher has not started yet
  - opens soon
  - closed
- Recurring series labels when present.
- Links to:
  - join class
  - Trust Center
  - parent summary
  - approved recording
- `.ics` download for each session.

## Audit

When a user downloads an `.ics` file, an audit row is written:

- `calendar_downloaded`

## Verification

Run:

```sql
src/moodle/local_prequran/sql/verify_live_calendar.sql
```

Then test:

1. Open `/local/hubredirect/live_calendar.php?childid=50`.
2. Confirm the month view shows the student's sessions.
3. Click `Add to calendar`.
4. Confirm an `.ics` file downloads.
5. Run verification SQL and confirm `calendar_downloaded` appears.
