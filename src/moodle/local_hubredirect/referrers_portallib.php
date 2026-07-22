<?php
// Referrers query library — extracted VERBATIM from referrers.php (renamed
// pqr_ -> pqrfl_) for the token-gated portal endpoint. The legacy page keeps
// its inline copies and stays untouched (parallel-run). The pqr_ prefix is
// already taken by the legacy recordings.php page, so this port uses pqrfl_.
// Requires: local/hubredirect/accesslib.php + account_ids.php loaded first.
//
// NOT extracted: pqr_clean_code (defined but never called on the legacy page)
// and pqr_csv (server-side CSV streaming — the portal page builds the CSV
// client-side from the referral dataset instead).

defined('MOODLE_INTERNAL') || die();

function pqrfl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqrfl_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqrfl_local_email(string $contact): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    return 'referrer.' . ($token !== '' ? $token : uniqid('', false)) . '@eduplatform.local';
}

function pqrfl_moodle_email(string $contact): string {
    return pqrfl_contact_is_email($contact) ? $contact : pqrfl_local_email($contact);
}

function pqrfl_unique_username(string $seed): string {
    global $DB, $CFG;
    $base = core_text::substr(trim(preg_replace('/[^a-z0-9._-]+/', '.', core_text::strtolower($seed))), 0, 80);
    $base = trim($base, '.-_');
    if ($base === '') {
        $base = 'referrer';
    }
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqrfl_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '') {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqrfl_generate_code(): string {
    global $DB;
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $code = (string)random_int(10000, 99999);
        if (!$DB->record_exists('local_prequran_referrer', ['referrer_code' => $code])) {
            return $code;
        }
    }
    throw new invalid_parameter_exception('Could not generate a unique five-digit referrer code.');
}

function pqrfl_user_referrer(int $userid): ?stdClass {
    global $DB;
    if ($userid <= 0 || !pqrfl_table_exists('local_prequran_referrer')) {
        return null;
    }
    $referrer = $DB->get_record('local_prequran_referrer', ['userid' => $userid], '*', IGNORE_MISSING);
    return $referrer ?: null;
}

function pqrfl_date_to_time(string $date, int $fallback): int {
    $date = trim($date);
    if ($date === '') {
        return $fallback;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time !== false ? (int)$time : $fallback;
}

function pqrfl_date_value(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : '';
}

function pqrfl_send_notice(int $userid, string $subject, string $message): void {
    global $USER;
    if ($userid <= 0) {
        return;
    }
    $recipient = core_user::get_user($userid);
    if (!$recipient) {
        return;
    }
    $eventdata = new core\message\message();
    $eventdata->component = 'local_prequran';
    $eventdata->name = 'live_session_update';
    $eventdata->userfrom = core_user::get_noreply_user();
    $eventdata->userto = $recipient;
    $eventdata->subject = $subject;
    $eventdata->fullmessage = $message;
    $eventdata->fullmessageformat = FORMAT_PLAIN;
    $eventdata->fullmessagehtml = s($message);
    $eventdata->smallmessage = $subject;
    $eventdata->notification = 1;
    try {
        message_send($eventdata);
    } catch (Throwable $e) {
        debugging('Referrer notification failed for user ' . $userid . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

function pqrfl_referral_rows(int $referrerid = 0, string $q = ''): array {
    global $DB;
    if (!pqrfl_table_exists('local_prequran_referrer') || !pqrfl_table_exists('local_prequran_referral')) {
        return [];
    }
    $params = [];
    $where = [];
    if ($referrerid > 0) {
        $where[] = 'rf.id = :referrerid';
        $params['referrerid'] = $referrerid;
    }
    if ($q !== '') {
        $where[] = '('
            . $DB->sql_like('LOWER(rf.name)', ':qname', false)
            . ' OR ' . $DB->sql_like('LOWER(rf.referrer_code)', ':qcode', false)
            . ' OR ' . $DB->sql_like('LOWER(u.firstname)', ':qfirst', false)
            . ' OR ' . $DB->sql_like('LOWER(u.lastname)', ':qlast', false)
            . ' OR ' . $DB->sql_like('LOWER(u.email)', ':qemail', false)
            . ')';
        $needle = '%' . $DB->sql_like_escape(core_text::strtolower($q)) . '%';
        $params['qname'] = $needle;
        $params['qcode'] = $needle;
        $params['qfirst'] = $needle;
        $params['qlast'] = $needle;
        $params['qemail'] = $needle;
    }
    $wheresql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    return array_values($DB->get_records_sql(
        "SELECT rr.id,
                rr.referrerid,
                rr.studentid,
                rr.datereferred,
                rr.referral_status,
                rr.dateexpires,
                rr.commission_amount,
                rr.commission_rate,
                rr.commission_currency,
                rr.approvedat,
                rr.approvedby,
                rr.payment_status,
                rr.paidat,
                rr.payment_reference,
                rr.notes,
                rf.userid AS referrer_userid,
                rf.referrer_code,
                rf.name AS referrer_name,
                u.firstname,
                u.lastname,
                u.email
           FROM {local_prequran_referral} rr
           JOIN {local_prequran_referrer} rf ON rf.id = rr.referrerid
      LEFT JOIN {user} u ON u.id = rr.studentid
          {$wheresql}
       ORDER BY rr.datereferred DESC, rr.id DESC",
        $params
    ));
}
