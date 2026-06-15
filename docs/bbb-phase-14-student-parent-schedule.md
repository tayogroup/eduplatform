# BBB Phase 14: Student/Parent Scheduling Polish

This phase adds a family-friendly schedule page:

- URL: `/local/hubredirect/live_schedule.php?childid=STUDENT_USER_ID`
- Source: `src/moodle/local_hubredirect/live_schedule.php`

## What It Shows

- next live class
- teacher and scheduled time
- whether the join window is open
- upcoming live classes
- recent class outcomes
- links to summaries, recordings, and trust center

## Access

- parents see linked children
- students can see their own schedule
- teachers/admins can preview schedules for students they can access

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_schedule.sql
```

Then open:

```text
/local/hubredirect/live_schedule.php?childid=STUDENT_USER_ID
```
