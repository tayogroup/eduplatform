<?php
// Admin-workflow portal library (prefix pqwf_) for the token-gated portal
// handler portal_handlers/admin-workflow.php. The legacy page
// local_hubredirect/admin_workflow.php stays live and untouched (parallel-run).
//
// admin_workflow.php defines NO functions of its own — it is a pure procedural
// page that relies entirely on shared libraries (accesslib.php:
// pqh_current_workspace_id/pqh_user_can_manage_workspace/pqh_table_exists_safe,
// and workflow_documentlib.php: pqwdoc_ready/pqwdoc_json/pqwdoc_date_to_time/
// pqwdoc_workspace_staff/pqwdoc_workspace_students/pqwdoc_task_audit). Those
// shared helpers are required directly by the handler and are NOT copied here.
// This file is therefore a guard-only placeholder so the handler's require_once
// is stable.

defined('MOODLE_INTERNAL') || die();
