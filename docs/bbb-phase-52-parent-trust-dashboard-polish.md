# Phase 52: Parent Trust Dashboard Polish & Mobile QA

This phase improves the Phase 51 parent hub so it feels operationally ready for families.

## Improvements

- Added top priority actions:
  - Join live class now.
  - Acknowledge schedule change.
  - Respond to teacher follow-up.
  - Open homework.
- Added parent-safe dashboard health messages for:
  - No upcoming sessions.
  - Missing read-receipt table.
  - No parent-visible summaries.
  - No approved recordings.
  - Missing parent/student linkage.
- Improved status labels:
  - `Waiting for your response`
  - `Schedule change needs acknowledgement`
  - Join state labels from the live-session join window.
- Added mobile layout tightening for the parent hub.
- Added `Parent live hub` links from:
  - Live schedule.
  - Live summaries.
  - Recurring class series schedule.
  - Approved recordings.
  - Trust center.

## Files To Upload

- `local/hubredirect/live_parent_trust.php`
- `local/hubredirect/live_schedule.php`
- `local/hubredirect/live_summaries.php`
- `local/hubredirect/live_series_schedule.php`
- `local/hubredirect/live_recordings.php`
- `local/hubredirect/live_trust.php`
- `local/prequran/sql/verify_live_parent_trust_polish.sql`

## Test URLs

```text
/local/hubredirect/live_parent_trust.php?childid=STUDENT_ID
/local/hubredirect/live_schedule.php?childid=STUDENT_ID
/local/hubredirect/live_summaries.php?childid=STUDENT_ID
/local/hubredirect/live_series_schedule.php?childid=STUDENT_ID
/local/hubredirect/live_recordings.php?childid=STUDENT_ID
/local/hubredirect/live_trust.php?childid=STUDENT_ID
```

## Verification

Run:

```text
local/prequran/sql/verify_live_parent_trust_polish.sql
```

Expected result:

- Parent hub counts match live-session data.
- Parent-link gap query is empty for real live students.
- Pending acknowledgement rows match what the dashboard shows as needing review.

