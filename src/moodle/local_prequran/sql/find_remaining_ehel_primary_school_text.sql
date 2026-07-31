-- Diagnostic ONLY -- no UPDATEs. Finds every remaining place the text
-- "Ehel Primary School" (or "Primary School") could still be showing up,
-- beyond consumer.name / workspace.name (already handled by
-- rename_ehel_k12_to_primary_secondary.sql). These are all places that
-- SNAPSHOT text at creation time rather than referencing the consumer's
-- name live, so renaming the consumer/workspace never touches them.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for
-- your real table prefix if different. Run each block and check the
-- output before deciding what (if anything) needs fixing.

-- 1. The school's own copyjson -- custom landing headline/subtitle text is
--    free-form and typed by an admin; it does not track the consumer name.
SELECT 'consumer_copyjson' AS check_name, id, name, slug, copyjson
  FROM mdlgx_local_prequran_consumer
 WHERE (slug IN ('ehel-primary', 'ehel-k12') OR primaryworkspaceid = 23)
   AND copyjson LIKE '%Primary%';

-- 2. Moodle course categories -- created once, named from the consumer's
--    display name AT THAT TIME (see pqco_consumer_category_id() in
--    course_offeringlib.php). Later consumer renames never update these.
SELECT 'course_category' AS check_name, id, name, idnumber, parent
  FROM mdlgx_course_categories
 WHERE name LIKE '%Primary%' OR idnumber LIKE '%ehel%primary%' OR idnumber LIKE '%consumer_8%';

-- 3. Moodle courses themselves -- fullname/shortname set at course-creation
--    time, same snapshot problem as categories.
SELECT 'course' AS check_name, id, fullname, shortname, category
  FROM mdlgx_course
 WHERE fullname LIKE '%Primary%' OR shortname LIKE '%Primary%';

-- 4. Course offerings -- title/summary are admin-typed free text per offering.
SELECT 'course_offering' AS check_name, id, title, workspaceid
  FROM mdlgx_local_prequran_course_offering
 WHERE workspaceid = 23 AND (title LIKE '%Primary%' OR summary LIKE '%Primary%');
