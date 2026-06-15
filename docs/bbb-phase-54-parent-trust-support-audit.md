# Phase 54: Parent Trust Support Audit & Access Review

This phase adds an admin-only audit page for staff access to parent trust dashboard previews.

## What Changed

- Added `/local/hubredirect/live_parent_trust_audit.php`.
- The page supports filters by:
  - staff user ID
  - student user ID
  - date range
- The page shows:
  - filtered preview count
  - staff count
  - students previewed
  - today and 7-day preview totals
  - staff preview patterns to review
  - students with repeated preview events
  - detailed preview history
- Admin Ops now includes:
  - Parent trust audit navigation link
  - `parent previews 7d` metric
- The Parent Trust Dashboard staff support panel links to the audit page for the current student.

## Test

1. Log in as admin.
2. Open `/local/hubredirect/live_parent_trust.php?childid=<studentid>`.
3. Open `/local/hubredirect/live_parent_trust_audit.php`.
4. Confirm the preview appears in the history table.
5. Filter by the student ID and confirm only that student appears.
6. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_audit.sql`.

