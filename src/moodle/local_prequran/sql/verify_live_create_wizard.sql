-- Phase 44 verification: Guided Session Creation Wizard.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Teachers available to the wizard.
SELECT teacherid, source, COUNT(*) AS source_rows
FROM (
    SELECT teacherid, 'live_session' AS source
    FROM mdlgx_local_prequran_live_session
    WHERE teacherid > 0
    UNION ALL
    SELECT teacherid, 'availability' AS source
    FROM mdlgx_local_prequran_live_availability
    WHERE teacherid > 0
      AND status = 'active'
    UNION ALL
    SELECT teacherid, 'teacher_student' AS source
    FROM mdlgx_local_prequran_teacher_student
    WHERE teacherid > 0
      AND status = 'active'
) t
GROUP BY teacherid, source
ORDER BY teacherid, source
LIMIT 100;

-- 2) Recent sessions created by the guided wizard final submit still land in the core live-session tables.
SELECT
    s.id,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.lessonid,
    s.unitid,
    s.status,
    COUNT(DISTINCT p.studentid) AS students
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
GROUP BY
    s.id,
    s.title,
    s.teacherid,
    s.scheduled_start,
    s.scheduled_end,
    s.lessonid,
    s.unitid,
    s.status
ORDER BY s.id DESC
LIMIT 25;

-- 3) Wizard-created audit rows.
SELECT
    a.id,
    a.sessionid,
    a.actorid,
    a.action,
    a.targettype,
    a.targetid,
    a.details,
    FROM_UNIXTIME(a.timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit a
WHERE a.action = 'created_from_wizard'
ORDER BY a.id DESC
LIMIT 25;

-- 4) Conflict preview source query. Change teacher/date/time as needed.
SET @teacherid := 36;
SET @proposed_start := UNIX_TIMESTAMP('2026-05-11 16:00:00');
SET @proposed_end := @proposed_start + 3600;

SELECT
    id,
    title,
    FROM_UNIXTIME(scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(scheduled_end) AS scheduled_end,
    status
FROM mdlgx_local_prequran_live_session
WHERE teacherid = @teacherid
  AND status NOT IN ('cancelled', 'failed')
  AND scheduled_start < @proposed_end
  AND scheduled_end > @proposed_start
ORDER BY scheduled_start ASC;
