# Phase 51: Parent Trust Dashboard

This phase adds one parent-facing hub for the live-class experience.

## New Page

- `local/hubredirect/live_parent_trust.php`

The page shows:

- Upcoming live sessions.
- Recurring class series acknowledgement status.
- Direct acknowledgement button for schedule changes.
- Latest parent-visible teacher summaries.
- Homework/action-plan links.
- Open follow-ups requiring parent response.
- Approved recordings.
- Trust and safety notes.

## Updated Page

- `local/hubredirect/dashboard.php`

The main Quraan Academy dashboard now links to the Parent Live Hub for the selected student.

## Verification

Run:

- `local/prequran/sql/verify_live_parent_trust_dashboard.sql`

Expected result:

- Students with live-session data show upcoming session, summary, follow-up, and recording counts.
- Acknowledgement rows show `CURRENT` or `NEEDS_REVIEW`.
- Parent acknowledgements from the dashboard write `series_schedule_acknowledged` audit rows with `parent_trust_dashboard` in the details.

## Test URL

Use:

```text
/local/hubredirect/live_parent_trust.php?childid=STUDENT_ID
```

