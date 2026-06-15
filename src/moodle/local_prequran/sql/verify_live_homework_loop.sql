-- Phase 24 verification: post-class action plan and homework loop.
-- Replace mdlgx_ with your Moodle table prefix if needed.

-- 1) Homework/action plans visible to parents.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.homework,
    n.homework_lessonid,
    n.homework_unitid,
    n.homework_priority,
    FROM_UNIXTIME(NULLIF(n.homework_due_date, 0)) AS homework_due_date,
    n.visible_to_parent,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.visible_to_parent = 1
  AND TRIM(CONCAT(COALESCE(n.homework, ''), COALESCE(n.homework_unitid, ''))) <> ''
ORDER BY n.timemodified DESC
LIMIT 50;

-- 2) Assigned homework completion status against lesson progress.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.homework_lessonid,
    n.homework_unitid,
    n.homework_priority,
    FROM_UNIXTIME(NULLIF(n.homework_due_date, 0)) AS due_date,
    lp.overall_status,
    lp.completion_percent,
    lp.steps_completed,
    lp.steps_total,
    CASE
        WHEN n.homework_unitid = '' THEN 'TEXT_ONLY_HOMEWORK'
        WHEN lp.overall_status = 'completed' OR lp.completion_percent >= 80 THEN 'HOMEWORK_READY'
        WHEN lp.id IS NULL THEN 'NOT_STARTED'
        ELSE 'IN_PROGRESS'
    END AS homework_status
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
LEFT JOIN mdlgx_local_prequran_lessonprog lp
       ON lp.userid = n.studentid
      AND CONVERT(lp.lessonid USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(n.homework_lessonid USING utf8mb4) COLLATE utf8mb4_unicode_ci
      AND CONVERT(lp.unitid USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(n.homework_unitid USING utf8mb4) COLLATE utf8mb4_unicode_ci
WHERE n.visible_to_parent = 1
  AND TRIM(CONCAT(COALESCE(n.homework, ''), COALESCE(n.homework_unitid, ''))) <> ''
ORDER BY n.homework_due_date ASC, n.timemodified DESC
LIMIT 100;

-- 3) Homework due or overdue.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.homework_unitid,
    n.homework_priority,
    FROM_UNIXTIME(NULLIF(n.homework_due_date, 0)) AS due_date
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.visible_to_parent = 1
  AND n.homework_due_date > 0
  AND n.homework_due_date <= UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 3 DAY))
ORDER BY n.homework_due_date ASC
LIMIT 50;
