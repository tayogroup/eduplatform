-- Phase 42 verification: Admin Teacher Directory & Profile Finder.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Teacher directory source rows.
SELECT
    s.teacherid,
    CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS teacher_name,
    u.email,
    COUNT(*) AS session_count,
    COUNT(DISTINCT p.studentid) AS distinct_students,
    SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS qa_reviewed,
    ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
    SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issue_count,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plans_open,
    FROM_UNIXTIME(MAX(s.scheduled_start)) AS last_session
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_user u
       ON u.id = s.teacherid
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.status <> 'cancelled'
GROUP BY s.teacherid, u.firstname, u.lastname, u.email
ORDER BY last_session DESC
LIMIT 100;

-- 2) Open parent follow-up counts by teacher.
SELECT
    s.teacherid,
    COUNT(*) AS open_followups
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
  AND n.followup_resolved = 0
GROUP BY s.teacherid
ORDER BY open_followups DESC
LIMIT 100;

-- 3) Teachers needing attention.
SELECT
    s.teacherid,
    CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS teacher_name,
    COUNT(*) AS session_count,
    ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
    SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issue_count,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plans_open
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_user u
       ON u.id = s.teacherid
WHERE s.status <> 'cancelled'
GROUP BY s.teacherid, u.firstname, u.lastname
HAVING avg_qa_score < 75
    OR qa_issue_count > 0
    OR coaching_open > 0
    OR leadership_open > 0
    OR plans_open > 0
ORDER BY qa_issue_count DESC, coaching_open DESC, plans_open DESC
LIMIT 100;
