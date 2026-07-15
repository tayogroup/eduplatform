-- Verify institution custom-domain student intake workspace routing.
-- This is read-only. Replace mdlgx_ if your Moodle prefix is different.

SELECT 'huda_consumer_domain' AS check_name,
       c.slug AS consumer_slug,
       c.name AS consumer_name,
       c.consumer_type,
       c.primaryworkspaceid,
       d.domain,
       d.domain_type,
       d.workspaceid,
       d.status
FROM mdlgx_local_prequran_consumer c
JOIN mdlgx_local_prequran_consumer_domain d ON d.consumerid = c.id
WHERE c.slug = 'huda-school'
  AND d.domain = 'quraanacademy.info';

SELECT 'recent_huda_public_student_requests' AS check_name,
       r.id,
       c.slug AS consumer_slug,
       r.workspaceid,
       r.student_display_name,
       r.parent_name,
       r.status,
       r.transferred_userid,
       FROM_UNIXTIME(r.timecreated) AS submitted_at
FROM mdlgx_local_prequran_intake_request r
LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = r.consumerid
WHERE c.slug = 'huda-school'
   OR r.workspaceid = 3
ORDER BY r.id DESC
LIMIT 10;

SELECT 'workspace_members_after_transfer' AS check_name,
       wm.workspaceid,
       w.name AS workspace_name,
       wm.userid,
       u.username,
       u.firstname,
       u.lastname,
       wm.workspace_role,
       wm.status,
       FROM_UNIXTIME(wm.timecreated) AS linked_at
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
JOIN mdlgx_user u ON u.id = wm.userid
WHERE wm.workspaceid = 3
ORDER BY wm.id DESC
LIMIT 20;
