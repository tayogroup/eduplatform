# Phase 55: Parent Trust Access Reason & Support Case Logging

This phase makes staff parent-dashboard previews accountable by recording why the preview happened.

## What Changed

- The staff-only Parent Trust Dashboard support panel now includes:
  - access reason
  - case status
  - support case note
- Saving the form writes audit rows:
  - `parent_trust_preview_opened`
  - `parent_trust_support_case_logged`
- The audit page now supports:
  - filtering by access reason
  - reasoned preview counts
  - support case event history
  - quick resolve action
- Resolving from the audit page writes:
  - `parent_trust_support_case_resolved`

No new database table is required. The support case trail is stored in `local_prequran_live_audit.details` as structured JSON.

## Test

1. Log in as admin.
2. Open `/local/hubredirect/live_parent_trust.php?childid=<studentid>`.
3. In Staff Preview & Support, choose a reason, status, and note.
4. Save the support reason.
5. Open `/local/hubredirect/live_parent_trust_audit.php`.
6. Filter by the same reason and confirm the row appears.
7. Click Resolve on the support case event.
8. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_support_cases.sql`.

