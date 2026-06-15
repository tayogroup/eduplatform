-- Phase 6 verification: role-based browser smoke evidence.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and safe to run in phpMyAdmin after browser smoke testing.

-- 1) Latest sessions to choose the smoke-test session id.
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
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS parent_visible_recordings
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
         s.bbb_last_error
ORDER BY s.id DESC
LIMIT 10;

-- 2) Role smoke evidence matrix for the latest session.
-- Expected for a completed pilot: admin/teacher/student/parent rows should show PASS or NOT_APPLICABLE where no recording/follow-up exists.
SELECT 'admin_create_or_manage' AS smoke_area,
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_audit a
           WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND a.action IN ('session_created', 'live_session_created', 'bbb_created')
       ) THEN 'PASS' ELSE 'MISSING' END AS status,
       'Admin created/managed the pilot live session.' AS expected_evidence
UNION ALL
SELECT 'admin_recording_operation',
       CASE
           WHEN NOT EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_recording r
               WHERE r.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
           ) THEN 'NOT_APPLICABLE'
           WHEN EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_audit a
               WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
                 AND a.action IN ('recordings_synced', 'recording_reviewed', 'recording_published', 'recording_unpublished', 'recording_archived', 'recording_expired')
           ) THEN 'PASS'
           ELSE 'MISSING'
       END,
       'Admin synced/reviewed/managed recording metadata when a recording exists.'
UNION ALL
SELECT 'teacher_bbb_start',
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_audit a
           WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND a.action IN ('bbb_created', 'join_redirect', 'join_url_created')
       ) THEN 'PASS' ELSE 'MISSING' END,
       'Teacher started or opened the BBB meeting.'
UNION ALL
SELECT 'teacher_review_saved',
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_audit a
           WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND a.action = 'review_saved'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'Teacher saved attendance and notes.'
UNION ALL
SELECT 'teacher_completion',
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_audit a
           WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND a.action = 'session_completed'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'Teacher marked session complete after required review data.'
UNION ALL
SELECT 'student_join_or_attendance',
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_attendance a
           WHERE a.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND a.join_time > 0
       ) THEN 'PASS' ELSE 'MISSING' END,
       'Student joined inside the allowed window and attendance was recorded.'
UNION ALL
SELECT 'parent_summary_visibility',
       CASE WHEN EXISTS (
           SELECT 1
           FROM mdlgx_local_prequran_live_note n
           WHERE n.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
             AND n.visible_to_parent = 1
       ) THEN 'PASS' ELSE 'MISSING' END,
       'Parent-visible summary exists without exposing private note content.'
UNION ALL
SELECT 'parent_recording_visibility',
       CASE
           WHEN NOT EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_recording r
               WHERE r.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
           ) THEN 'NOT_APPLICABLE'
           WHEN EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_recording r
               WHERE r.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
                 AND r.visible_to_parent = 1
                 AND r.status = 'available'
                 AND r.reviewedat > 0
                 AND (r.expiresat = 0 OR r.expiresat > UNIX_TIMESTAMP(NOW()))
           ) THEN 'PASS'
           ELSE 'MISSING'
       END,
       'Parent can see only reviewed, visible, non-expired recordings.'
UNION ALL
SELECT 'parent_followup_or_ack',
       CASE
           WHEN EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_note n
               WHERE n.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
                 AND n.parent_response_status <> 'none'
           ) THEN 'PASS'
           WHEN EXISTS (
               SELECT 1
               FROM mdlgx_local_prequran_live_ack ack
               JOIN mdlgx_local_prequran_live_session s ON s.seriesid = ack.seriesid
               WHERE s.id = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
                 AND ack.ack_status = 'acknowledged'
           ) THEN 'PASS'
           ELSE 'NOT_APPLICABLE'
       END,
       'Parent response or schedule acknowledgement captured when the pilot included that path.';

-- 3) Privacy/access blockers. Expected result: zero for all blocker_count rows.
SELECT 'parent_visible_recording_without_review' AS blocker,
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND visible_to_parent = 1
  AND reviewedat = 0
UNION ALL
SELECT 'parent_visible_recording_after_expiry',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND visible_to_parent = 1
  AND expiresat > 0
  AND expiresat < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT 'bbb_error_on_smoke_session',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE id = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'active_student_missing_attendance',
       COUNT(*)
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = p.sessionid
      AND a.studentid = p.studentid
WHERE p.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
  AND p.role = 'student'
  AND p.status = 'active'
  AND a.id IS NULL;

-- 3b) Parent-summary safety review.
-- private_note_length can be non-zero in storage, but private_note text must not appear in parent screenshots.
SELECT n.sessionid,
       n.studentid,
       n.visible_to_parent,
       CHAR_LENGTH(COALESCE(n.private_note, '')) AS private_note_length,
       LEFT(COALESCE(n.strengths, ''), 120) AS strengths_preview,
       LEFT(COALESCE(n.needs_practice, ''), 120) AS needs_practice_preview,
       LEFT(COALESCE(n.homework, ''), 120) AS homework_preview,
       LEFT(COALESCE(n.parent_summary, ''), 120) AS parent_summary_preview
FROM mdlgx_local_prequran_live_note n
WHERE n.sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
ORDER BY n.studentid ASC;

-- 4) Latest session audit rows for screenshots/evidence.
SELECT id,
       sessionid,
       actorid,
       action,
       targettype,
       targetid,
       LEFT(COALESCE(details, ''), 220) AS details_preview,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE sessionid = (SELECT MAX(id) FROM mdlgx_local_prequran_live_session)
ORDER BY id DESC
LIMIT 100;

-- 5) Student isolation check shape.
-- For the smoke student, the browser should only show rows where they are an active participant.
SELECT p.userid AS student_userid,
       COUNT(DISTINCT p.sessionid) AS assigned_session_count,
       GROUP_CONCAT(DISTINCT p.sessionid ORDER BY p.sessionid ASC) AS assigned_session_ids
FROM mdlgx_local_prequran_live_participant p
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.userid
ORDER BY assigned_session_count DESC, p.userid ASC
LIMIT 25;
