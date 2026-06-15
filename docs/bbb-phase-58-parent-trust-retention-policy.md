# Phase 58: Parent Trust Retention Policy Settings & Admin Approval Workflow

This phase adds governance settings and an approval workflow for future parent trust support audit purge readiness.

## What Changed

- Added Moodle plugin settings:
  - `parent_trust_retention_days`
  - `parent_trust_purge_requires_export`
  - `parent_trust_purge_approval_required`
- Updated `/local/hubredirect/live_parent_trust_retention.php` to show:
  - configured retention policy
  - current dry-run policy
  - export required status
  - approval required status
  - latest workflow decision
- Added admin workflow actions:
  - request purge review
  - approve readiness
  - reject with note
- Workflow actions write audit rows:
  - `parent_trust_purge_review_requested`
  - `parent_trust_purge_review_approved`
  - `parent_trust_purge_review_rejected`

No purge/delete action was added.

## Test

1. Go to Moodle admin settings for the PreQuran local plugin.
2. Confirm the Parent trust retention settings are visible.
3. Open `/local/hubredirect/live_parent_trust_retention.php`.
4. Confirm the configured policy appears.
5. Use Request, Approve, and Reject workflow actions with notes.
6. Run `src/moodle/local_prequran/sql/verify_live_parent_trust_retention_policy.sql`.

