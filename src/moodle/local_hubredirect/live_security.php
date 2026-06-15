<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqh_live_security_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqh_live_security_audit(string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;

    if (!pqh_live_security_table_exists('local_prequran_live_audit')) {
        return;
    }

    $sessionid = (int)($details['sessionid'] ?? 0);
    $encoded = $details ? json_encode($details) : '';
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $encoded ?: '',
        'timecreated' => time(),
    ]);
}

function pqh_live_security_deny(
    string $message,
    string $action = 'live_access_denied',
    string $targettype = '',
    int $targetid = 0,
    array $details = []
): void {
    pqh_live_security_audit($action, $targettype, $targetid, $details + [
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    throw new moodle_exception('nopermissions', '', '', $message);
}

function pqh_live_security_clean_export_reason(string $value, int $max = 255): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}
