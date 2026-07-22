<?php
// Academic-calendar portal library (prefix pqcal_) for the token-gated portal
// handler portal_handlers/academic-calendar.php. The legacy page
// local_hubredirect/academic_calendar.php stays live and untouched
// (parallel-run).
//
// academic_calendar.php defines NO functions of its own — it is a pure
// procedural page that relies entirely on shared libraries (accesslib.php:
// pqh_current_consumer_context/pqh_current_workspace_id/pqh_user_can_manage_workspace/
// pqh_table_exists_safe/pqh_table_has_field_safe, and admissionslib.php:
// pqadm_date_to_time/pqadm_time_to_date/pqadm_metadata). Those shared helpers
// are required directly by the handler and are NOT copied here. This file is
// therefore a guard-only placeholder so the handler's require_once is stable.

defined('MOODLE_INTERNAL') || die();
