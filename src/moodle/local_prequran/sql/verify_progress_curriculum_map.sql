-- Learner-app progress vs curriculum map discovery checks.
-- Read-only. Replace mdlgx_ with the production table prefix if needed.
--
-- The portals render app quiz results out of local_prequran_progress and get
-- the course NAME from local_prequran_curriculum_map, joined on
-- progress.coursekey = curriculum_map.idnumber (progress_rolluplib.php,
-- pqpr_course_labels/pqpr_course_title). The map is written by the catalog_sync
-- task from catalog.json. When the join misses, a family sees the raw key
-- ("ehel-ien-l01") and a unit total counted from stored rows instead of the
-- real course length — which reads as 100% complete far too early.
--
-- Verified statically on 2026-08-06 against the live catalog feed
-- (https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog.json, 42 courses):
-- every app coursekey matches an idnumber EXCEPT Intensive English, where the
-- app emits ehel-ien-lNN and the catalog publishes ehel-intensive-eng-lNN.
-- These queries confirm that against the database and catch anything else.

-- 1) Required table availability. A zero here explains an empty result below —
-- but a zero is NOT proof the table is missing. On the shared cPanel host this
-- returned nothing while queries against the same tables ran fine (2026-08-06),
-- because information_schema answers only for the selected database: run it in
-- a phpMyAdmin tab with the database chosen, and treat "table not found" as
-- confirmed only when a real query raises error 1146.
SELECT 'table_exists' AS check_name, 'mdlgx_local_prequran_progress' AS target,
       COUNT(*) AS found
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_progress'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_curriculum_map', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_curriculum_map';

-- 2) Progress coursekeys with NO curriculum map row. Every key listed here is a
-- course whose learners currently see a raw idnumber and an inflated percent.
-- Expected: ehel-ien-l01 / ehel-ien-l02 and nothing else.
SELECT 'progress_coursekey_unmapped' AS check_name,
       p.environment,
       p.coursekey,
       COUNT(*) AS progress_rows,
       COUNT(DISTINCT p.userid) AS learners,
       MAX(p.timemodified) AS last_activity
FROM mdlgx_local_prequran_progress p
LEFT JOIN mdlgx_local_prequran_curriculum_map cm ON cm.idnumber = p.coursekey
WHERE cm.id IS NULL
GROUP BY p.environment, p.coursekey
ORDER BY learners DESC, p.coursekey;

-- 3) The map itself, with the progress attached to each course. An EMPTY result
-- means catalog_sync has never completed (or local_prequran/catalog_source_url
-- is unset), in which case every course shows a raw key — a scheduled-task
-- problem, not a code one. Only 'production' progress reaches a portal.
SELECT 'curriculum_map_inventory' AS check_name,
       cm.idnumber,
       cm.subject,
       cm.stage,
       cm.level,
       cm.unitcount,
       COUNT(p.id) AS progress_rows,
       COUNT(DISTINCT p.userid) AS learners
FROM mdlgx_local_prequran_curriculum_map cm
LEFT JOIN mdlgx_local_prequran_progress p
       ON p.coursekey = cm.idnumber
      AND p.environment = 'production'
GROUP BY cm.idnumber, cm.subject, cm.stage, cm.level, cm.unitcount
ORDER BY cm.idnumber;

-- 4) Courses that would print the SAME title. pqpr_course_title() builds
-- "<subject> · Stage <stage>" and only adds `level` when it names a distinct
-- programme — a school phase ('Primary', 'Lower Secondary', 'Upper Secondary'),
-- a bare number or an empty value says nothing the stage has not said already.
-- A row here whose levels are ALL generic is a collision a family cannot read
-- past (this is what put Intensive English and Primary English on the same
-- line). A row whose levels differ meaningfully is fine — that is the fix
-- working.
SELECT 'title_collision_candidates' AS check_name,
       cm.subject,
       cm.stage,
       COUNT(*) AS courses,
       GROUP_CONCAT(cm.idnumber ORDER BY cm.idnumber) AS idnumbers,
       GROUP_CONCAT(COALESCE(NULLIF(cm.level, ''), '(blank)') ORDER BY cm.idnumber) AS levels,
       SUM(CASE
             WHEN cm.level IS NULL
               OR cm.level = ''
               OR cm.level REGEXP '^[0-9]+$'
               OR LOWER(cm.level) IN ('primary', 'lower secondary', 'upper secondary')
             THEN 1 ELSE 0
           END) AS generic_levels
FROM mdlgx_local_prequran_curriculum_map cm
GROUP BY cm.subject, cm.stage
HAVING COUNT(*) > 1
ORDER BY cm.subject, cm.stage;

-- 5) Progress coursekeys with no Moodle course of that idnumber. This is the
-- gradebook path, not the label path: push_gradebook() in
-- externallib_progress.php resolves the course by idnumber and soft-skips when
-- it is absent, so these learners' quiz scores never reach a grade item.
SELECT 'progress_coursekey_no_moodle_course' AS check_name,
       p.coursekey,
       COUNT(DISTINCT p.userid) AS learners
FROM mdlgx_local_prequran_progress p
LEFT JOIN mdlgx_course c ON c.idnumber = p.coursekey
WHERE p.environment = 'production'
  AND c.id IS NULL
GROUP BY p.coursekey
ORDER BY learners DESC, p.coursekey;

-- 6) Where the unit total a family sees comes from. The rollup uses the map's
-- unitcount when it is > 0 and otherwise counts stored rows, so a course with
-- unitcount = 0 reports "N / N units - 100%" the moment a learner starts.
SELECT 'unitcount_unusable' AS check_name,
       cm.idnumber,
       cm.subject,
       cm.stage,
       cm.unitcount,
       COUNT(DISTINCT p.userid) AS learners_affected
FROM mdlgx_local_prequran_curriculum_map cm
JOIN mdlgx_local_prequran_progress p
     ON p.coursekey = cm.idnumber
    AND p.environment = 'production'
WHERE COALESCE(cm.unitcount, 0) <= 0
GROUP BY cm.idnumber, cm.subject, cm.stage, cm.unitcount
ORDER BY learners_affected DESC;

-- 7) Whether there is anything for the new panels to show at all: how many
-- production units hold at least one quiz checkpoint. An empty `checkpoints`
-- map serialises as {} when the state was never touched and as [] once an
-- unrelated event rewrote it (the ingest casts to array), so neither empty form
-- is matched here; a populated one always begins {" .
SELECT 'units_with_checkpoints' AS check_name,
       p.coursekey,
       COUNT(*) AS units_with_quiz_results,
       COUNT(DISTINCT p.userid) AS learners
FROM mdlgx_local_prequran_progress p
WHERE p.environment = 'production'
  AND p.statejson LIKE '%"checkpoints":{"%'
GROUP BY p.coursekey
ORDER BY units_with_quiz_results DESC, p.coursekey;
