-- Course offering repair: approved/enrolled request rows vs Moodle manual enrollment.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is intentionally conservative:
-- - It marks request rows as enrolled only when Moodle already has an active enrolment.
-- - It does not create Moodle enrolments directly; use the admin UI Retry Moodle sync for that.

-- 1) Approved requests that are not yet linked to a Moodle enrolment.
SELECT r.id AS requestid,
       r.workspaceid,
       r.offeringid,
       o.title AS offering_title,
       r.studentid,
       u.username,
       u.email,
       u.idnumber AS account_no,
       o.moodlecourseid,
       c.fullname AS moodle_course,
       CASE
           WHEN c.id IS NULL THEN 'MISSING_MOODLE_COURSE'
           WHEN e.id IS NULL THEN 'MISSING_MANUAL_ENROL_METHOD'
           WHEN e.status <> 0 THEN 'MANUAL_ENROL_DISABLED'
           WHEN ue.id IS NULL THEN 'NOT_ENROLLED_IN_MOODLE'
           WHEN ue.status <> 0 THEN 'MOODLE_ENROLMENT_SUSPENDED'
           ELSE 'MOODLE_ENROLLED_BUT_REQUEST_NOT_MARKED'
       END AS mismatch_status,
       FROM_UNIXTIME(r.approvedat) AS approved_at
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
JOIN mdlgx_user u
  ON u.id = r.studentid
LEFT JOIN mdlgx_course c
  ON c.id = o.moodlecourseid
LEFT JOIN mdlgx_enrol e
  ON e.courseid = c.id
 AND e.enrol = 'manual'
LEFT JOIN mdlgx_user_enrolments ue
  ON ue.enrolid = e.id
 AND ue.userid = r.studentid
WHERE r.status = 'approved'
  AND COALESCE(r.moodleenrolledat, 0) = 0
ORDER BY r.approvedat ASC, r.timecreated ASC;

-- 2) Repair rows where Moodle enrolment already exists and is active.
UPDATE mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
JOIN mdlgx_enrol e
  ON e.courseid = o.moodlecourseid
 AND e.enrol = 'manual'
 AND e.status = 0
JOIN mdlgx_user_enrolments ue
  ON ue.enrolid = e.id
 AND ue.userid = r.studentid
 AND ue.status = 0
SET r.status = 'enrolled',
    r.moodleenrolledat = CASE
        WHEN COALESCE(r.moodleenrolledat, 0) > 0 THEN r.moodleenrolledat
        WHEN COALESCE(ue.timecreated, 0) > 0 THEN ue.timecreated
        ELSE UNIX_TIMESTAMP()
    END,
    r.timemodified = UNIX_TIMESTAMP(),
    r.admin_notes = TRIM(CONCAT(COALESCE(NULLIF(r.admin_notes, ''), ''), ' ', '[Repair] Moodle enrolment already existed; request marked enrolled.'))
WHERE r.status = 'approved'
  AND COALESCE(r.moodleenrolledat, 0) = 0;

-- 3) Verify remaining approved requests needing Moodle sync.
SELECT COUNT(*) AS remaining_approved_needing_sync
FROM mdlgx_local_prequran_course_enrol_req
WHERE status = 'approved'
  AND COALESCE(moodleenrolledat, 0) = 0;
