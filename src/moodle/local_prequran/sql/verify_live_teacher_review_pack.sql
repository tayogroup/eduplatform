-- Phase 41 verification: Teacher Profile Export & Review Pack.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Replace 36 with the teacher userid you want to verify.

SET @teacherid := 36;

-- 1) Review pack headline metrics.
SELECT
    s.teacherid,
    COUNT(*) AS sessions,
    COUNT(DISTINCT p.studentid) AS distinct_students,
    SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS qa_reviewed,
    ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
    ROUND(
        100 * SUM(CASE WHEN s.qa_status = 'passed' THEN 1 ELSE 0 END) /
        NULLIF(SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END), 0),
        0
    ) AS qa_pass_rate,
    SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issue_count,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') AND s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS coaching_overdue,
    SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS improvement_plans_open,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') AND s.improvement_plan_due_date > 0 AND s.improvement_plan_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS improvement_plans_overdue
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.teacherid = @teacherid
  AND s.status <> 'cancelled'
GROUP BY s.teacherid;

-- 2) Parent follow-up items that should appear in the review pack.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.followup_status,
    n.followup_resolved,
    n.parent_response_status,
    FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS contactedat,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE s.teacherid = @teacherid
  AND n.followup_status <> 'none'
ORDER BY n.followup_resolved ASC, n.timemodified DESC
LIMIT 50;

-- 3) Top QA checklist concern patterns for the selected teacher.
SELECT
    s.id,
    s.title,
    s.qa_status,
    s.qa_score,
    LEFT(s.qa_checklist, 240) AS qa_checklist_preview,
    FROM_UNIXTIME(NULLIF(s.qa_reviewedat, 0)) AS qa_reviewedat
FROM mdlgx_local_prequran_live_session s
WHERE s.teacherid = @teacherid
  AND s.qa_status <> 'not_reviewed'
  AND s.qa_checklist IS NOT NULL
  AND s.qa_checklist <> ''
ORDER BY s.qa_reviewedat DESC
LIMIT 50;

-- 4) Review pack source session rows.
SELECT
    s.id,
    s.title,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    s.status,
    s.qa_status,
    s.qa_score,
    s.qa_coaching_status,
    s.leadership_review_status,
    s.improvement_plan_status,
    s.improvement_plan_priority,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_due_date, 0)) AS improvement_plan_due_date
FROM mdlgx_local_prequran_live_session s
WHERE s.teacherid = @teacherid
  AND s.status <> 'cancelled'
ORDER BY s.scheduled_start DESC
LIMIT 100;
