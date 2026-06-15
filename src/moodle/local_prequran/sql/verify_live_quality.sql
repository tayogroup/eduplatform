-- Phase 30 verification: Live Session QA Checklist & Quality Review.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) QA columns.
SHOW COLUMNS FROM mdlgx_local_prequran_live_session LIKE 'qa_%';

-- 2) QA indexes.
SHOW INDEX FROM mdlgx_local_prequran_live_session
WHERE Key_name IN ('mdlgx_preq_live_session_qa_ix', 'mdlgx_preq_live_session_qaby_ix');

-- 3) Sessions needing QA review.
SELECT
    s.id,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    s.qa_status,
    s.qa_score,
    s.qa_reviewedby,
    FROM_UNIXTIME(NULLIF(s.qa_reviewedat, 0)) AS qa_reviewedat,
    COUNT(DISTINCT p.id) AS student_count,
    COUNT(DISTINCT a.id) AS attendance_count,
    COUNT(DISTINCT n.id) AS note_count,
    COUNT(DISTINCT r.id) AS recording_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
      AND r.status = 'available'
WHERE s.status <> 'cancelled'
  AND (
      s.qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue')
      OR s.qa_reviewedat = 0
  )
GROUP BY
    s.id,
    s.title,
    s.teacherid,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.qa_status,
    s.qa_score,
    s.qa_reviewedby,
    s.qa_reviewedat
ORDER BY s.scheduled_end DESC, s.id DESC
LIMIT 100;

-- 4) QA audit rows.
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
    'quality_review_saved',
    'quality_review_passed',
    'quality_review_needs_coaching',
    'quality_review_serious_issue'
)
ORDER BY id DESC
LIMIT 100;

-- 5) QA metrics.
SELECT 'not_reviewed' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status = 'not_reviewed'
UNION ALL
SELECT 'passed', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status = 'passed'
UNION ALL
SELECT 'needs_coaching', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status = 'needs_coaching'
UNION ALL
SELECT 'serious_issue', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status = 'serious_issue';
