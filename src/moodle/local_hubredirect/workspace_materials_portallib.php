<?php
// Workspace-materials portal library — companion to portal_handlers/
// workspace-materials.php (token-gated parallel-run of workspace_materials.php).
//
// GUARD-ONLY: workspace_materials.php defines NO functions of its own. Every
// helper it uses is a SHARED function that already lives in an existing library
// and is NOT copied here (per the migration contract "shared not copied"):
//   - pqh_*   -> local/hubredirect/accesslib.php
//   - pqho_*  -> local/hubredirect/office_materials_lib.php
//   - pqwm_*  -> local/hubredirect/workspace_materials_workflow.php
//               + local/hubredirect/workspace_materials_files.php
//   - local_prequran_notify_* -> local/prequran/notificationlib.php
// The handler requires those libraries directly. This file exists only to keep
// the per-page lib naming convention consistent; it declares nothing.
//
// The legacy page keeps its inline includes and stays untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
