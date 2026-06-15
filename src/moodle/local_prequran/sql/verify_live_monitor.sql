-- Phase 22 verification: student self-study monitoring integration.
-- Replace mdlgx_ with your Moodle table prefix if needed.

-- 1) Sessions with student participants and lesson focus.
SELECT
    s.id AS sessionid,
    s.title,
    s.teacherid,
    s.lessonid,
    s.unitid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    s.status,
    COUNT(DISTINCT p.studentid) AS student_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
GROUP BY
    s.id,
    s.title,
    s.teacherid,
    s.lessonid,
    s.unitid,
    s.scheduled_start,
    s.status
ORDER BY s.scheduled_start DESC
LIMIT 25;

-- 2) Latest lesson progress for live-session students.
SELECT
    s.id AS sessionid,
    s.title,
    p.studentid,
    lp.lessonid AS latest_lessonid,
    lp.unitid AS latest_unitid,
    lp.overall_status,
    lp.completion_percent,
    lp.steps_completed,
    lp.steps_total,
    FROM_UNIXTIME(NULLIF(lp.overall_lastactivity, 0)) AS latest_activity
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_lessonprog lp
       ON lp.userid = p.studentid
      AND lp.overall_lastactivity = (
          SELECT MAX(lp2.overall_lastactivity)
          FROM mdlgx_local_prequran_lessonprog lp2
          WHERE lp2.userid = p.studentid
      )
ORDER BY s.scheduled_start DESC, p.studentid ASC
LIMIT 50;

-- 3) Focus/self-study activity summary, if focus aggregation is installed.
SELECT
    p.studentid,
    COUNT(f.id) AS focus_rows,
    ROUND(COALESCE(SUM(f.active_ms), 0) / 60000, 1) AS active_minutes,
    COALESCE(SUM(f.idle_count), 0) AS idle_count,
    COALESCE(SUM(f.leave_count), 0) AS leave_count,
    FROM_UNIXTIME(NULLIF(MAX(f.last_time), 0)) AS last_focus_activity
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_focusagg f
       ON f.userid = p.studentid
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
ORDER BY last_focus_activity DESC
LIMIT 50;

-- 4) Speak-practice recording summary, if speak recordings are installed.
SELECT
    p.studentid,
    COUNT(r.id) AS recording_count,
    FROM_UNIXTIME(NULLIF(MAX(r.timecreated), 0)) AS latest_recording
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_speakrec r
       ON r.userid = p.studentid
      AND r.status <> 'upload_failed'
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
ORDER BY latest_recording DESC
LIMIT 50;

-- 5) Monitor access audit rows. This should populate after a teacher/admin opens live_monitor.php.
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
WHERE action = 'lesson_monitor_opened'
ORDER BY id DESC
LIMIT 50;
