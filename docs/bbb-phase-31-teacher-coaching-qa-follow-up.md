# Phase 31: Teacher Coaching & QA Follow-Up Loop

This phase turns QA concerns into a trackable teacher coaching workflow.

## What It Adds

- Coaching fields on `local_prequran_live_session`:
  - `qa_coaching_status`
  - `qa_coaching_priority`
  - `qa_coaching_due_date`
  - `qa_coaching_ackby`
  - `qa_coaching_ackat`
  - `qa_coaching_completedby`
  - `qa_coaching_completedat`
- Admin workflow from `live_quality.php`:
  - assign coaching
  - set priority
  - set due date
  - mark completed
- Teacher workflow from `live_teacher.php`:
  - see assigned coaching
  - acknowledge coaching
- Admin visibility:
  - coaching queue in `live_ops.php`
  - coaching metrics in `live_reports.php`
- Audit rows:
  - `quality_coaching_assigned`
  - `quality_coaching_acknowledged`
  - `quality_coaching_completed`
  - `quality_coaching_updated`

## Files

- `src/moodle/local_prequran/sql/alter_live_session_quality_coaching.sql`
- `src/moodle/local_prequran/sql/verify_live_quality_coaching.sql`
- `src/moodle/local_hubredirect/live_quality.php`
- `src/moodle/local_hubredirect/live_teacher.php`
- `src/moodle/local_hubredirect/live_ops.php`
- `src/moodle/local_hubredirect/live_reports.php`

## Install

Run:

```sql
src/moodle/local_prequran/sql/alter_live_session_quality_coaching.sql
```

Then upload:

- `live_quality.php`
- `live_teacher.php`
- `live_ops.php`
- `live_reports.php`

## Test

1. Open a QA review:

```text
/local/hubredirect/live_quality.php?sessionid=SESSION_ID
```

2. Set QA status to `Needs coaching`.
3. Set coaching status to `Assigned`.
4. Choose priority and due date.
5. Save.
6. Log in as the teacher and open:

```text
/local/hubredirect/live_teacher.php
```

7. Confirm the coaching item appears.
8. Click `Acknowledge coaching`.
9. Log back in as admin, return to `live_quality.php`, set coaching status to `Completed`, and save.
10. Run:

```sql
src/moodle/local_prequran/sql/verify_live_quality_coaching.sql
```
