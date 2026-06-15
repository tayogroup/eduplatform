-- Phase 54 verification: Parent Trust Support Audit & Access Review.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Recent staff preview audit rows.
SELECT
    id,
    actorid AS staffid,
    targetid AS studentid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
ORDER BY id DESC
LIMIT 100;

-- 2) Staff access pattern review.
SELECT
    actorid AS staffid,
    COUNT(*) AS preview_count,
    COUNT(DISTINCT targetid) AS student_count,
    MIN(FROM_UNIXTIME(timecreated)) AS first_preview,
    MAX(FROM_UNIXTIME(timecreated)) AS last_preview,
    CASE
        WHEN COUNT(DISTINCT targetid) >= 5 OR COUNT(*) >= 15 THEN 'REVIEW_ACCESS_REASON'
        WHEN COUNT(DISTINCT targetid) >= 3 OR COUNT(*) >= 5 THEN 'WATCH'
        ELSE 'NORMAL'
    END AS access_signal
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
GROUP BY actorid
ORDER BY student_count DESC, preview_count DESC
LIMIT 100;

-- 3) Students with repeated staff preview events.
SELECT
    targetid AS studentid,
    COUNT(*) AS preview_count,
    COUNT(DISTINCT actorid) AS staff_count,
    MIN(FROM_UNIXTIME(timecreated)) AS first_preview,
    MAX(FROM_UNIXTIME(timecreated)) AS last_preview,
    CASE
        WHEN COUNT(DISTINCT actorid) >= 3 OR COUNT(*) >= 10 THEN 'REVIEW'
        WHEN COUNT(DISTINCT actorid) >= 2 OR COUNT(*) >= 5 THEN 'WATCH'
        ELSE 'NORMAL'
    END AS review_signal
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
GROUP BY targetid
ORDER BY staff_count DESC, preview_count DESC
LIMIT 100;

-- 4) Admin ops metric check for parent dashboard previews in the last 7 days.
SELECT
    COUNT(*) AS parent_trust_previews_7d,
    COUNT(DISTINCT actorid) AS staff_count_7d,
    COUNT(DISTINCT targetid) AS student_count_7d
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));

