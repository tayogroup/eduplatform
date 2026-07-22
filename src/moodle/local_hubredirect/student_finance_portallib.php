<?php
// Student-finance query library — companion to the token-gated portal report
// "student-finance" (parallel-run; legacy student_finance.php stays untouched).
//
// student_finance.php defines NO named functions of its own (its only closure
// is the inline search filter, ported inside the handler): every helper it
// calls (pqfin_* in finance_lib.php, pqco_* in course_offeringlib.php, pqh_*
// in accesslib.php) is shared library code that the portal handler requires
// and calls at runtime — shared functions are never copied. This guard-only
// lib exists to keep the batch contract (one portallib per migrated page) and
// reserves the pqsfl_ prefix.

defined('MOODLE_INTERNAL') || die();
