<?php
// Learning-path portal library — companion to portal_handlers/learning-path.php.
//
// The legacy page local_hubredirect/learning_path.php defines NO functions of
// its own: every helper it calls is already shared —
//   * pqh_current_workspace_id / pqh_user_can_teach_in_workspace /
//     pqh_user_can_manage_workspace / pqh_access_denied  → accesslib.php
//   * pqgp_learning_path_ready / pqgp_json / pqgp_student_options /
//     pqgp_recommend_next_course                          → gradebook_progresslib.php
// Both libraries are required directly by the handler, so nothing is copied
// here (a grep for page-defined `function` in learning_path.php returns none).
//
// This file therefore carries the guard only, matching every other portallib in
// the batch so the handler's require_once is uniform. If the legacy page ever
// grows a page-local helper, extract it here VERBATIM under a unique pqlpl_*
// prefix. The legacy page stays live in parallel and is untouched.

defined('MOODLE_INTERNAL') || die();
