<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function xmldb_local_prequran_install(): void {
    global $CFG;

    require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');
    xmldb_local_prequran_ensure_live_schema();
    xmldb_local_prequran_ensure_quiz_schema();
}
