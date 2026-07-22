<?php
// Parent-billing query library — companion to the token-gated portal report
// "parent-billing" (parallel-run; legacy parent_billing.php stays untouched).
//
// parent_billing.php defines NO functions of its own: every helper it calls
// (pqfin_* in finance_lib.php, pqh_* in accesslib.php) is shared library code
// that the portal handler requires and calls at runtime — shared functions are
// never copied. This guard-only lib exists to keep the batch contract (one
// portallib per migrated page) and reserves the pqpbl_ prefix.

defined('MOODLE_INTERNAL') || die();
