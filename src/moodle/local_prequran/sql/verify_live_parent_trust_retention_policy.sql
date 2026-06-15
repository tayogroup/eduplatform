-- Phase 58 verification: Parent Trust Retention Policy Settings & Admin Approval Workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Confirm Moodle config settings exist.
SELECT
    name,
    value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
    'parent_trust_retention_days',
    'parent_trust_purge_requires_export',
    'parent_trust_purge_approval_required'
  )
ORDER BY name;

-- 2) Retention approval workflow audit rows.
SELECT
    id,
    actorid AS adminid,
    action,
    targettype,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_review_requested',
    'parent_trust_purge_review_approved',
    'parent_trust_purge_review_rejected'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Latest retention workflow state.
SELECT
    action AS latest_action,
    actorid AS adminid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_review_requested',
    'parent_trust_purge_review_approved',
    'parent_trust_purge_review_rejected'
)
ORDER BY timecreated DESC, id DESC
LIMIT 1;

-- 4) Dry-run candidates using configured 365-day default unless your setting differs.
SELECT
    COUNT(*) AS dry_run_candidates_365_days
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 365 DAY));

