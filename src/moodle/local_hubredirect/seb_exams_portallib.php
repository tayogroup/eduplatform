<?php
// Portal library for the seb-exams report (parallel-run of seb_exams.php).
//
// seb_exams.php defines NO page-local functions of its own: every helper it
// uses — pqh_seb_tables_ready(), pqh_seb_known_content(), pqh_seb_exam_record(),
// pqh_seb_can_manage(), pqh_seb_exams_for_manager(), pqh_seb_exam_studentids(),
// pqh_seb_exam_mode(), pqh_seb_exam_proctoring(), pqh_seb_audit(),
// pqh_seb_results_url()/pqh_seb_exam_url()/pqh_seb_config_download_url(), etc. —
// is a SHARED function that already lives in local/hubredirect/seb_lib.php, and
// the access/table helpers live in local/hubredirect/accesslib.php. Those are
// require'd by the handler, never copied here (copying shared code would fork
// it and defeat the parallel-run).
//
// There is therefore nothing page-specific to extract, so this library is
// intentionally an empty guard. It exists only so the handler's require_once
// list is uniform with the other migrated reports.

defined('MOODLE_INTERNAL') || die();
