<?php
// ---- report: referrers (referrer / referral management; read + ops writes) ----
// Ported from local_hubredirect/referrers.php via referrers_portallib
// (pqrfl_*). Required from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token's user, JSON exception handler installed.
//
//   GET ?report=referrers&token=…&q=…   -> referrers + referral dataset JSON
//   POST {do:"create_referrer", …}      -> create referrer + Moodle user + code
//   POST {do:"update_referral", …}      -> update a referral status/commission
//
// Entry gate mirrors the legacy page: academy-operations managers see every
// referral and the write forms; a registered referrer sees only their own
// referrals (read-only). Anyone else is denied with the exact legacy message.
// confirm_sesskey() is dropped: the launch token replaces the session key.
// The legacy Export CSV is a client-side download built from this dataset, so
// pqr_csv is not ported. There is no pqh_live_security_audit call on the legacy
// page, so none is carried over.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/account_ids.php');
require_once($CFG->dirroot . '/local/hubredirect/referrers_portallib.php');
require_once($CFG->dirroot . '/user/lib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- entry access: exact legacy gate (pqh_access_denied -> pqpd_fail(403, …)) --
$currentreferrer = pqrfl_user_referrer($userid);
$canmanage = pqh_can_manage_academy_operations($userid);
if (!$canmanage && !$currentreferrer) {
    pqpd_fail(403, 'Only academy operations users and registered referrers can view referrals.');
}

$ready = pqrfl_table_exists('local_prequran_referrer') && pqrfl_table_exists('local_prequran_referral');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Only academy-operations managers can write (verbatim: legacy guards every
    // POST with `if ($canmanage && $ready && … POST)`).
    if (!$canmanage) {
        pqpd_fail(403, 'Only academy operations users can manage referrers.');
    }
    if (!$ready) {
        pqpd_fail(403, 'Referral tables are not ready. Run the Moodle plugin upgrade for local_prequran first.');
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: create_referrer (legacy action=create_referrer, verbatim) --
    if ($do === 'create_referrer') {
        $pqrconsumercontext = pqh_requested_consumer_context();
        $pqrbrandname = trim((string)($pqrconsumercontext->consumername ?? 'EduPlatform')) ?: 'EduPlatform';
        try {
            $name = trim(clean_param((string)($body['name'] ?? ''), PARAM_TEXT));
            $contact = trim(clean_param((string)($body['contact'] ?? ''), PARAM_TEXT));
            $phone = trim(clean_param((string)($body['phone'] ?? ''), PARAM_TEXT));
            $city = trim(clean_param((string)($body['city'] ?? ''), PARAM_TEXT));
            $country = trim(clean_param((string)($body['country'] ?? ''), PARAM_TEXT));
            $notes = trim(clean_param((string)($body['notes'] ?? ''), PARAM_TEXT));
            if ($name === '' || $contact === '') {
                throw new invalid_parameter_exception('Referrer name and contact are required.');
            }
            $email = pqrfl_moodle_email($contact);
            $user = pqrfl_find_user_by_email($email);
            $password = '';
            if (!$user && pqrfl_contact_is_email($contact)) {
                $user = pqrfl_find_user_by_email($contact);
            }
            if (!$user) {
                $parts = preg_split('/\s+/', $name);
                $firstname = $parts && isset($parts[0]) ? $parts[0] : 'Referrer';
                $lastname = $parts && count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Partner';
                $password = generate_password(12);
                $newuser = (object)[
                    'auth' => 'manual',
                    'confirmed' => 1,
                    'mnethostid' => $CFG->mnet_localhost_id,
                    'username' => pqrfl_unique_username($contact),
                    'password' => $password,
                    'firstname' => $firstname,
                    'lastname' => $lastname,
                    'email' => $email,
                    'emailstop' => 0,
                    'country' => core_text::strlen($country) <= 2 ? core_text::strtoupper($country) : '',
                    'city' => $city,
                    'timezone' => '99',
                    'lang' => $CFG->lang ?? 'en',
                ];
                $newuserid = (int)user_create_user($newuser, true, false);
            } else {
                $newuserid = (int)$user->id;
            }
            $accountid = pqh_assign_account_id($newuserid, 'referrer');
            if ($DB->record_exists('local_prequran_referrer', ['userid' => $newuserid])) {
                throw new invalid_parameter_exception('This Moodle user is already registered as a referrer.');
            }
            $code = pqrfl_generate_code();
            $referrerid = (int)$DB->insert_record('local_prequran_referrer', (object)[
                'userid' => $newuserid,
                'referrer_code' => $code,
                'name' => $name,
                'contact' => $contact,
                'phone' => $phone,
                'city' => $city,
                'country' => $country,
                'preferred_contact' => pqrfl_contact_is_email($contact) ? 'email' : 'phone',
                'status' => 'active',
                'notes' => $notes,
                'createdby' => (int)$USER->id,
                'timecreated' => time(),
                'timemodified' => time(),
            ]);
            pqrfl_send_notice($newuserid, $pqrbrandname . ' referrer account created', 'Your referrer account is ready. Use referrer code ' . $code . ' when referring students.');
            $message = 'Referrer created. Referrer Code ' . $code . ', Moodle user ID ' . $newuserid . ', account ID ' . $accountid . ($password !== '' ? ', temporary password ' . $password : '') . '.';
        } catch (Throwable $e) {
            pqpd_fail(400, $e->getMessage());
        }
        echo json_encode(['ok' => true, 'message' => $message, 'referrerid' => $referrerid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: update_referral (legacy action=update_referral, verbatim) --
    if ($do === 'update_referral') {
        try {
            $referralid = (int)($body['referralid'] ?? 0);
            $referral = $DB->get_record('local_prequran_referral', ['id' => $referralid], '*', IGNORE_MISSING);
            if (!$referral) {
                throw new invalid_parameter_exception('Choose a valid referral before updating status.');
            }
            $referral->referral_status = clean_param((string)($body['referral_status'] ?? 'pending'), PARAM_ALPHANUMEXT);
            $referral->dateexpires = pqrfl_date_to_time(clean_param((string)($body['dateexpires'] ?? ''), PARAM_TEXT), (int)$referral->dateexpires);
            $referral->commission_amount = trim(clean_param((string)($body['commission_amount'] ?? ''), PARAM_TEXT));
            $referral->commission_rate = trim(clean_param((string)($body['commission_rate'] ?? ''), PARAM_TEXT));
            $referral->commission_currency = trim(clean_param((string)($body['commission_currency'] ?? 'USD'), PARAM_ALPHANUMEXT));
            $referral->payment_status = clean_param((string)($body['payment_status'] ?? 'unpaid'), PARAM_ALPHANUMEXT);
            $referral->payment_reference = trim(clean_param((string)($body['payment_reference'] ?? ''), PARAM_TEXT));
            $referral->notes = trim(clean_param((string)($body['notes'] ?? ''), PARAM_TEXT));
            if ($referral->referral_status === 'approved' && empty($referral->approvedat)) {
                $referral->approvedat = time();
                $referral->approvedby = (int)$USER->id;
            }
            if ($referral->payment_status === 'paid' && empty($referral->paidat)) {
                $referral->paidat = time();
            }
            $referral->timemodified = time();
            $DB->update_record('local_prequran_referral', $referral);
            $referrer = $DB->get_record('local_prequran_referrer', ['id' => (int)$referral->referrerid], '*', IGNORE_MISSING);
            if ($referrer) {
                pqrfl_send_notice((int)$referrer->userid, 'Referral status updated', 'A referral status was updated to ' . $referral->referral_status . '.');
            }
        } catch (Throwable $e) {
            pqpd_fail(400, $e->getMessage());
        }
        echo json_encode(['ok' => true, 'message' => 'Referral updated.', 'referralid' => (int)$referral->id], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown referrers action.');
}

// -- GET: the referrers + referral dataset (same scope + shape as the page) --
$q = trim(optional_param('q', '', PARAM_TEXT));
$rows = $ready ? pqrfl_referral_rows($canmanage ? 0 : (int)$currentreferrer->id, $q) : [];

$approved = 0;
$paid = 0;
$out = [];
foreach ($rows as $row) {
    $approved += (string)$row->referral_status === 'approved' ? 1 : 0;
    $paid += (string)$row->payment_status === 'paid' ? 1 : 0;
    $out[] = [
        'id' => (int)$row->id,
        'referrerid' => (int)$row->referrerid,
        'studentid' => (int)$row->studentid,
        'referrer_code' => (string)$row->referrer_code,
        'referrer_name' => (string)$row->referrer_name,
        'studentname' => trim(fullname((object)['firstname' => $row->firstname, 'lastname' => $row->lastname])),
        'email' => (string)$row->email,
        'datereferred' => (int)$row->datereferred,
        'referral_status' => (string)$row->referral_status,
        'dateexpires' => (int)$row->dateexpires,
        'dateexpires_value' => pqrfl_date_value((int)$row->dateexpires),
        'commission_amount' => (string)$row->commission_amount,
        'commission_rate' => (string)$row->commission_rate,
        'commission_currency' => (string)$row->commission_currency,
        'approvedat' => (int)$row->approvedat,
        'payment_status' => (string)$row->payment_status,
        'paidat' => (int)$row->paidat,
        'payment_reference' => (string)$row->payment_reference,
        'notes' => (string)$row->notes,
    ];
}

$referrerlist = [];
if ($canmanage && $ready) {
    foreach ($DB->get_records('local_prequran_referrer', null, 'timecreated DESC') as $ref) {
        $referrerlist[] = [
            'id' => (int)$ref->id,
            'userid' => (int)$ref->userid,
            'referrer_code' => (string)$ref->referrer_code,
            'name' => (string)$ref->name,
            'contact' => (string)$ref->contact,
            'phone' => (string)($ref->phone ?? ''),
            'city' => (string)($ref->city ?? ''),
            'country' => (string)($ref->country ?? ''),
            'status' => (string)($ref->status ?? ''),
            'timecreated' => (int)$ref->timecreated,
        ];
    }
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'canmanage' => $canmanage,
    'mycode' => $currentreferrer ? (string)$currentreferrer->referrer_code : '',
    'q' => $q,
    'metrics' => [
        'referrals' => count($out),
        'approved' => $approved,
        'paid' => $paid,
        'referrers' => count($referrerlist),
    ],
    'rows' => $out,
    'referrers' => $referrerlist,
    'statusoptions' => ['pending', 'contacted', 'enrolled', 'approved', 'expired', 'rejected', 'paid'],
    'paymentoptions' => ['unpaid', 'approved', 'paid', 'held'],
], JSON_UNESCAPED_SLASHES);
exit;
