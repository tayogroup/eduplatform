<?php
// Student-homework portal lib — parallel-run companion to
// local_hubredirect/student_homework.php for the token-gated portal endpoint
// (report id "student-homework"; handler:
// local_prequran/portal_handlers/student-homework.php).
//
// Prefix pqshwl_ is claimed for this migration, but the legacy page defines
// ZERO inline functions: every helper it calls is shared — the pqhh_* family
// in local_hubredirect/homeworklib.php (also used by teacher_homework.php),
// pqho_* in office_materials_lib.php (required by homeworklib.php), and
// pqh_* in accesslib.php. Shared-lib functions are called at runtime by the
// handler and are never copied, so this file is intentionally guard-only —
// nothing was extracted and nothing is duplicated. The legacy page,
// homeworklib.php, and office_materials_lib.php stay live and untouched.

defined('MOODLE_INTERNAL') || die();
