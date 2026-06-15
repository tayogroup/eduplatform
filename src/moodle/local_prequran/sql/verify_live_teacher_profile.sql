-- Phase 40 verification: Teacher Performance Profile.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Replace 36 with the teacher userid you want to verify.

SET @teacherid := 36;

-- 1) Teacher profile summary.
SELECT
    s.teacherid,
    COUNT(*) AS sessions,
    COUNT(DISTINCT p.studentid) AS distinct_students,
    SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS qa_reviewed,
    ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
    SUM(CASE WHEN s.qa_status = 'passed' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN s.qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching,
    SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plans_open,
    SUM(CASE WHEN s.improvement_plan_status = 'completed' THEN 1 ELSE 0 END) AS plans_completed
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.teacherid = @teacherid
  AND s.status <> 'cancelled'
GROUP BY s.teacherid;

-- 2) Timeline source rows.
SELECT
    s.id,
    s.title,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    s.status,
    s.qa_status,
    s.qa_score,
    FROM_UNIXTIME(NULLIF(s.qa_reviewedat, 0)) AS qa_reviewedat,
    s.qa_coaching_status,
    s.leadership_review_status,
    s.improvement_plan_status,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_assignedat, 0)) AS plan_assignedat,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_due_date, 0)) AS plan_due_date
FROM mdlgx_local_prequran_live_session s
WHERE s.teacherid = @teacherid
  AND s.status <> 'cancelled'
ORDER BY s.scheduled_start DESC
LIMIT 100;

-- 3) Teacher-related audit rows.
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
LEFT JOIN mdlgx_local_prequran_live_session s
       ON s.id = a.sessionid
WHERE s.teacherid = @teacherid
   OR (a.targettype = 'user' AND a.targetid = @teacherid)
ORDER BY a.id DESC
LIMIT 100;
