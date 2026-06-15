-- Phase 28 verification: parent follow-up resolution experience.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Parent response columns exist.
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_live_note'
  AND COLUMN_NAME IN (
      'parent_response_status',
      'parent_response_message',
      'parent_responseby',
      'parent_responseat'
  )
ORDER BY FIELD(
    COLUMN_NAME,
    'parent_response_status',
    'parent_response_message',
    'parent_responseby',
    'parent_responseat'
);

-- 2) Parent responses on live follow-ups.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.followup_status,
    n.followup_resolved,
    n.parent_response_status,
    n.parent_response_message,
    n.parent_responseby,
    FROM_UNIXTIME(NULLIF(n.parent_responseat, 0)) AS parent_responseat,
    FROM_UNIXTIME(NULLIF(n.followup_resolvedat, 0)) AS followup_resolvedat
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.parent_response_status <> 'none'
ORDER BY n.parent_responseat DESC
LIMIT 50;

-- 3) Parent response audit rows.
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
    'followup_parent_acknowledged',
    'followup_homework_completed',
    'followup_parent_needs_help',
    'followup_parent_response_saved'
)
ORDER BY id DESC
LIMIT 100;
