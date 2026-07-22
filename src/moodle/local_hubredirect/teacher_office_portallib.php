<?php
// Teacher-office (Document Studio) portal library for the token-gated portal
// endpoint. teacher_office.php defines NO named functions of its own — every
// helper it calls (pqho_*, pqh_*) already lives in office_materials_lib.php
// and accesslib.php, which the teacher-office portal handler requires directly.
// This file exists so the migration keeps the same lib-per-page layout as every
// other ported report. Reserved rename prefix: pqtofl_ (currently unused).
// The legacy page stays live and untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
