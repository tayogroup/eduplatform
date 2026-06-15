SELECT
    r.id,
    r.sessionid,
    s.title,
    r.bbb_record_id,
    r.bbb_meeting_id,
    r.playback_format,
    r.duration_minutes,
    r.status,
    r.published,
    r.visible_to_parent,
    r.reviewedby,
    FROM_UNIXTIME(NULLIF(r.reviewedat, 0)) AS reviewedat,
    FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat,
    FROM_UNIXTIME(r.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s
    ON s.id = r.sessionid
ORDER BY r.timemodified DESC, r.id DESC
LIMIT 50;

SELECT
    'visible_without_review' AS check_name,
    COUNT(*) AS issue_count
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND reviewedat = 0
UNION ALL
SELECT
    'visible_after_expiry',
    COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND expiresat > 0
  AND expiresat < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT
    'visible_non_available',
    COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND status <> 'available';

SELECT
    action,
    COUNT(*) AS audit_count,
    MAX(FROM_UNIXTIME(timecreated)) AS latest_time
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'recordings_synced',
    'recording_reviewed',
    'recording_published',
    'recording_unpublished',
    'recording_archived',
    'recording_expired'
)
GROUP BY action
ORDER BY latest_time DESC, action ASC;
