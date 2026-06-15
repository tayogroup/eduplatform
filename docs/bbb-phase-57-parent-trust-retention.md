# Phase 57: Parent Trust Data Retention & Purge Readiness

This phase adds a dry-run retention dashboard for parent trust support audit records.

## What Changed

- Added `/local/hubredirect/live_parent_trust_retention.php`.
- The page is admin-only.
- The page does not delete records.
- It shows:
  - total tracked parent trust support events
  - dry-run eligible records
  - staff and student counts
  - oldest event
  - age buckets: 0-30, 31-90, 91-180, 180+ days
  - event type counts
  - reason summary
  - dry-run purge candidates
- Retention policy options:
  - 180 days
  - 365 days recommended
  - 730 days
- Admin Ops and the review pack link to the retention dry-run page.

## Recommendation

Start with a 365-day retention policy for parent trust support/audit records unless Quraan Academy has a legal, contractual, or internal policy requiring a longer period.

Before any future purge action, export the compliance review pack first.

## Test

1. Log in as admin.
2. Open `/local/hubredirect/live_parent_trust_retention.php`.
3. Switch between 180, 365, and 730 days.
4. Confirm the dry-run eligible count changes as expected.
5. Confirm there is no delete/purge action.
6. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_retention.sql`.

