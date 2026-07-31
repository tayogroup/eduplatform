-- Provisions the 5 role-portal subdomains for Ehel K-12 School
-- (consumerid 8, workspaceid 23): students./teachers./parents./admins./
-- finance.k-12.ehelacademy.org. These back the new pqh_enforce_role_domain()
-- mechanism in accesslib.php, which keeps a logged-in user on their role's
-- subdomain for every page in the app (not just a one-time redirect at
-- login) once a matching, active row exists here.
--
-- consumerid/workspaceid/createdby are copied from the existing
-- 'k-12.ehelacademy.org' row rather than hardcoded, same technique as
-- fix_ehel_languages_missing_public_domain.sql.
--
-- IMPORTANT -- rows are inserted with status = 'pending', not 'active'.
-- pqh_role_portal_domain() only matches status = 'active', so these
-- subdomains are inert until flipped on below. Do NOT set status = 'active'
-- until, for EACH of the 5 hostnames:
--   1. A DNS record has been created pointing at the same host as
--      k-12.ehelacademy.org.
--   2. cPanel AutoSSL has issued and confirmed a certificate for it.
--   3. The hostname has been added to Moodle's allowed-host config the same
--      way k-12.ehelacademy.org was.
-- Flipping status to 'active' before DNS/SSL exist will send real users to
-- a subdomain that doesn't resolve or fails the certificate check.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Insert the 5 role-portal domain rows (status = 'pending' for now).
INSERT INTO mdlgx_local_prequran_consumer_domain
    (consumerid, workspaceid, domain, domain_type, isprimary, sslstatus,
     verificationstatus, verifiedat, status, createdby, timecreated, timemodified)
SELECT existing.consumerid, existing.workspaceid, roledomain.domain, roledomain.domain_type,
       0, 'not_checked', 'pending_dns', 0, 'pending', existing.createdby,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_local_prequran_consumer_domain existing
CROSS JOIN (
    SELECT 'students.k-12.ehelacademy.org' AS domain, 'student_portal' AS domain_type
    UNION ALL SELECT 'teachers.k-12.ehelacademy.org', 'teacher_portal'
    UNION ALL SELECT 'parents.k-12.ehelacademy.org', 'parent_portal'
    UNION ALL SELECT 'admins.k-12.ehelacademy.org', 'admin_portal'
    UNION ALL SELECT 'finance.k-12.ehelacademy.org', 'finance_portal'
) AS roledomain
WHERE existing.domain = 'k-12.ehelacademy.org'
LIMIT 5;

-- 2. Confirm the 5 rows landed correctly (all should show status = 'pending').
SELECT id, consumerid, workspaceid, domain, domain_type, isprimary, status, verificationstatus
FROM mdlgx_local_prequran_consumer_domain
WHERE domain IN (
    'students.k-12.ehelacademy.org',
    'teachers.k-12.ehelacademy.org',
    'parents.k-12.ehelacademy.org',
    'admins.k-12.ehelacademy.org',
    'finance.k-12.ehelacademy.org'
);

-- 3. Once DNS + AutoSSL are confirmed for a hostname, activate it with:
-- UPDATE mdlgx_local_prequran_consumer_domain
-- SET status = 'active', verificationstatus = 'verified', verifiedat = UNIX_TIMESTAMP()
-- WHERE domain = '<the hostname just verified>';
