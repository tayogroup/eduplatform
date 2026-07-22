<?php
// Payment-gateway-settings portal library (guard-only) —
// payment_gateway_settings.php defines no named functions: it calls the shared
// finance_lib.php (pqfin_*) and accesslib.php (pqh_*) helpers at runtime; its
// inline save/read flow is ported inside
// portal_handlers/payment-gateway-settings.php. Prefix pqpgsl_ is reserved for
// this report should extraction ever be needed. The legacy page stays
// untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
