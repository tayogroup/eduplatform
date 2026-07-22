<?php
// Finance-audit portal library (guard-only) — finance_audit.php defines no
// named functions: it calls the shared finance_lib.php (pqfin_*) and
// accesslib.php (pqh_*) helpers at runtime, plus inline query building that is
// ported inside portal_handlers/finance-audit.php. Prefix pqfaudl_ is reserved
// for this report should extraction ever be needed. The legacy page stays
// untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
