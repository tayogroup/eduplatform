<?php
// Compliance / data-governance portal library for the token-gated portal
// endpoint (parallel-run of local_hubredirect/compliance_governance.php, which
// stays live and untouched).
//
// This file is intentionally guard-only: compliance_governance.php defines NO
// functions of its own. Every helper it uses is already shared —
//   - pqh_*   (pqh_current_workspace_id, pqh_user_has_workspace_capability,
//              pqh_user_can_manage_workspace, pqh_table_exists_safe,
//              pqh_table_has_field_safe, pqh_access_denied) live in
//              local/hubredirect/accesslib.php;
//   - pqgov_* (pqgov_ready, pqgov_json, pqgov_date_to_time, pqgov_staff,
//              pqgov_workspace_users, pqgov_audit_summary) live in
//              local/hubredirect/governance_analyticslib.php.
// The handler requires those shared libs directly; nothing is copied here (copying
// would duplicate — and risk drifting from — the live definitions).
//
// (compliance_governance.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();
