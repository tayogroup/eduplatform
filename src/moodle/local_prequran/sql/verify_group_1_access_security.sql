-- Group 1 verification: access, roles, and security hardening.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Denied access and sensitive security audit events.
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
    'live_review_access_denied',
    'live_summary_access_denied',
    'live_summary_response_denied',
    'live_recording_access_denied',
    'live_trust_access_denied',
    'purge_evidence_access_denied',
    'purge_evidence_invalid_record_denied',
    'private_teacher_note_saved'
)
ORDER BY id DESC
LIMIT 100;

-- 2) Private teacher notes exist only in the private note field; audit stores length only.
SELECT
    sessionid,
    studentid,
    teacherid,
    visible_to_parent,
    LENGTH(private_note) AS private_note_length,
    FROM_UNIXTIME(timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note
WHERE private_note IS NOT NULL
  AND private_note <> ''
ORDER BY timemodified DESC
LIMIT 50;

-- 3) Parent-facing summaries still expose only parent-visible rows.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.visible_to_parent,
    n.strengths,
    n.needs_practice,
    n.homework,
    n.parent_summary,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.visible_to_parent = 1
ORDER BY n.timemodified DESC
LIMIT 50;

-- 4) Parent-facing recordings still expose only approved, unexpired available recordings.
SELECT
    r.id,
    r.sessionid,
    s.title,
    r.status,
    r.visible_to_parent,
    r.playback_format,
    FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat,
    FROM_UNIXTIME(r.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_recording r
JOIN mdlgx_local_prequran_live_session s ON s.id = r.sessionid
WHERE r.visible_to_parent = 1
  AND r.status = 'available'
  AND (r.expiresat = 0 OR r.expiresat > UNIX_TIMESTAMP())
ORDER BY r.timemodified DESC
LIMIT 50;
