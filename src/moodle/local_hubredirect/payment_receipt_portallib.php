<?php
// Payment-receipt query library — companion to the token-gated portal report
// "payment-receipt" (parallel-run; legacy payment_receipt.php stays untouched).
//
// payment_receipt.php defines NO functions of its own: every helper it calls
// (pqfin_* in finance_lib.php, pqh_* in accesslib.php) is shared library code
// that the portal handler requires and calls at runtime — shared functions are
// never copied. This guard-only lib exists to keep the batch contract (one
// portallib per migrated page) and reserves the pqprcpl_ prefix.
//
// Deliberately NOT ported: the financetoken secure-link path
// (pqfin_validate_secure_link) — emailed receipt links keep opening the
// legacy page without login; the portal serves logged-in token users only.

defined('MOODLE_INTERNAL') || die();
