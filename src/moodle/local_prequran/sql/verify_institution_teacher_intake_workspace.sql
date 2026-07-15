-- Verify institution teacher intake workspace routing.
-- This is read-only. Replace mdlgx_ if your Moodle prefix is different.

SELECT 'huda_teacher_applications' AS check_name,
       r.id,
       c.slug AS consumer_slug,
       r.workspaceid,
       r.teacher_name,
       r.email,
       r.status,
       r.converted_userid,
       r.converted_profileid,
       FROM_UNIXTIME(r.timecreated) AS submitted_at
FROM mdlgx_local_prequran_teacher_intake_request r
LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = r.consumerid
WHERE c.slug = 'huda-school'
   OR r.workspaceid = 3
ORDER BY r.id DESC
LIMIT 10;

SELECT 'huda_workspace_teachers' AS check_name,
       wm.workspaceid,
       w.name AS workspace_name,
       wm.userid,
       u.username,
       u.firstname,
       u.lastname,
       u.email,
       wm.workspace_role,
       wm.status,
       FROM_UNIXTIME(wm.timecreated) AS linked_at
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
JOIN mdlgx_user u ON u.id = wm.userid
WHERE wm.workspaceid = 3
  AND wm.workspace_role IN ('teacher', 'assistant_teacher')
ORDER BY wm.id DESC
LIMIT 20;

SELECT 'huda_teacher_profiles' AS check_name,
       tp.userid,
       u.username,
       tp.teacher_display_name,
       c.slug AS consumer_slug,
       tp.status,
       tp.marketplace_status,
       tp.vetting_status
FROM mdlgx_local_prequran_teacher_profile tp
JOIN mdlgx_user u ON u.id = tp.userid
LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = tp.consumerid
WHERE c.slug = 'huda-school'
ORDER BY tp.id DESC
LIMIT 20;
