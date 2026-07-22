<?php
// Invoice-detail query library — companion to the token-gated portal report
// "invoice-detail" (parallel-run; legacy invoice_detail.php stays untouched).
//
// invoice_detail.php defines NO named functions (and no closures) of its own:
// every helper it calls (pqfin_* in finance_lib.php, pqh_* in accesslib.php)
// is shared library code that the portal handler requires and calls at
// runtime — shared functions are never copied. This guard-only lib exists to
// keep the batch contract (one portallib per migrated page) and reserves the
// pqinvdl_ prefix.

defined('MOODLE_INTERNAL') || die();
