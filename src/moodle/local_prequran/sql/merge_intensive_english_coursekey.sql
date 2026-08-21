-- One-time migration: Intensive English progress rows from the app's old
-- coursekey (ehel-ien-lNN) onto the catalogue's canonical one
-- (ehel-intensive-eng-lNN).
-- Replace mdlgx_ with the production table prefix if needed.
--
-- WHY. The learner app emitted ehel-ien-lNN while catalog.json publishes
-- ehel-intensive-eng-lNN, so every Intensive English progress row missed the
-- curriculum-map join and the Moodle course lookup. Two silent consequences,
-- both described in verify_progress_curriculum_map.sql: a family saw the raw
-- key as the course name with a unit total counted from stored rows (so
-- "3 / 3 units - 100%" after three units of twenty), and push_gradebook()
-- found no course by that idnumber and soft-skipped, so no quiz score from
-- this course ever reached a grade item.
--
-- The app was fixed on 2026-08-21 (shell/subjects/intensive-english.js,
-- released as app v230) and now emits the canonical form. This file moves the
-- rows written BEFORE that release.
--
-- RUN IT SOON, and here is the reason it is urgent rather than tidy-up:
-- local_prequran_progress carries a UNIQUE key on
-- (environment, userid, coursekey, unit) — preqprog_ucu_uix. Until the fixed
-- app shipped, nothing had ever written the canonical key for this course, so
-- every old row can move with a plain UPDATE and no row can collide. Once
-- learners start using the new release, anyone who works the same unit again
-- accumulates a row under BOTH keys, and those rows can no longer be migrated
-- by an UPDATE at all — the pair has to be reconciled by hand, because the
-- statejson is a reduced state document (sectionsDone, checkpoints, drafts)
-- and there is no honest SQL-level union of two of them.
--
-- Step 2 below is written to be safe either way: it moves only rows that have
-- no canonical counterpart, and step 1 lists any that do so they are visible
-- rather than silently left behind.

-- ---------------------------------------------------------------------------
-- 1) READ-ONLY. What is there, and would anything collide?
-- ---------------------------------------------------------------------------

-- 1a) The rows this migration is for.
SELECT 'old_key_rows' AS check_name,
       p.environment,
       p.coursekey,
       COUNT(*)                  AS progress_rows,
       COUNT(DISTINCT p.userid)  AS learners,
       MAX(p.timemodified)       AS last_activity
FROM mdlgx_local_prequran_progress p
WHERE p.coursekey LIKE 'ehel-ien-l%'
GROUP BY p.environment, p.coursekey
ORDER BY p.environment, p.coursekey;

-- 1b) Collisions. EXPECTED TO BE EMPTY if this runs promptly after the
-- release. Every row listed here has a canonical row for the same learner,
-- environment and unit, so step 2 will skip it and the two states need
-- reconciling by hand — compare the two statejson documents and keep the one
-- with the fuller sectionsDone / checkpoints, or merge them in the app by
-- having the learner redo nothing more than the difference.
SELECT 'collision' AS check_name,
       old.environment,
       old.userid,
       old.coursekey                              AS old_key,
       CONCAT('ehel-intensive-eng-l', SUBSTRING(old.coursekey, 11)) AS new_key,
       old.unit,
       old.version                                AS old_version,
       new.version                                AS new_version,
       old.timemodified                           AS old_modified,
       new.timemodified                           AS new_modified
FROM mdlgx_local_prequran_progress old
JOIN mdlgx_local_prequran_progress new
  ON new.environment = old.environment
 AND new.userid      = old.userid
 AND new.unit        = old.unit
 AND new.coursekey   = CONCAT('ehel-intensive-eng-l', SUBSTRING(old.coursekey, 11))
WHERE old.coursekey LIKE 'ehel-ien-l%'
ORDER BY old.userid, old.unit;

-- 1c) Confirm the destination keys exist in the curriculum map, so the rows are
-- moving somewhere that actually joins. Expect one row per published level
-- (ehel-intensive-eng-l01, -l02) with unitcount 20 — a unitcount of 0 would
-- reintroduce the inflated percentage under the new key.
SELECT 'destination_mapped' AS check_name,
       cm.idnumber, cm.subject, cm.stage, cm.level, cm.unitcount
FROM mdlgx_local_prequran_curriculum_map cm
WHERE cm.idnumber LIKE 'ehel-intensive-eng-l%'
ORDER BY cm.idnumber;

-- ---------------------------------------------------------------------------
-- 2) THE MIGRATION. Nothing above this line writes. Run only after reading 1b.
-- ---------------------------------------------------------------------------
-- Take a backup of the table first:
--   mysqldump -u USER -p DBNAME mdlgx_local_prequran_progress > progress-backup.sql
--
-- `ehel-ien-l` is 10 characters, so SUBSTRING(coursekey, 11) is the level
-- digits and nothing else. The NOT EXISTS clause is what makes this safe to run
-- more than once and safe to run late: a row whose canonical twin already
-- exists is left exactly where it is, and reported by 1b.

UPDATE mdlgx_local_prequran_progress old
   SET old.coursekey = CONCAT('ehel-intensive-eng-l', SUBSTRING(old.coursekey, 11)),
       old.timemodified = old.timemodified
 WHERE old.coursekey LIKE 'ehel-ien-l%'
   AND NOT EXISTS (
         SELECT 1
           FROM (SELECT environment, userid, unit, coursekey
                   FROM mdlgx_local_prequran_progress) twin
          WHERE twin.environment = old.environment
            AND twin.userid      = old.userid
            AND twin.unit        = old.unit
            AND twin.coursekey   = CONCAT('ehel-intensive-eng-l', SUBSTRING(old.coursekey, 11))
       );

-- ---------------------------------------------------------------------------
-- 3) READ-ONLY. Confirm the move.
-- ---------------------------------------------------------------------------

-- 3a) Should return no rows once every non-colliding row has moved. Anything
-- left is a collision from 1b, not a failure of the UPDATE.
SELECT 'remaining_old_key' AS check_name,
       p.environment, p.coursekey, COUNT(*) AS progress_rows,
       COUNT(DISTINCT p.userid) AS learners
FROM mdlgx_local_prequran_progress p
WHERE p.coursekey LIKE 'ehel-ien-l%'
GROUP BY p.environment, p.coursekey;

-- 3b) The rows now join the map, which is the whole point: a real course title
-- and a real unit total for the family, and a course push_gradebook() can find.
SELECT 'migrated_now_mapped' AS check_name,
       p.coursekey, cm.subject, cm.level, cm.stage, cm.unitcount,
       COUNT(*) AS progress_rows, COUNT(DISTINCT p.userid) AS learners
FROM mdlgx_local_prequran_progress p
JOIN mdlgx_local_prequran_curriculum_map cm ON cm.idnumber = p.coursekey
WHERE p.coursekey LIKE 'ehel-intensive-eng-l%'
GROUP BY p.coursekey, cm.subject, cm.level, cm.stage, cm.unitcount
ORDER BY p.coursekey;

-- NOTE on the gradebook. This migration fixes the LABEL path immediately, but
-- it does not backfill grades: push_gradebook() runs at ingest, so scores that
-- were soft-skipped under the old key are not replayed by moving the row. They
-- reach the gradebook the next time the learner submits a quiz. Re-running
-- verify_progress_curriculum_map.sql check 5 after this shows whether any
-- coursekey still has no Moodle course behind it.
