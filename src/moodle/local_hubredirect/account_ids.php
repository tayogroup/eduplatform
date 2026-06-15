<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqh_account_id_prefix(string $accounttype): string {
    $prefixes = [
        'student' => 'STU',
        'teacher' => 'TCH',
        'parent' => 'PAR',
    ];

    if (!isset($prefixes[$accounttype])) {
        throw new invalid_parameter_exception('Unknown account type for Quraan Academy ID.');
    }

    return 'EA-' . $prefixes[$accounttype] . '-' . date('Y') . '-';
}

function pqh_next_account_id(string $accounttype): string {
    global $DB;

    $prefix = pqh_account_id_prefix($accounttype);
    $records = $DB->get_records_select(
        'user',
        'idnumber LIKE :pattern',
        ['pattern' => $prefix . '%'],
        '',
        'id,idnumber'
    );

    $max = 0;
    foreach ($records as $record) {
        if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/', (string)$record->idnumber, $matches)) {
            $max = max($max, (int)$matches[1]);
        }
    }

    return $prefix . str_pad((string)($max + 1), 6, '0', STR_PAD_LEFT);
}

function pqh_assign_account_id(int $userid, string $accounttype): string {
    global $DB, $CFG;

    if ($userid <= 0) {
        throw new invalid_parameter_exception('A valid Moodle user ID is required.');
    }

    $user = $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], 'id,idnumber', MUST_EXIST);

    $existing = trim((string)($user->idnumber ?? ''));
    if ($existing !== '') {
        return $existing;
    }

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $accountid = pqh_next_account_id($accounttype);
        if (!$DB->record_exists('user', ['idnumber' => $accountid])) {
            $DB->set_field('user', 'idnumber', $accountid, ['id' => $userid]);
            return $accountid;
        }
    }

    throw new moodle_exception('Could not generate a unique Quraan Academy account ID.');
}
