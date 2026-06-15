# Phase 59: Parent Trust Purge Execution Safeguards

This phase adds the first guarded execution path for deleting old parent trust support audit records.

## Safeguards

- Admin-only.
- Deletes only these actions:
  - `parent_trust_preview_opened`
  - `parent_trust_support_case_logged`
  - `parent_trust_support_case_resolved`
- Never targets broader live-session audit rows.
- Requires export confirmation when the setting requires export.
- Requires latest retention workflow state to be approved when approval is required.
- Requires the typed confirmation phrase:
  - `PURGE PARENT TRUST AUDIT`
- Deletes a maximum of 500 records per run.
- Writes audit rows:
  - `parent_trust_purge_blocked`
  - `parent_trust_purge_started`
  - `parent_trust_purge_completed`

## Test

1. Open `/local/hubredirect/live_parent_trust_retention.php`.
2. Try the purge without the confirmation phrase and confirm it is blocked.
3. Approve readiness if approval is required.
4. Confirm the review pack has been exported.
5. Type `PURGE PARENT TRUST AUDIT`.
6. Execute the guarded purge.
7. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_purge_safeguards.sql`.

