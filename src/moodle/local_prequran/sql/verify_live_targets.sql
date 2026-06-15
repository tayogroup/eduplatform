-- Phase 23 verification: live-session lesson targeting and teacher prep.
-- Replace mdlgx_ with your Moodle table prefix if needed.

-- 1) Sessions missing lesson/unit targets. New sessions should not appear here.
SELECT
    id,
    title,
    teacherid,
    lessonid,
    unitid,
    status,
    FROM_UNIXTIME(scheduled_start) AS scheduled_start
FROM mdlgx_local_prequran_live_session
WHERE COALESCE(lessonid, '') = ''
   OR COALESCE(unitid, '') = ''
ORDER BY scheduled_start DESC
LIMIT 50;

-- 2) Session target coverage.
SELECT
    COUNT(*) AS total_sessions,
    SUM(CASE WHEN COALESCE(lessonid, '') <> '' AND COALESCE(unitid, '') <> '' THEN 1 ELSE 0 END) AS targeted_sessions,
    SUM(CASE WHEN COALESCE(lessonid, '') = '' OR COALESCE(unitid, '') = '' THEN 1 ELSE 0 END) AS missing_target_sessions
FROM mdlgx_local_prequran_live_session;

-- 3) Teacher prep snapshot for live-session students.
SELECT
    s.id AS sessionid,
    s.title,
    s.lessonid AS target_lessonid,
    s.unitid AS target_unitid,
    p.studentid,
    lp.overall_status,
    lp.completion_percent,
    lp.steps_completed,
    lp.steps_total,
    FROM_UNIXTIME(NULLIF(lp.overall_lastactivity, 0)) AS latest_activity,
    CASE
        WHEN lp.overall_status = 'completed' OR lp.completion_percent >= 80 THEN 'READY'
        WHEN lp.id IS NULL THEN 'NO_TARGET_PROGRESS'
        ELSE 'NEEDS_GUIDED_PRACTICE'
    END AS prep_status
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_lessonprog lp
       ON lp.userid = p.studentid
      AND CONVERT(lp.lessonid USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(s.lessonid USING utf8mb4) COLLATE utf8mb4_unicode_ci
      AND CONVERT(lp.unitid USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(s.unitid USING utf8mb4) COLLATE utf8mb4_unicode_ci
ORDER BY s.scheduled_start DESC, p.studentid ASC
LIMIT 100;

-- 4) Speak-practice counts for each session target.
SELECT
    s.id AS sessionid,
    s.title,
    s.unitid AS target_unitid,
    p.studentid,
    COUNT(r.id) AS target_speak_recordings,
    FROM_UNIXTIME(NULLIF(MAX(r.timecreated), 0)) AS latest_recording
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_speakrec r
       ON r.userid = p.studentid
      AND r.unitid = s.unitid
      AND r.status <> 'upload_failed'
GROUP BY s.id, s.title, s.unitid, p.studentid
ORDER BY s.id DESC, p.studentid ASC
LIMIT 100;
