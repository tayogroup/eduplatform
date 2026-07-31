-- READ-ONLY. Confirms whether skills.ehelacademy.org / app.skills.ehelacademy.org
-- have gone through the SSL/verification tracking step, to explain the
-- browser's "Not Secure" warning. sslstatus/verificationstatus are
-- informational bookkeeping columns only -- the app's own domain lookup
-- (pqh_resolve_consumer_context) does not filter on them, so a "not_checked"
-- value here does not block the app itself. It's a real signal that the
-- cPanel-side SSL certificate step likely hasn't been done yet, though.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT d.consumerid, d.domain, d.domain_type, d.isprimary, d.status,
       d.sslstatus, d.verificationstatus, d.verifiedat
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
WHERE d.domain IN ('skills.ehelacademy.org', 'app.skills.ehelacademy.org');

-- For comparison, the same columns for the two domains that already work.
SELECT d.consumerid, d.domain, d.domain_type, d.isprimary, d.status,
       d.sslstatus, d.verificationstatus, d.verifiedat
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
WHERE d.domain IN ('k-12.ehelacademy.org', 'app.k-12.ehelacademy.org', 'languages.ehelacademy.org', 'app.languages.ehelacademy.org');
