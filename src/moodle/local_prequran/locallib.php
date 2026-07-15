<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/filelib.php');

/**
 * Normalize a hosted BBB URL so API calls are always sent to /bigbluebutton/api/.
 */
function local_prequran_bbb_api_base_url(): string {
    $baseurl = trim((string)get_config('local_prequran', 'bbb_base_url'));
    if ($baseurl === '') {
        throw new moodle_exception('bbb_config_missing', 'local_prequran');
    }

    $baseurl = rtrim($baseurl, '/') . '/';
    if (preg_match('#/api/$#', $baseurl)) {
        return $baseurl;
    }
    if (preg_match('#/bigbluebutton/$#', $baseurl)) {
        return $baseurl . 'api/';
    }
    if (preg_match('#/bigbluebutton/[^/]+/$#', $baseurl)) {
        return $baseurl . 'api/';
    }

    return $baseurl . 'bigbluebutton/api/';
}

/**
 * Build a signed BigBlueButton API URL.
 *
 * BBB checksums are sha1(callname + querystring + sharedsecret).
 */
function local_prequran_bbb_build_url(string $callname, array $params = []): string {
    $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    if ($secret === '') {
        throw new moodle_exception('bbb_config_missing', 'local_prequran');
    }

    $callname = clean_param($callname, PARAM_ALPHANUMEXT);
    if ($callname === '') {
        throw new invalid_parameter_exception('BBB call name is required.');
    }

    $cleanparams = [];
    foreach ($params as $key => $value) {
        if ($value === null) {
            continue;
        }
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }
        $cleanparams[(string)$key] = (string)$value;
    }

    ksort($cleanparams);
    $query = http_build_query($cleanparams, '', '&', PHP_QUERY_RFC3986);
    $checksum = sha1($callname . $query . $secret);
    $separator = $query === '' ? '' : '?';

    return local_prequran_bbb_api_base_url() . rawurlencode($callname) . $separator . $query . ($query === '' ? '?' : '&') . 'checksum=' . $checksum;
}

/**
 * Call BBB and return the parsed XML response.
 */
function local_prequran_bbb_call(string $callname, array $params = [], bool $expectsuccess = true): SimpleXMLElement {
    $curl = new curl();
    $curl->setopt([
        'CURLOPT_CONNECTTIMEOUT' => 10,
        'CURLOPT_TIMEOUT' => 30,
        'CURLOPT_FOLLOWLOCATION' => true,
        'CURLOPT_MAXREDIRS' => 3,
        'CURLOPT_HTTP_VERSION' => defined('CURL_HTTP_VERSION_1_1') ? CURL_HTTP_VERSION_1_1 : 2,
    ]);

    $response = $curl->get(local_prequran_bbb_build_url($callname, $params));
    if ($response === false || $response === '') {
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'empty response');
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response);
    if (!$xml) {
        libxml_clear_errors();
        $preview = trim(preg_replace('/\s+/', ' ', strip_tags((string)$response)));
        if (core_text::strlen($preview) > 240) {
            $preview = core_text::substr($preview, 0, 240) . '...';
        }
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'invalid XML response: ' . ($preview !== '' ? $preview : 'non-XML response'));
    }

    $returncode = strtoupper((string)($xml->returncode ?? ''));
    if ($expectsuccess && $returncode !== 'SUCCESS') {
        $message = (string)($xml->message ?? $xml->messageKey ?? 'unknown error');
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', $message);
    }

    return $xml;
}

/**
 * POST XML payload to a BBB API endpoint and return the parsed response.
 */
function local_prequran_bbb_post_xml_call(string $callname, array $params, string $xmlpayload, bool $expectsuccess = true): SimpleXMLElement {
    $curl = new curl();
    $curl->setopt([
        'CURLOPT_CONNECTTIMEOUT' => 10,
        'CURLOPT_TIMEOUT' => 60,
        'CURLOPT_FOLLOWLOCATION' => true,
        'CURLOPT_MAXREDIRS' => 3,
        'CURLOPT_HTTPHEADER' => ['Content-Type: application/xml'],
        'CURLOPT_HTTP_VERSION' => defined('CURL_HTTP_VERSION_1_1') ? CURL_HTTP_VERSION_1_1 : 2,
    ]);

    $response = $curl->post(local_prequran_bbb_build_url($callname, $params), $xmlpayload);
    if ($response === false || $response === '') {
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'empty response');
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response);
    if (!$xml) {
        libxml_clear_errors();
        $preview = trim(preg_replace('/\s+/', ' ', strip_tags((string)$response)));
        if (core_text::strlen($preview) > 240) {
            $preview = core_text::substr($preview, 0, 240) . '...';
        }
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', 'invalid XML response: ' . ($preview !== '' ? $preview : 'non-XML response'));
    }

    $returncode = strtoupper((string)($xml->returncode ?? ''));
    if ($expectsuccess && $returncode !== 'SUCCESS') {
        $message = (string)($xml->message ?? $xml->messageKey ?? 'unknown error');
        throw new moodle_exception('bbb_api_error', 'local_prequran', '', $message);
    }

    return $xml;
}

function local_prequran_bbb_meeting_defaults(array $meeting): array {
    foreach (['meetingID', 'name', 'attendeePW', 'moderatorPW'] as $required) {
        if (empty($meeting[$required])) {
            throw new invalid_parameter_exception($required . ' is required.');
        }
    }

    $defaults = [
        'record' => false,
        'autoStartRecording' => false,
        'allowStartStopRecording' => false,
        'muteOnStart' => true,
        'maxParticipants' => (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12,
        'duration' => 90,
    ];

    return array_merge($defaults, $meeting);
}

/**
 * Create a BBB meeting for an EduPlatform live session.
 */
function local_prequran_bbb_create_meeting(array $meeting): SimpleXMLElement {
    return local_prequran_bbb_call('create', local_prequran_bbb_meeting_defaults($meeting));
}

function local_prequran_bbb_xml_attribute(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
}

function local_prequran_bbb_presentation_payload_from_bytes(
    string $documentbytes,
    string $filename,
    bool $current = true,
    bool $downloadable = false,
    bool $removable = true,
    array $options = []
): string {
    if ($documentbytes === '' || $filename === '') {
        throw new invalid_parameter_exception('Document bytes and filename are required.');
    }
    $document = [
        'current' => $current ? 'true' : 'false',
        'downloadable' => $downloadable ? 'true' : 'false',
        'removable' => $removable ? 'true' : 'false',
        'name' => $filename,
        'filename' => $filename,
    ];
    foreach ($options as $key => $value) {
        if (preg_match('/^[A-Za-z][A-Za-z0-9_-]*$/', (string)$key)) {
            $document[(string)$key] = (string)$value;
        }
    }
    $attributes = [];
    foreach ($document as $key => $value) {
        $attributes[] = $key . '="' . local_prequran_bbb_xml_attribute($value) . '"';
    }

    return '<modules><module name="presentation"><document ' . implode(' ', $attributes) . '>'
        . base64_encode($documentbytes)
        . '</document></module></modules>';
}

/**
 * Create a BBB meeting and preload a presentation into the whiteboard.
 */
function local_prequran_bbb_create_meeting_with_presentation(
    array $meeting,
    string $documentbytes,
    string $filename,
    bool $current = true,
    bool $downloadable = false,
    bool $removable = true
): SimpleXMLElement {
    $payload = local_prequran_bbb_presentation_payload_from_bytes(
        $documentbytes,
        $filename,
        $current,
        $downloadable,
        $removable
    );
    return local_prequran_bbb_post_xml_call('create', local_prequran_bbb_meeting_defaults($meeting), $payload);
}

/**
 * Insert a presentation into an already-running BBB meeting.
 */
function local_prequran_bbb_insert_document(
    string $meetingid,
    string $documenturl,
    string $filename,
    bool $current = true,
    bool $downloadable = false,
    bool $removable = true,
    array $options = []
): SimpleXMLElement {
    if ($meetingid === '' || $documenturl === '' || $filename === '') {
        throw new invalid_parameter_exception('meetingID, document URL, and filename are required.');
    }

    $document = [
        'current' => $current ? 'true' : 'false',
        'downloadable' => $downloadable ? 'true' : 'false',
        'removable' => $removable ? 'true' : 'false',
        'url' => $documenturl,
        'filename' => $filename,
    ];
    foreach ($options as $key => $value) {
        if (preg_match('/^[A-Za-z][A-Za-z0-9_-]*$/', (string)$key)) {
            $document[(string)$key] = (string)$value;
        }
    }
    $attributes = [];
    foreach ($document as $key => $value) {
        $attributes[] = $key . '="' . local_prequran_bbb_xml_attribute($value) . '"';
    }
    $payload = '<modules><module name="presentation"><document ' . implode(' ', $attributes) . '/></module></modules>';

    return local_prequran_bbb_post_xml_call('insertDocument', ['meetingID' => $meetingid], $payload);
}

/**
 * Insert a presentation by embedding document bytes in the BBB API request.
 *
 * This avoids making the BBB server fetch the document from the public CDN during
 * a live class, which can leave the HTML5 client in recovery if the fetch or
 * conversion path stumbles.
 */
function local_prequran_bbb_insert_document_bytes(
    string $meetingid,
    string $documentbytes,
    string $filename,
    bool $current = true,
    bool $downloadable = false,
    bool $removable = true,
    array $options = []
): SimpleXMLElement {
    if ($meetingid === '' || $documentbytes === '' || $filename === '') {
        throw new invalid_parameter_exception('meetingID, document bytes, and filename are required.');
    }

    $payload = local_prequran_bbb_presentation_payload_from_bytes($documentbytes, $filename, $current, $downloadable, $removable, $options);

    return local_prequran_bbb_post_xml_call('insertDocument', ['meetingID' => $meetingid], $payload);
}

/**
 * Return active student IDs for a live session.
 */
function local_prequran_live_session_student_ids(int $sessionid): array {
    global $DB;

    if ($sessionid <= 0 || !$DB->get_manager()->table_exists('local_prequran_live_participant')) {
        return [];
    }

    $rows = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'role' => 'student',
        'status' => 'active',
    ]);
    $studentids = [];
    foreach ($rows as $row) {
        $studentid = (int)($row->studentid ?: $row->userid);
        if ($studentid > 0) {
            $studentids[$studentid] = $studentid;
        }
    }

    return array_values($studentids);
}

/**
 * Check whether a student has recording consent from any known source.
 */
function local_prequran_live_student_has_recording_consent(int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }

    if ($DB->get_manager()->table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', [
            'studentid' => $studentid,
            'consent_type' => 'recording',
            'granted' => 1,
        ])) {
        return true;
    }

    if ($DB->get_manager()->table_exists('local_prequran_student_profile')
        && $DB->record_exists('local_prequran_student_profile', [
            'userid' => $studentid,
            'recording_consent' => 1,
            'status' => 'active',
        ])) {
        return true;
    }

    return false;
}

/**
 * Decide whether a live session may be recorded under the child-safety consent policy.
 */
function local_prequran_live_recording_consent_decision($session): array {
    $requested = !empty($session->recording_enabled);
    if (!$requested) {
        return [
            'requested' => false,
            'allowed' => false,
            'missing_studentids' => [],
            'studentids' => [],
            'reason' => 'recording_not_requested',
        ];
    }

    if (empty($session->recording_consent_required)) {
        return [
            'requested' => true,
            'allowed' => true,
            'missing_studentids' => [],
            'studentids' => local_prequran_live_session_student_ids((int)$session->id),
            'reason' => 'consent_not_required',
        ];
    }

    $studentids = local_prequran_live_session_student_ids((int)$session->id);
    $missing = [];
    foreach ($studentids as $studentid) {
        if (!local_prequran_live_student_has_recording_consent((int)$studentid)) {
            $missing[] = (int)$studentid;
        }
    }

    return [
        'requested' => true,
        'allowed' => empty($missing),
        'missing_studentids' => $missing,
        'studentids' => $studentids,
        'reason' => empty($missing) ? 'recording_consent_granted' : 'missing_recording_consent',
    ];
}

/**
 * Build a signed BBB join URL for a moderator, student, or approved observer.
 */
function local_prequran_bbb_join_url(
    string $meetingid,
    string $fullname,
    string $password,
    int $userid,
    array $extra = []
): string {
    if ($meetingid === '' || $fullname === '' || $password === '' || $userid <= 0) {
        throw new invalid_parameter_exception('meetingID, fullName, password, and userID are required.');
    }

    $params = array_merge([
        'meetingID' => $meetingid,
        'fullName' => $fullname,
        'password' => $password,
        'userID' => $userid,
        'redirect' => true,
    ], $extra);

    return local_prequran_bbb_build_url('join', $params);
}

/**
 * Fetch BBB recordings, optionally limited by meeting ID or record ID.
 */
function local_prequran_bbb_get_recordings(string $meetingid = '', string $recordid = ''): SimpleXMLElement {
    $params = [];
    if ($meetingid !== '') {
        $params['meetingID'] = $meetingid;
    }
    if ($recordid !== '') {
        $params['recordID'] = $recordid;
    }

    return local_prequran_bbb_call('getRecordings', $params);
}

function local_prequran_support_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function local_prequran_support_default_categories(): array {
    return [
        'technical_access',
        'lesson_help',
        'recording_review',
        'schedule_attendance',
        'teacher_feedback',
        'parent_follow_up',
        'payment_billing',
        'safeguarding_concern',
        'account_profile',
        'bug_report',
        'other',
    ];
}

function local_prequran_support_default_routing(): array {
    return [
        'technical_access' => 'help_desk',
        'lesson_help' => 'teacher_support',
        'recording_review' => 'teacher_support',
        'schedule_attendance' => 'teacher_support',
        'teacher_feedback' => 'teacher_support',
        'parent_follow_up' => 'teacher_support',
        'payment_billing' => 'finance_admin',
        'safeguarding_concern' => 'safeguarding_restricted',
        'account_profile' => 'help_desk',
        'bug_report' => 'help_desk',
        'other' => 'help_desk',
    ];
}

function local_prequran_support_config_bool(string $name, bool $default): bool {
    $value = get_config('local_prequran', $name);
    if ($value === false) {
        return $default;
    }
    if ($default === true && (string)$value === '0') {
        return true;
    }
    return (int)$value === 1;
}

function local_prequran_support_default_policy(): array {
    return [
        'livechat_enabled' => local_prequran_support_config_bool('support_livechat_enabled', true),
        'async_enabled' => local_prequran_support_config_bool('support_async_enabled', true),
        'student_helpdesk_enabled' => local_prequran_support_config_bool('support_student_helpdesk_enabled', true),
        'student_teacher_enabled' => local_prequran_support_config_bool('support_student_teacher_enabled', true),
        'parent_teacher_enabled' => local_prequran_support_config_bool('support_parent_teacher_enabled', true),
        'student_free_text_policy' => clean_param((string)get_config('local_prequran', 'support_student_free_text_policy'), PARAM_ALPHANUMEXT) ?: 'topic_only',
        'parent_visible_default' => (int)get_config('local_prequran', 'support_parent_visible_default') !== 0,
        'business_timezone' => clean_param((string)get_config('local_prequran', 'support_business_timezone'), PARAM_TEXT) ?: 'UTC',
        'retention_days' => max(0, (int)get_config('local_prequran', 'support_retention_days')),
        'categories' => local_prequran_support_default_categories(),
        'routing' => local_prequran_support_default_routing(),
        'restricted_categories' => ['safeguarding_concern'],
        'student_hidden_categories' => ['payment_billing'],
    ];
}

function local_prequran_support_json_decode(string $json, array $fallback = []): array {
    if (trim($json) === '') {
        return $fallback;
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function local_prequran_support_effective_policy(int $workspaceid = 0, int $consumerid = 0): array {
    global $DB;

    $policy = local_prequran_support_default_policy();
    $policy['workspaceid'] = $workspaceid;
    $policy['consumerid'] = $consumerid;
    $policy['source'] = 'defaults';

    if (!local_prequran_support_table_exists('local_prequran_support_policy')) {
        return $policy;
    }

    $record = null;
    if ($consumerid > 0) {
        $record = $DB->get_record('local_prequran_support_policy', ['consumerid' => $consumerid, 'workspaceid' => 0, 'status' => 'active'], '*', IGNORE_MULTIPLE);
    }
    if (!$record && $workspaceid > 0) {
        $record = $DB->get_record('local_prequran_support_policy', ['workspaceid' => $workspaceid, 'status' => 'active'], '*', IGNORE_MULTIPLE);
    }
    if (!$record) {
        return $policy;
    }

    $policy['source'] = 'support_policy';
    $policy['policyid'] = (int)$record->id;
    foreach ([
        'livechat_enabled',
        'async_enabled',
        'student_helpdesk_enabled',
        'student_teacher_enabled',
        'parent_teacher_enabled',
        'parent_visible_default',
    ] as $flag) {
        if (!empty($record->{$flag})) {
            $policy[$flag] = true;
        }
    }
    $policy['student_free_text_policy'] = (string)$record->student_free_text_policy ?: $policy['student_free_text_policy'];
    $policy['business_timezone'] = (string)$record->business_timezone ?: $policy['business_timezone'];
    $policy['business_hours'] = local_prequran_support_json_decode((string)$record->businesshoursjson);
    $policy['categories'] = local_prequran_support_json_decode((string)$record->categoriesjson, $policy['categories']);
    $policy['routing'] = local_prequran_support_json_decode((string)$record->routingjson, $policy['routing']);
    $extra = local_prequran_support_json_decode((string)$record->policyjson);
    foreach ($extra as $key => $value) {
        if (is_string($key)) {
            $policy[$key] = $value;
        }
    }

    return $policy;
}

function local_prequran_support_is_guardian_for_student(int $guardianid, int $studentid): bool {
    global $DB;
    if ($guardianid <= 0 || $studentid <= 0 || $guardianid === $studentid) {
        return false;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (local_prequran_support_table_exists($table)
            && $DB->record_exists($table, ['guardianid' => $guardianid, 'studentid' => $studentid])) {
            return true;
        }
    }
    return false;
}

function local_prequran_support_teacher_has_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($teacherid <= 0 || $studentid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (local_prequran_support_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active'])) {
        return true;
    }
    if (local_prequran_support_table_exists('local_prequran_group_member')
        && local_prequran_support_table_exists('local_prequran_class_group')
        && $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE gm.studentid = :studentid
                AND gm.assignment_status = :assignmentstatus
                AND cg.teacherid = :teacherid
                AND cg.status <> :archived",
            [
                'studentid' => $studentid,
                'assignmentstatus' => 'active',
                'teacherid' => $teacherid,
                'archived' => 'archived',
            ]
        )) {
        return true;
    }
    if (local_prequran_support_table_exists('local_prequran_live_session')
        && local_prequran_support_table_exists('local_prequran_live_participant')
        && $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} sp ON sp.sessionid = s.id
              WHERE sp.studentid = :studentid
                AND sp.role = :studentrole
                AND sp.status = :studentstatus
                AND s.status <> :cancelled
                AND (
                    s.teacherid = :teacherid
                    OR EXISTS (
                        SELECT 1
                          FROM {local_prequran_live_participant} tp
                         WHERE tp.sessionid = s.id
                           AND tp.userid = :teacherid2
                           AND tp.role = :teacherrole
                           AND tp.status = :teacherstatus
                    )
                )",
            [
                'studentid' => $studentid,
                'studentrole' => 'student',
                'studentstatus' => 'active',
                'cancelled' => 'cancelled',
                'teacherid' => $teacherid,
                'teacherid2' => $teacherid,
                'teacherrole' => 'teacher',
                'teacherstatus' => 'active',
            ]
        )) {
        return true;
    }
    return false;
}

function local_prequran_support_user_can_access_student(int $userid, int $studentid): bool {
    if ($userid <= 0 || $studentid <= 0) {
        return false;
    }
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    if (local_prequran_support_is_guardian_for_student($userid, $studentid)) {
        return true;
    }
    return local_prequran_support_teacher_has_student($userid, $studentid);
}

function local_prequran_support_user_can_read_conversation($thread, int $userid): bool {
    global $DB;
    if (!$thread || $userid <= 0) {
        return false;
    }
    if (is_siteadmin($userid)) {
        return true;
    }
    if (!empty($thread->studentid) && !local_prequran_support_user_can_access_student($userid, (int)$thread->studentid)) {
        return false;
    }
    if (!local_prequran_support_table_exists('local_prequran_comm_participant')) {
        return false;
    }
    return $DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
    ]);
}

function local_prequran_support_user_can_reply_conversation($thread, int $userid): bool {
    global $DB;
    if (!$thread || $userid <= 0 || !local_prequran_support_user_can_read_conversation($thread, $userid)) {
        return false;
    }
    if (is_siteadmin($userid)) {
        return true;
    }
    if (!local_prequran_support_table_exists('local_prequran_comm_participant')) {
        return false;
    }
    return $DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
        'canreply' => 1,
    ]);
}

function local_prequran_support_visibility_allowed(string $visibility, int $userid, int $studentid = 0): bool {
    $visibility = clean_param($visibility, PARAM_ALPHANUMEXT);
    if ($visibility === '' || $visibility === 'public') {
        return true;
    }
    if (is_siteadmin($userid)) {
        return true;
    }
    $context = context_system::instance();
    if ($visibility === 'restricted') {
        return has_capability('local/prequran:supportviewrestricted', $context, $userid);
    }
    if ($visibility === 'staff_only') {
        return has_capability('local/prequran:supportinternalnote', $context, $userid)
            || has_capability('local/prequran:supportviewqueue', $context, $userid);
    }
    if ($visibility === 'parent_visible') {
        return $studentid > 0 && local_prequran_support_is_guardian_for_student($userid, $studentid);
    }
    if ($visibility === 'student_visible') {
        return $studentid > 0 && $userid === $studentid;
    }
    return false;
}

function local_prequran_support_audit(
    int $workspaceid,
    string $action,
    string $targettype = '',
    int $targetid = 0,
    array $details = [],
    int $ticketid = 0,
    int $conversationid = 0,
    int $messageid = 0
): void {
    global $DB, $USER;
    if (!local_prequran_support_table_exists('local_prequran_support_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_support_audit', (object)[
        'workspaceid' => $workspaceid,
        'ticketid' => $ticketid,
        'conversationid' => $conversationid,
        'messageid' => $messageid,
        'actorid' => (int)($USER->id ?? 0),
        'action' => clean_param($action, PARAM_ALPHANUMEXT),
        'targettype' => clean_param($targettype, PARAM_ALPHANUMEXT),
        'targetid' => $targetid,
        'detailsjson' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}
