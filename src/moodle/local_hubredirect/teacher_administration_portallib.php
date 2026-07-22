<?php
// Teacher-administration query library for the token-gated portal endpoint
// (parallel-run of teacher_administration.php; the legacy page stays untouched).
//
// teacher_administration.php defines NO inline functions: every helper it calls
// lives in shared libraries that are required at runtime and must never be
// copied here —
//   accesslib.php            pqh_current_workspace_id, pqh_user_can_manage_workspace,
//                            pqh_access_denied, pqh_table_exists_safe
//   operations_layerlib.php  pqops_ready, pqops_json, pqops_time_from_date,
//                            pqops_workspace_users, pqops_recalculate_teacher_load
//   finance_lib.php          pqfin_audit
//
// The prefix pqtadml_ is reserved for this page; there is currently nothing to
// rename because the page contributes zero page-local functions. This file
// exists so the portal handler keeps the standard page → portallib → handler
// layering used by every other migrated report.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();
