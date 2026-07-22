<?php
// ---- portallib for report: gradebook-assessment ------------------------------
// Companion library for the token-gated port of
// local_hubredirect/gradebook_assessment.php (report id "gradebook-assessment").
//
// The legacy page defines NO functions of its own: every helper it calls is
// already shared —
//   * pqh_current_workspace_id / pqh_user_can_teach_in_workspace /
//     pqh_user_can_manage_workspace / pqh_table_exists_safe / pqh_access_denied
//     live in local/hubredirect/accesslib.php, and
//   * pqgp_gradebook_ready / pqgp_student_options / pqgp_money_float /
//     pqgp_letter / pqgp_json / pqgp_audit / pqgp_recalculate_course_grade
//     live in local/hubredirect/gradebook_progresslib.php.
// Nothing is copied here; the handler requires those two shared libraries
// directly. This file exists only to keep the one-lib-per-report convention
// (and give the handler a stable include target). It is intentionally
// guard-only — including it OUTputs nothing (0 bytes).
//
// The legacy page stays live in parallel and is untouched.

defined('MOODLE_INTERNAL') || die();
