-- Pull the complete consumer/domain/workspace/admin record for ehelacademy.org.
-- This is read-only and prefix-agnostic for phpMyAdmin use.
-- Replace mdlgx_ below with your real Moodle table prefix if different
-- (run the SELECT ... information_schema.tables query in verify_consumer_schema.sql
-- to find it).

SELECT 'current_selected_database' AS check_name, DATABASE() AS value;

-- 1. Domain row(s) for ehelacademy.org / app.ehelacademy.org, and the consumer they point to.
SELECT 'domains' AS section,
       d.id AS domain_id,
       d.domain,
       d.domain_type,
       d.isprimary,
       d.sslstatus,
       d.verificationstatus,
       d.status AS domain_status,
       c.id AS consumerid,
       c.slug AS consumer_slug,
       c.name AS consumer_name
FROM mdlgx_local_prequran_consumer_domain d
JOIN mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE d.domain IN ('ehelacademy.org', 'www.ehelacademy.org', 'app.ehelacademy.org')
ORDER BY d.domain_type, d.isprimary DESC;

-- 2. Full consumer app record (branding, routes, faith/institution fields, etc.)
--    matched by domain above, or by slug/name as a fallback if the domain isn't
--    attached yet.
SELECT 'consumer' AS section, c.*
FROM mdlgx_local_prequran_consumer c
WHERE c.id IN (
    SELECT d.consumerid
    FROM mdlgx_local_prequran_consumer_domain d
    WHERE d.domain IN ('ehelacademy.org', 'www.ehelacademy.org', 'app.ehelacademy.org')
)
OR c.slug = 'ehel-academy'
OR c.name = 'Ehel Academy';

-- 3. Primary workspace behind that consumer (plan, limits, settingsjson).
SELECT 'workspace' AS section, w.*
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = w.id
WHERE c.slug = 'ehel-academy' OR c.name = 'Ehel Academy';

-- 4. Workspace members (first admin/owner) with their Moodle user identity.
SELECT 'workspace_members' AS section,
       m.workspace_role,
       m.status AS member_status,
       u.id AS userid,
       u.username,
       u.firstname,
       u.lastname,
       u.email
FROM mdlgx_local_prequran_workspace_member m
JOIN mdlgx_user u ON u.id = m.userid
JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = m.workspaceid
WHERE c.slug = 'ehel-academy' OR c.name = 'Ehel Academy';
