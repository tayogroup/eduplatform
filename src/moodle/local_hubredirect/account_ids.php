<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqh_account_id_prefix(string $accounttype): string {
    return '';
}

function pqh_next_account_id(string $accounttype): string {
    global $DB;

    for ($attempt = 0; $attempt < 120; $attempt++) {
        $accountid = (string)random_int(10000, 99999);
        if (!$DB->record_exists('user', ['idnumber' => $accountid])) {
            return $accountid;
        }
    }

    throw new invalid_parameter_exception('Could not generate a unique 5-digit ID number.');
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
    ], 'id,idnumber', IGNORE_MISSING);

    if (!$user) {
        throw new invalid_parameter_exception('Choose a valid Moodle user before assigning an account ID.');
    }

    $existing = trim((string)($user->idnumber ?? ''));
    if (preg_match('/^[0-9]{5}$/', $existing)) {
        return $existing;
    }

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $accountid = pqh_next_account_id($accounttype);
        if (!$DB->record_exists('user', ['idnumber' => $accountid])) {
            $DB->set_field('user', 'idnumber', $accountid, ['id' => $userid]);
            return $accountid;
        }
    }

    throw new invalid_parameter_exception('Could not generate a unique EduPlatform account ID.');
}
