<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/message/lib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->libdir . '/filelib.php');

function local_prequran_notify_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function local_prequran_notify_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        if (!local_prequran_notify_table_exists($table)) {
            return false;
        }
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function local_prequran_notify_request_host(): string {
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '')));
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim((string)$host, " \t\n\r\0\x0B.");
    return $host !== '' ? clean_param($host, PARAM_HOST) : '';
}

function local_prequran_notify_brand_context(int $sessionid = 0, int $workspaceid = 0, int $consumerid = 0): stdClass {
    global $DB;

    $fallback = (object)[
        'id' => 0,
        'slug' => 'eduplatform',
        'name' => 'EduPlatform',
        'supportemail' => '',
        'emailfromname' => 'EduPlatform',
        'emailreplyto' => '',
        'workspaceid' => 0,
    ];

    if (!local_prequran_notify_table_exists('local_prequran_consumer')) {
        return $fallback;
    }

    try {
        if ($sessionid > 0 && local_prequran_notify_table_has_field('local_prequran_live_session', 'workspaceid')) {
            $sessionworkspaceid = (int)$DB->get_field('local_prequran_live_session', 'workspaceid', ['id' => $sessionid], IGNORE_MISSING);
            if ($sessionworkspaceid > 0) {
                $workspaceid = $sessionworkspaceid;
            }
        }

        $consumer = null;
        if ($consumerid > 0) {
            $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid, 'status' => 'active'], '*', IGNORE_MISSING);
        }

        if (!$consumer && $workspaceid > 0 && local_prequran_notify_table_has_field('local_prequran_consumer', 'primaryworkspaceid')) {
            $consumer = $DB->get_record('local_prequran_consumer', ['primaryworkspaceid' => $workspaceid, 'status' => 'active'], '*', IGNORE_MISSING);
        }

        if (!$consumer && $workspaceid > 0 && local_prequran_notify_table_exists('local_prequran_consumer_domain')) {
            $consumer = $DB->get_record_sql(
                "SELECT c.*
                   FROM {local_prequran_consumer_domain} d
                   JOIN {local_prequran_consumer} c ON c.id = d.consumerid
                  WHERE d.workspaceid = :workspaceid
                    AND d.status = :domainstatus
                    AND c.status = :consumerstatus
               ORDER BY d.isprimary DESC, d.domain_type ASC, d.id ASC",
                ['workspaceid' => $workspaceid, 'domainstatus' => 'active', 'consumerstatus' => 'active'],
                IGNORE_MULTIPLE
            );
        }

        $host = local_prequran_notify_request_host();
        if (!$consumer && $host !== '' && local_prequran_notify_table_exists('local_prequran_consumer_domain')) {
            $consumer = $DB->get_record_sql(
                "SELECT c.*
                   FROM {local_prequran_consumer_domain} d
                   JOIN {local_prequran_consumer} c ON c.id = d.consumerid
                  WHERE d.domain = :domain
                    AND d.status = :domainstatus
                    AND c.status = :consumerstatus",
                ['domain' => $host, 'domainstatus' => 'active', 'consumerstatus' => 'active'],
                IGNORE_MISSING
            );
        }

        if (!$consumer) {
            $consumer = $DB->get_record('local_prequran_consumer', ['slug' => 'eduplatform', 'status' => 'active'], '*', IGNORE_MISSING);
        }

        if (!$consumer) {
            return $fallback;
        }

        return (object)[
            'id' => (int)$consumer->id,
            'slug' => (string)$consumer->slug,
            'name' => (string)$consumer->name,
            'supportemail' => (string)($consumer->supportemail ?? ''),
            'emailfromname' => (string)($consumer->emailfromname ?? $consumer->name),
            'emailreplyto' => (string)($consumer->emailreplyto ?? ($consumer->supportemail ?? '')),
            'workspaceid' => $workspaceid > 0 ? $workspaceid : (int)($consumer->primaryworkspaceid ?? 0),
        ];
    } catch (Throwable $e) {
        return $fallback;
    }
}

function local_prequran_notify_brand_subject(string $subject, ?stdClass $brand = null): string {
    $subject = trim($subject);
    $brand = $brand ?: local_prequran_notify_brand_context();
    $name = trim((string)($brand->emailfromname ?? $brand->name ?? ''));
    if ($name === '') {
        return $subject;
    }
    if (preg_match('/^\[[^\]]+\]\s*/', $subject) || stripos($subject, $name . ':') === 0) {
        return $subject;
    }
    return '[' . $name . '] ' . $subject;
}

function local_prequran_notify_brand_message(string $message, ?stdClass $brand = null): string {
    $brand = $brand ?: local_prequran_notify_brand_context();
    $name = trim((string)($brand->name ?? ''));
    if ($name === '') {
        return $message;
    }
    $footer = "\n\n--\n" . $name;
    $support = clean_param(trim((string)($brand->supportemail ?? '')), PARAM_EMAIL);
    if ($support !== '' && validate_email($support)) {
        $footer .= "\nSupport: " . $support;
    }
    if (strpos($message, $footer) !== false) {
        return $message;
    }
    return rtrim($message) . $footer;
}

function local_prequran_notify_parent_ids_for_student(int $studentid): array {
    global $DB;
    $parentids = [];

    if ($studentid <= 0) {
        return [];
    }

    if (local_prequran_notify_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['studentid' => $studentid]);
        foreach ($rows as $row) {
            $guardianid = (int)$row->guardianid;
            if ($guardianid > 0) {
                $parentids[$guardianid] = $guardianid;
            }
        }
    }

    if (local_prequran_notify_table_exists('local_prequran_live_consent')) {
        $rows = $DB->get_records('local_prequran_live_consent', ['studentid' => $studentid]);
        foreach ($rows as $row) {
            $guardianid = (int)$row->guardianid;
            if ($guardianid > 0) {
                $parentids[$guardianid] = $guardianid;
            }
        }
    }

    if (local_prequran_notify_table_exists('local_prequran_comm_thread')
        && local_prequran_notify_table_exists('local_prequran_comm_participant')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT p.userid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE t.studentid = :studentid
                AND p.role = :role",
            ['studentid' => $studentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $parentid = (int)$row->userid;
            if ($parentid > 0) {
                $parentids[$parentid] = $parentid;
            }
        }
    }

    return array_values($parentids);
}

function local_prequran_notify_audit(int $sessionid, int $recipientid, string $action, array $details = []): void {
    global $DB, $USER;

    if (!local_prequran_notify_table_exists('local_prequran_live_audit')) {
        return;
    }

    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)($USER->id ?? 0),
        'action' => $action,
        'targettype' => 'user',
        'targetid' => $recipientid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function local_prequran_notify_sender_user() {
    global $USER;

    if (!empty($USER) && !empty($USER->id)) {
        return $USER;
    }
    if (class_exists('core_user') && method_exists('core_user', 'get_noreply_user')) {
        return core_user::get_noreply_user();
    }
    return get_admin();
}

function local_prequran_notify_user_live_update(
    int $sessionid,
    int $recipientid,
    string $subject,
    string $message,
    moodle_url $url,
    string $urlname,
    string $eventtype,
    int $studentid = 0
): bool {
    $recipient = core_user::get_user($recipientid);
    if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
        local_prequran_notify_audit($sessionid, $recipientid, 'notification_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'recipient unavailable',
        ]);
        return false;
    }

    $brand = local_prequran_notify_brand_context($sessionid);
    $subject = local_prequran_notify_brand_subject($subject, $brand);
    $message = local_prequran_notify_brand_message($message, $brand);
    $body = $message . "\n\nOpen: " . $url->out(false);
    if ($studentid > 0) {
        $student = core_user::get_user($studentid);
        $studentname = $student ? fullname($student) : 'Student ' . $studentid;
        $body = $message . "\n\nStudent: " . $studentname . "\nOpen: " . $url->out(false);
    }

    $eventdata = new \core\message\message();
    $eventdata->component = 'local_prequran';
    $eventdata->name = strpos($eventtype, 'official_transcript_') === 0 ? 'transcript_update' : 'live_session_update';
    $eventdata->userfrom = local_prequran_notify_sender_user();
    $eventdata->userto = $recipient;
    $eventdata->subject = $subject;
    $eventdata->fullmessage = $body;
    $eventdata->fullmessageformat = FORMAT_PLAIN;
    $eventdata->fullmessagehtml = nl2br(s($body));
    $eventdata->smallmessage = $subject;
    $eventdata->notification = 1;
    $eventdata->contexturl = $url->out(false);
    $eventdata->contexturlname = $urlname;

    try {
        $messageid = message_send($eventdata);
        local_prequran_notify_audit($sessionid, $recipientid, 'notification_sent', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'messageid' => $messageid,
        ]);
        return true;
    } catch (Throwable $e) {
        local_prequran_notify_audit($sessionid, $recipientid, 'notification_failed', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'error' => $e->getMessage(),
        ]);
        return false;
    }
}

function local_prequran_notify_parent_live_update(
    int $sessionid,
    int $studentid,
    string $subject,
    string $message,
    moodle_url $url,
    string $urlname,
    string $eventtype
): int {
    global $USER;

    $sent = 0;
    $parents = local_prequran_notify_parent_ids_for_student($studentid);
    $student = core_user::get_user($studentid);
    $studentname = $student ? fullname($student) : 'Student ' . $studentid;

    foreach ($parents as $parentid) {
        $parent = core_user::get_user($parentid);
        if (!$parent || !empty($parent->deleted) || !empty($parent->suspended)) {
            local_prequran_notify_audit($sessionid, $parentid, 'notification_skipped', [
                'eventtype' => $eventtype,
                'studentid' => $studentid,
                'reason' => 'parent unavailable',
            ]);
            continue;
        }

        if (local_prequran_notify_user_live_update($sessionid, $parentid, $subject, $message, $url, $urlname, $eventtype, $studentid)) {
            $sent++;
        }
    }

    if (!$parents) {
        local_prequran_notify_audit($sessionid, 0, 'notification_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'no linked parents',
        ]);
    }

    return $sent;
}

function local_prequran_notify_clean_phone(string $phone): string {
    $phone = trim($phone);
    if ($phone === '') {
        return '';
    }

    $leadingplus = substr($phone, 0, 1) === '+';
    $digits = preg_replace('/\D+/', '', $phone);
    if ($digits === '') {
        return '';
    }
    return $leadingplus ? '+' . $digits : $digits;
}

function local_prequran_notify_user_whatsapp_phone($user): string {
    if (!$user) {
        return '';
    }

    foreach (['phone1', 'phone2'] as $field) {
        if (!empty($user->{$field})) {
            $phone = local_prequran_notify_clean_phone((string)$user->{$field});
            if ($phone !== '') {
                return $phone;
            }
        }
    }

    try {
        $profile = profile_user_record((int)$user->id, false);
        foreach (['whatsapp', 'whatsapp_phone', 'parent_phone', 'phone', 'mobile'] as $field) {
            if (!empty($profile->{$field})) {
                $phone = local_prequran_notify_clean_phone((string)$profile->{$field});
                if ($phone !== '') {
                    return $phone;
                }
            }
        }
    } catch (Throwable $e) {
        return '';
    }

    return '';
}

function local_prequran_notify_whatsapp_enabled(): bool {
    if ((int)get_config('local_prequran', 'whatsapp_alerts_enabled') !== 1) {
        return false;
    }

    if (local_prequran_notify_whatsapp_provider() === 'webhook') {
        return trim((string)get_config('local_prequran', 'whatsapp_webhook_url')) !== '';
    }

    return local_prequran_notify_meta_cloud_ready();
}

function local_prequran_notify_whatsapp_provider(): string {
    $provider = trim((string)get_config('local_prequran', 'whatsapp_delivery_provider'));
    return $provider === 'webhook' ? 'webhook' : 'meta_cloud';
}

function local_prequran_notify_meta_cloud_ready(): bool {
    return trim((string)get_config('local_prequran', 'whatsapp_meta_phone_number_id')) !== ''
        && trim((string)get_config('local_prequran', 'whatsapp_meta_access_token')) !== ''
        && trim((string)get_config('local_prequran', 'whatsapp_meta_template_name')) !== '';
}

function local_prequran_notify_meta_graph_version(): string {
    $version = trim((string)get_config('local_prequran', 'whatsapp_meta_graph_version'));
    if (!preg_match('/^v\d+\.\d+$/', $version)) {
        return 'v20.0';
    }
    return $version;
}

function local_prequran_notify_meta_to_number(string $phone): string {
    return preg_replace('/\D+/', '', $phone);
}

function local_prequran_notify_meta_send_whatsapp(
    int $sessionid,
    int $recipientid,
    int $studentid,
    string $phone,
    string $subject,
    string $message,
    moodle_url $url,
    string $eventtype
): bool {
    $recipient = core_user::get_user($recipientid);
    $student = $studentid > 0 ? core_user::get_user($studentid) : null;
    $studentname = $student ? fullname($student) : ($studentid > 0 ? 'Student ' . $studentid : '');
    $recipientname = $recipient ? fullname($recipient) : 'Parent';
    $to = local_prequran_notify_meta_to_number($phone);

    if ($to === '') {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_skipped', [
            'provider' => 'meta_cloud',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'invalid WhatsApp phone',
        ]);
        return false;
    }

    if (!local_prequran_notify_meta_cloud_ready()) {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_skipped', [
            'provider' => 'meta_cloud',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'Meta Cloud API credentials or template missing',
        ]);
        return false;
    }

    $phoneid = trim((string)get_config('local_prequran', 'whatsapp_meta_phone_number_id'));
    $token = trim((string)get_config('local_prequran', 'whatsapp_meta_access_token'));
    $template = trim((string)get_config('local_prequran', 'whatsapp_meta_template_name'));
    $language = trim((string)get_config('local_prequran', 'whatsapp_meta_template_language'));
    if ($language === '') {
        $language = 'en_US';
    }

    $payload = [
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $to,
        'type' => 'template',
        'template' => [
            'name' => $template,
            'language' => ['code' => $language],
            'components' => [
                [
                    'type' => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => core_text::substr($recipientname, 0, 120)],
                        ['type' => 'text', 'text' => core_text::substr($studentname, 0, 120)],
                        ['type' => 'text', 'text' => core_text::substr($message, 0, 900)],
                        ['type' => 'text', 'text' => core_text::substr($url->out(false), 0, 900)],
                    ],
                ],
            ],
        ],
    ];

    $endpoint = 'https://graph.facebook.com/' . local_prequran_notify_meta_graph_version()
        . '/' . rawurlencode($phoneid) . '/messages';
    $curl = new curl();
    $curl->setopt([
        'CURLOPT_CONNECTTIMEOUT' => 5,
        'CURLOPT_TIMEOUT' => 15,
        'CURLOPT_FOLLOWLOCATION' => false,
    ]);
    $curl->setHeader('Content-Type: application/json');
    $curl->setHeader('Authorization: Bearer ' . $token);

    try {
        $response = $curl->post($endpoint, json_encode($payload));
        $info = $curl->get_info();
        $status = isset($info['http_code']) ? (int)$info['http_code'] : 0;
        $decoded = json_decode((string)$response, true);
        $messageid = '';
        if (is_array($decoded) && !empty($decoded['messages'][0]['id'])) {
            $messageid = (string)$decoded['messages'][0]['id'];
        }

        if ($status >= 200 && $status < 300) {
            local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_sent', [
                'provider' => 'meta_cloud',
                'eventtype' => $eventtype,
                'studentid' => $studentid,
                'status' => $status,
                'wamid' => $messageid,
                'template' => $template,
            ]);
            return true;
        }

        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_failed', [
            'provider' => 'meta_cloud',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'status' => $status,
            'template' => $template,
            'response' => core_text::substr((string)$response, 0, 500),
        ]);
        return false;
    } catch (Throwable $e) {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_failed', [
            'provider' => 'meta_cloud',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'template' => $template,
            'error' => $e->getMessage(),
        ]);
        return false;
    }
}

function local_prequran_notify_webhook_send_whatsapp(
    int $sessionid,
    int $recipientid,
    int $studentid,
    string $phone,
    string $subject,
    string $message,
    moodle_url $url,
    string $eventtype
): bool {
    $student = $studentid > 0 ? core_user::get_user($studentid) : null;
    $studentname = $student ? fullname($student) : ($studentid > 0 ? 'Student ' . $studentid : '');
    $payload = [
        'channel' => 'whatsapp',
        'to' => $phone,
        'recipient_userid' => $recipientid,
        'studentid' => $studentid,
        'student_name' => $studentname,
        'subject' => $subject,
        'message' => $message,
        'url' => $url->out(false),
        'eventtype' => $eventtype,
        'source' => 'local_prequran',
    ];

    $from = trim((string)get_config('local_prequran', 'whatsapp_from'));
    if ($from !== '') {
        $payload['from'] = $from;
    }

    $curl = new curl();
    $curl->setopt([
        'CURLOPT_CONNECTTIMEOUT' => 5,
        'CURLOPT_TIMEOUT' => 15,
        'CURLOPT_FOLLOWLOCATION' => false,
    ]);
    $curl->setHeader('Content-Type: application/json');
    $token = trim((string)get_config('local_prequran', 'whatsapp_webhook_token'));
    if ($token !== '') {
        $curl->setHeader('Authorization: Bearer ' . $token);
    }

    try {
        $response = $curl->post((string)get_config('local_prequran', 'whatsapp_webhook_url'), json_encode($payload));
        $info = $curl->get_info();
        $status = isset($info['http_code']) ? (int)$info['http_code'] : 0;
        if ($status >= 200 && $status < 300) {
            local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_sent', [
                'provider' => 'webhook',
                'eventtype' => $eventtype,
                'studentid' => $studentid,
                'status' => $status,
            ]);
            return true;
        }

        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_failed', [
            'provider' => 'webhook',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'status' => $status,
            'response' => core_text::substr((string)$response, 0, 500),
        ]);
        return false;
    } catch (Throwable $e) {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_failed', [
            'provider' => 'webhook',
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'error' => $e->getMessage(),
        ]);
        return false;
    }
}

function local_prequran_notify_send_whatsapp(
    int $sessionid,
    int $recipientid,
    int $studentid,
    string $subject,
    string $message,
    moodle_url $url,
    string $eventtype = 'urgent_parent_alert'
): bool {
    $recipient = core_user::get_user($recipientid);
    if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'recipient unavailable',
        ]);
        return false;
    }

    if (!local_prequran_notify_whatsapp_enabled()) {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'provider' => local_prequran_notify_whatsapp_provider(),
            'reason' => 'WhatsApp alerts disabled or provider configuration missing',
        ]);
        return false;
    }

    $brand = local_prequran_notify_brand_context($sessionid);
    $subject = local_prequran_notify_brand_subject($subject, $brand);
    $message = local_prequran_notify_brand_message($message, $brand);

    $phone = local_prequran_notify_user_whatsapp_phone($recipient);
    if ($phone === '') {
        local_prequran_notify_audit($sessionid, $recipientid, 'whatsapp_alert_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'no WhatsApp phone',
        ]);
        return false;
    }

    if (local_prequran_notify_whatsapp_provider() === 'webhook') {
        return local_prequran_notify_webhook_send_whatsapp(
            $sessionid, $recipientid, $studentid, $phone, $subject, $message, $url, $eventtype
        );
    }

    return local_prequran_notify_meta_send_whatsapp(
        $sessionid, $recipientid, $studentid, $phone, $subject, $message, $url, $eventtype
    );
}

function local_prequran_notify_parent_urgent_whatsapp_alert(
    int $sessionid,
    int $studentid,
    string $subject,
    string $message,
    moodle_url $url,
    string $eventtype = 'urgent_parent_alert'
): int {
    $sent = 0;
    $parents = local_prequran_notify_parent_ids_for_student($studentid);

    foreach ($parents as $parentid) {
        if (local_prequran_notify_send_whatsapp($sessionid, (int)$parentid, $studentid, $subject, $message, $url, $eventtype)) {
            $sent++;
        }
    }

    if (!$parents) {
        local_prequran_notify_audit($sessionid, 0, 'whatsapp_alert_skipped', [
            'eventtype' => $eventtype,
            'studentid' => $studentid,
            'reason' => 'no linked parents',
        ]);
    }

    return $sent;
}
