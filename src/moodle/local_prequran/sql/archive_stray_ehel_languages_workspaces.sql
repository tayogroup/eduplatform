-- Archive the 4 empty workspaces left behind by repeated "Ehel Languages
-- School" submit attempts. Workspace #22 (ehel-languages-5) is the real one
-- -- it has the linked consumer, branding, and domain -- and is NOT touched
-- by this script. This only flips status to 'archived' (reversible: set it
-- back to 'active' to undo); it does not delete the workspace rows or their
-- member rows.
-- Prefix-agnostic for phpMyAdmin: replace mdlgx_ with your real table prefix
-- if different (see the candidate-table query in verify_consumer_schema.sql).

SELECT 'current_selected_database' AS check_name, DATABASE() AS value;

-- 1. Confirm exactly which rows this will touch before running the UPDATE
--    below. All four should show status = 'active' and no linked consumer.
SELECT 'workspaces_to_archive' AS check_name,
       w.id,
       w.slug,
       w.name,
       w.status,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_consumer c WHERE c.primaryworkspaceid = w.id) AS linked_consumer_count
FROM mdlgx_local_prequran_workspace w
WHERE w.id IN (18, 19, 20, 21)
ORDER BY w.id;

-- 2. Confirm the workspace being KEPT is not in that list and does have a
--    linked consumer.
SELECT 'workspace_to_keep' AS check_name,
       w.id,
       w.slug,
       w.name,
       w.status,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_consumer c WHERE c.primaryworkspaceid = w.id) AS linked_consumer_count
FROM mdlgx_local_prequran_workspace w
WHERE w.id = 22;

-- 3. The actual change. Only run this after checks 1 and 2 above look right.
UPDATE mdlgx_local_prequran_workspace
   SET status = 'archived',
       timemodified = UNIX_TIMESTAMP()
 WHERE id IN (18, 19, 20, 21)
   AND status = 'active';

-- 4. Verify the update landed and #22 is untouched.
SELECT 'post_update_check' AS check_name, id, slug, status
FROM mdlgx_local_prequran_workspace
WHERE id IN (18, 19, 20, 21, 22)
ORDER BY id;
