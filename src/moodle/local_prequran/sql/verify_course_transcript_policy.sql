-- Read-only transcript policy verification.
-- Replace :workspaceid with a concrete workspace id when running manually.

SELECT
    w.id AS workspaceid,
    w.name AS workspace_name,
    COALESCE(tp.status, 'missing') AS policy_status,
    COALESCE(tp.policyversion, 0) AS policyversion,
    COALESCE(tp.policyhash, '') AS policyhash,
    tp.timemodified
FROM mdl_local_prequran_workspace w
LEFT JOIN mdl_local_prequran_transcript_policy tp
       ON tp.workspaceid = w.id
WHERE (:workspaceid = 0 OR w.id = :workspaceid)
ORDER BY w.name ASC;

