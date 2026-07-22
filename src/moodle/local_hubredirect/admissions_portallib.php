<?php
// Admissions portal library — companion to the token-gated portal handler
// portal_handlers/admissions.php (parallel-run migration of
// local_hubredirect/admissions.php).
//
// The legacy page defines NO page-local helper functions: every piece of
// admissions logic already lives in the SHARED library
// local/hubredirect/admissionslib.php (pqadm_* — schema check, status maps,
// create/update, decision, convert, document save). That shared library is
// required directly by the handler and is NOT copied here.
//
// This file therefore intentionally contains no functions — it exists only so
// the handler's require_once target is stable and so future admissions-only
// helpers (if the page ever grows any) have a home that never touches the
// shared lib. If you add a helper here, use a unique prefix that does not
// collide with pqadm_ (the shared admissionslib prefix).

defined('MOODLE_INTERNAL') || die();
