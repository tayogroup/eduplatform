-- Quraan Academy BBB launch execution readiness checks.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- These checks should not expose BBB shared secret values or child-sensitive private notes.

-- 1) Required launch tables.
SELECT 'mdlgx_local_prequran_live_session' AS table_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_session'
UNION ALL
SELECT 'mdlgx_local_prequran_live_participant', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_participant'
UNION ALL
SELECT 'mdlgx_local_prequran_live_attendance', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_attendance'
UNION ALL
SELECT 'mdlgx_local_prequran_live_note', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_note'
UNION ALL
SELECT 'mdlgx_local_prequran_live_recording', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_recording'
UNION ALL
SELECT 'mdlgx_local_prequran_live_audit', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_live_audit'
UNION ALL
SELECT 'mdlgx_local_prequran_student_profile', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_student_profile'
UNION ALL
SELECT 'mdlgx_local_prequran_teacher_profile', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_teacher_profile'
UNION ALL
SELECT 'mdlgx_local_prequran_group_pool', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_group_pool'
UNION ALL
SELECT 'mdlgx_local_prequran_class_group', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_class_group'
UNION ALL
SELECT 'mdlgx_local_prequran_group_member', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_group_member'
UNION ALL
SELECT 'mdlgx_local_prequran_intake_request', CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'mdlgx_local_prequran_intake_request';

-- 2) Critical BBB configuration. Secret is reported only as CONFIGURED/MISSING.
SELECT name AS setting,
       CASE
           WHEN name = 'bbb_shared_secret' AND value <> '' THEN 'CONFIGURED'
           WHEN name = 'bbb_shared_secret' THEN 'MISSING'
           WHEN value <> '' THEN value
           ELSE 'MISSING'
       END AS status_or_value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
      'bbb_base_url',
      'bbb_shared_secret',
      'bbb_record_default',
      'bbb_join_window_before_minutes',
      'bbb_join_window_after_minutes',
      'bbb_max_participants_default',
      'bbb_recording_retention_days'
  )
ORDER BY name;

-- 3) Late-stage columns required by launch features.
SELECT table_name, column_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS column_status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
      (table_name = 'mdlgx_local_prequran_live_session' AND column_name IN (
          'groupid', 'qa_status', 'qa_score', 'qa_coaching_status',
          'leadership_review_status', 'improvement_plan_status'
      ))
      OR (table_name = 'mdlgx_local_prequran_live_series' AND column_name = 'groupid')
      OR (table_name = 'mdlgx_local_prequran_live_note' AND column_name IN (
          'homework_lessonid', 'homework_unitid', 'followup_status',
          'followup_threadid', 'parent_response_status'
      ))
      OR (table_name = 'mdlgx_local_prequran_student_profile' AND column_name IN (
          'student_display_name', 'parent_name', 'parent_email', 'course_type', 'special_needs'
      ))
      OR (table_name = 'mdlgx_local_prequran_teacher_profile' AND column_name IN (
          'userid', 'teacher_display_name', 'timezone', 'primary_language'
      ))
  )
GROUP BY table_name, column_name
ORDER BY table_name, column_name;

-- 4) Launch data counts.
SELECT 'student_profiles' AS metric, COUNT(*) AS value FROM mdlgx_local_prequran_student_profile
UNION ALL
SELECT 'teacher_profiles', COUNT(*) FROM mdlgx_local_prequran_teacher_profile
UNION ALL
SELECT 'matching_pools', COUNT(*) FROM mdlgx_local_prequran_group_pool
UNION ALL
SELECT 'class_groups', COUNT(*) FROM mdlgx_local_prequran_class_group
UNION ALL
SELECT 'group_members', COUNT(*) FROM mdlgx_local_prequran_group_member
UNION ALL
SELECT 'live_sessions', COUNT(*) FROM mdlgx_local_prequran_live_session
UNION ALL
SELECT 'live_participants', COUNT(*) FROM mdlgx_local_prequran_live_participant
UNION ALL
SELECT 'attendance_rows', COUNT(*) FROM mdlgx_local_prequran_live_attendance
UNION ALL
SELECT 'parent_visible_summaries', COUNT(*) FROM mdlgx_local_prequran_live_note WHERE visible_to_parent = 1;

-- 5) Recent BBB/session errors. Empty result means no active stored BBB errors.
SELECT id, title, bbb_meeting_id, status, bbb_created, bbb_last_error,
       FROM_UNIXTIME(timemodified) AS timemodified
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
ORDER BY timemodified DESC
LIMIT 25;

-- 6) Recording review queue.
SELECT r.id, r.sessionid, s.title, r.bbb_record_id, r.status, r.published, r.visible_to_parent,
       r.reviewedby, FROM_UNIXTIME(NULLIF(r.reviewedat, 0)) AS reviewedat,
       FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = r.sessionid
WHERE r.status = 'available'
  AND (r.reviewedby = 0 OR r.visible_to_parent = 0)
ORDER BY r.timemodified DESC
LIMIT 50;

-- 6b) Recording visibility blockers. Empty result means no expired or unreviewed recordings are visible to parents.
SELECT r.id,
       r.sessionid,
       s.title,
       r.bbb_record_id,
       r.status,
       r.visible_to_parent,
       r.reviewedby,
       FROM_UNIXTIME(NULLIF(r.reviewedat, 0)) AS reviewedat,
       FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat,
       CASE
           WHEN r.visible_to_parent = 1 AND r.reviewedat = 0 THEN 'VISIBLE_WITHOUT_REVIEW'
           WHEN r.visible_to_parent = 1 AND r.expiresat > 0 AND r.expiresat < UNIX_TIMESTAMP(NOW()) THEN 'VISIBLE_AFTER_EXPIRY'
           WHEN r.visible_to_parent = 1 AND r.status <> 'available' THEN 'VISIBLE_NON_AVAILABLE'
           ELSE 'OK'
       END AS blocker
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = r.sessionid
WHERE r.visible_to_parent = 1
  AND (
      r.reviewedat = 0
      OR (r.expiresat > 0 AND r.expiresat < UNIX_TIMESTAMP(NOW()))
      OR r.status <> 'available'
  )
ORDER BY r.timemodified DESC
LIMIT 50;

-- 7) Recording consent blockers. Empty result means no currently recording-enabled sessions have active students missing consent.
SELECT s.id AS sessionid,
       s.title,
       s.bbb_meeting_id,
       p.studentid,
       s.status,
       FROM_UNIXTIME(NULLIF(s.scheduled_start, 0)) AS scheduled_start
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
  ON p.sessionid = s.id
 AND p.role = 'student'
 AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_consent c
  ON c.studentid = p.studentid
 AND c.consent_type = 'recording'
 AND c.granted = 1
LEFT JOIN mdlgx_local_prequran_student_profile sp
  ON sp.userid = p.studentid
 AND sp.recording_consent = 1
 AND sp.status = 'active'
WHERE s.recording_enabled = 1
  AND s.recording_consent_required = 1
  AND c.id IS NULL
  AND sp.id IS NULL
ORDER BY s.scheduled_start ASC, s.id ASC, p.studentid ASC
LIMIT 100;

-- 8) Recent launch-sensitive audit actions.
SELECT id, sessionid, actorid, action, targettype, targetid, details,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'student_intake_created',
    'teacher_intake_created',
    'live_session_created',
    'join_session',
    'review_saved',
    'session_awaiting_review',
    'session_completed',
    'recordings_synced',
    'recording_reviewed',
    'recording_published',
    'recording_unpublished',
    'recording_archived',
    'recording_expired',
    'recording_disabled_missing_consent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 9) Session lifecycle status check.
-- Ended live sessions should be moved by the scheduled task into awaiting_review.
SELECT 'ended_live_sessions_not_moved' AS check_name,
       id,
       title,
       status,
       FROM_UNIXTIME(NULLIF(scheduled_end, 0)) AS scheduled_end
FROM mdlgx_local_prequran_live_session
WHERE scheduled_end < UNIX_TIMESTAMP(NOW())
  AND status = 'live'
ORDER BY scheduled_end ASC
LIMIT 50;

-- 10) Awaiting-review queue. These rows should appear in teacher/admin review queues.
SELECT id,
       title,
       teacherid,
       status,
       FROM_UNIXTIME(NULLIF(scheduled_end, 0)) AS scheduled_end,
       timemodified
FROM mdlgx_local_prequran_live_session
WHERE status = 'awaiting_review'
ORDER BY scheduled_end DESC, id DESC
LIMIT 50;
