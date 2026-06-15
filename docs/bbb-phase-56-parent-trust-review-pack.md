# Phase 56: Parent Trust Compliance Export & Review Pack

This phase adds an admin-only printable/exportable compliance pack for parent trust support access.

## What Changed

- Added `/local/hubredirect/live_parent_trust_review_pack.php`.
- The review pack supports filters by:
  - staff user ID
  - student user ID
  - access reason
  - date range
- The page shows:
  - preview events
  - staff involved
  - students previewed
  - previews with reasons
  - cases opened, resolved, and escalated
  - reason summary
  - detailed event log
- The page supports:
  - browser print
  - CSV download using `format=csv`
- Admin Ops and Parent Trust Audit now link to the review pack.

## Test

1. Log in as admin.
2. Open `/local/hubredirect/live_parent_trust_review_pack.php`.
3. Apply filters and confirm the numbers match the audit page.
4. Click `Download CSV`.
5. Open or inspect the CSV and confirm it includes summary rows and event detail rows.
6. Click `Print pack` and confirm the page prints without operational navigation.
7. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_review_pack.sql`.

