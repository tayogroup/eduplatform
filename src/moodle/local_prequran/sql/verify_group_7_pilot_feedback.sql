-- Group 7 verification: Production Pilot Execution & Feedback Loop.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended to run after a pilot session.

-- 1) Latest pilot candidates.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
       s.status,
       s.bbb_meeting_id,
       s.bbb_created,
       LEFT(COALESCE(s.bbb_last_error, ''), 180) AS bbb_last_error,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) AS active_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT n.id) AS note_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS visible_parent_summaries,
       COUNT(DISTINCT r.id) AS recording_rows,
       COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS visible_recordings,
       s.qa_status,
       s.qa_score
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         s.bbb_meeting_id,
         s.bbb_created,
         s.bbb_last_error,
         s.qa_status,
         s.qa_score
ORDER BY s.scheduled_start DESC
LIMIT 10;

-- 2) Latest pilot attendance and student join shape.
SELECT s.id AS sessionid,
       s.title,
       p.studentid,
       p.userid AS participant_userid,
       p.status AS participant_status,
       a.attendance_status,
       a.participation_status,
       FROM_UNIXTIME(NULLIF(a.join_time, 0)) AS join_time,
       FROM_UNIXTIME(NULLIF(a.leave_time, 0)) AS leave_time,
       a.technical_issue,
       LEFT(COALESCE(a.notes, ''), 160) AS attendance_notes_preview
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
      AND a.studentid = p.studentid
WHERE s.id = (
    SELECT MAX(id)
    FROM mdlgx_local_prequran_live_session
)
ORDER BY p.studentid ASC;

-- 3) Parent-visible feedback safety check for latest session.
-- This query intentionally returns private_note length only, not private_note content.
SELECT s.id AS sessionid,
       s.title,
       n.studentid,
       n.teacherid,
       n.visible_to_parent,
       LEFT(COALESCE(n.strengths, ''), 120) AS strengths_preview,
       LEFT(COALESCE(n.needs_practice, ''), 120) AS needs_practice_preview,
       LEFT(COALESCE(n.homework, ''), 120) AS homework_preview,
       LEFT(COALESCE(n.parent_summary, ''), 120) AS parent_summary_preview,
       CHAR_LENGTH(COALESCE(n.private_note, '')) AS private_note_length,
       n.followup_status,
       n.parent_response_status,
       FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_note n
     ON n.sessionid = s.id
WHERE s.id = (
    SELECT MAX(id)
    FROM mdlgx_local_prequran_live_session
)
ORDER BY n.studentid ASC;

-- 4) Recording status for latest session.
SELECT r.id,
       r.sessionid,
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
WHERE r.sessionid = (
    SELECT MAX(id)
    FROM mdlgx_local_prequran_live_session
)
ORDER BY r.timemodified DESC;

-- 5) Latest session audit evidence.
SELECT id,
       sessionid,
       actorid,
       action,
       targettype,
       targetid,
       LEFT(COALESCE(details, ''), 220) AS details_preview,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE sessionid = (
    SELECT MAX(id)
    FROM mdlgx_local_prequran_live_session
)
ORDER BY id DESC
LIMIT 100;

-- 6) Pilot blockers found in latest session.
SELECT 'bbb_error' AS blocker,
       COUNT(*) AS count_value
FROM mdlgx_local_prequran_live_session
WHERE id = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'active_students_without_attendance',
       COUNT(*)
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = p.sessionid
      AND a.studentid = p.studentid
WHERE p.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND p.role = 'student'
  AND p.status = 'active'
  AND a.id IS NULL
UNION ALL
SELECT 'active_students_without_parent_summary',
       COUNT(*)
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = p.sessionid
      AND n.studentid = p.studentid
      AND n.visible_to_parent = 1
WHERE p.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND p.role = 'student'
  AND p.status = 'active'
  AND n.id IS NULL
UNION ALL
SELECT 'recordings_visible_without_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND visible_to_parent = 1
  AND reviewedby = 0
UNION ALL
SELECT 'notification_failures_for_session',
       COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND action = 'notification_failed';

