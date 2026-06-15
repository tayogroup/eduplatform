# Phase 16 - Recurring Classes and Series Management

This phase adds recurring live classes while keeping the existing one-off session workflow.

## Database

Run:

```sql
src/moodle/local_prequran/sql/create_live_series.sql
```

This creates:

- `local_prequran_live_series`
- `local_prequran_live_session.seriesid`
- `local_prequran_live_session.series_sequence`

## Product behavior

- Admins and teachers can create either:
  - one live session
  - recurring class series
- Supported recurrence patterns:
  - daily
  - weekly
  - selected weekdays
- A series generates individual live sessions immediately.
- Each generated session keeps its own BBB meeting, attendance, review, completion, recording, and parent summary lifecycle.
- Admins and teachers can open `/local/hubredirect/live_series.php` to view recurring series and cancel future sessions in a series.

## Audit rows

- `series_created`
- `series_session_created`
- `series_cancelled`

## Verification

Run:

```sql
src/moodle/local_prequran/sql/verify_live_series.sql
```

Expected result:

- series table is `PRESENT`
- `seriesid` column is `PRESENT`
- `series_sequence` column is `PRESENT`
- generated sessions show `seriesid > 0`
