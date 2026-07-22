<?php
// Teacher-homework portal lib — parallel-run companion to
// local_hubredirect/teacher_homework.php for the token-gated portal endpoint
// (report id "teacher-homework"; handler:
// local_prequran/portal_handlers/teacher-homework.php).
//
// Prefix pqhhl_ (the page's own legacy helper prefix pqhh + 'l') is claimed
// for this migration, but the legacy page defines ZERO inline functions:
// every helper it calls is the shared pqhh_* family in
// local_hubredirect/homeworklib.php (which student_homework.php also
// requires) plus pqh_* in accesslib.php and course_catalog.php. Shared-lib
// functions are called at runtime by the handler and are never copied, so
// this file is intentionally guard-only — nothing was extracted and nothing
// is duplicated. The legacy page and homeworklib.php stay live and untouched.

defined('MOODLE_INTERNAL') || die();
