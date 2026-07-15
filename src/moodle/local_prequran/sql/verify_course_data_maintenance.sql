-- Course data maintenance and sanity checker.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Retention candidates: cancelled/rejected requests older than 365 days.
SELECT r.workspaceid,
       r.status,
       COUNT(*) AS old_terminal_requests,
       MIN(FROM_UNIXTIME(r.timemodified)) AS oldest_modified,
       MAX(FROM_UNIXTIME(r.timemodified)) AS newest_modified
FROM mdlgx_local_prequran_course_enrol_req r
WHERE r.status IN ('cancelled', 'rejected')
  AND r.timemodified > 0
  AND r.timemodified < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 365 DAY))
GROUP BY r.workspaceid, r.status
ORDER BY r.workspaceid, r.status;

-- 2) Old offerings eligible for automatic archive.
SELECT o.id AS offeringid,
       o.workspaceid,
       o.title,
       o.status,
       FROM_UNIXTIME(o.enddate) AS enddate,
       COUNT(CASE WHEN r.status IN ('pending', 'approved', 'enrolled', 'drop_requested') THEN 1 END) AS active_or_pending_requests
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_local_prequran_course_enrol_req r
  ON r.offeringid = o.id
WHERE o.status IN ('published', 'closed')
  AND o.enddate > 0
  AND o.enddate < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
GROUP BY o.id, o.workspaceid, o.title, o.status, o.enddate
HAVING active_or_pending_requests = 0
ORDER BY o.enddate ASC;

-- 3) Offering link sanity: missing/hidden Moodle course and manual enrolment readiness.
SELECT o.id AS offeringid,
       o.workspaceid,
       o.title,
       o.course_key,
       o.status AS offering_status,
       o.moodlecourseid,
       c.fullname AS moodle_course,
       c.visible AS moodle_visible,
       cc.name AS moodle_category,
       e.id AS manual_enrolid,
       e.status AS manual_enrol_status,
       CASE
           WHEN o.moodlecourseid <= 0 THEN 'FAIL: offering has no Moodle course id'
           WHEN c.id IS NULL THEN 'FAIL: Moodle course missing'
           WHEN c.visible = 0 THEN 'WARN: Moodle course hidden'
           WHEN e.id IS NULL THEN 'FAIL: manual enrolment missing'
           WHEN e.status <> 0 THEN 'FAIL: manual enrolment disabled'
           ELSE 'PASS'
       END AS sanity_status
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_course c
  ON c.id = o.moodlecourseid
LEFT JOIN mdlgx_course_categories cc
  ON cc.id = c.category
LEFT JOIN mdlgx_enrol e
  ON e.courseid = c.id
 AND e.enrol = 'manual'
ORDER BY CASE
             WHEN o.moodlecourseid <= 0 THEN 1
             WHEN c.id IS NULL THEN 2
             WHEN e.id IS NULL OR e.status <> 0 THEN 3
             WHEN c.visible = 0 THEN 4
             ELSE 9
         END,
         o.workspaceid,
         o.title;

-- 4) Approved requests that need Moodle sync.
SELECT r.id AS requestid,
       r.workspaceid,
       o.title AS offering_title,
       r.studentid,
       u.username,
       u.email,
       u.idnumber AS account_no,
       o.moodlecourseid,
       c.fullname AS moodle_course,
       FROM_UNIXTIME(r.approvedat) AS approved_at
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
JOIN mdlgx_user u
  ON u.id = r.studentid
LEFT JOIN mdlgx_course c
  ON c.id = o.moodlecourseid
WHERE r.status = 'approved'
  AND COALESCE(r.moodleenrolledat, 0) = 0
ORDER BY r.approvedat ASC, r.timecreated ASC;

-- 5) Recent maintenance/audit activity.
SELECT a.id AS auditid,
       a.workspaceid,
       a.action,
       a.targettype,
       a.targetid,
       FROM_UNIXTIME(a.timecreated) AS activity_time,
       a.details
FROM mdlgx_local_prequran_course_audit a
WHERE a.action IN ('course_data_maintenance_completed', 'terminal_requests_retained_then_deleted', 'old_offering_archived')
ORDER BY a.timecreated DESC, a.id DESC
LIMIT 50;
