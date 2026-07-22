<?php
// Institution-settings portal library (prefix pqisl_) — companion to the
// token-gated portal_handlers/institution-settings.php.
//
// GUARD-ONLY BY DESIGN. The legacy page local_hubredirect/institution_settings.php
// defines NO functions of its own: every helper it uses is already shared —
//   * pqhi_* (branding/domain/consumer helpers) from institutionlib.php
//   * pqh_*  (access, consumer-context, workspace helpers) from accesslib.php
// Those libraries are require_once'd by the handler and NEVER copied here.
// There is therefore nothing page-defined to extract verbatim, so this file
// intentionally carries no function bodies (the pqisl_ prefix is reserved for
// this report in case a future page-local helper needs extracting). The legacy
// page stays untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
