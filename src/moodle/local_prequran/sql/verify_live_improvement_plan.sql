-- Phase 37 verification: Teacher Improvement Plan Workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Improvement plan columns.
SHOW COLUMNS FROM mdlgx_local_prequran_live_session LIKE 'improvement_plan%';

-- 2) Improvement plan indexes.
SHOW INDEX FROM mdlgx_local_prequran_live_session
WHERE Key_name IN (
    'mdlgx_preq_live_session_impp_stat_ix',
    'mdlgx_preq_live_session_impp_tchr_ix',
    'mdlgx_preq_live_session_impp_mnt_ix'
);

-- 3) Open improvement plans.
SELECT
    id,
    title,
    teacherid,
    improvement_plan_status,
    improvement_plan_priority,
    improvement_plan_mentorid,
    FROM_UNIXTIME(NULLIF(improvement_plan_due_date, 0)) AS improvement_due,
    FROM_UNIXTIME(NULLIF(improvement_plan_assignedat, 0)) AS assigned_at,
    FROM_UNIXTIME(NULLIF(improvement_plan_ackat, 0)) AS acknowledged_at,
    FROM_UNIXTIME(NULLIF(improvement_plan_completedat, 0)) AS completed_at
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status <> 'none'
ORDER BY improvement_plan_due_date ASC, timemodified DESC
LIMIT 100;

-- 4) Improvement plan audit trail.
SELECT
    id,
    sessionid,
    actorid,
    action,
    targettype,
    targetid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'improvement_plan_assigned',
    'improvement_plan_updated',
    'improvement_plan_acknowledged',
    'improvement_plan_completed',
    'improvement_plan_reopened'
)
ORDER BY id DESC
LIMIT 100;
