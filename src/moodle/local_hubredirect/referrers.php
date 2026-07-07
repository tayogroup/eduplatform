<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

$pqrconsumercontext = pqh_requested_consumer_context();
$pqrbrandname = trim((string)($pqrconsumercontext->consumername ?? 'EduPlatform')) ?: 'EduPlatform';

function pqr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqr_clean_code(string $code): string {
    return preg_replace('/\D+/', '', $code);
}

function pqr_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqr_local_email(string $contact): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    return 'referrer.' . ($token !== '' ? $token : uniqid('', false)) . '@eduplatform.local';
}

function pqr_moodle_email(string $contact): string {
    return pqr_contact_is_email($contact) ? $contact : pqr_local_email($contact);
}

function pqr_unique_username(string $seed): string {
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

function pqr_find_user_by_email(string $email): ?stdClass {
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

function pqr_generate_code(): string {
    global $DB;
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $code = (string)random_int(10000, 99999);
        if (!$DB->record_exists('local_prequran_referrer', ['referrer_code' => $code])) {
            return $code;
        }
    }
    throw new invalid_parameter_exception('Could not generate a unique five-digit referrer code.');
}

function pqr_user_referrer(int $userid): ?stdClass {
    global $DB;
    if ($userid <= 0 || !pqr_table_exists('local_prequran_referrer')) {
        return null;
    }
    $referrer = $DB->get_record('local_prequran_referrer', ['userid' => $userid], '*', IGNORE_MISSING);
    return $referrer ?: null;
}

function pqr_date_to_time(string $date, int $fallback): int {
    $date = trim($date);
    if ($date === '') {
        return $fallback;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time !== false ? (int)$time : $fallback;
}

function pqr_date_value(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : '';
}

function pqr_send_notice(int $userid, string $subject, string $message): void {
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

function pqr_referral_rows(int $referrerid = 0, string $q = ''): array {
    global $DB;
    if (!pqr_table_exists('local_prequran_referrer') || !pqr_table_exists('local_prequran_referral')) {
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

function pqr_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

$currentreferrer = pqr_user_referrer((int)$USER->id);
$canmanage = pqh_can_manage_academy_operations((int)$USER->id);
if (!$canmanage && !$currentreferrer) {
    pqh_access_denied('Only academy operations users and registered referrers can view referrals.');
}

$ready = pqr_table_exists('local_prequran_referrer') && pqr_table_exists('local_prequran_referral');
$message = '';
$error = '';

if ($canmanage && $ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This referrer form expired. Refresh the page and try again.');
        }
        if ($action === 'create_referrer') {
            $name = trim(optional_param('name', '', PARAM_TEXT));
            $contact = trim(optional_param('contact', '', PARAM_TEXT));
            $phone = trim(optional_param('phone', '', PARAM_TEXT));
            $city = trim(optional_param('city', '', PARAM_TEXT));
            $country = trim(optional_param('country', '', PARAM_TEXT));
            $notes = trim(optional_param('notes', '', PARAM_TEXT));
            if ($name === '' || $contact === '') {
                throw new invalid_parameter_exception('Referrer name and contact are required.');
            }
            $email = pqr_moodle_email($contact);
            $user = pqr_find_user_by_email($email);
            $password = '';
            if (!$user && pqr_contact_is_email($contact)) {
                $user = pqr_find_user_by_email($contact);
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
                    'username' => pqr_unique_username($contact),
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
                $userid = (int)user_create_user($newuser, true, false);
            } else {
                $userid = (int)$user->id;
            }
            $accountid = pqh_assign_account_id($userid, 'referrer');
            if ($DB->record_exists('local_prequran_referrer', ['userid' => $userid])) {
                throw new invalid_parameter_exception('This Moodle user is already registered as a referrer.');
            }
            $code = pqr_generate_code();
            $referrerid = (int)$DB->insert_record('local_prequran_referrer', (object)[
                'userid' => $userid,
                'referrer_code' => $code,
                'name' => $name,
                'contact' => $contact,
                'phone' => $phone,
                'city' => $city,
                'country' => $country,
                'preferred_contact' => pqr_contact_is_email($contact) ? 'email' : 'phone',
                'status' => 'active',
                'notes' => $notes,
                'createdby' => (int)$USER->id,
                'timecreated' => time(),
                'timemodified' => time(),
            ]);
            pqr_send_notice($userid, $pqrbrandname . ' referrer account created', 'Your referrer account is ready. Use referrer code ' . $code . ' when referring students.');
            $message = 'Referrer created. Referrer Code ' . $code . ', Moodle user ID ' . $userid . ', account ID ' . $accountid . ($password !== '' ? ', temporary password ' . $password : '') . '.';
        } else if ($action === 'update_referral') {
            $referralid = optional_param('referralid', 0, PARAM_INT);
            $referral = $DB->get_record('local_prequran_referral', ['id' => $referralid], '*', IGNORE_MISSING);
            if (!$referral) {
                throw new invalid_parameter_exception('Choose a valid referral before updating status.');
            }
            $referral->referral_status = optional_param('referral_status', 'pending', PARAM_ALPHANUMEXT);
            $referral->dateexpires = pqr_date_to_time(optional_param('dateexpires', '', PARAM_TEXT), (int)$referral->dateexpires);
            $referral->commission_amount = trim(optional_param('commission_amount', '', PARAM_TEXT));
            $referral->commission_rate = trim(optional_param('commission_rate', '', PARAM_TEXT));
            $referral->commission_currency = trim(optional_param('commission_currency', 'USD', PARAM_ALPHANUMEXT));
            $referral->payment_status = optional_param('payment_status', 'unpaid', PARAM_ALPHANUMEXT);
            $referral->payment_reference = trim(optional_param('payment_reference', '', PARAM_TEXT));
            $referral->notes = trim(optional_param('notes', '', PARAM_TEXT));
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
                pqr_send_notice((int)$referrer->userid, 'Referral status updated', 'A referral status was updated to ' . $referral->referral_status . '.');
            }
            $message = 'Referral updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$q = trim(optional_param('q', '', PARAM_TEXT));
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$rows = $ready ? pqr_referral_rows($canmanage ? 0 : (int)$currentreferrer->id, $q) : [];

if ($export === 'csv' && $ready) {
    $csvrows = [];
    foreach ($rows as $row) {
        $csvrows[] = [
            $row->referrer_code,
            $row->referrer_name,
            fullname((object)['firstname' => $row->firstname, 'lastname' => $row->lastname]),
            $row->studentid,
            userdate((int)$row->datereferred, get_string('strftimedateshort')),
            $row->referral_status,
            (int)$row->dateexpires > 0 ? userdate((int)$row->dateexpires, get_string('strftimedateshort')) : '',
            $row->commission_amount,
            $row->commission_rate,
            $row->commission_currency,
            $row->payment_status,
            $row->payment_reference,
        ];
    }
    pqr_csv('quraan-referrals.csv', ['referrer_code', 'referrer', 'student', 'studentid', 'date_referred', 'status', 'expires', 'commission_amount', 'commission_rate', 'currency', 'payment_status', 'payment_reference'], $csvrows);
}

$referrers = $canmanage && $ready ? $DB->get_records('local_prequran_referrer', null, 'timecreated DESC') : [];
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/referrers.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Referrers');
$PAGE->set_heading('Referrers');
$PAGE->add_body_class('pqr-referrers-page');

echo $OUTPUT->header();
?>
<style>
body.pqr-referrers-page header,body.pqr-referrers-page footer,body.pqr-referrers-page nav.navbar,body.pqr-referrers-page #page-header,body.pqr-referrers-page #page-footer,body.pqr-referrers-page .drawer,body.pqr-referrers-page .drawer-toggles,body.pqr-referrers-page .block-region,body.pqr-referrers-page [data-region="drawer"],body.pqr-referrers-page [data-region="right-hand-drawer"]{display:none!important}
body.pqr-referrers-page #page,body.pqr-referrers-page #page-content,body.pqr-referrers-page #region-main,body.pqr-referrers-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqr-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqr-wrap{max-width:1280px;margin:0 auto}.pqr-top,.pqr-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}.pqr-title{margin:0;font-size:28px;font-weight:950;color:#241b24}.pqr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqr-actions{display:flex;flex-wrap:wrap;gap:9px}.pqr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pqr-field{display:grid;gap:6px;margin-bottom:10px}.pqr-field label{font-size:12px;font-weight:900;color:#415665}.pqr-input,.pqr-select,.pqr-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}.pqr-textarea{min-height:78px}.pqr-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqr-alert--ok{background:#edf9ef;color:#245c35}.pqr-alert--bad{background:#fff0ed;color:#883526}.pqr-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}.pqr-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}.pqr-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}.pqr-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}.pqr-table{width:100%;border-collapse:collapse;font-size:13px}.pqr-table th,.pqr-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}.pqr-table th{background:#f7fafc;font-size:12px;color:#415665}.pqr-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}.pqr-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqr-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:950}
@media(max-width:900px){.pqr-top{display:block}.pqr-actions{margin-top:12px}.pqr-grid,.pqr-metrics{grid-template-columns:1fr}.pqr-table{display:block;overflow:auto}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqr-shell">
  <div class="pqr-wrap">
    <section class="pqr-top pqh-workspace-top">
      <div>
        <h1 class="pqr-title pqh-workspace-title"><?php echo $canmanage ? 'Referrers' : 'My Referrals'; ?></h1>
        <p class="pqr-sub pqh-workspace-sub"><?php echo $canmanage ? 'Create referrers, track referred students, approve commission, and export referral records.' : 'Referral status and commission records for students linked to your referrer code.'; ?></p>
      </div>
      <div class="pqr-actions pqh-workspace-actions">
        <a class="pqr-btn pqr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php'))->out(false); ?>">Student intake</a>
        <a class="pqr-btn pqr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <a class="pqr-btn" href="<?php echo (new moodle_url('/local/hubredirect/referrers.php', ['q' => $q, 'export' => 'csv']))->out(false); ?>">Export CSV</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqr-alert pqr-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqr-alert pqr-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$ready): ?>
      <section class="pqr-panel"><div class="pqr-empty">Referral tables are not ready. Run the Moodle plugin upgrade for local_prequran first.</div></section>
    <?php else: ?>
      <?php
        $approved = 0;
        $paid = 0;
        foreach ($rows as $row) {
            $approved += (string)$row->referral_status === 'approved' ? 1 : 0;
            $paid += (string)$row->payment_status === 'paid' ? 1 : 0;
        }
      ?>
      <div class="pqr-metrics">
        <div class="pqr-metric"><strong><?php echo count($rows); ?></strong><span>referrals</span></div>
        <div class="pqr-metric"><strong><?php echo $approved; ?></strong><span>approved</span></div>
        <div class="pqr-metric"><strong><?php echo $paid; ?></strong><span>paid</span></div>
        <div class="pqr-metric"><strong><?php echo $canmanage ? count($referrers) : s((string)$currentreferrer->referrer_code); ?></strong><span><?php echo $canmanage ? 'referrers' : 'your code'; ?></span></div>
      </div>

      <?php if ($canmanage): ?>
        <section class="pqr-panel" style="margin-bottom:16px">
          <h2>Create Referrer</h2>
          <form method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="create_referrer">
            <div class="pqr-grid">
              <div class="pqr-field"><label>Name</label><input class="pqr-input" name="name" required></div>
              <div class="pqr-field"><label>Contact email or phone</label><input class="pqr-input" name="contact" required></div>
              <div class="pqr-field"><label>Phone / WhatsApp</label><input class="pqr-input" name="phone"></div>
              <div class="pqr-field"><label>City</label><input class="pqr-input" name="city"></div>
              <div class="pqr-field"><label>Country</label><input class="pqr-input" name="country"></div>
            </div>
            <div class="pqr-field"><label>Notes</label><textarea class="pqr-textarea" name="notes"></textarea></div>
            <button class="pqr-btn" type="submit">Create referrer and code</button>
          </form>
        </section>
      <?php endif; ?>

      <section class="pqr-panel">
        <form method="get" style="margin-bottom:14px">
          <div class="pqr-grid">
            <div class="pqr-field"><label>Search</label><input class="pqr-input" name="q" value="<?php echo s($q); ?>" placeholder="Referrer, code, student, email"></div>
            <div class="pqr-actions pqh-workspace-actions" style="align-items:end"><button class="pqr-btn" type="submit">Apply filters</button><a class="pqr-btn pqr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/referrers.php'))->out(false); ?>">Reset</a></div>
          </div>
        </form>
        <table class="pqr-table">
          <thead><tr><th>Referrer</th><th>Student</th><th>Dates</th><th>Status</th><th>Commission</th><th>Payment</th><?php if ($canmanage): ?><th>Update</th><?php endif; ?></tr></thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <tr>
                <td><span class="pqr-code"><?php echo s((string)$row->referrer_code); ?></span><br><?php echo s((string)$row->referrer_name); ?></td>
                <td><?php echo s(fullname((object)['firstname' => $row->firstname, 'lastname' => $row->lastname])); ?><br><span class="pqr-code">#<?php echo (int)$row->studentid; ?></span></td>
                <td>Referred: <?php echo s(userdate((int)$row->datereferred, get_string('strftimedateshort'))); ?><br>Expires: <?php echo (int)$row->dateexpires > 0 ? s(userdate((int)$row->dateexpires, get_string('strftimedateshort'))) : ''; ?></td>
                <td><span class="pqr-pill"><?php echo s((string)$row->referral_status); ?></span><?php if (!empty($row->approvedat)): ?><br>Approved: <?php echo s(userdate((int)$row->approvedat, get_string('strftimedateshort'))); ?><?php endif; ?></td>
                <td><?php echo s(trim((string)$row->commission_amount . ' ' . (string)$row->commission_currency)); ?><br><?php echo s((string)$row->commission_rate); ?></td>
                <td><span class="pqr-pill"><?php echo s((string)$row->payment_status); ?></span><br><?php echo s((string)$row->payment_reference); ?></td>
                <?php if ($canmanage): ?>
                  <td>
                    <form method="post">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="action" value="update_referral">
                      <input type="hidden" name="referralid" value="<?php echo (int)$row->id; ?>">
                      <div class="pqr-field"><label>Status</label><select class="pqr-select" name="referral_status"><?php foreach (['pending', 'contacted', 'enrolled', 'approved', 'expired', 'rejected', 'paid'] as $status): ?><option value="<?php echo s($status); ?>" <?php echo (string)$row->referral_status === $status ? 'selected' : ''; ?>><?php echo s(ucfirst($status)); ?></option><?php endforeach; ?></select></div>
                      <div class="pqr-field"><label>Expires</label><input class="pqr-input" type="date" name="dateexpires" value="<?php echo s(pqr_date_value((int)$row->dateexpires)); ?>"></div>
                      <div class="pqr-field"><label>Amount</label><input class="pqr-input" name="commission_amount" value="<?php echo s((string)$row->commission_amount); ?>"></div>
                      <div class="pqr-field"><label>Rate</label><input class="pqr-input" name="commission_rate" value="<?php echo s((string)$row->commission_rate); ?>"></div>
                      <div class="pqr-field"><label>Currency</label><input class="pqr-input" name="commission_currency" value="<?php echo s((string)$row->commission_currency); ?>"></div>
                      <div class="pqr-field"><label>Payment</label><select class="pqr-select" name="payment_status"><?php foreach (['unpaid', 'approved', 'paid', 'held'] as $status): ?><option value="<?php echo s($status); ?>" <?php echo (string)$row->payment_status === $status ? 'selected' : ''; ?>><?php echo s(ucfirst($status)); ?></option><?php endforeach; ?></select></div>
                      <div class="pqr-field"><label>Reference</label><input class="pqr-input" name="payment_reference" value="<?php echo s((string)$row->payment_reference); ?>"></div>
                      <div class="pqr-field"><label>Notes</label><textarea class="pqr-textarea" name="notes"><?php echo s((string)$row->notes); ?></textarea></div>
                      <button class="pqr-btn" type="submit">Save</button>
                    </form>
                  </td>
                <?php endif; ?>
              </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?><tr><td colspan="<?php echo $canmanage ? 7 : 6; ?>"><div class="pqr-empty">No referrals found.</div></td></tr><?php endif; ?>
          </tbody>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
