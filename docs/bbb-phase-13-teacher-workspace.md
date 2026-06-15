# BBB Phase 13: Teacher Live-Class Workspace

This phase adds a teacher command center:

- URL: `/local/hubredirect/live_teacher.php`
- Source: `src/moodle/local_hubredirect/live_teacher.php`

## What It Shows

- today's classes
- upcoming classes for the next 7 days
- classes needing attendance or notes
- recent completed classes
- attendance counts
- note counts
- parent-visible summary counts
- parent-visible recording counts

## Quick Links

- start class
- attendance and notes
- live sessions
- dashboard

Admins can view it too. Teachers see only their own sessions.

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_teacher.sql
```

Then open:

```text
/local/hubredirect/live_teacher.php
```
