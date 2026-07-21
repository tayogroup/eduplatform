<?php
// Schema builder for the P1.4 progress web service. Self-contained and inert
// until called from db/install.php (fresh installs) and a db/upgrade.php
// savepoint block (existing sites) — see docs/progress-webservice-integration.md.
// Reuses the plugin's XMLDB field/table helpers from db/upgradelib.php, matching
// the local_prequran_quiz_attempt style (environment + timecreated/timemodified,
// short key names under Moodle's 30-char identifier limit).

defined('MOODLE_INTERNAL') || die();

/**
 * Create local_prequran_progress if missing (idempotent). One reduced state row
 * per (environment, user, course, unit); statejson holds the contract unit state.
 */
function xmldb_local_prequran_ensure_progress_schema(): void {
    global $CFG, $DB;
    require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');
    $dbman = $DB->get_manager();

    xmldb_local_prequran_create_table_if_missing(
        $dbman,
        new xmldb_table('local_prequran_progress'),
        [
            xmldb_local_prequran_field_id(),
            xmldb_local_prequran_field_char('environment', 30, 'production'),
            xmldb_local_prequran_field_int('userid'),
            xmldb_local_prequran_field_char('coursekey', 100),
            xmldb_local_prequran_field_char('unit', 40),
            xmldb_local_prequran_field_text('statejson'),
            xmldb_local_prequran_field_int('version', 20, 0),
            xmldb_local_prequran_field_int('timecreated'),
            xmldb_local_prequran_field_int('timemodified'),
        ],
        [
            new xmldb_key('primary', XMLDB_KEY_PRIMARY, ['id']),
            // One state row per learner/course/unit within an environment (upsert target).
            new xmldb_key('preqprog_ucu_uix', XMLDB_KEY_UNIQUE, ['environment', 'userid', 'coursekey', 'unit']),
        ],
        [
            // Hydrate reads every unit for a learner+course.
            new xmldb_index('preqprog_uc_ix', XMLDB_INDEX_NOTUNIQUE, ['environment', 'userid', 'coursekey']),
        ]
    );
}
