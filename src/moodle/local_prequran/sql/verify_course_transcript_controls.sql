-- Read-only transcript hold/correction verification.
-- Replace :workspaceid with a concrete workspace id, or 0 for all workspaces.
-- Replace :studentid with a concrete student id, or 0 for all students.

SELECT
    'hold' AS record_type,
    h.id,
    h.workspaceid,
    h.studentid,
    h.status,
    h.holdtype AS category,
    h.reason,
    h.resolutionnote,
    h.timecreated,
    h.timemodified
FROM mdl_local_prequran_transcript_hold h
WHERE (:workspaceid = 0 OR h.workspaceid = :workspaceid)
  AND (:studentid = 0 OR h.studentid = :studentid)

UNION ALL

SELECT
    'correction' AS record_type,
    o.id,
    o.workspaceid,
    o.studentid,
    o.status,
    o.fieldpath AS category,
    o.reason,
    CONCAT('old=', COALESCE(o.oldvalue, ''), ' new=', COALESCE(o.newvalue, '')) AS resolutionnote,
    o.timecreated,
    o.timemodified
FROM mdl_local_prequran_transcript_override o
WHERE (:workspaceid = 0 OR o.workspaceid = :workspaceid)
  AND (:studentid = 0 OR o.studentid = :studentid)
ORDER BY timecreated DESC, id DESC;

