<?php
// Portal lib for the scholarship-portal report (parallel-run migration of
// local_hubredirect/scholarship_portal.php).
//
// scholarship_portal.php defines ZERO functions of its own: every helper it
// calls already lives in a shared library — the scholarship/donor query layer
// pqss_* is in local_hubredirect/scholarship_sponsorlib.php, the money helpers
// pqfin_* in local_hubredirect/finance_lib.php, and the access/workspace helpers
// pqh_* in local_hubredirect/accesslib.php. None of those are page-defined, so
// none are copied here — the handler require_once's the real libs instead.
//
// There is therefore nothing to extract; this file exists only to keep the
// per-report portallib naming convention consistent. If future edits add a
// page-local function to scholarship_portal.php, extract it here VERBATIM under
// a unique pqspl_ prefix.

defined('MOODLE_INTERNAL') || die();
