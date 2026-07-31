-- Structured availability on the student profile (mirrors upgrade step
-- 202607310030; the upgrade also backfills from the newest transferred intake
-- request, so run the upgrade even if you add the column here first).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

ALTER TABLE ehelacad_quraantest.mdlgx_local_prequran_student_profile
    ADD COLUMN availability_json LONGTEXT NULL;

-- Backfill (same statement the upgrade runs).
UPDATE ehelacad_quraantest.mdlgx_local_prequran_student_profile sp
  JOIN (SELECT ir.transferred_userid, ir.availability_json
          FROM ehelacad_quraantest.mdlgx_local_prequran_intake_request ir
          JOIN (SELECT transferred_userid, MAX(id) AS maxid
                  FROM ehelacad_quraantest.mdlgx_local_prequran_intake_request
                 WHERE transferred_userid > 0 AND availability_json <> ''
              GROUP BY transferred_userid) latest
            ON latest.maxid = ir.id) src
    ON src.transferred_userid = sp.userid
   SET sp.availability_json = src.availability_json
 WHERE (sp.availability_json IS NULL OR sp.availability_json = '');

SELECT COUNT(*) AS profiles_with_availability
FROM ehelacad_quraantest.mdlgx_local_prequran_student_profile
WHERE availability_json IS NOT NULL AND availability_json <> '';
