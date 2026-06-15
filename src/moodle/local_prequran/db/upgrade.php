<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function xmldb_local_prequran_upgrade($oldversion): bool {
    global $CFG;

    require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');

    if ($oldversion < 2026051201) {
        xmldb_local_prequran_ensure_live_schema();
        upgrade_plugin_savepoint(true, 2026051201, 'local', 'prequran');
    }

    if ($oldversion < 2026051301) {
        xmldb_local_prequran_ensure_grouping_schema();
        upgrade_plugin_savepoint(true, 2026051301, 'local', 'prequran');
    }

    if ($oldversion < 2026051302) {
        xmldb_local_prequran_ensure_grouping_schema();
        upgrade_plugin_savepoint(true, 2026051302, 'local', 'prequran');
    }

    if ($oldversion < 2026051303) {
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        upgrade_plugin_savepoint(true, 2026051303, 'local', 'prequran');
    }

    if ($oldversion < 2026052101) {
        upgrade_plugin_savepoint(true, 2026052101, 'local', 'prequran');
    }

    if ($oldversion < 2026052102) {
        xmldb_local_prequran_ensure_environment_schema();
        upgrade_plugin_savepoint(true, 2026052102, 'local', 'prequran');
    }

    if ($oldversion < 202605240003) {
        xmldb_local_prequran_ensure_live_schema();
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        upgrade_plugin_savepoint(true, 202605240003, 'local', 'prequran');
    }

    if ($oldversion < 2026061101) {
        xmldb_local_prequran_ensure_live_focus_schema();
        upgrade_plugin_savepoint(true, 2026061101, 'local', 'prequran');
    }

    if ($oldversion < 202606120002) {
        xmldb_local_prequran_ensure_quiz_schema();
        upgrade_plugin_savepoint(true, 202606120002, 'local', 'prequran');
    }

    if ($oldversion < 202606120003) {
        xmldb_local_prequran_ensure_quiz_schema();
        upgrade_plugin_savepoint(true, 202606120003, 'local', 'prequran');
    }

    return true;
}
