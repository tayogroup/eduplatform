-- Phase 43 verification: Admin Teacher Assignment & Capacity Planning.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Teacher weekly assigned hours and students.
SELECT
    s.teacherid,
    CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS teacher_name,
    COUNT(*) AS week_sessions,
    ROUND(SUM(GREATEST(0, s.scheduled_end - s.scheduled_start)) / 3600, 1) AS assigned_hours,
    COUNT(DISTINCT p.studentid) AS distinct_students,
    SUM(CASE WHEN s.scheduled_start >= UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS upcoming_sessions
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_user u
       ON u.id = s.teacherid
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY))
  AND s.scheduled_start < UNIX_TIMESTAMP(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY))
  AND s.status NOT IN ('cancelled', 'failed')
GROUP BY s.teacherid, u.firstname, u.lastname
ORDER BY assigned_hours DESC
LIMIT 100;

-- 2) Teacher weekly availability capacity.
SELECT
    a.teacherid,
    CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS teacher_name,
    ROUND(SUM(GREATEST(0, a.end_minute - a.start_minute)) / 60, 1) AS available_hours,
    COUNT(*) AS availability_windows
FROM mdlgx_local_prequran_live_availability a
LEFT JOIN mdlgx_user u
       ON u.id = a.teacherid
WHERE a.status = 'active'
GROUP BY a.teacherid, u.firstname, u.lastname
ORDER BY available_hours DESC
LIMIT 100;

-- 3) Open quality workload by teacher.
SELECT
    s.teacherid,
    CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS teacher_name,
    SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issues,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plans_open
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_user u
       ON u.id = s.teacherid
WHERE s.status NOT IN ('cancelled', 'failed')
GROUP BY s.teacherid, u.firstname, u.lastname
HAVING qa_issues > 0
    OR coaching_open > 0
    OR leadership_open > 0
    OR plans_open > 0
ORDER BY leadership_open DESC, coaching_open DESC, plans_open DESC
LIMIT 100;

-- 4) Slot conflict test. Change the proposed date/time as needed.
SET @proposed_start := UNIX_TIMESTAMP('2026-05-11 16:00:00');
SET @proposed_end := @proposed_start + 3600;

SELECT
    teacherid,
    COUNT(*) AS overlapping_sessions
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start < @proposed_end
  AND scheduled_end > @proposed_start
  AND status NOT IN ('cancelled', 'failed')
GROUP BY teacherid
ORDER BY overlapping_sessions DESC
LIMIT 100;
