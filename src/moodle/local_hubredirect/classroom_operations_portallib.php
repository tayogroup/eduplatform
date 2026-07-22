<?php
// Classroom-operations helper library (reserved prefix pqclo_) for the
// token-gated portal endpoint. The legacy page
// local_hubredirect/classroom_operations.php defines NO functions of its own:
// every helper it calls is already shared —
//   pqh_* (pqh_current_workspace_id, pqh_user_can_teach_in_workspace,
//          pqh_user_can_manage_workspace, pqh_requested_consumer_context,
//          pqh_table_exists_safe, pqh_table_has_field_safe) live in
//          local/hubredirect/accesslib.php, and
//   pqops_* (pqops_datetime_from_parts, pqops_json, pqops_time_from_date,
//            pqops_workspace_users, pqops_queue_session_reminders) live in
//          local/hubredirect/operations_layerlib.php.
// Those shared libraries are required directly by the handler — nothing is
// copied here. There is therefore nothing page-defined to extract, so this file
// is intentionally guard-only (kept for the standard three-file layout and in
// case future page-local helpers need the pqclo_ prefix). The legacy page keeps
// its inline logic and stays untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
